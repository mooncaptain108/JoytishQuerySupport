const { test, expect } = require('@playwright/test');

// Dasha Periods panel height tracks the Divisional chart's -- including when
// the Divisional panel is on Transit and that chart only appears after the
// transit fetch lands. Previously it was sized once, before that, got no
// height, and ran the full list (to the 2200s) until something re-rendered.

const ATLAS = { Seattle: { lat: '47.6062', lon: '-122.3321', tz: -8, tzName: 'America/Los_Angeles' } };
const CHART = { id: 'c1', name: 'Test Person', date: '1982-11-02', time: '06:21:00', lat: '47.6062', lon: '-122.3321', tz: -8, locationName: 'Seattle' };

test.beforeEach(async ({ page }) => {
  await page.route('**/static/Open.md**', route => route.fulfill({ body: '# Jyotish Query\n\nWelcome.' }));
  await page.addInitScript(({ atlas, chart }) => {
    localStorage.setItem('jyotish_hide_welcome', '1');
    localStorage.setItem('jyotish_atlas', JSON.stringify(atlas));
    localStorage.setItem('jyotish_charts', JSON.stringify([chart]));
  }, { atlas: ATLAS, chart: CHART });
  await page.goto('/');
});

async function heights(page) {
  return page.evaluate(() => ({
    dasha: document.getElementById('dashaPanel').getBoundingClientRect().height,
    d9: document.getElementById('d9Chart').getBoundingClientRect().height,
    d9Shown: document.getElementById('d9Area').style.display !== 'none',
  }));
}

test('divisional dropdown starts at D9 and is not browser-restored', async ({ page }) => {
  await expect(page.locator('#divChartSelect')).toHaveValue('D9');
  await expect(page.locator('#divChartSelect')).toHaveAttribute('autocomplete', 'off');
});

test('default load: Dasha panel matches the D9 chart height, no transit bar', async ({ page }) => {
  await page.evaluate(() => loadChart('c1'));
  await expect(page.locator('#dashaPanel')).toBeVisible();
  await expect.poll(async () => (await heights(page)).d9).toBeGreaterThan(100);
  const h = await heights(page);
  expect(Math.abs(h.dasha - h.d9)).toBeLessThanOrEqual(1);
  await expect(page.locator('#transitBar')).toBeHidden();
});

test('Divisional on Transit at load: Dasha height catches up once the transit chart appears', async ({ page }) => {
  await page.evaluate(() => { document.getElementById('divChartSelect').value = 'Transit'; });
  const transit = page.waitForResponse(r => r.url().includes('/api/v1/chart/transit'));
  await page.evaluate(() => loadChart('c1'));
  await transit;
  await expect.poll(async () => (await heights(page)).d9Shown).toBe(true);
  await expect.poll(async () => { const h = await heights(page); return Math.abs(h.dasha - h.d9); }).toBeLessThanOrEqual(1);
  const h = await heights(page);
  expect(h.dasha).toBeLessThan(1500); // not the full dasha list
});

test('with no Divisional chart showing, Dasha falls back to the main chart height', async ({ page }) => {
  await page.route('**/api/v1/chart/transit', route => route.abort()); // transit chart never appears
  await page.evaluate(() => { document.getElementById('divChartSelect').value = 'Transit'; });
  await page.evaluate(() => loadChart('c1'));
  await expect(page.locator('#dashaPanel')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const d = document.getElementById('dashaPanel').getBoundingClientRect().height;
    const c = document.getElementById('chart').getBoundingClientRect().height;
    return c > 0 && Math.abs(d - c) <= 1;
  })).toBe(true);
});
