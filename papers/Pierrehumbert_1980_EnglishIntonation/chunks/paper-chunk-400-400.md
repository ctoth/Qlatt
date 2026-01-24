# Pages 400-400 Notes

Note: File temp-page-400.png contains page 401 of the thesis.

## Chapters/Sections Covered

This page appears to be part of Chapter 5 (based on page numbering and content style), showing F0 contour examples demonstrating the phonetic realization of different tonal sequences.

## Key Concepts

### Comparison of Boundary Tone Effects on F0 Contours

The page presents two paired F0 contour examples showing how different boundary tones (L% vs H%) affect the final portion of an utterance while maintaining the same pitch accent (H*+L-) and phrase accent (H-).

## Tonal Inventory

Pitch accents and boundary tones shown:
- **H*+L-**: Falling pitch accent (H* with trailing L tone)
- **H-**: High phrase accent (intermediate phrase boundary)
- **L%**: Low boundary tone (full intonational phrase boundary)
- **H%**: High boundary tone (full intonational phrase boundary)

## Phonological Rules

No explicit rules on this page - it is a figure page showing empirical F0 data.

## Phonetic Implementation

### F0 Contour Observations

**Top pair (H*+L- H- L%):**
- Sharp rise to H* peak at the stressed syllable
- Fall after H* to low target
- Phrase accent H- creates a slight plateau/rise before final boundary
- L% brings F0 to low value at utterance end
- The schematized contour shows: rise → peak → fall → low plateau → low ending

**Bottom pair (H*+ L- H- H%):**
- Similar initial pattern: rise to H* peak
- Fall after H*
- H- phrase accent
- H% causes final rise at utterance boundary
- The schematized contour shows: rise → peak → fall → low plateau → final rise

### Key Implementation Insight

The contrast between L% and H% boundary tones is visually clear:
- **L%**: F0 continues flat/low at the end
- **H%**: F0 shows a rising contour at the end (yes-no question intonation)

## Equations Found

None on this page.

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| (No specific numerical parameters given on this page) |||||

## Figures of Interest

- **Figure on page 401 (top)**: F0 contour showing H*+L- H- L% sequence
  - Natural F0 trace (dotted/scattered) with schematized target representation below
  - Shows typical declarative/statement falling intonation pattern

- **Figure on page 401 (bottom)**: F0 contour showing H*+ L- H- H% sequence
  - Natural F0 trace with schematized representation
  - Shows continuation rise / yes-no question intonation pattern
  - Clear demonstration of final rise from H% boundary tone

## Quotes Worth Preserving

(No text on this page - figure only)

## Implementation Notes

**For TTS F0 Generation:**

1. **Boundary tone implementation**:
   - L% → interpolate F0 down to speaker's baseline at phrase end
   - H% → interpolate F0 upward at phrase end (final rise)

2. **Timing**: The boundary tone effect appears to begin after the phrase accent (H-) and extends through the final syllable(s)

3. **The schematized representations** below each natural F0 trace provide a clear target model:
   - Key points: accent peak, post-accent valley, phrase accent level, boundary target
   - Linear interpolation between these targets approximates the natural contour

4. **Phrase accent (H-) creates an intermediate target** between the pitch accent and boundary tone - this is where the "plateau" or "ledge" in the contour comes from before the final boundary movement
