// Track analysis module for Qlatt TTS diagnostics
// Extracted from test-harness.html for maintainability

import { dbToLinear, proximity, ndbScale, ndbCor } from './klatt-functions.js';

// Klatt 80 Table III expected values for stop releases
export const KLATT80_EXPECTED = {
  P_REL: { AF: 55, AH: 52, AB: 63, A2: 0, A3: 0, A4: 0, A5: 0, A6: 0, dur: 5, label: '[p] labial burst' },
  T_REL: { AF: 58, AH: 55, AB: 0, A2: 0, A3: 30, A4: 45, A5: 57, A6: 63, dur: 15, label: '[t] alveolar burst' },
  K_REL: { AF: 55, AH: 53, AB: 0, A2: 0, A3: 53, A4: 43, A5: 45, A6: 45, dur: 25, label: '[k] velar burst' },
  B_REL: { AF: 52, AV: 47, AB: 63, A1: 60, A2: 0, dur: 5, label: '[b] voiced labial' },
  D_REL: { AF: 50, AV: 47, AB: 0, A1: 58, A2: 0, A3: 47, A4: 60, A5: 62, A6: 60, dur: 10, label: '[d] voiced alveolar' },
  G_REL: { AF: 50, AV: 47, AB: 0, A1: 58, A2: 0, A3: 53, A4: 43, A5: 45, A6: 45, dur: 20, label: '[g] voiced velar' },
  P_ASP: { AH: 52, AB: 63, dur: 53, label: '[p] aspiration' },
  T_ASP: { AH: 55, A3: 30, A4: 45, A5: 57, A6: 63, dur: 56, label: '[t] aspiration' },
  K_ASP: { AH: 53, A3: 53, A4: 43, A5: 45, A6: 45, dur: 48, label: '[k] aspiration' },
};

// Analyze stop releases in track
export function analyzeStopReleases(track, plstepEvents = [], runStartTime = 0) {
  const releases = [];
  const isStopRelease = (ph) => ph?.includes('_REL') || ph?.includes('_ASP');

  for (let i = 0; i < track.length; i++) {
    const event = track[i];
    const phoneme = event.phoneme;
    if (!isStopRelease(phoneme)) continue;

    const nextEvent = track[i + 1];
    const duration = nextEvent ? (nextEvent.time - event.time) * 1000 : 0;
    const expected = KLATT80_EXPECTED[phoneme];
    const p = event.params || {};

    const plstepMatch = plstepEvents.find(pl => {
      const plTime = Number.isFinite(pl.relTime) ? pl.relTime : (pl.time - runStartTime);
      return Math.abs(plTime - event.time) < 0.02;
    });

    const release = {
      time: event.time,
      phoneme,
      duration: duration.toFixed(1),
      expected,
      actual: {
        AF: p.AF ?? 0, AH: p.AH ?? 0, AV: p.AV ?? 0, AVS: p.AVS ?? 0,
        A1: p.A1 ?? 0, A2: p.A2 ?? 0, A3: p.A3 ?? 0,
        A4: p.A4 ?? 0, A5: p.A5 ?? 0, A6: p.A6 ?? 0,
        AB: p.AB ?? 0, F1: p.F1 ?? 0, F2: p.F2 ?? 0, F3: p.F3 ?? 0, SW: p.SW ?? 0,
      },
      plstepTriggered: !!plstepMatch,
      plstepAmp: plstepMatch?.amplitudeLinear,
    };

    release.issues = [];
    if (expected) {
      if (Math.abs(duration - expected.dur) > 3) {
        release.issues.push(`dur: ${duration.toFixed(0)}ms vs expected ${expected.dur}ms`);
      }
      if (expected.AF && Math.abs((p.AF ?? 0) - expected.AF) > 5) {
        release.issues.push(`AF: ${p.AF ?? 0} vs expected ${expected.AF}`);
      }
      if (expected.AH && Math.abs((p.AH ?? 0) - expected.AH) > 5) {
        release.issues.push(`AH: ${p.AH ?? 0} vs expected ${expected.AH}`);
      }
      if (expected.A3 && Math.abs((p.A3 ?? 0) - expected.A3) > 5) {
        release.issues.push(`A3: ${p.A3 ?? 0} vs expected ${expected.A3}`);
      }
    }
    if ((p.AF ?? 0) > 40 && !plstepMatch) {
      release.issues.push('NO PLSTEP (AF should trigger burst)');
    }
    releases.push(release);
  }
  return releases;
}

export function formatStopReleases(releases) {
  if (!releases || releases.length === 0) return ['(no stop releases in track)'];
  const lines = [];
  lines.push('TIME     PHONEME   DUR    F1   F2    F3    SW  AF   AH   AV   A1-A6            AB   PLSTEP   ISSUES');
  lines.push('-------  --------  -----  ---  ----  ----  --  ---  ---  ---  ---------------  ---  -------  ------');
  for (const r of releases) {
    const a = r.actual;
    const a16 = `${a.A1.toString().padStart(2)} ${a.A2.toString().padStart(2)} ${a.A3.toString().padStart(2)} ${a.A4.toString().padStart(2)} ${a.A5.toString().padStart(2)} ${a.A6.toString().padStart(2)}`;
    const plstep = r.plstepTriggered ? `YES ${(r.plstepAmp ?? 0).toFixed(2)}` : 'NO';
    const issues = r.issues.length > 0 ? `!! ${r.issues.join(', ')}` : 'OK';
    lines.push(
      `${r.time.toFixed(3)}  ${r.phoneme.padEnd(8)}  ${r.duration.padStart(5)}ms  ${a.F1.toString().padStart(3)}  ${a.F2.toString().padStart(4)}  ${a.F3.toString().padStart(4)}  ${a.SW}   ${a.AF.toString().padStart(3)}  ${a.AH.toString().padStart(3)}  ${a.AV.toString().padStart(3)}  ${a16}  ${a.AB.toString().padStart(3)}  ${plstep.padEnd(7)}  ${issues}`
    );
  }
  return lines;
}

export function buildTimeline(track) {
  if (!track || track.length === 0) return ["(no events)"];
  const lines = [];
  lines.push("TIME     PHONEME   DUR   BRANCH     SOURCES                    PARALLEL FORMANTS");
  lines.push("-------  --------  ----  ---------  -------------------------  -----------------");
  for (let i = 0; i < track.length; i += 1) {
    const event = track[i];
    const nextEvent = track[i + 1];
    const dur = nextEvent ? ((nextEvent.time - event.time) * 1000).toFixed(0) : "?";
    const sw = event.params?.SW;
    const branch = sw === 1 ? "PARALLEL" : "CASCADE ";
    const time = event.time.toFixed(3);
    const phoneme = (event.phoneme ?? "").padEnd(8);
    const sources = [];
    if ((event.params?.AV ?? 0) > 0) sources.push(`AV=${(event.params.AV).toFixed(0)}`);
    if ((event.params?.AVS ?? 0) > 0) sources.push(`AVS=${(event.params.AVS).toFixed(0)}`);
    if ((event.params?.AF ?? 0) > 0) sources.push(`AF=${(event.params.AF).toFixed(0)}`);
    if ((event.params?.AH ?? 0) > 0) sources.push(`AH=${(event.params.AH).toFixed(0)}`);
    let parallelInfo = "";
    if (sw === 1) {
      const a1 = event.params?.A1 ?? 0, a2 = event.params?.A2 ?? 0;
      const a3 = event.params?.A3 ?? 0, a4 = event.params?.A4 ?? 0;
      const a5 = event.params?.A5 ?? 0, a6 = event.params?.A6 ?? 0;
      const ab = event.params?.AB ?? 0;
      if (a1 > 0 || a2 > 0 || a3 > 0 || a4 > 0 || a5 > 0 || a6 > 0 || ab > 0) {
        parallelInfo = `A=${a1}/${a2}/${a3}/${a4}/${a5}/${a6}`;
        if (ab > 0) parallelInfo += ` AB=${ab}`;
      } else {
        parallelInfo = "(no An)";
      }
    }
    lines.push(`${time}  ${phoneme}  ${dur.padStart(4)}  ${branch}  ${(sources.join(" ") || "(silent)").padEnd(25)}  ${parallelInfo}`);
  }
  return lines;
}

export function summarizeTrack(track) {
  const totalTime = track.length ? track[track.length - 1].time : 0;
  const voiced = track.filter((e) => (e.params?.AV ?? 0) > 0 || (e.params?.AVS ?? 0) > 0);
  const f0Values = track.map((e) => e.params?.F0 ?? 0).filter((v) => v > 0);
  return {
    events: track.length,
    totalTime,
    voicedEvents: voiced.length,
    f0Min: f0Values.length ? Math.min(...f0Values) : 0,
    f0Max: f0Values.length ? Math.max(...f0Values) : 0,
  };
}

export function summarizeParallel(track) {
  let swOn = 0, swOff = 0, parallelEvents = 0, swOnSeconds = 0, swTotalSeconds = 0;
  for (const event of track) {
    const params = event.params;
    if (!params) continue;
    if (params.SW === 1) swOn += 1;
    else if (Number.isFinite(params.SW)) swOff += 1;
    const hasParallel = (params.AN ?? 0) > 0 || (params.AB ?? 0) > 0 ||
      [params.A1, params.A2, params.A3, params.A4, params.A5, params.A6].some((v) => (v ?? 0) > 0) ||
      (params.AVS ?? 0) > 0 || (params.AF ?? 0) > 0;
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
  return { swOn, swOff, parallelEvents, swOnSeconds, swOnShare: swTotalSeconds > 0 ? (swOnSeconds / swTotalSeconds) * 100 : 0 };
}

export function summarizeLfMode(track, fallbackMode = 0) {
  const counts = { 0: 0, 1: 0, 2: 0 };
  const seconds = { 0: 0, 1: 0, 2: 0 };
  let current = Number.isFinite(fallbackMode) ? Math.round(fallbackMode) : 0;
  for (let i = 0; i < track.length; i += 1) {
    const event = track[i];
    if (Number.isFinite(event?.params?.lfMode)) current = Math.round(event.params.lfMode);
    counts[current] = (counts[current] || 0) + 1;
    const duration = i < track.length - 1 ? track[i + 1].time - event.time : 0;
    if (Number.isFinite(duration) && duration > 0) seconds[current] = (seconds[current] || 0) + duration;
  }
  return { counts, seconds };
}

export function collectParamRange(track, key, fallback) {
  let min = Infinity, max = -Infinity, current = fallback;
  for (const event of track) {
    if (Number.isFinite(event?.params?.[key])) current = event.params[key];
    if (Number.isFinite(current)) { min = Math.min(min, current); max = Math.max(max, current); }
  }
  return (!Number.isFinite(min) || !Number.isFinite(max)) ? null : { min, max };
}

export function findVoicingIssues(track, fallback) {
  const issues = [];
  const state = { F0: fallback?.F0 ?? 0, AV: fallback?.AV ?? 0, AVS: fallback?.AVS ?? 0, AF: fallback?.AF ?? 0, AH: fallback?.AH ?? 0 };
  for (let i = 0; i < track.length && issues.length < 6; i += 1) {
    const event = track[i];
    if (event?.params) for (const key of Object.keys(state)) if (Number.isFinite(event.params[key])) state[key] = event.params[key];
    const voiced = (state.AV ?? 0) > 0 || (state.AVS ?? 0) > 0;
    const noise = (state.AF ?? 0) > 0 || (state.AH ?? 0) > 0;
    const f0 = state.F0 ?? 0;
    if (voiced && f0 <= 0) issues.push(`t=${event.time.toFixed(3)} ${event.phoneme ?? ""} voiced but F0=0`);
    else if (f0 > 0 && !voiced && !noise) issues.push(`t=${event.time.toFixed(3)} ${event.phoneme ?? ""} F0>0 but no AV/AVS/AF/AH`);
  }
  return issues;
}

export function findSwAtTime(track, time) {
  if (!track || track.length === 0 || !Number.isFinite(time)) return null;
  for (let i = track.length - 1; i >= 0; i--) if (time >= track[i].time) return { sw: track[i].params?.SW ?? 0, phoneme: track[i].phoneme ?? "" };
  return { sw: track[0]?.params?.SW ?? 0, phoneme: track[0]?.phoneme ?? "" };
}

export function findPhonemeAtTime(track, time) {
  if (!track || track.length === 0) return "?";
  for (let i = track.length - 1; i >= 0; i--) if (track[i].time <= time) return track[i].phoneme || "?";
  return track[0]?.phoneme || "?";
}

// Formatting helpers
export function formatLevel(value) {
  if (!Number.isFinite(value)) return "n/a";
  if (value === 0) return "0";
  return Math.abs(value) < 1e-6 ? value.toExponential(2) : value.toFixed(6);
}

export function formatRange(range, digits = 1) {
  return range ? `${range.min.toFixed(digits)} - ${range.max.toFixed(digits)}` : "n/a";
}

export function formatMaxContext(time, phoneme) {
  if (!Number.isFinite(time)) return "";
  return ` @${time.toFixed(3)}s${phoneme ? ` ${phoneme}` : ""}`;
}

export function formatPlstepEventsRelative(list, runStart) {
  if (!list || list.length === 0) return ["(none)"];
  return list.map((evt) => {
    let relTime = "n/a";
    if (Number.isFinite(evt.time) && Number.isFinite(runStart)) relTime = (evt.time - runStart).toFixed(3);
    else if (Number.isFinite(evt.relTime)) relTime = evt.relTime.toFixed(3);
    const amp = Number.isFinite(evt.amplitudeLinear) ? evt.amplitudeLinear.toFixed(4) : "n/a";
    const db = Number.isFinite(evt.amplitudeDb) ? evt.amplitudeDb.toFixed(0) : "n/a";
    return `burst t=${relTime}s amp=${amp} (${db}dB) trigger=${evt.trigger || "?"}${Number.isFinite(evt.delta) ? `+${evt.delta.toFixed(0)}dB` : ""}${evt.phoneme ? ` [${evt.phoneme}]` : ""}`;
  });
}

// Re-export dbToLinear from klatt-functions for backwards compatibility
export { dbToLinear } from './klatt-functions.js';

export function updateRange(range, value) {
  if (!Number.isFinite(value)) return range;
  if (!range) return { min: value, max: value };
  range.min = Math.min(range.min, value);
  range.max = Math.max(range.max, value);
  return range;
}


export function analyzeTrackGains(track, synthParams, sampleRate = 48000) {
  if (!track || track.length === 0) return null;
  const ranges = { voiceGain: null, aspGain: null, fricGain: null, parallelVoiceGain: null, parallelBypassGain: null, parallelFormantGain: null, parallelNasalGain: null, masterGain: null, mix: null };
  const outputScale = dbToLinear(ndbScale.AF + 44);
  const parallelScale = synthParams.parallelGainScale ?? 1.0;
  const baseBoost = synthParams.masterGain ?? 1.0;
  const state = { ...(track[0]?.params ?? {}) };

  for (const event of track) {
    if (event?.params) Object.assign(state, event.params);
    const f1 = state.F1 ?? synthParams.F1, f2 = state.F2 ?? synthParams.F2, f3 = state.F3 ?? synthParams.F3;
    const f4 = state.F4 ?? synthParams.F4, f5 = state.F5 ?? synthParams.F5, f6 = state.F6 ?? synthParams.F6;
    const delF1 = f1 > 0 ? f1 / 500 : 1, delF2 = f2 > 0 ? f2 / 1500 : 1;
    let a2Cor = delF1 * delF1; const a2Skrt = delF2 * delF2; const a3Cor = a2Cor * a2Skrt;
    a2Cor = delF2 !== 0 ? a2Cor / delF2 : a2Cor;
    const n12Cor = proximity(f2 - f1), n23Cor = proximity(f3 - f2 - 50), n34Cor = proximity(f4 - f3 - 150);
    const mix = state.SW === 1 ? 1 : synthParams.parallelMix;
    const fricDbAdj = state.SW === 1 ? Math.max(state.AF ?? -70, state.AH ?? -70) : (state.AF ?? -70);

    ranges.voiceGain = updateRange(ranges.voiceGain, dbToLinear((state.AV ?? -70) + ndbScale.AV));
    ranges.aspGain = updateRange(ranges.aspGain, dbToLinear((state.AH ?? -70) + ndbScale.AH));
    ranges.fricGain = updateRange(ranges.fricGain, dbToLinear(fricDbAdj + ndbScale.AF) * parallelScale);
    ranges.parallelVoiceGain = updateRange(ranges.parallelVoiceGain, dbToLinear((state.AVS ?? -70) + ndbScale.AVS) * 10);
    ranges.parallelBypassGain = updateRange(ranges.parallelBypassGain, dbToLinear((state.AB ?? -70) + ndbScale.AB) * parallelScale);
    ranges.parallelNasalGain = updateRange(ranges.parallelNasalGain, dbToLinear((state.AN ?? -70) + ndbScale.AN) * parallelScale);
    ranges.masterGain = updateRange(ranges.masterGain, Math.min(5.0, dbToLinear(state.GO ?? 47) * baseBoost * outputScale));
    ranges.mix = updateRange(ranges.mix, mix);

    const parallelLinear = [
      dbToLinear((state.A1 ?? -70) + n12Cor + ndbScale.A1),
      dbToLinear((state.A2 ?? -70) + n12Cor * 2 + n23Cor + ndbScale.A2) * a2Cor,
      dbToLinear((state.A3 ?? -70) + n23Cor * 2 + n34Cor + ndbScale.A3) * a3Cor,
      dbToLinear((state.A4 ?? -70) + n34Cor * 2 + ndbScale.A4) * a3Cor,
      dbToLinear((state.A5 ?? -70) + ndbScale.A5) * a3Cor,
      dbToLinear((state.A6 ?? -70) + ndbScale.A6) * a3Cor,
    ];
    const freqs = [f1, f2, f3, f4, f5, f6];
    for (let idx = 0; idx < parallelLinear.length; idx++) {
      let value = parallelLinear[idx] * parallelScale;
      if (idx >= 1 && freqs[idx] > 0) {
        const diffGain = Math.sqrt(2 - 2 * Math.cos((2 * Math.PI * freqs[idx]) / sampleRate));
        if (diffGain > 0) value /= diffGain;
      }
      ranges.parallelFormantGain = updateRange(ranges.parallelFormantGain, Math.abs(value));
    }
  }

  const warnings = [];
  if (parallelScale > 0 && parallelScale < 0.05) warnings.push(`parallelGainScale=${parallelScale.toFixed(3)} very low`);
  if (ranges.mix?.max > 0 && (ranges.parallelVoiceGain?.max ?? 0) < 1e-3 && (ranges.fricGain?.max ?? 0) < 1e-3) warnings.push("Parallel gains < 1e-3");
  return { ranges, warnings, parallelScale };
}

export function findTimingMismatches(track, telemetryMax) {
  if (!track || track.length === 0) return [];
  const mismatches = [];
  const swRanges = track.map((e, i) => ({ startTime: e.time, endTime: track[i + 1]?.time ?? e.time + 0.5, sw: e.params?.SW ?? 0, phoneme: e.phoneme ?? "" }));
  const findSwAt = (time) => { for (let i = swRanges.length - 1; i >= 0; i--) if (time >= swRanges[i].startTime) return swRanges[i]; return swRanges[0]; };

  const cascadeMax = telemetryMax.get?.("cascade-out");
  if (cascadeMax?.rmsTime != null) {
    const range = findSwAt(cascadeMax.rmsTime);
    if (range?.sw === 1 && cascadeMax.rms > 0.001) mismatches.push(`!! cascade-out max @${cascadeMax.rmsTime.toFixed(3)}s during ${range.phoneme} (SW=1)`);
  }
  const parallelMax = telemetryMax.get?.("parallel-out");
  if (parallelMax?.rmsTime != null) {
    const range = findSwAt(parallelMax.rmsTime);
    if (range?.sw === 0 && parallelMax.rms > 0.001) mismatches.push(`!! parallel-out max @${parallelMax.rmsTime.toFixed(3)}s during ${range.phoneme} (SW=0)`);
  }
  return mismatches;
}

export function formatTelemetry(telemetry, telemetryMax) {
  if (!telemetry || telemetry.size === 0) return ["(no telemetry)"];
  return Array.from(telemetry.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([node, data]) => {
    const parts = [];
    if (data.f0 != null || data.rd != null) parts.push(`f0=${data.f0?.toFixed(2) ?? "n/a"} rd=${data.rd?.toFixed(2) ?? "n/a"}`);
    if (data.freq != null) parts.push(`f=${data.freq.toFixed(1)} bw=${data.bw?.toFixed(1) ?? "n/a"}`);
    const max = telemetryMax?.get?.(node);
    let maxSuffix = max ? ` | max rms=${formatLevel(max.rms)}@${max.rmsTime?.toFixed(3) ?? "?"}s` : "";
    return `${node}: rms=${formatLevel(data.rms)} peak=${formatLevel(data.peak)}${parts.length ? " " + parts.join(" ") : ""}${maxSuffix}`;
  });
}

export function formatMeters(meters, meterMax) {
  if (!meters || meters.size === 0) return ["(no meters)"];
  return Array.from(meters.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([node, data]) => {
    const max = meterMax?.get?.(node);
    const suffix = max ? ` | max rms=${formatLevel(max.rms)}@${max.rmsTime?.toFixed(3) ?? "?"}s` : "";
    return `${node}: rms=${formatLevel(data.rms)} peak=${formatLevel(data.peak)}${suffix}`;
  });
}
