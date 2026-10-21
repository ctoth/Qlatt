# Goal
Record #248's adopted portable package/resource/artifact contract and prepare targeted issue dispositions for supervisor review.

# State
PR #464 reviewed at dddc9dcb by Claude Opus 5.5, session 29e76a18-b378-40e9-94f0-17c30aa9e0fc; complete two-file range and source snapshot f4c406d0 checked. Implementer and supervisor verified the report against actual callers/data; response below. Hosted quality/native/Node and three test shards passed when responding; final CI pending. #460 owned cleanup complete. No runtime edits or local CI; dirty main files untouched.

# Decisions and why
- Smallest approved delivery: 220–280 lines normative documentation plus this task note and 25–45 lines of proposed issue dispositions. Review adds bounded migration clarifications. No loader, package manager, archive or new runtime.
- Q chose explicit supported frontend/backend pairs; DECtalk owns both existing backends with VTM default; discovery selects exact dependency versions; artifact formats version separately and required kernel capabilities are checked before execution.
- Cover seven synthesizer packages plus the adopted English language owner, three concrete package shapes, actual reference-bearing fields, compatibility/source identities and fixture owners. Clearly distinguish current code from adopted target.
- #227 owns the checked frontend expression representation. Existing dump-spec and CheckedPureExpression.expression strings are not a portable checked artifact.

# Surprises
Master advanced with #461 frontend catalogue extraction while research ran; source evidence must describe that latest implementation rather than the previous static frontend map.

# Next step
Push this review response; await supervisor final-delta verification and exact-head hosted CI. Hold issue additions until the supervisor merges the document and a merged link exists. Supervisor owns the gate and PR merge.

# Review response
- F1 accepted: current klsyn88 params lack actual qlatt output columns and no parent supplies them. Mark its proposed pairing as a target blocked by current vocabulary validation, assigned to #76/#254; do not claim working compatibility or relax validation.
- F2 accepted: graph metadata supports string/array registry references; current Qlatt preparation reads manifest inheritance and three documents rather than meta.primitives. Name the three cross-package graph paths as #251 migration inputs; preserve one resolved closure.
- F3 clarified, without optional default or a new selection prompt: #76 explicitly moves generic CLI/server defaults into the manifest. Retain an explicit compatible selection; defaults apply only when no backend is selected. Distinguish target baseline default from today's no-default harness helper. Supervisor independently checked this disposition.
- F4/F5 accepted: dependencies match the requesting manifest's dependsOn version; Stevens inherits baseline.
- F6 partially accepted: assign recorded resource-audit fixture updates to #141/#78. The report's prefetch-consumer description is stale: builder lines 10–11 identify async owner warmup, not resources.json fetching. No new priming mechanism.
- Review covered both PR files and actual source; it did not run tests or inspect Bacon internals. No unsupported machinery finding. Complete substantive report precedes the read-only review's Stop-hook note loop; no reviewer writes authorized.

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
DECtalk owns dectalk-english and dectalk-vtm backends; VTM is its default. Backend-only packages target explicit pairs with dependency-owned qlatt-english; current klsyn88 vocabulary and Stevens preparation failures must be resolved before those pairs are admitted. Neither id equality nor dependency presence alone establishes compatibility.
The merged global frontend catalogue reads entryPoint; per-package discovery and pairing migration remain. Remove remaining inferred/default-map selection in generic callers and reject unsupported explicit pairs before rendering.

## #74
### Adopted package catalogue disposition (2026-10-21)
The seven synthesizer packages remain qlatt-english (including klatt80-baseline), dectalk-english, qlatt-beauty, klsyn88, stevens91, laine88 and steinecke95. DECtalk contains both current backends, with dectalk-vtm default; test-inherit is still a core fixture.
The adopted English language owner is a dependency, not an eighth synthesizer. Linguistic resources belong there; acoustic targets/voice policy remain voice-owned, with DECtalk fidelity replacements retained.
docs/package-resource-contract.md supplies explicit dependency/pairing and artifact boundaries. #82 extraction follows those owners; native backend delivery does not wait for the frontend compiler or multilingual algorithms.
