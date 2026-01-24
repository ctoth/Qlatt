# Duration of Frication Noise Required for Identification of English Fricatives

**Authors:** Allard Jongman
**Year:** 1989
**Venue:** Journal of the Acoustical Society of America (JASA), Vol. 85, No. 4
**DOI:** 0001-4966/89/041718-08

## One-Sentence Summary
Establishes minimum frication noise durations (30-50 ms) required for perceptual identification of English fricatives, with place-of-articulation requiring more duration than voicing or manner cues.

## Problem Addressed
How much of the fricative noise portion is actually required by listeners to correctly identify fricatives? Prior work had examined full frication spectra but not the temporal requirements.

## Key Contributions
- Determined minimum frication durations for each English fricative
- Showed place-of-articulation perception requires longer duration than voicing/manner
- Found [ʃ, z] identifiable at 30 ms; [f, s, v] at 50 ms; [θ, ð] require full frication
- Demonstrated voicing perception is stable even at 20 ms duration

## Methodology
Natural CV syllables ([f, s, θ, ʃ, v, z, ð] + [i, u, a]) were edited to include 20-70 ms of frication noise in 10-ms steps, plus full frication and full syllable conditions. 12 subjects performed identification tasks.

## Key Findings

### Minimum Duration for Fricative Identification

| Fricative | Min Duration for ~70% Accuracy | Notes |
|-----------|-------------------------------|-------|
| [ʃ] (sh)  | 30 ms | Best identified |
| [z]       | 30 ms | Best identified |
| [f]       | 50 ms | |
| [s]       | 50 ms | |
| [v]       | 50 ms | |
| [θ] (th)  | Full frication only | Poor even at 70 ms |
| [ð] (dh)  | Full frication only | Worst identification |

### Frication Durations in Test Stimuli (Table I)

| Fricative | [a] context | [i] context | [u] context | Mean | 70ms as % of mean |
|-----------|-------------|-------------|-------------|------|-------------------|
| [f]       | 158 ms      | 156 ms      | 134 ms      | 149 ms | 47% |
| [s]       | 185 ms      | 193 ms      | 187 ms      | 188 ms | 37% |
| [θ]       | 111 ms      | 88 ms       | 122 ms      | 107 ms | 65% |
| [ʃ]       | 153 ms      | 159 ms      | 186 ms      | 166 ms | 42% |
| [v]       | 103 ms      | 117 ms      | 118 ms      | 113 ms | 62% |
| [z]       | 146 ms      | 165 ms      | 146 ms      | 152 ms | 46% |
| [ð]       | 132 ms      | 82 ms       | 144 ms      | 119 ms | 59% |

### Feature Analysis Results

#### Place of Articulation (Table II)
- Most affected by duration reduction
- Categories: "front" [f, v], "middle" [s, z, θ, ð], "back" [ʃ]
- 50% information transmitted only at ~70 ms
- [θ, ð] identification remains poor even with full frication

#### Voicing (Table III)
- Highly stable across all durations
- 83% correct even at 20 ms condition
- Voiceless slightly better than voiced at short durations
- Equal by 50 ms condition

#### Manner of Articulation (Table IV)
- Fricative vs. stop distinction
- 72-87% correct even at 20 ms
- At <14 ms, fricatives perceived as stops (pilot study)
- Gradual amplitude increase may cue fricative manner

### Amplitude Measurements of Test Stimuli
| Fricative | Amplitude |
|-----------|-----------|
| [z]       | 70 dB |
| [v], [ð]  | 66 dB |
| [s]       | 65 dB |
| [ʃ]       | 64 dB |
| [θ]       | 54 dB |
| [f]       | 53 dB |

**Key finding:** Amplitude per se is NOT a major cue - [ʃ] identified better than [s] despite similar intensity; [f] better than [θ] despite similar intensity.

### Vowel Context Effects (Table V)
- Most fricatives: no significant vowel effect
- [θ, z, ð]: better in [i, u] context (51%) than [a] context (38%)

## Parameters

| Parameter | Value | Units | Context |
|-----------|-------|-------|---------|
| Minimum perceptual duration (ʃ, z) | ~30 | ms | 70% accuracy |
| Minimum perceptual duration (f, s, v) | ~50 | ms | 70% accuracy |
| Minimum perceptual duration (θ, ð) | Full frication | ms | Even then poor |
| 50% information transmission | ~40 | ms | Overall identification |
| 50% place information | ~70 | ms | Place only |
| Manner perception threshold | 14-20 | ms | Fricative vs stop |
| Voicing perception at 20 ms | 83 | % | Already stable |

## Implementation Notes for Klatt Synthesizer

### Minimum Frication Durations
For natural-sounding fricatives, ensure:
- **Sibilants [s, z, ʃ, ʒ]:** Minimum 30-50 ms frication
- **Labiodentals [f, v]:** Minimum 50 ms frication
- **Dentals [θ, ð]:** Need longer durations; consider full ~100+ ms

### Perceptual Implications
1. **Short fricatives sound like stops:** At <20 ms, fricatives perceived as stops
2. **Place cues build slowly:** Unlike stops (20-40 ms), fricatives need longer for place identification due to gradual amplitude rise
3. **Voicing cues available early:** Can be perceived in first 20-30 ms
4. **Amplitude not primary cue:** Spectral shape matters more than overall intensity

### Synthesis Recommendations
- Don't truncate frication noise below 30 ms for any fricative
- [θ, ð] particularly sensitive - use longer durations
- Gradual amplitude onset distinguishes fricatives from stops
- Vowel transitions less important than previously thought for [f, v]

## Figures of Interest
- **Fig 1 (p.1720):** Identification curves for each fricative by duration - shows [ʃ, z] plateau early, [θ, ð] stay low
- **Fig 2 (p.1723):** Overall information transmission vs duration
- **Fig 3 (p.1723):** Place-of-articulation information vs duration
- **Fig 4 (p.1723):** Voicing information vs duration - reaches 80%+ at 30 ms

## Limitations
- Single male speaker (though justified by interspeaker consistency in prior work)
- No stop consonants in stimulus set (manner results interpretive)
- Natural speech only - no synthetic verification

## Relevance to Qlatt Project

### Direct Applications
1. **Fricative duration rules:** Set minimum durations based on these thresholds
2. **Duration hierarchy:** Sibilants can be shorter than labiodentals; dentals need longest
3. **Frication onset:** Model gradual amplitude rise (distinguishes from stops)
4. **Voicing timing:** Voicing cues effective very early in frication

### Current Duration Rules to Check
Verify `tts-frontend-rules.js` fricative durations meet minimums:
- [s, z, ʃ, ʒ]: ≥30 ms minimum, 50+ ms preferred
- [f, v]: ≥50 ms minimum
- [θ, ð]: ≥100 ms preferred for clear identification

## Open Questions
- [ ] How does gradual amplitude onset interact with AF parameter?
- [ ] Are current Qlatt fricative durations above perceptual thresholds?
- [ ] Should [θ, ð] be synthesized differently (longer, or different spectral emphasis)?

## Related Work Worth Reading
- Stevens (1971) - Airflow and turbulence noise for fricatives
- Strevens (1960) - Spectra of fricative noise in human speech
- Behrens & Blumstein (1988a,b) - Acoustic characteristics of fricatives, amplitude role
- Hughes & Halle (1956) - Spectral properties of fricative consonants
- Soli (1981) - Fricative-vowel coarticulation effects on F2
