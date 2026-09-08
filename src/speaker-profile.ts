import { isPlainObject, loadYamlDocumentSync } from "./yaml-loader";

export const DEFAULT_SPEAKER_PROFILE_PATH = "/rules/policy/speaker-profile.yaml";

export interface SpeakerProfileFieldSpec {
  value: number;
  citations: string[];
  /** Ordered runtime source paths; value is the fallback when none is finite. */
  sources: string[];
}

export interface SpeakerProfileSpec {
  version: string;
  citations: string[];
  default_profile: Record<string, SpeakerProfileFieldSpec>;
}

export type ResolvedSpeakerProfile = Record<string, number>;

export type SpeakerProfileOverride = Partial<ResolvedSpeakerProfile>;

export interface ResolveSpeakerProfileOptions {
  baseF0?: number;
  speakerOverride?: SpeakerProfileOverride;
  voiceProfile?: SpeakerProfileOverride;
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
    sources: expectStringArray(value.sources, `${label}.sources`),
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
    default_profile: Object.fromEntries(
      Object.entries(defaultProfile).map(([name, field]) => [
        name,
        parseFieldSpec(field, `default_profile.${name}`),
      ]),
    ),
  };
}

function resolveProfileField(
  field: SpeakerProfileFieldSpec,
  sources: Readonly<Record<string, unknown>>,
): number {
  for (const path of field.sources) {
    let value: unknown = sources;
    for (const key of path.split(".")) {
      value = isPlainObject(value) ? value[key] : undefined;
    }
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return field.value;
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

export function resolveSpeakerProfile(
  options: ResolveSpeakerProfileOptions,
): ResolvedSpeakerProfile {
  const profileSpec = options.profileSpec ?? loadSpeakerProfileSync();
  const defaults = profileSpec.default_profile;
  const sources = {
    request: options.speakerOverride,
    voice: options.voiceProfile,
    baseF0: options.baseF0,
  };

  return Object.fromEntries(
    Object.entries(defaults).map(([name, field]) => [name, resolveProfileField(field, sources)]),
  );
}

export function collectSpeakerProfileCitations(
  spec: SpeakerProfileSpec,
  specPath: string,
): string[] {
  return [
    specPath,
    ...spec.citations,
    ...Object.values(spec.default_profile).flatMap((field) => field.citations),
  ].filter((value, index, all) => all.indexOf(value) === index);
}
