# fric-thin-thieves Transition Locus Investigation

## Question

Why did changing the `TH` category-3 F3 transition duration not move the
`fric-thin-thieves` trace metrics, and which exact data row controls the
`TH -> RR` formant transition in the DECtalk English Paul render path?

## Facts

- Current branch: `master`.
- The prior tracked source slice was restored before this investigation began.
- The failed retry edited `public/rules/frontends/dectalk-english/frontend.yaml`
  under `transitions.loci_female.TH."3".F3`.
- The default DECtalk English voice resolves through the frontend speaker
  registry to Paul.
- `public/rules/frontends/dectalk-english/speakers/paul.yaml` declares
  `sex: male`.
- `textToKlattTrackDetailed()` passes `selectedVoice?.sex` to
  `lowerControlScoreToKlattTrack()`.
- `lowerControlScoreToKlattTrack()` selects `transitions.loci_female` only when
  `context.voiceSex === "female"`; otherwise it uses `transitions.loci`.

## Theories

1. The previous edit had no effect because it changed the female locus table,
   while Paul uses the male locus table.
2. The `RR` sonorant category lookup may not select category 3 for the forward
   `TH -> RR` edge.
3. The right locus row may be selected, but a later smoothing/event-time path
   may overwrite or hide the changed F3 window.

## Evidence Needed

- A render-time trace that names the selected locus table, sonorant phoneme,
  obstruent phoneme, edge, category, per-formant row values, adjusted percent
  and duration, computed boundary value, and applied steady time.
- A one-phrase run for `fric-thin-thieves` showing that trace in the same JSON
  payload used by the oracle comparison path.

## Current Best Theory

Theory 1 is accepted.

## Proof

Rendered `Thin thieves thought that they thrilled.` through
`scripts/render-phrase.ts` with `frontend-id=dectalk-english`,
`include-track=1`, and the new diagnostics payload path.

The render artifact contains an `I_LOCUS_TRANSITION_APPLIED` diagnostic for the
`thrilled` `TH -> RR` boundary:

- `segmentIndex`: 16
- `edge`: `forward`
- `sonorantPhoneme`: `RR`
- `obstruentPhoneme`: `TH`
- `voiceSex`: `male`
- `locusTable`: `loci`
- `vowelCategory`: 3
- `spanMs`: 55
- F3 row: `locusHz=2700`, `sourcePrcnt=11`,
  `sourceDurtranMs=55`, `boundaryHz=2572.4`

Therefore the active row for this target is the male
`transitions.loci.TH."3".F3` entry. The previous edit to
`transitions.loci_female.TH."3".F3` was an inactive-row substitution.

## Follow-up Finding

After the active row was proven, changing only
`transitions.loci.TH."3".F3.durtran_ms` still would not change the event timing
under the old lowering code because `resolveLocusBoundary()` collapsed
per-formant `durtran_ms` values into one `spanSec = max(F1,F2,F3)`.

For the `thrilled` `TH -> RR` boundary, F2 remained 55 ms, so F3 55 -> 45 ms
was masked by the shared 55 ms span. The lowering fix is to keep per-formant
transition times through event generation and smoothing application.
