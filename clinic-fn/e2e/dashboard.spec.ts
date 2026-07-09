import { test, expect, sidebarLink } from './fixtures';

test.describe('Dashboard', () => {
  test('shows stat cards after login', async ({ authedPage: page }) => {
    await expect(page.getByText('Confirmed').first()).toBeVisible();
    await expect(page.getByText('Pending').first()).toBeVisible();
    await expect(page.getByText("Today's Schedule").first()).toBeVisible();
  });

  test('range toggle switches between Today and This Week', async ({ authedPage: page }) => {
    const today = page.getByRole('button', { name: /^Today$/ });
    const week = page.getByRole('button', { name: /^This Week$/ });
    await expect(today).toBeVisible();
    await expect(week).toBeVisible();

    await week.click();
    await expect(page.getByText("This Week's Schedule").first()).toBeVisible();

    await today.click();
    await expect(page.getByText("Today's Schedule").first()).toBeVisible();
  });

  test('search input is reachable on dashboard', async ({ authedPage: page }) => {
    const search = page.getByPlaceholder(/search/i).first();
    await expect(search).toBeVisible();
    await search.fill('zzznoresult');
    // Either an empty state or a filtered list — both are acceptable; just no crash.
    await expect(page).toHaveURL(/\/$/);
  });

  test('sidebar navigates to Appointments and Settings', async ({ authedPage: page }) => {
    await sidebarLink(page, '/appointments').click();
    await expect(page).toHaveURL(/\/appointments/);
    await expect(page.locator('main h1', { hasText: 'Appointments' })).toBeVisible();

    await sidebarLink(page, '/settings').click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
