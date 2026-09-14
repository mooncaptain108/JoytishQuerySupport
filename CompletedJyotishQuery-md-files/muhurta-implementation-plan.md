# Muhurta Search — Implementation Plan

## What's already decided (fully spec'd, ready to code)

### UI (moveable popover / dlgMuhurta)
- Toolbar button "Muhurta" after Dasha button
- Location dropdown (from Atlas)
- Start date, start time (minute precision)
- Length in days 1–300
- Rising sign dropdown: 1-Aries, 3-Gemini, 5-Leo, 7-Libra, 9-Sagittarius (odd signs only)
- Stop-on-first checkbox
- Start / Stop buttons
- Progress line (day counter)
- Results list (scrollable, stored to localStorage key `jyotish_muhurta`)

### Storage
- Key: `MUHURTA_KEY = 'jyotish_muhurta'`
- Each record: `{ dt, loc, sign, signName, antarDasha, strongPlanets, strongHouses }`
- Revisiting stored muhurta dates: deferred (future feature)

### Lagna Ruler Table (from LagnaRuler.md)
```javascript
const LAGNA_RULER = {
  1:'Mars', 2:'Moon', 3:'Sun',  4:'Moon',   5:'Sun',    6:'Mercury',
  7:'Venus',8:'Jupiter',9:'Jupiter',10:'Saturn',11:'Saturn',12:'Mars'
};
```

### Nakshatra Lords (0-based, 27 elements)
```javascript
const NAK_LORDS_27 = [
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',  // 0-8
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',  // 9-17
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'   // 18-26
];
```

## Search Algorithm
1. For each day in range:
   - Sample every 2 hours (12 API calls) to bracket when target sign rises
   - Binary search within 2-hour bracket (~7 calls) to find exact start minute
   - Scan minute-by-minute from start until lagna.rashi changes away from target (~120 calls)
   - ~139 API calls/day total

## Screening (screenMuhurta(data, analysis))
"Afflicted" = any FM within 5° (flat threshold, no strong/weak distinction)

### DISMISS if any:
1. FM afflicts MEP of lagna ruler's MT sign house within 5°
2. FM afflicts MEP of house the lagna ruler occupies within 5°
3. Lagna ruler planet itself directly afflicted by FM within 5°
4. Any planet has `inDushtana === true` (badly placed; MT sign exemption already in flag)
5. Concentration of malefic influence:
   - a. Any special affliction anywhere in chart
   - b. 2+ distinct FMs afflicting MEP of same MT sign house
   - c. 1 FM afflicting MT sign house MEP AND that sign's lord is also afflicted
6. Active antardasha planet is FM, or node (Ra/Ke), or strength < 70%, or badly placed

### QUALIFY — must pass ALL three:
1. Moon's nakshatra lord is a FB (not FM, not Ra/Ke)
2. 2+ planets (Sun/Moon/Mars/Mercury/Jupiter/Venus/Saturn only) with strengthPct >= 0.70
3. 6+ houses with sp >= 0.70

### Active antardasha detection:
```javascript
const birthDt = new Date(data.birth_data.date + 'T' + data.birth_data.time);
// Find antardasha where start <= birthDt < end across data.dasha[].antardasha[]
```

## Helper functions needed
- `fetchChartAt(date, time, loc)` — POST to /api/v1/chart
- `minuteOffset(baseDateStr, baseMin, addMins)` — returns {date, time} strings (no JS timezone issues)
- `findSignWindowStart(dayStr, targetSign, loc)` — returns start minute (0-1439) or null
- `mepAff(targetHouse, data, fms, mepDeg)` — flat 5° FM-to-MEP check
- `pAff(name, analysis)` — any FM within 5° of planet (uses allFmAspects)

## Key constants already in code (accessible globally)
- `FUNC_MALEFICS` — FM sets by lagna rashi
- `MOOLA_RASHI` — planet → MT sign rashi
- `ASPECT_OFFSETS` — planet aspect patterns
- `RASHI_NAME` — rashi number → name string
- `analysis._houses` — house objects with `.sp` (strength, 0-1+)
- `analysis[graha].allFmAspects` — all FM aspects to planet (with .orb)
- `analysis[graha].mtAfflictions` — FM aspects to planet's MT sign house MEP
- `analysis[graha].inDushtana` — badly placed flag (MT sign exemption built in)
- `analysis[graha].strengthPct` — 0-1+ strength value

## Notes
- "Badly placed" = inDushtana only. Other weaknesses (debi, combust, afflicted) do NOT dismiss.
- Strong threshold = 0.70 for both planets and houses
- FM planets (including Moon/Mercury if FM for the sign) count toward strong planets
- Ra/Ke never count toward strong planets
- FM planets that are exalted or in MT sign still get strength boosts (boosts apply to all)
- Muhurta chart has its own dasha (not natal chart's dasha)
