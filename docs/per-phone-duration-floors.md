# Per-phone duration floors

Issue #61 uses Allen, Hunnicutt & Klatt (1987), Table 9-1 (p.96), as
the single MIN/INHERENT dataset. The local extraction is in
`papers/Allen_1987_MITalk_TTS/chunks/chunk-080-119.md`.
Klatt (1976), Eq.1, supplies the resolution formula, not these table values.
Inspection of the original Klatt 1976 PDF, printed p.1217, confirms that
Table II itself prints 105/240 and 65/160 alongside 0.42. Their exact ratios
are 0.4375 and 0.40625. This implementation does not use that inconsistent
ratio column or mix those examples into the MITalk table.

Before implementation, the chosen adaptation is:

- Keep existing acoustic targets and inherent durations. Scale the selected
  MITalk MIN/INHERENT ratio to Qlatt's duration basis. This is an engineering
  adaptation, not a claim that Qlatt reproduces MITalk's absolute durations.
- Map ARPABET symbols to the table's symbols explicitly in `duration_models`
  in inventory.yaml. Stress variants share their phone's table row; AH0 uses
  AH, not an implicit phoneme change to AX. Secondary stress selects the same
  duration data as its declared inventory target fallback.
- Apply MITalk Ch.9 Rule 7's factor of 0.5 exactly once when segment stress
  is explicitly zero. Missing stress and secondary stress retain the full
  ratio. Do not also change the existing stress K factors in this issue.
- Establish the floor before duration rules as
  `min(inherentDuration, duration) * MIN / INHERENT * stressScale`.
  Before duration processing, a structural component's allocated duration can
  be smaller than its standalone inventory duration. The smaller basis avoids
  assigning a standalone whole-phone minimum to each component. This bounded
  allocation is an engineering adaptation, including closure and affricate
  mappings; it does not claim empirical component minima.
- Preserve any explicit durationFloor, including zero for releases/aspiration
  and the existing rhotic-tail floor. Silence and generated release/aspiration
  targets have explicit zero-ratio models; their timeline safety floors remain.
  GS, absent from the selected table, explicitly uses the old consonant ratio
  as an engineering fallback. Other frontends without duration models retain
  their class-ratio policy, with a diagnostic when that fallback is used.
- Keep Klatt's existing per-write rounding. The effective floor can be fractional;
  the duration is rounded to milliseconds, so comparisons allow half a millisecond.

The floor rule's versioned reads link the inventory model, stress and component
allocation into provenance. Later duration writes depend on that floor write.
Floor data includes the selected source row and citations. Invalid declared data
must fail, while absent data is distinguishable from an explicit zero.

The historical 22 ms unstressed-vowel observation is not a causal regression:
the old engine already had class floors. The comparison report evaluates the
current exact base instead. This change does not claim general prosodic quality
improvement, replace the timing model, or retune K coefficients.

## Scalar policy contract (#206)

Scalar rounding follows the relation's `unit: ms` declaration. A scalar named
`duration` with no unit or another unit retains fractional values; another scalar
declared in milliseconds receives the same per-write rounding as bundled duration.

The qlatt-english and qlatt-beauty duration scalar declarations include a
`floor_fallback` object with a CEL `value` and required `citations`. The resolver
uses the declared `floor_field` first, including an explicit zero. If that field
has no finite value, the existing CEL evaluator computes the fallback. This also
handles postlexical duration writes before the inventory floor rule runs.
DECtalk continues to establish its own `minimumDuration` field. The resolver no
longer chooses linguistic classes or policy keys. A missing declared floor with
no fallback raises `E_SCALAR_FLOOR_REQUIRED`.

Fallback CEL references and citations are validated with the rulepack. Evaluating
a fallback adds its citations and tracked item reads to the transaction's
provenance. The effective floor is not cached into the per-phone field, so later
inventory processing retains ownership of that field. A successful fallback
emits `W_DURATION_FLOOR_FALLBACK` (or `W_SCALAR_FLOOR_FALLBACK` for other scalars)
with the requested effect value, applied result, field, item, rule and effective
floor. Rejected transactions emit no fallback warning.

## Corpus comparison

The control is commit `1af37573`, captured in a separate checkout with unchanged
production files. `docs/issue-61-duration-comparison.csv` includes all 627 active
segments in `test/phrase-sets/linguistic.json`, including unchanged segments,
source models and applying rule names. Full JSON captures additionally retain
the versioned writes and floor provenance.

365 segments changed: 179 shorter, 186 longer, 262 unchanged. Deltas range from
-26 to +17 ms. The largest decrease is the unstressed W offglide in
"Shy sharks shimmer in shallow shoals." (48 to 22 ms). Its component allocation
and unstressed floor replace the old standalone consonant class floor. Lower
floors can also increase a lengthened segment: with K > 1, more of its duration
is compressible/expandable. This explains increases such as AO1 in
"Say oh, ee, and oo again." (124 to 141 ms).

To reproduce, install the locked dependencies in the control and candidate
checkouts and run the same reporting scripts in each. The control needs copies
of the two reporting scripts; its production files remain at the base commit.

```text
node scripts/run-frontend-script.mjs scripts/report-segment-durations.ts before.json
node scripts/run-frontend-script.mjs scripts/report-segment-durations.ts after.json before.json
node scripts/run-frontend-script.mjs scripts/export-declarative-corpus-summary.ts
```

The first command runs in the control; the remaining commands run in the
candidate (pass an absolute path to the control capture). Comparison produces
`after.json.csv`. The launcher supplies the Vite environment required by the
frontend's import.meta.env and YAML loading; it does not start a listening server.

The golden refresh also updates the four qlatt-english tone-association track
hashes and the klatt80-baseline default/zero-jitter audio hashes. Both test files
pass unchanged on control `1af37573`; beauty and DECtalk controls remain unchanged.
The dictionary audit now checks each active HRG component against its rounded
declared floor, including vowels and releases. The old 30 ms glide heuristic
incorrectly treated allocated offglides as standalone phones; missing floor data
now fails the audit rather than being skipped. As before, the floor audit covers
successfully synthesized words. Synthesis errors are counted separately: for
example, `antwerp` fails on both base and candidate in the existing
`hertz_nucleus_timing` nullable-voicing predicate, before this comparison can run.
