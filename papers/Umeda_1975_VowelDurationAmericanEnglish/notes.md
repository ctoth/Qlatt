---
title: "Umeda 1975 — Vowel Duration in American English"
year: 1975
---

# Umeda 1975 — Vowel Duration in American English

## Implementation-Focused Notes

### Overview

Large-corpus study of vowel duration in continuous American English speech by three speakers (SP, JH, CC), each reading 10-20 minutes of text. Derives duration rules as multiplicative factors applied to a base duration, with consonantal (C) and stress-situation (S) factors.

### Duration Rule (Eq. 1 and 2)

For the diphthong /aI/:

```
T = 60 + S(130 + 130 * C)        ... (1)
```

Generalized form for all vowels:

```
T = T_0 + S(K_1 + K_2 * C)       ... (2)
```

Where:
- **T** = vowel duration in ms
- **T_0** = minimum duration (vowel-dependent constant)
- **K_1**, **K_2** = vowel-dependent constants
- **S** = stress-situation factor (0 to 1.0)
- **C** = consonant factor (0 to 1.0)

The model is multiplicative: S and C interact. A vowel in a function word with a voiceless stop following gets a very short duration; a stressed prepausal vowel before a voiced fricative gets maximum duration.

### Table I: Constants T_0, K_1, K_2 (Speaker SP)

| Vowel | T_0 (ms) | K_1 | K_2 |
|-------|----------|-----|-----|
| /I/   | 20       | 100 | 100 |
| /E/   | 45       | 130 | 105 |
| /A/   | 25       | 135 | 130 |
| /i/   | 60       | 110 | 130 |
| /e/   | 45       | 105 | 170 |
| /a/   | 95       | 160 | 70  |
| /ae/  | 30       | 145 | 155 |
| /aI/  | 60       | 130 | 130 |

Notes:
- Lax vowels (/I/, /E/, /A/) have low T_0 (20-45 ms)
- Tense vowels (/i/, /e/) have moderate T_0 (45-60 ms)
- Low vowel /a/ has highest T_0 (95 ms)
- /ae/ has a notably large K_2 (155), making it very sensitive to following consonant

### Table II: C-factor (Consonant Factor) per Vowel

C ranges from 0.0 (voiceless stop following) to 1.0 (voiced fricative following):

| Vowel | Vcl stop | Vcl fric | Nasal | Vcd stop | Vowel ending | Vcd fric |
|-------|----------|----------|-------|----------|-------------|----------|
| /I/   | 0.       | 0.23     | 0.30  | 0.39     | ...         | 1.00     |
| /E/   | 0.       | 0.47     | 0.14  | 0.36     | ...         | 1.00     |
|       |          |          |       | 0.86 (a) |             |          |
| /A/   | 0.       | 0.08     | 0.43  | 0.57     | ...         | 1.00     |
| /i/   | 0.       | 0.11     | 0.44  | 0.68     | 0.97        | 1.00     |
| /e/   | 0.       | 0.21     | 0.60  | 0.30     | 0.85        | 1.00     |
| /o/   | 0.       | 0.21     | 0.40  | 0.61     | ...         | 1.00     |
| /ae/  | 0.       | 0.40     | 0.43  | 0.61     | ...         | 0.73     |
|       |          | 1.00 (b) |       |          |             |          |
| /aI/  | 0.       | 0.23     | 0.44  | 0.59     | 0.75        | 1.00     |

(a) = voiced-stop clusters; (b) = SP dialect peculiarity

**Consonant ordering for lengthening effect:**
/n/ < voiceless stops < nasal other than /n/ and nasal clusters < /s/ and voiceless clusters < open vowels < voiced fricatives

Simplified: voiceless stops < nasals < voiceless fricatives < voiced stops < voiced fricatives

### Table III: S-factor (Stress-Situation Factor) per Vowel

S ranges from near 0 (function words) to 1.0 (prepausal stressed):

| Vowel | Function words |   |      | Polysyllabic |      | Monosyllabic |      |      | Prepausal |      |      |
|-------|-------|------|------|------|------|------|------|------|------|------|------|
|       | SP    | JH   | CC   | SP   | JH   | SP   | JH   | CC   | SP   | JH   | CC   |
| /I/   | 0.16  | 0.24 | 0.36 | 0.30 | 0.30 | 0.47 | 0.47 | 0.60 | 1.00 | 1.00 | 1.00 |
| /E/   | ...   | ...  | ...  | 0.30 | ...  | 0.40 | 0.45 | 0.68 | 0.75 | 0.79 | 1.00 |
| /A/   | 0.07a | 0.20 | 0.25 | 0.39 | 0.39 | 0.39 | 0.50 | 0.68 | 0.90 | 0.90 | 1.00 |
|       | 0.11b |      |      |      |      |      |      |      |      |      |      |
| /i/   | 0.00  | 0.00 | 0.15 | 0.18 | 0.18 | 0.18 | 0.30 | 0.40 | 0.53 | 0.63 | 1.00 |
| /e/   | 0.13  | ...  | ...  | 0.48 | 0.57 | 0.32 | 0.40 | 0.68 | 0.75 | 0.75 | 1.00 |
| /o/   | ...   | ...  | ...  | 0.10 | 0.20 | 0.43 | ...  | 0.47 | 0.85 | ...  | 1.00 |
| /ae/  | 0.13  | 0.20 | 0.28 | 0.50 | 0.55 | 0.59 | 0.68 | 0.71 | 0.80 | 0.87 | 1.00 |
| /aI/  | 0.18  | 0.23 | 0.37 | 0.46 | 0.46 | 0.46 | 0.60 | 0.71 | 0.85 | 0.93 | 1.00 |

a = "The" and "a."; b = other function words

### Positional Conditions (Section I.A)

Three positional categories for stressed vowels:
1. **Prepausal** — vowel in last syllable before a pause (including pseudopause). Longest durations.
2. **Monosyllabic** — vowel in monosyllabic word or stressed vowel in last syllable of polysyllabic word, both in nonprepausal positions. No significant difference between these two sub-conditions.
3. **Polysyllabic** — all other stressed vowels in polysyllabic words. Shortest stressed durations.

### Vowel Categories by Durational Behavior (Section I.B, Fig. 4)

Vowels group into four durational categories:
1. **Lax vowels**: /I/, /E/, and /A/ — shortest inherent durations
2. **Tense vowels**: /i/, /e/, /o/, and /3/ — intermediate
3. **Low vowels**: /ae/ and /a/ — long inherent durations
4. **Diphthongs**: /aI/ and /aU/ — longest

Before voiceless stops: all vowels behave similarly (all short).
Before voiceless fricatives: low vowels behave opposite to other groups.
/ae/ has a deterministic influence on the consonant ordering, different from other vowels.

### Word Prominence Effect (Section I.C)

Word prominence (information load / predictability) strongly affects vowel duration:
- High-frequency/predictable words have shorter vowel durations
- The word "said" (1961/million occurrences) has much shorter /E/ than "bed" (127/million)
- Repetition drastically reduces duration: second occurrence of "father" shows /a/ reduced by ~75 times compared to first occurrence
- Function words up to 50th rank in Kucera-Francis (51,216 words total) are treated as function words

### Function Word Vowels (Section I.D)

- Function words show reduced but vowel-identity-dependent durations
- Speaker JH durations ~10 ms longer than SP; CC 20-30 ms longer
- Duration depends on vowel identity and following consonant even in function words
- Many function words begin/end with /w/ or vowels, making boundaries hard to determine

### Consonant Effect Details (Section I.B)

- Following consonant voicing is the primary factor for prepausal vowels
- For monosyllabic and polysyllabic positions, the effect is slight except before voiceless stops
- Voiced fricatives consistently produce longest preceding vowel durations
- No consistent effect of preceding consonants except /h/ (vowel is shortest after /h/)
- Intervocalic flap /t/ and /d/ do not significantly affect preceding stressed vowel duration

### Unstressed Vowels (Section III)

Three classes:
1. Schwas or reduced vowels in unstressed syllables (most common)
2. Vowels retaining identity but unstressed ("realize", "identification", "ancestor")
3. Vowels with secondary stress

Word-final unstressed vowels:
- Prepausal suffixes are longer than nonprepausal ones (Fig. 26)
- Suffixes like "-tion"/"-tions" are shortest (~30-40 ms prepausal)
- Suffixes like "-er", "-ers", "-y" are longest (~120-140 ms prepausal)
- Lengthening order: /n/ < voiceless stops < nasals < /s/ < voiced fricatives (same as stressed)

Non-word-final unstressed vowels:
- Duration ~17 ms standard deviation
- Word-initial unstressed vowels show slightly wider range than word-medial poststressed ones
- Articles and very short function words behave like word-medial poststressed vowels

### Diphthongization / Nonlinearity (Section II)

Monophthongs in American English become diphthongs under lengthening conditions. The tongue moves throughout the vowel rather than holding position. This causes nonlinearity in the duration rule:
- Lax vowels: diphthongization only in longest conditions (prepausal + voiced-fricative)
- Tense vowels: each shows its own nonlinearity pattern
- /aI/ follows the rule most regularly since it is inherently a diphthong

### Variability (Section IV)

Standard deviations for stressed vowels:
- **High/front vowels** (monosyllabic/polysyllabic, excluding prepausal): 13-15 ms
- **Low/central vowels**: ~20 ms
- **Prepausal condition**: 22-29 ms for all vowels
- **Function words**: 10-15 ms for most; /ae/ group shows 14-20 ms
- **Unstressed word-initial**: 17 ms
- **Unstressed word-medial poststressed**: 11 ms
- **Unstressed word-final**: 13 ms average, 7-17 ms range

Speaker JH durations are 2-4 ms SD greater than SP.

### Implementation Notes for Klatt Synthesizer

1. **Duration model**: Use Eq. 2 with Table I constants as vowel-specific base durations. The three-factor model (T_0 + S * (K_1 + K_2 * C)) is compact and captures the main effects.

2. **C-factor lookup**: Build a consonant-class-to-C-factor table per vowel. Can simplify to 6 categories: voiceless stop, voiceless fricative, nasal, voiced stop, vowel/open, voiced fricative.

3. **S-factor**: Requires knowing:
   - Function word vs content word (binary or gradient from word frequency)
   - Stress level (stressed/unstressed)
   - Syllable position (polysyllabic interior vs monosyllabic/final vs prepausal)

4. **Prepausal lengthening**: The largest single effect. Prepausal S=1.0 by definition; other conditions scale down from there.

5. **Unstressed vowels**: Word-final unstressed vowels need the same consonant-sensitive treatment. Non-word-final unstressed vowels can use a simpler model (~50-70 ms with small variation).

6. **Word prominence**: Could be approximated by a content-word/function-word binary, or by word frequency rank. The effect is substantial (can halve duration).

7. **Speaker differences**: CC (slow, deliberate reader) consistently has higher S-factors than SP or JH. This maps to speaking rate — a rate-dependent scaling of S would capture inter-speaker variation.

## Collection Cross-References

### Already in Collection
- `Klatt_1976_SegmentalDuration` — Klatt 1976 duration model incorporates Umeda's findings; cites this paper
- `Crystal_House_1988_StopConsonantDuration` — related duration measurements in connected speech
- `Crystal_1982_SegmentalDurationsConnectedSpeech` — references Umeda's vowel duration data
- `Peterson_1960_DurationSyllableNuclei` — Peterson & Lehiste 1960, syllable nuclei duration (cited as ref 2)
- `vanSanten_1994_SegmentalDurationTTS` — references Umeda's duration model

### Cited By (in Collection)
- `Klatt_1976_SegmentalDuration` — uses Umeda's duration data for rule calibration
- `Campbell_Isard_1991_SegmentDurationsSyllable` — cites Umeda on vowel duration
- `Crystal_House_1988_StopConsonantDuration` — references Umeda's duration findings
- `Crystal_1982_SegmentalDurationsConnectedSpeech` — cites Umeda's connected speech duration data
- `Carlson_1975_RuleBasedTTS` — references Umeda's duration rules
- `vanSanten_1994_SegmentalDurationTTS` — cites Umeda's multiplicative duration model
- `Coker_1973_AutomaticSynthesisOrdinaryEnglish` — references Umeda's duration work

### New Leads
- House & Fairbanks 1953 — Consonant environment effects on vowels (foundational for C-factor)
- House 1961 — Vowel duration in English (prior duration measurements)
- Harris & Umeda 1974 — Speaking rate effects on vowel duration (companion paper)

### Conceptual Links (not citation-based)
- `Oller_1973_EffectPositionUtteranceDuration` — Complementary positional duration study using nonsense syllables; Umeda uses continuous speech
- `Beckman_1990_LengtheningsShorteningsProsodic` — Distinguishes boundary lengthening from stress-timing effects relevant to Umeda's S-factor
- `vanSanten_1993_SegmentalDuration` — Statistical duration modeling extending Umeda's rule-based approach
