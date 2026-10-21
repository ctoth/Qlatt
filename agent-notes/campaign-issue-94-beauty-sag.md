# Goal

Remove Beauty's unused sag_depth_fraction declaration for partial #94 cleanup. Smallest change: about 15 lines of declaration/comment/test references; no scientific rule changes.

# State

Fresh isolated branch after PR359 merge. Exact-name source search finds only the declaration and existing inheritance test. Beauty's live question_rise_fraction supplies its question-rise targets; final_lowering_pull remains independently active.

# Decisions and why

Delete the unused sag block and summary wording. Preserve the inheritance test's child-only/base-absent control by using the already asserted live question-rise leaf. No new tests or local CI. Inherited Beauty-only warnings for parameters still used by base rules remain outside this deletion.

# Surprises

Hosted quality job119068857665 rejected the changed assertion's line formatting. Applied its exact three-line formatter output; no behavior change or local CI rerun.

# Next step

Scoped edits and hosted formatter correction complete. No local tests or CI steps run. Push correction for replacement hosted CI and Claude review. Supervisor owns merge; #94 remains open.
