# Goal

Deliver the source-contour parse-only slice of #141. Keep #141 open.

# State

Implemented from master 9d265a59 in an isolated worktree; preparing PR.
Production change adds 61 lines and removes 49, with callers/tests migrated.

# Decisions and why

The smallest change exports the existing parser, requires an explicit spec,
and removes the consumer's default path, loaders, and private cache. Estimated
50–80 production additions and about 30 removals, plus existing callers/tests.
FrontendResources owns optional source-contour path/spec using its existing
asset cache. A narrow async acquisition function in that same module preserves
the browser vocabulary check's async loading; synchronous synthesis reuses it.
Missing optional resources remain allowed until a consumer requires them.
TTS provenance cites the declaring path. All contour arithmetic stays unchanged.
No generic resolver, extra cache, or schema/URL contract is introduced.

# Surprises

Browser warmup primes text; vocabulary checks already acquire contour
asynchronously, so replacing that call with the synchronous resources loader
would change the acquisition boundary. The projection mismatch fixture now uses
its own declared path, since parsed resources are intentionally cached by path.
The focused test exercises fetch acquisition with Node detection disabled and
rejects synchronous YAML acquisition during subsequent resource assembly.
Missing-contour coverage checks both TTS and vocabulary consumers. Existing
numeric, projection, and actual declaring-path provenance assertions remain.

# Next step

Push a PR for hosted CI and
Claude review, then respond to the review. No local CI duplication. Whole-closure
resource assembly and remaining implicit resource consumers remain under #141.
No local tests were run: this isolated worktree has no installed dependencies.
