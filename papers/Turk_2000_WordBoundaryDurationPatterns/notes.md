# Turk & Shattuck-Hufnagel 2000 — Implementation Notes

## Paper Reference
Turk, A. & Shattuck-Hufnagel, S. (2000). Word-boundary-related duration patterns in English. *Journal of Phonetics*, 28, 397–440. DOI: 10.1006/jpho.2000.0123

## Summary for Implementers

This paper evaluates five proposed word-level duration adjustment mechanisms using carefully controlled English stimuli. The key finding: **word-final lengthening does not exist as a separate mechanism** — the patterns attributed to it are better explained by word-initial lengthening, polysyllabic shortening, accentual lengthening, and syllable ratio equalization.

## The Five Mechanisms Evaluated

### 1. Word-Final Lengthening — NOT SUPPORTED
- Prediction: segments at word ends should be longer than identical segments in word-medial position
- Result: No consistent lengthening of word-final segments observed
- **Implementation: Do NOT add a word-final lengthening rule**

### 2. Word-Initial Lengthening — SUPPORTED
- Prediction: segments at word onsets should be longer than word-medial onsets
- Result: Consistent lengthening of word-initial consonants and following vowels
- Magnitude: Word-initial consonants ~5-15 ms longer than word-medial equivalents
- Strongest in accented conditions
- **Implementation: Apply lengthening to word-initial onset consonants**

### 3. Polysyllabic Shortening — SUPPORTED (Symmetric)
- Prediction: syllables shorten as word length increases
- Result: Supported, and applies symmetrically (both early and late syllables shorten in longer words)
- Not limited to stressed syllables — affects all syllables in a word
- **Implementation: Duration multiplier based on number of syllables in word, applied to all syllables**

### 4. Accentual Lengthening — SUPPORTED
- Prediction: accented syllables are longer than unaccented
- Result: Strong effect on accented syllables and neighboring syllables
- Interacts with all other mechanisms (amplifies word-initial lengthening, etc.)
- **Implementation: Already handled by standard accent/stress rules**

### 5. Syllable Ratio Equalization — SUPPORTED (on nuclei)
- Prediction: syllable durations within a word tend toward equal ratios
- Result: Supported specifically for syllable nuclei (vowels), not for whole syllables
- Operates on nuclei of adjacent syllables within a word
- **Implementation: After other duration rules, nudge vowel durations toward equal ratios within a word**

## Experimental Design Details

### Stimuli Structure
- 11 triads of sentences with controlled segmental content
- Example triad: "tune#acquire" vs "tuna#choir" vs "tune#a#choir"
- Word boundary location varies while keeping segmental sequence identical
- 4 accent conditions per triad: both accented, first only, second only, neither

### Speakers
- 6 speakers (5 female, 1 male), all American English
- 5 repetitions each

### Measurement
- Three target syllables per triad measured
- Sub-syllabic analysis: onset, center (vowel nucleus), coda measured separately
- Both absolute durations and ratios analyzed

## Key Quantitative Results

### Whole-Syllable Effects (Syllable 2 — the critical boundary syllable)
- Differences between boundary conditions: typically 5-20 ms
- Effect sizes approach ~10% in accented conditions (near perceptual threshold)
- Unaccented conditions show smaller, less reliable differences

### Sub-Syllabic Distribution
- Syllable centers (nuclei) show largest and most reliable boundary effects
- Onset effects present but smaller
- Coda effects inconsistent
- This pattern is consistent with word-initial lengthening (lengthening spreads from onset into nucleus) but NOT with word-final lengthening

### Function Word Boundaries
- Function word boundaries ("tune a choir") produce weaker effects than content word boundaries ("tuna choir")
- Consistent with prosodic hierarchy: function words may cliticize to adjacent content words
- **Implementation: Reduce word-boundary lengthening when one of the adjacent words is a function word**

## Implementation Recommendations for Qlatt

### Duration Rule Design
1. **Word-initial lengthening rule**: Apply ~1.05-1.10 multiplier to word-initial onset consonants and ~1.03-1.07 to following vowel nucleus. Scale with accent level.
2. **Polysyllabic shortening rule**: For N-syllable words, apply shortening factor to all syllables. Symmetric — don't privilege stressed syllable position. Approximate factor: `1.0 - 0.03 * (N - 1)` (engineering estimate from general patterns, not directly from this paper's data).
3. **No word-final lengthening rule**: Do not implement. Previous domain-edge lengthening rules should be checked — phrase-final and utterance-final lengthening are separate phenomena (driven by prosodic boundaries, not word boundaries per se).
4. **Function word boundary attenuation**: When computing word-boundary effects, reduce magnitude if either neighbor is a function word (approximately halve the effect).

### Interaction with Existing Rules
- Phrase-boundary lengthening (Crystal & House 1988, Wightman et al. 1992) is a separate, well-supported phenomenon — do not confuse with word-boundary effects
- The word-initial lengthening found here is distinct from and additive with phrase-initial strengthening (Fougeron & Keating 1997)
- Polysyllabic shortening interacts with but does not replace stress-based duration rules

### What This Paper Does NOT Provide
- No absolute duration values suitable for direct parameter setting (relative comparisons only)
- No F0 or formant data
- No spectral information
- Duration effects are relative to matched segmental contexts, not absolute targets
