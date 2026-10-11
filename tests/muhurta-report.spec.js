const { test, expect } = require('@playwright/test');

// Muhurta popover's Report button (generateSummaryReport):
// - DD-MMM-YYYY dates
// - location printed once as a "Location:" header (repeated when it changes),
//   not on every line, and no lon/lat
// - same order as the results list: Gemini by date first, then other signs by
//   date -- regardless of the stored (arrival) order

test.beforeEach(async ({ page }) => {
  await page.route('**/static/Open.md**', route =>
    route.fulfill({ body: '# Jyotish Query\n\nWelcome.' })
  );
  await page.addInitScript(() => {
    localStorage.setItem('jyotish_hide_welcome', '1');
    localStorage.setItem('jyotish_atlas', JSON.stringify({
      Home:  { lat: '47.0', lon: '-122.0', tz: -8 },
      Delhi: { lat: '28.6', lon: '77.2',   tz: 5.5 },
    }));
  });
  await page.goto('/');
});

async function report(page, results) {
  return page.evaluate((results) => {
    setMuhurtaResults(results);
    generateSummaryReport();
    return document.getElementById('mStrReport').value;
  }, results);
}

test('dates are DD-MMM-YYYY and location is a header, not per line', async ({ page }) => {
  const out = await report(page, [
    { dt: '2026-10-11 09:05', sign: 5, signName: 'Leo', loc: 'Home' },
    { dt: '2026-10-11 09:20', sign: 5, signName: 'Leo', loc: 'Home' },
    { dt: '2027-01-03 14:00', sign: 5, signName: 'Leo', loc: 'Home' },
  ]);
  expect(out.split('\n')).toEqual([
    'Location: Home',
    '11-Oct-2026  9:05 AM  UTC-08:00  Leo (lasts for 15 minutes)',
    '03-Jan-2027  2:00 PM  UTC-08:00  Leo (lasts for 0 minutes)',
  ]);
  expect(out).not.toContain('-122.0000');
  expect(out).not.toContain('47.0000');
});

test('a new Location header starts whenever the location changes', async ({ page }) => {
  const out = await report(page, [
    { dt: '2027-01-03 14:00', sign: 5, signName: 'Leo', loc: 'Home' },
    { dt: '2027-01-05 06:00', sign: 5, signName: 'Leo', loc: 'Delhi' },
  ]);
  expect(out.split('\n')).toEqual([
    'Location: Home',
    '03-Jan-2027  2:00 PM  UTC-08:00  Leo (lasts for 0 minutes)',
    '',
    'Location: Delhi',
    '05-Jan-2027  6:00 AM  UTC+05:30  Leo (lasts for 0 minutes)',
  ]);
});

test('sorted Gemini-first then by date, matching the results list, whatever the stored order', async ({ page }) => {
  // Arrival order as parallel workers might deliver it: out of date order,
  // signs interleaved, and one Gemini window's two rows split apart.
  const out = await report(page, [
    { dt: '2026-11-02 07:00', sign: 5, signName: 'Leo',    loc: 'Home' },
    { dt: '2026-10-20 10:30', sign: 3, signName: 'Gemini', loc: 'Home' },
    { dt: '2026-10-12 08:00', sign: 7, signName: 'Libra',  loc: 'Home' },
    { dt: '2026-10-15 09:00', sign: 3, signName: 'Gemini', loc: 'Home' },
    { dt: '2026-10-20 10:00', sign: 3, signName: 'Gemini', loc: 'Home' },
  ]);
  expect(out.split('\n')).toEqual([
    'Location: Home',
    '15-Oct-2026  9:00 AM  UTC-08:00  Gemini (lasts for 0 minutes)',
    '20-Oct-2026  10:00 AM  UTC-08:00  Gemini (lasts for 30 minutes)',
    '12-Oct-2026  8:00 AM  UTC-08:00  Libra (lasts for 0 minutes)',
    '02-Nov-2026  7:00 AM  UTC-08:00  Leo (lasts for 0 minutes)',
  ]);

  // Same order the results list renders.
  const listOrder = await page.evaluate(() => {
    renderMuhurtaResults();
    return muhurtaRenderedResults.map(r => r.dt);
  });
  expect(listOrder).toEqual([
    '2026-10-15 09:00', '2026-10-20 10:00', '2026-10-20 10:30',
    '2026-10-12 08:00', '2026-11-02 07:00',
  ]);
});
