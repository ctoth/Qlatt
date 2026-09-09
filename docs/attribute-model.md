# The attribute model

Status: design decision, 2026-09-08. Owner: Q. This document records the
target shape of the frontend rule engine and lowering, the reasons, the
evidence that sized it, and the things deliberately not being built. It is
the reference for the packaging umbrella (#74), the native umbrella (#83),
and the residual-policy children of #46 that touch rounding, profile roles,
and pronunciation layers (#206, #207, #214).

## The one-sentence version

Every value the synthesizer produces is an attribute on a typed item at some
clock, defined once by a cited CEL expression or a cited kernel over other
attributes, and computed on demand.

The backend already works this way. `semantics.yaml` is a set of cited
definitions with declared dependencies, evaluated in topological order by
`src/semantics/topological-evaluator.ts`. The frontend does the same job with
phase-ordered mutation, transactions, an undo log, replay, and hand-placed
provenance calls. This document brings the frontend to the backend's model.

## Decisions

1. **Function features, not stored copies.** An item feature that can be
   derived from other features is a definition, not a write. The end time of
   a word is the end time of its last segment and is never stored. Taylor,
   Black & Caley 1998 list this as a design goal of Festival: "no redundancy
   or duplication of information."

2. **Clocks are relations on the temporal axis.** Word, syllable, and segment
   are event clocks. Frame is a periodic clock at the lowering interval.
   Sample is a periodic clock at the audio rate. The existing temporal-axis
   marks are the sync marks of Hertz 1985. Lowering is the segment relation
   resampled onto the frame clock with the Holmes kernel. The interpreter's
   ramp-versus-step choice is the frame clock resampled onto the sample clock
   with a linear or hold kernel. These are the same operation with different
   cited kernels.

3. **Frames and transitions are items.** A Frame item type on the frame
   clock, related to its Segment, replaces the per-frame sub-steps inside
   `lowerToFrames` with scalar rules over `frame.segment` and `frame.time`.
   Transitions are items in the segment relation with their own duration,
   following Hertz 1991's finding that transitions are durationally stable
   while steady states stretch. The DECtalk controller-clock projection
   currently in core lowering becomes a dectalk-english rule, as the #74
   placement rule requires.

4. **Multi-writer fields declare a fold.** The four scalar ops add, mul,
   max, and min are commutative monoids, so tagged contributions to a field
   fold in any order. The kernels are cited: Klatt 1976 (product around an
   incompressible floor), van Santen 1994 (sums of products), Fujisaki
   (sum through filters), Öhman 1966 (consonant perturbation over a
   vowel-to-vowel trajectory). A field declares its fold and its floor in the
   relation's scalar declaration; rules contribute terms.

5. **Ordered composition is explicit, not implied by phase order.** Some
   fields pass through a chain of non-commutative maps on the same item. In
   qlatt-english, vowel F1 and F2 pass through reduction, then rate
   undershoot, then coronal fronting, each an affine map. That is not a fold.
   A field that needs ordered composition declares the order by name. Phases
   survive only as this construct and as the ordering of structure
   derivation.

6. **Structure derivation uses three cited kernel kinds.** Regular
   transducers for normalization and tone grammars (Pierrehumbert 1980,
   Ebden 2015, Kaplan & Kay 1994), classification trees for duration and LTS
   (Riley 1990, Black 1998), and lexicon lookup with `first_defined` over
   lexicon, morphology, and LTS (Carlson 1975). Pronunciation layer priority
   (#214) is declared as that `first_defined` list.

7. **Conflicts resolve by specificity, declared priority, or compile error.**
   Two `set` writers whose selection conditions can overlap on the same item
   must have a declared order or the rulepack fails to compile. Disjoint
   conditions are not a conflict. The existing `!has(current.field)` guards
   are the manual form of declared priority and remain valid.

8. **Evaluation is demand-driven and memoized, with one generic
   accumulator.** The evaluator is generic over what it accumulates alongside
   the value. Accumulating rule identifiers gives the provenance DAG the
   collector builds by hand today. Accumulating nothing gives the value. This
   is the smallest form of Green, Karvounarakis & Tannen 2007: the same
   evaluation, parameterized. Where-provenance in the sense of Buneman,
   Khanna & Tan 2001, which YAML document span a number was copied from, is carried
   through every compile step as a document span, because it does not survive
   rewriting otherwise.

9. **TypeScript is the compiler, the native engine is data-driven.** The
   validator, macro expansion, and the checks above run once at compile time
   and emit a checked rulepack. A native host consumes the checked form and
   never sees the DSL. This is the Festival-to-Flite split of Black & Lenzo
   2001. It also retires #85 as a runtime concern: hosts consume a checked
   expression form, not CEL text.

10. **Overlays are one mechanism.** A package `extends` a parent by
    overriding definitions. A variety (#167), a voice, and an affect preset
    are overlays of the same kind at different granularity. Hertz 1999's
    separation of language-universal timing and voice filters from
    language-specific inventories is the precedent.

## Not being built, and why

The following were considered on 2026-09-08 and rejected on evidence. They
are recorded so nobody re-derives them.

- **A tabled or fixpoint Datalog evaluator for cycles.** The audit found zero
  cycles in all three bundled frontends. Topological evaluation with a
  compile-time circularity error is sufficient. If a real cycle ever appears,
  Chen & Warren 1996 is the reference.
- **An argumentation framework for rule conflicts.** Every multi-writer
  field in the bundled rulepacks resolves by disjoint conditions, a `has()`
  guard, phase order, or ordered composition. Decision 7 covers all of them.
- **An SMT solver for condition disjointness.** Syntactic subsumption over
  the type and phoneme conditions actually used is enough.
- **Contexts with lifting rules for voices and varieties.** Override files
  are what every shipped TTS system uses and what `extends` already is.
- **Actual causation, subjective logic, PROV export.** Explain-tool polish.
  Not on any roadmap.

## Evidence

`scripts/audit-rulepack-conflicts.ts` loads each bundled rulepack through
the real compiler and reports same-field writers by op class and cross-item
reads of computed fields by writer phase. Run on 2026-09-08:

| frontend | rules | fields | one writer | set then fold | multi-set | cross-item reads | same phase |
|---|---|---|---|---|---|---|---|
| qlatt-english | 110 | 44 | 21 | 9 | 14 | 33 | 10 |
| qlatt-beauty | 111 | 44 | 20 | 9 | 14 | 35 | 10 |
| dectalk-english | 110 | 61 | 43 | 0 | 18 | 93 | 66 |

Reading qlatt-english's fourteen multi-set fields by hand: most F1, F2, F3,
SW, and breakIndex writers select disjoint segment types or phonemes;
durationFloor uses a `!has()` guard; nasalPlaceIndex is specific-after-general
by phase; vowel F1 and F2 are ordered composition (decision 5); duration_cap
and speech_rate_scaling use `set` with a self-referential formula where a
fold op is the semantics (tracked separately). The ten same-phase cross-item
reads come from three rules: Hertz nucleus timing reading the tail
consonant's duration, nasal murmur reading the target vowel's formants, and
VCV coarticulation reading the previous vowel's formants. None is cyclic.
dectalk-english's count is inflated by neighbour `stress` reads, where
`stress` comes from the lexicon and is rewritten by a later fallback rule.

## Citations by decision

| Decision | Source | In `papers/` |
|---|---|---|
| 1 | Taylor, Black & Caley 1998, Festival architecture | yes |
| 2 | Hertz 1985, 1987 (sync marks); Goldsmith 1976 (association, WFC) | yes |
| 3 | Hertz 1991 (transitions), Hertz 1992 (nucleus timing) | yes |
| 4 | Klatt 1976; van Santen 1994; Fujisaki; Öhman 1966 | yes |
| 5 | engineering decision from the audit | n/a |
| 6 | Pierrehumbert 1980; Ebden 2015; Riley 1990; Black 1998; Carlson 1975 | yes |
| 6 | Kaplan & Kay 1994; Mohri 1997; Daciuk et al. 2000; Sproat 1996 | retrieve |
| 8 | Green, Karvounarakis & Tannen 2007; Buneman, Khanna & Tan 2001 | copy from `../provenance-semiring/papers` |
| 8 | Amsterdamer, Deutch & Tannen 2011 (aggregate provenance) | retrieve |
| 8 | Johnsson 1987 (lazy attribute evaluation); Knuth 1968 | retrieve |
| 9 | Black & Lenzo 2001, Flite | retrieve |
| 10 | Hertz 1999, ETI-Eloquence | yes |
| lineage | Coleman 1992, 1994 (YorkTalk); Local & Ogden 1997; Ogden et al. 2000 (ProSynth) | retrieve |
| frontier | Fowler 1980; Browman & Goldstein 1992 | yes |

## Sequencing

1. `rulepack compile`: a TypeScript command that emits the checked rulepack
   with macros expanded, document spans preserved, and decisions 5 and 7 enforced.
2. Frame items and a frame phase; lowering sub-steps become rules; the
   DECtalk controller clock moves to dectalk-english.
3. Folds declared per field; `set` writers that are folds in disguise
   converted.
4. Generic accumulator in the evaluator; hand-placed provenance calls in the
   rule engine removed once the traces match.
5. Transitions as items.
6. Native engine over the checked rulepack (#89 and the later frontend item
   in #83).

#206 (rounding and incompressibility policy), #207 (profile roles and pause
eligibility), and #214 (pronunciation layer priority) land as declarations in
the forms above, not as YAML knobs read by imperative code.
