# Chunk DT2 — DECtalk dictionary -> dectalk-english frontend (declarative) integration map

Date: 2026-05-29
Role: scout (recon only, no implementation)

All paths absolute. Claims cite file:line. "Not determined" = not observed.

---

## TL;DR

- DECtalk 4.63 main US dictionary exists at `C:\Users\Q\src\dectalk\463\dapi\src\dic\Dic_us.txt`, **13,682 lines** (header comments + entries). CSV-ish, comma-separated, 5 fields: `word,POS,phonemes,29-bit-mask,priority`.
- Its phoneme field uses **single-ASCII-char DECtalk phoneme codes** (`J'udi`, `^`, `|`, `@`, backtick), NOT ARPABET. A two-step mapping table to convert to ARPABET is present in the DECtalk source (`dic.c ptab[]` + `usa_phon.tab usa_arpa[]`).
- The Qlatt `dectalk-english` inventory uses **ARPABET-with-stress-digit** symbols (IY1, IH0, AE1, TH, NG, EL, EN ...) — same family as CMU. So a converted DECtalk dict would target the same symbol space Qlatt already speaks.
- DECtalk is **dictionary-first, LTS-fallback** (`ls_task.c:697` dictionary search; LTS default rules only run when `!done`).
- Qlatt's dictionary mechanism is **a single module-level CMU map** loaded from a hardcoded path; the dictionary is **NOT per-frontend configurable** today. The only per-frontend control is the boolean `skip_dictionary` which swaps `cmuDictLookup` for a no-op.
- The dectalk repo already has converters for inventory/lts/speakers (`scripts/convert_*.py`) but **no dictionary converter** — the dict was never ported. No converted dict JSON/YAML exists in `output/`.

---

## 1. DECtalk dictionary format

### File & size
- `C:\Users\Q\src\dectalk\463\dapi\src\dic\Dic_us.txt` — **13,682 lines** (`wc -l`). Lines 1-~250 are a `;*`-prefixed comment/revision-history header; entries follow.
- Sibling dictionaries in the same dir: `DIC_UK.TXT` (881 KB), `Dic_u_s.txt`, `Dic_us_Casio.txt`, `Dic_fr.txt`, `DIC_SP.txt`, `DIC_LA.txt`, plus compiled `.dic` binaries (`dtalk_us.dic`, `dic_uk_comp.dic`, etc.). The text source we want is `Dic_us.txt`.

### Field layout (matches gap report A)
Each entry line (e.g. `Dic_us.txt:6800-6836`):
```
judicial,N,Jud'ISxl,10000000000000000000000000000,850
just,P,J^st,01000000000000000000000000000,250
just,S,J'^st,10000000000000000000000000000,850
jury,N,J'Uri,10000000001000000100000000000,250
```
Five comma-separated fields:
1. **word** — lowercase orthography (`judicial`, `just`).
2. **POS / form-class tag** — single letter. Observed: `N` (noun, dominant), `P`, `S`. Header `Dic_us.txt:37` documents an earlier 2-field "F"/"100" proper-name+priority scheme; current entries use a single POS char then the mask then priority.
3. **phonemes** — DECtalk single-char phoneme string with inline stress marks: `'` = primary stress (precedes the stressed vowel), backtick `` ` `` = secondary stress. E.g. `J'udi` = JH + (primary)UW + D + IY; `J`uri'@nx` shows both stress marks.
4. **29-bit mask** — 29 chars of `0`/`1` (`10000000001000000000000000001`). Per `Dic_us.txt:37-39` header this region encodes proper-name flag + form-class bits used by homograph/POS selection. Exact bit semantics: not determined here.
5. **priority** — integer (`450`, `850`, `1200`, `250`, `150`). Header `Dic_us.txt:35,42` documents priority levels used for dictionary-size selection (150=very common, 250=common, 450=common names, 850=less common). Used to pick smaller/larger compiled dict variants.

Homographs are represented as **multiple rows with the same word, different POS** (e.g. `just,P,...` vs `just,S,...` at `Dic_us.txt:6827-6828`). POS-dependent selection is by form-class.

### Phoneme alphabet — DECtalk single-char codes
The phoneme field uses DECtalk's compact one-ASCII-char-per-phoneme alphabet. The authoritative char->internal-code table for US is `dic.c ptab[]` (`C:\Users\Q\src\dectalk\463\dapi\src\dic\dic.c:95-148`). Key rows:
```
'e'->US_EY  'a'->US_AA  'i'->US_IY  'E'->US_EH  'A'->US_AY  'I'->US_IH
'O'->US_OY  'o'->US_OW  'u'->US_UW  '^'->US_AH  'W'->US_AW  'Y'->US_YU
'R'->US_RR  'c'->US_AO  '@'->US_AE  'U'->US_UH  '|'->US_IX  'x'->US_AX
'p'->US_P 't'->US_T 'k'->US_K 'f'->US_F 'T'->US_TH 's'->US_S 'S'->US_SH
'C'->US_CH 'w'->US_W 'y'->US_Y 'h'->US_HX 'l'->US_LL 'L'->US_EL 'N'->US_EN
'b'->US_B 'd'->US_D 'g'->US_G 'v'->US_V 'D'->US_DH 'z'->US_Z 'Z'->US_ZH
'J'->US_JH 'm'->US_M 'n'->US_N 'G'->US_NX 'r'->US_R 'q'->US_Q 'Q'->US_TX
'&'->US_DX 'F'->US_DF  'B'->US_IR 'K'->US_ER 'P'->US_AR 'M'->US_OR  (dic.c:144-148)
```

### Phoneme symbols -> Qlatt dectalk-english inventory symbols
Qlatt's `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\inventory.yaml` uses ARPABET symbols with stress digits. Observed symbol keys (`inventory.yaml:61-...`): `SIL, IY1/IY0, IH1/IH0, EY1/EY0, EH1/EH0, AE1/AE0, AA1/AA0, ... W, Y, R, L, HH, M, N, NG, EL, EN, F, V, TH, DH, S, Z, SH, ZH, P, ...` plus param defaults at top (F1..F6, B1..B6, AV, AF, AH, Rd, FNZ ...).

The bridge from DECtalk single-char codes to ARPABET is the **second table**, `usa_arpa[]` in `C:\Users\Q\src\dectalk\463\dapi\src\INCLUDE\usa_phon.tab:117-250`. It maps each US phoneme code (in enum order) to a 2-char ARPABET pair, e.g.:
```
US_IY->'i','y' (iy)   US_IH->'i','h' (ih)   US_EY->'e','y' (ey)
US_EH->'e','h' (eh)   US_AE->'a','e' (ae)   US_AA->'a','a' (aa)
US_AY->'a','y' (ay)   US_AW->'a','w' (aw)   US_AH->'a','h' (ah)
US_AO->'a','o' (ao)   US_OW->'o','w' (ow)   US_OY->'o','y' (oy)
US_UH->'u','h' (uh)   US_UW->'u','w' (uw)   US_RR->'r','r' (rr/er)
US_YU->'y','u' (yu)   US_AX->'a','x' (ax)   US_IX->'i','x' (ix)
US_EL->'e','l' (el)   US_EN->'e','n' (en)   US_TH->'t','h' US_DH->'d','h'
US_SH->'s','h' US_ZH->'z','h' US_CH->'c','h' US_JH->'j','h' US_NX->'n','x' (ng)
... single consonants map to char+' ' (e.g. US_P->'p',' ')
```
So a converter chains: `Dic_us.txt char -> ptab[] -> US_* code -> usa_arpa[] -> ARPABET pair`. Stress digit (1/0/2) comes from the `'` / backtick markers in the phoneme string attached to the following vowel.

Note: ARPABET output of `usa_arpa` is **lowercase 2-char** (`iy`, `ae`, `ng`=`nx`); Qlatt inventory keys are **uppercase + stress digit** (`IY1`, `AE1`, `NG`). The converter must uppercase and append stress. A few DECtalk symbols need name reconciliation (e.g. `nx`->`NG`, `rr`/`er`->`ER`, `hx`->`HH`, `ll`->`L`). Exact full reconciliation list: derivable from the two tables above; not enumerated here.

### Abbreviation tables (confirmed present, report A correct)
In `C:\Users\Q\src\dectalk\463\dapi\src\dic\`:
- `TTSAbbr1.tab` (6,947 B) and `TTSAbbr1_space.tab` — single-word abbreviations.
- `TTSabbr2.tab` (2,931 B) and `TTSabbr2_space.tab` — likely multi-word/spaced abbreviations.
These use a **DIFFERENT** phoneme notation than `Dic_us.txt`: bracketed, space-separated, multi-char ARPABET-ish tokens with stress marks as standalone chars:
```
TTSAbbr1.tab:1   adt   [axl ' aes k ax d ' eyl ayt  t ' aym ]
TTSAbbr1.tab:25  bldg  [b ' ihl d ixnx]
TTSabbr2.tab:17  dr    [d r ' ayv ]
TTSabbr2.tab:5   am    [' ey' ehm ]
```
Format: `<abbrev>\t[<space-separated phoneme tokens with ' primary / backtick secondary>]`, entries duplicated with/without trailing period. These expand abbreviations to full-word pronunciations. They are a SEPARATE asset from the main dict and would need their own (simpler) conversion. NOTE the token set here (`axl, aes, eyl, ayt, ixnx, hxaxw`) does not cleanly match either `Dic_us.txt` chars or plain ARPABET — looks like a packed multi-phoneme-per-token legacy form; exact tokenization not determined.

---

## 2. How DECtalk uses dictionary vs LTS

Driver loop: `C:\Users\Q\src\dectalk\463\dapi\src\LTS\ls_task.c`. Per-word processing runs a sequence of stages, each gated on `!done`:
```
ls_task.c:688  ls_task_spell_mode
ls_task.c:691  ls_task_minidic_search
ls_task.c:694  ls_task_math_mode
ls_task.c:697  done = ls_task_dictionary_search   <-- MAIN DICTIONARY
ls_task.c:743  ls_task_dictionary_after_punct     (retry after stripping punct)
...            (default LTS processing rules run only after, when still !done)
```
The header comment block confirms the model: a minidic and main-dictionary search precede the rule engine; `ls_task.c:754-758` says they stopped rescanning the dict after rule changes because "the dictionary lookup was made more clever, and understands case distinctions." So: **dictionary-first, LTS rules are the fallback** for words not found.

Homograph / POS resolution: `ls_task.c:580-595` comments state the dictionary search returns `form_class, dict_index, dict_type, dict_hit_type, homograph` per word, filled during a first pass (`first_pass=1`, `ls_task.c:573,580`). Header revision notes reference a "Homograph rule HIT" trace (`ls_task.c:561`) and form-class setup for function words (`ls_task.c:110`). So homographs (multiple `word,POS,...` rows) are disambiguated by form-class context, then the matching row's phoneme field is used. Exact homograph rule logic: in `ls_dict.c` / homograph rules; not read in detail this pass.

---

## 3. Qlatt's existing dictionary mechanism

### Loader
- `C:\Users\Q\code\Qlatt\src\cmu-dictionary-loader.ts`
  - `DEFAULT_CMU_DICTIONARY_PATH = "/cmu-dictionary.json"` (line 4) — single hardcoded default.
  - `preloadCmuDictionaryFromPath(specPath = DEFAULT_...)` (line 41) reads the JSON: Node path via `readFileFromFsSync` (line 49-57), else `fetch` (line 59-72). Caches per-path in `DICTIONARY_CACHE` (line 29).
  - Format: a flat JSON object `{ word: "PHONEME PHONEME ..." }` — `CmuDictionary = Record<string,string>` (line 3), values are space-joined ARPABET strings (parsed back via `.split(" ")`).

### Consumption
- `C:\Users\Q\code\Qlatt\src\transcribe-text.ts`
  - Module-level top-level await loads ONE map: `CMU_DICT_MAP = await preloadCmuDictionaryFromPath(DEFAULT_CMU_DICTIONARY_PATH)` (line 73-75). **This is global, not per-frontend.**
  - `cmuDictLookup: DictLookup` (line 81-105) closes over `CMU_DICT_MAP`, lowercases, tries elision/apostrophe/trailing-`.` variants and `read(1)` alternates, returns `string[] | null`.
  - `transcribeText(...)` (line 265): `effectiveDictLookup = options.dictLookup ?? cmuDictLookup` (line 267). The G2P chain is **dict -> morphology -> LTS** via `pronounce(sourceWord, effectiveDictLookup, {ltsPath, morphologyPath})` (line 358). Mirrors `src/g2p/index.ts:46` `dictResult = dictLookup(lowerWord)` then morphology (`index.ts:66`) then LTS.

### skip_dictionary / noOpDictLookup
- `C:\Users\Q\code\Qlatt\src\tts-frontend.ts`
  - `noOpDictLookup = (): null => null` (line 206).
  - Wiring (line 269): `dictLookup: (frontendSpec as ...).skip_dictionary ? noOpDictLookup : undefined`. When `skip_dictionary: true` (dectalk-english `frontend.yaml:4`), the no-op is injected so `pronounce` always falls through to morphology+LTS — **every word goes to LTS, no dictionary.** When false/absent, `dictLookup` is `undefined` so `transcribeText` uses the global `cmuDictLookup`.

### Per-frontend configurability
- `loadFrontendResources` (`C:\Users\Q\code\Qlatt\src\declarative-frontend\inventory.ts:260-273`) reads ONLY `inventory_path` (required), `lts_path`, `morphology_path`. There is **no `dictionary_path`** handled. So inventory/LTS/morphology are per-frontend file paths, but the dictionary is NOT — it is a hardcoded global CMU map. Adding a per-frontend dictionary path is the missing generic hook.

### Build
- `package.json:33`: `"build:dict": "node --loader ts-node/esm ... scripts/build-cmudict.ts"`.
- `C:\Users\Q\code\Qlatt\scripts\build-cmudict.ts` (15 lines): imports the npm `cmu-pronouncing-dictionary` package's `dictionary` object, `JSON.stringify`s it to `public/cmu-dictionary.json`. That's the entire build — no remapping, the npm package is already ARPABET keyed by lowercase word.
- `package.json:34`: `audit:dict-miss` -> `scripts/scan-dictionary-misses.ts` (exists; not read).

---

## 4. Gap & declarative options

Project rule (AGENTS.md "Declarative first" + memory `feedback_declarative_first`): data lives in YAML/data-assets, only generic infra in TS.

### The gap
- DECtalk dict (13.5k curated entries, homographs, abbreviations) is **not wired in**. dectalk-english runs pure LTS (`frontend.yaml:4 skip_dictionary: true`).
- Qlatt has the loader + lookup + G2P-chain infra, but the dictionary is a **single global** CMU JSON; no `dictionary_path` per frontend.
- The dectalk repo (`C:\Users\Q\src\dectalk\463\`) already ported inventory/lts/speakers via `scripts/convert_inventory.py`, `convert_lts.py`, `convert_speakers.py` (outputs in `output/qlatt/`), but there is **NO dictionary converter** and **no converted dict** in `output/` (verified: `output/` has charclass/durations/features/formants/inventory/lts-rules yaml + `qlatt/` with inventory+lts+speakers only; `find` for any dic file in `output/` returned nothing).

### Concrete declarative approaches

**Option A — Convert `Dic_us.txt` to the SAME JSON format Qlatt's CMU dict uses, add per-frontend `dictionary_path`.** (Lowest infra change; reuses existing loader.)
- Conversion script (new, in dectalk repo `scripts/` alongside the other converters, e.g. `convert_dictionary.py`): parse the 5-field CSV, for each `word,POS,phonemes,mask,priority` map the DECtalk phoneme chars -> ARPABET via the two tables (`dic.c ptab[]` + `usa_phon.tab usa_arpa[]`), attach stress digits from `'`/backtick markers, uppercase, reconcile names (nx->NG, hx->HH, ll->L, rr->ER...) to match `dectalk-english/inventory.yaml` symbol set. Emit `{ word: "AA1 R P AH ..." }` JSON. Homographs (same word, multiple POS rows): pick the highest-priority / dominant-POS row for the v1 single-pronunciation map (Qlatt's `CmuDictionary` is `Record<string,string>` — one pron per word), OR encode `read(1)` style alternates as the loader already supports `read(1)` (transcribe-text.ts:99-103).
- Generic TS infra to extend: add `dictionary_path` to `loadFrontendResources` (`inventory.ts:260`) and thread it so `transcribeText` loads a per-frontend dict instead of the global `cmuDictLookup`. Today the dict is a module-level top-level-await constant (`transcribe-text.ts:73`); making it per-frontend means moving the load into the per-call path or a per-path cache (loader already caches per-path). This is the one real generic-infra change. Replace `skip_dictionary: true` with `dictionary_path: /rules/frontends/dectalk-english/dictionary.json`.
- Size: dict JSON ~ comparable to entry count; 13.5k entries -> few hundred KB. Converter ~100-200 lines Python. Infra change ~small (one path field + load-site plumbing).
- Phoneme remapping: full, via the two tables above.

**Option B — Convert to a YAML data-asset under the frontend dir (consistent with inventory.yaml/lts-rules.yaml).** Same conversion logic as A, but output YAML keyed by word, and add a YAML dictionary loader. More consistent with "everything else is YAML per frontend," but adds a parallel YAML-dict loader (the existing loader is JSON-only, `cmu-dictionary-loader.ts:9` `JSON.parse`). Slightly more infra than A; larger file (YAML verbosity). Preserves homograph/POS as nested structure if desired (word -> list of {pos, phonemes, priority}), which would also need lookup logic to use POS — heavier.

**Option C — Port the abbreviation tables separately as a declarative expansion asset.** `TTSAbbr1.tab` / `TTSabbr2.tab` are abbreviation->pronunciation, distinct from the main dict and in a different (packed multi-token) notation. Convert each to a small JSON/YAML map and feed through the same dictionary mechanism (an abbreviation IS just a dictionary entry keyed by the abbreviation orthography). Can be folded into Option A's output (merge abbreviations into the same word->pron map) so no separate mechanism is needed — but requires a second small parser for the bracketed token format and reconciling its phoneme tokens to ARPABET (tokenization of `axl/aes/ixnx/hxaxw` not yet determined; needs a closer read of how DECtalk packs those before conversion).

### Recommendation framing (for the coder, not a decision)
- Option A is the smallest, reuses the existing JSON loader + `read(1)` alternate support, and only needs ONE generic infra addition: per-frontend `dictionary_path` in `loadFrontendResources` + load-site plumbing in `transcribe-text.ts` (replacing the module-global top-level-await CMU map with a per-path load). The conversion script belongs in the dectalk repo `scripts/` next to the other three converters, emitting into the Qlatt frontend dir.
- Homograph fidelity (POS-conditioned pronunciation) is the main thing lost in a flat word->pron map; if needed it requires lookup-time POS, which Qlatt's current `DictLookup` signature (`(word)=>string[]|null`, `g2p/types.ts:11`) does not carry. Flag as a v2 concern.

---

## Open / not-determined
- Exact semantics of the 29-bit mask field (proper-name + form-class bits) — header `Dic_us.txt:37-39` describes intent only.
- Exact homograph selection algorithm (in `ls_dict.c` / homograph rules) — not read this pass.
- Exact tokenization of `TTSAbbr*.tab` bracketed phoneme tokens (`axl`, `ixnx`, `hxaxw`) — packed legacy form, needs a closer read before converting Option C.
- Full DECtalk-code -> Qlatt-inventory name reconciliation list (the two tables give the raw ARPABET pairs; final uppercase+stress+name-fixups must be derived against `dectalk-english/inventory.yaml`'s exact key set).

## Key files
- `C:\Users\Q\src\dectalk\463\dapi\src\dic\Dic_us.txt` (main US dict, 13682 lines)
- `C:\Users\Q\src\dectalk\463\dapi\src\dic\dic.c:95-148` (char->US_* code table `ptab[]`)
- `C:\Users\Q\src\dectalk\463\dapi\src\INCLUDE\usa_phon.tab:117-250` (US_* code->ARPABET `usa_arpa[]`)
- `C:\Users\Q\src\dectalk\463\dapi\src\dic\TTSAbbr1.tab`, `TTSabbr2.tab` (abbreviations, different notation)
- `C:\Users\Q\src\dectalk\463\dapi\src\LTS\ls_task.c:697,743,580-595` (dict-first ordering, homograph fields)
- `C:\Users\Q\src\dectalk\463\scripts\convert_inventory.py` / `convert_lts.py` / `convert_speakers.py` (precedent converters; NO dict converter exists)
- `C:\Users\Q\src\dectalk\463\output\qlatt\` (converted assets; no dict)
- `C:\Users\Q\code\Qlatt\src\cmu-dictionary-loader.ts:4,41` (JSON dict loader, hardcoded default path)
- `C:\Users\Q\code\Qlatt\src\transcribe-text.ts:73,81,267,358` (global CMU map, lookup, G2P chain)
- `C:\Users\Q\code\Qlatt\src\tts-frontend.ts:206,269` (noOpDictLookup, skip_dictionary wiring)
- `C:\Users\Q\code\Qlatt\src\declarative-frontend\inventory.ts:260-273` (loadFrontendResources — no dictionary_path)
- `C:\Users\Q\code\Qlatt\scripts\build-cmudict.ts` (CMU dict build)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\frontend.yaml:4` (skip_dictionary: true)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\inventory.yaml` (ARPABET+stress symbol set)
