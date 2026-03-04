# Voice Presets Design Notes

## Goal
Design a generic voice preset system that is:
- Discoverable (enumerate available voices programmatically)
- Programmatically generable (create voice presets from code, not just hand-write YAML)
- Integrated with the test harness and render pipeline
- Citeable and provenance-traced
- Supports Hanson 1995 female glottal covariation (TL/B1/AH coupled)
- Supports time-varying voice parameters via new contour rule primitive

## Critical Design Decisions

### 1. Voice quality presets must become DELTAS
Currently `applyVoiceQualityOverrides()` sets absolute values:
- `params.Rd = vq.rd` (absolute 2.0 for breathy)
- `params.TL += vq.tl` (additive, but from 0 baseline)

This is male-calibrated. A female G3 voice (Hanson 1995) has baseline TL=10.
"Breathy" for her should be TL=10+10=20, not TL=0 (which is actually more pressed for her).

Fix: voice quality presets become deltas applied ON TOP of the voice's baseline.

### 2. Contour primitive needed
Existing rule kinds can't express phrase-level envelopes.
`applyFantConnectedSpeechContour()` is 70 lines of hardcoded TypeScript.
It should be declarative YAML contour rules with per-voice coefficients.

### 3. Structured tags for discovery
Voice presets need tags (gender, age, source) not just description strings.

## See conversation for full design discussion
