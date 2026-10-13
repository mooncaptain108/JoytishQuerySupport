const { test, expect } = require('@playwright/test');

// Import (Settings > Import): duplicate charts are skipped, and every imported
// chart's locationName gets an atlas entry -- reusing a nearby existing one,
// else a new entry with an IANA tzName from /api/v1/tz-lookup.

const HOME = { Home: { lat: '47.0000', lon: '-122.0000', tz: -8, tzName: 'America/Los_Angeles' } };

function chart(name, date, extra = {}) {
  return { name, date, time: '10:00:00', lat: '47.0000', lon: '-122.0000', tz: -8, ...extra };
}

async function seed(page, { atlas = HOME, charts = [] } = {}) {
  await page.route('**/static/Open.md**', route =>
    route.fulfill({ body: '# Jyotish Query\n\nWelcome.' })
  );
  await page.addInitScript(({ atlas, charts }) => {
    if (sessionStorage.getItem('seeded')) return; // keep state across the post-import reload
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('jyotish_hide_welcome', '1');
    localStorage.setItem('jyotish_atlas', JSON.stringify(atlas));
    localStorage.setItem('jyotish_charts', JSON.stringify(charts));
  }, { atlas, charts });
  await page.goto('/');
}

// Runs an import and resolves with the completion alert's text.
async function runImport(page, fileObj, mode = 'merge') {
  const alertText = new Promise(resolve => {
    page.on('dialog', d => { if (d.type() === 'alert') resolve(d.message()); d.accept(); });
  });
  await page.locator('#gearBtn').click();
  await page.locator('#importFile').setInputFiles({
    name: 'import.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fileObj)),
  });
  await expect(page.locator('#dlgImportConfirm')).toBeVisible();
  await page.locator(`input[name="importMode"][value="${mode}"]`).check();
  await page.locator('#dlgImportConfirm button:has-text("Import")').click();
  return alertText;
}

const stored = (page, key) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), key);

test('merge skips charts already saved and repeats within the file', async ({ page }) => {
  await seed(page, { charts: [chart('Alpha', '2000-01-01', { locationName: 'Home' })] });
  const msg = await runImport(page, { jyotish_charts: [
    chart('  alpha ', '2000-01-01', { time: '10:00' }),  // same chart: case/space/seconds differ
    chart('Beta', '2001-02-02'),
    chart('Beta', '2001-02-02'),                          // repeated in the file
    chart('Alpha', '2000-01-01', { time: '10:01:00' }),   // different time -> not a dup
  ] });
  expect(msg).toContain('Charts added: 2');
  expect(msg).toContain('duplicates skipped: 2');
  const charts = await stored(page, 'jyotish_charts');
  expect(charts.map(c => c.name + ' ' + c.time).sort()).toEqual(['Alpha 10:00:00', 'Alpha 10:01:00', 'Beta 10:00:00']);
});

test('overwrite still drops repeats within the file', async ({ page }) => {
  await seed(page, { charts: [chart('Old', '1990-01-01')] });
  const msg = await runImport(page, { jyotish_charts: [chart('Beta', '2001-02-02'), chart('Beta', '2001-02-02')] }, 'overwrite');
  expect(msg).toContain('Charts added: 1');
  const charts = await stored(page, 'jyotish_charts');
  expect(charts.map(c => c.name)).toEqual(['Beta']);
});

test('new locations are added to the atlas with an IANA zone and standard offset', async ({ page }) => {
  await seed(page);
  const msg = await runImport(page, { jyotish_charts: [
    chart('Aleya', '1980-05-12', { lat: '34.0167', lon: '-118.4833', tz: -7, locationName: 'Santa Monica, CA, USA' }),
    chart('Omesh', '1972-05-14', { lat: '31.1000', lon: '77.1667', tz: 5.5, locationName: 'Simla Himachal Pradesh' }),
    chart('Second', '1990-01-01', { lat: '34.0167', lon: '-118.4833', tz: -8, locationName: 'Santa Monica, CA, USA' }),
  ] });
  expect(msg).toContain('New atlas locations: 2');
  const atlas = await stored(page, 'jyotish_atlas');
  expect(atlas['Santa Monica, CA, USA']).toEqual({ lat: '34.0167', lon: '-118.4833', tz: -8, tzName: 'America/Los_Angeles' });
  expect(atlas['Simla Himachal Pradesh']).toEqual({ lat: '31.1000', lon: '77.1667', tz: 5.5, tzName: 'Asia/Kolkata' });
  expect(atlas.Home).toEqual(HOME.Home); // untouched

  // Charts keep their own recorded offsets (DST included), not the atlas's.
  const charts = await stored(page, 'jyotish_charts');
  expect(charts.find(c => c.name === 'Aleya').tz).toBe(-7);
});

test('a location within ~2 km of an existing atlas entry reuses it instead of adding a near-duplicate', async ({ page }) => {
  await seed(page);
  const msg = await runImport(page, { jyotish_charts: [
    chart('Near', '1980-01-01', { lat: '47.0100', lon: '-122.0050', locationName: 'Home Town, WA' }),
  ] });
  expect(msg).toContain('New atlas locations: 0');
  expect(msg).toContain('matched to existing nearby locations: 1');
  const atlas = await stored(page, 'jyotish_atlas');
  expect(Object.keys(atlas)).toEqual(['Home']);
  const charts = await stored(page, 'jyotish_charts');
  expect(charts[0].locationName).toBe('Home');
});

test('same place name far away gets its own coordinate-suffixed entry, not an overwrite', async ({ page }) => {
  await seed(page, { atlas: { Hartford: { lat: '41.7637', lon: '-72.6851', tz: -5, tzName: 'America/New_York' } } });
  await runImport(page, { jyotish_charts: [
    chart('Chrystel', '1959-09-27', { lat: '43.3167', lon: '-88.3833', tz: -5, locationName: 'Hartford' }),
  ] });
  const atlas = await stored(page, 'jyotish_atlas');
  expect(atlas.Hartford.lat).toBe('41.7637');
  expect(atlas['Hartford (43.32, -88.38)']).toMatchObject({ lat: '43.3167', lon: '-88.3833', tzName: 'America/Chicago' });
  const charts = await stored(page, 'jyotish_charts');
  expect(charts[0].locationName).toBe('Hartford (43.32, -88.38)');
});

test('charts without a location name are imported but reported, not added to the atlas', async ({ page }) => {
  await seed(page);
  const msg = await runImport(page, { jyotish_charts: [chart('Nameless', '1970-01-01', { lat: '10.0', lon: '10.0' })] });
  expect(msg).toContain('Charts added: 1');
  expect(msg).toContain('no location name');
  expect(Object.keys(await stored(page, 'jyotish_atlas'))).toEqual(['Home']);
});

test('merge never replaces the existing atlas when the file carries one', async ({ page }) => {
  await seed(page);
  await runImport(page, { jyotish_atlas: {
    Home:  { lat: '1.0000', lon: '1.0000', tz: 0 },     // conflicting -> existing wins
    Paris: { lat: '48.8566', lon: '2.3522', tz: 1, tzName: 'Europe/Paris' },
  } });
  const atlas = await stored(page, 'jyotish_atlas');
  expect(atlas.Home).toEqual(HOME.Home);
  expect(atlas.Paris.tzName).toBe('Europe/Paris');
});

test('falls back to the chart offset when the tz lookup fails', async ({ page }) => {
  await page.route('**/api/v1/tz-lookup', route => route.fulfill({ status: 500, body: 'boom' }));
  await seed(page);
  const msg = await runImport(page, { jyotish_charts: [
    chart('Omesh', '1972-05-14', { lat: '31.1000', lon: '77.1667', tz: 5.5, locationName: 'Simla' }),
  ] });
  expect(msg).toContain('Time zone lookup failed');
  const atlas = await stored(page, 'jyotish_atlas');
  expect(atlas.Simla).toEqual({ lat: '31.1000', lon: '77.1667', tz: 5.5 });
});

test('re-importing repairs saved charts whose location is missing from the atlas', async ({ page }) => {
  // State left by the old Import (no atlas step): charts saved with a
  // locationName that has no atlas entry.
  const santa = chart('Aleya', '1980-05-12', { lat: '34.0167', lon: '-118.4833', tz: -7, locationName: 'Santa Monica, CA, USA' });
  const simla = chart('Omesh', '1972-05-14', { lat: '31.1000', lon: '77.1667', tz: 5.5, locationName: 'Simla Himachal Pradesh' });
  await seed(page, { charts: [{ ...santa, id: 'a' }, { ...simla, id: 'b' }] });
  const msg = await runImport(page, { jyotish_charts: [santa, simla] });
  expect(msg).toContain('Charts added: 0');
  expect(msg).toContain('duplicates skipped: 2');
  expect(msg).toContain('New atlas locations: 2');
  expect(msg).toContain('now linked: 2');
  const atlas = await stored(page, 'jyotish_atlas');
  expect(atlas['Santa Monica, CA, USA'].tzName).toBe('America/Los_Angeles');
  expect(atlas['Simla Himachal Pradesh'].tzName).toBe('Asia/Kolkata');
  const charts = await stored(page, 'jyotish_charts');
  expect(charts.map(c => c.id).sort()).toEqual(['a', 'b']); // same records, not re-added
});
