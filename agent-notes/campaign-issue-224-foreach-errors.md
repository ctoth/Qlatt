# Goal

Attach authored locations to the existing E_FOREACH_INVALID parser errors. Estimate: 55–80 production and 45–65 existing fixture lines. Preserve messages and causes, using typed paths and the current composed source index.

# State

Started from PR427 e7eff270; prerequisite merged as 7fe84a77 and this PR now targets master. Implemented typed foreach error paths, rule-name prefixing, and exact loader location suffixes. Existing sync/async fixtures cover all five throws and missing-template absence, with a preceding directive that expands twice to distinguish authored and expanded positions. Private Claude review returned for the full four-file range at 4589a51e in conversation d492cef6-9384-4c11-b21f-9c9f936e6d45. Implementer response: dependency status verified against GitHub and corrected here; no production changes. Supervisor owns the review ledger/gate. No local CI; final-head hosted validation pending.

# Decisions and why

Only foreach's five existing throws carry paths. The expansion already knows authored array/input positions, and the rule boundary knows the rule name. The loader performs the exact source lookup. Missing template nodes have no invented location. for_each_field, generic parser failures, and runtime records remain outside this slice.

# Surprises

Hosted quality job119194476274 requested one fixture lookup wrapping correction; applied exactly. No local CI or unrelated existing-data warning change.

Other agents own normalization moves and resources; preserve their work.

# Next step

Review response is complete. Await supervisor review gate, final-head hosted CI, and supervisor merge. Keep #224 open.
