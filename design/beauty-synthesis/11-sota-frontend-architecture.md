# 11 — SOTA Frontend Architecture & Intermediate Representations

*Research brief for the explainable, rule-based Klatt-style frontend: a "compiler" from intent (text + expressive direction) to a Klatt control-frame track, where every decision is a cited, traceable declarative rule.*

The crux question is **the IR** — the internal data structure(s) that the linguistic, prosodic, and affective stages operate on. Everything else (which rules, which citations) is downstream of getting that structure right. This brief surveys the classic best-in-class frontends, lays out the three candidate IR families, explains Festival's Heterogeneous Relation Graph (HRG) in depth, covers symbolic prosody-from-text, ties each IR choice to provenance, and ends with one concrete recommendation.

---

## 1. Classic best-in-class frontend architectures

All the canonical rule-based systems share the same coarse shape Klatt drew in his 1987 review: `TEXT → analysis routines → ABSTRACT LINGUISTIC DESCRIPTION → synthesis routines → SPEECH` (`Klatt_1987_TTS_Review`, Fig. 1). The interesting differences are in *how the abstract linguistic description is represented* and *how many discrete passes mutate it*.

### MITalk (Allen, Hunnicutt, Klatt 1987)
The reference pipeline, and the most fully documented (`Allen_1987_MITalk_TTS`). Strictly staged, module-per-pass, each module a named FORTRAN program writing a serialized representation the next reads:

```
FORMAT → DECOMP → PARSER → SOUND1 → PHONO1 → PHONO2
       → PROSOD → F0TARG → PHONET → CWTRAN → COEWAV
```

- `FORMAT` text normalization; `DECOMP` morphological decomposition against a ~12k-morph lexicon; `PARSER` an ATN phrase parser; `SOUND1` morphophonemics + letter-to-sound + cyclic stress.
- `PHONO1/PHONO2` add syntactic markers, pauses, and allophonic recoding (flapping, velarized-L, glottalization).
- `PROSOD` runs the **10 duration rules** (`DUR = MINDUR + (INHDUR−MINDUR)·PRCNT/100`, percentage composed multiplicatively across rules — the model that explains 84% of DHK's duration variance).
- `F0TARG` builds the F0 contour from POS-derived accent levels (Table 10-1), declination, and continuation rises.
- `PHONET` emits ~20 control parameters every 5 ms, using locus theory and the DISCON/SETSMO/SMODIS/DISSMO transition templates with `Tcf` smoothing and `Bper` boundary-blend constants.

The IR here is essentially a **growing array of segment records** carried forward and progressively annotated, then flattened to a parameter track in `PHONET`. There is no cross-level graph: syllable/word/phrase structure exists only as *markers interspersed in the segment string*.

### Klattalk / DECtalk (Klatt 1982)
Same skeleton, leaner (`Klatt_1982_KlattalkTTS`): formatting → 1500-word exceptions dictionary → ~500 Hunnicutt letter-to-sound rules → stress rules → crude comma/keyword syntactic analysis → a phonemic string with stress (`'`) and phrase (`/`) marks → phonological component (stress, segmental phonology, **hat-pattern F0**, duration) → phonetic component (targets, transitions, voicing-onset delay, burst attachment) → 20-parameter synthesizer. The IR is an annotated phoneme string; prosody is computed by walking that string. DECtalk is the productized Klattalk and the intelligibility high-water mark of the era (97% MRT, `Klatt_1987_TTS_Review` Table VII).

### Festival / Festvox (Black, Taylor, Caley)
The architectural break from MITalk. Instead of a segment string with interspersed markers, Festival represents an utterance as a **Heterogeneous Relation Graph**: one pool of *items* (words, syllables, segments, intonation events) tied together by multiple named *relations* (lists and trees), each module **adding** relations and features rather than rewriting a flat buffer ([Utterance structure](http://zeehio.github.io/festival/doc/Utterance-structure.html); [festival_14 manual](https://www.cstr.ed.ac.uk/projects/festival/manual/festival_14.html)). This is the model detailed in §2c/§3. Festival is the SOTA *structural* choice and the one most relevant to us.

### Flite
A small C reimplementation of Festival's runtime (`cst_utterance` / `cst_relation` / `cst_item`). Same HRG model, no Scheme, designed to be embeddable. Proof that the HRG abstraction is cheap enough for a tight C/WASM runtime — relevant because our engine is WASM-backed.

### Merlin frontend
Merlin is a neural *acoustic* backend; its "frontend" is Festival/Festvox producing HTS-style **full-context labels** — the HRG flattened into a fixed-width, per-phone feature vector (quinphone identity + positional/stress/accent counts) that a DNN consumes frame-by-frame. The lesson for us is negative: the flattening to a dense context vector is a *lossy projection* of the HRG done specifically to feed a statistical model. It throws away the graph and the provenance. We want the opposite — keep the graph, flatten only at the very end into Klatt frames.

### MaryTTS
Modular Java server; the IR is a single **MaryXML** document progressively enriched by each module (TextToMaryXML → tokeniser → POS/chunker → pronunciation/G2P → intonation labels → `AcousticModeller` → `RealisedAcoustparams`) ([Architecture walkthrough](https://marytts.github.io/documentation/module-architecture.html); [MaryXML](https://marytts.github.io/documentation/maryxml/index.html)). MaryXML is essentially an HRG serialized as a DOM tree: SSML-compatible tags at the top, increasingly low-level synthesis tags deeper. The important idea is **one document, enriched in place, never thrown away** — close to what we want, but XML/DOM makes the multi-parent cross-relations (a segment that is simultaneously in a Segment list and a syllable tree) awkward, because a DOM node has exactly one parent. HRG does not have that limitation.

### eSpeak-NG
The lightweight end of the spectrum. Pipeline: text parser (clauses) → dictionary/rule text-to-phoneme → `MakePhonemeList` (adds stress, intonation, length) → formant/Klatt-ish synthesizer ([phonemes.md](https://github.com/espeak-ng/espeak-ng/blob/master/docs/phonemes.md); [intonation.c](https://gitlab.e.foundation/e/os/espeak-ng/-/blob/master/src/libespeak-ng/intonation.c)). The IR is a **flat phoneme list with per-phoneme stress/length/pitch fields**, plus per-clause "tunes" selected by punctuation. Internally phonemes are feature bundles (articulatory 3-letter features), not IPA. This is the modern descendant of the Klattalk annotated-string model: fast, compact, but prosody is shallow and there is no structural graph and no provenance.

**Summary of the spectrum.** Annotated flat string (MITalk, Klattalk, eSpeak) → enriched single document (MaryXML) → relation graph (Festival/Flite) → lossy dense projection for ML (Merlin labels). The trend over 40 years is *away from a mutated flat buffer and toward a persistent, multi-level, incrementally-enriched structure*. That trend is exactly what an explainability mandate would predict.

---

## 2. THE intermediate representation question (the crux)

Three IR families are on the table. They are not mutually exclusive — the recommendation in §5 combines two.

### (a) Flat parameter "track" that each stage mutates
A single time-indexed array of control frames (or a per-segment record array) that every stage reads and overwrites. This is the MITalk `PHONET` buffer and eSpeak's phoneme list.

- **Pros:** trivial to lower to the synthesizer (it *is* the synthesizer's input); cache-friendly; easy to reason about timing.
- **Cons, fatal for us:** mutation is destructive. After PROSOD multiplies a duration by 0.7 and then again by 0.85, the buffer holds `0.595×` and *no record of the two rules that produced it*. Provenance has to be bolted on as a side-log, and the side-log can silently diverge from the buffer. There is no place to hang word/syllable/phrase structure, so prosody rules that need "is this the nuclear-accented syllable of the intonational phrase?" must re-derive structure from interspersed markers every time. This is the representation our explainability principle (`AGENTS.md` §1) is specifically trying to escape.

### (b) Typed multi-IR "lowering" (compiler-style)
Distinct, immutable, typed IRs with explicit lowering passes, like LLVM: `LinguisticIR (words, POS, syntax) → SegmentalIR (phones, allophones, syllable structure) → ProsodicIR (accents, boundaries, F0 targets, durations) → AcousticTrack (Klatt frames)`. Each pass is a total function `IR_n → IR_{n+1}`.

- **Pros:** types make stage contracts explicit; immutability means each lowering is auditable (diff input vs output); maps cleanly onto "compiler from intent to track," which is literally the project's framing.
- **Cons:** the staging is *too rigid for prosody*. Prosody is not a clean downstream lowering — it needs simultaneous access to words (for information structure/POS), syllables (for stress/accent docking), segments (for duration and F0 target timing), and the emerging F0 contour itself. A strict `Linguistic → Segmental → Prosodic` lowering forces you to either (i) copy huge amounts of upstream context into each IR, or (ii) keep back-pointers — at which point you have reinvented a relation graph badly. Strict lowering also fights coarticulation and microprosody, which are inherently cross-level (a segment's formant target depends on neighbors in the *segment* relation while its duration depends on its position in the *syllable/word/phrase* relations).

### (c) Relation graph — Festival's HRG *(the strong candidate)*
**One pool of items, many relations.** From the Festival docs: *"the basic building block… is the utterance, which consists of a set of relations over a set of items. Each item represents an object such as a word, segment, syllable, etc., while relations relate these items together"* ([Utterance structure](http://zeehio.github.io/festival/doc/Utterance-structure.html)). The formalism is Taylor, Black & Caley, *"Heterogeneous relation graphs as a formalism for representing linguistic information,"* Speech Communication 2001 ([ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0167639300000741)).

**Items.** An item is a feature bundle (key→value, e.g. a segment's `name`, `ph_vc`, duration). Crucially **the same item appears in several relations at once** — a segment item is a member of the flat `Segment` list *and* a leaf of the `SylStructure` tree. There is no copying; relations share item identity.

**Relations.** Each relation is a graph (list, tree, or multi-linear) over items:
- `Word` — flat list of words.
- `Syllable` — flat list of syllables.
- `Segment` — flat list of phones.
- `SylStructure` — a *tree*: word → its syllables → their segments. This is the backbone linking the three flat lists.
- `Intonation` / `IntEvent` — intonation events (accents, boundary tones) docked onto syllables.
- Modules may **define new items and relations at run time**; "the architecture is fully general… new modules may use any relations they wish."

**Navigation = feature-function pathnames.** The power move. From any item you reach any related item by a dot-path that mixes traversal operators and relation switches ([festival_14](https://www.cstr.ed.ac.uk/projects/festival/manual/festival_14.html)):
- traversal: `n.` (next), `p.` (prev), `nn.`/`pp.`, `parent.`, `daughter1.`/`daughtern.`, `first.`/`last.`
- relation switch: `R:<RelationName>.` jumps the item into another relation and continues from its position there.

So `R:SylStructure.parent.name` reads *the word that owns this syllable*; `R:SylStructure.parent.R:Word.n.name` reads *the next word after this syllable's word*; `R:SylStructure.daughtern.ph_vc` reads *a phonetic feature of the last segment in this syllable*. A prosody rule asking "am I the stressed syllable of a phrase-final word?" is a few path lookups, not a re-parse.

**Why this is powerful for linking words↔syllables↔segments↔F0 targets.** Because the links are *first-class and persistent*. An F0 target item can be docked to a syllable via an `Intonation` relation while that syllable simultaneously knows its segments (for timing the target at the nucleus midpoint, exactly as `Hertz_1987_DeltaNonLinearPhonology` places F0 "halfway through each syllable nucleus") and its word (for accent assignment). No stage destroys another stage's structure; each module **adds** a relation. The representation is **append-mostly and multi-level**, which is precisely the autosegmental insight (Goldsmith 1976) made into a data structure.

**Is HRG the right model for an explainable rule-based frontend?** Structurally, yes — with one large caveat. HRG is the right *skeleton*: multi-level, persistent, navigable, incrementally enriched. But **vanilla Festival HRG has no provenance**. Item features are plain mutable key→value pairs; a feature can be overwritten; there is no record of *which rule wrote `dur=0.087` and why*, no citation, no parent-decision link. Festival's feature functions are read-only navigation, not write-tracking. So HRG gives us the structure provenance wants but not provenance itself. That gap is the whole design opportunity (§4, §5).

### Historical proof point: Hertz's Delta
Before Festival, Susan Hertz's **Delta** system (`Hertz_1987_DeltaNonLinearPhonology`) made the same bet for a *formant* synthesizer specifically. Delta represents an utterance as multiple synchronized **streams** (phrase, word, morph, phoneme, CV, nucleus, syllable, tone, F0, duration) aligned at **sync marks**:

```
syllable: |   syl   |   syl     |    |      syl    |   syl  |
phoneme:  | m | u | s | o       |    | j | a  | b | i      |
tone:     |    L    |     H     | L  |             H        |
```

Delta is essentially an HRG specialized to *temporally-aligned* tiers (its relations are all "co-temporal with"), with a rule language whose conditions test across streams and whose actions `insert`/`delete` tokens in any stream — and it drove a Klatt-style synthesizer. Two Delta findings transfer directly:
1. **Sub-segmental items pay off.** Representing aspiration as its *own* token, not owned by stop or vowel, eliminated the perennial stop-segmentation argument and simplified transition rules (g→a is just C→V regardless of aspiration). HRG lets us add an `Aspiration` relation the same way.
2. **Transitions as first-class durational units** (Model 3) map cleanly to Klatt frames and to the MITalk `Tcf`/`Bper` smoothing constants. A transition is an item with duration but no segment identity.

Delta is the existence proof that a multi-level relation/stream IR is the *right* IR for rule-based formant synthesis, not just for concatenative/unit-selection TTS. HRG is the more general, less timing-coupled version of the same idea.

---

## 3. Prosody-from-text SOTA (symbolic & hybrid)

Prosody decomposes into (i) *where* events go (accent/boundary placement, symbolic) and (ii) *what shape* they have (F0 realization, phonetic). The best symbolic pipeline keeps these separate, which also keeps each explainable.

### Accent & boundary placement (the symbolic layer)
- **POS / word-class hierarchies (MITalk, O'Shaughnessy).** Content words (verbs, nouns, adjectives, adverbs — levels ≥6 in MITalk Table 10-1) get accents; function words don't. `OShaughnessy_1976_F0_Prosody` gives the practical accent hierarchy + declination rate. This is the cheap, fully-explainable baseline and still the backbone of rule-based placement.
- **Information structure / given-new.** `Strom_2002_TextToProsodyWithoutToBI` shows a *given/new* feature (focus stack over lemmatized content words) plus distance-to-sentence-end materially improves accent prediction — and that a data-driven CART beats hand rules 65%/35% in listener preference. The features are symbolic and rule-expressible even if Strom learned the weights.
- **Syntax-conditioned boundaries.** Phrase/clause boundaries from punctuation + function-word cues (MITalk PARSER, Klattalk's comma/keyword heuristic). Crude but robust; the explainable default.
- **ToBI as the labeling standard, AuToBI as the predictor.** ToBI (`Silverman_1992_ToBILabelingProsody`, `Beckman_2005_ToBISystemEvolution`) is the autosegmental-metrical (Pierrehumbert 1980) inventory: `H*`, `L+H*`, `L*`, phrase accents `H-`/`L-`, boundary tones `H%`/`L%`, break indices 0–4. AuToBI (Rosenberg 2010, [ISCA](https://www.isca-archive.org/interspeech_2010/rosenberg10_interspeech.pdf)) predicts these from acoustics+words (accent detection, accent-type classification, boundary detection/classification). For *synthesis from text* we run the prediction direction (text features → ToBI labels), which is the same feature set as the POS/given-new approach above.
- **The ToBI caveat.** ToBI's categorical distinctions are unreliable even between expert labelers (`Pitrelli_1994_ToBILabellingReliability`; `Ladd_2021_TroubleWithToBI` — especially `H*` vs `L+H*`). So use ToBI labels as *symbolic provenance handles*, not as the quantitative truth.

### F0 realization (the phonetic layer)
Three competing parametric models, all in the library:
- **Fujisaki command-response** (`Fujisaki_InformationProsodyModeling`). `log F0(t) = log Fb + Σ phrase-command·Gp + Σ accent-command·(Ga(t−T1)−Ga(t−T2))`, critically-damped 2nd-order responses, physiologically grounded (cricothyroid mechanics). **Superpositional** — global phrase/declination shape and local accents are *separate, additive* components. Excellent for declination and breath-group shape; commands are sparse and interpretable; α, β nearly constant across speakers, so only command timing/magnitude is language/speaker-specific.
- **Tilt** (`Taylor_2000_TiltModelIntonation`). Each intonational event reduced to 3 nearly-orthogonal continuous parameters: amplitude (total excursion), duration, tilt (−1 pure fall … +1 pure rise), plus a position parameter for peak alignment. Invertible (analysis ↔ synthesis), Festival-supported, and it captures the H*/L+H* alignment continuum that ToBI forces into brittle categories — directly answering Ladd's critique. RMSE ≈ RFC despite fewer parameters.
- **AM/ToBI target interpolation** (Pierrehumbert 1980). Sequence of H/L tonal targets on the syllable string, interpolated between. The phonological model underlying ToBI; less compact for synthesis than Tilt or Fujisaki.

**Best symbolic text→prosody approach (verdict for §3).** Two layers, cleanly separated:
1. **Symbolic placement** on the Syllable/IntEvent relation: accent/boundary from POS + given-new + syntax (O'Shaughnessy + Strom features), tagged with a ToBI-style categorical label *as a provenance handle only*.
2. **Phonetic realization** as a hybrid: a **Fujisaki-style phrase command** for the global declination/phrase arc (one explainable command per intonational phrase, citation `Fujisaki`), plus **Tilt parameters** for each local accent/boundary event (citation `Taylor_2000`). Store the continuous Tilt params *next to* the categorical ToBI label so the brittle categorical decision never drives the audio — it only labels it.

This split is itself an argument for the HRG IR: the symbolic layer lives as items in an `Intonation` relation docked to syllables; the phonetic layer is Tilt/Fujisaki parameter items docked to those events; declination is a phrase-level item. All three coexist without any stage overwriting another.

---

## 4. Provenance / explainability per IR choice

The test question (from the brief and `AGENTS.md`): *"why is F0 142 Hz here?"* and *"why is this vowel breathy?"* — and can the answer fall out of the IR rather than being bolted on?

- **(a) Flat track — provenance is bolted on and fragile.** The buffer holds only the final number. You must maintain a parallel `ProvenanceCollector` log keyed by (param, time) and *trust* that every mutation also logged. Any rule that writes the buffer without logging is an invisible hole. The IR actively fights you: it has nowhere to store "this 142 Hz is the sum of declination 130 + accent +12, accent docked to syllable 4 because it's the nuclear accent." Answering "why breathy" means correlating AH/AVS frame values back to whichever phonological rule set them, with no structural link surviving.

- **(b) Typed lowering — provenance is per-pass diffs.** Better: each lowering `IR_n → IR_{n+1}` is a function you can diff, so you can say "the prosodic pass set duration 0.087." But the *reason* (which upstream items, which rule, which citation) requires threading parent-pointers through every IR, and cross-level "why" questions ("breathy because phrase-final + tense-voice affect direction") span passes that have already discarded their inputs. You end up adding back-references — i.e. reinventing (c).

- **(c) Relation graph — provenance falls out naturally, *if* you stamp writes.** This is the decisive advantage. The HRG is **append-mostly and multi-level**, so a feature, once written, stays put and stays linked to the items it was derived from. Make every feature-write carry a `DecisionRecord` id and the IR *becomes* the provenance DAG:
  - Each item-field write = a `DecisionRecord { stage, type, subject: item, reason, citations[], parents: [items/decisions read] }` — exactly Qlatt's existing `ProvenanceCollector` schema (`src/provenance.ts`, `AGENTS.md` §1).
  - "Why is F0 142 Hz here?" → the F0 item at this time has a write-record: *declination phrase-command (Fujisaki) contributed 130, accent Tilt event docked to syllable `s4` contributed +12; syllable `s4` is accented because rule `content_word_accent` matched (POS=noun, given/new=new), citation O'Shaughnessy 1976 / Strom 2002.* The chain is just the parent links already in the graph.
  - "Why is this vowel breathy?" → the segment's `AH`/`OQ`/`TL` items each have write-records: *tense/lax or affect rule set OQ high because emotional direction = "tender", citation Klatt 1990 voice-quality*. The segment is reachable from the affect stage via `R:SylStructure.parent…`, so the affect rule's read-set is recorded as parents.

  Provenance is not a side-log that can drift; it **is** the edges of the graph. The HRG item-identity-shared-across-relations property is what makes the parent links cheap: the rule that read `R:SylStructure.parent.R:Word.pos` literally points at that word item.

**Conclusion of §4:** only the relation graph makes provenance *structural* rather than *bolted-on* — and only if we add the one thing Festival lacks: write-stamping. That is the core adaptation in the recommendation.

---

## 5. THE VERDICT — recommended IR + pipeline

**Use a provenance-stamped Heterogeneous Relation Graph as the working IR for all linguistic, prosodic, and affective stages, and lower it to the flat Klatt control-frame track exactly once, as the final pass.** Concretely, combine (c) inside and (b) only at the boundary; never (a) as a working IR.

### The architecture
```
intent (text + expressive direction)
   │   each stage ADDS items/relations/features to ONE shared graph;
   │   every feature-write is a provenance-stamped DecisionRecord
   ▼
┌─────────────────────────── PROVENANCE-STAMPED HRG ───────────────────────────┐
│ relations:  Token · Word(POS,given/new) · Syllable(stress) · Segment(allophone)│
│             SylStructure(tree: word→syl→seg) · Transition(Hertz Model-3 units) │
│             Intonation(accent/boundary items, ToBI label as handle)            │
│             Tilt(amp,dur,tilt per event) · PhraseCommand(Fujisaki declination) │
│             Affect(voice-quality directives: OQ,TL,AH,jitter…)                  │
│  every item-field carries: {value, ruleId, citations[], parents[]}             │
└────────────────────────────────────────────────────────────────────────────────┘
   │   ONE lowering pass: project leaf Segment + Transition + Intonation + Affect
   │   relations onto a 5 ms Klatt frame track (DISCON/SETSMO smoothing, Tcf/Bper)
   ▼
flat Klatt control-frame track  →  WASM synthesizer
```

### Why this and not the others
- **Against flat-track-as-working-IR (a):** destructive mutation makes provenance a fragile side-log and leaves nowhere to hang multi-level structure. Reject it as a *working* IR. Keep a flat track *only* as the final lowering target — which it must be, since it is the synthesizer's input.
- **Against pure typed-lowering (b):** prosody and coarticulation are inherently cross-level; rigid staged lowering forces context-copying or back-pointers (reinventing a graph). But *do* keep its one good idea: a single, clean, auditable lowering — applied **once, at the very end**, HRG → Klatt frames. That last pass is a genuine compiler lowering and the place where DISCON/SETSMO/SMODIS/DISSMO transition templates and `Tcf`/`Bper` smoothing live.
- **For HRG (c) inside:** it is the only IR where provenance is structural, where words↔syllables↔segments↔F0 targets stay linked across the whole pipeline, and where each rule both *selects* via path expressions and *emits* new items/features without clobbering prior stages. It is battle-tested (Festival, Flite, and — for formant synthesis specifically — Hertz's Delta).

### Where Festival's HRG is ADOPTED, ADAPTED, or REJECTED

**Adopt (take verbatim as concepts):**
1. **Item / relation / shared-identity model.** One item pool; an item lives in many relations simultaneously; relations are lists or trees.
2. **The `SylStructure` tree** as the backbone tying the flat `Word`/`Syllable`/`Segment` lists together.
3. **Feature-function pathname navigation** (`R:SylStructure.parent…`, `n.`, `daughtern.`, `R:<Rel>.`). This is the cleanest known syntax for cross-level rule conditions and should be the substrate our CEL conditions compile to (Qlatt rules already navigate with `prev`/`next`/`ahead`/`look_back_where` — these become HRG path operators).
4. **Incremental enrichment**: modules add relations, never rewrite a buffer. New relations definable at runtime so a new affect or voice-quality stage can introduce its own relation without touching others.
5. **Sub-segmental items** (from Delta, which HRG subsumes): aspiration, transitions, and bursts as their own items with duration but no phoneme identity — simplifies transition rules and burst attachment (PLSTEP) and matches our existing structural-rule kind.

**Adapt (the critical changes):**
1. **Make every feature-write provenance-stamped and append-mostly.** Each item field stores `{value, ruleId, reason, citations[], parents[]}`, mirroring `ProvenanceCollector`'s `DecisionRecord`. The HRG and the provenance DAG become two views of one structure — this is the single most important adaptation and the thing Festival entirely lacks. Disallow silent overwrite; a re-derivation creates a new versioned write whose `parents` include the prior value, so "why did X change?" is answerable.
2. **Typed item schemas + CEL, not untyped feature soup + Scheme.** Festival's features are stringly-typed and rules are Scheme/CART. Keep Qlatt's declarative YAML + CEL engine: rules `select` over relations by path and `apply`/`insert` items with mandatory `citations:` and `tag:`. Typed relations (Word, Syllable, …) give us schema validation Festival never had.
3. **Two-layer prosody on the graph** (from §3): symbolic accent/boundary items in `Intonation` (ToBI label as a provenance handle only), realized by `Tilt` event items + a phrase-level Fujisaki `PhraseCommand` for declination. Continuous params drive audio; the categorical label only annotates — sidestepping `Ladd_2021`'s ToBI-reliability problem while staying fully explainable.
4. **One final lowering**, not Festival's per-module waveform coupling: project the leaf relations to a 5 ms Klatt frame track in a single auditable pass.

**Reject:**
1. **Festival's Scheme/CART runtime and statistical models** — opaque, uncited, anti-explainable. We keep declarative cited rules.
2. **Mutable, unstamped, untyped features** — the very thing that makes Festival un-auditable.
3. **Merlin-style dense full-context label flattening** — a lossy projection that discards the graph and provenance; we flatten only to Klatt frames and only at the end.
4. **DOM/XML serialization as the working structure (MaryXML)** — single-parent DOM nodes can't cleanly express an item that is simultaneously in a flat list and a tree leaf; use a real multi-relation graph in memory, serialize to JSON/DAG for inspection.

### One-line statement of the recommendation
> A single **provenance-stamped Heterogeneous Relation Graph** (Festival's item/relation/path model, made append-only and `DecisionRecord`-stamped, driven by cited declarative CEL rules) is the working IR for all linguistic/prosodic/affective stages; **a single final lowering pass** projects its leaf relations into the flat Klatt 5 ms control-frame track. Adopt HRG's structure and navigation, adapt it by fusing the graph with the provenance DAG and a two-layer (symbolic-placement + Tilt/Fujisaki-realization) prosody, and reject its Scheme/CART/mutable-untyped-feature machinery.

---

## Sources

**Paper library (by folder):** `Allen_1987_MITalk_TTS`, `Klatt_1982_KlattalkTTS`, `Klatt_1987_TTS_Review`, `Hertz_1987_DeltaNonLinearPhonology`, `Taylor_2000_TiltModelIntonation`, `Fujisaki_InformationProsodyModeling`, `Strom_2002_TextToProsodyWithoutToBI`, `OShaughnessy_1976_F0_Prosody`, `Pierrehumbert_1980_EnglishIntonation`, `Silverman_1992_ToBILabelingProsody`, `Beckman_2005_ToBISystemEvolution`, `Pitrelli_1994_ToBILabellingReliability`, `Ladd_2021_TroubleWithToBI`, `Ladd_2008_IntonationalPhonology`.

**Web:**
- Taylor, Black & Caley, *Heterogeneous relation graphs as a formalism for representing linguistic information*, Speech Communication 2001 — https://www.sciencedirect.com/science/article/abs/pii/S0167639300000741
- Festival utterance structure — http://zeehio.github.io/festival/doc/Utterance-structure.html
- Festival manual, utterances & feature-function paths — https://www.cstr.ed.ac.uk/projects/festival/manual/festival_14.html
- Festvox — building voices, utterances — http://festvox.org/festvox-1.2/festvox_7.html
- Towards using HRGs for end-to-end TTS (CMU) — https://www.cs.cmu.edu/~awb/papers/ASRU2021_setlur.pdf
- MaryTTS architecture walkthrough — https://marytts.github.io/documentation/module-architecture.html
- MaryXML — https://marytts.github.io/documentation/maryxml/index.html
- eSpeak-NG phonemes — https://github.com/espeak-ng/espeak-ng/blob/master/docs/phonemes.md
- eSpeak-NG intonation — https://gitlab.e.foundation/e/os/espeak-ng/-/blob/master/src/libespeak-ng/intonation.c
- Rosenberg, *AuToBI — A Tool for Automatic ToBI annotation*, Interspeech 2010 — https://www.isca-archive.org/interspeech_2010/rosenberg10_interspeech.pdf
