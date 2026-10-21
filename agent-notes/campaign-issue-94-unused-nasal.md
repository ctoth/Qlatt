# Goal

Remove twelve unused nasal policy declarations as one bounded #94 cleanup: 53 deleted YAML lines plus this note.

# State

Isolated branch starts at f836e071. Exact-name searches across src, public, test and scripts find only the twelve declarations. Historical plan text is not a runtime consumer.

# Decisions and why

Delete pole_base_hz, pole_bw_hz, zero_bw_hz, place_bw_hz, murmur_fnz_m_hz, murmur_fnz_n_hz, murmur_fnz_ng_hz, b1_stage_1_fraction, b1_stage_2_fraction, b1_carryover_fraction, b1_carryover_tail_fraction and b1_addition_hz. Formant rules use inventory murmur targets and retained coupling/window parameters; synthesizer semantics independently owns its camelCase pole/bandwidth/place/B1 parameters. No runtime, inventory or semantics edits. No new tests or local CI for dead-data deletion; hosted checks own validation. #94 remains open.

# Surprises

None.

# Next step

The 53-line deletion is complete. Commit and publish for hosted CI and independent Claude review. Supervisor owns merge.
