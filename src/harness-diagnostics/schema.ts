// Parse and validate diagnostics YAML config into DiagConfig.

import yaml from "js-yaml";
import type {
  CheckDef,
  DiagConfig,
  DisplayConfig,
  DisplaySection,
  PollConfig,
  TapDef,
} from "./types";

const VALID_MEASURES = new Set([
  "rms",
  "peak",
  "fft_peak_freq",
  "band_energy",
  "band_share",
  "band_ratio_db",
  "zcr",
  "rms_ratio_db",
]);
const VALID_CHECK_TYPES = new Set([
  "tap_check",
  "param_range",
  "event_check",
  "across_plays",
  "track_analysis",
]);
const VALID_SEVERITIES = new Set(["info", "warn", "error"]);
const VALID_AGGREGATES = new Set(["last", "max", "min"]);

export function parseDiagConfig(source: string): DiagConfig {
  const raw = yaml.load(source);
  if (!raw || typeof raw !== "object") {
    throw new Error("Diagnostics config must be a YAML mapping");
  }
  const doc = raw as Record<string, unknown>;

  const taps = parseTaps(doc.taps);
  const poll = parsePoll(doc.poll);
  const checks = parseChecks(doc.checks);
  const display = parseDisplay(doc.display);

  return { taps, poll, checks, display };
}

function parseTaps(raw: unknown): Record<string, TapDef> {
  if (!raw || typeof raw !== "object") {
    throw new Error("'taps' must be a mapping");
  }
  const result: Record<string, TapDef> = {};
  for (const [name, def] of Object.entries(raw as Record<string, unknown>)) {
    if (!def || typeof def !== "object") {
      throw new Error(`tap '${name}' must be a mapping`);
    }
    const d = def as Record<string, unknown>;
    if (d.node === undefined || d.node === null) {
      throw new Error(`tap '${name}' requires 'node'`);
    }
    const node = Array.isArray(d.node)
      ? d.node.map(String)
      : typeof d.node === "string"
        ? d.node
        : String(d.node);
    const tap: TapDef = { node };
    if (d.fftSize !== undefined) {
      tap.fftSize = Number(d.fftSize);
    }
    result[name] = tap;
  }
  return result;
}

function parsePoll(raw: unknown): PollConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("'poll' must be a mapping");
  }
  const d = raw as Record<string, unknown>;
  if (typeof d.interval_ms !== "number") {
    throw new Error("'poll.interval_ms' is required and must be a number");
  }
  return {
    interval_ms: d.interval_ms,
    guard_ms: typeof d.guard_ms === "number" ? d.guard_ms : 50,
  };
}

function parseChecks(raw: unknown): Record<string, CheckDef> {
  if (!raw || typeof raw !== "object") {
    throw new Error("'checks' must be a mapping");
  }
  const result: Record<string, CheckDef> = {};
  for (const [name, def] of Object.entries(raw as Record<string, unknown>)) {
    if (!def || typeof def !== "object") {
      throw new Error(`check '${name}' must be a mapping`);
    }
    const d = def as Record<string, unknown>;

    // Validate severity
    if (!d.severity || !VALID_SEVERITIES.has(d.severity as string)) {
      throw new Error(`check '${name}' requires severity (info|warn|error)`);
    }
    if (typeof d.message !== "string") {
      throw new Error(`check '${name}' requires a message string`);
    }
    if (!d.assert || typeof d.assert !== "object") {
      throw new Error(`check '${name}' requires an 'assert' mapping`);
    }

    // Validate measure if present
    if (d.measure && !VALID_MEASURES.has(d.measure as string)) {
      throw new Error(`check '${name}' has unknown measure '${d.measure}'`);
    }

    // Validate type if present
    const checkType = d.type as string | undefined;
    if (checkType && !VALID_CHECK_TYPES.has(checkType)) {
      throw new Error(`check '${name}' has unknown type '${checkType}'`);
    }
    if (d.aggregate && !VALID_AGGREGATES.has(d.aggregate as string)) {
      throw new Error(`check '${name}' has unknown aggregate '${d.aggregate}'`);
    }

    const check: CheckDef = {
      assert: d.assert as CheckDef["assert"],
      severity: d.severity as CheckDef["severity"],
      message: d.message,
    };

    if (d.tap !== undefined) check.tap = String(d.tap);
    if (Array.isArray(d.taps)) check.taps = d.taps.map(String);
    if (checkType) check.type = checkType as CheckDef["type"];
    if (d.when && typeof d.when === "object") check.when = d.when as CheckDef["when"];
    if (d.measure) check.measure = d.measure as CheckDef["measure"];
    if (d.measure_params && typeof d.measure_params === "object") {
      check.measure_params = d.measure_params as CheckDef["measure_params"];
    }
    if (d.aggregate) check.aggregate = d.aggregate as CheckDef["aggregate"];
    if (d.collect === true) check.collect = true;
    if (d.ignore_guard === true) check.ignore_guard = true;
    if (typeof d.max_collected === "number") check.max_collected = d.max_collected;
    if (typeof d.cooldown_ms === "number") check.cooldown_ms = d.cooldown_ms;
    if (typeof d.plays === "number") check.plays = d.plays;
    if (typeof d.param === "string") check.param = d.param;
    if (typeof d.event === "string") check.event = d.event;
    if (typeof d.field === "string") check.field = d.field;

    // track_analysis fields
    if (d.select && typeof d.select === "object") {
      check.select = d.select as CheckDef["select"];
    }
    if (typeof d.compute === "string") check.compute = d.compute;
    if (Array.isArray(d.assert_any_of)) {
      check.assert_any_of = d.assert_any_of.map(String);
    }

    // Validate track_analysis requires select + (compute or assert_any_of)
    if (checkType === "track_analysis") {
      if (!check.select) {
        throw new Error(`check '${name}' (track_analysis) requires a 'select' clause`);
      }
      if (!check.compute && !check.assert_any_of) {
        throw new Error(`check '${name}' (track_analysis) requires 'compute' or 'assert_any_of'`);
      }
    }

    result[name] = check;
  }
  return result;
}

function parseDisplay(raw: unknown): DisplayConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("'display' must be a mapping");
  }
  const d = raw as Record<string, unknown>;
  if (!Array.isArray(d.sections)) {
    throw new Error("'display.sections' must be an array");
  }
  const sections: DisplaySection[] = d.sections.map((s: unknown, i: number) => {
    if (!s || typeof s !== "object") {
      throw new Error(`display.sections[${i}] must be a mapping`);
    }
    const sec = s as Record<string, unknown>;
    if (typeof sec.id !== "string" || typeof sec.source !== "string") {
      throw new Error(`display.sections[${i}] requires 'id' and 'source' strings`);
    }
    const section: DisplaySection = { id: sec.id, source: sec.source };
    if (Array.isArray(sec.range)) {
      section.range = sec.range as [number, number | null];
    }
    return section;
  });
  return { sections };
}
