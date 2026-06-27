export interface RenderMetrics {
  rms: number;
  peak: number;
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

export interface RenderPayload {
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
  trackSummary: RenderTrackSummary;
  frontendPhones?: unknown;
  f0LayerCommands?: unknown;
  diagnostics?: unknown;
  track?: unknown;
  samples: number[];
}

export interface RenderRequest {
  repoRoot: string;
  phrase: string;
  baseF0?: number;
  frontendId: string;
  experimentId: string;
  engine: string;
  rate: number;
  transitionMs: number;
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
