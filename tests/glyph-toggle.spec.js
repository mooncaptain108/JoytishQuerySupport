const { test, expect } = require('@playwright/test');
const paulFixture = require('./fixtures/paul.json');

// Regression tests for Settings > "Planet glyphs": swaps the two-letter graha
// abbreviations (Su/Mo/Ma/…) for the hand-drawn SVG symbols in the sprite at
// the top of <body>. Persists as localStorage 'jyotish_planet_glyphs',
// defaults off. 'As' (Ascendant) has no glyph and always stays text.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.route('**/static/Open.md**', route =>
    route.fulfill({ body: '# Jyotish Query\n\nWelcome.' })
  );
});

async function loadChart(page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((data) => window.renderChart(data), paulFixture);
  await page.waitForSelector('#rashiTable tr', { state: 'attached' });
}

test('default (glyphs off): Rashi Data shows text abbreviations, no glyph svg', async ({ page }) => {
  await loadChart(page);
  // Sun row — Sun is the 2nd row (row 1 is the Ascendant)
  const sunCell = page.locator('#rashiTable tr').nth(1).locator('td').first();
  await expect(sunCell).toHaveText('Su');
  await expect(page.locator('#rashiTable svg.gph')).toHaveCount(0);
});

test('glyphs on: Rashi Data first column and lord column render sprite glyphs', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_planet_glyphs', '1'));
  await loadChart(page);

  const sunCell = page.locator('#rashiTable tr').nth(1).locator('td').first();
  await expect(sunCell.locator('svg.gph use')).toHaveAttribute('href', '#g-sun');
  await expect(sunCell).not.toHaveText('Su');

  // The Ascendant row keeps its text label — no glyph exists for it
  const asCell = page.locator('#rashiTable tr').first().locator('td').first();
  await expect(asCell).toHaveText('As');
  await expect(asCell.locator('svg')).toHaveCount(0);

  // Nakshatra-lord column (5th cell) is also a graha -> also a glyph
  await expect(sunCell).toHaveText(''); // glyph only, no text
  const lordCell = page.locator('#rashiTable tr').nth(1).locator('td').nth(4);
  await expect(lordCell.locator('svg.gph use')).toHaveCount(1);
});

test('glyphs on: Dasha Periods rows render glyphs for both maha and antar lords', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_planet_glyphs', '1'));
  await loadChart(page);
  const firstRow = page.locator('#dashaList .dr').first();
  // two graha spans per row (maha / antar), each now a glyph
  await expect(firstRow.locator('svg.gph use')).toHaveCount(2);
});

test('glyphs on: natal wheel planet labels use <use> refs, not text abbreviations', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_planet_glyphs', '1'));
  await loadChart(page);
  // At least one graha glyph placed in the #chart SVG
  await expect(page.locator('#chart use[href^="#g-"]')).not.toHaveCount(0);
});

test('Settings toggle: checking it persists the key and repaints the table live', async ({ page }) => {
  await loadChart(page);
  await expect(page.locator('#rashiTable svg.gph')).toHaveCount(0);

  await page.evaluate(() => window.openSettings());
  await page.check('#chkGlyphs');

  await expect.poll(() =>
    page.evaluate(() => localStorage.getItem('jyotish_planet_glyphs'))
  ).toBe('1');
  // table repainted without an explicit renderChart call
  await expect(page.locator('#rashiTable svg.gph use').first()).toHaveAttribute('href', /^#g-/);

  // and unchecking reverts to text
  await page.uncheck('#chkGlyphs');
  await expect(page.locator('#rashiTable svg.gph')).toHaveCount(0);
  await expect(page.locator('#rashiTable tr').nth(1).locator('td').first()).toHaveText('Su');
});

test('openSettings reflects the stored glyph preference in the checkbox', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_planet_glyphs', '1'));
  await loadChart(page);
  await page.evaluate(() => window.openSettings());
  await expect(page.locator('#chkGlyphs')).toBeChecked();
});
