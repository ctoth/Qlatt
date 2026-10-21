# Goal

Correct five stale implementation-status entries in the historical frontend rule note for #73.

# State

Supervisor authorized this documentation-only slice after checking the definitions and pipeline execution entries. Base: bebefe35.

# Decisions and why

Smallest change: approximately 15–22 documentation lines, adding five current implementation mappings with source links and removing those entries from the historical proposals. Preserve the dated batch and test snapshot; explicitly mark the other eight proposals as unaudited rather than asserting their current absence.

Verified owners are postlexical `t_flapping` and `t_glottalization`, duration `polysyllabic_shortening`, prosody `accent_index_in_phrase` and `tobi_accent`, and formant `vcv_coarticulation`. The selected frontend imports each phase and its pipeline lists these rules. No paper interpretation, runtime change, test, or local CI run is needed.

# Surprises

The original flap proposal described changing closure/release parameters; the actual rule replaces T with DX. Downstep and DAC scaling are implemented within differently named rules.

# Next step

Publish the scoped PR for independent Claude review and hosted CI. Respond to review; supervisor owns merge and #73 bookkeeping.
