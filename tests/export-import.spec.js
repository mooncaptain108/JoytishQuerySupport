const { test, expect } = require('@playwright/test');
const fs = require('fs');

// Suppress welcome dialog / Open.md fetch, and auto-accept confirm()/alert() popups
test.beforeEach(async ({ page }) => {
  await page.route('**/static/Open.md**', route =>
    route.fulfill({ body: '# Jyotish Query\n\nWelcome.' })
  );
  page.on('dialog', dialog => dialog.accept());
});

async function seed(page, { atlas, charts = [] } = {}) {
  const atlasData = atlas || { Home: { lat: '47.0000', lon: '-122.0000', tz: -8 } };
  await page.addInitScript(({ atlasData, charts }) => {
    localStorage.setItem('jyotish_hide_welcome', '1');
    localStorage.setItem('jyotish_atlas', JSON.stringify(atlasData));
    localStorage.setItem('jyotish_charts', JSON.stringify(charts));
  }, { atlasData, charts });
  await page.goto('/');
}

function chart(name, date, extra = {}) {
  return { name, date, time: '10:00:00', lat: '1.0000', lon: '2.0000', tz: 0, ...extra };
}

async function openSettings(page) {
  await page.locator('#gearBtn').click();
  await expect(page.locator('#settingsPanel')).toBeVisible();
}

async function openChartLibrary(page) {
  // #settingsPanel/#settingsOverlay are shown/hidden via an "open" class (CSS
  // transform), not display/visibility, so closing isn't visibility-detectable.
  await page.evaluate(() => window.closeSettings());
  await page.locator('#chartsBtn').click();
  await page.locator('#chartsMenu button:has-text("Charts")').click();
  await expect(page.locator('#dlgOpen')).toBeVisible();
}

function libraryRow(page, text) {
  return page.locator('#chartListWrap tr.data-row', { hasText: text });
}

// ── Export dialog ────────────────────────────────────────────────────────────

test('export dialog lists charts alphabetically, all checked by default', async ({ page }) => {
  await seed(page, { charts: [chart('Beta', '2020-01-01'), chart('Alpha', '2020-01-02'), chart('Gamma', '2020-01-03')] });
  await openSettings(page);
  await page.locator('#settingsPanel button:has-text("Export")').click();
  await expect(page.locator('#dlgExport')).toBeVisible();

  const rows = page.locator('#exportListWrap tbody tr');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Alpha');
  await expect(rows.nth(1)).toContainText('Beta');
  await expect(rows.nth(2)).toContainText('Gamma');

  const checkboxes = page.locator('.export-chk');
  for (const cb of await checkboxes.all()) await expect(cb).toBeChecked();
});

test('Select All / Select None toggle every row', async ({ page }) => {
  await seed(page, { charts: [chart('Alpha', '2020-01-01'), chart('Beta', '2020-01-02')] });
  await openSettings(page);
  await page.locator('#settingsPanel button:has-text("Export")').click();

  await page.locator('#dlgExport button:has-text("Select None")').click();
  for (const cb of await page.locator('.export-chk').all()) await expect(cb).not.toBeChecked();

  await page.locator('#dlgExport button:has-text("Select All")').click();
  for (const cb of await page.locator('.export-chk').all()) await expect(cb).toBeChecked();
});

test('exporting a subset only includes the checked charts', async ({ page }) => {
  await seed(page, { charts: [chart('Alpha', '2020-01-01'), chart('Beta', '2020-01-02'), chart('Gamma', '2020-01-03')] });
  await openSettings(page);
  await page.locator('#settingsPanel button:has-text("Export")').click();

  await page.locator('#exportListWrap tr', { hasText: 'Beta' }).locator('.export-chk').uncheck();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#dlgExport button:has-text("Export Selected")').click(),
  ]);
  const content = fs.readFileSync(await download.path(), 'utf-8');
  const obj = JSON.parse(content);

  const names = obj.jyotish_charts.map(c => c.name).sort();
  expect(names).toEqual(['Alpha', 'Gamma']);
  // Non-chart keys are always included in full
  expect(obj.jyotish_atlas).toBeTruthy();
});

// ── Import: merge ─────────────────────────────────────────────────────────────

test('import merge keeps existing charts and adds imported ones, sorted alphabetically', async ({ page }) => {
  await seed(page, { charts: [chart('Zeta', '2020-01-01')] });
  const importFile = { jyotish_charts: [chart('Alpha', '2021-05-05')] };

  await openSettings(page);
  await page.locator('#importFile').setInputFiles({
    name: 'import.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(importFile)),
  });

  await expect(page.locator('#dlgImportConfirm')).toBeVisible();
  await expect(page.locator('#importSummary')).toContainText('Importing 1 chart(s) — you have 1 existing.');
  await expect(page.locator('input[name="importMode"][value="merge"]')).toBeChecked();

  await page.locator('#dlgImportConfirm button:has-text("Import")').click();

  await openChartLibrary(page);
  const rows = page.locator('#chartListWrap tr.data-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('Alpha');
  await expect(rows.nth(1)).toContainText('Zeta');
});

test('import merge keeps duplicate names as separate rows, each independently deletable', async ({ page }) => {
  await seed(page, { charts: [chart('Alpha', '2000-01-01')] });
  const importFile = { jyotish_charts: [chart('Alpha', '1999-05-05')] };

  await openSettings(page);
  await page.locator('#importFile').setInputFiles({
    name: 'import.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(importFile)),
  });
  await page.locator('#dlgImportConfirm button:has-text("Import")').click();

  await openChartLibrary(page);
  await expect(page.locator('#chartListWrap tr.data-row', { hasText: 'Alpha' })).toHaveCount(2);

  // Delete only the older (imported) duplicate
  await libraryRow(page, '1999-05-05').locator('button.btn-danger').click();

  await expect(page.locator('#chartListWrap tr.data-row', { hasText: 'Alpha' })).toHaveCount(1);
  await expect(libraryRow(page, '2000-01-01')).toBeVisible();
});

// ── Import: overwrite ─────────────────────────────────────────────────────────

test('import overwrite replaces the existing chart database', async ({ page }) => {
  await seed(page, { charts: [chart('Alpha', '2000-01-01')] });
  const importFile = { jyotish_charts: [chart('Beta', '2021-05-05')] };

  await openSettings(page);
  await page.locator('#importFile').setInputFiles({
    name: 'import.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(importFile)),
  });
  await expect(page.locator('#dlgImportConfirm')).toBeVisible();
  await page.locator('input[name="importMode"][value="overwrite"]').check();
  await page.locator('#dlgImportConfirm button:has-text("Import")').click();

  await openChartLibrary(page);
  const rows = page.locator('#chartListWrap tr.data-row');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Beta');
});
