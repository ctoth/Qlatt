# Declarative Architecture Completion Plan

**Status:** Active coordinator; frontend single-IR convergence completed

**Frontend IR authority amendment (2026-07-11):**
`plans/declarative-frontend-hrg-convergence-plan.md` governs the frontend IR
boundary and execution order. Where this coordinator describes a standalone
control-score object as the canonical working IR, that language is superseded:
backend-neutral control intent lives as typed relations/features in the
provenance-stamped HRG, followed by one final lowering. The standalone object,
builder, validator, output field, schema, flat engine, and old track assembler
have been deleted. Remaining normalization, policy, backend-realization, and
runtime-concept work must extend the HRG or the backend semantics/runtime owner;
it must not recreate a second frontend representation.

## 0. Progress Updates

### 2026-07-11 — frontend IR convergence

Completed under `plans/declarative-frontend-hrg-convergence-plan.md`:

1. all bundled frontends construct and enrich one typed `Utterance`;
2. graph-native select/pattern rules commit atomic, cited, tagged writes;
3. Direction Track input attaches directly to typed control Relations;
4. one final HRG lowerer projects frames and per-cell provenance;
5. the flat engine, reconstruction bridge, standalone control score,
   trace-derived provenance, and old track assembler are deleted; and
6. field explanation, structured why-not evidence, phase views, and exact
   replay derive from one execution journal/history.

The 2026-03-16 list below is historical progress. Entries naming deleted
control-score or flat-engine surfaces describe milestones that were subsequently
migrated into the HRG owner; they are not current implementation guidance.

### 2026-03-16

Landed:

1. initial canonical control-score schema at `public/rules/control-score.yaml`;
2. typed control-score structures in `src/tts-frontend-types.ts`;
3. first control-score builder and validator in `src/control-score.ts`;
4. frontend emission of `controlScore` alongside the existing detailed track
   result in `src/tts-frontend.ts`;
5. provenance decision `control_score_created` emitted at frontend stage;
6. executable proof in:
   - `test/control-score-schema.test.ts`
   - `test/control-score-builder.test.ts`
7. canonical tune grammar spec at `public/rules/frontends/qlatt-english/policy/tune-grammar.yaml`;
8. typed tune-grammar loader and selector in `src/tune-grammar.ts`;
9. `src/prosodic-annotator.ts` now delegates tune-family and edge-tone
   selection to the declarative grammar instead of hardcoded accent-family
   branching;
10. provenance decision `tune_selected` emitted at prosody stage with
    citations including the tune-grammar spec;
11. executable proof in:
    - `test/tune-grammar.test.ts`
    - `test/prosodic-annotator.test.ts`
    - `test/tobi-intonation.test.ts`
12. canonical accent-policy spec at `public/rules/frontends/qlatt-english/policy/accent-policy.yaml`;
13. typed accent-policy loader and helpers in `src/accent-policy.ts`;
14. `src/prosodic-annotator.ts` now delegates function-word classification and
    accent-carrier selection to the declarative accent policy instead of a
    hardcoded lexicon and stress-rule blob;
15. provenance decision `accent_policy_selected` emitted at prosody stage with
    citations including the accent-policy spec;
16. executable proof in:
    - `test/accent-policy.test.ts`
    - `test/prosodic-annotator.test.ts`
    - `test/tobi-intonation.test.ts`
17. canonical break-policy spec at `public/rules/frontends/qlatt-english/policy/break-policy.yaml`;
18. typed break-policy loader and resolver in `src/break-policy.ts`;
19. `src/prosodic-annotator.ts` now delegates long-phrase breaking to the
    declarative break policy instead of a hardcoded threshold and midpoint
    heuristic;
20. provenance decision `phrase_break_selected` emitted at prosody stage with
    citations including the break-policy spec;
21. executable proof in:
    - `test/break-policy.test.ts`
    - `test/prosodic-annotator.test.ts`
    - `test/tobi-intonation.test.ts`
22. canonical speaker-profile spec at `public/rules/policy/speaker-profile.yaml`;
23. typed speaker-profile loader and resolver in `src/speaker-profile.ts`;
24. `src/tts-frontend.ts` now resolves default speaker values from the
    declarative speaker-profile spec instead of hardcoded fallback logic;
25. provenance decision `speaker_profile_selected` emitted at frontend stage
    with citations including the speaker-profile spec;
26. executable proof in:
    - `test/speaker-profile-schema.test.ts`
    - `test/speaker-profiles.test.ts`
    - `test/control-score-builder.test.ts`
27. canonical source-contour spec at `public/rules/policy/source-contour.yaml`;
28. typed source-contour loader and resolver in `src/source-contour.ts`;
29. `src/tts-frontend.ts` now resolves LF baseline source mode and voice-quality
    preset policy from the declarative source-contour spec instead of reading a
    hardcoded preset table and source baseline in TS;
30. provenance decision `source_contour_selected` emitted at frontend stage with
    citations including the source-contour spec;
31. executable proof in:
    - `test/source-contour.test.ts`
    - `test/voice-quality-presets.test.ts`
    - `test/control-score-builder.test.ts`

Notes:

1. This is intentionally Phase 1 infrastructure, not yet the full migration of
   prosody, source planning, or backend adaptation.
2. The main English-specific policy that previously lived in
   `src/prosodic-annotator.ts` now has declarative tune, accent, and
   break-policy specs. Phase 3 now has first-class speaker-profile and
   source-contour specs; the main remaining work in this phase is declarative
   voice-state planning and further reduction of TS-side overlay logic.
3. Targeted control-score and tune-grammar tests pass.
4. Full `npm run typecheck:core` is not currently clean for unrelated
   pre-existing errors in:
   - `src/declarative-frontend/engine.ts`
   - `src/klatt-runtime.ts`
   - `src/track-analysis.ts`

## 1. Purpose

This document is the coordinating plan for finishing the declarative architecture
of Qlatt.

It does two things:

1. audits what is already declarative, what is still imperative, and what the
   correct target abstraction should be;
2. defines a principled execution order for migrating the remaining hard-coded
   policy into declarative surfaces without destabilizing the synthesizer.

This document does not replace the specialized plans already in the repo. It
coordinates them.

Primary related plans:

1. `plans/declarative-control-score-roadmap/README.md`
2. `plans/declarative-nasal-subsystem-plan.md`
3. `plans/frontend-speech-quality-improvement.md`
4. `plans/principled-speech-excellence-roadmap.md`
5. `plans/control-windows-flag-day-plan.md`

## 2. Problem Statement

Qlatt already has substantial declarative infrastructure:

1. frontend rule phases in YAML;
2. inventory data in YAML;
3. graph topology in YAML;
4. parameter realization in YAML semantics;
5. primitive registry in YAML;
6. strong provenance and diagnostics expectations.

But major parts of the pipeline still encode domain policy in TypeScript rather
than in declarative data models.

The remaining problem is not "make everything YAML". The real problem is:

1. policy and execution are still mixed in several layers;
2. some authoring surfaces expose backend details instead of linguistic or
   phonetic concepts;
3. some reusable concepts are still expressed as ad hoc TS logic or raw graph
   fragments instead of named declarative abstractions;
4. explainability is weaker whenever the real decision happens in TS after the
   rule engine.

The target end state is:

1. declarative policy surfaces for linguistic, phonetic, and speaker decisions;
2. declarative intermediate representations that are backend-neutral;
3. backend adapters that convert those representations into concrete control
   parameters for each synthesizer;
4. runtime primitives or composite blocks for real acoustic concepts;
5. provenance and diagnostics attached to the actual declarative decisions.

## 3. Architectural Principles

These principles govern all work in this plan.

### 3.1 Distinguish policy from execution

TypeScript should execute policy, validate policy, or adapt policy. It should
not be the primary home of:

1. tune inventories;
2. lexical class lists;
3. speaker/style presets;
4. phrase/source contour planning;
5. backend mapping policy;
6. acoustic subsystem mode selection.

### 3.2 Prefer concept-level declarative surfaces

Do not merely move low-level numbers into YAML.

Good declarative surfaces expose concepts such as:

1. `nasalCoupling`
2. `nasalPlace`
3. `phraseAccent`
4. `boundaryTone`
5. `voiceQuality`
6. `speakerProfile`
7. `controlScore` envelopes and landmarks

Bad declarative surfaces expose unstable implementation details as authoring
primitives, for example:

1. raw pole-zero toggles when the real concept is nasalization;
2. backend-specific gain-gating policy when the real concept is source routing;
3. direct track-frame surgery when the real concept is a phonetic control
   trajectory.

### 3.3 Keep one canonical intermediate representation

The architecture has converged on one backend-neutral `Utterance` HRG between:

1. frontend linguistic/phonetic rules; and
2. backend-specific realization logic.

Its typed control Relations are more abstract than raw Klatt parameters but
more concrete than orthographic input. They are not serialized into a parallel
score object before lowering.

### 3.4 Raise the abstraction of reusable runtime concepts

`formantBanks` is the current proof that a higher declarative abstraction can be
better than spelling out every node and connection manually.

We should repeat that pattern for other coherent concepts:

1. nasal subsystem;
2. source routing;
3. burst transient subsystem;
4. possibly radiation or source-shaping bundles when they stabilize.

### 3.5 Provenance, citations, and diagnostics must move with the decision

If a decision becomes declarative, the explanation must also become declarative.

Migration is incomplete if the behavior moved out of TS but provenance still
describes it only after the fact via a sidecar.

### 3.6 No big-bang rewrite

This plan must land in phases with parity gates.

Each phase must:

1. preserve existing audio behavior unless it is intentionally improving a known
   defect;
2. add tests before deleting old logic;
3. maintain explainability and citation discipline;
4. leave the system in a coherent state after every merge.

## 4. Audit: What Is Still Not Declarative Enough

## 4.1 Text normalization and lexical resolution

Current declarative surface:

1. LTS rules are externalized.
2. Morphology affix data is externalized.
3. Frontend config can point to alternate resources.

Remaining imperative policy:

1. `src/g2p/text-normalize.ts`
   - abbreviation tables
   - number, ordinal, date, time, currency verbalization ordering
   - punctuation handling policy
2. `src/transcribe-text.ts`
   - diagnostic symbol mode selection
   - compound recovery heuristic
   - dictionary-first token joining behavior
3. `src/g2p/index.ts`
   - resolver ordering
   - possessive `'s` special-case handling

Why this matters:

1. normalization is policy, not runtime mechanics;
2. lexical resolution strategy should be inspectable and replaceable;
3. multilingual or alternate-English frontends will otherwise duplicate TS logic.

Target abstraction:

1. declarative normalization/transduction pipeline;
2. declarative lexical resolver chain;
3. declarative orthographic join/split policies;
4. TS retained only for generic execution of those specs.

## 4.2 Prosodic annotation and tune selection

Current declarative surface:

1. prosody rules generate F0 points in YAML;
2. many pitch targets and timing relations are already externalized.

Remaining imperative policy:

1. `src/prosodic-annotator.ts`
   - function-word lexicon
   - content/function classification
   - accent-carrier assignment policy
   - nuclear accent selection
   - accent type selection
   - phrase edge tone assignment
   - long-phrase break insertion

Why this matters:

1. this is the largest remaining linguistic policy blob in TS;
2. tune choice is one of the most explainability-sensitive stages;
3. current prosody logic mixes annotation with English-specific tune inventory.

Target abstraction:

1. a declarative tune grammar or prosodic policy spec;
2. a reduced TS annotator that only performs generic segmentation and carries
   structural facts into the rule engine;
3. tune selection and edge-tone policy emitted as declarative decisions.

This aligns with `plans/declarative-control-score-roadmap/README.md`.

## 4.3 Track assembly and phonetic control planning

Current declarative surface:

1. token-local control windows exist;
2. F0 point streams exist;
3. semantics realizes backend values declaratively;
4. output config externalizes some smoothing and duration defaults.

Remaining imperative policy:

1. `src/track-assembler.ts`
   - segment event construction
   - smoothing defaults and blend heuristics
   - layered F0 rendering dispatch
   - sagging-transition insertion
   - voice-quality overlay behavior
   - track-frame production as the place where multiple policies collapse

Why this matters:

1. this is the major glue layer where backend assumptions leak upward;
2. it still performs real phonetic planning rather than only adaptation;
3. multiple future backends will otherwise require forking or overloading this
   file.

Target abstraction:

1. a backend-neutral control score with explicit timing, envelopes, source
   controls, resonance controls, and phonation controls;
2. backend adapters that map the control score into Klatt, klsyn88, Stevens91,
   or other parameter spaces;
3. a smaller track assembler whose job is only backend-specific score-to-track
   expansion.

## 4.4 Speaker profile and voice-quality planning

Current declarative surface:

1. frontend policy blocks already contain speaker defaults and voice-quality
   preset values.

Remaining imperative policy:

1. `src/tts-frontend.ts`
   - speaker-profile merging
   - source mode defaulting
   - formant scaling application
   - F0 preset scaling behavior
2. `src/track-assembler.ts`
   - voice-quality overlay mutation on per-frame params

Why this matters:

1. speaker identity and local voice quality are conceptually separate and should
   remain so;
2. speaker/voice policy should feed the same declarative score as segmental and
   prosodic policy;
3. current TS overlays make it harder to see where the real decision happened.

Target abstraction:

1. first-class declarative speaker profile schema;
2. first-class declarative voice-state schema;
3. explicit mapping from those controls into control-score fields and then into
   backend adapters.

## 4.5 Runtime concepts that are still too low-level

Current declarative surface:

1. graph topology is declarative;
2. primitive registry is declarative;
3. `formantBanks` already encapsulates a reusable acoustic concept.

Remaining abstraction gaps:

1. source selection is still modeled as manual gain-gate fragments in
   `public/experiments/klatt80-baseline/graph.yaml`;
2. PLSTEP burst behavior is spelled out as raw edge-detector plus envelope
   plumbing in the graph;
3. nasal behavior still needs a dedicated subsystem abstraction;
4. native node creation in `src/klatt-runtime.ts` is still hardcoded to a small
   switch, which weakens the registry model.

Why this matters:

1. graph structure alone is not enough when the same concept recurs;
2. authors should not need to understand internal graph tricks to express a
   stable concept;
3. concept-level runtime blocks make provenance and diagnostics cleaner.

Target abstraction:

1. composite primitives or graph macros for:
   - nasal subsystem
   - source router
   - burst transient subsystem
2. a more complete registry-driven runtime instantiation path;
3. fewer backend-specific graph tricks exposed directly to rule authors.

## 4.6 Backend realization is not yet a first-class layer

Current declarative surface:

1. semantics already maps frontend params into node params;
2. graph and registry are backend-specific and declarative.

Remaining problem:

1. there is no explicit backend-adapter layer between linguistic controls and
   raw backend parameters;
2. the current frontend still tends to emit Klatt-oriented parameters early.

Why this matters:

1. backend-neutral policy is impossible if frontend rules directly think in one
   backend's parameter language;
2. alternate synthesizers should consume the same control score and differ only
   in adapter policy.

Target abstraction:

1. explicit backend adapter specs under `public/rules/backend-adapters/`;
2. score-to-backend mapping separated from frontend linguistic policy.

## 4.7 Explainability sidecars should shrink over time

Current declarative surface:

1. provenance exists across major stages;
2. rule citations and tags are already structured.

Remaining imperative sidecars:

1. `src/nasal-subsystem.ts` currently interprets nasal regimes after the fact
   for explainability;
2. some speaker and prosody decisions are only visible after TS mutation rather
   than at the declarative decision point.

Target abstraction:

1. provenance emitted where the declarative decision is made;
2. diagnostics emitted by generic engines and composite subsystems rather than
   one-off sidecars.

## 5. Recommended End-State Architecture

The target pipeline should be:

`text`
-> `normalization policy`
-> `lexical resolver policy`
-> `typed Utterance construction`
-> `graph-native frontend rules and control relations`
-> `one final lowering`
-> `backend track/runtime realization`
-> `audio graph`

Responsibilities:

1. normalization policy
   - semiotic expansion
   - token-level text rewrites
2. lexical resolver policy
   - dictionary, morphology, LTS, orthographic join/split behavior
3. frontend structural rules
   - symbolic segmental and prosodic structure
4. HRG control relations
   - time-aligned phonetic intent, not raw backend knobs
5. final lowering
   - project current typed graph values into backend frame controls once
6. backend runtime
   - execute graph, semantics, scheduling

The key architectural boundary is:

The frontend should stop deciding early that the world is made of Klatt frame
params. It should decide in terms of phonetic control intent, and the backend
adapter should decide how that intent is realized.

## 6. Execution Strategy

The order below is intentional.

We should not start by declarativizing normalization or runtime primitives in
isolation. The highest-leverage first move is the control-score boundary,
because it creates the landing zone for multiple later migrations.

Recommended top-level order:

1. lock the control-score architecture and boundary definitions;
2. move prosody/tune selection onto that surface;
3. move speaker and source planning onto that surface;
4. shrink track assembly into a backend adapter path;
5. migrate lexical and normalization policy into declarative specs;
6. raise runtime concepts into composite primitives/macros;
7. finish backend adapter rollout and delete legacy glue.

## 7. Phased Plan

## 7.1 Phase 0: Architectural boundary and terminology freeze

Objective:

Define the canonical boundary between:

1. frontend rules;
2. control score;
3. backend adapters;
4. runtime primitives.

Deliverables:

1. stabilize the control-score field vocabulary;
2. explicitly classify existing TS modules as:
   - policy
   - adapter
   - execution
   - legacy
3. document which current track fields are:
   - frontend facts
   - score controls
   - backend controls

Primary files:

1. `plans/declarative-control-score-roadmap/README.md`
2. `plans/principled-speech-excellence-roadmap.md`
3. this document

Exit criteria:

1. no ambiguity about what belongs in the control score;
2. no new feature work lands directly in `track-assembler.ts` unless it is
   explicitly backend adaptation or bugfix containment;
3. all later phases can target stable field names.

## 7.2 Phase 1: Control score core

Objective:

Introduce the canonical backend-neutral control score as the main declarative
intermediate representation.

Deliverables:

1. score schema and validators;
2. score-level provenance fields and diagnostics;
3. score generation path from the existing declarative frontend;
4. parity path that still feeds the current backend.

Primary files:

1. `src/declarative-frontend/*`
2. `src/tts-frontend-types.ts`
3. `src/track-assembler.ts`
4. `public/rules/...` control-score-related specs

Exit criteria:

1. score exists as a checked, explainable artifact;
2. existing frontend behavior can be rendered through the score without user-
   visible regressions;
3. later work can target the score rather than raw Klatt params.

This phase depends on and should reuse:

1. `plans/declarative-control-score-roadmap/README.md`
2. `plans/control-windows-flag-day-plan.md`

## 7.3 Phase 2: Prosody and tune grammar extraction

Objective:

Move English-specific tune and edge-tone policy out of `src/prosodic-annotator.ts`
and into declarative specs that emit control-score structure.

Deliverables:

1. tune grammar spec;
2. declarative function-word and accent-priority policy;
3. declarative phrase-edge tone selection;
4. reduced TS prosodic annotator focused on generic structure extraction.

Primary files:

1. `src/prosodic-annotator.ts`
2. `public/rules/frontends/qlatt-english/phases/prosody.yaml`
3. new tune-grammar spec files

Exit criteria:

1. tune selection is no longer primarily hardcoded in TS;
2. provenance can answer why a tune or edge tone was selected from declarative
   policy;
3. `prosodic-annotator.ts` is mostly generic annotation, not English tune logic.

## 7.4 Phase 3: Speaker, source, and voice-state planning

Objective:

Move speaker defaults, source planning, and local voice-state policy into
declarative score-generation stages.

Deliverables:

1. declarative speaker profile schema;
2. declarative voice-state schema;
3. declarative source-contour policy;
4. reduction of TS-side profile overlays.

Primary files:

1. `src/tts-frontend.ts`
2. `src/track-assembler.ts`
3. frontend policy YAML
4. any new speaker/source policy specs

Exit criteria:

1. profile application no longer primarily mutates frame params in TS;
2. speaker identity and local phonation state are represented separately and
   explicitly;
3. source and voice planning are explainable as policy decisions.

This phase should follow the source-contour direction already identified in
`plans/declarative-control-score-roadmap/README.md`.

## 7.5 Phase 4: Track assembler reduction into backend adapter

Objective:

Turn `src/track-assembler.ts` from a policy-heavy planner into a backend adapter
and expansion layer.

Deliverables:

1. split score planning from backend adaptation;
2. keep only backend-specific timing expansion and frame generation in the
   assembler;
3. isolate sagging, smoothing, and layered-F0 behavior behind declarative score
   or adapter policy.

Primary files:

1. `src/track-assembler.ts`
2. backend adapter execution code
3. backend adapter specs

Exit criteria:

1. track assembler is mostly generic expansion plus backend adaptation;
2. new phonetic policy no longer needs to land in this file;
3. backend differences are isolated and inspectable.

## 7.6 Phase 5: Declarative normalization and lexical resolution

Objective:

Move text normalization and lexical resolution policy into declarative specs.

Deliverables:

1. declarative normalization/transduction spec;
2. declarative resolver ordering and word-joining policy;
3. retained generic algorithms for number/date/time expansion where necessary,
   but driven by declarative class selection and ordering.

Primary files:

1. `src/g2p/text-normalize.ts`
2. `src/transcribe-text.ts`
3. `src/g2p/index.ts`
4. `src/g2p/morphology.ts`
5. new normalization and resolver policy YAML

Exit criteria:

1. normalization behavior is frontend-configurable and inspectable;
2. resolver ordering is not hidden in TS branches;
3. compound recovery and symbol mode are explicit policy, not surprising
   fallback behavior.

This phase should coordinate with:

1. `plans/frontend-speech-quality-improvement.md`

## 7.7 Phase 6: Runtime concept elevation

Objective:

Replace repeated low-level graph tricks with concept-level runtime abstractions.

Deliverables:

1. dedicated nasal subsystem primitive or composite block;
2. source-router abstraction;
3. burst-transient abstraction;
4. improved registry-driven native-node instantiation path if needed to support
   richer primitive definitions.

Primary files:

1. `public/experiments/*/graph.yaml`
2. `public/experiments/*/registry.yaml`
3. `src/klatt-runtime.ts`
4. new primitive or macro implementations

Exit criteria:

1. authors express runtime concepts through stable abstractions;
2. graph complexity for recurring concepts is reduced;
3. provenance and diagnostics can attach to named subsystem operations.

This phase should directly reuse and complete:

1. `plans/declarative-nasal-subsystem-plan.md`

## 7.8 Phase 7: Backend adapter rollout

Objective:

Make backend adapters first-class and use the same control score across multiple
backends.

Deliverables:

1. `klatt80` adapter spec;
2. `klsyn88` adapter spec;
3. `stevens91` adapter spec;
4. parity tests across adapters where behavior should match structurally.

Primary files:

1. `public/rules/backend-adapters/*`
2. adapter execution code
3. backend parity tests

Exit criteria:

1. backend choice is no longer encoded by frontend policy leaking backend params;
2. alternate synthesizers consume the same score;
3. backend differences are declarative and reviewable.

## 7.9 Phase 8: Legacy path deletion and cleanup

Objective:

Delete obsolete imperative glue after parity is proven.

Deliverables:

1. remove legacy overlays and fallback paths that are superseded;
2. collapse sidecar explainability logic that became redundant;
3. update docs to present the new architecture as the default mental model.

Exit criteria:

1. no major policy remains trapped in TS without a clear reason;
2. remaining imperative code is execution, validation, or adaptation only;
3. docs and tests describe the new architecture consistently.

## 8. Dependencies and Ordering Constraints

These constraints are important.

1. Do not begin broad backend adapter rollout before the control score is
   stable.
2. Do not deeply refactor `track-assembler.ts` before the control score gives it
   a new contract.
3. Do not treat the nasal subsystem as an isolated special project; it should
   land on top of the control-score and runtime-concept architecture.
4. Do not try to fully declarativize normalization before deciding the canonical
   normalization/resolver boundary.
5. Do not add new major TS policy in the old style while these migrations are in
   flight.

## 9. Testing and Proof Strategy

Every phase must ship with executable proof.

Required proof categories:

1. schema and validation tests
2. targeted rule-engine tests
3. frontend integration tests
4. semantics/runtime tests
5. provenance and diagnostics tests
6. corpus-level regression checks
7. explain CLI checks with strict citations

Minimum test expectations by area:

1. control score
   - score schema tests
   - score provenance tests
   - adapter parity tests once adapters exist
2. prosody migration
   - `test/declarative-frontend-rulepack-prosody.test.ts`
   - `test/tts-frontend-declarative-prosody.test.ts`
   - explain output checks for tune selection
3. lexical and normalization migration
   - normalization corpus tests
   - `test/g2p-*.test.ts`
4. runtime concept migration
   - subsystem-specific tests
   - semantics evaluation tests
   - runtime primitive tests
5. end-to-end protection
   - `test/tts-frontend-declarative-corpus.test.ts`
   - `test/tts-frontend-declarative-golden-summary.test.ts`
   - `npm run explain -- "<phrase>" --strict-citations`

No phase is complete if it relies only on subjective listening.

## 10. Governance Rules During the Migration

While this roadmap is active:

1. prefer adding declarative fields over adding new TS-only heuristics;
2. if a new heuristic must land in TS, document why it cannot yet live in the
   target declarative surface;
3. every new control should be classified as:
   - frontend structural fact
   - control-score field
   - backend adapter field
   - runtime primitive option
4. every new non-trivial rule or policy constant must carry citations or an
   explicit engineering-estimate label;
5. every new migration step should leave a smaller imperative surface than
   before, not a second parallel policy system.

## 11. Success Criteria

This roadmap is complete when:

1. `src/prosodic-annotator.ts` no longer owns English tune inventory and tune
   selection policy;
2. the sole HRG lowerer contains projection/realization but no hidden frontend
   policy or fallback reconstruction;
3. text normalization and lexical resolution policy are externally specified and
   frontend-configurable;
4. speaker identity, voice quality, and source planning are first-class
   declarative controls;
5. nasal, source-routing, and burst behavior are exposed as stable acoustic
   abstractions rather than graph tricks;
6. backend realization consumes the canonical HRG's final lowering without a
   second frontend IR;
7. provenance explains these decisions at the stage where they are really made;
8. new frontend or backend variants can be added by authoring specs instead of
   copying TS policy.

## 12. Immediate Next Action

The frontend middle-layer migration is complete. The next coordinator action is
to re-audit remaining normalization, lexical, backend-realization, and runtime
concept work against the canonical HRG. New work extends the selected owner and
must not recreate the deleted flat engine, standalone score, or assembly path.
