# Imperative TS Smell Scout — Qlatt declarative-first audit

**Date:** 2026-05-24
**Scout for:** investigation `notes/imperative-and-ugly-rules-investigation.md`
**Principle audited:** AGENTS.md "declarative-first" — only DSP primitives in `crates/` should be real code; orchestration / policy / tables belong in YAML.

## TOP 5 worst offenders (refactor priority order)

1. **`src/track-assembler.ts:892-1172` — `renderLayeredF0()` (~280 lines of imperative DSP-in-TS).** IIR filter, impulse decay, DECtalk speaker-scaling formula, magic constants (`/4096`, `/4`, `0.9`, `0.01`, `1300`). This is real DSP that AGENTS.md says belongs in `crates/`. Single biggest cleanup win by line count.
2. **`src/track-assembler.ts:1242-1359` — Pierrehumbert ToBI tag/accent inventory split between TS and YAML.** Tag→accentType mapping (8 branches at line 1242), `isHighPeakAccent()` predicate (line 1351), `BOUNDARY_TAGS` set (line 1324), and the entire `applySaggingTransitions()` function (line 1361). All phonological policy, all hardcoded, all should live in `tune-grammar.yaml` (or a new `accent-inventory.yaml`) and be applied by a `kind: point` rule.
3. **`src/builtin-functions.ts:10-59` — `ndbScale` + `ndbCor` + `klsynAmpTable`.** Klatt 1980 PARCOE.FOR amplitude tables hardcoded in TS, also present in `public/experiments/klatt80-baseline/semantics.yaml` — duplicate source of truth. Drift risk is real (different synth configs already need different ndbScale offsets).
4. **`src/tts-frontend.ts:506-528` — rate-scaling policy formulas inline.** Three "engineering estimate" formulas (`(rate - 1.0) * 0.3` undershoot, `1.0/sqrt(rate)` F0 range, transitionMs/rate scaling) cited in comments to Lindblom 1963 and Ladd 2008 but with magic coefficients in TS. Belongs in `policy.rate.*` YAML.
5. **`src/declarative-frontend/dectalk-helpers.ts:27-51` — phoneme feature sets in TS.** `OBSTRUENT_TYPES` and `BACK_ROUNDED_REF_PHONEMES`. AGENTS.md explicitly forbids: "Hardcoded tables/maps (phoneme → feature, accent → contour, etc.) that should be data files." Both are uncited. Belongs as `back_rounded: true` flags in `inventory.yaml` (the inventory has 1194 lines of phoneme data already; these features should join it).

## All findings, ranked

### HIGH

**H1. `src/track-assembler.ts:892-1172` — `renderLayeredF0()` is DSP-in-TS.**
- 280 lines of imperative signal processing (IIR Butterworth filter, impulse decay loop, profile interpolation, speaker scaling).
- Hardcoded decay modes `halving | linear | exponential` at lines 1149-1156 with magic `0.9` exponential factor and `imp.value / 4` initial decay rate.
- DECtalk speaker formula `(f0minimum + (filtered - 1300) * f0scalefac / 4096) / 10` at lines 1115-1122 — magic `1300` offset and `4096` shift cited only in comment (DECtalk Ph_drwt02.c).
- Companion `computeButterworth2Coefficients` (line 732) and `iirFilter2Pole` (line 754) are concrete DSP.
- AGENTS.md: "Only DSP primitives in `crates/` should be real imperative code." This is the prime offender against that rule.
- Wants: extract IIR filter + impulse decay to a `crates/layered-f0-renderer/` WASM, leave only orchestration in TS.

**H2. `src/track-assembler.ts:1242-1249` — tag→accentType if/else chain.**
```ts
if (tag === "f0_h_star") accentType = "H*";
else if (tag === "f0_h_star_plus_l_peak") accentType = "H*+L";
... (8 branches)
```
Pierrehumbert 1980 ToBI inventory encoded as TS conditionals. Wants: data-driven lookup, table living in `tune-grammar.yaml` or new `accent-inventory.yaml`.

**H3. `src/track-assembler.ts:1351-1359` — `isHighPeakAccent()` hardcoded predicate.**
```ts
return accentType === "H*" || "L+H*" || "H+!H*" || "H*+L" || "H*+H";
```
Same data as H2 viewed as a different question. Wants: `is_high_peak: true` flag per accent in YAML.

**H4. `src/track-assembler.ts:1323-1328` — `BOUNDARY_TAGS` set.**
`f0_boundary_low`, `f0_boundary_rise`, `f0_register_reset`. Phonological set determining sag eligibility. Wants: tag metadata in YAML.

**H5. `src/track-assembler.ts:1361-1427` — `applySaggingTransitions()` whole function.**
Imperative implementation of Pierrehumbert sag interpolation. Formula `f0_linear(t) - sagDepthHz * 4 * t * (1-t)` at line 1410 is paper-cited but inline. Three sample points `[0.25, 0.5, 0.75]` at line 1406 are an engineering choice with no citation. Wants: declarative `kind: point` rule that selects consecutive H* peaks and inserts sag points, with parabola depth/samples from policy YAML.

**H6. `src/track-assembler.ts:683-685` — F0 hard clamp.**
`LAYERED_F0_MIN_HZ = 50; LAYERED_F0_MAX_HZ = 500`. No citation. Belongs in speaker-profile (per-speaker range) or f0_model config.

**H7. `src/builtin-functions.ts:10-59` — Klatt amplitude tables hardcoded.**
- `ndbCor` (proximity correction) at line 10.
- `ndbScale` Klatt 1980 PARCOE.FOR NDBSCA values at lines 16-37 — also in `public/experiments/klatt80-baseline/semantics.yaml`. Two sources, drift risk.
- `klsynAmpTable` at lines 40-59 (klsyn88 parwvt.h).
- Each entry cited in inline comment but the table itself isn't a YAML asset. Wants: load from semantics.yaml constants and expose via builtin functions.

**H8. `src/transcribe-text.ts:44-98` — diagnostic-symbol and letter-name pronunciation tables.**
`DIAGNOSTIC_SYMBOL_PHONEMES` (24 entries) and `LETTER_NAME_PHONEMES` (26 entries) are TS fallback defaults; YAML overrides them when present (line 265 comment "falling back to hardcoded defaults"). Per AGENTS.md "Never introduce a magic number without a citation" — no citations on the table itself. Wants: delete TS fallback; require YAML.

### MEDIUM

**M1. `src/declarative-frontend/dectalk-helpers.ts:27-51` — `OBSTRUENT_TYPES`, `BACK_ROUNDED_REF_PHONEMES` sets.** Phoneme feature data in TS, uncited. Belongs in `inventory.yaml` as flags. Used to decide DECtalk obstruent context class at line 230-251.

**M2. `src/tts-frontend.ts:506, 512, 517` — rate-scaling formulas.**
```ts
formant: { rate_undershoot_factor: Math.max(0, (rate - 1.0) * 0.3) }  // 0.3 = engineering estimate
const f0RangeFactor = 1.0 / Math.sqrt(rate);                          // Ladd 2008 — formula in TS
```
Three policy decisions. Magic `0.3` undershoot factor uncited (Lindblom 1963 is the *motivation* but the coefficient is fiat). Wants: `policy.rate.{undershoot_coefficient, f0_range_exponent}` in YAML.

**M3. `src/tts-frontend.ts:121` — `STRUCTURAL_STOP_BASES = new Set(["P","T","K","B","D","G"])`.**
Stop phoneme set in TS — referenced by inventory check at line 338. Belongs in inventory.yaml as `phoneme_class: stop` flag.

**M4. `src/tts-frontend.ts:208-210` — `SPEAKER_FORMANT_KEYS = ["F1"…"F10"]`.** Hardcoded formant count. Same issue at `src/control-score.ts:16` loop. Should come from formant-bank registry.

**M5. `src/control-score.ts:14-25` — `index <= 10` hardcoded formant loop.** Pair with M4.

**M6. `src/nasal-subsystem.ts:137` — `params.nasalPoleBaseHz ?? 250`.** Magic default 250 Hz, no citation, possibly wrong (Klatt 1980 Table I gives ~270 Hz for nasal pole).

**M7. `src/nasal-subsystem.ts:7-19` — citation string constants + `NASAL_PLACE_INDEX` map.** Citations as opaque strings (cannot machine-check against paper library). Place index `m: 1, n: 2, ng: 3` is phonological feature data in TS.

**M8. `src/track-analysis.ts:39-49` — `KLATT80_EXPECTED` table.** Klatt 1980 Table III stop release expected values, diagnostics-only. Could stay as TS data but lacks a citation comment on the table itself (only a header).

**M9. `src/track-assembler.ts:1631-1637` — magic transition minimum `0.02`.** `Math.max(segmentStart + 0.02, targetTime - phTransitionSec)` — 20ms hard floor on steady-state time, no citation, no YAML.

**M10. `src/track-assembler.ts:1665` — voiced F0 underflow fallback `baseF0 / 2`.** Half-octave drop on F0=0, silent policy, no citation.

**M11. `src/track-assembler.ts:319` — `fallbackDuration = 100`.** Magic default 100ms phoneme duration when neither token nor inventory provides one. No citation.

**M12. `src/track-assembler.ts:1507` — `baseF0 = options.baseF0 ?? 110`.** Default 110 Hz adult male F0 — should always come from speaker-profile, not inline default.

### LOW

**L1. `src/prosodic-annotator.ts` overall.** Phrase-walking machinery is acceptable orchestration. Steps 4-7 inline per-phrase loop (line 120-147) could conceivably be a phase but isn't blocking. All policy already delegated to YAML loaders.

**L2. `src/source-contour.ts:7-13, 113-120` — VoiceQuality enum + per-preset parser.** Six hardcoded enum values; new quality requires TS edit. Low payoff to fix.

**L3. `src/tune-grammar.ts:48-53` — `REQUIRED_PHRASE_TYPES` enumerated.** Same shape as L2.

**L4. `src/declarative-frontend/engine.ts:1113-1156` — `count_word_vowels()` and `cluster_position_in_word()` CEL builtins.** Imperative loops in TS, but they are CEL builtins exposed to rules (the correct direction per AGENTS.md). Already cited (Klatt 1976 Rule 4, Klatt 1973). Acceptable — the alternative would be CEL expressions over a streamed token list, possible but not high payoff.

## What's confirmed clean (do NOT flag)

- `src/klatt-runtime.ts` — registry-driven worklet/WASM loader plumbing.
- `src/klatt-interpreter.ts` — defers all policy to semantics.yaml (PLSTEP constants explicitly load from constants at lines 363-364, comment "declared in semantics.yaml so runtime, graph, and telemetry share the same Klatt 1980 PARCOE.FOR values").
- `src/semantics/*.ts` — pure CEL/topological evaluator infrastructure.
- `src/accent-policy.ts`, `src/break-policy.ts`, `src/tune-grammar.ts`, `src/source-contour.ts`, `src/speaker-profile.ts` — all are pure YAML parsers with schema validation. Textbook declarative-first.
- `src/formant-bank.ts` — generates graph + semantics from `formantBanks` YAML declaration. The right pattern.
- `src/klatt-synth.ts` (1249 lines) — verified only imported by `test/render-offline.html:10`. Legacy harness, not in production path. Acceptable per AGENTS.md.

## Themes / proposed YAML constructs

These are findings that ought to land as new YAML constructs (paired with the rule-ugliness scout's report):

- **Accent inventory** (`accent-inventory.yaml`): tag→accentType, accent→{is_high_peak, is_boundary}. Solves H2, H3, H4.
- **Sag policy** in tune-grammar or new `sag-policy.yaml`: depth, sample points, min-span. Solves H5 (combined with declarative rule).
- **Phoneme feature flags in inventory.yaml**: `is_obstruent`, `is_back_rounded`, `is_stop_base`. Solves M1, M3.
- **Rate scaling policy**: `policy.rate.{undershoot_coefficient, f0_range_exponent, transition_scale_mode}`. Solves M2.
- **F0 range clamp** in speaker-profile.yaml. Solves H6, M12.
- **Formant count** from formant-bank registry instead of hardcoded `<= 10`. Solves M4, M5.

## Cross-reference with sibling scout

The rule-ugliness scout (output: `notes/rule-ugliness-scout.md`) is investigating YAML rule patterns in parallel. Worth pairing findings — many imperative-TS findings here correspond to *missing* YAML constructs the rule scout will identify.

## Report location

`C:/Users/Q/code/Qlatt/notes/imperative-smell-scout.md`
