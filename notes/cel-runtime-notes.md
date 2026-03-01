# CEL Runtime Notes (Go + TypeScript Prototypes)

Date: 2026-02-01
Location: `investigations/`

## What We Tested

### Go (cel-go)
Prototype path: `investigations/cel-prototype-go`
- Runtime: `github.com/google/cel-go` v0.27.0
- Features tested:
  - Receiver-style member overloads: `current.following("vowel")`
  - Lazy navigation implemented as runtime methods (no precomputed context)
  - `cel.bind(...)` extension
  - Assoc traversal returning a list, `size(...)`
  - Null handling via explicit ternary checks

Run:
- `cd investigations/cel-prototype-go`
- `go run .`

Observed output (pass):
- `current.following("vowel").f.backness => front`
- `current.following("vowel") == null ? false : ... => true`
- `cel.bind(...) => 1200`
- `size(current.following("vowel").assoc("tone")) => 1`
- `orphan parent => none`

Notes:
- `cel.bind` requires `ext.Bindings()`.
- Member functions work with `cel.MemberOverload` + `FunctionBinding`.
- We declared `current` via `decls.NewVar("current", decls.Dyn)` to satisfy check step.

### TypeScript / JS Runtimes
We tried two JS CEL libraries and compared behavior.

#### 1) `@marcbachmann/cel-js`
Prototype path: `investigations/cel-prototype-ts`
- Receiver methods (`current.following(...)`) are **not supported**.
- Global functions (`following(current, ...)`) **work**.
- `cel.bind` is **not recognized**.
- Null comparisons with map types (`map == null`) are **not supported** in ternaries.

Result summary:
- Global functions OK for simple cases.
- Receiver methods + bind + some null semantics fail.

#### 2) `cel-js` (ChromeGG)
Prototype path: `investigations/cel-prototype-ts-celjs`
- Parser rejects chained field access on function results (e.g. `following(...).f.backness`).
- Receiver syntax rejected.
- `cel.bind` rejected at parse time.
- Only simple nested calls like `size(assoc(...))` worked.

Result summary:
- Too restrictive for our needs.

## Key Takeaways

1) **Go CEL is fully capable** of lazy navigation via member overloads and supports `cel.bind`.
2) **TS/JS CEL runtimes are inconsistent** and currently fail on one or more of:
   - receiver methods
   - `cel.bind`
   - chained field access after function calls
   - null-safe comparisons in ternaries
3) **Expression language choice is independent of statement structure**.
   We still need YAML-level `let/set/if` regardless of CEL vs JSONata.

## Implications for the DSL

### If we want CEL semantics in JS/TS
Options:
- Use **global functions only** (no receiver methods) and avoid `cel.bind`.
- Avoid chaining after function calls if using `cel-js` (ChromeGG).
- Consider swapping to **WASM CEL** (cel-go or cel-cpp) for true spec behavior.
- Consider forking a TS runtime and driving it with the **cel-spec** conformance tests.

### If we can accept “CEL-ish”
- Use globals only, rewrite expressions like:
  - `following(current, SYLLABLE)`
  - `parent(current, WORD)`
- Inject scope constants as enums or flat constants (see “Scope enum mapping” below).

## Scope Enum Mapping (Open Decision)
We want to replace stringly-typed scope names ("tone", "syllable", etc.).
Two patterns:

1) Namespace map (if runtime supports dot access on maps):
   - Env: `{ Scope: { SYLLABLE: "syllable", WORD: "word", TONE: "tone" } }`
   - Expr: `parent(current, Scope.SYLLABLE)`

2) Flat constants (more runtime-friendly):
   - Env: `{ SYLLABLE: "syllable", WORD: "word", TONE: "tone" }`
   - Expr: `parent(current, SYLLABLE)`

## References
- Go prototype code: `investigations/cel-prototype-go/main.go`
- TS prototype (marcbachmann): `investigations/cel-prototype-ts/index.ts`
- TS prototype (cel-js): `investigations/cel-prototype-ts-celjs/index.ts`
- CEL conformance tests exist in `cel-spec/tests` (useful if we fork a runtime).
