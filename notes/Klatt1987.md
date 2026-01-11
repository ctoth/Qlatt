# Klatt 1987 — “Review of text-to-speech conversion for English”

Source: `papers/Klatt1987.pdf`

## Verified from PDF (limited pass)

### Hybrid synthesizer overview
From Fig. 7 (cropped in `papers/klatt1987-page-6.png` and
`papers/klatt1987-page-6-crop-a.png`):

- Depicts a hybrid synthesizer with a pulse generator and pulse-forming circuit,
  noise generator/filters, gated sources, and a split into cascade and parallel
  formant paths.
- Notes the use of an extra pole-zero pair for nasalization and parallel formants
  for obstruent synthesis.

## Notes / pending confirmation

- I did not find an explicit “replacement” parameter table that supersedes Klatt 1980
  default bandwidths/levels in this pass.
- If we need the explicit open quotient / spectral tilt controls (OQ, TL) from this
  paper, we should target the sections around the source model and parameter lists
  at higher resolution.
