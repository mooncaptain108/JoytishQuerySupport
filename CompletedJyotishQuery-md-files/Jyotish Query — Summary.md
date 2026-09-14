# Jyotish Query — Summary
Generated from reading session before break.

---

## Roadmap (from Jyotish-Query-NextSteps01.md)

1. Wire up the query form UI (collect location + time, submit, display chart)
2. Study functional malefics, conjunctions/aspects, planet strength rules
3. Implement planet strength scoring in backend or frontend
4. Color-code planets on the chart:
   - **Green** — mostly strong (minor affliction >1° acceptable)
   - **Blue** — combust
   - **Brown** — weaker than 80%
5. Iterative refinement: test multiple future charts one at a time
6. Once criteria are solid, implement forward-scanning batch query
7. Scanning strategy TBD — brute force (every minute) or smarter interval logic
8. User will provide additional criteria cut from yournetastrologer.com

---

## UI Requirements (from "activity flow for user.md")

- Input: location (lat/lon/tz — stays constant per run), start date/time
- Time is incremented programmatically per submission
- Each result is evaluated; **good** results are saved to a table (date/time/location)
- Checkbox: "Show chart when a good result is found" — if checked, pause and display; otherwise keep scanning
- Run until user stops or 1 month from start time (hard limit)

---

## Functional Malefics (from "Functional Malefics.md")

Always malefic: **Rahu, Ketu**

| Ascendant (Rashi #) | Functional Malefics | Most Malefic Planet (MMP) |
|---|---|---|
| 1 Aries | Mercury | Ketu (MMP) |
| 2 Taurus | Mars, Venus, Jupiter | Jupiter (MMP) |
| 3 Gemini | None | Ketu (MMP) |
| 4 Cancer | Jupiter, Saturn | Saturn (MMP) |
| 5 Leo | Moon | Moon (MMP) |
| 6 Virgo | Sun, Saturn, Mars | Mars (MMP) |
| 7 Libra | Mercury | Mercury (MMP) |
| 8 Scorpio | Venus, Mars | Venus (MMP) |
| 9 Sagittarius | Moon | Moon (MMP) |
| 10 Capricorn | Sun, Jupiter | Sun (MMP) |
| 11 Aquarius | Moon, Mercury | Mercury (MMP) |
| 12 Pisces | Sun, Venus, Saturn | Venus (MMP) |

---

## Moolatrikona Signs (from "signs.md")

| Planet | Moolatrikona Sign # | Sign Name |
|---|---|---|
| Sun | 5 | Leo |
| Moon | 4 | Cancer |
| Mars | 1 | Aries |
| Mercury | 6 | Virgo |
| Jupiter | 9 | Sagittarius |
| Venus | 7 | Libra |
| Saturn | 11 | Aquarius |
| Rahu | — | N/A |
| Ketu | — | N/A |

---

## Conjunctions & Aspects (from "conjunctions_and_aspects.md")

- **Orb**: 5° for conjunction/aspect influence on a planet or house MEP
- **MEP** (Most Effective Point) of each house = the rising degree of the lagna
- Every planet casts a **7th house aspect** (180° away)
- Special aspects (in addition to 7th):
  - Mars: 4th and 8th house aspects
  - Jupiter: 5th and 9th house aspects
  - Saturn: 3rd and 10th house aspects
  - Rahu/Ketu: 5th and 9th house aspects
- Aspect strength = same as conjunction strength; degree of overlap increases the effect
- Focus: whether conjunction/aspect makes a planet or house **weak**

---

## Planet Strength Rules (from "Strength_of_planet.md")

### Base Strength by Degree-in-Sign
- Strong: 5°–25° within sign (100%)
- At 4° or 26°: 80%
- At 3° or 27°: 60%
- Continues to 0% at 0° or 30° (infancy/old age)

### Dispositor
- The dispositor of a planet is the ruler of the moolatrikona sign the planet occupies
- A planet's strength is **capped** at its dispositor's strength
- Chain: if dispositor is weak, all planets in that moolatrikona sign are weakened

### Loss of Strength
- a) Moolatrikona MEP afflicted by functional malefic: −75%
- b) Weak planet in afflicted house: −75%
- c) Strong planet in afflicted non-moolatrikona house: −50%
- d) Closely afflicted (<1°) weak planet: −75% (operates at 25%)
- e) Closely afflicted (<1°) strong planet: −50%
- f) Combustion (−75% if Sun is FM; −50% if Sun is FB):
  - Mercury <14°, Venus <10°, Mars <17°, Jupiter <11°, Saturn <16°, Moon <12°
- g) Placement in dushtana (6/8/12): −50%
- h) Debilitation: −50%; debilitated in both rasi+navamsa: −75%
- i) Badly placed + navamsa debilitation: −60%
- j) Badly placed in debilitation: −75%
- k) Navamsa debilitation only: −25%

### Special/Multiple Afflictions (orb extends to 2°)
1. Conjunction/aspect from Most Malefic Planet
2. Aspect from FM placed in dushtana
3. Conjunction with Rahu or Ketu (i.e. not just aspected by one but conjunct)Rahu-Ketu axis
4. Aspect from FM that is itself afflicted by another FM
5. More than one FM at the same time

### Gain of Strength
- Exact (<1°) strong functional benefic conjunction/aspect in good house: +50%
- Exact (<1°) strong FB in malefic house: +25%
- Close (1°–5°) FB in malefic house: +12.5%
- Decline: 10% per degree, zero at 5°
- Weak FB exact conjunction: +12.5% only

### Fairly Strong = ≥70% power, unafflicted, well placed

---

## Color Coding Plan for Chart

| Color | Condition |
|---|---|
| Green | Strong (≥70%), unafflicted, or minor affliction >1° |
| Blue | Combust |
| Brown | Weak (<80% strength) |

---

## Key Implementation Notes

- The chart page (`/static/chart.html`) currently loads Paul's test data from the API
- `config.py` and `constants/grahas.py` now use `swe.TRUE_NODE` for Rahu/Ketu
- Server runs on port 8000, Caddy proxies HTTPS at jyotish.pn.net
- Project at `/home/mooncaptain/jyotish-chart-saas` on `ssh mooncaptain@jyotish`
