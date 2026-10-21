import type { TextToKlattTrackDetailedResult, TextToKlattTrackOptions } from "../tts-frontend.ts";

export interface RenderMetrics {
  rms: number;
  peak: number;
}

export interface WavEncodingStats {
  finitePeak: number;
  clippedSamples: number;
  invalidSamples: number;
}

/** One canonical spoken Word at its first rendered frame, before lead padding. */
export interface WordOccurrence {
  wordId: string;
  word: string;
  time: number;
}

export interface RenderTrackSummary {
  events: number;
  totalTime: number;
  voicedEvents: number;
  voicedTime: number;
  silenceTime: number;
  unvoicedNonsilenceTime: number;
  voicedRatio: number;
  f0Min: number;
  f0Max: number;
  f0Mean: number;
  f0Span: number;
}

export interface RenderPayload
  extends Pick<
    TextToKlattTrackOptions,
    "speaker" | "pitchScale" | "voiceQuality" | "directionTrack"
  > {
  /** The profile actually resolved by the frontend for this request. */
  resolvedSpeaker?: TextToKlattTrackDetailedResult["resolvedSpeaker"];
  phrase: string;
  baseF0?: number;
  engine?: string;
  frontendId?: string;
  experimentId?: string;
  rate?: number;
  transitionMs?: number;
  sampleRate: number;
  leadTime: number;
  tailTime: number;
  length: number;
  metrics: RenderMetrics;
  /** Present only after WAV encoding; absence does not certify unclipped audio. */
  wavEncoding?: WavEncodingStats & { path: string };
  /** Absent when the selected experiment declares no metrics policy. */
  trackSummary?: RenderTrackSummary;
  diagnostics?: unknown;
  track?: unknown;
  /** Node runtime projection supplied with includeTrack; not source offsets. */
  wordOccurrences?: WordOccurrence[];
  samples: number[];
}

export interface RenderRequest
  extends Pick<TextToKlattTrackOptions, "speaker" | "voiceQuality" | "directionTrack"> {
  /** Node-backend measurement controls, applied explicitly to every frame. */
  nodeParameterOverrides?: Record<string, number>;
  repoRoot: string;
  phrase: string;
  /** A requested base pitch in Hz. Absent: the selected voice's own. */
  baseF0?: number;
  /**
   * A requested pitch as a ratio of the base pitch
   * (the selected frontend's speaker-profile pitch_composition). Absent: 1.
   */
  pitchScale?: number;
  frontendId: string;
  experimentId: string;
  engine: string;
  /** Absent: the selected frontend's cited rate default. */
  rate?: number;
  /** Absent: the selected frontend's cited transition default. */
  transitionMs?: number;
  sampleRate: number;
  leadTime: number;
  tailTime: number;
  includeTrack: boolean;
  noiseSeed: number;
  persistWav: boolean;
  allowBrowserRender: boolean;
  browserExecutablePath?: string | null;
  renderHost: "auto" | "node" | "browser";
}

export interface RenderBackend {
  id: string;
  supports(request: RenderRequest): boolean;
  render(request: RenderRequest): Promise<RenderPayload>;
}
