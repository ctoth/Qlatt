You’re very close to an \*implementable\* spec. The core architecture (global sync axis + multi-stream tokens + deterministic patching + post-pass resolution) is coherent, and the tracing/provenance section is unusually strong for a DSL spec.



That said, there are a few places where the current text will produce either (a) undefined behavior, or (b) “looks deterministic but isn’t” behavior once you actually run it at scale. Below are the changes I’d treat as \*\*v10.1 must-fix\*\*, followed by \*\*high-leverage improvements\*\*.



---



\## v10.1 must-fix issues



\### 1) `localeCompare` makes ordering non-deterministic across environments



Your `compareOrder()` uses `rank.localeCompare()`. That is locale/collation dependent (and can vary by ICU build / runtime flags). For a synchronization key, that’s a footgun.



\*\*Fix:\*\* define rank comparison as \*codepoint lexicographic on ASCII\*.



\* Guarantee ranks are lowercase `\[0-9a-z]+` (you already do).

\* Compare with plain `<` / `>`.



\*\*Spec text to add:\*\*



> FINITE ranks are compared by ASCII codepoint lexicographic order (not locale collation). Implementations MUST NOT use locale-dependent collation.



---



\### 2) Rank insertion algorithm is not correct as written (and can create “no representable rank between” pairs)



The current `rank\_between()` pads `a` with `'0'` and `b` with `'z'`, then picks midpoints. That padding strategy does \*\*not\*\* preserve the “there exists a string between” property in lexicographic string order, and `rank\_before()` is especially suspect (it can return values that don’t satisfy `result < b` or that create pathological adjacency).



You need either:



\*\*Option A (recommended):\*\* adopt a known-correct \*fractional indexing\* algorithm over a fixed alphabet with explicit rebalance trigger when “no rank exists between”.

\*\*Option B:\*\* switch to fixed-length ranks (e.g., 10 chars) and treat them as base-36 integers; extend length only when adjacent (still needs care).



\*\*Spec change you should make regardless:\*\*



> Rank generation MAY fail if there is no representable rank between two adjacent ranks under the chosen alphabet + comparison. In that case, the engine MUST trigger a rebalance and retry.



Right now you say “No insertion can ever sort before START or after END,” which is fine, but you also implicitly claim insertion always succeeds—your algorithm does not guarantee that.



---



\### 3) Splice overlap policy contradicts the “merged group union” splice algorithm



You state:



\* Overlapping splices: “resolved by sort order (higher priority wins)”

\* Conflict: “two splices delete same token with different inserts → error”



But your `apply\_base\_splices()` \*groups overlapping ranges\* and then unions deletes + concatenates inserts. That does \*\*not\*\* implement “higher priority wins”. It produces a third behavior: “overlaps are merged”, which can silently violate both intended patches.



\*\*Fix:\*\* selection must happen \*before\* merging.



A clean deterministic model:



1\. Sort splices by the global key.

2\. Sweep left-to-right in mark order, maintaining a set of “claimed” mark-intervals already edited.

3\. For each splice:



&nbsp;  \* If it overlaps a claimed interval:



&nbsp;    \* If it is \*\*identical\*\* in effect (same deletes + same inserts under same range): coalesce.

&nbsp;    \* Else: \*\*skip\*\* (shadowed by earlier/higher-priority splice) \*or\* raise error if you want strictness.

4\. Only after you have a non-overlapping set do you “batch” them for execution efficiency.



If you want “higher priority wins”, you cannot union overlapping edits.



\*\*Spec text to add (tight):\*\*



> Overlapping base splices are not jointly applied. After sorting, a splice that overlaps a previously-accepted splice is either (a) rejected as a conflict, or (b) skipped as shadowed, unless it is provably identical in net effect.



---



\### 4) Range semantics are underspecified (inclusive vs half-open, token membership rule)



You alternate between `\[L, R]` and `\[A, B)` in the same section. Also “extent falls within” is ambiguous for boundary-touching tokens.



\*\*Fix:\*\* pick a single, formal definition.



Recommended for sync-mark endpoints:



\* Treat an interval token as spanning \*\*(left, right]\*\* or \*\*\[left, right)\*\* in order-space; pick one.

\* Define membership precisely:



&nbsp; \* Token `t` is “within splice range \[L, R]” iff `L ≤ t.sync\_left` \*\*and\*\* `t.sync\_right ≤ R` (order comparisons), i.e., the token is fully contained.



Then forbid splices that attempt to partially delete a token (unless you explicitly define splitting).



---



\### 5) Expression-vs-literal ambiguity in YAML (TokenSpec is currently unusable ergonomically)



Right now, `"stop.name \& '\_rel'"` is an expression, but `"æ"` is a literal, and you’re distinguishing them by convention and quoting tricks (`"'dʒ'"`). That will get painful \*fast\* and makes validation harder.



\*\*Fix:\*\* standardize an expression literal form. Two common choices:



\* \*\*Prefix form:\*\* strings beginning with `=` are JSONata expressions; everything else is a literal.



&nbsp; \* `name: "=stop.name \& '\_rel'"`

&nbsp; \* `name: "dʒ"` (literal)

\* \*\*Tagged/object form:\*\* `{expr: "..."}` vs `{lit: ...}`



Then update \*\*all\*\* polymorphic fields (`TokenSpec.name`, feature values, scalar values, parent) to use it consistently.



This is not cosmetics—without this, you can’t build a good LSP, and you can’t reliably validate “is this string supposed to be a phoneme label or a JSONata program?”



---



\### 6) `START`/`END` time fields vs pipeline steps: inconsistent as written



You define:



```ts

const START: SyncMark = { id: 'START', order: { kind: 'START' }, time: 0 };

const END: SyncMark   = { id: 'END', order: { kind: 'END' }, time: null };

```



But `compute\_times()` assigns times to sync marks, including the last boundary (which is often `END`). After time computation, `END.time` must be a concrete number.



\*\*Fix:\*\* specify sentinel semantics as:



\* `START.time` is always 0 after time computation.

\* `END.time` is always total utterance duration after time computation (and may be null before).



And add an invariant:



> After `COMPUTE TIMES`, all sync marks referenced by any token/point MUST have non-null `time`.



---



\## High-leverage improvements (worth doing now)



\### A) Make base-stream adjacency explicit (or explicitly \*not\* required)



Several parts assume base tokens “partition” `\[START, END]`, but you never precisely define whether adjacency requires:



\* `token\[i].sync\_right == token\[i+1].sync\_left` (shared mark), \*\*or\*\*

\* just “no gaps in token sequence/time” (times line up but marks may be distinct), \*\*or\*\*

\* just order consistency.



Pick one; it affects splice insertion, mark GC, interior mark interpolation, and `$next/$prev`.



\*\*My recommendation:\*\* require \*\*sequence adjacency\*\* in the base token list (prev/next defined by list), but do \*\*not\*\* require shared sync mark IDs. Then define base coverage in \*time\* after compute-times, and in \*order\* pre-times.



This makes deletion much easier (no forced mark merges), and it matches your “elastic interior marks” story.



---



\### B) Insert-at-boundary semantics need one more rule (your `side` field is underdefined)



You want:



\* `range\_left == range\_right` + `side: after/before` for point insertions.



But you need to define what \*span\* is being subdivided:



\* \*\*Option 1:\*\* side determines whether the new token(s) are inserted between the boundary and the immediately adjacent token on that side (i.e., it implicitly expands a zero-length splice into `\[boundary, neighbor\_boundary]`).

\* \*\*Option 2:\*\* side is just an ordering hint, and you always create fresh marks between the boundary and its neighbor in rank-order.



Write it down. Otherwise two implementations will diverge.



Also: define behavior at `START` / `END` (e.g., “side: before at START is invalid → validation error”).



---



\### C) Add “capture target defaulting” to `Effect` formally (your examples already require it)



You use:



```yaml

apply:

&nbsp; - target: v

&nbsp;   field: duration

```



But the `Effect\[]` type isn’t defined here (and your earlier scalar effect model is different). Make it explicit:



\* `target?: captureName | 'current'` default `'current'`

\* `field`, `op`, `value`, `tag`



---



\### D) Span empty behavior should be deterministic and preserved for debugging



Your rebuild pseudocode:



```py

span.sync\_left = span.sync\_right  # or preserve last known

```



That “or preserve last known” is where bugs breed.



Pick a deterministic collapse policy, e.g.:



\* Empty span collapses to its previous `sync\_left` (preferred), i.e. `sync\_right := sync\_left`.

\* Or collapses to previous midpoint (requires creating a mark or choosing one).

\* And \*store\* `last\_nonempty\_bounds` for trace/provenance.



Also: decide whether empty spans are allowed to be selected/matched; if so, `$children()` must return `\[]` and navigation functions should behave consistently.



---



\### E) Time computation: add consistency checks and make it linear-time



Your Step 2 does:



\* For each token, scan all marks to find interior marks ⇒ O(tokens × marks)



That’s okay for small utterances, but bad for corpora debugging/profiling. You already have profiling machinery, so you’ll notice.



\*\*Fix:\*\* maintain a global list of marks sorted by order; walk it once alongside base tokens:



\* As you advance token boundaries in order, collect marks between them and assign uniform times.



Also add assertions:



\* If a sync mark already has a time assigned as a boundary, any subsequent assignment must match exactly (or error).



This catches “mark shared by two boundaries with inconsistent durations” immediately.



---



\### F) Deterministic skip vs error for shadowed patches (especially for `modify`)



You already model `PatchSkipped` with reasons. Extend it to specify:



\* If a `modify` patch targets a token deleted by a higher-priority splice in the \*same phase\*, it MUST be skipped with reason `target\_deleted` (not fatal).

\* If two modifies target the same scalar field, both are allowed; ordering is by effect `order` (already good).



This is where your provenance tooling will shine—make the semantics predictable.



---



\### G) Add a first-class “origin/provenance” hook for inserted/replaced tokens



When you coalesce `\[d, j] → dʒ`, it’s valuable to have:



\* inserted token carries `origin: \[d.id, j.id]` (or `source\_tokens`)

\* optionally inherit associations from both (union), or explicitly choose.



Right now, you only have `source\_tokens` at `PatchGenerated`, but it’s not persisted into the token model.



This makes downstream rules and debugging substantially cleaner.



---



\## Minimal spec edits I’d actually apply (concrete)



If you only do a few deltas, do these:



1\. \*\*Replace localeCompare\*\*



&nbsp;  \* Use ASCII compare, require lowercase ranks.



2\. \*\*Add expression-literal form\*\*



&nbsp;  \* Adopt `=expr` strings for any field that can be expression-or-literal.



3\. \*\*Rewrite splice overlap semantics\*\*



&nbsp;  \* “Select non-overlapping winners first; overlaps are skipped or errors; never union-overlap.”



4\. \*\*Formalize range membership\*\*



&nbsp;  \* Token contained iff `L ≤ left` and `right ≤ R` under order.



5\. \*\*Make `END.time` required after times\*\*



&nbsp;  \* And add “all referenced marks have time after compute-times”.



Everything else can iterate.



---



\## Two places where you’re \*already\* ahead of most DSL designs



Just calling these out because they’re worth keeping as-is:



\* \*\*Effect provenance model:\*\* the before/after values + rule/citation/tag and match context is exactly what makes rule systems debuggable instead of mystical.

\* \*\*Debugger + LSP plan:\*\* you’ve basically specified an ecosystem, not just a format. That’s the difference between a research artifact and a usable toolchain.



---



\## URLs



\* \[https://jsonata.org/](https://jsonata.org/)



