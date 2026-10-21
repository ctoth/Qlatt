# Goal

Correct the unused-policy diagnostic's claim with one production line: report no reference in analyzed expressions, rather than no use anywhere.

# State

The analyzer collects policy paths from analyzed expressions. Host reads outside that surface include rate.default, rate.undershoot_coefficient, rate.f0_range_exponent, rate.transition_scale_exponent and words_per_minute unit/minimum/maximum/ported_minimum/ported_maximum in tts-frontend.ts. These are real consumers despite missing expression references.

# Decisions and why

Preserve W_POLICY_PARAM_UNUSED, severity and detection. Beauty also inherits effort accent_db/phrase_fall_db/stress_tilt_reduction_db and source_contour.rd_final_offset that its selected rule variants do not read, while Qlatt's base prosody rules do. Those declarations must not be deleted globally. This wording change removes no warning and makes no fresh diagnostic-count claim. No new interface, suppression, scanner or tests; no local CI. #94 remains open for strict classification.

# Surprises

None.

# Next step

One-line correction complete. Commit/publish for hosted CI and Claude review. Supervisor owns merge.
