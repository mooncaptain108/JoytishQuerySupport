
  Affliction formula rework (full rewrite):
  - planetIsStrong computed from states only (degree/combust/debi/dushtana/D9) — determines flat vs graduated
  formula
  - Direct FM: strong planet → flat full loss within 1° (regular) or 2° (special), nothing beyond; weak →  graduated baseLoss×(1−orb/5) over 5°
  - MT house MEP: flat 75% within 1° (regular) or 2° (special), graduated tail to 5° — per-FM special detection
  using same 5 conditions
  - House of occupation MEP (new): skips own MT sign; MT-sign house → flat+graduated; non-MT → graduated only
  - Condition 5: simplified to allFmAspects.length >= 2 (after Ra-Ke merge), flat ×0.25 total
  - Pipeline order changed: states → MT house → house occ → direct FM

  Ra-Ke axis handling:
  - Ra and Ke always merged into single "Rahu-Ketu axis" entry before cond5 check
  - cond5 count uses merged list (Ra+Ke = 1 unique FM)
  - Chain-special merged correctly; display shows "Rahu-Ketu axis" with no "via" text

  Node (Rahu/Ketu) strength overhaul:
  - Nodes exempt from all reductions (debi/dushtana/afflictions) — shown informational only
  - Strength = occupied house strength (MT-sign house → lord's strengthPct; non-MT → house sp capped at 100%)
  - Node pass runs after houses are fully built
  - Display: "Strength from Scorpio (house 8)"
  - Non-MT signs have no lord in SAV — reverted dispositor to MOOLA_LORD only

  Display refinements:
  - Degree weakness labels: "Infancy" (0–5°), "Old Age" (25–30°)
  - Ordinal suffixes: "3rd aspect" not "3th aspect"
  - FB boost confirmed working via occupied house only (MT sign FB boost deferred — user found in notes it
  doesn't apply)

  Dasha panel:
  - Right of chart inside #mainRow, sized to chart height
  - Thin black border, internal scrollbar
  - Color-coded planet abbreviations from analysis
  - Current period highlighted, auto-scrolls to top on open
  - "Now" → scrolls current to top; "Top" → goes to beginning

  Ready to compact.