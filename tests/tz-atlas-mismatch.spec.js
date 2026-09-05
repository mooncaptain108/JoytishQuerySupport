const { test, expect } = require('@playwright/test');

// Regression test for a re-report of the "Karachi shows +05:30" bug.
//
// The earlier fix (tz-race.spec.js) covered a stale *HTTP response* winning.
// This one covers a stale *atlas record*: the hidden #aTzName field is not
// cleared between Atlas saves, so a Pakistan city added right after an Indian
// one could be stored as { tz: 5, tzName: 'Asia/Kolkata' } -- visibly +05:00
// in the Atlas list, but newUpdateTz() trusts tzName and the /api/v1/tz-offset
// lookup for Asia/Kolkata returns +05:30.
//
// Fixes under test:
//  - newUpdateTz()/transitUpdateTz() call tzNameMatchesStored() and fall back
//    to the record's stored offset when the zone is inconsistent with it.
//  - atlasSave() strips an inconsistent tzName before persisting.
//  - #aName oninput clears the hidden #aTzName so a manual rename can't keep
//    a previous location's zone.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.route('**/static/Open.md**', route =>
    route.fulfill({ body: '# Jyotish Query\n\nWelcome.' })
  );
  // Real server behaviour: Asia/Kolkata is +05:30, Asia/Karachi is +05:00.
  await page.route('**/api/v1/tz-offset**', async (route) => {
    const tz = new URL(route.request().url()).searchParams.get('iana_tz');
    const offset = tz === 'Asia/Karachi' ? 5 : tz === 'Asia/Kolkata' ? 5.5 : 0;
    await route.fulfill({ json: { offset, dst: false } });
  });
});

test('New Chart uses the stored +05:00 offset when the atlas record carries a mismatched zone', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('jyotish_atlas', JSON.stringify({
      // Dirty record: offset is right, zone is wrong (left over from an Indian city).
      'Karachi, Pakistan': { lat: '24.8546', lon: '67.0207', tz: 5, tzName: 'Asia/Kolkata' },
    }));
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => window.openNewDialog());
  await page.selectOption('#nAtlas', 'Karachi, Pakistan');
  await page.fill('#nDate', '1985-06-10');
  await page.evaluate(() => window.newUpdateTz());
  await page.waitForTimeout(300);

  await expect(page.locator('#nTz')).toHaveValue('5');
});

test('New Chart still takes the DST-aware server value when the zone IS consistent', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('jyotish_atlas', JSON.stringify({
      'Karachi, Pakistan': { lat: '24.8546', lon: '67.0207', tz: 5, tzName: 'Asia/Karachi' },
    }));
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => window.openNewDialog());
  await page.selectOption('#nAtlas', 'Karachi, Pakistan');
  await page.fill('#nDate', '1985-06-10');
  await page.evaluate(() => window.newUpdateTz());
  await page.waitForTimeout(300);

  await expect(page.locator('#nTz')).toHaveValue('5');
});

test('atlasSave() strips an IANA zone that disagrees with the chosen offset', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const stored = await page.evaluate(() => {
    window.openAtlasNewDialog();
    document.getElementById('aName').value = 'Karachi, Pakistan';
    document.getElementById('aLat').value  = '24.8546';
    document.getElementById('aLon').value  = '67.0207';
    document.getElementById('aTz').value   = '5';
    // Simulate the stale hidden field carried over from a prior Indian city.
    document.getElementById('aTzName').value = 'Asia/Kolkata';
    window.atlasSave();
    return JSON.parse(localStorage.getItem('jyotish_atlas'))['Karachi, Pakistan'];
  });

  expect(stored.tz).toBe(5);
  expect(stored.tzName).toBeUndefined();
});

test('editing the location name clears the carried-over hidden zone', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const tzNameAfterTyping = await page.evaluate(async () => {
    window.openAtlasNewDialog();
    document.getElementById('aTzName').value = 'Asia/Kolkata';
    const el = document.getElementById('aName');
    el.value = 'Karachi, Pakistan';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return document.getElementById('aTzName').value;
  });

  expect(tzNameAfterTyping).toBe('');
});
