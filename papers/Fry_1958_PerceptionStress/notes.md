# Fry (1958) — Experiments in the Perception of Stress

## Implementation-Relevant Findings

### Hierarchy of Stress Cues in English

The paper establishes a perceptual hierarchy for stress cues in English disyllabic words (noun/verb pairs like *subject*, *object*, *digest*, *contract*, *permit*):

1. **Fundamental frequency (F0)** — all-or-none effect; direction of pitch change is decisive, magnitude is not
2. **Duration** — strong graded effect; duration ratio V1/V2 is the primary graded cue
3. **Intensity** — weaker graded effect; similar direction to duration but less powerful
4. **Vowel quality (formant structure)** — not directly tested but noted as potentially the most powerful cue for English listeners

### Experiment 1: Duration and Intensity

- **Stimuli**: Synthesized versions of 5 word-pairs (*subject*, *object*, *digest*, *contract*, *permit*) using Haskins pattern playback
- **F0 held constant** at 120 c.p.s.
- **Duration ratios** (V1/V2): 5 steps covering observed range. For *subject*, values were 0.25, 0.40, 0.60, 1.00, 1.25
- **Intensity ratios** (V1/V2): 5 steps: -10, -5, 0, +5, +10 dB for all word-pairs
- **N = 118 subjects**
- **Key finding**: Duration produced 12-92% range in noun judgments; intensity produced 40-82% range
- Duration is the stronger cue: a 20 dB intensity change produced a logit rise of 2.5, which is equivalent to a duration ratio change of only ~0.6

### Specific Duration Equivalences (from logit analysis)

| Word pair | 20 dB intensity equivalent in duration ratio |
|-----------|----------------------------------------------|
| object    | ~0.4 change in duration ratio |
| digest    | ~0.16 |
| contract  | ~0.35 |
| permit    | ~0.9 |

### Experiment 2: Duration and Fundamental Frequency (Step Changes)

- Duration ratios combined with step-changes of F0 between syllables
- **F0 reference**: 97 c.p.s. (male voice)
- **F0 step values**: 5, 10, 15, 20, 30, 40, 60, 90 c.p.s. (step-up and step-down)
- **N = 41 subjects** (American and English)
- **Key finding**: Direction of F0 step matters (all-or-none), magnitude does not
  - Step-down in F0 (higher first syllable) shifts curve toward more noun judgments
  - Step-up (higher second syllable) shifts toward verb judgments
  - But increasing step size beyond ~5 c.p.s. produces no additional effect
  - The logit values for different step sizes lie approximately on a horizontal line
- The difference between step-up and step-down means is significant at the 1% level for all duration ratios

### Experiment 3: Syllable Inflection (Within-Syllable F0 Changes)

- F0 varied within syllables using 16 patterns (Table 1) including level tones, linear changes, and curvilinear changes
- Reference frequency: 97 c.p.s., range up to 130 c.p.s.
- Two types of frequency change: continuous throughout vowel, or occupying only half the vowel duration
- **N = 76 subjects**
- **Key finding**: Sentence intonation (the F0 contour pattern) can override the duration cue entirely
  - Patterns A (fall-level, like English declarative) and E/F (rise-level) produced 70-80% noun judgments regardless of duration
  - Pattern B (level-fall) and M/N (level-fall on second syllable) produced only 17-24% noun judgments
  - Inflected syllables (with pitch movement) are heard as stressed 66% of the time vs. 33% for level syllables
  - Rising vs. falling distinction within a syllable: 61% of rising syllables heard as stressed vs. 64% of falling — not significantly different

### Key Design Parameters for a Synthesizer

1. **Duration ratio is the primary graded stress cue**: The ratio of vowel durations between syllables, not absolute duration, determines stress perception. A stressed vowel should be longer relative to its unstressed counterpart.

2. **F0 cue is binary, not graded**: The listener perceives which syllable has higher pitch, but the amount of pitch difference does not matter much beyond a threshold of ~5 c.p.s. (~a semitone at 97 Hz).

3. **Sentence intonation overrides segment-level cues**: F0 contour patterns that match natural English intonation (e.g., fall on stressed syllable in declarative) can completely override duration cues. This means F0 contour shape matters more than F0 level for stress.

4. **Intensity is a secondary cue**: While it contributes to stress perception, its effect is roughly 1/3 to 1/4 the effect of duration (in terms of the logit scale).

5. **Cue interaction**: Duration and intensity reinforce each other when both favor the same syllable. When opposed, duration dominates but there is greater listener disagreement (~50% noun judgments).

### Methodological Notes

- **Logit analysis**: The paper uses logit p = log(p/q) where p = proportion noun judgments, q = 1-p. This linearizes the response curves and allows additive decomposition of cue effects.
- **Ratio-based measurement**: All physical dimensions measured as ratios between syllables (V1/V2), consistent with stress being a relational property.
- **Cross-over point**: The ratio at which listeners are equally likely to judge noun or verb. For duration, cross-over is at equal durations or slightly favoring V1 depending on the word pair.
