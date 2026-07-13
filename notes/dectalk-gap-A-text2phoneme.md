# Gap Report A: Text → Phoneme-String Front End (real DECtalk 4.63 vs Qlatt `dectalk-english`)

Scope: text normalization (numbers, abbreviations, currency, dates, acronyms),
dictionary lookup, and letter-to-sound (LTS). NOT prosody/duration/formants.

Date: 2026-05-28. Scout: read-only survey. Every claim cites file:line.

---

## 0. One-paragraph orientation

In **real DECtalk 4.63** the text→phoneme path is three distinct stages that all
ship as data + C code: (1) a **rule-based text preprocessor** ("the parser",
`CMD/par_*.par` + `CMD/par_pars.c`) that rewrites raw input — dates, phone
numbers, money, URLs, email, emoticons, abbreviations, compound splitting — into
clean word tokens; (2) a **main dictionary lookup** (`dic/Dic_us.txt`, ~13,556
entries with part-of-speech + 29-bit syntax/feature mask + duration) plus
abbreviation tables (`dic/TTSAbbr1.tab` 268 lines, `dic/TTSabbr2.tab` 132 lines);
(3) the **LTS task** (`LTS/ls_task.c` 5,333 lines + per-language rule files)
which does number-to-words expansion, fraction/Roman/date reading, homograph
disambiguation by form-class, abbreviation-in-context, suffix morphology, and
the letter-to-sound fallback rules (`LTS/l_us_rta.c`, 1,354 rules).

In the **Qlatt `dectalk-english` port** the text→phoneme path is: (1) a generic
`normalizeText()` (`src/g2p/text-normalize.ts`) that is the **`qlatt-english`
normalizer reused unchanged** — it has number/ordinal/currency/date/time/
abbreviation handlers but a 30-entry abbreviation table and no homograph/POS
machinery; (2) **dictionary is disabled** for this frontend
(`dectalk-english/frontend.yaml:4` `skip_dictionary: true`); (3) the converted
DECtalk LTS rules (`dectalk-english/lts-rules.yaml`, 5,537 lines, 1,354 rules)
run through the Elovitz-style engine (`src/g2p/lts-engine.ts`), with the 311
grapheme-rewrite rules **stripped** and several phoneme distinctions **collapsed**.

The biggest gaps are structural: (a) DECtalk's number/date/fraction/year reading
lives in the LTS C layer and was **not ported at all** (Qlatt's number handling
is a separate generic normalizer with different behavior); (b) **no homograph /
part-of-speech disambiguation**; (c) the **main DECtalk dictionary is unused**
(skip_dictionary), so every word hits LTS rules; (d) **grapheme_rewrites
dropped** (311 of 1,354 rules); (e) phoneme inventory collapsed (AX→AH, IX→IH,
RR→ER, LL→L, etc.).

---

## 1. DECtalk 4.63 subsystems present (text → phoneme string)

### 1.1 Rule-based text preprocessor ("the parser")
- `CMD/par_pars.c` (2,199 lines) — recursive rule-matching engine. Design doc in
  `CMD/par_text.txt` describes match states (Optional/Replace/Delete/Insert/Copy)
  and char-type matchers `D`(digit) `U`(upper) `A`(alpha) `W`(whitespace)
  `P`(punct) `V`(vowel) `O`(consonant) etc. (`CMD/par_text.txt:26-76`).
- Rule data files: `CMD/par_rule.par` (955), `par_rule1.par` (1,024),
  `par_rule2.par` (1,334), `par_nws.par` (684 — news/clause mode).
- What the rules cover (all `CMD/par_rule.par`):
  - **Phone numbers** US `1-508-555-1212` / `508-555-1212` / `5551212` and UK
    `(19323)43154` (`par_rule.par:454-472`, rules R204-R210).
  - **Money** `$`/`£` + digits + optional cents (`par_rule.par:174`, R42).
  - **Times** `Dx[0-24]:Dx[0-60]` with `am`/`pm` (`par_rule.par:158`, R39;
    `a.m./A.M.→am` R45 `par_rule.par:180`).
  - **Dates** multiple formats — `May. 3, 1996`, `5/10/96`, `5-10-96`,
    `23-Aug-1984`; month-abbrev domain dicts; UK/German/Spanish date orders
    (`par_rule.par:307-320`, R308-R312; German R401 `:280`, Spanish R500 `:290`,
    UK R551 `:295`).
  - **Decimals** `4.2 → 4 point 2` (`par_rule.par:336`, R328).
  - **URLs / email** `http://`,`ftp://` stripped; `.`→`dot`, `/`→`slash`;
    `com/org/net/mil/edu/gov` handling (`par_rule.par:183-184,264-271,376-411`).
  - **Emoticons** `:-) :) :^)` → "smile!", crying-face `(`
    (`par_rule.par:188`, R47; and `cm_text.c` header revs 031/035).
  - **Abbreviation domain dictionaries** keyed lookups: `abbr_words`,
    `abbrp_words`, `univ_words`, `day_words`, `time_words`, `month_words`,
    `month_abbr`, `direct_words` (N/S/E/W), `states`, `roman_num`, compound-noun
    prefix/suffix dicts `2_c_words`…`6_c_words`, `4_c_words_s`/`5_c_words_s`
    (`par_rule.par:196-199,310-418`).
  - **Compound / concatenation splitting** `TextToSpeech`,
    `Text-To-Speech-Startup`, `disk2→disk 2`, `Mc`+Upper bypass
    (`par_rule.par:351-362,427-439`).
  - **State + ZIP** `XX 12345-6789` (`par_rule.par:328`, R327).
  - **Roman numeral after a name** (`par_rule.par:418`, R387).
  - **Mode-conditioned**: each rule is gated by a language/mode bitmask prefix
    (e.g. `0x00000004`=German, `0x00000008`=Spanish, `0x00000020`=UK,
    `0x00000001`=US) and a punct-mode mask (`par_rule.par:130` onward).

### 1.2 Main dictionary + abbreviation tables
- `dic/Dic_us.txt` — 13,682 lines, **13,556 entries** (`grep -vc '^;'`).
  Format per entry: `word,POS,phonemes,29-bit-mask,duration`
  (e.g. `New,N,n\`uw,10000000...001,450`; samples
  `dic/Dic_us.txt` data rows). Includes punctuation/symbol names
  (`$→dollar`, `%→percent`, `&→and`) and acronyms (`AARP,ABC,ADP,AMC` spelled
  letter-by-letter with `*` separators).
- `dic/DIC.H`, `dic/dic.c`, `dic/dic_cnvt.c`, `dic/loaddict.c`/`LTS/loaddict.c`,
  `LTS/maindict_us*.h` — binary dictionary build + loader.
- Abbreviation tables: `dic/TTSAbbr1.tab` (268), `dic/TTSabbr2.tab` (132), plus
  `_space` variants. Map abbreviations directly to DECtalk phoneme strings,
  both with and without trailing `.` (e.g. `dr.→[d r 'ayv]` "drive",
  `co.→[k...ow]` "Colorado", `am→['ey'ehm]`, `cm→"centimeter"`,
  `dic/TTSAbbr1.tab:1-40`, `dic/TTSabbr2.tab:1-30`).
- `dic/USER.TAB` — user pronunciation table mechanism.

### 1.3 LTS task (number reading, homographs, abbreviation-in-context, LTS rules)
- `LTS/l_us_pr1.c` (1,227 lines) — **number-to-words** machinery:
  - teens `1X` (`l_us_pr1.c:285,304`), `X00→X hundred` (`:322,340-345`),
    thousands/hundreds (`:355-387`), full magnitude up to **millions/thousands**
    via 18-digit buffer `ls_proc_non_zero` (`:609-711,786`).
  - **year reading** `19XX`, `200X` with "**oh**" insertion
    (`l_us_pr1.c:936,949-950` `pOH`), 2-digit/4-digit handlers
    `ls_proc_do_2_digits` / `ls_proc_do_4_digits` (`:939,957`).
  - **date reading** `ls_proc_do_date` with month table + Europe order
    (`l_us_pr1.c:883-961`).
  - **fraction** detection `ls_proc_is_frac` (`l_us_pr1.c:963-...`).
  - "a quantity (hundred/thousand) from stressed to unstressed" stress retuning
    (`l_us_pr1.c:49,340,378,427`).
- `LTS/ls_task.c` (5,333 lines) — orchestration:
  - **abbreviation-in-context** with `.` lookahead, FABBREV form-class
    (`ls_task.c:2066-2148,2452-2480`).
  - **Dr./St. disambiguation** by following-word context
    (`ls_task.c:2934-2984`).
  - fraction branch (`ls_task.c:992`), ordinal pulse handling
    (`ls_task.c:159,1177`), number-abbrev (`secs.`, German/Spanish) (`:1125-`).
- `LTS/ls_homo.c` (737 lines) — **homograph disambiguation** by form-class /
  part-of-speech and neighbor context (e.g. "wind", "lead", "read", "to lead",
  "have already read" — `ls_homo.c` header revs 002-007).
- `LTS/ls_suff.c` (642 lines), `LTS/l_us_suf.c`, `LTS/l_us_suf_big.c` —
  **suffix/morphology** stripping inside LTS.
- `LTS/l_us_rta.c` — the **1,354 letter-to-sound rules** (the source the Qlatt
  rules were extracted from; see `reports/coder-convert-lts-report.md` and the
  earlier `output/lts-rules.yaml` extraction documented in
  `reports/scout-dectalk-data-report.md:37-211`).
- Rules use **grapheme rewrites** (311 of 1,354 rules emit graphemes back into
  the stream — `C,E,MBOUND,N,R,Y`), **feature-mask / range / disjunction**
  structured environments, **TWOPH** stress-conditioned phoneme pairs, and
  pseudo-phonemes `S1LEFT/S2LEFT/SPRI/SSEC/COMMA/PERIOD/MBOUND/HYPHEN`
  (`reports/scout-dectalk-data-report.md:43-212`).

---

## 2. Qlatt `dectalk-english` port — current state

### 2.1 Normalization (shared, generic; NOT DECtalk-specific)
- `src/g2p/text-normalize.ts` (564 lines). YAML-driven pipeline
  (`normalization-pipeline.yaml`) + tables
  (`/rules/frontends/qlatt-english/normalization-tables.yaml`). Paths are
  hard-coded to **`qlatt-english`** (`text-normalize.ts:65-66`), so the
  `dectalk-english` frontend uses the same normalizer.
- Handlers present: `numberToWords` 0–999,999,999 (`:128-183`), `ordinalToWords`
  (`:195-235`), `decimalToWords` (`:237`), `currencyToWords` `$`+cents (`:248`),
  `timeToWords` `HH:MM am/pm` (`:277`), `dateToWords` `M/D/Y` (`:311`),
  `isoDateToWords` `Y-M-D` (`:324`), initialism expansion (`:421`),
  punctuation cleanup (`:400`).
- Abbreviation table: **30 entries** (`normalization-tables.yaml:77-107`).
- Citations: Allen/Hunnicutt/Klatt 1987, Ebden & Sproat 2015 (`text-normalize.ts:17-20`).

### 2.2 Dictionary — DISABLED for this frontend
- `dectalk-english/frontend.yaml:4` `skip_dictionary: true`.
- When set, the runtime passes a `noOpDictLookup` (`src/tts-frontend.ts:269`),
  so **no dictionary lookup happens** for dectalk-english.
- The only dictionary the codebase wires is the **CMU Pronouncing Dictionary**
  (`src/transcribe-text.ts:73-105`, `cmuDictLookup`), used by `qlatt-english`.
  The DECtalk `Dic_us.txt`, abbr tables, and USER.TAB are **not present or used**
  in the Qlatt repo (no file under `public/rules/frontends/dectalk-english/`
  other than `frontend.yaml inventory.yaml lts-rules.yaml pipeline.yaml phases/`).

### 2.3 LTS engine + rules
- Engine: `src/g2p/lts-engine.ts` (213 lines). Pads `" WORD "`, walks char by
  char, first-match-wins per letter category; left/right context compiled to
  anchored regex; `raw_regex: true` mode (`lts-engine.ts:78-96,168-213`).
- Rules: `dectalk-english/lts-rules.yaml` — 5,537 lines, **1,354 rules**
  (`lts-rules.yaml:1-8` header; `raw_regex: true`).
- Conversion losses documented in `reports/coder-convert-lts-report.md`:
  - **grapheme_rewrites stripped** — all 311 (header note
    `lts-rules.yaml:4-6`; report lines 14,32-33).
  - phoneme collapse `LL→L, HX→HH, NX→NG, RR→ER, AX→AH, IX→IH, YU→Y+UW`
    (report `:10`).
  - TWOPH pairs resolved to a single variant by stress context (report `:11`,
    192 pairs); stress digits applied (report `:12`).
  - prosodic markers (COMMA/PERIOD/MBOUND/HYPHEN) stripped (report `:13`).
  - letter-group remap `GU→G, QU→Q, QUOTE→PUNCT, MBOUND→PUNCT` (report `:15`).
  - context symbols reduced to `# + '` (report `:35-40`).
- Pipeline ordering for dectalk-english: `pipeline.yaml` lists only
  duration/structural/formant/prosody phases — **no normalize phase** that would
  remap residual symbols (contrast qlatt-english, whose lts-engine comment
  defers AX/NX/WH remap to a `normalize.yaml` phase — `lts-engine.ts:208-212`).
  Not determined whether dectalk-english needs that phase.

### 2.4 Other g2p modules (used only when dictionary is enabled, i.e. qlatt-english)
- `src/g2p/index.ts` `pronounce()`: dict → possessive `'s` → morphology → LTS+stress
  (`index.ts:31-81`). Defaults point at `qlatt-english` paths (`:35-37`).
- `src/g2p/morphology.ts` (258), `stress.ts` (95), `syllabify.ts` (135). These
  run for dectalk-english only via the LTS fallback path; with
  `skip_dictionary` the dict/morphology branches in `pronounce()` always miss
  and the LTS branch handles every word.

---

## 3. GAP — what DECtalk does that the port lacks or does differently

Each item: description • DECtalk evidence • port equivalent? • rough size.

### G1. Number-to-words is NOT the DECtalk algorithm
- DECtalk reads numbers in the LTS layer with year/"oh"/magnitude logic
  (`LTS/l_us_pr1.c:285-711,936-957`). The Qlatt port does numbers in the generic
  `numberToWords` normalizer (`text-normalize.ts:128-183`) which has **different
  behavior**: e.g. DECtalk reads `1984` as a **year** "nineteen eighty four"
  and `1905`→"nineteen oh five" (`l_us_pr1.c:949-950`); Qlatt's `numberToWords`
  reads `1984`→"one thousand nine hundred eighty four" (cardinal) with no
  year/"oh" path.
- Port equivalent: partial/different (generic cardinal expansion only).
- Size: medium. Year reading + "oh" insertion + magnitude parity ≈ the
  `l_us_pr1.c` number block (~400 lines C) to re-express as rules/handlers.

### G2. Fractions
- DECtalk detects and reads fractions (`LTS/l_us_pr1.c:963+ ls_proc_is_frac`,
  `LTS/ls_task.c:992`).
- Port equivalent: **none** (`grep -i fraction src/g2p` → no fraction handler;
  only an unrelated `fraction` match in `measurement.ts`).
- Size: small-medium.

### G3. Roman numerals
- DECtalk has `roman_num` domain dict + post-name rule
  (`CMD/par_rule.par:418`, R387).
- Port equivalent: **none** (no roman-numeral handling in `src/g2p`).
- Size: small.

### G4. Homograph / part-of-speech disambiguation
- DECtalk: `LTS/ls_homo.c` (737 lines), form-class context for "wind/lead/read"
  etc.; dictionary carries POS + 29-bit syntax mask (`dic/Dic_us.txt` entries).
- Port equivalent: **none**. No POS, no homograph logic anywhere in `src/g2p`
  or `src/transcribe-text.ts` (grep `homograph|formClass|partOfSpeech` → 0 hits
  in g2p).
- Size: large (needs a tagged lexicon + selection logic).

### G5. Main DECtalk dictionary unused (skip_dictionary)
- DECtalk: ~13,556-entry curated `Dic_us.txt` is the **primary** pronunciation
  source, queried before LTS (`LTS/ls_task.c` dict search; `CMD/par_dict.c`).
- Port: `dectalk-english/frontend.yaml:4` `skip_dictionary: true` →
  `noOpDictLookup` (`src/tts-frontend.ts:269`). Every word falls to LTS rules.
  The DECtalk dictionary files are **not in the Qlatt repo**.
- Port equivalent: none for dectalk-english (CMU dict exists but is only wired
  for qlatt-english).
- Size: large (convert + load ~13.5k entries; format = word/POS/phon/mask/dur).

### G6. Abbreviation coverage and context
- DECtalk: `TTSAbbr1.tab` (268) + `TTSabbr2.tab` (132) phoneme-level abbreviation
  expansions, both `abbr` and `abbr.` forms; plus context-sensitive abbreviation
  resolution with `.` lookahead (`LTS/ls_task.c:2066-2148`) and Dr./St.
  disambiguation (`:2934-2984`); plus `abbr_words`/`univ_words`/`day_words`/
  `time_words`/`direct_words`/`states`/`month_*` domain dicts in the parser
  (`CMD/par_rule.par:196-418`).
- Port: 30 fixed string→string abbreviations in the **shared qlatt-english**
  table (`normalization-tables.yaml:77-107`), expanded unconditionally with no
  POS/context check and no `.`-context disambiguation.
- Port equivalent: minimal subset, no context.
- Size: medium (data: ~400 abbr entries + domain dicts; logic: context gate).

### G7. grapheme_rewrites dropped from LTS rules
- DECtalk LTS feeds rewritten graphemes (`C,E,MBOUND,N,R,Y`) back into matching
  for **311 of 1,354** rules (`reports/scout-dectalk-data-report.md:154-183`).
- Port: stripped; engine has no rewrite mechanism
  (`lts-rules.yaml:4-6`; `reports/coder-convert-lts-report.md:14,32-33`). Rules
  still emit their immediate phonemes, so downstream-dependent pronunciations
  may differ.
- Port equivalent: none (mechanism absent).
- Size: medium-large (engine feature + re-derivation of 311 rules).

### G8. Phoneme inventory collapsed in LTS output
- DECtalk LTS distinguishes AX vs AH, IX vs IH, RR/ER, LL/L, NX, YU, plus
  pseudo-phonemes (`reports/scout-dectalk-data-report.md:187-202`).
- Port: collapsed at conversion (`reports/coder-convert-lts-report.md:10`):
  `AX→AH, IX→IH, RR→ER, LL→L, NX→NG, YU→Y UW`. Reduced/centralized vowel and
  syllabic distinctions are lost in the rule output.
- Port equivalent: collapsed mapping only.
- Size: depends — the dectalk-english `inventory.yaml` would need the extra
  phonemes and the rules would need to stop collapsing. Not determined whether
  the Qlatt dectalk inventory carries AX/IX/RR/LL distinctly.

### G9. TWOPH stress-conditioned phoneme selection frozen
- DECtalk selects between paired phonemes (e.g. `AA/AX`) at runtime by stress
  context (24 pairs, `reports/scout-dectalk-data-report.md:200-204`).
- Port: each TWOPH pre-resolved to one variant at conversion time
  (`reports/coder-convert-lts-report.md:11`, 192 resolutions). Context-dependent
  alternation is lost.
- Port equivalent: static resolution.
- Size: medium (needs engine-side TWOPH support keyed on stress).

### G10. Structured / language-moded text preprocessor (phone/date/email/URL/emoticon/compound)
- DECtalk's parser handles phone numbers, ZIP+state, email, URLs, emoticons,
  compound-word splitting, language-specific date orders, mode bitmasks
  (`CMD/par_rule.par` throughout; `CMD/par_pars.c`).
- Port: generic `text-normalize.ts` handles M/D/Y and ISO dates, `HH:MM`,
  `$`+cents, ordinals, initialisms (`text-normalize.ts:311-426`). **No** phone
  numbers, ZIP, email, URL, emoticon, compound-splitting, or language modes.
- Port equivalent: partial (date/time/currency only; US-style only).
- Size: large (the parser is ~4,000 lines of rule data + a recursive matcher).

### G11. No DECtalk-specific normalization path; LTS lacks a post-normalize symbol remap phase
- The runtime always calls the qlatt-english `normalizeText`
  (`src/tts-frontend.ts:262`); `dectalk-english/pipeline.yaml` phase list has no
  `normalize` phase. The lts-engine comment notes symbol remap is "deferred to
  the normalize rule phase" (`lts-engine.ts:208-212`) — that phase exists for
  qlatt-english but is **not in dectalk-english's pipeline**.
- Port equivalent: not present for dectalk-english.
- Size: small (add/point to a normalize phase) — but **not determined** whether
  any residual symbols actually survive for this frontend.

---

## 4. Things I could NOT determine (stated, not guessed)
- Whether the Qlatt `dectalk-english/inventory.yaml` carries the collapsed
  phonemes (AX/IX/RR/LL) as distinct entries — did not read it (out of scope).
- Whether dropping grapheme_rewrites/TWOPH actually changes audible output for
  common words — would require running `npm run explain` (not run; read-only).
- Whether any DECtalk dictionary/abbr data was converted to a Qlatt format and
  lives outside `public/rules/frontends/dectalk-english/` — searched that dir
  and `src/`; found only the CMU dict wiring. Not exhaustively searched the repo.

---

## 5. Key file references (absolute)

DECtalk 4.63:
- `C:\Users\Q\src\dectalk\463\dapi\src\CMD\par_rule.par` (text-preproc rules)
- `C:\Users\Q\src\dectalk\463\dapi\src\CMD\par_pars.c` (recursive matcher)
- `C:\Users\Q\src\dectalk\463\dapi\src\CMD\par_text.txt` (matcher design doc)
- `C:\Users\Q\src\dectalk\463\dapi\src\dic\Dic_us.txt` (main dict, ~13.5k)
- `C:\Users\Q\src\dectalk\463\dapi\src\dic\TTSAbbr1.tab` / `TTSabbr2.tab`
- `C:\Users\Q\src\dectalk\463\dapi\src\LTS\l_us_pr1.c` (number/date/fraction)
- `C:\Users\Q\src\dectalk\463\dapi\src\LTS\ls_task.c` (abbrev/Dr-St/orchestration)
- `C:\Users\Q\src\dectalk\463\dapi\src\LTS\ls_homo.c` (homographs)
- `C:\Users\Q\src\dectalk\463\dapi\src\LTS\ls_suff.c` (suffix morphology)
- `C:\Users\Q\src\dectalk\463\dapi\src\LTS\l_us_rta.c` (1,354 LTS rules — source)
- `C:\Users\Q\code\Qlatt\notes\scout-dectalk-data-report.md` (extraction notes)
- `C:\Users\Q\code\Qlatt\notes\coder-convert-lts-report.md` (conversion losses)

Qlatt port:
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\frontend.yaml`
  (`skip_dictionary: true` at line 4)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\lts-rules.yaml` (1,354 rules)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\pipeline.yaml`
- `C:\Users\Q\code\Qlatt\src\g2p\text-normalize.ts` (generic normalizer)
- `C:\Users\Q\code\Qlatt\src\g2p\lts-engine.ts` (Elovitz-style engine)
- `C:\Users\Q\code\Qlatt\src\g2p\index.ts` (pronounce orchestration)
- `C:\Users\Q\code\Qlatt\src\transcribe-text.ts` (CMU dict wiring, qlatt-english)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\qlatt-english\normalization-tables.yaml`
  (abbreviations at line 77; 30 entries)
