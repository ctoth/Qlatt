import { isPlainObject, loadYamlDocumentSync } from "./yaml-loader";

export const DEFAULT_SPEAKER_PROFILE_PATH = "/rules/policy/speaker-profile.yaml";

export interface SpeakerProfileFieldSpec {
  value: number;
  citations: string[];
  /** Ordered runtime source paths; value is the fallback when none is finite. */
  sources: string[];
}

/** How a requested pitch composes with the profile's level and span fields. */
export interface SpeakerPitchCompositionSpec {
  /** A request's pitch ratio; multiplies the resolved level field. */
  pitch_scale: SpeakerProfileFieldSpec;
  span_follows_level: {
    /** The default_profile field holding the pitch level (the floor). */
    level: string;
    /** The default_profile field holding the pitch span above the level. */
    span: string;
    /** Ordered runtime source paths of the reference level; then the level field's value. */
    reference_sources: string[];
    /** Runtime source paths that give the span as asked for; it is not rescaled. */
    unscaled_span_sources: string[];
    citations: string[];
  };
}

export interface SpeakerProfileSpec {
  version: string;
  citations: string[];
  default_profile: Record<string, SpeakerProfileFieldSpec>;
  pitch_composition?: SpeakerPitchCompositionSpec;
}

export type ResolvedSpeakerProfile = Record<string, number>;

export type SpeakerProfileOverride = Partial<ResolvedSpeakerProfile>;

export interface ResolveSpeakerProfileOptions {
  baseF0?: number;
  /** A requested pitch ratio, for a caller that names its voice instead of overriding the profile. */
  pitchScale?: number;
  speakerOverride?: SpeakerProfileOverride;
  voiceProfile?: SpeakerProfileOverride;
  profileSpec?: SpeakerProfileSpec;
}

/** What the pitch composition policy did to the level and the span. */
export interface ResolvedPitchComposition {
  /** The selected voice's level, or the profile default when no voice gives one. */
  referenceBaseHz: number;
  /** The level before pitch_scale: an absolute request, else the reference. */
  requestedBaseHz: number;
  pitchScale: number;
  /** requestedBaseHz * pitchScale. */
  effectiveBaseHz: number;
  /** effectiveBaseHz / referenceBaseHz; 1 when that is not a positive finite number. */
  ratio: number;
  /** The span before scaling. */
  profileSpanHz: number;
  /** The span the profile carries. */
  spanHz: number;
  /** False when the request gave the span itself. */
  spanFollowsLevel: boolean;
}

export interface SpeakerProfileIssue {
  code: string;
  message: string;
  data: Record<string, unknown>;
}

export interface SpeakerProfileResolution {
  profile: ResolvedSpeakerProfile;
  /** Null when the profile document declares no pitch composition. */
  pitch: ResolvedPitchComposition | null;
  issues: SpeakerProfileIssue[];
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

  const defaultProfile = Object.fromEntries(
    Object.entries(value.default_profile).map(([name, field]) => [
      name,
      parseFieldSpec(field, `default_profile.${name}`),
    ]),
  );
  return {
    version: expectNonEmptyString(value.version, "version"),
    citations: expectStringArray(value.citations ?? [], "citations"),
    default_profile: defaultProfile,
    ...(value.pitch_composition === undefined
      ? {}
      : { pitch_composition: parsePitchComposition(value.pitch_composition, defaultProfile) }),
  };
}

function parsePitchComposition(
  value: unknown,
  defaultProfile: Record<string, SpeakerProfileFieldSpec>,
): SpeakerPitchCompositionSpec {
  const label = "pitch_composition";
  if (!isPlainObject(value)) {
    throw new Error(`E_SPEAKER_PROFILE_SCHEMA: '${label}' must be an object`);
  }
  const span = value.span_follows_level;
  if (!isPlainObject(span)) {
    throw new Error(`E_SPEAKER_PROFILE_SCHEMA: '${label}.span_follows_level' must be an object`);
  }
  const profileField = (name: unknown, fieldLabel: string): string => {
    const field = expectNonEmptyString(name, fieldLabel);
    if (!Object.hasOwn(defaultProfile, field)) {
      throw new Error(
        `E_SPEAKER_PROFILE_SCHEMA: '${fieldLabel}' names '${field}', which is not a default_profile field`,
      );
    }
    return field;
  };
  return {
    pitch_scale: parseFieldSpec(value.pitch_scale, `${label}.pitch_scale`),
    span_follows_level: {
      level: profileField(span.level, `${label}.span_follows_level.level`),
      span: profileField(span.span, `${label}.span_follows_level.span`),
      reference_sources: expectStringArray(
        span.reference_sources,
        `${label}.span_follows_level.reference_sources`,
      ),
      unscaled_span_sources: expectStringArray(
        span.unscaled_span_sources,
        `${label}.span_follows_level.unscaled_span_sources`,
      ),
      citations: expectStringArray(span.citations ?? [], `${label}.span_follows_level.citations`),
    },
  };
}

function readSource(path: string, sources: Readonly<Record<string, unknown>>): unknown {
  let value: unknown = sources;
  for (const key of path.split(".")) {
    value = isPlainObject(value) ? value[key] : undefined;
  }
  return value;
}

function firstFiniteSource(
  paths: readonly string[],
  sources: Readonly<Record<string, unknown>>,
): number | undefined {
  for (const path of paths) {
    const value = readSource(path, sources);
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function resolveProfileField(
  field: SpeakerProfileFieldSpec,
  sources: Readonly<Record<string, unknown>>,
): number {
  return firstFiniteSource(field.sources, sources) ?? field.value;
}

const isPositiveFinite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

/**
 * Applies the profile document's pitch_composition to a resolved profile:
 * the level field is multiplied by the requested pitch_scale, and the span
 * field by the ratio of that level to the reference level, unless the request
 * gave the span itself. A scale or ratio that is not a positive finite number
 * is reported and leaves the value it would have scaled as it was.
 */
function composePitch(
  profile: ResolvedSpeakerProfile,
  composition: SpeakerPitchCompositionSpec,
  defaults: Record<string, SpeakerProfileFieldSpec>,
  sources: Readonly<Record<string, unknown>>,
  issues: SpeakerProfileIssue[],
): ResolvedPitchComposition {
  const policy = composition.span_follows_level;
  const requestedBaseHz = profile[policy.level];
  const profileSpanHz = profile[policy.span];
  const referenceBaseHz =
    firstFiniteSource(policy.reference_sources, sources) ?? defaults[policy.level].value;

  // The first source that is given at all: a given scale that cannot be used
  // is reported instead of passed over for the next source.
  const givenScale = composition.pitch_scale.sources
    .map((path) => readSource(path, sources))
    .find((value) => value !== undefined && value !== null);
  let pitchScale = composition.pitch_scale.value;
  if (isPositiveFinite(givenScale)) {
    pitchScale = givenScale;
  } else if (givenScale !== undefined) {
    issues.push({
      code: "W_SPEAKER_PITCH_RATIO_INVALID",
      message: `The requested pitch_scale ${String(givenScale)} is not a positive finite number; the pitch is not scaled`,
      data: { pitch_scale: givenScale, fallback: pitchScale },
    });
  }

  const effectiveBaseHz = requestedBaseHz * pitchScale;
  let ratio = effectiveBaseHz / referenceBaseHz;
  if (!isPositiveFinite(ratio)) {
    issues.push({
      code: "W_SPEAKER_PITCH_RATIO_INVALID",
      message: `The ratio of the pitch level ${effectiveBaseHz} Hz to its reference ${referenceBaseHz} Hz is not a positive finite number; ${policy.span} is not scaled`,
      data: { [policy.level]: effectiveBaseHz, reference: referenceBaseHz, ratio },
    });
    ratio = 1;
  }
  const spanFollowsLevel = firstFiniteSource(policy.unscaled_span_sources, sources) === undefined;
  const spanHz = spanFollowsLevel ? profileSpanHz * ratio : profileSpanHz;

  profile[policy.level] = effectiveBaseHz;
  profile[policy.span] = spanHz;
  return {
    referenceBaseHz,
    requestedBaseHz,
    pitchScale,
    effectiveBaseHz,
    ratio,
    profileSpanHz,
    spanHz,
    spanFollowsLevel,
  };
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

export function resolveSpeakerProfileDetailed(
  options: ResolveSpeakerProfileOptions,
): SpeakerProfileResolution {
  const profileSpec = options.profileSpec ?? loadSpeakerProfileSync();
  const defaults = profileSpec.default_profile;
  const sources = {
    request: options.speakerOverride,
    voice: options.voiceProfile,
    baseF0: options.baseF0,
    pitchScale: options.pitchScale,
  };

  const profile = Object.fromEntries(
    Object.entries(defaults).map(([name, field]) => [name, resolveProfileField(field, sources)]),
  );
  const issues: SpeakerProfileIssue[] = [];
  const pitch = profileSpec.pitch_composition
    ? composePitch(profile, profileSpec.pitch_composition, defaults, sources, issues)
    : null;
  const requestedScale = options.speakerOverride?.pitch_scale ?? options.pitchScale;
  if (!profileSpec.pitch_composition && requestedScale !== undefined) {
    issues.push({
      code: "W_SPEAKER_PITCH_SCALE_UNDECLARED",
      message:
        "A pitch_scale was requested, but the speaker profile declares no pitch_composition; the pitch is not scaled",
      data: { pitch_scale: requestedScale },
    });
  }
  return { profile, pitch, issues };
}

export function resolveSpeakerProfile(
  options: ResolveSpeakerProfileOptions,
): ResolvedSpeakerProfile {
  return resolveSpeakerProfileDetailed(options).profile;
}

/** The sources of the pitch composition policy, for the record of its use. */
export function collectPitchCompositionCitations(spec: SpeakerProfileSpec): string[] {
  const composition = spec.pitch_composition;
  if (!composition) return [];
  return [...composition.pitch_scale.citations, ...composition.span_follows_level.citations];
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
