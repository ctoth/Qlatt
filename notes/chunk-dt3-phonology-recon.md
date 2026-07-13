# Chunk dt-3: DECtalk Symbolic Phonology Port Recon (Syllabification + Allophone Rewrite)

Datestamp: 2026-05-29. Scout RECON ONLY — read and report, nothing changed. A coder executes from this map.
Every claim cites file:line. "Not determined" where unverified.

Reference root: `C:\Users\Q\src\dectalk\463\dapi\src\PH\`. Prior gap report: `notes/dectalk-gap-B-phonology-duration.md` (already enumerated rules at a coarse level; this report adds exact conditions/rewrites and the Qlatt-engine mapping).

---

## 0. ENGINE CAPABILITY FACTS (verified, drives all mapping below)

File: `src/declarative-frontend/engine.ts`.

- **Rule kinds actually present in the engine** are NOT named scalar/point/postlexical/structural in code. Behavior is selected by which action fields a rule carries:
  - `apply: [{field, op, value, tag}]` — modifies a field. `op: set` (L1430/1436/1452/1463), `mul`, `add`. `op: set` CAN overwrite any field including `phoneme`, `type`, `params` (effects are generic field writes).
  - `splice: {type: replace_range, range_left, range_right, insert: [...]}` (L2040-2077) and `splice: {type: insert_at_boundary, boundary, side, insert}` (L2082-2102). This is the token-rewrite primitive.
  - `suppress` / `delete` → marks token `SUPPRESSED` (L2589-2591). This is the DELETE primitive (`dodelete` in DECtalk).
  - `insert_point` / `insert_points` / `insert_f0_layer` (L2557-2587) — for F0/point streams.
  - `define:` (sequential intermediate vars) + `constraint:` (skip if false, L2506-2512).
  - **There is NO `postlexical` kind in the engine** (grep `postlexical` in `src/declarative-frontend/` returns nothing). The gap report's "postlexical (splice/replace tokens)" refers to AGENTS.md architecture prose, not the engine. The real mechanism for allophone rewrite is `kind: structural` + (a) `apply op:set` to change `phoneme`/`type`/`params` in place, or (b) `splice: replace_range` to replace a token (or a 2-token range, for fusions/deletions). Existing structural rules in `phases/structural.yaml` already use `splice: replace_range` (L8-14, L54-90) — same shape.
  - **Caches are invalidated after structural mutations** (`navigation.invalidateStreamCache()` L2593-2594), so a phase of rewrites that splices/deletes re-reads neighbors correctly between rules.

- **Navigation primitives (verified L1180-1294):** `prev`, `next`, `ahead(token,n)` (L1182), `behind(token,n)` (L1187), `look_back_where(token,maxSteps,predicateExpr)` inline expr (L1101-1105), `look_back_pred`/`look_ahead_pred(token,maxSteps,predicateName)` named predicate from pipeline (L1107-1125), `find_within_word(token,predicate,direction)` (L1127), `count_word_vowels()` (L1251), `cluster_position_in_word()` (L1269), `target(name)`, `merge`, `span_ms`.
  - **There is NO `look_ahead_where` with an inline expr** — forward inline scan must be a named predicate via `look_ahead_pred`, OR use `next`/`ahead(token,n)` chains. This matters: several allophone rules look FORWARD for "is next syllabic", which is expressible with `next` + a `type/phoneme` check, but multi-step forward scans need a predicate.

- **Token fields available** (seen in existing rules + functions): `phoneme`, `type`, `stress`, `word`, `params`, `duration`, `inherentDuration`, `minimumDuration`, `punctuationSymbol`, `trajectory`, `sync_left`, `sync_right`, `control_windows`, `weak`. NO syllable-role field, NO word-boundary flag, NO `FSON1/FSON2/FSYLL/FNASAL` feature bits — these DECtalk phone-features must be reconstructed from `type` + phoneme membership sets, or added as inventory fields.

---

## 1. ALLOPHONE RULES TABLE (US English branch, `ph_aloph.c` `phalloph()`)

Main loop L506. US rules run L536-1082; UK branch L1088-1291 is OUT OF SCOPE. `dodelete` = suppress current token; "replace last output" = rewrite the PRIOR token and delete current (a 2-token fusion).

DECtalk feature bits used as conditions, and their Qlatt reconstruction:
- `FSYLL +` = syllabic (vowels + syllabic sonorants EL/EM/EN + L/N nuclei). Qlatt: `type == 'vowel'` plus phoneme in {EL,EN,(EM)}.
- `FSON1 +` = sonorant class 1 (vowels, glides, liquids, nasals). Qlatt: `type in ['vowel','glide','liquid','nasal']`.
- `FSON2 +` = sonorant class 2. **Not determined** which phonemes (need `ph_def.h` feature table); treat as sonorant set, flag for coder to confirm against `phone_feature` table.
- `FVOWEL +` = `type == 'vowel'`.
- `FSTRESS -` = unstressed. Qlatt: `!has(current.stress) || current.stress == 0`.
- `FWINITC +` = word-initial consonant. Qlatt: needs word-position; reconstruct via `prev == null || prev.word != current.word` (PREREQ: word-boundary detection).
- `FBOUNDARY` / `FMBNEXT` / `FWBNEXT` = morpheme/word boundary to the right. Qlatt: `next == null || next.word != current.word` for word boundary; morpheme boundary not represented (PREREQ).
- `FNASAL +` = `type == 'nasal'`. `FLABIAL` / `FALVEL` / place features = **not determined**, need feature table.

| # | Rule (purpose) | Trigger context | Rewrite | DECtalk file:line | Qlatt rule kind | Inventory symbols needed |
|---|---|---|---|---|---|---|
| A1 | Geminate obstruent deletion | `phonemes[n]==phonemes[n+1]` AND current has `FOBST` | delete current | ph_aloph.c L558-562 | structural + `delete` | none |
| A2 | FBLOCK skip | `instruc & FBLOCK` | skip all rules for this token | L563-567 | n/a (no FBLOCK in port; ignore unless user-tag added) | none |
| A3 | /ch/→/kh/ after back V | `last_outph in {A,O,U,AU,OH}` AND `curr==CH` | CH→KH | L616-625 | structural `apply op:set phoneme` | KH (not in inventory) |
| A4 | s/z→sh/zh before SH | `phonemes[n+1]==SH`: S→SH, Z→ZH | apply set | L715-722 | structural `apply op:set` | SH,ZH exist |
| A5 | R→RR before syllabic (not across word bdry) | `next FSYLL+` AND `!(sentstruc[n] & FWBNEXT)` AND `curr==R` | R→RR | L636-648 | structural `apply op:set phoneme` | RR (NOT in inventory; RR is the retroflex /r/ vowel-fusion target too) |
| A6 | "the" → /dh iy/ before syllabic | `n>0`, `next FSYLL+`, `curr==AX`, `instruc & FBOUNDARY`, `prev==DH`, `prev FWINITC+` | AX→IY | L737-752 | structural `apply op:set phoneme` | IY exists |
| A7 | citation "a"→/iy/ | `curr==AX`, `next==SIL`, `n==1`, `Cite_It` | AX→IY | L759-763 | structural `apply op:set` (gated on phrase-len/cite) | IY exists |
| A8 | "and" unreduce | `curr==SIL`, `[n+1..n+3]==AE,N,D`, unstressed-or-not-cite | AE→EH (rewrites n+1) | L765-781 | structural `apply op:set` on the AE token (forward rewrite) | EH exists |
| A9 | "to/into" unreduce | `curr==T(UKP_T)`, `next==UH`, unstressed-mono or cite | UH→IH, and if `[n+2] FSYLL+`/SIL then UH→UW | L783-799 | structural `apply op:set` on next token | IH,UW exist |
| A10 | "at" unreduce (cite) | `next==T`, `curr==AE`, word bdry both sides, `!Cite_It` | AE→EH | L801-814 | structural `apply op:set` | EH exists |
| A11 | **Postvocalic LL allophone** | `curr unstressed & !FWINITC`, `prev FVOWEL+`, `curr==LL` | LL→LX | L821-828 | structural `apply op:set phoneme` | LX (NOT in inventory); LL itself (NOT in inventory — DECtalk LL = "light/dark L"; port has L,EL only) |
| A12 | **Postvocalic R allophone** | same gate, `curr==R` | R→RX | L832-834 | structural `apply op:set` | RX (NOT in inventory) |
| A13 | **Vowel+R fusion** (deletes R, rewrites prior vowel) | same gate, `curr==R`, by `prev` vowel: AX→RR; IY/IH→IR; EY/EH/AE→ER; AA/AH→AR; OW/AO→OR; UW/UH→UR | rewrite prev token to fused vowel + delete current R | L835-872 | structural `splice: replace_range` over [prev,current] → single fused token (OR `apply op:set` prev phoneme + `delete` current) | RR(no), IR(YES, IR1/IR0 exist), ER(YES ER1/ER0), AR(YES AR1/AR0), OR(YES OR1/OR0), UR(YES UR1/UR0). Only **RR missing**. |
| A14 | **Palatalize t/d before unstressed y** | `next in {YU,YX}` AND `next unstressed`: T→CH, D→JH | apply set | L878-891 | structural `apply op:set` | CH,JH exist; YU/YX (port has Y only — **not determined** if YU/YX distinct) |
| A15 | German glottal-stop delete | `curr==Q`, prev voiceless plosive, next unstressed syllabic | delete | L893-901 | structural `delete` | Q (GS exists? port has GS, not Q) |
| A16 | **Glottalization t→TX / t→D** | `curr==T`, `prev2 !FLABIAL`, AND (`next in {LL,DH}` OR (morpheme-bdry-next AND (`next FSON2+` OR `next==HX`)) OR `next==EN`): →D; if `last_outph FSON1+` →TX | apply set | L912-927 | structural `apply op:set phoneme` (with `define` for the multi-clause trigger) | TX (NOT in inventory); D exists; HX (port has HH — **not determined** if HX≡HH) |
| A17 | "to" flap initial /t/→DF | within A9 block: cite==0, `last_outph FSYLL+ & !FNASAL`, reading mode | T→DF | L928-956 | structural `apply op:set` | DF (NOT in inventory) |
| A18 | **FLAPPING (general)** — gated `number_words>=3` | `curr in {T,D}` unstressed; `prev FSON1+` AND prev not in {M,NX,N}; `next FSYLL+`; THEN: word-final (`FBOUNDARY>=FMBNEXT`)→ T→DF, D→DX; word-internal weak-vowel (`next in {AX,RR,IY,IX,EL}` OR (prevStressed AND next==OW))→ T→DF, D→DX | apply set | L958-1040 | structural `apply op:set phoneme`, gated by a phrase-level `number_words>=3` constraint | DF (NOT in inventory), DX (EXISTS L1511) |
| A19 | Rule 3a syllabic-n after TX | `last_out==TX`, `next FNASAL+`, current unstressed, `curr != UW` | next→EN, delete current | L1042-1051 | structural `apply op:set` on next + `delete` current | EN exists |
| A20 | **Unstressed /dh/→DZ** after t/tx/d | `curr==DH` unstressed AND `last_out in {T,TX,D}` | DH→DZ | L1066-1082 | structural `apply op:set phoneme` | DZ (NOT in inventory) |
| A21 | Hat rise/fall LOCATION (FHAT_ENDS) | interleaved bookkeeping | sets FHAT_ENDS struct bit | L597-607, L1085 | OUT OF SCOPE — port computes hat in prosody phase (gap report G24) | none |
| (—) | Latin TH→S (`endrul3`) | label after rule 3 | TH→S | L1295-1298 | low priority; structural apply set | S exists |

**Notes on A11/A13 (LL):** DECtalk distinguishes /L/ (clear) vs /LL/ (the lexical lateral that becomes LX postvocalically). The port inventory has only `L`, `EL`. Whether the port's transcription emits a symbol that should map to DECtalk LL is **not determined** — coder must check the `dectalk-english` g2p/inventory mapping for how laterals are transcribed before implementing A11/A12.

**Glottal-attack rules are NOT in this file** — comment L818: "rules involving glottal attack are in PHDRAWT0.C". Out of scope here.

---

## 2. SYLLABIFICATION ALGORITHM (`ph_syl.c` + `p_us_sy1.c`)

### 2.1 Data tables (`p_us_sy1.c`)
- `us_ascky_check[]` L40-54: maps each phone index → an ASCII sonority/identity char, or 0 if the phone is "non-sounded" (releases, aspirations, boundaries). 0 means "skip / transparent" in scans. Vowels map to lowercase/uppercase letters; consonants to letters; space=SIL.
- `us_syl_vowels[]` L141 = `"a@AeEiIoOuU^WRc|xLN"` — the set of ascky chars that count as syllable nuclei (note: includes `L`,`N` = syllabic liquid/nasal, `R`,`x` = syllabic r / schwa).
- `us_syl_cons[]` L146-186 — legal ONSET clusters, **longest-first** (3-char "spl,spr,str,skw,skl,skr" then 2-char then 1-char). This is the maximal-onset table. Leading-space entries (`" Sm"`,`" SL"`,`" Y"`) encode special cases.
- `us_common_affixes[]` L57-139 — ~95 affix strings (spelled in ascky chars, e.g. `"mEnt"`=‑ment, `"S|n"`=‑tion, `"l@nd"`=‑land), stored as the affix read in some direction.

### 2.2 Algorithm (`ph_syllab` L876-1069), operates BACKWARD over one word
The word is in `phone_struct[]`; `j` starts at the LAST phone and DECREMENTS. `syllable_struct[]` is filled FORWARD (`k++`) — i.e. the output is built from word-end toward word-start, then consumed in reverse by `us_saysyllable`.

1. **Affix stripping (L971-986):** loop: `syl_find_affix` (L517) tries to match each `common_affixes` entry against the word tail (skipping ascky==0 phones, L615-630). On a match of length `len`, copy those `len` phones into the syllable buffer, then copy any trailing non-sounded phones, then insert an `SBOUND` (L983-984, dedup). Repeat until no affix matches.
2. **Maximal-onset core (L990-1067):** loop until word consumed:
   a. `syl_find_vowel` (L128): scan backward to the next nucleus (an ascky char in `syl_vowels`). Special handling for `US_YU` (the /yu/ glide-vowel) L244-258. Returns offset of the vowel (the count of phones from current position back to and including the vowel). Copy those phones to the syllable buffer (L1000-1003); then copy trailing non-sounded phones (L1006-1007).
   b. `syl_find_cons` (L342): from the position just before the vowel, try each `syl_cons` onset cluster longest-first (L457-502); the longest legal onset cluster that matches the preceding consonants is taken as THIS syllable's onset. Copy those onset phones (L1025-1027).
   c. **Syllable boundary:** if not word-initial, insert `SBOUND` (L1061) — between the onset just taken and the remaining (coda of the previous syllable). In SAY_SYLLABLE mode dedup boundaries (L1051-1055).
   This is textbook **onset maximization**: consonants between two vowels are assigned to the following syllable's onset up to the longest legal cluster; the remainder become the coda of the preceding syllable.
3. `us_saysyllable` (L202-271) splits the symbol array at `SBOUND`/`WBOUND`/punctuation into syllable chunks and counts "sounded" phones via `us_ascky_check` (L254).

### 2.3 What token annotation the port must produce
The DECtalk algorithm's OUTPUT is `SBOUND` markers inserted between phones. For the declarative engine, the equivalent is a **per-token syllable-role annotation**, minimally:
- `syllable_index` (int, per word) — which syllable the token belongs to.
- `syllable_role` ∈ {onset, nucleus, coda} — needed by allophone rules (A11/A12 "postvocalic", A18 flapping "preceded by vowel & followed by syllabic") and by duration rules (gap G15/G16 monosyllable/medial-syllable branches, `FTYPESYL`=FMONOSYL/FFIRSTSYL/FMEDIALSYL).
- `word_syllable_count` (already partly available via `count_word_vowels()` L1251).
- `syllable_position_in_word` ∈ {first, medial, last, only} — derived from syllable_index + count.

These let later rules express `FMONOSYL`/`FMEDIALSYL`/`FFIRSTSYL` and "postvocalic"/"prevocalic" cheaply.

### 2.4 How the engine would carry it (GENERIC capability)
There is currently **no syllable-role field and no annotation pass**. Two generic options:
- **(Preferred) A new annotation action `annotate: [{field, value}]`** on a rule (a generic "set arbitrary metadata field on the selected token without it being a scalar/param"). Then a `syllabification` phase of rules computes syllable_role/index per token. But onset-maximization is iterative and longest-match — hard to express as independent CEL rules.
- **(More faithful) A built-in `syllabify` pass / CEL helper** that runs the maximal-onset+affix algorithm over each word once and writes `syllable_index`/`syllable_role` onto every token — analogous to existing built-ins `count_word_vowels`/`cluster_position_in_word` (engine.ts L1251/L1269) but writing fields. This is a reusable engine feature: "annotate tokens with syllable structure," consuming the `us_syl_cons`/`us_common_affixes`/`us_syl_vowels` tables (which would live as data in the frontend config). Recommended because onset-maximization is inherently a whole-word loop, not a per-token local rewrite, and CEL rules are per-token.

`count_word_vowels()` (L1251) already gives syllable count (vowel-nucleus count) for free; `cluster_position_in_word()` (L1269) already gives onset/coda cluster position. So the engine is partway there — what's missing is a true boundary placement (which consonants attach forward vs backward), which needs the onset-cluster table.

---

## 3. PREREQUISITES

### 3.1 Inventory symbols to ADD (verified absent in `dectalk-english/inventory.yaml`)
Confirmed PRESENT: DX (L1511), CH (L1530), JH (L1545), EN (L1036), EL (L1024), and R-fusion vowels IR/AR/OR/UR/ER (as IR1/IR0…ER1/ER0).
Confirmed ABSENT (must be added as acoustic targets with citations):
- **DF** (alveolar flap /t/→flap) — required by A17/A18 AND already referenced by duration Rule 23 (`phases/duration.yaml` keys on USP_DF, gap report G2; that rule is currently dead because nothing produces DF). HIGH PRIORITY.
- **TX** (glottalized t) — A16.
- **DZ** (dental stop, /dh/ after t/d) — A20.
- **RR** (retroflex/syllabic r fusion target & R-before-syllabic) — A5, A13.
- **LX** (dark/velarized postvocalic l) — A11. (And resolve whether port has a distinct **LL** input symbol at all.)
- **RX** (postvocalic r allophone) — A12.
- **KH** (velar /k/ allophone of CH) — A3 (low priority).
- **EM** (syllabic m) — referenced in disabled OUT_for_GOOD block only (L678-683); NOT needed for enabled rules.
Each needs formant/bandwidth/amplitude targets; cite DECtalk `p_us_rom.h` / `ph_setar.c` target tables (same sources the existing inventory cites).

### 3.2 Engine capability gaps (framed generically)
- **G-cap-1: Word-boundary / word-position awareness in CEL.** Many triggers need "word-initial consonant" (FWINITC), "word boundary to the right" (FWBNEXT/FMBNEXT). Tokens carry `word` (string) so `prev.word != current.word` works, but there's no first-class `is_word_initial`/`is_word_final` helper. Add as named predicates or built-ins. Morpheme boundaries (FMBNEXT vs FWBNEXT distinction) are NOT representable — port has no morpheme marks (PREREQ if A16's morpheme-boundary clause is to be faithful; otherwise approximate with word boundary).
- **G-cap-2: Phone feature sets (FSON1, FSON2, FSYLL, FNASAL, FLABIAL, FALVEL, FOBST, FPLOSV, FVOICD).** The engine has only `type`. Either (a) add a `features` list/flags per inventory phoneme, or (b) define named CEL predicate sets in `pipeline.yaml` (`is_son1`, `is_syllabic`, etc.). FSON2/FLABIAL/FALVEL membership is **not determined** from read sources — needs `ph_def.h` feature table (NOT YET READ). Coder must extract it.
- **G-cap-3: Syllable-structure annotation pass** (section 2.4) — the big one. A reusable built-in `syllabify` that writes `syllable_index`/`syllable_role` using the onset-cluster + affix tables.
- **G-cap-4: Phrase-level counters.** A18 is gated on `number_words >= 3` (L958) and A7/A6 on phrase length (`nphonetot < 10`, L486-491) and `Cite_It`/citation mode. Engine has `total()` and `count_word_vowels()` but **not determined** if a word-count or phrase-phone-count is exposed. Likely need a `word_count`/`phrase_phone_count` built-in.
- **A new "two-token fusion" is already expressible** via `splice: replace_range` over `[prev.sync_left, current.sync_right]` → one insert token (A13). No new capability needed there; existing structural rules do exactly this.

---

## 4. SUGGESTED CHUNK BREAKDOWN (ordered by dependency, each small + verifiable)

Verification gate per chunk: `npm run test:golden` + `npm run explain -- "<phrase>"` to confirm the rewrite fires with provenance + citations (AGENTS.md: every rule needs `citations:`). No invented snapshot apparatus (memory: feedback_no_invented_verification).

- **dt-3a — Inventory symbols (PREREQ, no behavior).** Add DF, TX, DZ, RR, LX, RX (and KH optional) acoustic targets to BOTH `dectalk-english/inventory.yaml` AND check `qlatt-english` (memory: two inventory files). Cite target sources. Verify: targets resolve, no golden change (nothing references them yet except dead duration Rule 23). Smallest, unblocks everything.
- **dt-3b — Feature predicates + word-position helpers (PREREQ).** Read `ph_def.h` to extract FSON1/FSON2/FSYLL/FNASAL/place feature membership; encode as named predicates in `pipeline.yaml` and/or inventory `features`. Add `is_word_initial`/`is_word_final` predicates. Verify: predicates evaluate; no golden change. (Hard-stop: if `ph_def.h` feature table can't be located, report — A16/A18 conditions depend on it.)
- **dt-3c — Flapping (A18 + A17 + A19).** New `allophone` phase BEFORE `structural`. T→DF, D→DX in intervocalic-unstressed contexts; gate `number_words>=3`. This makes dead duration Rule 23 live and is the signature "budder" behavior. Verify: `explain "butter"` shows T→DF rewrite; "matter", "city". Depends dt-3a, dt-3b, G-cap-4 (word count).
- **dt-3d — Glottalization + dental (A16 A20 A4).** t→TX/D before sonorant/LL/DH/EN; dh→DZ after t/d; s/z→sh/zh before SH. Depends dt-3a/3b. Verify: `explain "button"`, `explain "width"`, `explain "this ship"`.
- **dt-3e — Postvocalic R/L + fusion (A11 A12 A13 A5).** LL→LX, R→RX, vowel+R fusions (use `splice: replace_range`). Depends dt-3a/3b AND resolving the LL-input question. Verify: `explain "car"`, `explain "fear"`, `explain "real"`.
- **dt-3f — Palatalization + small rewrites (A14 A3 A1 A15).** t/d→CH/JH before unstressed y; CH→KH after back vowel; geminate deletion; glottal-stop delete. Depends dt-3a/3b. Verify: `explain "did you"`, doubled obstruents.
- **dt-3g — Function-word reductions (A6 A7 A8 A9 A10).** "the"→/dh iy/, "and", "to/into", "at", citation "a". Needs phrase-length / Cite_It gating (G-cap-4). Verify: `explain "the apple"`, `explain "to eat"`.
- **dt-3h — Syllabification pass (LARGEST, G-cap-3).** Built-in `syllabify` writing syllable_index/role using onset-cluster + affix tables ported from `p_us_sy1.c`. UNBLOCKS the more faithful versions of "postvocalic"/"medial-syllable" conditions in dt-3c/3e AND duration gaps G15/G16. Can ship LAST because earlier chunks approximate postvocalic via `prev.type=='vowel'`; this replaces approximations with real syllable structure. Verify: a syllabification unit test over a word list (e.g. "butter"→[bu][ter], "strengths"→one syllable) — write a real script (AGENTS.md Principle 4), not a one-liner.

Dependency order: 3a → 3b → {3c,3d,3e,3f,3g in parallel} → 3h (refines 3c/3e). 3h could also come right after 3b if the team prefers real syllable structure before allophones, but it is the biggest single piece so deferring keeps early chunks small.

---

## 5. OPEN QUESTIONS / NOT DETERMINED (for coder to resolve before implementing the flagged rules)
1. `ph_def.h` phone-feature table (FSON1/FSON2/FSYLL/FNASAL/FLABIAL/FALVEL/FOBST/FPLOSV/FVOICD membership) — NOT READ. Blocks faithful A16/A18 triggers (G-cap-2). 
2. Does `dectalk-english` transcription emit a distinct **LL** (vs L) and **YU/YX** (vs Y), **HX** (vs HH), **Q** (vs GS)? Determines whether A11/A12/A14/A16/A15 can even match. Check the g2p/inventory mapping.
3. Is a phrase word-count / phrase-phone-count exposed to CEL? Needed for A18 (`number_words>=3`) and citation gating. (G-cap-4.)
4. `FSON2` exact membership (L917) — unverified.
5. The disabled `OUT_for_GOOD` syllabic EL/EM/EN block (L650-692) and the `#ifdef HLSYN` r→DX block (L1052-1063) are compiled OUT in this build — do NOT port (gap report parallels: matches `adjust=0` disabled-upstream pattern).
