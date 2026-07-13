# Chunk dt-8 coder: per-frontend year-reading normalization (dectalk-english)

2026-05-29. Branch `dectalk-parity`. Goal: dectalk reads 4-digit years
("1984"->"nineteen eighty four") via generic per-frontend number-normalization
policy (DATA) + generic config-driven handler. qlatt-english byte-identical.

## Design chosen (Option B from recon dt-8a)
Per-frontend pipeline+tables YAML paths, threaded into `normalizeText`. The
year-reading step lives ONLY in dectalk's own pipeline. Year handler is a
generic builtin reading its predicate params from the step's YAML config.

## What changed (so far)
- `src/g2p/text-normalize.ts`:
  - `getTables`/`getPipeline` now keyed by path (Map caches), not single cache.
    Defaults = qlatt-english paths.
  - `normalizeText(text, config?: { tablesPath?, pipelinePath? })` — optional
    2nd arg (back-compat: all existing 1-arg callers unchanged). Sets a
    module-level `activeTablesPath` for the call duration (try/finally restore)
    so builtin handlers' table accessors resolve the right frontend's tables.
  - New `isYear(digits, policy)` + `readYear(digits)` + `read2Digits(pair)`
    (exported isYear/readYear). Mirrors DECtalk ls_util_is_year /
    ls_proc_do_4_digits / ls_proc_do_2_digits. Leading-zero half digit-spelled
    (1905 -> "nineteen zero five", NOT "oh five"; "oh" is out of scope).
  - New `readYearInline` builtin handler: rewrites only tokens that pass
    `isYear` per the step's `year_policy`; leaves non-years for `expand_numbers`.
  - `PipelineStep.year_policy?: YearPolicy` added.
  - DID NOT touch `numberToWords` (hazard b).
- `public/rules/frontends/dectalk-english/normalization-tables.yaml` — NEW,
  clone of qlatt tables (same English words; dectalk citation header).
- `public/rules/frontends/dectalk-english/normalization-pipeline.yaml` — NEW,
  clone of qlatt pipeline + `expand_years` step (readYearInline, year_policy
  data) inserted between expand_ordinals and expand_numbers.

## DONE — all of the above completed
- dectalk frontend.yaml: added `normalization: { tables_path, pipeline_path }`
  block (DATA) after dictionary_path. No other frontend touched. qlatt-english
  frontend.yaml NOT edited (declares no normalization block -> default path).
- tts-frontend.ts ~341: reads `frontendSpec.normalization` generically (no
  "dectalk" literal — just forwards declared tables_path/pipeline_path) and
  passes `{ tablesPath, pipelinePath }` to normalizeText. Absent block ->
  undefined config -> qlatt defaults.
- scripts/dt8-year-probe.ts written + kept. Asserts dectalk vs qlatt on 9
  inputs (the 6 required + 2025/2010/0100).

## EVIDENCE (all green)
- Probe: ALL PROBE ASSERTIONS PASSED.
  dectalk: 1984->nineteen eighty four, 1066->ten sixty six, 1905->nineteen zero
  five, 1900->nineteen hundred, 2000->two thousand, 2005->two thousand five,
  2025->twenty twenty five, 2010->twenty ten, 0100->one hundred.
  qlatt (same inputs): cardinal — 1984->one thousand nine hundred eighty four,
  1066->one thousand sixty six, etc. NO LEAK. (2000/2005 identical in both,
  since predicate rejects middle-00 -> cardinal in both paths.)
- `npx vitest run`: 125 files, 1107 tests passed (== baseline). Zero regression.
- Golden (`npm run test:golden`): only failure is lf-source-wasm-compare.ts
  (maxDelta 0.79 — the documented exclusion). klatt-tract (resonator/
  antiresonator) PASS, render-phrase.ts PASS (exit 0). No NEW golden failure.
- Typecheck `tsc -p tsconfig.core.json`: 1 pre-existing error in
  src/worklets/wasm-utils.ts (SharedArrayBuffer/BufferSource lib typing) —
  untouched file, unrelated to this change. ZERO errors in text-normalize.ts /
  tts-frontend.ts.

## Declarativity confirmation
- ZERO "dectalk"/frontend-name branches in TS. The year predicate params
  (min_digits/reject_leading_zero/reject_middle_00) live in dectalk's
  normalization-pipeline.yaml `expand_years` step as `year_policy:` DATA.
- readYearInline / isYear / readYear are generic, config-driven utilities
  (siblings to numberToWords), selected by name like every other builtin.
- numberToWords UNTOUCHED (hazard b avoided). qlatt-english declares no year
  policy -> entirely unchanged code path.
- normalizeText gained an OPTIONAL 2nd param; all existing 1-arg callers
  (tests + tts-frontend) unaffected (hazard c not triggered).

## Baseline (before changes)
- test/g2p-text-normalize.test.ts + text-normalize-declarative.test.ts: 63 pass.
- text-normalize-declarative.test.ts asserts qlatt pipeline step order EXACTLY
  (14 steps) and qlatt tables -> MUST NOT edit qlatt YAMLs. Confirmed not edited.
- Existing normalizeText callers all 1-arg (tests + tts-frontend.ts) -> optional
  2nd param is safe (hard-stop c not triggered).

## Worked-example expectations (recon §1.2)
1984->nineteen eighty four; 1066->ten sixty six; 1900->nineteen hundred;
1905->nineteen zero five; 2000->two thousand (NOT year); 2005->two thousand
five (NOT year); 2025->twenty twenty five.
