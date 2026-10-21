# Goal
Preserve filesystem read failures after resolving an existing asset for #78.

# State
Implemented bounded slice from origin/master d9f7d4e4. Newer agent confirmed no overlap with the filesystem/YAML read blocks. Shared readers propagate resolved-file errors; a small YAML helper preserves E_YAML_READ with original cause and removes redundant existence probes. Existing fixtures exercise text and binary read failures on selected assets; absence/browser coverage remains unchanged.
Claude reviewed the full five-file range through 90f64081 in session ebacf338-8f88-4d72-b588-834d07c0613f; two passes converged. Accepted the verified finding that the existing sync/async inheritance fixture still expected the old E_YAML_READ wording. Updated that assertion to the new contextual message and checked that the underlying read error remains attached. The fixture still requires failure rather than fallback to the base include. No other defects reported; review gate completed before relaying the finding.

# Decisions and why
Smallest change: about 10–20 production lines and 25–45 existing fixture lines. Stop converting readFileSync errors to null after resolution. Keep missing/non-Node results null; YAML retains E_YAML_READ and the original error as cause, without re-probing the path. Existing loader fixtures cover text and binary read failures.
This does not change URL/resource roots or schemas. existsSync probing still cannot distinguish every parent-directory access failure, so this is not full #78 acceptance.

# Surprises
Initial quality job 119195265260 requested only the F0 fixture's Object.assign object reflow. Applied the exact formatting correction; the unrelated approximate-constant warning was not an error and is unchanged.

# Next step
Await final-head hosted CI and supervisor verification of the review response; supervisor owns merge. No local CI run.
