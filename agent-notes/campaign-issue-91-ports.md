# Issue 91: explain successful port selection

## Goal
Explain whether a successfully connected port was omitted, numeric or named, in the existing connection_resolved record.

## State
Implemented isolated slice from c7412517: ten production additions enrich existing successful connection reasons. Existing runtime fixture covers named/default ports and numeric AudioParam connection; real VTM fixture checks omitted graph output. No local CI. Newer agent's #252 is read-only planning and will preserve these runtime hunks.

## Decisions and why
Smallest change: 12–20 production lines and 10–20 existing fixture lines. Add a local description helper and enrich existing post-success reasons, including graph destination output. AudioParam destinations have no input-port selection. Preserve actual resolution, connection calls, failure handling and channels. Existing host-contract structural-port citation already covers default zero and named registry resolution. Full #91 remains open for broader ancestry and stage coverage.

## Surprises
None.

## Next step
Publish for hosted CI and Claude review. Root owns ledger and merge.
