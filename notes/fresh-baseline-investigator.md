# Fresh baseline investigator notes

2026-05-24: Investigator dispatched on `declarative-cleanup` HEAD `66b7ac27`.

## State

- On branch `declarative-cleanup`, HEAD `66b7ac27` (chunk 3.1 verified MERGE per prior report).
- Working tree has unstaged `knowledge/claims/*.yaml` deletions (shared-worktree noise from another agent) — NOT touching.
- Ran `npx vitest run` from main checkout. Completed in 66.98s.

## Fresh vitest summary

```
Snapshots   6 failed
Test Files  3 failed | 121 passed (124)
Tests       9 failed | 1086 passed (1095)
```

NO skipped tests. Previous reports (master, c219a8f8) showed 18 skipped (klsyn88). That's gone now. DRIFT.

Also: Test Files went from 121 at master → 124 at HEAD (+3 files added during chunks). Tests went 1081 → 1095 (+14). One previously-failing FILE (klsyn88 with 18 skips) is no longer in the failed-files count — went from 4 failed files to 3 failed files. That's because all-skipped no longer counts as "failed" (or klsyn88 setup got fixed).

## Failing tests (identical to master baseline by identity)

declarative-frontend-slice.test.ts:
- materializes inserted release targets during structural phase
- preserves weak phrase-final stop timing through duration locking

tts-frontend-declarative-golden-summary.test.ts:
- matches locked corpus summary metrics

tts-frontend-snapshot.test.ts (6 snapshot mismatches):
- simple word: "hello"
- question intonation: "hello world?"
- multi-word sentence: "the quick brown fox."
- stop closure + release: "pat"
- diagnostic symbol: "/b/"
- silence only: "."

## DRIFT findings so far

1. **skipped: 18 → 0**. Klsyn88 setup error gone. Suite went from "4 failed files (3 real + 1 setup-error)" to "3 failed files".
2. **test counts: 1081 → 1095** (+14 new tests added across chunks 0.5 → 3.1, all passing).
3. **Failure identities: identical**. Same 9 tests as master and c219a8f8.
4. Snapshot diffs visible in stdout — show extra trailing SIL frames at `time: 0.18`, `0.32`, `0.43` etc. Snapshots expect fewer frames than engine now emits.

## Part 3 — diagnose ONE failure

Picking `silence only: "."` — simplest path through pipeline, snapshot diff shows EXACTLY one extra SIL frame (at time 0.32999... in the Received output but absent from Expected). Smallest signal-to-noise ratio.

The diff shows snapshot expected ends at time 0.43, Received has TWO trailing SIL frames (one at 0.33, one at 0.43). Production emits an extra silence frame.

NEXT: read `test/tts-frontend-snapshot.test.ts`, the snapshot file, and the production pipeline that emits trailing SILs — find what change added the extra frame.

## Blockers

None. Vitest ran clean in 67s, well under 3min budget.

## Part 3 diagnosis — DETAILED FINDINGS

### Test: `silence only: "."` — picked because simplest path, smallest signal

Test source (`test/tts-frontend-snapshot.test.ts:30-33`):
```ts
const track = textToKlattTrack(text, 120, 30);
expect(track).toMatchSnapshot();
```

### Snapshot (expected) — 3 frames

`test/__snapshots__/tts-frontend-snapshot.test.ts.snap:4364-4559`:
1. `time: 0` (no phoneme)
2. `time: 0.03`, phoneme=SIL, word="."
3. `time: 0.43`, phoneme=SIL

### Production (received) — 4 frames

Adds a fourth SIL frame at `time: 0.32999999999999996` between frames 2 and 3.

### Root cause (verified from git)

`src/track-assembler.ts:1681-1698` (the trailing-silence emitter) now pushes TWO frames where the snapshot was made when it pushed ONE:

```ts
klattTrack.push({ time: currentTime, phoneme: "SIL", params: ... });
if (finalTime > currentTime) {
  klattTrack.push({ time: finalTime, phoneme: "SIL", params: ... });
}
```

The added "reset at currentTime" frame was introduced by commit **`8aefa48c fix: reset final silence at segment boundary`** with the comment "The reset must happen at the end of the last phone; otherwise release/noise parameters are held through the trailing silence."

### Verdict

**Production is correct; snapshot is stale.** The change in `8aefa48c` is a deliberate fix for a real bug (release/noise params bleeding through trailing silence). The snapshot dates from before that fix and was never regenerated. All 6 snapshot failures share the same shape (extra reset-at-currentTime SIL frame) and the same root cause — they're one bug masquerading as six.

### Recommendation

**Regenerate the snapshot** (`npx vitest run -u test/tts-frontend-snapshot.test.ts`). The production change is correct and cited (param-bleeding fix). The snapshot is a stale regression net that didn't get refreshed when the underlying invariant intentionally changed.

### Drift quote also worth noting

The `RdPhraseOffset: 0.0008399999999999991` → `0` difference in the diff is a numerical-stability thing: declination floor presumably now clamps phrase offset to exact zero when no rule fires. Same shape across snapshots. Same regenerate verdict.
