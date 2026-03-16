---
title: "Stevens & Klatt (1974) — Implementation Notes"
year: 1974
---

# Stevens & Klatt (1974) — Implementation Notes

## Key Finding

VOT alone does not fully determine the voiced-voiceless distinction for prestressed stops. The presence or absence of a **rapid spectrum change (formant transition) at voicing onset** is a second, independent cue that trades with VOT.

## Quantitative Results

### Experiment 1: Nonspeech temporal order threshold
- Stimuli: 5 ms broadband noise burst + silent interval (0-40 ms in 5 ms steps) + synthetic vowel (fixed formants, no transitions)
- Task: detect silent interval between burst and buzz
- Result: 50% detection threshold at VOT ~20 ms
- Below ~15 ms: burst and buzz perceived as simultaneous
- Above ~25 ms: silent interval reliably detected
- Consistent with Hirsh (1959) temporal order threshold of ~20 ms

### Experiment 2: VOT x transition duration trading

**Synthesizer parameters:**
- Digital terminal-analog synthesizer (Klatt 1972)
- Voicing source: -12 dB/octave above 300 Hz
- Aspiration/frication: flat to 5 kHz
- 5 cascade resonators for vowel tract
- Separate resonators for fricative transfer function
- 5 kHz bandwidth output
- Control parameters updated every 5 ms

**Stimulus design:**
- 5 ms frication burst + variable aspiration + voicing
- Burst: single resonator at F5 frequency/bandwidth, level 6 dB above F5 in steady vowel
- Aspiration: level set so F3/F4 region continuous from aspiration to voicing (no discontinuity)
- F0: 130 Hz fixed from voicing onset to 80 ms, then linear fall to 100 Hz at 350 ms
- Formant bandwidths: B1=50, B2=80, B3=120, B4=180, B5=300 Hz (constant)
- F5=4500, F4=3500, F3=2500 Hz (fixed)
- F1 and F2 follow one of four transition trajectories (a through d, moderate to rapid)
- VOT range: 15-55 ms
- 16 stimuli total (4 trajectories x 4 VOT values)
- Vowel target roughly [a]

**Key result — phoneme boundary shift:**
- Average VOT at /d/-/t/ boundary: 26 ms (fastest transition, d) to 39 ms (slowest transition, a)
- ~13 ms shift in phoneme boundary for 30 ms change in transition duration
- Individual variation: listener AWFH showed ~25 ms shift (boundary tracks transition completion); listener VZ showed ~5 ms shift (boundary tracks absolute VOT more)
- Data fall between two extreme models:
  - Horizontal line = pure VOT model (boundary at fixed absolute VOT)
  - Sloping line = pure transition model (boundary at fixed residual transition duration after voicing onset)
- Best-fit sloping line corresponds to ~23 ms of residual F1 transition after voicing onset

### Transition detection threshold
- ABX test with synthetic vowel /a/
- F1 transition rate: 500 Hz / 60 ms (constant across stimuli)
- Transition durations tested: 0, 5, 10, 15, 20 ms
- 75% correct detection threshold: ~13 ms transition duration
- This is ~10 ms less than the ~23 ms maximum transition that triggers /t/ response
- Difference attributed to burst/aspiration masking the transition onset

## Proposed Perceptual Strategy (for prestressed position)

1. Consonantal presence signaled by rapid spectrum change above ~1000 Hz at point of abrupt intensity increase, over 20-30 ms
2. If VOT < 20 ms: burst onset and voicing onset integrated as single event -> voiced
3. If VOT > 20 ms: two successive events perceived
   - If formant transitions completed before voicing onset -> voiceless
   - If substantial transitions remain at voicing onset -> conflicting cues (trading relationship)
4. Most natural voiceless stop: VOT > 20 ms AND transitions completed before voicing

## Implications for Place of Articulation and VOT

- Velars have slower articulatory movements -> slower formant transitions -> need longer VOT to complete transitions before voicing
- Explains cross-linguistically observed VOT ordering: velar > dental > labial
- Klatt (1973a) mechanism: glottal closure initiated reflexly by rapid intraoral pressure drop; time from end of frication burst to voicing onset is roughly constant across places of articulation

## Implications for Consonant Clusters

- In "breed" (/br/): VOT ~10 ms, [r] is short
- In "pry" (/pr/): VOT ~60 ms, [r] lengthened by ~30 ms
- Sonorant lengthening prevents voicing onset from falling during rapid sonorant-vowel formant transitions, which would create a false voicing cue

## Scope Limitation

The trading relationship applies specifically to:
- Single consonants preceding stressed vowels
- Initial consonants in clusters
- NOT to post-vocalic or intervocalic pre-unstressed positions (where vowel duration, closure duration, and other cues dominate)

## Relevance to Klatt Synthesizer

1. **F1 onset frequency and transition**: When synthesizing voiced stops, ensure F1 transition begins at voicing onset (low F1 rising to vowel target). For voiceless aspirated stops, formant transitions should be completed before voicing onset.
2. **Aspiration-to-voicing continuity**: Aspiration amplitude should be set so F3/F4 energy is continuous across the aspiration-to-voicing boundary (no level discontinuity).
3. **Burst spectrum**: Burst produced by exciting a single resonator at F5 frequency/bandwidth, level ~6 dB above steady-state F5 level.
4. **Sonorant lengthening in clusters**: Duration of sonorants following voiceless stops must be increased to preserve voicelessness cue.
5. **VOT values by place**: The synthesizer should use longer VOT for velars than dentals, and dentals than labials, consistent with the transition-completion requirement.
