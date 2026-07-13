# preflight-recon-A scout notes

2026-05-24: working through prompts/preflight-recon-A.md questions 1-12.

## Status

- Q1 (determinism): DONE. Two `npm run explain -- "hello world" --format json --out ...` runs produced byte-identical files. SHA256 = 8606315DB858F94C2B2C36CC6BEBA004A9033B1422B77EA9189107C6B4D1D0A1, size 88473 bytes both runs.
- Q2 (test:golden): DONE. Runs three subscripts: klatt-tract-wasm-compare.ts, lf-source-wasm-compare.ts, render-phrase.ts. render-phrase default phrase "hello world" (single phrase); compares samples vs test/golden/phrase-hello-world.json with maxDelta<=1e-6, rmsError<=1e-7. klatt-tract & lf-source compare against test/golden/klatt_paper.json. Timing: 21.78s. Exit code 1 (lf-source rmsError 0.325 — pre-existing failure, not relevant to this scout mission but worth noting in report).
- Q3 (CI runs render-offline.html?): DONE. Only `.github/workflows/deploy.yml` exists; runs `npm ci` + `npm run build` only. No test:golden, no render-offline.html.
- Q4 (build:dict): DONE. scripts/build-cmudict.ts reads from `cmu-pronouncing-dictionary` npm package, writes to public/cmu-dictionary.json. Does NOT consume inventory.yaml.
- Q5 (predicates library): DONE. engine.ts:891-894 reads runtime.predicates. evaluateConditionInContext at lines 926-940 resolves `{predicate: name}` with cycle detection. Verified is_stressed_vowel defined in pipeline.yaml:4 of qlatt-english, used at prosody.yaml:603 via `look_ahead_pred(current, 20, 'is_stressed_vowel')`.
- Q6 (structured all/any/not): DONE. engine.ts:941-961 handles all/any/not. Grep `^\s*(all|any|not):\s*$` in public/rules/frontends — NO files match. No rule in corpus currently uses structured all/any/not block syntax.
- Q7 (dispatch ladders with when): DONE. engine.ts:1507-1528 implements dispatch. Many uses in formant.yaml (e.g. burst_spectral_template lines 378-385).
- Q8 (look_back_pred/look_ahead_pred): DONE. engine.ts:1020-1038 defines both, wrapping scanWhere. Registered at engine.ts:1071-1072.
- Q9 (CEL has() on missing fields): DONE empirically. Probe script `scripts/_probe_has.mjs` against @marcbachmann/cel-js:
  - `has(current.bilabial) && current.bilabial == true` → returns false (short-circuits).
  - `current.bilabial == true` → THROWS `No such key: bilabial`.
  - `has(current.bilabial)` → false.
  - `current.bilabial` bare → THROWS.
  Conclusion: predicate `is_bilabial: current.bilabial == true` is UNSAFE; MUST be guarded with `has()`.
- Q10 (burst rule dependency): IN PROGRESS. formant.yaml:370-480 — burst_spectral_template `select.where: current.type in ['stop_release', 'stop_aspiration']`. Need to check structural.yaml for who produces stop_release/stop_aspiration.
- Q11 (phoneme_release_map precondition): NOT STARTED. Need to read plans/typed-finding-lampson.md + structural.yaml:166-383.
- Q12 (frontend.yaml suffix patterns): NOT STARTED. Need to grep frontend.yaml for `_a\d+_`.

## Plan

1. Grep structural.yaml for stop_release / stop_aspiration emission (Q10).
2. Read plans/typed-finding-lampson.md chunk 8 + structural.yaml:166-383 (Q11).
3. Grep frontend.yaml suffix patterns (Q12).
4. Write reports/preflight-recon-A.md.

## Blockers

None.
