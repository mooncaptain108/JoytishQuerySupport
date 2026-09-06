const { test, expect } = require('@playwright/test');
const paulFixture = require('./fixtures/paul.json');

// Regression tests for Settings > "Sign glyphs": swaps the two-letter rashi
// abbreviations (Ar/Ta/…) and the wheel house-sign numbers (1–12) for the
// hand-drawn SVG symbols in the sprite. Persists as localStorage
// 'jyotish_sign_glyphs', defaults off. Independent of the planet-glyph toggle.

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

// paul.json: Leo lagna (rashi 5); Sun in Gemini (rashi 3).
const RASI_CELL = '#rashiTable tr:first-child td:nth-child(3)'; // Ascendant row, rasi column

test('default (sign glyphs off): rasi column is text, wheel shows sign numbers', async ({ page }) => {
  await loadChart(page);
  await expect(page.locator(RASI_CELL)).toHaveText('Le');
  await expect(page.locator('#rashiTable td svg.gph')).toHaveCount(0);
  await expect(page.locator('#chart use[href^="#s-"]')).toHaveCount(0);
  // a plain sign-number text node exists in the wheel
  await expect(page.locator('#chart text.hn').first()).toHaveText(/^\d+$/);
});

test('sign glyphs on: rasi column renders the sprite glyph', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_sign_glyphs', '1'));
  await loadChart(page);
  await expect(page.locator(RASI_CELL + ' svg.gph use')).toHaveAttribute('href', '#s-leo');
  await expect(page.locator(RASI_CELL)).toHaveText('');
});

test('sign glyphs on: chart wheel house markers become <use> refs, not digits', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_sign_glyphs', '1'));
  await loadChart(page);
  await expect(page.locator('#chart use[href^="#s-"]')).toHaveCount(12);
  await expect(page.locator('#chart text.hn')).toHaveCount(0);
});

test('sign and planet glyph toggles are independent', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('jyotish_sign_glyphs', '1');
    // planet glyphs stay OFF
  });
  await loadChart(page);
  // signs are glyphs...
  await expect(page.locator('#chart use[href^="#s-"]')).toHaveCount(12);
  // ...planets are still text (Sun row, first column)
  await expect(page.locator('#rashiTable tr').nth(1).locator('td').first()).toHaveText('Su');
  await expect(page.locator('#chart use[href^="#g-"]')).toHaveCount(0);
});

test('Settings toggle: checking it persists the key and repaints live', async ({ page }) => {
  await loadChart(page);
  await expect(page.locator('#rashiTable td svg.gph')).toHaveCount(0);

  await page.evaluate(() => window.openSettings());
  await page.check('#chkSignGlyphs');

  await expect.poll(() =>
    page.evaluate(() => localStorage.getItem('jyotish_sign_glyphs'))
  ).toBe('1');
  await expect(page.locator(RASI_CELL + ' svg.gph use')).toHaveAttribute('href', /^#s-/);

  await page.uncheck('#chkSignGlyphs');
  await expect(page.locator('#rashiTable td svg.gph')).toHaveCount(0);
  await expect(page.locator(RASI_CELL)).toHaveText('Le');
});

test('openSettings reflects the stored sign-glyph preference', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_sign_glyphs', '1'));
  await loadChart(page);
  await page.evaluate(() => window.openSettings());
  await expect(page.locator('#chkSignGlyphs')).toBeChecked();
});
