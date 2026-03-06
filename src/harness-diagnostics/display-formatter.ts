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
import { summarizeTrack, formatTelemetry, formatMeters, formatPlstepEventsRelative } from "../track-analysis";

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
}

const STATUS_PREFIX: Record<CheckStatus, string> = {
  pass: "[OK]",
  warn: "[!!]",
  fail: "[FAIL]",
  skip: "[SKIP]",
  pending: "[...]",
};

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
      return ["(formant tracking not yet implemented)"];
    case "signal_flow":
      return ["(signal flow not yet implemented)"];
    case "worklet_telemetry":
      return formatWorkletTelemetry(state);
    case "meter_readings":
      return formatMeterReadings(state);
    case "gain_derivation":
      return ["(gain derivation not yet implemented)"];
    case "plstep_events":
      return formatPlstepEvents(state);
    case "track_events":
      return formatTrackEvents(section, state);
    case "voicing_issues":
      return ["(voicing issues not yet implemented)"];
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
    const prefix = STATUS_PREFIX[result.status] ?? "[?]";
    const valueSuffix = result.value !== undefined ? ` (value=${result.value})` : "";
    if (result.status === "skip") {
      lines.push(`${prefix} ${result.name}`);
    } else if (result.status === "pending") {
      lines.push(`${prefix} ${result.name}`);
    } else {
      lines.push(`${prefix} ${result.name}: ${result.message}${valueSuffix}`);
    }
  }
  return lines;
}

function formatWorkletTelemetry(state: DisplayState): string[] {
  return formatTelemetry(state.telemetry, state.telemetryMax);
}

function formatMeterReadings(state: DisplayState): string[] {
  return formatMeters(state.meterValues, state.meterMax);
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
