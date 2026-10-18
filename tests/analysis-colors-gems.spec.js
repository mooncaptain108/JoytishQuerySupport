const { test, expect } = require('@playwright/test');
const paulFixture = require('./fixtures/paul.json'); // Leo lagna

// Analysis popover ends with the rising sign's favorable colours and gems
// (yournetastrologer.com/impact.htm -> learn_astrology72..83), styled like
// the Lucky Number line. The Gemini page gives neither, so Gemini comes
// from the alternate source "03 remedies.txt".

async function openFor(page, lagnaRashi) {
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.route('**/static/Open.md**', route => route.fulfill({ body: '# Jyotish Query\n\nWelcome.' }));
  await page.goto('/');
  const data = JSON.parse(JSON.stringify(paulFixture));
  if (lagnaRashi) data.lagna.rashi = lagnaRashi;
  await page.evaluate((d) => { window.renderChart(d); openAnalysisDialog(); }, data);
  return page.locator('#analysisContent .an-lagna-foot');
}

test('Leo: colours and gems close the popover, after the last planet', async ({ page }) => {
  const foot = await openFor(page);
  await expect(foot).toContainText('Favorable Colors: Pink, orange, golden, green, all bright shades of blue, yellow, red, black, dark brown and variegated colors');
  await expect(foot).toContainText('Gems: Ruby, emerald, diamond, yellow sapphire, blue sapphire and red coral');
  const last = await page.evaluate(() => document.getElementById('analysisContent').lastElementChild.className);
  expect(last).toContain('an-lagna-foot');
});

test('same font and style as the Lucky Number line', async ({ page }) => {
  await openFor(page);
  const [top, foot] = await page.evaluate(() => ['.an-lagna:not(.an-lagna-foot) > div', '.an-lagna-foot > div'].map(sel => {
    const cs = getComputedStyle(document.querySelector('#analysisContent ' + sel));
    return [cs.fontSize, cs.fontFamily, cs.color, cs.fontWeight];
  }));
  expect(foot).toEqual(top);
});

test('Gemini: from the alternate source (03 remedies.txt), combined across its benefic planets', async ({ page }) => {
  const foot = await openFor(page, 3);
  await expect(foot).toContainText('Favorable Colors: Orange, pink, white, burning red, yellow, green, black, dark brown, navy blue, dark green, variegated and royal blue');
  await expect(foot).toContainText('Gems: Ruby, pearl, red coral, yellow sapphire, blue sapphire, emerald and diamond');
  await expect(foot).not.toContainText('not given');
});

test('every sign has both lists', async ({ page }) => {
  await openFor(page);
  const missing = await page.evaluate(() => [1,2,3,4,5,6,7,8,9,10,11,12].filter(r => !FAVORABLE_COLORS[r] || !GEMS[r]));
  expect(missing).toEqual([]);
});

// The remedies files list each benefic planet's colours; the website left
// some out. Merged in: Jupiter green, Saturn black/dark brown, Venus variegated.
test('colours merged from the remedies files where the website left a benefic planet out', async ({ page }) => {
  await openFor(page);
  const c = await page.evaluate(() => FAVORABLE_COLORS);
  const has = (r, w) => new RegExp('\\b' + w + '\\b', 'i').test(c[r]);
  for (const r of [1, 7, 11]) expect(has(r, 'green'), 'green ' + r).toBe(true);
  for (const r of [1, 7, 9]) { expect(has(r, 'black'), 'black ' + r).toBe(true); expect(has(r, 'dark brown'), 'dark brown ' + r).toBe(true); }
  for (const r of [5, 6]) expect(has(r, 'variegated'), 'variegated ' + r).toBe(true);
});


test('top line shows the Lucky Stone right after the Lucky Number', async ({ page }) => {
  await openFor(page); // Leo
  const line = page.locator('#analysisContent .an-lagna:not(.an-lagna-foot) > div').nth(1);
  await expect(line).toHaveText(/Lucky Number 8\s*·\s*Lucky Stone Emerald\s*·\s*Pada/);
  const missing = await page.evaluate(() => [1,2,3,4,5,6,7,8,9,10,11,12].filter(r => !LUCKY_STONE[r]));
  expect(missing).toEqual([]);
});
