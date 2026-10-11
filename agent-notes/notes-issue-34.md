Issue #34 requires declarative conversion-domain constants, bin-count validation, host documentation, and byte-identical golden renders.
Authoritative issue is open; no existing issue-34 branch or PR was found.
Created isolated worktree C:\Users\Q\code\Qlatt-issue-34 at origin/master 4fed574909f27e276519209da216861509b0c793.
Main checkout has extensive pre-existing tracked changes and remains untouched by issue implementation.
Next: inspect semantics loading/tests, add a failing regression, then implement the smallest scoped repair.

Focused regression now fails because conversion functions ignore YAML domain constants and mismatched ndbCor bins are accepted.
Dependencies were restored from the unchanged lockfile in the isolated worktree.
src/builtin-functions.ts now reads all seven constants and validates ndbCor length at module load.
The baseline semantics edit currently has ndbCor domain values and klsynAmpScale; no blocker is active.
Next: add the dB constants, mirror standalone semantics data as needed, update host docs, and turn the focused test green.

Candidate bcf7f66d contains the five scoped issue files; focused tests, core typecheck, and golden gate passed.
The complete Vitest run reached 124 passing files but failed because required WASM artifacts were absent.
That run also showed one runtime-output-level failure, which is not interpretable until the WASM prerequisite is repaired.
Rule 0 is active for the missed generated-artifact preflight; no publication has occurred.
Next: strengthen the global preflight guard, build and verify WASM artifacts, then rerun the exact candidate gate once.

Global guidance now requires a standalone expected-artifact inventory immediately before generated-artifact test gates.
All 18 target WASM artifacts were built and verified; unrelated public binary rewrites were restored.
The repaired full suite reached 125 passing files and one runtime-output-level failure.
The exact parent commit reproduces that failure with the identical 1.9502713680267334 peak, proving it is baseline.
Next: rebase the scoped commit onto current master fcfc71b5, rerun focused gates, publish, and follow exact-head CI.

PR #103 was published at exact head 7752ea42 with the five scoped files and closing phrase for #34.
The repository exposes no pull-request CI; Q explicitly authorized merging despite that absence.
The first resumed verification wrapper was malformed before execution, triggering Rule 0.
Global guidance now requires syntactic inspection and the canonical complete functions.exec wrapper; the intended skill path check succeeded.
Next: reread issue-delivery instructions, refresh PR evidence, merge normally, and verify the two-parent merge plus issue closure.
