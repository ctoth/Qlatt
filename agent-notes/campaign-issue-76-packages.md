# Goal
Replace both bundled frontend/backend catalogues with adopted per-package manifests and one discovery owner for #76; enforce explicit supported pairs without weakening vocabulary checks.

# State
Implemented in the isolated branch after #467 merged as 6a39902f. Its clean owned worktree/local/remote branch was removed. Preparing the PR; no local CI was run.

# Decisions and why
- Smallest approved coherent delivery: 400–550 production lines with 80–120 removals, 210–300 manifest data lines and 150–230 existing fixture lines. Replace both authoritative catalogues rather than adding a pairing overlay.
- One bundled selection index and manifests for seven synthesizers, the English resource owner and core test-inherit fixture owner. Use the existing project release identity, not the contract's illustrative version.
- Reuse existing source acquisition and sync priming; no second cache/parser registry, artifact implementation or generic resolver framework. Shared physical public base is transitional placement, not extraction or portable-origin completion.
- Validate exact selected dependencies, endpoint ownership, explicit supported/default pairs. Existing string-ID adapters reject ambiguity. Backend-only inspection remains legal; klsyn88/Stevens pairs remain unadmitted and their existing validation behavior remains available.
- Manifest-declared missing documents fail; omitted inherited documents inherit. Existing merge algorithms, source labels and vocabulary validation remain. Pair enforcement covers fresh render loads and cached harness selection.
- Preserve explicit backend selection and report unsupported pairing rather than silently choosing a different backend. #78 nested URL/resource identity, #251 graph metadata reconciliation and artifact consumers retain their separate ownership.
- Preserve resource-recorder boundaries while migrating raw catalogue readers and audit fixtures. Other agents are active; stage only owned files.

# Surprises
The selected index plus nine package manifests occupy 374 data lines rather than the estimated 210–300, because exact endpoint/dependency records and existing display descriptions are explicit. Reported to supervisor; no added mechanism. Versions use package.json's current 0.1.0 identity, not a claim of a published release. Index baseUrl values resolve to absolute discovered directories; all current packages deliberately share the public base.

The existing harness fixture now expects E_SYNTH_PAIRING when an explicit DECtalk backend remains selected after switching to Qlatt. The real renderer rejects the same unsupported pair before synthesis; direct vocabulary fixtures still exercise E_FRONTEND_VOCABULARY. Existing backend-only model preparation coverage remains, including the exact Stevens invalid-reference rejection.

The recorder's own voice discovery now occurs before recording starts, so moving its catalogue reads onto the shared owner does not count script setup as frontend activity. Synchronous frontend resolution itself reads the selected index/manifests; the three audit manifests reflect that closure.

# Next step
Publish for hosted CI and full Claude review, respond to actual findings, and send the exact final head for supervisor verification/merge. Keep #76 open until its acceptance is checked; nested URL ownership, portable identities, graph metadata reconciliation and artifacts remain separately owned.
