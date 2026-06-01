# Investigation: Backend List Load

## Facts (verified)
- Current branch is `dectalk-parity` - evidence: `git branch --show-current`.
- Current tracked status has no modified tracked files; many untracked notes/scripts are present - evidence: `git status --short`.
- `index.html` contains the visible `Backend:` label - evidence: `rg -n -i -F "backend" src test scripts index.html`.
- Backend selection code is under `scripts/rendering/select-backend.ts` and backend implementations are under `scripts/rendering/backends/` - evidence: `rg -n -i -F "selectRenderBackend" src test scripts index.html`.

## Theories (plausible)
1. The UI enumerates backend choices by importing or probing expensive render backends during initial page load.
2. The script CLI imports heavyweight backend modules at startup even when only listing or selecting a cheap backend.
3. The apparent backend delay is caused by an unrelated large asset fetch triggered before backend UI initialization.

## Tests Run

| Test | Hypothesis | Result | Rules Out | Supports |
|------|------------|--------|-----------|----------|
| Source-only backend search | Locate backend list code path | `index.html`, `scripts/rendering/select-backend.ts`, and backend modules found | N/A | 1, 2 |
| Broad backend search | Check accidental generated-data involvement | Search included `public/cmu-dictionary.json`, producing huge output | N/A | 3 remains plausible |

## Current Best Theory
Unknown. The backend list path is located, but the expensive operation has not been measured yet.

## Open Questions
- Which code path loads the visible backend list?
- Which module or asset dominates the delay?

## Next Action
Read `index.html`, backend selection code, and adjacent entrypoints to identify the load path and a direct timing probe.
