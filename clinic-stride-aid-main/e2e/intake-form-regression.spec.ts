import { test, expect } from './fixtures';
import { mockAuthedApi } from './mockApi';
import dayjs from 'dayjs';

const todayDay = () => new RegExp(`^${dayjs().date()}$`);

const openPublicIntake = async (page: import('@playwright/test').Page) => {
  await mockAuthedApi(page);
  await page.goto('/intake-form?apt=apt-1');
  await expect(page.getByRole('heading', { name: /patient intake form/i })).toBeVisible();
};

test.describe('Intake form regressions', () => {
  test('loads appointment summary from appointment id', async ({ page }) => {
    await openPublicIntake(page);
    await expect(page.getByText(/linked: jane patient/i)).toBeVisible();
  });

  test('prefills patient identity from appointment lookup', async ({ page }) => {
    await openPublicIntake(page);
    await expect(page.locator('input[name="name"]')).toHaveValue('Jane Patient');
    await expect(page.locator('input[name="phone"]')).toHaveValue('+61400000000');
    await expect(page.locator('input[name="email"]')).toHaveValue('jane@example.com');
  });

  test('appointment id is required before loading', async ({ page }) => {
    await openPublicIntake(page);
    await page.locator('input[name="appointmentIdInput"]').fill('');
    await page.getByRole('button', { name: /^load$/i }).click();
    await expect(page.getByText(/appointment id is required/i)).toBeVisible();
  });

  test('DOB picker has month and year dropdowns', async ({ page }) => {
    await openPublicIntake(page);
    await page.getByRole('button', { name: /select date of birth/i }).click();
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.locator('select').nth(1)).toBeVisible();
  });

  test('validates email format', async ({ page }) => {
    await openPublicIntake(page);
    await page.locator('input[name="email"]').fill('bad-email');
    await page.getByRole('button', { name: /submit form/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('renders insurance providers from backend', async ({ page }) => {
    await openPublicIntake(page);
    await page.getByRole('combobox').click();
    await expect(page.getByRole('option', { name: 'Aetna' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Blue Cross' })).toBeVisible();
  });

  test('consent box toggles the hidden checkbox', async ({ page }) => {
    await openPublicIntake(page);
    const consent = page.locator('input[type="checkbox"]');
    await expect(consent).not.toBeChecked();
    await page.getByText(/i consent/i).click();
    await expect(consent).toBeChecked();
  });

  test('reason for visit remains browser-required', async ({ page }) => {
    await openPublicIntake(page);
    await expect(page.locator('textarea[name="reasonForVisit"]')).toHaveAttribute(
      'required',
      '',
    );
  });

  test('submits appointment id and form values', async ({ page }) => {
    await openPublicIntake(page);
    await page.getByRole('button', { name: /select date of birth/i }).click();
    await page.getByRole('gridcell', { name: todayDay() }).first().click();
    await page.locator('textarea[name="reasonForVisit"]').fill('Annual checkup');
    await page.getByText(/i consent/i).click();
    const request = page.waitForRequest(
      (req) => req.url().endsWith('/api/v1/intake') && req.method() === 'POST',
    );
    await page.getByRole('button', { name: /submit form/i }).click();
    const payload = (await request).postDataJSON();
    expect(payload).toMatchObject({
      appointmentId: 'apt-1',
      name: 'Jane Patient',
      reasonForVisit: 'Annual checkup',
      consent: true,
    });
  });

  test('successful submission shows confirmation screen', async ({ page }) => {
    await openPublicIntake(page);
    await page.getByRole('button', { name: /select date of birth/i }).click();
    await page.getByRole('gridcell', { name: todayDay() }).first().click();
    await page.locator('textarea[name="reasonForVisit"]').fill('Annual checkup');
    await page.getByText(/i consent/i).click();
    await page.getByRole('button', { name: /submit form/i }).click();
    await expect(page.getByRole('heading', { name: /form submitted/i })).toBeVisible();
  });
});
