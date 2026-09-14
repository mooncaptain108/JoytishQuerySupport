# Affliction Formulas

These are the interpolated (graduated) formulas used in this implementation.
V.K. Choudhry's original system describes step-function thresholds; the graduation
here is a design choice to smooth transitions.

#### NOTE: Rules regarding afflictions within 1° and special afflictions within 2° are now applied in full for otherwise strong planets. I.E. A
---
---

## Direct FM Affliction of a Planet

```
loss = baseLoss × (1 − orb / dmgOrb)
remaining = currentStrength × (1 − loss)
```

### Regular affliction — strong target planet

- `baseLoss = 0.50`, `dmgOrb = 1°`

| Orb  | Loss | Remaining |
|------|------|-----------|
| 0°   | 50%  | 50%       |
| 0.25°| 38%  | 63%       |
| 0.5° | 25%  | 75%       |
| 0.75°| 13%  | 88%       |
| 1°   | 0%   | 100% (not damaging) |

### Special affliction — strong target planet

Triggered by: MMP, Ra/Ke conjunction, FM in dushtana (including own MT sign), chain-FM.

- `baseLoss = 0.75`, `dmgOrb = 2°`

| Orb  | Loss | Remaining |
|------|------|-----------|
| 0°   | 75%  | 25%       |
| 0.5° | 56%  | 44%       |
| 0.9° | 41%  | 59%       |
| 1°   | 38%  | 63%       |
| 1.5° | 19%  | 81%       |
| 2°   | 0%   | 100% (not damaging) |

### Any affliction — weak target planet

A planet is weak if it has any of: degree weakness, combust, debilitated, in dushtana.
Weak planets use `dmgOrb = 5°` regardless of regular/special.
`baseLoss` is still 0.50 (regular) or 0.75 (special).

Example — regular affliction, weak target (`baseLoss = 0.50`, `dmgOrb = 5°`):

| Orb  | Loss | Remaining (from 50% combust base) |
|------|------|-----------------------------------|
| 0°   | 50%  | 25%                               |
| 1°   | 40%  | 30%                               |
| 2°   | 30%  | 35%                               |
| 3°   | 20%  | 40%                               |
| 4°   | 10%  | 45%                               |
| 5°   | 0%   | 50% (not damaging)                |

---

## MT House MEP Affliction

Applies to the lord of the planet's mooltrikona sign house.
FM must be aspecting the MEP of that house within 5°.

```
loss = 0.75 × (1 − orb / 5)
remaining = currentStrength × (1 − loss)
```

- Always `baseLoss = 0.75`, always `dmgOrb = 5°`
- No distinction between regular/special FM for the loss rate
- Exception: multiple FMs (2+, one within 2.5°) or Ra-Ke axis in MT house within 2° → flat −75% (remaining = 25%), not graduated

| Orb  | Loss | Remaining |
|------|------|-----------|
| 0°   | 75%  | 25%       |
| 1°   | 60%  | 40%       |
| 2°   | 45%  | 55%       |
| 2.5° | 38%  | 63%       |
| 3°   | 30%  | 70%       |
| 4°   | 15%  | 85%       |
| 5°   | 0%   | 100% (not damaging) |

---

## FB Boost of a Planet

```
boost = baseFactor × (1 − orb / boostOrb)
remaining = currentStrength × (1 + boost)
```

No upper cap — planets can exceed 100%.

### Strong FB (≥ 70% strength) — `boostOrb = 5°`

- `baseFactor = 0.50`

| Orb  | Boost | Example: 50% → |
|------|-------|-----------------|
| 0°   | +50%  | 75%             |
| 1°   | +40%  | 70%             |
| 2°   | +30%  | 65%             |
| 3°   | +20%  | 60%             |
| 4°   | +10%  | 55%             |
| 5°   | 0%    | 50% (no boost)  |

### Weak FB (< 70% strength) — `boostOrb = 1°`

- `baseFactor = 0.125`

| Orb   | Boost  | Example: 50% → |
|-------|--------|-----------------|
| 0°    | +12.5% | 56.25%          |
| 0.5°  | +6.25% | 53.13%          |
| 1°    | 0%     | 50% (no boost)  |

---

## Notes

- All losses and boosts are **multiplicative** (applied to current running strength, not base 100%).
- Pipeline order: degree → combust → debilitated → dushtana → FM direct → MT house → sun-like → FB boost → dispositor cap.
- Dispositor cap: planet's strength cannot exceed its dispositor's post-boost strength (cascades full chain).
