# Notes: unified attribute-graph design (packaging, native, declarative)

Session 2026-09-08. Design conversation with Q; no code changed. Two sonnet
agents (propstore-sweep, argumentation-sweep) were still running when this
was written; their reports are not yet folded in.

## What was asked

1. How close are we to one package per synth and a single command to build a
   native artifact (DLL/dylib, SAPI5, macOS, speech-dispatcher)?
2. How possible is a native (Rust) frontend?
3. Can lowering and G2P go fully declarative, engine "as dumb as possible"?
4. Is there a unifying model? What papers (ours and sibling repos) inform it?

## Observed state (verified from repo and gh)

- Packaging #74: closed #75, #77, #80, #139, #140. Open #76, #78, #79, #81,
  #141, #82. Umbrella checklist stale (#77 shows unchecked but is closed).
- Native #83: closed #84 (all crates cdylib+rlib now), #87, #88. Open #85
  (CEL parity), #86 (fixtures), #89 (Rust host). No SAPI/macOS/spd notes exist.
- Frontend runtime TS is ~10k lines of logic; validation.ts (3.8k) is
  load-time only. Macros expand textually to plain CEL by design. Normalization
  is rule-driven. LTS is YAML (NRL). Zero Intl/lookbehind/\p{} uses.
- lowerToFrames is one 1500-line function: timeline, then per-frame sub-steps
  (copy params, Holmes transitions, control windows, F0 sampling, affect
  projection). DECtalk controller-clock projection lives in core lowering.
- Scalar ops are add/mul/max/min: all commutative monoids -> folds.
- semantics.yaml realize + topological-evaluator.ts is already a
  dependency-ordered cited-definition evaluator.
- #46 split into #202-#214 on 2026-09-08. #206, #207, #214 will land
  differently under the attribute model; write the design note before those.

## The design (as discussed, not yet decided in an issue)

Every value = attribute on a typed item at a clock (word/syllable/segment
event clocks; frame and sample periodic clocks), defined once by a cited CEL
expression or cited kernel, computed on demand. Multi-writer fields are
folds. Lowering = resampling segment attrs onto frame clock (Holmes kernel);
interpreter ramp/step = resampling onto sample clock. Transitions become
items (Hertz 1991). Structure derivation = cited transducers (FST/CART/
lexicon). Overlays (package extends, variety, voice, affect) = one mechanism.
Evaluation parameterized by a commutative semiring: reals (values), tropical
(priority), provenance polynomials (explanation, Green 2007). Where-provenance
(Buneman 2001) carried through compilation as YAML spans.

Q's mid-turn point: cycles ("read read") are not an error; use defeasible
Datalog / an AF. Green 2007 §5 covers Datalog with omega-continuous
semirings; Maher 2021 compiles defeasible logic to Datalog-neg; tabled
evaluation (Chen & Warren 1996, SLG) = lazy + cycles + well-founded in one
evaluator. Compile pipeline: YAML -> cel-parser -> condition-ir (typed IR,
JSON codec, Z3 specificity) -> defeasible theory -> Datalog-neg -> tabled
semiring evaluator. Native frontend = tabled Datalog evaluator over HRG.
condition-ir JSON codec dissolves #85 (both hosts consume IR, not CEL text).

## Papers: in library and useful

Taylor 1998 (function features = laziness), Hertz 1985/87/91/92/99 (sync
marks, transitions as items, nucleus timing, universal/specific overlays),
Goldsmith 1976 (WFC as validator invariant), Klatt 1976 / van Santen 1994 /
Fujisaki / Ohman 1966 (the four folds), Pierrehumbert 1980 / Kestrel / Riley
1990 / Black 1998 (structure kernels), Carlson 1975 (first_defined),
Stevens 1991 / Hanson 2002 (vertical composition), Liberman-Prince 1977 /
Hayes 1982, Fowler 1980 / Browman-Goldstein 1992 (frontier: overlap).

## Papers to retrieve (none present in ./papers)

Coleman 1992/1994 YorkTalk; Local & Ogden 1997; Ogden et al 2000 ProSynth;
Bird & Klein 1990; Scobbie/Coleman/Bird 1996; Kaplan & Kay 1994; Mohri 1997;
Daciuk et al 2000; Sproat 1996; Johnsson 1987 (+Knuth 1968); Black & Lenzo
2001 Flite; Lustre 1987; Faust; Green 2007; Amsterdamer 2011 (aggregate
provenance, needed because folds are aggregates); Cheney 2009; Buneman 2001;
W3C PROV-DM (Moreau & Missier 2013); Chen & Warren 1996; Foster 2007 lenses
(authoring surface only); Carroll 2005 (background). "Kaplan 2015": unknown
which paper; asked Q for title.

## Sibling repos (C:\Users\Q\code)

- provenance-semiring: exact algebra (Python). Extras: partial derivatives,
  nogoods, tropical projection, why_provenance with kind tags. Has Green 2007
  and Buneman 2001 notes.
- condition-ir: typed CEL IR + JSON codec + Z3 (sat/disjoint/implies/equiv).
- cel-parser (full CEL, Lark), cel2js (already used via vite.config).
- gunray: Nute defeasible logic + stratified Datalog; 15 papers incl. Maher
  1999/2021, Governatori 2004, Garcia 2004 DeLP, Stolzenburg 2003, Diller 2025.
- causal-models: SCM + Halpern actual causation (explain as counterfactual).
- doxa: subjective logic (trust for cited vs engineering-estimate values).
- quire: git doc store; papers incl Foster 2007 lenses, Melnik 2003 Rondo,
  Bernstein 2003 (model management = extends/overlay merge operators).
- propstore (236 papers), argumentation (79 papers): agent sweeps pending.
- belief-set: AGM/Grove/Hansson; not obviously relevant.

## What worked / didn't

- Direct index grep + notes heads was enough for our library; no PDFs read.
- gh issue listing via Bash worked; issue bodies were the reliable source of
  state (umbrella checklists are stale).

## Blockers

- Kaplan 2015 unidentified.
- Agent reports pending (propstore, argumentation).

## Next steps

1. Fold in the two agent reports.
2. Draft docs/attribute-model.md with the citation table and fixed decisions
   (semiring-parameterized tabled evaluation; specificity from Z3; folds per
   field; transitions as items; TS compiler / Rust engine per Flite).
3. Umbrella issue with children: rulepack compile command; Frame items +
   frame phase; kernel builtins; conflict = defeasible theory; #85 via
   condition-ir; sequencing note for #206/#207/#214.
4. Retrieval sweep for the ~22 missing papers via paper-process, cheap
   retrievers, ledger script (see memory: paper-sweep-operations).

## Agent sweep results (2026-09-08, folded in)

### argumentation repo (79 folders; index.md stale at 25)
Verdict: runtime conflict resolution = specificity/priority ordering
(Modgil & Prakken 2018 preferences; already in that repo's CITATIONS.md).
Argumentation earns its keep only at COMPILE time: per field, treat candidate
writes as arguments, attacks = same field, compute grounded extension with
`argumentation.core.dung`, fail compile unless unique non-empty winner.
Folds = Prakken 2019 accrual (`argumentation.core.accrual`), not attack.
Also: Bench-Capon 2003 value-based AF (voice/variety as audience), Baroni
2005 SCC-recursive (formalizes what phase order already does), Delobelle 2019
/ Yin 2023 / Kampik 2024 (contribution attribution in gradual semantics ~
provenance-polynomial explanations). No Nute/DeLP/Brewka in that collection.

### propstore repo (236 papers)
Strong on overlays and conflicts, empty on lazy/incremental/attribute-grammar.
- Overlays: McCarthy 1993/1997, Guha 1991, Kallem 2006 microtheories. Propstore
  deliberately deleted context inheritance in favor of explicit typed lifting
  rules (docs/contexts-and-micropubs.md). Consider the same for varieties and
  voices; `extends` child-over-parent stays for package base data.
- Conflicts: six-class detector (docs/conflict-detection.md); PHI_NODE =
  provably disjoint conditions -> not a conflict (Z3 via condition-ir). CKR
  justifiable exceptions (Bozzato 2018/2020) = override with evidence, Datalog
  materialization. Al-Anbaki 2019 static priority relation; Maher 2001 linear
  time.
- Incremental: ATMS labels + nogoods (docs/atms.md), McDermott 1983 (contexts
  + dependency-directed recomputation in one structure), Doyle 1979.
  Worldlines (docs/worldlines.md) = lazy query with staleness detection.
- Non-commitment: storage keeps rival values, render policy picks at query
  time -> keep both duration models in the rulepack, choose per voice.
- Provenance: PROV-O (Moreau 2013), nanopublications (Groth 2010), Carroll
  2005; git-notes provenance keyed by content hash.

### Confirmed gap in BOTH sibling collections
Knuth 1968, Johnsson 1987, Adapton (Hammer 2014/2015), Chen & Warren 1996,
Mohri 1997, Daciuk 2000, Kaplan & Kay 1994, Amsterdamer 2011, Cheney 2009,
de Kleer 1986 (ATMS original), Dung 1995 (original). Retrieve for Qlatt.

### Decision shape (proposed, not yet filed)
- Runtime: tabled Datalog-neg evaluator over HRG, semiring-annotated;
  defeasible theory compiled per Maher 2021; specificity precomputed.
- Compile: cel-parser -> condition-ir (JSON, spans) -> Z3 disjointness /
  implication -> six-class conflict classification -> grounded-extension
  uniqueness per field -> emit compiled rulepack. TS owns this (Flite split).
- Folds: Prakken 2019 accrual semantics, cited per field with Klatt / van
  Santen / Fujisaki / Ohman as the kernels.
- Overlays: McCarthy contexts with explicit lifting for variety/voice/affect.
- Explain: provenance polynomial (Green) + where-spans (Buneman) + actual
  cause (Halpern via causal-models) + opinion (doxa) per value.

## 2026-09-08 later: sanity check and audit script

Q asked whether the whole formal stack "even makes sense". My answer: the
core (Festival function features, folds, frames/transitions as items,
compiled rulepack, one generic accumulator) is normal 1990s TTS architecture
and deletes code; the sibling-repo additions (tabled Datalog, AF validator,
Z3 specificity, McCarthy lifting, actual cause, subjective logic, PROV-O)
add dependencies for problems no rulepack has demonstrated. Hammer/nail.
Decision pending on numbers.

Wrote scripts/audit-rulepack-conflicts.ts (loads bundled rulepacks via
loadBundledRulepackSpec; counts same-field writers by op class and
cross-item reads of computed fields split by writer phase). First run
(dectalk-english only; script crashed on a stale `cyclic` reference before
qlatt-english, now fixed):
- 110 rules, 15 phases, 61 fields; 43 single-writer, 0 pure-fold,
  0 set-then-fold, 18 multi-set.
- multi-set fields are dominated by dectalk_single_word_fallback_primary_retarget
  (one rule setting ~18 fields in the duration phase) and word-specific
  oracle-trace rules (cake_*, the_*). `duration` has 2 set writers + ~28
  add/mul/max writers = Klatt fold with a pause override.
- 93 cross-item reads of computed fields: 12 earlier-phase only, 66 same
  phase, 0 later-only. Same-phase reads are mostly postlexical rules reading
  neighbor `stress` (which is inherent from the lexicon and rewritten later
  by a fallback rule), so "same phase" overstates cycle risk; need to
  distinguish inherent-and-rewritten fields from purely computed ones.
Next: rerun for all three frontends; then decide.

### Audit numbers (all three frontends; script fixed and rerun)

| frontend | rules | phases | fields | single | fold | set-then-fold | multi-set | x-item reads | same-phase |
|---|---|---|---|---|---|---|---|---|---|
| qlatt-english | 110 | 17 | 44 | 21 | 0 | 9 | 14 | 33 | 10 |
| qlatt-beauty | 111 | 17 | 44 | 20 | 1 | 9 | 14 | 35 | 10 |
| dectalk-english | 110 | 15 | 61 | 43 | 0 | 0 | 18 | 93 | 66 |

qlatt-english multi-set reading (by hand):
- Disjoint by `type`/phoneme condition (regime split, not conflict): most of
  F1/F2/F3 writers, SW (has(inventorySW) vs !has), breakIndex (SIL vs word).
- Manual priority via `!has(current.durationFloor)` guard: durationFloor.
- Specific-after-general by phase order: nasalPlaceIndex (assignment then
  N assimilation).
- Sequential non-commutative composition on the SAME items: vowel F1/F2
  through vowel_reduction -> vowel_rate_undershoot -> schwa/uw fronting
  (affine maps; order matters). This is not a fold; it is an ordered chain.
- `set` used where a fold op belongs: duration_cap (min formula),
  speech_rate_scaling. Cleanup candidates.
- t_deletion/d_deletion set duration/inherentDuration/AV/AF/AH to zero-ish
  (deletion by parameters) in postlexical.
- assign_metrical_accent is defined in annotation.yaml but listed in no
  phase (reported as #Infinity): probably dead. Not fixed.
Same-phase cross-item reads in qlatt-english are exactly three rules:
hertz_nucleus_timing (tail.duration), nasal_murmur_targets (target().F*),
vcv_coarticulation (prev.F1-3). None is cyclic (vowel formant rules read
only the vowel's own fields). dectalk's 66 are mostly neighbor `stress`,
which is inherent from the lexicon and rewritten by a later fallback rule,
so the audit's "computed" classification overstates it there.

Conclusion for the design: zero cycles -> topological evaluation, no
fixpoint engine. Conflicts -> regime split (disjoint conditions), explicit
priority, or ordered composition; a specificity check plus "overlapping set
writers without declared order is a compile error" covers everything seen.
No argumentation framework, no Datalog, no Z3. Ordered composition must be
an explicit construct per field (phases do not fully disappear).

## 2026-09-08 later still: doc written, fixes in progress

- docs/attribute-model.md written (10 decisions, not-building list, audit
  evidence, citation table, sequencing). Not committed.
- assign_metrical_accent is NOT dead: qlatt-beauty lists it; qlatt-english
  folds the metrical override into assign_accent. Audit script now reports
  unphased rules with "phased in <frontend>" or "phased nowhere: dead".
- Genuinely dead (defined, listed in no phase in any bundled frontend, no
  references anywhere): transition_override (Stevens & House 1956, Hertz
  1991; sets transition_ms), stress_spectral_tilt (Sluijter & van Heuven
  1996; TL -6 dB on stressed vowels), dectalk_question_glide_reset (f0_layer
  reset). git -S shows none was ever in a pipeline phase list: they predate
  phases (March 2026) and were orphaned when phases were introduced.
- duration_cap: `set` with ternary == `min`. speech_rate_scaling: `set`
  because `mul` on a resolution:klatt scalar applies the incompressible-floor
  formula and the cited decision (Crystal & House 1982) is to scale total
  duration. There is no per-effect way to ask for plain mul. Engine rounds
  set/add/mul on duration but not max/min (rule-engine.ts ~1040-1055).
- Plan: issue A = per-effect `resolution` override + convert both rules
  (fix now, verify with npm run test:golden byte-identity). Issue B = dead
  cited rules + E_RULE_UNPHASED validator (file only; restoring rules changes
  audio and needs golden review). Rounding asymmetry -> comment on #206.

## Delivery state (end of 2026-09-08 session)

Filed: #218 (per-effect resolution + convert duration_cap/speech_rate_scaling),
#219 (three dead cited rules + E_RULE_UNPHASED validator). Commented on #206
about set/add/mul vs max/min rounding asymmetry.

Fixed #218 in working tree (uncommitted; Q did not ask for commits):
- rule-engine.ts: `mulResolution` = effect.resolution ?? declared; used ONLY
  in the `mul` formula. First attempt overrode `resolution` wholesale and
  broke the floor clamp (crystal-duration-table "retains the hard floor").
- validation.ts: `resolution` added to ALLOWED_APPLY_FIELDS; new diagnostics
  E_EFFECT_RESOLUTION_INVALID (not standard|klatt) and E_EFFECT_RESOLUTION_OP
  (op != mul).
- duration.yaml: duration_cap -> op min; speech_rate_scaling -> op mul,
  resolution: standard.
- test/hrg-rule-engine-resolution.test.ts: klatt default, standard override,
  validator rejections.
- Focused tests, frontend golden tests, biome: pass. `npm run test:golden` is
  DSP-primitive goldens only (passes). Full `npm test` first run: 2 failures,
  one was the floor clamp (fixed); second file unknown; rerun in progress
  (background, output in scratchpad tasks dir).

Not fixed: #219 (restoring cited rules changes audio; needs golden review).
Also: docs/attribute-model.md and scripts/audit-rulepack-conflicts.ts are new
untracked files.

## Shipped (2026-09-08)

- PR #221 (branch issue-218-effect-resolution, commit cc52832e): per-effect
  resolution, duration_cap -> min, speech_rate_scaling -> mul standard,
  audit script, docs/attribute-model.md, regression test. Closes #218.
  Full gate 1842/1843; the one failure is pre-existing (below).
- PR #222 (branch fix-area-formants-stale-hash): regenerated
  story-1996.comparison.md; d0e910fb changed inventory.yaml after 7746b1f4
  pinned its hash. Unrelated to #218.
- Open, not started: #219 (dead cited rules + E_RULE_UNPHASED). #206 has a
  comment about max/min not rounding.
- Lesson: python open()/write on Windows converts LF files to CRLF; use
  newline="" or fix with sed 's/\r$//' before staging. Caught via a
  1070-line diff stat on duration.yaml.

## #219 work (2026-09-08/09)

State of PRs: #222 merged. #221 rebased onto master after #220 (issue-206
scalar policy) merged; conflict in rule-engine.ts resolved (kept master's
`round = scalarConfig?.unit === "ms"`, added `mulResolution`). CI rerunning.
Merge #221 when quality passes, then branch #219 from master.

Facts for #219:
- Rule origin: parseRulepackDocument(label) labels are "included rulepack
  <abs>", "base rulepack <abs>", or the root specPath; MAP_ORIGINS is the
  precedent (maps only). Under extends, includes fall back to the base dir so
  inherited rule files carry the base frontend's path. `extends` is deleted
  from the merged doc.
- Dead test: a rule is dead iff no bundled frontend whose compiled spec
  contains it lists it in a phase. No extends graph needed.
- transition_override: params.policy.formant.transition_ms_{stop,fricative,
  default} exist (30/40/50, cited). lowering.ts transitionDuration() reads
  item transition_ms first, else Holmes table / default. Restoring changes
  Holmes transition timing -> goldens (events, f-means) will move.
- stress_spectral_tilt: TL add -6 inline; Sluijter notes: 3-9 dB more energy
  >500 Hz in stressed vowels. Plan: params.policy.speaker? no; add
  policy.prosody? frontend.yaml sections: rate, duration, effort,
  source_contour, formant, nasal, speaker, timeline, transitions, overlays.
  Put stress_tilt_reduction_db under `speaker` next to spectral_tilt_offset_db
  or under a new `stress` key; TL is not a critical field so literal is legal
  but policy is the house rule.
- dectalk_question_glide_reset: inserts -(question_gesture_rise_hz) step on
  question_glide layer at the '?' SIL. Single-question fixtures end there, so
  existing traces are unaffected; a two-clause phrase is needed to show it.
- Golden review pattern: test/lexical-stress-golden-review.test.ts gated by
  QLATT_STRESS_GOLDENS=1 writes docs/lexical-stress-golden-review.md; nasal
  used scripts/review-nasal-goldens.ts --before --write. Goldens:
  test/golden/declarative-corpus-summary.json (regen scripts exist),
  crystal-tempo-corpus-summary.json.
- beauty keeps its own phase lists; not restoring there (its design).

## #219 implementation state (2026-09-09)

Branch issue-219-unphased-rules (from #221's commit; #221 now merged).
- rule-pack.ts: RULE_ORIGINS WeakMap (rule -> declaring file), merged like
  MAP_ORIGINS through includes/extends; exports rulepackRuleOrigins,
  unphasedRules(specs), findUnphasedBundledRules, assertBundledRulesPhased
  (E_RULE_UNPHASED).
- test/declarative-frontend-rulepack-unphased.test.ts (synthetic + origins
  + bundled-empty).
- Restored: transition_override (formant, last), stress_spectral_tilt
  (prosody after vocal_effort; -6 literal -> params.policy.effort.
  stress_tilt_reduction_db = 6, Sluijter 3-9 dB midpoint),
  dectalk_question_glide_reset (after dectalk_question_rise).
- scripts/review-restored-rule-goldens.ts (--before/--before-tempo/--write):
  17/20 phrases changed in both corpora; only events, voicedEvents,
  f1/f2/b1 means, and event-weighted f0Mean (<=1.02 Hz) / avMeanVoiced
  (<=0.28 dB) moved; timing, F0 extremes, AH unchanged. Wrote
  docs/restored-rules-golden-review.md and both goldens.
- test/restored-rules.test.ts: transition_ms per class on ACTIVE segments
  (listItems() includes items marked active:false by structural rules), TL
  write delta on stressed vowels via item.writes("TL"), dectalk reset sums
  question_glide layer to 0 for "Are you home? Yes.".
- Full gate running in background; then commit, PR, CI, merge.

## 2026-09-09 shipped/pending

- #221 merged (with rebase over #220). #222 merged.
- #223 open (branch issue-219-unphased-rules, commit 28ebe693) closes #219.
  Full local gate before pin refresh: 1865/1871; the 6 failures were the
  tone-association track-hash snapshots (3, incl. dectalk question phrase)
  and klatt80-baseline render hashes in voice-quality-port (3). Refreshed;
  beauty pins unchanged (control). CI watch running; merge when green.
- After merge: nothing else pending from this session except memory hygiene.

## Done (2026-09-09 01:22Z)

#221, #222, #223 merged; #218 and #219 closed. master at 79397ed2, working
tree clean apart from untracked notes/scratch. Remaining follow-ups belong
to other issues: #206 rounding comment; docs/attribute-model.md sequencing
(compile command, Frame items, folds per field, generic accumulator).

## "do it all" batch (2026-09-09, after #223)

- A/B listening set rendered to %TEMP%\ab\{before,after} (pre-#223 d56571c2
  vs master; 4 qlatt-english phrases + dectalk "Are you home? Yes, I am.")
  and sent to Q. Rendering needed a fix: src/klatt-runtime.ts and
  src/runtime-assets/browser-loader.ts read import.meta.env.BASE_URL without
  optional chaining, which crashes every headless render under the ts-node
  loader (path-utils.ts already guards it). Fixed in working tree, tsc clean,
  NOT yet committed. This is why review-nasal-goldens used Vite SSR.
- Papers: copied Green_2007 and Buneman_2001 from ../provenance-semiring into
  papers/ with index.md entries placed after Browman_Goldstein_1992 and
  Grabe_Kochanski_Coleman_2005. NOT yet committed.
- #206 is closed (by #220); max/min rounding asymmetry filed as #225.
- Issue bodies for the attribute-model umbrella + 5 children are in the
  scratchpad (issue-umbrella/compile/frames/folds/accumulator/transitions.md);
  a bash heredoc batch failed on quoting, so they are filed via files. Not
  yet filed at time of writing.
- Pending after that: commit fix + papers (two small PRs), speak server
  (scripts/speak-server.ts, JSON-lines over stdio, PCM + word markers) and
  hosts/nvda synthDriver skeleton, then start Frame items.

## Speak server / NVDA (2026-09-09)

- Filed #226 umbrella + #227-#231 children; #225 rounding. PR #232 (BASE_URL
  guard) and #233 (papers) open, CI watch in background.
- docs/attribute-model.md has an uncommitted working-tree edit NOT by me
  ("document span" wording, 3 lines). Left alone; do not revert or commit.
- New (uncommitted): scripts/speak-server.ts (JSON lines over stdio,
  base64 s16le PCM + word markers from KlattFrame.word), test/speak-server
  .test.ts, hosts/nvda/{README.md,test_protocol.py,addon/manifest.ini,
  addon/synthDrivers/qlatt.py}. Driver written against NVDA 2024 API, not
  loaded in NVDA yet.
- Blocker just hit: speak request fails with BASE_URL error on master
  because the guard lives on PR #232's branch. Fix: branch the speak-server
  work from fix-headless-render-base-url (or wait for #232 to merge).

- Speak server works on branch nvda-speak-server (b48d2ce7, stacked on the
  #232 fix commit). KlattFrame.word is lowercased and punctuation arrives as
  its own word token; markers skip tokens without letters/digits. Python
  harness produced qlatt-nvda-protocol.wav (4.1 s, 8 markers); sent to Q.
  PR to open after #232 merges (rebase onto master first).
- Plan agent "frames-plan" writing notes-issue-228-plan.md for #228.

## Live NVDA test (2026-09-09 evening), branch nvda-live-fixes

Q asked to run the driver in NVDA (2025.3.2, synth ibmeci, scratchpad
enabled). Findings, in order:
- Restarting NVDA from my shell (nvda.exe -r via Start-Process) made NVDA
  "act weird"; Q restarted it normally. Never restart Q's screen reader
  from a tool again.
- A hand-added [qlatt] section in nvda.ini was dropped: NVDA rewrites
  nvda.ini from memory on exit and discards sections no loaded module has
  declared. check() then saw repo="" ("speak server not found at
  scripts\speak-server.ts"). Fix: driver reads a sidecar qlatt.json next to
  itself (load_settings), nvda.ini [qlatt] only overrides.
- Dev install path per the developer guide: %APPDATA%\nvda\scratchpad\
  synthDrivers\qlatt.py (+ qlatt.json); no restart needed for the synth
  list. Addons-folder copy removed. manifest lastTestedNVDAVersion 2025.3.0.
- nvwave 2025.3: WavePlayer(channels, samplesPerSec, bitsPerSample,
  outputDevice=DEFAULT_DEVICE_KEY, wantDucking=True, purpose=SPEECH);
  feed(data, size=None, onDone=None); sync(); idle(); stop(); pause(bool).
  Driver no longer passes outputDevice.
- getSynthList logs a failed check() only at debugWarning; driver check()
  logs at info to be visible.
Current state: driver+sidecar installed in scratchpad; waiting for Q to
open the synth dialog again. Repo files changed: qlatt.py, README.md, new
hosts/nvda/qlatt.example.json (uncommitted, on nvda-live-fixes).
- PR #235 merged (NVDA live fixes). Filed #236 (speak-server ~0.8 s fixed
  cost; keep assets/config warm) and #237 (driver: one render per
  utterance with index markers, character mode, breaks, slider curves).
  Qlatt spoke inside NVDA 2025.3.2 on 2026-09-09; Q: "sluggish and weird
  but it works". Awaiting Q's description of "weird".
