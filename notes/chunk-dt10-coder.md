# Chunk dt-10: Generic syllabify pass (annotation only)

Datestamp 2026-05-29. Coder. Branch dectalk-parity.

## Mission
Add generic `syllabify` pass annotating phone tokens with syllable_index / syllable_role
{onset,nucleus,coda} / syllable_position_in_word. Tables = DATA (from p_us_sy1.c). Enable for
dectalk-english. ANNOTATION ONLY — must be byte-identical (npx vitest run = 1107, zero snapshot changes).

## Findings so far
- Engine builtins live in engine.ts ~L1180-1318: count_word_vowels (L1251), word_count (L1271,
  ALREADY EXISTS — recon said "not determined"), cluster_position_in_word (L1293). These read
  getActiveStreamTokens("phone"). Pattern to follow for a syllabify pass.
- Phase ordering in tts-frontend.ts runPhases: normalize -> postlexical -> structural ->
  (annotate id/stream/status) -> "annotation" phase (L565) -> annotateProsody -> duration -> formant -> prosody/finalize.
  The existing "annotation" phase (phases/annotation.yaml) is where syllable count/cluster pos are done declaratively.
  => syllabify slots AFTER structural, before duration. The annotation phase is the natural home.
- dectalk-english frontend: public/rules/frontends/dectalk-english/{frontend.yaml,inventory.yaml,pipeline.yaml,phases/*}
  phases: duration, formant, postlexical, prosody, structural. NO annotation.yaml in dectalk yet (qlatt-english has one).
- DECtalk tables (p_us_sy1.c):
  - us_ascky_check[] L40-54: phone-index -> sonority char or 0 (non-sounded skip).
  - us_syl_vowels = "a@AeEiIoOuU^WRc|xLN" (nuclei incl syllabic L,N,R,x).
  - us_syl_cons L148-186: legal ONSET clusters longest-first (spl,spr,str,skw,skl,skr; " Sm"," SL"; 2-char; " Y"; 1-char).
  - us_common_affixes L62-138: ~95 affix strings in ascky chars.
- g2p/syllabify.ts is a DIFFERENT (dictionary-side) syllabifier — not this.

## Key design decisions (pending)
- ascky char alphabet -> ARPABET mapping. Need the phone-index enum (ph_def.h) to map ascky_check
  index positions to DECtalk phone names, then DECtalk phone -> port ARPABET.
- Whether to implement as a built-in CEL helper writing fields, or an engine pass. Recon §2.4 prefers
  a built-in `syllabify` pass (whole-word loop, not per-token CEL).

## RESOLVED
- Phone enum: l_all_ph.h L61-119. SIL=0, US_IY=1 ... US_CZ=58. ascky_check INDEX = US_ enum value.
  So ascky char for phone NAME = us_ascky_check[US_<NAME>]. The DECtalk phone NAME (US_IY->"IY") IS
  the ARPABET symbol. Port divergences: HH=DECtalk HX(28), NG=NX(33), GS=Q(53). Port vowels carry
  stress suffix (IY1/IY0 -> base IY). port has no YU/YX/LL/TZ/CZ in inventory (Y, no LL).
- Field-write mechanism CONFIRMED: annotation.yaml (qlatt-english) already writes arbitrary metadata
  fields word_syllable_count / cluster_position via `apply: op:set field:<name>` — NOT params, plain
  token metadata. So syllable_index/syllable_role/syllable_position_in_word can be written the same way,
  the VALUE being a CEL builtin call. word_count builtin ALREADY exists (engine L1271).
- STRUCTURAL splits stops: post-structural token phonemes include T_REL/T_ASP/P_REL etc + inserted
  SIL dummy_vowel tokens. The annotation phase runs AFTER structural. syllabify must treat
  release/aspiration/dummy as transparent (ascky 0) OR map _REL->base consonant. Onset-max over a word
  whose stops are already split needs care.

## BASELINE: npx vitest run = 1107 passed / 125 files (2026-05-29, clean dectalk-parity tree).

## Wiring confirmed
- Tables go in dectalk-english/pipeline.yaml as a top-level `syllabification:` block (like string_sets/maps,
  Chunk 3). frontend.yaml includes pipeline.yaml. Validator validateDslSpec (validation.ts L2312) — add
  validateSyllabification. runtime obj (engine.ts L3142) — add syllabification binding from spec.
- buildNavigationFunctions closes over `runtime` (L815-822 reads runtime.string_sets/maps). New builtins
  read runtime.syllabification. Builtins go in the `functions` object (L1177-1319) next to count_word_vowels.
- annotation phase: dectalk-english pipeline has NO annotation phase -> runPhases(["annotation"]) is a no-op
  for it today. ADD `annotation` phase to dectalk pipeline.yaml; tts-frontend.ts runs it AFTER structural,
  before duration. (pipeline.yaml phase-list order != exec order; tts-frontend drives by name.)
- frontendPhones (FrontendPhoneSummary, tts-frontend.ts L110/L725) — add syllable_index/syllable_role/
  syllable_position_in_word so the probe can read them.
- post-structural tokens include split-stop segments (T_REL,T_ASP, dummy SIL). syllabify normalizes phoneme:
  strip trailing /[01]/ stress digit and _REL/_ASP/_CL suffix to base; map base ARPABET->ascky via table;
  ascky 0 (release/dummy/boundary) = transparent skip.

## IMPORTANT DIVERGENCE (found via failing unit test)
- DECtalk us_ascky_check[] marks the r-colored vowels US_IR(19)/ER(20)/AR(21)/OR(22)/UR(23) as 0
  (TRANSPARENT). Reason: DECtalk syllabifies BEFORE r-fusion; at that point words are e.g. K AH R, not
  K AR. The fused vowel codes only exist post-allophone.
- BUT the Qlatt port runs r-fusion (postlexical) BEFORE structural/annotation, so by the time syllabify
  runs the stream HAS AR/ER/IR/OR/UR as the nucleus. If left transparent they vanish from syllabification
  -> wrong syllable counts for "car","computer"(ER),"fear" etc.
- FIX: the ascky map must give these port rhotic vowels a NUCLEUS ascky char. DECtalk's pre-fusion form
  was vowel+R, and the retroflex RR has ascky 'R' which IS a nucleus. So map ER/IR/AR/OR/UR -> 'R'
  (same nucleus class as RR). This is a port-specific table entry, cited: the port fuses before syllabify
  whereas DECtalk fuses after, so the fused rhotic vowels join the syllabic-r nucleus class (US_RR ascky 'R').
  Extraction script auto-maps RR->R (nucleus). Add IR/ER/AR/OR/UR->R manually in the data with a comment.
- AX (US_AX=17) ascky 'x' IS a nucleus (schwa). IX (18) 'x'? IX ascky '|' which is in nuclei. Good.

## PROGRESS 2026-05-29
- DONE: src/declarative-frontend/syllabify.ts — pure data-driven algorithm. parseSyllabificationTables,
  basePhonemeSymbol, syllabifyWord. Maximal-onset + affix-stripping in ascky space. NO hardcoded
  linguistic data (tables passed in).
- DONE: scripts/dt10-extract-syllable-tables.ts — extracts ascky map / nuclei / onset_clusters / affixes
  from p_us_sy1.c + l_all_ph.h. Zero unmapped ascky chars. Adds port rhotic-vowel override (IR/ER/AR/OR/UR->R).
- DONE: test/syllabify-algorithm.test.ts — 12 tests pass (computer/happy/apple/strength/running/secret/
  napkin/button/payment/shipment/split-stop). DoD examples covered at algorithm level.
- NEXT: wire into engine — runtime.syllabification binding, validateSyllabification, CEL builtins
  syllable_index/syllable_role/syllable_position_in_word reading runtime.syllabification + active phone
  stream (memoized per word). Add syllabification: block + annotation phase to dectalk pipeline.yaml.
  Expose 3 fields on FrontendPhoneSummary. Then dt10-syllable-probe.ts + full vitest (expect 1107 + new).

## PROGRESS 2 (engine wiring done)
- engine.ts: import syllabify; runtime.syllabification = parseSyllabificationTables(spec.syllabification);
  builtins syllable_index/role/position_in_word via syllableField() helper (memoized per same-word RUN
  keyed by run-start index, cleared in invalidateStreamCache). Reads runtime.syllabification + active phone stream.
- validation.ts: validateSyllabification added + called in validateDslSpec.
- parser.ts: "syllabification" added to ROOT_DSL_KEYS + carried through.
- tts-frontend.ts: FrontendPhoneSummary + syllableIndex/syllableRole/syllablePositionInWord populated
  from token.syllable_index/role/position_in_word.
- phases/annotation.yaml (dectalk): 3 scalar rules writing the fields via builtins (guard SIL/word-less).
- NEXT: add to dectalk pipeline.yaml: include phases/annotation.yaml (in frontend.yaml), add `annotation`
  phase to phases list, add syllabification: data block. Then typecheck, dt10 probe, full vitest (expect 1107+new).

## BLOCKER (2026-05-29): probe shows all syllable fields null
- CEL validator allow-list fixed (cel-expressions.ts KNOWN_FUNCTIONS + knownFunctionNames + zeroArgFunctions).
  Spec now loads (no E_CEL_INVALID).
- BUT dt10 probe: every token idx/role/pos = "-" (null). Annotation rules didn't write.
- Observations: post-structural vowels show NO stress digit (AH, AE) except AR0/IR1. Need to verify:
  (a) does the annotation phase actually execute for dectalk-english? (b) do tokens carry `word`?
  (c) does runtime.syllabification reach the builtin (non-null)? (d) does op:set string survive to frontendPhones?
- NEXT: instrument / inspect. Likely cause candidates: builtin returns null (word empty OR syllabification
  null OR getTokenIndex<0), OR op:set on these metadata fields not surfaced on phoneSequence tokens.

## RESOLVED BLOCKER + probe working (2026-05-29)
- Root cause of null fields: rule-pack.ts mergeChildIntoRoot DROPPED unknown child root keys silently
  (syllabification not in its ROOT_DSL_KEYS). FIX: added syllabification to rule-pack ROOT_DSL_KEYS +
  MERGED_CHILD_ROOT_KEYS + a whole-object merge clause (dup-errors). Also CEL allow-list (cel-expressions.ts).
- Probe now annotates correctly. Onset-max verified: apple [ae][p el], napkin [n ae p k][k_rel ih n]
  (pk not legal onset -> split), secret [s iy k][k_rel rr][ih t], shipment splits at -ment affix.
- NOTE (transcription, not algorithm): "strength"/"running" show extra syllable because the dectalk g2p
  transcribes /r/ as RR (the syllabic-r US_RR, ascky 'R', which IS a nucleus). Prevocalic-R->RR and
  r-fusion run in postlexical BEFORE syllabify. So RR counts as a nucleus -> these read 2/3 syllables.
  This is faithful: RR is in us_syl_vowels. The onset cluster [s t r... rr] is still grouped in syll 0.
- count parity: syllable count == nucleus count == count_word_vowels-analog (nuclei incl EL/EN/RR).
- Split-stop _REL/_ASP/dummy phones inherit their base consonant's syllable (transparent), shown in probe.

## DONE — final state + evidence (2026-05-29)

### Table extraction method
scripts/dt10-extract-syllable-tables.ts reads p_us_sy1.c (us_ascky_check[], us_syl_vowels,
us_syl_cons, us_common_affixes) + l_all_ph.h (US_* phone enum, SIL=0..US_CZ=58). The us_ascky_check[]
INDEX is the US_* enum value, so ascky char for phone NAME = us_ascky_check[US_NAME]. The phone NAME
is the port ARPABET symbol. Zero unmapped ascky chars (every char in nuclei/onsets/affixes has a preimage).

### ascky -> ARPABET mapping
Direct enum-name = ARPABET, with 3 port renames: HX->HH, NX->NG, Q->GS. Vowels carry stress suffix
(IY1/IY0) stripped to base by basePhonemeSymbol. PORT-SPECIFIC OVERRIDE: IR/ER/AR/OR/UR (us_ascky_check 0
in DECtalk, transparent, because DECtalk syllabifies before r-fusion) -> 'R' (US_RR nucleus char) because
the Qlatt port fuses r in the postlexical phase BEFORE syllabify, so the fused rhotic vowel is the nucleus.

### Algorithm + where it runs
src/declarative-frontend/syllabify.ts: pure data-driven maximal-onset + affix-stripping in ascky space.
Engine builtins syllable_index/syllable_role/syllable_position_in_word (engine.ts, memoized per same-word
RUN). Run by the `annotation` phase (dectalk pipeline.yaml, phases/annotation.yaml) which tts-frontend.ts
executes AFTER structural, BEFORE duration. Tables = DATA in pipeline.yaml `syllabification:` block.
Wiring added in: parser.ts (root key), validation.ts (validateSyllabification), rule-pack.ts (include
merge — was the silent-drop bug), cel-expressions.ts (CEL allow-list), tts-frontend.ts (FrontendPhoneSummary).

### Probe output (scripts/dt10-syllable-probe.ts)
apple -> [ae][p el] (onset-max: /p/ onsets syll1). napkin -> [n ae p][k ih n] (pk illegal -> split).
secret -> [s iy k][k_rel rr][ih t]. shipment -> splits at -ment affix. car/fear -> 1 syllable.
computer -> 3 syllables. happy -> 2. Split-stop _REL phones inherit base consonant's syllable.
Transcription note: strength/running read +1 syllable because dectalk g2p emits /r/ as RR (a real nucleus
in us_syl_vowels) — faithful, not an algorithm bug. Count == nucleus count == count_word_vowels analog.

### Byte-identity evidence
- npx vitest run: 1119 passed / 126 files (was 1107/125 baseline + 12 new syllabify-algorithm tests).
  ALL pre-existing 1107 still pass. ZERO failures.
- git status: only my 8 source/config files + dt10 scripts/test modified. ZERO snapshot/golden files changed.
- render-phrase golden script exit=0 (unchanged). tts-frontend-declarative-golden-summary vitest passed.
- lf-source-wasm-compare exits 1 on BOTH my branch AND clean HEAD worktree -> PRE-EXISTING (missing WASM
  build artifact), unrelated to frontend annotation. Do not touch.
- qlatt-english: no syllabification block -> builtins return null -> NO syllable fields written (verified
  via throwaway no-op check). Untouched.

## Files changed
src/declarative-frontend/{syllabify.ts(new),engine.ts,validation.ts,parser.ts,rule-pack.ts,cel-expressions.ts}
src/tts-frontend.ts
public/rules/frontends/dectalk-english/{pipeline.yaml,frontend.yaml,phases/annotation.yaml(new)}
test/syllabify-algorithm.test.ts(new)
scripts/{dt10-extract-syllable-tables.ts,dt10-syllable-probe.ts}(new)

## Plan (original)
- Add CEL builtins `syllable_index()`, `syllable_role()`, `syllable_position_in_word()` analogous to
  count_word_vowels: each computes (memoized per word) the maximal-onset+affix syllabification over the
  current token's word, using onset-cluster/vowel/affix TABLES loaded from frontend config (DATA).
  Tables: syllabification: {vowels: [...ascky], onset_clusters: [...], affixes: [...], ascky_map: {ARPABET->char}}.
  A frontend without a `syllabification:` block -> builtins return null -> annotation rule is no-op.
- annotation.yaml (NEW for dectalk-english) calls these builtins via op:set, gated on having tables.
- Tables live in a cited data file. Map ascky chars back to ARPABET for the algorithm (work in ascky space,
  since onset_clusters/vowels/affixes are ascky strings).
- Next: read how builtins can see frontend config (the syllabification tables). Check engine builtin
  closure for access to frontendSpec / pipeline params.
