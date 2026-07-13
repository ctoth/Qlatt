# Chunk dt-12: DECtalk fractions / ordinals / Roman numerals (declarative port)

Coder, branch `dectalk-parity`. 2026-05-29. Build on dt-8 (`801d76d6`) per-frontend
normalization policy. qlatt-english MUST stay byte-identical.

## DECtalk behavior as read from source (file:line)

### Fractions — `ls_proc_is_frac` / `ls_proc_do_frac` (`l_us_pr1.c:980-1069`)
- Detection (`:980-1015`): numerator 1-2 digits, no leading 0; `/`; denominator
  1-3 digits (if 3 digits MUST be exactly `100`), no leading 0; optional trailing `%`.
- Speaking (`:1034-1069`):
  - numerator via `ls_proc_do_number(...,FALSE)` = cardinal, then WBOUND (`:1044-45`).
  - denominator: if it is exactly the single char `'2'` → "half"/"halves"
    (`phalf`/`phalves`, plural when numerator plural) (`:1050-1052`).
  - else read denominator as **ordinal** (`ls_proc_do_number(...,TRUE)`, `:1056`),
    then if numerator was plural (pflag) append plural marker S or Z (`:1057-1063`):
    unit digit `ud='2'||'3'` → US_Z else US_S; if last two digits are teen (`'1'` in
    tens place) force `ud='0'` so plural is S.
  - trailing `%` → "percent" (`:1065-1068`).
  - Examples: `1/2`→"one half", `3/4`→"three fourths" (NOT "quarters" — denom 4 is
    ordinal "fourth"+plural), `1/3`→"one third", `5/8`→"five eighths",
    `1/100`→"one hundredth", `3/4%`→"three fourths percent".
  - NOTE: "quarter" is NOT used by digit fractions. `phalf` is the only special word;
    everything else is ordinal. (The mission's "3/4→three quarters" is the colloquial
    form; DECtalk actually says "three fourths". Implementing DECtalk's ACTUAL behavior
    per hard-stop (c).)

### Ordinals — `ls_util_is_ordinal` (`ls_util.c:517-572`)
- Pre-check: a parsed number with exactly the 2-char suffix after it, no sign/decimal/exp
  (`np->n_flp==NULL && n_elp==NULL`).
- unit digit `ud`; if tens digit is `'1'` (11-19) force `ud='0'` → suffix must be "th".
- `ud=='1'`→require "st"; `'2'`→"nd"; `'3'`→"rd"; default→"th". Match → TRUE.
- Spoken via `ls_proc_do_number(...,TRUE)` (ordinal flag): `1st`→"first",
  `21st`→"twenty first", `2nd`→"second", `11th`→"eleventh".

### Roman numerals — DOCUMENTED but NO SOURCE HANDLER FOUND (decision pending)
- Reference Guide (`docs/dtk_reference_guide_500.rtf` / `DTK_RG_5_0.ps:109856`,
  `docsosf/txt/dtk_reference_guide.txt:6060`): "Roman numerals following a name are
  spoken as ordinal numbers; for example John Doe III becomes John Doe the third".
- Source grep for `roman` across all of `dapi/src` LTS: ZERO matches in US code
  (`l_us_pr1.c`, `ls_task.c`, `ls_util.c`). Only `roman` hit is German
  `trennungstokens.h` (unrelated hyphenation).
- `ls_task.c:761` calls `ls_util_is_name`. Still need to read `ls_util_is_name` to
  see if the name+numeral→ordinal logic lives there. IN PROGRESS.
- Note the doc form is "the third" (the + ordinal), DIFFERENT from the mission's
  "the eighth" example which matches; mission "Henry VIII"→"Henry the eighth" is
  consistent with the doc rule.

## dt-8 pattern (from `git show 801d76d6`)
- frontend.yaml declares `normalization: { tables_path, pipeline_path }`.
- normalization-pipeline.yaml carries policy as DATA (e.g. `year_policy`) on the step.
- src/g2p/text-normalize.ts: generic config-driven `isYear`/`readYear` + a
  `readYearInline` BUILTIN handler reading params from step config. numberToWords NOT
  modified. qlatt-english declares no normalization block → defaults → byte-identical.
- Probe: scripts/dt8-year-probe.ts. vitest 1107 at dt-8 (mission says baseline 1119 now).

## Plan
1. Read `ls_util_is_name` to resolve Roman-numeral question definitively.
2. Read text-normalize.ts dt-8 additions + dectalk normalization YAMLs + tables.
3. Add generic `readFraction`, `readOrdinal` (+ `readRoman` IFF source does it) handlers.
4. Policy/word tables as DATA in dectalk normalization YAML.
5. Probe scripts/dt12-number-probe.ts. vitest green. qlatt unchanged.

## RESOLVED: Roman numerals — SKIP (hard-stop c)
- `ls_util_is_name` (ls_util.c:456-489) is an ACNA name-MODE flag, NOT roman parsing;
  returns FALSE in standard (non-ACNA) build.
- Full `ls_proc_*` prototype list (ls_prot.h): do_/do_date/do_digit_group/do_frac/
  do_group/do_number/do_part_number/do_sign/do_time/is_a_part/is_am_pm/is_date/
  is_frac/is_time/non_zero. NO roman function exists anywhere in dapi/src LTS.
- DECtalk 4.63 docs (DTK_RG_5_0.ps:109856, dtk_reference_guide.txt:6060) DESCRIBE
  "Roman numerals following a name → ordinal (John Doe III → the third)" but the
  4.63 LTS C source does NOT implement it. Decision: SKIP Roman numerals, faithful
  to actual source per hard-stop (c). Documented discrepancy.

## RESOLVED: Ordinals already work for dectalk
- dectalk normalization-pipeline.yaml ALREADY has `expand_ordinals`
  (ordinalToWordsInline → convertOrdinal). `21st`→"twenty first", `1st`→"first",
  `2nd`→"second" already correct. No new ordinal handler needed; just verify in probe.

## Fraction conflict: mission examples vs DECtalk source
- Mission asks "3/4"→"three quarters". DECtalk source `ls_proc_do_frac` (l_us_pr1.c:
  1050-1063) only special-cases denom=="2"→half/halves; ALL other denoms read as
  ORDINAL + plural-s. So DECtalk says "3/4"→"three fourths", NOT "three quarters".
  Implementing DECtalk's ACTUAL behavior (hard-stop c). "quarter" NOT hardcoded.
- Plural rule: numerator plural (value != 1) → append "s" to ordinal word.
  "1/2"→"one half", "3/4"→"three fourths", "1/3"→"one third", "5/8"→"five eighths",
  "1/100"→"one hundredth", "3/4%"→"three fourths percent".

## Design (mirrors dt-8 year_policy)
- New BUILTIN handler `readFractionInline` in text-normalize.ts: generic, reads
  `fraction_policy` from step config (DATA): `special_denominators` map
  {"2": {singular:"half", plural:"halves"}}, `percent_word: "percent"`. Uses existing
  numberToWords (numerator cardinal) + convertOrdinal (denom ordinal) + append "s"
  when numerator value != 1. numberToWords NOT modified.
- New pipeline step `expand_fractions` in dectalk normalization-pipeline.yaml BEFORE
  expand_ordinals/expand_years (so "3/4" matched as fraction before digits read
  individually). Pattern: \b([1-9]\d?)/([1-9]\d{0,2})(%?)\b with detection guard
  (denom 3 digits must == 100) inside handler.
- Probe scripts/dt12-number-probe.ts: fractions+ordinals for dectalk; same inputs
  qlatt-english unchanged (no expand_fractions step there).

## State — IMPLEMENTED
- vitest baseline 1119/1119 (126 files). AFTER implementation: STILL 1119/1119 →
  qlatt-english byte-identical confirmed (no test delta).
- dt-8 year probe: still ALL PASS (no regression).
- dt-12 probe (scripts/dt12-number-probe.ts): ALL PASS.
- Surprise corrected: `1/100` DECtalk = "one one hundredth" (numerator "one" +
  denom-ordinal "one hundredth"), NOT "one hundredth". My initial expectation was
  wrong; source ls_proc_do_frac confirms numerator cardinal + denom ordinal. Fixed
  probe expectation. Code was correct.

## Files changed
- src/g2p/text-normalize.ts: + FractionPolicy interface, + fraction_policy on
  PipelineStep, + isFraction()/readFraction() generic fns, + readFractionInline
  BUILTIN handler. numberToWords UNCHANGED. convertOrdinal reused (no change).
- public/rules/frontends/dectalk-english/normalization-pipeline.yaml: + expand_fractions
  step (before expand_ordinals) carrying fraction_policy DATA.
- scripts/dt12-number-probe.ts: new probe (kept).
- normalization-tables.yaml: NOT modified (ordinal_ones/teens/tens already present;
  half/halves live in the step's fraction_policy as DATA, not a global table).

## Golden — only pre-existing lf-source fails (no new failure)
- `npm run test:golden` exit 1. Runner (scripts/run-golden.ts) calls 3 scripts.
  Isolated each: lf-source-wasm-compare.ts EXIT=1 (pre-existing, maxDelta 0.79);
  render-phrase.ts EXIT=0 (full synth render PASS); klatt-tract-wasm-compare.ts
  EXIT=0 (PASS). Only lf-source fails, exactly as mission flagged. My changes touch
  only text-normalize.ts + dectalk normalization YAML — no DSP/synth path.

## DONE — all DoD met
1. Fractions read DECtalk-correct via generic readFractionInline + fraction_policy DATA;
   ordinals confirmed working via existing expand_ordinals. Roman SKIPPED (no source).
2. dt-12 probe: dectalk correct, qlatt-english fractions NOT expanded (no leak), ordinals
   shared. ALL PASS.
3. qlatt-english byte-identical: vitest 1119/1119 unchanged; golden no new failure
   beyond lf-source.
4. This notes file documents source behavior, handlers, data policy, probe, no-leak.
NO git add/commit performed (hard-stop d).
