# Frontend Rules — Implementation Progress

**Date:** 2026-02-26
**Based on:** reports/scout-current-frontend-rules.md, reports/scout-paper-inventory-for-rules.md

## Progress

**Starting state:** 15 rules across 4 phases
**After 4 batches:** 42 rules (27 new rules added)

| Batch | Commit | Rules | Tests | Description |
|-------|--------|-------|-------|-------------|
| 1 | a83cf09 | 8 | 12 | Formant context: F2 locus by place, nasal FNZ, dark /l/, /r/ F3, F1 release |
| 2 | 5272e0e | 7 | 10 | S-cluster aspiration, vowel reduction, nasalization, consonant duration K-factors, fricative floors |
| 3 | 8c5f650 | 6 | 10 | F0 microprosody (onset perturbation, continuation rise), palatal F2, vowel shortening, burst templates |
| 4 | 1b37000 | 6 | 11 | Nasal assimilation, stop unreleasing, word-medial shortening, F0 question baseline, pitch reset, VCV coartic |

**Test suite:** 257 passed, 1 pre-existing failure

## Remaining (13 rules — most need upstream features)

### Feasible with effort (~5):
- t_flapping: model acoustically by adjusting T_CL/T_REL params in V_T_V context
- td_cluster_deletion: suppress T/D in coda clusters via splice
- progressive_phrase_final_lengthening: upgrade existing rule to apply progressively
- polysyllabic_shortening: approximate by counting vowels in word via look_back/ahead
- stable_transition_duration: insert transition segments (complex structural)

### Need upstream features (~8):
- accent_priority_by_pos: needs POS tags on word tokens
- f0_downstep: needs tone tracking (H/L sequence state)
- f0_emphasis_boost: needs focus/emphasis marking
- word_initial_unstressed_polysyllabic: needs reliable syllable count
- phrasal_accent_lengthening: needs accent assignment
- dac_coarticulation_scaling: needs DAC values on consonant inventory
- t_glottalization: needs glottal stop phoneme in inventory
- tr_dr_affrication: needs modified affricate phonemes
