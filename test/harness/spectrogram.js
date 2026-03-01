// test/harness/spectrogram.js — Spectrogram visualization

import { state } from "./state.js";

export function attachSpectrogram() {
  if (!state.specCtx || !state.specCanvas) return;
  state.specState.analyser = state.ctx.createAnalyser();
  state.specState.analyser.fftSize = 1024;
  state.specState.analyser.smoothingTimeConstant = 0;
  // Connection deferred to speakWithNewRuntime() which connects
  // the runtime's output node to specState.analyser on each play.
  clearSpectrogram();
}

export function clearSpectrogram() {
  if (!state.specCtx || !state.specCanvas) return;
  state.specCtx.fillStyle = "#111";
  state.specCtx.fillRect(0, 0, state.specCanvas.width, state.specCanvas.height);
}

export function startSpectrogram(track) {
  if (!state.specState.analyser || !state.specCtx || !state.specCanvas) return;
  const duration =
    track && track.length ? track[track.length - 1].time : 0.5;
  state.specState.running = true;
  const bins = new Uint8Array(state.specState.analyser.frequencyBinCount);
  const draw = () => {
    if (!state.specState.running) return;
    state.specState.analyser.getByteFrequencyData(bins);
    const width = state.specCanvas.width;
    const height = state.specCanvas.height;
    state.specCtx.drawImage(state.specCanvas, -1, 0);
    for (let y = 0; y < height; y += 1) {
      const idx = Math.floor((y / height) * bins.length);
      const v = bins[idx];
      const c = v.toString(16).padStart(2, "0");
      state.specCtx.fillStyle = `#${c}${c}${c}`;
      state.specCtx.fillRect(width - 1, height - 1 - y, 1, 1);
    }
    state.specState.rafId = requestAnimationFrame(draw);
  };
  if (state.specState.rafId) cancelAnimationFrame(state.specState.rafId);
  state.specState.rafId = requestAnimationFrame(draw);
  setTimeout(() => {
    state.specState.running = false;
  }, Math.max(0, duration * 1000 + 200));
}
