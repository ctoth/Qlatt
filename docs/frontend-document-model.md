# The frontend document model

Status: proposal, 2026-09-08, for Q's decision. Companion to
`docs/attribute-model.md`, which defines what a value is. This document
defines what a frontend is, what the compiler is allowed to know, and where
each kind of speech knowledge lives. It reshapes #141 and adds one row to the
#74 placement table.

## The one-sentence version

A frontend is one document graph whose root declares its schema, its
resources, and its overlays; the compiler knows item, relation, feature,
clock, fold, kernel, reference, overlay, document span, and citation, and
nothing about speech.

The attribute model brings the frontend to the backend's evaluation model.
This document brings the frontend to the backend's *declaration* model:
`graph.yaml` declares nodes and edges against a registry and Bacon validates
the graph against the registry once. The frontend has no registry and no
root; its schema is a TypeScript function, its resources are path strings
scattered across nine modules, and its references are checked by hand at
eleven sites.

## Decisions

1. **The schema is data.** `buildUtteranceSchema` (`src/tts-frontend.ts:187-291`)
   hardcodes forty segment features, twelve item types, and fourteen
   relations, then widens the segment type by observing the value shapes in
   `phoneme_targets`. This moves into the frontend document as `schema:`:
   item types with typed features, each carrying `kind`, its `fold` and
   `floor` (attribute model decision 4), its `clock` (decision 2), and a
   citation; relations with `kind: list | tree` and their item types. The
   inventory widens the segment type by declaration, not observation: it
   declares the parameter columns it supplies. The conventions now in the
   inventory (`silence_symbol`, `nucleus_types`, `stress_markers`,
   `symbol_grammar`) become declarations on the segment type: `type` lists
   its values and names which of them are syllable nuclei; `phoneme` declares
   its grammar and its silence value. The inventory keeps what it is: a cited
   table of targets.

2. **Function features replace engine built-ins.** The rule engine carries
   thirteen speech functions in TypeScript (`rule-engine.ts:581-740`:
   `word_count`, `phone_count`, `clause_phone_count`, `count_word_vowels`,
   `cluster_position_in_word`, `word_run_has_primary_stress`,
   `word_has_metrical_stress`, `is_first_primary_stress_in_word_run`,
   `is_last_in_word_run`, `phrase_terminal_punctuation`, `syllable_index`,
   `syllable_role`, `syllable_position_in_word`). The word-run helpers are
   commented as a faithful port of the deleted prosodic annotator: speech
   knowledge moved from one TypeScript file to another. Each becomes a
   function feature (attribute model decision 1) declared in `schema:` with a
   CEL body and a citation. Three navigation kernels make them expressible:
   `parent(item, relation)`, `daughters(item, relation)`, `siblings(item,
   relation)`. Phrase-indexed ones use the existing `scan`. After this,
   `nucleus_types` is read by exactly one declaration, `is_nucleus`, and
   `inventory.ts:457` (stress suffix applies to nuclei only) reads that.

3. **Resources are declared, typed, and loaded once.** The root declares
   `resources:`, a map from role to document. Each role has a document
   schema: `inventory`, `lexicon`, `lts`, `morphology`, `phonotactics`,
   `syllabification`, `stress_policy`, `normalization`, `speaker_profile`,
   `source_contour`, `vq_channels`, `affect_presets`, `voices`. One resolver
   loads the closure of `extends`, `include`, and `resources` into an
   immutable document graph. It is the only code outside `yaml-loader.ts`,
   `cmu-dictionary-loader.ts`, and `runtime-assets/` that loads anything.
   Every other module receives a document from the graph. A role the
   frontend does not declare is absent, and a request that needs it fails
   with `E_FRONTEND_CONFIG` naming the role. This is the strong form of the
   #74 placement rule: core never names a resource.

4. **References are foreign keys, declared once, checked once.** Every
   cross-document reference that exists today is checked by hand somewhere:

   | reference | checked today | where |
   |---|---|---|
   | rule `field` → schema feature | yes | `validation.ts` `E_RULE_FIELD_UNKNOWN` |
   | rule phoneme literal → inventory target | yes | `validation.ts` `E_PHONEME_UNKNOWN` |
   | rule `relation` → schema relation | yes | `validation.ts` `E_RULE_RELATION_UNKNOWN` |
   | effect `tag` → tag vocabulary | yes | `validation.ts` `E_RULE_TAG_UNKNOWN` |
   | `output.lowering.columns` → experiment params | yes | `frontend-vocabulary.ts` `E_FRONTEND_VOCABULARY` |
   | source-contour `target_param` → experiment params | yes | `frontend-vocabulary.ts` `E_SOURCE_CONTOUR_TARGET` |
   | vq-channels `backend_param` → experiment params | no | |
   | affect preset `vq` keys → vq-channels rows | partial | `direction-track.ts` |
   | voice file fields → speaker profile fields | yes | `speaker-profile.ts`, six sites |
   | dictionary entries → inventory symbol grammar | at lookup only | `inventory.ts` `parseInventorySymbol` |
   | `speakers.dir` entries → voice document schema | at resolve only | `dectalk-voice.ts` |

   A schema field declares `ref: <role>.<key>` and one generic checker
   resolves every reference against the loaded graph at compile time. The
   hand checks are deleted as each reference is declared. `validation.ts` is
   3,936 lines with 59 distinct error codes today, up from 2,736 lines in
   July; it grows because each new declaration gets its own check.

5. **One overlay operator.** Attribute model decision 10 says a variety, a
   voice, and an affect preset are overlays of one kind. Today they are three
   mechanisms: frontend `extends` is a deep merge in `rule-pack.ts`; a voice
   is a flat key-value file mapped by `resolveVoice` in `dectalk-voice.ts`;
   an affect preset is a vq vector composed by `direction-track.ts` with the
   channel algebra. The document model has one overlay operator: a document
   over a document, merging per field by the field's declared fold, with
   `replace` as the default. Frontend and variety overlays apply at compile
   time; voice and affect overlays apply at request time to the same graph.
   The speaker profile's `sources: [request.x, voice.x]` composition policy
   becomes a `first_defined` declaration (attribute model decision 6), not a
   loop in `tts-frontend.ts`.

6. **Language is a package, and it is the bottom overlay.** Some knowledge
   is about English, not about a voice or a body. Documents: the dictionary,
   normalization components, LTS rules, morphology, phonotactics,
   syllabification tables, stress policy. Declarations inside `pipeline.yaml`:
   the phonological predicates (`is_sonorant`, `is_coronal`,
   `is_question_boundary`, twenty-five in `qlatt-english`), the string sets
   (`function_words`, `ascii_letter`, the place-locus sets), the maps. And
   one column of the inventory: of the seventy keys a `qlatt-english` target
   carries, twenty-three are phonological (`type` and the binary features
   `voiced`, `alveolar`, `back`, `rhotic`, ...) and forty-seven are acoustic
   (`F1`, `B1`, `AV`, `dur`, the frication constants, ...). The phonological
   column is the English phoneme class table and is language; the acoustic
   columns are a voice. Today `qlatt-english` owns all of it,
   `public/rules/normalization/` is shared through `include`, and
   `dectalk-english/frontend.yaml:7` points its stress policy at
   `qlatt-english` while replacing the LTS rules, dictionary, phoneme symbols
   (63 against 59, 51 shared), and predicates (four, two of which restate
   `qlatt-english`'s `is_question_boundary` and `is_stressed_vowel` with
   different quoting) with DECtalk's own for fidelity. Even the fidelity
   frontend re-declares the language-level predicates it shares.

   Proposal: an `english` package holds the language documents, the
   phonological predicates, the string sets and maps, and the phoneme class
   table. It is the bottom of the overlay stack of decision 5 and attribute
   model decision 10: `english` ← variety (#172) ← voice ← request. A voice
   package such as `qlatt-english` then declares the acoustic columns over
   the class table, its policy values, and its rule phases; `qlatt-beauty` is
   a voice over the same language. `dectalk-english` depends on `english`
   only for the roles it does not replace, and says which in its
   `resources:`. The #74 dependency direction gains one row: voice packages
   depend on language packages. This deletes the exception list that #141's
   ownership test would otherwise need, and it is what makes a second English
   voice or a Scottish variety a small package instead of a fork.

   `docs/language-package.md` defines the package contract as a fixed set
   of roles designed against English, Mandarin, and Klingon, with BCP 47
   ids (`en`, `cmn`, `tlh`) and varieties as subtag overlays (`en-US`,
   `en-GB-scotland`).

   The seam this creates inside a rule: `hertz_nucleus_timing` is an English
   rule (its selection and structure) with voice parameters (its
   `params.policy.duration` values). The rule declaration lives in the
   language package; the values it reads live in the voice overlay. A rule
   that only makes sense for one voice lives in that voice. The audit script
   `scripts/audit-rulepack-conflicts.ts` can report which rules read only
   language-level features and which read voice policy, which sizes the
   split before it is made.

7. **The compiler's vocabulary is closed.** Core may name: item, relation,
   feature, clock, fold, kernel, reference, overlay, document span, citation,
   document, role. Core may not name a speech concept. Kernels are the exception and
   are registered by name with a citation, the way DSP primitives are
   registered in `registry.yaml`. A script counts speech nouns in `src/`
   outside registered kernels and fails CI above zero. Today, of 97
   non-worklet core files: `phoneme` appears in 26, `lts` in 24, `voice` in
   23, `stress` in 22, `SIL` in 18, `affect` in 17, `syllable` in 16.

8. **Core partitions into five parts, and the fifth is the work.**

   | part | what it is | today |
   |---|---|---|
   | compiler | parse, macro expansion, schema and reference checks, fold and conflict checks, checked-rulepack emission | `parser.ts`, `cel-macros.ts`, `validation.ts`, `rule-pack.ts`, `struct-schema.ts` |
   | evaluator | items, relations, transactions, memoized attributes, the generic accumulator, `scan` | `hrg/{item,relation,transaction,utterance,rule-engine,undo-log,replay,provenance-query}.ts` |
   | kernels | cited algorithms with declared parameters | `syllabify.ts` (longest-first onsets), `g2p/lts-engine.ts` (Elovitz transducer), `g2p/morphology.ts`, `g2p/metrical-stress.ts`, `hrg/holmes-transitions.ts`, `hrg/tone-association.ts`, the lowering resampler, the Fujisaki filter, lexicon `first_defined` |
   | loaders | bytes to documents | `yaml-loader.ts`, `cmu-dictionary-loader.ts`, `runtime-assets/`, `path-utils.ts` |
   | residue | speech knowledge that is neither a kernel nor a rule | see below |

   The residue, and the form that absorbs each item:

   | residue | file | absorbed by |
   |---|---|---|
   | thirteen engine built-ins | `rule-engine.ts:581-740` | function features (decision 2) |
   | stress-suffix target selection, secondary-stress fallback, alias borrowing | `inventory.ts:427-500` | lexicon `first_defined` over declared target keys |
   | nucleus-counting structure fallback (#205) | `tts-frontend.ts:413-441` | deleted; syllabification tables required |
   | speaker stamp loop | `tts-frontend.ts` | fold rules over `voice.*` (decision 5) |
   | duration floor transaction | `tts-frontend.ts` | a `min` fold, already declared per field |
   | rate clamp and default (#204) | `tts-frontend.ts` | `params.policy` with floor and ceiling declared |
   | affect projection table | `lowering.ts:224-286` | fold rules over vq-channels rows |
   | four transition builders and the 20 ms guard | `lowering.ts:865-1089` | Holmes kernel with declared parameters |
   | source-contour projection ops | `source-contour.ts`, `speaker-projection.ts` | folds (`override_or_baseline` is `first_defined`; `current_plus_override_if_set` is `add`) |
   | vq channel algebra with neutral and floor | `vq-channels.ts`, `direction-track.ts` | the per-field fold declaration |
   | pronunciation layer priority (#214) | `g2p/index.ts` | `first_defined` list |
   | Direction Track composition precedence (#212) | `input/parse.ts`, `input/direction-track.ts` | overlay operator (decision 5) |
   | voice field mapping | `dectalk-voice.ts:104-138` | voice document schema plus overlay |
   | DECtalk controller clock | `lowering.ts` | `dectalk-english` rule (attribute model decision 3) |

9. **Four coordinate systems, four names.** The word "span" names four
   things in the repo today, and #142 already ruled that coordinate systems
   stay explicit and never substitute for one another. The names:

   | name | coordinates | owner | today |
   |---|---|---|---|
   | document span | document role, key path, line and column in YAML | compiler | does not exist: `yaml-loader.ts` uses `js-yaml` `load`, which drops positions; `rule-pack.ts` tracks origin per file only (`MAP_ORIGINS`, `RULE_ORIGINS`) |
   | source span | half-open UTF-16 offsets into the score | recognition (#142) | exists; `source-recognition.ts` |
   | anchor | token, word, phrase, or syllable index range into the score | Direction Track | exists; `direction-track.ts` `AnchorRange`, resolved by `parse.ts` `resolveAnchor` |
   | interval | marks on the temporal axis; frame-clock ranges | evaluator, lowering | exists; `temporal-axis.ts`; the transition caps and truncations of #164 |

   Attribute model decision 8's where-provenance is the document span, and
   it is the one that does not exist yet. It requires a position-preserving
   parse; every node of the loaded document graph carries one, and every
   reference error and every provenance record points at one. A Direction
   Track span is an overlay (decision 5) with an anchor: global affect is an
   overlay anchored to the whole utterance, a local span is an overlay
   anchored to a range, a voice is an overlay anchored to the request.
   Overlapping anchors compose by the field's declared fold, with declared
   precedence as the tiebreak; that is the declaration #212 is auditing for.
   A lowering interval becomes a Transition item's duration (attribute model
   decision 3), so a cap is a `min` fold with a declared floor, written and
   traced, which is what #164 asks to see.

## Not being built, and why

- **CUE, or any schema language, as a runtime dependency.** Two of its
  ideas are taken: unification is the overlay operator, and references are
  declared keys. The schema vocabulary here is twelve words and fits in YAML
  with a fixed grammar; a general lattice language would let a frontend
  author express constraints the compiler cannot explain in provenance.
- **JSON Schema `$ref`.** Structure only; it cannot say that a string must
  be a key in another document.
- **A database.** The document graph is loaded once, immutable, and small.
  Foreign keys are checked at compile, not enforced at write.
- **Zod for the speech schema.** Zod may parse the compiler's own document
  grammar (the simplification plan's phase 3.4), because that grammar is
  fixed. The speech schema is data and is validated by the compiler, not by
  a TypeScript type.
- **A `language` item type or relation.** Language is a package boundary,
  not a graph node. Nothing in the utterance changes.

## Evidence

Counted on master `72df9d66`, 2026-09-08.

| measure | value |
|---|---|
| segment features hardcoded in `buildUtteranceSchema` | 40 |
| item types, relations hardcoded there | 12, 14 |
| engine built-in speech functions | 13 |
| `loadYaml*` or dictionary-load call sites in core outside loaders | 24 in 11 files |
| import-time loads in core | 6 (`transcribe-text.ts:83`, `rule-pack.ts:696`, `rd-policy.ts:28`, `vq-channels.ts:78`, `affect-presets.ts:131`, `track-analysis.ts:131,499`) |
| cross-document references checked by hand | 11 kinds in 7 files |
| `validation.ts` | 3,936 lines, 59 error codes |
| core files (of 97) naming `phoneme` / `voice` / `stress` / `syllable` | 26 / 23 / 22 / 16 |
| inventory lines, three frontends | 4,911 |

## What #141 becomes

#141 as filed moves files and threads ten documents through core as named
slots. Under this model it is decision 3 and nothing else: declare
`resources:`, build the one resolver, delete the six import-time loads and
every `DEFAULT_*_PATH`, move the files under their owners. The ownership
test needs no exception list once decision 6 lands; until then it lists
`dectalk-english`'s stress policy as the one known cross-package reference.
#78 then threads one asset root through one resolver.

## Sequencing

Interleaved with the attribute model's sequence; each step is gated on
byte-identical goldens.

1. `schema:` in the frontend document; `buildUtteranceSchema` deleted; the
   compiler validates rules against the declared schema, which it already
   does against the TypeScript one. (decision 1)
2. `resources:` and the one resolver; #141 reshaped to this. (decision 3)
3. `ref:` on schema fields and the generic checker; hand checks deleted one
   reference at a time. (decision 4)
4. Navigation kernels `parent`, `daughters`, `siblings`; the thirteen
   built-ins become function features; `nucleus_types` has one reader.
   (decision 2)
5. One overlay operator; voices and affect presets go through it; the
   speaker profile composition becomes `first_defined`. (decision 5)
6. The `english` package and the #74 row. (decision 6)
7. Core vocabulary check in CI. (decision 7)

## Citations by decision

| Decision | Source | In `papers/` |
|---|---|---|
| 1, 2 | Taylor, Black & Caley 1998 (Festival: feature functions, relation schema) | yes |
| 1 | Sproat 1998, Multilingual TTS (Bell Labs: declarative lexicon and schema) | retrieve |
| 3, 4 | Bacon IR registry and graph validation, `docs/host-contract.md` | n/a |
| 5 | Hertz 1999, ETI-Eloquence (voice and language filters as overlays) | yes |
| 6 | Hertz 1999; Sproat 1998 (language modules separate from voices) | yes / retrieve |
| 7 | Black & Lenzo 2001, Flite (compiler emits data; engine is noun-free) | retrieve |
