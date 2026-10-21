# Frame foundation (#243)

The foundation preserves the existing event schedule. One Segment F1 copy now
uses the common checked requested-attribute evaluator (#261). The remaining
frame phase and policy migrations remain #244–#247.

`lowerToFrames` creates a typed `frame` for each existing row. Segment events
have a `segment` association, never a stored string feature with that name.
Initial/final silence events have no Segment association. A rule reading
`current.segment.F1` records both the association and source feature dependencies.
The three bundled pipelines include `public/rules/frame-schema.yaml`.

`controlTimeMs` includes initial silence. Segment anchors retain their original
origin; Frame point anchors include the initial-silence offset. `segmentOffsetMs`
and `segmentRatio` describe a Segment event. `outputTimeMs` is the separately
projected output clock, including the existing controller overrides. The emitter
converts output milliseconds to seconds. Equal-time rows retain insertion order.
Active Segments with nonpositive duration retain the existing rejection.

Clock construction, output-clock projection, metadata, and Frame relation order
use transactions and finish before numeric evaluation. Numeric evaluation keeps
the original event enumeration order, independently of sorted emission. No
numeric Frame value creates a feature write, undo entry or journal transaction.
The existing parameter map preserves insertion/deletion/reinsertion and absence.

The authored `frame_copy.define.copied_f1` reads the Segment association through
`assoc`; its actual dependency evidence includes the named `frame_segments`
definition and the source F1 stamp. Repeated requests reuse the common evaluator's
value and evidence. Public pointers identify evaluation records, with authored
paths, document spans and observed reads in their reasons and source decisions
as parents. Remaining imperative transformations are explicitly recorded as
`frame_value_computed`, retaining transition endpoints, F0 samples and variance
centers. They are not presented as checked definitions. Programmatic lowering
without a supplied checked copy program retains imperative copying.
Every caller still supplies the declared Frame schema via `withFrameSchema`;
omitting a checked copy program does not remove that schema requirement.

Revised measurement acceptance is pending. The reports below describe the old
transaction-based candidate, not this revision. No new performance claim or
fulfillment of the final 2x budget follows from the schema/evaluator changes.

## Reproducing the measurements

Build WASM in the checkout first (`pwsh -NoProfile -File build.ps1` on Windows).
Install the lockfile dependencies with `npm ci`. The harness starts and closes
its own Vite server on port 8134. Set `CHROME_PATH` if Chrome/Edge is elsewhere.
Run Node and browser commands separately; avoid competing benchmark/test jobs.

```powershell
# Use a new shared output directory; keep the historical fixtures unchanged.
$reports = "C:/temp/qlatt-frame-revision"
# In the baseline checkout, with its matching harness:
node scripts/frame-baseline.mjs node "$reports/baseline-node.json.gz"
node scripts/frame-baseline.mjs browser "$reports/baseline-browser.json.gz"
# In the revised candidate checkout, on the same machine/browser/configuration:
node scripts/frame-baseline.mjs node "$reports/after-node.json.gz" "$reports/baseline-node.json.gz"
node scripts/frame-baseline.mjs browser "$reports/after-browser.json.gz" "$reports/baseline-browser.json.gz"
node scripts/summarize-frame-baseline.mjs "$reports"
```

Omit the final argument to capture a baseline. The frozen baseline commit is
`ad9c73d5968e3491e98e9cccf7979703900e2e4e`; capture it in a separate checkout with
the same harness. Reports retain full synthesis rows, SHA-256 hashes, configuration
and asset digests, machine/browser identity, five corpus timings and their median,
CEL evaluation counts, decision and journal-entry counts, and available heap data.
Unavailable metrics are identified explicitly. Candidate reports also record
source-file digests because a working tree can differ from its HEAD commit.
Gzip is lossless packaging; `scripts/pack-frame-baseline.mjs` checks the round trip.

The workload is `test/phrase-sets/linguistic.json`, F0 110 Hz, transition 30 ms,
default speaker and affect. Each frontend/mode gets a complete warm-up corpus
pass, followed by five measured passes. Tooling means `captureTooling: true`;
ordinary execution still records normal provenance. Timers surround only
`textToKlattTrackDetailed`, after resource preloading/warm-up. Serialization and
report construction occur outside those timers. These repetition counts are
engineering benchmark choices from #243.

Comparison checks every serialized synthesis field, optional-field absence,
parameter key order and row order, removing only the row's provenance map.
It reports the first differing phrase and field/key order. Comparison rejects
different machine, browser, corpus or call configuration. Node timings are
supporting evidence; the <=2x ordinary-browser median gate belongs to final
completion of #228. Each slice records its cost against this frozen baseline.

The benchmark server returns 404 for absent `/rules/` assets. This lets the
existing inherited-include loader try the parent frontend instead of receiving
Vite's SPA fallback HTML. No rulepack or synthesis behavior is replaced.

## Recorded foundation results

The four compressed reports in `test/fixtures/frame-foundation/` retain the
baseline and candidate measurements. All twelve frontend/runtime/tooling
comparisons pass exact synthesis equality. Each frontend has the same hash in
Node and browser, with and without tooling. Browser version: `152.0.7977.66`;
Node: `v22.18.0`; build mode: Vite development. Machine identity and asset/source
digests are recorded in each report. Candidate source digests identify the
uncommitted implementation separately from its base commit.

Median corpus-total latency, milliseconds (before → after):

| Frontend | Browser ordinary | Browser tooling | Node ordinary | Node tooling |
| --- | --- | --- | --- | --- |
| qlatt-english | 1819.2 → 2762.0 (1.52x) | 15657.8 → 16551.9 (1.06x) | 3164.4 → 4484.7 (1.42x) | 23256.3 → 24796.4 (1.07x) |
| qlatt-beauty | 1679.0 → 2170.3 (1.29x) | 12193.7 → 12302.6 (1.01x) | 3180.8 → 4627.4 (1.45x) | 21324.7 → 23154.6 (1.09x) |
| dectalk-english | 2142.6 → 7454.1 (3.48x) | 13460.4 → 18538.2 (1.38x) | 3877.8 → 15087.2 (3.89x) | 21596.4 → 33255.0 (1.54x) |

**DECtalk exceeds #228's final 2x ordinary-browser budget.** This slice establishes
and reports the cost; it does not satisfy the umbrella's final performance gate.
The added Frame provenance and journal entries are substantial, especially for
DECtalk. The counters below establish their size; they are not a CPU profile.
Reducing that cost must preserve the bounded write ancestry and cannot replace
the planned declarative migration with an imperative fallback.

Counts per corpus pass are identical across runtimes and tooling modes:

| Frontend | Decisions before → after | Journal entries before → after | CEL evaluations (unchanged) |
| --- | --- | --- | --- |
| qlatt-english | 120064 → 286724 | 11431 → 165327 | 109147 |
| qlatt-beauty | 102547 → 200676 | 9081 → 98877 | 106790 |
| dectalk-english | 100898 → 1076973 | 6480 → 899654 | 114496 |

End-of-run used-heap snapshots were 195882795 → 467198862 bytes in the browser
and 1555631600 → 3060516368 bytes in Node. These are GC-sensitive snapshots,
not retained-heap measurements. Retained heap after forced GC, journal bytes,
and per-expression CEL timing are unavailable; the reports explicitly mark them.
The Node baseline overlapped a failed browser-startup attempt, so Node timings
are supporting evidence. The successful browser runs used separate frozen
checkouts and ran without competing test or benchmark jobs.

Validation: 221 Vitest files / 1885 tests passed, including dictionary audit,
DECtalk, voice-quality, tone-association, and HRG regressions. Golden tests,
core typecheck, bundled schema/single-parse checks, and strict-citation explain
also passed. Focused Frame tests cover clock origins, coincident rows,
zero-duration rejection, source navigation, and bounded transition/affect ancestry.
