import { test, expect } from './fixtures';
import { mockAuthedApi } from './mockApi';

test.describe('Settings form regressions', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('clinic slot duration keeps a positive minimum', async ({ page }) => {
    const input = page.locator('input[type="number"]').first();
    await expect(input).toHaveAttribute('min', '5');
  });

  test('clinic slot duration clamps negative input', async ({ page }) => {
    const input = page.locator('input[type="number"]').first();
    await input.fill('-9');
    await expect(input).toHaveValue('5');
  });

  test('clinic settings submit sends clamped slot duration', async ({ page }) => {
    let payload: Record<string, unknown> | undefined;
    await page.route('**/api/v1/clinic-settings', async (route) => {
      if (route.request().method() !== 'PATCH') return route.fallback();
      payload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: payload }),
      });
    });
    await page.locator('input[type="number"]').first().fill('-5');
    await page.getByRole('button', { name: /save/i }).click();
    expect(payload?.slotDuration).toBe(5);
  });

  test('add service shows validation on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /^services$/i }).click();
    await page.getByRole('button', { name: /add service/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByRole('dialog').getByText(/name is required/i)).toBeVisible();
  });

  test('service duration and price expose browser minimums', async ({ page }) => {
    await page.getByRole('button', { name: /^services$/i }).click();
    await page.getByRole('button', { name: /add service/i }).click();
    const numbers = page.getByRole('dialog').locator('input[type="number"]');
    await expect(numbers.nth(0)).toHaveAttribute('min', '1');
    await expect(numbers.nth(1)).toHaveAttribute('min', '0');
  });

  test('service duration and price clamp negative values', async ({ page }) => {
    await page.getByRole('button', { name: /^services$/i }).click();
    await page.getByRole('button', { name: /add service/i }).click();
    const numbers = page.getByRole('dialog').locator('input[type="number"]');
    await numbers.nth(0).fill('-4');
    await numbers.nth(1).fill('-10');
    await expect(numbers.nth(0)).toHaveValue('1');
    await expect(numbers.nth(1)).toHaveValue('0');
  });

  test('service form posts entered values', async ({ page }) => {
    await page.getByRole('button', { name: /^services$/i }).click();
    await page.getByRole('button', { name: /add service/i }).click();
    await page.getByRole('dialog').locator('input').nth(0).fill('Therapy');
    await page.getByRole('dialog').locator('input[type="number"]').nth(0).fill('45');
    await page.getByRole('dialog').locator('input[type="number"]').nth(1).fill('120');
    const request = page.waitForRequest(
      (req) => req.url().endsWith('/api/v1/services') && req.method() === 'POST',
    );
    await page.getByRole('dialog').getByRole('button', { name: /^add$/i }).click();
    const payload = (await request).postDataJSON();
    expect(payload).toMatchObject({ name: 'Therapy', duration: 45, price: 120 });
  });

  test('provider form shows validation on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /^providers$/i }).click();
    await page.getByRole('button', { name: /add provider/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByRole('dialog').getByText(/name is required/i)).toBeVisible();
  });

  test('block slot date picker exposes month and year dropdowns', async ({ page }) => {
    await page.getByRole('button', { name: /blocked slots/i }).click();
    await page.getByRole('button', { name: /select date/i }).click();
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.locator('select').nth(1)).toBeVisible();
  });

  test('insurance add button has primary styling', async ({ page }) => {
    await page.getByRole('button', { name: /insurance/i }).click();
    const add = page.getByRole('button', { name: /^add$/i });
    await expect(add).toBeVisible();
    await expect(add).toHaveClass(/bg-primary/);
    await expect(add).toHaveClass(/hover:bg-primary\/90/);
  });
});
