# Speech Rate Research for Qlatt

## Goal
Research how speech rate is implemented in Klatt-style synthesizers and TTS systems.
Enough to design a rate control feature for Qlatt.

## Key Findings

### 1. Klatt 1976 Duration Model

Klatt 1976 "Linguistic uses of segmental duration in English" (JASA 59, 1208-1221)
established the foundational duration model. Key concepts:

- Segments have INTRINSIC DURATION (INHDUR) and MINIMUM DURATION (MINDUR)
- Duration is modified by multiplicative PERCENTAGE FACTORS (PRCNT)
- Multiple factors combine multiplicatively
- COMPRESSIBILITY: segments cannot be shortened below MINDUR - this is the "incompressibility" principle

The formula (from Klatt 1979, refined from 1976):
  DUR = max(MINDUR, INHDUR * PRCNT1 * PRCNT2 * ... * PRCNTn)

### 2. Klatt 1979 Specific Rules (via UCL / van Santen)

Rules with approximate PRCNT values:

1. Pause insertion: 200ms before main clause boundaries, commas
2. Clause-final lengthening: PRCNT=1.4 for vowel/syllabic before pause, consonants between vowel and pause also 1.4
3. Non-phrase-final shortening: PRCNT=0.6 for syllabic segments not in phrase-final syllable
4. Unstressed shortening: unstressed MINDUR = MINDUR/2 (more compressible)
   - Syllabic in word-medial: PRCNT=0.5
   - Syllabic in other positions: PRCNT=0.7
   - Prevocalic liquid/glide: PRCNT=0.1
   - All others: PRCNT=0.7
5. Emphasis lengthening: PRCNT=1.4
6. Postvocalic context:
   - Open syllable word-final: PRCNT=1.2
   - Before voiced fricative: PRCNT=1.6
   - Before voiced plosive: PRCNT=1.2
   - Before unstressed nasal: PRCNT=0.85
   - Before voiceless plosive: PRCNT=0.7
   - All others: PRCNT=1.0
7. Non-word-initial consonant shortening: PRCNT=0.85 (Klatt 1976 Table III: K=0.7)
8. Polysyllabic shortening: PRCNT=0.8

### 3. MITalk / DECtalk Implementation

- DECtalk rate range: 75 to 600 words per minute
- DECtalk default rate: 180 wpm
- Rate command: [:rate DD] where DD is WPM
- Values outside 75-600 are clamped
- DECtalk was based on Klatt's MITalk system
- Allen, Hunnicutt & Klatt 1987 "From Text to Speech: The MITalk System" Chapter 9 contains the full duration rules

### 4. Differential Scaling (NOT just a global multiplier)

Key finding: it is NOT just a global duration multiplier. Different segment types scale differently:

- Vowels compress more than consonants
- Stressed syllables compress less than unstressed
- Stop closures and bursts have minimum acoustic durations (incompressible)
- Fricatives need minimum duration for identification (Jongman 1989)

Asymmetric effects:
- As rate increases, vowel/consonant duration ratio changes
- Vowels are more "elastic" than consonants
- Unstressed segments are more compressible (MINDUR halved per Klatt)
- Stressed segments resist compression more

### 5. Effects Beyond Duration

Research shows speaking rate affects:

a) F0 range compression:
   - Faster speech → narrower F0 range
   - Slower speech → wider F0 range
   - Clear speech (slow) = wider F0 range, more energy, expanded vowel space
   - Thai data: faster rates cause slope reduction, increased declination, decreased F0 range

b) Formant undershoot / vowel centralization:
   - Fast speech → vowels don't reach their targets
   - Formant transitions start earlier but may not complete
   - Vowel space contracts toward schwa-like centroids
   - This is "reduction" - duration alone doesn't capture it

c) Articulatory changes:
   - Speakers CAN maintain targets by increasing articulatory velocity
   - But often don't, especially in casual fast speech
   - Undershoot tends to occur when velocity doesn't increase enough

### 6. Qlatt Current State

Qlatt already has:
- Klatt-style duration rules in `public/rules/phases/duration.yaml`
- Incompressibility via `getIncompressibleMin()` in engine.ts (42% for vowels, 60% for consonants)
- Inherent duration per phoneme from inventory
- All the multiplicative rule infrastructure
- BUT: no global rate parameter yet

## Practical Design Recommendations for Rate Control

1. Add a `rate` parameter (1.0 = normal, 0.5 = half speed, 2.0 = double speed)
2. Map WPM to scale factor: factor = normalWPM / targetWPM (e.g., 180/360 = 0.5 for fast)
3. Apply rate as another multiplicative factor in the duration pipeline
4. BUT apply it differentially:
   - Vowels: full rate factor
   - Consonants: sqrt(rate factor) or similar dampened version
   - Stops/bursts: clamp to minimum durations (already have incompressibility)
5. Optionally adjust F0 range: compressed at fast rates, expanded at slow rates
6. Optionally add formant undershoot at fast rates (move targets toward neutral)
