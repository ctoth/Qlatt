// test/harness/telemetry.js — Telemetry handling, meters, spike tracking

import { getRunContext, updateDiagnostics } from "./diagnostics.js";
import { state } from "./state.js";

export function handleTelemetry(data) {
  // Handle PLSTEP burst events specially
  if (data?.type === "plstep") {
    // P1: Calculate proper scheduled relative time using runStartTime
    // data.time is the absolute scheduled time from the interpreter
    // Proper relative time = scheduled time - session start time
    const scheduledRelTime =
      Number.isFinite(data.time) && state.runStartTime > 0 ? data.time - state.runStartTime : null;
    const { relTime, event, inWindow } = getRunContext();
    // P1: Session isolation - only accept events with valid timing
    // Allow events during window OR if we're just starting (cold start)
    if (inWindow || !state.lastRun) {
      state.plstepTotalCount += 1;
      state.plstepEvents.push({
        time: data.time, // Keep absolute time for debugging
        relTime, // Current ctx.currentTime relative to start
        scheduledRelTime, // P1: Proper scheduled time relative to start
        amplitudeLinear: data.amplitudeLinear,
        amplitudeDb: data.amplitudeDb,
        trigger: data.trigger,
        delta: data.delta,
        phoneme: data.phoneme ?? event?.phoneme ?? "",
        sessionId: state.lastRun?.sessionId ?? state.sessionId, // P1: Track session
      });
      // Keep only last 50 PLSTEP events
      if (state.plstepEvents.length > 50) state.plstepEvents.shift();
      updateDiagnostics();
    }
    return;
  }
  // Handle explosion reports from antiresonator instrumentation
  if (data?.type === "explosion") {
    console.error(
      `[EXPLOSION REPORT] node=${data.node} outRms=${data.outRms?.toFixed(1)} inRms=${data.inRms?.toFixed(4)} freq=${data.freq} bw=${data.bw} gain=${data.gain} bypassAtZero=${data.bypassAtZero} sampleRate=${data.sampleRate}`,
    );
    return;
  }
  if (!data?.node) return;
  const { relTime, event, inWindow } = getRunContext();
  const rms = Number.isFinite(data.rms) ? data.rms : data.voiceRms;
  const peak = Number.isFinite(data.peak) ? data.peak : data.voicePeak;
  state.telemetry.set(data.node, {
    rms,
    peak,
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
  const prev = state.telemetryMax.get(data.node) || { rms: 0, peak: 0 };
  const nextMax = { ...prev };
  if (inWindow && Number.isFinite(rms) && rms > (prev.rms ?? 0)) {
    nextMax.rms = rms;
    nextMax.rmsTime = relTime;
    nextMax.rmsPhoneme = event?.phoneme ?? "";
  }
  if (inWindow && Number.isFinite(peak) && peak > (prev.peak ?? 0)) {
    nextMax.peak = peak;
    nextMax.peakTime = relTime;
    nextMax.peakPhoneme = event?.phoneme ?? "";
  }
  if (inWindow && Number.isFinite(data.freq)) {
    if (!Number.isFinite(nextMax.freqMin) || data.freq < nextMax.freqMin) {
      nextMax.freqMin = data.freq;
    }
    if (!Number.isFinite(nextMax.freqMax) || data.freq > nextMax.freqMax) {
      nextMax.freqMax = data.freq;
    }
  }
  if (inWindow && Number.isFinite(data.bw)) {
    if (!Number.isFinite(nextMax.bwMin) || data.bw < nextMax.bwMin) {
      nextMax.bwMin = data.bw;
    }
    if (!Number.isFinite(nextMax.bwMax) || data.bw > nextMax.bwMax) {
      nextMax.bwMax = data.bw;
    }
  }
  state.telemetryMax.set(data.node, nextMax);
  if (!state.lastRun) return;
  if (state.telemetryTimer) return;
  state.telemetryTimer = setTimeout(() => {
    state.telemetryTimer = null;
    updateDiagnostics();
  }, 250);
}
