const { test, expect } = require('@playwright/test');
const paulFixture = require('./fixtures/paul.json');

// Phone/tablet portrait layout (server bf2f138):
// - #mainRow was overflow:auto (swipe to the clipped right-hand panels); now
//   reverted to overflow:hidden so the inner scroll box doesn't keep Android's
//   browser bar pinned above the menu -- portrait clipping is the accepted cost.
// - The toolbar wraps instead of clipping its right-hand buttons.

const PORTRAIT = [
  { name: 'iPad portrait',  width: 820, height: 1180 },
  { name: 'phone portrait', width: 390, height: 844 },
];

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

for (const vp of PORTRAIT) {
  test(`${vp.name}: #mainRow is not its own scroll box`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await loadChart(page);

    const overflow = await page.evaluate(() => {
      const cs = getComputedStyle(document.getElementById('mainRow'));
      return [cs.overflowX, cs.overflowY];
    });
    expect(overflow).toEqual(['hidden', 'hidden']);
  });

  test(`${vp.name}: no explicit pan slider (swipe only)`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await loadChart(page);
    await expect(page.locator('#mainRow ~ input[type="range"], #mainRowPan, #panSlider')).toHaveCount(0);
  });

  test(`${vp.name}: every toolbar control is within the viewport`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await loadChart(page);
    const offenders = await page.evaluate((w) => {
      const out = [];
      for (const el of document.querySelectorAll('.toolbar > *')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width && r.right > w + 1) out.push((el.id || el.className || el.tagName) + ' @' + Math.round(r.right));
      }
      return out;
    }, vp.width);
    expect(offenders).toEqual([]);
  });

  test(`${vp.name}: transit bar fits the viewport`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await loadChart(page);
    await page.locator('#viewDropdown .tb-btn').first().click();
    await page.locator('#viewMenu button:text-is("Transits")').click();
    await expect(page.locator('#transitBar')).toBeVisible();
    for (const id of ['trNowBtn', 'trTime', 'trDate', 'trSlider', 'trUnit', 'trLoc']) {
      const b = await page.locator('#' + id).boundingBox();
      expect(b, id).not.toBeNull();
      expect(b.x + b.width, id).toBeLessThanOrEqual(vp.width + 1);
    }
  });
}
