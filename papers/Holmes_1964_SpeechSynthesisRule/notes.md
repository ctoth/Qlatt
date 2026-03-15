# Holmes, Mattingly & Shearme 1964 - Speech Synthesis by Rule

## Implementation Notes

### System Architecture

- Parallel formant synthesizer controlled by computer programme
- 9 parameters updated every 10 msec time-unit:
  - F0 (fundamental frequency)
  - S (switch: selects pulse generator S=1, noise generator S=0)
  - F1, F2, F3 (frequencies of three variable resonant circuits)
  - A1, A2, A3 (amplitudes of inputs to the three variable resonant circuits)
  - A_HF (amplitude of input to high-frequency circuits)
- Fixed resonant circuit at 3500 Hz (always pulse-excited)
- Band-pass filter at 3400-4000 Hz (always noise-excited)
- Amplitudes of variable resonant circuits AND high-frequency circuits are independently variable

### Parameter Quantization

- Each parameter assigned values in range 1-31
- F0: spaced approximately logarithmically from 50 to 250 cps; S=1 selects pulse, values 2-30 are not used
- F1: 30 cps apart, from 130 to 1030 cps
- F2: 60 cps apart, from 760 to 2560 cps
- F3: 60 cps apart, from 1540 to 3340 cps
- Amplitude parameter value of 1 means -infinity (circuit turned off)
- Amplitude values 2-31 are spaced 1.75 dB apart, from 3.5 to 54.25 dB
- dB reference levels chosen so number of decibels is proportional to parameter value

### Input Representation

Two inputs to the programme:
1. **Input sentence**: phonemic transcription using literal symbols for "phonetic elements", with associated F0 values and optional modifier symbols
2. **Input tables**: one table per phonetic element containing steady-state values and transition specifications

### Phonetic Elements

- Phonetic element is the operational equivalent of a phoneme (basic input unit)
- Literal symbols used because IPA impractical for computer input
- Approximate correspondence to phonemes (see Appendix 1):
  - Some phonemes need 2-3 elements (e.g., diphthongs = two vowel-like elements)
  - Some allophones of one phoneme represented by distinct elements
- Three non-phonemic elements: Q (100 msec silence), QQ (zero duration), END (end of sentence)

### Input Table Structure (Appendix 1 - 27 columns per element)

For each element, the input table stores:
1. Phoneme symbol
2. Element symbol
3. Rank (1-31, high = transitions characteristic of phoneme; low = transitions depend on adjacent phonemes)
4. Standard duration (in 10 msec time-units)
5. Duration in unstressed position (vowels only)
6. Switch S condition (0 = noise, 1 = pulse)
7-9. Steady-state values for F1, F2, F3
10-12. Fixed contribution to boundary value for F1, F2, F3
13-14. Proportion of adjacent element's steady-state value added to fixed contribution (for F1/F2 and F3)
15-16. Duration of external transitions for F1/F2 and F3 (in time-units)
17. Steady-state A1 value (dB)
18-19. A1 amplitude: fixed contribution and proportion for boundary
20-21. A2 amplitude: fixed contribution and proportion
22-23. A3 amplitude: fixed contribution and proportion
24-25. A_HF amplitude: fixed contribution and proportion
26-27. Duration of external/internal amplitude transitions

### Transition Calculation Algorithm

This is the core algorithm and directly relevant to Qlatt's rule-based transitions:

1. **Dominance**: Of two adjacent elements, the one with higher rank controls transitions on both sides of the boundary. Equal rank: first element dominates.

2. **Boundary value calculation**:
   ```
   boundary_value = fixed_contribution + (proportion * adjacent_steady_state)
   ```
   Where fixed_contribution and proportion come from the dominant element's table.

3. **Transition interpolation**: Linear interpolation between boundary values and steady-state values:
   - **Internal transition**: transition during the dominant element (duration from table col 16/27)
   - **External transition**: transition during the adjacent element (duration from table col 15/26)

4. **Transition intersection rule**: If the sum of internal + external transition durations < element duration, initial transition is followed immediately by final transition. If they overlap:
   - Calculate both transitions
   - If paths intersect, use intersection values
   - If paths don't intersect, discard calculated values and use linear interpolation between initial and final boundary values for entire element duration

5. **Special transitions**:
   - Between two vowels: boundary = average of steady-state values (equal internal and external durations)
   - /h/: heavily modified by adjacent vowel, external Fn transitions for stops/nasals terminate at "locus" (average of element and adjacent steady-state per Delattre 1955)
   - Stops/nasals/fricatives: amplitude internal and external transitions are zero, resulting in simple discontinuity at boundary

### Stop Consonant Representation (Three-Element Sequence)

Stops are represented as three elements:
1. **First element**: closure period, high energy at beginning of release (dominates the first and third elements, controls frequency transitions into and out of stop)
2. **Second element**: zero duration, like second element of stop - inhibits transitions between first and third
3. **Third element**: diminished energy at end of release

- Voiceless affricate /tf/: two-element sequence (table entries for first = those for /t/, second = those for /sh/, both shortened)
- Voiced affricate /d3/: four-element sequence like voiced fricative constructed from /d/ and the fricative sequence
- Voiced fricatives: three-element sequence [ZH, QQ, ZI] where ZH and ZI bracket the fricative

### F0 Contour

- F0 specified once per element in input sentence
- Value = F0 at boundary between current and preceding element
- Programme interpolates linearly between successive F0 boundary values
- F0 is always calculated regardless of S (switch) condition - even during voiceless sounds (design constraint of synthesizer)
- Special F0 contours can be specified for some or all time-units via programme option

### Modifiers

Modifiers alter table entries for specific occurrences:
- `(` : selects unstressed vowel duration (column 5)
- `%` : lengthens preceding vowel and nasal by two time-units each
- `?` : inhibits insertion of second/third stop elements (used for unreleased stops)
- `=` : followed by position number and new duration value (temporary table change)
- Computer triggers `3(` and `4(`: bracket special F0 values for elements like [ER]

### Key Acoustic Observations

- Formant frequencies in running speech tend to be centralized (Shearme 1961)
- Steady-state values in tables derived from isolated words/special contexts - centralizing them would improve naturalness
- Quality of synthesized-by-rule speech is nearly as good as directly synthesized speech
- Main differences: rule version has more extreme steady-state values, longer steady states, more abrupt transitions
- Synthesizer limitations: no nasal resonance, forced choice between noise and pulse excitation (problematic for voiced fricatives), parallel formant arrangement less faithful for vowels but convenient for consonant amplitude control

### Recognized Limitations (stated by authors)

1. No allophonic variation rules - allophones either ignored or represented by distinct elements
2. No stress/intonation rules - F0, amplitude, duration copied from human speech (modifiers handle some duration changes)
3. Tables developed for English, substantially correct but improvable

### Parameter Values from Tables (Appendix 1)

**Consonants** (selected values, columns 7-9 = F1/F2/F3 steady state):

| Phoneme | Element | Rank | Dur | S | F1 | F2 | F3 |
|---------|---------|------|-----|---|----|----|-----|
| /p/ | P | 8 | 0 | 190 | 110 | 760 | 350 | 2500 |
| /t/ | T | 6 | 0 | 190 | 110 | 1780 | 950 | 2680 |
| /k/ | K | 8 | 0 | 190 | 110 | 1480 | 1550 | 2620 |
| /b/ | D (for /b/) | 12 | 1 | 190 | 110 | 760 | 350 | 2500 |
| /d/ | D (for /d/) | 8 | 1 | 190 | 110 | 1780 | 950 | 2680 |
| /g/ | G | 12 | 1 | 190 | 110 | 1480 | 1550 | 2620 |
| /m/ | M | 6 | 1 | 190 | 110 | 1000 | 350 | 2200 |
| /n/ | N | 6 | 1 | 190 | 110 | 1300 | 950 | 2620 |
| /ng/ | NG | 6 | 1 | 310 | 110 | 820 | 1550 | 2800 |
| /f/ | F | 12 | 0 | 400 | 170 | 1420 | 350 | 2560 |
| /th/ | TH | 15 | 0 | 400 | 170 | 1780 | 1190 | 2680 |
| /s/ | S | 12 | 0 | 400 | 170 | 1720 | 950 | 2620 |
| /sh/ | SH | 12 | 0 | 400 | 170 | 2020 | 1190 | 2560 |
| /h/ | H | 10 | 0 | 490 | 0 | 1480 | 0 | 2500 |
| /l/ | L | 8 | 1 | 460 | 230 | 1480 | 710 | 2500 |
| /r/ | R | 11 | 1 | 490 | 0 | 1180 | 590 | 1600 |
| /w/ | W | 8 | 1 | 190 | 50 | 760 | 350 | 2020 |
| /j/ | Y | 7 | 1 | 250 | 110 | 2500 | 1190 | 2980 |

**Vowels** (selected, columns 7-9 = F1/F2/F3 steady state):

| Phoneme | Element | Rank | Dur | Unstressed Dur | F1 | F2 | F3 |
|---------|---------|------|-----|----------------|----|----|-----|
| /^/ | U | 9 | 6 | 1 | 700 | 350 | 1360 |
| /o/ | O | 9 | 6 | 1 | 610 | 290 | 880 |
| /u/ | OO | 6 | 4 | 1 | 370 | 170 | 1000 |
| /a/ | A | 4 | 4 | 1 | 490 | 230 | 1480 |
| /i:/ | EE | 11 | 7 | 1 | 250 | 110 | 2320 |
| /3:/ | ER | 16 | 16 | 1 | 580 | 290 | 1420 |
| /a:/ | AR | 15 | 15 | 1 | 790 | 410 | 880 |
| /ae/ | AA | 10 | 1 | 790 | 410 | 1780 |

Note: These are British RP vowel targets, not American English. F values in the table are quantized parameter values that map to actual Hz via the quantization scheme described above.

## Collection Cross-References

### Already in Collection
- `Peterson_1960_DurationSyllableNuclei` — Peterson & Lehiste 1960, source for vowel duration data (cited)

### Cited By (in Collection)
- `Rosenberg_1971_EffectGlottalPulseShape` — references Holmes et al. 1964
- `Hu_2012_DynamicsModelSpeechRecognitionSynthesis` — references Holmes et al. 1964
- `Carlson_1995_ModelsOfSpeechSynthesis` — references Holmes 1964 as foundational synthesis-by-rule
- `Hertz_1982_SRS_TextToSpeech` — references Holmes et al. synthesis-by-rule approach
- `Rabiner_1968_DigitalFormantSynthesizer` — references Holmes et al. 1964
- `Hertz_1987_DeltaNonLinearPhonology` — references Holmes et al. transition model
- `Hertz_1985_DeltaRuleSystem` — references Holmes et al. transition model
- `Strong_1967_MachineAidedFormantDetermination` — references Holmes et al. 1964
- `Allen_1987_MITalk_TTS` — references Holmes et al. as prior synthesis-by-rule system
- `Klatt_1980_CascadeParallelFormantSynthesizer` — references Holmes et al. parallel synthesizer

### New Leads
- Kelly & Gerstman 1961 — first computer-driven synthesis by rule
- Liberman et al. 1959 — minimal rules for synthesizing speech

### Conceptual Links (not citation-based)
- `Klatt_1980_CascadeParallelFormantSynthesizer` — Klatt's cascade/parallel architecture builds on Holmes's parallel formant approach
- `Carlson_1975_RuleBasedTTS` — Swedish rule-based synthesis system contemporaneous with Holmes's approach
