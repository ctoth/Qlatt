# 13 — Direction Track Format (the Input Contract)

Status: 2026-06-29. The concrete schema for TRACK IN — the input contract of the
clean-room beautiful synth. Realizes the architecture verdict of
`10-sota-control-surface.md` §5 and `12-fe-architecture-recommendation.md` §1:
a clean text **SCORE** plus a separate declarative **DIRECTION TRACK** of typed,
aligned, relative-to-neutral performance modifiers, with a categorical-preset
affect surface that compiles to a dimensional (V/A/D) + voice-quality core.

Implemented in `src/input/`:

| File | Role |
|------|------|
| `direction-track.ts` | Schema/types, the neutral baseline, the delta algebra, the gesture library, and `parseDirectionTrack`/`serializeDirectionTrack` (schema round-trip). |
| `affect.ts` | The cited preset library + `compileAffect()` (named preset → V/A/D + VQ substrate), with clinical sex-inversion. |
| `parse.ts` | `parseDirectionInput()` — lowers (score, directionTrack) into typed, anchor-resolved `Direction` records, each emitting a `DecisionRecord`; plus tokenization, anchor resolution, and span-precedence resolution. |
| `inline.ts` | The DEMOTED optional inline shorthand — lifts `((preset@degree))` + `*emphasis*` into a Direction Track (never the source of truth). |
| `index.ts` | Barrel. |

Tests: `test/input.test.ts` (20 tests, all passing).

---

## 1. The two artifacts

### 1.1 SCORE — clean text

```ts
interface Score { text: string; }
```

Plain words, no markup. The canonical, diffable, re-translatable, AT-friendly
artifact (decisive for a blind author — W3C documents inline markup as hostile
to assistive tech). Tokenization is derived, never authored: the score is split
on whitespace into **tokens = words**, and on `. , ; : ! ?` into **phrases**.
`token` and `word` anchor units are synonyms over the word list.

### 1.2 DIRECTION TRACK — typed performance modifiers

```ts
interface DirectionTrack {
  version: "1";
  global?: GlobalState;       // the (c) base case — one per utterance
  spans?: DirectionSpan[];    // local overrides
}
```

**Empty `DirectionTrack` ⇒ neutral render ⇒ pure plain-text (c) base case.**
There is no second system: (c) is (b) with an empty direction set.

#### Global state (the (c) base case)

```ts
interface GlobalState {
  voice?: VoiceIdentity;       // { name?, sex?, baseF0Hz? } — separable identity
  affect?: AffectSpec;         // { preset, degree? } — named preset + degree knob
}
```

Affect is authored as a **named categorical preset with a continuous degree**
(the Azure `styledegree` / Alexa `intensity` pattern). `degree ∈ [0,1]`; absent
⇒ neutral. The `voice.sex` field is mandatory before any **clinical** preset can
resolve (see §4).

#### Local overrides (spans)

```ts
interface DirectionSpan {
  id: string;
  anchor: AnchorRange;         // { unit: token|word|phrase, start, end? }
  precedence?: number;         // higher wins on overlap; ties → later-declared
  emphasis?: { level: reduced|none|moderate|strong };
  break?:    { strength: 0..4, timeMs? };
  pitch?:    { semitones?, rangeScale? };
  rate?:     number;           // speaking-rate ×; lowers to inverse durationScale
  affect?:   AffectSpec;       // local affect override
  voiceQuality?: Partial<VoiceQualityDelta>;  // direct VQ delta override
  gesture?:  { name, degree? };               // named performance gesture
}
```

Spans carry **explicit precedence** so composition is *defined*, not vendor
folklore. `effectiveSpanFieldAt(input, tokenIndex, field)` returns the
winning value for a field at a token (highest precedence that *defines* the
field; ties broken by later declaration).

---

## 2. Everything is a delta over a neutral baseline

The rule-drivable acoustic substrate is the `VoiceQualityDelta` vector
(`*Scale` = multiplicative, neutral 1; `*Delta`/`*Boost` = additive, neutral 0):

```
rdDelta, f0Scale, f0VarianceScale, durationScale, intensityBoost, ahBoost,
spectralTiltBoost, pauseScale, f1Delta, f2Delta, f3Delta, fbw1Scale, fbw2Scale,
fbw3Scale, jitterScale, shimmerScale
```

`NEUTRAL_VQ` is the identity (Rutledge_1995 multiplicative style-vectors;
HAMLET/Murray_1993 rules as a final stage). The **degree** knob interpolates
smoothly between neutral and the full preset: multiplicative fields move from 1,
additive fields from 0, the dimensional vector from the origin. So
`compileAffect(p, 0)` ≡ neutral for every preset `p` (a tested invariant). The
`durationScale` field is the cited quantity (Rutledge vowel-dur ×norm); a span's
authored `rate` is its inverse (`durationScale = 1/rate`).

---

## 3. Affect = categorical surface → dimensional + VQ core

`compileAffect(name, degree, { sex? })` returns the **EmotionML
parallel-vocabulary** record — BOTH the author label AND the engine substrate:

```ts
interface CompiledAffect {
  label: string;               // the author's word ("angry")
  group: emotion|epistemic|pragmatic|speech_act|clinical;
  degree: number;
  resolvedSex?: male|female;    // for clinical presets
  dimensions: { valence, arousal, dominance };  // in [-1,1]
  vq: VoiceQualityDelta;
  citations: string[];
}
```

### Preset library coverage (`AFFECT_PRESETS`)

Ported verbatim, with citations, from
`projects/voice-quality-synthesis/2-Parameter-Specifications.md` §2.4–2.10 and
`design/beauty-synthesis/03-emotion.md`:

| Group | Presets | Primary citations |
|-------|---------|-------------------|
| **emotion** | neutral, angry, loud, soft, sad, happy, anxious, fatigued, **tender** | Cummings_1995, France_2000, Banse_1996, Rutledge_1995, Murray_1993, Scherer_1986/2001, Gobl_2003, Laukka_2008, Vogel_2010 |
| **epistemic** | confident, doubtful, competent, hedging | Goupil_2021, Jiang_2017 |
| **pragmatic** | indirect_request, direct_request, polite_question, sarcastic, rude, dismissive, curt, insincere | Trott_2022, Caballero_2018, Fish_2017, Cheang_2008 |
| **speech_act** | naming, criticism, speech_act_doubt, suggestion, warning, wish | Hellbernd_2016 |
| **clinical** | manic_male, manic_female, depressive_male, depressive_female | Kaczmarek-Majer_2024 |

The dimensional V/A/D coordinates come from doc 03 §1a (the per-emotion
acoustic-profile grid) and, for the speech acts, from Hellbernd_2016's explicit
arousal (calm/moderate/excited) + valence (negative/neutral/positive) labels.
`tender` is a **documented engineering estimate** (doc 03 §6): not a Scherer
category, composed from quiet-happiness (wide/relaxed) + breathy (Gobl) + narrow
non-fluctuating high F0 + portamento (Murray "affection").

The **performance gesture library** (`GESTURE_LIBRARY`, à la Loquendo VTML
expressive cues) carries `sigh`, `creak`, `breath`, `falsetto_onset`, each a
cited bundle of VQ deltas.

---

## 4. Clinical sex-inversion (mandatory)

`Kaczmarek-Majer_2024`: male and female **mania** acoustics are *exactly
opposite* (louder/quieter, higher/lower F1, rougher/smoother). A sex-agnostic
"manic" preset would be wrong for half of speakers. Therefore:

- The bare clinical names `manic` / `depressive` are **sex-required sentinels**.
- `compileAffect("manic", 1)` with **no** sex **throws**.
- `compileAffect("manic", 1, { sex })` resolves to `manic_${sex}`.
- During lowering, `parseDirectionInput` takes the sex from `global.voice.sex`;
  a clinical global affect without a voice sex throws.

This is verified: `manic_male.intensityBoost > 0`, `manic_female.intensityBoost
< 0`, opposite signs on intensity, F1, jitter, and arousal.

---

## 5. Lowering → DecisionRecords (and how it attaches to the HRG later)

`parseDirectionInput(input)` returns:

```ts
interface ParseResult {
  score: ResolvedScore;          // text + tokens + phrase ranges
  directions: Direction[];       // typed, anchor-resolved
  decisions: DecisionRecord[];   // the provenance DAG
  provenance: ProvenanceCollector;
}
```

Each `Direction` is a first-class, addressable object and emits a
`DecisionRecord` (`src/provenance.ts` schema: `{stage, type, subject, reason,
citations[], parents[]}`):

- `stage: "frontend"` (intent ingestion).
- `subject`: `"utterance"` for global state; `"token:N"` / `"token:N-M"` for
  spans — compatible with the provenance range selectors (`applyRange` token
  bounds) already in `provenance.ts`.
- `citations[]`: from the preset/gesture tables (Murray_1993, Banse_1996,
  Rutledge_1995, Gobl_2003, Goupil_2021, Kaczmarek-Majer_2024, …).
- `parents[]`: a local affect span chains to the global affect decision, so
  "why is this word angrier?" traces to the global state it overrides.

### HRG-compatibility (shapes only; NOT wired here)

Per the absolute rule, the HRG module is untouched. The Direction records are
made **shape-compatible** with a future HRG `Affect`-relation attachment:

- Every `Direction` carries `hrgRelation` naming the relation it belongs on
  (`Affect` for affect/voice-quality/gesture/rate/voice; `Intonation` for
  emphasis/pitch; `Break` for breaks). A later HRG pass attaches the directive's
  feature-write to that relation.
- `Direction.scope` is already a resolved token range — exactly the
  span→`Segment` alignment an HRG attachment needs.
- The `DecisionRecord` a direction emits matches the HRG `FeatureWriteInput`
  contract (`reason`, `citations[]`, `parents[]`, `stage`): when the HRG pass
  performs the affect feature-write, it reuses `decision.id` as the write's
  parent, fusing the input DAG into the HRG's provenance-stamped DAG (design 12
  §2: "the HRG and the provenance DAG become two views of one structure").

No HRG code is imported or modified; only the schema shapes line up.

---

## 6. Inline shorthand (demoted)

`parseInline(source)` is the optional convenience input. Its *first act* is to
lift itself into a `DirectionTrack`:

- `((preset))` / `((preset@degree))` → `global.affect` (first wins).
- `*word*` → an emphasis span on that word.
- The cleaned text (markers removed) is the score.

The Direction Track, not the annotated string, is the source of truth and the
thing provenance points at. Inline is a serializer and debug escape hatch only.
