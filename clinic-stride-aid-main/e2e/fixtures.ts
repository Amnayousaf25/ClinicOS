import { test as base, expect, type Page } from '@playwright/test';

export const TEST_USER = {
  email: process.env.E2E_EMAIL || 'tahir+a@geeksofkolachi.com',
  password: process.env.E2E_PASSWORD || 'Test1234$',
};

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
}

export async function logoutViaSidebar(page: Page) {
  await page
    .locator('aside button')
    .filter({ has: page.locator('svg.lucide-log-out') })
    .first()
    .click();
}

export async function clearAuth(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('clinicos_token');
    localStorage.removeItem('clinicos_refresh_token');
  });
}

// Sidebar links are icon-only NavLinks — target by href.
export function sidebarLink(page: Page, path: string) {
  return page.locator(`aside a[href="${path}"]`).first();
}

type Fixtures = {
  authedPage: Page;
};

export const test = base.extend<Fixtures>({
  authedPage: async ({ page }, use) => {
    await login(page);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect };
