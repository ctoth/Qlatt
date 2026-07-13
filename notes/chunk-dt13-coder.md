# Chunk DT13 — female locus table (us_femloc) + sex-based selection (coder)

Date: 2026-05-29. Branch `dectalk-parity`. Mission: add DECtalk 4.63 FEMALE
locus table to dectalk-english; select male vs female loci by selected voice's
`sex`. Paul/male byte-identical. ZERO per-voice-name TS branches.

## State / progress
- Read design notes (chunk-dt-t4a-data-coder.md, chunk-dt-tier4-transition-design.md).
- Studied commit 9b44cb50 (dt-t4a-data): male table extracted from us_maleloc[]
  via us_plocu indexing into frontend.yaml output.lowering.transitions.{loci,
  vowel_category}. Engine: resolveLocusBoundary in track-assembler.ts.
- Extractor: C:\Users\Q\src\dectalk\463\scripts\extract_loci.py. Reads
  us_plocu/us_maleloc/us_begtyp/us_endtyp from p_us_rom.h, emits us_loci.yaml.

## Voice YAMLs (confirmed)
- speakers/*.yaml each have `sex: male|female`. Paul sex=male formant_scale=1.
  Betty sex=female formant_scale=1.17. So female voices DO carry formant_scale.

## KEY QUESTION (formant_scale interaction) — RESOLVED. No double-application.
- DECtalk setloc (ph_sttr2.c:159-169): picks p_locus = us_maleloc if malfem==MALE
  else us_femloc. bouval = locus + prcnt*(curval-locus)/100. locus = p_locus[ploc]
  (absolute Hz from the chosen table); curval = vowel target (getbegtar/getendtar).
  NO formant scaling is applied to `locus` inside setloc — femloc IS the absolute
  female locus. (Confirmed: us_femloc[1..]=300,30,30 / 1380,10,35 / 2100,30,20 vs
  us_maleloc 280/1200/2000 — femloc values are higher = female-absolute, not relative.)
- Qlatt model: formant_scale (Betty 1.17) is the port's analogue of DECtalk's
  separate female formant tables. applySpeakerProfileToParams (tts-frontend.ts:201-208)
  multiplies frame params F1..F10 by formant_scale BEFORE track assembly. So the
  vowel steady target curval that resolveLocusBoundary reads is ALREADY scaled
  (= female F2). The loci DATA block in the lowering spec is config, NOT frame
  params — it never passes through the formant_scale loop. So the female locus is
  consumed AS-IS (absolute Hz). EXACTLY matching DECtalk (absolute femloc + female
  curval). NO double-application: the femloc is absolute, curval is female-scaled,
  bouval combines two absolute-female quantities. DECISION: female loci used
  directly, no formant_scale multiply. (Hard-stop (c) cleared — not ambiguous.)
- us_femloc structure = identical to us_maleloc (leading 0, 9 shorts/obstruent,
  same us_plocu indexing; only p_locus pointer differs). Extractor reuses same indexing.

## extract_loci.py mechanism
- parse_short_array(text, name) reads `const short name[] = {...}`.
- maleloc indexed: ploc0 = plocu[code + 59*(sontyx-1)]; entry = maleloc[ploc0+3*fi ..+2].
- To add female: parse us_femloc, emit second 'loci_female' (or {male,female}).

## NEXT
1. Read DECtalk source: how formant_scale applies vs femloc loci (double-apply?).
2. Read Qlatt track-assembler resolveLocusBoundary + where formant_scale applied.
3. Extend extract_loci.py to emit female table.
4. frontend.yaml: add female loci data.
5. resolver: select table by selected voice sex (generic).
6. Probe + vitest + golden + Paul byte-identical.

## EXTRACTION DONE
- extract_loci.py extended: parses us_femloc, build_loci(locarr) helper builds
  both tables from SHARED us_plocu index. Emits loci (male) + loci_female + shared
  vowel_category. Asserts male/female obstruent sets match (both 26).
- Verified F2 loci male vs female: B 900->1350, D 1800->2150, S 1440->2000,
  P 950->1570, T 1700->2160 — female consistently HIGHER (female-absolute). F=1
  both (degenerate sentinel, same as male). us_femloc len 911 == us_maleloc len.

## PLAN (engine)
- TrackLoweringSpec.transitions: add optional loci_female?: LocusTable.
- TrackLoweringContext: add voiceSex?: string. tts-frontend passes selectedVoice sex.
- ResolvedVoice: add sex?: string (read from voice YAML doc.sex). Generic.
- lowerControlScoreToKlattTrack: activeLoci = (voiceSex==='female' && loci_female)
  ? loci_female : loci. Pass activeLoci everywhere loci was passed (resolver +
  adjacentLocusObstruent). vowel_category shared (begtyp/endtyp not sex-dependent).
- Paul byte-identical: Paul sex=male -> activeLoci = loci (male) -> unchanged.
  Default (no speaker) -> voiceSex undefined -> male. qlatt-english no loci -> no-op.
- validation: extend validateLocusTables to also check loci_female.

## NEXT
1. gen-dectalk-loci-yaml.mjs: emit loci_female block too.
2. Splice into frontend.yaml.
3. Engine edits (types, context, resolver selection, ResolvedVoice.sex).
4. validation.
5. Probe dt13-female-locus-probe.ts (paul vs betty F2 near boundary).
6. vitest + golden + Paul byte-identical.

## DATA SPLICED + ENGINE IMPLEMENTED
- frontend.yaml: loci_female (26 obstruents) spliced between loci and vowel_category.
  js-yaml parses; loci/loci_female/vowel_category = 26/26/31. B.1.F2 male900/fem1350.
- track-assembler.ts:
  - TrackLoweringSpec.transitions.loci_female?: LocusTable (type + doc).
  - TrackLoweringContext.voiceSex?: string.
  - loci selection: context.voiceSex==='female' && loci_female != null ? loci_female
    : loci. vowelCategory shared. All resolver/adjacentLocusObstruent calls use the
    selected `loci` local — no other change needed.
- dectalk-voice.ts: ResolvedVoice.sex?: string; resolveVoice reads doc.sex.
- tts-frontend.ts: lowering context voiceSex: selectedVoice?.sex.
- validation.ts: factored validateLocusTable(table, base); validateLocusTables now
  validates loci + loci_female + vowel_category.
- All branches GENERIC: only branch is the data string "female". No voice names.
- Paul byte-identical by construction: Paul sex=male -> loci (male). Default (no
  speaker selected) -> selectedVoice null -> voiceSex undefined -> loci (male).
  qlatt-english: no loci/loci_female -> resolver no-op (unchanged).

## NEXT
1. tsc (expect 67 pre-existing test-file errors, 0 new in src/).
2. Probe scripts/dt13-female-locus-probe.ts: paul vs betty F2 near boundary.
3. vitest (baseline 1119) + golden + Paul byte-identical sha1.

## PROBE + VITEST + IDENTITY (in progress)
- dt13-female-locus-probe.ts: RESULT OK. For bee/see/key/tea: male/female loci
  DIFFER; Paul boundary F2 == male bouval exactly; Betty boundary F2 == FEMALE
  bouval exactly (2014/2137/2246/2338), distinct from male-would-be (1772/1847/
  2083/2200). Betty IY steadyF2=2457 = 2100*1.17 (curval scaled, locus absolute,
  no double-scale). Confirms sex-selected female table used, Paul unchanged.
- vitest: 1119 passed / 126 files (baseline 1119). No tracked oracle/snapshot/json
  baseline modified (the 3 "baseline" hits are untracked notes files, not mine).
- Byte-identity: scripts/dt13-byte-identity.ts hashes dectalk-default, dectalk-paul,
  qlatt-english tracks. WITH dt13:
    dectalk default 9d7f5826..., paul e0031f3f..., qlatt-english e60de3c2...
  Comparing against committed HEAD via `git worktree add --detach Qlatt-dt13-head`
  (NOT git stash — shared tree). node_modules absent in worktree; symlinking next.

## DONE — full verification
- BYTE-IDENTITY PROVEN (not inferred): hashed dectalk-default, dectalk-paul,
  qlatt-english rendered tracks for 5 phrases. Committed HEAD (via detached
  `git worktree add` — NOT git stash, shared tree untouched) vs dt13 changes:
    dectalk default 9d7f5826... == 9d7f5826...  ✓
    dectalk paul    e0031f3f... == e0031f3f...  ✓
    qlatt-english   e60de3c2... == e60de3c2...  ✓
  All three IDENTICAL. Paul/male/default + qlatt-english byte-identical. (Worktree
  + junction + temp hash script all removed afterward; probe kept.)
- vitest: 1119 passed / 126 files (== baseline 1119). No tracked baseline/snapshot/
  json modified.
- golden: `npm run test:golden` (run-golden.ts) exit 0. qlatt-english (render-phrase
  default) byte-identical -> render-phrase unchanged. lf-source golden untouched.
- tsc: 67 pre-existing test-file errors, ZERO new in src/.
- Hard-stops: (a) zero per-voice-name branches (only branch is data string
  "female"); (b) Paul byte-identical PROVEN; (c) femloc/formant_scale RESOLVED
  (no double-scale); (d) NO git add/commit; (e) qlatt-english + lf-source untouched.

## FILES CHANGED
- Qlatt: public/rules/frontends/dectalk-english/frontend.yaml (+loci_female 339 lines),
  src/track-assembler.ts (loci_female type + voiceSex context + sex-based loci
  selection), src/dectalk-voice.ts (ResolvedVoice.sex + read doc.sex),
  src/tts-frontend.ts (pass voiceSex: selectedVoice?.sex to lowering ctx),
  src/declarative-frontend/validation.ts (factored validateLocusTable, validate
  loci_female), scripts/gen-dectalk-loci-yaml.mjs (emit loci_female block).
  New: scripts/dt13-female-locus-probe.ts.
- dectalk repo (read-only ref): scripts/extract_loci.py (parse us_femloc, build_loci
  helper, emit loci_female), output/us_loci.yaml regenerated.

## Blockers
- None. COMPLETE. formant_scale interaction RESOLVED (loci data not scaled; femloc absolute).
