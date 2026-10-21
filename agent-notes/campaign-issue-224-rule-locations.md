# Goal

Locate direct authored rule errors before validation throws, preserving rule source locations through existing inheritance and includes. Smallest slice: about 110–160 production lines and 70–100 existing-test lines. Indexed effects/foreach, macro-body ancestry and explain decision joins remain outside this slice.

# State

Started from origin/master a54237ac8bddcc459997887e88b0c16aa20109df. Implemented direct rule span transport through root inheritance, include cloning and phased shadow-rule inheritance. Both loaders pass parameter and rule spans to prethrow validation enrichment. Existing warning formatting remains unchanged. Added sync/async root/include error coverage, inherited/child/omitted source assertions and ambiguous/programmatic omission coverage in existing test files.

# Decisions and why

Reuse YamlNodeSpans and existing merge semantics. Carry direct non-indexed rule locations through includes, child/base root merges and deferred shadow-rule inheritance. Enrich before assertValidSpec formats errors; preserve policy warning locations. Unknown authored keys use key positions; direct expression errors use the authored expression value position. No source guess for an absent field, ambiguous path or indexed expanded effect. Macro call sites can retain their authored location; body-parent ancestry remains pending.

# Surprises
Retained the original E_CEL_INVALID value selection as an OR with direct semantic expression paths: non-indexed insert_point.value/when syntax errors remain covered. Hosted quality job 119110270546 reported conditional and assertion wrapping; the restored condition requires multiline wrapping again, and the assertion now follows the reported format. No local CI run.
Claude identified that selecting expression values only for E_CEL_INVALID left semantic expression errors at the key. Corrected classification to the actual direct select.where, constraint and define paths (including non-indexed condition expr/not), retaining key locations for unknown fields. Extended the existing composition fixture with the established current.phonem semantic error at constraint.expr. The earlier head passed all seven hosted checks; the correction requires replacement CI.
Hosted quality job 119107086835 rejected formatting in the validation import/conditional and two test assertions. Applied its exact wrapping corrections; no behavior change or local CI run.

Real foreach directives in the base formant rules shift effect indices, so indexed origins must not be matched naively. Other agents are active; preserve their work.

# Next step

Publish for hosted CI and Claude review. No local CI or tests run; hosted CI owns validation. #224 remains open for indexed expansion, macro ancestry and remaining consumers.
