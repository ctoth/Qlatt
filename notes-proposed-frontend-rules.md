# Frontend Rules — Implementation Progress

**Date:** 2026-02-26
**Based on:** reports/scout-current-frontend-rules.md, reports/scout-paper-inventory-for-rules.md

## Historical progress (2026-02-26 snapshot)

**Starting state:** 15 rules across 4 phases
**After 4 batches:** 42 rules (27 new rules added)

| Batch | Commit | Rules | Tests | Description |
|-------|--------|-------|-------|-------------|
| 1 | a83cf09 | 8 | 12 | Formant context: F2 locus by place, nasal FNZ, dark /l/, /r/ F3, F1 release |
| 2 | 5272e0e | 7 | 10 | S-cluster aspiration, vowel reduction, nasalization, consonant duration K-factors, fricative floors |
| 3 | 8c5f650 | 6 | 10 | F0 microprosody (onset perturbation, continuation rise), palatal F2, vowel shortening, burst templates |
| 4 | 1b37000 | 6 | 11 | Nasal assimilation, stop unreleasing, word-medial shortening, F0 question baseline, pitch reset, VCV coartic |

**Test suite:** 257 passed, 1 pre-existing failure

## Implemented entries verified 2026-10-21

These five former proposals have implementations in the selected Qlatt English frontend. Its [frontend declaration](public/rules/frontends/qlatt-english/frontend.yaml) imports the phase files, and its [pipeline](public/rules/frontends/qlatt-english/pipeline.yaml) lists the named rules for execution.

| Former proposal | Current implementation |
| --- | --- |
| `t_flapping` | [`t_flapping`](public/rules/frontends/qlatt-english/phases/postlexical.yaml) replaces eligible T with DX, rather than adjusting closure/release parameters. |
| `t_glottalization` | [`t_glottalization`](public/rules/frontends/qlatt-english/phases/postlexical.yaml) replaces eligible T with GS. |
| `polysyllabic_shortening` | [`polysyllabic_shortening`](public/rules/frontends/qlatt-english/phases/duration.yaml) multiplies vowel duration when `word_syllable_count > 1`. |
| `f0_downstep` | [`accent_index_in_phrase` and `tobi_accent`](public/rules/frontends/qlatt-english/phases/prosody.yaml) assign accent indices and use a downstep factor in F0 point values. |
| `dac_coarticulation_scaling` | [`vcv_coarticulation`](public/rules/frontends/qlatt-english/phases/formant.yaml) uses a DAC-derived weight to blend F1–F3 toward flanking-vowel targets. |

## Other historical proposals (not re-audited here)

The following eight entries retain their 2026-02-26 proposal wording. Their implementation status and stated prerequisites have not been rechecked; this list does not establish that they remain unimplemented.

- td_cluster_deletion: suppress T/D in coda clusters via splice
- progressive_phrase_final_lengthening: upgrade existing rule to apply progressively
- stable_transition_duration: insert transition segments (complex structural)
- accent_priority_by_pos: needs POS tags on word tokens
- f0_emphasis_boost: needs focus/emphasis marking
- word_initial_unstressed_polysyllabic: needs reliable syllable count
- phrasal_accent_lengthening: needs accent assignment
- tr_dr_affrication: needs modified affricate phonemes
