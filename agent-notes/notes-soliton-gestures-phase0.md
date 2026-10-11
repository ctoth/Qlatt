# Notes: soliton-gestures Phase 0 (Duffing lattice simulation)

Session date: 2026-08-08. Task: user asked for honest slop-assessment of
`projects/soliton-gestures/outline.md` (verdict: speculative but honest, not slop;
weakest points = CGL near-unfalsifiability, cheap Phase 0 untested), then said
"Do it?" → running Phase 0 from the outline's execution strategy.

## Source parameters (verified from paper library)

- Kirkham 2025 (papers/Kirkham_2025_DynamicalLawsSpeechGestures/notes.md):
  k = 592 s^-2, b = 0.264 s^-1 → **dramatically under-damped** (b/b_crit ≈ 0.005,
  b_crit = 2√k ≈ 48.66). Model: ẍ + a(t)[bẋ + k(x−T) − d(x−T)³] = 0 (Eq 27),
  Kroger ramped activation (Eq 5). ~1/3 of 13,742 XRMB gestures need cubic term.
- Sorensen & Gafos 2016: cubic is a **soft spring** (opposes linear restoring far
  from target), d up to 0.95k with x normalized to unit target distance.
  → sign of d: soft/focusing (outline §4.2's bright-soliton case).
- Carrier question (outline §7.2) part-answered: underdamped ⇒ ringing exists,
  ω₀ = √592 ≈ 24.3 rad/s ≈ 3.9 Hz.

## Code written

- `projects/soliton-gestures/phase0/duffing-lattice.ts` — N-site lattice,
  RK4 (dt=0.05ms), free-end BCs, divergence guard |x|>5. Two variants:
  - "gated": Kirkham Eq 27 literal — activation gates ALL local force ⇒ passive
    sites are free masses (no k, no b).
  - "neutral": local force always on, target blended T_eff = a(t)·T_gesture
    (Saltzman-Munhall neutral attractor). Added after first run showed artifacts.
- `projects/soliton-gestures/phase0/run-phase0.ts` — E1 regime check
  (under vs critical damping), E2 influence-decay profile over ξ (μ=C/k sweep
  0.01–0.4), E3 collision (A site5 T=+1 act 0–150ms; B site6 T=−1 onset
  0/40/80/120ms; d ∈ {0, 0.7k, 0.95k}; μ ∈ {0.05,0.1,0.2}), E3b nonlinear excess
  (cubic minus linear response). Writes report.md + results.json in phase0/.

## First run results (gated variant only — treat with caution)

- E2: influence decay monotonic in ξ at all μ (no oscillatory-in-ξ profile);
  BUT passive-neighbor displacement huge (0.9–1.23 at μ=0.05–0.1) because free
  masses have nothing to resist coupling → **artifact of gated variant**.
- E3 non-diverged rows: shape r ≥ 0.989 everywhere (identity strongly preserved);
  peak-vel shifts −0.3…−5.1 ms (≥2ms EMA floor only at μ≥0.1 & heavy overlap);
  end-displacement up to −0.35.
- d=0.95k rows: A *undershoots* target by 0.15–0.4 (soft spring weakening) —
  deep nonlinearity shows up as displaced targets more than time shifts.
- E3b nonlinear excess is SMALL: pv-shift delta ≤1.45ms, mostly ≪1ms. The
  collision response is mostly linear superposition — bad news for a strong
  soliton reading at these parameters.
- Divergences at LOW overlap (20–47%) for d≥0.7k, μ≥0.1: after A deactivates,
  undamped free lattice rings past soft-spring escape radius √(k/d)≈1.03–1.2
  when B activates late → basin escape. Artifact of gating; also diverged-row
  metrics were garbage (sim truncated to zeros) — now fixed (NaN + divergedAt).
- One landmark pathology: nearest-approach "attain shift" can jump lobes
  (64.65ms at μ=0.2 d=0) — lobe ambiguity, not a real phase shift.

## Second run: virtual-target fix

Neutral variant diverged (~200 ms) for d≥0.7k because empirical-target driving
+ underdamping swings to ~2T, exiting the soft-spring basin at deactivation.
Fix from Kirkham's own Eq. 24: drive the equation with the VIRTUAL target
T_v = T/2 (amplitude 0.5, inside basin). Also added firstVelPeakTime landmark
(lobe-robust; the 88/64 ms "shifts" were lobe jumps).

## FINAL RESULTS (clean run, written to phase0/findings.md)

1. **Collision response ≈ 99% linear superposition.** Total landmark shifts
   measurable (pv up to −4.2 ms, attain up to −9.1 ms at μ=0.2 full overlap;
   > 2 ms EMA floor), shape r ≥ 0.99 everywhere. BUT nonlinear excess (cubic
   minus linear lattice) ≤ 0.35 ms pv / ≤ 1.05 ms attain / ≤ 0.01 end-disp —
   the soliton-diagnostic component is BELOW the measurement floor. The
   observable is non-diagnostic: linear coupling predicts the same data.
2. Carrier: 150 ms gesture ≈ half an ω₀ cycle → no scale separation → NLS
   inapplicable; φ⁴/CGL only.
3. Virtual target is load-bearing: only stable configuration for underdamped
   + soft spring + neutral attractor. Critical damping + T_v stalls at 0.43T
   (S&M damping incompatible with virtual targets). d=0.95k basin metastable
   (late escapes ~400-570 ms).
4. Influence decay along ξ monotonic at ALL μ, both variants → evanescent/
   diffusive corner (dispersion ω² = k + 4C sin²(q/2), sub-band forcing).
5. DAC-as-basin-depth survives qualitatively (miss dist grows with μ, deeper
   d = shallower basin) but needs no solitons.

Verdict: framework not killed as physics, but empirically idle at
speech-realistic amplitudes — distinctive predictions live in ≲1 ms residuals,
an order of magnitude below the outline's own measurement floor. Sharper than
outline failure mode (f): shifts measurable but NOT diagnostic.

## State

phase0/ contains duffing-lattice.ts, run-phase0.ts, report.md, results.json,
findings.md. All final. Not committed (user hasn't asked). Chat summary next.
Blocker: none.
