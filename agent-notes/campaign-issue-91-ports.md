# Issue 91: explain successful port selection

## Goal
Explain whether a successfully connected port was omitted, numeric or named, in the existing connection_resolved record.

## State
Implemented isolated slice from c7412517: ten production additions enrich existing successful connection reasons. Existing runtime fixture covers named/default ports and numeric AudioParam connection; real VTM fixture checks omitted graph output. No local CI. Newer agent's #252 is read-only planning and will preserve these runtime hunks.

## Decisions and why
Smallest change: 12–20 production lines and 10–20 existing fixture lines. Add a local description helper and enrich existing post-success reasons, including graph destination output. AudioParam destinations have no input-port selection. Preserve actual resolution, connection calls, failure handling and channels. Existing host-contract structural-port citation already covers default zero and named registry resolution. Full #91 remains open for broader ancestry and stage coverage.

## Surprises
Hosted shard job 119237715514 exposed another existing exact reason assertion in the AudioParam destination fixture. Updated its expected text for the now-explained omitted source port; actual connect and record-count assertions remain unchanged.

## Review response
Claude completed two passes over the full four-file c7412517...167a83fb range with no findings; accepted. Transcript 4da64aa9-fde2-4461-9c64-bc11f3660a80, exec 86262. Source-only review, no local execution. Reviewer did not locate getAudioParam; follow-up source inspection finds the import at runtime line 8 and definition in audio-param-utils.ts:21, which reads the direct gain property for the existing fixture. No behavior correction needed.

## Next step
PR 440 is published; await final-head hosted CI and root verification/merge. Root owns the review ledger.
