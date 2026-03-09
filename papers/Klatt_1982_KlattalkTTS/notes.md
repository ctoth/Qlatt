# The Klattalk Text-to-Speech Conversion System

**Authors:** Dennis H. Klatt
**Year:** 1982
**Venue:** IEEE ICASSP (International Conference on Acoustics, Speech, and Signal Processing)
**Copyright:** January 1, 1981 by Dennis H. Klatt

## One-Sentence Summary
Klattalk is a complete real-time TTS system combining ~500 letter-to-sound rules, a 1500-word exceptions dictionary, simple syntactic analysis, and detailed synthesis-by-rule with the Klatt formant synthesizer.

## Problem Addressed
Creating a practical text-to-speech system that can handle arbitrary English text with acceptable intelligibility and naturalness, including handling of numbers, abbreviations, and proper prosody.

## Key Contributions
- Complete TTS pipeline: text → phonemes → synthesis parameters → audio
- Hunnicutt's ~500 letter-to-sound rules achieving ~95% phoneme accuracy
- Exceptions dictionary strategy for common irregular words
- Simple but effective syntactic analysis for prosody
- "Hat-pattern" F0 contour strategy
- Comprehensive duration rules framework
- 20 synthesizer control parameters per pitch period

## System Architecture

### Text-to-Phoneme Conversion Pipeline
```
Input Text
    ↓
Formatting Preprocessor (numbers, abbreviations, symbols)
    ↓
Exceptions Dictionary Lookup (1500 words)
    ↓ (if not found)
Letter-to-Phoneme Rules (~500 rules)
    ↓
Stress Rules
    ↓
Syntactic Analysis (clause/phrase boundaries)
    ↓
Phonemic Representation with Stress/Boundary Markers
```

### Phoneme-to-Speech Pipeline
```
Phonemic Representation
    ↓
Phonological Component
  - Stress assignment (0 or 1)
  - Segmental phonology rules
  - F0 contour generation
  - Duration rules
    ↓
Phonetic Component
  - Target values per phone
  - Smooth transitions
  - Voicing onset delays
  - Burst attachment
    ↓
Formant Synthesizer (20 parameters/pitch period)
    ↓
Speech Output
```

## Methodology

### Formatting Preprocessor
- Numbers translated to word sequences (algorithm by Sharon Hunnicutt)
- Common abbreviations stored in exceptions dictionary
- Other abbreviations: pronounced as word if contains vowel, spelled out otherwise
- Unanticipated special symbols ignored

### Letter-to-Phoneme Rules
- ~500 rules from Hunnicutt [3]
- Each rule converts letter/sequence → phoneme/sequence based on context
- Linguistic rules: silent-e effect on vowels, consonant doubling effect
- Statistical tendency rules
- **Accuracy: ~95% at phoneme level → ~75% of words fully correct**

### Exceptions Dictionary
- 1500 words (compact due to storage costs)
- Searched before letter-to-phoneme conversion
- Includes unstressed function words (and, of, the)
- Affix stripping (-ing, plurals, past forms) increases effective coverage
- Reduces error rate to ~1 word in 20 when reading novels

### Syntactic Analysis
- Finds clause and noun phrase boundaries
- Uses:
  - Comma positions in text
  - Clause-introducing words ("because", etc.)
  - Common verbs in exceptions dictionary (for NP/VP break detection)
- Does NOT include full parser (too complex, ambiguity issues)

### Example Output
Input: "The old man sat in a rocker"
Output: `DHAX 'OWLD M'AEN / S'AET IHN AX R'AAKRR.`
- `'` marks primary lexical stress
- `/` marks phrase boundary

## Phonological Component

### Stress Assignment
- Binary feature STRESS (0 or 1) per segment
- Vowels preceded by `'` or `!` → STRESS=1
- Consonants preceding stressed vowel → STRESS=1 if:
  - Same morpheme
  - Form acceptable word-initial cluster

### Segmental Phonology Rules
- NOT "sloppy speech" rules
- Aid listener in detecting word/phrase boundaries
- Examples:
  - Glottal stop insertion
  - Postvocalic allophones of /r/ and /l/ (differ from syllable-initial)
  - Glottalization of word-final /t/ (context-dependent)

### Fundamental Frequency (F0) - Hat Pattern Strategy
Four-step algorithm:
1. Define baseline F0 contour (gradual fall)
2. Determine syntactically-conditioned rise/fall times
   - Rise to plateau on first stressed syllable of syntactic unit
   - Fall to baseline on last stressed syllable of syntactic unit
3. Add local increases due to lexical stress
4. Add segmental perturbations (vowel height, consonant voicing)

Result: Dramatic fall-rise F0 contour between syntactic units

### Segmental Duration Model
Framework: Each rule applies percentage increase/decrease, with minimum duration floor.

Phenomena covered:
- Pause insertion
- Clause-final lengthening
- Phrase-final lengthening
- Word-final lengthening
- Polysyllabic shortening
- Word-initial consonant lengthening
- Shortening of unstressed segments
- Adjacent segment interactions

## Phonetic Component

### Parameter Generation
- 20 synthesizer control parameters per pitch period
- Process:
  1. Assign target value to each parameter for each phone
  2. Compute smooth transitions considering adjacent phones
  3. Apply special rules:
     - Voicing onset delay in voiceless stops
     - Burst attachment to plosives and affricates

### Synthesizer
- Simplified version of Klatt 1980 synthesizer [5]
- Converts 20 parameters → gains and difference equation constants
- Hardware: special-purpose synthesizer chip

## Parameters

| Name | Description | Notes |
|------|-------------|-------|
| STRESS | Segment stress | Binary (0 or 1) |
| Duration | Segment duration | Modified by multiple rules |
| F0 | Fundamental frequency | Hat-pattern + perturbations |
| (+ 17 more) | Synthesizer controls | Updated every pitch period |

## Implementation Details

### Dictionary Strategy
- Small exceptions dictionary (1500 words) + robust L2P rules
- Affix stripping extends coverage without additional storage
- Function words must be in dictionary (stress rules fail on them)

### Error Rates
- Phoneme-level: ~5% error
- Word-level: ~25% error (without dictionary)
- Running text with dictionary: ~5% word error (1 in 20)

### Future Plans (as of 1982)
- Large phonemic dictionary (20,000+ words with affixes)
- Morpheme dictionary approach (15,000 morphemes → 150,000 words)
  - Essential for compounds like "hothouse" (th ≠ /θ/)
  - Requires careful tuning ("scarcity" ≠ "scar+city")

## Figures of Interest
- **Figure 1 (page 2):** Example phonemic output showing stress marks and phrase boundaries

## Results Summary
- Comprehension approaches single human reading
- Word intelligibility of unexpected words below natural speech
- MITalk and Telesensory systems underwent formal testing
- Klattalk planned for same protocol

## Limitations
- Text-to-phoneme errors "quite disturbing to the listener"
- Noun/verb ambiguity too difficult for simple heuristics
- No semantic emphasis or emotion capability
- Limited syntactic analysis (no full parser)

## Relevance to Qlatt Project

### Direct Applications
1. **TTS Frontend Architecture**: The text → phoneme → synthesis pipeline is the same pattern Qlatt follows
2. **Duration Rules Framework**: Percentage-based modification with minimum floor matches our approach
3. **F0 Hat-Pattern**: Four-step algorithm can inform prosody rules
4. **Exceptions Dictionary Strategy**: CMU dictionary + L2P fallback is modern equivalent

### Specific Implementation Guidance
- Stress propagation to preceding consonants (if same morpheme + valid cluster)
- Segmental phonology rules aid boundary detection
- 20 parameters per pitch period is synthesis target density
- Affix stripping increases dictionary coverage

## Open Questions
- [ ] What are the exact 20 synthesizer parameters referenced?
- [ ] Details of the percentage-based duration rule interactions
- [ ] Specific F0 perturbation values for vowel height and voicing

## Related Work Worth Reading
- Hunnicutt (1980) - Grapheme-to-Phoneme Rules: A Review [3]
- Klatt (1979) - Synthesis by Rule of Segmental Durations [4]
- Klatt (1980) - Software for Cascade/Parallel Formant Synthesizer [5]
- Maeda (1974) - Characterization of F0 Contours [6]
- Allen et al. (1979) - MITalk-79 [1]

---

## Collection Cross-References

### Already in Collection
- [[Carlson_1979_VowelPerceptionSalience]] — referenced for vowel perception work
- [[Klatt_1976_SegmentalDuration]] — duration model foundation for Klattalk's timing rules
- [[Klatt_1979_SpeechPerceptionLexicalAccess]] — SCRIBER/LAFS perception framework informing synthesis targets
- [[Klatt_1980_CascadeParallelFormantSynthesizer]] — the synthesizer engine used by Klattalk
- [[Hunnicutt_1976_PhonologicalRules]] — Hunnicutt's letter-to-sound rules used in Klattalk (referenced as Hunnicutt 1980)

### Cited By (in Collection)
- [[Allen_1987_MITalk_TTS]] — MITalk extends the Klattalk TTS approach
- [[Hertz_1985_DeltaRuleSystem]] — references Klattalk system
- [[Rutledge_1995_SynthesizingStyledSpeechKlatt]] — extends Klattalk with styled speech
- [[Anumanchipalli_KLATTSTAT]] — statistical extension of Klattalk approach
- [[Hawkins_Stevens_1985_NasalVowelCorrelates]] — references Klattalk system
- [[deCheveigné_1999_FormantBandwidthCompetingVowels]] — references Klattalk
- [[Carlson_1979_VowelPerceptionSalience]] — references Klattalk system

### New Leads (Not Yet in Collection)
- **Maeda (1974) [6]** - Source of the "hat-pattern" F0 contour strategy. Important for implementing prosodic F0 rules.
- **Allen et al. (1979) [1]** - MITalk system documentation. Useful for comparison and the morpheme dictionary approach mentioned in Future Plans.
