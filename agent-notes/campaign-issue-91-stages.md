# Goal
Deliver #91's bounded phase-stage and compact CLI event cleanup.

# State
Implemented transaction stage inference, compact overwrite selection, and dead summary counter removal. Existing transaction/CLI fixtures cover default/explicit stages, real annotation/prosody rules, strict citations, replay, and compact output. Isolated branch based on #412 final c9b0f79d, whose merge is pending.

# Decisions and why
Smallest scope: about 10–16 production additions and 17 deletions plus 35–55 existing test lines. Existing transaction metadata owns phase and optional stage. Infer prosody only for annotation/prosody transactions lacking an explicit stage; retain the current rules default for everything else and preserve explicit overrides. This classifies the whole annotation phase, including syllable/cluster annotation, rather than inventing per-rule semantics.
Compact output should prioritize actual rules/prosody feature_overwrite events and the existing fallback pronunciation event. Remove the summary's dead rule_rewrite_applied parser/output; existing byStage/topTypes remain. No new schema, collector, rule join, or broad realization/runtime chain.

# Surprises
None. Normalization vocabulary events explicitly stamped rules remain unchanged.

# Next step
Publish with accurate dependency and await hosted CI/Claude review. No local CI or test commands run.
