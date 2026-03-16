---
title: "Chen 1970 - Vowel Length Variation as a Function of the Voicing of the Consonant Environment"
year: 1970
---

# Chen 1970 - Vowel Length Variation as a Function of the Voicing of the Consonant Environment

## Key Finding

Vowel duration varies as a function of the voicing of the **following** consonant. This is a **language-universal** phenomenon, though the magnitude varies by language. Vowels are longer before voiced consonants and shorter before voiceless consonants.

## Cross-Linguistic Vowel Duration Ratios (Table V, p. 138)

Ratio = duration before voiceless / duration before voiced (lower = bigger effect):

| Language   | Before voiceless (ms) | Before voiced (ms) | Mean difference (ms) | Ratio |
|------------|----------------------|-------------------|---------------------|-------|
| English    | 146                  | 238               | 92                  | 0.61  |
| French     | 354                  | 407               | 53                  | 0.87  |
| Russian    | 131                  | 160               | 29                  | 0.82  |
| Korean     | 91                   | 119               | 28                  | 0.78  |

Additional languages from published sources (Table VI, p. 139):

| Language/Source     | Before voiceless | Before voiced | Difference | Ratio |
|--------------------|-----------------|--------------|------------|-------|
| English (P-L)      | 197             | 297          | 100        | 0.66  |
| English (Z-S)      | 145             | 228          | 83         | 0.64  |
| English (H-F)      | 174             | 253          | 79         | 0.69  |
| German (Meyer)     | --              | --           | --         | 0.90  |
| Spanish (Z-S)      | 109             | 127          | 18         | 0.86  |
| Norwegian (Fintoft) | 148             | 181          | 33         | 0.82  |

## Implementation-Critical Values for English

### Voicing-conditioned duration multipliers

For English, the ratio of vowel duration before voiceless vs. voiced consonants is approximately **0.61-0.69** across studies. This means:
- Vowels before voiced consonants are ~1.5-1.6x longer than before voiceless consonants
- Or equivalently, vowels before voiceless consonants are ~61-69% the duration of vowels before voiced consonants

### Recommended implementation (for Klatt synthesizer duration rules)

If baseline vowel duration assumes a neutral context, apply:
- Before voiced obstruent: multiply duration by ~1.2 (lengthening)
- Before voiceless obstruent: multiply duration by ~0.8 (shortening)
- This yields an approximate ratio of 0.67, consistent with the English data

### English Word-Pair Data (Table I, p. 136)

| Voiceless context | Duration (ms) | Voiced context | Duration (ms) | Ratio |
|-------------------|---------------|----------------|---------------|-------|
| /laep/ (lap)      | 155           | /laeb/ (lab)   | 300           | 0.52  |
| /faet/ (fat)      | 170           | /faed/ (fad)   | 308           | 0.55  |
| /laek/ (lack)     | 158           | /laeg/ (lag)   | 357           | 0.44  |
| /aempl/ (ample)   | 148           | /aembl/ (amble)| 147           | 1.01  |
| /sent/            | 123           | /send/         | 147           | 0.84  |
| /kilt/            | 102           | /kild/ (killed)| 120           | 0.85  |
| /baenk/ (bank)    | 165           | /baeng/ (bang) | 288           | 0.57  |

Note: The effect is strongest for simple CVC words with final stops (ratios 0.44-0.57) and weaker in consonant clusters (ratios 0.84-1.01).

## Closure Time Data (Table VIII, p. 144)

| Language | Voiceless closure (ms) | Voiced closure (ms) | Difference | Ratio |
|----------|----------------------|---------------------|------------|-------|
| English  | 140                  | 88                  | 52         | 0.63  |
| Korean   | 124                  | 54                  | 70         | 0.45  |

Closure time for voiceless stops is longer than for voiced stops, roughly inversely related to vowel duration pattern. This is relevant to compensatory temporal adjustment hypothesis.

## Lip Velocity Data (Table XIII, p. 156)

Velocity of lip closure movement toward final stop (deltaD/deltaT):

| Voiceless final | Velocity | Voiced final | Velocity |
|----------------|----------|-------------|----------|
| lap            | 1.10     | lab         | 0.76     |
| nap            | 0.87     | nab         | 0.82     |
| cup            | 1.00     | cub         | 0.56     |
| pup            | 0.82     | pub         | 0.68     |
| rip            | 0.47     | rib         | 0.56     |
| bop            | 0.98     | Bob         | 0.81     |
| **average**    | **0.87** |             | **0.69** |

Ratio: 0.69/0.87 = 0.79. Lip closure is faster for voiceless stops.

## Time of Lip Closure Movement (Table XIV, p. 156)

| Voiceless final | Time (ms) | Voiced final | Time (ms) |
|----------------|-----------|-------------|-----------|
| lap            | 63        | lab         | 80        |
| nap            | 63        | nab         | 82        |
| cup            | 55        | cub         | 88        |
| pup            | 57        | pub         | 108       |
| rip            | 52        | rib         | 58        |
| bip            | 58        | bib         | 102       |
| bop            | 78        | Bob         | 97        |
| **average**    | **61**    |             | **88**    |

Mean difference: 27 ms. This correlates with the mean vowel duration difference found in Korean (28 ms), Russian (29 ms), Spanish (18 ms), and Norwegian (33 ms), but is smaller than the English vowel duration difference (92 ms).

## Vowel+Sonorant Sequences (Table XII, p. 150)

The voicing effect extends to the entire vowel+sonorant sequence, not just the vowel alone:

| Following consonant | Vowel ratio | Sonorant ratio | Total ratio |
|-------------------|-------------|----------------|-------------|
| [+vcd] nasal      | 0.65        | 0.64           | 0.65        |
| [+vcd] /l/        | 0.65        | 0.68           | 0.65        |
| [+vcd] /r/        | 0.76        | 0.66           | 0.70        |

## Theories Evaluated

1. **Articulatory distance** (Jespersen): Rejected -- buccal articulation position is identical for voiced/voiceless cognate pairs.

2. **Articulatory energy expenditure** (Belasco): Vowel duration varies inversely with energy required for following consonant. Interesting but lacks direct experimental support.

3. **Perceptual distance** (Lisker): Vowel lengthening/shortening maintains perceptual contrast between voiced and voiceless consonants. Partially supported but does not explain cross-linguistic variation.

4. **Compensatory temporal adjustment** (Kozhevnikov & Chistovich): Rejected by Chen's data -- total syllable duration is NOT constant (Table X shows total duration varies significantly).

5. **Laryngeal adjustment** (Chomsky & Halle, Halle & Stevens): Vocal cord adjustment time for voicing requires more time before voiced obstruents, extending vowel duration. Partially supported but does not explain why the effect extends through sonorant sequences.

6. **Rate of closure transition** (Chen's preferred explanation): The speed of lip/jaw movement toward consonantal closure is faster for voiceless stops than voiced stops. This is because greater intra-oral pressure behind voiceless closure requires greater muscular force, resulting in faster closure. The 27 ms mean difference in closure transition time closely matches the cross-linguistic vowel duration differences for most languages (18-33 ms). English shows a larger effect (92 ms) due to the added perceptual function of vowel length in the English phonological system.

## Key Conclusions for Synthesis

1. The voicing-conditioned vowel duration difference is universal but language-specific in magnitude
2. For English, the effect is particularly large (ratio ~0.61-0.69) because it serves a perceptual/phonological function
3. The effect is strongest in simple CVC syllables with final stops
4. The effect is weaker in consonant clusters
5. The effect extends through intervening sonorants to the following obstruent
6. The primary articulatory mechanism is differential closure transition speed

## Collection Cross-References

### Already in Collection
- `Fant_1960_AcousticTheorySpeechProduction` — Fant 1960, acoustic theory (cited)
- `Peterson_1960_DurationSyllableNuclei` — Peterson & Lehiste 1960, vowel duration data (cited)
- `Klatt_1976_SegmentalDuration` — Klatt 1976 duration rules cite Chen 1970 as a primary source for voicing-conditioned vowel duration

### Cited By (in Collection)
- `Klatt_1976_SegmentalDuration` — uses Chen 1970 voicing-conditioned vowel duration data
- `Keating_1984_PhoneticPhonologicalRepresentationStop` — references Chen on voicing distinctions
- `Klatt_1975_VoiceOnsetTimeFrication` — references Chen 1970
- `Hombert_1979_PhoneticToneDevelopment` — references Chen on vowel duration
- `Hertz_1991_StreamsPhonesTransitions` — references Chen 1970
- `Crystal_House_1988_StopConsonantDuration` — references Chen 1970

### New Leads
- Delattre 1962 — cross-linguistic vowel duration factors
- Kozhevnikov & Chistovich 1967 — syllable timing theory

### Conceptual Links (not citation-based)
- `Umeda_1975_VowelDurationAmericanEnglish` — companion vowel duration study for American English connected speech
- `Oller_1973_EffectPositionUtteranceDuration` — positional duration effects interact with voicing-conditioned duration
- `Lisker_1964_CrossLanguageVoicingInitialStops` — VOT as the primary voicing distinction; Chen 1970 addresses the durational correlate on the preceding vowel
- `Peterson_1960_DurationSyllableNuclei` — foundational vowel duration data that Chen extends cross-linguistically
