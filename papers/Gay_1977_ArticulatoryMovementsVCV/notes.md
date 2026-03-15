# Gay 1977 — Articulatory Movements in VCV Sequences

## Implementation-Relevant Findings

### Experimental Setup
- Two adult male speakers of American English
- VCV utterances with vowels /i, a, u/ and consonants /p, t, k/ in all combinations (27 utterances)
- CVCVC strings where initial and final consonants remained constant (/k/ and /p/ respectively)
- Cinefluorographic tracking (16-mm, 60 fps) of upper lip, lower lip, jaw, tongue tip, and tongue body
- 2.5-mm lead pellets attached to articulators; jaw measured at lower central incisors
- Spectrographic measurements (F1, F2) made from acoustic recordings

### Key Timing Findings

#### Consonant Closure Constrains V-to-V Movement
- Closing movements from V1 toward consonant: tongue body, jaw, and primary articulator onset times fall within the same overall window
- Coordination within the closing window is loose (window is wide) but all movements begin within 10-15 ms of each other
- **Opening movements toward V2 always begin during the closure period** of the intervocalic consonant
- The consonant closure period is the boundary: anticipatory movements toward V2 do not begin before closure

#### V1-to-Consonant Timing (Closing)
- For both subjects, closing movements from V1 to consonant were far more constrained than opening movements
- Earlier starting times for /a/ (probably due to greater articulatory displacement needed)
- Movements of tongue body, jaw, and primary articulator begin within 10-15 ms of each other during closing
- When primary articulator movement is not contradictory to V1 (e.g., /u/ to /p/), closing movements of tongue body and jaw are still constrained by the consonant

#### Consonant-to-V2 Timing (Opening)
- Staggered pattern: tongue body movement begins first (5-60 ms after closure), followed independently by jaw opening, then primary articulator release
- Tongue body leads jaw leads primary articulator
- Tongue body movements toward V2 begin 5-50 ms (FSC) or 5-60 ms (GNS) after consonant closure
- Movement onsets for opening did not correspond to any feature other than a general tendency for earlier opening toward open vowels
- The CV transition is produced as an integral articulatory unit — release of consonant and movement toward V2 are linked

### Consonant-Specific Articulation Patterns

#### /p/ (bilabial)
- Primary articulator: lips (complete independence from tongue)
- Tongue body is not actively involved in consonant gesture
- Tongue body begins movement toward V2 after closure, some 5-60 ms later
- Jaw effects are the main carryover mechanism: jaw position during /p/ is sensitive to openness of adjacent vowel (greater jaw opening for /a/)
- Upper lip contributions to closure were negligible for both subjects
- Subject FSC: jaw closing at time of lip closing; Subject GNS: jaw opening follows lip opening (slight subject variation)

#### /t/ (alveolar)
- Primary articulator: tongue tip
- Tongue body movements toward V2 independent from tongue tip
- Tongue body, tongue tip, and jaw begin moving into V2 at different times — tongue body leads, jaw and tongue tip follow
- Carryover effects of V1 did not appear in tongue tip or jaw measurements
- Tongue tip position for /t/ insensitive to preceding vowel context

#### /k/ (velar)
- Primary articulator: tongue body (both height and fronting dimensions)
- Most interesting case: tongue body is in continuous movement throughout closure
- Three movement tracks (/aki/, /aka/, /aku/) converge at about time of consonant release, then diverge toward V2 targets
- At closure, tracks are within 3 mm of each other in both height and fronting dimensions
- At release, differences are 8 mm (height, /i/ vs /a/) and 10 mm (height, /i/ vs /u/) — anticipatory coarticulation
- Closure for /k/ occurs at approximately the same location in the vocal tract regardless of V2 identity
- Movement from same vowel into /k/ is directed toward a common target position for release
- Elliptical movement patterns for symmetrical /VkV/ and /schwa-kV/ sequences (consistent with Kent and Perkell)

### Coarticulation Scope

#### Anticipatory Effects
- Anticipatory movements toward V2 always begin during closure period
- Restricted coarticulatory field includes tongue body and jaw movements for V2
- Size of anticipatory field NOT affected by identity of the intervocalic consonant
- Effects do not extend beyond immediately adjacent segment

#### Carryover Effects
- Carryover effects depend on phonetic identity of the segment and degree of articulator involvement
- For /p/: carryover appears only in jaw position (sensitive to preceding vowel openness)
- For /t/: no measurable carryover in tongue tip or jaw
- For /k/: strong carryover in tongue body movement (V1 identity visible in tongue body position at closure onset)
- Carryover effects did not extend beyond immediately adjacent segment
- Carryover for /a/ is the open vowel with greatest jaw displacement effects

### Articulatory Target Data

#### Formant Frequencies at V2 Target (Table I)
Vowel /i/ in nine VCV utterances with /i/ as V2:

| Utterance | F1 (FSC) | F2 (FSC) | F1 (GNS) | F2 (GNS) |
|-----------|----------|----------|----------|----------|
| ipi       | 340      | 2200     | 310      | 2230     |
| api       | 360      | 2030     | 320      | 2250     |
| upi       | 360      | 2220     | 300      | 2160     |
| iti       | 360      | 2220     | 330      | 2200     |
| ati       | 320      | 2120     | 340      | 2210     |
| uti       | 350      | 1990     | 320      | 2120     |
| iki       | 320      | 2210     | 320      | 2270     |
| aki       | 360      | 2160     | 320      | 2160     |
| uki       | 350      | 2190     | 320      | 2250     |

- F1 variability: within 40 Hz range for both subjects
- F2 variability: within 230 Hz (FSC) and 120 Hz (GNS) range
- Acoustic variability did not correspond to articulatory variability
- Tongue body and jaw height appear to be independent features (jaw opening as unmarked facilitory gesture)

### Implications for Synthesis

1. **CV transition as integral unit**: The consonant release and movement toward V2 are organized as a single articulatory unit. For synthesis, formant transitions from consonant to V2 should be modeled as a unified gesture starting at consonant release.

2. **Anticipatory coarticulation begins at closure**: V2-directed movements begin during consonant closure, not before. This means formant transitions toward V2 targets should begin no earlier than consonant closure onset.

3. **Carryover is consonant-dependent**: The degree of V1 influence on the consonant depends on which articulator is primary. For /k/, carryover is strong; for /t/, weak; for /p/, mainly in jaw (which affects formants indirectly).

4. **Limited coarticulation span**: Both anticipatory and carryover effects are limited to immediately adjacent segments. No need to model long-distance coarticulation in VCV sequences.

5. **Jaw-formant independence**: Jaw position and tongue body height appear to be independent articulatory features that co-vary with vowels. This supports modeling jaw opening as a facilitory rather than primary mechanism for formant changes.

6. **Tongue body movement leads**: In the opening phase, tongue body begins moving before jaw and primary articulator. This suggests formant transitions (especially F2) may begin slightly before the acoustic release burst.
