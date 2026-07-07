import { test, expect } from './fixtures';
import { mockAuthedApi } from './mockApi';

const openInvite = async (page: import('@playwright/test').Page) => {
  await mockAuthedApi(page);
  await page.goto('/staff');
  await page.getByRole('button', { name: /invite staff/i }).click();
  await expect(page.getByRole('dialog', { name: /invite staff member/i })).toBeVisible();
};

test.describe('Staff form regressions', () => {
  test('opens invite staff form', async ({ page }) => {
    await openInvite(page);
    await expect(page.getByLabel('Full Name')).toBeVisible();
  });

  test('requires name, email, and employee ID', async ({ page }) => {
    await openInvite(page);
    await page.getByRole('button', { name: /send invitation/i }).click();
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/employee id is required/i)).toBeVisible();
  });

  test('rejects invalid staff email', async ({ page }) => {
    await openInvite(page);
    await page.getByLabel('Full Name').fill('Staff One');
    await page.getByLabel('Email').fill('bad-email');
    await page.getByLabel('Employee ID').fill('EMP-100');
    await page.getByRole('button', { name: /send invitation/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('role selector can switch to admin', async ({ page }) => {
    await openInvite(page);
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /^admin$/i }).click();
    await expect(page.getByRole('combobox')).toContainText('Admin');
  });

  test('avatar upload accepts image files', async ({ page }) => {
    await openInvite(page);
    await page.setInputFiles('input[type="file"]', {
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from('avatar'),
    });
    await expect(page.getByAltText('Profile preview')).toBeVisible();
  });

  test('submits invite payload with staff role by default', async ({ page }) => {
    await openInvite(page);
    await page.getByLabel('Full Name').fill('Invited User');
    await page.getByLabel('Email').fill('invite@example.com');
    await page.getByLabel('Employee ID').fill('EMP-777');
    const request = page.waitForRequest(
      (req) => req.url().endsWith('/api/v1/users/invite') && req.method() === 'POST',
    );
    await page.getByRole('button', { name: /send invitation/i }).click();
    const payload = (await request).postDataJSON();
    expect(payload).toMatchObject({
      name: 'Invited User',
      email: 'invite@example.com',
      employeeId: 'EMP-777',
      role: 'staff',
    });
  });

  test('cancel closes invite dialog and clears errors', async ({ page }) => {
    await openInvite(page);
    await page.getByRole('button', { name: /send invitation/i }).click();
    await page.getByRole('button', { name: /^cancel$/i }).click();
    await page.getByRole('button', { name: /invite staff/i }).click();
    await expect(page.getByText(/name is required/i)).toBeHidden();
  });

  test('search filters staff table rows', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/staff');
    await page.getByPlaceholder(/search by name/i).fill('Staff User');
    await expect(page.getByText('Staff User')).toBeVisible();
    await expect(page.getByText('Admin', { exact: true })).toBeHidden();
  });

  test('edit staff form pre-fills selected member', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/staff');
    await page.locator('tbody tr').nth(1).getByRole('button').click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    await expect(page.getByRole('dialog', { name: /edit staff member/i })).toBeVisible();
    await expect(page.getByLabel('Full Name')).toHaveValue('Staff User');
  });

  test('remove self action stays disabled', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/staff');
    await page.locator('tbody tr').first().getByRole('button').click();
    await expect(page.getByRole('menuitem', { name: /remove/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
