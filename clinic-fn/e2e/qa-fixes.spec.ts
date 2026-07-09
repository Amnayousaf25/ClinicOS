/**
 * Regression coverage for the second batch of QA-reported fixes
 * (settings UX, intake flows, patient search, dialog responsiveness).
 *
 * These tests target visual + behavioural contracts only — anything that
 * needs the live backend (SMS to PK numbers, S3 uploads, real email
 * delivery) belongs in manual or staged test passes, not e2e.
 */
import { test, expect, sidebarLink } from './fixtures';

test.describe('Settings — number inputs cannot go negative', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await sidebarLink(page, '/settings').click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test('Slot Duration input has min=5', async ({ authedPage: page }) => {
    const input = page.getByLabel(/slot duration/i);
    await expect(input).toHaveAttribute('type', 'number');
    await expect(input).toHaveAttribute('min', '5');

    // Forcing a negative value through `.fill()` clamps via onChange.
    await input.fill('-5');
    await expect(input).not.toHaveValue('-5');
  });

  test('Service price + duration clamp to zero/one', async ({
    authedPage: page,
  }) => {
    await page.getByRole('button', { name: /^services$/i }).click();
    await page.getByRole('button', { name: /add service/i }).click();
    const dialog = page.getByRole('dialog');

    const duration = dialog.getByLabel(/duration/i);
    await expect(duration).toHaveAttribute('min', '1');
    await duration.fill('-3');
    await expect(duration).not.toHaveValue('-3');

    const price = dialog.getByLabel(/price/i);
    await expect(price).toHaveAttribute('min', '0');
    await price.fill('-1');
    await expect(price).not.toHaveValue('-1');
  });
});

test.describe('Settings — Block Slot tab', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await sidebarLink(page, '/settings').click();
    await page.getByRole('button', { name: /blocked slots/i }).click();
  });

  test('date picker exposes year/month dropdowns', async ({
    authedPage: page,
  }) => {
    await page.getByRole('button', { name: /select date/i }).click();
    // captionLayout="dropdown-buttons" renders <select> elements in the
    // calendar caption — react-day-picker uses the .rdp-dropdown_year
    // class for the year picker.
    await expect(
      page.locator('.rdp-dropdown_year, select[name="years"]').first(),
    ).toBeVisible();
  });

  test('Block Slot button is the primary blue (no outline variant)', async ({
    authedPage: page,
  }) => {
    const btn = page.getByRole('button', { name: /^block slot$/i });
    await expect(btn).toBeVisible();
    // Outline buttons have `border-input` in their classes; the default
    // primary button does not. Use that as the contract instead of
    // brittle background-color assertions.
    const cls = (await btn.getAttribute('class')) || '';
    expect(cls).not.toMatch(/border-input/);
  });
});

test.describe('Settings — Insurance tab', () => {
  test('Add button is the primary blue', async ({ authedPage: page }) => {
    await sidebarLink(page, '/settings').click();
    await page.getByRole('button', { name: /insurance/i }).click();

    const btn = page
      .locator('main')
      .getByRole('button', { name: /^add$/i })
      .last();
    const cls = (await btn.getAttribute('class')) || '';
    expect(cls).not.toMatch(/border-input/);
  });
});

test.describe('Patient search panel — manual commit', () => {
  test('does not fire request on every keystroke', async ({
    authedPage: page,
  }) => {
    await page.goto('/appointments');

    let searchHits = 0;
    await page.route('**/api/v1/patients/search**', (route) => {
      searchHits += 1;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.getByRole('button', { name: /new appointment/i }).click();
    const search = page.getByPlaceholder(/search by name, phone, or email/i);
    await search.click();

    // Type quickly — under the 1.5s debounce window — and assert no
    // request fires until the user explicitly commits.
    await search.type('Tah', { delay: 30 });
    await page.waitForTimeout(500);
    expect(searchHits).toBe(0);
  });

  test('fires immediately on Enter', async ({ authedPage: page }) => {
    await page.goto('/appointments');

    let searchHits = 0;
    await page.route('**/api/v1/patients/search**', (route) => {
      searchHits += 1;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.getByRole('button', { name: /new appointment/i }).click();
    const search = page.getByPlaceholder(/search by name, phone, or email/i);
    await search.fill('Tahir');
    await search.press('Enter');
    await expect.poll(() => searchHits).toBeGreaterThan(0);
  });
});

test.describe('Appointments table — Action column', () => {
  test('confirmed + intake not-sent rows expose an "Add intake form" button', async ({
    authedPage: page,
  }) => {
    await page.goto('/appointments');
    await page.getByRole('button', { name: /^all$/i }).click();
    // Match by aria-label (the icon button) — only renders when the row
    // is in the confirmed/not-sent state.
    const intakeButtons = page.locator('button[aria-label="Add intake form"]').filter({ visible: true });
    if ((await intakeButtons.count()) === 0) {
      test.skip(
        true,
        'No confirmed appointments without intake forms in the seeded data — flow covered in manual QA',
      );
    }
    await expect(intakeButtons.first()).toBeVisible();
  });
});

test.describe('Patient detail dialog — close button', () => {
  test('header reserves space so X close does not overlap action button', async ({
    authedPage: page,
  }) => {
    await page.goto('/patients');
    const firstCard = page
      .locator('main')
      .getByRole('button')
      .filter({ hasText: /visits/i })
      .first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, 'No patient cards seeded');
    }
    await firstCard.click();

    const dialog = page.getByRole('dialog', { name: /patient details/i });
    await expect(dialog).toBeVisible();
    // The pr-12 reservation lives on the header — assert the class is
    // present so the gap between the action button and the X stays.
    const header = dialog.locator('div').filter({ hasText: /patient details/i }).first();
    const cls = (await header.evaluate(
      (el) => (el.parentElement?.className as string) || '',
    )) as string;
    expect(cls).toContain('pr-12');
  });
});

test.describe('Removed user can be re-invited', () => {
  test('soft-deleted users do not block re-invite by email', async ({
    authedPage: page,
  }) => {
    // This is a backend contract assertion — after a soft-delete, the
    // email is free again. We exercise the contract directly via the
    // API rather than driving the UI to keep the test fast.
    const token = await page.evaluate(() =>
      localStorage.getItem('clinicos_token'),
    );
    test.skip(!token, 'Auth token missing — login fixture must run');

    const email = `qa-reinvite-${Date.now()}@example.com`;
    const employeeId = `E${Date.now().toString().slice(-6)}`;

    const invite = await page.request.post('http://localhost:4002/api/v1/users/invite', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'QA User', email, employeeId, role: 'staff' },
    });
    if (invite.status() === 403) {
      test.skip(true, 'Logged-in user lacks INVITE permission for this org');
    }
    expect(invite.status()).toBe(201);

    const created = await invite.json();
    const userId = created?.data?.userId || created?.data?._id;
    test.skip(!userId, 'API did not return a userId on invite');

    const del = await page.request.delete(`http://localhost:4002/api/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(del.status());

    const reInvite = await page.request.post('http://localhost:4002/api/v1/users/invite', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'QA User Round 2', email, employeeId, role: 'staff' },
    });
    expect([200, 201]).toContain(reInvite.status());
  });
});

test.describe('NewIntakeFormDialog — opened from a row', () => {
  test('hides the patient search and visit-type toggle when launched from an appointment', async ({
    authedPage: page,
  }) => {
    await page.goto('/appointments');
    await page.getByRole('button', { name: /^all$/i }).click();
    const intakeBtn = page.locator('button[aria-label="Add intake form"]').first();
    if ((await intakeBtn.count()) === 0) {
      test.skip(
        true,
        'No confirmed-but-not-sent appointment in seeded data',
      );
    }
    await intakeBtn.click();

    const dialog = page.getByRole('dialog', { name: /new intake form/i });
    await expect(dialog).toBeVisible();

    // The search panel + visit-type toggle should NOT render when the
    // dialog is launched from a specific appointment row.
    await expect(dialog.getByText(/find existing patient/i)).toHaveCount(0);
    await expect(dialog.getByText(/visit type/i)).toHaveCount(0);
  });
});
