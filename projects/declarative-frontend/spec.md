\# Declarative TTS Frontend DSL v11



A domain-specific language for phonological and phonetic rules in speech synthesis, based on the multi-stream synchronization model of Hertz (1982, 1991).



---



\## Part 1: Core Data Model



\### 1.1 Sync Marks



A single \*\*global sync axis\*\* coordinates all streams. This follows the Delta model (Hertz 1991) where multiple linguistic representations share synchronization points.



```typescript

// Order is a discriminated union, not a raw string

type OrderKey = 

&nbsp; | { kind: 'START' }

&nbsp; | { kind: 'FINITE', rank: string }

&nbsp; | { kind: 'END' };



interface SyncMark {

&nbsp; id: string;           // STABLE unique ID (never reassigned)

&nbsp; order: OrderKey;      // comparison key

&nbsp; time: number | null;  // concrete time in ms (after duration resolution)

}



// Comparator: START < all FINITE < END

function compareOrder(a: OrderKey, b: OrderKey): number {

&nbsp; const kindOrder = { START: 0, FINITE: 1, END: 2 };

&nbsp; if (a.kind !== b.kind) return kindOrder\[a.kind] - kindOrder\[b.kind];

&nbsp; if (a.kind === 'FINITE' \&\& b.kind === 'FINITE') {

&nbsp;   return a.rank.localeCompare(b.rank);  // lexicographic

&nbsp; }

&nbsp; return 0;  // both START or both END

}

```



\*\*Sentinels:\*\* `START` and `END` are not literal rank strings. They compare as infinities, ensuring no insertion can ever sort before START or after END.



\*\*Finite ranks:\*\* Use base-36 strings (`\[0-9a-z]+`). Insertion between ranks uses the algorithm in §11.2.



\### 1.2 Sentinels



```typescript

const START: SyncMark = { id: 'START', order: { kind: 'START' }, time: 0 };

const END: SyncMark   = { id: 'END', order: { kind: 'END' }, time: null };

```



\- `START` always compares less than any finite rank

\- `END` always compares greater than any finite rank

\- No insertion can produce a rank outside `\[START, END]`

\- Empty utterance: START and END only



\*\*Interior marks:\*\* A sync mark may exist inside a base token interval. Time computed by interpolation (§5.11).



\### 1.3 Interval Tokens



```typescript

interface IntervalToken {

&nbsp; id: string;

&nbsp; stream: string;

&nbsp; name: string;

&nbsp; sync\_left: SyncMarkId;

&nbsp; sync\_right: SyncMarkId;

&nbsp; features: Record<string, Value>;

&nbsp; scalars: Record<string, ScalarState>;

&nbsp; parent: TokenId | null;

&nbsp; associations: Record<string, Set<TokenId>>;

}

```



\*\*Invariant:\*\* `sync\_left.order < sync\_right.order`



\### 1.4 Point Tokens



```typescript

interface PointToken {

&nbsp; id: string;

&nbsp; stream: string;

&nbsp; anchor\_left: SyncMarkId;

&nbsp; anchor\_right: SyncMarkId;

&nbsp; ratio: number;              // 0.0-1.0, validated

&nbsp; value: number | null;

&nbsp; value\_expr: DeferredExpr | null;

&nbsp; time: number | null;        // computed at resolution

}

```



\*\*Constraints:\*\*

\- `0 <= ratio <= 1`

\- If `anchor\_left == anchor\_right`, ratio normalized to 0



\*\*Time:\*\* `time = anchor\_left.time + ratio × (anchor\_right.time - anchor\_left.time)`



\### 1.5 Stream Types



| Type | Token | Partitions? | Lifecycle |

|------|-------|-------------|-----------|

| `base` | interval | Yes | Mutable via splice |

| `span` | interval | Within parent | Stable IDs, boundaries recomputed |

| `parallel` | interval | No | Mutable |

| `point` | point | N/A | Mutable |



\### 1.6 Scalar State



```typescript

interface ScalarState {

&nbsp; base: number;

&nbsp; floor: number | null;

&nbsp; effects: ResolvedEffect\[];

&nbsp; resolved: number | null;

}



interface ResolvedEffect {

&nbsp; field: string;

&nbsp; op: 'set' | 'mul' | 'add';

&nbsp; value: number;

&nbsp; tag: string;

&nbsp; rule: string;

&nbsp; order: number;              // assigned at patch application time

}

```



\*\*Effect ordering:\*\* `order` is assigned as a monotonic integer during patch application, in global application order. Within a single patch, effects are ordered by their position in the YAML list.



\### 1.7 Klatt Incompressibility



From Klatt (1976) Eq. 1:



```

D\_f = K × (D\_i - D\_min) + D\_min

```



Only the compressible portion `(D\_i - D\_min)` scales. This prevents unnaturally short durations when multiple shortening rules stack. See Klatt (1976) Table II for `D\_min` values: vowels ~0.42-0.45 × inherent duration, consonants ~0.5-0.6.



---



\## Part 2: Expression Language (JSONata)



Expressions use \[JSONata](https://jsonata.org).



\### 2.1 Evaluation Model



\*\*Data root model:\*\* The context is passed as the data root. Expressions access fields directly without `$` prefix.



```javascript

// Context for select rules:

{

&nbsp; "current": { "name": "æ", "f": {...}, "s": {...} },

&nbsp; "params": { "stress\_factor": 1.3 }

}



// Expression (note: no $ on current/params):

"current.f.manner = 'vowel'"

```



\*\*Registered functions\*\* use `$` prefix:



```javascript

"$parent(current, 'syllable').f.stress = 1"

"$next(current).f.manner"

```



\### 2.2 Expression Context



Expressions receive a \*\*TokenView\*\* facade, not the raw token model:



```typescript

interface TokenView {

&nbsp; id: string;

&nbsp; name: string;

&nbsp; f: Record<string, Value>;           // features (alias for features)

&nbsp; s: Record<string, number | null>;   // resolved scalar values

&nbsp; sync\_left: SyncMarkId;

&nbsp; sync\_right: SyncMarkId;

&nbsp; parent: TokenId | null;

}

```



\*\*Mapping from internal model:\*\*

\- `t.f` → `t.features`

\- `t.s.duration` → `t.scalars.duration.resolved ?? t.scalars.duration.base`

\- Raw `ScalarState` objects are not exposed (use tracing for debugging)



\*\*Select rules:\*\*

```javascript

{

&nbsp; "current": TokenView,

&nbsp; "params": Record<string, Value>

}

```



\*\*Pattern rules:\*\*

```javascript

{

&nbsp; "stop": TokenView,      // capture name

&nbsp; "son": TokenView,       // capture name

&nbsp; "current": TokenView,   // current step being evaluated (in where clauses)

&nbsp; "params": Record<string, Value>

}

```



\### 2.3 Registered Functions



| Function | Returns |

|----------|---------|

| `$prev(t)` | Token \\| null |

| `$next(t)` | Token \\| null |

| `$prev\_sibling(t)` | Token \\| null |

| `$next\_sibling(t)` | Token \\| null |

| `$parent(t, stream)` | Token \\| null |

| `$children(t, stream)` | Token\[] |

| `$assoc(t, name)` | Token\[] |

| `$spanning(t, stream)` | Token\[] |

| `$index(t)` | number |

| `$total(stream)` | number |

| `$midpoint(t)` | Anchor |

| `$at\_ratio(t, r)` | Anchor |

| `$at\_sync(s)` | Anchor |



\### 2.4 Undefined Handling



JSONata's native `undefined` propagation applies:

\- `undefined.field` → `undefined`

\- `undefined = x` → `false`

\- Arithmetic with `undefined` → `undefined` → comparison fails



This is correct for sparse linguistic features.



\### 2.5 Examples



All expressions require explicit `current.` prefix in select rules. No syntactic sugar.



```yaml

\# Feature check (select rule)

where: "current.f.manner = 'vowel'"



\# Parent navigation

value: "$parent(current, 'syllable').f.stress = 1 ? params.stress\_factor : 1"



\# Pattern constraint (captures are in scope)

constraint: "obs.f.voicing = 'voiceless'"



\# Chained navigation

constraint: "$next(stop).f.manner in \['vowel', 'nasal'] and $parent(stop, 'word').f.pos = 'verb'"

```



\*\*Rationale:\*\* One mental model. Data fields have no prefix, registered functions use `$`. No magic expansion.



---



\## Part 3: Stream Definitions



\### 3.1 Base Stream



```yaml

streams:

&nbsp; phone:

&nbsp;   type: base

&nbsp;   

&nbsp;   features:

&nbsp;     place: \[labial, alveolar, palatal, velar, glottal]

&nbsp;     manner: \[stop, fricative, affricate, nasal, liquid, glide, vowel, silence, release, aspiration]

&nbsp;     voicing: \[voiced, voiceless]

&nbsp;     height: \[high, mid, low]

&nbsp;     backness: \[front, central, back]

&nbsp;   

&nbsp;   scalars:

&nbsp;     duration:

&nbsp;       unit: ms

&nbsp;       base\_field: dur

&nbsp;       floor\_field: dur\_min

&nbsp;       resolution: klatt

&nbsp;       max: 500

&nbsp;     F1: {unit: Hz, base\_field: F1, resolution: standard, min: 200, max: 1000}

&nbsp;     B1: {unit: Hz, base\_field: B1, resolution: standard, min: 30, max: 500}

&nbsp;     F2: {unit: Hz, base\_field: F2, resolution: standard, min: 500, max: 3000}

&nbsp;     B2: {unit: Hz, base\_field: B2, resolution: standard, min: 50, max: 500}

&nbsp;     F3: {unit: Hz, base\_field: F3, resolution: standard, min: 1500, max: 4000}

&nbsp;     B3: {unit: Hz, base\_field: B3, resolution: standard, min: 100, max: 500}

&nbsp;     AV: {unit: dB, base\_field: AV, resolution: standard, min: 0, max: 70}

&nbsp;     AH: {unit: dB, base\_field: AH, resolution: standard, min: 0, max: 70}

&nbsp;     AF: {unit: dB, base\_field: AF, resolution: standard, min: 0, max: 80}

&nbsp;   

&nbsp;   inventory:

&nbsp;     æ:

&nbsp;       features: {height: low, backness: front, manner: vowel}

&nbsp;       targets: {F1: 660, B1: 70, F2: 1720, B2: 100, F3: 2410, B3: 150,

&nbsp;                 dur: 240, dur\_min: 105, AV: 60, AH: 0, AF: 0}

&nbsp;     # ... (abbreviated)



&nbsp; phrase:

&nbsp;   type: span

&nbsp;   spans: word

&nbsp;   features:

&nbsp;     boundary: \[none, minor, major]



&nbsp; word:

&nbsp;   type: span

&nbsp;   spans: syllable

&nbsp;   features:

&nbsp;     pos: \[noun, verb, adj, adv, func, punct]



&nbsp; syllable:

&nbsp;   type: span

&nbsp;   spans: phone

&nbsp;   features:

&nbsp;     stress: \[0, 1, 2]

&nbsp;     boundary: \[none, minor, major]



&nbsp; tone:

&nbsp;   type: parallel

&nbsp;   features:

&nbsp;     pitch: \[H, L, M, HL, LH]

&nbsp;     floating: \[true, false]



&nbsp; f0:

&nbsp;   type: point

&nbsp;   value\_type: number

&nbsp;   unit: Hz

```



\### 3.2 Span Lifecycle



\*\*Span tokens are stable.\*\* They are created by upstream processing (lexer, syllabifier) and persist throughout rule evaluation. The "rebuild" step (§5.9) only recomputes boundaries; it never creates or destroys span tokens.



\*\*Empty spans:\*\* If all children of a span are deleted (e.g., by coalescence), the span becomes empty:

\- Boundaries collapse: `sync\_left == sync\_right`

\- The span persists for provenance and alignment

\- Empty spans have zero duration but remain in the hierarchy

\- This is a warning, not an error



```python

def rebuild\_span\_boundaries(span\_stream, child\_stream):

&nbsp;   """Update span boundaries from children. Spans must already exist."""

&nbsp;   for span in span\_stream.tokens:

&nbsp;       children = \[t for t in child\_stream.tokens if t.parent == span.id]

&nbsp;       if not children:

&nbsp;           # Empty span: collapse to a point

&nbsp;           # Find the boundary where children used to be

&nbsp;           span.sync\_left = span.sync\_right  # or preserve last known

&nbsp;           warn(f"Span {span.id} has no children (empty)")

&nbsp;           continue

&nbsp;       span.sync\_left = min(c.sync\_left for c in children, key=order)

&nbsp;       span.sync\_right = max(c.sync\_right for c in children, key=order)

```



\### 3.3 Topology



```yaml

topology:

&nbsp; hierarchy: \[phrase, word, syllable, phone]

&nbsp; parallel: \[tone]

&nbsp; point: \[f0]

```



---



\## Part 4: Pattern Matching



\### 4.1 Pattern Definition



```yaml

patterns:

&nbsp; stop\_before\_sonorant:

&nbsp;   stream: phone

&nbsp;   scope: syllable

&nbsp;   max\_lookahead: 50

&nbsp;   sequence:

&nbsp;     - capture: stop

&nbsp;       where: "current.f.manner = 'stop'"

&nbsp;     - capture: son

&nbsp;       where: "current.f.manner in \['vowel', 'nasal', 'liquid', 'glide']"

```



\*\*max\_lookahead:\*\*

\- Unit: tokens in the stream

\- Default: 100 if omitted

\- Behavior when exceeded: match fails at current position (no error, continues to next position)

\- Scope: total tokens examined for the entire pattern (not per-step)



\### 4.2 Cross-Boundary Matching



```yaml

patterns:

&nbsp; d\_j\_coalescence:

&nbsp;   stream: phone

&nbsp;   scope: phrase

&nbsp;   cross\_boundary: true

&nbsp;   sequence:

&nbsp;     - capture: d

&nbsp;       where: "current.f.manner = 'stop' and current.f.place = 'alveolar' and current.f.voicing = 'voiced'"

&nbsp;     - capture: j

&nbsp;       where: "current.f.manner = 'glide' and current.f.place = 'palatal'"

&nbsp;   constraint: "$parent(d, 'word').id != $parent(j, 'word').id"

```



\### 4.3 Scope: utterance



The special scope `utterance` means `\[START, END]` with no parent constraint:



```yaml

patterns:

&nbsp; utterance\_final:

&nbsp;   stream: phone

&nbsp;   scope: utterance

&nbsp;   sequence:

&nbsp;     - capture: final

&nbsp;       where: "$next(current) = null"

```



\### 4.4 Capture Shape



| Quantifier | Shape | On no match |

|------------|-------|-------------|

| (none) | Token | Fails |

| `optional: true` | Token \\| null | null |

| `repeat: "\*"` | Token\[] | \[] |

| `repeat: "+"` | Token\[] | Fails |



---



\## Part 5: Rule Evaluation



\### 5.1 Pipeline



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



\### 5.2 Patch Types



Base stream mutations use one of three splice variants:



```typescript

// Point insertion: insert at a boundary, no deletions

interface InsertAtBoundaryPatch {

&nbsp; type: 'insert\_at\_boundary';

&nbsp; boundary: SyncMarkId;

&nbsp; side: 'before' | 'after';       // which direction to extend

&nbsp; insert\_tokens: TokenSpec\[];

&nbsp; rule: string;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}



// Replacement: delete tokens and insert replacements

interface ReplaceRangePatch {

&nbsp; type: 'replace\_range';

&nbsp; range\_left: SyncMarkId;         // left boundary of affected region

&nbsp; range\_right: SyncMarkId;        // right boundary of affected region

&nbsp; delete\_tokens: TokenId\[];       // tokens to remove (must be within range)

&nbsp; insert\_tokens: TokenSpec\[];     // tokens to insert (partition the range)

&nbsp; rule: string;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}



// Pure deletion: remove tokens, no insertions

interface DeleteTokensPatch {

&nbsp; type: 'delete\_tokens';

&nbsp; delete\_tokens: TokenId\[];

&nbsp; rule: string;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}



type BaseSplicePatch = InsertAtBoundaryPatch | ReplaceRangePatch | DeleteTokensPatch;

```



```typescript

// Non-base interval insertion

interface InsertIntervalPatch {

&nbsp; type: 'insert\_interval';

&nbsp; stream: string;               // NOT base

&nbsp; sync\_left: SyncMarkId;

&nbsp; sync\_right: SyncMarkId;

&nbsp; token: TokenSpec;

&nbsp; rule: string;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}



// Point insertion

interface InsertPointPatch {

&nbsp; type: 'insert\_point';

&nbsp; stream: string;

&nbsp; anchor\_left: SyncMarkId;

&nbsp; anchor\_right: SyncMarkId;

&nbsp; ratio: number;

&nbsp; value\_expr: DeferredExpr;

&nbsp; context: CapturedContext;

&nbsp; rule: string;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}



// Modification (any stream)

interface ModifyPatch {

&nbsp; type: 'modify';

&nbsp; target: TokenId;

&nbsp; effects: ResolvedEffect\[];

&nbsp; rule: string;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}



// Deletion (non-base only; use splice for base)

interface DeletePatch {

&nbsp; type: 'delete';

&nbsp; stream: string;               // NOT base

&nbsp; target: TokenId;

&nbsp; rule: string;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}



// Create association

interface AssociatePatch {

&nbsp; type: 'associate';

&nbsp; from: TokenId;

&nbsp; to: TokenId;

&nbsp; assoc\_name: string;

&nbsp; rule: string;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}



// Remove association

interface DisassociatePatch {

&nbsp; type: 'disassociate';

&nbsp; from: TokenId;

&nbsp; to: TokenId;

&nbsp; assoc\_name: string;

&nbsp; rule: string;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}

```



\*\*Association semantics:\*\*

\- Associations are many-to-many: a token can have multiple associations of the same type

\- Initial associations may be created by upstream processing or by rules

\- `AssociatePatch` adds `to` to `from.associations\[assoc\_name]`

\- `DisassociatePatch` removes `to` from `from.associations\[assoc\_name]`

\- Association GC (§5.7) removes references to deleted tokens



\### 5.3 Token Specification



```typescript

interface TokenSpec {

&nbsp; name: string | Expr;

&nbsp; features?: Record<string, Value | Expr>;

&nbsp; scalars?: Record<string, { base?: number; floor?: number }>;

&nbsp; parent?: TokenId | Expr | 'inherit\_left';  // default: inherit\_left

}

```



\*\*Parent inheritance:\*\* If `parent` is omitted or `'inherit\_left'`, the new token inherits the parent of the token immediately to its left.



\### 5.4 Patch Ordering



Sort key: `(rule\_index, match\_index, patch\_seq)`



\- `rule\_index`: position of rule in phase's rule list

\- `match\_index`: which match of this rule (0, 1, 2, ...)

\- `patch\_seq`: which patch from this match (for rules generating multiple patches)



\*\*Rationale:\*\* Ordering is fully determined by rule list position and match order. No priority field needed. If a rule must run before others, place it earlier in the phase or in an earlier phase.



\### 5.5 Base Stream Splice



Base stream mutations use the `BaseSplicePatch` discriminated union (§5.2):



\- `InsertAtBoundaryPatch`: point insertion at a sync mark

\- `ReplaceRangePatch`: delete tokens and insert replacements

\- `DeleteTokensPatch`: remove tokens with no replacement



\*\*Algorithm:\*\*



```python

def apply\_base\_splices(base\_stream, patches):

&nbsp;   """Apply all base splices as a single batched operation."""

&nbsp;   

&nbsp;   # Group overlapping/adjacent patches

&nbsp;   groups = group\_overlapping\_ranges(patches)

&nbsp;   

&nbsp;   for group in groups:

&nbsp;       # Merge into single splice operation

&nbsp;       merged\_left = min(p.range\_left for p in group)

&nbsp;       merged\_right = max(p.range\_right for p in group)

&nbsp;       all\_deletes = union(p.delete\_tokens for p in group)

&nbsp;       all\_inserts = flatten\_sorted(p.insert\_tokens for p in group)

&nbsp;       

&nbsp;       # Execute splice

&nbsp;       # 1. Remove deleted tokens

&nbsp;       # 2. Compute sync marks needed for inserts

&nbsp;       # 3. Insert new tokens partitioning \[merged\_left, merged\_right]

&nbsp;       execute\_splice(base\_stream, merged\_left, merged\_right, 

&nbsp;                      all\_deletes, all\_inserts)

```



\*\*Insert ordering:\*\* Within a group, inserts are ordered by `(patch.rule\_index, patch.match\_index, patch.patch\_seq, position\_in\_insert\_tokens)`.



\### 5.6 Insertion at END



To append a token at the end of the utterance:



```yaml

insert:

&nbsp; range\_left: "last\_token.sync\_right"  # boundary before END

&nbsp; range\_right: "END"

&nbsp; insert\_tokens: \[...]

```



The splice algorithm creates new sync mark(s) between the specified boundaries.



\### 5.7 Interior Mark Policy



When a base token is deleted:



1\. \*\*Boundary marks survive\*\* if referenced by another token

2\. \*\*Interior marks:\*\* Apply deletion policy



```yaml

topology:

&nbsp; interior\_mark\_policy: elastic  # or 'strict'

```



\*\*elastic (default):\*\* Interior marks persist. If the containing interval collapses to 0ms, the mark exists at that point. If a new token spans that region, the mark's time is interpolated within it.



\*\*strict:\*\* Interior marks are deleted when their containing base token is deleted. Point tokens anchored to deleted marks are also deleted (with warning).



\### 5.8 Association GC



After patch application, scan all tokens and remove any TokenId from association sets that no longer exists.



\### 5.9 Span Boundary Rebuild



After base splices, recompute span boundaries bottom-up through hierarchy:



```python

for stream in reversed(topology.hierarchy\[:-1]):  # skip base

&nbsp;   rebuild\_span\_boundaries(stream, child\_stream\_of(stream))

```



\### 5.10 Scalar Resolution



\*\*Standard:\*\*

```python

def resolve\_standard(base, effects, min\_val, max\_val):

&nbsp;   v = base

&nbsp;   for e in sorted(effects, key=lambda x: x.order):

&nbsp;       if e.op == 'set': v = e.value

&nbsp;       elif e.op == 'mul': v = v \* e.value

&nbsp;       elif e.op == 'add': v = v + e.value

&nbsp;   return clamp(v, min\_val, max\_val)

```



\*\*Klatt:\*\*

```python

def resolve\_klatt(base, floor, effects, max\_val):

&nbsp;   d = base

&nbsp;   for e in sorted(effects, key=lambda x: x.order):

&nbsp;       if e.op == 'set': d = e.value

&nbsp;       elif e.op == 'mul': d = e.value \* (d - floor) + floor

&nbsp;       elif e.op == 'add': d = d + e.value

&nbsp;   return clamp(d, floor, max\_val)

```



\### 5.11 Time Computation



```python

def compute\_times(base\_stream, all\_sync\_marks):

&nbsp;   # Step 1: Base boundaries get concrete times

&nbsp;   time = 0

&nbsp;   for token in base\_stream.tokens\_in\_order():

&nbsp;       token.sync\_left.time = time

&nbsp;       time += token.s.duration

&nbsp;       token.sync\_right.time = time

&nbsp;   

&nbsp;   # Step 2: Interior marks by uniform distribution

&nbsp;   for token in base\_stream.tokens\_in\_order():

&nbsp;       left\_order = token.sync\_left.order

&nbsp;       right\_order = token.sync\_right.order

&nbsp;       left\_time = token.sync\_left.time

&nbsp;       right\_time = token.sync\_right.time

&nbsp;       

&nbsp;       # Find interior marks (strictly between boundaries)

&nbsp;       interior = \[m for m in all\_sync\_marks 

&nbsp;                   if m.time is None 

&nbsp;                   and compare\_order(left\_order, m.order) < 0

&nbsp;                   and compare\_order(m.order, right\_order) < 0]

&nbsp;       

&nbsp;       if not interior:

&nbsp;           continue

&nbsp;       

&nbsp;       # Edge case: zero duration token

&nbsp;       if left\_time == right\_time:

&nbsp;           for mark in interior:

&nbsp;               mark.time = left\_time  # all interior marks collapse to boundary

&nbsp;           continue

&nbsp;       

&nbsp;       # Sort by order, dedupe by ID (same rank shouldn't happen but be defensive)

&nbsp;       interior.sort(key=lambda m: (m.order, m.id))

&nbsp;       seen\_ids = set()

&nbsp;       interior = \[m for m in interior if m.id not in seen\_ids and not seen\_ids.add(m.id)]

&nbsp;       

&nbsp;       # Distribute uniformly: k/(n+1) for k=1..n

&nbsp;       n = len(interior)

&nbsp;       for k, mark in enumerate(interior, start=1):

&nbsp;           alpha = k / (n + 1)

&nbsp;           mark.time = left\_time + alpha \* (right\_time - left\_time)

```



\### 5.12 Point Resolution



```python

def resolve\_points(point\_stream, context\_map):

&nbsp;   for pt in point\_stream.tokens:

&nbsp;       # Compute time from anchors

&nbsp;       left\_t = pt.anchor\_left.time

&nbsp;       right\_t = pt.anchor\_right.time

&nbsp;       pt.time = left\_t + pt.ratio \* (right\_t - left\_t)

&nbsp;       

&nbsp;       # Evaluate deferred value

&nbsp;       if pt.value\_expr:

&nbsp;           ctx = context\_map\[pt.id]

&nbsp;           pt.value = jsonata\_evaluate(pt.value\_expr, ctx)

```



\*\*Deferred expression restrictions:\*\*



Deferred expressions (in `value\_expr`) may reference:

\- Token features (`current.f.\*`)

\- Resolved scalar values (`current.s.\*`)

\- Sync mark times (`current.sync\_left.time`)

\- Navigation functions (`$parent`, `$next`, etc.)

\- Parameters (`params.\*`)



Deferred expressions may \*\*NOT\*\* reference:

\- Other point token values (prevents circular dependencies)

\- Unresolved scalars (must use resolved values)



Point resolution order within a stream is undefined. If a deferred expression attempted to reference another point's value, behavior would be undefined.



---



\## Part 6: Rule Definitions



Every rule should cite the phonetic/phonological literature justifying it.



\### 6.0 Rule Structure



```typescript

interface Rule {

&nbsp; citation?: string;             // RECOMMENDED: literature reference

&nbsp; 

&nbsp; // One of:

&nbsp; select?: SelectClause;          // for select rules

&nbsp; match?: string;                 // pattern name for pattern rules

&nbsp; 

&nbsp; // Optional:

&nbsp; constraint?: string;            // additional JSONata filter (post-match)

&nbsp; 

&nbsp; // Actions (one or more):

&nbsp; apply?: Effect\[];               // modify scalars

&nbsp; splice?: SpliceSpec;            // base stream mutation

&nbsp; insert\_point?: PointSpec;       // point stream insertion

&nbsp; delete?: boolean;               // delete matched token (non-base only)

}

```



\*\*Constraint evaluation timing:\*\*



For pattern rules, `constraint` evaluates \*\*after all captures bind\*\*. The pattern must fully match before the constraint is tested. This means:

\- Constraints can reference any capture by name

\- Constraints cannot cause early exit from pattern matching

\- If constraint returns false, the match is discarded (no patches generated)



For select rules, `constraint` evaluates after `where` passes.



\### 6.1 Select Rules



```yaml

rules:

&nbsp; # Klatt (1976) Table II: unstressed vowels 35-60% shorter

&nbsp; # Lehiste (1970): stress correlates with duration cross-linguistically

&nbsp; stress\_lengthening:

&nbsp;   citation: "Klatt 1976 §III.B; Lehiste 1970 Ch.2"

&nbsp;   select:

&nbsp;     stream: phone

&nbsp;     where: "current.f.manner = 'vowel'"

&nbsp;   apply:

&nbsp;     - field: duration

&nbsp;       op: mul

&nbsp;       value: "$parent(current, 'syllable').f.stress = 1 ? params.stress\_factor : 1"

&nbsp;       tag: stress



&nbsp; # Klatt (1976): phrase-final syllables 30% longer

&nbsp; # Oller (1973): boundary lengthening in English

&nbsp; phrase\_final\_lengthening:

&nbsp;   citation: "Klatt 1976 §III.A; Oller 1973"

&nbsp;   select:

&nbsp;     stream: phone

&nbsp;     where: "current.f.manner = 'vowel'"

&nbsp;   apply:

&nbsp;     - field: duration

&nbsp;       op: mul

&nbsp;       value: "$parent(current, 'syllable').f.boundary = 'major' ? 1.3 : 1"

&nbsp;       tag: boundary



&nbsp; # House \& Fairbanks (1953): vowels longer before voiced consonants

&nbsp; # Klatt (1976) Table II: 50-100ms difference phrase-finally

&nbsp; pre\_voiced\_lengthening:

&nbsp;   citation: "House \& Fairbanks 1953; Klatt 1976 §III.C"

&nbsp;   select:

&nbsp;     stream: phone

&nbsp;     where: "current.f.manner = 'vowel' and $next(current).f.voicing = 'voiced'"

&nbsp;   apply:

&nbsp;     - field: duration

&nbsp;       op: mul

&nbsp;       value: "params.pre\_voiced\_factor"

&nbsp;       tag: pre\_voiced

```



\### 6.2 Pattern Rules with Splice



```yaml

rules:

&nbsp; # Ladefoged \& Maddieson (1996): stops have release bursts before sonorants

&nbsp; # Stevens (1998) Ch.8: acoustic cues require explicit release modeling

&nbsp; insert\_release:

&nbsp;   citation: "Ladefoged \& Maddieson 1996 §3.2; Stevens 1998 Ch.8"

&nbsp;   match: stop\_before\_sonorant

&nbsp;   splice:

&nbsp;     type: insert\_at\_boundary

&nbsp;     boundary: stop.sync\_right

&nbsp;     side: after

&nbsp;     insert:

&nbsp;       - name: "stop.name \& '\_rel'"

&nbsp;         parent: "$parent(stop, 'syllable')"



&nbsp; # Lisker \& Abramson (1964): VOT distinguishes voicing in stops

&nbsp; # Aspiration 40-100ms for voiceless stops in English

&nbsp; insert\_aspiration:

&nbsp;   citation: "Lisker \& Abramson 1964; Klatt 1975"

&nbsp;   match: voiceless\_stop\_before\_vowel

&nbsp;   constraint: "$parent(stop, 'syllable').f.stress >= 1"

&nbsp;   splice:

&nbsp;     type: insert\_at\_boundary

&nbsp;     boundary: stop.sync\_right

&nbsp;     side: after

&nbsp;     insert:

&nbsp;       - name: "'asp'"



&nbsp; # Wells (1990): pre-fortis clipping in British English

&nbsp; # Chen (1970): vowel shortening before voiceless obstruents

&nbsp; fortis\_clipping:

&nbsp;   citation: "Wells 1990; Chen 1970"

&nbsp;   match: vowel\_before\_obstruent

&nbsp;   constraint: "obs.f.voicing = 'voiceless'"

&nbsp;   apply:

&nbsp;     - target: v

&nbsp;       field: duration

&nbsp;       op: mul

&nbsp;       value: "params.clipping\_factor"

&nbsp;       tag: fortis



&nbsp; # Gimson (1980): /d/+/j/ → /dʒ/ in connected speech

&nbsp; # Cruttenden (2014) §10.3: yod coalescence

&nbsp; d\_j\_coalescence:

&nbsp;   citation: "Gimson 1980; Cruttenden 2014 §10.3"

&nbsp;   match: d\_j\_coalescence

&nbsp;   splice:

&nbsp;     type: replace\_range

&nbsp;     range\_left: d.sync\_left

&nbsp;     range\_right: j.sync\_right

&nbsp;     delete: \[d, j]

&nbsp;     insert:

&nbsp;       - name: "'dʒ'"

&nbsp;         parent: "$parent(d, 'syllable')"

```



\### 6.3 Point Insertion



```yaml

rules:

&nbsp; # Pierrehumbert (1980): F0 targets at metrically strong syllables

&nbsp; # 't Hart et al. (1990): pitch movements anchor to syllable nuclei

&nbsp; f0\_targets:

&nbsp;   citation: "Pierrehumbert 1980; 't Hart et al. 1990"

&nbsp;   select:

&nbsp;     stream: phone

&nbsp;     where: "current.f.manner = 'vowel'"

&nbsp;   insert\_point:

&nbsp;     stream: f0

&nbsp;     at: "$midpoint(current)"

&nbsp;     value: "params.base\_f0 \* (1.1 - params.declination \* $index(current) / $total('phone'))"

&nbsp;     tag: f0



&nbsp; # Pierrehumbert (1980): H\* accent on stressed syllables

&nbsp; # Ladd (2008): pitch accent alignment

&nbsp; accent\_peak:

&nbsp;   citation: "Pierrehumbert 1980; Ladd 2008 Ch.3"

&nbsp;   select:

&nbsp;     stream: syllable

&nbsp;     where: "current.f.stress = 1"

&nbsp;   insert\_point:

&nbsp;     stream: f0

&nbsp;     at: "$at\_ratio($children(current, 'phone')\[f.manner = 'vowel']\[0], 0.3)"

&nbsp;     value: "params.base\_f0 \* params.accent\_factor"

&nbsp;     tag: accent

```



\### 6.4 Formant Rules



```yaml

rules:

&nbsp; # Öhman (1966): VCV coarticulation model

&nbsp; # Stevens (1998) Ch.6: formant transitions reflect articulator timing

&nbsp; coarticulation:

&nbsp;   citation: "Öhman 1966; Stevens 1998 Ch.6"

&nbsp;   select:

&nbsp;     stream: phone

&nbsp;     where: "current.f.manner = 'vowel'"

&nbsp;   apply:

&nbsp;     - field: F2

&nbsp;       op: add

&nbsp;       value: "($prev(current).s.F2 - current.s.F2) \* params.coartic\_strength"

&nbsp;       tag: coartic



&nbsp; # Stevens \& House (1955): consonant locus equations

&nbsp; # Sussman et al. (1991): locus equation parameters by place

&nbsp; locus\_f2:

&nbsp;   citation: "Stevens \& House 1955; Sussman et al. 1991"

&nbsp;   match: consonant\_vowel

&nbsp;   apply:

&nbsp;     - target: c

&nbsp;       field: F2

&nbsp;       op: set

&nbsp;       value: "params.locus\[c.f.place] + params.slope\[c.f.place] \* v.s.F2"

&nbsp;       tag: locus

```



\### 6.5 Source Rules



```yaml

rules:

&nbsp; # Klatt (1980): source parameters for Klatt synthesizer

&nbsp; # Stevens (1998) Ch.2: voice source characteristics

&nbsp; voice\_source:

&nbsp;   citation: "Klatt 1980; Stevens 1998 Ch.2"

&nbsp;   select:

&nbsp;     stream: phone

&nbsp;     where: "current.f.manner in \['vowel', 'nasal', 'liquid', 'glide']"

&nbsp;   apply:

&nbsp;     - field: AV

&nbsp;       op: set

&nbsp;       value: "60"

&nbsp;       tag: voiced



&nbsp; # Stevens (1971): frication noise source levels

&nbsp; frication\_source:

&nbsp;   citation: "Stevens 1971"

&nbsp;   select:

&nbsp;     stream: phone

&nbsp;     where: "current.f.manner = 'fricative'"

&nbsp;   apply:

&nbsp;     - field: AF

&nbsp;       op: set

&nbsp;       value: "f.voicing = 'voiced' ? 50 : 60"

&nbsp;       tag: frication

```



\### 6.6 Deletion (Non-Base)



```yaml

rules:

&nbsp; # Autosegmental phonology: floating tones delete if unassociated

&nbsp; # Goldsmith (1976): tone deletion in African languages

&nbsp; delete\_floating\_tone:

&nbsp;   citation: "Goldsmith 1976"

&nbsp;   select:

&nbsp;     stream: tone

&nbsp;     where: "current.f.floating = true"

&nbsp;   delete: true

```



---



\## Part 7: Phases



Each phase runs the full pipeline (§5.1). Span boundaries are recomputed in step 9 of every phase.



```yaml

phases:

&nbsp; - name: sandhi

&nbsp;   rules: \[d\_j\_coalescence]



&nbsp; - name: allophonic

&nbsp;   rules: \[insert\_release]



&nbsp; - name: duration

&nbsp;   rules: \[stress\_lengthening, fortis\_clipping]

&nbsp;   resolve\_scalars: \[duration]

&nbsp;   compute\_times: true



&nbsp; - name: formants

&nbsp;   after: \[duration]

&nbsp;   rules: \[coarticulation]

&nbsp;   resolve\_scalars: \[F1, F2, F3, B1, B2, B3]



&nbsp; - name: prosody

&nbsp;   after: \[duration]

&nbsp;   rules: \[f0\_targets]

&nbsp;   resolve\_points: \[f0]



&nbsp; - name: source

&nbsp;   rules: \[voice\_source, frication\_source]

&nbsp;   resolve\_scalars: \[AV, AH, AF]

```



\*\*Phase flags:\*\*

\- `rules`: list of rule names to execute (order matters)

\- `after`: dependency on other phases

\- `resolve\_scalars`: scalar fields to resolve this phase

\- `compute\_times`: assign times to sync marks (requires duration resolved)

\- `resolve\_points`: point streams to resolve (requires times computed)



---



\## Part 8: Output



\### 8.1 Scalar Interpolation



```yaml

interpolation:

&nbsp; scalars:

&nbsp;   F1:

&nbsp;     method: linear

&nbsp;     blend\_points:

&nbsp;       - {position: 0.2, weights: {prev: 0.5, current: 0.5}}

&nbsp;       - {position: 0.8, weights: {current: 0.5, next: 0.5}}

&nbsp;   AV: {method: step}

&nbsp;   AH: {method: step}

&nbsp;   AF: {method: step}

```



\### 8.2 Point Interpolation



```yaml

interpolation:

&nbsp; points:

&nbsp;   f0:

&nbsp;     method: monotone\_cubic

&nbsp;     extrapolation: hold

&nbsp;     default: 0

&nbsp;     duplicate\_policy: average

```



\### 8.3 Output Mapping



```yaml

output:

&nbsp; format: klatt\_frames

&nbsp; frame\_rate\_ms: 10

&nbsp; 

&nbsp; mapping:

&nbsp;   F0: {source: point, stream: f0}

&nbsp;   F1: {source: scalar, field: F1}

&nbsp;   # ...

&nbsp; 

&nbsp; constants:

&nbsp;   F4: 3500

&nbsp;   B4: 250

```



---



\## Part 9: Validation



```yaml

validation:

&nbsp; errors:

&nbsp;   - pattern\_missing\_stream

&nbsp;   - unknown\_stream\_reference

&nbsp;   - invalid\_jsonata\_syntax

&nbsp;   - invalid\_feature\_value

&nbsp;   - phase\_order\_violation

&nbsp;   - splice\_conflict             # two splices delete same token with different inserts

&nbsp;   - invalid\_ratio               # not in \[0,1]

&nbsp; 

&nbsp; warnings:

&nbsp;   - null\_target\_at\_runtime

&nbsp;   - deleted\_target\_at\_runtime

&nbsp;   - interior\_mark\_deleted        # strict policy applied

&nbsp;   - duration\_edit\_after\_times    # may need recompute

&nbsp;   - missing\_citation             # rule without citation field

&nbsp;   - empty\_span                   # span with no children (collapsed)



&nbsp; invariants:

&nbsp;   - base\_coverage               # base partitions \[START, END]

&nbsp;   - span\_boundary\_match         # spans match children (or empty)

&nbsp;   - time\_monotonicity

```



\*\*Splice overlap policy:\*\*

\- Adjacent splices are allowed and batched together

\- Overlapping splices are resolved by sort order (rule\_index, match\_index, patch\_seq)

\- \*\*Conflict:\*\* Two splices that both delete the same token but specify different insertions → error

\- \*\*Not a conflict:\*\* Two splices that affect adjacent/overlapping ranges but don't contradict



---



\## Part 10: Tracing and Introspection



Debugging phonological rules is notoriously difficult. This section specifies the introspection tooling required for the DSL to be usable in practice.



\### 10.1 Design Principles



1\. \*\*Every decision must be traceable\*\* - Why did this rule fire? Why didn't it?

2\. \*\*Every value must have provenance\*\* - Where did this duration come from?

3\. \*\*State is always inspectable\*\* - What did the streams look like at any point?

4\. \*\*Visualization is first-class\*\* - Multi-stream alignment must be visible



\### 10.2 Trace Events



The engine emits structured trace events at each step:



```typescript

type TraceEvent =

&nbsp; | PhaseStart

&nbsp; | PhaseEnd

&nbsp; | SnapshotCreated

&nbsp; | RuleEvaluationStart

&nbsp; | MatchAttempt

&nbsp; | MatchSuccess

&nbsp; | MatchFailure

&nbsp; | ExpressionEvaluation

&nbsp; | PatchGenerated

&nbsp; | PatchApplied

&nbsp; | PatchSkipped

&nbsp; | ScalarResolution

&nbsp; | TimeComputation

&nbsp; | PointResolution

&nbsp; | Warning

&nbsp; | Error;



interface MatchAttempt {

&nbsp; type: 'match\_attempt';

&nbsp; rule: string;

&nbsp; pattern: string;

&nbsp; position: { stream: string; index: number; token\_id: string };

&nbsp; timestamp: number;

}



interface MatchSuccess {

&nbsp; type: 'match\_success';

&nbsp; rule: string;

&nbsp; pattern: string;

&nbsp; captures: Record<string, TokenId | TokenId\[] | null>;

&nbsp; span: { left: SyncMarkId; right: SyncMarkId };

&nbsp; constraint\_result: boolean | null;  // null if no constraint

}



interface MatchFailure {

&nbsp; type: 'match\_failure';

&nbsp; rule: string;

&nbsp; pattern: string;

&nbsp; step\_index: number;              // which step failed

&nbsp; step\_where: string;              // the where clause

&nbsp; token\_evaluated: TokenId;

&nbsp; evaluation\_result: any;          // what the where clause returned

&nbsp; reason: 'where\_false' | 'scope\_boundary' | 'end\_of\_stream' | 'constraint\_false';

}



interface ExpressionEvaluation {

&nbsp; type: 'expression\_eval';

&nbsp; rule: string;

&nbsp; expression: string;

&nbsp; context: Record<string, any>;    // the data root

&nbsp; result: any;

&nbsp; duration\_us: number;             // for perf tracking

}



interface PatchGenerated {

&nbsp; type: 'patch\_generated';

&nbsp; rule: string;

&nbsp; match\_index: number;

&nbsp; patch: Patch;

&nbsp; source\_tokens: TokenId\[];        // tokens that triggered this patch

}



interface PatchSkipped {

&nbsp; type: 'patch\_skipped';

&nbsp; patch: Patch;

&nbsp; reason: 'target\_deleted' | 'target\_null' | 'conflict' | 'validation\_failed';

&nbsp; details: string;

}



interface ScalarResolution {

&nbsp; type: 'scalar\_resolution';

&nbsp; token\_id: TokenId;

&nbsp; field: string;

&nbsp; base: number;

&nbsp; floor: number | null;

&nbsp; effects: ResolvedEffect\[];

&nbsp; resolved: number;

&nbsp; computation\_steps: string\[];     // human-readable step-by-step

}

```



\### 10.3 Provenance Tracking



Every resolved value carries its provenance:



```typescript

interface Provenance {

&nbsp; field: string;

&nbsp; token\_id: TokenId;

&nbsp; base\_value: number;

&nbsp; base\_source: 'inventory' | 'override';

&nbsp; effects: ProvenanceEffect\[];

&nbsp; final\_value: number;

}



interface ProvenanceEffect {

&nbsp; rule: string;

&nbsp; citation: string;

&nbsp; tag: string;

&nbsp; op: 'set' | 'mul' | 'add';

&nbsp; value: number;

&nbsp; value\_before: number;

&nbsp; value\_after: number;

&nbsp; match\_context: {

&nbsp;   captures: Record<string, TokenId>;

&nbsp;   position: number;

&nbsp; };

}

```



\*\*Query interface:\*\*



```typescript

// "Why is this token's duration 152ms?"

engine.explain(tokenId, 'duration') → Provenance



// Returns:

{

&nbsp; field: 'duration',

&nbsp; token\_id: 'phone\_42',

&nbsp; base\_value: 240,

&nbsp; base\_source: 'inventory',  // from æ entry

&nbsp; effects: \[

&nbsp;   {

&nbsp;     rule: 'stress\_lengthening',

&nbsp;     citation: 'Klatt 1976 §III.B',

&nbsp;     tag: 'stress',

&nbsp;     op: 'mul',

&nbsp;     value: 1.0,              // stress == 0, so no change

&nbsp;     value\_before: 240,

&nbsp;     value\_after: 240

&nbsp;   },

&nbsp;   {

&nbsp;     rule: 'fortis\_clipping', 

&nbsp;     citation: 'Wells 1990; Chen 1970',

&nbsp;     tag: 'fortis',

&nbsp;     op: 'mul',

&nbsp;     value: 0.6,

&nbsp;     value\_before: 240,

&nbsp;     value\_after: 186         // Klatt: 0.6 \* (240 - 105) + 105

&nbsp;   },

&nbsp;   {

&nbsp;     rule: 'phrase\_final\_lengthening',

&nbsp;     citation: 'Klatt 1976 §III.A',

&nbsp;     tag: 'boundary',

&nbsp;     op: 'mul',

&nbsp;     value: 1.0,              // not phrase-final

&nbsp;     value\_before: 186,

&nbsp;     value\_after: 186

&nbsp;   }

&nbsp; ],

&nbsp; final\_value: 186

}

```



\### 10.4 Snapshot Diffing



Compare state between any two points:



```typescript

interface SnapshotDiff {

&nbsp; phase\_from: string;

&nbsp; phase\_to: string;

&nbsp; 

&nbsp; tokens: {

&nbsp;   added: TokenSummary\[];

&nbsp;   deleted: TokenSummary\[];

&nbsp;   modified: TokenModification\[];

&nbsp; };

&nbsp; 

&nbsp; sync\_marks: {

&nbsp;   added: SyncMarkId\[];

&nbsp;   deleted: SyncMarkId\[];

&nbsp; };

&nbsp; 

&nbsp; associations: {

&nbsp;   added: AssociationEdge\[];

&nbsp;   deleted: AssociationEdge\[];

&nbsp; };

}



interface TokenModification {

&nbsp; token\_id: TokenId;

&nbsp; changes: FieldChange\[];

}



interface FieldChange {

&nbsp; path: string;              // e.g., 's.duration', 'f.place', 'sync\_right'

&nbsp; old\_value: any;

&nbsp; new\_value: any;

&nbsp; caused\_by: string\[];       // rule names

}

```



\*\*Usage:\*\*



```typescript

const diff = engine.diff('after:allophonic', 'after:duration');

// Shows all changes made by duration phase

```



\### 10.5 Rule Coverage Report



Track which rules fired and where:



```typescript

interface RuleCoverage {

&nbsp; rule: string;

&nbsp; citation: string;

&nbsp; 

&nbsp; matches: {

&nbsp;   total: number;

&nbsp;   by\_position: Map<number, number>;  // index → count

&nbsp; };

&nbsp; 

&nbsp; non\_matches: {

&nbsp;   total\_attempts: number;

&nbsp;   failure\_reasons: Map<string, number>;  // reason → count

&nbsp; };

&nbsp; 

&nbsp; effects\_applied: number;

&nbsp; effects\_skipped: number;

&nbsp; 

&nbsp; example\_matches: MatchSuccess\[];      // first N

&nbsp; example\_failures: MatchFailure\[];     // first N

}



// "Why didn't insert\_aspiration fire on this stop?"

engine.whyNot('insert\_aspiration', tokenId) → MatchFailure\[]

```



\### 10.6 Stream Visualization



Multi-stream alignment view specification:



```typescript

interface StreamView {

&nbsp; time\_range: \[number, number];

&nbsp; streams: StreamLayer\[];

&nbsp; sync\_marks: SyncMarkDisplay\[];

&nbsp; annotations: Annotation\[];

}



interface StreamLayer {

&nbsp; stream: string;

&nbsp; tokens: TokenDisplay\[];

&nbsp; y\_position: number;

&nbsp; height: number;

}



interface TokenDisplay {

&nbsp; token\_id: TokenId;

&nbsp; name: string;

&nbsp; x\_start: number;           // pixels or time

&nbsp; x\_end: number;

&nbsp; features: Record<string, string>;  // formatted for display

&nbsp; scalars: Record<string, string>;

&nbsp; highlight: 'none' | 'selected' | 'matched' | 'modified' | 'inserted' | 'deleted';

&nbsp; provenance\_available: string\[];    // which fields have provenance

}



interface SyncMarkDisplay {

&nbsp; id: SyncMarkId;

&nbsp; x: number;

&nbsp; time: number | null;

&nbsp; order: string;

&nbsp; references: TokenId\[];     // tokens using this mark

&nbsp; is\_interior: boolean;

}



interface Annotation {

&nbsp; type: 'rule\_match' | 'patch\_applied' | 'warning' | 'custom';

&nbsp; x\_start: number;

&nbsp; x\_end: number;

&nbsp; y\_stream: string;

&nbsp; label: string;

&nbsp; details: any;

}

```



\### 10.7 Interactive Debugger Protocol



For IDE/UI integration:



```typescript

interface DebuggerProtocol {

&nbsp; // Breakpoints

&nbsp; setBreakpoint(location: BreakpointLocation): BreakpointId;

&nbsp; removeBreakpoint(id: BreakpointId): void;

&nbsp; 

&nbsp; // Execution control

&nbsp; run(): Promise<void>;

&nbsp; stepPhase(): Promise<PhaseResult>;

&nbsp; stepRule(): Promise<RuleResult>;

&nbsp; stepMatch(): Promise<MatchResult>;

&nbsp; pause(): void;

&nbsp; 

&nbsp; // State inspection

&nbsp; getStreams(): StreamState\[];

&nbsp; getToken(id: TokenId): Token;

&nbsp; getSyncMark(id: SyncMarkId): SyncMark;

&nbsp; explain(tokenId: TokenId, field: string): Provenance;

&nbsp; whyNot(rule: string, tokenId: TokenId): MatchFailure\[];

&nbsp; 

&nbsp; // Queries

&nbsp; query(jsonata: string): any;  // query current state

&nbsp; 

&nbsp; // Events

&nbsp; onTraceEvent(callback: (event: TraceEvent) => void): void;

&nbsp; onBreakpoint(callback: (bp: BreakpointId) => void): void;

}



type BreakpointLocation =

&nbsp; | { type: 'phase'; phase: string; when: 'before' | 'after' }

&nbsp; | { type: 'rule'; rule: string; when: 'before' | 'after' }

&nbsp; | { type: 'match'; pattern: string; token?: TokenId }

&nbsp; | { type: 'patch'; patch\_type: string }

&nbsp; | { type: 'token\_modified'; token: TokenId; field?: string }

&nbsp; | { type: 'condition'; expr: string };  // break when expr is true

```



\### 10.8 Trace Output Formats



\*\*JSON Lines (streaming):\*\*



```jsonl

{"type":"phase\_start","phase":"duration","timestamp":1234567890}

{"type":"match\_success","rule":"stress\_lengthening","captures":{"current":"phone\_42"}}

{"type":"expression\_eval","rule":"stress\_lengthening","expression":"$parent(current,'syllable').f.stress","result":1}

...

```



\*\*HTML Report:\*\*



Self-contained HTML with:

\- Collapsible phase sections

\- Token timeline visualization

\- Click-to-expand provenance

\- Search/filter by rule, token, field

\- Diff view between phases



\*\*SQLite Database:\*\*



```sql

CREATE TABLE trace\_events (

&nbsp; id INTEGER PRIMARY KEY,

&nbsp; timestamp\_us INTEGER,

&nbsp; phase TEXT,

&nbsp; event\_type TEXT,

&nbsp; event\_json TEXT

);



CREATE TABLE provenance (

&nbsp; token\_id TEXT,

&nbsp; field TEXT,

&nbsp; base\_value REAL,

&nbsp; final\_value REAL,

&nbsp; effects\_json TEXT,

&nbsp; PRIMARY KEY (token\_id, field)

);



CREATE TABLE snapshots (

&nbsp; phase TEXT PRIMARY KEY,

&nbsp; state\_json TEXT  -- or msgpack for size

);



-- Query: all effects on duration fields

SELECT p.token\_id, p.effects\_json 

FROM provenance p 

WHERE p.field = 'duration';

```



\*\*Storage semantics (implementation-defined):\*\*



The following are not specified and left to implementation:

\- Maximum trace size / rotation policy

\- Buffering vs streaming behavior

\- Behavior when disk fills (fail, truncate, or drop events)

\- Memory limits for in-memory traces during interactive debugging



Implementations should document their choices.



\### 10.9 Performance Profiling



```typescript

interface PerformanceReport {

&nbsp; total\_time\_ms: number;

&nbsp; 

&nbsp; by\_phase: {

&nbsp;   phase: string;

&nbsp;   time\_ms: number;

&nbsp;   breakdown: {

&nbsp;     snapshot: number;

&nbsp;     matching: number;

&nbsp;     patch\_generation: number;

&nbsp;     patch\_application: number;

&nbsp;     resolution: number;

&nbsp;   };

&nbsp; }\[];

&nbsp; 

&nbsp; by\_rule: {

&nbsp;   rule: string;

&nbsp;   time\_ms: number;

&nbsp;   match\_attempts: number;

&nbsp;   match\_successes: number;

&nbsp;   expressions\_evaluated: number;

&nbsp;   avg\_expression\_time\_us: number;

&nbsp; }\[];

&nbsp; 

&nbsp; hot\_expressions: {

&nbsp;   expression: string;

&nbsp;   count: number;

&nbsp;   total\_time\_us: number;

&nbsp;   avg\_time\_us: number;

&nbsp; }\[];

&nbsp; 

&nbsp; memory: {

&nbsp;   peak\_tokens: number;

&nbsp;   peak\_sync\_marks: number;

&nbsp;   snapshot\_copies: number;

&nbsp; };

}

```



\### 10.10 Configuration



```yaml

debug:

&nbsp; enabled: true

&nbsp; 

&nbsp; trace:

&nbsp;   events: \[match\_success, match\_failure, patch\_applied, scalar\_resolution]

&nbsp;   # or: all, none, errors\_only

&nbsp;   

&nbsp;   include\_context: true      # include full expression context

&nbsp;   include\_snapshots: true    # store snapshots for diffing

&nbsp;   max\_example\_failures: 10   # per rule

&nbsp;   

&nbsp; output:

&nbsp;   format: jsonl              # jsonl, html, sqlite

&nbsp;   path: "./debug/trace.jsonl"

&nbsp;   

&nbsp; breakpoints:

&nbsp;   - { type: phase, phase: duration, when: after }

&nbsp;   - { type: condition, expr: "current.s.duration < 50" }

&nbsp;   

&nbsp; performance:

&nbsp;   enabled: true

&nbsp;   sample\_expressions: true   # profile JSONata evaluation



&nbsp; visualization:

&nbsp;   enabled: true

&nbsp;   output: "./debug/timeline.html"

&nbsp;   streams: \[phone, syllable, f0]

&nbsp;   time\_range: auto           # or \[0, 2000]

```



\### 10.11 Command Line Interface



```

tts-dsl - Declarative TTS Frontend DSL



USAGE:

&nbsp;   tts-dsl <COMMAND> \[OPTIONS]



COMMANDS:

&nbsp;   run         Process input through the DSL pipeline

&nbsp;   validate    Check spec for errors without running

&nbsp;   explain     Show provenance for a token's field

&nbsp;   why-not     Explain why a rule didn't fire on a token

&nbsp;   diff        Compare state between phases

&nbsp;   visualize   Generate timeline visualization

&nbsp;   profile     Performance profiling

&nbsp;   debug       Interactive debugger

&nbsp;   lsp         Language Server Protocol mode

&nbsp;   completion  Generate shell completions



GLOBAL OPTIONS:

&nbsp;   -s, --spec <FILE>       Spec file (default: tts.yaml)

&nbsp;   -v, --verbose           Increase verbosity (-v, -vv, -vvv)

&nbsp;   -q, --quiet             Suppress non-error output

&nbsp;   --color <WHEN>          Color output: auto, always, never

&nbsp;   --config <FILE>         Config file for defaults

```



\#### tts-dsl run



```

Process input through the DSL pipeline



USAGE:

&nbsp;   tts-dsl run \[OPTIONS] <INPUT>



ARGS:

&nbsp;   <INPUT>     Input text, file path, or "-" for stdin



INPUT FORMATS:

&nbsp;   --input-format <FMT>    Input format: text, phonemes, json

&nbsp;                           text     - Plain text (requires G2P)

&nbsp;                           phonemes - Space-separated phonemes

&nbsp;                           json     - Pre-structured token stream



OUTPUT:

&nbsp;   -o, --output <FILE>     Output file (default: stdout)

&nbsp;   --output-format <FMT>   Output format:

&nbsp;                           klatt    - Klatt parameter frames (default)

&nbsp;                           json     - Full token state as JSON

&nbsp;                           praat    - Praat TextGrid

&nbsp;                           ssml     - Annotated SSML

&nbsp;                           wav      - Synthesized audio (requires backend)



TRACING:

&nbsp;   --trace <FILE>          Write trace to file (jsonl, html, or sqlite by extension)

&nbsp;   --trace-events <LIST>   Events to trace: all, none, or comma-separated list

&nbsp;                           (match, patch, resolution, expression, error)

&nbsp;   --snapshots             Include full snapshots in trace (large!)



PHASES:

&nbsp;   --stop-after <PHASE>    Stop after named phase

&nbsp;   --skip <PHASES>         Skip comma-separated phases

&nbsp;   --only <PHASES>         Run only comma-separated phases



EXAMPLES:

&nbsp;   tts-dsl run "hello world"

&nbsp;   tts-dsl run -s en-us.yaml --output-format wav -o hello.wav "hello world"

&nbsp;   tts-dsl run --input-format phonemes "h ə l oʊ"

&nbsp;   tts-dsl run --trace trace.html --trace-events all input.txt

&nbsp;   cat text.txt | tts-dsl run -

```



\#### tts-dsl validate



```

Check spec for errors without running



USAGE:

&nbsp;   tts-dsl validate \[OPTIONS] \[SPEC]



ARGS:

&nbsp;   \[SPEC]      Spec file (default: tts.yaml)



OPTIONS:

&nbsp;   --strict            Treat warnings as errors

&nbsp;   --check-citations   Verify citation format

&nbsp;   --check-inventory   Verify all phonemes have targets

&nbsp;   --list-rules        List all rules with citations

&nbsp;   --list-patterns     List all patterns with streams

&nbsp;   --deps              Show phase dependencies as graph



OUTPUT:

&nbsp;   --format <FMT>      Output format: text, json, sarif (for CI)



EXAMPLES:

&nbsp;   tts-dsl validate en-us.yaml

&nbsp;   tts-dsl validate --strict --format sarif > results.sarif

&nbsp;   tts-dsl validate --list-rules

```



\#### tts-dsl explain



```

Show provenance for a token's field value



USAGE:

&nbsp;   tts-dsl explain \[OPTIONS] <INPUT> --token <ID> --field <FIELD>



ARGS:

&nbsp;   <INPUT>             Input text or file



OPTIONS:

&nbsp;   --token <ID>        Token ID or selector:

&nbsp;                       phone\_42      - by ID

&nbsp;                       phone:5       - phone stream index 5

&nbsp;                       "æ":first     - first token named æ

&nbsp;                       syllable:2    - syllable index 2

&nbsp;   

&nbsp;   --field <FIELD>     Field to explain: duration, F1, F2, etc.

&nbsp;   

&nbsp;   --phase <PHASE>     Show state after this phase (default: final)

&nbsp;   

&nbsp;   --format <FMT>      Output format: text, json, markdown



OUTPUT:

&nbsp;   Shows: base value, source, each effect with rule/citation/before/after



EXAMPLES:

&nbsp;   tts-dsl explain "hello" --token phone:3 --field duration

&nbsp;   tts-dsl explain "hello" --token "ɛ":first --field F1 --format json

```



\#### tts-dsl why-not



```

Explain why a rule didn't fire on a token



USAGE:

&nbsp;   tts-dsl why-not \[OPTIONS] <INPUT> --rule <RULE> --token <ID>



ARGS:

&nbsp;   <INPUT>             Input text or file



OPTIONS:

&nbsp;   --rule <RULE>       Rule name

&nbsp;   --token <ID>        Token ID or selector (see 'explain')

&nbsp;   --phase <PHASE>     Evaluate at this phase (default: rule's phase)

&nbsp;   --all-failures      Show all match attempts, not just for this token



OUTPUT:

&nbsp;   Shows: which pattern step failed, the where clause, 

&nbsp;          actual token values, expected values



EXAMPLES:

&nbsp;   tts-dsl why-not "did you" --rule insert\_aspiration --token phone:0

&nbsp;   tts-dsl why-not input.txt --rule d\_j\_coalescence --all-failures

```



\#### tts-dsl diff



```

Compare state between phases



USAGE:

&nbsp;   tts-dsl diff \[OPTIONS] <INPUT> --from <PHASE> --to <PHASE>



ARGS:

&nbsp;   <INPUT>             Input text or file



OPTIONS:

&nbsp;   --from <PHASE>      Start phase (or "init" for initial state)

&nbsp;   --to <PHASE>        End phase (or "final" for end state)

&nbsp;   --stream <STREAM>   Filter to specific stream

&nbsp;   --format <FMT>      Output format: text, json, patch



OUTPUT:

&nbsp;   Shows: tokens added/deleted/modified, sync marks changed,

&nbsp;          associations changed, with causing rules



EXAMPLES:

&nbsp;   tts-dsl diff "hello" --from init --to sandhi

&nbsp;   tts-dsl diff "hello" --from duration --to final --stream phone

```



\#### tts-dsl visualize



```

Generate timeline visualization



USAGE:

&nbsp;   tts-dsl visualize \[OPTIONS] <INPUT> -o <OUTPUT>



ARGS:

&nbsp;   <INPUT>             Input text or file



OPTIONS:

&nbsp;   -o, --output <FILE>     Output file (.html, .svg, .png)

&nbsp;   --streams <LIST>        Streams to show (default: phone,syllable,f0)

&nbsp;   --phase <PHASE>         Show state at phase (default: final)

&nbsp;   --time-range <RANGE>    Time range in ms: "0-2000" or "auto"

&nbsp;   --show-sync-marks       Draw sync mark lines

&nbsp;   --show-provenance       Color by rule that last modified

&nbsp;   --interactive           HTML with hover/click (html only)



EXAMPLES:

&nbsp;   tts-dsl visualize "hello world" -o timeline.html --interactive

&nbsp;   tts-dsl visualize input.txt -o diagram.svg --streams phone,f0

```



\#### tts-dsl profile



```

Performance profiling



USAGE:

&nbsp;   tts-dsl profile \[OPTIONS] <INPUT>



ARGS:

&nbsp;   <INPUT>             Input text or file (or --corpus for batch)



OPTIONS:

&nbsp;   --iterations <N>    Run N times and average (default: 10)

&nbsp;   --corpus <DIR>      Profile all .txt files in directory

&nbsp;   --warmup <N>        Warmup iterations (default: 2)

&nbsp;   --format <FMT>      Output format: text, json, flamegraph

&nbsp;   --output <FILE>     Output file (default: stdout)



BREAKDOWN:

&nbsp;   --by-phase          Time breakdown by phase

&nbsp;   --by-rule           Time breakdown by rule

&nbsp;   --expressions       Profile JSONata expressions

&nbsp;   --memory            Track memory allocations



EXAMPLES:

&nbsp;   tts-dsl profile "hello world" --iterations 100

&nbsp;   tts-dsl profile --corpus ./test-sentences/ --format json -o profile.json

&nbsp;   tts-dsl profile input.txt --expressions --format flamegraph -o profile.svg

```



\#### tts-dsl debug



```

Interactive debugger



USAGE:

&nbsp;   tts-dsl debug \[OPTIONS] <INPUT>



ARGS:

&nbsp;   <INPUT>             Input text or file



OPTIONS:

&nbsp;   --break <BP>        Initial breakpoint (can repeat):

&nbsp;                       phase:sandhi:before

&nbsp;                       phase:duration:after

&nbsp;                       rule:stress\_lengthening

&nbsp;                       token:phone\_5:modified

&nbsp;                       condition:"current.s.duration < 50"

&nbsp;   

&nbsp;   --script <FILE>     Run debugger commands from file

&nbsp;   --port <PORT>       DAP server mode on port (for IDE integration)



DEBUGGER COMMANDS:

&nbsp;   break <location>    Set breakpoint

&nbsp;   delete <id>         Delete breakpoint

&nbsp;   list                List breakpoints

&nbsp;   

&nbsp;   run                 Run to next breakpoint

&nbsp;   step phase          Step one phase

&nbsp;   step rule           Step one rule

&nbsp;   step match          Step one match attempt

&nbsp;   continue            Continue execution

&nbsp;   

&nbsp;   state               Show current state summary

&nbsp;   tokens \[stream]     List tokens in stream

&nbsp;   token <id>          Show token details

&nbsp;   sync <id>           Show sync mark details

&nbsp;   

&nbsp;   explain <id> <fld>  Show provenance

&nbsp;   why-not <rule> <id> Explain match failure

&nbsp;   diff \[from] \[to]    Diff between phases

&nbsp;   

&nbsp;   query <jsonata>     Query current state

&nbsp;   watch <expr>        Watch expression value

&nbsp;   

&nbsp;   visualize           Open timeline in browser

&nbsp;   

&nbsp;   help \[command]      Show help

&nbsp;   quit                Exit debugger



EXAMPLES:

&nbsp;   tts-dsl debug "hello world"

&nbsp;   tts-dsl debug input.txt --break phase:duration:after

&nbsp;   tts-dsl debug input.txt --port 4711  # DAP mode for VS Code

```



\#### tts-dsl lsp



```

Language Server Protocol mode for editor integration



USAGE:

&nbsp;   tts-dsl lsp \[OPTIONS]



OPTIONS:

&nbsp;   --stdio             Communicate via stdin/stdout (default)

&nbsp;   --socket <PORT>     Communicate via TCP socket

&nbsp;   --log <FILE>        Log LSP messages to file



FEATURES:

&nbsp;   - Syntax highlighting for .tts.yaml files

&nbsp;   - Diagnostics (errors, warnings)

&nbsp;   - Hover: show rule citations, pattern definitions

&nbsp;   - Go to definition: rule → pattern, stream → definition

&nbsp;   - Completion: rule names, stream names, feature values

&nbsp;   - Code actions: add missing citation, fix feature typo



EXAMPLES:

&nbsp;   tts-dsl lsp --stdio

&nbsp;   tts-dsl lsp --socket 5007 --log lsp.log

```



\#### tts-dsl completion



```

Generate shell completions



USAGE:

&nbsp;   tts-dsl completion <SHELL>



ARGS:

&nbsp;   <SHELL>     Shell: bash, zsh, fish, powershell



EXAMPLES:

&nbsp;   tts-dsl completion bash > /etc/bash\_completion.d/tts-dsl

&nbsp;   tts-dsl completion zsh > ~/.zfunc/\_tts-dsl

```



\### 10.12 Exit Codes



```

0   Success

1   General error

2   Invalid arguments

3   Spec validation failed

4   Input parsing failed

5   Rule execution error

10  Breakpoint hit (debug mode, non-interactive)

```



\### 10.13 Environment Variables



```

TTS\_DSL\_SPEC          Default spec file path

TTS\_DSL\_CONFIG        Config file path

TTS\_DSL\_TRACE\_DIR     Directory for trace files

TTS\_DSL\_COLOR         Color mode: auto, always, never

TTS\_DSL\_PAGER         Pager for long output (default: less)

```



\### 10.14 Config File



```yaml

\# ~/.config/tts-dsl/config.yaml



defaults:

&nbsp; spec: ~/tts/en-us.yaml

&nbsp; output\_format: klatt

&nbsp; 

trace:

&nbsp; events: \[match, patch, error]

&nbsp; directory: ~/.local/share/tts-dsl/traces/

&nbsp; 

debug:

&nbsp; history\_file: ~/.local/share/tts-dsl/debug\_history

&nbsp; 

profile:

&nbsp; iterations: 10

&nbsp; warmup: 2

```



\### 10.15 Example Debug Session



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

&nbsp; Tokens:

&nbsp;   - deleted: phone\_3 (d)

&nbsp;   - deleted: phone\_4 (j)  

&nbsp;   + inserted: phone\_3a (dʒ) \[rule: coalesce\_dj, citation: Cruttenden 2014 §10.3]

&nbsp; Sync marks:

&nbsp;   - deleted: s4



(tts) explain phone\_3a duration

Token: phone\_3a (dʒ)

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



(tts) explain phone\_5 duration

Token: phone\_5 (i)

Field: duration



Base: 100ms (from inventory: i)

Floor: 42ms (Klatt 1976)



Effects applied:

&nbsp; 1. stress\_lengthening \[Klatt 1976 §III.B]

&nbsp;    op: mul, value: 1.3 (stress=1)

&nbsp;    100ms → 117ms (Klatt: 1.3 \* (100-42) + 42 = 117)

&nbsp;    

&nbsp; 2. phrase\_final\_lengthening \[Klatt 1976 §III.A]

&nbsp;    op: mul, value: 1.3 (boundary=major)

&nbsp;    117ms → 140ms (Klatt: 1.3 \* (117-42) + 42 = 140)



Final: 140ms



(tts) why-not insert\_aspiration phone\_1

Rule: insert\_aspiration

Token: phone\_1 (d)



Match attempted at position 0

Step 0: capture 'stop' where "f.manner = 'stop' and f.voicing = 'voiceless'"

&nbsp; f.manner = 'stop' → true

&nbsp; f.voicing = 'voiceless' → false (actual: 'voiced')

&nbsp; 

Result: FAILED at step 0 (where\_false)

Reason: /d/ is voiced; rule requires voiceless stop



(tts) visualize

Generated: ./debug/timeline.html



(tts) quit

```



This tooling is what makes the difference between "interesting research project" and "system someone can actually debug."





\## Part 11: Implementation Notes



\### 11.1 Snapshot Strategy



Use copy-on-write:

\- Snapshot = immutable view (shared structure)

\- Patch application creates new arrays only for affected streams

\- Same semantics, no quadratic copying



\### 11.2 Rank Insertion Algorithm



Ranks use base-36 alphabet: `0123456789abcdefghijklmnopqrstuvwxyz`



\*\*Preconditions:\*\*

\- All FINITE ranks are non-empty strings

\- Empty string `""` is not a valid rank

\- The initial rank for the first token is typically `"i"` (midpoint of alphabet)



```python

ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

BASE = len(ALPHABET)  # 36



def rank\_between(a: str, b: str) -> str:

&nbsp;   """

&nbsp;   Generate a rank string that sorts between a and b.

&nbsp;   Precondition: a < b (lexicographically), both non-empty

&nbsp;   """

&nbsp;   assert a and b, "Ranks must be non-empty"

&nbsp;   assert a < b, "a must be less than b"

&nbsp;   

&nbsp;   # Pad shorter string

&nbsp;   max\_len = max(len(a), len(b))

&nbsp;   a\_padded = a.ljust(max\_len, ALPHABET\[0])

&nbsp;   b\_padded = b.ljust(max\_len, ALPHABET\[-1])

&nbsp;   

&nbsp;   result = \[]

&nbsp;   for i in range(max\_len):

&nbsp;       a\_idx = ALPHABET.index(a\_padded\[i])

&nbsp;       b\_idx = ALPHABET.index(b\_padded\[i])

&nbsp;       

&nbsp;       if a\_idx + 1 < b\_idx:

&nbsp;           # Gap exists: insert midpoint

&nbsp;           mid\_idx = (a\_idx + b\_idx) // 2

&nbsp;           return ''.join(result) + ALPHABET\[mid\_idx]

&nbsp;       elif a\_idx == b\_idx:

&nbsp;           # Same char: continue to next position

&nbsp;           result.append(ALPHABET\[a\_idx])

&nbsp;       else:

&nbsp;           # Adjacent (a\_idx + 1 == b\_idx): need to extend

&nbsp;           result.append(ALPHABET\[a\_idx])

&nbsp;   

&nbsp;   # Strings are equal or adjacent at all positions: extend with midpoint

&nbsp;   return ''.join(result) + ALPHABET\[BASE // 2]  # 'i'



def rank\_after(a: str) -> str:

&nbsp;   """Generate rank after a (toward END sentinel)."""

&nbsp;   assert a, "Rank must be non-empty"

&nbsp;   return a + ALPHABET\[BASE // 2]



def rank\_before(b: str) -> str:

&nbsp;   """Generate rank before b (toward START sentinel)."""

&nbsp;   assert b, "Rank must be non-empty"

&nbsp;   last\_idx = ALPHABET.index(b\[-1])

&nbsp;   if last\_idx > 0:

&nbsp;       return b\[:-1] + ALPHABET\[(last\_idx - 1) // 2] if len(b) > 1 else ALPHABET\[last\_idx // 2]

&nbsp;   return b + ALPHABET\[0]



def initial\_rank() -> str:

&nbsp;   """Generate the first rank for an empty stream."""

&nbsp;   return ALPHABET\[BASE // 2]  # 'i'

```



\*\*Rebalancing:\*\* If ranks become too long (> 50 chars), trigger a rebalance pass that reassigns all ranks to evenly-spaced short strings. This is rare in practice.



\### 11.3 JSONata Integration



```javascript

const expr = jsonata("$parent(current, 'syllable').f.stress = 1");



// Register navigation functions

expr.registerFunction('parent', (token, stream) => {

&nbsp;   return engine.getParent(token, stream);

});



// Evaluate with data root

const result = expr.evaluate({

&nbsp;   current: currentToken,

&nbsp;   params: parameters

});

```



---



\## Appendix A: Complete Example



```yaml

include: \[streams.yaml]



parameters:

&nbsp; stress\_factor: 1.3      # Klatt 1976: stressed ~1.3x unstressed

&nbsp; clipping\_factor: 0.6    # Chen 1970: ~60% before voiceless

&nbsp; base\_f0: 110            # typical male fundamental



patterns:

&nbsp; stop\_before\_sonorant:

&nbsp;   stream: phone

&nbsp;   scope: syllable

&nbsp;   max\_lookahead: 20

&nbsp;   sequence:

&nbsp;     - capture: stop

&nbsp;       where: "current.f.manner = 'stop'"

&nbsp;     - capture: son

&nbsp;       where: "current.f.manner in \['vowel', 'nasal', 'liquid', 'glide']"



&nbsp; d\_j\_coalescence:

&nbsp;   stream: phone

&nbsp;   scope: phrase

&nbsp;   cross\_boundary: true

&nbsp;   sequence:

&nbsp;     - capture: d

&nbsp;       where: "current.f.manner = 'stop' and current.f.place = 'alveolar' and current.f.voicing = 'voiced'"

&nbsp;     - capture: j

&nbsp;       where: "current.f.manner = 'glide' and current.f.place = 'palatal'"

&nbsp;   constraint: "$parent(d, 'word').id != $parent(j, 'word').id"



phases:

&nbsp; - name: sandhi

&nbsp;   rules: \[coalesce\_dj]



&nbsp; - name: allophonic

&nbsp;   rules: \[insert\_release]



&nbsp; - name: duration

&nbsp;   rules: \[stress\_lengthening]

&nbsp;   resolve\_scalars: \[duration]

&nbsp;   compute\_times: true



&nbsp; - name: prosody

&nbsp;   rules: \[f0\_targets]

&nbsp;   resolve\_points: \[f0]



rules:

&nbsp; # Cruttenden 2014 §10.3: yod coalescence /dj/ → /dʒ/

&nbsp; coalesce\_dj:

&nbsp;   citation: "Cruttenden 2014 §10.3"

&nbsp;   match: d\_j\_coalescence

&nbsp;   splice:

&nbsp;     type: replace\_range

&nbsp;     range\_left: d.sync\_left

&nbsp;     range\_right: j.sync\_right

&nbsp;     delete: \[d, j]

&nbsp;     insert:

&nbsp;       - name: "'dʒ'"

&nbsp;         parent: "$parent(d, 'syllable')"



&nbsp; # Stevens 1998 Ch.8: stop release burst modeling

&nbsp; insert\_release:

&nbsp;   citation: "Stevens 1998 Ch.8"

&nbsp;   match: stop\_before\_sonorant

&nbsp;   splice:

&nbsp;     type: insert\_at\_boundary

&nbsp;     boundary: stop.sync\_right

&nbsp;     side: after

&nbsp;     insert:

&nbsp;       - name: "stop.name \& '\_rel'"



&nbsp; # Klatt 1976 §III.B: stressed vowels longer

&nbsp; stress\_lengthening:

&nbsp;   citation: "Klatt 1976 §III.B"

&nbsp;   select:

&nbsp;     stream: phone

&nbsp;     where: "current.f.manner = 'vowel'"

&nbsp;   apply:

&nbsp;     - field: duration

&nbsp;       op: mul

&nbsp;       value: "$parent(current, 'syllable').f.stress = 1 ? params.stress\_factor : 1"

&nbsp;       tag: stress



&nbsp; # Pierrehumbert 1980: F0 targets at vowel midpoints with declination

&nbsp; f0\_targets:

&nbsp;   citation: "Pierrehumbert 1980"

&nbsp;   select:

&nbsp;     stream: phone

&nbsp;     where: "current.f.manner = 'vowel'"

&nbsp;   insert\_point:

&nbsp;     stream: f0

&nbsp;     at: "$midpoint(current)"

&nbsp;     value: "params.base\_f0 \* (1.1 - 0.2 \* $index(current) / $total('phone'))"

&nbsp;     tag: f0

```



---



\## Appendix B: Glossary



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



\## Appendix C: References



\### Duration and Timing



\*\*Chen, M.\*\* (1970). Vowel length variation as a function of the voicing of the consonant environment. \*Phonetica\*, 22(3), 129-159.



\*\*House, A. S., \& Fairbanks, G.\*\* (1953). The influence of consonant environment upon the secondary acoustical characteristics of vowels. \*Journal of the Acoustical Society of America\*, 25(1), 105-113.



\*\*Klatt, D. H.\*\* (1976). Linguistic uses of segmental duration in English: Acoustic and perceptual evidence. \*Journal of the Acoustical Society of America\*, 59(5), 1208-1221.



\*\*Lehiste, I.\*\* (1970). \*Suprasegmentals\*. MIT Press.



\*\*Oller, D. K.\*\* (1973). The effect of position in utterance on speech segment duration in English. \*Journal of the Acoustical Society of America\*, 54(5), 1235-1247.



\*\*Wells, J. C.\*\* (1990). \*Longman Pronunciation Dictionary\*. Longman.



\### Phonation and Voice Onset Time



\*\*Klatt, D. H.\*\* (1975). Voice onset time, frication, and aspiration in word-initial consonant clusters. \*Journal of Speech and Hearing Research\*, 18(4), 686-706.



\*\*Klatt, D. H.\*\* (1980). Software for a cascade/parallel formant synthesizer. \*Journal of the Acoustical Society of America\*, 67(3), 971-995.



\*\*Lisker, L., \& Abramson, A. S.\*\* (1964). A cross-language study of voicing in initial stops: Acoustical measurements. \*Word\*, 20(3), 384-422.



\*\*Stevens, K. N.\*\* (1971). Airflow and turbulence noise for fricative and stop consonants: Static considerations. \*Journal of the Acoustical Society of America\*, 50(4B), 1180-1192.



\### Formants and Coarticulation



\*\*Öhman, S. E. G.\*\* (1966). Coarticulation in VCV utterances: Spectrographic measurements. \*Journal of the Acoustical Society of America\*, 39(1), 151-168.



\*\*Stevens, K. N.\*\* (1998). \*Acoustic Phonetics\*. MIT Press.



\*\*Stevens, K. N., \& House, A. S.\*\* (1955). Development of a quantitative description of vowel articulation. \*Journal of the Acoustical Society of America\*, 27(3), 484-493.



\*\*Sussman, H. M., McCaffrey, H. A., \& Matthews, S. A.\*\* (1991). An investigation of locus equations as a source of relational invariance for stop place categorization. \*Journal of the Acoustical Society of America\*, 90(3), 1309-1325.



\### Intonation and F0



\*\*Cooper, W. E., \& Sorensen, J. M.\*\* (1981). \*Fundamental Frequency in Sentence Production\*. Springer-Verlag.



\*\*'t Hart, J., Collier, R., \& Cohen, A.\*\* (1990). \*A Perceptual Study of Intonation\*. Cambridge University Press.



\*\*Ladd, D. R.\*\* (2008). \*Intonational Phonology\* (2nd ed.). Cambridge University Press.



\*\*Lieberman, P.\*\* (1967). \*Intonation, Perception, and Language\*. MIT Press.



\*\*Pierrehumbert, J. B.\*\* (1980). \*The Phonology and Phonetics of English Intonation\*. PhD dissertation, MIT.



\### Phonological Theory



\*\*Cruttenden, A.\*\* (2014). \*Gimson's Pronunciation of English\* (8th ed.). Routledge.



\*\*Gimson, A. C.\*\* (1980). \*An Introduction to the Pronunciation of English\* (3rd ed.). Edward Arnold.



\*\*Goldsmith, J.\*\* (1976). \*Autosegmental Phonology\*. PhD dissertation, MIT.



\*\*Ladefoged, P., \& Maddieson, I.\*\* (1996). \*The Sounds of the World's Languages\*. Blackwell.



\### Multi-Stream Architectures



\*\*Hertz, S. R.\*\* (1982). From text to speech with SRS. \*Journal of the Acoustical Society of America\*, 72(4), 1155-1170.



\*\*Hertz, S. R.\*\* (1991). Streams, phones, and transitions: Toward a new phonological and phonetic model of formant timing. \*Journal of Phonetics\*, 19(1), 91-109.

