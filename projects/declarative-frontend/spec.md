# Declarative TTS Frontend DSL v11



A domain-specific language for phonological and phonetic rules in speech synthesis, based on the multi-stream synchronization model of Hertz (1982, 1991).



---



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

function compareOrder(a: OrderKey, b: OrderKey): number {

  const kindOrder = { START: 0, FINITE: 1, END: 2 };

  if (a.kind !== b.kind) return kindOrder[a.kind] - kindOrder[b.kind];

  if (a.kind === 'FINITE' && b.kind === 'FINITE') {

    return a.rank.localeCompare(b.rank);  // lexicographic

  }

  return 0;  // both START or both END

}

```



**Sentinels:** `START` and `END` are not literal rank strings. They compare as infinities, ensuring no insertion can ever sort before START or after END.



**Finite ranks:** Use base-36 strings (`[0-9a-z]+`). Insertion between ranks uses the algorithm in §11.2.



### 1.2 Sentinels



```typescript

const START: SyncMark = { id: 'START', order: { kind: 'START' }, time: 0 };

const END: SyncMark   = { id: 'END', order: { kind: 'END' }, time: null };

```



\- `START` always compares less than any finite rank

\- `END` always compares greater than any finite rank

\- No insertion can produce a rank outside `[START, END]`

\- Empty utterance: START and END only



**Interior marks:** A sync mark may exist inside a base token interval. Time computed by interpolation (§5.11).



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

            # Empty span: collapse to a point

            # Find the boundary where children used to be

            span.sync_left = span.sync_right  # or preserve last known

            warn(f"Span {span.id} has no children (empty)")

            continue

        span.sync_left = min(c.sync_left for c in children, key=order)

        span.sync_right = max(c.sync_right for c in children, key=order)

```



### 3.3 Topology



```yaml

topology:

  hierarchy: [phrase, word, syllable, phone]

  parallel: [tone]

  point: [f0]

```



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



```

1\. SNAPSHOT           Copy-on-write view of streams

2\. MATCH + EVALUATE   Find matches, evaluate expressions

3\. GENERATE PATCHES   Create patch objects

4\. SORT PATCHES       Deterministic order

5\. BATCH BASE SPLICES Group base edits by affected range

6\. APPLY PATCHES      Execute as batched splice plans

7\. ASSOCIATION GC     Remove deleted IDs from association sets

8\. SYNC MARK GC       Remove unreferenced marks; apply interior mark policy

9\. REBUILD SPANS      Recompute span boundaries

10\. RESOLVE SCALARS   Collapse effect stacks

11\. COMPUTE TIMES     Assign times to sync marks

12\. RESOLVE POINTS    Evaluate deferred values, assign times

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

\- Association GC (§5.7) removes references to deleted tokens



### 5.3 Token Specification



```typescript

interface TokenSpec {

  name: string | Expr;

  features?: Record<string, Value | Expr>;

  scalars?: Record<string, { base?: number; floor?: number }>;

  parent?: TokenId | Expr | 'inherit_left';  // default: inherit_left

}

```



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



```python

def apply_base_splices(base_stream, patches):

    """Apply all base splices as a single batched operation."""

    

    # Group overlapping/adjacent patches

    groups = group_overlapping_ranges(patches)

    

    for group in groups:

        # Merge into single splice operation

        merged_left = min(p.range_left for p in group)

        merged_right = max(p.range_right for p in group)

        all_deletes = union(p.delete_tokens for p in group)

        all_inserts = flatten_sorted(p.insert_tokens for p in group)

        

        # Execute splice

        # 1. Remove deleted tokens

        # 2. Compute sync marks needed for inserts

        # 3. Insert new tokens partitioning [merged_left, merged_right]

        execute_splice(base_stream, merged_left, merged_right, 

                       all_deletes, all_inserts)

```



**Insert ordering:** Within a group, inserts are ordered by `(patch.rule_index, patch.match_index, patch.patch_seq, position_in_insert_tokens)`.



### 5.6 Insertion at END



To append a token at the end of the utterance:



```yaml

insert:

  range_left: "last_token.sync_right"  # boundary before END

  range_right: "END"

  insert_tokens: [...]

```



The splice algorithm creates new sync mark(s) between the specified boundaries.



### 5.7 Interior Mark Policy



When a base token is deleted:



1\. **Boundary marks survive** if referenced by another token

2\. **Interior marks:** Apply deletion policy



```yaml

topology:

  interior_mark_policy: elastic  # or 'strict'

```



**elastic (default):** Interior marks persist. If the containing interval collapses to 0ms, the mark exists at that point. If a new token spans that region, the mark's time is interpolated within it.



**strict:** Interior marks are deleted when their containing base token is deleted. Point tokens anchored to deleted marks are also deleted (with warning).



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

def compute_times(base_stream, all_sync_marks):

    # Step 1: Base boundaries get concrete times

    time = 0

    for token in base_stream.tokens_in_order():

        token.sync_left.time = time

        time += token.s.duration

        token.sync_right.time = time

    

    # Step 2: Interior marks by uniform distribution

    for token in base_stream.tokens_in_order():

        left_order = token.sync_left.order

        right_order = token.sync_right.order

        left_time = token.sync_left.time

        right_time = token.sync_right.time

        

        # Find interior marks (strictly between boundaries)

        interior = [m for m in all_sync_marks 

                    if m.time is None 

                    and compare_order(left_order, m.order) < 0

                    and compare_order(m.order, right_order) < 0]

        

        if not interior:

            continue

        

        # Edge case: zero duration token

        if left_time == right_time:

            for mark in interior:

                mark.time = left_time  # all interior marks collapse to boundary

            continue

        

        # Sort by order, dedupe by ID (same rank shouldn't happen but be defensive)

        interior.sort(key=lambda m: (m.order, m.id))

        seen_ids = set()

        interior = [m for m in interior if m.id not in seen_ids and not seen_ids.add(m.id)]

        

        # Distribute uniformly: k/(n+1) for k=1..n

        n = len(interior)

        for k, mark in enumerate(interior, start=1):

            alpha = k / (n + 1)

            mark.time = left_time + alpha \* (right_time - left_time)

```



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

}

```



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

        value: "f.voicing = 'voiced' ? 50 : 60"

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



```yaml

validation:

  errors:

    - pattern_missing_stream

    - unknown_stream_reference

    - invalid_jsonata_syntax

    - invalid_feature_value

    - phase_order_violation

    - splice_conflict             # two splices delete same token with different inserts

    - invalid_ratio               # not in [0,1]

  

  warnings:

    - null_target_at_runtime

    - deleted_target_at_runtime

    - interior_mark_deleted        # strict policy applied

    - duration_edit_after_times    # may need recompute

    - missing_citation             # rule without citation field

    - empty_span                   # span with no children (collapsed)



  invariants:

    - base_coverage               # base partitions [START, END]

    - span_boundary_match         # spans match children (or empty)

    - time_monotonicity

```



**Splice overlap policy:**

\- Adjacent splices are allowed and batched together

\- Overlapping splices are resolved by sort order (rule_index, match_index, patch_seq)

\- **Conflict:** Two splices that both delete the same token but specify different insertions → error

\- **Not a conflict:** Two splices that affect adjacent/overlapping ranges but don't contradict



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

    - deleted: s4



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





## Part 11: Implementation Notes



### 11.1 Snapshot Strategy



Use copy-on-write:

\- Snapshot = immutable view (shared structure)

\- Patch application creates new arrays only for affected streams

\- Same semantics, no quadratic copying



### 11.2 Rank Insertion Algorithm



Ranks use base-36 alphabet: `0123456789abcdefghijklmnopqrstuvwxyz`



**Preconditions:**

\- All FINITE ranks are non-empty strings

\- Empty string `""` is not a valid rank

\- The initial rank for the first token is typically `"i"` (midpoint of alphabet)



```python

ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

BASE = len(ALPHABET)  # 36



def rank_between(a: str, b: str) -> str:

    """

    Generate a rank string that sorts between a and b.

    Precondition: a < b (lexicographically), both non-empty

    """

    assert a and b, "Ranks must be non-empty"

    assert a < b, "a must be less than b"

    

    # Pad shorter string

    max_len = max(len(a), len(b))

    a_padded = a.ljust(max_len, ALPHABET[0])

    b_padded = b.ljust(max_len, ALPHABET[-1])

    

    result = []

    for i in range(max_len):

        a_idx = ALPHABET.index(a_padded[i])

        b_idx = ALPHABET.index(b_padded[i])

        

        if a_idx + 1 < b_idx:

            # Gap exists: insert midpoint

            mid_idx = (a_idx + b_idx) // 2

            return ''.join(result) + ALPHABET[mid_idx]

        elif a_idx == b_idx:

            # Same char: continue to next position

            result.append(ALPHABET[a_idx])

        else:

            # Adjacent (a_idx + 1 == b_idx): need to extend

            result.append(ALPHABET[a_idx])

    

    # Strings are equal or adjacent at all positions: extend with midpoint

    return ''.join(result) + ALPHABET[BASE // 2]  # 'i'



def rank_after(a: str) -> str:

    """Generate rank after a (toward END sentinel)."""

    assert a, "Rank must be non-empty"

    return a + ALPHABET[BASE // 2]



def rank_before(b: str) -> str:

    """Generate rank before b (toward START sentinel)."""

    assert b, "Rank must be non-empty"

    last_idx = ALPHABET.index(b[-1])

    if last_idx > 0:

        return b[:-1] + ALPHABET[(last_idx - 1) // 2] if len(b) > 1 else ALPHABET[last_idx // 2]

    return b + ALPHABET[0]



def initial_rank() -> str:

    """Generate the first rank for an empty stream."""

    return ALPHABET[BASE // 2]  # 'i'

```



**Rebalancing:** If ranks become too long (> 50 chars), trigger a rebalance pass that reassigns all ranks to evenly-spaced short strings. This is rare in practice.



### 11.3 JSONata Integration



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

| Sync mark | Coordination point with stable ID and LexoRank order |

| LexoRank | String-based ordering allowing arbitrary insertion |

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

