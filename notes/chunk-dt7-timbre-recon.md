# Chunk dt-7 — Per-voice timbre wiring RECON (read-only)

Datestamp: 2026-05-29
Scope: recon only. No files changed except this report. Mission: design how the
selected DECtalk voice's higher formants (F4-F8/B4/B5), source gains
(GF/GH/GV/GN/G1-G4/LO), and glottal params (AGO/AGVO/AGUO/UNVOW/CHINK,
breathiness/richness/head_size, etc.) flow to audio DECLARATIVELY so the 9
voices differ in vocal character, not just pitch.

---

## 1. DECtalk 4.63 reference — per-frame synth input vs one-time config

All evidence from `C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_vset.c`,
function `setspdef()` (starts line 522). This routine runs once per speaker
load ("recompute and reload a speaker definition", lines 504-510) and writes a
`spdef` (SPD_CHIP) struct that is `spcwrite()`-blasted to the synthesizer chip
(line 879). The struct is SPEAKER-LEVEL CONFIGURATION sent once — it is NOT the
per-frame param[] array that carries F0/AV/AF/F1-F3 etc. per 5 ms frame.

CLASSIFICATION — these voice fields are CONFIG (one-time chip setup), not
per-frame inputs:

- F4 -> `spdef->r4cb`, scaled by FNscale: `nlong = curspdef[SPD_F4]; nlong *= fnscale; r4cb = nlong>>12` (ph_vset.c:720-722). ZAPF sentinel / >4950 clamp (714-730).
- B4 -> `spdef->r4cc = curspdef[SPD_B4]` (ph_vset.c:725).
- F5 -> `spdef->r5cb`, also *FNscale (ph_vset.c:738-740). >Nyquist -> ZAPF (756-760).
- B5 -> `spdef->r5cc = curspdef[SPD_B5]` (ph_vset.c:755).
- F7 -> `spdef->r4pb = curspdef[SPD_P4]` ("F7 -> F4p", parallel resonator 4 freq) (ph_vset.c:761).
- F8 -> `spdef->r5pb = curspdef[SPD_P5]` ("F8 -> F5p", parallel resonator 5 freq) (ph_vset.c:762).
- FNscale (= head_size HS): `spdef->fnscale = (200 - curspdef[SPD_HS]) * 41` (ph_vset.c:712). Multiplies F4 and F5 (a vocal-tract-length / head-size global formant scale).
- G1 -> `spdef->r5ca` (parallel resonator-5 gain dB) (ph_vset.c:765).
- G2 -> `spdef->r4ca` (ph_vset.c:766).
- G3 -> `spdef->r3ca` (ph_vset.c:767).
- G4 -> `spdef->r2ca` (ph_vset.c:770/772).
- LO -> `spdef->r1ca` (ph_vset.c:775).
- GN -> `spdef->rnpgain` (parallel nasal gain) (ph_vset.c:805/811).
- GV -> `spdef->azgain` (ph_vset.c:808/810).
- GF -> `spdef->afgain` ("GH -> GH" comment is wrong; it reads SPD_GF) (ph_vset.c:816).
- GH -> `spdef->apgain` (ph_vset.c:818).
- BR (breathiness) -> B1 offset `spdefb1off = (BR*BR)>>1 + 4096` (ph_vset.c:703-704) AND `spdef->aturb = curspdef[SPD_BR]` (aspiration turbulence) (ph_vset.c:786). "BR=55 -> scale B1 by 2.5; BR=0 -> 1.0" (705-706).
- SM (smoothness) -> spectral tilt `spdeftltoff = (SM*25)/100` dB, then +8 if <=18 (ph_vset.c:691,699-700).
- RI (richness) -> `spdef->nopen1 = 5000 + 160*(100-curspdef[SPD_RI])` (glottal open-phase K1) (ph_vset.c:783).
- NF -> `spdef->nopen2 = curspdef[SPD_NF]*4` (ph_vset.c:784).
- LA (laryngealization) -> `spdef->t0jit = curspdef[SPD_LA]` (period jitter) (ph_vset.c:763).

CLASSIFICATION — these voice fields are NOT sent to the chip; they are
higher-level routine inputs (prosody / aerodynamic model), "not sent to chip,
just used by higher level routines" (ph_vset.c:666):

- AGO -> `NOM_VOIC_GLOT_AREA`, AGVO -> `NOM_VOICED_OBSTRUENT`, AGUO -> `NOM_Open_Glottis`, CHINK -> `NOM_Area_Chink`, OQ -> `NOM_Open_Quo`, UNVOW -> `NOM_UNSTRESSED_VOWEL` (ph_vset.c:667-672). These drive an aerodynamic/glottal-area model (HLSYN / vtm thread), not the Klatt formant chip.
- AS (assertiveness) `*41`, QU->f0_lp_filter, HR->size_hat_rise, SR->scale_str_rise, AP->f0minimum, PR->f0scalefac, BF->f0basefall (ph_vset.c:677-685) — F0/prosody params. THESE ARE ALREADY WIRED in Qlatt (see section 2).

KEY TAKEAWAY: In DECtalk, F4/F5/B4/B5/F7/F8/G1-G4/LO/GN/GV/GF/GH/BR/SM/RI/HS are
SPEAKER-LEVEL CONFIG written once into the chip's resonator/gain registers — not
per-frame array values. The Qlatt-equivalent of "write once into the chip" is
"apply to every frame's params object" (Qlatt has no persistent chip state; the
interpreter reschedules AudioParams each frame from frame.params). So in Qlatt
these become per-frame constants set on every frame by the speaker layer.

---

## 2. Qlatt current state

### 2a. What `applySpeakerProfileToParams` applies vs ignores

`src/tts-frontend.ts:166-192`. Called per non-f0 token at `tts-frontend.ts:569`
(it mutates each frame's `params` object after all rule phases).

APPLIES (only):
- `params.sourceMode = sourceContourBaseline.source_mode` (line 178)
- `params.Rd = sourceContourBaseline.rd` (line 179)
- `params.RdRef = sourceContourBaseline.rd_ref` (line 180)
- `params.TL += spectral_tilt_offset_db` if nonzero (lines 181-183) — this is the only place `spectral_tilt_offset_db` reaches audio (covers SM/smoothness partially).
- Scales `F1..F10` by `speaker.formant_scale` if != 1.0 (lines 184-191) — `SPEAKER_FORMANT_KEYS` = F1..F10 (line 162-164). This DOES scale F4-F8 by formant_scale, but it scales the inventory base value; it does NOT inject the voice's own F4/F5/F7/F8 numbers.

IGNORES (the entire dt-1 stored set): F4, B4, F5, B5, F7, F8 (as absolute
values), GF, GH, GV, GN, G1, G2, G3, G4, LO, AGO, AGVO, AGUO, UNVOW, CHINK,
smoothness, breathiness, richness, nopen_fraction, laryngealization, head_size,
quickness, falling_target. `applySpeakerProfileToParams` only sees the resolved
`ResolvedSpeakerProfile` (formant_scale + the source baseline), NOT the raw
`selectedVoice.params` record. The voice's stored F4-F8/gains/glottal never
enter a frame.

Note: `rd_default` IS used — it feeds `sourceContourBaseline.rd` (the Rd applied
at line 179), so per-voice Rd already differs (Paul 0.7 vs Betty 0.9). That
partially covers breathiness via Rd.

### 2b. Where `selectedVoice.params` currently goes (and stops)

`tts-frontend.ts:605-609`: the voice's full numeric params are merged into
`extracted` for `speakerParams` — but `speakerParams` ONLY feeds the layered
F0 model (`if (f0Model)` guard at line 593; dectalk declares `f0_model:
layered_additive`, frontend.yaml:37-38). So selectedVoice.params reaches F0
scaling but is dropped for everything formant/gain/glottal. The voice record IS
loaded and available in the frontend by name — wiring it to frames is the only
missing step.

### 2c. Are F4-F8 per-frame frame params (settable) or fixed?

PER-FRAME and SETTABLE. The graph generates `cascadeF{N}` resonators binding
`frequency: {bind: F{N}}`, `bandwidth: {bind: B{N}}` for N=1..8
(`src/formant-bank.ts:78-85`, driven by `formantBanks.main.formants` in
`public/experiments/dectalk-english/graph.yaml:24-96`). The interpreter
schedules these AudioParams from `frame.params.F4` etc. every frame
(klatt-interpreter.ts buildContext -> evaluateSemantics -> bindings, lines
300-327, 406+). F4-F8/B4-B8 are real per-frame params.

WHERE F4-F8 DEFAULTS COME FROM: `public/rules/frontends/dectalk-english/inventory.yaml`
`base_params` sets F4=3500,B4=260,F5=4500,B5=600,F6=5500,B6=800 ONCE
(inventory.yaml:13-18). `grep -c "F4:"` = 1 — NO per-phoneme override of F4-F8.
Therefore a speaker-level F4-F8 written onto each frame's params WILL win (it
overrides the single base_params default, and nothing per-phoneme contests it).
This is the green light: per-voice F4-F8 CAN flow to audio with no graph change.

CAVEAT — inventory F5/F6 differ from voice F5/F6 semantics. Inventory F5=4500,
F6=5500 (cascade formants 5/6). Voice files store F5=6000 (Paul/Betty),
F7=3350/4150, F8=4350/6000. In DECtalk F7/F8 are the PARALLEL resonators 4/5
(r4pb/r5pb), NOT cascade F7/F8. The Qlatt graph's F7/F8 (graph.yaml:79-96) are
high cascade formants (6500/7500 Hz) used for fricative coloration with
`parallelSource: parallelFricGain`. So the voice's "F7"/"F8" numbers do NOT map
1:1 to Qlatt's F7/F8 nodes — they correspond to DECtalk's parallel F4p/F5p,
which Qlatt builds via PFE from A4/A5 + cascade F4/F5, not as separate nodes.
FLAG: voice F7/F8 have NO clean Qlatt destination without semantic remapping
(see section 3 risk + section 4 dt-7a scope note).

### 2d. How gains map to synth gain AudioParams (do equivalents exist?)

Qlatt's dectalk graph gain nodes (graph.yaml:287-407) and their semantics
(klatt80-baseline/semantics.yaml):
- `voiceGain` = `dbToLinear(GO + AV + eeGainDb + ndbScale.AV) * F0scale` (semantics.yaml:710-712). Driven by per-frame AV + frame/inventory `GO` (inventory base_params GO=47, inventory.yaml:61). No GV term.
- `aspGain` = `dbToLinear(GO + AH + ... + ndbScale.AH)` (semantics.yaml:714-716). No GH/GF term.
- `fricGain`/`fricGainScaled` = `dbToLinear(GO + AF + ndbScale.AF)` (semantics.yaml:728-730, 804-806). No GF term.
- `avsGain` = `dbToLinear(GO + AVS + ...)` (semantics.yaml:732-734). No GV term.
- Parallel formant gains `a{N}Linear` = `sign * dbToLinear(A{N} + PFE_corrections + ndbScale) * parallelScale` (pfe-codegen.ts:31-60). Per-frame A{N} dB + COMPUTED corrections + FIXED `ndbScale` constants (graph.yaml ndbScale: -58..-82). NO per-voice G1-G4 term.
- `anLinear` (nasal parallel) derived from `nasalMurmurStrength`, not GN (semantics.yaml:739-748).

CONCLUSION: DECtalk's G1-G4 (parallel resonator gains r5ca/r4ca/r3ca/r2ca), LO
(r1ca), GN (rnpgain), GV (azgain), GF (afgain), GH (apgain) have NO existing
per-voice AudioParam hook. The closest single global gain knob is `GO`
(inventory base_params, fed into every gain via semantics). A per-voice "global
gain offset" could ride on GO trivially; but the INDIVIDUAL parallel-channel
gains (G1-G4) and the separate voiced/aspiration/frication gain balance
(GV/GH/GF) have no destination — the semantics gain formulas would need new
additive terms (e.g. `+ GVoffset`) and new per-frame params.

### 2e. breathiness/richness/head_size existing hooks

- breathiness (BR): PARTIAL. `rd_default` (Paul 0.7 / Betty 0.9) feeds Rd
  (applySpeakerProfileToParams line 179); `aspGain` couples AH up with Rd>1
  (semantics.yaml:715 `max(0,10*(effectiveRd-1))`). And `spectral_tilt_offset_db`
  (Betty 2.5) adds to TL (line 182). DECtalk's BR also widens B1
  (spdefb1off, ph_vset.c:703) and sets aturb — NEITHER wired (no per-voice B1
  scale, no aturb param in Qlatt graph).
- smoothness (SM): PARTIAL via `spectral_tilt_offset_db` -> TL. The dt-1 import
  already folded SM into spectral_tilt_offset_db (Betty SM=50 -> tilt 2.5).
- richness (RI): NONE. DECtalk RI sets glottal open-phase nopen1. Qlatt has
  `OQ`/`openPhaseRatio` (impulse source, graph.yaml:121) and Rd, but no
  per-voice mapping from richness.
- head_size (HS): NONE as a distinct hook. DECtalk HS = FNscale scales F4/F5
  (a vocal-tract-length factor). Qlatt's analogue is `formant_scale`
  (applies to F1-F10), but the voice files set head_size=100 separately and it
  is currently ignored. (Paul/Betty both head_size=100, so no current divergence.)

---

## 3. DESIGN (declarative) — make voice F4-F8/gains/glottal flow to audio

Anchor: the ONE place a resolved voice can stamp every frame is
`applySpeakerProfileToParams` (tts-frontend.ts:166-192), already called per
frame at line 569. The voice record (`selectedVoice.params`) is already loaded;
it just is not passed into that function. The cleanest declarative shape is a
DATA-DRIVEN field map, not per-voice branches (matches dt-1's generic-selector
discipline; MEMORY note "no unauditable per-voice TS").

### Option (a) — generic "apply speaker fields to frame params" map [RECOMMENDED]

Pass `selectedVoice.params` (and the field-application policy) into
`applySpeakerProfileToParams`. Add a YAML-declared map in the frontend (or a
shared policy file) of the form:

```yaml
speaker_param_bindings:        # declarative, in frontend.yaml or a policy yaml
  F4:   { frame: F4, op: set }
  B4:   { frame: B4, op: set }
  F5:   { frame: F5, op: set }
  B5:   { frame: B5, op: set }
  # GO offset etc.
```

TS infra (generic, ~30-60 lines): read the binding map; for each entry, take
`selectedVoice.params[voiceField]` and `set`/`add`/`mul` it onto
`frame.params[frameParam]` (only when the frame doesn't already carry a
per-phoneme value, or unconditionally for speaker-level constants). NO voice
names in code. The map is pure data.

- PURE DATA/YAML: the field->frame map; which op; clamps.
- GENERIC TS NEEDED: a small loop applying the map (extend
  applySpeakerProfileToParams signature to take `voiceParams` +
  `bindings`). Reuses existing `set` semantics — F4-B5 already have frame
  destinations (2c), so those entries work with ZERO graph/semantics change.
- MAPS GAINS->AudioParams: only for fields with an existing destination. F4-B5
  -> direct. GO-offset -> add to frame `GO`. G1-G4/GV/GH/GF/GN/LO -> NO
  destination; map entries for them would be no-ops until section-3 semantics
  terms are added.
- SIZE: small. RISK: low for F4-B5; the F7/F8 mismatch (2c) means voice F7/F8
  must NOT be blindly `set` onto Qlatt F7/F8 nodes (different meaning) — leave
  unmapped or remap to A4/A5 with care.

### Option (b) — express voice->param via semantics realize rules reading speaker policy

Inject the voice params into the semantics evaluation context as constants
(e.g. `speaker.F4`, `speaker.G1`), then add realize rules that consume them:
`voiceGain: dbToLinear(GO + AV + speakerGvOffset + ...)`. This keeps the gain
math in semantics.yaml (where it belongs, with citations) and is the natural
home for the gain offsets that have no current term.

- PURE DATA/YAML: new realize-rule terms in
  `public/experiments/dectalk-english/semantics.yaml` (e.g. add
  `speakerGvDb` param + `+ speakerGvDb` in avsGain/voiceGain). Cite ph_vset.c.
- GENERIC TS NEEDED: a hook to push `selectedVoice.params` into the
  interpreter's static/frame context as a `speaker.*` namespace (the
  interpreter already builds context from frame params + constants,
  klatt-interpreter.ts:314-316; constants are the clean injection point).
- MAPS GAINS->AudioParams: YES — this is the ONLY option that gives G1-G4 /
  GV/GH/GF/GN/LO a real destination, by adding additive dB terms to the
  existing gain formulas. G1-G4 would each need to feed the matching parallel
  channel's `a{N}Linear` (add `+ speakerG{k}Db` in pfe-codegen output).
- SIZE: medium (touch pfe-codegen for G1-G4; touch semantics for GV/GH/GF/GN/LO).
  RISK: medium — changes the gain math; must keep Paul byte-identical (Paul's
  gains must reduce to current behavior, i.e. offsets default to 0 for Paul or
  the formulas must be calibrated so Paul's stored values reproduce today's
  output). Paul GO baseline interplay (inventory GO=47) needs care.

### Option (c) — per-frame defaults from speaker (frame-default layer)

Have the track assembler seed each frame's params from a speaker-default record
before inventory/rule values apply, so the voice acts as the base layer and
phoneme/rule values override. This is essentially DECtalk's "load chip once"
semantics. Cleaner conceptually but larger blast radius (touches
track-assembler frame construction).

- PURE DATA/YAML: the speaker default record (already in voice YAML).
- GENERIC TS NEEDED: track-assembler change to merge speaker defaults under
  frame params. RISK: higher — reorders the precedence of inventory vs speaker;
  must preserve Paul byte-identity and not clobber per-phoneme F1-F3/AV.

### Fields with NO synth destination (need graph/DSP change — OUT of scope)

- voice F7 / F8 (DECtalk parallel F4p/F5p): no 1:1 Qlatt node (2c). Needs PFE/parallel remap.
- aturb (BR turbulence), spdefb1off (BR->B1 widen): no Qlatt param. Needs new B1-offset hook / aspiration-turbulence node.
- AGO/AGVO/AGUO/CHINK/UNVOW (aerodynamic glottal-area model): Qlatt has no
  aerodynamic glottal-area stage on the dectalk path; these drove HLSYN/vtm in
  DECtalk. NO destination — graph/DSP work, out of scope.
- richness (RI -> nopen1 glottal open phase): only loosely maps to OQ/Rd; no
  direct param. Needs an OQ/open-phase mapping decision.
- quickness, falling_target: prosody-adjacent; falling_target is an F0 target
  (likely belongs with the F0 model, not timbre).

---

## 4. Suggested chunk breakdown (ordered, each verifiable paul vs betty)

Each chunk verifiable by rendering "paul" vs "betty" and dumping the relevant
frame params (extend `scripts/dt1-voice-probe.ts`, or the explain/frame dump) to
show the values differ. NO audio eyeballing.

- **dt-7a — Higher formants F4/B4/F5/B5 (Option a).** Lowest risk: these have
  real frame destinations and no per-phoneme contest (2c). Add the declarative
  field-binding map + generic loop in `applySpeakerProfileToParams`; map
  F4/B4/F5/B5 `set`. Leave voice F6 (inventory-only), F7/F8 (mismatch) UNMAPPED.
  VERIFY: frame.params.F4 = 3500 (paul) vs 4550 (betty), B4 260 vs 400.
  Hard requirement: Paul stays byte-identical (Paul F4=3500 == inventory 3500,
  B4 260 == 260, so Paul is a no-op — confirm).

- **dt-7b — head_size (HS/FNscale) + formant_scale reconciliation.** Decide
  whether head_size multiplies F4/F5 (DECtalk FNscale) or is folded into
  formant_scale. Pure-data once the policy is chosen. VERIFY: F4/F5 scale with
  head_size. (Low priority: Paul/Betty both HS=100, no current divergence.)

- **dt-7c — Source/parallel gains G1-G4/LO/GV/GH/GF/GN (Option b).** Add
  additive dB offset params to the gain realize rules + pfe-codegen, injected
  from the voice via the semantics `speaker.*` context. This is the real
  per-voice "vocal character" lever. VERIFY: voiceGain/avsGain/a{N}Linear
  realized values differ paul vs betty. RISK: keep Paul byte-identical
  (offsets calibrated so Paul reproduces today). Medium.

- **dt-7d — Breathiness completion (BR -> B1 widen + aturb).** Needs a B1-offset
  hook and an aspiration-turbulence destination (graph change). Higher risk;
  partial coverage exists via Rd + spectral_tilt today, so this is incremental.

- **dt-7e — Glottal-area / aerodynamic params (AGO/AGVO/AGUO/CHINK/UNVOW,
  richness).** FLAGGED OUT OF SCOPE for declarative wiring: no synth
  destination on the dectalk path; requires a glottal-area/aerodynamic DSP stage.
  Document as future graph work.

Recommended order: dt-7a first (cheap, visible, low risk), then dt-7c (the big
timbre payoff), then dt-7b, dt-7d, dt-7e.

---

## Verified facts index (file:line)
- DECtalk config-not-frame: ph_vset.c setspdef 522-883; F4/F5 712-740, B4/B5 725/755, F7/F8 761-762, G1-G4 765-772, LO 775, GV/GN/GF/GH 805-818, BR 703-704/786, SM 691, RI 783, HS FNscale 712; aerodynamic-not-chip 666-672.
- Qlatt applySpeakerProfileToParams: tts-frontend.ts 166-192; call site 569.
- Voice merge into F0-only speakerParams: tts-frontend.ts 593-615.
- dectalk f0_model layered: frontend.yaml 37-38.
- F4-F8 per-frame binding: formant-bank.ts 78-108; graph.yaml 24-96.
- inventory F4-F8 single base_params, no per-phoneme: inventory.yaml 13-18 (grep -c F4: == 1).
- Gain semantics (no per-voice G term): klatt80-baseline/semantics.yaml 710-734; pfe-codegen.ts 31-60.
- rd_default -> Rd -> breathiness partial: tts-frontend.ts 179; semantics.yaml 715.
