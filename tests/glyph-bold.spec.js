const { test, expect } = require('@playwright/test');

// Interface Tweaks > Planet/Sign Glyphs Bold. Glyphs are SVG line drawings
// shown via <use>, so their line widths come from inherited custom
// properties set by body.tw-pg-bold / body.tw-sg-bold.

test.beforeEach(async ({ page }) => {
  await page.route('**/static/Open.md**', route => route.fulfill({ body: '# Jyotish Query\n\nWelcome.' }));
});

async function open(page, extra = {}) {
  await page.addInitScript((extra) => {
    localStorage.setItem('jyotish_hide_welcome', '1');
    for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v);
  }, extra);
  await page.goto('/');
}

const vars = page => page.evaluate(() => {
  const cs = getComputedStyle(document.body);
  return ['--gph-sw', '--gph-sw-node', '--gph-fill-sw', '--sgh-sw'].map(v => cs.getPropertyValue(v).trim());
});

test('glyph line widths are thicker only with the Bold tweaks on', async ({ page }) => {
  await open(page);
  expect(await vars(page)).toEqual(['', '', '', '']); // symbols fall back to their original widths
  await page.evaluate(() => document.body.classList.add('tw-pg-bold'));
  expect(await vars(page)).toEqual(['2.9px', '3.1px', '0.9px', '']);
  await page.evaluate(() => document.body.classList.add('tw-sg-bold'));
  expect((await vars(page))[3]).toBe('2.8px');
});

test('former Mobile display users are carried over to the equivalent tweaks once', async ({ page }) => {
  await open(page, { jyotish_chart_bold: '1' });
  const st = await page.evaluate(() => ({
    keys: ['jyotish_tw_chart_text_bold', 'jyotish_tw_pg_bold', 'jyotish_tw_analysis_plain', 'jyotish_tw_panel_white'].map(k => localStorage.getItem(k)),
    old: localStorage.getItem('jyotish_chart_bold'),
    cls: ['tw-chart-text-bold', 'tw-pg-bold', 'tw-analysis-plain', 'tw-panel-white'].map(c => document.body.classList.contains(c)),
  }));
  expect(st).toEqual({ keys: ['1', '1', '1', '1'], old: null, cls: [true, true, true, true] });
  expect((await vars(page))[0]).toBe('2.9px');
});

test('carry-over does not override a tweak the user already set', async ({ page }) => {
  await open(page, { jyotish_chart_bold: '1', jyotish_tw_panel_white: '0' });
  expect(await page.evaluate(() => localStorage.getItem('jyotish_tw_panel_white'))).toBe('0');
});

test('every glyph stroke reads its width from the custom properties', async ({ page }) => {
  await open(page);
  const bad = await page.evaluate(() => [...document.querySelectorAll('symbol[id^="g-"] *, symbol[id^="s-"] *')]
    .filter(el => el.hasAttribute('stroke') && !/var\(--(gph-sw|gph-sw-node|gph-fill-sw|sgh-sw)/.test(el.getAttribute('style') || ''))
    .map(el => el.closest('symbol').id + ' ' + el.tagName));
  expect(bad).toEqual([]);
});
