# chunk dt-2b analyst review

2026-05-29. Branch `dectalk-parity`. Review of uncommitted per-frontend `dictionary_path` wiring.

## Suite
`npx vitest run` -> 125 files, 1105/1105 passed (85.4s). Matches claim. No errors/warnings beyond
expected pipeline logs. `test/dectalk-e2e.test.ts` exercises `textToKlattTrack(..., {frontendId:"dectalk-english"})`
which now hits the sync loader + new map path; it passes.

## Facts observed
- dectalk-dictionary.json: 13272 entries, all string values, valid JSON. hello -> "HH EH0 L OW1".
- qlatt-english/frontend.yaml: NO dictionary_path -> frontendDictionaryMap === undefined -> dictionaryMap undefined ->
  transcribe-text falls back to CMU_DICT_MAP. So qlatt-english uses global as before. (tts-frontend.ts:227-229, 319)
- Cache: DICTIONARY_CACHE keyed by raw specPath. CMU loaded under "/cmu-dictionary.json", dectalk under
  "/dectalk-dictionary.json". Distinct keys -> no cross-frontend contamination. Per-frontend is genuine, not last-writer global.
- effectiveDictMap and effectiveDictLookup both derive from options.dictionaryMap when present (transcribe-text.ts:284-291).
  Compound-recovery probe hasDirectDictionaryEntry reads effectiveDictMap (line 311) -> same map as lookup. No global leak.

## Findings (ranked)

### should-fix
1. **Malformed/missing dict behavior is inconsistent between sync and async loaders, and partly silent.**
   - cmu-dictionary-loader.ts:8 `readDictionarySourceFromUrlSync` returns null on non-2xx (404). Then loop falls to FS
     (line 114). In Node tests/CLI the FS read SUCCEEDS so a 404 in browser would silently... no — in browser FS read
     returns null (not Node), so after both loops it THROWS E_CMU_DICT_PATH_UNKNOWN (line 124). Good: missing path is loud.
   - Malformed JSON: parseDictionary throws E_CMU_DICT_PARSE (line 21). Loud. Good.
   - BUT: a malformed-JSON throw happens INSIDE buildTextToKlattTrackDetailed at module-call time, not caught/diagnosed.
     There is no diagnostics.emit for dict-load. Compare AGENTS.md principle 3 (clamp/fallback/error -> diagnostic event).
     A dict load is a non-trivial decision with zero provenance/diagnostic record. The load throws hard (acceptable, not
     silent) but success is invisible to provenance. Proposed: emit a diagnostic/provenance record on dict load
     (path, entry count) in tts-frontend.ts near line 227.

2. **Main-thread sync XHR for 393 KB on every first dectalk call in browser.**
   - readDictionarySourceFromUrlSync uses `request.open("GET", path, false)` — synchronous XHR (cmu-dictionary-loader.ts:6).
     For dectalk's 393 KB / 13k entries this blocks the main thread on first call. Deprecated API; browsers warn.
     Cached after first load (DICTIONARY_CACHE) so only first call pays. The PRE-change global CMU map loaded via
     top-level await (transcribe-text.ts:73) — async, off the critical click path. This change introduces a NEW
     synchronous-on-main-thread load contract for dectalk only. qlatt unaffected (still top-level await).
     Note: 4.1 MB CMU was always async; dectalk being sync is the new hazard but it is 10x smaller and one-time.
     Proposed direction: preload dectalk dict via async preloadCmuDictionaryFromPath at module init (like CMU) so the
     sync call hits cache, OR accept the one-time first-call block (it is bounded, cached, dectalk-only).

### nit
3. **Sync loader prefers URL over FS; async loader (Node branch) prefers FS over URL.** Order differs between the two
   loaders (sync: url-loop then fs-loop, lines 105/114; async: fs-loop under isNodeRuntime then fetch, lines 58/68).
   In Node tests XMLHttpRequest is undefined so url-loop is skipped — fine. But the inconsistency is a latent surprise
   if a Node env ever polyfills XHR. Cosmetic; behavior currently correct.

4. **listBundledCmuDictionaryPaths error hint says "known: /cmu-dictionary.json..."** for a dectalk path miss — the
   hint lists CMU defaults, mildly misleading when the failed path was the dectalk dict (cmu-dictionary-loader.ts:45,123).

## Declarativity
PASS. No per-word/per-frontend/voice name in control flow. Selection is purely path-presence:
`dictionaryPath ? loadSync(path) : undefined` (tts-frontend.ts:227) and `options.dictionaryMap ?? CMU_DICT_MAP`
(transcribe-text.ts:284). makeDictLookup is map-generic. skip_dictionary now gated behind `frontendDictionaryMap == null`
(line 321) — correct precedence: path > skip > global.

## Leak check
PASS. Per-path cache keys distinct; qlatt receives undefined dictionaryMap -> global CMU; dectalk receives its own map.
Module-global CMU_DICT_MAP is never mutated, only read as the default fallback.

## VERDICT: SAFE-TO-COMMIT
No blocker. Finding 1 (no diagnostic on dict load) and finding 2 (sync XHR main-thread block) are should-fix but
not commit-blocking: failures are loud (throw), not silent; qlatt path unchanged; dectalk block is one-time/cached.
