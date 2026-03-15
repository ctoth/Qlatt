# Verdict 05: Fricative Acoustics

## Scope

This verdict evaluates whether Qlatt's acoustic characterization of fricatives — spectral targets, amplitude parameters, and duration rules — is correct in light of the research literature. Eleven papers were read; two synthesizer files were audited.

## Papers Reviewed

| Paper | Key Contribution | Evidence Quality |
|-------|-----------------|-----------------|
| Shadle 1985 | Three-class source model (obstacle/surface-long/surface-short); mechanical model validation | High (PhD thesis, controlled experiments + speech) |
| Shadle 2023 | High-frequency spectra to 15 kHz; non-sibilant spectra are flat/rising above 7 kHz | High (7 speakers, 44.1 kHz, modern measurement) |
| Jongman 2000 | Comprehensive 4-place spectral peaks, moments, amplitudes; N=20 | High (largest speaker pool, 22 kHz sampling) |
| Jongman 1989 | Minimum frication durations for perceptual identification | Moderate (single speaker, but systematic) |
| Behrens & Blumstein 1988 | Spectral shape > amplitude for fricative perception | Moderate (natural speech, 2 speakers) |
| Harris 1958 | Two-class perceptual model: sibilants=friction-dominant, non-sibilants=transition-dominant | Moderate (tape-splicing, 22 listeners) |
| Heinz & Stevens 1961 | Pole-zero model for fricative spectra; perceptual resonance boundaries | High (theory + circuit matching + perception) |
| Hughes & Halle 1956 | Three-class spectral classification; energy-band identification procedure | Moderate (band-limited to 10 kHz, 5 speakers) |
| Badin & Fant 1989 | Aerodynamic SPL exponents; obstacle effect explanation | Moderate (single French speaker) |
| Stevens 1971 | Aerodynamic framework: noise proportional to pressure drop | High (theoretical, validated against data) |
| Stevens 1998 | Comprehensive front-cavity resonances, noise amplitude formula, spectral differences | High (textbook synthesis of field) |

## Evidence Hierarchy Applied

1. Shadle 2023 (modern, high-frequency, 7 speakers) > Hughes 1956 (band-limited to 10 kHz)
2. Jongman 2000 (N=20) > Behrens & Blumstein 1988 (N=2) for spectral peak values
3. Stevens 1971/1998 (theoretical framework) > individual empirical observations for source mechanisms
4. Shadle 1985 (controlled mechanical models) > speech-only studies for source class distinctions

---

## Synthesizer File Audit

### File: `public/rules/frontends/qlatt-english/inventory.yaml`

#### Fricative AF (Frication Amplitude)

| Phoneme | Current AF | Paper Evidence | Verdict |
|---------|-----------|----------------|---------|
| S | 60 | Sibilant, ~equal to vowel amplitude (Behrens 1988: -1 to -4 dB re vowel); Klatt 1980 Table III | **ADEQUATE** — value is reasonable for Klatt dB scale |
| Z | 50 | Voiced ~7-10 dB below voiceless (Stevens 1998: voiced fricative noise ~7 dB below voiceless) | **ADEQUATE** — 10 dB below S is consistent |
| SH | 66 | Loudest fricative per Shadle 1985 (A_S=68 dB SPL, highest); AF should be > S | **ADEQUATE** — correctly highest |
| ZH | 56 | 10 dB below SH, consistent with voicing convention | **ADEQUATE** |
| F | 42 | Non-sibilant 15-21 dB below vowel (Behrens 1988); ~18 dB below S matches Shadle 1985 | **ADEQUATE** |
| V | 32 | 10 dB below F, consistent | **ADEQUATE** |
| TH | 40 | Weakest voiceless fricative; Shadle 1985 A_S=50 dB SPL; should be lowest | **ADEQUATE** — correctly weakest voiceless, close to F |
| DH | 30 | 10 dB below TH | **ADEQUATE** |
| HH | AH=40, AF=0 | Aspiration noise, not frication; correct to use AH not AF | **ADEQUATE** |

**Summary:** AF amplitude hierarchy (SH > S > Z > F > TH > V > DH) is consistent with all papers. The sibilant/non-sibilant gap (~18-20 dB) matches Shadle 1985 and Behrens & Blumstein 1988.

#### Parallel Branch Amplitudes (A1-A10, AB)

| Phoneme | Current A-params | Paper Evidence | Verdict |
|---------|-----------------|----------------|---------|
| S | A6=52, A7=50, A8=45, A9=38, A10=30 | Jongman 2000: peak at 6839 Hz; Shadle 2023: energy rolling off above peak at ~-3 to -6 dB/kHz | **ADEQUATE** — A6 peak with rolloff matches alveolar sibilant pattern; rolloff rate ~5 dB per formant (~1 kHz spacing) is reasonable |
| SH | A3=57, A4=48, A5=48, A6=46, A7=35, A8=28, A9=22, A10=15 | Jongman 2000: peak at 3820 Hz; Heinz 1961: Pole 1 at 2200-2700 Hz; steeper rolloff than /s/ per Shadle 2023 | **ADEQUATE** — peak at A3 (~F3 range) with steep rolloff matches postalveolar pattern |
| F | AB=57, A7=50, A8=55, A9=52, A10=45 | Shadle 2023: non-sibilants have flat/rising high-frequency spectra; Jongman 2000: peak at 7733 Hz; Hughes 1956: diffuse spectrum | **ADEQUATE** — A8>A7 correctly implements flat/rising HF characteristic; comment in inventory.yaml explicitly cites Shadle 2023 |
| TH | A6=28, AB=48, A7=45, A8=50, A9=46, A10=38 | Jongman 2000: peak at 7470 Hz; Shadle 2023: flat/rising HF; Harris 1958: friction alone does not distinguish /f/ from /th/ | **ADEQUATE** — similar to F with A8>A7; slightly lower overall amplitude correct per Jongman (normalized amp -18 dB vs -17 dB for /f/) |
| V | AB=57, A7=48, A8=52, A9=48, A10=40 | Same pattern as F, lower overall | **ADEQUATE** |
| DH | A6=28, AB=48, A7=42, A8=46, A9=42, A10=34 | Same pattern as TH, lower overall | **ADEQUATE** |
| Z | A6=52, A7=48, A8=43, A9=36, A10=28 | Same shape as S, lower overall | **ADEQUATE** |
| ZH | A3=57, A4=48, A5=48, A6=46, A7=33, A8=26, A9=20, A10=13 | Same shape as SH, lower overall | **ADEQUATE** |

**Summary:** Parallel branch amplitudes correctly implement two distinct spectral envelope shapes:
1. **Sibilants:** Energy concentrated at formant near peak, rolling off above (S at A6, SH at A3)
2. **Non-sibilants:** Flat/rising HF energy (A8 >= A7), correctly following Shadle 2023

This is a well-implemented distinction. The inventory comments explicitly cite the relevant papers.

#### Formant Frequencies During Frication

| Phoneme | Current F1/F2/F3 | Paper Evidence | Verdict |
|---------|-----------------|----------------|---------|
| S | 320/1390/2530 | Stevens 1998: F1 ~400 Hz during constriction; front cavity resonance at 4500 Hz (not captured in F1-F3) | **LIMITED** — F1 is lower than Stevens predicts but reasonable; the critical spectral shaping happens in A-params, not cascade formants |
| SH | 300/1840/2750 | Stevens 1998: F2 ~1900 Hz, F3 ~2500 Hz; Heinz 1961: Pole 1 at 2200-2700 Hz | **ADEQUATE** — F2/F3 match well |
| F | 340/1100/2080 | Stevens 1998: front-cavity resonance ~10 kHz (not modeled in F1-F3); spectral shaping via A-params | **ADEQUATE** — F1-F3 represent the vocal tract behind constriction; frication shaped by A-params |
| TH | 320/1290/2540 | Same reasoning as F | **ADEQUATE** |

#### Bandwidths

| Phoneme | Current B1/B2/B3 | Paper Evidence | Verdict |
|---------|-----------------|----------------|---------|
| S | 200/80/200 | Heinz 1961: wide bandwidths (400-1800 Hz); Shadle 1985: BW increases with frequency | **LIMITED** — B1=200 is reasonable for closed-glottis damping but B2=80 seems narrow for a fricative. However, since frication uses the parallel branch (SW=1 implied by AF>0), cascade bandwidths matter less. |
| SH | 200/100/300 | Same reasoning; B3=300 reasonable | **ADEQUATE** |
| F, TH | 200/120/150 and 200/90/200 | Less critical since non-sibilants use AB (bypass) + A7-A10 | **ADEQUATE** |

### File: `public/rules/frontends/qlatt-english/phases/duration.yaml`

#### Fricative Minimum Duration Rule

| Phoneme Class | Current Minimum | Jongman 1989 Evidence | Verdict |
|---------------|----------------|----------------------|---------|
| Sibilants (S,Z,SH,ZH) | 30 ms | /sh/ and /z/ identifiable at 30 ms; /s/ at 50 ms | **ADEQUATE** — 30 ms matches the best-case sibilant threshold |
| Labiodentals (F,V) | 50 ms | /f/ identifiable at 50 ms | **ADEQUATE** — matches exactly |
| Dentals (TH,DH) | 60 ms | /th/ and /dh/ poorly identified even at full frication (~100+ ms) | **LIMITED** — 60 ms is below the threshold where Jongman found reasonable identification. However, Jongman 1989 showed that dentals depend on formant transitions (Harris 1958), not frication duration, so this minimum is a floor, not a perceptual sufficiency threshold. Pragmatically adequate. |
| Glottal (HH) | 40 ms | Not tested by Jongman 1989 | **ADEQUATE** — engineering estimate, reasonable |

**Citation note:** The duration rule correctly cites Jongman 1989 and notes the dental limitation.

#### Inherent Durations in inventory.yaml

| Phoneme | Current dur (ms) | Jongman 2000 Data | Verdict |
|---------|-----------------|-------------------|---------|
| S | 100 | 178 ms (isolated CVC) | **LIMITED** — isolated CVC durations are longer than connected speech; 100 ms is a reasonable connected-speech base that rules will modify |
| Z | 90 | 118 ms | **ADEQUATE** |
| SH | 100 | 178 ms | **LIMITED** — same as S; base duration is pre-rule |
| ZH | 90 | 123 ms | **ADEQUATE** |
| F | 90 | 166 ms | **LIMITED** — same reasoning; pre-rule base |
| V | 80 | 80 ms | **ADEQUATE** — exact match |
| TH | 80 | 163 ms | **LIMITED** — significant gap, but pre-rule |
| DH | 70 | 88 ms | **ADEQUATE** |

**Note:** The inventory `dur` values are pre-rule bases. Duration rules (word-initial lengthening, stress, pre-boundary, etc.) will expand these. The voiceless > voiced hierarchy is correctly maintained. Connected-speech fricatives are shorter than isolated CVC, so these base values are not necessarily wrong.

---

## Per-Paper Verdicts

### Hughes & Halle 1956

**Verdict: LIMITED**

The three-class spectral classification (labial/alveolar/palatal) remains valid but is limited by the 10 kHz bandwidth cap. Key findings still hold:
- Energy concentration above 4 kHz for /s/ vs below 4 kHz for /sh/ — confirmed by all later studies
- Flat/diffuse spectrum for /f/ — confirmed by Jongman 2000 (high variance) and Shadle 2023 (flat/rising HF)
- Voicing bar below 700 Hz — consistent with later work

What's limited: No data above 10 kHz means non-sibilant characterization is incomplete. Shadle 2023 shows substantial energy to 15 kHz for /f/ and /th/ that Hughes couldn't see. The 50 ms gate length is adequate per Jongman 1989 thresholds.

### Heinz & Stevens 1961

**Verdict: LIMITED**

The pole-zero model (2 poles + 1 zero per fricative) remains the best compact spectral description. The specific pole/zero values measured from a single speaker are:
- /sh/: Pole 1 at 2200-2700 Hz — confirmed by Jongman 2000 (peak at 3820 Hz) and Stevens 1998 (F3~2500 Hz)
- /s/: Pole 1 at 3500-6400 Hz — confirmed by Jongman 2000 (peak at 6839 Hz)
- /f/: Pole 1 at 6800-8400 Hz — confirmed by Jongman 2000 (peak at 7733 Hz)

What's limited: Single speaker, band-limited to 10 kHz, circuit-matching methodology. The perceptual boundary findings (/sh/~2-3 kHz, /s/~3-5 kHz, /f/~5-8 kHz) remain valid.

### Shadle 1985

**Verdict: ADEQUATE (foundational)**

The three-class source model (obstacle/surface-long/surface-short) is the most complete theoretical framework for fricative acoustics. Key findings:
- Obstacle (teeth) adds ~20 dB for sibilants — confirmed by Badin 1989 and Stevens 1998
- Sibilants 10-15 dB louder than non-sibilants — confirmed by Jongman 2000 and Behrens & Blumstein 1988
- Front cavity quarter-wavelength resonances predict spectral peaks — confirmed by all later work

The mechanical model data (0-10 kHz) is extended by Shadle 2023 to 15 kHz with human speech data.

### Shadle 2023

**Verdict: ADEQUATE (extends prior work)**

The critical finding for Qlatt: **non-sibilant fricatives have flat or rising spectra above 7 kHz**, not falling spectra. This is correctly implemented in inventory.yaml (A8 >= A7 for F, TH, V, DH).

Other key findings:
- F_M for /s/ at 4-8 kHz, /sh/ at 2-4 kHz — matches inventory A-param peaks
- HighLevelD as a superior measure to spectral moments
- Gender effects on F_M (~1-2 kHz higher for women) — not yet implemented in Qlatt (single speaker preset)

### Jongman 2000

**Verdict: ADEQUATE (reference dataset)**

The most comprehensive acoustic analysis of English fricatives (N=20, 22 kHz). Key reference values:
- Spectral peaks: /f/=7733, /th/=7470, /s/=6839, /sh/=3820 Hz
- Sibilants 7-8 dB louder than non-sibilants (normalized amplitude)
- Spectral moments confirm sibilant/non-sibilant distinction (variance is key: low for sibilants = peaked, high for non-sibilants = flat)
- 77% overall classification accuracy with spectral peak + amplitude

### Jongman 1989

**Verdict: ADEQUATE (directly implemented)**

Minimum frication durations are directly implemented in Qlatt's `fricative_minimum_duration` rule with correct citations. The hierarchical thresholds (30 ms sibilant, 50 ms labiodental, 60 ms dental) follow the paper's findings.

### Behrens & Blumstein 1988

**Verdict: ADEQUATE (validates approach)**

The finding that spectral shape dominates over amplitude for fricative perception validates Qlatt's emphasis on getting spectral envelope (A-params) right. Amplitude (AF) is less perceptually critical. This aligns with the development priority: A-param spectral shaping first, AF fine-tuning second.

### Harris 1958

**Verdict: ADEQUATE (perceptual foundation)**

The two-class perceptual model (sibilants = friction-cued, non-sibilants = transition-cued) is foundational and not superseded. Key implication: for /f/ vs /th/, formant transitions into the following vowel matter more than the friction spectrum. This means the formant rule phase (coarticulation) is more important for non-sibilant identity than the spectral targets in inventory.yaml.

### Badin & Fant 1989

**Verdict: LIMITED**

Single French speaker, but provides the aerodynamic framework (IOP exponents p=1.3 for sibilants, p=0.8 for /f/) that explains *why* sibilants are louder. Not directly implemented in Qlatt (which uses static AF values rather than aerodynamic modeling) but validates the amplitude hierarchy.

### Stevens 1971

**Verdict: ADEQUATE (theoretical foundation)**

The core equation (noise proportional to pressure drop, radiated pressure ~ deltaP^1.0-1.5) is the theoretical basis for Klatt's AF parameter. Not directly implemented as physics but underlies the AF amplitude relationships.

### Stevens 1998

**Verdict: ADEQUATE (reference standard)**

Front-cavity resonance values (/f/: ~10 kHz, /s/: 4500 Hz, /sh/: 2500+3250 Hz) are the reference for placing parallel branch energy. The noise amplitude formula (20 log U^3 A_c^-2.5) provides the theoretical basis for AF scaling.

---

## Cross-Paper Findings

### Are early fricative spectra (Hughes 1956, Heinz 1961) still valid?

**Yes, within their bandwidth limits.** The fundamental classifications and spectral peak locations measured in the 1950s-60s are confirmed by every later study. What changed:
1. Non-sibilant characterization above 7 kHz (Shadle 2023 shows flat/rising spectra where older studies couldn't measure)
2. Sample sizes grew (Jongman 2000: N=20 vs single speakers in early work)
3. Gender differences now documented (F_M ~1-2 kHz higher in women)

The early work is LIMITED in bandwidth, not WRONG in its findings.

### What did Shadle 2023's high-frequency data reveal?

The critical finding: **non-sibilant spectra are flat or slightly rising above 7 kHz**, not falling. This directly affects A7-A10 settings and is correctly implemented in Qlatt.

### Is the Klatt parallel branch adequate for fricative synthesis?

**Yes, with caveats:**
1. The parallel branch can model both sibilant peaked spectra and non-sibilant flat spectra via A-param settings — this is correctly done.
2. The pole-zero structure of real fricatives (Heinz 1961: 2 poles + 1 zero) is approximated by the parallel resonators, not modeled exactly. This is a known Klatt limitation, not a Qlatt bug.
3. /sh/ has complex back-cavity coupling (Stevens 1998: zeros at ~1000 and ~3000 Hz) that the parallel branch can only approximate. Badin 1989 notes this requires -12 dB/oct source rolloff.
4. Non-sibilant /f/-/th/ distinction relies heavily on formant transitions (Harris 1958), which are handled by the formant rule phase, not the parallel branch.

---

## Actionable Findings

### Currently Correct
1. AF amplitude hierarchy (SH > S > Z > F > TH > V > DH)
2. A-param spectral envelope shapes (peaked rolloff for sibilants, flat/rising for non-sibilants)
3. Minimum duration thresholds with Jongman 1989 citations
4. Voiceless > voiced duration hierarchy
5. Use of AB (bypass) for non-sibilants

### Potential Improvements (not bugs)
1. **Dental minimum duration (60 ms):** Jongman 1989 data suggests dentals need full frication or transitions for identification. The 60 ms minimum is pragmatically fine since /th/-/f/ distinction relies on transitions anyway (Harris 1958). No change needed.
2. **Gender-variant spectral peaks:** Shadle 2023 and Jongman 2000 document 1-2 kHz F_M shifts for women. Currently not modeled. This would require speaker-profile-dependent A-param adjustments.
3. **Sibilant minimum duration:** /s/ actually needs 50 ms per Jongman 1989, but the 30 ms floor applies to the best-case sibilant (/sh/). Could split sibilant minimum: /sh,zh/=30 ms, /s,z/=50 ms. Low priority since base durations (90-100 ms) are well above both thresholds.
4. **Spectral tilt dynamics:** Badin 1989 shows high frequencies increase faster than low during fricative onset. Not currently modeled (A-params are static per segment). Would require time-varying A-param rules.

### No Changes Required
The current implementation is consistent with the literature. No parameters are WRONG or SUPERSEDED. The inventory citations correctly reference the relevant papers.

---

## Verdict Summary

| Category | Count | Items |
|----------|-------|-------|
| WRONG | 0 | — |
| SUPERSEDED | 0 | — |
| LIMITED | 4 | Hughes 1956 (bandwidth), Heinz 1961 (single speaker), Badin 1989 (single speaker), base durations (pre-rule values shorter than isolated CVC) |
| ADEQUATE | 7 | Shadle 1985, Shadle 2023, Jongman 2000, Jongman 1989, Behrens & Blumstein 1988, Harris 1958, Stevens 1971/1998 |
| INCOMPARABLE | 0 | — |

**Overall assessment:** Qlatt's fricative acoustics implementation is well-grounded in the literature. The AF hierarchy, A-param spectral envelopes, and duration rules are all consistent with the evidence. The most significant finding is that the flat/rising non-sibilant HF spectrum (Shadle 2023) is already correctly implemented (A8 >= A7 for /f/, /th/). No parameters need correction.
