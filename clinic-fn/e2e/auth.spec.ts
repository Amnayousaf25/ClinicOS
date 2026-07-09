import { test, expect, login, logoutViaSidebar, clearAuth, TEST_USER } from './fixtures';

test.describe('Authentication', () => {
  test('login redirects to dashboard with greeting', async ({ page }) => {
    await login(page);
    await expect(page.getByText(/good (morning|afternoon|evening)/i)).toBeVisible();
  });

  test('password eye toggle shows/hides password', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.getByLabel('Password');
    await passwordInput.fill('secret123');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    const wrapper = passwordInput.locator('..');
    await wrapper.getByRole('button').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await wrapper.getByRole('button').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('invalid credentials show error and stay on /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('wrong@test.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/invalid credentials/i).last()).toBeVisible();
    expect(page.url()).toContain('/login');
  });

  test('empty submission keeps user on /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    expect(page.url()).toContain('/login');
  });

  test('logout clears token and returns to landing page', async ({ page }) => {
    await login(page);
    await logoutViaSidebar(page);

    await page.waitForFunction(() => !localStorage.getItem('clinicos_token'), null, { timeout: 5_000 });
    expect(await page.evaluate(() => localStorage.getItem('clinicos_token'))).toBeNull();

    await page.reload();
    await expect(page.getByText(/good (morning|afternoon|evening)/i)).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Free', exact: true })).toBeVisible();
  });

  test('unauthenticated user cannot access dashboard', async ({ page }) => {
    await clearAuth(page);
    await page.reload();

    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
    await expect(page.getByText(/good (morning|afternoon|evening)/i)).not.toBeVisible();
  });

  test('test credentials are wired up', async () => {
    expect(TEST_USER.email).toMatch(/@/);
    expect(TEST_USER.password.length).toBeGreaterThan(0);
  });
});
