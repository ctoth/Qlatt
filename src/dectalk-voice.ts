// Generic, voice-agnostic DECtalk voice selector.
//
// Voice DATA lives entirely in YAML under a frontend's speaker registry
// (frontend.yaml `speakers:` block -> `dir` of per-voice YAML files). This
// module contains ONLY generic infrastructure: it reads a voice name, loads
// the corresponding YAML file, and exposes the raw parameter record plus the
// speaker-profile override fields declared by the profile policy. There are NO per-voice
// branches and NO hardcoded voice values here — every voice is just a file.
//
// Citation: DECtalk 4.63 ph_vset.c (speaker-dependent parameter tables).

import {
  loadSpeakerProfileSync,
  type SpeakerProfileOverride,
  type SpeakerProfileSpec,
} from "./speaker-profile";
import { isPlainObject, loadYamlDocumentSync } from "./yaml-loader";

/** One declarative per-voice gain offset binding: the voice-YAML gain field
 *  `gain` is applied as a Paul-relative additive dB offset onto the per-frame
 *  Klatt dB parameter `param`. Pure data — the TS applies it generically. */
export interface SpeakerGainOffset {
  gain: string;
  param: string;
}

/**
 * One field of a voice file that rules may read as `params.policy.voice.<name>`:
 * a number, or one of a closed list of strings. Declared in the frontend's
 * `speakers.rule_fields`; every registered voice must give every field.
 */
export type VoiceRuleFieldSpec =
  | { kind: "number"; citations: string[] }
  | { kind: "string"; values: string[]; citations: string[] };

export type VoiceRuleFields = Record<string, number | string>;

export interface VoiceRegistry {
  dir: string;
  default: string;
  voices: string[];
  /** Voice-file fields rules may read; empty when the frontend declares none. */
  ruleFields: Record<string, VoiceRuleFieldSpec>;
  /** Declarative list of speaker fields stamped (absolute set) onto every
   *  frame's same-named Klatt param. Pure data — the TS applies it generically
   *  with no per-voice or per-field branches. Empty when not declared. */
  speakerFrameParams: string[];
  /** Declarative per-voice gain offset bindings (voice gain field -> frame dB
   *  param). Applied as Paul-relative additive offsets by generic infra with no
   *  per-voice or per-gain branches. Empty when not declared. */
  speakerGainOffsets: SpeakerGainOffset[];
}

export interface ResolvedVoice {
  /** Voice name as selected. */
  name: string;
  /** Biological-sex data field from the voice YAML (`sex: male|female`), if
   *  declared. Generic data — used to select the male vs female formant locus
   *  table; never a per-voice-name branch. Undefined when the YAML omits it. */
  sex?: string;
  /** Numeric speaker-profile overrides (base_f0_hz, formant_scale, ...). */
  override: SpeakerProfileOverride;
  /** Full numeric parameter record for this voice (feeds the F0 speaker
   *  policy / speakerParams). Non-numeric keys (name, sex, citations) excluded. */
  params: Record<string, number>;
  /** The registry's rule fields as this voice gives them: `params.policy.voice`. */
  ruleFields: VoiceRuleFields;
  /** Source citations declared in the voice YAML. */
  citations: string[];
}

/**
 * Parse `speakers.rule_fields`: `{ <name>: { kind: number } | { values: [...] },
 * citations: [...] }`. A field needs a citation, as a rule does.
 */
function parseRuleFields(raw: unknown): Record<string, VoiceRuleFieldSpec> {
  if (raw === undefined) return {};
  if (!isPlainObject(raw)) {
    throw new Error("E_VOICE_RULE_FIELDS: speakers.rule_fields must be a map of field specs");
  }
  const fields: Record<string, VoiceRuleFieldSpec> = {};
  for (const [name, spec] of Object.entries(raw)) {
    const where = `speakers.rule_fields.${name}`;
    if (!isPlainObject(spec)) {
      throw new Error(
        `E_VOICE_RULE_FIELDS: ${where} must be { kind: number } or { values: [...] }`,
      );
    }
    const citations = Array.isArray(spec.citations)
      ? spec.citations.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
      : [];
    if (citations.length === 0) {
      throw new Error(`E_VOICE_RULE_FIELDS: ${where} requires citations`);
    }
    if (spec.kind === "number" && spec.values === undefined) {
      fields[name] = { kind: "number", citations };
    } else if (
      spec.kind === undefined &&
      Array.isArray(spec.values) &&
      spec.values.length > 0 &&
      spec.values.every((value) => typeof value === "string")
    ) {
      fields[name] = { kind: "string", values: spec.values as string[], citations };
    } else {
      throw new Error(
        `E_VOICE_RULE_FIELDS: ${where} must be { kind: number } or { values: [...] }`,
      );
    }
  }
  return fields;
}

/** The rule fields of one voice document; every declared field, of its kind. */
export function readVoiceRuleFields(
  fields: Readonly<Record<string, VoiceRuleFieldSpec>>,
  doc: Readonly<Record<string, unknown>>,
  docPath: string,
): VoiceRuleFields {
  const values: VoiceRuleFields = {};
  for (const [name, spec] of Object.entries(fields)) {
    const value = doc[name];
    if (value === undefined || value === null) {
      throw new Error(`E_VOICE_RULE_FIELD: voice file '${docPath}' lacks rule field '${name}'`);
    }
    if (spec.kind === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(
          `E_VOICE_RULE_FIELD: voice file '${docPath}' field '${name}' is ${JSON.stringify(value)}, not a number`,
        );
      }
      values[name] = value;
    } else {
      if (typeof value !== "string" || !spec.values.includes(value)) {
        throw new Error(
          `E_VOICE_RULE_FIELD: voice file '${docPath}' field '${name}' is ${JSON.stringify(value)}, not one of ${spec.values.join(", ")}`,
        );
      }
      values[name] = value;
    }
  }
  return values;
}

function loadVoiceDocument(
  registry: VoiceRegistry,
  name: string,
): [string, Record<string, unknown>] {
  const docPath = `${registry.dir}/${name}.yaml`;
  const doc = loadYamlDocumentSync<Record<string, unknown>>(docPath);
  if (!isPlainObject(doc)) {
    throw new Error(`E_VOICE_SCHEMA: voice file '${docPath}' is not a mapping`);
  }
  return [docPath, doc];
}

/**
 * For a rulepack source whose `speakers` block declares `rule_fields`: check
 * every registered voice against them and return the source with the default
 * voice's values at `parameters.policy.voice`, so that load-time validation
 * knows the paths rules may read. At run time the selected voice's values
 * replace them. A source without rule fields is returned as it is.
 */
export function withVoiceRulePolicy<T>(source: T): T {
  if (!isPlainObject(source)) return source;
  const registry = getVoiceRegistry(source);
  if (!registry || Object.keys(registry.ruleFields).length === 0) return source;
  const parameters = isPlainObject(source.parameters) ? source.parameters : {};
  const policy = isPlainObject(parameters.policy) ? parameters.policy : {};
  if (policy.voice !== undefined) {
    throw new Error(
      "E_VOICE_POLICY_RESERVED: parameters.policy.voice is filled from the selected voice's " +
        "rule fields (speakers.rule_fields) and may not be written in the rulepack",
    );
  }
  let defaults: VoiceRuleFields | null = null;
  for (const name of new Set([registry.default, ...registry.voices])) {
    const [docPath, doc] = loadVoiceDocument(registry, name);
    const values = readVoiceRuleFields(registry.ruleFields, doc, docPath);
    if (name === registry.default) defaults = values;
  }
  return {
    ...source,
    parameters: { ...parameters, policy: { ...policy, voice: defaults } },
  } as T;
}

/**
 * Read the `speakers:` registry from a frontend spec, if present.
 * Returns null when the frontend declares no voice registry.
 */
export function getVoiceRegistry(frontendSpec: unknown): VoiceRegistry | null {
  const speakers = (frontendSpec as { speakers?: unknown })?.speakers;
  if (!isPlainObject(speakers)) return null;
  const dir = speakers.dir;
  const def = speakers.default;
  if (typeof dir !== "string" || typeof def !== "string") return null;
  const voices = Array.isArray(speakers.voices)
    ? speakers.voices.filter((v): v is string => typeof v === "string")
    : [];
  const speakerFrameParams = Array.isArray(speakers.speaker_frame_params)
    ? speakers.speaker_frame_params.filter((v): v is string => typeof v === "string")
    : [];
  const speakerGainOffsets = Array.isArray(speakers.speaker_gain_offsets)
    ? speakers.speaker_gain_offsets
        .filter(isPlainObject)
        .filter(
          (e): e is { gain: string; param: string } =>
            typeof e.gain === "string" && typeof e.param === "string",
        )
        .map((e) => ({ gain: e.gain, param: e.param }))
    : [];
  const ruleFields = parseRuleFields(speakers.rule_fields);
  return { dir, default: def, voices, ruleFields, speakerFrameParams, speakerGainOffsets };
}

function toNumberRecord(doc: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Resolve a voice by name against a frontend's voice registry.
 *
 * Generic: loads `<registry.dir>/<voiceName>.yaml` and maps its numeric fields.
 * Throws E_VOICE_UNKNOWN if the name is not in the registry.
 */
export function resolveVoice(
  registry: VoiceRegistry,
  voiceName: string,
  profileSpec: SpeakerProfileSpec = loadSpeakerProfileSync(),
): ResolvedVoice {
  const name = voiceName.trim().toLowerCase();
  if (registry.voices.length > 0 && !registry.voices.includes(name)) {
    throw new Error(
      `E_VOICE_UNKNOWN: voice '${voiceName}' is not registered. ` +
        `Available: ${registry.voices.join(", ")}`,
    );
  }

  const [docPath, doc] = loadVoiceDocument(registry, name);

  const params = toNumberRecord(doc);
  const ruleFields = readVoiceRuleFields(registry.ruleFields, doc, docPath);

  const override: SpeakerProfileOverride = {};
  for (const field of Object.keys(profileSpec.default_profile)) {
    const value = params[field];
    if (typeof value === "number" && Number.isFinite(value)) {
      override[field] = value;
    }
  }

  const citations = Array.isArray(doc.citations)
    ? doc.citations.filter((c): c is string => typeof c === "string")
    : [];
  citations.unshift(docPath);

  const sex = typeof doc.sex === "string" ? doc.sex : undefined;

  return { name, sex, override, params, ruleFields, citations };
}
