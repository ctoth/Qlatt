// Declarative diagnostics system — type definitions
// Replaces imperative meter/spike/SW tracking in test/harness with YAML-driven checks.

/** A tap point: an AnalyserNode attached to a named graph node. */
export interface TapDef {
  /** Graph node ID, or list to try in order (first found wins). */
  node: string | string[];
  fftSize?: number;
}

/** Polling configuration. */
export interface PollConfig {
  interval_ms: number;
  /** Milliseconds to skip near event boundaries (avoids analyser window bleed). */
  guard_ms: number;
}

/** Timing condition for a check: only evaluate when these hold. */
export interface WhenClause {
  /** SW param value (0 or 1). */
  SW?: number;
  /** Glob-style phoneme match (e.g. "IY*" matches "IY1"). */
  phoneme?: string;
  /** True when AV > 0 or AVS > 0. */
  voiced?: boolean;
}

/** Assertion thresholds. */
export interface AssertDef {
  min?: number;
  max?: number;
  /** For param_range: minimum of the observed range of maximums. */
  range_min?: number;
  /** For param_range: the max must reach at least this. */
  max_min?: number;
  /** For across_plays: max coefficient of variation. */
  cv_max?: number;
  /** For event_check: minimum distinct values. */
  distinct_min?: number;
}

/** Measure-specific parameters (e.g., frequency band for FFT). */
export interface MeasureParams {
  band?: [number, number];
  numerator_band?: [number, number];
  denominator_band?: [number, number];
}

export type MeasureKind =
  | "rms"
  | "peak"
  | "fft_peak_freq"
  | "band_energy"
  | "band_share"
  | "band_ratio_db"
  | "zcr"
  | "rms_ratio_db";

export type CheckAggregate = "last" | "max" | "min";

export type CheckType =
  | "tap_check" // default: measure a tap and assert
  | "param_range" // track min/max of a named param across utterance
  | "event_check" // check properties of events (e.g., PLSTEP)
  | "across_plays" // accumulate across N plays, then assert
  | "track_analysis"; // evaluate assertions on track parameters directly

export type Severity = "info" | "warn" | "error";

export type CheckStatus = "pass" | "warn" | "fail" | "skip" | "pending";

/** Select clause for track_analysis checks — filters frames by parameter values. */
export interface TrackSelectClause {
  SW?: number;
  phoneme?: string;
  voiced?: boolean;
  [param: string]: number | { min?: number; max?: number } | string | boolean | undefined;
}

/** Standalone type for track_analysis check definitions (used in evaluateTrackAnalysis). */
export interface TrackAnalysisCheckDef {
  type: "track_analysis";
  select: TrackSelectClause;
  compute?: string;
  assert_any_of?: string[];
  assert: AssertDef;
  severity: Severity;
  message: string;
}

/** A single check definition from YAML. */
export interface CheckDef {
  /** Which tap to read (for tap_check / across_plays). */
  tap?: string;
  /** Multiple taps (for rms_ratio_db). */
  taps?: string[];
  /** Check type — defaults to "tap_check" when tap is present. */
  type?: CheckType;
  /** Only evaluate when these conditions hold. */
  when?: WhenClause;
  /** What to measure. */
  measure?: MeasureKind;
  /** Extra params for the measurement. */
  measure_params?: MeasureParams;
  /** How to aggregate values observed while the check is active. */
  aggregate?: CheckAggregate;
  /** Assertion thresholds. */
  assert: AssertDef;
  /** Severity when assertion fails. */
  severity: Severity;
  /** Human-readable message. */
  message: string;
  /** Collect failing events instead of just pass/fail. */
  collect?: boolean;
  /** Evaluate even inside the global event-boundary guard window. */
  ignore_guard?: boolean;
  /** Max collected events. */
  max_collected?: number;
  /** Cooldown between collected events (ms). */
  cooldown_ms?: number;
  /** For across_plays: how many plays to accumulate. */
  plays?: number;
  /** For param_range: which track param to monitor. */
  param?: string;
  /** For event_check: which event type. */
  event?: string;
  /** For event_check: which field on the event to inspect. */
  field?: string;
  /** For track_analysis: frame selection clause. */
  select?: TrackSelectClause;
  /** For track_analysis: field to extract and assert on. */
  compute?: string;
  /** For track_analysis: assert at least one of these fields meets the assertion. */
  assert_any_of?: string[];
}

/** Display section config. */
export interface DisplaySection {
  id: string;
  source: string;
  range?: [number, number | null];
}

/** Display configuration. */
export interface DisplayConfig {
  sections: DisplaySection[];
}

/** Top-level diagnostics config parsed from YAML. */
export interface DiagConfig {
  taps: Record<string, TapDef>;
  poll: PollConfig;
  checks: Record<string, CheckDef>;
  display: DisplayConfig;
}

/** Result of evaluating a single check. */
export interface CheckResult {
  name: string;
  status: CheckStatus;
  severity: Severity;
  message: string;
  value?: number;
  /** Human-readable label for value when it is not a generic scalar. */
  valueLabel?: string;
  /** True when the assertion failed but severity is informational. */
  assertionFailed?: boolean;
  /** Collected events (when collect: true). */
  collected?: CollectedEvent[];
}

/** A collected event from a check with collect: true. */
export interface CollectedEvent {
  time: number;
  value: number;
  phoneme?: string;
}

/** Accumulated data for param_range checks. */
export interface ParamRangeAccum {
  min: number;
  max: number;
}

/** Accumulated data for across_plays checks. */
export interface AcrossPlaysAccum {
  values: number[];
  needed: number;
}

/** The engine interface returned by createDiagnosticsEngine. */
export interface DiagnosticsEngine {
  start(): void;
  stop(): void;
  destroy(): void;
  onPlayStart(run: RunInfo): void;
  onPlayEnd(): void;
  subscribe(fn: (output: string) => void): () => void;
  getCheckResults(): Map<string, CheckResult>;
}

/** Info about the current run, passed to engine on play start. */
export interface RunInfo {
  phrase: string;
  baseF0: number;
  track: TrackEvent[];
  sessionId: number;
  startTime: number;
}

/** Minimal track event shape (matches existing track-analysis.ts). */
export interface TrackEvent {
  time: number;
  phoneme?: string;
  params?: Record<string, number | bigint | undefined>;
}

export interface ConnectableAudioNode {
  connect(destination: AudioNode): unknown;
  disconnect?(): void;
}

export interface RuntimeNodeResolver {
  getNode(id: string): ConnectableAudioNode | null;
}

export interface PlayHistoryEntry {
  phrase?: string;
  time?: string | number;
}
