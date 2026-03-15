# Lehiste & Peterson 1961 — Implementation Notes

**Full title:** Some Basic Considerations in the Analysis of Intonation
**Authors:** Ilse Lehiste, Gordon E. Peterson
**Journal:** JASA 33(4), pp. 419-425 (April 1961)
**DOI:** 10.1121/1.1908681

## Key Findings for Synthesis

### 1. Intrinsic Fundamental Frequency of Vowels

Each vowel has a characteristic intrinsic F0. Measured at the peak of an intonation contour (speaker GEP, male):

| Vowel | Avg F0 (GEP) | Avg F0 (5 speakers) | Peterson-Barney F0 |
|-------|-------------|--------------------|--------------------|
| /i/   | 183         | 129                | 136                |
| /I/   | 173         | 130                | 135                |
| /eI/  | 169         | 130                | —                  |
| /E/   | 166         | 127                | 130                |
| /ae/  | 162         | 125                | 127                |
| /schwa/ | 164       | 127                | 130                |
| /A/   | 163         | 120                | 124                |
| /open-o/ | 165      | 116                | 129                |
| /oU/  | 170         | 122                | —                  |
| /U/   | 171         | 133                | 137                |
| /u/   | 182         | 134                | 141                |
| /aU/  | 159         | 119                | —                  |
| /aI/  | 160         | 124                | —                  |
| /oI/  | 163         | 123                | —                  |
| /3r/  | 170         | 130                | 133                |

**Pattern:** High vowels (/i/, /u/) have highest intrinsic F0; open vowels (/ae/, /A/) have lowest. Central vowels fall in the middle. Resembles an acoustic vowel diagram.

**Implementation note:** For F0 contour generation, intrinsic F0 offsets should be applied per vowel. The offset from the mean is what matters. GEP mean peak = 169 cps, so /i/ is +14, /ae/ is -7, etc. The 5-speaker mean = 126, with smaller offsets.

### 2. Effect of Initial Consonant on F0

Voiceless consonants raise F0 on the following vowel; voiced consonants lower it. Data from Table IV (averaged across all vowels):

| Consonant | Avg F0 after initial | Avg F0 before final |
|-----------|---------------------|---------------------|
| p         | 175                 | 174                 |
| b         | 165                 | 166                 |
| t         | 176                 | 168                 |
| d         | 163                 | 168                 |
| k         | 176                 | 170                 |
| g         | 163                 | 164                 |
| m         | 162                 | 168                 |
| n         | 161                 | 167                 |
| f         | 173                 | 169                 |
| v         | 155                 | 169                 |
| theta     | 173                 | 170                 |
| dh        | 161                 | 171                 |
| s         | 175                 | 169                 |
| z         | 169                 | —                   |
| sh        | 173                 | 163                 |
| zh        | —                   | 171                 |
| r         | 166                 | 168                 |
| l         | 164                 | 169                 |
| ch        | 177                 | 174                 |
| j (dzh)   | 161                 | 168                 |
| h         | 174                 | —                   |
| w         | 167                 | —                   |
| wh        | 174                 | —                   |
| y         | 164                 | —                   |
| **Avg**   | **169**             | **169**             |

**Key observations:**
- Voiceless stops/fricatives: F0 rises ~6-7 cps above average (175-176 vs 169 mean)
- Voiced stops: F0 drops ~6 cps below average (163 vs 169 mean)
- Voiced fricatives: even larger drop (v = 155, dh = 161)
- Sonorants (m, n, l): moderate drop (~161-164)
- After voiceless consonants: F0 peak occurs immediately after consonant release
- After voiced consonants (especially sonorants): F0 rises slowly, peak near middle of vowel

**Implementation note:** Apply F0 perturbation at vowel onset based on voicing of preceding consonant. Voiceless: +6 cps offset with immediate peak. Voiced: -6 cps offset with delayed peak.

### 3. Final Consonants Have No Regular Effect

Unlike initial consonants, final consonants show no systematic voiceless/voiced effect on the preceding vowel's F0 peak (Table III, Fig. 3). Apparent variations are sampling artifacts.

**Implementation note:** No F0 perturbation rule needed for following consonant voicing on the peak F0.

### 4. Intonation Level Relationships

Measurements at multiple points in the frame "Say the word ___ again" (Table V, GEP):

| Position              | Avg F0 (GEP) | Avg F0 (5 spkrs) |
|-----------------------|--------------|-------------------|
| Precontour ("word")   | 127          | 103               |
| Test word peak        | 169          | 126               |
| Test word end (low)   | 94           | 88                |
| "again" beginning     | 113          | 92                |
| "again" peak          | 130          | 98                |
| "again" end           | 86           | 78                |

**Critical finding:** The lower intonation level (end of test word) does NOT show the same vowel-dependent fluctuations as the peak. Average values for the low level show only negligible variation across vowels. This means no fixed frequency *ratio* is involved between intonation levels.

### 5. No Fixed Musical Intervals

Table VII shows frequency ratios between peak and end of test word vary considerably by speaker:

| Speaker | Ratio | Musical interval |
|---------|-------|-----------------|
| Bi      | 1.64  | m6-M6           |
| Br      | 1.27  | M3-P4           |
| Ch      | 1.46  | D5-P5           |
| He      | 1.40  | P4-D5           |
| Re      | 1.45  | D5-P5           |
| GEP     | 1.79  | m7-M7           |

Percentage of "pure" musical intervals ranged from 14% (GEP) to 32% (Re), suggesting intonation contours are NOT based on recurring musical intervals.

**Implementation note:** Don't model F0 contours as musical intervals. Use additive/multiplicative adjustments from a baseline, not ratio-based targets.

### 6. Precontour Stability

The F0 on the word "word" (precontour middle level) was stable regardless of the following test word's vowel quality. ~75% of all occurrences fell between 116-130 cps (Table XI). This confirms that mid-level pitch is a stable reference point.

### 7. Rise from Precontour to Peak

The rise from precontour to peak depends on intrinsic vowel F0 (Table IX):
- For /i/: average rise ~55 cps
- For /A/: average rise ~36 cps

Since the precontour is stable, the peak variation is genuinely driven by vowel intrinsic F0.

### 8. Declination Pattern on "again"

The drop from high to low on "again" was always smaller than the comparable drop on the test word:
- GEP: ~pure fifth on "again" vs ~major seventh on test word
- 5 speakers: ~major third on "again" vs ~diminished fifth on test word

The high level on "again" for GEP was slightly higher than the precontour mid level, but for the 5 speakers it was lower. This suggests intonation levels are not absolute frequency targets but context-dependent.

## Relevance to Klatt Synthesizer

1. **Intrinsic F0 rule:** Add per-vowel F0 offset to the target F0 based on vowel height. High vowels get positive offset, low vowels get negative offset.

2. **Consonant-conditioned F0 perturbation:** After voiceless onsets, apply a brief positive F0 perturbation at vowel onset; after voiced onsets, apply a negative perturbation with a slower rise to peak.

3. **F0 contour generation:** The low target of a fall is relatively stable across vowels — only the peak varies with vowel quality. Model the fall endpoint independently from the peak.

4. **Cross-speaker variation:** The absolute range of F0 movement varies greatly between speakers (M3 to M7), but the basic pattern (intrinsic F0, consonant perturbation) is consistent.
