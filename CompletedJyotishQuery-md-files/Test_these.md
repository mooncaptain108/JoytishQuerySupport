Test_these.md
  
  1. Condition 5 — simplified: any allFmAspects.length >= 2 (both within 5°) triggers flat ×0.25 total loss. No
  more orb distance check. All FMs marked special/cond5.

  2. MT house MEP formula — new per-FM formula:
  - Regular FM: flat 75% within 1°, graduated 75%→0% from 1°–5°
  - Special FM: flat 75% within 2°, graduated 75%→0% from 2°–5°
  - Special determined by same 5 conditions (MMP, Ra/Ke conjunct, FM-in-dushtana, chain, MT-cond5)

  3. House of occupation MEP (new) — applies to any planet not in its own MT sign:
  - If occupied house is an MT sign → same flat+graduated formula
  - If non-MT sign → graduated baseLoss × (1−orb/5) over 0°–5°

  4. Direct FM affliction formula — based on planetIsStrong (strength after states ≥70%):
  - Strong: flat full baseLoss (50% regular, 75% special), nothing beyond 1°/2°
  - Weak: graduated baseLoss × (1−orb/5) over 0°–5°

  5. Pipeline order — now matches spec: states → MT house MEP → house occ MEP → direct FM (display and calc both
  in this order).

determine