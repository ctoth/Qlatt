# Bartkova & Sorin (1987) - A Model of Segmental Duration for Speech Synthesis in French

## Implementation-Focused Notes

### Core Duration Model

The model predicts segmental duration using a multiplicative formula:

```
VOWEL DURATION    = DI * V_i * m_c
CONSONANT DURATION = DI * C_ij
```

Where:
- **DI** = speaker-independent Intrinsic Duration (ms) for each phoneme (Table 1)
- **V_i** = vowel position coefficient (11 positions, Table 4)
- **m_c** = co-intrinsic factor reflecting following consonant influence on preceding vowel (Table 3)
- **C_ij** = consonant position coefficient (9 positions x 7 phonetic classes, Table 5)

### Intrinsic Durations (Table 1)

Measured on logatoms (CVC/VCV nonsense tokens), averaged over 4 speakers (articulation rates 4.2-6.1 syll/s). Units: ms.

| Vowels | DI (ms) | Semi-vowels | DI (ms) | Fricatives | DI (ms) | Plosives | DI (ms) | Nasals/Liquids | DI (ms) |
|--------|---------|-------------|---------|------------|---------|----------|---------|----------------|---------|
| a      | 177     | w           | 144     | f          | 239     | p        | 193     | m              | 167     |
| e      | 175     | j           | 150     | s          | 254     | t        | 210     | n              | 157     |
| epsilon| 180     | 4 (ue)      | 150     | sh (S)     | 250     | k        | 210     | l              | 134     |
| i      | 170     | a~ (nasal)  | 200     | v          | 150     | b        | 174     | r              | 132     |
| y      | 167     | 5 (nasal)   | 200     | z          | 163     | d        | 167     |                |         |
| u      | 170     | e~ (nasal)  | 200     | 3 (zh)     | 173     | g        | 163     |                |         |
| o      | 186     |             |         |            |         |          |         |                |         |
| open-o | 170     |             |         |            |         |          |         |                |         |
| oe     | 185     |             |         |            |         |          |         |                |         |
| oe-open| 186     |             |         |            |         |          |         |                |         |
| schwa  | 130     |             |         |            |         |          |         |                |         |

### Vowel Position Coefficients V_i (Table 4)

11 positions for vowels based on prosodic/syntactic context:

| Coefficient | Speaker 1 | Speaker 2 | Description |
|-------------|-----------|-----------|-------------|
| V_1         | 0.36      | 0.56      | Function word, inside plurisyllabic word, first syllable, preceded by pause |
| V_2         | 0.36      | 0.38      | Followed by pause |
| V_3         | 0.86      | 1.10      | Inside plurisyllabic word, first syllable, preceded by pause, followed by long pause |
| V_4         | 0.40      | 0.40      | Inside plurisyllabic word, first syllable, preceded by pause, followed by short pause |
| V_5         | 0.45      | 0.59      | Inside plurisyllabic word, first syllable, preceded by pause, before new syntactic phrase |
| V_6         | 0.38      | 0.43      | Inside plurisyllabic word, first syllable, preceded by pause, before major boundary |
| V_7         | 0.43      | 0.45      | Followed by pause, before major boundary |
| V_8         | 0.66      | 0.80      | Last syllable, followed by short pause, before major boundary |
| V_9         | 0.52      | 0.60      | Final pause position |
| V_10        | 0.86      | 1.10      | Final pause, before major boundary |
| V_11        | 0.66      | 0.80      | Final pause position (variant) |

Key observation: V coefficients are all < 1.0 for Speaker 1, meaning durations in connected speech are always shorter than isolated intrinsic durations. Speaker 2 (slower rate) has some coefficients >= 1.0.

### Co-intrinsic Factors m_c (Table 3)

Reflect influence of following consonant on preceding vowel duration. Only applied in closed syllables (V_8, V_9, V_10, V_11 positions).

| Consonant class | Speaker 1 | Speaker 2 |
|-----------------|-----------|-----------|
| p, t, k         | 0.85      | 0.95      |
| b, d, g         | 0.93      | 1.02      |
| v, 3, z, r      | 1.25      | 1.56      |
| f, s, S         | 0.88      | 1.08      |
| w, j, l         | 0.82      | 1.05      |
| m, n            | 0.83      | 0.95      |

Key finding: Voiced fricatives (v, z, 3, r) cause the most vowel lengthening (m_c > 1.0). Voiceless plosives and nasals cause the most shortening.

### Consonant Position Coefficients C_ij (Table 5)

9 positions x 7 phonetic classes. All values are < 1.0 (shortening relative to intrinsic duration).

7 consonant classes (j = 1..7):
1. b, d, g (voiced plosives)
2. p, t, k (voiceless plosives)
3. v, z, 3 (voiced fricatives)
4. f, s, S (voiceless fricatives)
5. m, n (nasals)
6. r, l (liquids)
7. w, j, y (glides)

9 positions (columns C_1j through C_9j) correspond to positions in the consonant flow chart (Fig. 2):
- C_1: preceded by pause, first syllable
- C_2: inside plurisyllabic word (not preceded by pause), first syllable
- C_3: preceded by pause, in cluster
- C_4: inside word, in cluster, preceded by pause
- C_5: closing syllable, followed by long pause, in cluster
- C_6: closing syllable, not in cluster
- C_7: first syllable, not preceded by pause
- C_8: closing syllable, followed by long pause, in cluster
- C_9: closing syllable, in cluster (various positions)

Representative values for Speaker 1 (all multiplied by DI):

| Class     | C_1  | C_2  | C_3  | C_4  | C_5  | C_6  | C_7  | C_8  | C_9  |
|-----------|------|------|------|------|------|------|------|------|------|
| b,d,g     | 0.52 | 0.32 | 0.56 | 0.34 | 0.60 | 0.40 | 0.38 | 0.30 | 0.59 |
| p,t,k     | 0.57 | 0.36 | 0.57 | 0.47 | 0.62 | 0.50/0.57 | 0.49 | 0.33 | 0.80/0.95 |
| v,z,3     | 0.50 | 0.42 | 0.52 | 0.42/0.48 | 0.55/0.60 | 0.49 | 0.46 | 0.33/0.38 | 0.80/0.90 |
| f,s,S     | 0.48 | 0.40 | 0.52 | 0.48 | 0.60 | 0.53 | 0.44/0.51 | 0.24/0.32 | 0.90 |
| m,n       | 0.40 | 0.30 | 0.45 | 0.40 | 0.50 | 0.42 | 0.40 | 0.34 | 0.50 |
| r,l       | 0.37/0.57 | 0.30 | 0.45/0.57 | 0.32/0.38 | 0.46/0.58 | 0.33 | 0.31 | 0.45 | 0.75 |
| w,j,y     | 0.30 | 0.25 | 0.33/0.40 | 0.26 | 0.60 | 0.33 | 0.40 | 0.25 | 0.80/0.86 |

### Specific Rules

1. **Nasal Vowel Rule**: If a nasal vowel (/a~/, etc.) is followed by a nasal consonant (/m/ or /n/), its intrinsic duration becomes that of the corresponding oral vowel (/a/).
   - `DUR(nasalV) = DI(oralV) * V_i`

2. **Liaison Consonant Rule**: A liaison consonant gets coefficient C_2.
   - `DUR(t) = DI(t) * C_2`

3. **Vowel in Monosyllabic Lexical Words Rule**: Treated as the final vowel of a plurisyllabic word.
   - `DUR(i) = DI(i) * V_9`

4. **Consonants in Monosyllabic Words Rule**: If a word is followed by a pause, all its consonants are treated like consonants in the final syllable of plurisyllabic words.

5. **Cluster Rule**: If a cluster contains a semi-vowel, only the semi-vowel takes the "cluster" coefficient; other consonants are treated as isolated.
   - `DUR(v) = DI(v) * C_4, DUR(w) = DI(w) * C_8`

6. **Liquid in Cluster Rule**: If a cluster contains a liquid /l/, neither the adjacent consonant nor the liquid are considered part of the cluster.

### Validation Results

- Standard deviation between measured and predicted durations: 13-17 ms for consonants, 10-15 ms for vowels (Table 7, 8)
- These are less than the JND (just-noticeable difference) of 20 ms for connected speech
- Comparison with O'Shaughnessy (1984) model shows comparable accuracy (Table 6)
- Model tested on 2 speakers with different articulation rates

### Speaking Style Adaptation

The model separates speaker-independent (DI) from speaker-dependent (V_i, C_ij, m_c) parameters:
- Different speakers produce different coefficient sets
- An "articulation rate" command parameter can interpolate between coefficient sets
- Two command parameters planned: one for articulation rate, one for speaking style (consonantal vs vocalic)

### Key Design Differences from Klatt (1979) / O'Shaughnessy (1984)

1. Uses multiplicative coefficients (percentages) rather than additive ms adjustments
2. Speaker-independent intrinsic durations vs speaker-dependent base durations
3. No "stress position" factor (not well-defined for French)
4. No minimum duration clamp (Klatt uses this for English)
5. Coefficients are relative (0.0-1.5 range) making speaker adaptation straightforward
6. Rules based on 4 speakers and 3 specially designed corpora, not averaged over 29 speakers from a single corpus

### Implementation Notes for Synthesis

Input requirements:
- Phoneme string with markers for:
  - Function word vs content word
  - Long pause (> 100 ms) and short pause (<= 100 ms) locations
  - Syntactic phrase boundaries
  - Major constituent boundaries (verbal groups, complements)
- Position of phoneme in syllable and word

The duration rules are integrated into the prosodic module of the CNET diphone-synthesis system (Stella, 1985). Segment boundaries in the diphone dictionary use the same segmentation criteria as the measurement corpus.
