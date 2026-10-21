# Recorded rule coverage

Corpus: test/phrase-sets/linguistic.json; SHA-256: 0c07b56db0777f688246d8aa8fd82ead1485081eacaca4f6cc86ffc98f789b13; phrases: 20/20; base F0: 110.

Regenerate with `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/rule-coverage.ts` (optional --corpus, --frontend, --limit).

Counts are recorded RuleAttempt outcomes, including normalization and orthography. Frame rules record firing units only: one record per rule per unit that fired, not individual frames; their attempts and failure counts are unavailable. Zero firings means not observed in this corpus, not unreachable. Unscheduled means absent from the declared phase lists. No static linter conclusions are inferred.

Recognition is reported separately from actual provenance outcomes. A disabled rule or a pattern with no match emits no candidate record; zeros are not a count of failed attempts.

## dectalk-english

Compiled rulepack SHA-256: 6e8cedfe8e37fbbe9d28689bcb46d3e98fc842886ed6cbf81cfd68a7afea558f.

| Phase | Rule | Fires / firing units | Recorded attempts | Most common failure |
| --- | --- | ---: | ---: | --- |
| articulation | artic_affricate_speed | 7 units | unavailable | unavailable |
| articulation | artic_before_voiceless_sonorant | 1 units | unavailable | unavailable |
| articulation | artic_blade_case | 493 units | unavailable | unavailable |
| articulation | artic_blade_closing | 134 units | unavailable | unavailable |
| articulation | artic_blade_closure_building | 43 units | unavailable | unavailable |
| articulation | artic_blade_closure_over | 41 units | unavailable | unavailable |
| articulation | artic_blade_limit | 0 units | unavailable | unavailable |
| articulation | artic_blade_moving | 210 units | unavailable | unavailable |
| articulation | artic_blade_release_after_burst | 60 units | unavailable | unavailable |
| articulation | artic_blade_release_without_burst | 0 units | unavailable | unavailable |
| articulation | artic_burst_marker | 493 units | unavailable | unavailable |
| articulation | artic_burst_obstruent_blade | 43 units | unavailable | unavailable |
| articulation | artic_burst_obstruent_labial | 33 units | unavailable | unavailable |
| articulation | artic_burstless_stop_blade | 20 units | unavailable | unavailable |
| articulation | artic_burstless_stop_blade_area | 20 units | unavailable | unavailable |
| articulation | artic_burstless_stop_labial | 10 units | unavailable | unavailable |
| articulation | artic_burstless_stop_labial_area | 10 units | unavailable | unavailable |
| articulation | artic_burstless_stop_velar | 2 units | unavailable | unavailable |
| articulation | artic_burstless_stop_velar_area | 2 units | unavailable | unavailable |
| articulation | artic_chink_area | 493 units | unavailable | unavailable |
| articulation | artic_chink_closed_in_non_obstruent | 245 units | unavailable | unavailable |
| articulation | artic_chink_closes_after_voiced_obstruent | 79 units | unavailable | unavailable |
| articulation | artic_closure_end | 493 units | unavailable | unavailable |
| articulation | artic_dc_out | 446 units | unavailable | unavailable |
| articulation | artic_dc_starts | 151 units | unavailable | unavailable |
| articulation | artic_dc_step_voiced | 226 units | unavailable | unavailable |
| articulation | artic_dc_step_voiceless | 119 units | unavailable | unavailable |
| articulation | artic_dental_closed | 12 units | unavailable | unavailable |
| articulation | artic_dental_opening | 12 units | unavailable | unavailable |
| articulation | artic_dummy_vowel_glottis | 12 units | unavailable | unavailable |
| articulation | artic_emphasis_pulse | 0 units | unavailable | unavailable |
| articulation | artic_end_of_clause_spread | 60 units | unavailable | unavailable |
| articulation | artic_fall_inputs | 165 units | unavailable | unavailable |
| articulation | artic_flap_closing | 2 units | unavailable | unavailable |
| articulation | artic_flap_opening | 2 units | unavailable | unavailable |
| articulation | artic_frication_code_by_place | 462 units | unavailable | unavailable |
| articulation | artic_frication_code_carried | 155 units | unavailable | unavailable |
| articulation | artic_frication_code_glide | 10 units | unavailable | unavailable |
| articulation | artic_frication_code_lateral | 14 units | unavailable | unavailable |
| articulation | artic_frication_code_none | 493 units | unavailable | unavailable |
| articulation | artic_frication_code_remembered | 357 units | unavailable | unavailable |
| articulation | artic_frication_code_vowel_end | 183 units | unavailable | unavailable |
| articulation | artic_fricative_before_voiced_closing | 51 units | unavailable | unavailable |
| articulation | artic_fricative_before_voiced_low | 33 units | unavailable | unavailable |
| articulation | artic_fricative_before_voiced_open | 53 units | unavailable | unavailable |
| articulation | artic_fricative_blade | 77 units | unavailable | unavailable |
| articulation | artic_fricative_labial | 24 units | unavailable | unavailable |
| articulation | artic_fricative_placeless | 5 units | unavailable | unavailable |
| articulation | artic_fricative_velar | 0 units | unavailable | unavailable |
| articulation | artic_glottis_after_voiced_glottal | 2 units | unavailable | unavailable |
| articulation | artic_glottis_speed_at_high_rate | 0 units | unavailable | unavailable |
| articulation | artic_glottis_step | 493 units | unavailable | unavailable |
| articulation | artic_initial_before_blade_burst_stop | 2 units | unavailable | unavailable |
| articulation | artic_initial_before_blade_fricative | 19 units | unavailable | unavailable |
| articulation | artic_initial_before_dental | 3 units | unavailable | unavailable |
| articulation | artic_initial_before_labial_burst_stop | 2 units | unavailable | unavailable |
| articulation | artic_initial_before_velar_burst_stop | 2 units | unavailable | unavailable |
| articulation | artic_initial_before_voiced | 27 units | unavailable | unavailable |
| articulation | artic_initial_before_voiced_burst_stop | 4 units | unavailable | unavailable |
| articulation | artic_initial_before_voiceless | 20 units | unavailable | unavailable |
| articulation | artic_initial_before_voiceless_burst_stop | 2 units | unavailable | unavailable |
| articulation | artic_initial_before_vowel | 10 units | unavailable | unavailable |
| articulation | artic_initial_blade_fricative_area | 19 units | unavailable | unavailable |
| articulation | artic_initial_nasal_areas | 1 units | unavailable | unavailable |
| articulation | artic_initial_pressure_before_voiced_labial | 3 units | unavailable | unavailable |
| articulation | artic_initial_reset_areas | 47 units | unavailable | unavailable |
| articulation | artic_initial_reset_glottis | 47 units | unavailable | unavailable |
| articulation | artic_initial_reset_pressure | 47 units | unavailable | unavailable |
| articulation | artic_initial_reset_velum | 47 units | unavailable | unavailable |
| articulation | artic_initial_velum_before_nasal | 1 units | unavailable | unavailable |
| articulation | artic_initial_velum_before_voiced_oral | 26 units | unavailable | unavailable |
| articulation | artic_initial_velum_before_vowel | 10 units | unavailable | unavailable |
| articulation | artic_initial_voiced_areas | 27 units | unavailable | unavailable |
| articulation | artic_initial_voiced_labial_areas | 3 units | unavailable | unavailable |
| articulation | artic_initial_vowel_areas | 10 units | unavailable | unavailable |
| articulation | artic_lateral_glottis | 14 units | unavailable | unavailable |
| articulation | artic_lips_case | 493 units | unavailable | unavailable |
| articulation | artic_lips_closed | 33 units | unavailable | unavailable |
| articulation | artic_lips_closing | 53 units | unavailable | unavailable |
| articulation | artic_lips_closure_building | 33 units | unavailable | unavailable |
| articulation | artic_lips_closure_over | 33 units | unavailable | unavailable |
| articulation | artic_lips_limit | 0 units | unavailable | unavailable |
| articulation | artic_lips_moving | 137 units | unavailable | unavailable |
| articulation | artic_lips_release_after_burst | 64 units | unavailable | unavailable |
| articulation | artic_lips_release_without_burst | 0 units | unavailable | unavailable |
| articulation | artic_nasal_glottis | 32 units | unavailable | unavailable |
| articulation | artic_no_emphasis | 446 units | unavailable | unavailable |
| articulation | artic_no_flap | 491 units | unavailable | unavailable |
| articulation | artic_no_spread_before_the_end | 457 units | unavailable | unavailable |
| articulation | artic_no_spread_in_the_first_frame | 47 units | unavailable | unavailable |
| articulation | artic_placeless_obstruent | 5 units | unavailable | unavailable |
| articulation | artic_plosive_before_nasal | 0 units | unavailable | unavailable |
| articulation | artic_pressure_drop_by_slope | 493 units | unavailable | unavailable |
| articulation | artic_pressure_out | 493 units | unavailable | unavailable |
| articulation | artic_pressure_out_floor | 47 units | unavailable | unavailable |
| articulation | artic_pressure_rise_voiced | 28 units | unavailable | unavailable |
| articulation | artic_pressure_rise_voiced_again | 27 units | unavailable | unavailable |
| articulation | artic_pressure_rise_voiceless | 20 units | unavailable | unavailable |
| articulation | artic_releases_end_after_non_plosive | 359 units | unavailable | unavailable |
| articulation | artic_remember_areas | 493 units | unavailable | unavailable |
| articulation | artic_silence_after_obstruent | 13 units | unavailable | unavailable |
| articulation | artic_silence_after_sonorant | 34 units | unavailable | unavailable |
| articulation | artic_silence_after_voiceless | 10 units | unavailable | unavailable |
| articulation | artic_silence_areas | 47 units | unavailable | unavailable |
| articulation | artic_silence_pressure_drop | 47 units | unavailable | unavailable |
| articulation | artic_sonorant_areas | 246 units | unavailable | unavailable |
| articulation | artic_sonorant_consonant_speed | 20 units | unavailable | unavailable |
| articulation | artic_sonorant_glottis | 214 units | unavailable | unavailable |
| articulation | artic_syllable_pressure_slope | 42 units | unavailable | unavailable |
| articulation | artic_tongue_case | 493 units | unavailable | unavailable |
| articulation | artic_tongue_closed | 21 units | unavailable | unavailable |
| articulation | artic_tongue_closing | 17 units | unavailable | unavailable |
| articulation | artic_tongue_closure_needs_velar | 473 units | unavailable | unavailable |
| articulation | artic_tongue_closure_over | 15 units | unavailable | unavailable |
| articulation | artic_tongue_closure_starts | 19 units | unavailable | unavailable |
| articulation | artic_tongue_moving | 21 units | unavailable | unavailable |
| articulation | artic_tongue_release_after_burst | 30 units | unavailable | unavailable |
| articulation | artic_tongue_release_without_burst | 0 units | unavailable | unavailable |
| articulation | artic_unstressed_before_voiceless_fricative_early | 8 units | unavailable | unavailable |
| articulation | artic_unstressed_before_voiceless_fricative_late | 7 units | unavailable | unavailable |
| articulation | artic_velar_nasal_closure | 2 units | unavailable | unavailable |
| articulation | artic_velar_place | 21 units | unavailable | unavailable |
| articulation | artic_velum_before_nasal | 32 units | unavailable | unavailable |
| articulation | artic_velum_closing | 23 units | unavailable | unavailable |
| articulation | artic_velum_in_nasal | 32 units | unavailable | unavailable |
| articulation | artic_voiced_glottal_obstruent | 2 units | unavailable | unavailable |
| articulation | artic_voiced_obstruent | 80 units | unavailable | unavailable |
| articulation | artic_voiceless_obstruent | 119 units | unavailable | unavailable |
| articulation | artic_voiceless_sonorant_areas | 2 units | unavailable | unavailable |
| articulation | artic_voiceless_sonorant_glottis | 2 units | unavailable | unavailable |
| articulation | artic_vot_after_voiceless_plosive | 29 units | unavailable | unavailable |
| articulation | artic_vot_end | 20 units | unavailable | unavailable |
| articulation | artic_vot_five_before | 9 units | unavailable | unavailable |
| articulation | artic_vot_none | 493 units | unavailable | unavailable |
| articulation | artic_vot_slow_drop | 9 units | unavailable | unavailable |
| articulation | artic_vot_speed | 9 units | unavailable | unavailable |
| articulation | artic_vot_two_before | 13 units | unavailable | unavailable |
| articulation | artic_vowel_before_fricative | 47 units | unavailable | unavailable |
| articulation | artic_vowel_before_labial | 41 units | unavailable | unavailable |
| articulation | artic_vowel_before_voiceless_sonorant | 2 units | unavailable | unavailable |
| articulation | artic_vowel_last_frame | 183 units | unavailable | unavailable |
| annotation | assign_punctuation_break_index | 47 | 559 | select_where_failed (512) |
| structural | dectalk_add_voiced_fricative_soft_voicing_onset | 21 | 559 | select_where_failed (538) |
| structural | dectalk_add_voiceless_fricative_breathy_onset | 44 | 559 | select_where_failed (515) |
| structural | dectalk_add_vowel_breathy_offset | 17 | 559 | select_where_failed (542) |
| duration | dectalk_allophone_duration | 434 | 558 | select_where_failed (124) |
| postlexical | dectalk_assimilate_sibilant_sh | 1 | 489 | select_where_failed (440) |
| postlexical | dectalk_at_reduced | 0 | 491 | select_where_failed (491) |
| prosody | dectalk_baseline_declination | 13 | 558 | select_where_failed (511) |
| prosody | dectalk_break_f0_floor | 2 | 558 | select_where_failed (531) |
| postlexical | dectalk_break_marker | 11 | 138 | select_where_failed (127) |
| postlexical | dectalk_breath_group_primary_stress | 0 | 491 | select_where_failed (320) |
| postlexical | dectalk_cited_lone_schwa | 0 | 491 | select_where_failed (477) |
| postlexical | dectalk_clause_break | 2 | 138 | select_where_failed (127) |
| postlexical | dectalk_clause_break_comma | 2 | 489 | select_where_failed (351) |
| postlexical | dectalk_clause_break_place | 2 | 138 | constraint_failed (136) |
| postlexical | dectalk_clause_counted_words | 442 | 489 | select_where_failed (47) |
| postlexical | dectalk_clause_initial_and | 4 | 491 | select_where_failed (478) |
| prosody | dectalk_clause_number_words | 47 | 558 | select_where_failed (511) |
| annotation | dectalk_clause_phone_counts | 512 | 559 | select_where_failed (47) |
| prosody | dectalk_clause_running_state | 434 | 558 | select_where_failed (124) |
| postlexical | dectalk_clause_verb_summary | 47 | 491 | select_where_failed (444) |
| prosody | dectalk_comma_baseline | 27 | 558 | select_where_failed (511) |
| prosody | dectalk_connected_speech_source_contour | 342 | 558 | select_where_failed (216) |
| postlexical | dectalk_consonant_stress | 109 | 491 | select_where_failed (222) |
| annotation | dectalk_consonant_stress | 104 | 559 | select_where_failed (235) |
| postlexical | dectalk_dental_dh | 3 | 481 | select_where_failed (470) |
| annotation | dectalk_drop_dummy_vowel_after_intonation_stop | 1 | 559 | select_where_failed (546) |
| postlexical | dectalk_duration_dictionary | 0 | 491 | constraint_failed (444) |
| prosody | dectalk_empty_clause_baseline | 0 | 558 | select_where_failed (558) |
| prosody | dectalk_empty_clause_break_f0_floor | 0 | 558 | select_where_failed (558) |
| prosody | dectalk_empty_clause_comma_baseline | 0 | 558 | select_where_failed (558) |
| prosody | dectalk_empty_clause_exclamation_baseline | 0 | 558 | select_where_failed (558) |
| prosody | dectalk_empty_clause_f0_opening_silence | 0 | 558 | select_where_failed (558) |
| prosody | dectalk_empty_clause_question_baseline | 0 | 558 | select_where_failed (558) |
| postlexical | dectalk_exclamation_emphasis | 0 | 491 | select_where_failed (387) |
| prosody | dectalk_female_baseline_declination | 0 | 558 | select_where_failed (511) |
| prosody | dectalk_female_comma_baseline | 0 | 558 | select_where_failed (511) |
| prosody | dectalk_female_empty_clause_baseline | 0 | 558 | select_where_failed (558) |
| prosody | dectalk_female_empty_clause_comma_baseline | 0 | 558 | select_where_failed (558) |
| prosody | dectalk_female_empty_clause_exclamation_range | 0 | 558 | select_where_failed (558) |
| prosody | dectalk_female_empty_clause_question_baseline | 0 | 558 | select_where_failed (558) |
| prosody | dectalk_female_exclamation_range | 0 | 558 | select_where_failed (511) |
| prosody | dectalk_female_question_baseline | 0 | 558 | select_where_failed (511) |
| postlexical | dectalk_flap_d | 0 | 489 | select_where_failed (475) |
| postlexical | dectalk_flap_t | 2 | 489 | select_where_failed (470) |
| postlexical | dectalk_fuse_vowel_r | 8 | 489 | select_where_failed (474) |
| postlexical | dectalk_geminate_delete | 2 | 491 | select_where_failed (288) |
| postlexical | dectalk_glottalize_t | 2 | 489 | select_where_failed (468) |
| annotation | dectalk_hat_pattern | 175 | 559 | select_where_failed (384) |
| prosody | dectalk_hat_rise | 47 | 558 | select_where_failed (383) |
| postlexical | dectalk_helper_verb_class_start | 0 | 491 | constraint_failed (444) |
| postlexical | dectalk_helper_verb_mark_before_phrase_start | 0 | 491 | select_where_failed (491) |
| postlexical | dectalk_helper_verb_promotion | 2 | 491 | select_where_failed (482) |
| postlexical | dectalk_helper_verb_promotion_ahead_of_word | 0 | 491 | select_where_failed (491) |
| postlexical | dectalk_helper_verb_resent_class_start | 0 | 491 | select_where_failed (464) |
| structural | dectalk_insert_voiced_stop_dummy_vowel | 3 | 525 | select_where_failed (522) |
| structural | dectalk_insert_voiced_stop_release | 31 | 528 | select_where_failed (497) |
| structural | dectalk_insert_voiced_stop_release_final | 0 | 559 | select_where_failed (559) |
| structural | dectalk_insert_voiceless_stop_release_and_aspiration | 34 | 491 | select_where_failed (457) |
| structural | dectalk_insert_voiceless_stop_release_into_silence | 10 | 481 | select_where_failed (471) |
| annotation | dectalk_intonation_stops | 175 | 559 | select_where_failed (384) |
| postlexical | dectalk_nt_voicing | 0 | 481 | select_where_failed (464) |
| formant | dectalk_obstruent_parallel_amplitudes | 108 | 558 | select_where_failed (450) |
| postlexical | dectalk_palatalize_d | 0 | 489 | select_where_failed (475) |
| postlexical | dectalk_palatalize_t | 0 | 489 | select_where_failed (468) |
| duration | dectalk_pause_duration | 47 | 558 | select_where_failed (511) |
| postlexical | dectalk_phrase_start_follows | 1 | 491 | constraint_failed (443) |
| annotation | dectalk_pitch_mode | 434 | 559 | select_where_failed (125) |
| postlexical | dectalk_postvocalic_liquid | 6 | 481 | select_where_failed (462) |
| postlexical | dectalk_pp_dropped_stress | 0 | 491 | select_where_failed (491) |
| postlexical | dectalk_pp_dropped_unreduce | 0 | 491 | select_where_failed (491) |
| postlexical | dectalk_pp_start_state | 5 | 138 | select_where_failed (133) |
| prosody | dectalk_question_baseline | 0 | 558 | select_where_failed (511) |
| prosody | dectalk_question_dip | 0 | 558 | select_where_failed (558) |
| prosody | dectalk_question_rise | 0 | 558 | select_where_failed (558) |
| annotation | dectalk_rime_boundary | 267 | 559 | constraint_failed (232) |
| prosody | dectalk_segmental_f0_dummy_vowel | 12 | 558 | select_where_failed (546) |
| prosody | dectalk_segmental_f0_final_silence | 47 | 558 | select_where_failed (511) |
| prosody | dectalk_segmental_f0_initial_silence | 47 | 558 | select_where_failed (511) |
| prosody | dectalk_segmental_f0_phone | 431 | 558 | select_where_failed (124) |
| prosody | dectalk_segmental_f0_phone_after_intonation_stop | 3 | 558 | constraint_failed (431) |
| prosody | dectalk_segmental_f0_written_silence | 0 | 558 | select_where_failed (558) |
| postlexical | dectalk_sentence_initial_auxiliary | 0 | 489 | select_where_failed (487) |
| postlexical | dectalk_sentence_initial_had | 0 | 489 | select_where_failed (488) |
| prosody | dectalk_short_declarative_baseline_declination | 7 | 558 | select_where_failed (511) |
| prosody | dectalk_short_exclamation_baseline | 0 | 558 | select_where_failed (511) |
| formant | dectalk_silence_carries_formants | 34 | 558 | select_where_failed (524) |
| orthography | dectalk_spelled_letter | 0 | 179 | select_where_failed (179) |
| duration | dectalk_stop_closure_duration | 65 | 558 | select_where_failed (493) |
| duration | dectalk_stop_release_duration | 1 | 558 | select_where_failed (493) |
| prosody | dectalk_stress_impulse | 112 | 558 | select_where_failed (383) |
| formant | dectalk_sw_default_assignment | 481 | 558 | select_where_failed (77) |
| formant | dectalk_sw_explicit_override | 77 | 558 | select_where_failed (481) |
| postlexical | dectalk_syllabic_n_after_tx | 0 | 481 | select_where_failed (310) |
| annotation | dectalk_syllable_type | 175 | 559 | select_where_failed (384) |
| postlexical | dectalk_the_before_vowel | 0 | 491 | select_where_failed (477) |
| duration | dectalk_timing_10_syllabic_before_syllabic | 12 | 558 | constraint_failed (422) |
| duration | dectalk_timing_11_first_syllable_primary | 1 | 558 | constraint_failed (433) |
| duration | dectalk_timing_12_syllabic_before_lx | 6 | 558 | constraint_failed (428) |
| duration | dectalk_timing_13_before_sh | 0 | 558 | constraint_failed (434) |
| duration | dectalk_timing_13_cluster_first | 15 | 558 | constraint_failed (419) |
| duration | dectalk_timing_13_cluster_second | 68 | 558 | constraint_failed (366) |
| duration | dectalk_timing_14_sonorant_after_voiceless_plosive | 20 | 558 | constraint_failed (414) |
| duration | dectalk_timing_15_vowel_after_silence | 10 | 558 | constraint_failed (424) |
| duration | dectalk_timing_16_vowel_after_glide | 11 | 558 | constraint_failed (423) |
| duration | dectalk_timing_17_short_clause | 112 | 558 | constraint_failed (322) |
| duration | dectalk_timing_18_glide_after_obstruent | 10 | 558 | constraint_failed (424) |
| duration | dectalk_timing_19_unstressed_final_th | 0 | 558 | constraint_failed (434) |
| duration | dectalk_timing_20_unstressed_final_iy | 2 | 558 | constraint_failed (432) |
| duration | dectalk_timing_21_plosive_between_obstruents | 0 | 558 | constraint_failed (434) |
| duration | dectalk_timing_23_before_df | 2 | 558 | constraint_failed (432) |
| duration | dectalk_timing_23_retroflex_minimum | 9 | 558 | constraint_failed (425) |
| duration | dectalk_timing_24_before_velar_nasal | 2 | 558 | constraint_failed (432) |
| duration | dectalk_timing_2_clause_final_rime | 84 | 558 | constraint_failed (350) |
| duration | dectalk_timing_3_adjacent_nasals | 0 | 558 | constraint_failed (434) |
| duration | dectalk_timing_3_non_phrase_final_syllabic | 125 | 558 | constraint_failed (309) |
| duration | dectalk_timing_4_monosyllable_stress | 32 | 558 | constraint_failed (402) |
| duration | dectalk_timing_4_polysyllable_non_word_final | 37 | 558 | constraint_failed (397) |
| duration | dectalk_timing_5_polysyllable | 72 | 558 | constraint_failed (362) |
| duration | dectalk_timing_6_non_word_initial_consonant | 108 | 558 | constraint_failed (326) |
| duration | dectalk_timing_6_word_final_fricative | 32 | 558 | constraint_failed (402) |
| duration | dectalk_timing_7_hat_fall | 0 | 558 | constraint_failed (434) |
| duration | dectalk_timing_7_schwa_by_flap | 0 | 558 | constraint_failed (434) |
| duration | dectalk_timing_7_unstressed_consonant | 159 | 558 | constraint_failed (275) |
| duration | dectalk_timing_7_unstressed_minimum | 111 | 558 | constraint_failed (323) |
| duration | dectalk_timing_7_unstressed_syllabic | 71 | 558 | constraint_failed (363) |
| duration | dectalk_timing_8_emphasis | 0 | 558 | constraint_failed (434) |
| duration | dectalk_timing_9_postvocalic_context | 194 | 558 | constraint_failed (240) |
| duration | dectalk_timing_dictionary_duration | 0 | 558 | constraint_failed (434) |
| duration | dectalk_timing_frames | 434 | 558 | select_where_failed (124) |
| duration | dectalk_timing_setup | 434 | 558 | select_where_failed (124) |
| postlexical | dectalk_to_before_vowel | 0 | 489 | select_where_failed (487) |
| prosody | dectalk_user_pitch_command | 0 | 558 | select_where_failed (558) |
| duration | dectalk_utterance_initial_pause | 20 | 558 | select_where_failed (538) |
| structural | dectalk_weaken_interdental_frication | 12 | 559 | select_where_failed (547) |
| postlexical | dectalk_wh_question_period | 0 | 489 | select_where_failed (489) |
| postlexical | dectalk_word_initial_consonant | 119 | 491 | select_where_failed (222) |
| duration | dectalk_written_silence_duration | 0 | 558 | select_where_failed (558) |
| formant_drawing | fd_allophone_index | 493 units | unavailable | unavailable |
| formant_drawing | fd_aspiration_bandwidth | 30 units | unavailable | unavailable |
| formant_drawing | fd_backward_before_h | 2 units | unavailable | unavailable |
| formant_drawing | fd_backward_before_silence | 94 units | unavailable | unavailable |
| formant_drawing | fd_backward_default | 493 units | unavailable | unavailable |
| formant_drawing | fd_backward_limits | 493 units | unavailable | unavailable |
| formant_drawing | fd_backward_locus_before_obstruent | 137 units | unavailable | unavailable |
| formant_drawing | fd_backward_locus_obstruent | 168 units | unavailable | unavailable |
| formant_drawing | fd_backward_obstruent | 188 units | unavailable | unavailable |
| formant_drawing | fd_backward_ramp | 493 units | unavailable | unavailable |
| formant_drawing | fd_backward_shrink | 72 units | unavailable | unavailable |
| formant_drawing | fd_backward_sonorant | 310 units | unavailable | unavailable |
| formant_drawing | fd_backward_sonorant_consonant | 27 units | unavailable | unavailable |
| formant_drawing | fd_backward_vowel_before_sonorant_consonant | 16 units | unavailable | unavailable |
| formant_drawing | fd_bandwidth_backward_before_nasal | 32 units | unavailable | unavailable |
| formant_drawing | fd_bandwidth_backward_before_silence | 94 units | unavailable | unavailable |
| formant_drawing | fd_bandwidth_backward_default | 493 units | unavailable | unavailable |
| formant_drawing | fd_bandwidth_backward_nasal | 32 units | unavailable | unavailable |
| formant_drawing | fd_bandwidth_backward_silence | 47 units | unavailable | unavailable |
| formant_drawing | fd_bandwidth_forward_after_nasal | 32 units | unavailable | unavailable |
| formant_drawing | fd_bandwidth_forward_after_silence | 74 units | unavailable | unavailable |
| formant_drawing | fd_bandwidth_forward_default | 493 units | unavailable | unavailable |
| formant_drawing | fd_bandwidth_forward_nasal | 32 units | unavailable | unavailable |
| formant_drawing | fd_bandwidth_forward_silence | 47 units | unavailable | unavailable |
| formant_drawing | fd_bandwidth_targets | 493 units | unavailable | unavailable |
| formant_drawing | fd_clause_index_reset | 47 units | unavailable | unavailable |
| formant_drawing | fd_diphthong_next_line_b2 | 11 units | unavailable | unavailable |
| formant_drawing | fd_diphthong_next_line_b3 | 0 units | unavailable | unavailable |
| formant_drawing | fd_diphthong_next_line_f1 | 189 units | unavailable | unavailable |
| formant_drawing | fd_diphthong_next_line_f2 | 189 units | unavailable | unavailable |
| formant_drawing | fd_diphthong_next_line_f3 | 189 units | unavailable | unavailable |
| formant_drawing | fd_diphthong_scale | 189 units | unavailable | unavailable |
| formant_drawing | fd_diphthong_start_b2 | 11 units | unavailable | unavailable |
| formant_drawing | fd_diphthong_start_b3 | 0 units | unavailable | unavailable |
| formant_drawing | fd_diphthong_start_f1 | 189 units | unavailable | unavailable |
| formant_drawing | fd_diphthong_start_f2 | 189 units | unavailable | unavailable |
| formant_drawing | fd_diphthong_start_f3 | 189 units | unavailable | unavailable |
| formant_drawing | fd_draw | 493 units | unavailable | unavailable |
| formant_drawing | fd_draw_override | 493 units | unavailable | unavailable |
| formant_drawing | fd_final_silence_next_target_earlier_clause | 0 units | unavailable | unavailable |
| formant_drawing | fd_final_silence_next_target_past_end | 0 units | unavailable | unavailable |
| formant_drawing | fd_final_silence_target_earlier_clause | 0 units | unavailable | unavailable |
| formant_drawing | fd_final_silence_target_past_end | 0 units | unavailable | unavailable |
| formant_drawing | fd_forward_default | 493 units | unavailable | unavailable |
| formant_drawing | fd_forward_h | 2 units | unavailable | unavailable |
| formant_drawing | fd_forward_limits | 493 units | unavailable | unavailable |
| formant_drawing | fd_forward_locus_after_obstruent | 168 units | unavailable | unavailable |
| formant_drawing | fd_forward_locus_obstruent | 137 units | unavailable | unavailable |
| formant_drawing | fd_forward_nasal | 32 units | unavailable | unavailable |
| formant_drawing | fd_forward_obstruent | 201 units | unavailable | unavailable |
| formant_drawing | fd_forward_ramp | 493 units | unavailable | unavailable |
| formant_drawing | fd_forward_shrink | 106 units | unavailable | unavailable |
| formant_drawing | fd_forward_silence | 67 units | unavailable | unavailable |
| formant_drawing | fd_forward_sonorant_consonant | 27 units | unavailable | unavailable |
| formant_drawing | fd_forward_vowel | 284 units | unavailable | unavailable |
| formant_drawing | fd_forward_vowel_after_sonorant_consonant | 22 units | unavailable | unavailable |
| formant_drawing | fd_initial_silence_next_target_earlier_clause | 0 units | unavailable | unavailable |
| formant_drawing | fd_input_index | 446 units | unavailable | unavailable |
| formant_drawing | fd_input_k | 9 units | unavailable | unavailable |
| formant_drawing | fd_input_k_doubled | 0 units | unavailable | unavailable |
| formant_drawing | fd_last_target | 493 units | unavailable | unavailable |
| formant_drawing | fd_next_target_coarticulated | 493 units | unavailable | unavailable |
| formant_drawing | fd_next_target_earlier_clause | 0 units | unavailable | unavailable |
| formant_drawing | fd_next_target_past_end | 0 units | unavailable | unavailable |
| formant_drawing | fd_no_diphthong | 493 units | unavailable | unavailable |
| formant_drawing | fd_no_override | 493 units | unavailable | unavailable |
| formant_drawing | fd_place_k | 493 units | unavailable | unavailable |
| formant_drawing | fd_shrink | 245 units | unavailable | unavailable |
| formant_drawing | fd_speaker_scale | 493 units | unavailable | unavailable |
| formant_drawing | fd_startup_last_target | 20 units | unavailable | unavailable |
| formant_drawing | fd_table_targets | 446 units | unavailable | unavailable |
| formant_drawing | fd_table_targets_final_silence | 47 units | unavailable | unavailable |
| formant_drawing | fd_table_targets_initial_silence | 47 units | unavailable | unavailable |
| formant_drawing | fd_target_coarticulated | 493 units | unavailable | unavailable |
| formant_drawing | fd_target_diphthong_onset | 189 units | unavailable | unavailable |
| formant_drawing | fd_target_end | 493 units | unavailable | unavailable |
| formant_drawing | fd_third_formant_floor | 20 units | unavailable | unavailable |
| formant_drawing | fd_voicebar_bandwidth | 2 units | unavailable | unavailable |
| annotation | syllable_index_annotation | 499 | 559 | select_where_failed (60) |
| annotation | syllable_position_annotation | 499 | 559 | select_where_failed (60) |
| annotation | syllable_role_annotation | 499 | 559 | select_where_failed (60) |
| normalization_lexical | tn_abbreviation | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_bare_number_request | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_clock_time | 0 | 268 | select_where_failed (268) |
| normalization_currency | tn_currency | 0 | 358 | select_where_failed (358) |
| normalization_date | tn_date | 0 | 358 | select_where_failed (358) |
| normalization_lexical | tn_date_text | 0 | 268 | select_where_failed (268) |
| normalization_decimal_fraction | tn_decimal | 0 | 358 | select_where_failed (358) |
| normalization_lexical | tn_dictionary_abbreviation | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_dotted_capitals | 0 | 268 | select_where_failed (268) |
| normalization_number_requests | tn_expand_number | 0 | 358 | select_where_failed (358) |
| normalization_number_groups | tn_expand_number_group | 0 | 358 | select_where_failed (358) |
| normalization_lexical | tn_forced_comma | 0 | 268 | select_where_failed (268) |
| normalization_decimal_fraction | tn_fraction | 0 | 358 | select_where_failed (358) |
| normalization_lexical | tn_initial | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_initialism | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_lone_dash | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_lone_period | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_marked_word | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_money_text | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_number_token | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_parser_clause_end | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_parser_pause | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_parser_phones | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_plural_number | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_silent_mark | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_spell_mode_first_verb | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_spell_mode_wh_mark | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_spell_mode_word | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_spelled_capitals | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_stripped_mark | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_stripped_parenthesis_mark | 0 | 268 | select_where_failed (268) |
| normalization_lexical | tn_symbol_word | 0 | 268 | select_where_failed (268) |
| normalization_terminal_words | tn_terminal_words | 358 | 358 | none recorded |
| normalization_time | tn_time | 0 | 358 | select_where_failed (358) |
| normalization_lexical | tn_unmatched_words | 268 | 268 | none recorded |
| normalization_lexical | tn_whole_word | 0 | 268 | select_where_failed (268) |
| normalization_date | tn_year | 0 | 358 | select_where_failed (358) |

### Zero recorded firings

- articulation/artic_blade_limit
- articulation/artic_blade_release_without_burst
- articulation/artic_emphasis_pulse
- articulation/artic_fricative_velar
- articulation/artic_glottis_speed_at_high_rate
- articulation/artic_lips_limit
- articulation/artic_lips_release_without_burst
- articulation/artic_plosive_before_nasal
- articulation/artic_tongue_release_without_burst
- postlexical/dectalk_at_reduced
- postlexical/dectalk_breath_group_primary_stress
- postlexical/dectalk_cited_lone_schwa
- postlexical/dectalk_duration_dictionary
- prosody/dectalk_empty_clause_baseline
- prosody/dectalk_empty_clause_break_f0_floor
- prosody/dectalk_empty_clause_comma_baseline
- prosody/dectalk_empty_clause_exclamation_baseline
- prosody/dectalk_empty_clause_f0_opening_silence
- prosody/dectalk_empty_clause_question_baseline
- postlexical/dectalk_exclamation_emphasis
- prosody/dectalk_female_baseline_declination
- prosody/dectalk_female_comma_baseline
- prosody/dectalk_female_empty_clause_baseline
- prosody/dectalk_female_empty_clause_comma_baseline
- prosody/dectalk_female_empty_clause_exclamation_range
- prosody/dectalk_female_empty_clause_question_baseline
- prosody/dectalk_female_exclamation_range
- prosody/dectalk_female_question_baseline
- postlexical/dectalk_flap_d
- postlexical/dectalk_helper_verb_class_start
- postlexical/dectalk_helper_verb_mark_before_phrase_start
- postlexical/dectalk_helper_verb_promotion_ahead_of_word
- postlexical/dectalk_helper_verb_resent_class_start
- structural/dectalk_insert_voiced_stop_release_final
- postlexical/dectalk_nt_voicing
- postlexical/dectalk_palatalize_d
- postlexical/dectalk_palatalize_t
- postlexical/dectalk_pp_dropped_stress
- postlexical/dectalk_pp_dropped_unreduce
- prosody/dectalk_question_baseline
- prosody/dectalk_question_dip
- prosody/dectalk_question_rise
- prosody/dectalk_segmental_f0_written_silence
- postlexical/dectalk_sentence_initial_auxiliary
- postlexical/dectalk_sentence_initial_had
- prosody/dectalk_short_exclamation_baseline
- orthography/dectalk_spelled_letter
- postlexical/dectalk_syllabic_n_after_tx
- postlexical/dectalk_the_before_vowel
- duration/dectalk_timing_13_before_sh
- duration/dectalk_timing_19_unstressed_final_th
- duration/dectalk_timing_21_plosive_between_obstruents
- duration/dectalk_timing_3_adjacent_nasals
- duration/dectalk_timing_7_hat_fall
- duration/dectalk_timing_7_schwa_by_flap
- duration/dectalk_timing_8_emphasis
- duration/dectalk_timing_dictionary_duration
- postlexical/dectalk_to_before_vowel
- prosody/dectalk_user_pitch_command
- postlexical/dectalk_wh_question_period
- duration/dectalk_written_silence_duration
- formant_drawing/fd_diphthong_next_line_b3
- formant_drawing/fd_diphthong_start_b3
- formant_drawing/fd_final_silence_next_target_earlier_clause
- formant_drawing/fd_final_silence_next_target_past_end
- formant_drawing/fd_final_silence_target_earlier_clause
- formant_drawing/fd_final_silence_target_past_end
- formant_drawing/fd_initial_silence_next_target_earlier_clause
- formant_drawing/fd_input_k_doubled
- formant_drawing/fd_next_target_earlier_clause
- formant_drawing/fd_next_target_past_end
- normalization_lexical/tn_abbreviation
- normalization_lexical/tn_bare_number_request
- normalization_lexical/tn_clock_time
- normalization_currency/tn_currency
- normalization_date/tn_date
- normalization_lexical/tn_date_text
- normalization_decimal_fraction/tn_decimal
- normalization_lexical/tn_dictionary_abbreviation
- normalization_lexical/tn_dotted_capitals
- normalization_number_requests/tn_expand_number
- normalization_number_groups/tn_expand_number_group
- normalization_lexical/tn_forced_comma
- normalization_decimal_fraction/tn_fraction
- normalization_lexical/tn_initial
- normalization_lexical/tn_initialism
- normalization_lexical/tn_lone_dash
- normalization_lexical/tn_lone_period
- normalization_lexical/tn_marked_word
- normalization_lexical/tn_money_text
- normalization_lexical/tn_number_token
- normalization_lexical/tn_parser_clause_end
- normalization_lexical/tn_parser_pause
- normalization_lexical/tn_parser_phones
- normalization_lexical/tn_plural_number
- normalization_lexical/tn_silent_mark
- normalization_lexical/tn_spell_mode_first_verb
- normalization_lexical/tn_spell_mode_wh_mark
- normalization_lexical/tn_spell_mode_word
- normalization_lexical/tn_spelled_capitals
- normalization_lexical/tn_stripped_mark
- normalization_lexical/tn_stripped_parenthesis_mark
- normalization_lexical/tn_symbol_word
- normalization_time/tn_time
- normalization_lexical/tn_whole_word
- normalization_date/tn_year

### Recognition outcomes

| Rule | Accepted | Ineligible | Overlap | Unmatched |
| --- | ---: | ---: | ---: | ---: |
| (unmatched) | 0 | 0 | 0 | 134 |
| tn_abbreviation_source | 0 | 0 | 0 | 0 |
| tn_accented_word_source | 0 | 0 | 0 | 0 |
| tn_bare_decimal_source | 0 | 0 | 0 | 0 |
| tn_cardinal_source | 0 | 0 | 0 | 0 |
| tn_clock_time_source | 0 | 0 | 0 | 0 |
| tn_closing_mark_source | 0 | 0 | 0 | 0 |
| tn_currency_source | 0 | 0 | 0 | 0 |
| tn_date_text_source | 0 | 0 | 0 | 0 |
| tn_date_token_source | 0 | 0 | 0 | 0 |
| tn_decimal_source | 0 | 0 | 0 | 0 |
| tn_dictionary_abbreviation_source | 0 | 20 | 0 | 0 |
| tn_digit_apostrophe_source | 0 | 0 | 0 | 0 |
| tn_digit_colon_source | 0 | 0 | 0 | 0 |
| tn_dotted_capitals_source | 0 | 0 | 0 | 0 |
| tn_dotted_word_source | 0 | 0 | 0 | 0 |
| tn_europe_money_text_source | 0 | 0 | 0 | 0 |
| tn_europe_number_token_source | 0 | 0 | 0 | 0 |
| tn_europe_plural_number_source | 0 | 0 | 0 | 0 |
| tn_explicit_time_source | 0 | 0 | 0 | 0 |
| tn_fraction_source | 0 | 0 | 0 | 0 |
| tn_hyphenated_word_source | 0 | 134 | 0 | 0 |
| tn_initial_source | 0 | 0 | 0 | 0 |
| tn_initialism_source | 0 | 0 | 0 | 0 |
| tn_iso_date_source | 0 | 0 | 0 | 0 |
| tn_lone_dash_source | 0 | 0 | 0 | 0 |
| tn_lone_period_source | 0 | 0 | 0 | 0 |
| tn_mark_after_phonemic_source | 0 | 0 | 0 | 0 |
| tn_mark_stripped_with_quote_source | 0 | 0 | 0 | 0 |
| tn_marked_word_source | 0 | 0 | 0 | 0 |
| tn_money_text_source | 0 | 0 | 0 | 0 |
| tn_number_abbreviation_source | 0 | 0 | 0 | 0 |
| tn_number_percent_source | 0 | 0 | 0 | 0 |
| tn_number_token_source | 0 | 0 | 0 | 0 |
| tn_opening_mark_source | 0 | 0 | 0 | 0 |
| tn_ordinal_source | 0 | 0 | 0 | 0 |
| tn_parser_clause_end_after_period_word_source | 0 | 0 | 0 | 0 |
| tn_parser_clause_end_source | 0 | 0 | 0 | 0 |
| tn_parser_pause_source | 0 | 0 | 0 | 0 |
| tn_parser_phones_source | 0 | 0 | 0 | 0 |
| tn_part_number_source | 0 | 134 | 0 | 0 |
| tn_period_before_mark_source | 0 | 0 | 0 | 0 |
| tn_plural_number_source | 0 | 0 | 0 | 0 |
| tn_plus_word_source | 0 | 0 | 0 | 0 |
| tn_sign_word_source | 0 | 0 | 0 | 0 |
| tn_signed_number_source | 0 | 0 | 0 | 0 |
| tn_slash_dash_word_source | 0 | 0 | 0 | 0 |
| tn_slash_date_source | 0 | 0 | 0 | 0 |
| tn_slash_word_source | 0 | 0 | 0 | 0 |
| tn_spell_mode_first_verb_source | 0 | 0 | 0 | 0 |
| tn_spell_mode_wh_mark_source | 0 | 0 | 0 | 0 |
| tn_spell_mode_word_source | 0 | 0 | 0 | 0 |
| tn_spelled_capitals_source | 0 | 0 | 0 | 0 |
| tn_spelled_number_source | 0 | 0 | 0 | 0 |
| tn_stripped_parenthesis_mark_source | 0 | 0 | 0 | 0 |
| tn_symbol_word_source | 0 | 0 | 0 | 0 |
| tn_time_source | 0 | 0 | 0 | 0 |
| tn_underscore_word_source | 0 | 0 | 0 | 0 |
| tn_word_source | 134 | 0 | 0 | 0 |
| tn_year_source | 0 | 0 | 0 | 0 |

## qlatt-beauty

Compiled rulepack SHA-256: 1940072669b4fea7af144eb4e18592605c6d50c9a0c8f69c2ca748546c184bc8.

| Phase | Rule | Fires / firing units | Recorded attempts | Most common failure |
| --- | --- | ---: | ---: | --- |
| duration | accent_vowel_lengthening | 0 | 627 | select_where_failed (627) |
| duration | aspiration_frication_carryover | 41 | 627 | select_where_failed (586) |
| (unscheduled) | assign_accent | 0 | 0 | none recorded |
| (unscheduled) | assign_accent_types | 0 | 0 | none recorded |
| annotation | assign_initial_boundary_tone | 582 | 627 | select_where_failed (45) |
| annotation | assign_long_phrase_break | 0 | 627 | select_where_failed (627) |
| annotation | assign_metrical_accent | 0 | 627 | select_where_failed (627) |
| annotation | assign_phrase_edge_tones | 45 | 627 | select_where_failed (582) |
| annotation | assign_punctuation_break_index | 45 | 627 | select_where_failed (582) |
| annotation | assign_word_boundary_break_index | 133 | 627 | select_where_failed (494) |
| prosody | associate_accent_tones | 0 | 627 | select_where_failed (627) |
| prosody | associate_edge_tones | 45 | 627 | select_where_failed (582) |
| prosody | associate_initial_tone | 0 | 627 | select_where_failed (627) |
| formant | burst_spectral_template | 111 | 627 | select_where_failed (516) |
| annotation | cluster_position_annotation | 418 | 627 | select_where_failed (209) |
| duration | cluster_shortening | 418 | 627 | select_where_failed (209) |
| prosody | connected_speech_source_contour | 379 | 627 | select_where_failed (248) |
| postlexical | d_deletion | 6 | 479 | select_where_failed (473) |
| postlexical | d_flapping | 0 | 479 | select_where_failed (479) |
| formant | dark_l_allophony | 18 | 627 | select_where_failed (609) |
| duration | duration_cap | 582 | 627 | select_where_failed (45) |
| duration | duration_floor_default | 516 | 627 | select_where_failed (111) |
| duration | duration_floor_from_inventory | 0 | 627 | select_where_failed (627) |
| duration | duration_floor_stop_release | 111 | 627 | select_where_failed (516) |
| formant | effort_rd_adduction | 164 | 627 | select_where_failed (463) |
| structural | expand_affricates_with_closure | 4 | 480 | select_where_failed (476) |
| structural | expand_diphthongs | 23 | 484 | select_where_failed (461) |
| structural | expand_rhotic_vowels | 9 | 507 | select_where_failed (498) |
| prosody | f0_continuation_rise | 0 | 627 | select_where_failed (627) |
| prosody | f0_voiced_onset_perturbation | 19 | 627 | select_where_failed (608) |
| prosody | f0_voiceless_onset_perturbation | 61 | 627 | select_where_failed (566) |
| formant | f1_stop_onset | 70 | 627 | select_where_failed (557) |
| duration | fricative_minimum_duration | 108 | 627 | select_where_failed (519) |
| postlexical | glottal_stop_insertion | 2 | 478 | select_where_failed (476) |
| (unscheduled) | hertz_nucleus_floor | 0 | 0 | none recorded |
| (unscheduled) | hertz_nucleus_timing | 0 | 0 | none recorded |
| (unscheduled) | identify_nuclear_accent | 0 | 0 | none recorded |
| structural | insert_mapped_voiced_release | 29 | 598 | select_where_failed (569) |
| structural | insert_mapped_voiced_release_final | 0 | 627 | select_where_failed (627) |
| structural | insert_mapped_voiceless_release_and_aspiration | 41 | 516 | select_where_failed (475) |
| structural | insert_mapped_voiceless_release_and_aspiration_final | 0 | 598 | select_where_failed (598) |
| duration | lock_stop_release_duration | 111 | 627 | select_where_failed (516) |
| (unscheduled) | mark_function_words | 0 | 0 | none recorded |
| formant | nasal_murmur_targets | 32 | 627 | select_where_failed (595) |
| formant | nasal_place_assignment | 32 | 627 | select_where_failed (595) |
| formant | nasal_place_assimilation | 10 | 627 | select_where_failed (607) |
| formant | nasal_windows | 32 | 627 | select_where_failed (595) |
| duration | non_word_initial_consonant_shortening | 190 | 627 | select_where_failed (437) |
| normalize | normalize_schwa | 0 | 479 | select_where_failed (479) |
| normalize | normalize_velar_nasal | 1 | 479 | select_where_failed (478) |
| normalize | normalize_wh_merger | 0 | 479 | select_where_failed (479) |
| postlexical | palatalization_dy | 1 | 479 | pattern_step_failed (478) |
| postlexical | palatalization_ty | 0 | 478 | pattern_step_failed (478) |
| duration | pause_rate_scaling | 0 | 627 | select_where_failed (582) |
| formant | phrase_rd_contour | 582 | 627 | select_where_failed (45) |
| formant | place_f2_locus | 120 | 627 | select_where_failed (507) |
| formant | place_rel_copy | 61 | 627 | select_where_failed (566) |
| duration | polysyllabic_shortening | 110 | 627 | select_where_failed (517) |
| duration | pre_boundary_lengthening | 307 | 627 | select_where_failed (258) |
| duration | punctuation_pause | 45 | 627 | select_where_failed (582) |
| formant | r_f3_lowering | 25 | 627 | select_where_failed (602) |
| structural | remap_stops_to_closures | 81 | 480 | select_where_failed (399) |
| duration | s_cluster_aspiration_reduction | 10 | 627 | select_where_failed (586) |
| formant | schwa_coronal_fronting | 23 | 627 | select_where_failed (601) |
| duration | speech_rate_scaling | 0 | 627 | constraint_failed (582) |
| orthography | spelling_mode_letter_names | 0 | 179 | select_where_failed (179) |
| duration | stop_unreleasing | 0 | 627 | select_where_failed (557) |
| duration | stress_duration | 164 | 627 | select_where_failed (463) |
| formant | stress_rd_adduction | 164 | 627 | select_where_failed (463) |
| formant | sw_default_assignment | 425 | 627 | select_where_failed (202) |
| formant | sw_explicit_override | 202 | 627 | select_where_failed (425) |
| annotation | syllable_count_annotation | 164 | 627 | select_where_failed (463) |
| postlexical | t_deletion | 2 | 479 | select_where_failed (477) |
| postlexical | t_flapping | 5 | 479 | select_where_failed (474) |
| postlexical | t_glottalization | 0 | 479 | select_where_failed (479) |
| postlexical | the_prevocalic_reduction | 0 | 479 | select_where_failed (479) |
| normalization_lexical | tn_abbreviation | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_bare_number_request | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_clock_time | 0 | 248 | select_where_failed (248) |
| normalization_currency | tn_currency | 0 | 338 | select_where_failed (338) |
| normalization_date | tn_date | 0 | 338 | select_where_failed (338) |
| normalization_lexical | tn_date_text | 0 | 248 | select_where_failed (248) |
| normalization_decimal_fraction | tn_decimal | 0 | 338 | select_where_failed (338) |
| normalization_lexical | tn_dictionary_abbreviation | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_dotted_capitals | 0 | 248 | select_where_failed (248) |
| normalization_number_requests | tn_expand_number | 0 | 338 | select_where_failed (338) |
| normalization_number_groups | tn_expand_number_group | 0 | 338 | select_where_failed (338) |
| normalization_lexical | tn_forced_comma | 0 | 248 | select_where_failed (248) |
| normalization_decimal_fraction | tn_fraction | 0 | 338 | select_where_failed (338) |
| normalization_lexical | tn_initial | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_initialism | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_lone_dash | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_lone_period | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_marked_word | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_money_text | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_number_token | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_parser_clause_end | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_parser_pause | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_parser_phones | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_plural_number | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_silent_mark | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_spell_mode_first_verb | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_spell_mode_wh_mark | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_spell_mode_word | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_spelled_capitals | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_stripped_mark | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_stripped_parenthesis_mark | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_symbol_word | 0 | 248 | select_where_failed (248) |
| normalization_terminal_words | tn_terminal_words | 338 | 338 | none recorded |
| normalization_time | tn_time | 0 | 338 | select_where_failed (338) |
| normalization_lexical | tn_unmatched_words | 248 | 248 | none recorded |
| normalization_lexical | tn_whole_word | 0 | 248 | select_where_failed (248) |
| normalization_date | tn_year | 0 | 338 | select_where_failed (338) |
| postlexical | to_reduction | 0 | 479 | select_where_failed (479) |
| prosody | tobi_accent | 0 | 627 | select_where_failed (627) |
| prosody | tobi_baseline_init | 20 | 627 | select_where_failed (607) |
| prosody | tobi_boundary_low | 20 | 627 | select_where_failed (607) |
| prosody | tobi_boundary_rise | 25 | 627 | select_where_failed (602) |
| prosody | tobi_initial_boundary_high | 0 | 627 | select_where_failed (627) |
| prosody | tobi_phrase_accent_high | 0 | 627 | select_where_failed (627) |
| prosody | tobi_phrase_accent_low | 45 | 627 | select_where_failed (582) |
| prosody | tobi_register_reset | 0 | 627 | select_where_failed (627) |
| prosody | tobi_unaccented_declination | 379 | 627 | select_where_failed (248) |
| (unscheduled) | transition_override | 0 | 0 | none recorded |
| duration | unstressed_consonant_shortening | 32 | 627 | select_where_failed (595) |
| formant | uw_coronal_fronting | 6 | 627 | select_where_failed (620) |
| formant | vcv_coarticulation | 29 | 627 | select_where_failed (507) |
| formant | vowel_rate_undershoot | 0 | 627 | select_where_failed (463) |
| formant | vowel_reduction | 51 | 627 | select_where_failed (576) |
| duration | vowel_shortening | 164 | 627 | select_where_failed (463) |
| formant | weak_final_voiced_stop_closure_attenuation | 3 | 627 | select_where_failed (591) |
| formant | weak_stop_release_parallel_attenuation | 11 | 627 | select_where_failed (616) |
| duration | word_initial_lengthening | 112 | 627 | select_where_failed (515) |
| duration | word_medial_consonant_shortening | 126 | 627 | select_where_failed (501) |

### Zero recorded firings

- duration/accent_vowel_lengthening
- (unscheduled)/assign_accent
- (unscheduled)/assign_accent_types
- annotation/assign_long_phrase_break
- annotation/assign_metrical_accent
- prosody/associate_accent_tones
- prosody/associate_initial_tone
- postlexical/d_flapping
- duration/duration_floor_from_inventory
- prosody/f0_continuation_rise
- (unscheduled)/hertz_nucleus_floor
- (unscheduled)/hertz_nucleus_timing
- (unscheduled)/identify_nuclear_accent
- structural/insert_mapped_voiced_release_final
- structural/insert_mapped_voiceless_release_and_aspiration_final
- (unscheduled)/mark_function_words
- normalize/normalize_schwa
- normalize/normalize_wh_merger
- postlexical/palatalization_ty
- duration/pause_rate_scaling
- duration/speech_rate_scaling
- orthography/spelling_mode_letter_names
- duration/stop_unreleasing
- postlexical/t_glottalization
- postlexical/the_prevocalic_reduction
- normalization_lexical/tn_abbreviation
- normalization_lexical/tn_bare_number_request
- normalization_lexical/tn_clock_time
- normalization_currency/tn_currency
- normalization_date/tn_date
- normalization_lexical/tn_date_text
- normalization_decimal_fraction/tn_decimal
- normalization_lexical/tn_dictionary_abbreviation
- normalization_lexical/tn_dotted_capitals
- normalization_number_requests/tn_expand_number
- normalization_number_groups/tn_expand_number_group
- normalization_lexical/tn_forced_comma
- normalization_decimal_fraction/tn_fraction
- normalization_lexical/tn_initial
- normalization_lexical/tn_initialism
- normalization_lexical/tn_lone_dash
- normalization_lexical/tn_lone_period
- normalization_lexical/tn_marked_word
- normalization_lexical/tn_money_text
- normalization_lexical/tn_number_token
- normalization_lexical/tn_parser_clause_end
- normalization_lexical/tn_parser_pause
- normalization_lexical/tn_parser_phones
- normalization_lexical/tn_plural_number
- normalization_lexical/tn_silent_mark
- normalization_lexical/tn_spell_mode_first_verb
- normalization_lexical/tn_spell_mode_wh_mark
- normalization_lexical/tn_spell_mode_word
- normalization_lexical/tn_spelled_capitals
- normalization_lexical/tn_stripped_mark
- normalization_lexical/tn_stripped_parenthesis_mark
- normalization_lexical/tn_symbol_word
- normalization_time/tn_time
- normalization_lexical/tn_whole_word
- normalization_date/tn_year
- postlexical/to_reduction
- prosody/tobi_accent
- prosody/tobi_initial_boundary_high
- prosody/tobi_phrase_accent_high
- prosody/tobi_register_reset
- (unscheduled)/transition_override
- formant/vowel_rate_undershoot

### Recognition outcomes

| Rule | Accepted | Ineligible | Overlap | Unmatched |
| --- | ---: | ---: | ---: | ---: |
| (unmatched) | 0 | 0 | 0 | 114 |
| tn_abbreviation_source | 0 | 0 | 0 | 0 |
| tn_accented_word_source | 0 | 0 | 0 | 0 |
| tn_bare_decimal_source | 0 | 0 | 0 | 0 |
| tn_cardinal_source | 0 | 0 | 0 | 0 |
| tn_clock_time_source | 0 | 0 | 0 | 0 |
| tn_closing_mark_source | 0 | 0 | 0 | 0 |
| tn_currency_source | 0 | 0 | 0 | 0 |
| tn_date_text_source | 0 | 0 | 0 | 0 |
| tn_date_token_source | 0 | 0 | 0 | 0 |
| tn_decimal_source | 0 | 0 | 0 | 0 |
| tn_dictionary_abbreviation_source | 0 | 20 | 0 | 0 |
| tn_digit_apostrophe_source | 0 | 0 | 0 | 0 |
| tn_digit_colon_source | 0 | 0 | 0 | 0 |
| tn_dotted_capitals_source | 0 | 0 | 0 | 0 |
| tn_dotted_word_source | 0 | 0 | 0 | 0 |
| tn_europe_money_text_source | 0 | 0 | 0 | 0 |
| tn_europe_number_token_source | 0 | 0 | 0 | 0 |
| tn_europe_plural_number_source | 0 | 0 | 0 | 0 |
| tn_explicit_time_source | 0 | 0 | 0 | 0 |
| tn_fraction_source | 0 | 0 | 0 | 0 |
| tn_hyphenated_word_source | 0 | 134 | 0 | 0 |
| tn_initial_source | 0 | 0 | 0 | 0 |
| tn_initialism_source | 0 | 0 | 0 | 0 |
| tn_iso_date_source | 0 | 0 | 0 | 0 |
| tn_lone_dash_source | 0 | 0 | 0 | 0 |
| tn_lone_period_source | 0 | 0 | 0 | 0 |
| tn_mark_after_phonemic_source | 0 | 0 | 0 | 0 |
| tn_mark_stripped_with_quote_source | 0 | 0 | 0 | 0 |
| tn_marked_word_source | 0 | 0 | 0 | 0 |
| tn_money_text_source | 0 | 0 | 0 | 0 |
| tn_number_abbreviation_source | 0 | 0 | 0 | 0 |
| tn_number_percent_source | 0 | 0 | 0 | 0 |
| tn_number_token_source | 0 | 0 | 0 | 0 |
| tn_opening_mark_source | 0 | 0 | 0 | 0 |
| tn_ordinal_source | 0 | 0 | 0 | 0 |
| tn_parser_clause_end_after_period_word_source | 0 | 0 | 0 | 0 |
| tn_parser_clause_end_source | 0 | 0 | 0 | 0 |
| tn_parser_pause_source | 0 | 0 | 0 | 0 |
| tn_parser_phones_source | 0 | 0 | 0 | 0 |
| tn_part_number_source | 0 | 134 | 0 | 0 |
| tn_period_before_mark_source | 0 | 0 | 0 | 0 |
| tn_plural_number_source | 0 | 0 | 0 | 0 |
| tn_plus_word_source | 0 | 0 | 0 | 0 |
| tn_sign_word_source | 0 | 0 | 0 | 0 |
| tn_signed_number_source | 0 | 0 | 0 | 0 |
| tn_slash_dash_word_source | 0 | 0 | 0 | 0 |
| tn_slash_date_source | 0 | 0 | 0 | 0 |
| tn_slash_word_source | 0 | 0 | 0 | 0 |
| tn_spell_mode_first_verb_source | 0 | 0 | 0 | 0 |
| tn_spell_mode_wh_mark_source | 0 | 0 | 0 | 0 |
| tn_spell_mode_word_source | 0 | 0 | 0 | 0 |
| tn_spelled_capitals_source | 0 | 0 | 0 | 0 |
| tn_spelled_number_source | 0 | 0 | 0 | 0 |
| tn_stripped_parenthesis_mark_source | 0 | 0 | 0 | 0 |
| tn_symbol_word_source | 0 | 0 | 0 | 0 |
| tn_time_source | 0 | 0 | 0 | 0 |
| tn_underscore_word_source | 0 | 0 | 0 | 0 |
| tn_word_source | 134 | 0 | 0 | 0 |
| tn_year_source | 0 | 0 | 0 | 0 |

## qlatt-english

Compiled rulepack SHA-256: 01b4006fc4dfe8b8692c92b9a7fe69337b7c6cec70ff8be11030dab0d80e9861.

| Phase | Rule | Fires / firing units | Recorded attempts | Most common failure |
| --- | --- | ---: | ---: | --- |
| prosody | accent_index_in_phrase | 94 | 627 | select_where_failed (533) |
| duration | accent_vowel_lengthening | 132 | 627 | select_where_failed (495) |
| duration | aspiration_frication_carryover | 41 | 627 | select_where_failed (586) |
| annotation | assign_accent | 582 | 627 | select_where_failed (45) |
| annotation | assign_accent_types | 94 | 627 | select_where_failed (533) |
| annotation | assign_initial_boundary_tone | 582 | 627 | select_where_failed (45) |
| annotation | assign_long_phrase_break | 102 | 627 | select_where_failed (525) |
| (unscheduled) | assign_metrical_accent | 0 | 0 | none recorded |
| annotation | assign_phrase_edge_tones | 45 | 627 | select_where_failed (582) |
| annotation | assign_punctuation_break_index | 45 | 627 | select_where_failed (582) |
| annotation | assign_word_boundary_break_index | 133 | 627 | select_where_failed (494) |
| prosody | associate_accent_tones | 94 | 627 | select_where_failed (533) |
| prosody | associate_edge_tones | 45 | 627 | select_where_failed (582) |
| prosody | associate_initial_tone | 0 | 627 | select_where_failed (627) |
| formant | burst_spectral_template | 111 | 627 | select_where_failed (516) |
| annotation | cluster_position_annotation | 418 | 627 | select_where_failed (209) |
| duration | cluster_shortening | 418 | 627 | select_where_failed (209) |
| prosody | connected_speech_source_contour | 379 | 627 | select_where_failed (248) |
| postlexical | d_deletion | 6 | 479 | select_where_failed (473) |
| postlexical | d_flapping | 0 | 479 | select_where_failed (479) |
| formant | dark_l_allophony | 18 | 627 | select_where_failed (609) |
| duration | duration_cap | 582 | 627 | select_where_failed (45) |
| duration | duration_floor_default | 516 | 627 | select_where_failed (111) |
| duration | duration_floor_from_inventory | 507 | 627 | select_where_failed (120) |
| duration | duration_floor_stop_release | 111 | 627 | select_where_failed (516) |
| structural | expand_affricates_with_closure | 4 | 480 | select_where_failed (476) |
| structural | expand_diphthongs | 23 | 484 | select_where_failed (461) |
| structural | expand_rhotic_vowels | 9 | 507 | select_where_failed (498) |
| prosody | f0_continuation_rise | 0 | 627 | select_where_failed (627) |
| prosody | f0_voiced_onset_perturbation | 19 | 627 | select_where_failed (608) |
| prosody | f0_voiceless_onset_perturbation | 61 | 627 | select_where_failed (566) |
| formant | f1_stop_onset | 70 | 627 | select_where_failed (557) |
| duration | fricative_minimum_duration | 108 | 627 | select_where_failed (519) |
| postlexical | glottal_stop_insertion | 2 | 478 | select_where_failed (476) |
| duration | hertz_nucleus_floor | 14 | 627 | select_where_failed (613) |
| duration | hertz_nucleus_timing | 14 | 627 | select_where_failed (613) |
| annotation | identify_nuclear_accent | 94 | 627 | select_where_failed (533) |
| structural | insert_mapped_voiced_release | 29 | 598 | select_where_failed (569) |
| structural | insert_mapped_voiced_release_final | 0 | 627 | select_where_failed (627) |
| structural | insert_mapped_voiceless_release_and_aspiration | 41 | 516 | select_where_failed (475) |
| structural | insert_mapped_voiceless_release_and_aspiration_final | 0 | 598 | select_where_failed (598) |
| duration | lock_stop_release_duration | 111 | 627 | select_where_failed (516) |
| annotation | mark_function_words | 627 | 627 | none recorded |
| formant | nasal_murmur_targets | 32 | 627 | select_where_failed (595) |
| formant | nasal_place_assignment | 32 | 627 | select_where_failed (595) |
| formant | nasal_place_assimilation | 10 | 627 | select_where_failed (607) |
| formant | nasal_windows | 32 | 627 | select_where_failed (595) |
| duration | non_word_initial_consonant_shortening | 190 | 627 | select_where_failed (437) |
| normalize | normalize_schwa | 0 | 479 | select_where_failed (479) |
| normalize | normalize_velar_nasal | 1 | 479 | select_where_failed (478) |
| normalize | normalize_wh_merger | 0 | 479 | select_where_failed (479) |
| postlexical | palatalization_dy | 1 | 479 | pattern_step_failed (478) |
| postlexical | palatalization_ty | 0 | 478 | pattern_step_failed (478) |
| duration | pause_rate_scaling | 0 | 627 | select_where_failed (582) |
| formant | place_f2_locus | 120 | 627 | select_where_failed (507) |
| formant | place_rel_copy | 61 | 627 | select_where_failed (566) |
| duration | polysyllabic_shortening | 110 | 627 | select_where_failed (517) |
| duration | pre_boundary_lengthening | 307 | 627 | select_where_failed (258) |
| duration | punctuation_pause | 45 | 627 | select_where_failed (582) |
| formant | r_f3_lowering | 25 | 627 | select_where_failed (602) |
| structural | remap_stops_to_closures | 81 | 480 | select_where_failed (399) |
| duration | s_cluster_aspiration_reduction | 10 | 627 | select_where_failed (586) |
| formant | schwa_coronal_fronting | 23 | 627 | select_where_failed (601) |
| duration | speech_rate_scaling | 0 | 627 | constraint_failed (582) |
| orthography | spelling_mode_letter_names | 0 | 179 | select_where_failed (179) |
| duration | stop_unreleasing | 0 | 627 | select_where_failed (557) |
| duration | stress_duration | 164 | 627 | select_where_failed (463) |
| prosody | stress_spectral_tilt | 113 | 627 | select_where_failed (514) |
| formant | sw_default_assignment | 425 | 627 | select_where_failed (202) |
| formant | sw_explicit_override | 202 | 627 | select_where_failed (425) |
| annotation | syllable_count_annotation | 164 | 627 | select_where_failed (463) |
| postlexical | t_deletion | 2 | 479 | select_where_failed (477) |
| postlexical | t_flapping | 5 | 479 | select_where_failed (474) |
| postlexical | t_glottalization | 0 | 479 | select_where_failed (479) |
| postlexical | the_prevocalic_reduction | 0 | 479 | select_where_failed (479) |
| normalization_lexical | tn_abbreviation | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_bare_number_request | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_clock_time | 0 | 248 | select_where_failed (248) |
| normalization_currency | tn_currency | 0 | 338 | select_where_failed (338) |
| normalization_date | tn_date | 0 | 338 | select_where_failed (338) |
| normalization_lexical | tn_date_text | 0 | 248 | select_where_failed (248) |
| normalization_decimal_fraction | tn_decimal | 0 | 338 | select_where_failed (338) |
| normalization_lexical | tn_dictionary_abbreviation | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_dotted_capitals | 0 | 248 | select_where_failed (248) |
| normalization_number_requests | tn_expand_number | 0 | 338 | select_where_failed (338) |
| normalization_number_groups | tn_expand_number_group | 0 | 338 | select_where_failed (338) |
| normalization_lexical | tn_forced_comma | 0 | 248 | select_where_failed (248) |
| normalization_decimal_fraction | tn_fraction | 0 | 338 | select_where_failed (338) |
| normalization_lexical | tn_initial | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_initialism | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_lone_dash | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_lone_period | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_marked_word | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_money_text | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_number_token | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_parser_clause_end | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_parser_pause | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_parser_phones | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_plural_number | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_silent_mark | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_spell_mode_first_verb | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_spell_mode_wh_mark | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_spell_mode_word | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_spelled_capitals | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_stripped_mark | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_stripped_parenthesis_mark | 0 | 248 | select_where_failed (248) |
| normalization_lexical | tn_symbol_word | 0 | 248 | select_where_failed (248) |
| normalization_terminal_words | tn_terminal_words | 338 | 338 | none recorded |
| normalization_time | tn_time | 0 | 338 | select_where_failed (338) |
| normalization_lexical | tn_unmatched_words | 248 | 248 | none recorded |
| normalization_lexical | tn_whole_word | 0 | 248 | select_where_failed (248) |
| normalization_date | tn_year | 0 | 338 | select_where_failed (338) |
| postlexical | to_reduction | 0 | 479 | select_where_failed (479) |
| prosody | tobi_accent | 94 | 627 | select_where_failed (533) |
| prosody | tobi_baseline_init | 20 | 627 | select_where_failed (607) |
| prosody | tobi_boundary_low | 20 | 627 | select_where_failed (607) |
| prosody | tobi_boundary_rise | 25 | 627 | select_where_failed (602) |
| prosody | tobi_initial_boundary_high | 0 | 627 | select_where_failed (627) |
| prosody | tobi_phrase_accent_high | 0 | 627 | select_where_failed (627) |
| prosody | tobi_phrase_accent_low | 45 | 627 | select_where_failed (582) |
| prosody | tobi_register_reset | 0 | 627 | select_where_failed (627) |
| prosody | tobi_unaccented_declination | 72 | 627 | select_where_failed (555) |
| formant | transition_override | 627 | 627 | none recorded |
| duration | unstressed_consonant_shortening | 32 | 627 | select_where_failed (595) |
| formant | uw_coronal_fronting | 6 | 627 | select_where_failed (620) |
| formant | vcv_coarticulation | 29 | 627 | select_where_failed (507) |
| prosody | vocal_effort | 379 | 627 | select_where_failed (248) |
| formant | vowel_rate_undershoot | 0 | 627 | select_where_failed (463) |
| formant | vowel_reduction | 51 | 627 | select_where_failed (576) |
| duration | vowel_shortening | 164 | 627 | select_where_failed (463) |
| formant | weak_final_voiced_stop_closure_attenuation | 3 | 627 | select_where_failed (591) |
| formant | weak_stop_release_parallel_attenuation | 11 | 627 | select_where_failed (616) |
| duration | word_initial_lengthening | 112 | 627 | select_where_failed (515) |
| duration | word_medial_consonant_shortening | 126 | 627 | select_where_failed (501) |

### Zero recorded firings

- (unscheduled)/assign_metrical_accent
- prosody/associate_initial_tone
- postlexical/d_flapping
- prosody/f0_continuation_rise
- structural/insert_mapped_voiced_release_final
- structural/insert_mapped_voiceless_release_and_aspiration_final
- normalize/normalize_schwa
- normalize/normalize_wh_merger
- postlexical/palatalization_ty
- duration/pause_rate_scaling
- duration/speech_rate_scaling
- orthography/spelling_mode_letter_names
- duration/stop_unreleasing
- postlexical/t_glottalization
- postlexical/the_prevocalic_reduction
- normalization_lexical/tn_abbreviation
- normalization_lexical/tn_bare_number_request
- normalization_lexical/tn_clock_time
- normalization_currency/tn_currency
- normalization_date/tn_date
- normalization_lexical/tn_date_text
- normalization_decimal_fraction/tn_decimal
- normalization_lexical/tn_dictionary_abbreviation
- normalization_lexical/tn_dotted_capitals
- normalization_number_requests/tn_expand_number
- normalization_number_groups/tn_expand_number_group
- normalization_lexical/tn_forced_comma
- normalization_decimal_fraction/tn_fraction
- normalization_lexical/tn_initial
- normalization_lexical/tn_initialism
- normalization_lexical/tn_lone_dash
- normalization_lexical/tn_lone_period
- normalization_lexical/tn_marked_word
- normalization_lexical/tn_money_text
- normalization_lexical/tn_number_token
- normalization_lexical/tn_parser_clause_end
- normalization_lexical/tn_parser_pause
- normalization_lexical/tn_parser_phones
- normalization_lexical/tn_plural_number
- normalization_lexical/tn_silent_mark
- normalization_lexical/tn_spell_mode_first_verb
- normalization_lexical/tn_spell_mode_wh_mark
- normalization_lexical/tn_spell_mode_word
- normalization_lexical/tn_spelled_capitals
- normalization_lexical/tn_stripped_mark
- normalization_lexical/tn_stripped_parenthesis_mark
- normalization_lexical/tn_symbol_word
- normalization_time/tn_time
- normalization_lexical/tn_whole_word
- normalization_date/tn_year
- postlexical/to_reduction
- prosody/tobi_initial_boundary_high
- prosody/tobi_phrase_accent_high
- prosody/tobi_register_reset
- formant/vowel_rate_undershoot

### Recognition outcomes

| Rule | Accepted | Ineligible | Overlap | Unmatched |
| --- | ---: | ---: | ---: | ---: |
| (unmatched) | 0 | 0 | 0 | 114 |
| tn_abbreviation_source | 0 | 0 | 0 | 0 |
| tn_accented_word_source | 0 | 0 | 0 | 0 |
| tn_bare_decimal_source | 0 | 0 | 0 | 0 |
| tn_cardinal_source | 0 | 0 | 0 | 0 |
| tn_clock_time_source | 0 | 0 | 0 | 0 |
| tn_closing_mark_source | 0 | 0 | 0 | 0 |
| tn_currency_source | 0 | 0 | 0 | 0 |
| tn_date_text_source | 0 | 0 | 0 | 0 |
| tn_date_token_source | 0 | 0 | 0 | 0 |
| tn_decimal_source | 0 | 0 | 0 | 0 |
| tn_dictionary_abbreviation_source | 0 | 20 | 0 | 0 |
| tn_digit_apostrophe_source | 0 | 0 | 0 | 0 |
| tn_digit_colon_source | 0 | 0 | 0 | 0 |
| tn_dotted_capitals_source | 0 | 0 | 0 | 0 |
| tn_dotted_word_source | 0 | 0 | 0 | 0 |
| tn_europe_money_text_source | 0 | 0 | 0 | 0 |
| tn_europe_number_token_source | 0 | 0 | 0 | 0 |
| tn_europe_plural_number_source | 0 | 0 | 0 | 0 |
| tn_explicit_time_source | 0 | 0 | 0 | 0 |
| tn_fraction_source | 0 | 0 | 0 | 0 |
| tn_hyphenated_word_source | 0 | 134 | 0 | 0 |
| tn_initial_source | 0 | 0 | 0 | 0 |
| tn_initialism_source | 0 | 0 | 0 | 0 |
| tn_iso_date_source | 0 | 0 | 0 | 0 |
| tn_lone_dash_source | 0 | 0 | 0 | 0 |
| tn_lone_period_source | 0 | 0 | 0 | 0 |
| tn_mark_after_phonemic_source | 0 | 0 | 0 | 0 |
| tn_mark_stripped_with_quote_source | 0 | 0 | 0 | 0 |
| tn_marked_word_source | 0 | 0 | 0 | 0 |
| tn_money_text_source | 0 | 0 | 0 | 0 |
| tn_number_abbreviation_source | 0 | 0 | 0 | 0 |
| tn_number_percent_source | 0 | 0 | 0 | 0 |
| tn_number_token_source | 0 | 0 | 0 | 0 |
| tn_opening_mark_source | 0 | 0 | 0 | 0 |
| tn_ordinal_source | 0 | 0 | 0 | 0 |
| tn_parser_clause_end_after_period_word_source | 0 | 0 | 0 | 0 |
| tn_parser_clause_end_source | 0 | 0 | 0 | 0 |
| tn_parser_pause_source | 0 | 0 | 0 | 0 |
| tn_parser_phones_source | 0 | 0 | 0 | 0 |
| tn_part_number_source | 0 | 134 | 0 | 0 |
| tn_period_before_mark_source | 0 | 0 | 0 | 0 |
| tn_plural_number_source | 0 | 0 | 0 | 0 |
| tn_plus_word_source | 0 | 0 | 0 | 0 |
| tn_sign_word_source | 0 | 0 | 0 | 0 |
| tn_signed_number_source | 0 | 0 | 0 | 0 |
| tn_slash_dash_word_source | 0 | 0 | 0 | 0 |
| tn_slash_date_source | 0 | 0 | 0 | 0 |
| tn_slash_word_source | 0 | 0 | 0 | 0 |
| tn_spell_mode_first_verb_source | 0 | 0 | 0 | 0 |
| tn_spell_mode_wh_mark_source | 0 | 0 | 0 | 0 |
| tn_spell_mode_word_source | 0 | 0 | 0 | 0 |
| tn_spelled_capitals_source | 0 | 0 | 0 | 0 |
| tn_spelled_number_source | 0 | 0 | 0 | 0 |
| tn_stripped_parenthesis_mark_source | 0 | 0 | 0 | 0 |
| tn_symbol_word_source | 0 | 0 | 0 | 0 |
| tn_time_source | 0 | 0 | 0 | 0 |
| tn_underscore_word_source | 0 | 0 | 0 | 0 |
| tn_word_source | 134 | 0 | 0 | 0 |
| tn_year_source | 0 | 0 | 0 | 0 |
