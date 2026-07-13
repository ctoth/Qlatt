# Chunk dt-7a — Per-voice higher-formant timbre wiring (CODER)

Datestamp: 2026-05-29
Branch: dectalk-parity (verified `git branch --show-current`)
Mission: generic data-declared speaker-field -> frame-param mechanism so the
selected DECtalk voice's higher formants shape audio; Paul byte-identical.

## CRITICAL DATA FINDING (governs the declared field list)

Verified values (inventory.yaml base_params vs speakers/*.yaml):

| Field | inventory | paul | betty | paul no-op? | paul vs betty differ? |
|-------|-----------|------|-------|-------------|-----------------------|
| F4    | 3500      | 3500 | 4550  | YES         | YES                   |
| B4    | 260       | 260  | 400   | YES         | YES                   |
| F5    | 4500      | 6000 | 6000  | NO (6000!=4500) | NO (same)         |
| B5    | 600       | 6000 | 6000  | NO (6000!=600)  | NO (same)         |

Files: inventory.yaml:13-16 (F4=3500,B4=260,F5=4500,B5=600);
paul.yaml:28-31 (F4=3500,B4=260,F5=6000,B5=6000);
betty.yaml:28-31 (F4=4550,B4=400,F5=6000,B5=6000).
Graph binds F5 index5 freqDefault 4500, range [3500,6000] (graph.yaml:58-64) ->
F5/B5 ARE live frame params; changing them changes audio.

### Consequence
The mission's premise "Paul's voice F4/F5 already equal the inventory default"
is TRUE for F4/B4 but FALSE for F5/B5 (Paul F5=6000 != inventory 4500).
Recon's dt-7a section only checked F4/B4, and recon's own caveat (lines 116-117)
flagged the F5 mismatch. Mapping F5/B5 onto frames would CHANGE Paul output
(hard-stop b) AND would NOT distinguish voices (Paul==Betty for F5/B5).

### Decision: declared list = [F4, B4] (data, not code)
Excluding F5/B5 is a DATA choice in the declared binding list. It satisfies both
invariants: Betty gets her F4/B4 (distinct timbre), Paul stays byte-identical.
F5/B5 are deliberately omitted because including them breaks Paul's no-op with no
voice-distinguishing benefit. The "e.g. [F4,B4,F5,B5]" in the mission was an
example; the hard invariant (Paul no-op) governs and forces [F4,B4].
The generic mechanism is unchanged — only the data list content differs.

## Mechanism site
`applySpeakerProfileToParams` (tts-frontend.ts:166-192), called per frame ~569.
Currently takes (params, speaker:ResolvedSpeakerProfile, sourceContourBaseline).
It does NOT receive selectedVoice.params. Need to pass the voice's raw params +
a data-declared binding list, then a generic loop copies voice[field]->params[field].

## Absolute-vs-scaled decision (to finalize in impl)
formant_scale loop (lines 184-191) multiplies F1..F10 by speaker.formant_scale.
DECtalk voice F4/F5 are ABSOLUTE speaker values (recon sec 1). Betty formant_scale=1.17.
Must apply absolute voice F4/B4 in a way that is NOT then re-multiplied by formant_scale
(or account for it). Order/interaction is the open impl detail.

## IMPLEMENTED (code written, not yet verified)
1. frontend.yaml: added `speakers.speaker_frame_params: [F4, B4]` with comment
   explaining F5/B5 exclusion. DATA list — the which-fields decision.
2. dectalk-voice.ts: VoiceRegistry gains `speakerFrameParams: string[]`;
   getVoiceRegistry reads `speakers.speaker_frame_params` (filtered strings, [] default).
3. tts-frontend.ts applySpeakerProfileToParams: new optional 4th arg
   `voiceFrameStamp {params, fields}`; generic loop sets params[field]=voice[field]
   for each declared field, ABSOLUTE, AFTER the formant_scale loop (so voice
   formants are not re-multiplied by formant_scale). No per-voice/per-field branches.
4. tts-frontend.ts: hoisted `registry` -> `voiceRegistry` (function-scope let);
   built `voiceFrameStamp` (selectedVoice && registry && list non-empty) and pass
   it to applySpeakerProfileToParams at the per-frame map (~line 569).

## Absolute-vs-scaled: DECIDED = absolute (set after scale loop)
DECtalk voice formants are absolute chip-config values (ph_vset.c). Applied AFTER
formant_scale loop -> not re-multiplied. Paul formant_scale=1.0 (loop is no-op
anyway) and F4=3500==inventory -> Paul byte-identical. Betty F4 stamped 4550 absolute.

## EVIDENCE (all collected — DONE)

### Probe (scripts/dt7-timbre-probe.ts, kept) — render "ah ee oo", first voiced vowel frame
```
{"label":"default","speaker":"(default)","frames":83,"vowelFrame":"AA","F4":3500,"B4":260,"F5":4500,"B5":600}
{"label":"paul","speaker":"paul","frames":83,"vowelFrame":"AA","F4":3500,"B4":260,"F5":4500,"B5":600}
{"label":"betty","speaker":"betty","frames":83,"vowelFrame":"AA","F4":4550,"B4":400,"F5":5265,"B5":600}
dt7-timbre-probe: PASS
```
- Betty F4=4550, B4=400 (absolute voice values) — DIFFER from Paul. Timbre now shapes audio.
- Paul F4=3500, B4=260 == default == inventory. NO-OP CONFIRMED.
- F5: paul/default 4500, betty 5265 (=4500*1.17 formant_scale). F5 NOT stamped
  (not in declared list); betty's F5 differs ONLY via the pre-existing formant_scale
  loop, not via this chunk. B5=600 inventory for all (not stamped, B-keys not scaled).

### tsc: no errors in my touched files (frontend.yaml, dectalk-voice.ts, tts-frontend.ts,
  dt7-timbre-probe.ts). Pre-existing errors in scripts/dump-track.ts and
  scripts/oracle/symbolic.ts are in files I did not touch (confirmed via git diff).

### vitest: `npx vitest run` -> 125 files, 1107 passed (== baseline). ZERO baseline
  changed -> Paul/default byte-identical -> Paul IS a no-op (suite-confirmed).

## DEFINITION OF DONE STATUS
1. Generic field-map application: DONE. Field list is DATA
   (frontend.yaml speakers.speaker_frame_params). TS is a generic copy loop, no
   per-voice/per-field branches.
2. Probe kept + passing: DONE (above).
3. Paul byte-identical, vitest 1107 green: DONE. qlatt-english untouched.
   (golden test:golden NOT run here — only vitest; lf-source golden not in scope.)
4. Notes: this file. DONE.

## Hard constraint NOTE (scope decision, not a hard-stop)
Declared list = [F4, B4] (NOT [F4,B4,F5,B5]). The mechanism is fully generic;
only the data list excludes F5/B5 because they would break Paul's no-op (Paul
F5=6000 != inventory 4500) without distinguishing voices (all voices F5=6000).
This is a data edit, consistent with mission's "which-fields is data" requirement.
NO git add/commit performed.
