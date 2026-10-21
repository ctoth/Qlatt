# Goal
Preserve filesystem read failures after resolving an existing asset for #78.

# State
Implemented bounded slice from origin/master d9f7d4e4. Newer agent confirmed no overlap with the filesystem/YAML read blocks. Shared readers propagate resolved-file errors; a small YAML helper preserves E_YAML_READ with original cause and removes redundant existence probes. Existing fixtures exercise text and binary read failures on selected assets; absence/browser coverage remains unchanged.

# Decisions and why
Smallest change: about 10–20 production lines and 25–45 existing fixture lines. Stop converting readFileSync errors to null after resolution. Keep missing/non-Node results null; YAML retains E_YAML_READ and the original error as cause, without re-probing the path. Existing loader fixtures cover text and binary read failures.
This does not change URL/resource roots or schemas. existsSync probing still cannot distinguish every parent-directory access failure, so this is not full #78 acceptance.

# Surprises
None.

# Next step
Publish for hosted CI and independent Claude review; supervisor owns merge. No local CI run.
