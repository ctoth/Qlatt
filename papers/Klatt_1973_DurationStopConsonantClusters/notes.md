# Implementation Notes: Klatt 1973 — Durational Characteristics of Prestressed Word-Initial Consonant Clusters in English

**Citation:** Klatt, D. H. (1973). Durational characteristics of prestressed word-initial consonant clusters in English. Quarterly Progress Report No. 108, Research Laboratory of Electronics, M.I.T., pp. 253-260.

**Note:** The PDF contains the full Speech Communication section (XIX) of QPR 108. Klatt's paper is Section B, pages 253-260.

## Key Findings for Synthesis

### Basic Singleton Durations (Table XIX-2)

These are the baseline durations of consonants when occurring as the sole onset consonant (measured from 5 words x 3 speakers, in frame sentence "Say x instead"):

| Consonant | Duration (ms) | Place     |
|-----------|--------------|-----------|
| f         | 138          | labial    |
| p         | 100          | labial    |
| b         | 97           | labial    |
| m         | 105          | labial    |
| w         | 107          | labial    |
| s         | 152          | dental    |
| t         | 85           | dental    |
| d         | 85           | dental    |
| n         | 92           | dental    |
| l         | 92           | dental    |
| r         | 102          | alveolar  |
| k         | 78           | velar     |
| g         | 78           | velar     |

**Pattern:** Labials > dentals > velars for closure duration. Fricatives > stops > sonorants.

### Duration Rules for Clusters (Table XIX-4)

Five rules predict how consonant durations change in clusters. Total percentage change is additive.

#### Rule 1: General Consonantal Shortening

In **2-element clusters**:
- C1 = -12%
- C2 = -22%

In **3-element clusters**:
- C1 = -15%
- C2 = -25%
- C3 = -30%

#### Rule 2: Sonorant Lengthening if Partially Voiceless

If C is preceded by a voiceless aspirated stop: C = **+28%**

Example: /r/ in "tried" (aspirated /t/) is lengthened, but /r/ in "stride" (unaspirated /t/ after /s/) is not. The sonorant in "tried" is actually longer than its basic duration in "ride."

Explanation: formant transitions for the sonorant-vowel boundary are delayed to occur during voicing rather than during aspiration.

#### Rule 3: Ballistic Shortening

- If C precedes a stop: C = **-8%**
- If C precedes a voiceless stop: C = **-8%** (additional, so -16% total before voiceless stops)

Example: /s/ in /sk/ is shortened because the ballistic closing gesture of the stop impinges on the preceding segment.

#### Rule 4: Incompressibility of Labials

- If C is a labial: C = **+6%**
- If C is adjacent to a labial: C = **-6%**

Labial consonants resist shortening more than nonlabials. This incompressibility comes at the expense of adjacent segments. Implies lips are more sluggish under time pressure than other articulators.

#### Rule 5: Retroflection Following Dental Stops

- If [r] follows a dental stop: [r] = **+13%**
- If [r] follows a dental stop: dental stop = **-13%**

Dental-[r] clusters are homorganic but involve incompatible articulatory gestures (Haggard 1970). The cluster restructures so /r/ gets longer and the dental gets shorter.

### Measured Cluster Durations (Table XIX-3)

Selected measured vs. predicted durations (ms):

| Cluster | C1 meas | C1 pred | C2 meas | C2 pred |
|---------|---------|---------|---------|---------|
| sp      | 102     | 99      | 83      | 84      |
| st      | 110     | 109     | 53      | 66      |
| sk      | 105     | 109     | 58      | 61      |
| sm      | 112     | 111     | 85      | 88      |
| sn      | 123     | 121     | 70      | 72      |
| sw      | 125     | 124     | 93      | 90      |
| sl      | 133     | 133     | 67      | 72      |
| fl      | 118     | 129     | 53      | 66      |
| pl      | 100     | 94      | 83      | 92      |
| bl      | 88      | 91      | 73      | 66      |
| pr      | 90      | 94      | 97      | 102     |
| br      | 95      | 91      | 65      | 74      |
| tw      | 70      | 70      | 135     | 120     |
| tr      | 62      | 64      | 125     | 121     |
| dr      | 63      | 64      | 93      | 93      |
| kw      | 70      | 64      | 117     | 120     |
| kl      | 75      | 69      | 95      | 98      |
| gl      | 68      | 69      | 85      | 72      |
| kr      | 67      | 69      | 108     | 108     |
| gr      | 70      | 69      | 98      | 80      |

3-element clusters:

| Cluster | C1 meas | C1 pred | C2 meas | C2 pred | C3 meas | C3 pred |
|---------|---------|---------|---------|---------|---------|---------|
| spl     | 93      | 96      | —       | —       | —       | —       |
| spr     | 97      | 96      | —       | —       | —       | —       |
| str     | 102     | 105     | —       | —       | —       | —       |
| skw     | 107     | 105     | —       | —       | —       | —       |
| skr     | 107     | 105     | —       | —       | —       | —       |

### Additional Findings

- **Vowel conditioning:** No statistically significant effect of following vowel ([i, E, ay, u]) on consonant duration.
- **Polysyllabic shortening:** Adding a second syllable shortens the stressed vowel 26% and the preceding consonant of the cluster 10%. Earlier consonants in the cluster are nearly unchanged.
- **Speaker variability:** Durations were longest for speaker KNS, 4% shorter for RK, 25% shorter for DHK. Standard deviation ~10 ms (7%) for repeated measurements.
- **Measurement precision:** Segmental boundaries defined by acoustic landmarks in spectrograms. Sonorant-vowel boundary = time when F2 passes halfway between initial and final transition values.

### Relevance to Synthesis by Rule

Klatt explicitly states these rules should be incorporated in speech synthesis by rule systems. The durational differences are larger than just-noticeable differences for consonant duration (Huggins 1972), and larger than production standard deviations. The rules express regularities found across speakers and across two dialects of English (American and British, per Haggard 1970).

### How to Apply in Qlatt

1. Look up basic consonant duration from Table XIX-2
2. Apply Rule 1 (general shortening) based on cluster size and position
3. Check Rule 2: if sonorant follows aspirated voiceless stop (not preceded by /s/)
4. Check Rule 3: if consonant precedes a stop
5. Check Rule 4: if consonant is labial or adjacent to labial
6. Check Rule 5: if [r] follows a dental stop
7. Sum all applicable percentage changes and apply to basic duration

These rules stack additively (percentages are summed before applying).
