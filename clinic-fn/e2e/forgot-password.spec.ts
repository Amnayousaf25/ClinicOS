/**
 * Forgot-password OTP flow.
 *
 * The dialog runs as a 4-state wizard (email → otp → reset → done) without
 * leaving /login. We can't intercept the real email so we stub the BE
 * endpoints with `page.route` and assert the dialog navigates step-by-step
 * based on the responses.
 */
import { test, expect } from './fixtures';

test.describe('Forgot password (OTP)', () => {
  test('opens the dialog from the login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /forgot password/i }).click();
    await expect(
      page.getByRole('dialog', { name: /reset password/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/enter your email and we'll send you a 6-digit code/i),
    ).toBeVisible();
  });

  test('happy path: email → otp → reset → done', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, message: 'OTP sent' }),
      }),
    );
    await page.route('**/api/v1/auth/verify-forgot-password-otp', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { token: 'fake.reset.token', message: 'OTP verified' },
        }),
      }),
    );
    await page.route('**/api/v1/auth/verify-reset-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, message: 'Password reset' }),
      }),
    );

    await page.goto('/login');
    await page.getByRole('button', { name: /forgot password/i }).click();

    // Step 1 — email
    await page.getByLabel(/email address/i).last().fill('user@example.com');
    await page.getByRole('button', { name: /send otp/i }).click();

    // Step 2 — otp
    await expect(page.getByLabel(/verification code/i)).toBeVisible();
    await page.getByLabel(/verification code/i).fill('123456');
    await page.getByRole('button', { name: /verify code/i }).click();

    // Step 3 — reset
    await expect(page.getByLabel(/^new password$/i)).toBeVisible();
    await page.getByLabel(/^new password$/i).fill('NewPass1234!');
    await page.getByLabel(/confirm password/i).fill('NewPass1234!');
    await page.getByRole('button', { name: /^reset password$/i }).click();

    // Step 4 — done
    await expect(page.getByText(/password updated/i)).toBeVisible();
    await page.getByRole('button', { name: /back to login/i }).click();
  });

  test('shows wizard step 2 controls (resend + wrong-email)', async ({
    page,
  }) => {
    await page.route('**/api/v1/auth/forgot-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, message: 'OTP sent' }),
      }),
    );

    await page.goto('/login');
    await page.getByRole('button', { name: /forgot password/i }).click();
    await page.getByLabel(/email address/i).last().fill('user@example.com');
    await page.getByRole('button', { name: /send otp/i }).click();
    await expect(page.getByRole('button', { name: /resend code/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /wrong email/i })).toBeVisible();
  });

  test('mismatched passwords are rejected client-side', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, message: 'OTP sent' }),
      }),
    );
    await page.route('**/api/v1/auth/verify-forgot-password-otp', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { token: 'fake.reset.token', message: 'OTP verified' },
        }),
      }),
    );

    await page.goto('/login');
    await page.getByRole('button', { name: /forgot password/i }).click();
    await page.getByLabel(/email address/i).last().fill('user@example.com');
    await page.getByRole('button', { name: /send otp/i }).click();
    await page.getByLabel(/verification code/i).fill('123456');
    await page.getByRole('button', { name: /verify code/i }).click();

    await page.getByLabel(/^new password$/i).fill('Password123!');
    await page.getByLabel(/confirm password/i).fill('Mismatch!');
    await page.getByRole('button', { name: /^reset password$/i }).click();

    // Sonner toast surfaces the mismatch; assert the user is still on step 3.
    await expect(page.getByLabel(/^new password$/i)).toBeVisible();
  });
});
