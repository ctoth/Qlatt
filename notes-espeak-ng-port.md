# espeak-ng Port Investigation

## Goal
Understand espeak-ng's architecture and plan what it would take to port it into Qlatt's declarative frontend framework.

## espeak-ng Architecture Summary (~56k lines C)

### Pipeline
```
Text → readclause.c (normalize, SSML, clause split)
     → dictionary.c (G2P rules + exception dict)
     → setlengths.c (duration)
     → intonation.c (F0 contours via "tunes")
     → synthesize.c (frame generation)
     → klatt.c (resonator synthesis)
```

### G2P System
- **en_rules** (~500 lines): Context-sensitive letter-to-sound rules with scoring
  - Custom syntax: `.group a` blocks, pre/post context patterns
  - Special chars: `_`=boundary, `A`=vowel, `C`=consonant, `L<nn>`=letter groups
  - Prefix/suffix stripping with retranslation (`S2`, `P3`)
  - Highest-scoring rule wins
- **en_list** (~5000 lines): Exception dictionary with stress/POS flags
- **en_extra**: User additions

### Phoneme System
- Master defs: `phsource/phonemes`, English: `ph_english`, US: `ph_english_us`
- Feature-rich: manner (vwl/stp/nas/frc), place (alv/pla/vel), voice (vcd/vls)
- Each phoneme has: base duration, length modifier group, stress behavior
- Formant data: binary compiled in `phsource/vowel/` directories

### Intonation
- Tune-based: s1 (declarative), c1 (comma), q1 (question), e1 (exclamation)
- Each tune defines: prehead pitch, head envelope, nucleus fall/rise, tail
- NOT ToBI — clause-level contour shapes, not phonological categories

### Duration
- Base length per phoneme (in ms×2), modified by:
  - Speed factor (80-450 WPM lookup table)
  - lengthmod groups (0-7)
  - Stress lengthening
  - Position in word

### Formant/Klatt
- frame_t structure: F0-F6 freqs, bandwidths, Klatt params (AV, FNZ, tilt, aspr, etc.)
- Sequences of frames per phoneme (vowel transitions)
- Direct Klatt 1980 cascade-parallel implementation

## Qlatt Existing Framework

### Two existing frontends as templates:
1. **qlatt-english**: ToBI intonation, ~40 duration rules, CMU dict G2P, shared inventory
2. **dectalk-english**: Hat-pattern F0, 14 duration rules, 5500-line LTS, custom inventory

### What a frontend needs (no engine changes required):
- `frontend.yaml` — config, parameters, F0 model
- `inventory.yaml` — phoneme → Klatt acoustic targets
- `phases/*.yaml` — rule phases (postlexical, structural, duration, formant, prosody)
- Registration in `manifest.json`

## Gap Analysis

### Component-by-component comparison:

| Component | espeak-ng | Qlatt framework | Gap |
|-----------|-----------|-----------------|-----|
| **Synth engine** | klatt.c (C) | WASM+WebAudio Klatt | None — reuse ours |
| **G2P rules** | Custom syntax (scoring) | LTS rules or CMU dict | LARGE — format incompatible |
| **Exception dict** | en_list (5k lines) | CMU dict (134k entries) | CMU is bigger, but different phoneme set |
| **Phoneme set** | ~40 IPA-like codes | ARPABET (150 codes) | Need mapping table |
| **Formant targets** | Binary compiled frames | inventory.yaml (F1-F6, B1-B6, AV, etc.) | Need extraction from binary |
| **Duration** | C code + tables | YAML scalar rules | Moderate — rewrite as rules |
| **Intonation** | Tune-based (clause-level) | ToBI or hat-pattern | LARGE — different model |
| **Stress** | SetWordStress() in C | Dictionary-driven | Moderate |
| **Coarticulation** | Frame interpolation in C | Formant rules in YAML | Moderate |

## Key Decisions for Plan

1. **G2P strategy**: Port en_rules to our LTS format? Or new parser? Or use espeak-ng as external?
2. **Phoneme mapping**: espeak → ARPABET? Or keep espeak phoneme set with new inventory?
3. **Intonation**: Adapt tunes to our point-based system? Or add tune model to engine?
4. **Formant extraction**: How to get F1-F6/bandwidth data from binary phsource files?
5. **Scope**: English only? Or multi-language from day 1?
