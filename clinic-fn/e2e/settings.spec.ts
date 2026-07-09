import { test, expect, sidebarLink } from './fixtures';

test.describe('Settings page', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await sidebarLink(page, '/settings').click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test('renders clinic configuration', async ({ authedPage: page }) => {
    await expect(page.getByText(/clinic name/i).first()).toBeVisible();
  });

  test('clinic name input is editable', async ({ authedPage: page }) => {
    const clinicName = page.getByLabel(/clinic name/i).first();
    await expect(clinicName).toBeVisible();

    const original = await clinicName.inputValue();
    await clinicName.fill(`${original} (e2e-edit)`);
    await expect(clinicName).toHaveValue(`${original} (e2e-edit)`);
    // Restore so the test stays idempotent.
    await clinicName.fill(original);
  });

  test('working hours inputs are visible', async ({ authedPage: page }) => {
    // Working hours are time-style inputs with start/end labels nearby.
    const main = page.locator('main');
    await expect(main.getByText(/opening time/i).first()).toBeVisible();
  });
});
