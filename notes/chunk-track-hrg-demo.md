# TRACK HRG-DEMO notes

## Goal
Prove HRG IR can drive synthesis end-to-end: phrase -> HRG -> lowered frames -> WAV, with provenance.
ADDITIVE only. New files: src/declarative-frontend/hrg/bridge.ts, scripts/render-hrg.ts, test/hrg-bridge.test.ts.
Default render path must remain byte-identical.

## Findings so far
- HRG API understood: Utterance (item pool + relations + ProvenanceCollector), Item.set(key,val,{reason,citations,parents}) stamped writes.
- lowerToFrames(utterance, opts): reads Segment relation list, each item needs `dur_ms` (duration), `phoneme`, and numeric param keys (F0,F1...). Produces KlattFrame[] @ 5ms with per-frame provenance index.
- whyParamAt(track, param, timeSec) -> DecisionRecord[] chain.
- KlattFrame: { time(sec), phoneme?, word?, params: Record<string,number>, segmentId?, provenance? }
- render-phrase.ts: builds RenderRequest, selectRenderBackend, backend.render(request) -> RenderPayload {samples,sampleRate,...}, writeWav(out, samples, sampleRate).
- Backends: track-only, node-runtime (default for runtime engine + persistWav), browser-runtime.
- node-runtime backend takes a RenderRequest (phrase+frontend) and runs the WHOLE pipeline itself. NEED: render from a track WE built (HRG frames), not from a phrase. Must investigate node-runtime.ts to find how to render a given KlattFrame[] track.

## Next steps
- Read scripts/rendering/backends/node-runtime.ts to find the renderer that turns a track into samples.
- Read tts-frontend.ts to find how to get realized segments (phonemes, durations, params, F0 contour) from a phrase for a frontend.
- Find qlatt-beauty frontend/experiment config (female voice ~190 F0).

## Blocker
None. Design locked.

## Design (locked)
- bridge.buildUtteranceFromPhrase(phrase, frontendId, opts): call textToKlattTrackDetailed -> {track(46 event-frames), frontendPhones(18 phones w/ durationMs)}.
- Real track frames carry ~60 numeric param keys (F0,F1-F6,B1-B6,AV,AVS,AF,AH,Rd,sourceMode,OQ,TL,A1-A10,AB,SW,FGP...,AN,nasal*). MUST pass paramKeys=union to lowerToFrames (DEFAULT_KLATT_PARAMS too small -> silence).
- Per phone: cumulative start from durationMs; sample nearest source frame at phone midpoint -> copy ALL numeric params + F0. Stamp as provenance writes on Segment item (dur_ms, phoneme, F0, params...).
- Build Word(group by consecutive word) -> Syllable(1/word, no syll annotation in beauty) -> Segment, SylStructure tree + flat lists.
- lowerToFrames(u,{paramKeys, framePeriodSec:0.005}) -> ~353 5ms frames (steady-per-segment, stepwise; simpler than full pipeline - acknowledged).
- render-hrg.ts: replicate node-runtime render (OfflineAudioContext + createKlattRuntime + createKlattInterpreter.scheduleTrack(frames, leadTime) + writeWav). Print whyParamAt(track,"F0",t).
- Baseline render OK: rms 0.072 peak 0.52, f0Mean 192 (female), 46 frames. baseline-moon.wav written.

## DONE — all gates PASS
- bridge.ts + render-hrg.ts + test/hrg-bridge.test.ts written. bridge tsc strict EXIT 0.
- hrg-bridge.test.ts: 3/3 pass.
- HRG render hrg-moon.wav: 353 frames, 59 param cols, rms 0.078, f0Mean 192.7.
- measure: F0 median 193, F1/F2/F3 = 648/1714/2862 (female), 70 dB, HNR 23. voiced 83.6%.
- baseline (default path) re-render BYTE-IDENTICAL to pre-change render (cmp clean).
- npm run test:golden EXIT 0.
- whyParamAt(F0,0.88s) -> F0->phoneme(AA)->syllable->word "calm". 4 decisions, cited.
- Report: design/beauty-synthesis/build/reports/track-hrg-demo.md
- Honest gap: lowering holds segment params steady (stepwise), not full-pipeline ramps. Same speaker, not byte-identical to full pipeline. Documented seam.
