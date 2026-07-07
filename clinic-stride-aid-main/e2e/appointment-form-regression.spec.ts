import { test, expect } from './fixtures';
import { mockAuthedApi } from './mockApi';

const openDialog = async (page: import('@playwright/test').Page) => {
  await mockAuthedApi(page);
  await page.goto('/appointments');
  await page.getByRole('button', { name: /new appointment/i }).click();
  await expect(page.getByRole('dialog', { name: /new appointment/i })).toBeVisible();
};

test.describe('Appointment form regressions', () => {
  test('opens from the appointments page', async ({ page }) => {
    await openDialog(page);
    await expect(page.getByRole('dialog')).toContainText('Patient Name');
  });

  test('shows validation for required patient name', async ({ page }) => {
    await openDialog(page);
    await page.getByRole('button', { name: /create appointment/i }).click();
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test('DOB picker has month and year dropdowns', async ({ page }) => {
    await openDialog(page);
    await page.getByRole('button', { name: /select date of birth/i }).click();
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.locator('select').nth(1)).toBeVisible();
  });

  test('service dropdown renders backend services', async ({ page }) => {
    await openDialog(page);
    await page.getByRole('combobox').nth(0).click();
    await expect(page.getByRole('option', { name: /consultation/i })).toBeVisible();
  });

  test('provider dropdown renders unassigned and backend providers', async ({ page }) => {
    await openDialog(page);
    await page.getByRole('combobox').nth(1).click();
    await expect(page.getByRole('option', { name: /unassigned/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /dr smith/i })).toBeVisible();
  });

  test('time dropdown marks booked slots', async ({ page }) => {
    await openDialog(page);
    await page.getByRole('combobox').nth(2).click();
    await expect(page.getByRole('option', { name: /09:00.*booked/i })).toBeVisible();
  });

  test('notes textarea is visible and editable', async ({ page }) => {
    await openDialog(page);
    await page.getByPlaceholder('Optional notes...').fill('Needs quiet room');
    await expect(page.getByPlaceholder('Optional notes...')).toHaveValue('Needs quiet room');
  });

  test('cancel closes the dialog without navigation', async ({ page }) => {
    await openDialog(page);
    await page.getByRole('button', { name: /^cancel$/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page).toHaveURL(/\/appointments$/);
  });

  test('patient search can prefill patient identity', async ({ page }) => {
    await openDialog(page);
    const search = page.getByPlaceholder(/search by name/i);
    await search.fill('Jane');
    await search.press('Enter');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /jane patient/i })
      .click();
    await expect(page.locator('input[name="patientName"]')).toHaveValue('Jane Patient');
    await expect(page.locator('input[name="patientPhone"]')).toHaveValue('+61400000000');
  });

  test('submits stripped phone and selected service', async ({ page }) => {
    await openDialog(page);
    await page.locator('input[name="patientName"]').fill('New Patient');
    await page.locator('input[name="patientPhone"]').fill('(614) 222-3333');
    await page.locator('input[name="patientEmail"]').fill('new@example.com');
    await page.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: /consultation/i }).click();
    await page.getByRole('combobox').nth(2).click();
    await page.getByRole('option', { name: /23:30/i }).click();
    const request = page.waitForRequest(
      (req) => req.url().includes('/api/v1/appointments') && req.method() === 'POST',
    );
    await page.getByRole('button', { name: /create appointment/i }).click();
    const payload = (await request).postDataJSON();
    expect(payload).toMatchObject({ patientPhone: '6142223333', serviceId: 'svc-1' });
  });
});
