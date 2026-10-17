const { test, expect } = require('@playwright/test');

// Help > Report Errors opens its own page (static/ReportErrors.md); the text
// moved there out of Help > About.

test.beforeEach(async ({ page }) => {
  await page.route('**/static/Open.md**', route => route.fulfill({ body: '# Jyotish Query\n\nWelcome.' }));
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.goto('/');
});

async function helpItem(page, label) {
  await page.locator('#helpDropdown > .tb-btn').click();
  await page.locator(`#helpMenu button:text-is("${label}")`).click();
}

test('Report Errors sits next to About in the Help menu', async ({ page }) => {
  const items = await page.locator('#helpMenu button').allTextContents();
  expect(items.slice(-2)).toEqual(['Report Errors', 'About']);
});

test('Report Errors opens the error-reporting text', async ({ page }) => {
  await helpItem(page, 'Report Errors');
  const content = page.locator('#helpReportErrorsContent');
  await expect(content).toContainText('Report Errors');
  await expect(content).toContainText('fault of the programmer');
  await expect(content).toContainText('github.com/mooncaptain108/jyotish-chart-saas');
});

test('About no longer contains the Errors section', async ({ page }) => {
  await helpItem(page, 'About');
  const content = page.locator('#aboutContent');
  await expect(content).toContainText('Source Code');
  await expect(content).not.toContainText('fault of the programmer');
  await expect(content).not.toContainText('Errors!');
});

test('Report Errors and Interface Tweaks dialogs are draggable', async ({ page }) => {
  for (const [open, id] of [[() => openHelpReportErrors(), 'dlgHelpReportErrors'], [() => openTweaks(), 'dlgTweaks']]) {
    await page.evaluate(open);
    const dlg = page.locator('#' + id);
    const before = await dlg.boundingBox();
    const hb = await dlg.locator('.dlg-header').boundingBox();
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); // middle of the bar, clear of the close button
    await page.mouse.down();
    await page.mouse.move(hb.x + hb.width / 2 + 100, hb.y + hb.height / 2 + 60, { steps: 8 });
    await page.mouse.up();
    const after = await dlg.boundingBox();
    expect(after.x).toBeCloseTo(before.x + 100, 0);
    await page.evaluate((id) => document.getElementById(id).close(), id);
  }
});
