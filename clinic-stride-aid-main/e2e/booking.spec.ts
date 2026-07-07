import { test, expect } from './fixtures';

test.describe('Public booking flow (/book)', () => {
  test('loads without auth and shows step 1', async ({ page }) => {
    await page.goto('/book');
    await expect(page.getByText('Select a Service')).toBeVisible();
  });

  test('progresses from service → time when a service is picked', async ({ page }) => {
    await page.goto('/book');
    await expect(page.getByText('Select a Service')).toBeVisible();

    // Pick the first service tile, if any are loaded by the API.
    const firstService = page.locator('button:has(p.font-semibold)').first();
    const serviceCount = await firstService.count();
    test.skip(serviceCount === 0, 'No public services available from API — skipping flow test');

    await firstService.click();
    await expect(page.getByText('Choose Date & Time')).toBeVisible();
  });

  test('Continue is disabled until both date and time are picked', async ({ page }) => {
    await page.goto('/book');
    const firstService = page.locator('button:has(p.font-semibold)').first();
    test.skip((await firstService.count()) === 0, 'No public services');

    await firstService.click();
    const continueBtn = page.getByRole('button', { name: /^continue$/i });
    await expect(continueBtn).toBeDisabled();
  });

  test('Back button on step 2 returns to service selection', async ({ page }) => {
    await page.goto('/book');
    const firstService = page.locator('button:has(p.font-semibold)').first();
    test.skip((await firstService.count()) === 0, 'No public services');

    await firstService.click();
    await expect(page.getByText('Choose Date & Time')).toBeVisible();
    await page.getByRole('button', { name: /^back$/i }).click();
    await expect(page.getByText('Select a Service')).toBeVisible();
  });

  test('progress bar reflects current step', async ({ page }) => {
    await page.goto('/book');
    // Three pill segments rendered as flex-1 divs.
    const segments = page.locator('div.h-1\\.5.flex-1');
    await expect(segments).toHaveCount(3);
  });
});
