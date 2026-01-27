# A Modular Audio Response System for Computer Output

**Authors:** Jonathan Allen
**Year:** 1977
**Venue:** 1977 IEEE International Conference on Acoustics, Speech and Signal Processing, Hartford
**DOI/URL:** IEEE Catalog No. 77CH1197-3 ASSP, pp. 579-582

## One-Sentence Summary
This paper describes the modular architecture of MIT's text-to-speech system (precursor to MITalk), defining the pipeline of FORMAT, DECOMP, PARSER, SOUND1, SOUND2, PROSE, SYNTHS, and SPEAK modules that became the standard TTS architecture.

## Problem Addressed
Creating a complete, flexible text-to-speech system where individual components (morphology, syntax, phonology, prosody) can be developed and improved independently while maintaining well-defined interfaces between modules.

## Key Contributions
- Defines the canonical TTS pipeline architecture: text analysis → synthesis
- Specifies six analysis modules (FORMAT, DECOMP, PARSER, SOUND1, SOUND2) and three synthesis modules (PROSE, SYNTHS, SPEAK)
- Describes special-purpose hardware for real-time vocal tract modeling
- Establishes modular design principles that allow subsystem substitution and experimentation

## Methodology

### Text Analysis Pipeline (Figure 1)
1. **FORMAT** - Preprocessor converting text to suitable form
   - "1977" → "nineteen seventy-seven"
   - "$5.07" → "five dollars and seven cents"
   - "3.14" → "three point one four"
   - Handles abbreviations, illegal characters, special pronunciations

2. **DECOMP** - Morphological decomposition
   - Uses 12,000 morph lexicon (being reduced to ~8,000)
   - Finds words in lexicon or analyzes into root + affix morphs
   - Each morph has: pronunciation, combining code, parts-of-speech

3. **PARSER** - Phrase-level syntactic analysis
   - Computes part-of-speech set for each word
   - Produces phrase-level parse (not clause-level - too unreliable)
   - Resolves phonemic ambiguities (refuse, lead)
   - Produces descriptors for pitch and timing procedures

4. **SOUND1** - Morphophonemic rules
   - Applies plural, past tense, palatalization rules
   - Detects compound words (two+ adjacent roots)
   - Specifies stress contour for compounds

5. **SOUND2** - Letter-to-sound rules
   - Used when DECOMP cannot fully analyze a word
   - Converts letters to phonemic symbols
   - Applies comprehensive lexical stress rules
   - Handles affix pronunciation (e.g., "-ate" in "systematic" vs "systematize")

### Speech Synthesis Pipeline (Figure 2)
1. **PROSE** - Prosody computation
   - Computes F0, duration, stress for each phoneme
   - Marks syntactic unit boundaries
   - Provides emphasis for semantically important constituents

2. **SYNTHS** - Synthesis-by-rule
   - Generates control parameters every 5 msec
   - Controls terminal analog speech synthesizer (vocal tract model)
   - Produces digital speech samples

3. **SPEAK** - D/A conversion
   - Converts digital samples to speech waveform

## Key Equations
None presented - this is an architecture paper.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Parameter update rate | - | ms | 5 | - | Control parameters generated every 5 msec |
| Sample rate | - | kHz | 10 or 20 | - | Vocal tract model operates at 10 or 20 kHz |
| Resonances | - | count | 32 or 16 | - | 32 at 10 kHz, 16 at 20 kHz |
| Data word length | - | bits | 24 | - | Avoids scaling and overflow problems |
| Morph lexicon size | - | morphs | 12,000 | ~8,000 | Being reduced |

## Implementation Details

### Software
- All modules programmed in BCPL (high-level system implementation language)
- Vocal tract model written in Fortran
- Originally on DEC PDP-9, exported to PDP 11/34, being converted to DECSYSTEM20
- Well-defined input/output conventions for each module

### Special Hardware

**Vocal Tract Model:**
- All-digital using serial arithmetic
- 32 resonances (poles or zeros) at 10 kHz sample rate
- 16 resonances at 20 kHz sample rate
- Noise and glottal sources provided
- Programmable resonance configuration
- Parameter memory with transient-free on-line updates
- 24-bit data words
- 150 dual in-line packages (low-power Schottky TTL)
- Custom LSI designs being investigated

**Parameter Generator:**
- Microprocessor-based (AM2901 4-bit slice)
- Computes 20 vocal tract parameters every 5 msec
- 4K RAM memories
- Custom architecture with special instructions for array access and phonetic feature matching
- 150 dual in-line circuits

### Data Structures
Each module has:
- Input data structures
- Kernel procedure
- Partial output data structures
- Procedure calls to compensatory/augmenting procedures

Key data structures mentioned:
- FORMAT INF, DECOMP INF, PARSE INF, SOUND1 INF, SOUND2 INF
- PARAMS DMP, SPEECH DMP

## Figures of Interest
- **Fig 1 (page 4):** Text Analysis pipeline showing FORMAT → DECOMP → PARSER → SOUND1 → SOUND2 flow with LEXICON, PARSE NET, and L/S RULES databases
- **Fig 2 (page 4):** Speech Synthesis pipeline showing PROSE → SYNTHS → SPEAK flow with PARAMS DMP and SPEECH DMP data structures
- **Fig 3 (page 4):** Phrase-level parsing example: "(NC Boston's public schools)(NC opened calmly yesterday)(PP with the highest attendance percentage)(PP for a first day)(PP in three years)"

## Results Summary
- System serves as research base, experimentation framework, and source for special hardware processors
- Modules successfully exported across different computer systems (PDP-9 → PDP 11/34 → DECSYSTEM20)
- Modular structure essential for implementation on wide variety of machines

## Limitations
- Parser occasionally identifies verbs as nouns (heuristic procedures being developed)
- Clause-level parsing not attempted (unreliable for unrestricted text)
- Real-time operation requires special hardware

## Relevance to Project
This paper defines the canonical TTS pipeline that Qlatt follows:
1. Text normalization (FORMAT)
2. Morphological analysis (DECOMP)
3. Parsing for prosody (PARSER)
4. Phonological rules (SOUND1, SOUND2)
5. Prosody generation (PROSE)
6. Synthesis-by-rule (SYNTHS) - the Klatt synthesizer

The modular architecture allows independent development of each component.

## Open Questions
- [ ] What specific letter-to-sound rules are used in SOUND2?
- [ ] What are the exact prosody rules in PROSE?
- [ ] How does the ATN architecture work for DECOMP and PARSE?

## Related Work Worth Reading
- Allen 1987 MITalk book (full system documentation)
- Klatt 1980 (vocal tract model specification)
- Hunnicutt letter-to-sound rules
