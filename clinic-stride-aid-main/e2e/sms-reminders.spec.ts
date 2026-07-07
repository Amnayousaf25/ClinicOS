import { test, expect } from '@playwright/test';
import { mockAuthedApi, reminderConfigs } from './mockApi';

test.beforeEach(async ({ page }) => {
  await mockAuthedApi(page);
  await page.goto('/sms-reminders');
});

test.describe('SMS Reminders page', () => {
  test('shows stat cards from log data', async ({ page }) => {
    await expect(page.getByText('1').first()).toBeVisible(); // 1 sent
    // stats cards: Sent / Scheduled / Replies each render a count
    const cards = page.locator('.grid .bg-card');
    await expect(cards).toHaveCount(3);
  });

  test('renders all reminder config templates', async ({ page }) => {
    for (const cfg of reminderConfigs) {
      await expect(page.getByText(cfg.label).first()).toBeVisible();
    }
  });

  test('disabled config has textarea disabled', async ({ page }) => {
    // rc-3 (2h Reminder) starts disabled — find its textarea via the config card
    const configCards = page.locator('div.space-y-2.p-4.rounded-xl');
    const twoHCard = configCards.filter({ hasText: '2h Reminder' });
    await expect(twoHCard.locator('textarea')).toBeDisabled();
  });

  test('toggling a switch fires PATCH and shows toast', async ({ page }) => {
    const patchReq = page.waitForRequest(
      (req) => req.url().includes('/reminders/configs/rc-1') && req.method() === 'PATCH',
    );
    // toggle Confirmation off
    const confirmRow = page.locator('div').filter({ hasText: /^Confirmation/ }).first();
    await confirmRow.locator('button[role="switch"]').click();
    await patchReq;
    await expect(page.getByText('Reminder config updated')).toBeVisible();
  });

  test('log filter buttons filter entries', async ({ page }) => {
    // default "all" shows both entries
    await expect(page.getByText('Jane Patient')).toBeVisible();
    await expect(page.getByText('Pending Patient')).toBeVisible();

    // filter to "sent" — only Jane
    await page.getByRole('button', { name: 'sent' }).click();
    await expect(page.getByText('Jane Patient')).toBeVisible();
    await expect(page.getByText('Pending Patient')).not.toBeVisible();

    // filter to "scheduled" — only Pending
    await page.getByRole('button', { name: 'scheduled' }).click();
    await expect(page.getByText('Pending Patient')).toBeVisible();
    await expect(page.getByText('Jane Patient')).not.toBeVisible();
  });

  test('log entry shows type badge and reply', async ({ page }) => {
    await expect(page.getByText('Confirmation').first()).toBeVisible();
    await expect(page.getByText('↩ YES')).toBeVisible();
    await expect(page.getByText('24h Reminder').first()).toBeVisible();
  });

  test('empty log state shows placeholder text', async ({ page }) => {
    // override log to empty
    await page.route('**/api/v1/reminders/log**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { data: [], total: 0 } }),
      }),
    );
    await page.reload();
    await expect(page.getByText(/no messages yet/i)).toBeVisible();
  });
});
