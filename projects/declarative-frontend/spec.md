# Declarative TTS Frontend DSL v12



A domain-specific language for phonological and phonetic rules in speech synthesis, based on the multi-stream synchronization model of Hertz (1982, 1991).



---



## Part 0: Compilation Contract

### 0.1 Compilation Lifecycle

This section defines the **global** lifecycle. Later sections MUST state which stage they affect.

1. **PARSE**            Parse YAML -> typed AST
2. **VALIDATE**         Validate schema + static constraints (Part 9)
3. **INITIALIZE**       Build initial global sync axis + base stream; create cells/propagators; set all parsed tokens to `ACTIVE` unless explicitly marked otherwise
4. **RUN PHASES**       For each phase in order (Part 7), enable its rule propagators and run to quiescence
5. **FINALIZE**         Enable timing/point resolution propagators; run to quiescence; validate invariants
6. **EMIT**             Emit outputs/traces (Part 8, Part 10)

### 0.1a Suppression Model (Summary)

- Tokens are **persistent**; structural rewrites **never delete** tokens.
- Rules and splices **suppress** tokens by moving `status` monotonically toward `SUPPRESSED`.
- Matching, selection, navigation, and output operate over **ACTIVE** tokens only by default.
- Overlapping splices are **jointly applied**; any resulting ACTIVE overlaps or gaps are rejected during validation.

### 0.2 Determinism Contract

Implementations MUST produce identical results for the same inputs by adhering to the following:

- **Phase order:** Phases execute in the order listed in `phases` (Part 7).
- **Rule order:** Within a phase, rules execute in the listed order.
- **Match order:** Each rule enumerates matches in a single left-to-right sweep over the snapshot **of ACTIVE tokens only**, ordered by earliest involved sync mark (leftmost). The *earliest involved sync mark* for a match is the minimum `sync_left.order` across all captured interval tokens in that match (i.e., the leftmost boundary of any capture). Matches are applied once per match identity (Part 5.2).
- **Select order:** For select rules, **ACTIVE tokens** are visited in stream order. Base streams use list order; non-base interval streams use `(sync_left.order, sync_right.order, id)` as a total tie-breaker; point streams use `(anchor_left.order, anchor_right.order, ratio, id)`.
- **Quiescence:** Propagation runs until no new information is produced. Rules fire at most once per match identity (Part 5.2).

### 0.3 Validation Contract

Validation is the only stage allowed to **reject** invariant violations after rewrites. The engine MUST NOT repair structure beyond deterministic ordering; structural changes are monotone and explicit (Part 5.9).

### 0.4 Input Contract (Normative)

The declarative frontend operates on a **pre-tokenized** linguistic representation. It does **not** define text normalization, lexicon lookup, or G2P. Implementations MUST accept a fully constructed token model at **PARSE** time, including:

- Base stream tokens (e.g., `phone`) with initial `features` and `scalars` populated.
- Span streams (e.g., `syllable`, `word`, `phrase`) with parent-child links established.
- Boundary features on span streams sufficient to express phrase/word boundaries and punctuation effects.
- All tokens marked `ACTIVE` unless explicitly marked otherwise.

Required minimum fields for a typical English phone frontend:

```yaml
input_contract:
  base_stream: phone
  spans: [phrase, word, syllable]
  required_features:
    phone: [manner, place, voicing, stress]
    syllable: [stress, boundary]
    word: [pos]
    phrase: [boundary]
  required_scalars:
    phone: [duration, F1, F2, F3, B1, B2, B3, AV, AH, AF]
```

Upstream components MAY supply additional streams or features. The DSL engine MUST NOT infer missing span structure.

### 0.5 Pipeline Boundaries (Informative)

This spec defines the **rule engine** portion of the frontend. A complete TTS system typically follows:

1. **Upstream linguistic frontend (outside this spec)**
   - Text normalization
   - Lexicon lookup / G2P
   - Syllabification and phrasing
   - Construction of token streams + spans + initial scalars
2. **Declarative rule engine (this spec)**
   - Pattern/select rules
   - Structural rewrites and scalar effects
   - Timing/point resolution
3. **Renderer (outside this spec)**
   - Interpolation, smoothing, and frame generation
   - Audio synthesis (e.g., Klatt)

## Part 1: Core Data Model



### 1.1 Sync Marks



A single **global sync axis** coordinates all streams. This follows the Delta model (Hertz 1991) where multiple linguistic representations share synchronization points.



```typescript

// Order is a discriminated union, not a raw string

type OrderKey = 

  | { kind: 'START' }

  | { kind: 'FINITE', rank: string }

  | { kind: 'END' };



interface SyncMark {

  id: string;           // STABLE unique ID (never reassigned)

  order: OrderKey;      // comparison key

  time: number | null;  // concrete time in ms (after duration resolution)

}



// Comparator: START < all FINITE < END
// IMPORTANT: Ranks use ASCII codepoint order, NOT locale collation.

function compareOrder(a: OrderKey, b: OrderKey): number {

  const kindOrder = { START: 0, FINITE: 1, END: 2 };

  if (a.kind !== b.kind) return kindOrder[a.kind] - kindOrder[b.kind];

  if (a.kind === 'FINITE' && b.kind === 'FINITE') {

    // ASCII codepoint comparison (deterministic across environments)
    if (a.rank < b.rank) return -1;
    if (a.rank > b.rank) return 1;
    return 0;

  }

  return 0;  // both START or both END

}

```



**Sentinels:** `START` and `END` are not literal rank strings. They compare as infinities and are never inserted between.



**Finite ranks (normative):**



- `rank` is a **fixed-length** string of `[0-9a-z]`, length `RANK_LEN` (default `12`).
- `RANK_LEN` is a spec constant; all ranks must match it exactly.
- FINITE ranks compare by ASCII lexicographic order (`<`/`>`). Implementations MUST NOT use locale collation.
- Interpret `rank` as a base-36 integer in `[0, MAX]`, where `MAX = 36^RANK_LEN - 1`.
- Define `rank_to_int(START) = 0` and `rank_to_int(END) = MAX` for interpolation and insertion.



**Rank insertion (normative):**



- To insert between two FINITE ranks `lo < hi`, decode to integers `lo_int`, `hi_int`, then compute `mid = floor((lo_int + hi_int) / 2)`.
- If `mid == lo` or `mid == hi`, no representable midpoint exists: raise `E_RANK_NO_SPACE` and rebalance before retrying.
- Insertion between `START` and the first FINITE uses `lo = 0`. Insertion between the last FINITE and `END` uses `hi = MAX`.



**Rebalance (normative):**



Given the ordered list of FINITE marks `m[1..n]`, reassign:



- `rank_i = floor((i * MAX) / (n + 1))`, encoded in base-36 and padded to `RANK_LEN`.
- IDs remain stable; only `order.rank` changes.



**Reference implementation:** See `projects/declarative-frontend/implementation-notes.md` (informative) for fixed-length rank utilities.



### 1.2 Sentinels



```typescript

const START: SyncMark = { id: 'START', order: { kind: 'START' }, time: 0 };

const END: SyncMark   = { id: 'END', order: { kind: 'END' }, time: null };

```

**Sentinel time semantics:**
- `START.time` is always `0` (before and after time computation)
- `END.time` is `null` before any `compute_times`, and equals total utterance duration after the last `compute_times` (or final RESOLVE TIMES)
- **Invariant:** After any phase that computes times, all sync marks referenced by any token or point MUST have non-null `time`

**Sentinel boundary note (normative):** `START` and `END` are sentinel boundaries, not finite ranks. It is valid and expected for the first/last base token to use sentinel boundaries as `sync_left`/`sync_right`.



\- `START` always compares less than any finite rank

\- `END` always compares greater than any finite rank

\- No insertion can produce a rank outside `[START, END]`

\- Empty utterance: START and END only



**Interior marks:** A sync mark may exist inside a base token interval. Time is computed by interpolation (§5.8).



### 1.3 Interval Tokens



```typescript

interface IntervalToken {

  id: string;

  stream: string;

  name: string;

  status: TokenStatus;  // monotone: UNKNOWN < ACTIVE < SUPPRESSED

  sync_left: SyncMarkId;

  sync_right: SyncMarkId;

  features: Record<string, Value>;

  scalars: Record<string, ScalarState>;

  parent: TokenId | null;

  associations: Record<string, Set<TokenId>>;

}

```



**Invariant:** `sync_left.order < sync_right.order` for non-span streams; span streams may use `==` for empty spans.



### 1.4 Point Tokens



```typescript

interface PointToken {

  id: string;

  stream: string;

  status: TokenStatus;  // monotone: UNKNOWN < ACTIVE < SUPPRESSED

  anchor_left: SyncMarkId;

  anchor_right: SyncMarkId;

  ratio: number;              // 0.0-1.0, validated

  value: number | null;

  value_expr: DeferredExpr | null;

  time: number | null;        // computed at resolution

}

```



**Constraints:**

\- `0 <= ratio <= 1`

\- If `anchor_left == anchor_right`, ratio normalized to 0



**Time:** `time = anchor_left.time + ratio × (anchor_right.time - anchor_left.time)`

**Token status (normative):**

Tokens are persistent objects. Structural rewrites **never delete** tokens; they only change a token's `status` monotonically toward `SUPPRESSED`.

```
UNKNOWN < ACTIVE < SUPPRESSED
join = max
```

```typescript
enum TokenStatus { UNKNOWN = 0, ACTIVE = 1, SUPPRESSED = 2 }
```

- The only permitted transition is upward in the lattice (no re-activation).
- Suppressed tokens remain addressable by ID for tracing/provenance, but are excluded from matching, selection, and output by default (see Part 5, Part 8).



### 1.5 Stream Types



| Type | Token | Partitions? | Lifecycle |

|------|-------|-------------|-----------|

| `base` | interval | Yes | Mutable via splice |

| `span` | interval | Within parent | Stable IDs, boundaries recomputed |

| `parallel` | interval | No | Mutable |

| `point` | point | N/A | Mutable |

**Base stream adjacency:**

Base tokens form an ordered sequence by list position. **ACTIVE** tokens define the effective base stream for matching, selection, and output. Adjacency is defined by list position (`prev`/`next` cursor fields) among ACTIVE tokens, NOT by shared sync mark IDs. Tokens may share a boundary sync mark or have distinct marks at the same order position. The **base coverage invariant** applies to ACTIVE tokens only: in order-space, ACTIVE base tokens must partition `[START, END]` with no gaps or overlaps. In time-space (after `COMPUTE TIMES`), times must be monotonically non-decreasing.



### 1.6 Scalar State



```typescript

interface ScalarState {

  base: number;

  floor: number | null;

  effects: ResolvedEffect[];

  resolved: number | null;

}



interface ResolvedEffect {

  field: string;

  op: 'set' | 'mul' | 'add';

  value: number;

  tag: string;

  rule: string;

  order: number;              // assigned at rule firing time

}

```



**Effect ordering:** `order` is assigned deterministically at rule firing time, using `(phase_index, rule_index, match_index, effect_index, local_seq)` as a stable lexicographic key. This yields a total order independent of propagator scheduling.



### 1.7 Klatt Incompressibility



From Klatt (1976) Eq. 1:



```

D_f = K × (D_i - D_min) + D_min

```



Only the compressible portion `(D_i - D_min)` scales. This prevents unnaturally short durations when multiple shortening rules stack. See Klatt (1976) Table II for `D_min` values: vowels ~0.42-0.45 × inherent duration, consonants ~0.5-0.6.



---



## Part 2: Expression Language (CEL + Typed Cursor)

Expressions use [CEL (Common Expression Language)](https://github.com/google/cel-spec). CEL is non-Turing-complete, terminating, and side-effect free, which preserves deterministic rule evaluation while adding static type checking.

### 2.1 CEL

CEL provides:

- Static type checking against declared stream schemas.
- Deterministic evaluation (no async, no side effects).
- `==` for equality.
- No silent undefined propagation; invalid field/type access is a compile-time validation error.

```yaml
# Feature check
where: 'current.f.manner == "vowel"'
```

### 2.2 Typed Cursor

Before CEL evaluates any expression, a **typed cursor** materializes evaluation context from stream topology + schema declarations.

The cursor:

1. Reads topology declaration (`hierarchy: [phrase, word, syllable, phone]`).
2. Walks hierarchy for each token position.
3. Emits a typed nested object where navigation is field access.

Before (legacy function-style navigation):

```yaml
value: 'parent(current, "syllable").f.stress == 1 ? params.stress_factor : 1.0'
```

After (cursor field access):

```yaml
value: 'current.syllable.f.stress == 1 ? params.stress_factor : 1.0'
```

Navigation is context materialization, not runtime tree walking:

```yaml
# Legacy style
constraint: 'parent(d, "word").id != parent(j, "word").id'

# CEL + cursor
constraint: 'd.word.id != j.word.id'
```

### 2.3 Expression Context

Expressions receive a typed `TokenView` facade, not the raw token model.

```typescript
interface TokenView {
  id: string;
  name: string;
  status: TokenStatus;
  f: Record<string, Value>;           // features
  s: Record<string, number | null>;   // resolved scalar values
  sync_left: SyncMarkId;
  sync_right: SyncMarkId;
  parent: TokenId | null;

  // Materialized hierarchy fields (typed by topology)
  syllable?: TokenView;
  word?: TokenView;
  phrase?: TokenView;
}
```

**Mapping from internal model:**

- `t.f` -> `t.features`
- `t.s.duration` -> `t.scalars.duration.resolved ?? t.scalars.duration.base`
- Raw `ScalarState` objects are not exposed (use tracing for debugging)

**Select rules:**

```typescript
interface SelectContext {
  current: TokenView;
  prev: TokenView | null;        // previous ACTIVE token in stream
  next: TokenView | null;        // next ACTIVE token in stream
  prev2?: TokenView | null;      // optional 2-step previous ACTIVE token
  next2?: TokenView | null;      // optional 2-step next ACTIVE token
  current_index?: number;        // optional zero-based index
  phrase_index?: number;         // optional phrase-relative position
  phrase_total?: number;         // optional phrase-relative total count
  params: Record<string, Value>;
}
```

**Pattern rules:**

```typescript
interface PatternContext {
  current: TokenView;            // current step in sequence where-clauses
  params: Record<string, Value>;
  [captureName: string]: TokenView | Record<string, Value>;
}
```

### 2.4 Registered Functions (Minimal CEL Profile)

Only functions that cannot be represented as cursor field access are registered:

| Function | Signature | Notes |
|----------|-----------|-------|
| `midpoint(t)` | `TokenView -> Anchor` | Midpoint anchor. |
| `at_ratio(t, r)` | `(TokenView, double) -> Anchor` | Anchor at ratio. |
| `at_sync(s)` | `SyncMarkId -> Anchor` | Anchor at sync mark. |
| `prev_point(stream)` | `string -> PointToken \| null` | Previous ACTIVE point in stream order. |
| `total(stream)` | `string -> int` | Count of ACTIVE tokens in stream. |
| `target(phoneme)` | `string -> map` | Inventory lookup. MUST return a plain CEL map (e.g., `{"params": {...}}`). |

Optional extension (only if association rules are used in expressions):

| Function | Signature | Notes |
|----------|-----------|-------|
| `assoc(t, name)` | `(TokenView, string) -> list<TokenView>` | Association lookup over ACTIVE edges. |

Navigation formerly expressed as functions is now cursor data:

- Previous token: `prev`
- Next token: `next`
- Bounded lookahead/lookbehind: `prev2`, `next2` (optional)
- Parent lookup: `t.syllable`, `t.word`, `t.phrase`
- Index lookup: `current_index` (if provided by implementation)
- Phrase-relative helpers: `phrase_index`, `phrase_total` (if provided by implementation)

### 2.5 Nullability

In the typed model, nullable expression values are limited to:

- `prev` / `next` at stream boundaries.
- `prev_point(stream)` when no prior point exists.
- Hierarchy fields when a token truly has no parent in that stream.

Use CEL `has()` for these boundary/null checks:

```cel
has(prev) && prev.f.manner == "stop"
```

Feature access on typed streams is otherwise non-nullable. Access to undeclared fields is a compile-time error.

### 2.6 Static Validation

At VALIDATE, every CEL expression is compiled against declared stream schemas and expression context types.

Compile-time errors include:

- Undeclared feature/scalar names.
- Type mismatches (e.g., string vs number comparisons).
- Invalid stream names in `total()` / `prev_point()`.
- Unknown identifiers/functions.

Expression compile/type diagnostics use `E_CEL_INVALID` (Part 9).

### 2.7 Expression Syntax in YAML

Rule expression fields use CEL syntax:

```yaml
# String literal expression
name: '"dʒ"'

# Concatenation
name: 'stop.name + "_rel"'

# Equality
where: 'current.f.manner == "vowel"'
```

Conventions:

- Equality: `==`
- String concatenation: `+`
- Booleans: `&&`, `||`, `!`
- Strings: double quotes inside CEL expressions
- YAML style: prefer folded blocks (`>-`) for long expressions or expressions containing many nested string literals.

### 2.8 YAML-Level Bindings (`define:`)

CEL has no portable let-binding syntax in this profile. Rules may define reusable CEL bindings at YAML level:

```yaml
define:
  rel: 'current.name == "P_CL" ? "P_REL" : current.name == "T_CL" ? "T_REL" : "K_REL"'
  t: 'target(rel)'
apply:
  - field: F2
    op: set
    value: 't.params.F2'
    tag: release
```

`define:` is evaluated once per rule firing, top-to-bottom. Each binding is visible to later bindings and all expression fields (`constraint`, `apply`, `splice.insert`, `insert_point`) in that same rule firing.

### 2.9 Multi-Step Lookahead

This profile defines **bounded cursor depth = 2** for adjacency navigation:

- Guaranteed: `prev`, `next`
- Optional but supported by this implementation profile: `prev2`, `next2`
- Not part of the profile: `prev3`, `next3`, or arbitrary chained depth

For deeper navigation, use helper functions:

- `ahead(current, n)` for `n`-step lookahead
- `behind(current, n)` for `n`-step lookbehind

Rules that need complex structural context beyond local traversal SHOULD still be rewritten as pattern rules with explicit captures.

### 2.10 Runtime Portability Note (Informative)

Prototype investigation (`notes/cel-runtime-notes.md`) and the existing interpreter CEL evaluator (`src/semantics/cel-evaluator.ts`) show the portable profile is:

- Pre-materialized object context.
- Global function registration (no receiver-style methods).
- No CEL let-binding extensions.

This specification is written to that portable profile.

### 2.11 Acid-Test Coverage (Informative)

The English rulepack stress-cases are representable in this model:

- Stop release + aspiration insertion: use `next`, `target()`, and rule-level `define`.
- Inventory parameter reuse across multiple insert/effect fields: compute once in `define`, reuse in CEL fields.

**OPEN QUESTION:** Phrase-relative position helpers used by some F0 rules (`phrase_index`, `phrase_total`) can be modeled either as cursor fields or as registered functions. v12 does not yet mandate one form.
## Part 3: Stream Definitions



### 3.1 Base Stream



```yaml

streams:

  phone:

    type: base

    

    features:

      place: [labial, alveolar, palatal, velar, glottal]

      manner: [stop, fricative, affricate, nasal, liquid, glide, vowel, silence, release, aspiration]

      voicing: [voiced, voiceless]

      height: [high, mid, low]

      backness: [front, central, back]

    

    scalars:

      duration:

        unit: ms

        base_field: dur

        floor_field: dur_min

        resolution: klatt

        max: 500

      F1: {unit: Hz, base_field: F1, resolution: standard, min: 200, max: 1000}

      B1: {unit: Hz, base_field: B1, resolution: standard, min: 30, max: 500}

      F2: {unit: Hz, base_field: F2, resolution: standard, min: 500, max: 3000}

      B2: {unit: Hz, base_field: B2, resolution: standard, min: 50, max: 500}

      F3: {unit: Hz, base_field: F3, resolution: standard, min: 1500, max: 4000}

      B3: {unit: Hz, base_field: B3, resolution: standard, min: 100, max: 500}

      AV: {unit: dB, base_field: AV, resolution: standard, min: 0, max: 70}

      AH: {unit: dB, base_field: AH, resolution: standard, min: 0, max: 70}

      AF: {unit: dB, base_field: AF, resolution: standard, min: 0, max: 80}

    

    inventory:

      æ:

        features: {height: low, backness: front, manner: vowel}

        targets: {F1: 660, B1: 70, F2: 1720, B2: 100, F3: 2410, B3: 150,

                  dur: 240, dur_min: 105, AV: 60, AH: 0, AF: 0}

      # ... (abbreviated)



  phrase:

    type: span

    spans: word

    features:

      boundary: [none, minor, major]



  word:

    type: span

    spans: syllable

    features:

      pos: [noun, verb, adj, adv, func, punct]



  syllable:

    type: span

    spans: phone

    features:

      stress: [0, 1, 2]

      boundary: [none, minor, major]



  tone:

    type: parallel

    features:

      pitch: [H, L, M, HL, LH]

      floating: [true, false]



  f0:

    type: point

    value_type: number

    unit: Hz

```



### 3.2 Span Lifecycle



**Span tokens are stable.** They are created by upstream processing (lexer, syllabifier) and persist throughout rule evaluation. The "rebuild" step (§5.10) only recomputes boundaries; it never creates or destroys span tokens.



**Empty spans:** If all children of a span are suppressed (e.g., by coalescence), the span becomes empty:

\- Boundaries collapse: `sync_left == sync_right`

\- The span persists for provenance and alignment

\- Empty spans have zero duration but remain in the hierarchy

\- This is a warning, not an error



```python

def rebuild_span_boundaries(span_stream, child_stream):

    """Update span boundaries from children. Spans must already exist."""

    for span in span_stream.tokens:

        children = [t for t in child_stream.tokens if t.parent == span.id and t.status == TokenStatus.ACTIVE]

        if not children:

            # Empty span: collapse sync_right to sync_left (deterministic)

            span.sync_right = span.sync_left

            warn(f"Span {span.id} has no children (empty)")

            continue

        span.sync_left = min(c.sync_left for c in children, key=order)

        span.sync_right = max(c.sync_right for c in children, key=order)

```

**Empty span collapse policy:** When a span becomes empty, `sync_right` is set equal to `sync_left` (not the other way around). This preserves the span's left boundary position for provenance. Empty spans may be selected/matched; child queries return `[]`.



### 3.3 Topology



```yaml

topology:

  hierarchy: [phrase, word, syllable, phone]

  parallel: [tone]

  point: [f0]

```

**Hierarchy order:** The `hierarchy` list is **root-to-leaf** (e.g., phrase → word → syllable → phone).



---



## Part 4: Pattern Matching



### 4.1 Pattern Definition



```yaml

patterns:

  stop_before_sonorant:

    stream: phone

    scope: syllable

    max_lookahead: 50

    sequence:

      - capture: stop

        where: 'current.f.manner == "stop"'

      - capture: son

        where: 'current.f.manner in ["vowel", "nasal", "liquid", "glide"]'

  voiceless_stop_before_vowel:

    stream: phone

    scope: syllable

    sequence:

      - capture: stop

        where: 'current.f.manner == "stop" && current.f.voicing == "voiceless"'

      - capture: v

        where: 'current.f.manner == "vowel"'

  vowel_before_obstruent:

    stream: phone

    scope: syllable

    sequence:

      - capture: v

        where: 'current.f.manner == "vowel"'

      - capture: obs

        where: 'current.f.manner in ["stop", "fricative", "affricate"]'

  consonant_vowel:

    stream: phone

    scope: syllable

    sequence:

      - capture: c

        where: 'current.f.manner in ["stop", "fricative", "affricate", "nasal", "liquid", "glide"]'

      - capture: v

        where: 'current.f.manner == "vowel"'

```



**max_lookahead:**

\- Unit: tokens in the stream

\- Default: 100 if omitted

\- Behavior when exceeded: match fails at current position (no error, continues to next position)

\- Scope: total tokens examined for the entire pattern (not per-step)



### 4.2 Cross-Boundary Matching



```yaml

patterns:

  d_j_coalescence:

    stream: phone

    scope: phrase

    cross_boundary: true

    sequence:

      - capture: d

        where: 'current.f.manner == "stop" && current.f.place == "alveolar" && current.f.voicing == "voiced"'

      - capture: j

        where: 'current.f.manner == "glide" && current.f.place == "palatal"'

    constraint: 'd.word.id != j.word.id'

```



### 4.3 Scope: utterance



The special scope `utterance` means `[START, END]` with no parent constraint:



```yaml

patterns:

  utterance_final:

    stream: phone

    scope: utterance

    sequence:

      - capture: final

        where: '!has(next)'

```



### 4.4 Capture Shape



| Quantifier | Shape | On no match |

|------------|-------|-------------|

| (none) | Token | Fails |

| `optional: true` | Token \\| null | null |

| `repeat: "\*"` | Token[] | [] |

| `repeat: "+"` | Token[] | Fails |

**Scope boundary behavior (normative):** Quantified captures (`repeat: "*"`, `repeat: "+"`) MUST NOT cross the scope boundary. When a repeat would extend past the scope boundary, matching stops at the boundary and the capture includes only tokens within scope. For `repeat: "+"`, if no tokens were captured before reaching the boundary, the match fails.



---



## Part 5: Propagator Evaluation

### 5.1 Propagation Model (Normative)

The engine is a monotone propagator network:

- **Cells** hold state (token fields, status, scalar stacks, associations, sync mark times).
- **Propagators** read cells and monotonically add information to other cells.
- **Join** is idempotent and monotone; no propagation step retracts information.
- **Scheduling** may be arbitrary; determinism is enforced by rule ordering and match enumeration (see §0.2, §5.2).

**Active filtering (normative):** Matching, selection, navigation, and output operate on **ACTIVE** tokens only. SUPPRESSED tokens remain in the model for provenance/tracing but are excluded from rule evaluation and output unless explicitly stated.

### 5.2 Match Facts and Rule Firing

Each rule installs a matcher propagator that scans the ACTIVE stream in deterministic left-to-right order. For each match, it emits a **match fact** and fires the rule once.

**Match identity:** A match is identified by `(rule_name, leftmost_token_id, rightmost_token_id, capture_ids...)` for pattern rules. For select rules, match identity is `(rule_name, token_id)`. Each rule maintains an **applied set** of match identities; once applied, it MUST NOT re-apply the same match (idempotent).

**Constraint evaluation timing:** Constraints are evaluated **after** all captures bind. If a constraint fails, the match fact is discarded.

**Deterministic match order:** Matches are enumerated by earliest involved sync mark (leftmost) and within that by the ordering in §0.2.

### 5.3 Structural Rewrites (Monotone)

Structural actions are monotone facts:

- **Suppress:** `status := SUPPRESSED` (idempotent; no re-activation).
- **Insert:** create new tokens and sync marks (persistent).
- **Modify:** append scalar effects to a token's effect stack.
- **Associate/Disassociate:** add association edges or suppress them (associations are persistent; filtered views ignore SUPPRESSED tokens).

Overlapping structural rewrites are **all applied**. Any resulting overlaps or gaps in the ACTIVE base stream are rejected during validation (§5.10, §9).

**Splice semantics (rule YAML):**

```typescript
type SpliceSpec =
  | {
      type: 'insert_at_boundary';
      boundary: SyncMarkId;
      side: 'before' | 'after';
      insert: TokenSpec[];
    }
  | {
      type: 'replace_range';
      range_left: SyncMarkId;
      range_right: SyncMarkId;
      suppress: TokenId[];
      insert: TokenSpec[];
    }
  | {
      type: 'suppress_tokens';
      suppress: TokenId[];
    }
  | {
      // Back-compat alias: treated as suppress
      type: 'delete_tokens';
      delete: TokenId[];
    };
```

**Range membership semantics:** A token `t` is within `[L, R]` iff `L.order <= t.sync_left.order` AND `t.sync_right.order <= R.order`. Partially overlapping tokens are NOT within the range.

**Insert at END:** Use `boundary: "last_token.sync_right"` and `side: after`. If the base stream is empty, use `boundary: "START"`; the first inserted token spans `[START, END]`.

**Insert boundary assignment (normative):**

- `insert_at_boundary` inserts `N` tokens adjacent to `boundary` on the given `side`.
- Let `L` and `R` be the adjacent base boundary marks on that side (for `side: after`, `L = boundary` and `R` is the next base boundary; for `side: before`, `R = boundary` and `L` is the previous base boundary).
- If `N = 1`, the inserted token spans `[L, R]` by default. If `N > 1`, create `N-1` new interior marks strictly between `L` and `R` using rank insertion (§1.1). These marks define `N` consecutive intervals in order.
- If rank insertion fails due to no representable midpoint, raise `E_RANK_NO_SPACE`, rebalance, and retry.

**Replace range assignment (normative):**

- `replace_range` suppresses tokens within `[range_left, range_right]` and inserts `N` new tokens.
- If `N = 1`, the inserted token spans `[range_left, range_right]`.
- If `N > 1`, create `N-1` new interior marks strictly between `range_left` and `range_right` using rank insertion (§1.1), and span tokens consecutively in order.

### 5.4 Token Specification

```typescript
interface TokenSpec {
  name: string;
  features?: Record<string, Value>;
  scalars?: Record<string, { base?: number; floor?: number }>;
  parent?: TokenId | string | 'inherit_left';  // default: inherit_left
  copy_from?: Expr<TokenView>;                  // optional source token/object expression
  copy_fields?: string[];                       // optional field subset, null if missing
}
```

`copy_from` + `copy_fields` are optional shorthand for splice insertion templates. They copy selected fields from a source token/object with null-on-missing semantics before explicit template fields are applied.

**Expression syntax:** TokenSpec expression fields (`name`, expression-valued feature/scalar entries, and expression-valued `parent`) use CEL and are evaluated at runtime. String literals inside CEL expressions use double quotes.

Examples:
```yaml
# Literal phoneme name
name: '"dʒ"'

# Expression: concatenate stop name with suffix
name: 'stop.name + "_rel"'

# Literal feature value
features: { place: '"alveolar"' }

# Expression: copy feature from captured token
features: { place: "stop.f.place" }

# Literal parent reference
parent: '"syllable_42"'

# Expression: compute parent
parent: 'stop.syllable.id'
```

This convention enables unambiguous parsing, LSP support, and validation.

**Parent inheritance:** If `parent` is omitted or `'inherit_left'`, the new token inherits the parent of the token immediately to its left. If the insertion boundary is shared by two spans, `inherit_left` attaches to the left span (i.e., it extends that span after rebuild).
**Left token for boundary insertions (normative):** For `insert_at_boundary`, the "left" token is the token whose `sync_right` equals the insertion boundary (i.e., the token immediately to the left in base stream order). This applies even when the boundary is shared by two adjacent tokens.

### 5.5 Sync Mark Retention and Interior Marks

Sync marks are persistent. Optional GC MUST NOT remove marks referenced by any token (including SUPPRESSED) or point.

- Marks referenced by any token or point always persist.
- Unreferenced interior marks may be removed only after final time resolution (optional).
- Interior marks that persist are timed by interpolation during `COMPUTE TIMES` (§5.8).

### 5.6 Association Filtering

Associations are persistent for provenance. `disassociate` MUST NOT remove edges; it suppresses them by marking the association edge as `SUPPRESSED` (monotone). Navigation and output **ignore SUPPRESSED tokens and SUPPRESSED association edges** by default; implementations MAY materialize filtered association views without mutating the underlying sets.

### 5.7 Scalar Resolution

**Standard:**

```python
def resolve_standard(base, effects, min_val, max_val):
    v = base
    for e in sorted(effects, key=lambda x: x.order):
        if e.op == 'set': v = e.value
        elif e.op == 'mul': v = v * e.value
        elif e.op == 'add': v = v + e.value
    return clamp(v, min_val, max_val)
```

**Klatt:**

```python
def resolve_klatt(base, floor, effects, max_val):
    d = base
    for e in sorted(effects, key=lambda x: x.order):
        if e.op == 'set': d = e.value
        elif e.op == 'mul': d = e.value * (d - floor) + floor
        elif e.op == 'add': d = d + e.value
    return clamp(d, floor, max_val)
```

### 5.8 Time Computation

```python
# Assumes: ACTIVE base stream is contiguous and scalar durations resolved.
# Uses numeric rank values from the fixed-length base-36 encoding.

# MAX = 36^RANK_LEN - 1
RANK_LEN = 12
MAX = 36 ** RANK_LEN - 1
ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

def parse_base36(s):
    value = 0
    for ch in s:
        value = value * 36 + ALPHABET.index(ch)
    return value

def rank_to_int(order):
    if order.kind == 'START':
        return 0
    if order.kind == 'END':
        return MAX
    return parse_base36(order.rank)

def compute_times(base_stream, all_sync_marks):
    # Step 1: Assign times to base boundary marks
    time = 0
    for token in base_stream.tokens_in_order():
        token.sync_left.time = time
        time += token.s.duration
        token.sync_right.time = time
    END.time = time

    # Step 2: Interior marks by rank-based interpolation
    for token in base_stream.tokens_in_order():
        left = token.sync_left
        right = token.sync_right
        left_time = left.time
        right_time = right.time

        interior = [m for m in all_sync_marks
                    if m.time is None
                    and compare_order(left.order, m.order) < 0
                    and compare_order(m.order, right.order) < 0]

        if not interior:
            continue

        # Edge case: zero duration interval (should not occur after validation)
        if left_time == right_time:
            for mark in interior:
                mark.time = left_time
            continue

        # Sort by order for deterministic assignment
        interior.sort(key=lambda m: (m.order, m.id))

        # Numeric rank interpolation
        left_rank = rank_to_int(left.order)
        right_rank = rank_to_int(right.order)
        if right_rank == left_rank:
            raise Exception('E_TIME_NO_BASE_SUPPORT')

        for mark in interior:
            mark_rank = rank_to_int(mark.order)
            frac = (mark_rank - left_rank) / (right_rank - left_rank)
            mark.time = left_time + frac * (right_time - left_time)

# rank_to_int returns 0 for START, MAX for END, and base-36 value for FINITE.
```

**Error case:** If any sync mark remains unassigned after scanning all ACTIVE base intervals, emit `E_TIME_NO_BASE_SUPPORT`.

**Monotonicity:** After this step, sync mark times must be non-decreasing with order, and strictly increasing for base boundaries.

**END time:** `END.time` is set to the final accumulated time at the end of Step 1.

**Zero-duration base intervals (normative):** If a base interval has `sync_left.time == sync_right.time`, all interior marks within that interval MUST be assigned the left boundary time. Implementations MAY emit a warning.

### 5.9 Point Resolution

```python
def resolve_points(point_stream, context_map):
    for pt in point_stream.tokens:
        # Compute time from anchors
        left_t = pt.anchor_left.time
        right_t = pt.anchor_right.time
        pt.time = left_t + pt.ratio * (right_t - left_t)

        # Evaluate deferred value
        if pt.value_expr:
            ctx = context_map[pt.id]
            pt.value = cel_evaluate(pt.value_expr, ctx)
```

**Deferred expression restrictions:**

Deferred expressions (in `value_expr`) may reference:

- Token features (`current.f.*`)
- Resolved scalar values (`current.s.*`)
- Sync mark times (`current.sync_left.time`)
- Cursor fields (`current.syllable`, `prev`, `next`, etc.)
- Parameters (`params.*`)

Deferred expressions may **NOT** reference:

- Other point token values **except** via `prev_point` within the **same** point stream
- Unresolved scalars (must use resolved values)

**Point dependency constraints (normative):**

- `prev_point` is permitted only within point rules for the **same stream**.
- Implementations MUST evaluate point values in deterministic stream order (as defined in §0.2) so that `prev_point` is always resolved when referenced.
- If an implementation enables non-core forward references (e.g., `next_point`), it MUST either:
  - Reject at validation with `E_POINT_FWD_REF`, or
  - Defer evaluation with a second pass until all points are resolved.
  - This choice MUST be fixed for the implementation and documented.

---

### 5.10 Quiescence, Finalize, and Validation

- **Quiescence:** Run propagators until the work queue is empty.
- **Finalize:** Enable timing/point resolution propagators only **after** structural rewrites quiesce. If structural rewrites occur after finalize, emit `E_FINALIZE_DIRTY` (or require a full re-run).
- **Validation:** After quiescence (and finalize, if enabled), validate invariants:
  - Rebuild span boundaries from ACTIVE children (Part 3.2) before validation.
  - ACTIVE base tokens partition [START, END] with no gaps (`E_BASE_NOT_CONTIGUOUS`) and no overlaps (`E_BASE_OVERLAP`).
  - Interval tokens satisfy sync_left.order < sync_right.order (span streams may use ==).
  - All tokens/points reference existing marks.

Validation MUST NOT invent new tokens or delete existing tokens.

## Part 6: Rule Definitions



Every rule should cite the phonetic/phonological literature justifying it.



### 6.0 Rule Structure



```typescript

interface Rule {

  citation?: string;             // RECOMMENDED: literature reference

  

  // One of:

  select?: SelectClause;          // for select rules

  match?: string;                 // pattern name for pattern rules

  

  // Optional:

  define?: Record<string, string>; // CEL bindings, evaluated once per firing (top-to-bottom)
  constraint?: string;             // additional CEL filter (post-match)

  

  // Actions (one or more):

  apply?: Effect[];               // modify scalars

  splice?: SpliceSpec;            // base stream mutation

  insert_point?: PointSpec;       // point stream insertion

  suppress?: boolean;             // suppress matched token(s) (non-base only)
  delete?: boolean;               // back-compat alias for suppress

  associate?: AssocSpec[];        // create associations (ACTIVE edge)

  disassociate?: AssocSpec[];     // suppress associations (SUPPRESSED edge)

}



interface Effect {

  target?: string;               // capture name; defaults to 'current'

  field: string;                 // scalar field name

  op: 'set' | 'mul' | 'add';

  value: string;                 // CEL expression

  tag: string;                   // provenance tag

}


interface AssocSpec {

  from: string;                  // capture name

  to: string;                    // capture name

  assoc_name: string;            // association label

}

```

**Effect target defaulting:** If `target` is omitted, it defaults to `'current'`. For pattern rules, `target` may reference any capture name (e.g., `'v'`, `'stop'`).

**Define binding scope (normative):** `define` is rule-level. Bindings are evaluated once per rule firing, top-to-bottom, and are available to subsequent bindings plus all expression fields in the same firing (`constraint`, `apply`, `splice.insert`, `insert_point`).

**Constraint evaluation timing:**



For pattern rules, `constraint` evaluates **after all captures bind**. The pattern must fully match before the constraint is tested. This means:

\- Constraints can reference any capture by name

\- Constraints cannot cause early exit from pattern matching

\- If constraint returns false, the match is discarded



For select rules, `constraint` evaluates after `where` passes.



### 6.1 Select Rules

**Suppression semantics:** `suppress: true` sets the matched token's status to `SUPPRESSED` (monotone). `delete: true` is a back-compat alias. Base stream suppression MUST be expressed via `splice`. For pattern rules, `suppress: true` suppresses **all captures** in the match. For select rules, it suppresses `current` only.

```yaml
rules:

  # Klatt 1976 §III.B: stressed vowels longer
  stress_lengthening:
    citation: "Klatt 1976 §III.B"
    select:
      stream: phone
      where: 'current.f.manner == "vowel"'
    apply:
      - field: duration
        op: mul
        value: 'params.stress_factor'
        tag: stress
```
### 6.2 Pattern Rules with Splice

```yaml
rules:

  # Stevens 1998 Ch.8: stop release burst modeling
  insert_release:
    citation: "Stevens 1998 Ch.8"
    match: stop_before_sonorant
    splice:
      type: insert_at_boundary
      boundary: stop.sync_right
      side: after
      insert:
        - name: 'stop.name + "_rel"'
          parent: 'stop.syllable.id'

  # Cruttenden 2014 §10.3: yod coalescence /dj/ → /dʒ/
  coalesce_dj:
    citation: "Cruttenden 2014 §10.3"
    match: d_j_coalescence
    splice:
      type: replace_range
      range_left: d.sync_left
      range_right: j.sync_right
      suppress: [d, j]
      insert:
        - name: '"dʒ"'
          parent: 'd.syllable.id'
```
### 6.3 Point Insertion

```yaml
rules:

  # Pierrehumbert 1980: F0 targets at vowel midpoints with declination
  f0_targets:
    citation: "Pierrehumbert 1980"
    select:
      stream: phone
      where: 'current.f.manner == "vowel"'
    insert_point:
      stream: f0
      at: 'midpoint(current)'
      value: 'params.base_f0'
      tag: f0

  # Question rise on final boundary (requires prev_point)
  question_rise:
    citation: "Ladd 2008 Ch.5"
    select:
      stream: phrase
      where: 'current.f.boundary == "question"'
    insert_point:
      stream: f0
      at: 'at_sync(current.sync_right)'
      value: 'prev_point("f0").value + params.question_rise_hz'
      tag: f0
```
### 6.4 Formant Rules

```yaml
rules:

  # Stevens & House 1955: consonant locus equations
  locus_f2:
    citation: "Stevens & House 1955"
    match: consonant_vowel
    apply:
      - target: c
        field: F2
        op: set
        value: 'params.locus[c.f.place] + params.slope[c.f.place] * v.s.F2'
        tag: locus
```
### 6.5 Source Rules

```yaml
rules:

  # Stevens 1971: frication noise source levels
  frication_source:
    citation: "Stevens 1971"
    select:
      stream: phone
      where: 'current.f.manner == "fricative"'
    apply:
      - field: AF
        op: set
        value: 'current.f.voicing == "voiced" ? 50 : 60'
        tag: frication
```
### 6.6 Suppression (Non-Base)



```yaml

rules:

  # Autosegmental phonology: floating tones suppress if unassociated

  # Goldsmith (1976): tone deletion in African languages

  suppress_floating_tone:

    citation: "Goldsmith 1976"

    select:

      stream: tone

      where: 'current.f.floating == true'

    suppress: true

**Back-compat:** `delete: true` is accepted as an alias for `suppress: true`.



---


### 6.7 Association Rules

```yaml
rules:

  # Associate a release with its following sonorant
  link_release_target:
    citation: "Stevens 1998 Ch.8"
    match: stop_before_sonorant
    associate:
      - from: stop
        to: son
        assoc_name: release_target

  unlink_release_target:
    citation: "Stevens 1998 Ch.8"
    match: stop_before_sonorant
    disassociate:
      - from: stop
        to: son
        assoc_name: release_target
```

---
## Part 7: Phases

Phases are **ordered activation blocks** for propagators. For each phase, the engine:

1. Enables the phase's rule propagators.
2. Runs propagation to quiescence.
3. Optionally enables scalar/time/point resolution propagators (see flags below).

The `after` list is a validation constraint only; phases still execute in the listed order.



```yaml

phases:

  - name: sandhi

    rules: [d_j_coalescence]



  - name: allophonic

    rules: [insert_release]



  - name: duration

    rules: [stress_lengthening]

    resolve_scalars: [duration]



  - name: formants

    after: [duration]

    rules: [locus_f2]

    resolve_scalars: [F1, F2, F3, B1, B2, B3]



  - name: prosody

    after: [duration]

    rules: [f0_targets]



  - name: source

    rules: [frication_source]

    resolve_scalars: [AV, AH, AF]


  - name: finalize

    after: [duration, formants, prosody, source]

    compute_times: true

    resolve_points: [f0]

```



**Phase flags:**

\- `rules`: list of rule names to enable (order matters)

\- `after`: dependency on other phases

\- `resolve_scalars`: scalar fields to resolve (enabled after the phase reaches quiescence)

\- `compute_times`: if true, triggers **FINALIZE** (timing propagators enabled; no further structural rewrites allowed)

\- `resolve_points`: point streams to resolve (enabled during FINALIZE after times are computed)



---



## Part 8: Output

Output rendering uses **ACTIVE** tokens and points only. SUPPRESSED tokens remain for provenance/tracing but are excluded from interpolation and emission.

### 8.1 Scalar Interpolation



```yaml

interpolation:

  scalars:

    F1:

      method: linear

      blend_points:

        - {position: 0.2, weights: {prev: 0.5, current: 0.5}}

        - {position: 0.8, weights: {current: 0.5, next: 0.5}}

    AV: {method: step}

    AH: {method: step}

    AF: {method: step}

```



### 8.2 Point Interpolation



```yaml

interpolation:

  points:

    f0:

      method: monotone_cubic

      extrapolation: hold

      default: 0

      duplicate_policy: average

```



### 8.3 Output Mapping



```yaml

output:

  format: klatt_frames

  frame_rate_ms: 10

  

  mapping:

    F0: {source: point, stream: f0}

    F1: {source: scalar, field: F1}

    # ...

  

  constants:

    F4: 3500

    B4: 250

```



### 8.4 Rendering Contract (Normative)

The DSL engine outputs resolved scalars on interval tokens and resolved point streams. **Rendering** (frame generation, interpolation smoothing, and transition blending) is a downstream responsibility.

Implementations SHOULD expose a renderer configuration that is **not** part of the rule language. This keeps phonological rules deterministic and separable from signal rendering heuristics.

Example renderer configuration (informative):

```yaml
rendering:
  transitions:
    formants:
      types: [vowel, nasal, liquid, glide]
      duration_ms: 30
      blend: 0.35
  f0:
    interpolate: monotone_cubic
    unvoiced_value: 0
```

---



## Part 9: Validation

### 9.1 Diagnostic Catalog

| Code | Condition | Blame |
|------|-----------|-------|
| E_AXIS_ORDER_NOT_TOTAL | compareOrder is not a strict total order | sync mark list |
| E_MARK_ID_DUP | duplicate sync mark ID | sync mark |
| E_RANK_INVALID | FINITE rank not fixed-length [0-9a-z]{RANK_LEN} | sync mark |
| E_RANK_NO_SPACE | no representable midpoint; rebalance required | insertion site |
| E_MARK_MISSING | token/point references missing mark | token/point |
| E_TOKEN_BAD_INTERVAL | interval token has sync_left.order >= sync_right.order (span streams may use ==) | token |
| E_BASE_NOT_CONTIGUOUS | base stream does not partition [START, END] | base stream |
| E_BASE_OVERLAP | ACTIVE base tokens overlap in order-space | base stream |
| E_TIME_NO_BASE_SUPPORT | sync mark cannot be enclosed by any base interval | sync mark |
| E_FINALIZE_DIRTY | structural rewrite attempted after finalize | engine |
| E_INVALID_RATIO | point ratio not in [0,1] | point token |
| E_POINT_FWD_REF | point value references unresolved `next_point` | point rule |
| E_CEL_INVALID | expression parse/type error at compile time | rule |
| E_PHASE_ORDER_VIOLATION | phases violate declared order constraints | phases |
| E_SPLICE_CONFLICT | overlapping splices in strict mode | rule/rewrite |

**Warnings:**

- W_NULL_TARGET_AT_RUNTIME
- W_SUPPRESSED_TARGET_AT_RUNTIME
- W_DURATION_EDIT_AFTER_TIMES
- W_MISSING_CITATION
- W_EMPTY_SPAN

### 9.2 Invariants

- base_coverage (ACTIVE base tokens partition [START, END] with no gaps)
- base_overlap (ACTIVE base tokens do not overlap in order-space)
- span_boundary_match (spans match children or are empty)
- time_monotonicity (times non-decreasing in order)

**Splice overlap policy:**

- Adjacent (non-overlapping) splices are allowed.
- **Overlapping splices are jointly applied** (monotone). This can introduce overlapping ACTIVE base tokens.
- **Validation outcome:** If overlaps (or gaps) remain in the ACTIVE base stream after all rewrites, validation raises `E_BASE_OVERLAP` or `E_BASE_NOT_CONTIGUOUS`.
- **Conflict (optional strict mode):** Implementations MAY raise `E_SPLICE_CONFLICT` earlier when an overlap is detected.
- **Not a conflict:** Two splices that affect adjacent ranges without token overlap.

---

## Part 10: Tracing and Introspection

Implementations MUST provide tracing and introspection facilities sufficient to:

- Explain rule application and scalar provenance
- Explain derived values via dependency tracking ("why did this cell change?")
- Diff state between phases
- Inspect tokens, sync marks, and associations
- Support debugging (breakpoints, stepping)

Minimum trace event fields:

- event category (match, rewrite, resolve, error)
- phase and rule identifiers (if applicable)
- affected token IDs and sync mark IDs
- timestamp or order index for sequencing

Detailed trace formats and debugger protocols are documented in `projects/declarative-frontend/tracing.md` (informative).

---

## Appendix A: Complete Example

Migration quick-reference (legacy syntax -> CEL):

| Legacy | CEL |
|--------|-----|
| `=` (equality) | `==` |
| `&` (string concat) | `+` |
| `and` / `or` | `&&` / `\|\|` |
| `parent(t, "stream")` | `t.stream` (cursor field) |
| `next(current)` / `prev(current)` | `next` / `prev` |
| `midpoint(t)` | `midpoint(t)` |
| `at_ratio(t, r)` | `at_ratio(t, r)` |
| `at_sync(s)` | `at_sync(s)` |
| `index(current)` | `current_index` |
| `total("stream")` | `total("stream")` |
| `prev_point("f0")` | `prev_point("f0")` |
| `exists(x)` | `has(x)` |
| local let-binding | YAML `define:` |

```yaml

include: [streams.yaml]

parameters:
  stress_factor: 1.3
  clipping_factor: 0.6
  base_f0: 110

patterns:
  stop_before_sonorant:
    stream: phone
    scope: syllable
    max_lookahead: 20
    sequence:
      - capture: stop
        where: 'current.f.manner == "stop"'
      - capture: son
        where: 'current.f.manner in ["vowel", "nasal", "liquid", "glide"]'

  d_j_coalescence:
    stream: phone
    scope: phrase
    cross_boundary: true
    sequence:
      - capture: d
        where: 'current.f.manner == "stop" && current.f.place == "alveolar" && current.f.voicing == "voiced"'
      - capture: j
        where: 'current.f.manner == "glide" && current.f.place == "palatal"'
    constraint: 'd.word.id != j.word.id'

phases:
  - name: sandhi
    rules: [coalesce_dj]
  - name: allophonic
    rules: [insert_release]
  - name: duration
    rules: [stress_lengthening]
    resolve_scalars: [duration]
  - name: prosody
    rules: [f0_targets]
  - name: finalize
    after: [duration, prosody]
    compute_times: true
    resolve_points: [f0]

rules:
  coalesce_dj:
    citation: "Cruttenden 2014 §10.3"
    match: d_j_coalescence
    splice:
      type: replace_range
      range_left: d.sync_left
      range_right: j.sync_right
      suppress: [d, j]
      insert:
        - name: '"dʒ"'
          parent: 'd.syllable.id'

  insert_release:
    citation: "Stevens 1998 Ch.8"
    match: stop_before_sonorant
    splice:
      type: insert_at_boundary
      boundary: stop.sync_right
      side: after
      insert:
        - name: 'stop.name + "_rel"'
          parent: 'stop.syllable.id'

  stress_lengthening:
    citation: "Klatt 1976 §III.B"
    select:
      stream: phone
      where: 'current.f.manner == "vowel"'
    apply:
      - field: duration
        op: mul
        value: 'current.syllable.f.stress == 1 ? params.stress_factor : 1.0'
        tag: stress

  f0_targets:
    citation: "Pierrehumbert 1980"
    select:
      stream: phone
      where: 'current.f.manner == "vowel"'
    insert_point:
      stream: f0
      at: 'midpoint(current)'
      value: 'params.base_f0 * (1.1 - 0.2 * double(current_index) / double(total("phone")))'
      tag: f0
```

---

## Appendix B: Glossary



| Term | Definition |

|------|------------|

| Sync mark | Coordination point with stable ID and fixed-length rank order |

| Rank | Fixed-length base-36 ordering key for sync marks |

| Interior mark | Sync mark inside a base interval (interpolated time) |

| Splice | Atomic suppress+insert on base stream |
| Propagator | Monotone rule that derives new facts from existing facts |
| Quiescence | Point where no propagators can add new information |
| Finalize | Stage that enables timing/point resolution after structural rewrites |

| Span | Stable token whose boundaries are recomputed from children |

| Effect | Scalar operation with monotonic order |

| Klatt resolution | Duration with incompressibility floor |

| CEL | Expression language with typed cursor context and static validation |



---



## Appendix C: References

### Expression Language

**Google CEL Project.** (n.d.). *Common Expression Language Specification*. https://github.com/google/cel-spec



### Duration and Timing



**Chen, M.** (1970). Vowel length variation as a function of the voicing of the consonant environment. \*Phonetica\*, 22(3), 129-159.



**House, A. S., \& Fairbanks, G.** (1953). The influence of consonant environment upon the secondary acoustical characteristics of vowels. \*Journal of the Acoustical Society of America\*, 25(1), 105-113.



**Klatt, D. H.** (1976). Linguistic uses of segmental duration in English: Acoustic and perceptual evidence. \*Journal of the Acoustical Society of America\*, 59(5), 1208-1221.



**Lehiste, I.** (1970). \*Suprasegmentals\*. MIT Press.



**Oller, D. K.** (1973). The effect of position in utterance on speech segment duration in English. \*Journal of the Acoustical Society of America\*, 54(5), 1235-1247.



**Wells, J. C.** (1990). \*Longman Pronunciation Dictionary\*. Longman.



### Phonation and Voice Onset Time



**Klatt, D. H.** (1975). Voice onset time, frication, and aspiration in word-initial consonant clusters. \*Journal of Speech and Hearing Research\*, 18(4), 686-706.



**Klatt, D. H.** (1980). Software for a cascade/parallel formant synthesizer. \*Journal of the Acoustical Society of America\*, 67(3), 971-995.



**Lisker, L., \& Abramson, A. S.** (1964). A cross-language study of voicing in initial stops: Acoustical measurements. \*Word\*, 20(3), 384-422.



**Stevens, K. N.** (1971). Airflow and turbulence noise for fricative and stop consonants: Static considerations. \*Journal of the Acoustical Society of America\*, 50(4B), 1180-1192.



### Formants and Coarticulation



**Öhman, S. E. G.** (1966). Coarticulation in VCV utterances: Spectrographic measurements. \*Journal of the Acoustical Society of America\*, 39(1), 151-168.



**Stevens, K. N.** (1998). \*Acoustic Phonetics\*. MIT Press.



**Stevens, K. N., \& House, A. S.** (1955). Development of a quantitative description of vowel articulation. \*Journal of the Acoustical Society of America\*, 27(3), 484-493.



**Sussman, H. M., McCaffrey, H. A., \& Matthews, S. A.** (1991). An investigation of locus equations as a source of relational invariance for stop place categorization. \*Journal of the Acoustical Society of America\*, 90(3), 1309-1325.



### Intonation and F0



**Cooper, W. E., \& Sorensen, J. M.** (1981). \*Fundamental Frequency in Sentence Production\*. Springer-Verlag.



**'t Hart, J., Collier, R., \& Cohen, A.** (1990). \*A Perceptual Study of Intonation\*. Cambridge University Press.



**Ladd, D. R.** (2008). \*Intonational Phonology\* (2nd ed.). Cambridge University Press.



**Lieberman, P.** (1967). \*Intonation, Perception, and Language\*. MIT Press.



**Pierrehumbert, J. B.** (1980). \*The Phonology and Phonetics of English Intonation\*. PhD dissertation, MIT.



### Phonological Theory



**Cruttenden, A.** (2014). \*Gimson's Pronunciation of English\* (8th ed.). Routledge.



**Gimson, A. C.** (1980). \*An Introduction to the Pronunciation of English\* (3rd ed.). Edward Arnold.



**Goldsmith, J.** (1976). \*Autosegmental Phonology\*. PhD dissertation, MIT.



**Ladefoged, P., \& Maddieson, I.** (1996). \*The Sounds of the World's Languages\*. Blackwell.



### Multi-Stream Architectures



**Hertz, S. R.** (1982). From text to speech with SRS. \*Journal of the Acoustical Society of America\*, 72(4), 1155-1170.



**Hertz, S. R.** (1991). Streams, phones, and transitions: Toward a new phonological and phonetic model of formant timing. \*Journal of Phonetics\*, 19(1), 91-109.









