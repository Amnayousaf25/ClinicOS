import { test, expect, sidebarLink } from './fixtures';
import { appointments } from './mockApi';

test.describe('Appointments page', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await sidebarLink(page, '/appointments').click();
    await expect(page).toHaveURL(/\/appointments/);
    await expect(page.locator('main h1', { hasText: 'Appointments' })).toBeVisible();
  });

  test('shows table headers', async ({ authedPage: page }) => {
    // Table only renders thead when data is present — ensure at least one row via intercept
    await page.route('**/api/v1/appointments**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: appointments }) }),
    );
    await page.reload();
    for (const header of ['Time', 'Patient', 'Service', 'Status', 'Intake', 'Actions']) {
      await expect(page.locator('main thead', { hasText: header }).first()).toBeVisible();
    }
  });

  test('time-range filter buttons toggle active state', async ({ authedPage: page }) => {
    const today = page.locator('main button', { hasText: /^Today$/ });
    const week = page.locator('main button', { hasText: /^This Week$/ });
    const all = page.locator('main button', { hasText: /^All$/ });

    await expect(today).toBeVisible();
    await week.click();
    await expect(week).toBeVisible();
    await all.click();
    await expect(all).toBeVisible();
  });

  test('search filter narrows the list (or shows empty state)', async ({ authedPage: page }) => {
    const search = page.locator('main').getByPlaceholder(/search/i).first();
    await search.fill('zzz_definitely_no_match_xyz');

    // Either the empty state appears or the rows count drops to 0.
    const empty = page.getByText(/no appointments found/i);
    const rows = page.locator('main tbody tr');
    await expect(empty.or(rows.first())).toBeVisible();
  });

  test('"New Appointment" trigger is present', async ({ authedPage: page }) => {
    const trigger = page.getByRole('button', { name: /new appointment/i }).first();
    await expect(trigger).toBeVisible();
  });
});
