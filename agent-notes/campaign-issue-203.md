# Issue 203: formant-bank constraint audit

## Goal
Deliver the source-only naming-constraint audit requested by #203; leave #46 open.

## State
Source inspected at 5e3f34b6ad4af5b7a1beaf6340869052a28b92db in an isolated worktree.
Audit written in docs/formant-bank-constraint.md, with generated-name, preflight,
direct-caller, authored-consumer and interpreter/analysis evidence.
Smallest change: approximately 100 lines of documentation tracing generated names,
consumers and existing rejection behavior. No implementation or tests change.
PR: https://github.com/ctoth/Qlatt/pull/324. Claude review completed and its gate
passed. Accepted the four citation-range corrections verified by the supervisor:
klsyn88 nodes, count-gated frequency rule, parameter entries and extra edges.
Those ranges now include the complete referenced blocks; the recommendation is unchanged.

## Decisions and why
Recommend retaining/documenting the check: bank names do not enter generated names,
and current preflight separately rejects repeated generated node IDs. The check is
a compiler namespace constraint, not evidence for an acoustic one-bank limit.
No new namespace or multi-bank migration is justified by this audit's scope.

## Surprises
Removing cardinality validation alone would still reject overlapping indices in
preflight; it would not silently overwrite them in the current implementation.
Absent macro data is accepted, while a present empty bank map is rejected.

## Next step
Push the review response, then await supervisor's final review and current-head CI.
Use PR CI; no local CI steps or new tests for this documentation-only delivery.
