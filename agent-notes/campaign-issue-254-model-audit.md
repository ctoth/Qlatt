# Goal

Deliver the bounded #254 model audit without changing model behavior or names.

# State

PR #446, isolated from master 77e6e8e3. Claude completed the full two-file review
of df9bd1d7; supervisor independently verifies the final delta and owns the gate.

# Decisions and why

Smallest delivery: one approximately 180–220-line report covering eight manifest
models and the inheritance fixture, with verified evidence and explicit unknowns.
No configuration, algorithm, package identity, or unsupported-control changes.
Scientific claims use visually read pages or actual reference implementation
functions; implementation comments alone do not establish published fidelity.
Keep #254 open: complete parameter/pairing adjudication remains outstanding.

# Surprises

Laine's four correction zeros do not alone establish four tract formants.
The current C reference's square source does not establish its introduction date.
DECtalk oracle assertions cover concrete fixtures, not every host-resampled output.

# Next step

Accepted review corrections: distinguish Laine's five-zero scaling evidence from
the four-zero variant; name Beauty output-stage gains; fix prose spacing and
the baseline, two-mass, DECtalk graph and symmetric-model source references.
Verified these against the page image and actual source before editing.
Claude session: 3faf954b-5c15-4797-87af-cda65dc0b838; no files edited by reviewer.
Supervisor correction: the vocabulary fixture asserts nonzero sample-difference
energy, not perceptual audibility. Narrowed the report after reading the test.
Initial head passed all seven checks; final hosted CI remains pending.
Commit response, then hand final head to supervisor for gate and merge.
