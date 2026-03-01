// test/harness/diagnostics.js — Diagnostics formatting and display

import { state } from "./state.js";
import { getSemanticsDefault, getCurrentSliderParams } from "./controls.js";
import { dbToLinear, ndbScale } from "../../src/builtin-functions";
import {
  summarizeTrack,
  summarizeParallel,
  summarizeLfMode,
  collectParamRange,
  findVoicingIssues,
  analyzeTrackGains,
  formatLevel,
  formatRange,
  formatMaxContext,
} from "../../src/track-analysis.ts";

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
  const event = inWindow
    ? findEventAtTime(state.lastRun.track, Math.max(0, relTime))
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
  const go = p.GO ?? 47;

  const lines = [];
  const phoneme = focusEvent.phoneme || `event ${focusIndex}`;
  const time = focusEvent.time?.toFixed(3) ?? "?";
  const sw = p.SW ?? 0;
  lines.push(`Focus: ${phoneme} @${time}s (SW=${sw}, GO=${go})`);

  // Voice gain: GO + AV + ndb(AV) -> linear
  const av = p.AV ?? -70;
  const voiceCalc = go + av + ndbScale.AV;
  const voiceGain = dbToLinear(voiceCalc);
  lines.push(`  voiceGain: GO=${go} + AV=${av.toFixed(0)} + ndb(-72) = ${voiceCalc.toFixed(0)}dB → ${voiceGain.toFixed(4)}`);

  // Aspiration gain: GO + AH + ndb(AH) -> linear
  const ah = p.AH ?? -70;
  const aspCalc = go + ah + ndbScale.AH;
  const aspGain = dbToLinear(aspCalc);
  lines.push(`  aspGain:   GO=${go} + AH=${ah.toFixed(0)} + ndb(-87) = ${aspCalc.toFixed(0)}dB → ${aspGain.toFixed(4)}`);

  // Frication gain: GO + max(AF,AH) + ndb(AF) -> linear (when SW=1)
  const af = p.AF ?? -70;
  const fricSrc = sw === 1 ? Math.max(af, ah) : af;
  const fricCalc = go + fricSrc + ndbScale.AF;
  const fricGain = dbToLinear(fricCalc);
  if (sw === 1) {
    lines.push(`  fricGain:  GO=${go} + max(AF=${af.toFixed(0)},AH=${ah.toFixed(0)}) + ndb(-72) = ${fricCalc.toFixed(0)}dB → ${fricGain.toFixed(4)}`);
  } else {
    lines.push(`  fricGain:  GO=${go} + AF=${af.toFixed(0)} + ndb(-72) = ${fricCalc.toFixed(0)}dB → ${fricGain.toFixed(4)}`);
  }

  // Parallel source gain: SW=1 → 1.0, otherwise 0
  const parallelSrcGain = sw === 1 ? 1.0 : 0;
  lines.push(`  parallelSrcGain: SW=${sw} → ${parallelSrcGain.toFixed(3)}`);

  // AVS (parallel voice) gain: GO + AVS + ndb(AVS) -> linear * 10
  const avs = p.AVS ?? -70;
  const avsCalc = go + avs + ndbScale.AVS;
  const avsGain = dbToLinear(avsCalc) * 10;
  lines.push(`  avsGain:   GO=${go} + AVS=${avs.toFixed(0)} + ndb(-44) = ${avsCalc.toFixed(0)}dB → ${avsGain.toFixed(4)} (*10)`);

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
  if (state.playHistory.length === 0) return ["(none)"];
  return state.playHistory.map((entry, index) => {
    const marker = index === state.playHistory.length - 1 ? " ← current" : "";
    const warmup = index === 0 && state.playHistory.length > 1 ? " (cold start)" : "";
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
  const lfSource = state.telemetryMax.get("lf-source");
  const noise = state.telemetryMax.get("noise");
  const frication = state.telemetryMax.get("frication");
  const rgp = state.telemetryMax.get("rgp");

  lines.push("Sources (max rms):");
  lines.push(`  lf-source: ${fmt(lfSource?.rms)} ${fmtCtx(lfSource)}`);
  lines.push(`  noise:     ${fmt(noise?.rms)} ${fmtCtx(noise)}`);
  lines.push(`  frication: ${fmt(frication?.rms)} ${fmtCtx(frication)}`);
  lines.push(`  rgp:       ${fmt(rgp?.rms)} ${fmtCtx(rgp)}`);

  // Cascade chain
  lines.push("Cascade chain (max rms):");
  for (let i = 6; i >= 1; i--) {
    const cascade = state.telemetryMax.get(`cascade-${i}`);
    lines.push(`  cascade-${i}: ${fmt(cascade?.rms)} ${fmtCtx(cascade)}`);
  }
  const nz = state.telemetryMax.get("nz");
  const np = state.telemetryMax.get("np");
  lines.push(`  nz: ${fmt(nz?.rms)}`);
  lines.push(`  np: ${fmt(np?.rms)}`);

  // Parallel branch
  lines.push("Parallel branch (max rms):");
  for (let i = 1; i <= 6; i++) {
    const pf = state.telemetryMax.get(`parallel-formant-${i}`);
    if (pf?.rms > 0) {
      lines.push(`  parallel-formant-${i}: ${fmt(pf?.rms)}`);
    }
  }
  const parallelNasal = state.telemetryMax.get("parallel-nasal");
  if (parallelNasal?.rms > 0) {
    lines.push(`  parallel-nasal: ${fmt(parallelNasal?.rms)}`);
  }

  // Output stage
  lines.push("Output stage (max rms):");
  const cascadeOut = state.meterMax.get("cascade-out");
  const parallelOut = state.meterMax.get("parallel-out");
  const preOutputLp = state.meterMax.get("pre-output-lp");
  const postOutputLp = state.meterMax.get("post-output-lp");
  lines.push(`  cascade-out:  ${fmt(cascadeOut?.rms)} ${fmtCtx(cascadeOut)}`);
  lines.push(`  parallel-out: ${fmt(parallelOut?.rms)} ${fmtCtx(parallelOut)}`);
  lines.push(`  pre-output-lp:  ${fmt(preOutputLp?.rms)} ${fmtCtx(preOutputLp)}`);
  lines.push(`  post-output-lp: ${fmt(postOutputLp?.rms)} ${fmtCtx(postOutputLp)}`);

  return lines;
}

function formatTelemetry(telemetryMap) {
  if (!telemetryMap || telemetryMap.size === 0) return ["(no telemetry yet)"];
  const entries = Array.from(telemetryMap.entries()).sort(([a], [b]) =>
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
      const max = state.telemetryMax.get(node);
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

function formatMeters(metersMap) {
  if (!metersMap || metersMap.size === 0) return ["(no meters yet)"];
  const entries = Array.from(metersMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return entries.map(
    ([node, data]) => {
      const max = state.meterMax.get(node);
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
  if (!state.swWindowMax || state.swWindowMax.size === 0) return ["(no SW-window maxima)"];
  const entries = Array.from(state.swWindowMax.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return entries.map(([key, data]) => {
    const rmsCtx = data.rmsTime != null ? `@${data.rmsTime.toFixed(3)}s ${data.rmsPhoneme ?? ""}` : "";
    const peakCtx = data.peakTime != null ? `@${data.peakTime.toFixed(3)}s ${data.peakPhoneme ?? ""}` : "";
    return `${key}: rms=${formatLevel(data.rms)} ${rmsCtx} | peak=${formatLevel(data.peak)} ${peakCtx}`;
  });
}

export function updateDiagnostics() {
  if (!state.lastRun) return;
  state.lastDiagnostics = buildDiagnostics({
    phrase: state.lastRun.phrase,
    baseF0: state.lastRun.baseF0,
    track: state.lastRun.track,
    telemetry: state.telemetry,
    meters: state.meterValues,
  });
  state.diagnosticsEl.value = state.lastDiagnostics;
}

export function buildDiagnostics({ phrase, baseF0, track, telemetry, meters }) {
  const summary = summarizeTrack(track);
  const parallelSummary = summarizeParallel(track);
  const fallbackMode = Number.isFinite(track[0]?.params?.lfMode)
    ? track[0].params.lfMode
    : getSemanticsDefault("lfMode", 1);
  const fallbackF0 = Number.isFinite(track[0]?.params?.F0)
    ? track[0].params.F0
    : getSemanticsDefault("f0", 0);
  const fallbackF1 = Number.isFinite(track[0]?.params?.F1)
    ? track[0].params.F1
    : getSemanticsDefault("F1", 500);
  const fallbackF2 = Number.isFinite(track[0]?.params?.F2)
    ? track[0].params.F2
    : getSemanticsDefault("F2", 1500);
  const fallbackF3 = Number.isFinite(track[0]?.params?.F3)
    ? track[0].params.F3
    : getSemanticsDefault("F3", 2500);
  const lfSummary = summarizeLfMode(track, fallbackMode);
  const f1Range = collectParamRange(track, "F1", fallbackF1);
  const f2Range = collectParamRange(track, "F2", fallbackF2);
  const f3Range = collectParamRange(track, "F3", fallbackF3);
  const voicingIssues = findVoicingIssues(track, { F0: fallbackF0 });
  const sliderParams = getCurrentSliderParams();
  const derived = analyzeTrackGains(track, sliderParams);
  const cascade1Range = state.telemetryMax.get("cascadeF1") ?? state.telemetryMax.get("cascade-1");
  const cascade2Range = state.telemetryMax.get("cascadeF2") ?? state.telemetryMax.get("cascade-2");
  const cascade3Range = state.telemetryMax.get("cascadeF3") ?? state.telemetryMax.get("cascade-3");
  const lines = [];
  // P1: Session header with start time for isolation tracking
  const sessionStartStr = state.lastRun?.startTime
    ? `Session #${state.lastRun.sessionId ?? state.sessionId} started at ${state.lastRun.startTime.toFixed(3)}s`
    : `Session #${state.sessionId}`;
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
  const nzRange = state.telemetryMax.get("nz");
  const npRange = state.telemetryMax.get("np");
  lines.push(formatBypassCheck("nz", nzRange, getSemanticsDefault("FNZ", 280), getSemanticsDefault("BNZ", 90)));
  lines.push(formatBypassCheck("np", npRange, getSemanticsDefault("FNP", 280), getSemanticsDefault("BNP", 90)));
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
  lines.push(...formatMeters(meters || state.meterValues));
  lines.push("");
  lines.push("Meters by SW window:");
  lines.push(...formatSwWindowMeters());
  lines.push("");
  // P3: Signal flow snapshot at peak
  lines.push("Signal flow (max rms through chain):");
  lines.push(...formatSignalFlow());
  lines.push("");
  lines.push(`PLSTEP bursts (showing last ${Math.min(state.plstepEvents.length, 50)} of ${state.plstepTotalCount} total):`);
  // P9: Pass trackDuration for timing integrity check
  lines.push(...formatPlstepEvents(state.plstepEvents, summary.totalTime));
  lines.push("");
  lines.push(`Spikes (peak > ${state.spikeThreshold}):`);
  lines.push(...formatSpikes(state.spikeEvents));
  // P2: Gain derivation for focus event (first SW=1 event)
  const gainDerivation = formatGainDerivation(track, sliderParams);
  if (gainDerivation.length > 0) {
    lines.push("");
    lines.push("Gain derivation (focus event):");
    lines.push(...gainDerivation);
  }
  // P7: Play history for warmup tracking
  if (state.playHistory.length > 0) {
    lines.push("");
    lines.push("Play history (post-output-lp max rms):");
    lines.push(...formatPlayHistory());
  }
  return lines.join("\n");
}
