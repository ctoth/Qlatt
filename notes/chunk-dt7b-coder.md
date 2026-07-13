# Chunk dt-7b — Per-voice source/formant GAINS as Paul-relative additive dB offsets (CODER)

Datestamp: 2026-05-29
Branch: dectalk-parity (verified)
Mission: per-voice GV/GH/GF/GN + G1-G4/LO shape spectral balance, applied as
Paul-relative ADDITIVE dB OFFSETS into the gain formulas. Paul -> 0 offset
everywhere -> byte-identical. Mapping + reference are DATA; application generic.

## OBSERVATIONS (verified)

### dt-7a precedent (committed 2b0da449)
- `applySpeakerProfileToParams` (tts-frontend.ts:166-215) has a generic
  data-declared field stamp: `voiceFrameStamp {params, fields}`. Fields come
  from frontend.yaml `speakers.speaker_frame_params` (dt-7a = [F4, B4]).
  Loop SETS params[field]=voice[field] (absolute). No per-voice branches.
- Built at tts-frontend.ts:601-604, applied per frame 605-625.
- That mechanism is ABSOLUTE SET. dt-7b needs ADDITIVE OFFSET (Paul-relative),
  AND the targets (gains) live in the SEMANTICS formulas, not as raw frame
  params. So dt-7a's stamp is the wrong shape for gains.

### Where gains are computed (the real target)
- dectalk-english uses graph `public/experiments/dectalk-english/graph.yaml`
  but SEMANTICS = `public/experiments/klatt80-baseline/semantics.yaml`
  (dectalk-english/semantics.yaml is only 55 lines, overrides sourceMode/lfMode
  /F9/F10/B9/B10 only — NO gain formulas).
- klatt80-baseline/semantics.yaml gain realize rules:
  - voiceGain:711 `dbToLinear(GO + AV + eeGainDb + ndbScale.AV) * F0term`  (GV target)
  - aspGain:715 `dbToLinear(GO + AH + max(0,10*(Rd-1)) + ndbScale.AH)`     (GH target)
  - fricGain:729 `dbToLinear(GO + fricDbAdjusted + ndbScale.AF)`           (GF target)
  - fricGainScaled:805 same + parallelScale                               (GF target)
  - avsGain:733 `dbToLinear(GO + AVS + eeGainDb + ndbScale.AVS) * 10`      (GV target, parallel voicing)
  - anLinear:748 / anGainScaled:797 from nasalParallelDb (GN target)
  - parallel formant gains a{N}Linear -> pfe-codegen.ts:31-60 (G1-G4 target)
- Per recon: GV->azgain(voicing), GF->afgain(fric), GH->apgain(asp),
  GN->rnpgain(nasal), G1->r5ca,G2->r4ca,G3->r3ca,G4->r2ca (parallel res),
  LO->r1ca (parallel res 1 / low).

### Voice gain values (paul reference)
paul:  GV68 GH67 GF67 GN52 G1 51 G2 60 G3 50 G4 67 LO81
betty: GV60 GH63 GF63 GN63 G1 66 G2 65 G3 60 G4 65 LO63
-> Paul-relative offset = voice - paul. Paul=0 everywhere.

## DESIGN DECISION (declarative, additive)
This is recon Option (b): inject per-voice gain dB offsets into the semantics
eval context as a `speaker.*` namespace (constants), add `+ speakerXxDb` terms
to the gain formulas. Reference (paul) is DATA. Mapping (which gain offsets
which formula) is DATA in semantics expr + a declared voice->offset list.

OPEN QUESTIONS still resolving:
- exact injection point for `speaker.*` into interpreter context (constants).
- how G1-G4/LO reach pfe-codegen (parallel a{N}Linear) declaratively.
- klatt80-baseline semantics is SHARED across frontends -> adding `+ speakerXxDb`
  must default to 0 for non-dectalk (hard-stop d: don't break other frontends).

## FINAL DESIGN (simpler than recon Option b — NO semantics.yaml change)

KEY INSIGHT: every gain formula is `dbToLinear(GO + <frameDbParam> + ...)`.
Adding the Paul-relative offset directly onto the per-frame dB param (AV/AH/AF/
A1..A5/AVS) is mathematically IDENTICAL to adding a `+ speakerXxDb` term inside
the formula — but requires ZERO change to the SHARED klatt80-baseline semantics
(avoids hard-stop d entirely; other frontends declare no gain offsets -> 0 effect).

Mechanism: extend the dt-7a generic frame-stamp with an ADDITIVE-OFFSET pass.
- New DATA in frontend.yaml `speakers.speaker_gain_offsets`: list of
  `{gain: <voiceField>, param: <frameDbParam>}` pairs (mapping is data).
- Reference = registry DEFAULT voice's params (data: `speakers.default` = paul),
  loaded generically (NOT hardcoded numbers).
- Generic loop: for each pair, `frame.params[param] += voice[gain] - reference[gain]`.
  Paul == default -> offset 0 everywhere -> byte-identical.

### MAPPING (data, verified each target feeds a gain via dbToLinear)
| voice gain | DECtalk dest (ph_vset) | Qlatt frame dB param | gain formula |
|-----------|------------------------|----------------------|--------------|
| GV | azgain (voicing) | AV  | voiceGain:711 |
| GV | (parallel voicing)| AVS | avsGain:733 |
| GH | apgain (asp)     | AH  | aspGain:715 |
| GF | afgain (fric)    | AF  | fricGain:729 / fricGainScaled:805 |
| LO | r1ca (par res1)  | A1  | a1Linear (pfe) |
| G4 | r2ca (par res2)  | A2  | a2Linear |
| G3 | r3ca (par res3)  | A3  | a3Linear |
| G2 | r4ca (par res4)  | A4  | a4Linear |
| G1 | r5ca (par res5)  | A5  | a5Linear |
| GN | rnpgain (nasal)  | — SKIP — | anLinear derives from nasalMurmurStrength, NOT frame AN -> NO destination (hard-stop c: skip+document) |

GV maps to TWO params (AV + AVS) -> map is a LIST of pairs (not field->field), so
one voice field can target multiple frame params. Fully generic.

Verified anLinear/anGainScaled (semantics.yaml 748,797) dep only on
nasalMurmurStrength/nasalParallelDb — frame AN is NOT a gain dep. GN skipped.

### Call-site facts
- selectedVoice/voiceRegistry: tts-frontend.ts 286-296.
- per-frame apply loop: 605-625 (applySpeakerProfileToParams).
- dt-7a stamp built 601-604.
- registry reader: dectalk-voice.ts getVoiceRegistry 47-60 (add speakerGainOffsets).
- reference voice = resolveVoice(registry, registry.default).params.

## EVIDENCE (DONE — all collected)

### Probe `scripts/dt7b-gain-probe.ts` (kept) — phrase "ah ee oo", first voiced AA frame
```
{"label":"default","speaker":"(default)","vowelFrame":"AA","AV":64,"AVS":-70,"AH":0,"AF":0,"A1":0,"A2":0,"A3":0,"A4":0,"A5":0}
{"label":"paul","speaker":"paul","vowelFrame":"AA","AV":64,"AVS":-70,"AH":0,"AF":0,"A1":0,"A2":0,"A3":0,"A4":0,"A5":0}
{"label":"betty","speaker":"betty","vowelFrame":"AA","AV":56,"AVS":-78,"AH":-4,"AF":-4,"A1":-18,"A2":-2,"A3":10,"A4":5,"A5":15}
{"label":"harry","speaker":"harry","vowelFrame":"AA","AV":56,"AVS":-78,"AH":-4,"AF":-4,"A1":-24,"A2":-5,"A3":4,"A4":-10,"A5":16}
dt7b-gain-probe: PASS
```
- paul == default == byte-identical reference (every offset 0).
- betty/harry DIFFER from paul on AV/AVS/AH/AF/A1-A5 exactly per voice[gain]-paul[gain].
- betty vs harry differ (A1 -18 vs -24 [LO], A4 +5 vs -10 [G2]) -> distinct vocal character.

### Paul byte-identical
- `npx vitest run`: 125 files, 1107 passed == baseline 1107. ZERO failures. The
  snapshot test (test/tts-frontend-snapshot.test.ts) passed -> default/Paul output
  byte-identical.
- golden: ran each of the 3 golden scripts separately:
  klatt-tract-wasm-compare EXIT=0, render-phrase EXIT=0, lf-source-wasm-compare EXIT=1.
  ONLY lf-source fails (documented pre-existing WASM-vs-ref baseline; I touched no
  DSP/lf-source). render-phrase (the audio-render golden) UNCHANGED -> Paul/dectalk
  render byte-identical.

### qlatt-english untouched
- qlatt-english/frontend.yaml has NO `speakers:` block (grep EXIT=1) -> getVoiceRegistry
  returns null -> voiceGainOffsets undefined -> new additive loop never runs. Unaffected
  (also covered by the 1107-green suite).

### tsc
- Only pre-existing errors in test/tts-frontend-rhotic-vowels.test.ts (KlattFrame export)
  and test/tts-frontend-snapshot.test.ts (afterAll) — NOT my files (git diff confirms
  I touched frontend.yaml, dectalk-voice.ts, tts-frontend.ts, + 2 new files).

## SKIPPED + WHY
- GN (DECtalk rnpgain / nasal parallel): NO additive destination. Qlatt nasal gain
  anLinear/anGainScaled (semantics.yaml 748/797) derive from nasalMurmurStrength /
  nasalParallelDb — frame `AN` is NOT a dep of any gain formula. Adding an offset to
  AN would be a silent no-op. Omitted from speaker_gain_offsets + documented in
  frontend.yaml. (Hard-stop c: skip, do not force.)
- voice F5/B5/F6/F7/F8, BR->B1/aturb, richness/RI, AGO/AGVO/AGUO/CHINK/UNVOW,
  head_size: out of this chunk's scope (formants = dt-7a; aerodynamic/breathiness =
  recon dt-7d/dt-7e, no synth destination).

## DECLARATIVITY (hard constraint met)
- Mapping (gain->frame param) = DATA: frontend.yaml speakers.speaker_gain_offsets
  (list of {gain, param} pairs; one gain -> multiple params supported, e.g. GV->AV+AVS).
- Reference (Paul) = DATA: resolved from registry `speakers.default` voice's own
  params (resolveVoice(registry, registry.default)). NO hardcoded gain numbers in TS.
- Application = GENERIC infra: a voice-agnostic additive loop in
  applySpeakerProfileToParams (frame[param] += offsetDb). ZERO per-voice / per-gain
  / frontend-name branches.

## DEFINITION OF DONE
1. Per-voice gains as Paul-relative additive dB offsets via generic data-declared map: DONE.
2. Paul byte-identical: vitest 1107 green (== baseline), zero snapshot changes;
   render-phrase golden EXIT=0; only lf-source golden fails (pre-existing): DONE.
3. Probe kept + paul==default, betty/harry differ: DONE.
4. qlatt-english untouched: DONE (no speakers block).
5. Notes: this file. DONE.
NO git add/commit performed.

## (historical) STATUS during impl: IMPLEMENTED. Verifying.
Files changed (no git add):
- frontend.yaml: added speakers.speaker_gain_offsets (9 pairs, GN omitted).
- dectalk-voice.ts: SpeakerGainOffset type + registry reads speaker_gain_offsets.
- tts-frontend.ts: applySpeakerProfileToParams gains 5th arg voiceGainOffsets
  (generic additive loop); call site builds Paul-relative offsets from
  resolveVoice(registry, registry.default).params reference.
- scripts/dt7b-gain-probe.ts: probe (default/paul/betty/harry).

tsc: only pre-existing errors in test/tts-frontend-rhotic-vowels.test.ts and
test/tts-frontend-snapshot.test.ts (KlattFrame export + afterAll) — NOT my files.
Probe imports KlattFrame from tts-frontend-types (correct, mirrors dt7-timbre-probe).
