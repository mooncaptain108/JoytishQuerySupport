const { test, expect } = require('@playwright/test');
const paulFixture = require('./fixtures/paul.json');

// Toolbar dropdowns: only one list open at a time.

test.beforeEach(async ({ page }) => {
  await page.route('**/static/Open.md**', route => route.fulfill({ body: '# Jyotish Query\n\nWelcome.' }));
  await page.addInitScript(() => {
    localStorage.setItem('jyotish_hide_welcome', '1');
    localStorage.setItem('jyotish_atlas', JSON.stringify({ Home: { lat: '47.0', lon: '-122.0', tz: -8 } }));
  });
  await page.goto('/');
  await page.evaluate((d) => window.renderChart(d), paulFixture); // shows the View menu
});

const open = page => page.locator('.tb-menu.open').evaluateAll(ms => ms.map(m => m.id));
const btn = (page, id) => page.locator(`#${id} > .tb-btn`);

test('opening a second menu closes the first', async ({ page }) => {
  await btn(page, 'viewDropdown').click();
  expect(await open(page)).toEqual(['viewMenu']);
  await btn(page, 'chartsDropdown').click();
  expect(await open(page)).toEqual(['chartsMenu']);
  await btn(page, 'atlasDropdown').click();
  expect(await open(page)).toEqual(['atlasMenu']);
  await btn(page, 'helpDropdown').click();
  expect(await open(page)).toEqual(['helpMenu']);
});

test('clicking the same menu button again closes it', async ({ page }) => {
  await btn(page, 'viewDropdown').click();
  await btn(page, 'viewDropdown').click();
  expect(await open(page)).toEqual([]);
});

test('clicking elsewhere still closes the open menu', async ({ page }) => {
  await btn(page, 'atlasDropdown').click();
  await page.mouse.click(600, 600);
  expect(await open(page)).toEqual([]);
});
