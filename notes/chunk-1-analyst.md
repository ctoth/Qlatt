# Chunk 1 Analyst — Working Notes

Date: 2026-05-24
Branch: declarative-cleanup @ 5efa404f

## Findings so far

### Probe 1: predicate name collisions
Grepped 21 predicate names across src/ and rules. No source-code shadowing. No token-field collisions in inventory.yaml. dectalk-english/pipeline.yaml redefines `is_question_boundary` and `is_stressed_vowel` — same semantics, not a collision. CLEAN.

### Probe 2: has() guard correctness
Read pipeline.yaml predicates 1-21. Each predicate that accesses `prev.X`, `next.X`, or `current.X` guards with `has(...)`. Coronal predicates (`prev_coronal`/`next_coronal`/`both_coronal`/`one_coronal`) all guard both `.alveolar` and `.postalveolar` accesses. CLEAN.

### Probe 3: is_coda behavioral equivalence
Both original `is_coda` defines (dark_l_allophony L308-311, r_f3_lowering L336-339) are byte-identical — same CEL string using `n` alias. New predicate uses `next` directly. Behavior equivalent. CLEAN.

### Probe 4: coronal disjunction completeness
Inventory has `dental: true` on TH/DH (qlatt-english/inventory.yaml:623,646). Phonologically coronal — but original inline disjunction was also `alveolar || postalveolar` only. New predicate matches original exactly. Pre-existing semantic gap, NOT introduced by this refactor. Worth flagging as future work but not a blocker.

### Probe 5: prev_diff_word truth-table divergence — POTENTIAL ISSUE
Original ternary (duration.yaml:51-52 BEFORE):
`(prev == null ? true : (has(prev.word) && has(current.word) ? prev.word != current.word : true))`
- prev==null → true
- prev!=null && both .word present → returns inequality
- prev!=null && EITHER .word missing → **true**

New predicate: `prev == null || (has(prev.word) && has(current.word) && prev.word != current.word)`
- prev==null → true
- prev!=null && both .word present → returns inequality
- prev!=null && EITHER .word missing → **false**

**Semantic divergence in the missing-.word case.** Source check: tts-frontend.ts:373 always sets `word: ph.word` on every phone token; transcribe-text.ts:230,311 also always set `word`. So `has(token.word)` is essentially always true. Divergence is likely unreachable in practice but the predicate IS NOT semantically equivalent to the original ternary. Coder did not flag this.

### Probe 6: item 17 follow-up scope
prosody.yaml:642-672 — two rules check `prev.voiceless` and `prev.voiced` only. Also has `prev.type in ['stop_release', 'stop_aspiration']` and `prev.type in ['stop_closure', 'stop_release']` — these are type-set checks, not feature flags, no predicate currently covers them. Follow-up needs `prev_is_voiced` and `prev_is_voiceless` predicates. No other prev_is_X features in this range.

### Probe 7: pattern-step predicate refs
engine.ts:2377 — pattern step `where:` uses `functions.evaluateCondition` which IS the predicate-aware path (line 1185). Pattern steps DO support `{predicate: ...}`. A `next_diff_word` predicate `next == null || (has(next.word) && has(current.word) && next.word != current.word)` would cleanly convert postlexical.yaml:9 and :18.

### Probe 8: coverage gap audit
`git grep -nE "has\(prev\.(word|coronal|alveolar|postalveolar|bilabial|velar|voiced|voiceless|back_vowel|front_vowel|high_vowel)\)" -- public/rules/frontends/qlatt-english/phases/` → 3 matches. Need to enumerate which ones.

## Still to do
- Enumerate the 3 remaining inline prev-feature checks (probe 8).
- Check for `has(next.X)` inline checks too (symmetric coverage gap).
- Write final report.

## Verdict so far
ANALYST-CONCERNS likely — probe 5 (prev_diff_word divergence) is real, though probably unreachable. Pre-existing dental coronal gap worth flagging. Multiple follow-up predicates needed (prev_is_voiced, prev_is_voiceless, next_diff_word).
