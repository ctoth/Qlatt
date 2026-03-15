# Report: Verdict 09 — Duration Models

## Task
Read 20 assigned papers on duration modeling, audit every duration rule in Qlatt against the literature, write verdict.

## Papers Read
19 of 20 assigned papers read. **Byrd & Saltzman 2003 is not in the paper collection** (no folder found).

## Verdict File
`research/verdicts/09-duration-models.md`

## Key Findings

### HIGH Priority

1. **Missing incompressibility floor.** Klatt 1976 Eq. 1 defines D_min (~0.42-0.45 * D_inherent) as a compression floor. Qlatt stacks multiplicative rules without this floor. A word-medial unstressed consonant gets 0.7 * 0.85 * 0.8 = 0.476x inherent duration, potentially below physiological minimums.

2. **Pre-boundary lengthening scope too broad.** Wightman 1992 shows lengthening is confined to the RHYME of the final syllable (onset correlation with break index: -0.001). Qlatt's rule applies to all segments within the word preceding a SIL, incorrectly lengthening onset consonants.

### MEDIUM Priority

3. **No position conditioning on vowel voicing effect.** The 1.6x voiced-fricative lengthening applies uniformly, but Klatt 1976 and van Santen 1994 show this effect is negligible phrase-medially (~10-20 ms, below JND).

4. **No cluster shortening rules.** Klatt 1973 provides five specific rules. Consonants in /sp/, /st/, /sk/ clusters will be too long without them.

5. **No polysyllabic shortening.** Klatt 1976 Rule 4 (K=0.78 for polysyllabic words) is not implemented.

6. **Unstressed vowel multiplier too gentle.** Qlatt uses 0.8x; Klatt 1976 data implies ~0.55-0.7x total duration.

### What Qlatt Gets Right

- Break-index-scaled boundary lengthening with four levels (matches Wightman 1992)
- Sonorant vs. obstruent differential at boundaries (Crystal & House 1988)
- Fricative perceptual minimums (Jongman 1989)
- Stop unreleasing before stops (Crystal & House 1988)
- Word-initial consonant lengthening (White 2014)
- Accent x stress separation (van Santen 1994)

### Literature Hierarchy

- **Current best model architecture:** van Santen 1994 sums-of-products (r=0.93, 73% listener preference over Klatt). Full parameter values not published.
- **Current best boundary model:** Wightman 1992 (4 levels, rhyme-only scope)
- **Klatt 1976 status:** SUPERSEDED for model architecture by van Santen; individual factor values remain usable approximations.
- **Campbell & Isard 1991:** Complementary syllable-level framework, not yet integrated.

## Files Audited
- `public/rules/frontends/qlatt-english/phases/duration.yaml` — 14 rules, all citations checked
- `public/rules/frontends/qlatt-english/inventory.yaml` — base durations checked against literature
- `public/rules/frontends/qlatt-english/frontend.yaml` — policy parameter values checked

## Citation Accuracy
All 14 duration rules have citations. 11 of 14 citations are fully correct. 3 have partial issues:
- `word_medial_consonant_shortening`: cites K=0.7 but uses 0.85
- `stress_duration`: primary stress 1.3 is engineering estimate, not directly from Klatt 1976
- `duration_cap`: Klatt 1976 establishes floor not ceiling; 2.0x is engineering estimate (acknowledged)
