import type { ResolvedSpeakerProfile } from "./speaker-profile";
import type { SpeakerProjectionBaseline, SpeakerProjectionRow } from "./speaker-projection";
import { isPlainObject, loadYamlDocument, loadYamlDocumentSync } from "./yaml-loader";

export const DEFAULT_SOURCE_CONTOUR_PATH = "/rules/policy/source-contour.yaml";

export type SourceContourVoiceQuality = string;

export interface VoiceQualityOverrides {
  [field: string]: number | undefined;
  rd?: number;
  oq?: number;
  tl?: number;
  ah_offset_db?: number;
  flutter?: number;
  jitter?: number;
  ftp?: number;
  ftz?: number;
  btp?: number;
  btz?: number;
  df1?: number;
  db1?: number;
}

export interface SourceContourPreset {
  [field: string]: number | string[];
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
  projection: readonly SpeakerProjectionRow[];
  version: string;
  citations: string[];
  baseline: {
    source_mode: number;
    citations: string[];
  };
  default_voice_quality: SourceContourVoiceQuality;
  voice_quality_presets: Record<string, SourceContourPreset>;
}

export interface ResolveSourceContourOptions {
  spec?: SourceContourSpec;
  requestedQuality?: SourceContourVoiceQuality;
  speaker: ResolvedSpeakerProfile;
  baseF0Hz: number;
}

export interface ResolvedSourceContour {
  projection: readonly SpeakerProjectionRow[];
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
    ...Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "citations")
        .map(([key, entry]) => [key, expectFiniteNumber(entry, `${label}.${key}`)]),
    ),
  };
}

function baselineField(value: unknown, label: string): keyof SpeakerProjectionBaseline {
  switch (value) {
    case "source_mode":
    case "rd":
    case "rd_ref":
    case "spectral_tilt_offset_db":
      return value;
    default:
      throw new Error(
        `E_SOURCE_CONTOUR_SCHEMA: '${label}' unknown baseline field '${String(value)}'`,
      );
  }
}

function parseProjection(
  value: unknown,
  presets: Record<string, SourceContourPreset>,
): SpeakerProjectionRow[] {
  if (!Array.isArray(value)) {
    throw new Error("E_SOURCE_CONTOUR_SCHEMA: 'projection' must be an array");
  }
  const orders = new Set<number>();
  const rows = value.map((entry, index): SpeakerProjectionRow => {
    const label = `projection[${index}]`;
    if (!isPlainObject(entry))
      throw new Error(`E_SOURCE_CONTOUR_SCHEMA: '${label}' must be an object`);
    const target_param = expectNonEmptyString(entry.target_param, `${label}.target_param`);
    const order = expectFiniteNumber(entry.order, `${label}.order`);
    if (orders.has(order))
      throw new Error(`E_SOURCE_CONTOUR_SCHEMA: '${label}.order' must be unique`);
    orders.add(order);
    const common = { target_param, order };
    const op = entry.op;
    if (op === "baseline_const") {
      return { ...common, op, field: baselineField(entry.field, `${label}.field`) };
    }
    if (
      op !== "override_or_baseline" &&
      op !== "override_if_set" &&
      op !== "override_or_current_plus_baseline" &&
      op !== "current_plus_override_if_set"
    ) {
      throw new Error(`E_SOURCE_CONTOUR_SCHEMA: '${label}.op' unknown op '${String(op)}'`);
    }
    const field = expectNonEmptyString(entry.field, `${label}.field`);
    if (
      field === "f0_scale" ||
      !Object.values(presets).some(
        (preset) => Object.hasOwn(preset, field) && typeof preset[field] === "number",
      )
    ) {
      throw new Error(
        `E_SOURCE_CONTOUR_SCHEMA: '${label}.field' unknown override field '${field}'`,
      );
    }
    if (op === "override_or_baseline" || op === "override_or_current_plus_baseline") {
      return {
        ...common,
        op,
        field,
        baseline_field: baselineField(entry.baseline_field, `${label}.baseline_field`),
      };
    }
    return { ...common, op, field };
  });
  return rows.sort((a, b) => a.order - b.order);
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
  const presetEntries = Object.entries(presets);
  if (presetEntries.length === 0) {
    throw new Error("E_SOURCE_CONTOUR_SCHEMA: 'voice_quality_presets' must not be empty");
  }
  const voiceQualityPresets = Object.fromEntries(
    presetEntries.map(([name, preset]) => {
      const presetName = expectNonEmptyString(name, "voice_quality_presets key");
      return [presetName, parsePreset(preset, `voice_quality_presets.${presetName}`)];
    }),
  );
  const defaultVoiceQuality = expectNonEmptyString(
    value.default_voice_quality,
    "default_voice_quality",
  );
  if (!Object.hasOwn(voiceQualityPresets, defaultVoiceQuality)) {
    throw new Error(
      `E_SOURCE_CONTOUR_SCHEMA: default voice quality '${defaultVoiceQuality}' is not declared`,
    );
  }
  return {
    projection: parseProjection(value.projection, voiceQualityPresets),
    version: expectNonEmptyString(value.version, "version"),
    citations: expectStringArray(value.citations ?? [], "citations"),
    baseline: {
      source_mode: expectFiniteNumber(value.baseline.source_mode, "baseline.source_mode"),
      citations: expectStringArray(value.baseline.citations ?? [], "baseline.citations"),
    },
    default_voice_quality: defaultVoiceQuality,
    voice_quality_presets: voiceQualityPresets,
  };
}

/** Load asynchronously when pairing a frontend with a browser experiment. */
export async function loadSourceContour(
  specPath: string = DEFAULT_SOURCE_CONTOUR_PATH,
): Promise<SourceContourSpec> {
  return parseSourceContourDocument(await loadYamlDocument(specPath));
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

export function resolveSourceContour(options: ResolveSourceContourOptions): ResolvedSourceContour {
  const spec = options.spec ?? loadSourceContourSync();
  const presetName = options.requestedQuality ?? spec.default_voice_quality;
  const preset = spec.voice_quality_presets[presetName];
  if (!preset) {
    throw new Error(`E_SOURCE_CONTOUR_PRESET_UNKNOWN: '${presetName}' is not declared`);
  }
  const baseline = {
    source_mode: spec.baseline.source_mode,
    rd: options.speaker.rd_default,
    rd_ref: options.speaker.rd_default,
    spectral_tilt_offset_db: options.speaker.spectral_tilt_offset_db,
  };

  const result: ResolvedSourceContour = {
    projection: spec.projection,
    baseline,
    effectiveBaseF0Hz:
      preset.f0_scale !== 1.0 ? Math.round(options.baseF0Hz * preset.f0_scale) : options.baseF0Hz,
    presetName,
    citations: [
      DEFAULT_SOURCE_CONTOUR_PATH,
      ...spec.citations,
      ...spec.baseline.citations,
      ...preset.citations,
    ].filter((value, index, all) => all.indexOf(value) === index),
    voiceQualityOverrides: Object.fromEntries(
      Object.entries(preset).filter(
        (entry): entry is [string, number] =>
          entry[0] !== "f0_scale" && typeof entry[1] === "number",
      ),
    ),
  };

  return result;
}
