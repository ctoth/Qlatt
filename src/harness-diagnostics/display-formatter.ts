// Display formatter — takes check results, state, and display config sections,
// and produces formatted text output. Each section is dispatched by its `source` type.

import type {
  DisplayConfig,
  DisplaySection,
  CheckResult,
  CheckStatus,
  RunInfo,
  TrackEvent,
} from "./types";
import {
  summarizeTrack,
  formatTelemetry,
  formatMeters,
  formatPlstepEventsRelative,
  collectParamRange,
  formatRange,
  summarizeParallel,
  summarizeLfMode,
  analyzeTrackGains,
  findTimingMismatches,
  findVoicingIssues,
} from "../track-analysis";

/** State bag passed to formatters — everything they might need. */
export interface DisplayState {
  run: RunInfo | null;
  checkResults: Map<string, CheckResult>;
  telemetry: Map<string, any>;
  telemetryMax: Map<string, any>;
  meterValues: Map<string, any>;
  meterMax: Map<string, any>;
  plstepEvents: any[];
  plstepTotalCount: number;
  playHistory: any[];
  sessionId: number;
  sliderParams: Record<string, number>;
  sampleRate: number;
}

const STATUS_PREFIX: Record<CheckStatus, string> = {
  pass: "[OK]",
  warn: "[!!]",
  fail: "[FAIL]",
  skip: "[SKIP]",
  pending: "[...]",
};

function getCheckPrefix(result: CheckResult): string {
  if (result.assertionFailed && result.severity === "info" && result.status === "pass") {
    return "[INFO]";
  }
  return STATUS_PREFIX[result.status] ?? "[?]";
}

function extractPassSummary(message: string): string {
  const match = /\([^()]+\)\s*$/.exec(message);
  return match ? ` ${match[0].trim()}` : "";
}

/**
 * Format all configured display sections into a single string.
 * Sections appear in config order, separated by blank lines.
 */
export function formatDisplay(config: DisplayConfig, state: DisplayState): string {
  const blocks: string[] = [];
  for (const section of config.sections) {
    const lines = formatSection(section, state);
    if (lines.length > 0) {
      blocks.push(lines.join("\n"));
    }
  }
  return blocks.join("\n\n");
}

/**
 * Format a single section. Returns array of lines (no trailing newline).
 * Returns empty array if the section source is unrecognized.
 */
export function formatSection(section: DisplaySection, state: DisplayState): string[] {
  switch (section.source) {
    case "session_info":
      return formatSessionInfo(state);
    case "track_summary":
      return formatTrackSummary(state);
    case "check_results":
      return formatCheckResults(state);
    case "formant_tracking":
      return formatFormantTracking(state);
    case "signal_flow":
      return formatSignalFlow(state);
    case "worklet_telemetry":
      return formatWorkletTelemetry(state);
    case "meter_readings":
      return formatMeterReadings(state);
    case "gain_derivation":
      return formatGainDerivation(state);
    case "plstep_events":
      return formatPlstepEvents(state);
    case "track_events":
      return formatTrackEvents(section, state);
    case "voicing_issues":
      return formatVoicingIssues(state);
    case "play_history":
      return formatPlayHistory(state);
    default:
      return [];
  }
}

function formatSessionInfo(state: DisplayState): string[] {
  const lines: string[] = [];
  lines.push(`Session #${state.sessionId}`);
  if (state.run) {
    lines.push(`Phrase: ${state.run.phrase}`);
    lines.push(`Base F0: ${state.run.baseF0} Hz`);
  }
  return lines;
}

function formatTrackSummary(state: DisplayState): string[] {
  if (!state.run || !state.run.track || state.run.track.length === 0) {
    return ["(no track data)"];
  }
  const summary = summarizeTrack(state.run.track);
  return [
    `Events: ${summary.events}`,
    `Total time: ${summary.totalTime.toFixed(3)}s`,
    `Voiced events: ${summary.voicedEvents}`,
    `F0 range: ${summary.f0Min.toFixed(1)} - ${summary.f0Max.toFixed(1)} Hz`,
  ];
}

function formatCheckResults(state: DisplayState): string[] {
  const lines: string[] = [];
  for (const [, result] of state.checkResults) {
    const prefix = getCheckPrefix(result);
    const valueKey = result.valueLabel ?? "value";
    const valueSuffix = result.value !== undefined ? ` (${valueKey}=${result.value})` : "";
    if (result.status === "skip") {
      lines.push(`${prefix} ${result.name}`);
    } else if (result.status === "pending") {
      lines.push(`${prefix} ${result.name}`);
    } else if (!result.assertionFailed && result.status === "pass") {
      lines.push(`${prefix} ${result.name}${extractPassSummary(result.message)}${valueSuffix}`);
    } else {
      lines.push(`${prefix} ${result.name}: ${result.message}${valueSuffix}`);
    }
  }
  return lines;
}

function formatWorkletTelemetry(state: DisplayState): string[] {
  const lines = formatTelemetry(state.telemetry, state.telemetryMax);
  if (lines.length === 1 && lines[0] === "(no telemetry)") {
    return lines;
  }
  return ["(raw worklet telemetry; use for timing/trends, not direct check thresholds)", ...lines];
}

function formatFormantTracking(state: DisplayState): string[] {
  const track = state.run?.track;
  if (!track || track.length === 0) return ["(no track data)"];
  const f1 = collectParamRange(track, "F1", 500);
  const f2 = collectParamRange(track, "F2", 1500);
  const f3 = collectParamRange(track, "F3", 2500);
  const b1 = collectParamRange(track, "B1", 100);
  const b2 = collectParamRange(track, "B2", 100);
  const b3 = collectParamRange(track, "B3", 100);
  return [
    `F1 range: ${formatRange(f1, 1)} Hz`,
    `F2 range: ${formatRange(f2, 1)} Hz`,
    `F3 range: ${formatRange(f3, 1)} Hz`,
    `Bandwidths: B1 ${formatRange(b1, 1)} | B2 ${formatRange(b2, 1)} | B3 ${formatRange(b3, 1)} Hz`,
  ];
}

function formatSignalFlow(state: DisplayState): string[] {
  const track = state.run?.track;
  if (!track || track.length === 0) return ["(no track data)"];
  const parallel = summarizeParallel(track);
  const lfMode = summarizeLfMode(track, Math.round(Number(state.sliderParams.lfMode ?? 0)));
  const timing = findTimingMismatches(track, state.telemetryMax);
  const lfSummary = Object.entries(lfMode.seconds)
    .filter(([, seconds]) => Number.isFinite(seconds) && seconds > 0)
    .map(([mode, seconds]) => `lfMode${mode}=${seconds.toFixed(3)}s`)
    .join(" ");

  return [
    `SW=1: ${parallel.swOn} frames, ${parallel.swOnSeconds.toFixed(3)}s (${parallel.swOnShare.toFixed(1)}%)`,
    `Parallel-marked events: ${parallel.parallelEvents}; SW=0 frames: ${parallel.swOff}`,
    lfSummary ? `LF modes: ${lfSummary}` : "LF modes: none observed",
    ...(timing.length > 0 ? timing : ["No branch timing mismatches detected"]),
  ];
}

function formatMeterReadings(state: DisplayState): string[] {
  return formatMeters(state.meterValues, state.meterMax);
}

function formatGainDerivation(state: DisplayState): string[] {
  const track = state.run?.track;
  if (!track || track.length === 0) return ["(no track data)"];
  const analysis = analyzeTrackGains(track, state.sliderParams, state.sampleRate || 48000);
  if (!analysis) return ["(no gain data)"];
  const { ranges, warnings, parallelScale } = analysis;
  return [
    `voiceGain: ${formatRange(ranges.voiceGain, 6)} | aspGain: ${formatRange(ranges.aspGain, 6)} | fricGain: ${formatRange(ranges.fricGain, 6)}`,
    `parallelVoice: ${formatRange(ranges.parallelVoiceGain, 6)} | parallelFormant: ${formatRange(ranges.parallelFormantGain, 6)} | bypass: ${formatRange(ranges.parallelBypassGain, 6)}`,
    `masterGain: ${formatRange(ranges.masterGain, 6)} | mix: ${formatRange(ranges.mix, 3)} | parallelScale=${parallelScale.toFixed(3)}`,
    ...(warnings.length > 0 ? warnings : ["No gain anomalies detected"]),
  ];
}

function formatPlstepEvents(state: DisplayState): string[] {
  const startTime = state.run?.startTime ?? 0;
  const lines = formatPlstepEventsRelative(state.plstepEvents, startTime);
  if (state.plstepTotalCount > 0) {
    lines.unshift(`PLSTEP events: ${state.plstepEvents.length} of ${state.plstepTotalCount} total`);
  }
  return lines;
}

function formatTrackEvents(section: DisplaySection, state: DisplayState): string[] {
  if (!state.run || !state.run.track || state.run.track.length === 0) {
    return ["(no track events)"];
  }
  const track = state.run.track;
  let events: TrackEvent[];

  if (section.range) {
    const [start, end] = section.range;
    if (start < 0) {
      // Negative start: take last N events
      events = track.slice(start);
    } else if (end !== null && end !== undefined) {
      // [0, N]: take first N events
      events = track.slice(start, start + end);
    } else {
      events = track.slice(start);
    }
  } else {
    events = track;
  }

  return events.map((e) => {
    const time = e.time.toFixed(3);
    const phoneme = e.phoneme ?? "";
    const params = e.params ?? {};
    const paramStr = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== 0)
      .map(([k, v]) => `${k}=${v}`)
      .join(" ");
    return `${time} ${phoneme} ${paramStr}`.trimEnd();
  });
}

function formatVoicingIssues(state: DisplayState): string[] {
  const track = state.run?.track;
  if (!track || track.length === 0) return ["(no track data)"];
  const issues = findVoicingIssues(track, state.sliderParams);
  return issues.length > 0 ? issues : ["No voicing inconsistencies detected"];
}

function formatPlayHistory(state: DisplayState): string[] {
  if (!state.playHistory || state.playHistory.length === 0) {
    return ["(no play history)"];
  }
  return state.playHistory.map((entry, i) => {
    const phrase = entry.phrase ?? "?";
    const time = entry.time !== undefined ? ` @${entry.time}` : "";
    return `${i + 1}. "${phrase}"${time}`;
  });
}
