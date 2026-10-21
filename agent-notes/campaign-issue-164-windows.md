# Goal

Report surviving shortened authored control windows for the next bounded #164 slice. Preserve output and existing empty-window reporting.

# State

Authorized branch campaign/issue-164-windows from origin/master 9d265a59. Smallest planned change: 35–55 production lines retaining requested intervals and emitting one warning per affected authored window, plus 60–90 lines in the existing control-window tests. Implemented. `npx vitest run test/hrg-lowering-control-windows.test.ts` passed. No local CI suite run.

# Decisions and why

- `resolveWindowSpan` clips prefix/suffix and explicit/ratio bounds; the caller currently reports only absent targets or empty spans.
- Real producers include DECtalk structural.yaml suffix windows at line403 and next-target onset windows at462–466. Their existing producing feature write supplies citations and decision identity.
- Compare original requested and applied surviving intervals once at construction. Include source/target identity, window index/tag, fields and write provenance. No per-frame reporting or new framework.
- Empty/dropped windows retain their existing event. Contour, carry-over, and output-time projection remain outside this slice; #164 stays open.

# Surprises

None.

# Next step

Push for hosted CI and supervisor Claude review. Prefix/suffix/explicit/ratio clipped cases match normalized intact output, warn once with write provenance, and retain initial-silence and empty-window behavior.
