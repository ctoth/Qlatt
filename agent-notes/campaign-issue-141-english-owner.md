# Goal

Move six shared English linguistic documents under public/rules/languages/english
using existing frontend resource declarations (#141).

# State

Isolated branch from origin/master f8437836. Implementation complete; source and
data identity inspected. Initial hosted CI found one stale report hash; corrected
below. Claude completed its full review with no defects; accepted. Supervisor
independently checked the original diff. Replacement hosted CI remains pending.
No local CI.
Changes outside this note: six renames, 80 additions / 78 removals in declarations,
scripts, existing fixtures and current documentation. No runtime source changes.

# Decisions and why

Smallest scope: six data moves and 100–170 reference/adapter/documentation lines;
zero runtime algorithm changes. Preserve data bytes except the morphology/stress
phonotactics references. Update both browser resource manifests, declarations and
actual script/test readers. Scripts select declared references; the dictionary
builder reads raw frontend YAML only so a missing output remains rebuildable.
Preserve raw-source auditing and historical oracle provenance. No new resolver,
cache, manifest or package identity. Physical paths change; #248 stable identity
and the rest of #141's closure/language work remain unfinished. Preserve others.

# Surprises

The word-keyed rule audit constructs frontendDir/lts-rules.yaml rather than naming
the full old path, so it needs the selected authored LTS resource reference.
The audit still reads raw YAML without compiling rules and scans YAML LTS only;
DECtalk compiled JSON is not input to that source-line audit. The builder reads
only raw frontend YAML, never the lexicon it generates. Historical oracle fixture
provenance remains unchanged; new exports describe their selected declarations.
Four old/new Git blobs match: CMU 380a520eb8c129b2afa44b36690986edabf5f64f,
LTS 283207e374f8a2e30a5c957e3ba555321ee34d51,
phonology b65b5ae01a2093bef9faaccd8ef4a1538013aa13,
phonotactics d9e4cc8735c84ffae967e5ab7a2eb3b4e520b8f4.
The other two rename diffs change only their phonotactics_path line. apply_patch
requires a nonempty move hunk; the one-line dictionary was moved with a temporary
leading blank line and that line immediately removed, yielding the matching blob.
Initial shard 2 job119176496351 failed the existing area-formant report equality:
the inventory's moved phonology reference changes its normalized-text SHA-256.
I missed this derived metadata reference. The producer hashes the whole inventory
text; its unchanged generated-value assertion passed. Updated only the comparison
report's inventory hash to e64a2d728ce664cd975bd633228a4ffdcef745906a365ef90423eb9dbfb032b5,
verified independently using the producer's CRLF normalization. No metrics or
test expectations were weakened.

# Next step

Respond to hosted CI and Claude findings. Supervisor owns merge; #141 stays open.
