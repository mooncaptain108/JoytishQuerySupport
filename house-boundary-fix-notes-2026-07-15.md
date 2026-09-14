# Session 2026-07-15 — house-boundary orb fix

## What was wrong
The 5° "sphere of influence" of functional malefics (including Rahu/Ketu) for
MEP-affliction calc was using raw `degree_in_rashi` subtraction, which is
nonsense when the FM and target straddle a rashi cusp. A Rahu at 28° in rashi
12 was reading as ~28° from a planet/MEP at 0° in rashi 1, instead of ~2°.

A second bug compounded it: `mep_deg` was treated as a single ASC fixpoint
applied across all 12 houses, when in fact each house has its own MEP at the
right cusp of that house (= degree 0 of the rashi that wedge opens onto,
except house 1 whose MEP coincides with the ASC).

## What was fixed
Two layers: the Python backend + the JS frontend. They MUST both be patched;
the live Analysis UI runs off the JS port.

### Python (`services/muhurta_analysis.py`)
- Added `abs_diff_deg(rashi_a, deg_a, rashi_b, deg_b)` helper.
- Added `mep_rashi(lr, house)` helper.
- Replaced 10 Math.abs-equivalent sites with `abs_diff_deg(...)`.
- Replaced all MEP-arithmetic comparing to `(lr, mep_deg)` with
  `(mep_rashi(lr, h), 0.0)` in:
  - `mt_raw` (MT-house MEP)
  - `occ_raw` (occupation-house MEP)
  - `Rule 5b` / `Rule 5c` MEP-orb checks
  - FB-boost to non-MT house
  - FM-affliction to non-MT house
- Dropped the `fm_aspected_houses(...)` aspect-gate from MEP-orb paths so any
  FM within 5° of MEP(N) afflicts house N, regardless of graha-drishti.

### JS (`static/index.html`)
- Same two helpers added next to `fmAspectedHouses`:
  `absDiffDeg(rashiA, degA, rashiB, degB)` and `mepRashi(lagnaRashi, house)`.
- 17 Math.abs call sites in `analyzeAllGrahas`/`screenMuhurta`
  rewritten using the new helpers.
- Aspect-gate dropped from the same MEP paths as Python.

## Files
- `services/muhurta_analysis.py` — md5 `de53866cda03cb2ebabd912979030b94`
- `static/index.html`           — md5 `31ab7eb392e5a840003062b133c2b8ff`
- Backups: `services/muhurta_analysis.py.bak.2026-07-15`,
  `static/index.html.bak.2026-07-15`
- Helper tool (unchanged this session): `scripts/analyze_export.py`

## Confirmed working (this session)
- Direct numeric probe: `absDiffDeg(3, 29.97, 4, 0.0)` = 0.03°.
- Mars case in `syed question 7/14/2026`: now correctly marked weak=True
  with `occAfflictions: Rahu, orb 0.025°, loss 0.75`. Before patch: silent.
- Service restarted; HTML being served contains the new helpers.

## Regression-test plan (per user, for next session)
1. User runs the production server with these patches applied.
2. User spot-checks charts that DIDN'T have the cusp-crossing geometry —
   those should match the previously-known-correct analysis values.
3. The fix is strictly additive for the cusp-cross case; for in-rashi
   planet pairs, `abs_diff_deg(a, b)` ≡ old `abs(a - b)` so no change.

## Things to remember
- The Python pipeline is only used by the **muhurta search**. The live
  Analysis UI uses the **JS port** in `static/index.html`. Both must be
  patched in lockstep for the user-visible fix to take effect.
- MEP(1) coincides with the ASC. MEP(N) for N != 1 lives at degree 0 of the
  rashi `((lr - 1 + (N - 1)) % 12) + 1`.
- Aspect-gate is still required on the direct FM→planet drishti path
  (lines around `afflictions`/`allFmAspects` in both ports), NOT on the
  MEP-orb path.
