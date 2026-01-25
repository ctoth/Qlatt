import { KlattSynth } from "../src/klatt-synth.js";
import { textToKlattTrack } from "../src/tts-frontend.js";

const ctx = new AudioContext();
const synth = new KlattSynth(ctx);
const status = document.getElementById("status");
const controls = document.getElementById("controls");
const diagnosticsEl = document.getElementById("diagnostics");
const telemetry = new Map();
const telemetryMax = new Map();
const meters = new Map();
const meterValues = new Map();
const meterMax = new Map();
const spikeEvents = [];
const lastSpikeAt = new Map();
const specCanvas = document.getElementById("spectrogram");
const specCtx = specCanvas?.getContext("2d");
const specState = {
  analyser: null,
  running: false,
  rafId: 0,
};
let lastRun = null;
let runStartTime = 0;
let sessionId = 0; // Incremented each play for session isolation (P1)
let telemetryTimer = null;
let meterTimer = null;
let lastDiagnostics = "";
const spikeThreshold = 1.0;
const spikeCooldown = 0.2;
const playHistory = []; // P7: Track recent plays for warmup analysis
const MAX_PLAY_HISTORY = 5;

const controlSpec = [
  { id: "f0", label: "F0 (Hz)", min: 50, max: 300, step: 1 },
  { id: "rd", label: "Rd", min: 0.3, max: 2.7, step: 0.01 },
  {
    id: "lfMode",
    label: "LF Mode (0=Legacy, 1=LF_LM, 2=LF_CALM)",
    min: 0,
    max: 2,
    step: 1,
    format: "fixed0",
  },
  { id: "voiceGain", label: "Voice Gain", min: 0, max: 1, step: 0.01 },   
  { id: "noiseGain", label: "Noise Gain", min: 0, max: 0.5, step: 0.01 }, 
  { id: "noiseCutoff", label: "Noise Cutoff", min: 200, max: 6000, step: 10 },
  { id: "fricationCutoff", label: "Frication Cutoff", min: 500, max: 9000, step: 10 },
  { id: "masterGain", label: "Output Boost", min: 0, max: 5, step: 0.05 },
  { id: "parallelMix", label: "Parallel Mix", min: 0, max: 1, step: 0.01 },
  { id: "parallelGainScale", label: "Parallel Gain Scale", min: 0, max: 1, step: 0.01, format: "fixed2" },
  { id: "parallelVoiceGain", label: "Parallel Voice", min: 0, max: 1, step: 0.01 },
  { id: "parallelFricationGain", label: "Parallel Frication", min: 0, max: 1, step: 0.01 },
  { id: "AB", label: "Bypass (AB dB)", min: -70, max: 70, step: 1 },
  { id: "AN", label: "Nasal (AN dB)", min: -70, max: 70, step: 1 },
  { id: "A1", label: "A1 (dB)", min: -70, max: 70, step: 1 },
  { id: "A2", label: "A2 (dB)", min: -70, max: 70, step: 1 },
  { id: "A3", label: "A3 (dB)", min: -70, max: 70, step: 1 },
  { id: "A4", label: "A4 (dB)", min: -70, max: 70, step: 1 },
  { id: "A5", label: "A5 (dB)", min: -70, max: 70, step: 1 },
  { id: "A6", label: "A6 (dB)", min: -70, max: 70, step: 1 },
  { id: "F1", label: "F1 (Hz)", min: 200, max: 1000, step: 1 },
  { id: "F2", label: "F2 (Hz)", min: 500, max: 2500, step: 1 },
  { id: "F3", label: "F3 (Hz)", min: 1500, max: 3500, step: 1 },
  { id: "B1", label: "B1 (Hz)", min: 30, max: 200, step: 1 },
  { id: "B2", label: "B2 (Hz)", min: 40, max: 300, step: 1 },
  { id: "B3", label: "B3 (Hz)", min: 60, max: 400, step: 1 },
  { id: "FNZ", label: "Nasal Zero (FNZ)", min: 100, max: 1000, step: 1 },
  { id: "BNZ", label: "Nasal Zero BW", min: 50, max: 500, step: 1 },
  { id: "FNP", label: "Nasal Pole (FNP)", min: 100, max: 1000, step: 1 },
  { id: "BNP", label: "Nasal Pole BW", min: 50, max: 500, step: 1 },
];

function renderControls() {
  for (const spec of controlSpec) {
    const wrapper = document.createElement("div");
    wrapper.className = "control";
    const label = document.createElement("label");
    label.textContent = spec.label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = spec.min;
    input.max = spec.max;
    input.step = spec.step;
    input.id = spec.id;
    const value = document.createElement("div");
    value.className = "value";
    value.id = `${spec.id}-value`;
    wrapper.append(label, input, value);
    controls.append(wrapper);
  }
}

function formatValue(spec, value) {
  if (spec.format === "fixed4") return Number(value).toFixed(4);
  if (spec.format === "fixed2") return Number(value).toFixed(2);
  if (spec.format === "fixed0") return Number(value).toFixed(0);
  return Number(value).toFixed(2);
}

function bindControls() {
  for (const spec of controlSpec) {
    const input = document.getElementById(spec.id);
    const value = document.getElementById(`${spec.id}-value`);
    const initial = synth.params[spec.id];
    input.value = initial;
    value.textContent = formatValue(spec, initial);
    input.addEventListener("input", () => {
      const v = Number(input.value);
      value.textContent = formatValue(spec, v);
      synth.setParam(spec.id, v);
    });
  }
}

async function start() {
  await synth.initialize();
  await ctx.resume();
  status.textContent = "Status: running";
}

async function stop() {
  await ctx.suspend();
  status.textContent = "Status: suspended";
}

async function speak() {
  await synth.initialize();
  await ctx.resume();
  const phrase = document.getElementById("phrase").value.trim();
  const baseF0 = Number(document.getElementById("baseF0").value) || 110;
  if (!phrase) return;
  const track = textToKlattTrack(phrase, baseF0);
  const startTime = ctx.currentTime + 0.05;
  // P1: Session isolation - increment sessionId to detect stale telemetry
  sessionId += 1;
  const currentSessionId = sessionId;
  // Clear PLSTEP events BEFORE scheduleTrack (which emits them synchronously)
  plstepEvents.length = 0;
  spikeEvents.length = 0;
  lastSpikeAt.clear();
  swWindowMax.clear();
  swWindowMaxTime.clear();
  // Set run context BEFORE scheduleTrack so telemetry handler can use it
  lastRun = { phrase, baseF0, track, sessionId: currentSessionId, startTime };
  runStartTime = startTime;
  synth.scheduleTrack(track, startTime);
  status.textContent = `Status: speaking "${phrase}"`;
  telemetry.clear();
  telemetryMax.clear();
  meterMax.clear();
  updateDiagnostics();
  console.log("[QLATT] Track summary", summarizeTrack(track));
  const parallelSummary = summarizeParallel(track);
  console.log("[QLATT] Parallel summary", parallelSummary);
  if (parallelSummary.parallelEvents > 0 && parallelSummary.swOn === 0) {
    console.warn(
      "[QLATT] Parallel params present, but SW=0 (cascade-only path)."
    );
  }
  console.log("[QLATT] First events", track.slice(0, 6));
  startSpectrogram(track);
  // Auto-copy diagnostics to clipboard after audio finishes
  const trackDuration = track.length ? track[track.length - 1].time : 0;
  setTimeout(() => {
    updateDiagnostics();
    navigator.clipboard.writeText(diagnosticsEl.value).catch(() => {});
    // P7: Record play history for warmup tracking
    const outputMax = meterMax.get("output-sum");
    if (outputMax) {
      playHistory.push({
        sessionId: currentSessionId,
        phrase,
        maxRms: outputMax.rms ?? 0,
        maxPeak: outputMax.peak ?? 0,
        timestamp: Date.now(),
      });
      // Keep only last N plays
      while (playHistory.length > MAX_PLAY_HISTORY) {
        playHistory.shift();
      }
    }
  }, Math.max(0, trackDuration * 1000 + 300));
}

renderControls();
(async () => {
  synth.setTelemetryHandler(handleTelemetry);
  await synth.initialize();
  attachMeters();
  attachSpectrogram();
  bindControls();
})();

document.getElementById("startBtn").addEventListener("click", start);
document.getElementById("stopBtn").addEventListener("click", stop);
document.getElementById("speakBtn").addEventListener("click", speak);
document.getElementById("copyDiagBtn").addEventListener("click", async () => {
  if (!lastRun) return;
  updateDiagnostics();
  await navigator.clipboard.writeText(lastDiagnostics);
});
document.getElementById("clearSpecBtn").addEventListener("click", () => {
  clearSpectrogram();
});
document.getElementById("clearDiagBtn").addEventListener("click", () => {
  diagnosticsEl.value = "";
  lastDiagnostics = "";
  lastRun = null;
  runStartTime = 0;
  spikeEvents.length = 0;
  plstepEvents.length = 0;
  lastSpikeAt.clear();
  telemetry.clear();
  telemetryMax.clear();
  meterValues.clear();
  meterMax.clear();
  swWindowMax.clear();
  swWindowMaxTime.clear();
  playHistory.length = 0; // P7: Clear play history
});

function summarizeTrack(track) {
  const totalTime = track.length ? track[track.length - 1].time : 0;
  const voiced = track.filter((e) => (e.params?.AV ?? 0) > 0 || (e.params?.AVS ?? 0) > 0);
  const f0Values = track.map((e) => e.params?.F0 ?? 0).filter((v) => v > 0);
  const f0Min = f0Values.length ? Math.min(...f0Values) : 0;
  const f0Max = f0Values.length ? Math.max(...f0Values) : 0;
  return {
    events: track.length,
    totalTime,
    voicedEvents: voiced.length,
    f0Min,
    f0Max,
  };
}

function attachSpectrogram() {
  if (!specCtx || !specCanvas) return;
  specState.analyser = ctx.createAnalyser();
  specState.analyser.fftSize = 1024;
  specState.analyser.smoothingTimeConstant = 0;
  synth.nodes.masterGain.connect(specState.analyser);
  clearSpectrogram();
}

function clearSpectrogram() {
  if (!specCtx || !specCanvas) return;
  specCtx.fillStyle = "#111";
  specCtx.fillRect(0, 0, specCanvas.width, specCanvas.height);
}

function startSpectrogram(track) {
  if (!specState.analyser || !specCtx || !specCanvas) return;
  const duration =
    track && track.length ? track[track.length - 1].time : 0.5;
  specState.running = true;
  const bins = new Uint8Array(specState.analyser.frequencyBinCount);
  const draw = () => {
    if (!specState.running) return;
    specState.analyser.getByteFrequencyData(bins);
    const width = specCanvas.width;
    const height = specCanvas.height;
    specCtx.drawImage(specCanvas, -1, 0);
    for (let y = 0; y < height; y += 1) {
      const idx = Math.floor((y / height) * bins.length);
      const v = bins[idx];
      const c = v.toString(16).padStart(2, "0");
      specCtx.fillStyle = `#${c}${c}${c}`;
      specCtx.fillRect(width - 1, height - 1 - y, 1, 1);
    }
    specState.rafId = requestAnimationFrame(draw);
  };
  if (specState.rafId) cancelAnimationFrame(specState.rafId);
  specState.rafId = requestAnimationFrame(draw);
  setTimeout(() => {
    specState.running = false;
  }, Math.max(0, duration * 1000 + 200));
}

function summarizeParallel(track) {
  let swOn = 0;
  let swOff = 0;
  let parallelEvents = 0;
  let swOnSeconds = 0;
  let swTotalSeconds = 0;
  for (const event of track) {
    const params = event.params;
    if (!params) continue;
    if (params.SW === 1) swOn += 1;
    else if (Number.isFinite(params.SW)) swOff += 1;
    const hasParallel =
      (params.AN ?? 0) > 0 ||
      (params.AB ?? 0) > 0 ||
      [params.A1, params.A2, params.A3, params.A4, params.A5, params.A6].some(
        (v) => (v ?? 0) > 0
      ) ||
      (params.AVS ?? 0) > 0 ||
      (params.AF ?? 0) > 0;
    if (hasParallel) parallelEvents += 1;
  }
  for (let i = 0; i < track.length - 1; i += 1) {
    const params = track[i]?.params;
    const duration = track[i + 1].time - track[i].time;
    if (!Number.isFinite(duration) || duration <= 0) continue;
    if (params && Number.isFinite(params.SW)) {
      swTotalSeconds += duration;
      if (params.SW === 1) swOnSeconds += duration;
    }
  }
  const swOnShare =
    swTotalSeconds > 0 ? (swOnSeconds / swTotalSeconds) * 100 : 0;
  return { swOn, swOff, parallelEvents, swOnSeconds, swOnShare };
}

function dbToLinear(db) {
  if (!Number.isFinite(db) || db <= -72) return 0;
  const clamped = Math.min(96, db);
  return 2 ** (clamped / 6);
}

function updateRange(range, value) {
  if (!Number.isFinite(value)) return range;
  if (!range) return { min: value, max: value };
  range.min = Math.min(range.min, value);
  range.max = Math.max(range.max, value);
  return range;
}

function analyzeTrackGains(track, synthParams) {
  if (!track || track.length === 0) return null;
  const ranges = {
    voiceGain: null,
    aspGain: null,
    fricGain: null,
    parallelVoiceGain: null,
    parallelBypassGain: null,
    parallelFormantGain: null,
    parallelNasalGain: null,
    masterGain: null,
    mix: null,
  };
  const ndbScale = {
    A1: -58,
    A2: -65,
    A3: -73,
    A4: -78,
    A5: -79,
    A6: -80,
    AN: -58,
    AB: -84,
    AV: -72,
    // AH changed from -102 to -72 to match AV/AF (see klatt-synth.js)
    AH: -72,
    AF: -72,
    AVS: -44,
  };
  const outputScale = dbToLinear(ndbScale.AF + 44);
  const ndbCor = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  const proximity = (delta) => {
    if (!Number.isFinite(delta) || delta < 50 || delta >= 550) return 0;
    const index = Math.floor(delta / 50) - 1;
    return ndbCor[Math.max(0, Math.min(index, ndbCor.length - 1))] ?? 0;
  };
  const parallelScale = Number.isFinite(synthParams.parallelGainScale)
    ? synthParams.parallelGainScale
    : 1.0;
  const baseBoost = Number.isFinite(synthParams.masterGain)
    ? synthParams.masterGain
    : 1.0;
  const state = { ...(track[0]?.params ?? {}) };
  for (let i = 0; i < track.length; i += 1) {
    const event = track[i];
    if (event?.params) {
      Object.assign(state, event.params);
    }
    const f1 = state.F1 ?? synthParams.F1;
    const f2 = state.F2 ?? synthParams.F2;
    const f3 = state.F3 ?? synthParams.F3;
    const f4 = state.F4 ?? synthParams.F4;
    const f5 = state.F5 ?? synthParams.F5;
    const f6 = state.F6 ?? synthParams.F6;
    const delF1 = Number.isFinite(f1) && f1 > 0 ? f1 / 500 : 1;
    const delF2 = Number.isFinite(f2) && f2 > 0 ? f2 / 1500 : 1;
    let a2Cor = delF1 * delF1;
    const a2Skrt = delF2 * delF2;
    const a3Cor = a2Cor * a2Skrt;
    a2Cor = delF2 !== 0 ? a2Cor / delF2 : a2Cor;
    const n12Cor = proximity(f2 - f1);
    const n23Cor = proximity(f3 - f2 - 50);
    const n34Cor = proximity(f4 - f3 - 150);

    const voiceDb = state.AV ?? -70;
    const voiceParDb = state.AVS ?? -70;
    const aspDb = state.AH ?? -70;
    const fricDb = state.AF ?? -70;
    const goDb = state.GO ?? 47;
    const mix = state.SW === 1 ? 1 : synthParams.parallelMix;
    const fricDbAdjusted = state.SW === 1 ? Math.max(fricDb, aspDb) : fricDb;

    const voiceGain = dbToLinear(voiceDb + ndbScale.AV);
    const aspGain = dbToLinear(aspDb + ndbScale.AH);
    const fricGain =
      dbToLinear(fricDbAdjusted + ndbScale.AF) * parallelScale;
    const voiceParGain =
      dbToLinear(voiceParDb + ndbScale.AVS) * 10 * parallelScale;
    const bypassGain =
      dbToLinear((state.AB ?? -70) + ndbScale.AB) * parallelScale;
    const nasalGain =
      dbToLinear((state.AN ?? -70) + ndbScale.AN) * parallelScale;
    const masterGain = Math.min(
      5.0,
      dbToLinear(goDb) * baseBoost * outputScale
    );

    const parallelLinear = [
      dbToLinear((state.A1 ?? -70) + n12Cor + ndbScale.A1),
      dbToLinear((state.A2 ?? -70) + n12Cor + n12Cor + n23Cor + ndbScale.A2) *
        a2Cor,
      dbToLinear((state.A3 ?? -70) + n23Cor + n23Cor + n34Cor + ndbScale.A3) *
        a3Cor,
      dbToLinear((state.A4 ?? -70) + n34Cor + n34Cor + ndbScale.A4) * a3Cor,
      dbToLinear((state.A5 ?? -70) + ndbScale.A5) * a3Cor,
      dbToLinear((state.A6 ?? -70) + ndbScale.A6) * a3Cor,
    ];
    const formantFreqs = [f1, f2, f3, f4, f5, f6];
    for (let idx = 0; idx < parallelLinear.length; idx += 1) {
      let value = parallelLinear[idx] * parallelScale;
      if (idx >= 1) {
        const freq = formantFreqs[idx];
        if (Number.isFinite(freq) && freq > 0) {
          const w = (2 * Math.PI * freq) / ctx.sampleRate;
          const diffGain = Math.sqrt(2 - 2 * Math.cos(w));
          if (diffGain > 0) {
            value /= diffGain;
          }
        }
      }
      ranges.parallelFormantGain = updateRange(
        ranges.parallelFormantGain,
        Math.abs(value)
      );
    }

    ranges.voiceGain = updateRange(ranges.voiceGain, voiceGain);
    ranges.aspGain = updateRange(ranges.aspGain, aspGain);
    ranges.fricGain = updateRange(ranges.fricGain, fricGain);
    ranges.parallelVoiceGain = updateRange(
      ranges.parallelVoiceGain,
      voiceParGain
    );
    ranges.parallelBypassGain = updateRange(
      ranges.parallelBypassGain,
      bypassGain
    );
    ranges.parallelNasalGain = updateRange(
      ranges.parallelNasalGain,
      nasalGain
    );
    ranges.masterGain = updateRange(ranges.masterGain, masterGain);
    ranges.mix = updateRange(ranges.mix, mix);
  }

  const warnings = [];
  if (
    Number.isFinite(parallelScale) &&
    parallelScale > 0 &&
    parallelScale < 0.05
  ) {
    warnings.push(
      `parallelGainScale=${parallelScale.toFixed(3)} is very low; parallel branch likely inaudible`
    );
  }
  if (
    ranges.mix?.max > 0 &&
    (ranges.parallelVoiceGain?.max ?? 0) < 1e-3 &&
    (ranges.fricGain?.max ?? 0) < 1e-3
  ) {
    warnings.push(
      "Parallel gains peak below 1e-3; expect muted consonants when SW=1"
    );
  }
  return { ranges, warnings, parallelScale };
}

function collectParamRange(track, key, fallback) {
  let min = Infinity;
  let max = -Infinity;
  let current = fallback;
  for (const event of track) {
    if (Number.isFinite(event?.params?.[key])) {
      current = event.params[key];
    }
    if (Number.isFinite(current)) {
      min = Math.min(min, current);
      max = Math.max(max, current);
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

function summarizeLfMode(track, fallbackMode = 0) {
  const counts = { 0: 0, 1: 0, 2: 0 };
  const seconds = { 0: 0, 1: 0, 2: 0 };
  let current = Number.isFinite(fallbackMode)
    ? Math.round(fallbackMode)
    : 0;
  for (let i = 0; i < track.length; i += 1) {
    const event = track[i];
    if (Number.isFinite(event?.params?.lfMode)) {
      current = Math.round(event.params.lfMode);
    }
    counts[current] = (counts[current] || 0) + 1;
    const duration =
      i < track.length - 1 ? track[i + 1].time - event.time : 0;
    if (Number.isFinite(duration) && duration > 0) {
      seconds[current] = (seconds[current] || 0) + duration;
    }
  }
  return { counts, seconds };
}

function findVoicingIssues(track, fallback) {
  const issues = [];
  const state = {
    F0: fallback?.F0 ?? 0,
    AV: fallback?.AV ?? 0,
    AVS: fallback?.AVS ?? 0,
    AF: fallback?.AF ?? 0,
    AH: fallback?.AH ?? 0,
    SW: fallback?.SW ?? 0,
  };
  for (let i = 0; i < track.length; i += 1) {
    const event = track[i];
    if (event?.params) {
      for (const key of Object.keys(state)) {
        if (Number.isFinite(event.params[key])) {
          state[key] = event.params[key];
        }
      }
    }
    const voiced = (state.AV ?? 0) > 0 || (state.AVS ?? 0) > 0;
    const noise = (state.AF ?? 0) > 0 || (state.AH ?? 0) > 0;
    const f0 = state.F0 ?? 0;
    if (voiced && (!Number.isFinite(f0) || f0 <= 0)) {
      issues.push(
        `t=${event.time.toFixed(3)} ${event.phoneme ?? ""} voiced but F0=0`
      );
    } else if (f0 > 0 && !voiced && !noise) {
      issues.push(
        `t=${event.time.toFixed(3)} ${event.phoneme ?? ""} F0>0 but no AV/AVS/AF/AH`
      );
    }
    if (issues.length >= 6) break;
  }
  return issues;
}

function findEventAtTime(track, time) {
  if (!track || track.length === 0) return null;
  let current = track[0];
  for (const event of track) {
    if (event.time > time) break;
    current = event;
  }
  return current;
}

function findEventIndexAtTime(track, time) {
  if (!track || track.length === 0) return -1;
  let index = 0;
  for (let i = 0; i < track.length; i += 1) {
    if (track[i].time > time) break;
    index = i;
  }
  return index;
}

function getRunContext(now = ctx.currentTime) {
  if (!lastRun || !runStartTime) {
    return { relTime: null, event: null, inWindow: false, trackEnd: 0 };
  }
  const relTime = now - runStartTime;
  const trackEnd = lastRun.track?.length
    ? lastRun.track[lastRun.track.length - 1].time
    : 0;
  const inWindow = relTime >= -0.1 && relTime <= trackEnd + 0.5;
  const event = inWindow
    ? findEventAtTime(lastRun.track, Math.max(0, relTime))
    : null;
  return { relTime, event, inWindow, trackEnd };
}

function formatSpikePeak(value) {
  if (!Number.isFinite(value)) return "NaN";
  if (Math.abs(value) >= 10) return Number(value).toExponential(2);
  return Number(value).toFixed(3);
}

function formatSpikes(list) {
  if (!list || list.length === 0) return ["(none)"];
  return list.map(
    (spike, index) =>
      `${index}. t=${spike.time.toFixed(3)}s node=${spike.node} peak=${formatSpikePeak(
        spike.peak
      )} phoneme=${spike.phoneme || ""}`
  );
}

function formatPlstepEvents(list, trackDuration = 0) {
  if (!list || list.length === 0) return ["(none)"];
  return list.map(
    (evt, index) => {
      // P1: Use relative time (scheduled time - start time), not absolute ctx.currentTime
      const relTime = Number.isFinite(evt.scheduledRelTime) ? evt.scheduledRelTime : evt.relTime;
      const time = Number.isFinite(relTime) ? relTime.toFixed(3) : "n/a";
      const amp = Number.isFinite(evt.amplitudeLinear) ? evt.amplitudeLinear.toFixed(2) : "n/a";
      const db = Number.isFinite(evt.amplitudeDb) ? evt.amplitudeDb.toFixed(0) : "n/a";
      const trigger = evt.trigger || "?";
      const delta = Number.isFinite(evt.delta) ? evt.delta.toFixed(0) : "n/a";
      // P9: Timing integrity flag - warn if time exceeds track duration
      let warning = "";
      if (Number.isFinite(relTime) && trackDuration > 0 && relTime > trackDuration + 0.1) {
        warning = " ⚠STALE";
      }
      return `plstep: burst @${time}s amp=${amp} (${db}dB) trigger=${trigger} Δ=${delta}${warning}`;
    }
  );
}

function formatLevel(value) {
  if (!Number.isFinite(value)) return "n/a";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs < 1e-6) return value.toExponential(2);
  return value.toFixed(6);
}

// P2: Gain derivation - show how Klatt parameters become linear gains
function formatGainDerivation(track, synthParams) {
  if (!track || track.length === 0) return [];
  // Find focus event: first SW=1 event (parallel mode), or first voiced event
  let focusEvent = null;
  let focusIndex = -1;
  for (let i = 0; i < track.length; i += 1) {
    const event = track[i];
    if (event?.params?.SW === 1) {
      focusEvent = event;
      focusIndex = i;
      break;
    }
  }
  if (!focusEvent) {
    // Fallback: first event with AV or AVS > 0
    for (let i = 0; i < track.length; i += 1) {
      const event = track[i];
      if ((event?.params?.AV ?? 0) > 0 || (event?.params?.AVS ?? 0) > 0) {
        focusEvent = event;
        focusIndex = i;
        break;
      }
    }
  }
  if (!focusEvent) return [];

  const p = focusEvent.params;
  const ndbScale = {
    AV: -72, AVS: -44, AH: -87, AF: -72,
    A1: -58, A2: -65, A3: -73, A4: -78, A5: -79, A6: -80,
    AN: -58, AB: -84,
  };

  const dbToLinear = (db) => {
    if (!Number.isFinite(db) || db <= -72) return 0;
    return 2 ** (Math.min(96, db) / 6);
  };

  const lines = [];
  const phoneme = focusEvent.phoneme || `event ${focusIndex}`;
  const time = focusEvent.time?.toFixed(3) ?? "?";
  const sw = p.SW ?? 0;
  lines.push(`Focus: ${phoneme} @${time}s (SW=${sw})`);

  // Voice gain: AV + ndb(AV) -> linear
  const av = p.AV ?? -70;
  const voiceCalc = av + ndbScale.AV;
  const voiceGain = dbToLinear(voiceCalc);
  lines.push(`  voiceGain: AV=${av.toFixed(0)} + ndb(-72) = ${voiceCalc.toFixed(0)}dB → ${voiceGain.toFixed(4)}`);

  // Aspiration gain: AH + ndb(AH) -> linear
  const ah = p.AH ?? -70;
  const aspCalc = ah + ndbScale.AH;
  const aspGain = dbToLinear(aspCalc);
  lines.push(`  aspGain:   AH=${ah.toFixed(0)} + ndb(-87) = ${aspCalc.toFixed(0)}dB → ${aspGain.toFixed(4)}`);

  // Frication gain: max(AF,AH) + ndb(AF) -> linear (when SW=1)
  const af = p.AF ?? -70;
  const fricSrc = sw === 1 ? Math.max(af, ah) : af;
  const fricCalc = fricSrc + ndbScale.AF;
  const fricGain = dbToLinear(fricCalc);
  if (sw === 1) {
    lines.push(`  fricGain:  max(AF=${af.toFixed(0)},AH=${ah.toFixed(0)}) + ndb(-72) = ${fricCalc.toFixed(0)}dB → ${fricGain.toFixed(4)}`);
  } else {
    lines.push(`  fricGain:  AF=${af.toFixed(0)} + ndb(-72) = ${fricCalc.toFixed(0)}dB → ${fricGain.toFixed(4)}`);
  }

  // Parallel source gain: SW=1 → 1.0, otherwise 0
  const parallelSrcGain = sw === 1 ? 1.0 : 0;
  lines.push(`  parallelSrcGain: SW=${sw} → ${parallelSrcGain.toFixed(3)}`);

  // AVS (parallel voice) gain: AVS + ndb(AVS) -> linear * 10
  const avs = p.AVS ?? -70;
  const avsCalc = avs + ndbScale.AVS;
  const avsGain = dbToLinear(avsCalc) * 10;
  lines.push(`  avsGain:   AVS=${avs.toFixed(0)} + ndb(-44) = ${avsCalc.toFixed(0)}dB → ${avsGain.toFixed(4)} (*10)`);

  // If SW=1, show parallel formant gains
  if (sw === 1) {
    const parallelScale = synthParams.parallelGainScale ?? 1.0;
    for (let i = 1; i <= 6; i += 1) {
      const aKey = `A${i}`;
      const aVal = p[aKey] ?? -70;
      const aCalc = aVal + ndbScale[aKey];
      const aGain = dbToLinear(aCalc) * parallelScale;
      if (aVal > -70) {
        lines.push(`  A${i}Gain:   A${i}=${aVal.toFixed(0)} + ndb(${ndbScale[aKey]}) = ${aCalc.toFixed(0)}dB → ${aGain.toFixed(4)}`);
      }
    }
  }

  return lines;
}

// P7: Play history for warmup tracking
function formatPlayHistory() {
  if (playHistory.length === 0) return ["(none)"];
  return playHistory.map((entry, index) => {
    const marker = index === playHistory.length - 1 ? " ← current" : "";
    const warmup = index === 0 && playHistory.length > 1 ? " (cold start)" : "";
    return `  Play ${index + 1}: ${formatLevel(entry.maxRms)}${warmup}${marker}`;
  });
}

// P4: Formant automation check with expected vs observed warnings
function formatFormantCheck(nodeName, observedRange, trackRange, label) {
  const lines = [];
  const obsMin = Number.isFinite(observedRange?.freqMin) ? observedRange.freqMin.toFixed(1) : "n/a";
  const obsMax = Number.isFinite(observedRange?.freqMax) ? observedRange.freqMax.toFixed(1) : "n/a";
  const expMin = Number.isFinite(trackRange?.min) ? trackRange.min.toFixed(1) : "n/a";
  const expMax = Number.isFinite(trackRange?.max) ? trackRange.max.toFixed(1) : "n/a";

  let status = "✓";
  const warnings = [];

  // Check for mismatches
  if (Number.isFinite(observedRange?.freqMin) && Number.isFinite(trackRange?.min)) {
    const tolerance = 50; // Hz tolerance
    if (observedRange.freqMin > trackRange.min + tolerance) {
      warnings.push(`low end higher than expected`);
    }
    if (observedRange.freqMin < trackRange.min - tolerance) {
      warnings.push(`low end lower than expected`);
    }
  }
  if (Number.isFinite(observedRange?.freqMax) && Number.isFinite(trackRange?.max)) {
    const tolerance = 50;
    if (observedRange.freqMax > trackRange.max + tolerance) {
      warnings.push(`high end higher than expected`);
    }
    if (observedRange.freqMax < trackRange.max - tolerance) {
      warnings.push(`high end lower than expected`);
    }
  }
  if (!Number.isFinite(observedRange?.freqMin) && Number.isFinite(trackRange?.min)) {
    warnings.push(`no telemetry received`);
  }

  if (warnings.length > 0) {
    status = "⚠";
  }

  const warningStr = warnings.length > 0 ? ` (${warnings.join(", ")})` : "";
  lines.push(`${nodeName}: expected ${label} ${expMin}-${expMax} Hz, observed ${obsMin}-${obsMax} Hz ${status}${warningStr}`);
  return lines;
}

// P6: Filter bypass indicator
function formatBypassCheck(nodeName, range, defaultFreq, defaultBw) {
  const freqMin = Number.isFinite(range?.freqMin) ? range.freqMin : null;
  const freqMax = Number.isFinite(range?.freqMax) ? range.freqMax : null;
  const bwMin = Number.isFinite(range?.bwMin) ? range.bwMin : null;
  const bwMax = Number.isFinite(range?.bwMax) ? range.bwMax : null;

  // Detect bypass: bw=0 or very low frequency suggests bypass mode
  const isBypass = (bwMin !== null && bwMin <= 0) || (freqMin !== null && freqMin <= 0);
  const status = isBypass ? "[BYPASS]" : "[ACTIVE]";

  const freqStr = freqMin !== null && freqMax !== null
    ? `f=[${freqMin.toFixed(0)}-${freqMax.toFixed(0)}]`
    : `f=default(${defaultFreq})`;
  const bwStr = bwMin !== null && bwMax !== null
    ? `bw=[${bwMin.toFixed(0)}-${bwMax.toFixed(0)}]`
    : `bw=default(${defaultBw})`;

  return `${nodeName}: ${freqStr} ${bwStr} ${status}`;
}

// P5: Enhanced event display with A1-A6 for SW=1 events
function formatEventLine(index, event) {
  const e = event;
  const sw = Number.isFinite(e.params?.SW) ? e.params.SW.toFixed(0) : "n/a";
  let line = `${index}. t=${e.time.toFixed(3)} ${e.phoneme ?? ""} F0=${(e.params?.F0 ?? 0).toFixed(1)} AV=${(e.params?.AV ?? 0).toFixed(0)} AVS=${(e.params?.AVS ?? 0).toFixed(0)} AH=${(e.params?.AH ?? 0).toFixed(0)} AF=${(e.params?.AF ?? 0).toFixed(0)} SW=${sw}`;

  // P5: Show A1-A6 values when SW=1 (parallel mode)
  if (e.params?.SW === 1) {
    const a1 = e.params?.A1 ?? -70;
    const a2 = e.params?.A2 ?? -70;
    const a3 = e.params?.A3 ?? -70;
    const a4 = e.params?.A4 ?? -70;
    const a5 = e.params?.A5 ?? -70;
    const a6 = e.params?.A6 ?? -70;
    const ab = e.params?.AB ?? -70;
    // Only show non-default values (> -70) to keep output readable
    const aVals = [];
    if (a1 > -70) aVals.push(`A1=${a1.toFixed(0)}`);
    if (a2 > -70) aVals.push(`A2=${a2.toFixed(0)}`);
    if (a3 > -70) aVals.push(`A3=${a3.toFixed(0)}`);
    if (a4 > -70) aVals.push(`A4=${a4.toFixed(0)}`);
    if (a5 > -70) aVals.push(`A5=${a5.toFixed(0)}`);
    if (a6 > -70) aVals.push(`A6=${a6.toFixed(0)}`);
    if (ab > -70) aVals.push(`AB=${ab.toFixed(0)}`);
    if (aVals.length > 0) {
      line += ` | ${aVals.join(" ")}`;
    }
  }
  return line;
}

// P3: Signal flow snapshot at peak moment
function formatSignalFlow() {
  const lines = [];
  const fmt = (v) => Number.isFinite(v) ? v.toFixed(4) : "n/a";
  const fmtCtx = (max) => {
    if (!max) return "";
    const time = Number.isFinite(max.rmsTime) ? `@${max.rmsTime.toFixed(3)}s` : "";
    const phoneme = max.rmsPhoneme ? ` ${max.rmsPhoneme}` : "";
    return `${time}${phoneme}`;
  };

  // Source nodes
  const lfSource = telemetryMax.get("lf-source");
  const noise = telemetryMax.get("noise");
  const frication = telemetryMax.get("frication");
  const rgp = telemetryMax.get("rgp");

  lines.push("Sources (max rms):");
  lines.push(`  lf-source: ${fmt(lfSource?.rms)} ${fmtCtx(lfSource)}`);
  lines.push(`  noise:     ${fmt(noise?.rms)} ${fmtCtx(noise)}`);
  lines.push(`  frication: ${fmt(frication?.rms)} ${fmtCtx(frication)}`);
  lines.push(`  rgp:       ${fmt(rgp?.rms)} ${fmtCtx(rgp)}`);

  // Cascade chain
  lines.push("Cascade chain (max rms):");
  for (let i = 6; i >= 1; i--) {
    const cascade = telemetryMax.get(`cascade-${i}`);
    lines.push(`  cascade-${i}: ${fmt(cascade?.rms)} ${fmtCtx(cascade)}`);
  }
  const nz = telemetryMax.get("nz");
  const np = telemetryMax.get("np");
  lines.push(`  nz: ${fmt(nz?.rms)}`);
  lines.push(`  np: ${fmt(np?.rms)}`);

  // Parallel branch
  lines.push("Parallel branch (max rms):");
  for (let i = 1; i <= 6; i++) {
    const pf = telemetryMax.get(`parallel-formant-${i}`);
    if (pf?.rms > 0) {
      lines.push(`  parallel-formant-${i}: ${fmt(pf?.rms)}`);
    }
  }
  const parallelNasal = telemetryMax.get("parallel-nasal");
  if (parallelNasal?.rms > 0) {
    lines.push(`  parallel-nasal: ${fmt(parallelNasal?.rms)}`);
  }

  // Output stage
  lines.push("Output stage (max rms):");
  const cascadeOut = meterMax.get("cascade-out");
  const parallelOut = meterMax.get("parallel-out");
  const outputSum = meterMax.get("output-sum");
  lines.push(`  cascade-out:  ${fmt(cascadeOut?.rms)} ${fmtCtx(cascadeOut)}`);
  lines.push(`  parallel-out: ${fmt(parallelOut?.rms)} ${fmtCtx(parallelOut)}`);
  lines.push(`  output-sum:   ${fmt(outputSum?.rms)} ${fmtCtx(outputSum)}`);

  return lines;
}

function formatRange(range, digits = 1) {
  if (!range) return "n/a";
  return `${range.min.toFixed(digits)} - ${range.max.toFixed(digits)}`;
}

function formatMaxContext(time, phoneme) {
  if (!Number.isFinite(time)) return "";
  const label = phoneme ? ` ${phoneme}` : "";
  return ` @${time.toFixed(3)}s${label}`;
}

function formatTelemetry(map) {
  if (!map || map.size === 0) return ["(no telemetry yet)"];
  const entries = Array.from(map.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return entries.map(
    ([node, data]) => {
      const suffixParts = [];
      if (
        Number.isFinite(data.f0) ||
        Number.isFinite(data.rd) ||
        Number.isFinite(data.lfMode)
      ) {
        const f0 = Number.isFinite(data.f0) ? data.f0.toFixed(2) : "n/a";
        const rd = Number.isFinite(data.rd) ? data.rd.toFixed(2) : "n/a";
        const lfMode = Number.isFinite(data.lfMode)
          ? Math.round(data.lfMode)
          : "n/a";
        suffixParts.push(`f0=${f0} rd=${rd} lf=${lfMode}`);
      }
      if (
        Number.isFinite(data.freq) ||
        Number.isFinite(data.bw) ||
        Number.isFinite(data.gain)
      ) {
        const freq = Number.isFinite(data.freq)
          ? data.freq.toFixed(1)
          : "n/a";
        const bw = Number.isFinite(data.bw) ? data.bw.toFixed(1) : "n/a";
        const gain = Number.isFinite(data.gain)
          ? data.gain.toFixed(2)
          : "n/a";
        suffixParts.push(`f=${freq} bw=${bw} g=${gain}`);
      }
      if (Number.isFinite(data.inRms) || Number.isFinite(data.inPeak)) {
        const inRms = formatLevel(data.inRms);
        const inPeak = formatLevel(data.inPeak);
        suffixParts.push(`in=${inRms}/${inPeak}`);
      }
      if (
        Number.isFinite(data.gainAvg) ||
        Number.isFinite(data.gainPeak) ||
        Number.isFinite(data.cutoff)
      ) {
        const gainAvg = Number.isFinite(data.gainAvg)
          ? data.gainAvg.toFixed(3)
          : "n/a";
        const gainPeak = Number.isFinite(data.gainPeak)
          ? data.gainPeak.toFixed(3)
          : "n/a";
        const cutoff = Number.isFinite(data.cutoff)
          ? data.cutoff.toFixed(0)
          : "n/a";
        suffixParts.push(`gain=${gainAvg}/${gainPeak} cf=${cutoff}`);
      }
      const suffix = suffixParts.length ? ` ${suffixParts.join(" ")}` : "";
      const max = telemetryMax.get(node);
      let maxSuffix = "";
      if (max) {
        const maxRms = formatLevel(max.rms);
        const maxPeak = formatLevel(max.peak);
        const rmsContext = formatMaxContext(
          max.rmsTime,
          max.rmsPhoneme
        );
        const peakContext = formatMaxContext(
          max.peakTime,
          max.peakPhoneme
        );
        maxSuffix = ` | max rms=${maxRms}${rmsContext} peak=${maxPeak}${peakContext}`;
        if (
          Number.isFinite(max.freqMin) &&
          Number.isFinite(max.freqMax)
        ) {
          maxSuffix += ` f=[${max.freqMin.toFixed(1)}-${max.freqMax.toFixed(1)}]`;
        }
        if (
          Number.isFinite(max.bwMin) &&
          Number.isFinite(max.bwMax)
        ) {
          maxSuffix += ` bw=[${max.bwMin.toFixed(1)}-${max.bwMax.toFixed(1)}]`;
        }
      }
      return `${node}: rms=${formatLevel(data.rms)} peak=${formatLevel(data.peak)}${suffix}${maxSuffix}`;
    }
  );
}

function formatMeters(map) {
  if (!map || map.size === 0) return ["(no meters yet)"];
  const entries = Array.from(map.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return entries.map(
    ([node, data]) => {
      const max = meterMax.get(node);
      let suffix = "";
      if (max) {
        const rmsContext = formatMaxContext(
          max.rmsTime,
          max.rmsPhoneme
        );
        const peakContext = formatMaxContext(
          max.peakTime,
          max.peakPhoneme
        );
        suffix = ` | max rms=${formatLevel(max.rms)}${rmsContext} peak=${formatLevel(
          max.peak
        )}${peakContext}`;
      }
      return `${node}: rms=${formatLevel(data.rms)} peak=${formatLevel(
        data.peak
      )}${suffix}`;
    }
  );
}

function formatSwWindowMeters() {
  if (!swWindowMax || swWindowMax.size === 0) return ["(no SW-window maxima)"];
  const entries = Array.from(swWindowMax.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return entries.map(([key, data]) => {
    const rmsCtx = data.rmsTime != null ? `@${data.rmsTime.toFixed(3)}s ${data.rmsPhoneme ?? ""}` : "";
    const peakCtx = data.peakTime != null ? `@${data.peakTime.toFixed(3)}s ${data.peakPhoneme ?? ""}` : "";
    return `${key}: rms=${formatLevel(data.rms)} ${rmsCtx} | peak=${formatLevel(data.peak)} ${peakCtx}`;
  });
}

function updateDiagnostics() {
  if (!lastRun) return;
  lastDiagnostics = buildDiagnostics({
    phrase: lastRun.phrase,
    baseF0: lastRun.baseF0,
    track: lastRun.track,
    telemetry,
    meters: meterValues,
  });
  diagnosticsEl.value = lastDiagnostics;
}

// Store PLSTEP burst events for diagnostics display
const plstepEvents = [];

function handleTelemetry(data) {
  // Handle PLSTEP burst events specially
  if (data?.type === 'plstep') {
    // P1: Calculate proper scheduled relative time using runStartTime
    // data.time is the absolute scheduled time from klatt-synth
    // Proper relative time = scheduled time - session start time
    const scheduledRelTime = Number.isFinite(data.time) && runStartTime > 0
      ? data.time - runStartTime
      : null;
    const { relTime, event, inWindow, trackEnd } = getRunContext();
    // P1: Session isolation - only accept events with valid timing
    // Allow events during window OR if we're just starting (cold start)
    if (inWindow || !lastRun) {
      plstepEvents.push({
        time: data.time, // Keep absolute time for debugging
        relTime, // Current ctx.currentTime relative to start
        scheduledRelTime, // P1: Proper scheduled time relative to start
        amplitudeLinear: data.amplitudeLinear,
        amplitudeDb: data.amplitudeDb,
        trigger: data.trigger,
        delta: data.delta,
        phoneme: event?.phoneme ?? '',
        sessionId: lastRun?.sessionId ?? sessionId, // P1: Track session
      });
      // Keep only last 10 PLSTEP events
      if (plstepEvents.length > 10) plstepEvents.shift();
      updateDiagnostics();
    }
    return;
  }
  if (!data?.node) return;
  const { relTime, event, inWindow } = getRunContext();
  telemetry.set(data.node, {
    rms: data.rms,
    peak: data.peak,
    f0: data.f0,
    rd: data.rd,
    lfMode: data.lfMode,
    freq: data.freq,
    bw: data.bw,
    gain: data.gain,
    inRms: data.inRms,
    inPeak: data.inPeak,
    cutoff: data.cutoff,
    gainAvg: data.gainAvg,
    gainPeak: data.gainPeak,
    time: relTime,
    phoneme: event?.phoneme ?? "",
  });
  const prev = telemetryMax.get(data.node) || { rms: 0, peak: 0 };
  const next = { ...prev };
  if (
    inWindow &&
    Number.isFinite(data.rms) &&
    data.rms > (prev.rms ?? 0)
  ) {
    next.rms = data.rms;
    next.rmsTime = relTime;
    next.rmsPhoneme = event?.phoneme ?? "";
  }
  if (
    inWindow &&
    Number.isFinite(data.peak) &&
    data.peak > (prev.peak ?? 0)
  ) {
    next.peak = data.peak;
    next.peakTime = relTime;
    next.peakPhoneme = event?.phoneme ?? "";
  }
  if (inWindow && Number.isFinite(data.freq)) {
    if (!Number.isFinite(next.freqMin) || data.freq < next.freqMin) {
      next.freqMin = data.freq;
    }
    if (!Number.isFinite(next.freqMax) || data.freq > next.freqMax) {
      next.freqMax = data.freq;
    }
  }
  if (inWindow && Number.isFinite(data.bw)) {
    if (!Number.isFinite(next.bwMin) || data.bw < next.bwMin) {
      next.bwMin = data.bw;
    }
    if (!Number.isFinite(next.bwMax) || data.bw > next.bwMax) {
      next.bwMax = data.bw;
    }
  }
  telemetryMax.set(data.node, next);
  if (!lastRun) return;
  if (telemetryTimer) return;
  telemetryTimer = setTimeout(() => {
    telemetryTimer = null;
    updateDiagnostics();
  }, 250);
}

function buildDiagnostics({ phrase, baseF0, track, telemetry, meters }) {
  const summary = summarizeTrack(track);
  const parallelSummary = summarizeParallel(track);
  const fallbackMode = Number.isFinite(track[0]?.params?.lfMode)
    ? track[0].params.lfMode
    : synth.params.lfMode;
  const fallbackF0 = Number.isFinite(track[0]?.params?.F0)
    ? track[0].params.F0
    : synth.params.f0;
  const fallbackF1 = Number.isFinite(track[0]?.params?.F1)
    ? track[0].params.F1
    : synth.params.F1;
  const fallbackF2 = Number.isFinite(track[0]?.params?.F2)
    ? track[0].params.F2
    : synth.params.F2;
  const fallbackF3 = Number.isFinite(track[0]?.params?.F3)
    ? track[0].params.F3
    : synth.params.F3;
  const lfSummary = summarizeLfMode(track, fallbackMode);
  const f1Range = collectParamRange(track, "F1", fallbackF1);
  const f2Range = collectParamRange(track, "F2", fallbackF2);
  const f3Range = collectParamRange(track, "F3", fallbackF3);
  const voicingIssues = findVoicingIssues(track, { F0: fallbackF0 });
  const derived = analyzeTrackGains(track, synth.params);
  const cascade1Range = telemetryMax.get("cascade-1");
  const cascade2Range = telemetryMax.get("cascade-2");
  const cascade3Range = telemetryMax.get("cascade-3");
  const lines = [];
  // P1: Session header with start time for isolation tracking
  const sessionStartStr = lastRun?.startTime
    ? `Session #${lastRun.sessionId ?? sessionId} started at ${lastRun.startTime.toFixed(3)}s`
    : `Session #${sessionId}`;
  lines.push(sessionStartStr);
  lines.push("");
  lines.push(`Phrase: ${phrase}`);
  lines.push(`Base F0: ${baseF0}`);
  lines.push(`Events: ${summary.events}`);
  lines.push(`Total time: ${summary.totalTime.toFixed(3)}s`);
  lines.push(`Voiced events: ${summary.voicedEvents}`);
  lines.push(`F0 range: ${summary.f0Min.toFixed(1)} - ${summary.f0Max.toFixed(1)} Hz`);
  lines.push(
    `LF mode time: legacy=${(lfSummary.seconds[0] || 0).toFixed(3)}s (${lfSummary.counts[0] || 0}) | LF_LM=${(lfSummary.seconds[1] || 0).toFixed(3)}s (${lfSummary.counts[1] || 0}) | LF_CALM=${(lfSummary.seconds[2] || 0).toFixed(3)}s (${lfSummary.counts[2] || 0})`
  );
  lines.push(
    `Formant range: F1 ${formatRange(f1Range)} Hz | F2 ${formatRange(f2Range)} Hz | F3 ${formatRange(f3Range)} Hz`
  );
  lines.push(
    `SW=1 events: ${parallelSummary.swOn} | parallel events: ${parallelSummary.parallelEvents}`
  );
  lines.push(
    `SW=1 time: ${parallelSummary.swOnSeconds.toFixed(3)}s (${parallelSummary.swOnShare.toFixed(1)}%)`
  );
  if (derived) {
    lines.push(
      `Parallel gain scale: ${derived.parallelScale.toFixed(3)} | mix range: ${formatRange(derived.ranges.mix, 2)}`
    );
    lines.push("Derived gains (linear):");
    lines.push(
      `voice ${formatRange(derived.ranges.voiceGain, 6)} | asp ${formatRange(derived.ranges.aspGain, 6)} | fric ${formatRange(derived.ranges.fricGain, 6)}`
    );
    lines.push(
      `parallel voice ${formatRange(derived.ranges.parallelVoiceGain, 6)} | bypass ${formatRange(derived.ranges.parallelBypassGain, 6)} | nasal ${formatRange(derived.ranges.parallelNasalGain, 6)}`
    );
    lines.push(
      `parallel formants ${formatRange(derived.ranges.parallelFormantGain, 6)} | master ${formatRange(derived.ranges.masterGain, 6)}`
    );
    lines.push("Warnings:");
    lines.push(...(derived.warnings.length ? derived.warnings : ["(none)"]));
    lines.push("");
  }
  // P4: Formant automation check with expected vs observed warnings
  lines.push("Formant automation check:");
  lines.push(...formatFormantCheck("cascade-1", cascade1Range, f1Range, "F1"));
  lines.push(...formatFormantCheck("cascade-2", cascade2Range, f2Range, "F2"));
  lines.push(...formatFormantCheck("cascade-3", cascade3Range, f3Range, "F3"));
  // P6: Check NZ/NP bypass status
  const nzRange = telemetryMax.get("nz");
  const npRange = telemetryMax.get("np");
  lines.push(formatBypassCheck("nz", nzRange, synth.params.FNZ, synth.params.BNZ));
  lines.push(formatBypassCheck("np", npRange, synth.params.FNP, synth.params.BNP));
  lines.push("");
  lines.push("");
  // P5: Enhanced event display with A1-A6 for SW=1 events
  lines.push("First events:");
  track.slice(0, 8).forEach((e, index) => {
    lines.push(formatEventLine(index, e));
  });
  lines.push("");
  lines.push("Last events:");
  track.slice(-6).forEach((e, index) => {
    lines.push(formatEventLine(track.length - 6 + index, e));
  });
  lines.push("");
  lines.push("Voicing issues:");
  lines.push(...(voicingIssues.length ? voicingIssues : ["(none)"]));
  lines.push("");
  lines.push("Telemetry (latest block):");
  lines.push(...formatTelemetry(telemetry));
  lines.push("");
  lines.push("Meters (RMS/peak):");
  lines.push(...formatMeters(meters || meterValues));
  lines.push("");
  lines.push("Meters by SW window:");
  lines.push(...formatSwWindowMeters());
  lines.push("");
  // P3: Signal flow snapshot at peak
  lines.push("Signal flow (max rms through chain):");
  lines.push(...formatSignalFlow());
  lines.push("");
  lines.push("PLSTEP bursts (plosive release transients):");
  // P9: Pass trackDuration for timing integrity check
  lines.push(...formatPlstepEvents(plstepEvents, summary.totalTime));
  lines.push("");
  lines.push(`Spikes (peak > ${spikeThreshold}):`);
  lines.push(...formatSpikes(spikeEvents));
  // P2: Gain derivation for focus event (first SW=1 event)
  const gainDerivation = formatGainDerivation(track, synth.params);
  if (gainDerivation.length > 0) {
    lines.push("");
    lines.push("Gain derivation (focus event):");
    lines.push(...gainDerivation);
  }
  // P7: Play history for warmup tracking
  if (playHistory.length > 0) {
    lines.push("");
    lines.push("Play history (output-sum max rms):");
    lines.push(...formatPlayHistory());
  }
  return lines.join("\n");
}

function attachMeters() {
  const nodes = synth.nodes;
  if (!nodes?.outputSum || meters.size > 0) return;
  const targets = [
    { name: "cascade-out", node: nodes.cascadeOutGain },
    { name: "parallel-out", node: nodes.parallelOutGain },
    { name: "output-sum", node: nodes.outputSum },
  ];
  for (const target of targets) {
    if (!target.node) continue;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    target.node.connect(analyser);
    meters.set(target.name, analyser);
  }
  startMeterLoop();
}

function startMeterLoop() {
  if (meterTimer) return;
  meterTimer = setInterval(() => {
    const { relTime, event, inWindow } = getRunContext();
    for (const [name, analyser] of meters.entries()) {
      const data = readMeter(analyser);
      meterValues.set(name, {
        ...data,
        time: relTime,
        phoneme: event?.phoneme ?? "",
      });
      const prev = meterMax.get(name) || { rms: 0, peak: 0 };
      const next = { ...prev };
      if (
        inWindow &&
        Number.isFinite(data.rms) &&
        data.rms > (prev.rms ?? 0)
      ) {
        next.rms = data.rms;
        next.rmsTime = relTime;
        next.rmsPhoneme = event?.phoneme ?? "";
      }
      if (
        inWindow &&
        Number.isFinite(data.peak) &&
        data.peak > (prev.peak ?? 0)
      ) {
        next.peak = data.peak;
        next.peakTime = relTime;
        next.peakPhoneme = event?.phoneme ?? "";
      }
      meterMax.set(name, next);
      recordSpike(name, data);
      recordSwWindowMax(name, data, relTime, event);
    }
    updateDiagnostics();
  }, 20);
}

const swWindowMax = new Map();
const swWindowMaxTime = new Map();

function recordSwWindowMax(name, data, relTime, event) {
  if (!lastRun || !runStartTime || !data || !Number.isFinite(data.rms)) return;
  const sw = event?.params?.SW;
  if (sw !== 0 && sw !== 1) return;
  if (!Number.isFinite(relTime)) return;
  const trackEnd = lastRun.track?.length
    ? lastRun.track[lastRun.track.length - 1].time
    : 0;
  if (relTime < -0.1 || relTime > trackEnd + 0.5) return;
  const eventIndex = findEventIndexAtTime(lastRun.track, Math.max(0, relTime));
  if (eventIndex < 0) return;
  const current = lastRun.track[eventIndex];
  const next = lastRun.track[eventIndex + 1];
  const guard = 0.05; // Avoid analyzer window bleed across SW boundaries.
  const eventStart = current?.time ?? 0;
  const eventEnd = next?.time ?? (eventStart + 0.5);
  if (relTime < eventStart + guard || relTime > eventEnd - guard) return;

  const key = `${name}:SW=${sw}`;
  const prev = swWindowMax.get(key) || { rms: 0, peak: 0 };
  const next = { ...prev };
  if (data.rms > (prev.rms ?? 0)) {
    next.rms = data.rms;
    next.rmsTime = relTime;
    next.rmsPhoneme = event?.phoneme ?? "";
  }
  if (data.peak > (prev.peak ?? 0)) {
    next.peak = data.peak;
    next.peakTime = relTime;
    next.peakPhoneme = event?.phoneme ?? "";
  }
  swWindowMax.set(key, next);
}

function recordSpike(name, data) {
  if (!lastRun || !runStartTime || !data || !Number.isFinite(data.peak)) return;
  if (data.peak <= spikeThreshold) return;
  const now = ctx.currentTime;
  const lastAt = lastSpikeAt.get(name) ?? -Infinity;
  if (now - lastAt < spikeCooldown) return;
  const relTime = now - runStartTime;
  const trackEnd = lastRun.track?.length
    ? lastRun.track[lastRun.track.length - 1].time
    : 0;
  if (relTime < -0.1 || relTime > trackEnd + 0.5) return;
  lastSpikeAt.set(name, now);
  const event = findEventAtTime(lastRun.track, relTime);
  spikeEvents.push({
    time: Math.max(0, relTime),
    node: name,
    peak: data.peak,
    phoneme: event?.phoneme ?? "",
  });
  if (spikeEvents.length > 6) spikeEvents.shift();
}

function readMeter(analyser) {
  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  let sum = 0;
  let peak = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const v = buffer[i];
    sum += v * v;
    const av = Math.abs(v);
    if (av > peak) peak = av;
  }
  const rms = Math.sqrt(sum / buffer.length);
  return { rms, peak };
}
