# Chunk DT t4a-data — locus tables as DATA + generic locus resolver (coder)

Date: 2026-05-29. Branch `dectalk-parity`. Mission: add DECtalk 4.63 locus-based
formant transitions at obstruent↔vowel boundaries to `dectalk-english`.

## State / progress
- Read design `notes/chunk-dt-tier4-transition-design.md` + primitive
  `notes/chunk-dt-t4a-prim-coder.md` + commit d916bfa5.
- Primitive (committed): `resolveBoundaryParams(steady, neighbor, keys, factor,
  spanSec, edge, resolver=midpointBoundaryResolver)` in track-assembler.ts.
  - `BoundaryEdge` = "forward"|"backward"; resolver returns `{value, spanSec}|null`.
  - Apply site (~L1454) currently calls it on "backward" edge only, gated by
    smooth_types (obstruents EXCLUDED). midpointBoundaryResolver = 50% blend.

## Mechanism (from design §1.2)
- `bouval = locus + prcnt*(curval-locus)/100`. Ramp LINEARLY bouval→steady over durtran.
- forward edge = segment START (vowel after obstruent); backward = segment END (vowel before obstruent).
- Locus index: `ploc = us_plocu[fonobst + 59*(sontyx-1)]`; if 0 → no locus.
  `ploc += 3*(np-PF1)` (F1=0,F2=3,F3=6). Entry = us_maleloc[ploc..ploc+2] = {locus_hz, prcnt, durtran_ms}.
- sontyx: 1=front-unrounded, 2=back-unrounded, 3=back-rounded (vowel category).
- Frame period 6.4ms. US_TOT_ALLOPHONES=59.

## TODO
1. Write extraction script in dectalk repo scripts/ reading us_maleloc[] + us_plocu → YAML.
2. Locus data YAML in dectalk-english frontend.
3. Generic locus resolver in track-assembler reading data from config.
4. Wire obstruent edges (forward + backward) into smoothing; keep non-obstruent midpoint unchanged.
5. Probe scripts/dt-t4a-data-probe.ts: CV/VC words, show F2 ramps to locus.
6. vitest + golden; regen only changed dectalk snapshots; qlatt-english MUST be unchanged.

## Qlatt internals observed
- Apply site track-assembler.ts L1444-1502. `finalParams`=this seg steady, `nextParams`=next seg steady.
  Currently ONLY backward edge (events at/after steadyTime use transitionParams). Forward edge
  (segment START) NOT emitted — need to add forward window for vowel-after-obstruent.
- `applyControlWindowsAtOffset` (L333-356): events >= steadyTime use transitionParams, else baseParams.
  This is the END ramp. For forward edge I need a START transition: events <= forwardSteadyTime use
  a forward bouval, ramping to steady. Must extend this mechanism.
- Lowering spec: `getTrackLoweringSpec` (tts-frontend.ts:129) just casts YAML output.lowering. Adding
  a `loci` block to YAML + to TrackLoweringSpec type makes it available. Validation in
  validation.ts:2104-2120 (transitions block). Add validation for `transitions.loci` (optional).
- segment fields: `phoneme` (e.g. B, AA), `type` (string). prosody has stress info.
- TYPE taxonomy (dectalk inventory): obstruents = fricative, affricate, stop_closure,
  stop_release, stop_aspiration, flap(?). sonorants = vowel, nasal, liquid, glide. silence.
  smooth_types currently [vowel,nasal,liquid,glide]. Obstruent↔vowel edge = (this in smooth_types
  vowel) AND (neighbor type in obstruent set) — generic check via type, no phoneme literals.

## Design decision (locus resolver + edge wiring)
- Locus data in YAML under output.lowering.transitions.loci: map phoneme(obstruent) ->
  per sontyx(1/2/3) -> {F1:{locus,prcnt,durtran_ms},F2:...,F3:...}. Resolver looks up by
  (neighbor obstruent phoneme, vowel category, key). bouval = locus + prcnt*(curval-locus)/100.
  spanSec = durtran_ms/1000. curval = this vowel's steady target for that key.
- sontyx (vowel category) = needs per-vowel-phoneme classification (front-unrounded=1,
  back-unrounded=2, back-rounded=3). Put as DATA: vowel_category map phoneme->1/2/3 in YAML.
- Edge wiring: when this seg is a smooth vowel and the OBSTRUENT is the neighbor:
  obstruent precedes (prev) -> forward edge on this vowel's START; obstruent follows (next) ->
  backward edge on this vowel's END. Resolver returns null when no locus -> fall back.

## DECtalk source RESOLVED (no ambiguity)
- setloc = ph_sttr2.c:71-329. Indexing (US path L159-170):
  `ploc = plocu(fonobst_code + 59*(sontyx-1))`; if 0 -> no locus (return 0).
  `ploc += 3*(np-PF1)` (F1=0,F2=3,F3=6). locus=p_locus[ploc], prcnt=[ploc+1], durtran_ms=[ploc+2].
  `bouval = locus + muldv(prcnt, curval-locus, 100)` = locus + prcnt*(curval-locus)/100.
- us_plocu[] = 59*3=177 entries (3 sontyx blocks of 59 allophones). Block0 entries 0-30 = 0
  (vowels/sonorants), obstruents 31+ = 1,10,19,(0 for DZ),28,37,... step 9. HX(34=/h/)=0 too.
- us_maleloc[]/us_femloc[]: flat short[]; us_maleloc[0]=0 leading; ploc=1 -> F1{280,30,30}
  F2{1200,10,25} F3{2000,30,40} (matches design). Each obstruent block = 9 shorts.
- sontyx = us_begtyp[allophone] / us_endtyp[allophone] (per p_us_rom.h:852/...). Values:
  1=FRONT_VOWEL, 2=BACK_UNROUNDED, 3=BACK_ROUNDED, 4=OBSTRUENT, 5=ROUNDED_SONOR_CONS, 6=LOW.
  setloc: typso=begtyp/endtyp of sonorant; if typso==ROUNDED_SONOR_CONS(5) -> sontyx=3; if
  typso==6(low) -> sontyx=2. So vowel category = clamp(begtyp/endtyp -> {1,2,3}).
  forward edge (obstruent precedes, use sonorant BEGIN, initfinso='i') -> us_begtyp;
  backward edge (obstruent follows, use sonorant END, 'f') -> us_endtyp.
- Allophone name table already in scripts/shared_constants.py (US_PHONEME_NAMES 0-58).
- prcnt adjustments (setloc L294-307): (a) rounded-soncon + non-palatal/non-dental obst, F2/F3:
  prcnt=prcnt/2+50. (b) F2 + f2backaffil (place&F2BACKI/F): prcnt += 25-prcnt/4; durtran=durtran/2+2.
  DEFER these two adjustments to a later chunk (they need place() bits + soncon detection); the
  CORE locus pull (locus+prcnt*(curval-locus)/100) is the t4a deliverable. Note this in YAML.
- plocu/begtyp macros (ph_prot.h:74-101) = all_X[phone>>8][phone&0xFF]; logical = flat us_X[code].
  Extraction reads flat arrays directly (verified lengths) — matches setloc logical indexing.

## Plan locked
1. Script scripts/extract_loci.py (dectalk repo) reads us_plocu/us_maleloc/us_femloc/us_begtyp/
   us_endtyp -> emit YAML: per obstruent phoneme -> per sontyx(1/2/3) -> {F1,F2,F3:{locus,prcnt,
   durtran_ms}}. Plus vowel_category map (phoneme->1/2/3) from begtyp clamped. MALE table (Paul).
2. YAML data into dectalk-english frontend.yaml output.lowering.transitions.loci + vowel_category.
3. TrackLoweringSpec type + validation: optional `transitions.loci` + `transitions.vowel_category`.
4. Locus resolver in track-assembler reading loci data; wire forward+backward obstruent edges.
5. Probe + vitest + golden + baseline regen scope.

## EXTRACTION DONE (verified correct)
- scripts/extract_loci.py (dectalk repo) -> output/us_loci.yaml. us_plocu len 236 (4 blocks of 59;
  4th = dead low-vowel table, sontyx clamps to 1/2/3 = first 3 blocks). us_maleloc len 911.
- 26 obstruents w/ loci: B CH CZ D DF DH DX DZ EN F G JH K M N NX P S SH T TH TX TZ V Z ZH.
  (M,N,NX,EN are nasals — begtyp=4 OBSTRUENT-coded; nasal murmur uses locus table, correct DT.)
- 31 sonorant categories (vowel_category map, forward=begtyp backward=endtyp, clamped).
- CORRECTNESS sanity (F2 locus by sontyx): B/P labial ~900-950 (low) ✓; D/T/S alveolar ~1700-1800 ✓;
  G/K velar 2100 front -> 1400-1600 back (velar pinch) ✓. Matches mission's expected loci.
- Deferred (documented in YAML): the 2 setloc prcnt adjustments (rounded-soncon, F2 back-cavity).
- scripts/gen-dectalk-loci-yaml.mjs (Qlatt) reshapes us_loci.yaml -> indented YAML block for
  frontend.yaml output.lowering.transitions. Uses js-yaml (project dep). sontyx keys -> "1"/"2"/"3" strings.

## NEXT
- Run generator, splice loci+vowel_category into dectalk frontend.yaml transitions block.
- TrackLoweringSpec type + validation (optional loci/vowel_category).
- Locus resolver + forward/backward obstruent edge wiring in track-assembler.
- Probe scripts/dt-t4a-data-probe.ts, vitest, golden, regen scope.

## DATA SPLICED + VERIFIED
- frontend.yaml output.lowering.transitions now has loci (26 obstruents) + vowel_category (31).
  Parses via js-yaml; B.1.F2={900,56,30}, AA={fwd2,bwd2}. Temp files removed.
- TrackLoweringSpec type extended: optional loci/vowel_category + LocusEntry/LocusTable/
  VowelCategoryTable types. (track-assembler.ts)

## ENGINE DESIGN DECISION (per-formant durtran)
- DECtalk durtran is per-formant; the apply-site single-steadyTime window holds ONE span/edge.
- CHOSE Option A: one locus window per edge, span = MAX(durtran over the locus F1/F2/F3 keys).
  Each formant's bouval is set EXACTLY at the edge; linear ramp to steady over the window.
  Endpoints + direction exact; only the slope of shorter-durtran formants is approximate.
  Per-key spans deferred (documented). Honors committed primitive (edge/span already threaded).
- Resolver `resolveLocusBoundary(vowelSeg, obstruentSeg, edge, loci, vowel_category, key, steady)`:
  sontyx = vowel_category[vowelPhoneme][edge]; block = loci[obstruentPhoneme][sontyx][key];
  bouval = locus + prcnt*(steady-locus)/100; span = durtran_ms/1000. null if no data.
- Edge wiring at apply site: this seg = smoothable vowel-class (in smooth_types). For each edge:
  forward (prev = obstruent): emit START window (events <= forwardSteadyTime use forwardParams).
  backward (next = obstruent): emit END window (existing slot, locus-driven instead of midpoint).
  Non-obstruent neighbor in smooth_types -> legacy midpoint backward only (unchanged).
  Obstruent detection: neighbor.type NOT in smooth_types AND neighbor.phoneme in loci. Generic.

## ENGINE IMPLEMENTED (track-assembler.ts)
- resolveLocusBoundary(steady, vowelPh, obstPh, edge, keys, loci, vowelCat): bouval=locus+
  prcnt*(curval-locus)/100 per F1/F2/F3; span=max(durtran). null if no data. B1-B3 keep steady.
- SegmentBoundarySmoothing {forwardParams/Time, backwardParams/Time}. applyControlWindowsAtOffset
  rewritten: forward window (events <= forwardSteadyTime), backward (>= backwardSteadyTime), else steady.
- buildSegmentEventTimes gained forwardSteadyTime param (event point for forward window inner edge).
- Apply site: isSmoothedSonorant + isLocusObstruent(neighbor) [generic: neighbor.type NOT in
  smooth_types AND loci[phoneme] exists]. Backward: legacy midpoint (sonorant-sonorant, UNCHANGED)
  OR locus (vowel before obstruent). Forward: locus (vowel after obstruent), clamped <= backwardSteadyTime.
- Legacy byte-identity: loci undefined (qlatt-english) -> isLocusObstruent always false ->
  only midpoint path, forwardSteadyTime null. Identical to committed behavior.
- tsc: ZERO new errors in src/. Baseline = 67 pre-existing test-file errors (afterAll, etc.);
  same 67 with my changes. No external callers of changed fns.

## NEXT
- Validation (validation.ts): optional transitions.loci + vowel_category schema check.
- Probe scripts/dt-t4a-data-probe.ts: CV/VC words, F2 near boundary, before/after vs committed tree.
- vitest, golden, baseline regen scope. qlatt-english must be unchanged.

## VALIDATION ADDED
- validation.ts validateLocusTables: optional loci/vowel_category structural check (sontyx 1/2/3,
  finite locus_hz/prcnt/durtran_ms, edge values 1/2/3). tsc still 67 (zero new).

## NEXT: probe
- textToKlattTrackDetailed(phrase, undefined, 30, {frontendId:"dectalk-english"}) -> {track:KlattFrame[]
  (time,phoneme,params{F1,F2,F3}), frontendPhones}. Probe prints F1/F2/F3 near obstruent boundaries
  for CV/VC words; compare to git stash (committed tree) showing no transition before.

## PROBE found issue (FIXED next)
- Stops split into <BASE> (stop_closure) + <BASE>_REL (stop_release). The vowel's IMMEDIATE
  neighbor on the forward edge is the RELEASE (phoneme=D_REL), NOT in loci table (keyed by D).
  So forward transition didn't fire. DECtalk fonobst = the stop phoneme (D); closure/release/vowel
  is ONE stop+vowel.
- `_REL` suffix + stop_release/stop_closure/stop_aspiration types are a SHARED engine convention
  (both qlatt-english + dectalk-english use them; structural.yaml `current.phoneme + "_REL"`).
  So skipping release/aspiration glue to find the base obstruent is GENERIC engine behavior.
- FIX: locus neighbor lookup walks the score in the edge direction, skipping segments whose type is
  stop_release/stop_aspiration, to find the adjacent obstruent segment whose phoneme is in loci.
  For forward edge: walk backward from the vowel over release/aspiration to the stop_closure (D).
  Generic via `type`, no phoneme literals. The locus value uses that base obstruent's phoneme.

## PROBE — CORRECTNESS CONFIRMED (changes are toward loci, not arbitrary)
- adjacentLocusObstruent fix works; forward+backward transitions now fire at obstruent edges.
- "bee" B+IY (forward): IY steady F2=2100; vowel START F2=1572 ramps UP to 2100.
  bouval = 900 + 0.56*(2100-900) = 1572 EXACT (B sontyx1 F2 locus900/prcnt56). Labial LOW locus ✓.
- "do" D+UW (forward): UW steady F2=1060; START F2=1444 (pulled UP toward alveolar).
  bouval = 1700 + 0.40*(1060-1700) = 1444 EXACT (D sontyx3 F2 locus1700/prcnt40). Alveolar ~1700 ✓.
- "key" K+IY (forward): IY steady F2=2012; START F2~1994. K sontyx1 F2 locus1990/prcnt20.
  Velar high-front locus ~1990 (velar pinch) ✓.
- "abe" EY..B (backward): EY end F2 pulled DOWN to 1331 toward B labial locus ✓.
- ALL directions match DECtalk + mission expectations; bouval matches the formula exactly.
  Changes are CORRECT (toward loci), not arbitrary.

## NEXT
- BEFORE proof: git stash, rerun probe, show flat vowel F2 (no transition) on committed tree.
- npx vitest run; golden; regen scope; qlatt-english unchanged.

## DONE — full verification
- BEFORE proof (git stash of my 3 src/yaml edits, rerun probe on committed tree):
  "bee" IY F2 = 2100 FLAT from first vowel frame (no transition); "do" UW F2 = 1060 FLAT.
  AFTER: bee F2 starts 1572->2100, do F2 starts 1444->1060. Obstruent transitions now EXIST
  where there were NONE. Changes are toward loci (exact bouval), not arbitrary.
- vitest: 125 files / 1107 tests PASS. ZERO snapshot/oracle/json baseline files modified
  (git status clean of oracle/snapshot/.json). dectalk-e2e (39 structural tests) PASS.
  No committed exact-dectalk-frame baseline exists for the transition phrases, so NOTHING to regen.
- qlatt-english BYTE-IDENTICAL: sha1 of textToKlattTrack for "hello world", "the quick brown fox",
  "baby goes to school", "see the dog" all match committed tree exactly (loci undefined -> no-op).
  Hard-stop (d) satisfied.
- golden: render-phrase (defaults to qlatt-english) exit=0 (unchanged); lf-source exit=1
  (ONLY allowed pre-existing failure, untouched); klatt-tract PASS. dectalk render-phrase exit=0.
- tsc: 67 pre-existing test-file errors (afterAll etc.), ZERO new, ZERO in src/.
- NO git add/commit (hard-stop e). lf-source golden untouched (hard-stop f).

## FILES CHANGED
- Qlatt: src/track-assembler.ts (types + resolveLocusBoundary + SegmentBoundarySmoothing +
  buildSegmentEventTimes forwardSteadyTime + adjacentLocusObstruent + apply-site forward/backward
  edge wiring), src/declarative-frontend/validation.ts (validateLocusTables), 
  public/rules/frontends/dectalk-english/frontend.yaml (loci + vowel_category DATA under
  output.lowering.transitions). New: scripts/dt-t4a-data-probe.ts, scripts/gen-dectalk-loci-yaml.mjs.
- dectalk repo (read-only ref): scripts/extract_loci.py, output/us_loci.yaml.

## DEFERRED (documented in YAML + script)
- The 2 setloc prcnt adjustments (ph_sttr2.c:294-307): rounded-soncon F2/F3 (prcnt/2+50) and
  F2 back-cavity (prcnt+=25-prcnt/4, durtran/2+2). Need place() bits / soncon detection.
- Per-formant durtran: used MAX(durtran over F1/F2/F3) as the single window span per edge
  (endpoints exact, slope of shorter-durtran formants approximate). Per-key spans = future.
- Female (us_femloc) locus table: extracted only MALE (Paul default) per mission.

## Blockers
- None. COMPLETE.
