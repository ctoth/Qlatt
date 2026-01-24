# Issue 7: A2COR/A3COR Documentation Analysis

## Current Comment Evaluation

**Location**: `src/klatt-synth.js` lines 461-462

**Current text**:
```javascript
// Note: Klatt 80 A2COR/A3COR corrections removed - we use A1-A6 dB values directly
// like klatt-syn, to avoid muting issues when F1 is low (e.g., stop releases).
```

### Accuracy Assessment

The comment is **accurate but incomplete**. It correctly states:
1. That A2COR/A3COR are Klatt 80 corrections
2. That they were intentionally removed
3. That the alternative is direct dB values (like klatt-syn)
4. That the problem was "muting issues when F1 is low"
5. That stop releases are an example case

### What's Missing from Issue 6 Findings

The Issue 6 report contains significant technical depth that is not captured:

| Finding | In Current Comment? |
|---------|---------------------|
| Corrections are frequency-dependent amplitude scaling | No |
| A2COR formula: (F1/500)² / (F2/1500) | No |
| A3COR formula: (F1/500)² × (F2/1500)² | No |
| Quadratic F1 scaling causes dramatic attenuation | Partially (mentions "muting") |
| At F1=100 Hz, corrections cause -28 dB attenuation | No |
| Cascade branch handles vowel shaping naturally | No |
| Parallel branch is for noise/transients where low F1 is common | No |
| Report location for detailed analysis | No |

## Recommendation: Improve Comment

The current comment is adequate for someone who already understands Klatt synthesis. However, for maintainability and future developers, a slightly expanded comment that references the detailed analysis would be better.

### Recommended Comment

```javascript
// Klatt 80 A2COR/A3COR corrections INTENTIONALLY REMOVED.
//
// A2COR = (F1/500)² / (F2/1500) applied to F2 parallel amplitude
// A3COR = (F1/500)² × (F2/1500)² applied to F3-F6 parallel amplitudes
//
// Problem: The quadratic F1 term causes severe attenuation at low F1:
// - At F1=250 Hz: -12 dB on all parallel formants
// - At F1=100 Hz: -28 dB (effectively muted)
//
// This mutes stop releases (p/t/k/b/d/g) and schwa-like sounds.
// Since Qlatt uses cascade for vowels (where A2COR/A3COR are irrelevant)
// and parallel for noise/transients (where low F1 is common), the
// corrections harm more than help.
//
// We follow klatt-syn's approach: use A1-A6 dB values directly.
// See reports/16bit-issue6-a2cor.md for detailed analysis.
```

### Alternative: Minimal Update

If verbosity is a concern, a minimal update that just adds the report reference:

```javascript
// Note: Klatt 80 A2COR/A3COR corrections removed - we use A1-A6 dB values directly
// like klatt-syn, to avoid muting issues when F1 is low (e.g., stop releases).
// See reports/16bit-issue6-a2cor.md for detailed analysis and rationale.
```

## Verdict

**Minimal update recommended.** The current comment captures the essential rationale. Adding a single line pointing to the detailed analysis provides:
1. A breadcrumb for future developers who want to understand why
2. Documentation that extensive analysis was done
3. No risk of comment becoming stale (analysis is in separate document)

The full expanded comment is overkill for inline code documentation when a detailed report already exists.

## Summary

| Aspect | Current | Verdict |
|--------|---------|---------|
| Accuracy | Correct | OK |
| Completeness | Covers key points | OK |
| Reference to analysis | Missing | Add one line |
| Tone | Clear | OK |

**Action needed**: Add one line referencing the Issue 6 report.
