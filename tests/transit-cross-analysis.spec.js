const { test, expect } = require('@playwright/test');
const paulFixture = require('./fixtures/paul.json');

// Chart & Transits Analysis lists conjunctions/aspects between transit and
// natal planets. Planets must show like the Chart Analysis does -- glyphs when
// Interface Tweaks > Planets is on glyphs, Su/Mo abbreviations otherwise --
// not full English names (end-user report, 2026-10-17).

const NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

async function openCross(page, glyphs) {
  await page.addInitScript((g) => {
    localStorage.setItem('jyotish_hide_welcome', '1');
    localStorage.setItem('jyotish_planet_glyphs', g ? '1' : '0');
  }, glyphs);
  await page.route('**/static/Open.md**', route => route.fulfill({ body: '# Jyotish Query\n\nWelcome.' }));
  await page.goto('/');
  await page.evaluate((d) => window.renderChart(d), paulFixture);
  await page.evaluate(() => setChartViewMode('both'));
  // Pin the transit moment so the hit list is the same every run.
  const pinned = page.waitForResponse(r => r.url().includes('/api/v1/chart/transit') && r.request().postDataJSON().date === '2026-10-17');
  await page.evaluate(() => {
    document.getElementById('tDate').value = '2026-10-17';
    document.getElementById('tTime').value = '12:00:00';
    fetchAndRenderTransit();
  });
  await pinned;
  await expect.poll(() => page.evaluate(() => !!transitAnalysis && transitData.birth_data.date === '2026-10-17')).toBe(true);
  await page.evaluate(() => openAnalysisDialog());
  await expect(page.locator('#analysisDlgTitle')).toHaveText('Chart & Transits Analysis');
  return page.locator('#analysisContent');
}

test('shows planet glyphs, not English names, when glyphs are on', async ({ page }) => {
  const content = await openCross(page, true);
  await expect(content.locator('svg.gph').first()).toBeVisible();
  const text = await content.innerText();
  for (const n of NAMES) expect(text, n).not.toMatch(new RegExp('\\b' + n + '\\b'));
});

test('shows Su/Mo abbreviations, not English names, when glyphs are off', async ({ page }) => {
  const content = await openCross(page, false);
  await expect(content.locator('svg.gph')).toHaveCount(0);
  const text = await content.innerText();
  expect(text).toMatch(/\b(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)\b/);
  for (const n of NAMES) expect(text, n).not.toMatch(new RegExp('\\b' + n + '\\b'));
});
