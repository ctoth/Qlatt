# Goal

Move Qlatt's speaker-profile and source-contour policies under their frontend
owner as a bounded #141 slice. Keep #141 open.

# State

Implemented from master 80d716d7 in an isolated worktree; preparing PR.

# Decisions and why

Smallest change: two byte-identical file moves, declarations and sorted manifest
references, direct test readers and current explanatory references. Roughly
40–65 changed path/test lines plus moves. Beauty inherits the Qlatt policies;
DECtalk retains its independent profile and contour. No runtime logic, resource
schema, validator, cache, or URL contract change.
Update the existing policy-paths test for these two roles only. Existing cold
resource-manifest and numeric/golden coverage validate the declared resources.

# Surprises

Both moved Git blobs match their originals: speaker-profile
2a3b675ff14207645a62db192dce52d1b053ff50 and source-contour
091ea149fd2408c2ad262c1bed90f1baa328b057. Historical plans and task notes
remain historical. No old policy paths remain in current src/scripts/test/
public/hosts references. The existing ownership test now checks Qlatt, Beauty's
inherited paths, and DECtalk's independent paths. No local tests ran because
this isolated worktree has no installed dependencies.

# Next step

Commit and push for hosted CI and Claude review, then respond to the review.
No local CI duplication; no dependency installation. Whole-closure resources
and the other ownership/implicit-load migrations remain under #141.
