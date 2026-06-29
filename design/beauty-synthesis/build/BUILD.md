# BUILD LOG — The Beautiful Synth (overnight, 2026-06-29 → morning)

GOAL (Q, hard, Stop-hook enforced): build the WHOLE complete synthesizer, nothing
deferred, COMMITTED, so Q can listen to it tomorrow morning. New FE + new BE (clean-room
content on the reused CEL/provenance toolchain + crates, per `12`). Female flagship,
neutral, beautiful.

## Coordination rules (foreman)
- **NEVER `git add -A` / `git commit -a`.** Another agent has live uncommitted work on
  `klsyn88` + `crates/oversampled-glottal-source` + its worklet. Stage ONLY my new paths:
  `public/experiments/qlatt-beauty/`, `public/rules/frontends/qlatt-beauty/`, any NEW
  `crates/<mine>/`, `design/`, and new `scripts/` I add. Verify `git status` before every commit.
- Stay on **master** (don't switch HEAD — shared working tree with the other agent).
- Gate = REAL audio: `render-phrase` → WAV (node backend) + `npm run measure` + `lint:audio`.
  Browser-validate the source before calling it done (memory: node-voiced ≠ browser-voiced).
- Verify, never assert. Quote tool output. Coder ≠ verifier where it matters.

## Target architecture (from design/beauty-synthesis/ 07–12)
- **BE** `public/experiments/qlatt-beauty/`: 48 kHz; LF/CALM source (lf-source +
  oversampled-glottal-source, Rd-steered); ~11 cascade formants (F1–F6 + F7–F11 HF) +
  singer's-formant; ≥3 zeros (antiresonator/biquad-notch, incl ~5 kHz piriform); parallel
  branch + noise (frication+aspiration to 15 kHz, pitch-sync AM); tilt-filter; flutter/jitter.
- **FE** `public/rules/frontends/qlatt-beauty/`: female inventory (~11 formants incl HF);
  duration (Klatt-76); coarticulation/loci; prosody (ToBI-place → Fujisaki → micro);
  affect/voice-quality (five-factor Rd + presets, gesture-space) ; gender=female.
- Reuse the declarative engine + CEL + provenance; new content only.

## Phase plan (each phase = coder wave + verify, committed)
- [ ] P-scout: map exact build surface → `build/01-build-surface.md`  (RUNNING)
- [ ] P-BE1: new backend graph/registry/semantics renders a STEADY female vowel at 48 kHz (first sound)
- [ ] P-BE2: HF formants F7–F11 + zeros + tilt + flutter/jitter (rich source)
- [ ] P-BE3: parallel branch + frication/aspiration noise to 15 kHz (consonants)
- [ ] P-crate: any new crate(s) needed (noise / CALM glottal formant) built + wired
- [ ] P-FE1: new frontend inventory + minimal rules → "hello" track renders
- [ ] P-FE2: duration (Klatt-76) + coarticulation/loci (crispness)
- [ ] P-FE3: prosody (Fujisaki F0 + declination + accents + micro-prosody)
- [ ] P-FE4: affect/voice-quality (five-factor Rd, presets) + female gender transform
- [ ] P-int: end-to-end render of a sentence; measure; browser-validate; tune to beautiful
- [ ] P-commit: everything committed; a demo render WAV in repo; morning report

## Status / journal
- 2026-06-29: orientation done; scout dispatched. On master. Other-agent files OFF-LIMITS.
