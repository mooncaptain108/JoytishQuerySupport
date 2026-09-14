# Change Notes — committed 2026-07-18 (server commit `378515f`)

Covers everything since the last commit (`0260684`, the original house-boundary
MEP fix). All of it is now committed on `/home/mooncaptain/jyotish-chart-saas`,
branch `trunk` — one commit, not yet pushed to `origin`.

## 1. Strength-analysis consolidation (Python is now the source of truth)

Python (`services/muhurta_analysis.py`) and the JS copy in `static/index.html`
had drifted. Python (used only by the background muhurta search) was missing:

- 3 of 4 "sun-like" strength boosts (`isSunLikePlanet` / `inSunLikeHouse` / `inLeo`)
- The final degree cap (a planet starting below 100% could get boosted past it)
- Rule 5d in `screen_muhurta` entirely (Lagna Lord MEP-proximity checks)

Also fixed, found during the port:
- Direct-affliction loss was inverted (keyed to special/chainSpecial instead of
  planet strength — exactly backwards)
- Non-MT house-strength calc treated every Rahu/Ketu affliction as "special"
  regardless of conjunction
- Functional-malefic self-affliction was unconditionally skipped (an FM should
  be able to afflict its own occupied house's MEP unless it's in its own
  Moolatrikona sign)

All of the above are now identical in both languages. `IDEAL_CFG` is
canonicalized server-side (`GET /api/v1/muhurta/ideal-cfg`); `POST /api/v1/chart`
takes an `include_analysis` flag so the chart-paint path can get server-computed
analysis with no extra round trip; new `POST /api/v1/muhurta/screen` recomputes
analysis + screening server-side from an already-fetched chart. New test file
`tests/test_muhurta_analysis.py` (13 tests) covers all of it, including a
golden-value regression case.

On the frontend, `renderChart`, `generateStrengthReport`, `showMuhurtaEval` and
`openAnalysisDialog` now prefer server-computed analysis when available, with
dead JS (`screenMuhurta`, `mepAff`) deleted after confirming no callers.

**Landmine already hit and fixed:** `dashaColor()` reads `lastAnalysis[graha].color`
directly — it must stay the *decorated* analysis object, not the raw one.

## 2. Original house-boundary MEP bug + its own regression

The reported bug (Rahu at 29:58° in house 2 not detected as afflicting house
3's MEP at 0:22°, a cross-rashi-boundary case) is fixed via a combined
`mep_orb()` / `mepOrb()` helper — the *minimum* of two distinct mechanisms:
classical-aspect projection (gated, plain degree subtraction) and physical
boundary bleed-over (rashi-aware circular distance, ungated). The first fix
attempt replaced the aspect mechanism outright and broke a real classical-aspect
boost (Mars); combining both via `min()` was the correct fix and is now the
standard pattern for all MEP-proximity checks.

## 3. Transit Views feature (new)

- **View menu** (Chart / Transits / Chart & Transits) — visible only when a
  real (non-muhurta-result) chart is loaded.
- **Transits popover** — draggable, location/lat/lon/UTC/date/time controls,
  defaults to now + the natal chart's own location, recomputes on every change.
- **Transits view** — transit planet positions painted on the natal ascendant
  (same houses, same visual style as the main chart).
- **Chart & Transits view** — natal + transit planets overlaid in the same
  house wheel, one line per planet in degree order, transit lines prefixed
  with a lowercase `t`.
- **Chart & Transits analysis** — a separate, simpler analysis mode: no
  house/planet strength, just conjunctions/aspects within 5° between natal
  and transit positions, in two sections (transit-over-natal, natal-over-transit).
- Backend: `POST /api/v1/chart/transit` + `compute_transit_positions()` — a
  cheap lookup (skips divisional charts/dasha/panchanga) since the popover
  calls it on every control change.
- Added an **Analyze button directly on the Transits dialog** — `dlgTransits`
  opens via `showModal()`, which makes the main toolbar's Analysis button
  inert while it's open, so this was needed for the Analyze action to be
  reachable at all while Transits is showing. Because `showModal()` dialogs
  nest, opening Analysis this way keeps the Transits popover open underneath
  rather than closing it.

## 4. UI/UX polish (this week, on top of Transit Views)

- **Theme fix**: Transits popover + New Chart dialog lat/lon/UTC fields had a
  hardcoded dark background/grey text regardless of theme (inline styles beat
  the light-theme CSS override) — now inherit the normal themed input styling.
- **Transit label**: prefix changed from `"t "` to `"t"` for tighter alignment;
  the `t` itself is now theme-aware color (was hardcoded black, invisible in
  dark mode).
- **Benefic/malefic coloring**: each planet's name in the Analysis dialog is
  now green (functional benefic) or red (functional malefic) — in both the
  main analysis view and the Chart & Transits cross-analysis view.
- **Chart title**: now always shows natal chart info in all three view modes
  (Chart / Transits / Chart & Transits) instead of switching to transit info —
  the always-open Transits popover already covers "what transit moment is this."
- **Stepper buttons**: Mo/Day/Year and Hr/Min/Sec/AM-PM stepper pairs added
  below the Transits dialog's date/time row, left-aligned under their
  respective controls. Month/year steppers clamp the day to the target
  month's length (e.g. Jan 31 + 1 month → Feb 28) instead of JS's native
  roll-over behavior. AM/PM up/down go +12/-12 hours respectively.
- **Seconds precision**: New Chart and Transits date/time controls now accept
  seconds (`step=1`), since sub-minute precision affects ascendant degree and
  the starting dasha period when cross-checking against other applications —
  and is handy for lining up an exact full moon time in Transits. Legacy saved
  charts without seconds still load correctly via a small `ensureSeconds()`
  normalizer that pads only when needed.

## Decided against, for now

- A user-facing date-format setting (dd/mm/yyyy vs mm/dd/yyyy vs yyyy-mm-dd).
  Investigated: all display-only dates in the app already use the raw ISO
  `YYYY-MM-DD` string (no hardcoded US formatting to fix), so a display
  setting would've been low-effort — but the native `<input type="date">`
  controls already auto-adapt to each user's own browser/OS locale, and after
  reviewing the actual screens, decided the existing labeled/ISO display is
  fine as-is. No change made.

## Not yet done

- Everything above is user-tested except today's stepper/seconds/AM-PM
  changes and the benefic/malefic coloring — still pending your testing pass.
- One more feature planned after this testing round (not yet specified).
