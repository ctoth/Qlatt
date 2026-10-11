# Issue #228 plan: Frame items and a `frame` phase

Scope: `docs/attribute-model.md` decisions 2 and 3, sequencing step 2. Byte-identity gate at every stage: `test/tone-association-compatibility.test.ts` (12 track hashes, all three frontends), `test/tts-frontend-declarative-golden-summary.test.ts`, `npm run test:golden`, `test/dectalk-e2e.test.ts`, `test/voice-quality-port.test.ts`, `test/hrg-lowering-*.test.ts`.

## 1. Frame item type and Frames relation

Runtime schema lives in `buildUtteranceSchema` (`src/tts-frontend.ts:187`), not in YAML, so both must change.

Runtime (`buildUtteranceSchema`): item type `frame` with features `time` (control-axis ms, includes initial silence), `output_time` (affect-scaled ms), `offset_ms`, `ratio` (offset/segment duration), `edge` (`initial`|`final`|null), `phoneme`, `word`, `segment` (Segment id), `active`, plus one `{kind:"number"}` feature per `inventory.base_params` key exactly as Segment gets them. Relation `Frames`: `kind: "list"`, `itemTypes: ["frame"]`, in time order. Each Frame also gets a point anchor at `(segment.sync_left, segment.sync_right, ratio)` through `transaction.anchorPoint`, so `temporal-axis.ts` orders it (decision 2); silence-edge frames anchor on the axis START/END marks with `offsetMs`.

YAML (`public/rules/frontends/{qlatt-english,qlatt-beauty,dectalk-english}/pipeline.yaml`, all three replace `relations:`): `Frames: { type: parallel, features: { time, output_time, offset_ms, ratio, edge, segment, <every column of output.lowering.columns> } }`. No `scalars` block: frame values are plain `set` writes, no floors or ms rounding. No `topology:` entry is needed; `validateTopology` (`validation.ts:326`) only checks listed names.

Segment-to-frame link: lowering stamps the Segment id in `segment` and records an association `segment` (`transaction.associate`). Add a view-proxy case in `buildEvaluationContext` (`rule-engine.ts:208-260`) so `current.segment` on a `frame` item resolves to the Segment view, the way `syllable` and `word` resolve through SylStructure. Rules then read `current.segment.F1`, `current.offset_ms`.

Creation: lowering-owned, in `src/declarative-frontend/hrg/lowering.ts`, as one transaction per utterance (`ruleId: "lowering:frame_clock"`, `tag: frame_clock`, `stage: "frontend"`, citations Hertz 1985 and Holmes, Mattingly & Shearme 1964). Reasons: `runGraphRuleEngine` rejects structural rules after `compute_times` (`E_FINALIZE_DIRTY`, `rule-engine.ts:2117`), and the event-point set (control boundaries, Holmes knots, transition edges, F0 anchors) is derived from tables lowering builds. The frame clock is decision 2's resampling kernel, not a linguistic rule.

## 2. Staged migration

Each stage lands as its own PR-sized commit; the first PR is stages 0 to 2.

**Stage 0. Measurement and baseline capture (0.5 day).** `scripts/measure-frame-phase-cost.ts` runs `test/phrase-sets/linguistic.json` through `textToKlattTrackDetailed` for all three frontends and reports wall time, `getCelEvalCount`/`getCelEvalTimeMs` (`cel-expressions.ts:29-49`), provenance decision count, journal length, heap. `scripts/capture-lowering-track-hashes.ts` writes `test/golden/lowering-track-hashes.json` (sha256 per phrase of every frame with `provenance` stripped) checked by `test/lowering-track-hashes.test.ts`. This is the byte-identity witness for every later stage.

**Stage 1. Frame items populated by lowering, no rules (2 to 3 days).** Files: `lowering.ts`, `tts-frontend.ts` (schema), three `pipeline.yaml`. `appendFrame` (`lowering.ts:2110`) becomes `createFrameItem`: it creates the `frame` item, anchors it, and writes every param as a feature write whose `parents` are the decision ids the current code puts in `provenance[key]`, with `tag` per sub-step (`frame_copy`, `transition`, `control_window`, `f0_sample`, `affect`) and the citations already in the code comments. A new `emitKlattFrames(utterance, options)` reads `Frames` back and builds `KlattFrame` rows. Key-order pitfall: `tone-association-compatibility` hashes `JSON.stringify` of params, so emission must write keys in the order `appendFrame` inserts them today (`options.columns` order, then `RdPhraseOffset` from `projectRd`). `provenanceByFrame[key]` becomes the frame write's decision id; `provenance-query.ts:65` and any lowering test asserting Segment decision ids move one parent up. Tests: all gates above plus `test/hrg-lowering-scalars.test.ts` for the parent edge.

**Stage 2. `frame` phase scaffold (1 day).** Add `- name: frame` after `finalize` in all three phase lists with `rules: []`. In `tts-frontend.ts`, after `speakerStamp.commit()` (line 880) and after lowering's timeline build, call `runGraphRuleEngine(utterance, spec, { phases: ["frame"], parameters: mergedPolicy(spec, { ...speakerPolicy, frame: {...} }) })`, then `emitKlattFrames`. `lowerToFrames` splits into `buildFrameTimeline` and `emitKlattFrames`. Validation (`validation.ts`, near the `phases[i]` checks at 3805): rules in a phase named `frame` must `select.relation: Frames`, and no rule outside it may target `Frames`. Add the same `CEL_FUNCTION_CATALOG` entries as later stages need, unbound until used.

**Stage 3. `frame_copy` rules (2 days).** `frame_copy_segment_params` selects `Frames` where `has(current.segment)`, one `set` effect per column with value `current.segment.<col>`, tag `frame_copy`, citations "Klatt 1980 (parameter frame update)" and "Taylor, Black & Caley 2001 (feature copy across relations)". The effect list is generated by `scripts/generate-frame-copy-rule.ts` from `output.lowering.columns`. Skipping absent Segment values needs per-effect `when:` (an `applyEffects` addition, `rule-engine.ts:943`). `frame_copy_silence_edge` reads `params.policy.frame.silence.<col>` passed at runtime from `context.silence.initialParams`.

**Stage 4. `transition` rules (3 days).** Lowering stamps its resolved tables onto the Segment as features `resolved_transitions` (`ResolvedSegmentTransition[]`) and `holmes_curves` (`{key: points[]}` with the `holmes_transition` decision as parent). Rules `frame_transition_static`, `frame_transition_linear`, `frame_holmes_curve` use builtins `transition_sample` and `holmes_sample` (section 3). Citations: "Holmes, Mattingly & Shearme 1964 pp.132-134", "Broad & Fertig 1970", "DECtalk 4.63 p_us_st1.c:442-455,837-849" (sonorant F2), the locus citations in `frontend.yaml transitions.loci`.

**Stage 5. `control_window` rules (2 days).** Lowering keeps resolving `target: prev|next` and window spans (cross-segment) and stamps `resolved_control_windows` on the target Segment. Rule `frame_control_window` uses `control_window_apply`; `unset` maps to `op: unset`. Citations from the window-producing rules (`nasal_windows`, `trajectory_control_windows`).

**Stage 6. `f0_sample` rules (3 days).** `frame_f0_point_sample` (qlatt frontends) with `f0_point_at(current.time, 'linear')`, forcing 0 when `current.phoneme == silence || (current.AV <= 0 && current.AVS <= 0)`; `frame_f0_layered_sample` (dectalk) with `f0_layered_at(current.time)`. Citations: "Pierrehumbert 1980", "O'Shaughnessy 1976" for point interpolation; "Fujisaki", "Klatt 1982", "DECtalk 4.63 Ph_drwt02.c" for layered.

**Stage 7. `affect` rules (3 days).** Lowering stamps resolved per-segment affect (`resolveAffect`, `lowering.ts:1443`) as `affect_values` on the Segment with the winning directive decisions as parents. One rule per `VQ_PARAM_CHANNELS` row (`add` or `max(floor, x*scale)`), floors moved to `params.policy.affect` with the existing "1 Hz formant, 20 Hz bandwidth engineering bound" citations; `project_rd` and `f0_variance_center` builtins. Citations: the voice-quality table's own (Gobl 2003, Burkhardt 2009).

**Stage 8. DECtalk controller clock (2 days).** Section 4.

**Stage 9. Deletion (1 day).** Remove the six `apply*` sub-step closures in `lowering.ts`; `npm run explain -- "hello world" --stage rules` shows `item:frame_N.F1` subjects; `--strict-citations` passes.

Total: about 19 working days.

## 3. Lookups versus builtins

CEL today: `frame_copy` (feature reads through `current.segment`), silence-edge copy (`params`), voicing tests, affect add/scale with `max()`, the F1/F2/F3 >= 1 Hz clamp.

Builtins (registered in `buildEvaluationContext`, listed in `CEL_FUNCTION_CATALOG` with `binding: "context"`, each with a doc-comment citation):

- `holmes_sample(segment, key: string, offset_ms: number): number` wraps `sampleHolmesCurve` (`holmes-transitions.ts:166`). Holmes, Mattingly & Shearme 1964.
- `transition_sample(segment, key, offset_ms, base: number): number|null` reproduces `applyItemTransitions` including the "superseded static field" rule and linear interpolation with the 1e-6 epsilons. Cites the blend and locus policy entries.
- `control_window_apply(segment, key, offset_ms, base): number|null` wraps `resolveControlField` (`lowering.ts:394`); null means unset.
- `f0_point_at(time_ms, sampling: 'linear'|'step'): {value_hz, decision_id}|null` wraps `resolveF0AtTime` (`lowering.ts:759`) over the `F0Point` relation; the rule's transaction `dependOn`s the decision id.
- `f0_layered_at(time_ms): number|null` renders once per utterance through `renderLayeredF0` (f0-filters WASM) and memoizes on the `GraphRuleEvaluationOwner` keyed by utterance and command digest.
- `f0_variance_center(segment): number` (mean of voiced contour samples per affect decision, `lowering.ts:1770-1826`).
- `project_rd(frame_view, rd_delta): map` wraps the existing `projectRd`.
- `controller_clock_time(command): number` (section 4).

## 4. DECtalk controller-clock projection

Today `lowering.ts:1622-1705` remaps persistent/impulse/glide command times onto the cumulative `dectalk_segmental` frame clock before `renderLayeredF0`. Move it to a dectalk-english scalar rule `dectalk_controller_clock_projection` in a dectalk-only phase `f0_clock` placed between `finalize` and `frame`, selecting `PhraseCommand` and `Tilt` items where `params.policy.f0_layers[current.layer] in ['persistent','impulse','glide']`, writing feature `output_time_ms` with `controller_clock_time(current)` (prefix sum of `duration_frames` over segmental commands ordered by resolved anchor time, excluding `tag == 'f0_segmental_terminal_silence'`, anchor at the first segmental command at or after the command time, rounded to `frame_period_sec`). Citations: "DECtalk 4.63 Ph_inton2.c make_f0_command()", "DECtalk 4.63 Ph_drwt02.c pht0draw()". Core lowering reads `output_time_ms ?? resolveAnchorTime(item) + initial-silence offset` with no layer-type test. The `tcumdur` exclusion in `renderLayeredF0` (`lowering.ts:586-603`) becomes a per-command feature `profile_clock_frames` written by the same rule. The layer type name `dectalk_segmental` becomes `segmental_controller` in `dectalk-english/frontend.yaml`, `LayerType`, and the ABI code table (code 4 unchanged; crate untouched). Goldens: `test/dectalk-e2e.test.ts` F0 cells and the dectalk tone-association hashes stay identical because the arithmetic moves unchanged; a unit test compares `controller_clock_time` with the old function on the "cake" and "the" command streams before deletion.

## 5. Risks

- **Performance.** Per frame: one transaction per (rule, frame), one provenance decision plus undo closure per write, and a `RuleAttempt` per non-match when `captureTooling` is on. A 200-frame phrase with the 70-column copy rule adds about 14k decisions and 2k transactions. Stage 0 numbers gate every stage and check the issue's browser-demo 2x bound. Mitigations in order: keep `frame_copy` lowering-owned if it alone exceeds budget (it has no linguistic content); add a `transaction_scope: rule` option so a rule commits once per phase.
- **Ordering.** `frame` runs after `compute_times`, so mark times and durations are frozen; frame rules must not write Segment fields (validation in stage 2). `resolve_scalars` is duration-only and unaffected. The speaker projection (`tts-frontend.ts:846`) must precede the frame phase, hence the separate engine call.
- **Cross-relation reads rules cannot express.** Control-window `prev|next` targeting, locus glue across several segments (`lowering.ts:1130-1260`), Holmes dominance between neighbors, affect scope through Word/SylStructure token index, global F0 variance centers, and the DECtalk prefix sum. Pattern: the kernel computes these once and stamps them on the Segment or command item with provenance; frame rules only sample.
- **Key order and floats.** Emission order and the `1e-6` epsilons are load-bearing for the hashes; the stage 0 hash file catches drift immediately.
- **Digest churn.** `graphDigest` checkpoints change because items are added; no test pins them, but `test/hrg-lowering-*.test.ts` fixtures that count provenance records need review.

## 6. Non-goals for the first PR

Transitions as items (sequencing step 5); folds per field (step 3); the generic accumulator (step 4); a structural `frame_clock` rule; declarative event-point derivation; any change to frame times, epsilons, or clamp values; renaming or reordering `output.lowering.columns`; native-engine consumption of Frame items; changing `KlattFrame`'s public shape beyond `segmentId` and `provenance`.
