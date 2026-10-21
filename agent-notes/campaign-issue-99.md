# Issue 99: explain documentation

## Goal
Complete existing PR #104 without replacing its author commits or changing CLI behavior.

## State
Created isolated campaign/issue-99 from PR head a1fa1404 and merged current origin/master normally. Smallest remaining change: about 20 documentation lines in AGENTS.md/docs/README.md plus this note. CLAUDE.md already includes AGENTS.md.

## Decisions and why
- Match scripts/explain-phrase.ts:127,159-196,353-355,368-415,442-458: explicit phrase, strict warnings, item inspection, phase boundaries, JSON tooling, replay report and selected-window citation checking.
- Preserve current no-base-F0-override default. Strict citation coverage changes belong to #94.
- Keep corrected tts-dsl subcommands from the original PR; scripts/tts-dsl.ts:43-55 confirms them.
- Document direct Node invocation with existing package.json loader arguments for PowerShell. A deterministic native argv probe preserved the explicit phrase/format tail; do not claim an unverified npm stop-parsing remedy.
- Do not guess swallowed flags from legitimate phrase words such as json; no CLI heuristic or new guard.

## Surprises
The original PR predates the CLAUDE.md include and current voice pitch default; merging master preserves both.

## Next step
Claude review of c318ce8b accepted the scope and identified two minor documentation corrections. Added the JSON-versus-text detail qualification supported by renderText:308-316 and corrected the explicit-phrase citation to line 127. All seven CI checks passed on that reviewed head; push this documentation-only response and await the replacement head's CI before supervisor merge. No local CI steps.
