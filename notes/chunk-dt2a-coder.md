# Chunk DT2a — DECtalk dict conversion (coder)

Date: 2026-05-29
Role: coder. Build + validate converted DECtalk dict. NO pipeline wiring.

## Source tables (read, verified)

- Char -> US_* enum: `dic.c ptab[]` (`C:\Users\Q\src\dectalk\463\dapi\src\dic\dic.c:96-149`, ENGLISH_US block).
- US_* enum values: `l_us_ph.h:59-116` (SIL=0, IY=1, ... DF=56). 57 allophones total.
- US_* -> ARPABET 2-char: `usa_phon.tab usa_arpa[]` (`...\INCLUDE\usa_phon.tab:117-250`), POSITIONALLY indexed by enum value. Verified: idx0 SIL=`_ `, idx1 IY=`iy`, idx9 AH=`ah`, idx33 NX=`nx`, idx56 DF=`df`.
- Parallel `usa_ascky[]` (line 40-67) = char for each enum index; confirms pairing.

## Char inventory in Dic_us.txt phoneme fields (empirical, 51 distinct)
All ptab[] phoneme chars present, plus NON-phoneme markers:
- `'` (primary stress, 13433) -> stress digit 1 on following vowel
- backtick (secondary stress, 3661) -> stress digit (see decision below)
- `~` BLOCK_RULES (1155), `#` HYPHEN/compound (1116), `*` MBOUND morpheme (688), ` ` WBOUND (44) -> ALL produce no phoneme (skip).
- `q` US_Q glottal stop (1 occurrence).
~13,556 entry lines.

## Target format (cmu-dictionary.json)
Flat JSON `{word: "AA1 R P AH ..."}`, space-separated ARPABET. Vowels carry stress digit (0/1/2 in CMU). Homographs as `word(2)` keys in CMU. Inventory keys: `public/rules/frontends/dectalk-english/inventory.yaml`.

## KEY DECISIONS / TENSIONS
1. **Inventory has only 0/1 stress variants** (IY0/IY1, no IY2). DECtalk secondary stress (backtick) would map to "2" CMU-style but IY2 is NOT in inventory -> validator fail. DECISION: primary `'`->1, secondary backtick->1 (collapse to stressed), no mark->0. Documented; keeps all symbols valid.
2. **Name fixups** (DECtalk arpa -> inventory): nx->NG, hx->HH, rr->ER, ll->L, rx->? lx->? (allophonic l/r), dz->? (dentalized d), df->? Need to map these to inventory keys. inventory keys: IY IH EY EH AE AA AY AW AH AO OW OY UH UW ER YU? AX? IX? IR AR OR UR W Y R L HH M N NG EL EN F V TH DH S Z SH ZH P B T D K G DX TX Q CH JH. NOTE: inventory has NO AX, IX, YU, RX, LX, DZ, DF keys -> these DECtalk symbols need explicit fixup mapping. AX(ah unstressed?)->AH0, IX->IH0, YU->Y UW, RX->R, LX->L, DZ->D, DF->? Investigating.
3. **Homographs**: keep highest-priority row; tie->first. Report collapsed count. No (2) variants for v1 (flat single-pron).
4. `#`,`*`,`~`,space = boundaries, skip.

## TODO
- Resolve fixups for AX, IX, YU(->Y+UW?), RX, LX, DZ, DF against inventory. These are the gap-risk symbols.
- Write scripts/build-dectalk-dict.ts (data-driven table).
- Write scripts/validate-dectalk-dict.ts.
- Emit public/dectalk-dictionary.json.

## Runner
`node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/X.ts`.
NOTE: plain `ts-node/esm` (type-checking) throws an opaque uncaught exception on the validator's `.ts` sibling import; `transpile-only` works (and is what test:golden/explain use). build script runs fine under either but use transpile-only for consistency.

## STATE (resolved)
- Build OK: 13556 rows -> 13272 unique words, 260 collapsed homographs.
- All 51 source chars map via ptab[]+usa_arpa[]. ZERO unknown source chars.
- Fixups applied: rr->ER, ax->AH, ix->IH, yu->Y+UW, yx->Y, hx->HH, ll->L, nx->NG, rx->R, lx->L, dz->D. Secondary stress (backtick)->1 (inventory has no IY2).
- Glottal stop `q` (US_Q): appears EXACTLY ONCE (minutiae). dectalk inventory has NO Q key (verified: inventory has DX/TX/GS but no standalone Q; my earlier dedup list wrongly showed Q). CMU also omits glottal stop (minutiae = M IH0 N UW1 SH IY0 AH0). DECISION: drop `q` -> vowels abut. Documented + cited in build script. This was the ONLY unknown symbol (0.001%).
- Validator: after q-drop, expect ZERO unknowns -> PASS. RE-RUN pending.
- build script main() guarded by isMain so validator can import convertPhonemeField without re-running build.

## Side-by-side spot check (all correct vs source/CMU)
judicial JH UW0 D IH1 SH AH0 L | world W ER1 L D | computer K AH0 M P Y UW1 T ER0 | you Y UW0 | question K W EH1 S CH AH0 N. Matches.

## FINAL — DONE
- build + validate both PASS. Validator: zero unknown symbols, stress well-formed, 15-word table all correct, homograph count 260.
- Format byte-compatible with cmu-dictionary.json: flat `{word:"ARPABET ..."}`, all string values, 100% match ARPABET-token regex. 13272 entries.
- NO pipeline files touched (verified git status: only 4 new files: 2 scripts, 1 json, 1 notes). Did NOT git add/commit.
- Deliverable files:
  - scripts/build-dectalk-dict.ts (data-driven tables, cited line refs)
  - scripts/validate-dectalk-dict.ts (4 checks)
  - public/dectalk-dictionary.json (13272 entries)
- 15-word side-by-side verified incl. tricky: colonel->K ER1 N EL, knight->N AY1 T (silent k), yacht->Y AA1 T (silent ch), through->TH R UW0, you->Y UW0.

## UNCERTAIN / for reviewer
1. Secondary stress (backtick) collapsed to digit 1 because dectalk-english inventory has NO stress-2 vowel keys (IY2 etc. absent). If a 2-level inventory is added later, revisit (currently faithful to inventory, lossy vs DECtalk's 2-level stress).
2. Glottal stop `q` (US_Q): dropped (1 occurrence, minutiae). Inventory has no Q segment; CMU also omits. Faithful.
3. Homograph v1 = highest-priority row, tie->first. 260 words collapsed (e.g. read P/r'id vs S/r'Ed -> kept higher priority). POS-conditioned selection = v2, NOT built.
4. ptab chars F(DF), B(IR), P(AR), M(OR), j(UR), &(DX), Q(TX) map to valid inventory symbols but most never appear in actual data; mapping present for completeness/correctness.
5. DECtalk dict includes punctuation spell-outs (`!`->"exclamation point", `$`->"dollar"). Carried through as ordinary entries (harmless data; a wiring chunk may choose to filter).
