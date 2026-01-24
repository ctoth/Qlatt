# Pages 520-559 Notes

## Chapters/Sections Covered

**Appendix: Experimental Data Tables (Tables 111-121)**

This chunk contains the latter portion of the appendix with extensive experimental F0 measurement data tables. These are raw data tables from the experiments that informed the prosody model developed in earlier chapters.

## Key Findings

### Nature of Content

Pages 520-559 consist entirely of:
1. **Test sentence examples** (pages 520-530): Tables 111-161 showing example sentences used in experiments with various syntactic structures
2. **F0 measurement data tables** (pages 531-559): Tables showing measured F0 values for different words in test sentences

### Test Sentence Categories (Tables 111-161)

The test sentences cover diverse syntactic phenomena:
- Monosyllabic accented words (Table 121)
- Sentence/clause/phrase positions (initial, medial, final)
- Voiced vs unvoiced consonant contexts
- Clause-internal continuation rises (Table 129)
- Successive alternating peaks and valleys (Table 149)
- Active vs passive sentences (Tables 67, 72)
- Clefted and embedded clauses (Tables 75, 86-87)
- Questions vs statements
- Coordinated structures
- Parentheticals and appositives

### F0 Measurement Data Structure

The data tables (Tables 1-121 in appendix) record F0 measurements with columns:
- **sp**: Speaker code (JA, KS, DO, DK, ML)
- **N**: Number of syllables or items
- **pk**: Peak F0 value (Hz)
- **ds**: Deviation from some reference (likely declination line)
- **ac**: Accent-related measurement
- **fo**: F0 value
- **CR**: Continuation rise indicator
- **fl**: F1 (first formant) - occasional
- **end**: End position value
- **ch**: Change value
- **low**: Low point value

### Speaker Codes

Three main speakers appear throughout:
- **JA**: Primary speaker (most data)
- **KS**: Second speaker
- **DO/DK**: Additional speakers (less frequent)
- **ML**: Additional speaker

### Sentence Position Effects (from Table 120-121)

Table 120 shows F0 patterns for different positions and voicing:
- **snt-fnl** (sentence-final): voiced, unvoiced contexts
- **phr-fnl** (phrase-final): voiced, unvoiced contexts
- **phr-non-fnl** (phrase non-final)
- **cls-init** (clause-initial): voiced, unvoiced
- **phr-init** (phrase-initial): voiced contexts
- **phr-medial** (phrase-medial): with accented syllables

Table 121 code categories:
- Accented syllable patterns (unvoiced, voiced, "big", "Thus", "dig")
- Position-based F0 with continuation rises
- Voicing effects on F0

### Data Table Structure Example (Table 120)

| Code | sp | N | accented syllable | unaccented syllable |
|------|----|----|-------------------|---------------------|
| hunters snt-fnl | JA | 2 | pk=146, ac=20 | pk=173, ds=-11 |
| lemmings st-fnl | JA | 6 | pk=134, ac=11 | pk=131, ds=-3 |
| Arctic snt-fnl | JA | 38 | pk=121, ac=4 | pk=114, ds=-7 |

## Equations Found

No equations appear in this chunk - it contains only raw experimental data tables.

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Speaker JA baseline | pk | ~140-200 | Hz | Typical peak F0 range |
| Speaker KS baseline | pk | ~120-160 | Hz | Typical peak F0 range |
| Speaker DO baseline | pk | ~100-140 | Hz | Typical peak F0 range (lower) |
| Declination deviation | ds | -50 to +50 | Hz | Deviation from expected |

## Rules/Algorithms

No explicit rules or algorithms in this chunk. The data would have been used to derive/validate rules in earlier chapters.

## Figures of Interest

None in this chunk - entirely tabular data.

## Quotes Worth Preserving

None - this section contains only data tables with minimal prose.

## Implementation Notes

### What This Data Represents

This appendix data represents the empirical foundation for O'Shaughnessy's F0 model. For TTS implementation, the key insights from examining the data structure:

1. **F0 is measured at multiple points per word**: peak (pk), accent (ac), and declination-relative (ds)

2. **Position matters greatly**: sentence-final, phrase-final, clause-initial positions have distinct F0 patterns

3. **Voicing affects F0**: voiced vs unvoiced consonant contexts show different F0 behaviors

4. **Multiple speakers normalize differently**: need speaker-adaptive baseline

5. **Continuation rises (CR) are tracked separately**: important for non-final positions

### Data Not Directly Implementable

The raw Hz values in these tables cannot be directly used in a TTS system because:
- They are speaker-specific
- They lack the transformation rules that convert syntax to F0
- The prosodic model/equations that use this data are in earlier chapters

### Recommendation

To implement F0 rules from this thesis, focus on earlier chapters (likely Chapters 3-5) where the mathematical model is developed. This appendix data validates that model but doesn't specify it.

### Useful Patterns Observed

From Table 120-121, key position-dependent patterns:
- Sentence-final positions show largest F0 drops
- Clause-initial positions show F0 resets/rises
- Phrase-medial accented syllables maintain higher F0
- Continuation rises (+CR values) appear at non-final boundaries

These patterns align with standard prosodic theory and confirm the model likely implements:
- Declination (gradual F0 drop across utterance)
- Boundary tones (rises/falls at phrase edges)
- Pitch accents (local F0 peaks on stressed syllables)
- Reset (F0 restoration at major boundaries)
