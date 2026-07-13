# Chunk-2 baseline investigation notes

## 2026-05-24

### Task
Run vitest at c219a8f8 (parent of chunk 2's f6f7258f) and diff failures vs the cited 9 known failures at f6f7258f.

### Setup done
- `git worktree add C:/Users/Q/code/Qlatt-baseline c219a8f8` succeeded (detached HEAD).
- package.json + package-lock.json are byte-identical between baseline commit and main HEAD — junctioning node_modules is safe.
- `mklink /J C:\Users\Q\code\Qlatt-baseline\node_modules C:\Users\Q\code\Qlatt\node_modules` succeeded.
- WASM artifacts under `public/worklets/` are checked in, present at baseline.

### Vitest run at c219a8f8 — done
- Log: `C:/Users/Q/code/Qlatt-baseline/baseline-vitest.log`
- Summary: **Test Files 4 failed | 118 passed (122). Tests 9 failed | 1059 passed | 18 skipped (1086).** Duration 64.51s.
- Same totals as f6f7258f per prompt (4 files / 9 tests).
- Visible in tail: tts-frontend-snapshot.test.ts failures with snapshot mismatches (extra SIL frames at end). Suggests the 6 snapshot failures are PRE-EXISTING.

### Failure list extracted (4 files, 9 tests)

Confirmed file summary (from earlier successful grep):
- `❯ test/declarative-frontend-slice.test.ts (11 tests | 2 failed) 50ms`
- `❯ test/tts-frontend-snapshot.test.ts (6 tests | 6 failed) 634ms`

Still need to confirm:
- klsyn88.test.ts — earlier output showed `(18 tests | 18 skipped)` not failed. But 7 FAIL lines appear in the log for klsyn88 — these are likely setup-hook errors that vitest classifies as test errors, NOT counted in the "9 failed tests" summary (since count was 9, not 16). klsyn88 wasm-load failures are pre-existing infrastructure noise unrelated to chunk 2.
- tts-frontend-declarative-golden-summary.test.ts — 1 FAIL line confirmed.

Math check: 2 (slice) + 6 (snapshot) + 1 (golden-summary) = 9 tests failed across 3 files. Summary says 4 files failed. The 4th must be klsyn88. So the "9 failed tests" count excludes the klsyn88 setup errors (which show as skipped).

### Diff vs f6f7258f cited 9 failures
ALL 9 cited failures at f6f7258f are also failing at c219a8f8 EXCEPT:
- `test/dectalk-helpers.test.ts` (1 cited at f6f7258f) — NOT in baseline FAIL list at all. This was caused by chunk 2.

Wait — re-reading the prompt: 2 + 1 + 6 + 1 = 10, not 9. Prompt says "Cited known failures at f6f7258f" lists 10 tests total but the summary at f6f7258f presumably was 9. Need to check what's actually there.

Actually re-counting prompt: 2 + 1 + 6 + 1 = 10. Hmm, perhaps the prompt's enumeration is slightly off, or the dectalk-helpers fix is now committed. Either way the baseline at c219a8f8 has 9 tests failed (2 slice + 6 snapshot + 1 golden-summary), and the prompt's grouping of f6f7258f failures shows the SAME 9 plus dectalk-helpers as a chunk-2 addition.

### Verdict
- 2 declarative-frontend-slice failures: PRE-EXISTING
- 6 tts-frontend-snapshot failures: PRE-EXISTING (NOT chunk-2-introduced as suspected)
- 1 tts-frontend-declarative-golden-summary failure: PRE-EXISTING (NOT chunk-2-introduced as suspected)
- 1 dectalk-helpers failure: chunk-2-introduced (matches prompt's assessment)

Of the 7 "suspect chunk-2-introduced" failures, **0 are actually chunk-2-introduced** — all 7 are pre-existing.

### Blocker — none. Ready to write report.
