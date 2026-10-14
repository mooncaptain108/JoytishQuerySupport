const { test, expect } = require('@playwright/test');

// Settings > Mobile display bolds chart text (font-weight) and, to match, the
// planet glyphs -- SVG line drawings shown via <use>, so their line widths
// come from inherited custom properties (--gph-sw etc.) on body.chart-bold.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.route('**/static/Open.md**', route => route.fulfill({ body: '# Jyotish Query\n\nWelcome.' }));
  await page.goto('/');
});

const vars = page => page.evaluate(() => {
  const cs = getComputedStyle(document.body);
  return ['--gph-sw', '--gph-sw-node', '--gph-fill-sw'].map(v => cs.getPropertyValue(v).trim());
});

test('glyph line widths are thicker only with Mobile display on', async ({ page }) => {
  expect(await vars(page)).toEqual(['', '', '']); // symbols fall back to their original 2 / 2.3 / 0
  await page.evaluate(() => document.body.classList.add('chart-bold'));
  expect(await vars(page)).toEqual(['2.9px', '3.1px', '0.9px']);
});

test('every planet glyph stroke reads its width from the custom properties', async ({ page }) => {
  const bad = await page.evaluate(() => [...document.querySelectorAll('symbol[id^="g-"] *')]
    .filter(el => el.hasAttribute('stroke') && !/var\(--gph-(sw|sw-node|fill-sw)/.test(el.getAttribute('style') || ''))
    .map(el => el.closest('symbol').id + ' ' + el.tagName));
  expect(bad).toEqual([]);
});
