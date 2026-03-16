import type { VoiceQualityOverrides } from "./track-assembler";
import type { ResolvedSpeakerProfile } from "./speaker-profile";
import { isPlainObject, loadYamlDocumentSync } from "./yaml-loader";

export const DEFAULT_SOURCE_CONTOUR_PATH = "/rules/phases/source-contour.yaml";

export type SourceContourVoiceQuality =
  | "modal"
  | "breathy"
  | "pressed"
  | "creaky"
  | "whispery"
  | "falsetto";

export interface SourceContourPreset {
  rd: number;
  oq: number;
  tl: number;
  ah_offset_db: number;
  flutter: number;
  jitter: number;
  f0_scale: number;
  citations: string[];
}

export interface SourceContourSpec {
  version: string;
  citations: string[];
  baseline: {
    source_mode: number;
    citations: string[];
  };
  voice_quality_presets: Record<SourceContourVoiceQuality, SourceContourPreset>;
}

export interface ResolveSourceContourOptions {
  spec?: SourceContourSpec;
  requestedQuality?: SourceContourVoiceQuality;
  speaker: ResolvedSpeakerProfile;
  baseF0Hz: number;
}

export interface ResolvedSourceContour {
  baseline: {
    source_mode: number;
    rd: number;
    rd_ref: number;
    spectral_tilt_offset_db: number;
  };
  effectiveBaseF0Hz: number;
  presetName: SourceContourVoiceQuality;
  voiceQualityOverrides?: VoiceQualityOverrides;
  citations: string[];
}

let sourceContourCache: SourceContourSpec | null = null;

function expectNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`E_SOURCE_CONTOUR_SCHEMA: '${label}' must be a non-empty string`);
  }
  return value;
}

function expectFiniteNumber(value: unknown, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`E_SOURCE_CONTOUR_SCHEMA: '${label}' must be a finite number`);
  }
  return Number(value);
}

function expectStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`E_SOURCE_CONTOUR_SCHEMA: '${label}' must be an array`);
  }
  return value.map((entry, index) => expectNonEmptyString(entry, `${label}[${index}]`));
}

function parsePreset(value: unknown, label: string): SourceContourPreset {
  if (!isPlainObject(value)) {
    throw new Error(`E_SOURCE_CONTOUR_SCHEMA: '${label}' must be an object`);
  }
  return {
    rd: expectFiniteNumber(value.rd, `${label}.rd`),
    oq: expectFiniteNumber(value.oq, `${label}.oq`),
    tl: expectFiniteNumber(value.tl, `${label}.tl`),
    ah_offset_db: expectFiniteNumber(value.ah_offset_db, `${label}.ah_offset_db`),
    flutter: expectFiniteNumber(value.flutter, `${label}.flutter`),
    jitter: expectFiniteNumber(value.jitter, `${label}.jitter`),
    f0_scale: expectFiniteNumber(value.f0_scale, `${label}.f0_scale`),
    citations: expectStringArray(value.citations ?? [], `${label}.citations`),
  };
}

function parseSourceContourDocument(value: unknown): SourceContourSpec {
  if (!isPlainObject(value)) {
    throw new Error("E_SOURCE_CONTOUR_SCHEMA: top-level document must be an object");
  }
  if (!isPlainObject(value.baseline)) {
    throw new Error("E_SOURCE_CONTOUR_SCHEMA: 'baseline' must be an object");
  }
  if (!isPlainObject(value.voice_quality_presets)) {
    throw new Error("E_SOURCE_CONTOUR_SCHEMA: 'voice_quality_presets' must be an object");
  }
  const presets = value.voice_quality_presets;
  return {
    version: expectNonEmptyString(value.version, "version"),
    citations: expectStringArray(value.citations ?? [], "citations"),
    baseline: {
      source_mode: expectFiniteNumber(value.baseline.source_mode, "baseline.source_mode"),
      citations: expectStringArray(value.baseline.citations ?? [], "baseline.citations"),
    },
    voice_quality_presets: {
      modal: parsePreset(presets.modal, "voice_quality_presets.modal"),
      breathy: parsePreset(presets.breathy, "voice_quality_presets.breathy"),
      pressed: parsePreset(presets.pressed, "voice_quality_presets.pressed"),
      creaky: parsePreset(presets.creaky, "voice_quality_presets.creaky"),
      whispery: parsePreset(presets.whispery, "voice_quality_presets.whispery"),
      falsetto: parsePreset(presets.falsetto, "voice_quality_presets.falsetto"),
    },
  };
}

export function loadSourceContourSync(
  specPath: string = DEFAULT_SOURCE_CONTOUR_PATH,
): SourceContourSpec {
  if (specPath === DEFAULT_SOURCE_CONTOUR_PATH && sourceContourCache) {
    return sourceContourCache;
  }
  const spec = parseSourceContourDocument(loadYamlDocumentSync(specPath));
  if (specPath === DEFAULT_SOURCE_CONTOUR_PATH) {
    sourceContourCache = spec;
  }
  return spec;
}

export function resolveSourceContour(
  options: ResolveSourceContourOptions,
): ResolvedSourceContour {
  const spec = options.spec ?? loadSourceContourSync();
  const presetName = options.requestedQuality ?? "modal";
  const preset = spec.voice_quality_presets[presetName];
  const baseline = {
    source_mode: spec.baseline.source_mode,
    rd: options.speaker.rd_default,
    rd_ref: options.speaker.rd_default,
    spectral_tilt_offset_db: options.speaker.spectral_tilt_offset_db,
  };

  const result: ResolvedSourceContour = {
    baseline,
    effectiveBaseF0Hz:
      preset.f0_scale !== 1.0
        ? Math.round(options.baseF0Hz * preset.f0_scale)
        : options.baseF0Hz,
    presetName,
    citations: [
      DEFAULT_SOURCE_CONTOUR_PATH,
      ...spec.citations,
      ...spec.baseline.citations,
      ...preset.citations,
    ].filter((value, index, all) => all.indexOf(value) === index),
  };

  if (presetName !== "modal") {
    result.voiceQualityOverrides = {
      rd: preset.rd,
      oq: preset.oq,
      tl: preset.tl,
      ah_offset_db: preset.ah_offset_db,
      flutter: preset.flutter,
      jitter: preset.jitter,
    };
  }

  return result;
}
