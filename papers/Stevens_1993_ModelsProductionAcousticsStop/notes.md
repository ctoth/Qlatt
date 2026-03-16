---
title: "Stevens 1993 — Models for the production and acoustics of stop consonants"
year: 1993
---

# Stevens 1993 — Models for the production and acoustics of stop consonants

## Implementation Notes for Klatt Synthesizer

### Core Model: Low-Frequency Aerodynamic Circuit (Figure 2)

Two-constriction tube model for estimating airflows and pressures:
- Glottal constriction area: Ag
- Supraglottal constriction area: Ac
- Subglottal pressure Ps = 8 cm H2O (assumed constant, valid within ~10% for airflow < 400 cm^3/s)
- Wall impedance: resistance Rw in series with compliance Cw
- Acoustic compliance CA of vocal-tract volume is small compared to Cw, neglected for low-frequency flow
- Intraoral pressure: Pm
- Constriction resistances Rg and Rc are nonlinear; dynamic resistance proportional to volume velocity (Stevens 1971)

### Constriction Area Trajectory at Release

Area increases as: Ac = Amax(1 - e^(-t/tau))
- Amax = 1.0 cm^2
- Initial rate of area increase:
  - **Labial and alveolar**: 100 cm^2/s
  - **Velar**: 25 cm^2/s (4x slower)
- Velar release has initial "bulge" in Ac(t) due to intraoral pressure creating additional opening force on tongue dorsum; this force rapidly decreases as air escapes
- For closure (preceding vowel): reverse of opening trajectory, without pressure modification

### Airflow Components at Release (Figure 3)

Total constriction flow Uc has two components:
- **Uw**: wall compliance flow (inward wall displacement after pressure release) — significant contributor in first few ms
- **Ug**: glottal flow
- Relationship: Ug = Uc + Uw (note: Uw is negative = inward displacement)
- Glottal area assumed constant at 0.1 cm^2 for voiceless unaspirated stops
- Rise in flow and drop in pressure are **slower for velar** than labial/alveolar

### Intraoral Pressure (Figure 4)

- Rises to ~8 cm H2O (= Ps) during closure
- Drops rapidly at release:
  - Labial/alveolar: drops to near 0 within ~10 ms
  - Velar: drops to near 0 within ~20 ms (slower)

### Glottal Pulse Behavior Near Stop (Figure 5)

- **At closure**: 2-3 glottal pulses of reduced amplitude before vibration ceases (no active laryngeal adjustment)
- **At release**: vibration resumes almost immediately
  - For labial/alveolar: full amplitude after ~20 ms
  - If glottis abducted: aspiration interval before voicing begins

### Four Source Types at Release (Figure 6) — Key for Synthesis

Sequential acoustic events after stop release:

1. **Initial transient** (< 1 ms): discharge of compressed air through opening constriction
   - Amplitude/spectrum determined by intraoral pressure and rate of area increase
   - Source: acoustic compliance CA discharge

2. **Frication noise** (burst): turbulence at/near constriction
   - Sound-pressure source near obstacle downstream from constriction
   - Amplitude proportional to Uc^3 * Ac^(-2.5) (empirical, Shadle 1985)
   - Peaks 1-2 ms after release, then decreases as Ac grows
   - Velar: supraglottal source dominant for longer than the ~3 ms seen for labial

3. **Aspiration noise**: turbulence at glottis
   - Similar source characteristics to frication
   - Glottis slightly abducted; turbulence where glottal jet impinges on false vocal folds or epiglottis
   - Source distributed 1-3 cm downstream from glottis

4. **Voicing**: vocal-fold vibration begins simultaneously with or just after aspiration

### Spectral Characteristics by Place of Articulation (Figure 8)

Calculated spectra at 20 cm from mouth, 300 Hz bands, for voiceless unaspirated stops:

**Front cavity resonance:**
- **Labial**: no front cavity → no spectral prominence in transient/frication; burst weaker than following vowel at all frequencies
- **Alveolar**: ~2 cm cavity → prominence at ~4500 Hz; burst exceeds vowel by 10-20 dB at high frequencies
- **Velar**: variable cavity → prominence in F2 or F3 range (depends on front/back vowel); burst amplitude within a few dB of corresponding vowel spectral peak

**Turbulence source location:**
- Alveolar: at lower incisors, ~1 cm downstream from constriction
- Glottal aspiration: distributed 1-3 cm downstream from glottis

**Formant transitions:**
- F1 always low (~200 Hz) at release (complete closure)
- F2, F3 depend on constriction position and anticipatory vowel configuration
- Velar: slower F1 transition into vowel (slower area increase + longer constriction)
- Formant transitions over first few tens of ms provide place-of-articulation cues

### Key Acoustic Cues from 50 ms Post-Release (Section 4)

Three types of evidence for place of articulation:
1. Lowest natural frequency of front cavity (or absence thereof)
2. Vocal-tract configuration posterior to constriction (formant transitions)
3. Rate of change of constriction area

### Practical Notes for Burst Spectrum Measurement

- Transient and frication spectra are temporally close — hard to separate
- True "burst" spectrum (uncontaminated by posterior resonances) requires time window of **a few ms centered on release**
- Spectra of [ata]: broad high-frequency peak at release, lower-frequency prominences appear within a few ms as source shifts to glottis

### Synthesis Implementation Relevance

- The PLSTEP burst mechanism in Qlatt corresponds to the initial transient (source type 1)
- AF (frication amplitude) corresponds to source type 2; use Uc^3 * Ac^(-2.5) scaling
- AH (aspiration amplitude) corresponds to source type 3
- The temporal sequence (transient → frication → aspiration → voicing) should be modeled with appropriate timing:
  - Transient: < 1 ms
  - Frication dominance: ~1-3 ms (labial/alveolar), longer for velar
  - Transition to aspiration/voicing: ~3-20 ms depending on place
- Wall compliance contributes significantly to burst airflow — affects burst amplitude calculation
- Velar stops need 4x slower constriction opening rate than labial/alveolar

## Collection Cross-References

### Already in Collection
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited as the foundational acoustic theory reference
- [[Shadle_1985_FricativeAcoustics]] — cited for the turbulence noise source amplitude formula (Uc^3 * Ac^(-2.5))

### Cited By (in Collection)
- [[Hanson_2003_AspiratedStopsModels]] — uses Stevens' three-phase model (transient → frication → aspiration → voicing) as baseline, then challenges it by showing aspiration overlays transitions rather than being a separate phase
- [[Hanson_2002_HLsynSourceParameters]] — cites for the low-frequency equivalent-circuit model of pressures and airflows used in HLsyn
- [[Abramson_Whalen_2017_VOTat50]] — cites as theoretical foundation for stop consonant production models

### New Leads (Not Yet in Collection)
- Stevens (1971) — "Airflow and turbulence noise for fricative and stop consonants" — nonlinear resistance model for constriction flow
- Rothenberg (1968) — "The breath stream dynamics of simple-released-plosive production" — wall compliance values for burst modeling

### Conceptual Links (not citation-based)
- [[Zue_1976_StopConsonantAcoustics]] — provides the detailed empirical burst spectra and VOT measurements that Stevens' aerodynamic model predicts; complementary theory-vs-data perspectives on the same stop consonant phenomena
- [[Klatt_1975_VoiceOnsetTimeFrication]] — Stevens' four-source model provides the aerodynamic explanation for why burst duration increases labial < alveolar < velar, which Klatt's measurements quantify
