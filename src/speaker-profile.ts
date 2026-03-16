import { isPlainObject, loadYamlDocumentSync } from "./yaml-loader";

export const DEFAULT_SPEAKER_PROFILE_PATH = "/rules/policy/speaker-profile.yaml";

export interface SpeakerProfileFieldSpec {
  value: number;
  citations: string[];
}

export interface SpeakerProfileSpec {
  version: string;
  citations: string[];
  default_profile: {
    base_f0_hz: SpeakerProfileFieldSpec;
    formant_scale: SpeakerProfileFieldSpec;
    rd_default: SpeakerProfileFieldSpec;
    spectral_tilt_offset_db: SpeakerProfileFieldSpec;
  };
}

export interface ResolvedSpeakerProfile {
  base_f0_hz: number;
  formant_scale: number;
  rd_default: number;
  spectral_tilt_offset_db: number;
}

export interface SpeakerProfileOverride {
  base_f0_hz?: number;
  formant_scale?: number;
  rd_default?: number;
  spectral_tilt_offset_db?: number;
}

export interface ResolveSpeakerProfileOptions {
  baseF0?: number;
  speakerOverride?: SpeakerProfileOverride;
  profileSpec?: SpeakerProfileSpec;
}

let speakerProfileCache: SpeakerProfileSpec | null = null;

function expectNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`E_SPEAKER_PROFILE_SCHEMA: '${label}' must be a non-empty string`);
  }
  return value;
}

function expectFiniteNumber(value: unknown, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`E_SPEAKER_PROFILE_SCHEMA: '${label}' must be a finite number`);
  }
  return Number(value);
}

function expectStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`E_SPEAKER_PROFILE_SCHEMA: '${label}' must be an array`);
  }
  return value.map((entry, index) => expectNonEmptyString(entry, `${label}[${index}]`));
}

function parseFieldSpec(value: unknown, label: string): SpeakerProfileFieldSpec {
  if (!isPlainObject(value)) {
    throw new Error(`E_SPEAKER_PROFILE_SCHEMA: '${label}' must be an object`);
  }

  return {
    value: expectFiniteNumber(value.value, `${label}.value`),
    citations: expectStringArray(value.citations ?? [], `${label}.citations`),
  };
}

function parseSpeakerProfileDocument(value: unknown): SpeakerProfileSpec {
  if (!isPlainObject(value)) {
    throw new Error("E_SPEAKER_PROFILE_SCHEMA: top-level document must be an object");
  }
  if (!isPlainObject(value.default_profile)) {
    throw new Error("E_SPEAKER_PROFILE_SCHEMA: 'default_profile' must be an object");
  }

  const defaultProfile = value.default_profile;
  return {
    version: expectNonEmptyString(value.version, "version"),
    citations: expectStringArray(value.citations ?? [], "citations"),
    default_profile: {
      base_f0_hz: parseFieldSpec(defaultProfile.base_f0_hz, "default_profile.base_f0_hz"),
      formant_scale: parseFieldSpec(defaultProfile.formant_scale, "default_profile.formant_scale"),
      rd_default: parseFieldSpec(defaultProfile.rd_default, "default_profile.rd_default"),
      spectral_tilt_offset_db: parseFieldSpec(
        defaultProfile.spectral_tilt_offset_db,
        "default_profile.spectral_tilt_offset_db",
      ),
    },
  };
}

function finite(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function loadSpeakerProfileSync(
  specPath: string = DEFAULT_SPEAKER_PROFILE_PATH,
): SpeakerProfileSpec {
  if (specPath === DEFAULT_SPEAKER_PROFILE_PATH && speakerProfileCache) {
    return speakerProfileCache;
  }

  const spec = parseSpeakerProfileDocument(loadYamlDocumentSync(specPath));
  if (specPath === DEFAULT_SPEAKER_PROFILE_PATH) {
    speakerProfileCache = spec;
  }
  return spec;
}

export function resolveSpeakerProfile(options: ResolveSpeakerProfileOptions): ResolvedSpeakerProfile {
  const profileSpec = options.profileSpec ?? loadSpeakerProfileSync();
  const override = options.speakerOverride;
  const defaults = profileSpec.default_profile;

  return {
    base_f0_hz:
      finite(override?.base_f0_hz) ??
      finite(options.baseF0) ??
      defaults.base_f0_hz.value,
    formant_scale:
      finite(override?.formant_scale) ??
      defaults.formant_scale.value,
    rd_default:
      finite(override?.rd_default) ??
      defaults.rd_default.value,
    spectral_tilt_offset_db:
      finite(override?.spectral_tilt_offset_db) ??
      defaults.spectral_tilt_offset_db.value,
  };
}

export function collectSpeakerProfileCitations(
  spec: SpeakerProfileSpec,
  specPath: string,
): string[] {
  return [
    specPath,
    ...spec.citations,
    ...spec.default_profile.base_f0_hz.citations,
    ...spec.default_profile.formant_scale.citations,
    ...spec.default_profile.rd_default.citations,
    ...spec.default_profile.spectral_tilt_offset_db.citations,
  ].filter((value, index, all) => all.indexOf(value) === index);
}
