# BUILD LOG — The Beautiful Synth (FULL build, overnight 2026-06-29 → morning)

GOAL (Q, hard): build the WHOLE designed synthesizer overnight — the REAL architecture,
nothing shortened, nothing deferred to a "phase 2." New BE + new FE built to the
design (`design/beauty-synthesis/` 01–12). Female flagship, neutral, genuinely beautiful.
A swarm of agents runs all night; the foreman keeps them fed and integrates. Q wakes to
a real, new, listenable synth — and ideally finds work still in flight.

NO SHORTCUTS. Not a klatt80/qlatt-english clone-with-tweaks. We REUSE only true
infrastructure (CEL/provenance toolchain, DSP primitive worklets, g2p/dict/LTS language
layer). Everything that is the synth's *soul* is built new to spec.

## Coordination rules (foreman)
- NEVER `git add -A` / `commit -a`. Another agent is live on `public/experiments/klsyn88/`
  + `crates/oversampled-glottal-source/` + its worklet. Stage ONLY my new paths. Verify
  `git status` before every commit. Stay on master (shared worktree).
- Gate = REAL audio every step: `render-phrase` → WAV (node) + `npm run measure` +
  `lint:audio`; browser-validate the source before "done". Verify with numbers, never assert.
- Reuse built worklets as-is (no wasm rebuild) UNLESS we add a genuinely new crate; if we do,
  build only that crate. Don't rebuild the other agent's artifacts.

## THE FULL SCOPE (all of it gets built)
### Backend — new graph to spec (docs 01/02/06/07/09)
- 48 kHz. LF/CALM source, Rd-steered, with the Fant covariation (Ee↔Rd) + dynamic B1 from Ra.
- ~11 formants: F1–F6 cascade + F7–F11 HF band ACTUALLY ENERGIZED (fix cascade attenuation /
  route HF), + dedicated singer's-formant resonator (~2.8–3.2 kHz), + shaped HF "air" shelf.
- ≥3 zeros incl. the ~5 kHz piriform notch (antiresonator/biquad-notch).
- Spectral tilt; flutter/jitter/DI; two-regime noise branch (sibilant + flat/rising
  non-sibilant) to 15 kHz with pitch-sync AM; PLSTEP bursts.
### Frontend — new content to spec, on a NEW IR
- The provenance-stamped Heterogeneous Relation Graph IR (doc 11/12) as the working
  representation; rule kinds operate on it; every write a cited DecisionRecord.
- Female inventory: nonuniform formant scaling (≠ pitched-up male), female F0/Rd/bandwidths,
  11-formant targets incl HF amplitudes A7–A11 (docs 02/06/09).
- Voice-quality engine: five-factor Rd + gesture-space (effort/adduction/aperiodicity);
  Brilliance/Air control (HF shelf + 2–5 kHz source slope). (doc 02/08 + voice-quality-synthesis)
- Prosody engine: ToBI placement → Fujisaki realization → O'Shaughnessy micro-prosody (doc 04).
- Affect layer: V/A/D + voice-quality core, the cited preset library (doc 03/08).
- Input contract: clean text "score" + separate declarative Direction Track (doc 10/12).
### Integration & beauty
- End-to-end renders; `measure` guardrails; browser-validate; iterate to beautiful; commit.
- A demo WAV set in the repo for Q to listen to in the morning + a morning report.

## Parallel tracks (swarm; keep them all fed)
- TRACK BE (isolated in public/experiments/qlatt-beauty/): new graph → energized HF →
  zeros/tilt/flutter → two-regime noise → render a rich steady female vowel.
- TRACK IR (src/declarative-frontend/): design + implement the provenance-stamped HRG.
- TRACK INV (frontend content): female inventory + 11-formant/HF targets.
- TRACK VQ (frontend content): voice-quality + affect engine.
- TRACK PROS (frontend content): Fujisaki prosody + micro-prosody.
- TRACK IN (frontend content): score + direction-track input contract.
- TRACK VERIFY: render/measure/lint/browser-validate harness for the beauty voice.

## Status / journal
- 2026-06-29 ~01:00: RESET to full scope after correctly being called out for shrinking it.
  Toolchain verified (renders a WAV in ~5s, no rebuild). Dispatching foundations:
  TRACK BE (new beauty backend graph) + TRACK IR (HRG engine) in parallel — disjoint trees.
