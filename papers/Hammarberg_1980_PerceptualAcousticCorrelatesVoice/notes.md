# Hammarberg et al. 1980 — Perceptual and Acoustic Correlates of Abnormal Voice Qualities

## Key Findings

### Five Perceptual Factors of Voice Quality

Factor analysis of 28 voice-describing variables rated by expert listeners on 17 pathological voices yielded 5 bipolar factors explaining 85.3% of total variance:

| Factor | Label | Variance Explained |
|--------|-------|--------------------|
| 1 | Unstable-Steady | 30.0% |
| 2 | Breathy-Overtight | 27.3% |
| 3 | Hyper-Hypofunctional | 13.5% |
| 4 | Coarse-Light | 10.1% |
| 5 | Head-Chest Register | 4.4% |

### Factor 1: Unstable-Steady

**Positive pole (steady/restrained):** restrained (+.535), [chest register (+.372)]

**Negative pole (unstable/pathological):** bitonality (-.872), diplophonia (-.831), unstable pitch (-.827), flutter (-.810), gratings (-.795), voice breaks (-.774), unstable quality (-.774), changes of voice quality (-.669)

**Acoustic correlate:** No significant correlation with any acoustic variable (fluctuations in quality not captured by average spectrum data).

### Factor 2: Breathy-Overtight

**Positive pole (overtight/creaky):** creaky/vocal fry (+.787)

**Negative pole (breathy):** breathy (-.899), wheezing (-.849), lack of timbre (-.832), intermittent aphonia (-.773), husky/veiled (-.730)

**Acoustic correlates (Table V):**
- Step 1: Spectral slope difference (SPL_0-2 - SPL_2-5) minus (SPL_2-5 - SPL_5-8), r = .59, r^2 = 35%
- Step 2: Adding MF_0, r = .69, r^2 = 47%

**Interpretation:** Breathy voice shows steep spectral fall from 0-2 kHz band to 2-5 kHz band. Overtight/creaky voice shows flat or rising spectral slope. Low MF_0 correlates with overtight, high MF_0 with breathy.

### Factor 3: Hyper-Hypofunctional

**Positive pole (hyperfunctional):** strangled phrase endings (+.852), strained (+.831), hyperfunctional (+.812), guttural/throaty (+.698), hard glottal attacks (+.540)

**Negative pole (hypofunctional):** monotonous (-.675), [husky (-.364)]

**Acoustic correlates (Table V):**
- Step 1: SPL_2-5, r = .73, r^2 = 53%
- Step 2: Adding MF_0, r = .78, r^2 = 60%

**Interpretation:** Hyperfunctional voice shows high spectral level in all three LTAS frequency bands, especially 2-5 kHz. SPL in 2-5 kHz was the single most important acoustic correlate.

### Factor 4: Coarse-Light

**Positive pole (coarse):** coarse (+.930), rough (+.858), harsh (+.701)

**Negative pole (light):** high pitch (-.760), middle register (-.671), restrained (-.618)

**Acoustic correlates (Table V):**
- Step 1: MF_0, r = .39, r^2 = 15%
- Step 2: Adding SPL_0-2 - SPL_2-5, r = .50, r^2 = 25%

**Interpretation:** Coarse-rough-harsh quality correlates with low pitch and potentially with timbre. This factor depends on both pitch and spectral characteristics.

### Factor 5: Head-Chest Register

**Positive pole:** chest register (+.577)

**Negative pole:** head register (-.747)

**Acoustic correlates (Table V):**
- Step 1: MF_0, r = .63, r^2 = 39%
- Step 2: Adding SPL_0-2 - SPL_5-8, r = .75, r^2 = 57%

**Interpretation:** High MF_0 = head register, low MF_0 = chest register. Additionally, loss of spectral energy in upper frequency band (5-8 kHz) relative to low band (0-2 kHz) correlates with chest register.

## Acoustic Methods

### Fundamental Frequency Distribution Analysis (FFDA)
- Uses contact microphone signal from cricoid cartilage
- Produces frequency histogram (F0 distribution)
- Computes: most common frequency, mean fundamental frequency (MF_0), straight-line approximation of distribution

### Long-Time-Average Spectrum (LTAS)
- 40 sec of connected speech analyzed
- 51 band-pass filters, each 250 Hz wide
- Frequency range divided into three bands:
  - Band 1: 0-2 kHz (SPL_0-2) — corresponds to overall SPL
  - Band 2: 2-5 kHz (SPL_2-5) — mid-frequency energy
  - Band 3: 5-8 kHz (SPL_5-8) — high-frequency energy
- Maximum level in each band determined
- Peak level differences between bands computed as spectral slope measures:
  - SPL_0-2 - SPL_2-5 (low-to-mid slope)
  - SPL_2-5 - SPL_5-8 (mid-to-high slope)
  - SPL_0-2 - SPL_5-8 (low-to-high slope)
- Voiceless speech sounds eliminated by removing sound energy in lowest frequency bands

## 28 Voice-Describing Variables (Table I)

Swedish clinical terms with English equivalents:

| # | Swedish | English |
|---|---------|---------|
| 1 | lackande | breathy |
| 2 | skrovlig | rough, raucous |
| 3 | diplofoni | diplophonia |
| 4 | knarr | creaky, vocal fry |
| 5 | halsig | guttural, throaty |
| 6 | aterhallen | repressed/restrained |
| 7 | grov | coarse |
| 8 | pressad | strained |
| 9 | strypta frasslut | strangled phrase endings |
| 10 | klangfattig | lack of timbre |
| 11 | afoniska inslag/afoni | moments of aphonia/aphonia |
| 12 | vasande | wheezing, hissing |
| 13 | bitonalitet | bitonality |
| 14 | hyperkinetisk | hyperfunctional |
| 15 | monoton | monotonous |
| 16 | beslojad | husky |
| 17 | klangforandring utan brott | quality changes without voice breaks |
| 18 | fladder | flutter |
| 19 | skrap | grating |
| 20 | registerbrott/registerbrottstendens | voice breaks/tendency towards voice breaks |
| 21 | harda ansatser | hard glottal attacks |
| 22 | instabil klang | unstable quality |
| 23 | strav | harsh |
| 24 | brostregister | chest register |
| 25 | mellanregister | middle register |
| 26 | falsettregister | head (falsetto) register |
| 27 | rostlage | pitch |
| 28 | instabilt rostlage | unstable pitch |

## Implementation Relevance for Klatt Synthesizer

### Spectral Slope as Voice Quality Cue
The key finding for synthesis is that **spectral slope** (particularly the difference between low-frequency and mid/high-frequency energy) is the primary acoustic correlate of the breathy-overtight dimension:
- **Breathy:** steep spectral fall from 0-2 kHz to 2-5 kHz
- **Overtight/creaky:** flatter spectrum

This maps directly to Klatt synthesizer parameters:
- **TL (spectral tilt):** Controls spectral slope of the glottal source. Higher TL = more spectral tilt = breathier voice.
- **AV (voicing amplitude) vs AH (aspiration):** Increasing AH relative to AV adds breathiness.
- **OQ (open quotient):** Higher OQ = breathier voice with steeper spectral roll-off.

### Hyperfunctional Voice = High Mid-Frequency Energy
SPL in 2-5 kHz band is the strongest correlate of hyperfunctional voice. In synthesis terms, this corresponds to:
- Strong formant amplitudes in F3-F4 range
- Potentially relevant to "speaker's formant" / "singer's formant" clustering around 2.5-3.5 kHz
- Could be controlled via formant bandwidths (narrower B3, B4 = more energy in this range)

### Register and F0
Head vs chest register perception is primarily driven by F0, secondarily by high-frequency spectral energy loss. In synthesis, register effects could be modeled by coupling F0 changes with spectral tilt adjustments.

### Reliability
Listener retest reliability was very high (Pearson r = 0.93-0.97), validating these perceptual dimensions as stable and replicable.

## Collection Cross-References

### Already in Collection

(No papers directly cited by Hammarberg et al. 1980 are in the collection.)

### Cited By (in Collection)

- `Kreiman_2007_GlottalSourceSpectrum` — Cites Hammarberg et al. 1980 for voice quality factor analysis
- `Banse_1996_VocalEmotionAcousticProfiles` — References Hammarberg for acoustic correlates of voice quality
- `Monson_2014_HighFrequencyVoice` — Cites for LTAS-based voice quality analysis
- `Eyben_2015_GeMAPS_AcousticParameters` — References for spectral slope as voice quality measure
- `Goudbeek_2010_ValencePotencyVocalEmotion` — Cites for perceptual voice quality dimensions

### New Leads (Not Yet in Collection)

- Isshiki, N. & Takeuchi, Y. (1970). Factor analysis of hoarseness. Studia Phonologica 5, 37. — Prior factor analysis of hoarseness that this study builds upon
- Wendahl, R. W. (1963/1966). Laryngeal analog synthesis of harsh/jitter/shimmer. Folia Phoniatrica. — Laryngeal analog synthesis of voice quality, directly relevant to Klatt synthesis

### Conceptual Links (not citation-based)

- `Ladd_1985_IndependentFunctionIntonation` — Both identify independent perceptual dimensions; Hammarberg's breathy-overtight factor maps onto Ladd's voice quality dimension, both supporting orthogonal control of prosodic parameters
- `Gobl_2003_VoiceQualityEmotion` — Both map voice quality to perceptual dimensions; Hammarberg establishes pathological voice factors, Gobl maps voice quality types to emotional expressions
- `Burkhardt_2009_VoiceQualityFormantSynthesis` — Hammarberg's spectral slope findings for breathy-overtight directly inform Burkhardt's Klatt parameter formulas for phonation types
