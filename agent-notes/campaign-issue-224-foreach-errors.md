# Goal

Attach authored locations to the existing E_FOREACH_INVALID parser errors. Estimate: 55–80 production and 45–65 existing fixture lines. Preserve messages and causes, using typed paths and the current composed source index.

# State

Started from PR427 e7eff270; prerequisite remains open and its d230a5f0 fixture-role correction is carried here too. Implemented typed foreach error paths, rule-name prefixing, and exact loader location suffixes. Existing sync/async fixtures cover all five throws and missing-template absence, with a preceding directive that expands twice to distinguish authored and expanded positions. No local CI; hosted validation pending.

# Decisions and why

Only foreach's five existing throws carry paths. The expansion already knows authored array/input positions, and the rule boundary knows the rule name. The loader performs the exact source lookup. Missing template nodes have no invented location. for_each_field, generic parser failures, and runtime records remain outside this slice.

# Surprises

Hosted quality job119194476274 requested one fixture lookup wrapping correction; applied exactly. No local CI or unrelated existing-data warning change.

Other agents own normalization moves and resources; preserve their work.

# Next step

Await hosted CI and Claude review after prerequisite #427 merges, respond, then supervisor merges. Keep #224 open.
