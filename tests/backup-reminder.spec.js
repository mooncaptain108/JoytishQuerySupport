const { test, expect } = require('@playwright/test');
const fs = require('fs');

// Backup reminder: neon-green first line of the opening-screen message when
// charts/atlas changed after the last FULL export (all charts ticked).

const HOME = { Home: { lat: '47.0000', lon: '-122.0000', tz: -8 } };
const chart = (name, date) => ({ id: 'id-' + name, name, date, time: '10:00:00', lat: '47.0000', lon: '-122.0000', tz: -8, locationName: 'Home' });

async function open(page, { atlas = HOME, charts = [], extra = {} } = {}) {
  await page.route('**/static/Open.md**', route => route.fulfill({ body: '# Jyotish Query\n\nWelcome.' }));
  await page.addInitScript(({ atlas, charts, extra }) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('jyotish_hide_welcome', '1');
    localStorage.setItem('jyotish_atlas', JSON.stringify(atlas));
    localStorage.setItem('jyotish_charts', JSON.stringify(charts));
    for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v);
  }, { atlas, charts, extra });
  await page.goto('/');
}

const reminder = page => page.locator('#backupReminder');

// Opens Export, optionally unticks one chart, exports; returns the file.
async function exportAll(page, { untick } = {}) {
  await page.locator('#gearBtn').click();
  await page.locator('#settingsPanel button:has-text("Export")').click();
  await expect(page.locator('#dlgExport')).toBeVisible();
  if (untick) await page.locator(`.export-chk[data-id="${untick}"]`).uncheck();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#dlgExport button:has-text("Export Selected")').click(),
  ]);
  await page.evaluate(() => closeSettings());
  return JSON.parse(fs.readFileSync(await download.path(), 'utf-8'));
}

test('no reminder when there is no data at all', async ({ page }) => {
  await open(page, { atlas: {} });
  await expect(page.locator('#chartTitle')).toContainText('Enter New Location');
  await expect(reminder(page)).toHaveCount(0);
});

test('never exported: neon-green reminder above the opening message', async ({ page }) => {
  await open(page, { charts: [chart('Alpha', '2000-01-01')] });
  await expect(reminder(page)).toHaveText('Data has been entered but has not been saved/exported yet.');
  await expect(reminder(page)).toHaveCSS('color', 'rgb(57, 255, 20)');
  const order = await page.evaluate(() => {
    const t = document.getElementById('chartTitle').textContent;
    return t.indexOf('saved/exported') < t.indexOf('Enter New Location');
  });
  expect(order).toBe(true);
});

test('full export clears it; a later change brings it back with the export date', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-11T10:00:00'));
  await open(page, { charts: [chart('Alpha', '2000-01-01')] });
  await exportAll(page);
  await expect(reminder(page)).toHaveCount(0);

  await page.clock.setFixedTime(new Date('2026-10-14T09:00:00'));
  await page.evaluate(() => { const a = getAtlas(); a.Paris = { lat: '48.8566', lon: '2.3522', tz: 1 }; setAtlas(a); });
  await expect(reminder(page)).toHaveText('Data has been entered since you last saved/exported on 11-Oct-2026');

  await page.reload(); // persists across visits
  await expect(reminder(page)).toHaveText('Data has been entered since you last saved/exported on 11-Oct-2026');
});

test('a partial export (some charts unticked) does not count', async ({ page }) => {
  await open(page, { charts: [chart('Alpha', '2000-01-01'), chart('Beta', '2001-01-01')] });
  await exportAll(page, { untick: 'id-Beta' });
  await expect(reminder(page)).toHaveText(/not been saved\/exported yet/);
});

test('deleting a chart counts as a change', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-11T10:00:00'));
  await open(page, { charts: [chart('Alpha', '2000-01-01'), chart('Beta', '2001-01-01')] });
  await exportAll(page);
  await page.clock.setFixedTime(new Date('2026-10-12T10:00:00'));
  page.on('dialog', d => d.accept());
  await page.evaluate(() => deleteChart('id-Beta'));
  await expect(reminder(page)).toContainText('since you last saved/exported on 11-Oct-2026');
});

test('writes that change nothing do not trigger it (re-importing an unchanged backup)', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-11T10:00:00'));
  await open(page, { charts: [chart('Alpha', '2000-01-01')] });
  const file = await exportAll(page);
  await page.clock.setFixedTime(new Date('2026-10-12T10:00:00'));
  page.on('dialog', d => d.accept());
  await page.locator('#gearBtn').click();
  await page.locator('#importFile').setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(file)) });
  await page.locator('#dlgImportConfirm button:has-text("Import")').click();
  await expect(page.locator('#dlgImportConfirm')).toBeHidden();
  await expect(reminder(page)).toHaveCount(0);
});

test('tracking dates are left out of exports and ignored on import', async ({ page }) => {
  await open(page, { charts: [chart('Alpha', '2000-01-01')] });
  const file = await exportAll(page);
  expect(file).not.toHaveProperty('jyotish_last_export');
  expect(file).not.toHaveProperty('jyotish_last_data_change');

  const before = await page.evaluate(() => localStorage.getItem('jyotish_last_export'));
  page.on('dialog', d => d.accept());
  await page.locator('#gearBtn').click();
  await page.locator('#importFile').setInputFiles({ name: 'old.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ jyotish_last_export: '2001-01-01T00:00:00.000Z', jyotish_charts: [] })) });
  await page.locator('#dlgImportConfirm button:has-text("Import")').click();
  await expect(page.locator('#dlgImportConfirm')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('jyotish_last_export'))).toBe(before);
});

test('assigning missing chart ids on load is not a change', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-11T10:00:00'));
  const noId = { name: 'Old', date: '1990-01-01', time: '10:00:00', lat: '47.0000', lon: '-122.0000', tz: -8 };
  await open(page, { charts: [noId], extra: { jyotish_last_export: '2026-10-10T00:00:00.000Z', jyotish_last_data_change: '2026-10-09T00:00:00.000Z' } });
  await page.evaluate(() => getCharts());
  await expect(reminder(page)).toHaveCount(0);
});

test('disappears once a chart is drawn', async ({ page }) => {
  await open(page, { charts: [chart('Alpha', '2000-01-01')] });
  await expect(reminder(page)).toBeVisible();
  await page.evaluate(() => loadChart('id-Alpha'));
  await expect(page.locator('#rashiTable tr').first()).toBeAttached();
  await expect(reminder(page)).toHaveCount(0);
});
