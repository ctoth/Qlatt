// test/harness/warmup.js — Get a frontend ready before the first Speak.
//
// A frontend's first use is expensive: its rule pack, inventory, tables and
// voice files are read with synchronous requests and then compiled, on the
// main thread. Left to the first Speak click, that is where the page freezes.
// This does the same work when the page loads and when the frontend is
// changed:
//
//   1. import the runtime module;
//   2. fetch the F0 filter kernel;
//   3. in idle time, asynchronously acquire the declared frontend resources
//      and selected voices, then run one short utterance through the frontend;
//   4. load the paired experiment's configuration.
//
// Step 3 still blocks the main thread while it compiles; it does so when the
// user has just chosen a frontend, not when they press Speak.

import { preloadF0Filters } from "../../src/f0-filters-loader.ts";
import { createBrowserRuntimeAssetLoader } from "../../src/runtime-assets/browser-loader.ts";
import { takeSynchronousFetches } from "../../src/sync-resource-cache.ts";
import { loadNewRuntimeConfig } from "./experiment.js";
import { state } from "./state.js";
import { idle } from "./warmup-wait.js";

/** The utterance compiled in step 3. Its audio is never played. */
const WARMUP_PHRASE = "a.";

const warmed = new Map();

async function warm(frontendId, loadRuntimeModule) {
  const timings = {};
  let last = performance.now();
  const mark = (stage) => {
    const now = performance.now();
    timings[stage] = Math.round((now - last) * 10) / 10;
    performance.measure(`qlatt:warmup:${stage}`, { start: last, end: now });
    last = now;
  };

  const { warmFrontend } = await loadRuntimeModule();
  mark("runtimeModule");
  await preloadF0Filters(createBrowserRuntimeAssetLoader(state.WORKLET_BASE_PATH));
  mark("f0Filters");

  // An idle moment or a time limit, whichever is first (warmup-wait.js).
  await idle();
  mark("idleWait");
  takeSynchronousFetches();
  await warmFrontend(frontendId, WARMUP_PHRASE);
  mark("compile");
  // Any blocking request left after declared resource acquisition.
  const unprimed = takeSynchronousFetches();

  // The paired experiment's graph, semantics and registry, and the check
  // that it accepts this frontend's columns. A pair that does not load is
  // reported when the user presses Speak, as before.
  let configError = null;
  try {
    await loadNewRuntimeConfig();
  } catch (err) {
    // loadNewRuntimeConfig has put the reason in the status line.
    configError = err instanceof Error ? err.message : String(err);
  }
  mark("experimentConfig");

  const report = {
    frontendId,
    unprimed,
    configError,
    timings,
  };
  state.lastWarmup = report;
  console.log("[QLATT] Frontend warm-up (ms)", report);
  return report;
}

/**
 * Warm a frontend once; later calls for the same frontend return the same
 * promise. `loadRuntimeModule` is the page's lazy import of the runtime.
 */
export function warmFrontendOnce(frontendId, loadRuntimeModule) {
  let pending = warmed.get(frontendId);
  if (!pending) {
    const previous = state.status.textContent;
    state.status.textContent = `Status: preparing ${frontendId}...`;
    pending = warm(frontendId, loadRuntimeModule).then(
      (report) => {
        // A configuration that failed to load keeps its message in the status.
        if (!report.configError) state.status.textContent = `Status: ${frontendId} ready`;
        return report;
      },
      (err) => {
        // A failed warm-up changes nothing: Speak loads the frontend itself.
        warmed.delete(frontendId);
        console.warn("[QLATT] Frontend warm-up failed; Speak will load it:", err);
        if (state.status.textContent === `Status: preparing ${frontendId}...`) {
          state.status.textContent = previous;
        }
        return null;
      },
    );
    warmed.set(frontendId, pending);
  }
  return pending;
}
