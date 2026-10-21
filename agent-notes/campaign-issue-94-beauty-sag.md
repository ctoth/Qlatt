# Goal

Remove Beauty's unused sag_depth_fraction declaration for partial #94 cleanup. Smallest change: about 15 lines of declaration/comment/test references; no scientific rule changes.

# State

Fresh isolated branch after PR359 merge. Exact-name source search finds only the declaration and existing inheritance test. Beauty's live question_rise_fraction supplies its question-rise targets; final_lowering_pull remains independently active.

# Decisions and why

Delete the unused sag block and summary wording. Preserve the inheritance test's child-only/base-absent control by using the already asserted live question-rise leaf. No new tests or local CI. Inherited Beauty-only warnings for parameters still used by base rules remain outside this deletion.

# Surprises

None.

# Next step

Scoped edits complete. No local tests or CI steps run. Commit/publish for hosted CI and Claude review. Supervisor owns merge; #94 remains open.
