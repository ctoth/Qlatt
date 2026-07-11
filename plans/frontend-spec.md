\# Declarative TTS Frontend DSL v9



A domain-specific language for phonological and phonetic rules in speech synthesis.



---



\## Part 1: Core Data Model



\### 1.1 Sync Marks



A single \*\*global sync axis\*\* coordinates all relations.



```typescript

interface SyncMark {

&nbsp; id: string;           // STABLE unique ID (never reassigned)

&nbsp; order: string;        // LexoRank-style string for ordering

&nbsp; time: number | null;  // concrete time in ms (after duration resolution)

}

```



\*\*Ordering:\*\* Uses LexoRank strings (base-36 with "between" insertion). Simpler than rationals, no overflow, deterministic. Example: between "a" and "c" insert "b"; between "a" and "b" insert "am".



\*\*Interior marks:\*\* A sync mark may exist inside a base token interval. Time computed by interpolation (§5.11).



\### 1.2 Sentinels



```typescript

const START: SyncMark = { id: 'START', order: '0', time: 0 };

const END: SyncMark   = { id: 'END', order: 'zzzzzz', time: null };

```



\- `START` always leftmost, `time = 0`

\- `END` always rightmost, `time` = total duration

\- Empty utterance: START and END only



\### 1.3 Interval Tokens



```typescript

interface IntervalToken {

&nbsp; id: string;

&nbsp; relation: string;

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

&nbsp; relation: string;

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



\### 1.5 Relation Types



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



```

D\_f = K × (D\_i - D\_min) + D\_min

```



Only the compressible portion scales.



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



\*\*Select rules:\*\*

```javascript

{

&nbsp; "current": Token,

&nbsp; "params": Record<string, Value>

}

```



\*\*Pattern rules:\*\*

```javascript

{

&nbsp; "stop": Token,      // capture name

&nbsp; "son": Token,       // capture name

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

| `$parent(t, relation)` | Token \\| null |

| `$children(t, relation)` | Token\[] |

| `$assoc(t, name)` | Token\[] |

| `$spanning(t, relation)` | Token\[] |

| `$index(t)` | number |

| `$total(relation)` | number |

| `$midpoint(t)` | Anchor |

| `$at\_ratio(t, r)` | Anchor |

| `$at\_sync(s)` | Anchor |



\### 2.4 Undefined Handling



JSONata's native `undefined` propagation applies:

\- `undefined.field` → `undefined`

\- `undefined = x` → `false`

\- Arithmetic with `undefined` → `undefined` → comparison fails



This is correct for sparse linguistic features.



\### 2.5 Sugar



In `where` clauses, bare paths reference `current`:

```yaml

where: "f.manner = 'vowel'"

\# expands to:

where: "current.f.manner = 'vowel'"

```



\### 2.6 Examples



```yaml

\# Feature check

where: "f.manner = 'vowel'"



\# Parent navigation

value: "$parent(current, 'syllable').f.stress = 1 ? params.stress\_factor : 1"



\# Pattern constraint

constraint: "obs.f.voicing = 'voiceless'"



\# Chained

constraint: "$next(stop).f.manner in \['vowel', 'nasal'] and $parent(stop, 'word').f.pos = 'verb'"

```



---



\## Part 3: Relation Definitions



\### 3.1 Base Relation



```yaml

relations:

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



```python

def rebuild\_span\_boundaries(span\_relation, child\_relation):

&nbsp;   """Update span boundaries from children. Spans must already exist."""

&nbsp;   for span in span\_relation.tokens:

&nbsp;       children = \[t for t in child\_relation.tokens if t.parent == span.id]

&nbsp;       if not children:

&nbsp;           raise Error(f"Span {span.id} has no children")

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

&nbsp;   relation: phone

&nbsp;   scope: syllable

&nbsp;   max\_lookahead: 50           # prevent catastrophic backtracking

&nbsp;   sequence:

&nbsp;     - capture: stop

&nbsp;       where: "f.manner = 'stop'"

&nbsp;     - capture: son

&nbsp;       where: "f.manner in \['vowel', 'nasal', 'liquid', 'glide']"

```



\### 4.2 Cross-Boundary Matching



```yaml

patterns:

&nbsp; d\_j\_coalescence:

&nbsp;   relation: phone

&nbsp;   scope: phrase

&nbsp;   cross\_boundary: true

&nbsp;   sequence:

&nbsp;     - capture: d

&nbsp;       where: "f.manner = 'stop' and f.place = 'alveolar' and f.voicing = 'voiced'"

&nbsp;     - capture: j

&nbsp;       where: "f.manner = 'glide' and f.place = 'palatal'"

&nbsp;   constraint: "$parent(d, 'word').id != $parent(j, 'word').id"

```



\### 4.3 Scope: utterance



The special scope `utterance` means `\[START, END]` with no parent constraint:



```yaml

patterns:

&nbsp; utterance\_final:

&nbsp;   relation: phone

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

1\. SNAPSHOT           Copy-on-write view of relations

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



```typescript

// Base relation splice (replaces delete + insert for base)

interface SpliceBasePatch {

&nbsp; type: 'splice\_base';

&nbsp; range\_left: SyncMarkId;       // inclusive

&nbsp; range\_right: SyncMarkId;      // inclusive

&nbsp; delete\_tokens: TokenId\[];     // tokens within range to remove

&nbsp; insert\_tokens: TokenSpec\[];   // tokens to insert (partition the range)

&nbsp; rule: string;

&nbsp; priority: number;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;            // unique within rule application

}



// Non-base interval insertion

interface InsertIntervalPatch {

&nbsp; type: 'insert\_interval';

&nbsp; relation: string;               // NOT base

&nbsp; sync\_left: SyncMarkId;

&nbsp; sync\_right: SyncMarkId;

&nbsp; token: TokenSpec;

&nbsp; rule: string;

&nbsp; priority: number;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}



// Point insertion

interface InsertPointPatch {

&nbsp; type: 'insert\_point';

&nbsp; relation: string;

&nbsp; anchor\_left: SyncMarkId;

&nbsp; anchor\_right: SyncMarkId;

&nbsp; ratio: number;

&nbsp; value\_expr: DeferredExpr;

&nbsp; context: CapturedContext;

&nbsp; rule: string;

&nbsp; priority: number;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}



// Modification (any relation)

interface ModifyPatch {

&nbsp; type: 'modify';

&nbsp; target: TokenId;

&nbsp; effects: ResolvedEffect\[];

&nbsp; rule: string;

&nbsp; priority: number;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}



// Deletion (non-base only; use splice for base)

interface DeletePatch {

&nbsp; type: 'delete';

&nbsp; relation: string;               // NOT base

&nbsp; target: TokenId;

&nbsp; rule: string;

&nbsp; priority: number;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}



// Association

interface AssociatePatch {

&nbsp; type: 'associate';

&nbsp; from: TokenId;

&nbsp; to: TokenId;

&nbsp; assoc\_name: string;

&nbsp; rule: string;

&nbsp; priority: number;

&nbsp; rule\_index: number;

&nbsp; match\_index: number;

&nbsp; patch\_seq: number;

}

```



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



Sort key: `(priority DESC, range\_left.order, range\_right.order, rule\_index, match\_index, patch\_seq)`



All patches use this universal key. For non-range patches:

\- `modify/delete`: `range\_left = range\_right = target.sync\_left`

\- `insert\_point`: `range\_left = anchor\_left`, `range\_right = anchor\_right`

\- `insert\_interval`: uses explicit `sync\_left`, `sync\_right`



\### 5.5 Base Relation Splice



All base relation mutations use `SpliceBasePatch`. This handles:

\- Simple insertion (delete\_tokens empty)

\- Simple deletion (insert\_tokens empty)

\- Replacement/coalescence (both non-empty)



\*\*Algorithm:\*\*



```python

def apply\_base\_splices(base\_relation, patches):

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

&nbsp;       execute\_splice(base\_relation, merged\_left, merged\_right, 

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

for relation in reversed(topology.hierarchy\[:-1]):  # skip base

&nbsp;   rebuild\_span\_boundaries(relation, child\_relation\_of(relation))

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

def compute\_times(base\_relation, all\_sync\_marks):

&nbsp;   # Step 1: Base boundaries

&nbsp;   time = 0

&nbsp;   for token in base\_relation.tokens\_in\_order():

&nbsp;       token.sync\_left.time = time

&nbsp;       time += token.s.duration

&nbsp;       token.sync\_right.time = time

&nbsp;   

&nbsp;   # Step 2: Interior marks by interpolation

&nbsp;   for mark in all\_sync\_marks:

&nbsp;       if mark.time is not None:

&nbsp;           continue

&nbsp;       

&nbsp;       # Find containing base token by order

&nbsp;       container = find\_base\_containing(mark.order, base\_relation)

&nbsp;       if container is None:

&nbsp;           # Mark is outside base relation (orphaned)

&nbsp;           # Assign to nearest boundary

&nbsp;           mark.time = find\_nearest\_boundary\_time(mark.order)

&nbsp;           continue

&nbsp;       

&nbsp;       # Interpolate

&nbsp;       left\_order = container.sync\_left.order

&nbsp;       right\_order = container.sync\_right.order

&nbsp;       alpha = lexo\_ratio(mark.order, left\_order, right\_order)

&nbsp;       mark.time = container.sync\_left.time + alpha \* (

&nbsp;           container.sync\_right.time - container.sync\_left.time)

```



\### 5.12 Point Resolution



```python

def resolve\_points(point\_relation, context\_map):

&nbsp;   for pt in point\_relation.tokens:

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



---



\## Part 6: Rule Definitions



\### 6.1 Select Rules



```yaml

rules:

&nbsp; stress\_lengthening:

&nbsp;   select:

&nbsp;     relation: phone

&nbsp;     where: "f.manner = 'vowel'"

&nbsp;   apply:

&nbsp;     - field: duration

&nbsp;       op: mul

&nbsp;       value: "$parent(current, 'syllable').f.stress = 1 ? params.stress\_factor : 1"

&nbsp;       tag: stress

```



\### 6.2 Pattern Rules with Splice



```yaml

rules:

&nbsp; # Simple insertion

&nbsp; insert\_release:

&nbsp;   match: stop\_before\_sonorant

&nbsp;   splice:

&nbsp;     range: "\[stop.sync\_right, stop.sync\_right]"  # point insertion

&nbsp;     insert:

&nbsp;       - name: "stop.name \& '\_rel'"

&nbsp;         parent: "$parent(stop, 'syllable')"



&nbsp; # Coalescence (delete two, insert one)

&nbsp; d\_j\_coalescence:

&nbsp;   match: d\_j\_coalescence

&nbsp;   priority: 10

&nbsp;   splice:

&nbsp;     range: "\[d.sync\_left, j.sync\_right]"

&nbsp;     delete: \[d, j]

&nbsp;     insert:

&nbsp;       - name: "'dʒ'"

&nbsp;         parent: "$parent(d, 'syllable')"



&nbsp; # Modification only

&nbsp; fortis\_clipping:

&nbsp;   match: vowel\_before\_obstruent

&nbsp;   constraint: "obs.f.voicing = 'voiceless'"

&nbsp;   apply:

&nbsp;     - target: v

&nbsp;       field: duration

&nbsp;       op: mul

&nbsp;       value: "params.clipping\_factor"

&nbsp;       tag: fortis

```



\### 6.3 Point Insertion



```yaml

rules:

&nbsp; f0\_targets:

&nbsp;   select:

&nbsp;     relation: phone

&nbsp;     where: "f.manner = 'vowel'"

&nbsp;   insert\_point:

&nbsp;     relation: f0

&nbsp;     at: "$midpoint(current)"

&nbsp;     value: "params.base\_f0 \* (1.1 - 0.2 \* $index(current) / $total('phone'))"

&nbsp;     tag: f0

```



\### 6.4 Deletion (Non-Base)



```yaml

rules:

&nbsp; delete\_floating\_tone:

&nbsp;   select:

&nbsp;     relation: tone

&nbsp;     where: "f.floating = true"

&nbsp;   delete: true

```



---



\## Part 7: Phases



```yaml

phases:

&nbsp; - name: sandhi

&nbsp;   rules: \[d\_j\_coalescence]

&nbsp;   rebuild\_spans: true



&nbsp; - name: allophonic

&nbsp;   rules: \[insert\_release]

&nbsp;   rebuild\_spans: true



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

&nbsp;   rules: \[assign\_source]

&nbsp;   resolve\_scalars: \[AV, AH, AF]

```



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

&nbsp;   F0: {source: point, relation: f0}

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

&nbsp;   - pattern\_missing\_relation

&nbsp;   - unknown\_relation\_reference

&nbsp;   - invalid\_jsonata\_syntax

&nbsp;   - invalid\_feature\_value

&nbsp;   - phase\_order\_violation

&nbsp;   - orphan\_span                  # span with no children

&nbsp;   - overlapping\_base\_splices     # conflicting ranges

&nbsp;   - invalid\_ratio                # not in \[0,1]

&nbsp; 

&nbsp; warnings:

&nbsp;   - null\_target\_at\_runtime

&nbsp;   - deleted\_target\_at\_runtime

&nbsp;   - interior\_mark\_deleted        # strict policy applied

&nbsp;   - duration\_edit\_after\_times    # may need recompute



&nbsp; invariants:

&nbsp;   - base\_coverage               # base partitions \[START, END]

&nbsp;   - span\_boundary\_match         # spans match children

&nbsp;   - association\_symmetry

&nbsp;   - time\_monotonicity

```



---



\## Part 10: Implementation Notes



\### 10.1 Snapshot Strategy



Use copy-on-write:

\- Snapshot = immutable view (shared structure)

\- Patch application creates new arrays only for affected relations

\- Same semantics, no quadratic copying



\### 10.2 LexoRank Implementation



```python

def lexo\_between(a: str, b: str) -> str:

&nbsp;   """Generate string that sorts between a and b."""

&nbsp;   # Find first differing position

&nbsp;   for i in range(min(len(a), len(b))):

&nbsp;       if a\[i] != b\[i]:

&nbsp;           # Insert character between a\[i] and b\[i]

&nbsp;           mid = chr((ord(a\[i]) + ord(b\[i])) // 2)

&nbsp;           if mid != a\[i]:

&nbsp;               return a\[:i] + mid

&nbsp;           else:

&nbsp;               return a\[:i+1] + 'm'  # extend

&nbsp;   # One is prefix of other

&nbsp;   return a + 'm'

```



\### 10.3 JSONata Integration



```javascript

const expr = jsonata("$parent(current, 'syllable').f.stress = 1");



// Register navigation functions

expr.registerFunction('parent', (token, relation) => {

&nbsp;   return engine.getParent(token, relation);

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

include: \[relations.yaml]



parameters:

&nbsp; stress\_factor: 1.3

&nbsp; clipping\_factor: 0.6

&nbsp; base\_f0: 110



patterns:

&nbsp; stop\_before\_sonorant:

&nbsp;   relation: phone

&nbsp;   scope: syllable

&nbsp;   max\_lookahead: 20

&nbsp;   sequence:

&nbsp;     - capture: stop

&nbsp;       where: "f.manner = 'stop'"

&nbsp;     - capture: son

&nbsp;       where: "f.manner in \['vowel', 'nasal', 'liquid', 'glide']"



&nbsp; d\_j\_coalescence:

&nbsp;   relation: phone

&nbsp;   scope: phrase

&nbsp;   cross\_boundary: true

&nbsp;   sequence:

&nbsp;     - capture: d

&nbsp;       where: "f.manner = 'stop' and f.place = 'alveolar' and f.voicing = 'voiced'"

&nbsp;     - capture: j

&nbsp;       where: "f.manner = 'glide' and f.place = 'palatal'"

&nbsp;   constraint: "$parent(d, 'word').id != $parent(j, 'word').id"



phases:

&nbsp; - name: sandhi

&nbsp;   rules: \[coalesce\_dj]

&nbsp;   rebuild\_spans: true



&nbsp; - name: allophonic

&nbsp;   rules: \[insert\_release]

&nbsp;   rebuild\_spans: true



&nbsp; - name: duration

&nbsp;   rules: \[stress\_lengthening]

&nbsp;   resolve\_scalars: \[duration]

&nbsp;   compute\_times: true



&nbsp; - name: prosody

&nbsp;   rules: \[f0\_targets]

&nbsp;   resolve\_points: \[f0]



rules:

&nbsp; coalesce\_dj:

&nbsp;   match: d\_j\_coalescence

&nbsp;   priority: 10

&nbsp;   splice:

&nbsp;     range: "\[d.sync\_left, j.sync\_right]"

&nbsp;     delete: \[d, j]

&nbsp;     insert:

&nbsp;       - name: "'dʒ'"

&nbsp;         parent: "$parent(d, 'syllable')"



&nbsp; insert\_release:

&nbsp;   match: stop\_before\_sonorant

&nbsp;   splice:

&nbsp;     range: "\[stop.sync\_right, stop.sync\_right]"

&nbsp;     insert:

&nbsp;       - name: "stop.name \& '\_rel'"



&nbsp; stress\_lengthening:

&nbsp;   select:

&nbsp;     relation: phone

&nbsp;     where: "f.manner = 'vowel'"

&nbsp;   apply:

&nbsp;     - field: duration

&nbsp;       op: mul

&nbsp;       value: "$parent(current, 'syllable').f.stress = 1 ? params.stress\_factor : 1"

&nbsp;       tag: stress



&nbsp; f0\_targets:

&nbsp;   select:

&nbsp;     relation: phone

&nbsp;     where: "f.manner = 'vowel'"

&nbsp;   insert\_point:

&nbsp;     relation: f0

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

| Splice | Atomic delete+insert on base relation |

| Span | Stable token whose boundaries are recomputed from children |

| Effect | Scalar operation with monotonic order |

| Klatt resolution | Duration with incompressibility floor |

| JSONata | Expression language (data-root model, $ for registered functions) |

