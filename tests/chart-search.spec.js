const { test, expect } = require('@playwright/test');

// Chart Library full-text search (server bf2f138): whitespace-separated
// tokens, every token must appear as a substring somewhere in the chart's
// combined name/date/time/location text. Runs on Search or Enter only.

const CHARTS = [
  { name: 'John Smith',  date: '1990-04-12', time: '06:30:00', lat: '40.7', lon: '-74.0', tz: -5, locationName: 'New York, USA' },
  { name: 'Mary Jones',  date: '1985-11-02', time: '14:05:00', lat: '51.5', lon: '-0.1',  tz: 0,  locationName: 'London, UK' },
  { name: 'Johnny Cash', date: '1932-02-26', time: '08:00:00', lat: '35.6', lon: '-90.3', tz: -6, locationName: 'Kingsland, USA' },
  { name: 'Ravi',        date: '1990-07-19', time: '23:45:00', lat: '28.6', lon: '77.2',  tz: 5.5 },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/static/Open.md**', route =>
    route.fulfill({ body: '# Jyotish Query\n\nWelcome.' })
  );
  page.on('dialog', dialog => dialog.accept());
  await page.addInitScript((charts) => {
    localStorage.setItem('jyotish_hide_welcome', '1');
    // Charts menu stays disabled until at least one atlas location exists.
    localStorage.setItem('jyotish_atlas', JSON.stringify({ Home: { lat: '47.0000', lon: '-122.0000', tz: -8 } }));
    // Seed only once, so a delete made by a test survives its own reloads.
    if (!localStorage.getItem('jyotish_charts')) {
      localStorage.setItem('jyotish_charts', JSON.stringify(charts));
    }
  }, CHARTS);
  await page.goto('/');
});

async function openChartLibrary(page) {
  await page.locator('#chartsBtn').click();
  await page.locator('#chartsMenu button:has-text("Charts")').click();
  await expect(page.locator('#dlgOpen')).toBeVisible();
}

const rows = page => page.locator('#chartListWrap tr.data-row');

async function search(page, q, { enter = false } = {}) {
  await page.fill('#chartSearchBox', q);
  if (enter) await page.press('#chartSearchBox', 'Enter');
  else await page.locator('#dlgOpen button:text-is("Search")').click();
}

async function visibleNames(page) {
  return (await rows(page).locator('td:first-child').allTextContents()).map(s => s.trim()).sort();
}

test('opens unfiltered: all charts, no status line, no Clear button', async ({ page }) => {
  await openChartLibrary(page);
  await expect(rows(page)).toHaveCount(CHARTS.length);
  await expect(page.locator('#chartSearchStatus')).toBeHidden();
  await expect(page.locator('#chartSearchClearBtn')).toBeHidden();
});

test('does not filter live while typing', async ({ page }) => {
  await openChartLibrary(page);
  await page.fill('#chartSearchBox', 'mary');
  await expect(rows(page)).toHaveCount(CHARTS.length);
});

test('single token is a case-insensitive substring match, not prefix-only', async ({ page }) => {
  await openChartLibrary(page);
  await search(page, 'JOHN');
  expect(await visibleNames(page)).toEqual(['John Smith', 'Johnny Cash']);
  await expect(page.locator('#chartSearchStatus')).toHaveText('2 charts match.');
  await expect(page.locator('#chartSearchClearBtn')).toBeVisible();

  await search(page, 'ones'); // middle of "Jones"
  expect(await visibleNames(page)).toEqual(['Mary Jones']);
  await expect(page.locator('#chartSearchStatus')).toHaveText('1 chart matches.');
});

test('multiple tokens must all match, across different fields', async ({ page }) => {
  await openChartLibrary(page);
  await search(page, 'john 1990');
  expect(await visibleNames(page)).toEqual(['John Smith']);

  await search(page, 'usa 1932');
  expect(await visibleNames(page)).toEqual(['Johnny Cash']);
});

test('matches date, time and location fields', async ({ page }) => {
  await openChartLibrary(page);
  await search(page, '1990');
  expect(await visibleNames(page)).toEqual(['John Smith', 'Ravi']);
  await search(page, '14:05');
  expect(await visibleNames(page)).toEqual(['Mary Jones']);
  await search(page, 'london');
  expect(await visibleNames(page)).toEqual(['Mary Jones']);
});

test('chart without locationName is searchable by its lat, lon', async ({ page }) => {
  await openChartLibrary(page);
  await search(page, '28.6, 77.2');
  expect(await visibleNames(page)).toEqual(['Ravi']);
});

test('Enter in the box runs the search', async ({ page }) => {
  await openChartLibrary(page);
  await search(page, 'kingsland', { enter: true });
  expect(await visibleNames(page)).toEqual(['Johnny Cash']);
  await expect(page.locator('#dlgOpen')).toBeVisible(); // Enter didn't submit/close
});

test('no match shows the search-specific empty message', async ({ page }) => {
  await openChartLibrary(page);
  await search(page, 'zzzz');
  await expect(rows(page)).toHaveCount(0);
  await expect(page.locator('#chartListWrap .no-records')).toHaveText('No charts match that search.');
  await expect(page.locator('#chartSearchStatus')).toHaveText('0 charts match.');
});

test('blank search and Clear both restore the full list', async ({ page }) => {
  await openChartLibrary(page);
  await search(page, 'mary');
  await expect(rows(page)).toHaveCount(1);
  await page.locator('#chartSearchClearBtn').click();
  await expect(rows(page)).toHaveCount(CHARTS.length);
  await expect(page.locator('#chartSearchBox')).toHaveValue('');
  await expect(page.locator('#chartSearchClearBtn')).toBeHidden();

  await search(page, 'mary');
  await search(page, '   ');
  await expect(rows(page)).toHaveCount(CHARTS.length);
  await expect(page.locator('#chartSearchStatus')).toBeHidden();
});

test('reopening the library resets the search', async ({ page }) => {
  await openChartLibrary(page);
  await search(page, 'mary');
  await page.locator('#dlgOpen .dlg-close-x').click();
  await openChartLibrary(page);
  await expect(page.locator('#chartSearchBox')).toHaveValue('');
  await expect(rows(page)).toHaveCount(CHARTS.length);
});

test('deleting a row from search results keeps the search applied', async ({ page }) => {
  await openChartLibrary(page);
  await search(page, 'john');
  await expect(rows(page)).toHaveCount(2);
  await rows(page).filter({ hasText: 'Johnny Cash' }).locator('button.btn-danger').click();
  expect(await visibleNames(page)).toEqual(['John Smith']);
  await expect(page.locator('#chartSearchStatus')).toHaveText('1 chart matches.');
  await expect(page.locator('#chartSearchBox')).toHaveValue('john');
});

test('search row stays inside the dialog (Search/Clear not pushed off-edge)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openChartLibrary(page);
  await search(page, 'john');
  const dlg = await page.locator('#dlgOpen').boundingBox();
  for (const sel of ['#dlgOpen button:text-is("Search")', '#chartSearchClearBtn']) {
    const b = await page.locator(sel).boundingBox();
    expect(b.x + b.width).toBeLessThanOrEqual(dlg.x + dlg.width + 0.5);
  }
});
