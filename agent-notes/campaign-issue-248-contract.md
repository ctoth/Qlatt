# Goal
Record #248's adopted portable package/resource/artifact contract and prepare targeted issue dispositions for supervisor review.

# State
Fresh isolated branch advanced to merged master f4c406d0 before drafting. #460's owned clean worktree/local/remote branches removed. Supervisor read the complete draft and independently verified its source claims; preparing the documentation PR and full Claude review. No runtime edits or local CI. Main's dirty host-contract.md and other agents' files remain untouched.

# Decisions and why
- Smallest approved delivery:220–280 lines normative documentation plus this task note and25–45 lines of proposed issue dispositions. No loader, package manager, archive or new runtime.
- Q chose explicit supported frontend/backend pairs; DECtalk owns both existing backends with VTM default; discovery selects exact dependency versions; artifact formats version separately and required kernel capabilities are checked before execution.
- Cover seven synthesizer packages plus the adopted English language owner, three concrete package shapes, actual reference-bearing fields, compatibility/source identities and fixture owners. Clearly distinguish current code from adopted target.
- #227 owns the checked frontend expression representation. Existing dump-spec and CheckedPureExpression.expression strings are not a portable checked artifact.

# Surprises
Master advanced with #461 frontend catalogue extraction while research ran; source evidence must describe that latest implementation rather than the previous static frontend map.

# Next step
Publish the bounded contract, obtain full Claude review and respond. Supervisor accepted the proposed issue additions subject to final document review and merge; hold their publication until a merged document link exists. Supervisor owns PR merge.

# Proposed issue-body additions (not published)
Append these exact bounded dispositions after supervisor verification; preserve historical evidence and existing implementation acceptance.

## #248
### Adopted package/compatibility disposition (2026-10-21)
Q selected explicit supported frontend/backend pairs; DECtalk is one package with both existing backends and VTM default. Discovery supplies exact selected dependency versions. Artifact formats version separately from packages and required kernel capabilities are checked before execution.
The normative contract is docs/package-resource-contract.md: manifest fields, declaring-document URLs, logical resource/source identities, separate backend/frontend envelopes, seven synthesizers plus the language owner, and fixture assignments.
#227 still owns the actual checked frontend expression encoding with #241. Current raw dump-spec JSON and string expressions are not that artifact. No runtime/distribution implementation is claimed by this disposition.

## #76
### Adopted pairing and dependency representation (2026-10-21)
Use docs/package-resource-contract.md in place of the earlier single-experiment manifest sketch. Manifests list owned frontends/backends, exact selected dependencies, explicit supported endpoint pairs and a frontend-owned default backend.
DECtalk owns dectalk-english and dectalk-vtm backends; VTM is its default. Backend-only packages explicitly pair with the dependency-owned qlatt-english frontend. Neither id equality nor dependency presence alone establishes compatibility.
The merged global frontend catalogue reads entryPoint; per-package discovery and pairing migration remain. Remove remaining inferred/default-map selection in generic callers and reject unsupported explicit pairs before rendering.

## #74
### Adopted package catalogue disposition (2026-10-21)
The seven synthesizer packages remain qlatt-english (including klatt80-baseline), dectalk-english, qlatt-beauty, klsyn88, stevens91, laine88 and steinecke95. DECtalk contains both current backends, with dectalk-vtm default; test-inherit is still a core fixture.
The adopted English language owner is a dependency, not an eighth synthesizer. Linguistic resources belong there; acoustic targets/voice policy remain voice-owned, with DECtalk fidelity replacements retained.
docs/package-resource-contract.md supplies explicit dependency/pairing and artifact boundaries. #82 extraction follows those owners; native backend delivery does not wait for the frontend compiler or multilingual algorithms.
