# Chunk dt-8: DECtalk 4.63 Number-Reading Recon (declarative port design)

Scout, read-only. 2026-05-29. Every claim cites file:line. RECON ONLY — nothing changed.
Prereq read: `notes/dectalk-gap-A-text2phoneme.md` (items A-G1/G2/G3/G11).

---

## 0. TL;DR + one surprising correction to gap report A

- DECtalk reads a bare 4-digit string like `1984` as a **year**: "nineteen eighty four"
  (two 2-digit halves), via `ls_util_is_year` → `ls_proc_do_4_digits`
  (`ls_task.c:3786,3790`; `l_us_pr1.c:367`). Qlatt's generic `numberToWords`
  reads it as the cardinal "one thousand nine hundred eighty four"
  (`text-normalize.ts:128-183`). Confirmed gap.

- **SURPRISE / correction:** gap report A claimed `1905` → "nineteen oh five".
  That is **NOT** what plain 4-digit reading does. `ls_proc_do_4_digits` on `1905`
  reads first half `19` ("nineteen") then second half `05` via `ls_proc_do_2_digits`;
  because the leading digit of `05` is `'0'`, that path calls `ls_spel_spell` on the
  two chars (`l_us_pr1.c:299-300`), which **spells the digits**: "zero five". So
  plain DECtalk `1905` → "nineteen zero five", NOT "nineteen oh five".
  - The "oh" phoneme (`pOH = {S1, US_OW, SIL}`, stressed "oh", `l_us_con.c:638-640`)
    is inserted in **exactly one place**: `ls_proc_do_date` for a dashed date whose
    trailing year is the `X00Y` / `200X` shape (`l_us_pr1.c:944-950`). E.g.
    `23-Aug-2005` → "...twenty oh five". It is gated by a specific digit test, not
    by general year reading. The bare-string `2005` is not even a year by
    `ls_util_is_year` (middle "00" rejected, see §1.1) so it reads as cardinal
    "two thousand five" (`ls_proc_do_number`).
  - There is dead code `#ifdef LIKE_BUGS` at `l_us_pr1.c:935-938` that would prepend
    `pteens[9]` ("nineteen") to a 2-digit dashed-date year — disabled (BATS 266,
    rev 010, "remove 19xx expansion", `l_us_pr1.c:45`).

- DECtalk number reading lives entirely in **C** (`LTS/l_us_pr1.c`, dispatched from
  `LTS/ls_task.c`), driven by phoneme-list constant tables (`LTS/l_us_con.c`). It is
  NOT data-driven in the YAML sense — but the *tables* (teens/tens/units/ordinals)
  and the *thresholds* (year = 4 digits, no leading 0, middle != "00") are pure data;
  only the dispatch control flow is code.

- Qlatt's normalizer is a **single shared TS implementation**
  (`src/g2p/text-normalize.ts`) whose table/pipeline paths are **hardcoded to
  `qlatt-english`** (`text-normalize.ts:65-66`). `tts-frontend.ts` calls it
  unconditionally with no frontend argument (`tts-frontend.ts:341`
  `const normalized = normalizeText(inputText)`). So today `dectalk-english` shares
  qlatt-english number behavior. Making dectalk read years correctly REQUIRES a
  per-frontend hook — currently absent.

---

## 1. DECtalk 4.63 number-reading algorithm (file:line)

Dispatch order (all in `ls_task.c`, the "what kind of token is this" cascade):
currency `ls_task_currency_processing` → date/time `ls_task_date_processing`
(`:3589`, calls `ls_proc_is_date`/`ls_proc_is_time`/`ls_proc_is_frac` indirectly)
→ fraction `ls_task_frac_processing` (`:3688`, `ls_proc_is_frac` `:3698`) → plain
number `ls_task_plain_number_processing` (`:3747`). So a token is tried as
currency, then date, then fraction, then "plain number" (which itself handles
years, ordinals, plurals, %, etc.).

### 1.1 Year detection: `ls_util_is_year` (`ls_util.c:598-622`)
A digit string is a YEAR iff ALL hold:
- every char is a digit (`:605-610`);
- exactly **4** digits (`ndig != 4` → false, `:615`);
- first digit **not `'0'`** (`0100` not a year, `:617`);
- the **middle two digits are not both `'0'`** (`(llp+1)=='0' && (llp+2)=='0'` →
  false, `:619-620`). Doc comment: "2000 is best read as a number, and 2002 sounds
  stupid as twenty zero two" (`:584-586`).
- not a `1/2`/`1/4` glyph (`:613`).

So: **range is effectively 1000–9999 minus the `_00_` band** (1000–1099, 2000–2099,
3000–3099, ... are NOT years; 1100–1999, 2100–2999, ... ARE). No upper bound check
beyond 4 digits — `8723` IS classified a year and read "eighty seven twenty three".
There is no semantic 1100–2999 clamp; it is purely "4 digits, no leading 0, middle
!= 00".

Call sites (all require `pLts_t->sign==0`, i.e. no leading +/-):
- bare all-digit token: `ls_task.c:3786` → `ls_proc_do_4_digits(llp)` (`:3790`).
- `60s` / `60's` plural: `ls_task.c:3950,4037` → `ls_proc_do_4_digits` for 4-digit
  decade like `1980s`.

### 1.2 Year speaking: `ls_proc_do_4_digits` (`l_us_pr1.c:367-398`)
For digits `ABCD`:
- `A=='0'` → spell all 4 (`:369-370`). (Can't happen for a year; is_year forbids.)
- `CD=='00'` and `B=='0'` → "A thousand" (`upunits[A]` + `pthousand`, `:375-381`).
  e.g. `1000` would be — but `1000` isn't a year (middle 00), so reached only via
  non-year callers.
- `CD=='00'` and `B!='0'` → read `AB` as 2 digits + "hundred"
  (`ls_proc_do_2_digits(AB)` + `phundred`, `:384-387`). e.g. `1900`→"nineteen hundred",
  `1100`→"eleven hundred".
- else → read `AB` as 2 digits, WBOUND, read `CD` as 2 digits
  (`ls_proc_do_2_digits(AB)` + `ls_proc_do_2_digits(CD)`, `:392-394`).
  e.g. `1984`→"nineteen" + "eighty four"; `1905`→"nineteen" + (CD=`05`).

`ls_proc_do_2_digits` (`l_us_pr1.c:297-315`) for two chars `XY`:
- `X=='0'` → **spell** both chars (`:299-300`), i.e. "zero five" for `05`
  (NOT "oh five"). **This is the key correction to gap report A.**
- `X=='1'` → teen: `pteens[Y]` (`:303-304`) ("ten".."nineteen").
- else → `ptens[X]` ("twenty".."ninety", `:307`); if `Y!='0'` add `punits[Y]`
  ("one".."nine", `:308-311`).

So worked examples (plain bare strings, US English):
| input | classified | spoken |
|-------|-----------|--------|
| `1984` | year | nineteen eighty four |
| `1900` | year | nineteen hundred |
| `1905` | year | nineteen zero five |
| `1066` | year | ten sixty six |
| `2010` | year (middle "01" ok) | twenty ten |
| `2000` | NOT year (middle 00) → cardinal | two thousand |
| `2005` | NOT year (middle 00) → cardinal | two thousand five |
| `2025` | year | twenty twenty five |
| `0100` | NOT year (lead 0) → cardinal | one hundred (leading-0 path spells) |
| `1980s`| year + plural | nineteen eighties (via `ls_util_pluralize`) |

(`2000`→cardinal confirmed: `ls_util_is_year` rejects, falls to
`ls_proc_do_number` at `ls_task.c:3813`. The DECtalk "two thousand and N" vs
"twenty oh N" debate is resolved by DECtalk as: bare `2005` = cardinal
"two thousand five"; only the **dashed-date** `...-2005` path emits "oh".)

### 1.3 "oh" insertion — date path only (`ls_proc_do_date`, `l_us_pr1.c:883-961`)
Reached only when `ls_proc_is_date` matched (`ls_util.c`/`l_us_pr1.c:815-863`):
format is `D[D]-MON-YY[YY]` (digits, dash, 3-alpha month from `months[]`, dash, 2 or 4
digit year). For the 4-digit trailing year (`:942-958`):
- if shape is `B!='0' && C=='0' && D=='0' && E!='0'` ... actually the test
  (`:944`) is `(lp1+1)!='0' && (lp1+2)=='0' && (lp1+3)=='0' && (lp1+4)!='0'` — a
  `_X00Y_`-style "200X" detection on the year quartet — then: read first 2 digits,
  WBOUND, emit `pOH` ("oh"), emit `punits[last]` (`:947-950`). E.g.
  `23-Aug-2005` year `2005` → "twenty" + "oh" + "five".
- else → `ls_proc_do_4_digits` on the year (`:957`).

This is the ONLY `pOH` emission in number/date code (`l_us_con.c:638` is the only
definition; grep'd: used at `l_us_pr1.c:949` only).

### 1.4 Cardinals / magnitudes: `ls_proc_do_number` (`l_us_pr1.c:497-768`)
General integer reader. Right-justifies into an 18-char buffer (`:596-608`) then
emits groups quadrillion/trillion/billion/million/thousand/units via
`ls_proc_do_digit_group` (`:609-717`). Inserts "and" between hundreds and the
sub-hundred remainder (`pand`, `:439`) and "and" / comma between magnitude groups
(`:625-628` etc.). Returns `pflag` = plural (TRUE unless the value is exactly "1",
`:605-606`). Handles user thousands-separators (`schar`), trailing decimal point
(`fchar` → "point" + digit-by-digit, `:731-749`), scientific `e` exponent
(recursion, `:750-766`), and `¼ ½ ²  ³` glyphs (`:513-517,724-729`).

`ls_proc_do_digit_group` (`l_us_pr1.c:422-470`) reads a 3-digit group with an
`oflag` (ordinal flag): when `oflag` set it emits ordinal endings (`US_TH`,
`US_IX US_TH`, or `pordin[unit]`) instead of cardinal units (`:433-469`). This is
how dates ("the fourth"), fractions ("one fourth"), and ordinals share one reader.

### 1.5 Ordinals: `ls_util_is_ordinal` (`ls_util.c:517-572`)
Caller pre-checks: no sign, exactly 2 trailing chars after the parsed number
(`ls_task.c:3944,3969`). Logic on the unit digit `ud`:
- if tens digit == '1' (i.e. 11–19), force `ud='0'` so suffix must be "th"
  (`:531-532`).
- `ud=='1'` → require suffix `st`; `'2'`→`nd`; `'3'`→`rd`; default → `th`
  (`:534-555`). Returns TRUE on match.
On TRUE, spoken via `ls_proc_do_number(..., TRUE)` (oflag set), e.g.
`21st`→"twenty first", `1st`→"first", `11th`→"eleventh" (`ls_task.c:3971`).

### 1.6 Fractions: `ls_proc_is_frac` (`l_us_pr1.c:980-1015`) / `ls_proc_do_frac` (`:1034-1069`)
Detection: numerator 1–2 digits, no leading 0; `/`; denominator 1–3 digits
(if 3 digits, must be exactly `100`), no leading 0; optional trailing `%`
(`:984-1014`). Speaking:
- numerator via `ls_proc_do_number` (cardinal), WBOUND (`:1044-1045`).
- denominator: if it is exactly `2` → "half"/"halves" (`phalf`/`phalves`,
  `:1050-1052`); else read as **ordinal** (`ls_proc_do_number(...,TRUE)`, `:1056`)
  and pluralize with S/Z if numerator was plural (`:1057-1063`).
  e.g. `3/4`→"three fourths", `1/2`→"one half", `1/3`→"one third",
  `1/100`→"one hundredth". Trailing `%` → "percent" (`ppercent`, `:1067`).
Note: also `½`/`¼` glyphs handled inline in `ls_proc_do_number` (`:513-517,724-729`).

### 1.7 Decimals, currency, %, degrees, plurals, time
- **Decimal** (`3.14`): handled inside `ls_proc_do_number` fraction-digit branch
  (`l_us_pr1.c:731-749`) → integer + "point" + each digit spoken individually.
- **Currency** `$`/`£`/`€` (`ls_task.c:3181-3514`): "$3"→"three dollars",
  "$3.24"→"three dollars and twenty four cents", "$3.240"→spelled-out decimal;
  lookahead for "million"/"billion" word (`nwdtab`, `:3235-3308`).
- **`%`** → "percent"; **`¢`/`°`** → "cents"/"degrees" (`ls_task.c:4049-4060`).
- **Plurals** `60s`/`60's` → `ls_util_pluralize` (`ls_task.c:3948-3962,4035-4047`).
- **Time** `HH:MM[:SS][.f]` + am/pm (`ls_proc_is_time`/`ls_proc_do_time`,
  `l_us_pr1.c:1090-1228`): minutes `00` dropped (e.g. "ten" not "ten zero zero"),
  VPSTART pause between fields.

---

## 2. Qlatt current state

### 2.1 Single shared normalizer, hardcoded to qlatt-english
- `src/g2p/text-normalize.ts` is one implementation. Table + pipeline YAML paths
  are constants pinned to qlatt-english (`text-normalize.ts:65-66`):
  `/rules/frontends/qlatt-english/normalization-tables.yaml` and
  `.../normalization-pipeline.yaml`. There is NO frontend parameter.
- `normalizeText(text)` (`:552-563`) just runs the pipeline steps in order.
- `numberToWords` (`:128-183`) is cardinal-only (no year/oh path). `ordinalToWords`
  /`convertOrdinal` (`:195-235`), `decimalToWords` (`:237`), `currencyToWords`
  (`:248`), `timeToWords` (`:277`), `dateToWords` (`:311`), `isoDateToWords` (`:324`).
- The number/ordinal/etc. handlers are wired declaratively-ish: the pipeline YAML
  names regex patterns + a `handler` string; TS dispatches via `BUILTIN_HANDLERS`
  map (`text-normalize.ts:345-418`). So **patterns and step order are data**, but the
  spelling algorithms (numberToWords etc.) are TS functions selected by name.
  Validation: `validateNormalizationPipelineConfig` (`:428-467`).

### 2.2 normalize is pre-tokenization TS, NOT a declarative phase
- `tts-frontend.ts:341`: `const normalized = normalizeText(inputText)` runs ONCE,
  before `transcribeText` (`:343`). It is a plain TS call, not one of the
  declarative rule phases. The declarative `phases:` in
  `dectalk-english/pipeline.yaml` (duration/postlexical/structural/formant/prosody/
  finalize) operate on the ALREADY-tokenized phoneme stream — they cannot rewrite
  raw digit text into words. So number reading CANNOT be a normal `postlexical`
  rule; it must happen in (or be dispatched from) `normalizeText`, pre-tokenization.

### 2.3 dectalk-english frontend has NO number policy and NO normalize override
- `dectalk-english/frontend.yaml` (read in full): declares `inventory_path`,
  `lts_path`, `dictionary_path: /dectalk-dictionary.json` (**note: the tree has
  CHANGED since gap report A — `skip_dictionary` is gone; dectalk now ships a
  13,272-entry converted dictionary, `frontend.yaml:4-8`**), `speakers`, `f0_model`,
  `parameters.policy`, `output`, `transcription`. There is **no** `normalization`
  / `number_policy` / `normalize` key anywhere in it.
- `dectalk-english/pipeline.yaml` phase list has no `normalize` phase.
- Confirmed: no per-frontend normalization config exists; the frontend cannot
  currently declare year/number policy as data.

---

## 3. DESIGN (declarative-first)

### Core problem
`normalizeText` has a hardcoded `qlatt-english` table/pipeline path and no frontend
argument. Year reading, "oh"-in-dates, and the fraction-as-ordinal forms are
DECtalk-specific. We must (a) make the normalizer per-frontend selectable, and
(b) express DECtalk's year/oh/fraction/ordinal POLICY as DATA the normalizer reads.

### What is pure data vs what needs generic TS
DECtalk's number reading decomposes cleanly into **data (tables + thresholds)** and
**a small set of generic algorithms**. Almost everything DECtalk-specific is data:

PURE DATA (goes in a per-frontend `normalization-*.yaml`):
- teens/tens/units/ordinal tables — Qlatt already has these
  (`normalization-tables.yaml`); dectalk's are the same English words.
- **year policy flags**: `year_min_digits: 4`, `reject_leading_zero: true`,
  `reject_middle_00: true` (the exact `ls_util_is_year` predicate, §1.1).
- **year-speaking form**: "two halves" split (read `AB` then `CD` as 2-digit
  groups), with sub-rules `_00` → "X hundred", `X000` → "X thousand", leading-0-in-
  half → spell digits (the `ls_proc_do_4_digits` table, §1.2).
- **date oh-insertion**: flag `date_year_oh_insertion: true` + the `X00Y` predicate
  (§1.3) — only fires in the dashed-date handler.
- **fraction policy**: denominator-as-ordinal, `/2`→"half/halves", plural S/Z
  (§1.6).
- regex patterns + pipeline step order (already data in qlatt's pipeline YAML).

GENERIC TS INFRA THAT MUST CHANGE (small, no per-language branches):
1. **Per-frontend path selection.** `normalizeText` must accept the frontend id (or
   a resolved tables/pipeline path pair) instead of the hardcoded
   `qlatt-english` constants (`text-normalize.ts:65-66`). `tts-frontend.ts:341`
   already knows the frontend; pass it. Fallback: if a frontend declares no
   normalization config, use qlatt-english's (so qlatt-english is byte-identical).
2. **A `readYear` builtin handler + a `numberToWordsYearAware` step.** New named
   builtin(s) implementing the §1.2 4-digit-halves algorithm and the §1.1 predicate,
   parameterised by the data flags above. Registered in `BUILTIN_HANDLERS`
   (`text-normalize.ts:345`). The qlatt-english pipeline simply does not include
   this step, so qlatt-english is unaffected.
3. **A `readFraction` builtin** (denominator-as-ordinal, half/halves) — qlatt has no
   fraction handler at all (gap A-G2), so this is purely additive.
4. (optional) date handler extension for the `X00Y` "oh" form — only matters when a
   dashed `DD-MON-YYYY` date is present; can be a later chunk.

This keeps the architecture honest with the project's "declarative-first / no
unauditable TS" principle: the DECtalk-specific knowledge (thresholds, forms) is
auditable YAML data; the TS additions are generic, table-driven algorithm
implementations selected by name, mirroring how `numberToWords` is already wired.

### RISK (flagged per hard-stop): shared normalizeText
`normalizeText` is shared and qlatt-english depends on its current behavior. Any
change MUST be per-frontend / opt-in:
- Do NOT change `numberToWords` to read years — that would silently change
  qlatt-english (`1984` would stop being "one thousand nine hundred eighty four").
- The safe shape is: keep qlatt-english's pipeline/tables exactly as-is; add a
  SEPARATE `dectalk-english/normalization-pipeline.yaml` + `-tables.yaml` that
  includes the new year/fraction steps; make `normalizeText` resolve which to load
  from the frontend. This is the "smallest generic per-frontend hook": one
  parameter threaded from `tts-frontend.ts` through `getTables()/getPipeline()`.
- Number reading is NOT unavoidably shared — it can be made per-frontend
  declaratively with the small generic hook above (no big refactor). The pipeline
  abstraction already exists; only the hardcoded path and a couple of new handlers
  are needed.

---

## 4. Suggested chunk breakdown (ordered, each verifiable by normalizing samples)

Verification harness for every chunk: a script that calls `normalizeText` (with the
dectalk frontend selected) on sample inputs and asserts the word output. Per the
project's no-invented-ceremony rule, a small unit/property test + `npm run explain`
on the phrase is the gate.

- **dt-8a — Per-frontend normalizer hook (infra, no behavior change).**
  Thread frontend id/paths into `normalizeText`/`getTables`/`getPipeline`
  (`text-normalize.ts:65-84`); add `dectalk-english/normalization-pipeline.yaml`
  + `-tables.yaml` initially CLONED from qlatt-english. DoD: qlatt-english output
  byte-identical; dectalk-english produces same output as before (still cardinal).
  Verify: normalize "1984" under both frontends → unchanged.

- **dt-8b — Year reading.** Add `readYear` predicate+speaker as a data-driven
  builtin; add the step to dectalk pipeline only. DoD:
  `1984`→"nineteen eighty four", `1900`→"nineteen hundred",
  `1066`→"ten sixty six", `2025`→"twenty twenty five",
  `2000`→"two thousand" (NOT year), `2005`→"two thousand five",
  `1905`→"nineteen zero five" (NOT "oh"; matches §0/§1.2), `0100`→cardinal,
  qlatt-english `1984` still cardinal.

- **dt-8c — Fractions + ordinals-in-fractions.** Add `readFraction` builtin (denom
  as ordinal, /2→half/halves, plural). DoD: `3/4`→"three fourths",
  `1/2`→"one half", `1/3`→"one third", `1/100`→"one hundredth",
  `3/4%`→"three fourths percent". (Plain ordinals `21st`→"twenty first" already
  work via existing `ordinalToWords`; verify dectalk keeps them.)

- **dt-8d (optional, lower priority) — Dashed-date "oh" form.** Implement the
  `X00Y` "oh" insertion in a dectalk date handler (§1.3). DoD:
  `23-Aug-2005`→"...twenty oh five". Only worth doing if dashed `DD-MON-YYYY`
  inputs matter for the port.

- **dt-8e (optional) — Decimal/currency parity audit.** Compare qlatt's
  `decimalToWords`/`currencyToWords` against DECtalk (§1.7). Likely already close;
  audit `$3.24`→"three dollars and twenty four cents", `3.14`→"three point one four".

Order rationale: dt-8a is the load-bearing infra (per-frontend hook) every later
chunk depends on; dt-8b is the headline gap (years); dt-8c is the next-biggest
missing behavior (fractions, gap A-G2); dt-8d/e are polish.

---

## 5. Key file references (absolute)

DECtalk 4.63:
- `C:\Users\Q\src\dectalk\463\dapi\src\LTS\l_us_pr1.c` — number/4-digit/date/frac
  readers (`ls_proc_do_4_digits` :367; `ls_proc_do_2_digits` :297; `ls_proc_do_date`
  :883, oh-insert :944-950; `ls_proc_do_number` :497; `ls_proc_is_frac` :980;
  `ls_proc_do_frac` :1034).
- `C:\Users\Q\src\dectalk\463\dapi\src\LTS\ls_util.c` — `ls_util_is_year` :598-622;
  `ls_util_is_ordinal` :517-572.
- `C:\Users\Q\src\dectalk\463\dapi\src\LTS\ls_task.c` — dispatch:
  plain-number :3747 (year call :3786,3790; ordinal :3969; plural :3948,4035),
  date :3589/3612-3614, fraction :3698-3702, currency :3181.
- `C:\Users\Q\src\dectalk\463\dapi\src\LTS\l_us_con.c` — phoneme tables: `pOH` :638
  (only oh-emit), `phundred` :745, `pthousand` :749, `punits` :725, `pteens` :816,
  `ptens` :862, `pordin` :1029.
- `C:\Users\Q\src\dectalk\463\dapi\src\LTS\ls_spel.c:82` — `ls_spel_spell`
  (digit-by-digit spelling used for leading-0 halves).

Qlatt:
- `C:\Users\Q\code\Qlatt\src\g2p\text-normalize.ts` — shared normalizer;
  hardcoded qlatt-english paths :65-66; `numberToWords` :128; handlers map :345;
  `normalizeText` :552.
- `C:\Users\Q\code\Qlatt\src\tts-frontend.ts:341` — sole `normalizeText` call
  (pre-tokenization, no frontend arg).
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\frontend.yaml` —
  no normalization/number policy; `dictionary_path` :8 (skip_dictionary REMOVED
  since gap report A).
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\pipeline.yaml` —
  no `normalize` phase.
- `C:\Users\Q\code\Qlatt\public\rules\frontends\qlatt-english\normalization-tables.yaml`
  / `normalization-pipeline.yaml` — the shared data the dectalk frontend currently
  reuses.

## 6. Could-not-determine (stated, not guessed)
- Did not read `ls_task_parse_number` (`ls_task.c`) internals — the `NUM` struct
  field semantics (`n_ilp/n_irp/n_flp/n_frp/n_elp`) are inferred from usage, not
  read in full. Not load-bearing for the year/oh/fraction algorithm above.
- Did not verify Qlatt's `normalization-pipeline.yaml` step order on disk (read the
  TS that consumes it, not the YAML file itself). The handler set and dispatch are
  confirmed from `text-normalize.ts`.
- Whether qlatt-english currently year-reads via some other path: confirmed it does
  NOT — `numberToWords` is the only integer reader and is cardinal-only.
