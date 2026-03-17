# Speech Synthesis and Recognition (2nd Edition)

**Authors:** John Holmes and Wendy Holmes
**Year:** 2001 (1st edition 1988)
**Venue:** Taylor & Francis (textbook)
**ISBN:** 0-7484-0856-8 (hc), 0-7484-0857-6 (pbk)

## One-Sentence Summary

A comprehensive textbook covering both speech synthesis (formant synthesis by rule, concatenative synthesis, TTS architecture) and speech recognition (template matching, HMMs, language models), with particular detail on the Holmes-Mattingly-Shearme (HMS) table-driven formant synthesis system.

## Problem Addressed

Provides an accessible introduction to the principles behind speech synthesis and recognition technology, bridging the gap between specialist research papers and students/engineers needing foundational knowledge in both fields.

## Key Contributions

- Detailed description of the Holmes-Mattingly-Shearme (HMS) table-driven phonetic synthesis-by-rule system (Chapter 6)
- Description of the Holmes (1983) parallel-formant synthesizer architecture with per-formant excitation mixing (Figure 2.15)
- Comprehensive TTS pipeline architecture showing modular text-analysis and speech-generation stages (Figure 7.2)
- Clear exposition of cascade vs parallel formant synthesizer trade-offs
- Discussion of F0 contour generation models (superposition models vs tone-sequence models)
- Duration modeling factors for TTS timing patterns

## Methodology

Textbook-style exposition with figures, block diagrams, example parameter tables, and worked examples. Draws extensively on the authors' own research at the Joint Speech Research Unit (JSRU) and BT Labs.

## Key Equations

No novel equations are presented; the book is conceptual rather than mathematical. Key relationships discussed include:

- Boundary value for HMS transitions: $V_{boundary} = V_{fixed} + P \times V_{vowel}$ where $V_{fixed}$ is the consonant's fixed contribution, $P$ is the proportion of the vowel target used, and $V_{vowel}$ is the vowel's target value for that parameter.
- Transfer function periodicity of acoustic tube model: repeats every $cN/2L$ where $c$ is sound velocity, $N$ is number of sections, $L$ is total tract length.
- Radiation characteristic: spectrum of radiated pressure differs from volume velocity by +6 dB/octave (time derivative).

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Fundamental frequency (male) | F0 | Hz | - | 50-200 | Adult male typical range |
| Fundamental frequency (female) | F0 | Hz | - | 100-400 | About one octave higher than male |
| Formant frequencies | F1-F5 | Hz | - | 250-5000 | F1, F2 most significant for phoneme identity |
| Formant bandwidths (closed glottis) | B1 | Hz | ~80 | - | F1 bandwidth, typical closed-glottis |
| Formant bandwidths (open glottis) | B1 | Hz | ~150+ | - | Can be 4x greater than closed-glottis |
| Frame duration (HMS) | - | ms | 10 | - | Synthesizer control parameter update rate |
| Sound velocity | c | m/s | 350 | - | In vocal tract |
| Tract length (adult male) | L | m | 0.175 | - | Typical adult male vocal tract |
| HMS table parameters per element | - | - | - | 10 | FN, ALF, F1, A1, F2, A2, F3, A3, AHF, V |

## Implementation Details

### HMS Table-Driven Synthesis System (Chapter 6)

The HMS system uses phonetic element tables to generate synthesizer control parameters:

1. **Table structure**: Each phonetic element has a table with 10 synthesizer control parameters (FN, ALF, F1, A1, F2, A2, F3, A3, AHF, V). For each parameter, the table specifies:
   - Target value
   - Proportion of vowel target used in boundary calculation
   - Fixed contribution to boundary value
   - Internal transition duration (within the element, in frames)
   - External transition duration (within the neighboring element, in frames)
   - Separate entries for initial (left) and final (right) transitions

2. **Boundary value calculation**: boundary = fixed_contribution + (proportion x vowel_target)

3. **Transition interpolation**: Linear interpolation between boundary values and target values, carried out over the specified internal and external durations.

4. **Overlapping transitions**: When element duration is too short for both initial and final transitions, construct each transition separately for that part within the element, then take a weighted sum. Weighting goes linearly from 1 to 0 for initial, 0 to 1 for final, producing parabolic combined transitions.

5. **Rank system**: Each phonetic element has a rank (e.g., silence=63, vowel=2, lateral=11, fricative=20). For any pair of adjacent elements, the higher-rank element's table determines transition nature; lower-rank element provides only target values. This captures coarticulation dominance.

6. **Allophone selection**: ~60 elements for basic English phonemes, expandable to several hundred for allophonic variation in consonant clusters, improving naturalness.

### Holmes (1983) Parallel Formant Synthesizer (Figure 2.15)

- Each formant (FN, F1, F2, F3, F4-band) has its own excitation mixer combining voiced and voiceless excitation
- Voicing control signal varies the mixing fraction per formant
- FN (nasal) resonator receives both voiced and voiceless excitation, added after top-lift/phase correction
- F1 has top-lift and phase correction circuit
- F2 and F3 have differentiators after their resonators
- F4-band uses a fixed filter with 3 resonators
- A low-frequency resonator (below F1) with amplitude control AN provides low-frequency spectral shaping for nasals
- Output filter combines all formant outputs

### TTS Pipeline Architecture (Figure 7.2)

The modular TTS architecture includes these stages:
1. Text pre-processing (expand abbreviations, numerals, punctuation)
2. Morphological analysis (decompose into morphemes)
3. Word pronunciation (dictionary lookup + letter-to-sound rules + lexical stress)
4. Syntactic analysis
5. Modification for continuous-speech effects (postlexical rules)
6. Prosodic phrase identification
7. Word accent determination
8. Timing pattern assignment
9. Intensity specification
10. Fundamental frequency contour generation
11. Selection of synthesis units
12. Speech synthesis (waveform generation)

### F0 Contour Models

Two main approaches described:
- **Superposition models** (Fujisaki): Phrase commands and accent commands filtered through second-order linear filters, combined with baseline F0. Phrase commands produce broad rises/falls; accent commands produce local pitch accents.
- **Tone sequence models** (Pierrehumbert 1980/1981): F0 contour from sequence of discrete tones (high/low) associated with pitch accents, phrase boundaries. Quadratic interpolation between successive targets. Basis for TOBI transcription system.

### Duration Modeling (Section 7.5.1)

Seven factors affecting segment duration:
1. Inherent duration differs by phone (vowels in "bit" vs "beet")
2. Speaking rate affects steady-state sounds more than transients
3. Stressed syllables are lengthened
4. Position in word (polysyllabic words)
5. Phrase-final lengthening
6. Pre-voicing lengthening (vowels longer before voiced consonants)
7. Stress-timed compression (unstressed syllables shorter when more occur between stressed syllables)

Approach: intrinsic duration modified by multiplicative factors for each circumstance.

## Figures of Interest

- **Fig 2.1 (page 11):** Cross-section of vocal organs
- **Fig 2.3 (page 13):** Typical glottal airflow waveform showing sharp closure corner and rounded opening
- **Fig 2.6 (page 17):** Acoustic system for nasal consonant [m] showing branched structure
- **Fig 2.8 (page 20):** Electrical equivalent circuit of glottis coupled to vocal tract
- **Fig 2.13 (page 28):** Cascade connection of formant generators (block diagram)
- **Fig 2.14 (page 29):** Spectral comparison of cascade vs parallel formant synthesis showing deep dip between formants in parallel case
- **Fig 2.15 (page 31):** Complete Holmes (1983) parallel-formant filter system with per-formant excitation mixing
- **Fig 6.1 (page 85):** HMS F2 transition calculation for [we] sequence
- **Fig 6.2 (page 86):** Overlapping transition handling in HMS system
- **Fig 6.3 (page 87):** Example HMS table entries for 5 phonetic elements (Q, w, e, l, z)
- **Fig 6.4 (page 88):** Parameter tracks for "wells" generated from HMS tables
- **Fig 7.1 (page 94):** TTS as analysis-synthesis process
- **Fig 7.2 (page 95):** Complete modular TTS system architecture
- **Fig 7.3 (page 105):** Fujisaki-style F0 generation from phrase and accent commands
- **Fig 7.4 (page 106):** Pierrehumbert F0 contour generation by interpolation between targets

## Results Summary

The book does not present new experimental results. Key observations from the authors' experience:

- Best synthesis-by-rule systems (as of 2001) produce highly intelligible but machine-sounding speech
- Concatenative synthesis had overtaken formant synthesis for naturalness by publication date
- Formant synthesis retains advantages in flexibility for voice quality manipulation, speaking rate changes, and coarticulation modeling
- F0 contour generation remains the weakest link in TTS quality, primarily due to difficulty of extracting appropriate linguistic information from text

## Limitations

- Published in 2001, so does not cover modern neural/statistical TTS (WaveNet, Tacotron, etc.)
- Recognition chapters heavily focused on HMM-based approaches, now largely superseded
- The HMS system is described conceptually but complete parameter tables are not provided (only examples for 5 phonetic elements)
- No discussion of the LF glottal source model (which is more relevant to Qlatt's current implementation)

## Testable Properties

- HMS boundary value = fixed_contribution + (proportion x vowel_target) — this formula can be verified against table entries
- Higher-rank elements should dominate transition specification in adjacent pairs
- Overlapping transitions should produce parabolic-shaped combined transitions
- Radiation adds +6 dB/octave tilt to volume velocity spectrum
- Closed-glottis F1 bandwidth ~80 Hz; open-glottis F1 bandwidth can be 4x greater (~300+ Hz)
- F0 for adult males typically 50-200 Hz; females approximately one octave higher
- Female formant frequencies approximately 20% higher than male due to shorter vocal tract

## Relevance to Project

This book is directly relevant to Qlatt in several ways:

1. **HMS transition model**: The table-driven approach to formant transitions (boundary values, internal/external transition durations, rank-based dominance) is conceptually similar to Qlatt's declarative rule system, though Qlatt uses a different mechanism (YAML rules with CEL expressions rather than numeric tables).

2. **Holmes parallel synthesizer**: Figure 2.15 shows the architecture that directly influenced Klatt's design. The per-formant excitation mixing and degree-of-voicing control are relevant to Qlatt's graph topology.

3. **TTS pipeline**: The modular architecture in Figure 7.2 maps closely to Qlatt's pipeline (normalizeText -> transcribeText -> rule phases -> assembleKlattTrack).

4. **Duration factors**: The seven duration factors align with Qlatt's duration rules (pre-boundary lengthening, stress effects, consonant context).

5. **F0 models**: Both Fujisaki and Pierrehumbert models are relevant to Qlatt's prosody rules; Pierrehumbert's approach particularly relevant since Qlatt's prosody uses target-based F0 specification.

## Open Questions

- [ ] How do the HMS table parameters map to Klatt synthesizer parameters? (The Holmes synthesizer uses different parameter names: FN, ALF, F1, A1, F2, A2, F3, A3, AHF, V vs Klatt's F0, AV, F1, B1, etc.)
- [ ] Could the HMS rank system be adapted for Qlatt's rule priority/dominance system?
- [ ] The book mentions automatic optimization of phonetic rules using natural speech data (Section 6.5.1) — could this approach be applied to Qlatt's rule parameters?

## Related Work Worth Reading

- Holmes, Mattingly & Shearme 1964, "Speech synthesis by rule" — original HMS paper with full table specifications
- Holmes 1983, "Formant synthesizers: cascade or parallel?" — details of the parallel synthesizer in Figure 2.15
- Klatt 1980, "Software for a cascade/parallel formant synthesizer" — Qlatt's primary reference
- Allen, Hunnicutt & Klatt 1987, "From Text to Speech: the MITalk System" — most detailed TTS system using formant synthesis by rule
- Pierrehumbert 1980/1981 — F0 contour generation model
- Fujisaki & Ohno 1995 — superposition F0 model

## Collection Cross-References

### Already in Collection
- [[Klatt_1980_CascadeParallelFormantSynthesizer]] — cited as the primary cascade/parallel formant synthesizer specification; the book draws on Klatt's architecture throughout Chapters 2, 4, and 6
- [[Allen_1987_MITalk_TTS]] — cited as the most well-known TTS system using synthesis by rule with Klatt synthesizer backend
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited for acoustic tube theory and source-filter model underlying Chapter 2
- [[Pierrehumbert_1980_EnglishIntonation]] — cited for tone-sequence F0 model in Section 7.5.2; described as "one especially influential model"
- [[Fujisaki_InformationProsodyModeling]] — cited for superposition F0 model in Section 7.5.2 (Figure 7.3)
- [[Holmes_1983_FormantSynthesizersCascadeParallel]] — the authors' own work; the parallel formant synthesizer in Figure 2.15 is described in detail
- [[Holmes_1964_SpeechSynthesisRule]] — the authors' original HMS synthesis-by-rule paper; Chapter 6 is an expanded exposition of this system

### Cited By (in Collection)
- [[Hu_2012_DynamicsModelSpeechRecognitionSynthesis]] — cites this book as general reference for speech synthesis and recognition

### New Leads (Not Yet in Collection)
- Ishizaka & Flanagan (1972) — "Synthesis of voiced sounds from a two-mass model of the vocal cords" — foundational vocal fold vibration model referenced in Section 2.7.1
- Flanagan, Ishizaka & Shipley (1975) — "Synthesis of speech from a dynamic model of the vocal cords and vocal tract" — 20-section transmission line vocal tract model with distributed losses
- Linggard (1985) — "Electronic Synthesis of Speech" — comprehensive review of early electronic synthesis methods
- Olive, van Santen, Mobius & Shih (1998) — Bell Labs multilingual TTS approach — relevant for multi-language formant synthesis
- Dutoit (1997) — "An Introduction to Text-to-speech Synthesis" — alternative TTS textbook with different perspective

### Conceptual Links (not citation-based)
**Formant synthesis architecture:**
- [[Jesus_1997_KlattSynthesiserImplementation]] — implements the same Klatt synthesizer that this book's Chapter 2 describes architecturally; provides working MATLAB code and parameter values for the cascade/parallel topology discussed theoretically here
- [[Carlson_1995_ModelsOfSpeechSynthesis]] — directly compares different synthesis models including the table-driven approach described in Chapter 6

**Transition and coarticulation modeling:**
- [[Hertz_1990_StreamPhoneticTransitions]] — proposes treating formant transitions as independent temporal units, an alternative to the HMS table-driven boundary-value approach described in Chapter 6; both systems address the same problem of generating smooth parameter tracks from discrete phonetic specifications
- [[Hertz_1982_DeltaStreamPhonology]] — Delta programming language for multi-stream phonological representation; provides a formal language for expressing the kind of transition rules Chapter 6 describes informally

**TTS pipeline architecture:**
- [[Allen_1977_MITalkArchitecture]] — presents the precursor pipeline to MITalk that the book references; Figure 7.2's modular architecture directly descends from this earlier work
