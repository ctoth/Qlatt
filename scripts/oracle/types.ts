export type OracleAdapterInput = {
  phraseId: string;
  phrase: string;
  outDir: string;
  voiceId?: string;
  rate?: number;
  sampleRate?: number;
  baseF0?: number;
  frontendId?: string;
  transitionMs?: number;
};

export type OracleArtifact = {
  engineId: string;
  adapterId: string;
  phraseId: string;
  phrase: string;
  voiceId?: string;
  rate?: number;
  sampleRate?: number;
  wavPath: string;
  metadataPath: string;
  stdoutPath?: string;
  stderrPath?: string;
  durationMs: number;
  exitCode: number;
  command: string[];
  notes: string[];
  symbolic?: Record<string, unknown>;
  trace?: Record<string, unknown>;
  extraPaths?: Record<string, string>;
};

export type OracleCorpusEntry = {
  id: string;
  text: string;
  group: string;
  voiceId?: string;
  rate?: number;
  sampleRate?: number;
  baseF0?: number;
  frontendId?: string;
  transitionMs?: number;
  tags?: string[];
  expectedFocus?: string;
};

export type OracleCorpusDocument = {
  schemaVersion: "v1";
  corpusId: string;
  defaults?: Omit<OracleCorpusEntry, "id" | "text" | "group">;
  entries: OracleCorpusEntry[];
};

export type AudioNormalizationConfig = {
  comparisonSampleRate: number;
  trimThresholdRatio: number;
  trimWindowMs: number;
  targetRms: number;
  maxLagMs: number;
};

export type AudioComparisonReport = {
  schemaVersion: "v1";
  phraseId: string;
  phrase: string;
  normalization: AudioNormalizationConfig;
  alignment: {
    lagSamples: number;
    lagMs: number;
  };
  oracle: Pick<OracleArtifact, "engineId" | "adapterId" | "wavPath" | "metadataPath"> & {
    symbolic?: Record<string, unknown>;
  };
  qlatt: Pick<OracleArtifact, "engineId" | "adapterId" | "wavPath" | "metadataPath"> & {
    trackSummary?: Record<string, unknown>;
    renderPayloadPath?: string;
    symbolic?: Record<string, unknown>;
  };
  metrics: {
    intelligibility: {
      stoi: number | null;
      estoi: number | null;
      stoiSkippedReason?: string;
    };
    acoustic: {
      rmsError: number;
      maxAbsError: number;
      correlation: number;
    };
    temporal: {
      oracleDurationSec: number;
      qlattDurationSec: number;
      alignedDurationSec: number;
      lagMs: number;
    };
    track?: Record<string, unknown>;
    internal?: Record<string, unknown>;
    symbolic?: Record<string, unknown>;
  };
  symbolic?: {
    oracle?: Record<string, unknown>;
    qlatt?: Record<string, unknown>;
  };
  verdict: {
    status: "pass" | "warn" | "fail";
    reasons: string[];
  };
};
