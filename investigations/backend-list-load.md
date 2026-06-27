# Investigation: Backend List Load

## Facts (verified)
- Current branch is `dectalk-parity` - evidence: `git branch --show-current`.
- Current tracked status has no modified tracked files; many untracked notes/scripts are present - evidence: `git status --short`.
- `index.html` contains the visible `Backend:` label - evidence: `rg -n -i -F "backend" src test scripts index.html`.
- Backend selection code is under `scripts/rendering/select-backend.ts` and backend implementations are under `scripts/rendering/backends/` - evidence: `rg -n -i -F "selectRenderBackend" src test scripts index.html`.
- The visible backend list is populated by `test/harness/experiment.js` fetching `./experiments/manifest.json`; the manifest is 1037 bytes - evidence: `Get-Content public/experiments/manifest.json` and `Get-ChildItem public/experiments -Recurse -File`.
- Baseline timing before the fix: dropdown ready at 33775 ms; `/experiments/manifest.json` started at 33223 ms; `/cmu-dictionary.json` loaded before the manifest; frontend rulepack YAML phases loaded before the manifest - evidence: `node scripts/measure-backend-list-load.mjs`.
- The harness entrypoint previously statically imported `./harness/runtime.js`; `runtime.js` statically imported `src/tts-frontend`, and `src/transcribe-text.ts` top-level awaited `preloadCmuDictionaryFromPath(DEFAULT_CMU_DICTIONARY_PATH)` - evidence: `Get-Content test/test-harness.js`, `Get-Content test/harness/runtime.js`, `Get-Content src/transcribe-text.ts`.
- Intermediate timing after lazy-loading runtime but before unblocking CSS: dropdown ready at 22180 ms; `/experiments/manifest.json` started only after `/test/test-harness.css` ended - evidence: `node scripts/measure-backend-list-load.mjs`.
- Final timing after both fixes: dropdown ready at 7196 ms; `/experiments/manifest.json` started at 6392 ms; no runtime, rulepack phase, or dictionary requests occurred before the list populated - evidence: `node scripts/measure-backend-list-load.mjs`.
- Build verification passed after the fixes - evidence: `npm run build`.

## Theories (plausible)
1. The UI enumerates backend choices by importing or probing expensive render backends during initial page load.
2. The script CLI imports heavyweight backend modules at startup even when only listing or selecting a cheap backend.
3. The apparent backend delay is caused by an unrelated large asset fetch triggered before backend UI initialization.

## Tests Run

| Test | Hypothesis | Result | Rules Out | Supports |
|------|------------|--------|-----------|----------|
| Source-only backend search | Locate backend list code path | `index.html`, `scripts/rendering/select-backend.ts`, and backend modules found | N/A | 1, 2 |
| Broad backend search | Check accidental generated-data involvement | Search included `public/cmu-dictionary.json`, producing huge output | N/A | 3 remains plausible |
| Baseline timing probe | Test whether the manifest fetch is delayed by the initial module graph | Dropdown ready at 33775 ms; manifest request started at 33223 ms after frontend rulepack and CMU dictionary work | Manifest itself is not the bottleneck | 1 |
| Lazy runtime import | Remove TTS/runtime imports from initial dropdown load | Dropdown improved to 22180 ms, but manifest still waited for CSS | TTS/runtime imports were one bottleneck, not the only one | 1, 3 |
| Nonblocking stylesheet | Test whether CSS was blocking module execution and manifest fetch | Dropdown improved to 7196 ms; manifest started at 6392 ms | CSS no longer blocks the list | 3 |
| Production build | Verify syntax/bundle after HTML and JS changes | `npm run build` passed | Syntax/bundling regression in changed files | Fix |

## Current Best Theory
The slow list had two blockers before the manifest fetch: the initial harness module graph imported runtime/TTS/dictionary work, and the stylesheet blocked module execution. The kept fix lazy-loads `runtime.js` on Start/Stop/Speak and makes the harness stylesheet nonblocking.

## Open Questions
- The probe measures a cold Vite dev-server page load. It does not isolate a warmed browser cache or production-host timing.

## Next Action
No investigation action remains for the requested backend-list load target.
