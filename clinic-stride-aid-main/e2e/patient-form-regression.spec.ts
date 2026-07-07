import { test, expect } from './fixtures';
import { mockAuthedApi } from './mockApi';

const openPatientForm = async (page: import('@playwright/test').Page) => {
  await mockAuthedApi(page);
  await page.goto('/patients');
  await page.getByRole('button', { name: /new patient/i }).click();
  await expect(page.getByRole('dialog', { name: /add new patient/i })).toBeVisible();
};

test.describe('Patient form regressions', () => {
  test('opens from the patients page', async ({ page }) => {
    await openPatientForm(page);
    await expect(page.getByRole('dialog')).toContainText('Full Name');
  });

  test('shows validation for blank submit', async ({ page }) => {
    await openPatientForm(page);
    await page.getByRole('button', { name: /add patient/i }).click();
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test('requires a valid email format', async ({ page }) => {
    await openPatientForm(page);
    await page.locator('input[name="patientEmail"]').fill('bad-email');
    await page.getByRole('button', { name: /add patient/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('DOB picker trigger stays visible and full width', async ({ page }) => {
    await openPatientForm(page);
    const trigger = page.getByRole('button', { name: /select date of birth/i });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveClass(/w-full/);
  });

  test('address and emergency fields remain editable', async ({ page }) => {
    await openPatientForm(page);
    await page.locator('input[name="address"]').fill('2 Main St');
    await page.locator('input[name="emergencyContact"]').fill('Sam');
    await expect(page.locator('input[name="address"]')).toHaveValue('2 Main St');
    await expect(page.locator('input[name="emergencyContact"]')).toHaveValue('Sam');
  });

  test('medical notes textarea remains editable', async ({ page }) => {
    await openPatientForm(page);
    await page.getByPlaceholder(/allergies/i).fill('Peanut allergy');
    await expect(page.getByPlaceholder(/allergies/i)).toHaveValue('Peanut allergy');
  });

  test('cancel closes the add patient dialog', async ({ page }) => {
    await openPatientForm(page);
    await page.getByRole('button', { name: /^cancel$/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('edit form submits trimmed patient payload', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/patients');
    await page.getByRole('button', { name: /jane patient/i }).click();
    await page.getByRole('button', { name: /edit/i }).click();
    await page.locator('input[name="patientName"]').fill('  Alex Patient  ');
    await page.locator('input[name="patientPhone"]').fill('+61422222222');
    await page.locator('input[name="patientEmail"]').fill('alex@example.com');
    const request = page.waitForRequest(
      (req) => req.url().includes('/api/v1/patients/pat-1') && req.method() === 'PATCH',
    );
    await page.getByRole('button', { name: /save changes/i }).click();
    const payload = (await request).postDataJSON();
    expect(payload).toMatchObject({
      name: 'Alex Patient',
      phone: '+61422222222',
      email: 'alex@example.com',
    });
  });

  test('patient card opens detail popup with a responsive close button', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/patients');
    await page.getByRole('button', { name: /jane patient/i }).click();
    const close = page.getByRole('button', { name: /^close$/i });
    await expect(close).toHaveClass(/absolute/);
    await expect(close).toHaveClass(/right-4/);
  });

  test('edit action opens a prefilled patient form', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/patients');
    await page.getByRole('button', { name: /jane patient/i }).click();
    await page.getByRole('button', { name: /edit/i }).click();
    await expect(page.getByRole('dialog', { name: /edit patient/i })).toBeVisible();
    await expect(page.locator('input[name="patientName"]')).toHaveValue('Jane Patient');
  });
});
