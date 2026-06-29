# P1b — Prior-Art Integration: two withheld projects reshape the plan

Status: 2026-06-28. After drafting `07-beauty-spec.md`, Q revealed two existing
`projects/` efforts that are directly load-bearing. This doc folds them in. Neither
is "old graveyard" — both are forward design that the clean-room synth inherits as
KNOWLEDGE (tables, formulas, presets, theory), not as reused engine code.

## A. `projects/voice-quality-synthesis/` = a pre-built Pillar A + affect layer

Independently (Jan 2026) converged on **Rd as the master voice-quality dial** — the
exact keystone today's six-reader campaign reached. Strong cross-validation. It adds,
beyond `07`:

1. **Five-factor additive Rd model** (port wholesale into the new FE):
   `Rd_final = Rd_base + ΔRd_phoneme + ΔRd_stress + ΔRd_effort + ΔRd_emotion + ΔRd_phrase`,
   each factor independently capped, final clamp [0.3, 2.7]. Concrete tables exist:
   per-phoneme Rd (vowels +0→+0.15, voiced stops +0.5, HH +1.2), stress (−0.15 primary),
   effort coeff (−0.05 Rd/dB), Fant-1997 phrase contour (onset attack, +0.1/s declination,
   final breathiness). Source: `2-Parameter-Specifications.md`.
2. **JND budget — the discipline `07` lacked.** ΔRd ≈ 0.15 = 1 JND; 4.3 dB EPD = 1 JND
   (vanDinther 2001/2004). LF is perceptually ~1–2 dimensional; Ra (→ spectral tilt)
   carries ~96–98% of perceptual variance at modal/tense points. **Implication: do NOT
   over-parameterize the source.** Rd + effort + aperiodicity is enough; αm, Rk, Rg fine
   detail is mostly sub-JND. (This tempers `01`'s enthusiasm for independent αm control —
   keep αm as an ablation, not a front-line knob.)
3. **Gesture-space reduction to 3 orthogonal voice dimensions** (the clean control model):
   **effort** (subglottal pressure / SPL, dB), **adduction** (Rd, tense↔breathy),
   **aperiodicity** (0–1, jitter/DI/creak). A cited projection matrix maps these to all
   engine params; linear for conversational range, explicit nonlinear only for tension→OQ.
   Source: `gesture-space-investigation.md`. **This is the FE affect→source lowering.**
4. **A large, cited affect-preset library** — the FE's expressive surface, already designed:
   - Emotion: angry/loud/soft/sad/happy/anxious/fatigued (Cummings, Gobl, France, Laukka, Vogel)
   - Epistemic: confident/doubtful/competent/hedging (Goupil 2021)
   - Pragmatic/speech-act: indirect_request/direct_request/polite_question/sarcastic/rude/
     dismissive/curt/insincere (Trott 2022, Caballero 2018, Fish 2017)
   - Dramatic speech-acts: naming/criticism/doubt/suggestion/warning/wish (Hellbernd 2016)
   - **Clinical mood: manic/depressive, SEX-SPECIFIC and INVERTED** (Kaczmarek-Majer 2024).
   Q's literal words map to existing presets: "depressed" → `sad`/`depressive`,
   "honest/its opposite" → `insincere`, "powerful" → `warning`/`competent`/`loud`.
5. **France 2000 finding to carry forward:** F0 is a *weak* emotion discriminator; formant
   frequency/bandwidth shifts + spectral tilt carry more affect. So emotion presets must
   modulate formants + bandwidths + tilt, not just pitch + Rd. (Reinforces `03`/`06`.)
6. `crates/lf-source/src/lib.rs` already implements Rd→LF (Perrotin 2021 LFLM). Proven math
   to PORT into the new BE's source worklet (not reuse the old graph).

**Net effect on the plan:** Pillar A + the affect layer shift from "design from papers"
to "**port + reconcile** an existing, validated, deeply-cited spec into the clean-room
FE/BE, harvesting its JND discipline and preset tables." Big head start. The new work is
re-homing it onto the new 6-resonator BE + LF/CALM source, and reconciling its preset
numbers against `03`'s tables (a calibration task, not a redesign).

### Caveats when porting
- It targeted the OLD pipeline (`tts-frontend-rules.js`, existing semantics). We take its
  CONTENT, not its wiring. Clean-room intact.
- Some cited papers may not be in `papers/` (gesture doc §9 flags: Fant 1995 corrupt,
  Henrich 2003 missing, Laukka 2011 secondary; also verify vanDinther, Lienard, Feugere,
  Banse, Hellbernd, Goupil, Trott, Caballero, Fish, Kaczmarek-Majer, Vogel, Cummings).
  **Task: cross-check the affect-library citations against the collection; retrieve gaps.**

## B. `projects/soliton-gestures/` = candidate SIGNATURE differentiator

A research-grade theory: coarticulation as **soliton scattering** in a nonlinear coupled
field (primary model: Complex Ginzburg-Landau; limits: φ⁴ kinks, sine-Gordon, NLS) rather
than task-dynamics activation-blending. Blending = inelastic collision = gesture identity
destroyed during overlap = **the canonical robotic-transition sound**. Solitons pass
through each other and re-emerge intact (with phase shifts) — identity-preserving organic
transitions no formant synth has done.

**Why it matters to THIS synth:** it attacks robotic-ness at the formant-trajectory layer
(Pillar C's transition model), the level `04`'s Fujisaki fix doesn't reach (that fixes F0).
Together they'd make both the melody AND the articulation organic.

**Why it's separable / gated:** it's high-risk research with explicit go/no-go gates
(outline §6.1, §7.1, Phase 0):
- Sign of Kirkham's cubic term `d`; does cubic appear in NON-contact gestures (else it's
  just palatal-contact saturation → framework dies)?
- Finite Duffing-lattice (N=5–15) collision sim: is the phase shift above ~2 ms EMA floor?
- Coupling locality: distance-dependent decay (lattice holds) vs instantaneous (dies).

The synth can reach a gorgeous first voice WITHOUT it (conventional targets + Fujisaki +
micro-prosody). Solitons promote into the transition engine only if Phase 0 passes.

## Revised pillar picture
- **Pillar A — SOURCE / voice-quality / emotion:** ~80% pre-designed (project A). Port +
  reconcile + re-home onto new BE.
- **Pillar B — PROSODY & ALIVENESS:** design per `04` (ToBI→Fujisaki→O'Shaughnessy + micro).
- **Pillar C — TRACT & CONSONANTS:** design per `05`/`06` (6 resonators, ring, parallel branch).
  - **Pillar C+ (optional signature) — SOLITON COARTICULATION:** parallel gated R&D track;
    promotes to C's transition engine iff Phase-0 gates pass.

## Decision (2026-06-28): SOLITONS SHELVED
Q chose to shelve soliton-coarticulation for now. The beautiful synth is built with
conventional formant targets + Fujisaki-smoothed transitions + micro-prosody. Solitons
remain a separate research paper to pursue later, fully decoupled from the synth — NOT a
pillar, NOT on the critical path. `soliton-gestures/` is untouched; revisit on its own.
Pillar C+ is removed from the synth roadmap.
