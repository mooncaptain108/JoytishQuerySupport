const { test, expect } = require('@playwright/test');
const paulFixture = require('./fixtures/paul.json'); // born 1948-07-02

// Chart Analysis dialog: "Age: N" leads the second header line, ahead of
// Lucky Number. Completed years from the natal birth date to today.

async function openAnalysis(page, isoNow) {
  await page.clock.setFixedTime(new Date(isoNow));
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.route('**/static/Open.md**', route => route.fulfill({ body: '# Jyotish Query\n\nWelcome.' }));
  await page.goto('/');
  await page.evaluate((data) => window.renderChart(data), paulFixture);
  await page.waitForSelector('#rashiTable tr', { state: 'attached' });
  await page.evaluate(() => openAnalysisDialog());
  return page.locator('.an-lagna > div').nth(1);
}

test('age leads the second line, before Lucky Number', async ({ page }) => {
  const line = await openAnalysis(page, '2026-10-13T12:00:00');
  await expect(line).toHaveText(/^\s*Age: 78\s*·\s*Lucky Number \d+\s*·\s*Lucky Stone /);
});

test('age has not ticked over the day before the birthday', async ({ page }) => {
  const line = await openAnalysis(page, '2026-07-01T12:00:00');
  await expect(line).toContainText('Age: 77');
});

test('age ticks over on the birthday', async ({ page }) => {
  const line = await openAnalysis(page, '2026-07-02T12:00:00');
  await expect(line).toContainText('Age: 78');
});

test('Transits view still shows the natal age, not the transit moment', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-13T12:00:00'));
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.goto('/');
  await page.evaluate((data) => window.renderChart(data), paulFixture);
  const transit = page.waitForResponse(r => r.url().includes('/api/v1/chart/transit'));
  await page.evaluate(() => setChartViewMode('transits'));
  await transit;
  await expect.poll(() => page.evaluate(() => !!transitAnalysis)).toBe(true);
  await page.evaluate(() => openAnalysisDialog());
  await expect(page.locator('.an-lagna > div').nth(1)).toContainText('Age: 78');
});

test('no age on a Muhurta result chart', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-13T12:00:00'));
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.goto('/');
  await page.evaluate((data) => { window.renderChart(data); currentMuhurtaIdx = 0; openAnalysisDialog(); }, paulFixture);
  const line = page.locator('.an-lagna > div').nth(1);
  await expect(line).toContainText('Lucky Number');
  await expect(line).not.toContainText('Age');
});
