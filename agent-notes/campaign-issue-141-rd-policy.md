# Goal

Remove Rd policy import-time acquisition as a bounded #141 slice.

# State

Implemented from master 493acb97 in an isolated worktree; preparing PR.

# Decisions and why

Estimate 65–100 production lines plus 40–70 focused test lines: declare the
already-adopted resources.vq_channels role for Qlatt, parse effective_rd through
existing requireAsset/cache/readRdPolicy, and pass RdPolicy to both projection
callers. Beauty inherits; DECtalk does not declare this optional role. Require
it only when a nonzero Rd delta consumes it, with named frontend/role errors.
Keep neutral/nonconsuming requests valid. Preserve arithmetic and diagnostics.
The standalone track adapter receives explicit frontend identity and optional
Rd policy; lowering uses its existing context. No alias, cache, protocol, or
new validator. Broader VQ globals and affect-library ownership remain partial.

# Surprises

Existing Rd tests now inject parsed bounds directly rather than replacing the
global YAML loader. Added existing-file coverage for inherited resources,
absent roles, neutral standalone projection, and custom bounds/missing roles
at the real HRG Rd projection branch. No local tests ran: this worktree has no
installed dependencies. Another agent owns transition defaults; those lines
remain unchanged. VQ channels/affect presets still retain their global loads.

# Next step

Push for hosted CI, Claude review,
implementer response, then supervisor merge. Keep #141 open. No local CI
duplication or dependency installation.
