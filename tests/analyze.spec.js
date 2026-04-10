// User-built TC analysis tests.
//
// Workflow:
//   1. Build a test in the app, save it.
//   2. Settings → Export All Data → save as tests/fixtures/user-export.json
//   3. Run: npx playwright test analyze
//
// Each saved test case (jyotish_utc_*) that has an 'expected' field is verified.
// Cases without 'expected' are skipped (no assertions yet declared).
//
// 'expected' format — add this field to a jyotish_utc_* entry in the export file:
//   "expected": {
//     "Sun":     { "isWeak": true,  "house": 1 },
//     "Moon":    { "isFM": true },
//     "Jupiter": { "isWeak": true,  "minStrength": 20, "maxStrength": 30 },
//     "Saturn":  { "isWeak": false, "minStrength": 90 }
//   }
// All per-planet fields are optional — only included ones are asserted.
// Available fields: isWeak (bool), isFM (bool), isMMP (bool), combust (bool),
//                   inOwnMT (bool), debilitated (bool), inDushtana (bool),
//                   house (1–12), minStrength (%), maxStrength (%)
//                   — strengthPct rounded to 0.1%

const { test, expect } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');

const USER_EXPORT = path.join(__dirname, 'fixtures', 'user-export.json');

const userCases = fs.existsSync(USER_EXPORT)
  ? Object.entries(JSON.parse(fs.readFileSync(USER_EXPORT, 'utf8')))
      .filter(([k]) => k.startsWith('jyotish_utc_'))
      .map(([, v]) => typeof v === 'string' ? JSON.parse(v) : v)
      .filter(tc => tc.expected)
      .sort((a, b) => a.name.localeCompare(b.name))
  : [];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jyotish_hide_welcome', '1'));
  await page.route('**/static/Open.md**', r => r.fulfill({ body: '' }));
});

for (const tc of userCases) {
  test(`user TC: ${tc.name}`, async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const an = await page.evaluate((chartData) => {
      const result = window.analyzeAllGrahas(chartData);
      const out = {};
      for (const [name, d] of Object.entries(result)) {
        if (name.startsWith('_')) continue;
        out[name] = {
          strengthPct: Math.round(d.strengthPct * 1000) / 10,
          isWeak:      d.isWeak,
          isFM:        d.isFM,
          isMMP:       d.isMMP,
          combust:     d.combust,
          inOwnMT:     d.inOwnMT,
          debilitated: d.debilitated,
          inDushtana:  d.inDushtana,
          house:       d.house,
        };
      }
      return out;
    }, tc);

    for (const [planet, exp] of Object.entries(tc.expected)) {
      const actual = an[planet];
      expect(actual, `${planet}`).toBeDefined();
      if (exp.isWeak      !== undefined) expect(actual.isWeak,      `${planet} isWeak`     ).toBe(exp.isWeak);
      if (exp.isFM        !== undefined) expect(actual.isFM,        `${planet} isFM`       ).toBe(exp.isFM);
      if (exp.isMMP       !== undefined) expect(actual.isMMP,       `${planet} isMMP`      ).toBe(exp.isMMP);
      if (exp.combust     !== undefined) expect(actual.combust,     `${planet} combust`    ).toBe(exp.combust);
      if (exp.inOwnMT     !== undefined) expect(actual.inOwnMT,     `${planet} inOwnMT`    ).toBe(exp.inOwnMT);
      if (exp.debilitated !== undefined) expect(actual.debilitated, `${planet} debilitated`).toBe(exp.debilitated);
      if (exp.inDushtana  !== undefined) expect(actual.inDushtana,  `${planet} inDushtana` ).toBe(exp.inDushtana);
      if (exp.house       !== undefined) expect(actual.house,       `${planet} house`      ).toBe(exp.house);
      if (exp.minStrength !== undefined) expect(actual.strengthPct, `${planet} min%`       ).toBeGreaterThanOrEqual(exp.minStrength);
      if (exp.maxStrength !== undefined) expect(actual.strengthPct, `${planet} max%`       ).toBeLessThanOrEqual(exp.maxStrength);
    }
  });
}
