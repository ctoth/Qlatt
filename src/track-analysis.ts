// Track analysis module for Qlatt TTS diagnostics
// Extracted from test-harness.html for maintainability

import { expandFormantBanks } from "./formant-bank";
import type { BaconGraph } from "./klatt-runtime";
import { createConfiguredEvaluator } from "./semantics/evaluator-factory";
import type { ParamValue, SemanticsDocument } from "./semantics/types";
import { loadYamlDocumentSync } from "./yaml-loader";

type Range = { min: number; max: number };
type TrackNumeric = number | bigint | undefined;
type TrackParams = Record<string, TrackNumeric>;
type TrackEvent = { time: number; phoneme?: string; params?: TrackParams };
type TelemetryLike = { get?: (key: string) => unknown } | null | undefined;
export type TelemetryDatum = {
  [key: string]: unknown;
  rms: number;
  peak?: number;
  rmsTime?: number;
  f0?: number;
  rd?: number;
  freq?: number;
  bw?: number;
};
export type PlstepEvent = {
  [key: string]: unknown;
  scheduledRelTime?: number;
  relTime?: number;
  time?: number;
  amplitudeLinear?: number;
  amplitudeDb?: number;
  trigger?: string;
  delta?: number;
  phoneme?: string;
};
type StopReleaseExpected = {
  dur: number;
  label: string;
  AF?: number;
  AH?: number;
  AV?: number;
  AB?: number;
  A1?: number;
  A2?: number;
  A3?: number;
  A4?: number;
  A5?: number;
  A6?: number;
};
type StopReleaseActual = Record<
  | "AF"
  | "AH"
  | "AV"
  | "AVS"
  | "A1"
  | "A2"
  | "A3"
  | "A4"
  | "A5"
  | "A6"
  | "AB"
  | "F1"
  | "F2"
  | "F3"
  | "SW",
  number
>;
type StopReleaseAnalysis = {
  time: number;
  phoneme: string;
  duration: string;
  expected?: StopReleaseExpected;
  actual: StopReleaseActual;
  plstepTriggered: boolean;
  plstepAmp?: number;
  issues: string[];
};
type TrackGainRanges = Record<
  | "voiceGain"
  | "aspGain"
  | "fricGain"
  | "parallelVoiceGain"
  | "parallelBypassGain"
  | "parallelFormantGain"
  | "parallelNasalGain"
  | "masterGain"
  | "mix",
  Range | null
>;

function isPlstepEvent(value: unknown): value is PlstepEvent {
  return typeof value === "object" && value !== null;
}

function isTelemetryDatum(value: unknown): value is TelemetryDatum {
  if (typeof value !== "object" || value === null) return false;
  const datum = value as Record<string, unknown>;
  return typeof datum.rms === "number";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === "bigint") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getParam(params: TrackParams | undefined, key: string, fallback = 0): number {
  return toFiniteNumber(params?.[key], fallback);
}

type TrackReference = {
  citations: string[];
  targets: Record<string, StopReleaseExpected>;
  conformance: Record<
    | "durationToleranceMs"
    | "amplitudeToleranceDb"
    | "plstepWindowSeconds"
    | "plstepAfGateDb"
    | "maxVoicingIssues"
    | "lowParallelScale"
    | "lowParallelGain",
    { value: number; basis: string }
  >;
};
const reference = loadYamlDocumentSync<TrackReference>(
  "/experiments/klatt80-baseline/reference/table-iii.yaml",
);
export const KLATT80_EXPECTED = reference.targets;
const conformance = reference.conformance;

// Analyze stop releases in track
export function analyzeStopReleases(
  track: TrackEvent[],
  plstepEvents: unknown[] = [],
  runStartTime = 0,
): StopReleaseAnalysis[] {
  const releases: StopReleaseAnalysis[] = [];
  const isStopRelease = (ph: string | undefined): ph is string =>
    ph?.includes("_REL") || ph?.includes("_ASP") || false;

  for (let i = 0; i < track.length; i++) {
    const event = track[i];
    const phoneme = event.phoneme;
    if (!isStopRelease(phoneme)) continue;

    const nextEvent = track[i + 1];
    const duration = nextEvent ? (nextEvent.time - event.time) * 1000 : 0;
    const expected = phoneme ? KLATT80_EXPECTED[phoneme] : undefined;
    const p = event.params || {};

    const plstepMatch = plstepEvents.find((candidate): candidate is PlstepEvent => {
      if (!isPlstepEvent(candidate)) return false;
      const plTime = isFiniteNumber(candidate.scheduledRelTime)
        ? candidate.scheduledRelTime
        : isFiniteNumber(candidate.relTime)
          ? candidate.relTime
          : toFiniteNumber(candidate.time) - runStartTime;
      return Math.abs(plTime - event.time) < conformance.plstepWindowSeconds.value;
    });

    const release: StopReleaseAnalysis = {
      time: event.time,
      phoneme,
      duration: duration.toFixed(1),
      expected,
      actual: {
        AF: getParam(p, "AF"),
        AH: getParam(p, "AH"),
        AV: getParam(p, "AV"),
        AVS: getParam(p, "AVS"),
        A1: getParam(p, "A1"),
        A2: getParam(p, "A2"),
        A3: getParam(p, "A3"),
        A4: getParam(p, "A4"),
        A5: getParam(p, "A5"),
        A6: getParam(p, "A6"),
        AB: getParam(p, "AB"),
        F1: getParam(p, "F1"),
        F2: getParam(p, "F2"),
        F3: getParam(p, "F3"),
        SW: getParam(p, "SW"),
      },
      plstepTriggered: !!plstepMatch,
      plstepAmp: plstepMatch?.amplitudeLinear,
      issues: [],
    };

    if (expected) {
      if (Math.abs(duration - expected.dur) > conformance.durationToleranceMs.value) {
        release.issues.push(`dur: ${duration.toFixed(0)}ms vs expected ${expected.dur}ms`);
      }
      const af = getParam(p, "AF");
      const ah = getParam(p, "AH");
      const a3 = getParam(p, "A3");
      if (expected.AF && Math.abs(af - expected.AF) > conformance.amplitudeToleranceDb.value) {
        release.issues.push(`AF: ${af} vs expected ${expected.AF}`);
      }
      if (expected.AH && Math.abs(ah - expected.AH) > conformance.amplitudeToleranceDb.value) {
        release.issues.push(`AH: ${ah} vs expected ${expected.AH}`);
      }
      if (expected.A3 && Math.abs(a3 - expected.A3) > conformance.amplitudeToleranceDb.value) {
        release.issues.push(`A3: ${a3} vs expected ${expected.A3}`);
      }
    }
    if ((p.AF ?? 0) > conformance.plstepAfGateDb.value && !plstepMatch) {
      release.issues.push("NO PLSTEP (AF should trigger burst)");
    }
    releases.push(release);
  }
  return releases;
}

export function formatStopReleases(releases: StopReleaseAnalysis[] | null | undefined): string[] {
  if (!releases || releases.length === 0) return ["(no stop releases in track)"];
  const lines = [];
  lines.push(
    "TIME     PHONEME   DUR    F1   F2    F3    SW  AF   AH   AV   A1-A6            AB   PLSTEP   ISSUES",
  );
  lines.push(
    "-------  --------  -----  ---  ----  ----  --  ---  ---  ---  ---------------  ---  -------  ------",
  );
  for (const r of releases) {
    const a = r.actual;
    const a16 = `${a.A1.toString().padStart(2)} ${a.A2.toString().padStart(2)} ${a.A3.toString().padStart(2)} ${a.A4.toString().padStart(2)} ${a.A5.toString().padStart(2)} ${a.A6.toString().padStart(2)}`;
    const plstep = r.plstepTriggered ? `YES ${(r.plstepAmp ?? 0).toFixed(2)}` : "NO";
    const issues = r.issues.length > 0 ? `!! ${r.issues.join(", ")}` : "OK";
    lines.push(
      `${r.time.toFixed(3)}  ${r.phoneme.padEnd(8)}  ${r.duration.padStart(5)}ms  ${a.F1.toString().padStart(3)}  ${a.F2.toString().padStart(4)}  ${a.F3.toString().padStart(4)}  ${a.SW}   ${a.AF.toString().padStart(3)}  ${a.AH.toString().padStart(3)}  ${a.AV.toString().padStart(3)}  ${a16}  ${a.AB.toString().padStart(3)}  ${plstep.padEnd(7)}  ${issues}`,
    );
  }
  return lines;
}

export function buildTimeline(track: TrackEvent[]): string[] {
  if (!track || track.length === 0) return ["(no events)"];
  const lines = [];
  lines.push("TIME     PHONEME   DUR   BRANCH     SOURCES                    PARALLEL FORMANTS");
  lines.push("-------  --------  ----  ---------  -------------------------  -----------------");
  for (let i = 0; i < track.length; i += 1) {
    const event = track[i];
    const nextEvent = track[i + 1];
    const dur = nextEvent ? ((nextEvent.time - event.time) * 1000).toFixed(0) : "?";
    const sw = getParam(event.params, "SW");
    const branch = sw === 1 ? "PARALLEL" : "CASCADE ";
    const time = event.time.toFixed(3);
    const phoneme = (event.phoneme ?? "").padEnd(8);
    const sources: string[] = [];
    const params = event.params ?? {};
    const av = getParam(params, "AV");
    const avs = getParam(params, "AVS");
    const af = getParam(params, "AF");
    const ah = getParam(params, "AH");
    if (av > 0) sources.push(`AV=${av.toFixed(0)}`);
    if (avs > 0) sources.push(`AVS=${avs.toFixed(0)}`);
    if (af > 0) sources.push(`AF=${af.toFixed(0)}`);
    if (ah > 0) sources.push(`AH=${ah.toFixed(0)}`);
    let parallelInfo = "";
    if (sw === 1) {
      const a1 = getParam(params, "A1"),
        a2 = getParam(params, "A2");
      const a3 = getParam(params, "A3"),
        a4 = getParam(params, "A4");
      const a5 = getParam(params, "A5"),
        a6 = getParam(params, "A6");
      const ab = getParam(params, "AB");
      if (a1 > 0 || a2 > 0 || a3 > 0 || a4 > 0 || a5 > 0 || a6 > 0 || ab > 0) {
        parallelInfo = `A=${a1}/${a2}/${a3}/${a4}/${a5}/${a6}`;
        if (ab > 0) parallelInfo += ` AB=${ab}`;
      } else {
        parallelInfo = "(no An)";
      }
    }
    lines.push(
      `${time}  ${phoneme}  ${dur.padStart(4)}  ${branch}  ${(sources.join(" ") || "(silent)").padEnd(25)}  ${parallelInfo}`,
    );
  }
  return lines;
}

export function summarizeTrack(track: TrackEvent[]): {
  events: number;
  totalTime: number;
  voicedEvents: number;
  f0Min: number;
  f0Max: number;
} {
  const totalTime = track.length ? track[track.length - 1].time : 0;
  const voiced = track.filter((e) => getParam(e.params, "AV") > 0 || getParam(e.params, "AVS") > 0);
  const f0Values = track.map((e) => getParam(e.params, "F0")).filter((v) => v > 0);
  return {
    events: track.length,
    totalTime,
    voicedEvents: voiced.length,
    f0Min: f0Values.length ? Math.min(...f0Values) : 0,
    f0Max: f0Values.length ? Math.max(...f0Values) : 0,
  };
}

export function summarizeParallel(track: TrackEvent[]): {
  swOn: number;
  swOff: number;
  parallelEvents: number;
  swOnSeconds: number;
  swOnShare: number;
} {
  let swOn = 0,
    swOff = 0,
    parallelEvents = 0,
    swOnSeconds = 0,
    swTotalSeconds = 0;
  for (const event of track) {
    const params = event.params;
    if (!params) continue;
    const sw = getParam(params, "SW", Number.NaN);
    if (sw === 1) swOn += 1;
    else if (Number.isFinite(sw)) swOff += 1;
    const hasParallel =
      getParam(params, "AN") > 0 ||
      getParam(params, "AB") > 0 ||
      ["A1", "A2", "A3", "A4", "A5", "A6"].some((key) => getParam(params, key) > 0) ||
      getParam(params, "AVS") > 0 ||
      getParam(params, "AF") > 0;
    if (hasParallel) parallelEvents += 1;
  }
  for (let i = 0; i < track.length - 1; i += 1) {
    const params = track[i]?.params;
    const duration = track[i + 1].time - track[i].time;
    if (!Number.isFinite(duration) || duration <= 0) continue;
    const sw = getParam(params, "SW", Number.NaN);
    if (Number.isFinite(sw)) {
      swTotalSeconds += duration;
      if (sw === 1) swOnSeconds += duration;
    }
  }
  return {
    swOn,
    swOff,
    parallelEvents,
    swOnSeconds,
    swOnShare: swTotalSeconds > 0 ? (swOnSeconds / swTotalSeconds) * 100 : 0,
  };
}

export function summarizeLfMode(
  track: TrackEvent[],
  fallbackMode = 0,
): { counts: Record<number, number>; seconds: Record<number, number> } {
  const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
  const seconds: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
  let current = Number.isFinite(fallbackMode) ? Math.round(fallbackMode) : 0;
  for (let i = 0; i < track.length; i += 1) {
    const event = track[i];
    const lfMode = getParam(event.params, "lfMode", Number.NaN);
    if (Number.isFinite(lfMode)) current = Math.round(lfMode);
    counts[current] = (counts[current] || 0) + 1;
    const duration = i < track.length - 1 ? track[i + 1].time - event.time : 0;
    if (Number.isFinite(duration) && duration > 0)
      seconds[current] = (seconds[current] || 0) + duration;
  }
  return { counts, seconds };
}

export function collectParamRange(
  track: TrackEvent[],
  key: string,
  fallback: number,
): Range | null {
  let min = Infinity,
    max = -Infinity,
    current = fallback;
  for (const event of track) {
    const next = getParam(event?.params, key, Number.NaN);
    if (Number.isFinite(next)) current = next;
    if (Number.isFinite(current)) {
      min = Math.min(min, current);
      max = Math.max(max, current);
    }
  }
  return !Number.isFinite(min) || !Number.isFinite(max) ? null : { min, max };
}

export function findVoicingIssues(
  track: TrackEvent[],
  fallback: Partial<Record<string, number>> | undefined,
): string[] {
  const issues: string[] = [];
  const state: Record<string, number> = {
    F0: fallback?.F0 ?? 0,
    AV: fallback?.AV ?? 0,
    AVS: fallback?.AVS ?? 0,
    AF: fallback?.AF ?? 0,
    AH: fallback?.AH ?? 0,
  };
  for (let i = 0; i < track.length && issues.length < conformance.maxVoicingIssues.value; i += 1) {
    const event = track[i];
    if (event?.params) {
      for (const key of Object.keys(state)) {
        const value = getParam(event.params, key, Number.NaN);
        if (Number.isFinite(value)) state[key] = value;
      }
    }
    const voiced = (state.AV ?? 0) > 0 || (state.AVS ?? 0) > 0;
    const noise = (state.AF ?? 0) > 0 || (state.AH ?? 0) > 0;
    const f0 = state.F0 ?? 0;
    if (voiced && f0 <= 0)
      issues.push(`t=${event.time.toFixed(3)} ${event.phoneme ?? ""} voiced but F0=0`);
    else if (f0 > 0 && !voiced && !noise)
      issues.push(`t=${event.time.toFixed(3)} ${event.phoneme ?? ""} F0>0 but no AV/AVS/AF/AH`);
  }
  return issues;
}

export function findSwAtTime(
  track: TrackEvent[],
  time: number,
): { sw: number; phoneme: string } | null {
  if (!track || track.length === 0 || !Number.isFinite(time)) return null;
  for (let i = track.length - 1; i >= 0; i--)
    if (time >= track[i].time)
      return { sw: Number(track[i].params?.SW ?? 0), phoneme: track[i].phoneme ?? "" };
  return { sw: Number(track[0]?.params?.SW ?? 0), phoneme: track[0]?.phoneme ?? "" };
}

export function findPhonemeAtTime(track: TrackEvent[], time: number): string {
  if (!track || track.length === 0) return "?";
  for (let i = track.length - 1; i >= 0; i--)
    if (track[i].time <= time) return track[i].phoneme || "?";
  return track[0]?.phoneme || "?";
}

// Formatting helpers
export function formatLevel(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (value === 0) return "0";
  return Math.abs(value) < 1e-6 ? value.toExponential(2) : value.toFixed(6);
}

export function formatRange(range: Range | null, digits = 1): string {
  return range ? `${range.min.toFixed(digits)} - ${range.max.toFixed(digits)}` : "n/a";
}

export function formatMaxContext(time: number, phoneme?: string): string {
  if (!Number.isFinite(time)) return "";
  return ` @${time.toFixed(3)}s${phoneme ? ` ${phoneme}` : ""}`;
}

export function formatPlstepEventsRelative(
  list: unknown[] | null | undefined,
  runStart: number,
): string[] {
  if (!list || list.length === 0) return ["(none)"];
  return list.map((value) => {
    if (!isPlstepEvent(value)) return "burst (invalid event)";
    const evt = value;
    let relTime = "n/a";
    if (typeof evt.scheduledRelTime === "number" && Number.isFinite(evt.scheduledRelTime))
      relTime = evt.scheduledRelTime.toFixed(3);
    else if (typeof evt.relTime === "number" && Number.isFinite(evt.relTime))
      relTime = evt.relTime.toFixed(3);
    else if (typeof evt.time === "number" && Number.isFinite(evt.time) && Number.isFinite(runStart))
      relTime = (evt.time - runStart).toFixed(3);
    const amp =
      typeof evt.amplitudeLinear === "number" && Number.isFinite(evt.amplitudeLinear)
        ? evt.amplitudeLinear.toFixed(4)
        : "n/a";
    const db =
      typeof evt.amplitudeDb === "number" && Number.isFinite(evt.amplitudeDb)
        ? evt.amplitudeDb.toFixed(0)
        : "n/a";
    const delta =
      typeof evt.delta === "number" && Number.isFinite(evt.delta)
        ? `+${evt.delta.toFixed(0)}dB`
        : "";
    return `burst t=${relTime}s amp=${amp} (${db}dB) trigger=${evt.trigger || "?"}${delta}${evt.phoneme ? ` [${evt.phoneme}]` : ""}`;
  });
}

// Re-export dbToLinear from builtin-functions for backwards compatibility
export { dbToLinear } from "./builtin-functions";

export function updateRange(range: Range | null, value: number): Range | null {
  if (!Number.isFinite(value)) return range;
  if (!range) return { min: value, max: value };
  range.min = Math.min(range.min, value);
  range.max = Math.max(range.max, value);
  return range;
}

let baselineSemantics: SemanticsDocument | undefined;

function getBaselineSemantics(): SemanticsDocument {
  if (!baselineSemantics) {
    const semantics = loadYamlDocumentSync<SemanticsDocument>(
      "/experiments/klatt80-baseline/semantics.yaml",
    );
    const graph = loadYamlDocumentSync<BaconGraph>("/experiments/klatt80-baseline/graph.yaml");
    expandFormantBanks(graph, semantics);
    baselineSemantics = semantics;
  }
  return baselineSemantics;
}

/** Report magnitudes from the selected experiment's expanded realization rules. */
export function analyzeTrackGains(
  track: TrackEvent[],
  synthParams: Record<string, TrackNumeric>,
  sampleRate = 48000,
  semantics: SemanticsDocument = getBaselineSemantics(),
): { ranges: TrackGainRanges; warnings: string[]; parallelScale: number } | null {
  if (!track || track.length === 0) return null;
  const ranges: TrackGainRanges = {
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
  const { topoEvaluator } = createConfiguredEvaluator();
  const state: Record<string, ParamValue> = {};
  for (const [name, definition] of Object.entries(semantics.params ?? {})) {
    if (definition.default !== undefined) state[name] = definition.default;
  }
  const overlay = (params: Record<string, TrackNumeric>) => {
    for (const [name, value] of Object.entries(params)) {
      if (value !== undefined && Number.isFinite(Number(value))) state[name] = Number(value);
    }
  };
  overlay(synthParams);
  const warnings = new Set<string>();
  let parallelScale = toFiniteNumber(state.parallelScale, 1);
  const gainNames = {
    voiceGain: "voiceGain",
    aspGain: "aspGain",
    fricGain: "fricGainScaled",
    parallelVoiceGain: "avsGain",
    parallelBypassGain: "abGainScaled",
    parallelNasalGain: "anGainScaled",
    masterGain: "masterGain",
    mix: "parallelVoiceGain",
  } as const;
  const formantNames = Object.keys(semantics.realize ?? {}).filter((name) =>
    /^a[0-9]+Linear$/.test(name),
  );
  for (const event of track) {
    overlay(event.params ?? {});
    // As in the interpreter, isolate nested constants from CEL collection-macro mutation.
    const result = topoEvaluator.evaluate(semantics, {
      params: { ...structuredClone(semantics.constants ?? {}), ...state, sampleRate } as Record<
        string,
        ParamValue
      >,
      constants: semantics.constants ?? {},
    });
    for (const error of result.errors) {
      warnings.add(`Semantics error in ${error.name}: ${error.error}`);
    }
    const recordGain = (rangeName: keyof TrackGainRanges, name: string) => {
      const value = result.values[name];
      if (typeof value === "number" && Number.isFinite(value)) {
        ranges[rangeName] = updateRange(ranges[rangeName], Math.abs(value));
      } else {
        warnings.add(`Gain value unavailable: ${name}`);
      }
    };
    for (const [rangeName, name] of Object.entries(gainNames)) {
      recordGain(rangeName as keyof typeof gainNames, name);
    }
    for (const name of formantNames) recordGain("parallelFormantGain", name);
    if (formantNames.length === 0) warnings.add("No realized parallel formant gains");
    parallelScale = toFiniteNumber(result.values.parallelScale, parallelScale);
  }
  if (parallelScale > 0 && parallelScale < conformance.lowParallelScale.value)
    warnings.add(`parallelScale=${parallelScale.toFixed(3)} very low`);
  if (
    (ranges.mix?.max ?? 0) > 0 &&
    (ranges.parallelVoiceGain?.max ?? 0) < conformance.lowParallelGain.value &&
    (ranges.fricGain?.max ?? 0) < conformance.lowParallelGain.value
  )
    warnings.add(`Parallel gains < ${conformance.lowParallelGain.value}`);
  return { ranges, warnings: [...warnings], parallelScale };
}

export function findTimingMismatches(track: TrackEvent[], telemetryMax: TelemetryLike): string[] {
  if (!track || track.length === 0) return [];
  const mismatches = [];
  const swRanges = track.map((e, i) => ({
    startTime: e.time,
    endTime: track[i + 1]?.time ?? e.time + 0.5,
    sw: e.params?.SW ?? 0,
    phoneme: e.phoneme ?? "",
  }));
  const findSwAt = (time: number) => {
    for (let i = swRanges.length - 1; i >= 0; i--)
      if (time >= swRanges[i].startTime) return swRanges[i];
    return swRanges[0] ?? { startTime: 0, endTime: 0, sw: 0, phoneme: "" };
  };

  const cascadeMax = telemetryMax?.get?.("cascade-out");
  if (isTelemetryDatum(cascadeMax) && cascadeMax.rmsTime != null) {
    const range = findSwAt(cascadeMax.rmsTime);
    if (range?.sw === 1 && cascadeMax.rms > 0.001)
      mismatches.push(
        `!! cascade-out max @${cascadeMax.rmsTime.toFixed(3)}s during ${range.phoneme} (SW=1)`,
      );
  }
  const parallelMax = telemetryMax?.get?.("parallel-out");
  if (isTelemetryDatum(parallelMax) && parallelMax.rmsTime != null) {
    const range = findSwAt(parallelMax.rmsTime);
    if (range?.sw === 0 && parallelMax.rms > 0.001)
      mismatches.push(
        `!! parallel-out max @${parallelMax.rmsTime.toFixed(3)}s during ${range.phoneme} (SW=0)`,
      );
  }
  return mismatches;
}

export function formatTelemetry(
  telemetry: Map<string, unknown> | null | undefined,
  telemetryMax: TelemetryLike,
): string[] {
  if (!telemetry || telemetry.size === 0) return ["(no telemetry)"];
  return Array.from(telemetry.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([node, value]) => {
      if (!isTelemetryDatum(value)) return `${node}: invalid telemetry`;
      const data = value;
      const parts = [];
      if (data.f0 != null || data.rd != null)
        parts.push(`f0=${data.f0?.toFixed(2) ?? "n/a"} rd=${data.rd?.toFixed(2) ?? "n/a"}`);
      if (data.freq != null)
        parts.push(`f=${data.freq.toFixed(1)} bw=${data.bw?.toFixed(1) ?? "n/a"}`);
      const maxValue = telemetryMax?.get?.(node);
      const max = isTelemetryDatum(maxValue) ? maxValue : undefined;
      const maxSuffix = max
        ? ` | max rms=${formatLevel(max.rms)}@${max.rmsTime?.toFixed(3) ?? "?"}s`
        : "";
      return `${node}: rms=${formatLevel(data.rms)} peak=${formatLevel(toFiniteNumber(data.peak))}${parts.length ? " " + parts.join(" ") : ""}${maxSuffix}`;
    });
}

export function formatMeters(
  meters: Map<string, unknown> | null | undefined,
  meterMax: TelemetryLike,
): string[] {
  if (!meters || meters.size === 0) return ["(no meters)"];
  return Array.from(meters.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([node, value]) => {
      if (!isTelemetryDatum(value)) return `${node}: invalid meter`;
      const data = value;
      const maxValue = meterMax?.get?.(node);
      const max = isTelemetryDatum(maxValue) ? maxValue : undefined;
      const suffix = max
        ? ` | max rms=${formatLevel(max.rms)}@${max.rmsTime?.toFixed(3) ?? "?"}s`
        : "";
      return `${node}: rms=${formatLevel(data.rms)} peak=${formatLevel(toFiniteNumber(data.peak))}${suffix}`;
    });
}
