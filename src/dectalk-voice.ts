// Generic, voice-agnostic DECtalk voice selector.
//
// Voice DATA lives entirely in YAML under a frontend's speaker registry
// (frontend.yaml `speakers:` block -> `dir` of per-voice YAML files). This
// module contains ONLY generic infrastructure: it reads a voice name, loads
// the corresponding YAML file, and exposes the raw parameter record plus the
// four canonical speaker-profile override fields. There are NO per-voice
// branches and NO hardcoded voice values here — every voice is just a file.
//
// Citation: DECtalk 4.63 ph_vset.c (speaker-dependent parameter tables).
import { isPlainObject, loadYamlDocumentSync } from "./yaml-loader";
import type { SpeakerProfileOverride } from "./speaker-profile";

export interface VoiceRegistry {
  dir: string;
  default: string;
  voices: string[];
  /** Declarative list of speaker fields stamped (absolute set) onto every
   *  frame's same-named Klatt param. Pure data — the TS applies it generically
   *  with no per-voice or per-field branches. Empty when not declared. */
  speakerFrameParams: string[];
}

export interface ResolvedVoice {
  /** Voice name as selected. */
  name: string;
  /** Numeric speaker-profile overrides (base_f0_hz, formant_scale, ...). */
  override: SpeakerProfileOverride;
  /** Full numeric parameter record for this voice (feeds the F0 speaker
   *  policy / speakerParams). Non-numeric keys (name, sex, citations) excluded. */
  params: Record<string, number>;
  /** Source citations declared in the voice YAML. */
  citations: string[];
}

const SPEAKER_PROFILE_FIELDS = [
  "base_f0_hz",
  "formant_scale",
  "rd_default",
  "spectral_tilt_offset_db",
] as const;

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
  return { dir, default: def, voices, speakerFrameParams };
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
export function resolveVoice(registry: VoiceRegistry, voiceName: string): ResolvedVoice {
  const name = voiceName.trim().toLowerCase();
  if (registry.voices.length > 0 && !registry.voices.includes(name)) {
    throw new Error(
      `E_VOICE_UNKNOWN: voice '${voiceName}' is not registered. ` +
        `Available: ${registry.voices.join(", ")}`,
    );
  }

  const docPath = `${registry.dir}/${name}.yaml`;
  const doc = loadYamlDocumentSync<Record<string, unknown>>(docPath);
  if (!isPlainObject(doc)) {
    throw new Error(`E_VOICE_SCHEMA: voice file '${docPath}' is not a mapping`);
  }

  const params = toNumberRecord(doc);

  const override: SpeakerProfileOverride = {};
  for (const field of SPEAKER_PROFILE_FIELDS) {
    const value = params[field];
    if (typeof value === "number" && Number.isFinite(value)) {
      override[field] = value;
    }
  }

  const citations = Array.isArray(doc.citations)
    ? doc.citations.filter((c): c is string => typeof c === "string")
    : [];
  citations.unshift(docPath);

  return { name, override, params, citations };
}
