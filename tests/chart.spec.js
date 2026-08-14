const { test, expect } = require('@playwright/test');
const paulFixture = require('./fixtures/paul.json');

// Suppress welcome dialog and Open.md fetch for all chart tests
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.route('**/static/Open.md**', route =>
    route.fulfill({ body: '# Jyotish Query\n\nWelcome.' })
  );
});

// Helper: load the page and inject fixture data directly into renderChart()
async function loadChart(page, fixture) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((data) => window.renderChart(data), fixture);
  // Use 'attached' not 'visible' — rashiBox visibility is tested separately
  await page.waitForSelector('#rashiTable tr', { state: 'attached' });
}

// ── Rashi Data table ──────────────────────────────────────────────────────────

test('rashi table has 10 rows (As + 9 grahas)', async ({ page }) => {
  await loadChart(page, paulFixture);
  const rows = page.locator('#rashiTable tr');
  await expect(rows).toHaveCount(10);
});

test('rashi table first row is Ascendant in Leo', async ({ page }) => {
  await loadChart(page, paulFixture);
  const firstRow = page.locator('#rashiTable tr').first();
  const cells = firstRow.locator('td');
  await expect(cells.nth(0)).toHaveText('As');   // abbreviation
  await expect(cells.nth(1)).toHaveText('4°00′'); // degree
  await expect(cells.nth(2)).toHaveText('Le');    // Leo
  await expect(cells.nth(3)).toHaveText('Magha'); // nakshatra
  await expect(cells.nth(4)).toHaveText('Ke');    // nakshatra lord (Magha nak 10, lord = Ketu)
});

test('rashi table Sun row is correct', async ({ page }) => {
  await loadChart(page, paulFixture);
  // Sun is the first graha row (index 1)
  const sunRow = page.locator('#rashiTable tr').nth(1);
  const cells = sunRow.locator('td');
  await expect(cells.nth(0)).toHaveText('Su');    // abbreviation
  await expect(cells.nth(1)).toHaveText('17°31′'); // degree (17.5236)
  await expect(cells.nth(2)).toHaveText('Ge');    // Gemini
  await expect(cells.nth(3)).toHaveText('Ardra'); // nakshatra
  await expect(cells.nth(4)).toHaveText('Ra');    // Rahu (nakshatra_lord from API)
});

test('rashi table Moon row is correct', async ({ page }) => {
  await loadChart(page, paulFixture);
  const moonRow = page.locator('#rashiTable tr').nth(2);
  const cells = moonRow.locator('td');
  await expect(cells.nth(0)).toHaveText('Mo');
  await expect(cells.nth(1)).toHaveText('22°48′'); // 22.808
  await expect(cells.nth(2)).toHaveText('Ar');     // Aries
});

// ── Chart SVG ────────────────────────────────────────────────────────────────

test('rashi box becomes visible after chart load', async ({ page }) => {
  await loadChart(page, paulFixture);
  await expect(page.locator('#rashiBox')).toHaveCSS('display', 'block');
});

test('dasha panel becomes visible after chart load', async ({ page }) => {
  await loadChart(page, paulFixture);
  // renderChart sets dashaPanel display:flex in a requestAnimationFrame
  await page.waitForFunction(() => {
    const p = document.getElementById('dashaPanel');
    return p && p.style.display === 'flex';
  });
  await expect(page.locator('#dashaPanel')).toBeVisible();
});

test('dasha list is populated after chart load', async ({ page }) => {
  await loadChart(page, paulFixture);
  await page.waitForSelector('#dashaList .dr');
  const items = page.locator('#dashaList .dr');
  await expect(items).not.toHaveCount(0);
});

test('analysis button enabled after chart load', async ({ page }) => {
  await loadChart(page, paulFixture);
  await expect(page.locator('#analysisBtn')).toBeEnabled();
});

// ── Muhurta result chart load ───────────────────────────────────────────────
// Regression test for infinite recursion (renderChart <-> setChartViewMode)
// when loading a chart from muhurta search results. Bug wasn't input-dependent:
// it fired on the second+ isMuhurtaResult render because currentMuhurtaIdx is
// set to a value >= 0 before renderChart(data, true) runs, so any real
// loadMuhurtaChart() call hit it. Reproduce that precondition directly rather
// than driving a full search (which needs a background job + polling).

test('loading a muhurta result chart does not recurse infinitely', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  // Simulate state after a muhurta result index has already been selected —
  // this is what made renderChart(data, true) reentrant via setChartViewMode.
  await page.evaluate(() => { currentMuhurtaIdx = 0; });

  let pageError = null;
  page.once('pageerror', err => { pageError = err; });

  await page.evaluate((data) => window.renderChart(data, true), paulFixture);
  await page.waitForSelector('#rashiTable tr', { state: 'attached' });

  expect(pageError).toBeNull();
  await expect(page.locator('#rashiTable tr')).toHaveCount(10);
});

// ── API integration: New chart flow ──────────────────────────────────────────

test('chart loads via New dialog with mocked API', async ({ page }) => {
  await page.route('**/api/v1/chart', route => route.fulfill({ json: paulFixture }));
  await page.goto('/');

  await page.locator('button:has-text("New")').click();
  await expect(page.locator('#dlgNew')).toBeVisible();

  await page.locator('#nLat').fill('47.4833');
  await page.locator('#nLon').fill('-122.2166');
  await page.locator('#nTz').fill('-8');
  await page.locator('#nDate').fill('1948-07-02');
  await page.locator('#nTime').fill('08:28');

  await page.locator('#newSubmitBtn').click();
  await page.waitForSelector('#rashiTable tr', { state: 'attached' });

  const rows = page.locator('#rashiTable tr');
  await expect(rows).toHaveCount(10);
});
