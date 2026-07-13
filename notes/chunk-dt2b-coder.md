# Chunk DT2b — wire DECtalk dict into dectalk-english frontend (coder)

Date: 2026-05-29
Role: coder. Generic per-frontend `dictionary_path` + dict-first/LTS-fallback for dectalk.

## Design (verified against source)

Existing dict flow:
- `transcribe-text.ts:73` loads ONE module-global `CMU_DICT_MAP` via top-level await on `DEFAULT_CMU_DICTIONARY_PATH`.
- `cmuDictLookup` (line 81) closes over that global; `transcribeText` uses `options.dictLookup ?? cmuDictLookup` (line 267).
- SECOND consumer: `hasDirectDictionaryEntry` (transcribe-text.ts:288) reads `CMU_DICT_MAP` DIRECTLY (compound recovery), NOT the injected lookup. LEAK POINT.
- `tts-frontend.ts:305` injects `noOpDictLookup` when `skip_dictionary`, else `undefined` (-> global CMU).
- `loadFrontendResources` (inventory.ts:260) reads inventory_path/lts_path/morphology_path — NO dictionary_path.
- `cmu-dictionary-loader.ts` caches per-path (`preloadCmuDictionaryFromPath`, DICTIONARY_CACHE). Reusable for any JSON path.

Plan (generic infra, no per-word/per-frontend branches):
1. `loadFrontendResources` (+FrontendResources type): add generic `dictionaryPath` from `spec.dictionary_path`.
2. `transcribe-text.ts`: accept an optional per-call dict MAP (not just lookup fn) so BOTH the lookup
   AND `hasDirectDictionaryEntry` (compound recovery) use the same configured map. Build the lookup
   from that map via the existing cmuDictLookup adapter logic (generalized to take a map arg).
   When no map supplied -> fall back to global CMU map (qlatt-english unchanged).
3. `tts-frontend.ts`: when resources.dictionaryPath present, preload that path (cached) and pass the
   map into transcribeText; drop the skip_dictionary/noOp path for dectalk by config change.
   qlatt-english (no dictionary_path) keeps using the global CMU default — verify byte-identical.
4. dectalk frontend.yaml: remove `skip_dictionary: true`, add `dictionary_path: /dectalk-dictionary.json`.

Dict-first/LTS-fallback already structural in g2p/index.ts (dict -> possessive -> morphology -> LTS).
Just feeding a non-null dictLookup gives dict-first; misses return null -> LTS. Preserved.

## STATE: implementation in progress

Edits done so far:
- `inventory.ts`: added `dictionaryPath?` to FrontendResources type + read `spec.dictionary_path`.
- `tts-frontend-types.ts`: added `dictionaryMap?` to TranscriptionOptions.
- `transcribe-text.ts`: extracted `makeDictLookup(map)` factory; `cmuDictLookup = makeDictLookup(CMU_DICT_MAP)`.
  `transcribeText` now resolves `effectiveDictMap` (dictionaryMap ?? CMU global) and uses it for
  BOTH the lookup AND `hasDirectDictionaryEntry` (compound recovery leak fixed).
- `cmu-dictionary-loader.ts`: added sync `loadCmuDictionaryFromPathSync` (sync XHR + sync FS, same cache).
- `tts-frontend.ts`: import sync loader; load `frontendDictionaryMap` when `resources.dictionaryPath`.

REMAINING edits:
- `tts-frontend.ts`: change transcribeText call site to pass `dictionaryMap: frontendDictionaryMap`
  and set dictLookup: dictionaryPath ? undefined : (skip_dictionary ? noOp : undefined).
- dectalk `frontend.yaml`: drop skip_dictionary, add dictionary_path: /dectalk-dictionary.json.

## VERIFICATION RESULTS (2026-05-29)

- Baseline BEFORE changes: vitest 1105 pass / 125 files, all green.
- Wiring verify (scripts/verify-dectalk-dict.ts): hello/world/nuclear/judicial/computer/question/you
  ALL resolve via `dictionary_pronunciation_selected`, phonemes match dectalk-dictionary.json entries,
  tracks non-empty (33-131 frames) with F0>0. NO "not found" warnings for these. WIRING WORKS.
- vitest AFTER changes: 1105 pass / 125 files, all green. ZERO failures, ZERO baseline edits needed.
- test:golden: exits 1 on lf-source (maxDelta 0.79) = PRE-EXISTING, documented in DoD. klatt-tract passes.
  Golden harness (run-golden.ts) only runs klatt-tract + lf-source WASM compares — does NOT touch the
  frontend/dictionary at all, so my change cannot affect it. No NEW golden failure.

## WHY no baselines changed (the key finding — verifying, not assuming)
- dectalk-e2e.test.ts asserts ONLY structural properties (non-empty, finite params, duration/F0/F1
  ranges, segment counts) — NOT phoneme identity. Dict-vs-LTS phoneme changes don't trip it.
- oracle-corpora/dectalk-us-v1.json + oracle-output/*dectalk*.json are run by scripts/oracle/run-corpus.ts
  (npm run oracle:run), a SEPARATE manual harness comparing real-DECtalk reference WAVs vs Qlatt. NOT
  part of vitest or test:golden. Not a regression gate the mission's stated gates cover.
- INVESTIGATING: test/tts-frontend-snapshot.test.ts + __snapshots__/...snap mentions dectalk. Full vitest
  passed including it. Need to confirm whether it pins dectalk phonemes for dict-changed words (then it
  SHOULD have changed -> regenerate) or only qlatt-english / dict-LTS-identical words (then correctly green).

## RESOLVED: snapshot test is qlatt-english, not dectalk
- test/tts-frontend-snapshot.test.ts calls textToKlattTrack(text,120,30) with NO frontendId
  -> defaults to qlatt-english. The .snap file has ZERO "dectalk" occurrences (grep -c = 0).
  It is a qlatt-english regression net. Its passing IS the proof qlatt-english output is unchanged.

## qlatt-english no-leak proof (direct)
scripts/verify-qlatt-unchanged.ts: qlatt-english "hello" -> HH AH L OW (CMU schwa).
dectalk dict "hello" = HH EH L OW (EH). Divergence preserved => dectalk dict did NOT leak into qlatt.

## before/after dict-vs-LTS (scripts/compare-dectalk-dict-vs-lts.ts) — intended improvements
- hello:    LTS HH EH1 L OW2   -> dict HH EH0 L OW1   (OW2 not even in inventory; dict correct)
- world:    LTS W ER0 L D       -> dict W ER1 L D       (stress fix)
- nuclear:  LTS N UW0 K L IY1 R -> dict N UW1 K L IY0 ER0 (LTS wrong syllabification)
- judicial: LTS JH AH1 D IH1 SH EL -> dict JH UW0 D IH1 SH AH0 L
- colonel:  LTS K AA1 L AA1 N EH1 L -> dict K ER1 N EL  (irregular spelling, dict correct)
- question: LTS K W EH1 S CH IH2 N -> dict K W EH1 S CH AH0 N
All "after" match public/dectalk-dictionary.json exactly. Dict-over-LTS = DECtalk's real behavior.

## FINAL STATE — DONE

Files changed (generic infra, no per-word/per-frontend TS branches):
- src/declarative-frontend/inventory.ts: FrontendResources.dictionaryPath + read spec.dictionary_path.
- src/tts-frontend-types.ts: TranscriptionOptions.dictionaryMap.
- src/transcribe-text.ts: makeDictLookup(map) factory; effectiveDictMap drives BOTH lookup AND
  hasDirectDictionaryEntry (compound-recovery leak fixed); cmuDictLookup = makeDictLookup(CMU_DICT_MAP).
- src/cmu-dictionary-loader.ts: sync loadCmuDictionaryFromPathSync (sync XHR + sync FS, shared cache).
- src/tts-frontend.ts: load frontendDictionaryMap from resources.dictionaryPath; pass dictionaryMap;
  dictLookup noOp only when no dictionaryPath AND skip_dictionary.
- public/rules/frontends/dectalk-english/frontend.yaml: removed skip_dictionary, added dictionary_path.

New verify scripts (mine): scripts/verify-dectalk-dict.ts, compare-dectalk-dict-vs-lts.ts,
verify-qlatt-unchanged.ts. (dt1b-*.ts are from chunk DT1, not mine.)

BASELINE REGENERATION SCOPE: NONE NEEDED. No vitest/golden test pins dectalk phoneme identity.
- dectalk-e2e.test.ts asserts only structural properties (well-formedness/ranges), not phonemes.
- oracle-corpora/dectalk-us-v1.json is a manual real-DECtalk-WAV comparison harness (npm run oracle:run),
  NOT part of vitest or test:golden. Not regenerated (requires reference WAVs; out of scope/gate).
- snapshot test is qlatt-english only. So 0 dectalk baselines to regenerate; suite stayed 1105/1105.

GATES:
- vitest run: 1105 pass / 125 files (== baseline 1105; NO delta). Before AND after wiring.
- test:golden: exits 1 ONLY on pre-existing lf-source (maxDelta 0.79); klatt-tract passes. No NEW failure.
- typecheck: none of my 5 changed files error (pre-existing errors elsewhere: toposort, wasm-utils,
  rhotic-vowels test import, dump-track, oracle/symbolic — all untouched by me).

UNCERTAIN/for reviewer:
1. Provenance reason text still says "Used CMU dictionary pronunciation" for dectalk dict hits — the
   citation label in transcribe-text.ts is hardcoded "CMU Pronouncing Dictionary". The SOURCE LAYER
   (dictionary_pronunciation_selected) is correct; only the human-readable citation string is CMU-specific.
   A follow-up could thread a per-frontend dictionary citation label. Cosmetic, not a wiring bug.
2. No dectalk phoneme-identity regression test exists. If desired, a small vitest asserting e.g.
   dectalk "colonel" -> K ER1 N EL (dict) would lock the dict-first behavior. Not in this chunk's scope.
