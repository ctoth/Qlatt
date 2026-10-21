# Goal

Move Qlatt's speaker-profile and source-contour policies under their frontend
owner as a bounded #141 slice. Keep #141 open.

# State

Implemented from master 80d716d7 in an isolated worktree; PR #347 open.

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
remain historical. The full-path search missed a fixture constructing its path
from public/rules and policy/source-contour.yaml. Claude and CI shard 4 identified
the resulting ENOENT in test/lf-source-perturbation.test.ts108. The fixture's
relative path now names frontends/qlatt-english/policy/source-contour.yaml.
The earlier claim that no old references remained was too broad for that search.
The existing ownership test now checks Qlatt, Beauty's
inherited paths, and DECtalk's independent paths. No local tests ran because
this isolated worktree has no installed dependencies.

# Next step

Push the fixture correction as the Claude review response for replacement CI
and supervisor merge.
No local CI duplication; no dependency installation. Whole-closure resources
and the other ownership/implicit-load migrations remain under #141.
