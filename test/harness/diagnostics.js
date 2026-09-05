// test/harness/diagnostics.js — Diagnostics formatting and display

import { state } from "./state.js";

export function findEventAtTime(track, time) {
  if (!track || track.length === 0) return null;
  let current = track[0];
  for (const event of track) {
    if (event.time > time) break;
    current = event;
  }
  return current;
}

export function findEventIndexAtTime(track, time) {
  if (!track || track.length === 0) return -1;
  let index = 0;
  for (let i = 0; i < track.length; i += 1) {
    if (track[i].time > time) break;
    index = i;
  }
  return index;
}

export function getRunContext(now = state.ctx.currentTime) {
  if (!state.lastRun || !state.runStartTime) {
    return { relTime: null, event: null, inWindow: false, trackEnd: 0 };
  }
  const relTime = now - state.runStartTime;
  const trackEnd = state.lastRun.track?.length
    ? state.lastRun.track[state.lastRun.track.length - 1].time
    : 0;
  const inWindow = relTime >= -0.1 && relTime <= trackEnd + 0.5;
  const event = inWindow ? findEventAtTime(state.lastRun.track, Math.max(0, relTime)) : null;
  return { relTime, event, inWindow, trackEnd };
}

export function updateDiagnostics() {
  if (!state.lastRun) return;
  // When engine output is active, the engine subscriber writes to diagnosticsEl directly.
  // This function is only needed for the legacy path now.
  if (state.useEngineOutput && state.diagEngine) return;
  // Legacy path: just show basic info since buildDiagnostics is removed
  state.diagnosticsEl.value = `Phrase: ${state.lastRun.phrase}\nBase F0: ${state.lastRun.baseF0}\nEvents: ${state.lastRun.track?.length ?? 0}\n(Enable engine diagnostics for full output)`;
}
