# Frontend model decisions

Status: bounded disposition for #249, 2026-10-20. Q adopted schema-as-data,
generic references and universal language-package ownership, plus #167's keyed
inventory/policy overrides and whole ordered-resource replacement. This records
those decisions; it does not claim their implementation or adopt every mechanism
in the two companion proposals.

Source audit: `c58c6cdd81ef4c2824f9b6e0f3a7fdd30a5a910b`. Line references below
refer to that revision. The [document model](frontend-document-model.md) and
[language package](language-package.md) provide context; this matrix determines
which parts may guide implementation. The adopted [attribute model](attribute-model.md)
and bounded Frame reconciliation retain their existing scope.

## Decision matrix

| Subject | Disposition | Owner and boundary |
|---|---|---|
| Schema-as-data | Adopted direction: item, relation and inventory-column types are declared, not inferred from inventory values. | #227 compiles declarations to the existing HRG schema; #141 supplies documents. No second runtime validator. |
| Generic references | Adopted direction: schemas declare foreign keys, checked against resolved documents. | #227 owns static checks and checked identities. #141 loads the referenced closure; #224 supplies source spans. |
| Language ownership | Adopted universal package boundary: language owns linguistic declarations; voices own acoustic targets and voice policy. | #141 implements resource ownership; #248 owns package/dependency identity; #82 distributes the result. |
| Inventory and policy overrides | Adopted for #167: explicit keyed overrides; missing entries inherit. | #167 constructs the effective request view using the resolved documents. It does not repurpose duplicate-rejecting include. |
| Ordered rule resources | Adopted for #167: a supplied resource replaces the corresponding resource whole; an absent resource inherits. | #167 selects resources; #227 checks the resulting executable definitions and ordering. No concatenation or implicit rule interleaving. |
| Selection time | Prepare bundle resources at load; select one effective variety per request. | #167 retains options > Direction Track voice > selected voice > frontend default precedence. Later text-command variety switching is outside this scope. |
| Derived function features | The adopted attribute/Frame work continues; wholesale migration of the proposal's speech helpers is not approved by this disposition. | #230/#261 evaluator and #227 compiler boundaries remain. Assess individual helper migrations against current source before changing bindings. |
| Numeric composition and Frame migration | Existing bounded decisions remain adopted. | #229 owns scalar ordering/numeric folds; #228 owns Frame migration. Neither is a prerequisite for the first data-only schema extraction. |
| Universal fold-based overlay | Not adopted by this disposition. | Preserve existing voice/affect algebra; keyed data replacement does not turn ordered operations into a commutative fold. |
| Multilingual algorithms and inventories | Not implementation prerequisites for the ownership boundary. | Language-specific follow-ups own scientific data and algorithms. This disposition does not promise Mandarin, Esperanto, Klingon or Vietnamese synthesis. |
| Extra enforcement machinery | Not adopted here. | No speech-noun lint gate, new package manager, second compiler, cache, or artifact envelope. |

## Schema and compiler boundary

`src/tts-frontend.ts:152–398` currently builds the utterance schema with hardcoded
features and item/relation declarations. In particular, `:294–306` examines
inventory target values and widens their schemas. That is the behavior to replace
with declared columns, including nested objects, arrays, nullable values and
optional fields; declaring only numeric acoustic columns is insufficient.

Reuse `FeatureSchema` and `HrgSchema` in `src/declarative-frontend/hrg/types.ts:34–62`.
The existing `utterance.ts:46–125` clones/freezes their structure and checks
relation item types. The compiler should produce this representation, while the
existing item/transaction enforcement remains responsible for runtime writes.
Keep source declaration metadata alongside checked identities; do not add a
parallel speech-specific schema validator inside the runtime.

The current compile entry point is `rule-pack.ts:595–606`: parse, validate,
record diagnostics, freeze. Extend that path under #227. Preserve the distinction
between declarations and runtime parameter values; defaults synthesized during
parsing are not proof that an author supplied a static parameter schema.

Generic references start with actual document fields and target key sets.
For example, `src/experiments/frontend-vocabulary.ts:13–25,29–59` checks lowering
columns and source-contour targets against the expanded experiment parameters.
The generic checker must preserve that expanded target vocabulary and the
separate required-input check; a simple foreign-key lookup does not replace both.

Expression references remain compiler work. `validation.ts:633–681` currently
finds phoneme references inside expression strings. A declared foreign-key
checker needs reference uses supplied by expression analysis to replace that
check. Delete a bespoke check only when its inputs, diagnostics and execution
conditions are covered by the declared replacement. Avoid dual authoritative
validators during migration.

## Resources and language ownership

Use #141's existing `resources:` roles and closure resolver as the acquisition
boundary. #248/#78 retain standard document-relative URLs and stable package plus
resource identities; inherited references keep their declaring document's base.
Language ownership changes who declares resources, not how a second loader finds
them. Exact package manifests and checked-artifact envelopes remain with #248
and #227 respectively.

The proposals group resources differently. #141 lists concrete loader roles
such as inventory, lexicon, LTS, morphology, phonotactics and stress policy;
the language proposal groups these into orthography, phonology, lexical prosody,
phrasing and intonation. These are ownership groupings, not a mandate to replace
every working resource schema at once. Map existing documents to their language
or voice owner first, preserving each selected algorithm's data contract.

There is already a phonology/acoustics seam: `inventory.ts:223–345` loads a
phonology document and combines its conventions and target fields with an
inventory. It rejects duplicate fields and undeclared target symbols. Reuse this
split; explicit variety overrides are a later operation, not permission to make
this composition silently override duplicate declarations.

Extract shared English phonology, lexical resources and linguistic declarations
into the language owner. Voice packages retain their acoustic target columns,
speaker/source/VQ data and the policy values read by language rules. A rule's
linguistic structure may be shared while its parameter values remain voice-owned.
DECtalk must keep its own dictionary, compiled LTS tables, symbols and rule
replacements where fidelity requires them; sharing a language does not imply
sharing those implementations.

The apparent shared stress-policy exception is narrower than execution sharing.
`public/rules/frontends/dectalk-english/frontend.yaml:6–13` documents why the
loader currently requires English morphology and stress-policy paths. The
compiled-table pronunciation branch in `src/g2p/index.ts:877–880,1077–1086`
returns before the shared morphology/stress steps at `:1090–1116`. Resource
requirements should follow the selected pronouncer when #141 removes this
exception. Do not introduce shared English stress processing into DECtalk as
part of a file move.

## Request-local composition

Select the variety using #167's precedence, then apply its resources over the
inherited frontend base. Preserve existing voice and request field precedence;
this does not introduce a universal overlay order for every subsystem.
For #167's inventory and policy maps, a supplied key replaces the corresponding
value and omitted keys inherit. Preserve each replacement's declaring resource
and key path alongside the inherited source. This is distinct from summing or
multiplying acoustic deltas and from concatenating ordered rule lists.

Prepare and check available bundle resources during loading; select an effective
view per request without mutating cached documents. The current rulepack cache
is keyed by source path and freezes compiled values (`rule-pack.ts:651–692,
730–770`). Do not cache a request-selected variety under that same source key.
Use the existing runtime parameter merge for policy values where applicable
(`hrg/rule-engine.ts:2800–2834`); inventory and rule-resource choices also affect
earlier compilation/materialization and cannot be implemented by that merge alone.

Resolve the effective variety before inventory-dependent schema and transcription.
Today resources/schema are chosen at `tts-frontend.ts:788–795`, while initial
command voice selection occurs at `:827–865`; implementation must preserve that
command precedence when determining the selected voice's variety. Later command
scopes at `:1220–1267` change policy; they do not already implement replacement
of the phonology or rule resources within an utterance.

Missing bundle resources inherit; unknown variety IDs retain #167's error contract.
The empty `gam` bundle must preserve current output. Selection provenance names
the consulted resources, and override ancestry distinguishes inherited and
replaced values. Test alternating and concurrent requests against the same loaded
base, as #167 already requires. Keep actual voice-quality composition unchanged:
`input/direction-track.ts:329–346` multiplies some fields and adds others.

## Delivery and dependencies

Estimates below are planning bounds, excluding tests; they are not authorization
to combine the work into one rewrite. Each implementation still needs its own
current-source plan and review.

| Delivery | Owner | Dependency and approximate size |
|---|---|---|
| Resource acquisition, parse-only consumers and ownership moves | #141 | Use #248/#78 access boundary; roughly scoped per consumer, not gated on multilingual synthesis. |
| Data-only schema extraction | #227 | Existing HRG schema; 250–400 TS additions, about 250 removals, 350–600 YAML declaration lines. Preserve all shipped schema shapes. |
| First declared-reference proof | #227 | #141 resolved documents; 150–250 TS lines plus declarations for a bounded set of direct references. #224 owns position-preserving attribution. |
| English language ownership extraction | #141 | Adopted ownership and #248 dependencies; 150–300 TS adapter changes plus mostly moved data. #82 consumes the resulting layout. |
| Request variety selection/composition | #167 under #172 | Prepared resource roles and checked replacements; 250–450 TS lines after those dependencies. #168–#171 retain their distinct lexical, rule and scientific-data responsibilities. |
| Native checked frontend consumption | #241 | #227 artifact and #240 bindings; update capability requirements for actually retained kernels, rather than porting helpers scheduled for deletion. |
| Generated specification | #96 | Consume #227's resolved checked representation and #224 source map; no independent interpretation of overlays. |
| Backend resolved data and validation | #251/#252 | Independent backend path under #248; frontend language/schema delivery does not gate the existing backend prototype. |

Compatibility evidence belongs with each implementation: existing shipped pairs
retain their outputs, inherited sources retain ownership after relocation,
duplicate includes remain errors, and declared reference checks preserve existing
required-input checks. Do not mark #82 extraction blocked on implementing new
languages, all scalar migrations, or a new native frontend.

This disposition leaves no new product question for its bounded scope. Detailed
formats stay with their named owners; speculative mechanisms in the proposals
remain proposals. Synchronize #249/#141/#167/#227/#248 issue contracts with this
matrix before treating those issues as fully reconciled. This document alone
does not complete their implementation or close #249's remaining bookkeeping.
