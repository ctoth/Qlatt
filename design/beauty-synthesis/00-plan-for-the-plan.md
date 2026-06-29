# Plan for the Plan: The Ultimate Klatt-Style Synth

Status: meta-plan, 2026-06-28. A clean-room *beautiful* synthesizer with its OWN
frontend and OWN backend — reusing nothing from the fidelity engines
(klatt80/klsyn88/dectalk). Those exist to BE their references; this one exists to
be *gorgeous*. No external oracle. Q's ear + the acoustic literature + measurement
guardrails are the judges.

## The thesis (what "beautiful" actually decomposes into)

A Klatt-style synth's beauty does NOT live in the formant filter — that just spells
the words. It lives in five places, and each has its own paper cluster:

1. **The source** — timbre, warmth, body, the raw richness/sexiness. (LF / CALM /
   voice-quality params.) *The single biggest lever.*
2. **Voice quality** — breathy / modal / tense / creaky; intimacy, fragility, power.
   This is where "honest / depressed / sexy" timbre lives.
3. **Emotion mapping** — the control surface that makes the same words sound happy,
   tender, grieving, commanding.
4. **Prosody + micro-imperfection** — melody, rhythm, and the jitter/shimmer/flutter
   that separate a living voice from a robot. ("Expressive / alive.")
5. **Crispness** — consonant clarity, bursts, transitions, timing. Q's #1 ear-priority;
   without it, beauty is mush.

## The phases (how we go from papers → a singing synth)

- **P0 — Read the science (DONE 2026-06-28).** Six researchers, one per axis, distilled
  the literature into: mechanism → knobs → BE requirement → FE requirement. Output:
  `01..06-*.md` in this dir.
- **P1 — The Beauty Spec (DONE 2026-06-28 → `07-beauty-spec.md`).** Synthesizes the six
  reports into ONE document: the complete
  parameter set the synth must expose, organized by axis, every knob cited. This is the
  contract the BE and FE must satisfy. Includes the explicit value-ordering and the
  "definition of done" for each axis (measurable where possible, auditionable otherwise).
- **P2 — Backend design (the DSP body).** Pick the source model (LF vs CALM — the
  research decides), formant topology (cascade+parallel, pole count, nasal branch),
  noise/aspiration mixing, flutter/jitter generator. Spec new registry primitives +
  graph.yaml + semantics. Inventory which Rust/WASM primitives already exist vs must be
  built. This synth gets its OWN backend graph.
- **P3 — Frontend design (the soul/control surface).** The linguistic→track pipeline:
  g2p + inventory + rule phases + prosody model + an emotion/affect control layer +
  voice-quality control. This is where "say it tenderly" becomes frames. Its OWN frontend.
- **P4 — The ear-in-the-loop gate.** No external oracle, and Q is blind, so define how
  we JUDGE beauty before we tune: measurement guardrails (`npm run measure` — Praat
  formants/F0/intensity), ASR round-trip for intelligibility, and Q's ear spent sparingly
  on prepared A/B renders. Real audio render is the gate, never a description.
- **P5 — First sound, then iterate.** Smallest path to a first audible utterance from the
  new BE+FE, then tune axis by axis in tracked iterations.

## Operating discipline (carried from project principles, not the old grind)

- **Declarative-first.** The synth is YAML (inventory, rules, semantics, graph); the only
  real code is cited DSP primitives. Every knob traces to a paper.
- **Cite every move.** A magic number with no source is labeled `# engineering estimate`.
- **Verify by ear + instrument, never by assertion.** Proof is a render + a measurement,
  not confidence.
- **Run the zoo.** Build/analyze/verify rotate across agents; coder ≠ verifier.

## Forks for Q — RESOLVED (2026-06-28)

1. **First target: NEUTRAL but stunning.** Nail crispness + timbre on a neutral voice
   first; emotion layers on after the bones are proven. (Crispness stays the #1 ear-axis,
   but timbre is tuned alongside, not deferred.)
2. **Flagship voice: FEMALE.** Hand-tune a beautiful female voice first. The architecture
   still supports a full male/age/emotion space; female is just the first one we perfect.
   The literature backs this as the harder, more distinctive target — see below.

## Resolved roadmap (2026-06-28)

The plan-for-the-plan is COMPLETE. Artifacts: `00` (this), `01`–`06` (science),
`07-beauty-spec.md` (the contract), `08-prior-art-integration.md` (prior art folded in),
`09-high-frequency-band.md` (the >5 kHz brilliance/air band — corrects the F6 ceiling;
~11 formants not 6, 48 kHz mandatory), `10-sota-control-surface.md` +
`11-sota-frontend-architecture.md` (SOTA research), `12-fe-architecture-recommendation.md`
(the unified FE design: score+direction-track input, provenance-stamped HRG IR, reuse the
CEL/provenance toolchain but swap the IR).

Decisions locked:
- First target: **neutral but stunning**; flagship: **female**.
- Source engine: **LF realized CALM-style, steered by Rd** (the keystone, independently
  validated by `projects/voice-quality-synthesis/`).
- Pillar A (source/voice-quality/emotion) is **~80% pre-designed** → port + reconcile.
- **Solitons SHELVED** — conventional Fujisaki-smoothed transitions for v1; solitons are a
  later, decoupled research paper.

Remaining phases (execution):
- **P2 — Backend design.** Source realization bake-off (CALM vs alias-free LF vs oversampled),
  6-resonator + parallel-branch + singer's-formant graph topology, inventory existing-vs-new
  primitives (port `crates/lf-source` math), write registry/graph/semantics for the new BE.
- **P3 — Frontend design.** Port the five-factor Rd model + gesture-space (effort/adduction/
  aperiodicity) + affect-preset library onto the new BE; reconcile preset numbers with `03`;
  prosody engine (ToBI→Fujisaki→O'Shaughnessy); cross-check affect citations vs collection.
- **P4 — Ear+instrument gate.** `npm run measure` guardrails + ASR round-trip + Q's ear on A/B.
- **P5 — First female "hello," then iterate per pillar.**

## Default decisions I'm making unless Q redirects

- **Architect a controllable voice-SPACE** (gender / age / emotion as knobs) from the
  start — the FE has an affect layer and the BE exposes voice-quality params — BUT
  hand-tune ONE flagship voice to gorgeous first, so we have something beautiful fast
  instead of a mediocre space.
- **Emotion is designed into the architecture from day one** (it shapes the FE), but the
  v1 *tuning* target is a stunning neutral + one emotional contrast to prove the surface.
