# Sun-like planet / sun-like house strength boosts — source quote and rule review

**Date:** 2026-09-06
**Trigger:** question about Sun-like planet strengths; do our rules over-count?

---

## Source quote — K. R. Chaudhary

> "Now suppose Aries is rising and if Jupiter is in the 9th house (Sun-Like) in its
> own mooltirkona sign but in infancy (2.5 degrees) and Jupiter is unafflicted,
> then its strength would be 50% + a 25% increase for its being a sun-like planet
> which is equal to 62.5%. In this example, if Jupiter had been placed in either
> the 2nd or 3rd sun-like houses, then its strength would have a further additional
> rise of 25%. A planet being lord of a sun-like house and by being placed in
> another sun-like house can achieve a strength increase up to 100% in
> commensuration to its weakness when due to infancy or old age."

---

## The example, decoded

Aries lagna → Sagittarius = 9th house. Sagittarius is Jupiter's moolatrikona sign,
so Jupiter here is simultaneously:

1. in its **own MT sign** (Sagittarius), and
2. in a **sun-like house** (the 9th), and
3. a **sun-like planet** — its MT sign (Sagittarius) falls in a sun-like house (9th).

Jupiter at 2.5° is in infancy. Our degree rule (0°–5° scales 0→100%) puts it at
**50%**.

Chaudhary then applies **one** 25% increase → 50% × 1.25 = **62.5%**.

The *second* 25% is only available under a **separate, distinct** condition:
being **lord of a sun-like house** (Jupiter = 9th lord) **and placed in a
*different* sun-like house** (the 2nd or 3rd). That would give a further ×1.25.

The whole mechanism is explicitly bounded: "up to 100% in commensuration to its
weakness when due to infancy or old age." It is a **recovery** device for
degree-based weakness, ceiling 100%.

---

## How our current rules handle the same Jupiter

`static/AnalysisRules.md` → "Sun-Like Planet Rules", implemented in
`services/muhurta_analysis.py:494-498`:

```python
sun_like_boost = False
if is_sun_like_planet:                           sp *= 1.25   # (1)
if in_own_mt        and not mep_house_afflicted: sp *= 1.25   # (2)
if in_sun_like_house and not mep_house_afflicted: sp *= 1.25   # (3)
if in_leo           and not mep_house_afflicted: sp *= 1.25   # (4)
```

Four independent boosts that stack. For the quote's Jupiter, (1), (2) and (3)
are all true:

    50% × 1.25 × 1.25 × 1.25 ≈ 97.7%   (degree cap at muhurta_analysis.py:574
                                        only bites once strength would exceed
                                        100%, so it lands near 98%)

Chaudhary's answer for the identical placement is **62.5%**.

---

## Assessment — yes, this looks like over-counting

The user's read is correct, and the gap is wider than just "MT sign + sun-like
house":

1. **MT-sign occupancy is not a standalone boost in the quote.** Jupiter is in
   its own MT sign and that contributes *zero* separate increase. MT-sign
   occupancy is the *qualifying condition* that makes Jupiter a sun-like planet
   (its MT sign lands in a sun-like house) — not an independent +25%. Our rule
   (2) "in own Moolatrikona sign (any house) +25%" has no counterpart in the
   example.

2. **"Sun-like planet" and "in a sun-like house" are the same fact here.** A
   planet is a sun-like planet *because* its MT sign is in house 2/3/9. If it
   also physically sits in that house in that sign, our rules (1) and (3) both
   fire on one situation. Chaudhary counts it once.

3. **The genuine second boost needs a distinct configuration:** lord of one
   sun-like house **and** occupant of a *different* sun-like house. Our rules
   grant a second (and third) boost for any combination of the four conditions,
   with no "must be a distinct house / distinct reason" test.

4. **Framing and ceiling.** The quote treats these increases as recovery from
   infancy/old-age weakness, capped at 100%. Our engine lets the sun-like
   boosts stack with exaltation and D9 exaltation and exceed 100% freely; the
   only backstop is the `degPct < 1.0` degree cap (a planet at full degree
   strength is not capped at all and can be inflated well past 100%).

---

## Implemented 2026-09-06 (`jyotish-chart-saas` trunk `1c2fff3`)

Per the user ("keep the 25% for MT-sign placement; sun-like planet and MT-sign
placement can't be additive"): a planet in its own Moolatrikona sign now takes
the MT-sign +25% **alone** — the sun-like-planet and sun-like-house boosts are
suppressed for it (same placement fact). The "sun-like planet in a *different*
sun-like house" two-boost case (Chaudhary's "further additional rise of 25%")
is preserved. The Leo boost and the 100% / degree cap are unchanged.

Changed in `muhurta_analysis.py`, the `index.html` JS fallback analyzer, the
Analysis popover breakdown, and `AnalysisRules.md`; regression tests added.
Live check: the "Syed" chart (Pisces rising, Mars in the 2nd = Aries) went
from Mars ≈ 1.95 to **1.25**.

The 100% cap remains an open, separate item (has its own source support).

---

## Suggested direction — as originally proposed

- Fold the placement boosts into **two** mutually-distinct conditions:
  - **a.** planet is a *sun-like planet* (MT sign in house 2/3/9) → one ×1.25
  - **b.** planet is *lord of a sun-like house* **and** *occupies a different
    sun-like house* → one ×1.25
- Drop standalone "in own MT sign (any house) +25%" and "in house 2/3/9 (any
  sign) +25%" as independent stackers.
- Keep the recovery framing: cap the sun-like contribution so it cannot take a
  planet above 100%, and consider whether it should apply at all to a planet
  already at 100% degree strength (the quote's "in commensuration to its
  weakness").
- Re-examine the **Leo** boost (rule 4) by the same logic — Leo is the Sun's own
  MT sign, so "in Leo" overlaps "sun-like house / sun-like planet" reasoning the
  same way.

## Caveats before changing anything

- This is **one quote from one author.** Our current rules cite
  yournetastrologer.com and Choudhry's *Impact of the Rising Signs*; re-read
  those sections for any reconciling nuance (e.g. whether MT-sign occupancy is
  meant as a separate dignity boost elsewhere in that material).
- Strength percentages feed **muhurta scoring** and every **Analysis popover**,
  so a change here moves results broadly. Worth a before/after diff on a set of
  saved charts.
