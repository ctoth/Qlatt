import { loadCmuDictionaryFromPathSync } from "./cmu-dictionary-loader";
import {
  type FeatureSchema,
  type HrgSchema,
  type LayeredF0ModelConfig,
  lowerToFrames,
  readLowerOptions,
  Utterance,
} from "./declarative-frontend/hrg";
import { FRAME_VALUES_SCHEMA, frameValueFeatures } from "./declarative-frontend/hrg/frame-program";
import {
  GraphRuleEvaluationOwner,
  runGraphRuleEngine,
} from "./declarative-frontend/hrg/rule-engine";
import { TONE_ITEM_SCHEMA } from "./declarative-frontend/hrg/tone-association";
import {
  type InventoryParameterFallback,
  type InventorySpec,
  loadFrontendResources,
  materializePhonemeTarget,
  reportInventoryParameterFallbacks,
} from "./declarative-frontend/inventory";
import {
  type CompiledRulepack,
  loadBundledRulepackSpec,
  loadRulepackSpecFromPath,
} from "./declarative-frontend/rule-pack";
import {
  NORMALIZATION_SCHEMA,
  normalizeGraphText,
  normalizeSourceItems,
  recognizeText,
} from "./declarative-frontend/source-recognition";
import { parseSyllabificationTables, syllabifyWord } from "./declarative-frontend/syllabify";
import { getVoiceRegistry, type ResolvedVoice, resolveVoice } from "./dectalk-voice";
import type { Diagnostics } from "./diagnostics";
import type { DirectionTrack } from "./input/direction-track";
import {
  attachDirectionsToUtterance,
  DIRECTION_ITEM_SCHEMA,
  parseDirectionInput,
} from "./input/parse";
import { createProvenanceCollector, type ProvenanceCollector } from "./provenance";
import {
  DEFAULT_SOURCE_CONTOUR_PATH,
  loadSourceContourSync,
  resolveSourceContour,
  type SourceContourVoiceQuality,
} from "./source-contour";
import {
  collectSpeakerProfileCitations,
  DEFAULT_SPEAKER_PROFILE_PATH,
  loadSpeakerProfileSync,
  type ResolvedSpeakerProfile,
  resolveSpeakerProfile,
  type SpeakerProfileOverride,
} from "./speaker-profile";
import { projectSpeakerFields } from "./speaker-projection";
import { parseTextParserConfig, runTextParser } from "./text-parser/frontend";
import { transcribeText } from "./transcribe-text";
import type { KlattFrame, TranscriptionConfig, TranscriptionToken } from "./tts-frontend-types";
import { isPlainObject } from "./yaml-loader";

export type VoiceQuality = SourceContourVoiceQuality;

export type TextToKlattTrackOptions = {
  provenance?: ProvenanceCollector | null;
  frontendId?: string;
  frontendPath?: string;
  rate?: number;
  speaker?: string | SpeakerProfileOverride;
  voiceQuality?: VoiceQuality;
  directionTrack?: DirectionTrack;
  diagnostics?: Diagnostics | null;
  captureTooling?: boolean;
  /**
   * Called each time a stage of the pipeline has finished, with its name (a
   * rule phase is `phase <name>`), so a caller can time the stages
   * (scripts/measure-frontend-time.ts --stages).
   */
  onStage?: (stage: string) => void;
};

export type TextToKlattTrackDetailedResult = {
  track: KlattFrame[];
  utterance: Utterance;
  resolvedSpeaker: ResolvedSpeakerProfile;
  speakerParams?: Record<string, unknown>;
};

const ruleEvaluationOwners = new WeakMap<CompiledRulepack, GraphRuleEvaluationOwner>();

const STRING_OR_NULL: FeatureSchema = {
  kind: "union",
  variants: [{ kind: "string" }, { kind: "null" }],
};
const NUMBER_OR_NULL: FeatureSchema = {
  kind: "union",
  variants: [{ kind: "number" }, { kind: "null" }],
};
const CONTROL_FIELD_SCHEMA: FeatureSchema = {
  kind: "union",
  variants: [
    { kind: "number" },
    {
      kind: "object",
      fields: {
        op: { kind: "string", values: ["set", "add", "mul", "max", "min", "unset"] },
        value: { kind: "number" },
      },
      optional: ["value"],
    },
  ],
};
const CONTROL_WINDOW_SCHEMA: FeatureSchema = {
  kind: "object",
  fields: {
    target: { kind: "string", values: ["current", "next", "prev"] },
    start_ms: { kind: "number" },
    end_ms: { kind: "number" },
    start_ratio: { kind: "number" },
    end_ratio: { kind: "number" },
    prefix_ms: { kind: "number" },
    suffix_ms: { kind: "number" },
    fields: { kind: "object", fields: {}, additional: CONTROL_FIELD_SCHEMA },
    tag: { kind: "string" },
  },
  optional: [
    "target",
    "start_ms",
    "end_ms",
    "start_ratio",
    "end_ratio",
    "prefix_ms",
    "suffix_ms",
    "fields",
    "tag",
  ],
};

function schemaForValue(value: unknown): FeatureSchema | null {
  if (value === null) return { kind: "null" };
  if (typeof value === "string") return { kind: "string" };
  if (typeof value === "number") return Number.isFinite(value) ? { kind: "number" } : null;
  if (typeof value === "boolean") return { kind: "boolean" };
  if (Array.isArray(value)) {
    const variants = value
      .map(schemaForValue)
      .filter((entry): entry is FeatureSchema => entry !== null);
    const items =
      variants.length === 0 ? ({ kind: "string" } satisfies FeatureSchema) : mergeSchemas(variants);
    return { kind: "array", items };
  }
  if (!isPlainObject(value)) return null;
  const fields: Record<string, FeatureSchema> = {};
  for (const [key, nested] of Object.entries(value)) {
    const schema = schemaForValue(nested);
    if (schema) fields[key] = schema;
  }
  return { kind: "object", fields };
}

function mergeSchemas(schemas: readonly FeatureSchema[]): FeatureSchema {
  if (schemas.length > 0 && schemas.every((schema) => schema.kind === "array")) {
    return {
      kind: "array",
      items: mergeSchemas(schemas.map((schema) => schema.items)),
    };
  }
  if (schemas.length > 0 && schemas.every((schema) => schema.kind === "object")) {
    const objects = schemas;
    const keys = new Set(objects.flatMap((schema) => Object.keys(schema.fields)));
    const fields: Record<string, FeatureSchema> = {};
    const optional: string[] = [];
    for (const key of keys) {
      const observed = objects.flatMap((schema) =>
        schema.fields[key] ? [schema.fields[key]] : [],
      );
      fields[key] = mergeSchemas(observed);
      if (
        observed.length !== objects.length ||
        objects.some((schema) => schema.optional?.includes(key))
      ) {
        optional.push(key);
      }
    }
    return optional.length > 0 ? { kind: "object", fields, optional } : { kind: "object", fields };
  }
  const unique = new Map<string, FeatureSchema>();
  for (const schema of schemas) unique.set(JSON.stringify(schema), schema);
  const variants = [...unique.values()];
  return variants.length === 1 ? variants[0] : { kind: "union", variants };
}

/**
 * A Segment feature the rulepack declares with a type:
 * `name: { kind: number | string | boolean, nullable?: true, values?: [...] }`.
 * A feature declared as a bare list is a name only and gets no schema here.
 */
function declaredFeatureSchema(declaration: unknown): FeatureSchema | undefined {
  if (!isPlainObject(declaration)) return undefined;
  let schema: FeatureSchema;
  if (declaration.kind === "number") schema = { kind: "number" };
  else if (declaration.kind === "boolean") schema = { kind: "boolean" };
  else if (declaration.kind === "string") {
    const values = Array.isArray(declaration.values)
      ? declaration.values.filter((value): value is string => typeof value === "string")
      : undefined;
    schema = values && values.length > 0 ? { kind: "string", values } : { kind: "string" };
  } else {
    throw new Error(
      `E_FEATURE_KIND_UNKNOWN: Segment feature kind '${String(declaration.kind)}' is not number, string or boolean`,
    );
  }
  return declaration.nullable === true
    ? { kind: "union", variants: [schema, { kind: "null" }] }
    : schema;
}

function buildUtteranceSchema(inventory: InventorySpec, spec: CompiledRulepack): HrgSchema {
  const segmentFeatures: Record<string, FeatureSchema> = {
    phoneme: { kind: "string" },
    type: { kind: "string" },
    word: { kind: "string" },
    morpheme_boundary_after: { kind: "boolean" },
    // The first phone of the word's own text, after phones joined to it.
    word_text_start: { kind: "boolean" },
    rules_blocked: { kind: "boolean" },
    written_duration_ms: { kind: "number" },
    written_silence: { kind: "boolean" },
    written_pitch: { kind: "number" },
    sourceTokenId: { kind: "string" },
    punctuationSymbol: STRING_OR_NULL,
    // The mark was sent by a text rule, not read as a word's delimiter.
    punctuation_sent: { kind: "boolean" },
    stress: NUMBER_OR_NULL,
    duration: { kind: "number" },
    durationFloor: { kind: "number" },
    vot_from_table: { kind: "boolean" },
    inherentDuration: NUMBER_OR_NULL,
    active: { kind: "boolean" },
    inventorySW: { kind: "number" },
    minimumDuration: { kind: "number" },
    word_syllable_count: { kind: "number" },
    cluster_position: { kind: "number" },
    syllable_index: { kind: "number" },
    syllable_role: STRING_OR_NULL,
    syllable_position_in_word: { kind: "string" },
    isFunctionWord: { kind: "boolean" },
    isContentWord: { kind: "boolean" },
    isAccented: { kind: "boolean" },
    isAccentCarrier: { kind: "boolean" },
    isNuclearAccent: { kind: "boolean" },
    accentType: STRING_OR_NULL,
    accentIndexInPhrase: { kind: "number" },
    breakIndex: { kind: "number" },
    initialBoundaryTone: STRING_OR_NULL,
    phraseAccent: STRING_OR_NULL,
    boundaryTone: STRING_OR_NULL,
    control_windows: { kind: "array", items: CONTROL_WINDOW_SCHEMA },
    transition_ms: { kind: "number" },
    nucleus_duration_ms: { kind: "number" },
    dummy_vowel: { kind: "boolean" },
    weak: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
    glottal: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
  };
  const segmentRelation = spec.relations.Segment;
  const declared =
    isPlainObject(segmentRelation) && isPlainObject(segmentRelation.features)
      ? segmentRelation.features
      : {};
  for (const [key, declaration] of Object.entries(declared)) {
    const schema = declaredFeatureSchema(declaration);
    if (schema) segmentFeatures[key] = schema;
  }
  for (const key of frameValueFeatures(spec.frame_programs)) {
    segmentFeatures[key] = FRAME_VALUES_SCHEMA;
  }
  for (const key of Object.keys(inventory.base_params)) segmentFeatures[key] = { kind: "number" };
  for (const target of Object.values(inventory.phoneme_targets)) {
    for (const [key, value] of Object.entries(target)) {
      if (key === "dur" || key === "SW" || key === "type") continue;
      const observed = schemaForValue(value);
      const schema =
        observed?.kind === "boolean" ? mergeSchemas([observed, { kind: "null" }]) : observed;
      if (!schema) continue;
      segmentFeatures[key] = segmentFeatures[key]
        ? mergeSchemas([segmentFeatures[key], schema])
        : schema;
    }
  }
  const pointFeatures = {
    value: { kind: "number" },
    tag: { kind: "string" },
    layer: { kind: "string" },
    duration_frames: { kind: "number" },
    profile_points: { kind: "array", items: { kind: "number" } },
    active: { kind: "boolean" },
  } as const;
  return {
    itemTypes: {
      ...NORMALIZATION_SCHEMA.itemTypes,
      token: {
        features: {
          word: { kind: "string" },
          tokenType: { kind: "string", values: ["word", "punctuation"] },
          punctuationSymbol: STRING_OR_NULL,
          pronunciationKey: STRING_OR_NULL,
          active: { kind: "boolean" },
          sourceNormalizationId: { kind: "string" },
        },
      },
      word: {
        features: {
          text: { kind: "string" },
          tokenIndex: { kind: "number" },
          form_classes: { kind: "array", items: { kind: "string" } },
          // The classes before the lexicon hands them to the phonetic rules.
          text_form_classes: { kind: "array", items: { kind: "string" } },
          // The marks the frontend names that the written word has at its
          // start or its end (transcription.written_word_marks).
          written_marks: { kind: "array", items: { kind: "string" } },
          // The written word's place among the words between two punctuation
          // marks, from 1, and how many there are.
          clause_word_index: { kind: "number" },
          clause_word_count: { kind: "number" },
          // The word's place among the stretch's words as they are spoken one
          // by one; 0 for a word the routine before it read ahead.
          clause_spoken_index: { kind: "number" },
          // The stretch of words ends at the text's end, where no mark is
          // written (a text rule supplied the one that closes it).
          clause_end_supplied: { kind: "boolean" },
          // The word's part in a conjunction of several words.
          conjunction_sequence: { kind: "string", values: ["first", "rest"] },
          // Set by a frontend's rules: the word can carry a clause break, its
          // place in the stretch has one, and a break stands before it.
          break_marker: { kind: "boolean" },
          break_slot: { kind: "boolean" },
          clause_break_before: { kind: "boolean" },
          phrase_start: { kind: "string", values: ["vp", "pp"] },
          // The word before is phonemic text: no word boundary stands before
          // this word's phrase start.
          phrase_start_unbounded: { kind: "boolean" },
          // What a frontend's rules make of a prepositional-phrase start in
          // its context (kept, dropped, or kept with no word boundary before it).
          phrase_start_state: { kind: "string", values: ["pp", "word", "alone"] },
        },
      },
      syllable: {
        features: {
          index: { kind: "number" },
          stress: NUMBER_OR_NULL,
          positionInWord: { kind: "string" },
        },
      },
      segment: { features: segmentFeatures },
      tone: TONE_ITEM_SCHEMA,
      f0Point: { features: pointFeatures },
      phraseCommand: { features: pointFeatures },
      tilt: { features: pointFeatures },
      direction: DIRECTION_ITEM_SCHEMA,
      transition: { features: { active: { kind: "boolean" } } },
    },
    relations: {
      ...NORMALIZATION_SCHEMA.relations,
      Token: { kind: "list", itemTypes: ["token"] },
      Word: { kind: "list", itemTypes: ["word"] },
      Syllable: { kind: "list", itemTypes: ["syllable"] },
      Tone: { kind: "list", itemTypes: ["tone"] },
      Segment: { kind: "list", itemTypes: ["segment"] },
      SylStructure: { kind: "tree", itemTypes: ["word", "syllable", "segment"] },
      Transition: { kind: "list", itemTypes: ["transition"] },
      Intonation: { kind: "list", itemTypes: ["direction"] },
      Tilt: { kind: "list", itemTypes: ["tilt"] },
      PhraseCommand: { kind: "list", itemTypes: ["phraseCommand"] },
      Affect: { kind: "list", itemTypes: ["direction"] },
      Break: { kind: "list", itemTypes: ["direction"] },
      F0Point: { kind: "list", itemTypes: ["f0Point"] },
    },
  };
}

function getTranscriptionConfig(spec: CompiledRulepack): TranscriptionConfig | undefined {
  const value = spec.transcription;
  if (!isPlainObject(value)) return undefined;
  const diagnosticSymbols = isPlainObject(value.diagnostic_symbols)
    ? Object.fromEntries(
        Object.entries(value.diagnostic_symbols).filter(
          (entry): entry is [string, string[]] =>
            Array.isArray(entry[1]) && entry[1].every((item) => typeof item === "string"),
        ),
      )
    : undefined;
  const letterNames = isPlainObject(value.letter_names)
    ? Object.fromEntries(
        Object.entries(value.letter_names).filter(
          (entry): entry is [string, string[]] =>
            Array.isArray(entry[1]) && entry[1].every((item) => typeof item === "string"),
        ),
      )
    : undefined;
  const punctuationTokens = Array.isArray(value.punctuation_tokens)
    ? value.punctuation_tokens.filter((item): item is string => typeof item === "string")
    : undefined;
  return {
    diagnostic_symbols: diagnosticSymbols,
    // Passed as written; requireTranscriptionTables refuses a non-boolean.
    ...(value.diagnostic_symbol_input !== undefined
      ? { diagnostic_symbol_input: value.diagnostic_symbol_input as boolean }
      : {}),
    // Passed as written; requireTranscriptionTables checks each entry.
    ...(value.sources !== undefined
      ? { sources: value.sources as TranscriptionConfig["sources"] }
      : {}),
    ...(value.elided_apostrophe_lookup !== undefined
      ? { elided_apostrophe_lookup: value.elided_apostrophe_lookup as boolean }
      : {}),
    // Passed as written; requireTranscriptionTables refuses a non-string.
    ...(value.word_stretch_end_characters !== undefined
      ? { word_stretch_end_characters: value.word_stretch_end_characters as string }
      : {}),
    // Passed as written; requireTranscriptionTables refuses anything but two numbers.
    ...(value.word_stretch_length_limits !== undefined
      ? { word_stretch_length_limits: value.word_stretch_length_limits as number[] }
      : {}),
    // Passed as written; requireTranscriptionTables refuses anything but two maps of names.
    ...(value.written_word_marks !== undefined
      ? {
          written_word_marks: value.written_word_marks as TranscriptionConfig["written_word_marks"],
        }
      : {}),
    letter_names: letterNames,
    punctuation_tokens: punctuationTokens,
  };
}

function readPolicyNumber(entry: unknown): number | undefined {
  if (typeof entry === "number" && Number.isFinite(entry)) return entry;
  return isPlainObject(entry) && typeof entry.value === "number" && Number.isFinite(entry.value)
    ? entry.value
    : undefined;
}

function requirePolicyNumber(entry: unknown, path: string): number {
  const value = readPolicyNumber(entry);
  if (value === undefined)
    throw new Error(`E_POLICY_REQUIRED: parameters.policy.${path} must be finite`);
  return value;
}

function policyCitations(entry: unknown): string[] {
  return isPlainObject(entry) && Array.isArray(entry.citations)
    ? entry.citations.filter((citation): citation is string => typeof citation === "string")
    : [];
}

/**
 * The speaking rate in words per minute for a frontend whose rules take it
 * that way, or undefined for a frontend that declares no such mapping.
 *
 * `policy.rate.words_per_minute` says what the API's rate multiplier means:
 * `unit` is the words per minute of rate 1, and `minimum` and `maximum` are
 * the limits. The rate is a whole number of words per minute, as the
 * synthesizer the frontend follows keeps it. `ported_minimum` and
 * `ported_maximum`, when given, bound the rates for which every rate-dependent
 * rule of the original is in the rulepack; outside them the result is that of
 * the rules that are.
 */
function speakingRateWordsPerMinute(
  mapping: unknown,
  relativeRate: number,
  frontendId: string,
  diagnostics: Diagnostics | null | undefined,
  provenance: ProvenanceCollector,
): number | undefined {
  if (!isPlainObject(mapping)) return undefined;
  const unit = requirePolicyNumber(mapping.unit, "rate.words_per_minute.unit");
  const minimum = requirePolicyNumber(mapping.minimum, "rate.words_per_minute.minimum");
  const maximum = requirePolicyNumber(mapping.maximum, "rate.words_per_minute.maximum");
  const requested = relativeRate * unit;
  const rounded = Math.round(requested);
  const used = Math.min(maximum, Math.max(minimum, rounded));
  const data = { frontendId, requestedWordsPerMinute: requested, usedWordsPerMinute: used };
  // In messages the requested rate is shown to a thousandth; `data` has it whole.
  const shown = Number(requested.toFixed(3));
  if (used !== rounded) {
    diagnostics?.warn(
      `Speaking rate ${shown} words per minute is outside ${minimum} to ${maximum}; using ${used}`,
      { ...data, minimum, maximum },
      "W_RATE_CLAMPED",
    );
  } else if (Math.abs(requested - rounded) > 1e-9) {
    diagnostics?.info(
      `Speaking rate ${shown} words per minute is not a whole number; using ${used}`,
      data,
      "I_RATE_ROUNDED",
    );
  }
  const portedMinimum = readPolicyNumber(mapping.ported_minimum);
  const portedMaximum = readPolicyNumber(mapping.ported_maximum);
  if (
    (portedMinimum !== undefined && used < portedMinimum) ||
    (portedMaximum !== undefined && used > portedMaximum)
  ) {
    diagnostics?.warn(
      `Speaking rate ${used} words per minute is outside ${String(portedMinimum)} to ${String(portedMaximum)}, ` +
        "the range whose rate-dependent rules are all in the rulepack",
      { ...data, portedMinimum, portedMaximum },
      "W_RATE_RULES_NOT_PORTED",
    );
  }
  provenance.add({
    stage: "frontend",
    type: "speaking_rate_selected",
    subject: `frontend:${frontendId}:speaking_rate`,
    reason:
      `Rate ${Number(relativeRate.toFixed(6))} is ${shown} words per minute (rate 1 is ${unit}); ` +
      `policy.timing.speaking_rate_wpm = ${used}` +
      (used !== rounded ? ` (limits ${minimum} to ${maximum})` : ""),
    citations: [
      ...policyCitations(mapping.unit),
      ...policyCitations(mapping.minimum),
      ...policyCitations(mapping.maximum),
    ],
    parents: [],
  });
  return used;
}

function policyRecord(spec: CompiledRulepack): Record<string, unknown> {
  return isPlainObject(spec.parameters.policy) ? spec.parameters.policy : {};
}

function recordOrEmpty(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}

function mergedPolicy(
  spec: CompiledRulepack,
  additions: Record<string, unknown>,
): Record<string, unknown> {
  const base = policyRecord(spec);
  const output: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(additions)) {
    output[key] =
      isPlainObject(base[key]) && isPlainObject(value) ? { ...base[key], ...value } : value;
  }
  return { policy: output };
}

function isLayeredF0Model(value: unknown): value is LayeredF0ModelConfig {
  return (
    isPlainObject(value) &&
    value.type === "layered_additive" &&
    typeof value.frame_period_sec === "number" &&
    isPlainObject(value.filter) &&
    isPlainObject(value.layers) &&
    isPlainObject(value.output_clamp)
  );
}

function createStructure(
  utterance: Utterance,
  transcribed: readonly TranscriptionToken[],
  segments: readonly ReturnType<Utterance["allItems"]>[number][],
  spec: CompiledRulepack,
  inventory: InventorySpec,
): void {
  const tables = parseSyllabificationTables(spec.syllabification);
  const byToken = new Map<
    string,
    Array<{ token: TranscriptionToken; segment: (typeof segments)[number] }>
  >();
  transcribed.forEach((token, index) => {
    if (token.isPunctuation) return;
    const segment = segments[index];
    if (!segment) return;
    const group = byToken.get(token.sourceTokenId) ?? [];
    group.push({ token, segment });
    byToken.set(token.sourceTokenId, group);
  });
  const beginStructure = () =>
    utterance.beginTransaction({
      ruleId: "linguistic_structure",
      phase: "transcribe",
      tag: "structure",
      reason: "Create shared Word, Syllable, and Segment identity in SylStructure",
      citations: ["Taylor, Black & Caley 2001", "DECtalk 4.63 ph_syl.c ph_syllab"],
      stage: "transcribe",
    });
  // Each written word's place between two punctuation marks. A number spoken
  // as several words is one written word, and the pause inside it ends nothing.
  // A written word that ends in one of the frontend's stretch-end characters
  // ends the stretch too, once all of its tokens have gone by.
  // `spoken` is the word's place among the stretch's words as they are
  // spoken one by one: a word that the routine before it read ahead is not
  // counted there and has no place (0).
  type Stretch = { count: number; endSupplied: boolean; readAhead: number };
  const newStretch = (): Stretch => ({ count: 0, endSupplied: false, readAhead: 0 });
  const clausePlace = new Map<string, { index: number; spoken: number; clause: Stretch }>();
  let clause = newStretch();
  let endsAfterWord = false;
  let spoken = 0;
  for (const token of transcribed) {
    if (token.isPunctuation) {
      if (!token.continuesWrittenWord) {
        if (token.supplied) clause.endSupplied = true;
        clause = newStretch();
        endsAfterWord = false;
      }
      continue;
    }
    if (clausePlace.has(token.sourceTokenId)) continue;
    if (!token.continuesWrittenWord) {
      if (endsAfterWord) clause = newStretch();
      endsAfterWord = token.endsWordStretch === true;
      clause.count += 1;
      if (token.readAhead) clause.readAhead += 1;
      spoken = token.readAhead ? 0 : clause.count - clause.readAhead;
    }
    clausePlace.set(token.sourceTokenId, { index: clause.count, spoken, clause });
  }
  const sharedTransaction = Object.hasOwn(spec, "text_recognition") ? null : beginStructure();
  let wordIndex = 0;
  for (const [tokenId, group] of byToken) {
    const transaction = sharedTransaction ?? beginStructure();
    if (!sharedTransaction) {
      for (const { token } of group) {
        if (token._pronDecisionId) transaction.dependOn(token._pronDecisionId);
      }
    }
    const word = transaction.createItem("word", `word_${wordIndex.toString()}`);
    transaction.set(word, "text", group[0].token.word);
    transaction.set(word, "tokenIndex", wordIndex);
    // What the lexicon says of the word belongs to the Word: its Segments are
    // replaced by allophone rules, the Word is not.
    const { formClasses, textFormClasses, phraseStart, conjunctionRole } = group[0].token;
    if (formClasses) transaction.set(word, "form_classes", [...formClasses]);
    if (textFormClasses) transaction.set(word, "text_form_classes", [...textFormClasses]);
    if (conjunctionRole) transaction.set(word, "conjunction_sequence", conjunctionRole);
    const { writtenMarks } = group[0].token;
    if (writtenMarks?.length) transaction.set(word, "written_marks", [...writtenMarks]);
    const place = clausePlace.get(tokenId);
    if (place) {
      transaction.set(word, "clause_word_index", place.index);
      transaction.set(word, "clause_word_count", place.clause.count);
      transaction.set(word, "clause_spoken_index", place.spoken);
      if (place.clause.endSupplied) transaction.set(word, "clause_end_supplied", true);
    }
    if (phraseStart) transaction.set(word, "phrase_start", phraseStart);
    if (group[0].token.phraseStartUnbounded) {
      transaction.set(word, "phrase_start_unbounded", true);
    }
    transaction.append("Word", word);
    transaction.addRoot("SylStructure", word);
    const annotations = tables
      ? syllabifyWord(
          group.map((entry) => entry.token.phoneme),
          tables,
        )
      : group.map((_entry, index, all) => {
          const nuclei = all
            .map((_candidate, candidateIndex) =>
              inventory.nucleus_types.includes(
                String(utterance.getItem(`segment_${candidateIndex.toString()}`)?.get("type")),
              )
                ? candidateIndex
                : -1,
            )
            .filter((candidateIndex) => candidateIndex >= 0);
          const syllableIndex = Math.max(
            0,
            nuclei.findIndex(
              (_nucleus, nucleusIndex) =>
                index <= (nuclei[nucleusIndex + 1] ?? Number.POSITIVE_INFINITY) - 1,
            ),
          );
          return {
            syllableIndex,
            role: "onset",
            positionInWord: nuclei.length <= 1 ? "only" : "medial",
            syllableCount: Math.max(1, nuclei.length),
          };
        });
    const syllables = new Map<number, ReturnType<typeof transaction.createItem>>();
    for (let index = 0; index < group.length; index += 1) {
      const annotation = annotations[index];
      const syllableIndex = annotation?.syllableIndex ?? 0;
      let syllable = syllables.get(syllableIndex);
      if (!syllable) {
        syllable = transaction.createItem(
          "syllable",
          `${word.id}:syllable_${syllableIndex.toString()}`,
        );
        transaction.set(syllable, "index", syllableIndex);
        transaction.set(syllable, "stress", null);
        transaction.set(syllable, "positionInWord", annotation?.positionInWord ?? "only");
        transaction.append("Syllable", syllable);
        transaction.addDaughter("SylStructure", word, syllable);
        syllables.set(syllableIndex, syllable);
      }
      const lexicalStress = group[index].token.stress;
      const previousStress = syllable.get("stress");
      // Preserve 0/1/2 at the existing HRG boundary; primary outranks secondary,
      // and consonants (null) cannot erase a nucleus's lexical prominence.
      if (
        lexicalStress === 1 ||
        (previousStress !== 1 && lexicalStress === 2) ||
        (previousStress == null && lexicalStress === 0)
      ) {
        transaction.set(syllable, "stress", lexicalStress);
      }
      transaction.addDaughter("SylStructure", syllable, group[index].segment);
      transaction.associate(
        "source_token",
        group[index].segment,
        utterance.getItem(tokenId) ?? word,
      );
    }
    wordIndex += 1;
    if (!sharedTransaction) transaction.commit();
  }
  sharedTransaction?.commit();
}

export function normalizeText(text: string, frontendId = "qlatt-english"): string {
  const spec = loadBundledRulepackSpec(frontendId);
  // The same text the frontend speaks: after its text parser, when it has one.
  const textParser = parseTextParserConfig(spec);
  if (!textParser) return normalizeGraphText(text, spec);
  const dictionaryPath = loadFrontendResources(spec).dictionaryPath;
  const dictionary = dictionaryPath ? loadCmuDictionaryFromPathSync(dictionaryPath) : undefined;
  const parsed = runTextParser(
    textParser,
    text,
    (word) => dictionary !== undefined && Object.hasOwn(dictionary, word),
    createProvenanceCollector(),
  );
  return normalizeGraphText(parsed.text, spec);
}
export { transcribeText } from "./transcribe-text";

function buildTextToKlattTrackDetailed(
  inputText: string,
  baseF0: number | undefined,
  transitionMs: number,
  options: TextToKlattTrackOptions,
): TextToKlattTrackDetailedResult {
  const frontendId = options.frontendId ?? "qlatt-english";
  if (options.frontendPath && options.frontendId)
    throw new Error("E_FRONTEND_SELECTION: select frontendPath or frontendId, not both");
  const spec = options.frontendPath
    ? loadRulepackSpecFromPath(options.frontendPath)
    : loadBundledRulepackSpec(frontendId);
  const lowering = readLowerOptions(spec.output.lowering);
  const resources = loadFrontendResources(spec);
  // The active inventory declares the synthesizer parameters available to this frontend.
  const speakerFormantKeys = Object.keys(resources.inventory.base_params).filter((key) =>
    /^F[1-9]\d*$/.test(key),
  );
  const provenance = options.provenance ?? createProvenanceCollector();
  const utteranceSchema = buildUtteranceSchema(resources.inventory, spec);
  const utterance = new Utterance(utteranceSchema, provenance, options.diagnostics ?? undefined);
  for (const relationName of Object.keys(utteranceSchema.relations)) {
    utterance.relation(relationName);
  }

  const dictionary = resources.dictionaryPath
    ? loadCmuDictionaryFromPathSync(resources.dictionaryPath)
    : undefined;
  if (dictionary) {
    options.diagnostics?.info(
      `Loaded per-frontend dictionary '${resources.dictionaryPath}' (${Object.keys(dictionary).length} entries)`,
      { dictionaryPath: resources.dictionaryPath, entries: Object.keys(dictionary).length },
      "I_FRONTEND_DICTIONARY_LOADED",
    );
  }

  const registry = getVoiceRegistry(spec);
  if (typeof options.speaker === "string" && !registry) {
    throw new Error(`E_VOICE_REGISTRY_MISSING: frontend '${frontendId}' has no voice registry`);
  }

  // A frontend with a command text parser has its text rewritten by those
  // rules before anything else reads it (src/text-parser). The parser also
  // reads the text's commands, and a voice or rate command that stands
  // before any spoken text sets the voice and the rate of the whole text:
  // so it runs before the voice is chosen. The voice and the rate that were
  // asked for are the state the text starts in, as say.exe's are.
  const textParser = parseTextParserConfig(spec);
  const rateUnit = readPolicyNumber(
    recordOrEmpty(recordOrEmpty(policyRecord(spec).rate).words_per_minute).unit,
  );
  const rateReference =
    readPolicyNumber(recordOrEmpty(policyRecord(spec).duration).rate_reference) || 1;
  const parsedText = textParser
    ? runTextParser(
        textParser,
        inputText,
        (word) => dictionary !== undefined && Object.hasOwn(dictionary, word),
        provenance,
        {
          ...(options.diagnostics ? { diagnostics: options.diagnostics } : {}),
          ...(rateUnit !== undefined && Number.isFinite(options.rate ?? 1)
            ? { initialRate: Math.round(((options.rate ?? 1) / rateReference) * rateUnit) }
            : {}),
        },
      )
    : null;
  let commandVoice: string | undefined;
  if (parsedText?.initial.voice !== undefined && registry) {
    if (registry.voices.length === 0 || registry.voices.includes(parsedText.initial.voice)) {
      commandVoice = parsedText.initial.voice;
    } else {
      options.diagnostics?.warn(
        `The text asks for the voice '${parsedText.initial.voice}', which this frontend does not have; the voice stays`,
        { voice: parsedText.initial.voice, available: registry.voices },
        "W_TEXT_COMMAND_VOICE_UNKNOWN",
      );
    }
  }
  const speakerProfilePath = spec.speaker_profile_path ?? DEFAULT_SPEAKER_PROFILE_PATH;
  const speakerProfile = loadSpeakerProfileSync(speakerProfilePath);
  const selectedVoice: ResolvedVoice | null = registry
    ? resolveVoice(
        registry,
        commandVoice ?? (typeof options.speaker === "string" ? options.speaker : registry.default),
        speakerProfile,
        // Entries of the voice's speaker definition that commands before any
        // spoken text changed (src/text-parser/frontend.ts).
        parsedText?.initial.definition ?? [],
      )
    : null;
  const speakerOverride: SpeakerProfileOverride | undefined =
    typeof options.speaker === "object" ? options.speaker : undefined;
  // A voice's rule fields select data inside the rules (tables, constants);
  // a caller's profile override may not change them.
  const overriddenRuleFields = Object.keys(speakerOverride ?? {}).filter((field) =>
    Object.hasOwn(registry?.ruleFields ?? {}, field),
  );
  if (overriddenRuleFields.length > 0) {
    throw new Error(
      `E_VOICE_RULE_FIELD_OVERRIDE: a speaker override may not set the voice rule field(s) ` +
        `${overriddenRuleFields.join(", ")}; select a voice by name instead`,
    );
  }

  const resolvedSpeaker = resolveSpeakerProfile({
    baseF0,
    speakerOverride,
    voiceProfile: selectedVoice?.override,
    profileSpec: speakerProfile,
  });
  const speakerDecision = provenance.add({
    stage: "frontend",
    type: "speaker_profile_selected",
    subject: "speaker_profile",
    reason: `Resolved speaker profile ${Object.entries(resolvedSpeaker)
      .map(([name, value]) => `${name}=${value}`)
      .join(", ")}`,
    citations: collectSpeakerProfileCitations(speakerProfile, speakerProfilePath),
  });
  // What rules read as params.policy.voice: the selected voice's rule fields.
  const voiceRuleFields =
    selectedVoice && Object.keys(selectedVoice.ruleFields).length > 0
      ? selectedVoice.ruleFields
      : null;
  if (selectedVoice && voiceRuleFields && registry) {
    // Optional rule fields this voice does not give: a rule that reads one
    // falls back to its own default, so the record says which they are.
    const given = Object.entries(voiceRuleFields).filter(([, value]) => value !== null);
    const notGiven = Object.keys(voiceRuleFields).filter((name) => voiceRuleFields[name] === null);
    const notGivenNote =
      notGiven.length > 0 ? `; not given by this voice: ${notGiven.join(", ")}` : "";
    provenance.add({
      stage: "frontend",
      type: "voice_parameters_selected",
      subject: `voice:${selectedVoice.name}`,
      reason: `Rule parameters of voice ${selectedVoice.name}: ${given
        .map(([name, value]) => `${name}=${value}`)
        .join(", ")}${notGivenNote}`,
      citations: [
        ...selectedVoice.citations,
        ...Object.values(registry.ruleFields).flatMap((field) => field.citations),
      ],
      parents: [speakerDecision.id],
    });
  }

  const sourcePath = spec.source_contour_path ?? DEFAULT_SOURCE_CONTOUR_PATH;
  const source = resolveSourceContour({
    spec: loadSourceContourSync(sourcePath),
    requestedQuality: options.voiceQuality,
    speaker: resolvedSpeaker,
    baseF0Hz: resolvedSpeaker.base_f0_hz,
  });
  source.citations = [
    sourcePath,
    ...source.citations.filter((citation) => citation !== DEFAULT_SOURCE_CONTOUR_PATH),
  ];
  const sourceDecision = provenance.add({
    stage: "frontend",
    type: "source_contour_selected",
    subject: "source_contour",
    reason: `Resolved source contour preset=${source.presetName}, source_mode=${source.baseline.source_mode}, rd=${source.baseline.rd}, rd_ref=${source.baseline.rd_ref}, base_f0_hz=${source.effectiveBaseF0Hz}`,
    citations: source.citations,
    parents: [speakerDecision.id],
  });

  const { onStage } = options;
  const onPhaseEnd = onStage ? (phase: string) => onStage(`phase ${phase}`) : undefined;
  onStage?.("setup");
  const transcriptionConfig = getTranscriptionConfig(spec);
  // The text parser's output (run above, before the voice was chosen) is the
  // source text.
  if (parsedText) {
    recognizeText(parsedText.text, utterance, spec, {
      parents: parsedText.decisionIds,
      reason: `Source text is the text parser's output; UTF-16 source coordinates are its`,
    });
  } else {
    recognizeText(inputText, utterance, spec);
  }
  // Phase checkpoints and rule attempts are recorded only when asked for, in
  // these phases as in the later ones: a checkpoint serializes the whole graph.
  const captureTooling = options.captureTooling === true;
  onStage?.("text parser and recognition");
  const normalized = normalizeSourceItems(utterance, spec, { captureTooling });
  onStage?.("normalization phases");
  const transcribed = transcribeText(normalized, {
    captureTooling,
    provenance,
    utterance,
    compiledSpec: spec,
    transcriptionConfig,
    ltsPath: resources.ltsPath,
    morphologyPath: resources.morphologyPath,
    stressPolicyPath: resources.stressPolicyPath,
    diagnostics: options.diagnostics,
    dictionaryMap: dictionary,
    dictLookup: dictionary == null && spec.skip_dictionary ? () => null : undefined,
  });

  onStage?.("transcription");
  const inventoryDecision = provenance.add({
    stage: "frontend",
    type: "inventory_selected",
    subject: `inventory:${frontendId}`,
    reason: `Selected frontend inventory '${resources.inventoryPath}'`,
    citations: [resources.inventoryPath, ...(resources.inventory.citations ?? [])],
  });
  const construct = utterance.beginTransaction({
    ruleId: "inventory_materialization",
    phase: "transcribe",
    tag: "inventory",
    reason: "Materialize transcribed phonemes as typed Segment Items",
    citations: [resources.inventoryPath, ...(resources.inventory.citations ?? [])],
    stage: "transcribe",
  });
  construct.dependOn(inventoryDecision.id);
  const invalidInventoryParameters: InventoryParameterFallback[] = [];
  const secondaryProjections: { segment: string; target: string }[] = [];
  const segments = transcribed.map((token, index) => {
    if (token._pronDecisionId) construct.dependOn(token._pronDecisionId);
    const item = construct.createItem("segment", `segment_${index.toString()}`);
    const materialized = materializePhonemeTarget(token.phoneme, {
      stress: token.stress,
      inventorySpec: resources.inventory,
      diagnostics: utterance.diagnostics,
      onInvalidParameter: (fallback) =>
        invalidInventoryParameters.push({
          ...fallback,
          segment: item.id,
          token: token.sourceTokenId,
        }),
      onSelection: (selection) => {
        const parents = [
          inventoryDecision.id,
          ...(token._pronDecisionId ? [token._pronDecisionId] : []),
        ];
        if (selection.secondaryStressFallback && resources.inventory.secondary_stress_fallback) {
          const fallback = resources.inventory.secondary_stress_fallback;
          const reason = `Lexical secondary stress uses ${selection.selectedKey}; lexical prominence remains secondary`;
          const decision = provenance.add({
            stage: "transcribe",
            type: "stress_inventory_projection",
            subject: item.id,
            reason,
            citations: fallback.citations,
            parents: [
              inventoryDecision.id,
              ...(token._pronDecisionId ? [token._pronDecisionId] : []),
            ],
          });
          construct.dependOn(decision.id);
          parents.push(decision.id);
          secondaryProjections.push({ segment: item.id, target: selection.selectedKey });
        }
        const decision = provenance.add({
          stage: "transcribe",
          type: "inventory_target_selected",
          subject: item.id,
          reason: `Selected inventory target '${selection.selectedKey}' for '${selection.inputPhone}' with stress ${selection.stress ?? "unspecified"} from ${token.sourceTokenId}${selection.defaultDurationMs === undefined ? "" : `; applied declared default duration ${selection.defaultDurationMs} ms`}${selection.areaFunction ? `; derived from area function ${selection.areaFunction.source} using ${selection.areaFunction.model}, speaker ${JSON.stringify(selection.areaFunction.speaker)}` : ""}`,
          inventorySelection: { ...selection, sourceTokenId: token.sourceTokenId },
          citations: [
            resources.inventoryPath,
            ...(selection.areaFunction?.citations ?? []),
            ...(selection.secondaryStressFallback
              ? (resources.inventory.secondary_stress_fallback?.citations ?? [])
              : []),
          ],
          parents,
        });
        construct.dependOn(decision.id);
      },
    });
    construct.set(item, "phoneme", token.phoneme);
    if (token.morphemeBoundaryAfter) construct.set(item, "morpheme_boundary_after", true);
    if (token.wordTextStart) construct.set(item, "word_text_start", true);
    if (token.rulesBlocked) construct.set(item, "rules_blocked", true);
    if (token.writtenDurationMs !== undefined) {
      construct.set(item, "written_duration_ms", token.writtenDurationMs);
    }
    if (token.writtenSilence) construct.set(item, "written_silence", true);
    if (token.writtenPitch !== undefined) construct.set(item, "written_pitch", token.writtenPitch);
    construct.set(item, "stress", token.stress);
    construct.set(item, "word", token.word);
    construct.set(item, "sourceTokenId", token.sourceTokenId);
    construct.set(item, "punctuationSymbol", token.isPunctuation ? (token.symbol ?? null) : null);
    if (token.isPunctuation && token.sentMark) construct.set(item, "punctuation_sent", true);
    construct.set(item, "active", true);
    for (const [key, value] of Object.entries(materialized)) {
      if (key === "phoneme" || key === "params") continue;
      construct.set(item, key, value ?? null);
    }
    for (const [key, value] of Object.entries(materialized.params)) construct.set(item, key, value);
    construct.append("Segment", item);
    return item;
  });
  if (secondaryProjections.length)
    options.diagnostics?.info(
      "Lexical secondary stress uses the cited inventory realization policy; lexical prominence remains secondary",
      { count: secondaryProjections.length, affected: secondaryProjections },
      "STRESS_INVENTORY_FALLBACK",
    );
  if (segments.length > 0) {
    construct.partitionAnchors(segments, utterance.axis.start.id, utterance.axis.end.id);
  }
  construct.commit();
  onStage?.("segments");
  createStructure(utterance, transcribed, segments, spec, resources.inventory);
  onStage?.("structure");

  const requestedRate = options.rate ?? 1;
  if (!Number.isFinite(requestedRate) || requestedRate <= 0) {
    throw new Error(
      `E_RATE_INVALID: rate must be a finite number greater than zero, got ${String(requestedRate)}`,
    );
  }
  const durationPolicy = recordOrEmpty(policyRecord(spec).duration);
  const referenceRate = readPolicyNumber(durationPolicy.rate_reference);
  // No ceiling and no floor: the requested rate is the rate. Duration floors
  // (Klatt 1976 incompressible portion, projected by the duration_floor_* rules)
  // are the only limit on compression, and they are cited per phone.
  // A rate command that stands before any spoken text gives the text's rate
  // in words per minute (src/text-parser/frontend.ts).
  const commandRate = parsedText?.initial.rate;
  const relativeRate =
    commandRate !== undefined && rateUnit !== undefined
      ? commandRate / rateUnit
      : referenceRate && referenceRate > 0
        ? requestedRate / referenceRate
        : requestedRate;
  // A frontend whose rules take the speaking rate in words per minute
  // (policy.rate.words_per_minute) gets the rate as the policy value
  // policy.timing.speaking_rate_wpm and nothing else: its own rules say what a
  // rate does, so the generic effects below (uniform duration scaling, F0
  // range, transition time, undershoot) see a rate of 1.
  const wordsPerMinute = speakingRateWordsPerMinute(
    recordOrEmpty(policyRecord(spec).rate).words_per_minute,
    relativeRate,
    frontendId,
    options.diagnostics,
    provenance,
  );
  const rate = wordsPerMinute === undefined ? relativeRate : 1;
  const commandPauses = parsedText?.initial.pauseAddedMs;
  const speakerPolicy = {
    speaker: resolvedSpeaker,
    ...(voiceRuleFields ? { voice: voiceRuleFields } : {}),
    ...(wordsPerMinute === undefined && !commandPauses
      ? {}
      : {
          timing: {
            ...(wordsPerMinute === undefined ? {} : { speaking_rate_wpm: wordsPerMinute }),
            // What pause commands before any spoken text add to the comma's
            // and the period's pause (src/text-parser/frontend.ts); the
            // frontend's rules say what that does.
            ...(commandPauses
              ? {
                  pause_added_ms: {
                    comma: commandPauses.comma ?? 0,
                    period: commandPauses.period ?? 0,
                  },
                }
              : {}),
          },
        }),
  };
  const graphInventory = {
    spec: resources.inventory,
    decisionId: inventoryDecision.id,
    onInvalidParameter: (fallback: InventoryParameterFallback) =>
      invalidInventoryParameters.push(fallback),
  };
  let evaluationOwner = ruleEvaluationOwners.get(spec);
  if (!evaluationOwner) {
    evaluationOwner = new GraphRuleEvaluationOwner();
    ruleEvaluationOwners.set(spec, evaluationOwner);
  }
  runGraphRuleEngine(utterance, spec, {
    evaluationOwner,
    phases: ["normalize", "postlexical", "structural"],
    parameters: mergedPolicy(spec, speakerPolicy),
    inventory: graphInventory,
    captureTooling,
    onPhaseEnd,
  });
  if (options.directionTrack) {
    const parsed = parseDirectionInput(
      {
        score: {
          text:
            typeof normalized === "string"
              ? normalized
              : normalized.map((entry) => entry.word).join(" "),
        },
        directionTrack: options.directionTrack,
      },
      { provenance },
    );
    attachDirectionsToUtterance(parsed, utterance);
  }

  // Authored stress must be visible to accent assignment and onset propagation.
  runGraphRuleEngine(utterance, spec, {
    evaluationOwner,
    phases: ["annotation"],
    parameters: mergedPolicy(spec, speakerPolicy),
    inventory: graphInventory,
    captureTooling,
    onPhaseEnd,
  });

  const ratePolicy = recordOrEmpty(policyRecord(spec).rate);
  const undershoot = requirePolicyNumber(
    ratePolicy.undershoot_coefficient,
    "rate.undershoot_coefficient",
  );
  const f0Exponent = requirePolicyNumber(ratePolicy.f0_range_exponent, "rate.f0_range_exponent");
  const transitionExponent = requirePolicyNumber(
    ratePolicy.transition_scale_exponent,
    "rate.transition_scale_exponent",
  );
  const formantRate = Math.max(0, (rate - 1) * undershoot);
  // Duration floors are projected by the `duration_floor_*` scalar rules at the
  // end of the duration phase (traced, cited). The floor magnitudes live in the
  // frontend's `output.lowering.timeline.duration_floors` block and are passed
  // into the rule engine as duration policy so the rules stay data-driven.
  const stopReleaseFloorMs = lowering.timeline.duration_floors.stop_release_ms.value;
  const defaultDurationFloorMs = lowering.timeline.duration_floors.default_ms.value;
  runGraphRuleEngine(utterance, spec, {
    evaluationOwner,
    phases: ["duration"],
    parameters: mergedPolicy(spec, {
      ...speakerPolicy,
      duration: {
        rate_scale: rate,
        stop_release_floor_ms: stopReleaseFloorMs,
        default_floor_ms: defaultDurationFloorMs,
      },
      formant: { rate_undershoot_factor: formantRate },
    }),
    inventory: graphInventory,
    captureTooling,
    onPhaseEnd,
  });
  runGraphRuleEngine(utterance, spec, {
    evaluationOwner,
    phases: ["formant"],
    parameters: mergedPolicy(spec, {
      ...speakerPolicy,
      formant: { rate_undershoot_factor: formantRate },
    }),
    inventory: graphInventory,
    captureTooling,
    onPhaseEnd,
  });
  const f0Policy = recordOrEmpty(policyRecord(spec).f0);
  const f0Range = rate ** -f0Exponent;
  runGraphRuleEngine(utterance, spec, {
    evaluationOwner,
    // Then every phase the rulepack declares after `finalize`: rules that need
    // final durations and times, such as frame programs.
    phases: [
      "prosody",
      "finalize",
      ...spec.phases.filter((phase) => phase.after.includes("finalize")).map((phase) => phase.name),
    ],
    parameters: mergedPolicy(spec, {
      ...speakerPolicy,
      f0: {
        base_hz: source.effectiveBaseF0Hz,
        continuation_rise_hz: (readPolicyNumber(f0Policy.continuation_rise_hz) ?? 8) * f0Range,
        continuation_minor_rise_hz:
          (readPolicyNumber(f0Policy.continuation_minor_rise_hz) ?? 5) * f0Range,
      },
    }),
    inventory: graphInventory,
    captureTooling,
    onPhaseEnd,
  });

  const referenceVoice = registry ? resolveVoice(registry, registry.default, speakerProfile) : null;
  const speakerStamp = utterance.beginTransaction({
    ruleId: "speaker_source_projection",
    phase: "frontend",
    tag: "speaker",
    reason: "Project selected speaker and source policy onto final Segment targets",
    citations: [
      ...source.citations,
      ...collectSpeakerProfileCitations(speakerProfile, speakerProfilePath),
    ],
    stage: "frontend",
  });
  speakerStamp.dependOn(speakerDecision.id).dependOn(sourceDecision.id);
  for (const item of utterance.relation("Segment").listItems()) {
    if (item.get("active") === false) continue;
    // Project the resolved source/speaker policy via the declarative projection
    // table, using the formant frequencies declared by the active inventory.
    const projectedFields = new Map<string, number>();
    projectSpeakerFields(
      source.projection,
      {
        get: (field) => projectedFields.get(field) ?? item.get(field),
        set: (field, value) => {
          projectedFields.set(field, value);
          speakerStamp.set(item, field, value);
        },
      },
      {
        source_mode: source.baseline.source_mode,
        rd: source.baseline.rd,
        rd_ref: source.baseline.rd_ref,
        spectral_tilt_offset_db: source.baseline.spectral_tilt_offset_db,
      },
      source.voiceQualityOverrides,
      resolvedSpeaker.formant_scale,
      speakerFormantKeys,
    );
    if (selectedVoice && registry) {
      for (const field of registry.speakerFrameParams) {
        const value = selectedVoice.params[field];
        if (typeof value === "number" && Number.isFinite(value))
          speakerStamp.set(item, field, value);
      }
      if (referenceVoice) {
        for (const mapping of registry.speakerGainOffsets) {
          const selected = selectedVoice.params[mapping.gain];
          const reference = referenceVoice.params[mapping.gain];
          const current = item.get(mapping.param);
          if (
            typeof selected === "number" &&
            typeof reference === "number" &&
            typeof current === "number"
          ) {
            speakerStamp.set(item, mapping.param, current + selected - reference);
          }
        }
      }
    }
  }
  speakerStamp.commit();
  onStage?.("speaker projection");

  let speakerParams: Record<string, unknown> | undefined;
  if (isLayeredF0Model(spec.f0_model)) {
    speakerParams = {};
    const configured = recordOrEmpty(policyRecord(spec).speaker);
    for (const [key, value] of Object.entries(configured)) {
      const number = readPolicyNumber(value);
      if (number !== undefined) speakerParams[key] = number;
    }
    if (selectedVoice) {
      Object.assign(speakerParams, selectedVoice.params);
      // Preserve the declared voice as a reference distinct from the requested profile.
      speakerParams.voice = selectedVoice.params;
    }
    speakerParams.base_f0_hz = resolvedSpeaker.base_f0_hz;
  }

  const silence = materializePhonemeTarget(resources.inventory.silence_symbol, {
    inventorySpec: resources.inventory,
    onInvalidParameter: graphInventory.onInvalidParameter,
  });
  reportInventoryParameterFallbacks(options.diagnostics, invalidInventoryParameters);
  const silenceDecision = provenance.add({
    stage: "frontend",
    type: "silence_resource_selected",
    subject: `inventory:${frontendId}:${resources.inventory.silence_symbol}`,
    reason: "Selected declared inventory silence target for lowering edges",
    citations: [resources.inventoryPath],
    parents: [inventoryDecision.id],
  });
  const scaledTransition = transitionMs * rate ** -transitionExponent;
  const lowerOptions = {
    ...lowering,
    transitions: {
      ...lowering.transitions,
      default_transition_ms: { value: scaledTransition },
    },
  };
  const lowered = lowerToFrames(utterance, lowerOptions, {
    f0Model: isLayeredF0Model(spec.f0_model) ? spec.f0_model : undefined,
    frameValueFeatures: frameValueFeatures(spec.frame_programs),
    speakerParams,
    speakerSex: selectedVoice?.sex,
    silence: {
      symbol: resources.inventory.silence_symbol,
      initialParams: silence.params,
      finalParams: silence.params,
      decisionId: silenceDecision.id,
    },
  });
  onStage?.("lowering");
  return { track: lowered.frames, utterance, resolvedSpeaker, speakerParams };
}

export function textToKlattTrackDetailed(
  inputText: string,
  baseF0: number | undefined = undefined,
  transitionMs = 30,
  options: TextToKlattTrackOptions = {},
): TextToKlattTrackDetailedResult {
  return buildTextToKlattTrackDetailed(inputText, baseF0, transitionMs, options);
}

export function textToKlattTrack(
  inputText: string,
  baseF0: number | undefined = undefined,
  transitionMs = 30,
  options: TextToKlattTrackOptions = {},
): KlattFrame[] {
  return buildTextToKlattTrackDetailed(inputText, baseF0, transitionMs, options).track;
}
