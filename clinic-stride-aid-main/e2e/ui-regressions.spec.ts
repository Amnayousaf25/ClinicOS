import { test, expect } from './fixtures';

async function mockAuthedSettings(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('clinicos_token', 'e2e-token');
  });

  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          user: {
            _id: 'u1',
            name: 'Admin',
            email: 'admin@example.com',
            role: 'admin',
            orgId: 'org1',
          },
        },
      }),
    }),
  );

  await page.route('**/api/v1/clinic-settings', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          clinicName: 'Clinic',
          workingHours: { start: '08:00', end: '17:00' },
          workingDays: [1, 2, 3, 4, 5],
          slotDuration: 30,
          timeFormat: '24',
          blockedSlots: [],
          smsTemplates: {
            confirmation: '',
            reminder24h: '',
            reminder2h: '',
          },
          enabledReminders: {
            confirmation: true,
            reminder24h: true,
            reminder2h: true,
          },
        },
      }),
    }),
  );

  await page.route('**/api/v1/services', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    }),
  );
  await page.route('**/api/v1/providers', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    }),
  );
  await page.route('**/api/v1/insurance-providers', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    }),
  );
}

test.describe('Mocked UI regressions', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthedSettings(page);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('slot duration clamps negative values in the browser', async ({ page }) => {
    const slotDuration = page.locator('input[type="number"]').first();

    await slotDuration.fill('-5');

    await expect(slotDuration).toHaveValue('5');
  });

  test('service duration and price clamp negative values in the browser', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /^services$/i }).click();
    await page.getByRole('button', { name: /add service/i }).click();

    const dialog = page.getByRole('dialog', { name: /add service/i });
    const numbers = dialog.locator('input[type="number"]');
    await numbers.nth(0).fill('-4');
    await numbers.nth(1).fill('-10');

    await expect(numbers.nth(0)).toHaveValue('1');
    await expect(numbers.nth(1)).toHaveValue('0');
  });

  test('block slot date picker has month and year dropdowns', async ({ page }) => {
    await page.getByRole('button', { name: /blocked slots/i }).click();
    await page.getByRole('button', { name: /select date/i }).click();

    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.locator('select').nth(1)).toBeVisible();
  });

  test('block slot and insurance add buttons use primary styling', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /blocked slots/i }).click();
    const blockClass =
      (await page.getByRole('button', { name: /^block slot$/i }).getAttribute(
        'class',
      )) || '';
    expect(blockClass).toContain('bg-primary');
    expect(blockClass).toContain('hover:bg-primary/90');

    await page.getByRole('button', { name: /insurance/i }).click();
    const addClass =
      (await page.getByRole('button', { name: /^add$/i }).getAttribute(
        'class',
      )) || '';
    expect(addClass).toContain('bg-primary');
    expect(addClass).toContain('hover:bg-primary/90');
  });
});
