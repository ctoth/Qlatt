# Overnight issue sweep (2026-09-04/05) — orchestrator notes

Goal (user, verbatim intent): complete ALL open issues with TDD PRs (`Closes #N`), merge them, clean up
worktrees/branches as we go. User asleep; Fable credits reset 08:00. No questions; decide and record.

## Infrastructure
- Scratchpad: `C:/Users/Q/AppData/Local/Temp/claude/C--Users-Q-code-Qlatt/a474e3b8-179b-41cf-9fba-677175b5088e/scratchpad/`
  - `setup-worktree.ps1` — junctions node_modules, copies 18 WASM files (verified: klsyn88 test passes in worktree)
  - `AGENT_PROTOCOL.md` — implementer protocol (TDD, gates, PR body, report format)
  - `REVIEW_PROTOCOL.md` — merge-gate reviewer protocol (default NO-MERGE)
  - `issues.txt` — issue bodies dump
  - `full-test-timing.txt` — background timing of full `npm test` (in `Qlatt-setup-probe` worktree)
- Agents: `general-purpose`, model `fable`, `isolation: worktree`. Implementer name `impl-<N>`, reviewer `rev-<PR>`.
- Merge: `gh pr merge <PR> --merge --delete-branch` (repo uses merge commits). No branch protection. CI runs on PR only.
- Machine: 32 cores; vitest maxWorkers 4 per run → ~10 parallel lanes OK.
- Existing open PRs: #104 (docs, closes #99) needs review+merge; #11 #10 #8 #3 dependabot (not issues; leave).
- Stale worktrees from earlier sessions (Qlatt-issue-15 etc.) left alone. Probe worktree `Qlatt-setup-probe` to remove at end.

## Lanes (serial within lane, parallel across lanes)
- L1 bugs/small: #98 → #81 → #48 → #15 (branch slug must differ from existing `issue-15-normalization-pattern-preconditions`) → #17 → #19 → #73
- L2 declarative-a: #31 → #45 → #39 → #32 → #33 → #36 → #44
- L3 declarative-b: #47 (enabler) → #42 → #37 → #38 → #40 → #41 → #46 (tracking, last)
- L4 packaging: #75 → #76 → #77 → #78 → #79 → #80 → #82 → #74 (umbrella, last)
- L5 native: #84 → #88 → #87 → #85 → #86 → #89 → #83 (umbrella, last)
- L6 explainability: #92 → #91 → #90 → #94 → #95 → #96 → #97
- L7 rules-a: #61 → #64 → #63 → #62 → #70 → #65
- L8 rules-b: #69 → #68 → #72 → #67 → #66 → #71
- L9 dsp-a: #57 → #53 → #55 → #56 → #54
- L10 dsp-b: #51 → #52 → #58 → #59 → #60

## Flow per issue
impl agent → PR → rev agent (fresh worktree) → if NO-MERGE: SendMessage findings to impl agent, re-review → MERGE:
`gh pr merge --merge --delete-branch`, `git pull` main, `git worktree remove` both worktrees → dispatch next in lane.

## Status log
- 23:55 surveyed 63 open issues; wrote protocols; probe worktree validated.
- 00:0x dispatching wave 1 (10 impl + rev-104).
- 00:05 wave 1 dispatched: impl-98, impl-31, impl-47, impl-75, impl-84, impl-92, impl-61, impl-69, impl-57, impl-51 (all fable, own worktrees under .claude/worktrees/), plus rev-104 reviewing PR #104 (issue #99).
  Agents addressable by name via SendMessage (impl-<N>, rev-<PR>). Full-suite timing run still in progress in Qlatt-setup-probe.
  Next: on each impl completion → dispatch rev-<PR>; on MERGE → gh pr merge --merge --delete-branch, pull master, remove worktrees, dispatch next issue in that lane.
  Blockers: none. Waiting on agent completion notifications.
- 00:30 full suite baseline on master: 128 files / 1092 tests green in 301 s under load.
- 00:30 rev-104 → NO-MERGE (fork PR based on stale c9c9a8da; misses --phrase row, misdescribes --item/--tooling-only, no pwsh --% note). Cannot push to fork → dispatching impl-99 to finish #99 on our own branch, crediting the fork commit; close PR #104 with a comment after merge.
  Observed: under load, test/runtime-output-level.test.ts can hit 30 s timeout; added "rerun in isolation" note to both protocols.
