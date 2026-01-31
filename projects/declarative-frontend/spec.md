# Declarative TTS Frontend DSL v11



A domain-specific language for phonological and phonetic rules in speech synthesis, based on the multi-stream synchronization model of Hertz (1982, 1991).



---



## Part 0: Compilation Contract

### 0.1 Compilation Pipeline

This section defines the **global** compilation phases. Later sections MUST state which phase they affect.

1. **PARSE**            Parse YAML -> typed AST
2. **VALIDATE**         Validate schema + static constraints (Part 9)
3. **INITIALIZE**       Build initial global sync axis + base stream
4. **APPLY PHASES**     Apply rule phases in order (Part 7), using the rule-evaluation pipeline (Part 5)
5. **NORMALIZE**        Repair invariants after rewrites (Part 5.13)
6. **RESOLVE TIMES**    Final resolve of any remaining scalars/times/points (may be a no-op if already resolved in phases)
7. **EMIT**             Emit outputs/traces (Part 8, Part 10)

### 0.2 Determinism Contract

Implementations MUST produce identical results for the same inputs by adhering to the following:

- **Phase order:** Phases execute in the order listed in `phases` (Part 7).
- **Rule order:** Within a phase, rules execute in the listed order.
- **Match order:** Each rule enumerates matches in a single left-to-right sweep over the snapshot, ordered by earliest involved sync mark (leftmost). Matches are collected, then patches are generated and applied later by the patch ordering and splice overlap policy (Part 5.4, Part 9).
- **Select order:** For select rules, tokens are visited in stream order. Base streams use list order; non-base interval streams use `(sync_left.order, sync_right.order, id)` as a total tie-breaker; point streams use `(anchor_left.order, anchor_right.order, ratio, id)`.
- **No fixpoint:** Rules are single-pass unless the spec explicitly adds a bounded repeat mechanism (not defined in v11).

### 0.3 Normalization Contract

Normalization is the **only** phase allowed to repair invariants after rewrites. Repairs are deterministic and bounded (Part 5.13).

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



- To insert between two FINITE ranks `lo < hi`, compute `mid = floor((lo + hi) / 2)`.
- If `mid == lo` or `mid == hi`, no representable midpoint exists: raise `E_RANK_NO_SPACE` and rebalance before retrying.
- Insertion between `START` and the first FINITE uses `lo = 0`. Insertion between the last FINITE and `END` uses `hi = MAX`.



**Rebalance (normative):**



Given the ordered list of FINITE marks `m[1..n]`, reassign:



- `rank_i = floor((i * MAX) / (n + 1))`, encoded in base-36 and padded to `RANK_LEN`.
- IDs remain stable; only `order.rank` changes.



**Reference implementation:** See Appendix D.2 (informative) for fixed-length rank utilities.



### 1.2 Sentinels



```typescript

const START: SyncMark = { id: 'START', order: { kind: 'START' }, time: 0 };

const END: SyncMark   = { id: 'END', order: { kind: 'END' }, time: null };

```

**Sentinel time semantics:**
- `START.time` is always `0` (before and after time computation)
- `END.time` is `null` before any `compute_times`, and equals total utterance duration after the last `compute_times` (or final RESOLVE TIMES)
- **Invariant:** After any phase that computes times, all sync marks referenced by any token or point MUST have non-null `time`



\- `START` always compares less than any finite rank

\- `END` always compares greater than any finite rank

\- No insertion can produce a rank outside `[START, END]`

\- Empty utterance: START and END only



**Interior marks:** A sync mark may exist inside a base token interval. Time is computed by interpolation (§5.11).



### 1.3 Interval Tokens



```typescript

interface IntervalToken {

  id: string;

  stream: string;

  name: string;

  sync_left: SyncMarkId;

  sync_right: SyncMarkId;

  features: Record<string, Value>;

  scalars: Record<string, ScalarState>;

  parent: TokenId | null;

  associations: Record<string, Set<TokenId>>;

}

```



**Invariant:** `sync_left.order < sync_right.order`



### 1.4 Point Tokens



```typescript

interface PointToken {

  id: string;

  stream: string;

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



### 1.5 Stream Types



| Type | Token | Partitions? | Lifecycle |

|------|-------|-------------|-----------|

| `base` | interval | Yes | Mutable via splice |

| `span` | interval | Within parent | Stable IDs, boundaries recomputed |

| `parallel` | interval | No | Mutable |

| `point` | point | N/A | Mutable |

**Base stream adjacency:**

Base tokens form an ordered sequence. Adjacency is defined by list position (`$prev`/`$next`), NOT by shared sync mark IDs. Tokens may share a boundary sync mark or have distinct marks at the same order position. The **base coverage invariant** requires that in order-space, base tokens partition `[START, END]` with no gaps. In time-space (after `COMPUTE TIMES`), times must be monotonically non-decreasing.



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

  order: number;              // assigned at patch application time

}

```



**Effect ordering:** `order` is assigned as a monotonic integer during patch application, in global application order. Within a single patch, effects are ordered by their position in the YAML list.



### 1.7 Klatt Incompressibility



From Klatt (1976) Eq. 1:



```

D_f = K × (D_i - D_min) + D_min

```



Only the compressible portion `(D_i - D_min)` scales. This prevents unnaturally short durations when multiple shortening rules stack. See Klatt (1976) Table II for `D_min` values: vowels ~0.42-0.45 × inherent duration, consonants ~0.5-0.6.



---



## Part 2: Expression Language (JSONata)



Expressions use [JSONata](https://jsonata.org).



### 2.1 Evaluation Model



**Data root model:** The context is passed as the data root. Expressions access fields directly without `$` prefix.



```javascript

// Context for select rules:

{

  "current": { "name": "æ", "f": {...}, "s": {...} },

  "params": { "stress_factor": 1.3 }

}



// Expression (note: no $ on current/params):

"current.f.manner = 'vowel'"

```



**Registered functions** use `$` prefix:



```javascript

"$parent(current, 'syllable').f.stress = 1"

"$next(current).f.manner"

```



### 2.2 Expression Context



Expressions receive a **TokenView** facade, not the raw token model:



```typescript

interface TokenView {

  id: string;

  name: string;

  f: Record<string, Value>;           // features (alias for features)

  s: Record<string, number | null>;   // resolved scalar values

  sync_left: SyncMarkId;

  sync_right: SyncMarkId;

  parent: TokenId | null;

}

```



**Mapping from internal model:**

\- `t.f` → `t.features`

\- `t.s.duration` → `t.scalars.duration.resolved ?? t.scalars.duration.base`

\- Raw `ScalarState` objects are not exposed (use tracing for debugging)



**Select rules:**

```javascript

{

  "current": TokenView,

  "params": Record<string, Value>

}

```



**Pattern rules:**

```javascript

{

  "stop": TokenView,      // capture name

  "son": TokenView,       // capture name

  "current": TokenView,   // current step being evaluated (in where clauses)

  "params": Record<string, Value>

}

```



### 2.3 Registered Functions



| Function | Returns |

|----------|---------|

| `$prev(t)` | Token \\| null |

| `$next(t)` | Token \\| null |

| `$prev_sibling(t)` | Token \\| null |

| `$next_sibling(t)` | Token \\| null |

| `$parent(t, stream)` | Token \\| null |

| `$children(t, stream)` | Token[] |

| `$assoc(t, name)` | Token[] |

| `$spanning(t, stream)` | Token[] |

| `$index(t)` | number |

| `$total(stream)` | number |

| `$midpoint(t)` | Anchor |

| `$at_ratio(t, r)` | Anchor |

| `$at_sync(s)` | Anchor |

**Function semantics (selected):**

- `$spanning(t, stream)` returns tokens in `stream` whose interval fully contains `t`.
  - For interval `t`: `token.sync_left.order <= t.sync_left.order` and `t.sync_right.order <= token.sync_right.order`
  - For point `t`: use `anchor_left/anchor_right` as the interval bounds
  - Result is ordered by `(sync_left.order, sync_right.order, id)`



### 2.4 Undefined Handling



JSONata's native `undefined` propagation applies:

\- `undefined.field` → `undefined`

\- `undefined = x` → `false`

\- Arithmetic with `undefined` → `undefined` → comparison fails



This is correct for sparse linguistic features.



### 2.5 Examples



All expressions require explicit `current.` prefix in select rules. No syntactic sugar.



```yaml

# Feature check (select rule)

where: "current.f.manner = 'vowel'"



# Parent navigation

value: "$parent(current, 'syllable').f.stress = 1 ? params.stress_factor : 1"



# Pattern constraint (captures are in scope)

constraint: "obs.f.voicing = 'voiceless'"



# Chained navigation

constraint: "$next(stop).f.manner in ['vowel', 'nasal'] and $parent(stop, 'word').f.pos = 'verb'"

```



**Rationale:** One mental model. Data fields have no prefix, registered functions use `$`. No magic expansion.



---



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



**Span tokens are stable.** They are created by upstream processing (lexer, syllabifier) and persist throughout rule evaluation. The "rebuild" step (§5.9) only recomputes boundaries; it never creates or destroys span tokens.



**Empty spans:** If all children of a span are deleted (e.g., by coalescence), the span becomes empty:

\- Boundaries collapse: `sync_left == sync_right`

\- The span persists for provenance and alignment

\- Empty spans have zero duration but remain in the hierarchy

\- This is a warning, not an error



```python

def rebuild_span_boundaries(span_stream, child_stream):

    """Update span boundaries from children. Spans must already exist."""

    for span in span_stream.tokens:

        children = [t for t in child_stream.tokens if t.parent == span.id]

        if not children:

            # Empty span: collapse sync_right to sync_left (deterministic)

            span.sync_right = span.sync_left

            warn(f"Span {span.id} has no children (empty)")

            continue

        span.sync_left = min(c.sync_left for c in children, key=order)

        span.sync_right = max(c.sync_right for c in children, key=order)

```

**Empty span collapse policy:** When a span becomes empty, `sync_right` is set equal to `sync_left` (not the other way around). This preserves the span's left boundary position for provenance. Empty spans may be selected/matched; `$children()` returns `[]`.



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

        where: "current.f.manner = 'stop'"

      - capture: son

        where: "current.f.manner in ['vowel', 'nasal', 'liquid', 'glide']"

  voiceless_stop_before_vowel:

    stream: phone

    scope: syllable

    sequence:

      - capture: stop

        where: "current.f.manner = 'stop' and current.f.voicing = 'voiceless'"

      - capture: v

        where: "current.f.manner = 'vowel'"

  vowel_before_obstruent:

    stream: phone

    scope: syllable

    sequence:

      - capture: v

        where: "current.f.manner = 'vowel'"

      - capture: obs

        where: "current.f.manner in ['stop', 'fricative', 'affricate']"

  consonant_vowel:

    stream: phone

    scope: syllable

    sequence:

      - capture: c

        where: "current.f.manner in ['stop', 'fricative', 'affricate', 'nasal', 'liquid', 'glide']"

      - capture: v

        where: "current.f.manner = 'vowel'"

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

        where: "current.f.manner = 'stop' and current.f.place = 'alveolar' and current.f.voicing = 'voiced'"

      - capture: j

        where: "current.f.manner = 'glide' and current.f.place = 'palatal'"

    constraint: "$parent(d, 'word').id != $parent(j, 'word').id"

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

        where: "$next(current) = null"

```



### 4.4 Capture Shape



| Quantifier | Shape | On no match |

|------------|-------|-------------|

| (none) | Token | Fails |

| `optional: true` | Token \\| null | null |

| `repeat: "\*"` | Token[] | [] |

| `repeat: "+"` | Token[] | Fails |



---



## Part 5: Rule Evaluation



### 5.1 Pipeline

This is the **per-phase** rule-evaluation pipeline used during Phase 4 (APPLY PHASES) and followed by Phase 5 (NORMALIZE) and Phase 6 (RESOLVE TIMES).

```
1. SNAPSHOT           Copy-on-write view of streams
2. MATCH + EVALUATE   Find matches, evaluate expressions
3. GENERATE PATCHES   Create patch objects
4. SORT PATCHES       Deterministic order
5. BATCH BASE SPLICES Group base edits by affected range
6. APPLY PATCHES      Execute as batched splice plans
7. ASSOCIATION GC     Remove deleted IDs from association sets
8. SYNC MARK GC       Remove unreferenced marks (marks are never deleted by rules)
9. REBUILD SPANS      Recompute span boundaries
10. RESOLVE SCALARS   Collapse effect stacks
11. COMPUTE TIMES     Assign times to sync marks
12. RESOLVE POINTS    Evaluate deferred values, assign times
```

### 5.2 Patch Types



Base stream mutations use one of three splice variants:



```typescript

// Point insertion: insert at a boundary, no deletions

interface InsertAtBoundaryPatch {

  type: 'insert_at_boundary';

  boundary: SyncMarkId;

  side: 'before' | 'after';       // which direction to extend

  insert_tokens: TokenSpec[];

  rule: string;

  rule_index: number;

  match_index: number;

  patch_seq: number;

}



// Replacement: delete tokens and insert replacements

interface ReplaceRangePatch {

  type: 'replace_range';

  range_left: SyncMarkId;         // left boundary of affected region

  range_right: SyncMarkId;        // right boundary of affected region

  delete_tokens: TokenId[];       // tokens to remove (must be within range)

  insert_tokens: TokenSpec[];     // tokens to insert (partition the range)

  rule: string;

  rule_index: number;

  match_index: number;

  patch_seq: number;

}



// Pure deletion: remove tokens, no insertions

interface DeleteTokensPatch {

  type: 'delete_tokens';

  delete_tokens: TokenId[];

  rule: string;

  rule_index: number;

  match_index: number;

  patch_seq: number;

}



type BaseSplicePatch = InsertAtBoundaryPatch | ReplaceRangePatch | DeleteTokensPatch;

```

**Range membership semantics:**

A token `t` is "within range `[L, R]`" if and only if:
- `L.order <= t.sync_left.order` AND `t.sync_right.order <= R.order`

That is, the token must be **fully contained** within the range boundaries. Partially overlapping tokens are NOT within the range. Splices MUST NOT attempt to partially delete a token.



```typescript

// Non-base interval insertion

interface InsertIntervalPatch {

  type: 'insert_interval';

  stream: string;               // NOT base

  sync_left: SyncMarkId;

  sync_right: SyncMarkId;

  token: TokenSpec;

  rule: string;

  rule_index: number;

  match_index: number;

  patch_seq: number;

}



// Point insertion

interface InsertPointPatch {

  type: 'insert_point';

  stream: string;

  anchor_left: SyncMarkId;

  anchor_right: SyncMarkId;

  ratio: number;

  value_expr: DeferredExpr;

  context: CapturedContext;

  rule: string;

  rule_index: number;

  match_index: number;

  patch_seq: number;

}



// Modification (any stream)

interface ModifyPatch {

  type: 'modify';

  target: TokenId;

  effects: ResolvedEffect[];

  rule: string;

  rule_index: number;

  match_index: number;

  patch_seq: number;

}



// Deletion (non-base only; use splice for base)

interface DeletePatch {

  type: 'delete';

  stream: string;               // NOT base

  target: TokenId;

  rule: string;

  rule_index: number;

  match_index: number;

  patch_seq: number;

}



// Create association

interface AssociatePatch {

  type: 'associate';

  from: TokenId;

  to: TokenId;

  assoc_name: string;

  rule: string;

  rule_index: number;

  match_index: number;

  patch_seq: number;

}



// Remove association

interface DisassociatePatch {

  type: 'disassociate';

  from: TokenId;

  to: TokenId;

  assoc_name: string;

  rule: string;

  rule_index: number;

  match_index: number;

  patch_seq: number;

}

```



**Association semantics:**

\- Associations are many-to-many: a token can have multiple associations of the same type

\- Initial associations may be created by upstream processing or by rules

\- `AssociatePatch` adds `to` to `from.associations[assoc_name]`

\- `DisassociatePatch` removes `to` from `from.associations[assoc_name]`

\- Association GC (§5.8) removes references to deleted tokens



### 5.3 Token Specification



```typescript

interface TokenSpec {

  name: string;                              // literal or "=expr" prefixed

  features?: Record<string, Value | string>; // literal or "=expr" prefixed

  scalars?: Record<string, { base?: number; floor?: number }>;

  parent?: TokenId | string | 'inherit_left';  // default: inherit_left

}

```



**Expression vs literal disambiguation:**

Any string field in TokenSpec (or Effect values, or other polymorphic contexts) uses a prefix convention:
- Strings starting with `=` are JSONata expressions (evaluated at runtime)
- All other strings are literals

Examples:
```yaml
# Literal phoneme name
name: "dʒ"

# Expression: concatenate stop name with suffix
name: "=stop.name & '_rel'"

# Literal feature value
features: { place: "alveolar" }

# Expression: copy feature from captured token
features: { place: "=stop.f.place" }

# Literal parent reference
parent: "syllable_42"

# Expression: compute parent
parent: "=$parent(stop, 'syllable').id"
```

This convention enables unambiguous parsing, LSP support, and validation.

**Parent inheritance:** If `parent` is omitted or `'inherit_left'`, the new token inherits the parent of the token immediately to its left.



### 5.4 Patch Ordering



Sort key: `(rule_index, match_index, patch_seq)`



\- `rule_index`: position of rule in phase's rule list

\- `match_index`: which match of this rule (0, 1, 2, ...)

\- `patch_seq`: which patch from this match (for rules generating multiple patches)



**Rationale:** Ordering is fully determined by rule list position and match order. No priority field needed. If a rule must run before others, place it earlier in the phase or in an earlier phase.



### 5.5 Base Stream Splice



Base stream mutations use the `BaseSplicePatch` discriminated union (§5.2):



\- `InsertAtBoundaryPatch`: point insertion at a sync mark

\- `ReplaceRangePatch`: delete tokens and insert replacements

\- `DeleteTokensPatch`: remove tokens with no replacement



**Algorithm:**

Overlapping base splices are NOT jointly applied. The algorithm selects non-overlapping winners first, then batches for efficiency.



```python

def apply_base_splices(base_stream, patches):

    """Apply base splices with overlap resolution."""



    # Step 1: patches already sorted by (rule_index, match_index, patch_seq)



    # Step 2: Select non-overlapping winners

    accepted = []

    claimed_tokens = set()  # tokens already affected by accepted splice



    for patch in patches:

        patch_tokens = set(getattr(patch, 'delete_tokens', []))

        overlap = patch_tokens & claimed_tokens



        if overlap:

            # Overlaps with already-accepted splice

            emit_trace('patch_skipped', patch, reason='shadowed')

            continue



        # No overlap: accept this patch

        accepted.append(patch)

        claimed_tokens.update(patch_tokens)



    # Step 3: Group non-overlapping, adjacent patches for batch efficiency

    groups = group_adjacent_ranges(accepted)



    for group in groups:

        # Execute as batched operation

        merged_left = min(p.range_left for p in group)

        merged_right = max(p.range_right for p in group)

        all_deletes = union(p.delete_tokens for p in group)

        all_inserts = flatten_sorted(p.insert_tokens for p in group)

        execute_splice(base_stream, merged_left, merged_right,

                       all_deletes, all_inserts)

```



**Insert ordering:** Within a group, inserts are ordered by `(patch.rule_index, patch.match_index, patch.patch_seq, position_in_insert_tokens)`.



### 5.6 Insertion at END



To append a token at the end of the utterance, use boundary insertion:



```yaml

insert_at_boundary:

  boundary: "last_token.sync_right"  # boundary before END

  side: after

  insert_tokens: [...]

```



The splice algorithm creates new sync mark(s) between the specified boundary and `END`.



### 5.7 Interior Mark Policy

Sync marks are never deleted by rules. Deleting a base token may orphan marks; unreferenced marks are removed only during Sync Mark GC (Step 8).

- If a mark is referenced by any token or point, it persists even if the enclosing base token is deleted.
- Unreferenced marks (excluding START/END) are removed during Sync Mark GC.
- Interior marks that persist are timed by interpolation during `COMPUTE TIMES` (Section 5.11).

### 5.8 Association GC



After patch application, scan all tokens and remove any TokenId from association sets that no longer exists.



### 5.9 Span Boundary Rebuild



After base splices, recompute span boundaries bottom-up through hierarchy:



```python

for stream in reversed(topology.hierarchy[:-1]):  # skip base

    rebuild_span_boundaries(stream, child_stream_of(stream))

```



### 5.10 Scalar Resolution



**Standard:**

```python

def resolve_standard(base, effects, min_val, max_val):

    v = base

    for e in sorted(effects, key=lambda x: x.order):

        if e.op == 'set': v = e.value

        elif e.op == 'mul': v = v \* e.value

        elif e.op == 'add': v = v + e.value

    return clamp(v, min_val, max_val)

```



**Klatt:**

```python

def resolve_klatt(base, floor, effects, max_val):

    d = base

    for e in sorted(effects, key=lambda x: x.order):

        if e.op == 'set': d = e.value

        elif e.op == 'mul': d = e.value \* (d - floor) + floor

        elif e.op == 'add': d = d + e.value

    return clamp(d, floor, max_val)

```



### 5.11 Time Computation

```python
# Assumes: base stream is contiguous and scalar durations resolved.
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

        # Edge case: zero duration interval (should not occur after normalization)
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

**Error case:** If any sync mark remains unassigned after scanning all base intervals, emit `E_TIME_NO_BASE_SUPPORT`.

**Monotonicity:** After this step, sync mark times must be non-decreasing with order, and strictly increasing for base boundaries.

### 5.12 Point Resolution



```python

def resolve_points(point_stream, context_map):

    for pt in point_stream.tokens:

        # Compute time from anchors

        left_t = pt.anchor_left.time

        right_t = pt.anchor_right.time

        pt.time = left_t + pt.ratio \* (right_t - left_t)

        

        # Evaluate deferred value

        if pt.value_expr:

            ctx = context_map[pt.id]

            pt.value = jsonata_evaluate(pt.value_expr, ctx)

```



**Deferred expression restrictions:**



Deferred expressions (in `value_expr`) may reference:

\- Token features (`current.f.\*`)

\- Resolved scalar values (`current.s.\*`)

\- Sync mark times (`current.sync_left.time`)

\- Navigation functions (`$parent`, `$next`, etc.)

\- Parameters (`params.\*`)



Deferred expressions may **NOT** reference:

\- Other point token values (prevents circular dependencies)

\- Unresolved scalars (must use resolved values)



Point resolution order within a stream is undefined. If a deferred expression attempted to reference another point's value, behavior would be undefined.



---



### 5.13 Normalization (Phase 5)

Normalization restores invariants after rewrites. It is deterministic and limited to the following actions:

- **Reorder stream lists** into total order (base: list order preserved; non-base: (sync_left.order, sync_right.order, id)).
- **Rebuild spans** as specified in §5.9 (empty spans collapse to sync_left == sync_right).
- **Validate base coverage**: base tokens must partition [START, END] in order-space with no gaps or overlaps. Violations raise E_BASE_NOT_CONTIGUOUS.
- **Validate token shape**: interval tokens must satisfy sync_left.order < sync_right.order; violations raise E_TOKEN_BAD_INTERVAL.
- **Validate mark references**: every token/point must reference existing marks; violations raise E_MARK_MISSING.

Normalization MUST NOT invent new tokens or delete existing tokens (except for previously deleted tokens already removed by patches).

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

  constraint?: string;            // additional JSONata filter (post-match)

  

  // Actions (one or more):

  apply?: Effect[];               // modify scalars

  splice?: SpliceSpec;            // base stream mutation

  insert_point?: PointSpec;       // point stream insertion

  delete?: boolean;               // delete matched token (non-base only)

  associate?: AssocSpec[];        // create associations

  disassociate?: AssocSpec[];     // remove associations

}



interface Effect {

  target?: string;               // capture name; defaults to 'current'

  field: string;                 // scalar field name

  op: 'set' | 'mul' | 'add';

  value: string;                 // literal or "=expr" prefixed

  tag: string;                   // provenance tag

}


interface AssocSpec {

  from: string;                  // capture name

  to: string;                    // capture name

  assoc_name: string;            // association label

}

```

**Effect target defaulting:** If `target` is omitted, it defaults to `'current'`. For pattern rules, `target` may reference any capture name (e.g., `'v'`, `'stop'`).

**Constraint evaluation timing:**



For pattern rules, `constraint` evaluates **after all captures bind**. The pattern must fully match before the constraint is tested. This means:

\- Constraints can reference any capture by name

\- Constraints cannot cause early exit from pattern matching

\- If constraint returns false, the match is discarded (no patches generated)



For select rules, `constraint` evaluates after `where` passes.



### 6.1 Select Rules



```yaml

rules:

  # Klatt (1976) Table II: unstressed vowels 35-60% shorter

  # Lehiste (1970): stress correlates with duration cross-linguistically

  stress_lengthening:

    citation: "Klatt 1976 §III.B; Lehiste 1970 Ch.2"

    select:

      stream: phone

      where: "current.f.manner = 'vowel'"

    apply:

      - field: duration

        op: mul

        value: "$parent(current, 'syllable').f.stress = 1 ? params.stress_factor : 1"

        tag: stress



  # Klatt (1976): phrase-final syllables 30% longer

  # Oller (1973): boundary lengthening in English

  phrase_final_lengthening:

    citation: "Klatt 1976 §III.A; Oller 1973"

    select:

      stream: phone

      where: "current.f.manner = 'vowel'"

    apply:

      - field: duration

        op: mul

        value: "$parent(current, 'syllable').f.boundary = 'major' ? 1.3 : 1"

        tag: boundary



  # House \& Fairbanks (1953): vowels longer before voiced consonants

  # Klatt (1976) Table II: 50-100ms difference phrase-finally

  pre_voiced_lengthening:

    citation: "House \& Fairbanks 1953; Klatt 1976 §III.C"

    select:

      stream: phone

      where: "current.f.manner = 'vowel' and $next(current).f.voicing = 'voiced'"

    apply:

      - field: duration

        op: mul

        value: "params.pre_voiced_factor"

        tag: pre_voiced

```



### 6.2 Pattern Rules with Splice



```yaml

rules:

  # Ladefoged \& Maddieson (1996): stops have release bursts before sonorants

  # Stevens (1998) Ch.8: acoustic cues require explicit release modeling

  insert_release:

    citation: "Ladefoged \& Maddieson 1996 §3.2; Stevens 1998 Ch.8"

    match: stop_before_sonorant

    splice:

      type: insert_at_boundary

      boundary: stop.sync_right

      side: after

      insert:

        - name: "stop.name \& '_rel'"

          parent: "$parent(stop, 'syllable')"



  # Lisker \& Abramson (1964): VOT distinguishes voicing in stops

  # Aspiration 40-100ms for voiceless stops in English

  insert_aspiration:

    citation: "Lisker \& Abramson 1964; Klatt 1975"

    match: voiceless_stop_before_vowel

    constraint: "$parent(stop, 'syllable').f.stress >= 1"

    splice:

      type: insert_at_boundary

      boundary: stop.sync_right

      side: after

      insert:

        - name: "'asp'"



  # Wells (1990): pre-fortis clipping in British English

  # Chen (1970): vowel shortening before voiceless obstruents

  fortis_clipping:

    citation: "Wells 1990; Chen 1970"

    match: vowel_before_obstruent

    constraint: "obs.f.voicing = 'voiceless'"

    apply:

      - target: v

        field: duration

        op: mul

        value: "params.clipping_factor"

        tag: fortis



  # Gimson (1980): /d/+/j/ → /dʒ/ in connected speech

  # Cruttenden (2014) §10.3: yod coalescence

  d_j_coalescence:

    citation: "Gimson 1980; Cruttenden 2014 §10.3"

    match: d_j_coalescence

    splice:

      type: replace_range

      range_left: d.sync_left

      range_right: j.sync_right

      delete: [d, j]

      insert:

        - name: "'dʒ'"

          parent: "$parent(d, 'syllable')"

```



### 6.3 Point Insertion



```yaml

rules:

  # Pierrehumbert (1980): F0 targets at metrically strong syllables

  # 't Hart et al. (1990): pitch movements anchor to syllable nuclei

  f0_targets:

    citation: "Pierrehumbert 1980; 't Hart et al. 1990"

    select:

      stream: phone

      where: "current.f.manner = 'vowel'"

    insert_point:

      stream: f0

      at: "$midpoint(current)"

      value: "params.base_f0 \* (1.1 - params.declination \* $index(current) / $total('phone'))"

      tag: f0



  # Pierrehumbert (1980): H\* accent on stressed syllables

  # Ladd (2008): pitch accent alignment

  accent_peak:

    citation: "Pierrehumbert 1980; Ladd 2008 Ch.3"

    select:

      stream: syllable

      where: "current.f.stress = 1"

    insert_point:

      stream: f0

      at: "$at_ratio($children(current, 'phone')[f.manner = 'vowel'][0], 0.3)"

      value: "params.base_f0 \* params.accent_factor"

      tag: accent

```



### 6.4 Formant Rules



```yaml

rules:

  # Öhman (1966): VCV coarticulation model

  # Stevens (1998) Ch.6: formant transitions reflect articulator timing

  coarticulation:

    citation: "Öhman 1966; Stevens 1998 Ch.6"

    select:

      stream: phone

      where: "current.f.manner = 'vowel'"

    apply:

      - field: F2

        op: add

        value: "($prev(current).s.F2 - current.s.F2) \* params.coartic_strength"

        tag: coartic



  # Stevens \& House (1955): consonant locus equations

  # Sussman et al. (1991): locus equation parameters by place

  locus_f2:

    citation: "Stevens \& House 1955; Sussman et al. 1991"

    match: consonant_vowel

    apply:

      - target: c

        field: F2

        op: set

        value: "params.locus[c.f.place] + params.slope[c.f.place] \* v.s.F2"

        tag: locus

```



### 6.5 Source Rules



```yaml

rules:

  # Klatt (1980): source parameters for Klatt synthesizer

  # Stevens (1998) Ch.2: voice source characteristics

  voice_source:

    citation: "Klatt 1980; Stevens 1998 Ch.2"

    select:

      stream: phone

      where: "current.f.manner in ['vowel', 'nasal', 'liquid', 'glide']"

    apply:

      - field: AV

        op: set

        value: "60"

        tag: voiced



  # Stevens (1971): frication noise source levels

  frication_source:

    citation: "Stevens 1971"

    select:

      stream: phone

      where: "current.f.manner = 'fricative'"

    apply:

      - field: AF

        op: set

        value: "current.f.voicing = 'voiced' ? 50 : 60"

        tag: frication

```



### 6.6 Deletion (Non-Base)



```yaml

rules:

  # Autosegmental phonology: floating tones delete if unassociated

  # Goldsmith (1976): tone deletion in African languages

  delete_floating_tone:

    citation: "Goldsmith 1976"

    select:

      stream: tone

      where: "current.f.floating = true"

    delete: true

```



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


  # Remove association when a boundary condition holds

  unlink_release_target:

    citation: "Stevens 1998 Ch.8"

    match: stop_before_sonorant

    constraint: "$parent(stop, 'word').id != $parent(son, 'word').id"

    disassociate:

      - from: stop

        to: son

        assoc_name: release_target

```



---



## Part 7: Phases



Each phase runs the full pipeline (§5.1). Span boundaries are recomputed in step 9 of every phase.



```yaml

phases:

  - name: sandhi

    rules: [d_j_coalescence]



  - name: allophonic

    rules: [insert_release]



  - name: duration

    rules: [stress_lengthening, fortis_clipping]

    resolve_scalars: [duration]

    compute_times: true



  - name: formants

    after: [duration]

    rules: [coarticulation]

    resolve_scalars: [F1, F2, F3, B1, B2, B3]



  - name: prosody

    after: [duration]

    rules: [f0_targets]

    resolve_points: [f0]



  - name: source

    rules: [voice_source, frication_source]

    resolve_scalars: [AV, AH, AF]

```



**Phase flags:**

\- `rules`: list of rule names to execute (order matters)

\- `after`: dependency on other phases

\- `resolve_scalars`: scalar fields to resolve this phase

\- `compute_times`: assign times to sync marks (requires duration resolved)

\- `resolve_points`: point streams to resolve (requires times computed)



---



## Part 8: Output



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
| E_TOKEN_BAD_INTERVAL | interval token has sync_left.order >= sync_right.order | token |
| E_BASE_NOT_CONTIGUOUS | base stream does not partition [START, END] | base stream |
| E_TIME_NO_BASE_SUPPORT | sync mark cannot be enclosed by any base interval | sync mark |
| E_INVALID_RATIO | point ratio not in [0,1] | point token |
| E_JSONATA_INVALID | expression parse/eval error at compile time | rule |
| E_PHASE_ORDER_VIOLATION | phases violate declared order constraints | phases |
| E_SPLICE_CONFLICT | overlapping splices in strict mode | rule/patch |

**Warnings:**

- W_NULL_TARGET_AT_RUNTIME
- W_DELETED_TARGET_AT_RUNTIME
- W_DURATION_EDIT_AFTER_TIMES
- W_MISSING_CITATION
- W_EMPTY_SPAN

### 9.2 Invariants

- base_coverage (base partitions [START, END])
- span_boundary_match (spans match children or are empty)
- time_monotonicity (times non-decreasing in order)

**Splice overlap policy:**

- Adjacent (non-overlapping) splices are allowed and batched together for efficiency
- **Overlapping splices are NOT jointly applied.** After sorting by (rule_index, match_index, patch_seq):
  - Earlier patches (lower sort key) take precedence
  - Later patches that overlap an already-accepted patch are skipped (shadowed)
  - Trace events (patch_skipped) are emitted with reason 'shadowed'
- **Conflict (optional strict mode):** Two splices that both delete the same token but specify different insertions may raise an error instead of shadowing
- **Not a conflict:** Two splices that affect adjacent ranges without token overlap

---

## Part 10: Tracing and Introspection



Debugging phonological rules is notoriously difficult. This section specifies the introspection tooling required for the DSL to be usable in practice.



### 10.1 Design Principles



1\. **Every decision must be traceable** - Why did this rule fire? Why didn't it?

2\. **Every value must have provenance** - Where did this duration come from?

3\. **State is always inspectable** - What did the streams look like at any point?

4\. **Visualization is first-class** - Multi-stream alignment must be visible



### 10.2 Trace Events



The engine emits structured trace events at each step:



```typescript

type TraceEvent =

  | PhaseStart

  | PhaseEnd

  | SnapshotCreated

  | RuleEvaluationStart

  | MatchAttempt

  | MatchSuccess

  | MatchFailure

  | ExpressionEvaluation

  | PatchGenerated

  | PatchApplied

  | PatchSkipped

  | ScalarResolution

  | TimeComputation

  | PointResolution

  | Warning

  | Error;



interface MatchAttempt {

  type: 'match_attempt';

  rule: string;

  pattern: string;

  position: { stream: string; index: number; token_id: string };

  timestamp: number;

}



interface MatchSuccess {

  type: 'match_success';

  rule: string;

  pattern: string;

  captures: Record<string, TokenId | TokenId[] | null>;

  span: { left: SyncMarkId; right: SyncMarkId };

  constraint_result: boolean | null;  // null if no constraint

}



interface MatchFailure {

  type: 'match_failure';

  rule: string;

  pattern: string;

  step_index: number;              // which step failed

  step_where: string;              // the where clause

  token_evaluated: TokenId;

  evaluation_result: any;          // what the where clause returned

  reason: 'where_false' | 'scope_boundary' | 'end_of_stream' | 'constraint_false';

}



interface ExpressionEvaluation {

  type: 'expression_eval';

  rule: string;

  expression: string;

  context: Record<string, any>;    // the data root

  result: any;

  duration_us: number;             // for perf tracking

}



interface PatchGenerated {

  type: 'patch_generated';

  rule: string;

  match_index: number;

  patch: Patch;

  source_tokens: TokenId[];        // tokens that triggered this patch

}



interface PatchSkipped {

  type: 'patch_skipped';

  patch: Patch;

  reason: 'target_deleted' | 'target_null' | 'conflict' | 'validation_failed';

  details: string;

}



interface ScalarResolution {

  type: 'scalar_resolution';

  token_id: TokenId;

  field: string;

  base: number;

  floor: number | null;

  effects: ResolvedEffect[];

  resolved: number;

  computation_steps: string[];     // human-readable step-by-step

}

```



### 10.3 Provenance Tracking



Every resolved value carries its provenance:



```typescript

interface Provenance {

  field: string;

  token_id: TokenId;

  base_value: number;

  base_source: 'inventory' | 'override';

  effects: ProvenanceEffect[];

  final_value: number;

}



interface ProvenanceEffect {

  rule: string;

  citation: string;

  tag: string;

  op: 'set' | 'mul' | 'add';

  value: number;

  value_before: number;

  value_after: number;

  match_context: {

    captures: Record<string, TokenId>;

    position: number;

  };

}

```



**Query interface:**



```typescript

// "Why is this token's duration 152ms?"

engine.explain(tokenId, 'duration') → Provenance



// Returns:

{

  field: 'duration',

  token_id: 'phone_42',

  base_value: 240,

  base_source: 'inventory',  // from æ entry

  effects: [

    {

      rule: 'stress_lengthening',

      citation: 'Klatt 1976 §III.B',

      tag: 'stress',

      op: 'mul',

      value: 1.0,              // stress == 0, so no change

      value_before: 240,

      value_after: 240

    },

    {

      rule: 'fortis_clipping', 

      citation: 'Wells 1990; Chen 1970',

      tag: 'fortis',

      op: 'mul',

      value: 0.6,

      value_before: 240,

      value_after: 186         // Klatt: 0.6 \* (240 - 105) + 105

    },

    {

      rule: 'phrase_final_lengthening',

      citation: 'Klatt 1976 §III.A',

      tag: 'boundary',

      op: 'mul',

      value: 1.0,              // not phrase-final

      value_before: 186,

      value_after: 186

    }

  ],

  final_value: 186

}

```



### 10.4 Snapshot Diffing



Compare state between any two points:



```typescript

interface SnapshotDiff {

  phase_from: string;

  phase_to: string;

  

  tokens: {

    added: TokenSummary[];

    deleted: TokenSummary[];

    modified: TokenModification[];

  };

  

  sync_marks: {

    added: SyncMarkId[];

    deleted: SyncMarkId[];

  };

  

  associations: {

    added: AssociationEdge[];

    deleted: AssociationEdge[];

  };

}



interface TokenModification {

  token_id: TokenId;

  changes: FieldChange[];

}



interface FieldChange {

  path: string;              // e.g., 's.duration', 'f.place', 'sync_right'

  old_value: any;

  new_value: any;

  caused_by: string[];       // rule names

}

```



**Usage:**



```typescript

const diff = engine.diff('after:allophonic', 'after:duration');

// Shows all changes made by duration phase

```



### 10.5 Rule Coverage Report



Track which rules fired and where:



```typescript

interface RuleCoverage {

  rule: string;

  citation: string;

  

  matches: {

    total: number;

    by_position: Map<number, number>;  // index → count

  };

  

  non_matches: {

    total_attempts: number;

    failure_reasons: Map<string, number>;  // reason → count

  };

  

  effects_applied: number;

  effects_skipped: number;

  

  example_matches: MatchSuccess[];      // first N

  example_failures: MatchFailure[];     // first N

}



// "Why didn't insert_aspiration fire on this stop?"

engine.whyNot('insert_aspiration', tokenId) → MatchFailure[]

```



### 10.6 Stream Visualization



Multi-stream alignment view specification:



```typescript

interface StreamView {

  time_range: [number, number];

  streams: StreamLayer[];

  sync_marks: SyncMarkDisplay[];

  annotations: Annotation[];

}



interface StreamLayer {

  stream: string;

  tokens: TokenDisplay[];

  y_position: number;

  height: number;

}



interface TokenDisplay {

  token_id: TokenId;

  name: string;

  x_start: number;           // pixels or time

  x_end: number;

  features: Record<string, string>;  // formatted for display

  scalars: Record<string, string>;

  highlight: 'none' | 'selected' | 'matched' | 'modified' | 'inserted' | 'deleted';

  provenance_available: string[];    // which fields have provenance

}



interface SyncMarkDisplay {

  id: SyncMarkId;

  x: number;

  time: number | null;

  order: string;

  references: TokenId[];     // tokens using this mark

  is_interior: boolean;

}



interface Annotation {

  type: 'rule_match' | 'patch_applied' | 'warning' | 'custom';

  x_start: number;

  x_end: number;

  y_stream: string;

  label: string;

  details: any;

}

```



### 10.7 Interactive Debugger Protocol



For IDE/UI integration:



```typescript

interface DebuggerProtocol {

  // Breakpoints

  setBreakpoint(location: BreakpointLocation): BreakpointId;

  removeBreakpoint(id: BreakpointId): void;

  

  // Execution control

  run(): Promise<void>;

  stepPhase(): Promise<PhaseResult>;

  stepRule(): Promise<RuleResult>;

  stepMatch(): Promise<MatchResult>;

  pause(): void;

  

  // State inspection

  getStreams(): StreamState[];

  getToken(id: TokenId): Token;

  getSyncMark(id: SyncMarkId): SyncMark;

  explain(tokenId: TokenId, field: string): Provenance;

  whyNot(rule: string, tokenId: TokenId): MatchFailure[];

  

  // Queries

  query(jsonata: string): any;  // query current state

  

  // Events

  onTraceEvent(callback: (event: TraceEvent) => void): void;

  onBreakpoint(callback: (bp: BreakpointId) => void): void;

}



type BreakpointLocation =

  | { type: 'phase'; phase: string; when: 'before' | 'after' }

  | { type: 'rule'; rule: string; when: 'before' | 'after' }

  | { type: 'match'; pattern: string; token?: TokenId }

  | { type: 'patch'; patch_type: string }

  | { type: 'token_modified'; token: TokenId; field?: string }

  | { type: 'condition'; expr: string };  // break when expr is true

```



### 10.8 Trace Output Formats



**JSON Lines (streaming):**



```jsonl

{"type":"phase_start","phase":"duration","timestamp":1234567890}

{"type":"match_success","rule":"stress_lengthening","captures":{"current":"phone_42"}}

{"type":"expression_eval","rule":"stress_lengthening","expression":"$parent(current,'syllable').f.stress","result":1}

...

```



**HTML Report:**



Self-contained HTML with:

\- Collapsible phase sections

\- Token timeline visualization

\- Click-to-expand provenance

\- Search/filter by rule, token, field

\- Diff view between phases



**SQLite Database:**



```sql

CREATE TABLE trace_events (

  id INTEGER PRIMARY KEY,

  timestamp_us INTEGER,

  phase TEXT,

  event_type TEXT,

  event_json TEXT

);



CREATE TABLE provenance (

  token_id TEXT,

  field TEXT,

  base_value REAL,

  final_value REAL,

  effects_json TEXT,

  PRIMARY KEY (token_id, field)

);



CREATE TABLE snapshots (

  phase TEXT PRIMARY KEY,

  state_json TEXT  -- or msgpack for size

);



-- Query: all effects on duration fields

SELECT p.token_id, p.effects_json 

FROM provenance p 

WHERE p.field = 'duration';

```



**Storage semantics (implementation-defined):**



The following are not specified and left to implementation:

\- Maximum trace size / rotation policy

\- Buffering vs streaming behavior

\- Behavior when disk fills (fail, truncate, or drop events)

\- Memory limits for in-memory traces during interactive debugging



Implementations should document their choices.



### 10.9 Performance Profiling



```typescript

interface PerformanceReport {

  total_time_ms: number;

  

  by_phase: {

    phase: string;

    time_ms: number;

    breakdown: {

      snapshot: number;

      matching: number;

      patch_generation: number;

      patch_application: number;

      resolution: number;

    };

  }[];

  

  by_rule: {

    rule: string;

    time_ms: number;

    match_attempts: number;

    match_successes: number;

    expressions_evaluated: number;

    avg_expression_time_us: number;

  }[];

  

  hot_expressions: {

    expression: string;

    count: number;

    total_time_us: number;

    avg_time_us: number;

  }[];

  

  memory: {

    peak_tokens: number;

    peak_sync_marks: number;

    snapshot_copies: number;

  };

}

```



### 10.10 Configuration



```yaml

debug:

  enabled: true

  

  trace:

    events: [match_success, match_failure, patch_applied, scalar_resolution]

    # or: all, none, errors_only

    

    include_context: true      # include full expression context

    include_snapshots: true    # store snapshots for diffing

    max_example_failures: 10   # per rule

    

  output:

    format: jsonl              # jsonl, html, sqlite

    path: "./debug/trace.jsonl"

    

  breakpoints:

    - { type: phase, phase: duration, when: after }

    - { type: condition, expr: "current.s.duration < 50" }

    

  performance:

    enabled: true

    sample_expressions: true   # profile JSONata evaluation



  visualization:

    enabled: true

    output: "./debug/timeline.html"

    streams: [phone, syllable, f0]

    time_range: auto           # or [0, 2000]

```



### 10.11 Command Line Interface



```

tts-dsl - Declarative TTS Frontend DSL



USAGE:

    tts-dsl <COMMAND> [OPTIONS]



COMMANDS:

    run         Process input through the DSL pipeline

    validate    Check spec for errors without running

    explain     Show provenance for a token's field

    why-not     Explain why a rule didn't fire on a token

    diff        Compare state between phases

    visualize   Generate timeline visualization

    profile     Performance profiling

    debug       Interactive debugger

    lsp         Language Server Protocol mode

    completion  Generate shell completions



GLOBAL OPTIONS:

    -s, --spec <FILE>       Spec file (default: tts.yaml)

    -v, --verbose           Increase verbosity (-v, -vv, -vvv)

    -q, --quiet             Suppress non-error output

    --color <WHEN>          Color output: auto, always, never

    --config <FILE>         Config file for defaults

```



#### tts-dsl run



```

Process input through the DSL pipeline



USAGE:

    tts-dsl run [OPTIONS] <INPUT>



ARGS:

    <INPUT>     Input text, file path, or "-" for stdin



INPUT FORMATS:

    --input-format <FMT>    Input format: text, phonemes, json

                            text     - Plain text (requires G2P)

                            phonemes - Space-separated phonemes

                            json     - Pre-structured token stream



OUTPUT:

    -o, --output <FILE>     Output file (default: stdout)

    --output-format <FMT>   Output format:

                            klatt    - Klatt parameter frames (default)

                            json     - Full token state as JSON

                            praat    - Praat TextGrid

                            ssml     - Annotated SSML

                            wav      - Synthesized audio (requires backend)



TRACING:

    --trace <FILE>          Write trace to file (jsonl, html, or sqlite by extension)

    --trace-events <LIST>   Events to trace: all, none, or comma-separated list

                            (match, patch, resolution, expression, error)

    --snapshots             Include full snapshots in trace (large!)



PHASES:

    --stop-after <PHASE>    Stop after named phase

    --skip <PHASES>         Skip comma-separated phases

    --only <PHASES>         Run only comma-separated phases



EXAMPLES:

    tts-dsl run "hello world"

    tts-dsl run -s en-us.yaml --output-format wav -o hello.wav "hello world"

    tts-dsl run --input-format phonemes "h ə l oʊ"

    tts-dsl run --trace trace.html --trace-events all input.txt

    cat text.txt | tts-dsl run -

```



#### tts-dsl validate



```

Check spec for errors without running



USAGE:

    tts-dsl validate [OPTIONS] [SPEC]



ARGS:

    [SPEC]      Spec file (default: tts.yaml)



OPTIONS:

    --strict            Treat warnings as errors

    --check-citations   Verify citation format

    --check-inventory   Verify all phonemes have targets

    --list-rules        List all rules with citations

    --list-patterns     List all patterns with streams

    --deps              Show phase dependencies as graph



OUTPUT:

    --format <FMT>      Output format: text, json, sarif (for CI)



EXAMPLES:

    tts-dsl validate en-us.yaml

    tts-dsl validate --strict --format sarif > results.sarif

    tts-dsl validate --list-rules

```



#### tts-dsl explain



```

Show provenance for a token's field value



USAGE:

    tts-dsl explain [OPTIONS] <INPUT> --token <ID> --field <FIELD>



ARGS:

    <INPUT>             Input text or file



OPTIONS:

    --token <ID>        Token ID or selector:

                        phone_42      - by ID

                        phone:5       - phone stream index 5

                        "æ":first     - first token named æ

                        syllable:2    - syllable index 2

    

    --field <FIELD>     Field to explain: duration, F1, F2, etc.

    

    --phase <PHASE>     Show state after this phase (default: final)

    

    --format <FMT>      Output format: text, json, markdown



OUTPUT:

    Shows: base value, source, each effect with rule/citation/before/after



EXAMPLES:

    tts-dsl explain "hello" --token phone:3 --field duration

    tts-dsl explain "hello" --token "ɛ":first --field F1 --format json

```



#### tts-dsl why-not



```

Explain why a rule didn't fire on a token



USAGE:

    tts-dsl why-not [OPTIONS] <INPUT> --rule <RULE> --token <ID>



ARGS:

    <INPUT>             Input text or file



OPTIONS:

    --rule <RULE>       Rule name

    --token <ID>        Token ID or selector (see 'explain')

    --phase <PHASE>     Evaluate at this phase (default: rule's phase)

    --all-failures      Show all match attempts, not just for this token



OUTPUT:

    Shows: which pattern step failed, the where clause, 

           actual token values, expected values



EXAMPLES:

    tts-dsl why-not "did you" --rule insert_aspiration --token phone:0

    tts-dsl why-not input.txt --rule d_j_coalescence --all-failures

```



#### tts-dsl diff



```

Compare state between phases



USAGE:

    tts-dsl diff [OPTIONS] <INPUT> --from <PHASE> --to <PHASE>



ARGS:

    <INPUT>             Input text or file



OPTIONS:

    --from <PHASE>      Start phase (or "init" for initial state)

    --to <PHASE>        End phase (or "final" for end state)

    --stream <STREAM>   Filter to specific stream

    --format <FMT>      Output format: text, json, patch



OUTPUT:

    Shows: tokens added/deleted/modified, sync marks changed,

           associations changed, with causing rules



EXAMPLES:

    tts-dsl diff "hello" --from init --to sandhi

    tts-dsl diff "hello" --from duration --to final --stream phone

```



#### tts-dsl visualize



```

Generate timeline visualization



USAGE:

    tts-dsl visualize [OPTIONS] <INPUT> -o <OUTPUT>



ARGS:

    <INPUT>             Input text or file



OPTIONS:

    -o, --output <FILE>     Output file (.html, .svg, .png)

    --streams <LIST>        Streams to show (default: phone,syllable,f0)

    --phase <PHASE>         Show state at phase (default: final)

    --time-range <RANGE>    Time range in ms: "0-2000" or "auto"

    --show-sync-marks       Draw sync mark lines

    --show-provenance       Color by rule that last modified

    --interactive           HTML with hover/click (html only)



EXAMPLES:

    tts-dsl visualize "hello world" -o timeline.html --interactive

    tts-dsl visualize input.txt -o diagram.svg --streams phone,f0

```



#### tts-dsl profile



```

Performance profiling



USAGE:

    tts-dsl profile [OPTIONS] <INPUT>



ARGS:

    <INPUT>             Input text or file (or --corpus for batch)



OPTIONS:

    --iterations <N>    Run N times and average (default: 10)

    --corpus <DIR>      Profile all .txt files in directory

    --warmup <N>        Warmup iterations (default: 2)

    --format <FMT>      Output format: text, json, flamegraph

    --output <FILE>     Output file (default: stdout)



BREAKDOWN:

    --by-phase          Time breakdown by phase

    --by-rule           Time breakdown by rule

    --expressions       Profile JSONata expressions

    --memory            Track memory allocations



EXAMPLES:

    tts-dsl profile "hello world" --iterations 100

    tts-dsl profile --corpus ./test-sentences/ --format json -o profile.json

    tts-dsl profile input.txt --expressions --format flamegraph -o profile.svg

```



#### tts-dsl debug



```

Interactive debugger



USAGE:

    tts-dsl debug [OPTIONS] <INPUT>



ARGS:

    <INPUT>             Input text or file



OPTIONS:

    --break <BP>        Initial breakpoint (can repeat):

                        phase:sandhi:before

                        phase:duration:after

                        rule:stress_lengthening

                        token:phone_5:modified

                        condition:"current.s.duration < 50"

    

    --script <FILE>     Run debugger commands from file

    --port <PORT>       DAP server mode on port (for IDE integration)



DEBUGGER COMMANDS:

    break <location>    Set breakpoint

    delete <id>         Delete breakpoint

    list                List breakpoints

    

    run                 Run to next breakpoint

    step phase          Step one phase

    step rule           Step one rule

    step match          Step one match attempt

    continue            Continue execution

    

    state               Show current state summary

    tokens [stream]     List tokens in stream

    token <id>          Show token details

    sync <id>           Show sync mark details

    

    explain <id> <fld>  Show provenance

    why-not <rule> <id> Explain match failure

    diff [from] [to]    Diff between phases

    

    query <jsonata>     Query current state

    watch <expr>        Watch expression value

    

    visualize           Open timeline in browser

    

    help [command]      Show help

    quit                Exit debugger



EXAMPLES:

    tts-dsl debug "hello world"

    tts-dsl debug input.txt --break phase:duration:after

    tts-dsl debug input.txt --port 4711  # DAP mode for VS Code

```



#### tts-dsl lsp



```

Language Server Protocol mode for editor integration



USAGE:

    tts-dsl lsp [OPTIONS]



OPTIONS:

    --stdio             Communicate via stdin/stdout (default)

    --socket <PORT>     Communicate via TCP socket

    --log <FILE>        Log LSP messages to file



FEATURES:

    - Syntax highlighting for .tts.yaml files

    - Diagnostics (errors, warnings)

    - Hover: show rule citations, pattern definitions

    - Go to definition: rule → pattern, stream → definition

    - Completion: rule names, stream names, feature values

    - Code actions: add missing citation, fix feature typo



EXAMPLES:

    tts-dsl lsp --stdio

    tts-dsl lsp --socket 5007 --log lsp.log

```



#### tts-dsl completion



```

Generate shell completions



USAGE:

    tts-dsl completion <SHELL>



ARGS:

    <SHELL>     Shell: bash, zsh, fish, powershell



EXAMPLES:

    tts-dsl completion bash > /etc/bash_completion.d/tts-dsl

    tts-dsl completion zsh > ~/.zfunc/_tts-dsl

```



### 10.12 Exit Codes



```

0   Success

1   General error

2   Invalid arguments

3   Spec validation failed

4   Input parsing failed

5   Rule execution error

10  Breakpoint hit (debug mode, non-interactive)

```



### 10.13 Environment Variables



```

TTS_DSL_SPEC          Default spec file path

TTS_DSL_CONFIG        Config file path

TTS_DSL_TRACE_DIR     Directory for trace files

TTS_DSL_COLOR         Color mode: auto, always, never

TTS_DSL_PAGER         Pager for long output (default: less)

```



### 10.14 Config File



```yaml

# ~/.config/tts-dsl/config.yaml



defaults:

  spec: ~/tts/en-us.yaml

  output_format: klatt

  

trace:

  events: [match, patch, error]

  directory: ~/.local/share/tts-dsl/traces/

  

debug:

  history_file: ~/.local/share/tts-dsl/debug_history

  

profile:

  iterations: 10

  warmup: 2

```



### 10.15 Example Debug Session



```

$ tts-dsl debug spec.yaml "did you eat"



TTS-DSL Debugger v11

Loaded spec: spec.yaml

Input: "did you eat" (3 words, 7 phones)



(tts) break phase sandhi after

Breakpoint 1 set: after phase 'sandhi'



(tts) run

Running...

Hit breakpoint 1: after phase 'sandhi'



(tts) diff

Phase diff (init → sandhi):

  Tokens:

    - deleted: phone_3 (d)

    - deleted: phone_4 (j)  

    + inserted: phone_3a (dʒ) [rule: coalesce_dj, citation: Cruttenden 2014 §10.3]

  Sync marks:

    - removed (gc): s4



(tts) explain phone_3a duration

Token: phone_3a (dʒ)

Field: duration



Base: 100ms (from inventory: dʒ)

Effects: (none yet - duration phase hasn't run)

Current: 100ms



(tts) step phase

Running phase: allophonic...

Done. 2 releases inserted.



(tts) step phase  

Running phase: duration...

Done. 5 scalars resolved.



(tts) explain phone_5 duration

Token: phone_5 (i)

Field: duration



Base: 100ms (from inventory: i)

Floor: 42ms (Klatt 1976)



Effects applied:

  1. stress_lengthening [Klatt 1976 §III.B]

     op: mul, value: 1.3 (stress=1)

     100ms → 117ms (Klatt: 1.3 \* (100-42) + 42 = 117)

     

  2. phrase_final_lengthening [Klatt 1976 §III.A]

     op: mul, value: 1.3 (boundary=major)

     117ms → 140ms (Klatt: 1.3 \* (117-42) + 42 = 140)



Final: 140ms



(tts) why-not insert_aspiration phone_1

Rule: insert_aspiration

Token: phone_1 (d)



Match attempted at position 0

Step 0: capture 'stop' where "f.manner = 'stop' and f.voicing = 'voiceless'"

  f.manner = 'stop' → true

  f.voicing = 'voiceless' → false (actual: 'voiced')

  

Result: FAILED at step 0 (where_false)

Reason: /d/ is voiced; rule requires voiceless stop



(tts) visualize

Generated: ./debug/timeline.html



(tts) quit

```



This tooling is what makes the difference between "interesting research project" and "system someone can actually debug."





## Appendix A: Complete Example



```yaml

include: [streams.yaml]



parameters:

  stress_factor: 1.3      # Klatt 1976: stressed ~1.3x unstressed

  clipping_factor: 0.6    # Chen 1970: ~60% before voiceless

  base_f0: 110            # typical male fundamental



patterns:

  stop_before_sonorant:

    stream: phone

    scope: syllable

    max_lookahead: 20

    sequence:

      - capture: stop

        where: "current.f.manner = 'stop'"

      - capture: son

        where: "current.f.manner in ['vowel', 'nasal', 'liquid', 'glide']"



  d_j_coalescence:

    stream: phone

    scope: phrase

    cross_boundary: true

    sequence:

      - capture: d

        where: "current.f.manner = 'stop' and current.f.place = 'alveolar' and current.f.voicing = 'voiced'"

      - capture: j

        where: "current.f.manner = 'glide' and current.f.place = 'palatal'"

    constraint: "$parent(d, 'word').id != $parent(j, 'word').id"



phases:

  - name: sandhi

    rules: [coalesce_dj]



  - name: allophonic

    rules: [insert_release]



  - name: duration

    rules: [stress_lengthening]

    resolve_scalars: [duration]

    compute_times: true



  - name: prosody

    rules: [f0_targets]

    resolve_points: [f0]



rules:

  # Cruttenden 2014 §10.3: yod coalescence /dj/ → /dʒ/

  coalesce_dj:

    citation: "Cruttenden 2014 §10.3"

    match: d_j_coalescence

    splice:

      type: replace_range

      range_left: d.sync_left

      range_right: j.sync_right

      delete: [d, j]

      insert:

        - name: "'dʒ'"

          parent: "$parent(d, 'syllable')"



  # Stevens 1998 Ch.8: stop release burst modeling

  insert_release:

    citation: "Stevens 1998 Ch.8"

    match: stop_before_sonorant

    splice:

      type: insert_at_boundary

      boundary: stop.sync_right

      side: after

      insert:

        - name: "stop.name \& '_rel'"



  # Klatt 1976 §III.B: stressed vowels longer

  stress_lengthening:

    citation: "Klatt 1976 §III.B"

    select:

      stream: phone

      where: "current.f.manner = 'vowel'"

    apply:

      - field: duration

        op: mul

        value: "$parent(current, 'syllable').f.stress = 1 ? params.stress_factor : 1"

        tag: stress



  # Pierrehumbert 1980: F0 targets at vowel midpoints with declination

  f0_targets:

    citation: "Pierrehumbert 1980"

    select:

      stream: phone

      where: "current.f.manner = 'vowel'"

    insert_point:

      stream: f0

      at: "$midpoint(current)"

      value: "params.base_f0 \* (1.1 - 0.2 \* $index(current) / $total('phone'))"

      tag: f0

```



---



## Appendix B: Glossary



| Term | Definition |

|------|------------|

| Sync mark | Coordination point with stable ID and fixed-length rank order |

| Rank | Fixed-length base-36 ordering key for sync marks |

| Interior mark | Sync mark inside a base interval (interpolated time) |

| Splice | Atomic delete+insert on base stream |

| Span | Stable token whose boundaries are recomputed from children |

| Effect | Scalar operation with monotonic order |

| Klatt resolution | Duration with incompressibility floor |

| JSONata | Expression language (data-root model, $ for registered functions) |



---



## Appendix C: References



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

## Appendix D: Implementation Notes

### D.1 Snapshot Strategy

Use copy-on-write:

- Snapshot = immutable view (shared structure)
- Patch application creates new arrays only for affected streams
- Same semantics, no quadratic copying

### D.2 Rank Utilities (Informative)

```typescript
// order_rank.ts
// Fixed-length base36 rank operations for SyncMark ordering.
// Node 18+ / TS 5.x. No external deps.

export const RANK_LEN = 12 as const;
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz" as const;
const BASE = 36n;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function isRankChar(c: string): boolean {
  return c.length === 1 && ((c >= "0" && c <= "9") || (c >= "a" && c <= "z"));
}

export function isRank(s: string): boolean {
  return s.length === RANK_LEN && [...s].every(isRankChar);
}

export function rankToBigInt(rank: string): bigint {
  assert(isRank(rank), `invalid rank: ${rank}`);
  let x = 0n;
  for (const ch of rank) {
    const v = BigInt(ALPHABET.indexOf(ch));
    assert(v >= 0n, `invalid rank char: ${ch}`);
    x = x * BASE + v;
  }
  return x;
}

export function bigIntToRank(x: bigint): string {
  assert(x >= 0n, "rank bigint must be non-negative");
  const max = maxRankBigInt();
  assert(x <= max, `rank bigint overflow: ${x} > ${max}`);

  let n = x;
  const chars: string[] = [];
  for (let i = 0; i < RANK_LEN; i++) {
    const rem = n % BASE;
    n = n / BASE;
    chars.push(ALPHABET[Number(rem)]);
  }
  // chars are least significant first
  chars.reverse();
  return chars.join("");
}

export function maxRankBigInt(): bigint {
  // 36^RANK_LEN - 1
  let p = 1n;
  for (let i = 0; i < RANK_LEN; i++) p *= BASE;
  return p - 1n;
}

export function compareRank(a: string, b: string): number {
  assert(isRank(a) && isRank(b), "compareRank expects fixed-length ranks");
  // Lex compare works because fixed-length and alphabet is ordered in ASCII for 0-9a-z.
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export type OrderKey =
  | { kind: "START" }
  | { kind: "FINITE"; rank: string }
  | { kind: "END" };

export function compareOrder(a: OrderKey, b: OrderKey): number {
  const kindOrder: Record<OrderKey["kind"], number> = { START: 0, FINITE: 1, END: 2 };
  if (a.kind !== b.kind) return kindOrder[a.kind] - kindOrder[b.kind];
  if (a.kind === "FINITE" && b.kind === "FINITE") return compareRank(a.rank, b.rank);
  return 0;
}

/**
 * Compute a rank strictly between lo and hi.
 * lo=null means START boundary (numeric 0)
 * hi=null means END boundary (numeric MAX)
 *
 * Throws if there is no representable midpoint (caller should rebalance and retry).
 */
export function rankBetween(lo: string | null, hi: string | null): string {
  const loVal = lo === null ? 0n : rankToBigInt(lo);
  const hiVal = hi === null ? maxRankBigInt() : rankToBigInt(hi);

  assert(loVal < hiVal, `rankBetween requires lo < hi (got ${loVal} >= ${hiVal})`);

  const mid = (loVal + hiVal) / 2n;
  // Ensure strict interior
  if (mid === loVal || mid === hiVal) {
    throw new Error("E_RANK_NO_SPACE: no representable midpoint; rebalance required");
  }
  return bigIntToRank(mid);
}

/**
 * Rebalance ranks for an ordered list of items into evenly-spaced ranks.
 * Returns array of ranks in the same order.
 */
export function rebalanceRanks(count: number): string[] {
  assert(Number.isInteger(count) && count >= 0, "count must be a non-negative integer");
  const max = maxRankBigInt();
  const out: string[] = [];
  for (let i = 1; i <= count; i++) {
    const v = (BigInt(i) * max) / BigInt(count + 1);
    out.push(bigIntToRank(v));
  }
  // strictly increasing guaranteed when count << 36^RANK_LEN; if it fails, increase RANK_LEN
  for (let i = 1; i < out.length; i++) {
    assert(out[i - 1] < out[i], "rebalance produced non-increasing ranks; increase RANK_LEN");
  }
  return out;
}

/* ------------------------ self-test (node) ------------------------ */
if (require.main === module) {
  const a = bigIntToRank(1000n);
  const b = bigIntToRank(2000n);
  const m = rankBetween(a, b);
  assert(a < m && m < b, "midpoint not between");

  const rs = rebalanceRanks(5);
  assert(rs.length === 5, "rebalance length mismatch");
  for (let i = 1; i < rs.length; i++) assert(rs[i - 1] < rs[i], "rebalance not sorted");

  console.log("order_rank.ts self-test: OK");
}
```

### D.3 JSONata Integration

```javascript
const expr = jsonata("$parent(current, 'syllable').f.stress = 1");

// Register navigation functions
expr.registerFunction('parent', (token, stream) => {
    return engine.getParent(token, stream);
});

// Evaluate with data root
const result = expr.evaluate({
    current: currentToken,
    params: parameters
});
```

---


