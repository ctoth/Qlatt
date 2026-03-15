# Verdict 07: Nasal Acoustics

## Scope

Are Qlatt's nasal acoustic models (nasal pole, nasal zero, place-specific antiformants, bandwidth additions, coupling parameters) consistent with the research literature? Should they be updated?

## Papers Reviewed

| Paper | Key Contribution to Verdict |
|-------|----------------------------|
| Fujimura 1962 | Pole-zero distributions for /m/, /n/, /ng/; antiformant frequencies by place |
| House & Stevens 1956 | Foundational analog study: F1 amplitude reduction (~8 dB) as primary nasality cue |
| Hawkins & Stevens 1985 | FNZ = (FNP + F1)/2 formula; pole-zero spacing 75-110 Hz at perceptual boundary |
| Chen 1997 | A1-P1 and A1-P0 measures; B1 addition from nasal coupling = +107 Hz |
| Maeda 1982 | Spectral flattening 300-2500 Hz as principal nasalization cue; sinus cavity role |
| Maeda 1993 | Four vowel-type spectral modification taxonomy; N1-N2 perceptual measure |
| Feng 1996 | Pharyngonasal target at Fn1~300 Hz, Fn2~1000 Hz; pole-zero evolution patterns |
| Ruhlen 1973 | Cross-linguistic nasal vowel typology (phonological, no acoustic data) |
| Beddor 1986 | Centre-of-gravity model for perceived vowel height under nasalization |
| Rossato 1998 | Area ratio d = An/(An+Aoral) as coupling parameterization; nasality axis perpendicular to oral vowel space |
| Recasens 1983 | Place cues for nasal consonants: murmur formants N1-N4 and NZ for /m/, /n/, /ng/ |
| Stevens 1998 | Nasal pole ~250 Hz, zeros: /m/ 1000-1200, /n/ 1600-1900, /ng/ all-pole; B1 widening +100-200 Hz |
| Fant 1960 | Source-filter theory; nasal formants at ~250, 1000, 2000, 3000, 4000 Hz |

## Synthesizer Files Audited

- `public/rules/frontends/qlatt-english/inventory.yaml` — nasal phoneme targets (M, N, NG)
- `public/experiments/klatt80-baseline/semantics.yaml` — nasal subsystem realize rules
- `public/experiments/klatt80-baseline/graph.yaml` — nasal resonator/antiresonator routing

---

## Question 1: Are Fujimura 1962's nasal formant frequencies still valid?

**Verdict: LIMITED — valid for nasal consonant murmurs but the data is from a small speaker pool (primarily one male speaker), and more recent work provides better parameterization.**

### Evidence

Fujimura 1962 established the core antiformant (nasal zero) frequency ranges:
- /m/: 750-1250 Hz (typical ~1000 Hz)
- /n/: 1450-2200 Hz (typical ~1700 Hz)
- /ng/: >3000 Hz

These values are confirmed by Stevens 1998 (Ch. 9):
- /m/: 1000-1200 Hz
- /n/: 1600-1900 Hz
- /ng/: all-pole (no zero — the oral cavity is so short the zero moves above the audible range)

Recasens 1983 provides Catalan data (single speaker) that broadly agrees:
- /m/ NZ: not measured (too low in spectrum)
- /n/ NZ: 1780 Hz
- /ng/ NZ: 3700 Hz

**The core antiformant frequency ranges from Fujimura 1962 remain the accepted values.** Stevens 1998 essentially ratifies them. However, Fujimura's formant bandwidths (Table I) are from a limited speaker pool and should be treated as approximate.

### Qlatt's Current Values

```yaml
# inventory.yaml base_params
nasalPlaceMFnzHz: 1000   # /m/ antiformant
nasalPlaceNFnzHz: 1700   # /n/ antiformant
nasalPlaceNgFnzHz: 3000  # /ng/ antiformant
```

These match the literature consensus exactly:
- /m/ at 1000 Hz: within Fujimura's 750-1250 range, matches Stevens 1998's 1000-1200 midpoint
- /n/ at 1700 Hz: within Fujimura's 1450-2200 range, matches Stevens 1998's 1600-1900 midpoint
- /ng/ at 3000 Hz: matches Fujimura's >3000 estimate

**No change needed.**

---

## Question 2: What nasal zeros does Qlatt need? Are current values correct?

**Verdict: CORRECT for nasal consonant murmurs; LIMITED for nasalized vowels.**

### Nasal Consonant Zeros (Place-Specific)

Qlatt implements two zero mechanisms in the cascade path:

1. **Core nasal zero (`nz` node)**: Implements the oral-nasal cancellation pair (FNZ near FNP when oral; interpolates toward Hawkins & Stevens midpoint formula when coupling increases).

2. **Place-specific nasal zero (`nzPlace` node)**: Implements Fujimura 1962's place-dependent antiformant during nasal murmur.

The semantics realize rule for the core nasal zero:
```
nasalCoreFnzTarget = (nasalCoreFnp + F1) / 2.0
```
This correctly implements Hawkins & Stevens 1985's formula: FNZ = (FNP + F1) / 2.

The place-specific zero is selected by `nasalPlaceIndex`:
- 1 (/m/) -> 1000 Hz
- 2 (/n/) -> 1700 Hz
- 3 (/ng/) -> 3000 Hz

This matches the literature. However, Stevens 1998 notes /ng/ is **all-pole** (no zero in the audible range). Setting the zero at 3000 Hz is a reasonable engineering approximation since a zero at 3000+ Hz has minimal perceptual effect, but it would be more accurate to either:
- Set /ng/ zero to 0 (bypass)
- Set it above 4000 Hz to effectively remove it

**Minor issue only.** The current 3000 Hz value for /ng/ creates a slight spectral notch where Stevens says there should be none. The fix would be to either bypass the place zero for /ng/ or set it much higher (e.g., 5000 Hz).

### Nasalized Vowel Zeros

The core nasal zero interpolates from FNP (pole cancels zero = oral) toward the Hawkins & Stevens midpoint target as `nasalCoupling` increases. This is correct for the single pole-zero pair model.

Maeda 1993 shows that a single pole-zero pair is a simplification — real nasalization produces multiple poles and zeros that evolve differently depending on vowel type (4 categories). However, for a Klatt-type synthesizer with a fixed cascade topology, the single pole-zero pair plus B1 widening is the standard and adequate approach. Stevens 1998 and Hawkins & Stevens 1985 both parameterize nasalized vowels this way.

**No change needed for the basic model.** The single pole-zero pair is the accepted Klatt-family approach.

---

## Question 3: Is the simple pole-zero model adequate, or does Maeda's work suggest we need more complexity?

**Verdict: LIMITED — the simple model is adequate for English allophonic nasalization but would be insufficient for languages with phonemic nasal vowels (French, Portuguese, Hindi).**

### What the Literature Says

Maeda 1993 identifies four types of spectral modification from nasal coupling, depending on the vowel class:
- **Type 1** (high front: /i/, /y/): NF1 peak appears at F1's right skirt; small coupling sufficient
- **Type 2** (front: /e/, /epsilon/): F1 weakened by zero; NF1 appears below
- **Type 3** (non-high back: /o/, /open-o/): F1 splits; F3 shifts up; "nasal eye" spectral gap
- **Type 4** (high back: /u/): NF1-Z1 pair between F1 and F2; minimal modification

A single pole-zero pair cannot reproduce all four types faithfully. However:

1. **For English** (allophonic nasalization only): The nasalization is subtle and brief (contextual, in VN sequences). Beddor 1986 shows English listeners compensate for expected coarticulatory nasalization. The single pole-zero pair with B1 widening is sufficient.

2. **For French/Portuguese/Hindi** (phonemic nasal vowels): The spectral modifications are more dramatic. Maeda's Type 3 (low back vowels) requires F1 splitting and F3 upshift that a single pole-zero pair cannot produce. Future multi-language support would need:
   - Vowel-type-dependent nasal pole placement (not just the fixed ~250 Hz)
   - Possibly a second pole-zero pair for sinus cavity effects (Maeda 1982, Chen 1997)
   - Articulatory shift modeling (Maeda 1993: French nasal vowels shift tongue position)

### What Qlatt Currently Has

Qlatt implements:
- Core nasal pole at 250 Hz (pharyngonasal resonance) — matches Feng 1996's Fn1 target
- Core nasal zero interpolated via Hawkins & Stevens formula
- B1 widening of +107 Hz (Chen 1997) scaled by coupling^2
- Place-specific antiformant for nasal consonant murmurs
- `nasalCoupling` parameter as area ratio d = An/(An+Aoral) — matches Rossato 1998's recommendation

This is a well-designed system for English. The coupling parameterization (area ratio, not raw area) is actually more sophisticated than many implementations, following Rossato 1998's finding that area ratio avoids tongue-position-dependent saturation.

**No change needed for English.** Document the limitation for multi-language expansion.

---

## Question 4: Nasal Consonant Murmur Formants — Are Inventory Targets Correct?

**Verdict: CORRECT with minor bandwidth concerns.**

### Current Inventory Values vs. Literature

| Param | M (Qlatt) | M (Literature) | N (Qlatt) | N (Literature) | NG (Qlatt) | NG (Literature) |
|-------|-----------|----------------|-----------|----------------|------------|-----------------|
| F1 | 250 | 250-300 (Fant, Stevens, Fujimura) | 250 | 250-300 | 250 | 250-350 |
| F2 | 1100 | 1000-1120 (Fujimura, Recasens) | 1400 | 850-1400 | 1700 | 1050-1200 |
| F3 | 2500 | 2300-2500 (Fujimura) | 2600 | 1550-2600 | 2800 | 1900-2800 |
| B1 | 300 | 60-200 (Fujimura, Recasens) | 300 | 37-180 | 300 | 50-200 |

**F1 values are correct** — all three nasals at 250 Hz matches Stevens 1998's "lowest pole ~250-300 Hz" and Fant 1960's ~250 Hz.

**F2 and F3 are reasonable** — values fall within literature ranges, though there is considerable variability across studies. Qlatt's N F2=1400 is at the high end; Fujimura reports ~1050 for /n/ and Stevens reports ~850 Hz for the F2 spectral peak during /n/ murmur. However, the cascade formant chain interacts with the antiformant to shape the actual murmur spectrum, so direct comparison is not straightforward.

**B1 = 300 Hz for all nasals is high.** Fujimura 1962 reports B1 = 40-80 Hz for nasal murmurs; Recasens 1983 reports 37-69 Hz (12-speaker mean). Stevens 1998 gives pole bandwidth ~100 Hz. The 300 Hz value in Qlatt is more typical of a stop closure (wide B1 for damped resonance). During nasal murmur, the first formant should have a moderate bandwidth (60-100 Hz for the nasal pole itself), not 300 Hz.

However, examining the signal path: the 300 Hz B1 in inventory goes through the cascade F1 resonator, while the actual nasal pole (`np` node) uses `nasalPoleBaseHz` = 250 Hz with `nasalPoleBwHz` = 100 Hz. The wide B1 on the cascade F1 may be intentional — it weakens the oral F1 during nasals (since the cascade F1 resonator is in series with the nasal pole). This is an engineering choice rather than a physical error, but it could be made more explicit.

---

## Question 5: B1 Addition from Nasal Coupling

**Verdict: CORRECT.**

Qlatt adds `nasalB1AdditionHz` = 107 Hz to B1 during nasalization, scaled by coupling^2.

Chen 1997 explicitly measures the nasal tract contribution to B1:
- Posterior nasal: 15 Hz
- Middle nasal: 66 Hz
- Anterior nasal: 26 Hz
- **Total: 107 Hz**

This is a direct implementation of Chen's measurement. The quadratic scaling (`nasalSecondaryCueScale = pow(nasalCouplingClamped, 2.0)`) is a conservative engineering choice — the literature doesn't specify the exact mapping from coupling to bandwidth addition, but a nonlinear taper is reasonable since small coupling produces disproportionately small acoustic effects (House & Stevens 1956, Maeda 1993).

**No change needed.**

---

## Question 6: Graph Topology — Nasal Signal Path

**Verdict: CORRECT.**

The cascade signal path is:
```
mixer -> nz (core antiresonator) -> nzPlace (place-specific antiresonator) -> np (nasal pole) -> F1 -> F2 -> ...
```

This matches Klatt 1980's topology: antiresonator before resonator in the cascade chain, with the nasal pole feeding into the formant chain.

The parallel branch has a separate nasal resonator (`parallelNasal`) with its own gain (`parallelNasalGain`), fed from the parallel voicing source. This correctly implements Klatt's AN parameter path.

Both `nz` and `nzPlace` use `biquad-notch` type with `bypassAtZero: true`, meaning they are transparent when their frequency parameters are 0. The `nasalRuntimeActive` flag gates the nasal tract on/off. This is a clean implementation.

**No change needed.**

---

## Summary of Verdicts

| Component | Verdict | Action |
|-----------|---------|--------|
| Antiformant frequencies (/m/ 1000, /n/ 1700, /ng/ 3000) | CORRECT | None |
| Core nasal pole (250 Hz, BW 100 Hz) | CORRECT | None |
| Hawkins & Stevens FNZ formula | CORRECT | None |
| B1 addition (+107 Hz, Chen 1997) | CORRECT | None |
| Coupling parameterization (area ratio) | CORRECT | None |
| Graph topology (NZ -> NZplace -> NP -> cascade) | CORRECT | None |
| /ng/ antiformant at 3000 Hz | LIMITED | Consider bypassing or raising to 5000+ Hz per Stevens 1998 "all-pole" characterization |
| B1 = 300 Hz on nasal murmur phonemes | LIMITED | Document that 300 Hz is an engineering choice for cascade F1 damping, not the nasal pole bandwidth |
| Single pole-zero model for nasalized vowels | LIMITED | Adequate for English; document limitation for multi-language |
| Nasal murmur F2 values | LIMITED | N F2=1400 is at high end of range; Fujimura and Stevens suggest ~850-1050 for /n/ murmur |

## Recommended Actions (Priority Order)

1. **Documentation**: Add comments in inventory.yaml explaining why nasal murmur B1=300 Hz differs from measured nasal pole bandwidths (60-100 Hz). The 300 Hz value damps the cascade F1 while the actual nasal pole bandwidth is set separately via `nasalPoleBwHz`.

2. **Minor fix**: Consider setting /ng/ nasalPlaceNgFnzHz to 0 (bypass) or a very high value (>5000 Hz) since Stevens 1998 characterizes /ng/ as all-pole. Current 3000 Hz creates a mild spectral notch that shouldn't be there.

3. **Future work**: If multi-language nasal vowel support is added, the single pole-zero model will need extension. Maeda 1993's four-type taxonomy should guide the design. This is a non-urgent enhancement.

4. **Audit**: N murmur F2 target (1400 Hz) is higher than most literature values for /n/ murmur (850-1050 Hz in Fujimura 1962 and Stevens 1998). This may warrant verification against natural speech spectrograms.

---

## Evidence Traceability

Every claim above traces to a specific paper's notes.md:
- Antiformant ranges: Fujimura 1962 notes (Table "Antiformant Zero Frequency Ranges")
- /ng/ all-pole: Stevens 1998 notes (Section 9.2, 9.5)
- FNZ midpoint formula: Hawkins & Stevens 1985 notes ("Optimal Nasal Zero Frequency")
- B1 +107 Hz: Chen 1997 notes ("Bandwidth Contributions from Nasal Tract")
- Area ratio parameterization: Rossato 1998 notes ("Area ratio" equation)
- Four-type spectral taxonomy: Maeda 1993 notes (Section 4)
- Spectral flattening cue: Maeda 1982 notes ("Spectral Flattening Effect")
- Vowel-height interaction: Beddor 1986 notes ("centre of gravity" model)
- Nasal murmur formants: Recasens 1983 notes (Table II)
- Fant 1960 nasal formant series: notes section "Nasals"
