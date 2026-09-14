# Test Charts — Logic Coverage

Available via the **Tests…** dropdown in the toolbar.

| Chart | Tests |
|-------|-------|
| TC1 · Degree, Dushtana, Sun-like | Weak by degree, debilitation, dushtana −50%, MT-in-dushtana exempt, sun-like +25%, dispositor cap |
| TC2 · FM Direct Affliction | MMP special within 2° (−75%), regular beyond 1° (not damaging), 7th aspect |
| TC3 · Dispositor Chain + MT MEP | Full 3-level dispositor cascade, MT house MEP graduated affliction |
| TC4 · Chain Affliction | FM afflicted by MMP → chain-special, stacks with other rules |
| TC5 · Rahu/Ketu Rules | Node degree exemption, no combust, MT-in-dushtana exempt, mutual aspect suppressed |

---

## TC1 · Degree, Dushtana, Sun-like
**Leo lagna (5), MEP 15°. FMs: Moon (MMP). Sun-like planets: Mercury (h2/Virgo), Venus (h3/Libra), Mars (h9/Aries)**

| Planet | Rashi | Deg | House | Expected |
|--------|-------|-----|-------|----------|
| Sun | Leo (5) | 3° | 1 | Weak 75% — degree weakness 60% × sun-like ×1.25 |
| Moon | Aries (1) | 15° | 9 | FM / MMP — Strong |
| Mars | Capricorn (10) | 15° | 6 | Dushtana −50% → Weak 50% |
| Mercury | Virgo (6) | 2° | 2 | Weak deg 40% × sun-like ×1.25 → Weak 50% |
| Jupiter | Capricorn (10) | 15° | 6 | Debilitated −50% + Dushtana −50% → Weak 25% |
| Venus | Libra (7) | 27° | 3 | Weak deg 60% × sun-like ×1.25 → Weak 75% |
| Saturn | Aquarius (11) | 15° | 7 | Strong 100% (self-MT) |
| Rahu | Gemini (3) | 15° | 11 | Strong |
| Ketu | Sagittarius (9) | 15° | 5 | Dispositor Jupiter (25%) → Weak 25% |

---

## TC2 · FM Direct Affliction
**Leo lagna (5), MEP 15°. Moon is MMP.**

| Planet | Rashi | Deg | House | Expected |
|--------|-------|-----|-------|----------|
| Sun | Leo (5) | 14.5° | 1 | Moon conj 0.5° special → −75% → Weak 25% |
| Moon | Leo (5) | 15° | 1 | FM / MMP |
| Mercury | Leo (5) | 16.8° | 1 | Moon 1.8° special → −75% → Weak 25% |
| Mars | Aquarius (11) | 15° | 7 | Moon 7th aspect 0° special → −75% → Weak 25% |
| Jupiter | Aries (1) | 15° | 9 | Unafflicted → Strong 100% |
| Venus | Gemini (3) | 15° | 11 | Unafflicted → Strong 100% |
| Saturn | Leo (5) | 17.5° | 1 | Moon 2.5° special — beyond 2° → NOT damaging (gray) → Strong 100% |
| Rahu | Cancer (4) | 15° | 12 | FM, no aspect to key planets |
| Ketu | Capricorn (10) | 15° | 6 | FM, aspects h2/h6/h10/h12 only |

---

## TC3 · Dispositor Chain + MT House MEP Affliction
**Leo lagna (5), MEP 15°. FMs: Moon (MMP).**
Chain: Mercury / Moon → Sun → Mars (weak)
MT house affliction: Moon in h9 (Aries = Mars's MT sign) at exactly MEP degree.

| Planet | Rashi | Deg | House | Expected |
|--------|-------|-----|-------|----------|
| Sun | Aries (1) | 9° | 9 | Strong by deg, dispositor Mars (10%) → capped Weak 10% |
| Moon | Aries (1) | 15° | 9 | FM/MMP — afflicts MEP of h9 (Mars's MT) at 0° |
| Mars | Scorpio (8) | 2° | 4 | Weak deg 40% × MT-house loss 75% → Weak 10% |
| Mercury | Leo (5) | 12° | 1 | Strong by deg, dispositor Sun (10%) → capped Weak 10% |
| Jupiter | Taurus (2) | 15° | 10 | Strong 100% |
| Venus | Libra (7) | 15° | 3 | Sun-like self-MT, Strong 100% |
| Saturn | Aquarius (11) | 15° | 7 | Strong 100% (self-MT) |
| Rahu | Gemini (3) | 15° | 11 | Strong |
| Ketu | Sagittarius (9) | 15° | 5 | Dispositor Jupiter (100%) → no cap |

---

## TC4 · Chain Affliction
**Scorpio lagna (8), MEP 15°. FMs: Venus (MMP), Mars. Sun-like: Jupiter (h2/Sagittarius), Moon (h9/Cancer)**

| Planet | Rashi | Deg | House | Expected |
|--------|-------|-----|-------|----------|
| Sun | Aquarius (11) | 15° | 4 | Mars chain-special 4th aspect 0° → −75% → Weak 25% |
| Moon | Taurus (2) | 15° | 7 | Venus MMP 7th aspect 0° → −75% → Weak 25% |
| Mars | Scorpio (8) | 16° | 1 | FM, chain-special (Venus MMP conjunct 1°) |
| Mercury | Sagittarius (9) | 15° | 2 | Dushtana? No — h2 not dushtana. Check: h8=dushtana for Sc. Merc in h2 → Strong 100% |
| Jupiter | Sagittarius (9) | 15° | 2 | Sun-like + MT sign → Strong 100% |
| Venus | Scorpio (8) | 15° | 1 | FM / MMP |
| Saturn | Aquarius (11) | 15° | 4 | Mars chain-special 4th aspect 1° → within 2° dmg orb → −75% → Weak 25% |
| Rahu | Cancer (4) | 15° | 9 | Dispositor Moon (25%) → Weak 25% |
| Ketu | Capricorn (10) | 15° | 3 | FM, unafflicted |

Note: Mercury and Jupiter are both in Sagittarius h2. Mercury in h2 is not a dushtana — no penalty.

---

## TC5 · Rahu / Ketu Rules
**Aries lagna (1), MEP 15°. FMs: Mercury (MMP = Ketu). Sun-like: Jupiter (h9/Sagittarius)**

| Planet | Rashi | Deg | House | Expected |
|--------|-------|-----|-------|----------|
| Sun | Leo (5) | 15° | 5 | Strong 100% (self-MT) |
| Moon | Cancer (4) | 15° | 4 | Strong 100% (self-MT) |
| Mars | Aries (1) | 15° | 1 | Strong 100% (self-MT) |
| Mercury | Virgo (6) | 15° | 6 | FM, own MT in dushtana h6 → EXEMPT from dushtana → Strong 100% |
| Jupiter | Taurus (2) | 15° | 2 | Strong 100% |
| Venus | Libra (7) | 15° | 7 | Strong 100% (self-MT) |
| Saturn | Aquarius (11) | 15° | 11 | Strong 100% (self-MT) |
| Rahu | Sagittarius (9) | 3° | 9 | No degree weakness shown (node exempt), dispositor Jupiter (100%) |
| Ketu | Gemini (3) | 3° | 3 | No degree weakness shown (node exempt), mutual aspect with Rahu suppressed |

Key checks:
- Rahu at 3° — a regular planet would show "Degrees: 60%" but Rahu shows nothing for degree
- Ketu at 3° — same exemption
- Mercury in Virgo (h6, dushtana) — no Dushtana line shown because it is in its own MT sign
- Rahu (h9) and Ketu (h3) — mutual 7th aspect not shown in either's analysis
