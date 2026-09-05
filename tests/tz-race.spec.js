const { test, expect } = require('@playwright/test');

// Regression test for a reported bug: adding "Karachi, Pakistan" to the
// Atlas correctly showed UTC+05:00, but selecting it in the New Chart
// dialog set the offset to UTC+05:30 instead.
//
// Root cause: openNewDialog() restores the *previously used* atlas
// selection and fires an async /api/v1/tz-offset lookup for it. If the
// user immediately picks a different location before that first lookup
// resolves, a second lookup starts. newUpdateTz() had no guard against a
// stale response -- whichever HTTP response arrived *last* won, even if
// it belonged to the older, superseded selection. This test pins Delhi's
// (Asia/Kolkata, +05:30) response to resolve after Karachi's (Asia/Karachi,
// +05:00) to reproduce that ordering, and asserts the final value is
// Karachi's.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.route('**/static/Open.md**', route =>
    route.fulfill({ body: '# Jyotish Query\n\nWelcome.' })
  );
});

test('New Chart dialog does not let a stale atlas-switch tz lookup clobber the current selection', async ({ page }) => {
  const atlas = {
    'Delhi, India':      { lat: '28.6139', lon: '77.2090', tz: 5.5, tzName: 'Asia/Kolkata' },
    'Karachi, Pakistan': { lat: '24.8546', lon: '67.0207', tz: 5,   tzName: 'Asia/Karachi' },
  };
  await page.addInitScript((atlasData) => {
    localStorage.setItem('jyotish_atlas', JSON.stringify(atlasData));
    // Pre-seed the New Chart dialog's remembered form state so opening it
    // restores "Delhi, India" and fires that lookup first, as in the bug report.
    localStorage.setItem('jyotish_new_form', JSON.stringify({ atlasName: 'Delhi, India' }));
  }, atlas);

  await page.route('**/api/v1/tz-offset**', async (route) => {
    const url = new URL(route.request().url());
    const tz = url.searchParams.get('iana_tz');
    if (tz === 'Asia/Kolkata') await new Promise(r => setTimeout(r, 400)); // superseded (older) lookup, arrives late
    else await new Promise(r => setTimeout(r, 50));                        // current (newer) lookup, arrives first
    await route.fulfill({
      json: tz === 'Asia/Kolkata' ? { offset: 5.5, dst: false } : { offset: 5, dst: false },
    });
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => window.openNewDialog());
  // Immediately switch to Karachi, before Delhi's delayed lookup resolves.
  await page.selectOption('#nAtlas', 'Karachi, Pakistan');

  // Wait past both lookups' delays, then confirm Karachi's value stuck.
  await page.waitForTimeout(600);
  await expect(page.locator('#nTz')).toHaveValue('5');
});
