# KLGLOTT88 browser-silent investigation

2026-05-31. Q's browser spy (Session #7, hello world): klglottSource silent, cascade-out ~0,
only noise/frication audible -> "h" + hiss, no vowels. + state_leak FAIL. dt-vtm1b flipped
default to KLGLOTT88 validated ONLY in node. REVERTED to impulse default (05323c4a) -> audio restored.

## FACTS (observed)
- Node: klglott mode 3 renders voiced audio (all-vowel "we were away" peak 2.01; voiced energy real).
- Browser (spy): klglottSource max rms=0, cascade-out 0.0028 (voice dead), noise/frication alive.
- Processor public/worklets/oversampled-glottal-source-processor.js: if !this.ready||!this.wasm ->
  process() returns silent (line 96-99). WASM loaded via processorOptions.wasmBytes OR fetch(wasmUrl)
  (line 72-73). **NO .catch() on initWasmModule(...).then()** -> a wasm load failure = silent unhandled
  rejection -> permanently silent voice. Matches symptom exactly.
- Browser loader (browser-loader.ts:17-25): fetches /worklets/<name>.wasm?v=ts. File EXISTS
  (public/worklets/oversampled-glottal-source.wasm 22885 bytes). Registry declares wasm. Same
  processor klsyn88 uses (browser-works).

## CANNOT DETERMINE BY READING (need browser runtime info)
- Why wasm not ready in browser: fetch 404? unhandled rejection? param descriptors? Need browser
  console error / network tab — which I cannot get headlessly.
- klsyn88 (same crate) browser-works; dectalk added the primitive but something in the browser
  worklet/wasm provisioning for the dectalk experiment differs. Suspect: wasm fetch/registration
  for the newly-added dectalk primitive, OR processorOptions.wasmBytes not passed in browser path.

## NEXT (needs Q or accessible diagnostic)
- ONE observation needed: does /worklets/oversampled-glottal-source.wasm load in the browser, or is
  there a console error when playing dectalk at sourceMode 3? (screen-reader-accessible: console text.)
- OR add a .catch() that postMessages the error to main thread -> surface as accessible diagnostic
  (also a real bug fix: silent unhandled rejection). Needs worklet rebuild + browser re-test.
- KLGLOTT88 stays selectable mode 3; default impulse until fixed. F5/HS/smoothing kept (impulse-safe).

## BROWSER DEBUG (Q: "shouldn't we debug klglott in the browser?" — YES; render-phrase --host browser
## --allow-browser 1 launches real headless Chrome + pipes console/pageerror to stderr)
- Temporarily set source_mode 3, ran browser render dectalk hello world. FINDINGS:
  - `[browser:error] Failed to load resource: ... 404 (Not Found)` (URL not in the generic message;
    appears right after page-load, before render — may or may not be the wasm).
  - oversampled-glottal-source-processor IS INSTANTIATED in browser (receives tilt param ramps) ->
    node IS created (wasmBytes present at node-creation), params arrive. So NOT a "node null" case.
  - So the worklet EXISTS but (theory) its WASM isn't usable -> process() silent.
- wasm-utils.ts initWasmModule: if wasmBytes -> use bytes (NO fetch); else fetch resolveWasmUrl.
  createWasmWorkletNode passes wasmBytes via processorOptions. SUSPECT: in browser the ArrayBuffer
  may not survive structured-clone to the AudioWorklet (detached/undefined) -> worklet falls back to
  fetch -> resolveWasmUrl(./oversampled-glottal-source.wasm) relative to vite-served processor URL ->
  404 -> never ready -> silent. (Node passes bytes in-process, no clone -> works.)
- STILL NEED: (a) confirm browser render voice IS silent (measure wav/metrics — node -e cut off);
  (b) capture the 404 URL (add requestfailed handler) to confirm it's the wasm.
- TODO: RESTORE source_mode 0 (currently 3 for debug). committed state is 0.

## BROWSER REPRODUCED (the unlock — I can debug headlessly now, no Q needed)
- render-phrase --host browser reproduces it: dectalk hello world mode3 peak=0.5177 (= noise only;
  node mode3 was ~0.85 with voice; Q's spy output_no_clip 0.498 MATCHES). Voice silent confirmed.
- oversampled-glottal-source-processor IS instantiated (tilt param-clamp warnings on it).
- A 404 fires but page-level requestfailed/response handlers do NOT catch it -> it's a WORKLET-CONTEXT
  fetch (invisible to page events, visible only as generic console error). => the worklet falls back to
  FETCHING its wasm (so wasmBytes NOT received by the worklet) and that fetch 404s -> never ready -> silent.
- BLOCKER: my edits to public/worklets/oversampled-glottal-source-processor.js have NO effect (console.log
  not seen [worklet console not forwarded], AND a 0.25 not-ready test-tone did NOT change peak 0.5177
  byte-identical). => either the served worklet != my edited public/.js, OR the worklet's voice output
  isn't routed to the cascade in browser. Strong: my .js edits aren't being executed.
- LEADING HYPOTHESIS: main-thread loads the wasm fine (200; page response handler didn't flag it), passes
  wasmBytes via processorOptions, but the oversampled worklet doesn't receive/use them -> worklet-context
  fetch -> 404. WHY only this worklet (others work): UNKNOWN. Candidate: structured-clone of the 22KB
  ArrayBuffer to the worklet, OR a categorization/registry difference, OR the served .js differs from mine.
- NEXT: restore all debug edits (worklet .js, backend.ts requestfailed handler, source_mode 0). Then
  to fix: verify served worklet source (vite public vs src/.ts), and how klsyn88 (browser-works) differs.
  Likely fix = ensure wasmBytes reaches the worklet OR the worklet-context fetch URL is correct.

## ROOT CAUSE NARROWED (decisive probes)
- DISPROVED earlier theories: worklet IS served (my edits change output), IS ready (wasm loads fine -
  unconditional 0.3 fill changed browser rms 0.039->0.146), output IS routed. 404 is a RED HERRING.
- The crate is silent because a PARAM is wrong. f0<=0 is the crate's silence condition.
- DECISIVE (probe = 220Hz loud square in voiceChannel gated on f0>50, passes cascade):
  * NODE mode3: square FIRES (peak 1.03, rms 0.138, brightness 0.23) -> f0 REACHES klglott in node (~106). klglott works in node, probe VALID.
  * BROWSER: voice silent in working renders (peak 0.52 = noise only). => f0 does NOT reach klglott in browser.
- So: BROWSER-SPECIFIC failure delivering f0 (and likely all bound params) to klglottSource. tilt
  (k-rate) DID reach (tilt=40 warnings) but f0 (a-rate) did NOT. BUT impulse.f0 is also a-rate and
  works at mode0 -> not a simple a-rate issue. Suspect: klglottSource.f0 binding/scheduling specifically.
- BLOCKER: browser render intermittently returns 0 SAMPLES (probe5/6 = 0 samples = failed render, not
  silence). Need a working render (30848 samples) to re-test. Flaky render harness slows iteration.
- TODO: RESTORE worklet .js (remove all DEBUG edits), backend.ts, source_mode 0. Then: why does
  klglottSource.f0 binding not deliver in browser? Compare bindingMap/scheduling klglott vs impulse;
  check if klglott node's AudioParams resolve (node.parameters.get('f0')) in browser.



