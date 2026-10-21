# Goal

Move Qlatt's VQ and affect resources to their declared frontend owner for #141.

# State

Implemented from ea238464 after #361 merged. Preparing PR; no local CI run.
Both moved files retain their original Git blob IDs and filesystem SHA-256
hashes. Declarations, sorted manifests and existing fixtures use the new paths.

# Decisions and why

Smallest change: two byte-identical YAML moves into qlatt-english/policy, two
resource declarations, English/Beauty manifest entries and approximately 30–60
reference lines in existing fixtures. No algorithm, schema or loader changes.
The adopted docs/frontend-model-decisions.md ownership boundary assigns source,
VQ and acoustic policy to voices. Beauty inherits these Qlatt resources;
DECtalk's absent roles remain absent. Existing resolved resources will supply
fixtures where their current context supports it. Historical notes stay intact.

# Surprises

No executable core path loads or current documentation references needed edits.
Fixture changes use resolved resources where the selected frontend was already
available; parser-only fixtures retain explicit documents at the new paths.
Reference changes total roughly 60 added lines, including ordinary wrapping of
the longer paths and existing fixture setup, plus the two unchanged data moves.

# Next step

Commit/push a PR for hosted CI and Claude review. #141 remains open.
