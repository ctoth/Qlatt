# P3 Foundation — Frontend Architecture Recommendation

Status: 2026-06-29. Synthesizes `10-sota-control-surface.md` (input contract) and
`11-sota-frontend-architecture.md` (internal IR) into ONE coherent FE design for the
clean-room beautiful synth. Both grounded in SOTA + the paper library, not armchair.

## The unifying thesis: one substance, three representations

The input contract and the internal IR are the *same pattern* at two altitudes:
**everything expressive is a typed, cited, traceable object** — a `DecisionRecord`
(`src/provenance.ts` schema: `{stage, type, subject, reason, citations[], parents[]}`).

- A **direction** (input) is a DecisionRecord.
- An **HRG feature-write** (internal) is a DecisionRecord.
- A **provenance node** (output) is a DecisionRecord.

So the whole frontend, from input to IR to audit trail, is ONE substance flowing through
three representations:

```
  SCORE + DIRECTION TRACK   →   PROVENANCE-STAMPED HRG   →   KLATT 5 ms FRAME TRACK
  (clean text + typed,          (one item pool, many        (flat; the synth's input;
   aligned, cited modifiers)     relations; every write       produced by ONE final
                                 a cited DecisionRecord)       lowering pass)
```

Both halves have proven ancestors **on Klatt-family formant synths, 1987–1990**: the input
side is **Cahn's Affect Editor** (1990, DECtalk — clean text + ~17 structured affect/VQ
params); the IR side is **Hertz's Delta** (1987 — multi-stream relation IR driving a Klatt
synth). We are modernizing two proven ideas and fusing them with provenance.

## 1. Input contract — clean SCORE + separate DIRECTION TRACK

Architecture **(b)** with **(c)** as its empty base case; inline markup **rejected** as the
source of truth (kept only as an optional serializer the parser immediately lifts).

- **The score:** plain text, no markup. Diffable, re-translatable, and — decisively for Q —
  AT-friendly (W3C documents inline markup as hostile to blind authors/consumers).
- **The Direction Track:** a separate declarative layer (same medium as our rule phases) of
  **typed, aligned, relative-to-neutral modifiers**:
  - **Global state** (= the (c) base case): one record/utterance — voice/timbre identity
    (separable) + a global affect state authored as a **named categorical preset + continuous
    degree** (Azure `styledegree` / Alexa `intensity` pattern). Empty ⇒ neutral render.
  - **Local overrides:** optional spans anchored by token/word/phrase/phoneme range —
    emphasis, break, local pitch/rate/voice-quality deltas, and named **performance gestures**
    (a cited library à la Loquendo "expressive cues": sigh, laugh, creak-onset), with explicit
    span precedence so composition is *defined*, not folklore.
- **Affect representation:** categorical-preset *surface* → compiles to a **dimensional
  (valence/arousal/dominance) + voice-quality vector** *core* (Schröder/Gobl) — the
  explainable, rule-drivable substrate. Store BOTH on the record (EmotionML's
  parallel-vocabulary pattern): author's label *and* engine substrate both traceable.
  Cited from Murray_1993 Table I, Banse_1996, Rutledge_1995 Tables 3–4, Gobl_2003, Scherer.
- **Everything is a delta over a neutral baseline** (Rutledge multiplicative style-vectors;
  HAMLET rules as final stage) — engine-independent, explainable.

## 2. Internal IR — a provenance-stamped Heterogeneous Relation Graph (HRG)

The working IR for ALL linguistic/prosodic/affective stages. NOT a flat mutated track
(destructive; provenance becomes a fragile side-log) and NOT rigid typed-lowering (prosody
is inherently cross-level; would reinvent a graph via back-pointers).

- **One item pool, many relations.** An item (word/syllable/segment/intonation event) is a
  feature bundle; the **same item lives in several relations at once** (a segment is in the
  flat `Segment` list *and* a leaf of the `SylStructure` tree) — no copying, shared identity.
- **Relations:** `Token · Word(POS, given/new) · Syllable(stress) · Segment(allophone) ·
  SylStructure(tree: word→syl→seg, the backbone) · Transition(Hertz Model-3 units) ·
  Intonation(accent/boundary, ToBI label as a provenance handle only) · Tilt(amp/dur/tilt
  per event) · PhraseCommand(Fujisaki declination) · Affect(OQ/TL/AH/jitter directives)`.
- **Navigation = feature-function pathnames** (`R:SylStructure.parent…`, `n.`, `daughtern.`,
  `R:<Rel>.`). Qlatt's existing `prev`/`next`/`ahead`/`look_back_where` ARE these operators.
- **Append-mostly + write-stamped:** every feature-write carries `{value, ruleId, reason,
  citations[], parents[]}`. **The HRG and the provenance DAG become two views of one
  structure** — provenance is the graph's edges, not a side-log that can drift. This is the
  single most important adaptation, and the one thing Festival lacks.
- **One final lowering pass:** project the leaf `Segment`/`Transition`/`Intonation`/`Affect`
  relations into the flat 5 ms Klatt frame track (DISCON/SETSMO smoothing, Tcf/Bper boundary
  blends). The only place a flat track exists, and it's the synth's input.

**Festival HRG: adopt / adapt / reject**
- ADOPT: item/relation/shared-identity model; the `SylStructure` tree backbone; pathname
  navigation; incremental enrichment (modules add relations, never rewrite); sub-segmental
  items (aspiration/transition/burst as their own items — from Delta).
- ADAPT: provenance-stamp every write (fuse graph + DecisionRecord DAG); typed item schemas +
  CEL instead of stringly-typed features + Scheme/CART; two-layer prosody (below); a single
  final lowering instead of per-module waveform coupling.
- REJECT: Scheme/CART/statistical runtime (opaque, uncited); mutable untyped features;
  Merlin-style dense full-context label flattening (lossy, discards graph+provenance);
  DOM/XML-as-working-structure (single-parent nodes can't be in a list AND a tree).

## 3. Prosody — two cleanly separated layers (both explainable)

1. **Symbolic placement** on the `Intonation` relation: accent/boundary from POS + given/new
   focus + syntax (O'Shaughnessy + Strom_2002 features), tagged with a ToBI-style categorical
   label **as a provenance handle only** (never drives audio — sidesteps Ladd_2021's
   ToBI-reliability problem).
2. **Phonetic realization:** a **Fujisaki phrase command** per intonational phrase for global
   declination/arc (cite `Fujisaki`) + **Tilt parameters** (amplitude/duration/tilt) per local
   accent/boundary event (cite `Taylor_2000`). Continuous params drive the F0; the categorical
   label only annotates. All three coexist as items on the graph without overwriting.

## 4. Engine-reuse verdict (Q's "reuse nothing" boundary)

**Reuse the toolchain; replace the IR; write all-new content.** Specifically:
- **REUSE** the declarative rule-engine *framework* — the CEL evaluator, the rule-phase
  processor, the `ProvenanceCollector`/`DecisionRecord` plumbing. It's a "language," not an
  "engine"; rebuilding it is months for no gain. Report `11` confirms the fit: our existing
  `prev/next/ahead/look_back_where` navigation *becomes* HRG path operators, and the
  DecisionRecord schema is exactly what HRG write-stamping needs.
- **REPLACE** the engine's internal data structure: from the current flat token-stream/track
  model to the **provenance-stamped HRG**. This is a real, substantial change to the engine's
  core — not a lazy reuse — and it's what makes the whole thing explainable-by-construction.
- **WRITE FRESH** (clean-room, per Q): all inventory, rule phases, semantics, the affect
  preset library, the prosody rules. Zero reuse of the old engines' rule content.

So "reuse nothing" holds for the *synth* (new content end to end); we reuse a *toolchain*
(CEL + provenance) the way one reuses a programming language — and even that gets a new IR.

## 5. The FE pipeline, restated as graph enrichment

Each stage ADDS items/relations/features to the one shared HRG; nothing overwrites:
0. Intent ingestion — score → `Token`; Direction Track → global state + span items.
1. Linguistic — normalize, G2P (dict+LTS), syllabify, stress, POS, given/new, phrasing →
   `Word`/`Syllable`/`Segment`/`SylStructure`.
2. Segmental realization — inventory lookup → formant/source targets; postlexical allophony;
   conventional coarticulation (solitons shelved); `Transition` items.
3. Duration — Klatt-1976 rules (multiplicative %), pre-boundary lengthening.
4. Prosody — §3 two layers → `Intonation`/`Tilt`/`PhraseCommand`.
5. Affect & voice quality — Direction global state + spans → V/A/D+VQ → `Affect` directives
   (five-factor Rd, brilliance, France formant/BW deltas).
6. Gender/speaker transform — nonuniform female scaling + source bundle (seam to the separate
   speaker-personality project).
7. Lowering — single pass: leaf relations → 5 ms Klatt frame track + sample-accurate events.

## Next
P3 detail: schema the HRG relations + item types; spec the Direction Track format; pick the
final-lowering smoothing constants. Then the engine IR-swap (flat-stream → stamped HRG) is the
first concrete FE build task. (Parallelizable with P2 backend / the source bake-off.)
