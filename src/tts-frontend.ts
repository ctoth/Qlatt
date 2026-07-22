import { loadCmuDictionaryFromPathSync } from "./cmu-dictionary-loader";
import {
  loadFrontendResources,
  materializePhonemeTarget,
  type InventorySpec,
} from "./declarative-frontend/inventory";
import { loadBundledRulepackSpec, type CompiledRulepack } from "./declarative-frontend/rule-pack";
import {
  lowerToFrames,
  readLowerOptions,
  Utterance,
  type FeatureSchema,
  type HrgSchema,
  type LayeredF0ModelConfig,
} from "./declarative-frontend/hrg";
import {
  GraphRuleEvaluationOwner,
  runGraphRuleEngine,
} from "./declarative-frontend/hrg/rule-engine";
import { normalizeText } from "./g2p/text-normalize";
import { createProvenanceCollector, type ProvenanceCollector } from "./provenance";
import { transcribeText } from "./transcribe-text";
import type { Diagnostics } from "./diagnostics";
import type { KlattFrame, TranscriptionConfig, TranscriptionToken } from "./tts-frontend-types";
import {
  DEFAULT_SPEAKER_PROFILE_PATH,
  collectSpeakerProfileCitations,
  loadSpeakerProfileSync,
  resolveSpeakerProfile,
  type ResolvedSpeakerProfile,
  type SpeakerProfileOverride,
} from "./speaker-profile";
import { getVoiceRegistry, resolveVoice, type ResolvedVoice } from "./dectalk-voice";
import {
  DEFAULT_SOURCE_CONTOUR_PATH,
  loadSourceContourSync,
  resolveSourceContour,
  type SourceContourVoiceQuality,
} from "./source-contour";
import { projectSpeakerFields } from "./speaker-projection";
import { DIRECTION_ITEM_SCHEMA, attachDirectionsToUtterance, parseDirectionInput } from "./input/parse";
import type { DirectionTrack } from "./input/direction-track";
import { parseSyllabificationTables, syllabifyWord } from "./declarative-frontend/syllabify";
import { isPlainObject } from "./yaml-loader";

export type VoiceQuality = SourceContourVoiceQuality;

export type TextToKlattTrackOptions = {
  provenance?: ProvenanceCollector | null;
  frontendId?: string;
  rate?: number;
  speaker?: string | SpeakerProfileOverride;
  voiceQuality?: VoiceQuality;
  directionTrack?: DirectionTrack;
  diagnostics?: Diagnostics | null;
  captureTooling?: boolean;
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
    "target", "start_ms", "end_ms", "start_ratio", "end_ratio",
    "prefix_ms", "suffix_ms", "fields", "tag",
  ],
};

function schemaForValue(value: unknown): FeatureSchema | null {
  if (value === null) return { kind: "null" };
  if (typeof value === "string") return { kind: "string" };
  if (typeof value === "number") return Number.isFinite(value) ? { kind: "number" } : null;
  if (typeof value === "boolean") return { kind: "boolean" };
  if (Array.isArray(value)) {
    const variants = value.map(schemaForValue).filter((entry): entry is FeatureSchema => entry !== null);
    const items = variants.length === 0 ? { kind: "string" } satisfies FeatureSchema : mergeSchemas(variants);
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
      const observed = objects.flatMap((schema) => schema.fields[key] ? [schema.fields[key]] : []);
      fields[key] = mergeSchemas(observed);
      if (observed.length !== objects.length || objects.some((schema) => schema.optional?.includes(key))) {
        optional.push(key);
      }
    }
    return optional.length > 0
      ? { kind: "object", fields, optional }
      : { kind: "object", fields };
  }
  const unique = new Map<string, FeatureSchema>();
  for (const schema of schemas) unique.set(JSON.stringify(schema), schema);
  const variants = [...unique.values()];
  return variants.length === 1 ? variants[0] : { kind: "union", variants };
}

function buildUtteranceSchema(inventory: InventorySpec): HrgSchema {
  const segmentFeatures: Record<string, FeatureSchema> = {
    phoneme: { kind: "string" },
    type: { kind: "string" },
    word: { kind: "string" },
    sourceTokenId: { kind: "string" },
    punctuationSymbol: STRING_OR_NULL,
    stress: NUMBER_OR_NULL,
    duration: { kind: "number" },
    durationFloor: { kind: "number" },
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
    dummy_vowel: { kind: "boolean" },
    weak: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
    glottal: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
  };
  for (const key of Object.keys(inventory.base_params)) segmentFeatures[key] = { kind: "number" };
  for (const target of Object.values(inventory.phoneme_targets)) {
    for (const [key, value] of Object.entries(target)) {
      if (key === "dur" || key === "SW" || key === "type") continue;
      const observed = schemaForValue(value);
      const schema = observed?.kind === "boolean"
        ? mergeSchemas([observed, { kind: "null" }])
        : observed;
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
      token: {
        features: {
          word: { kind: "string" },
          tokenType: { kind: "string", values: ["word", "punctuation"] },
          punctuationSymbol: STRING_OR_NULL,
          pronunciationKey: STRING_OR_NULL,
          active: { kind: "boolean" },
        },
      },
      word: { features: { text: { kind: "string" }, tokenIndex: { kind: "number" } } },
      syllable: {
        features: {
          index: { kind: "number" }, stress: NUMBER_OR_NULL, positionInWord: { kind: "string" },
        },
      },
      segment: { features: segmentFeatures },
      f0Point: { features: pointFeatures },
      phraseCommand: { features: pointFeatures },
      tilt: { features: pointFeatures },
      direction: DIRECTION_ITEM_SCHEMA,
      transition: { features: { active: { kind: "boolean" } } },
    },
    relations: {
      Token: { kind: "list", itemTypes: ["token"] },
      Word: { kind: "list", itemTypes: ["word"] },
      Syllable: { kind: "list", itemTypes: ["syllable"] },
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
    ? Object.fromEntries(Object.entries(value.diagnostic_symbols).filter((entry): entry is [string, string[]] =>
      Array.isArray(entry[1]) && entry[1].every((item) => typeof item === "string")))
    : undefined;
  const letterNames = isPlainObject(value.letter_names)
    ? Object.fromEntries(Object.entries(value.letter_names).filter((entry): entry is [string, string[]] =>
      Array.isArray(entry[1]) && entry[1].every((item) => typeof item === "string")))
    : undefined;
  const punctuationTokens = Array.isArray(value.punctuation_tokens)
    ? value.punctuation_tokens.filter((item): item is string => typeof item === "string")
    : undefined;
  return { diagnostic_symbols: diagnosticSymbols, letter_names: letterNames, punctuation_tokens: punctuationTokens };
}

function readPolicyNumber(entry: unknown): number | undefined {
  if (typeof entry === "number" && Number.isFinite(entry)) return entry;
  return isPlainObject(entry) && typeof entry.value === "number" && Number.isFinite(entry.value)
    ? entry.value
    : undefined;
}

function requirePolicyNumber(entry: unknown, path: string): number {
  const value = readPolicyNumber(entry);
  if (value === undefined) throw new Error(`E_POLICY_REQUIRED: parameters.policy.${path} must be finite`);
  return value;
}

function policyRecord(spec: CompiledRulepack): Record<string, unknown> {
  return isPlainObject(spec.parameters.policy) ? spec.parameters.policy : {};
}

function recordOrEmpty(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}

function mergedPolicy(spec: CompiledRulepack, additions: Record<string, unknown>): Record<string, unknown> {
  const base = policyRecord(spec);
  const output: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(additions)) {
    output[key] = isPlainObject(base[key]) && isPlainObject(value) ? { ...base[key], ...value } : value;
  }
  return { policy: output };
}

function isLayeredF0Model(value: unknown): value is LayeredF0ModelConfig {
  return isPlainObject(value)
    && value.type === "layered_additive"
    && typeof value.frame_period_sec === "number"
    && isPlainObject(value.filter)
    && isPlainObject(value.layers)
    && isPlainObject(value.output_clamp);
}

function createStructure(
  utterance: Utterance,
  transcribed: readonly TranscriptionToken[],
  segments: readonly ReturnType<Utterance["allItems"]>[number][],
  spec: CompiledRulepack,
): void {
  const tables = parseSyllabificationTables(spec.syllabification);
  const byToken = new Map<string, Array<{ token: TranscriptionToken; segment: typeof segments[number] }>>();
  transcribed.forEach((token, index) => {
    if (token.isPunctuation) return;
    const segment = segments[index];
    if (!segment) return;
    const group = byToken.get(token.sourceTokenId) ?? [];
    group.push({ token, segment });
    byToken.set(token.sourceTokenId, group);
  });
  const transaction = utterance.beginTransaction({
    ruleId: "linguistic_structure",
    phase: "transcribe",
    tag: "structure",
    reason: "Create shared Word, Syllable, and Segment identity in SylStructure",
    citations: ["Taylor, Black & Caley 2001", "DECtalk 4.63 ph_syl.c ph_syllab"],
    stage: "transcribe",
  });
  let wordIndex = 0;
  for (const [tokenId, group] of byToken) {
    const word = transaction.createItem("word", `word_${wordIndex.toString()}`);
    transaction.set(word, "text", group[0].token.word);
    transaction.set(word, "tokenIndex", wordIndex);
    transaction.append("Word", word);
    transaction.addRoot("SylStructure", word);
    const annotations = tables
      ? syllabifyWord(group.map((entry) => entry.token.phoneme), tables)
      : group.map((entry, index, all) => {
          const nuclei = all.map((candidate, candidateIndex) =>
            utterance.getItem(`segment_${candidateIndex.toString()}`)?.get("type") === "vowel" ? candidateIndex : -1)
            .filter((candidateIndex) => candidateIndex >= 0);
          const syllableIndex = Math.max(0, nuclei.findIndex((nucleus, nucleusIndex) =>
            index <= (nuclei[nucleusIndex + 1] ?? Number.POSITIVE_INFINITY) - 1));
          return { syllableIndex, role: "onset", positionInWord: nuclei.length <= 1 ? "only" : "medial", syllableCount: Math.max(1, nuclei.length) };
        });
    const syllables = new Map<number, ReturnType<typeof transaction.createItem>>();
    for (let index = 0; index < group.length; index += 1) {
      const annotation = annotations[index];
      const syllableIndex = annotation?.syllableIndex ?? 0;
      let syllable = syllables.get(syllableIndex);
      if (!syllable) {
        syllable = transaction.createItem("syllable", `${word.id}:syllable_${syllableIndex.toString()}`);
        transaction.set(syllable, "index", syllableIndex);
        transaction.set(syllable, "stress", null);
        transaction.set(syllable, "positionInWord", annotation?.positionInWord ?? "only");
        transaction.append("Syllable", syllable);
        transaction.addDaughter("SylStructure", word, syllable);
        syllables.set(syllableIndex, syllable);
      }
      if (group[index].token.stress === 1) transaction.set(syllable, "stress", 1);
      transaction.addDaughter("SylStructure", syllable, group[index].segment);
      transaction.associate("source_token", group[index].segment, utterance.getItem(tokenId) ?? word);
    }
    wordIndex += 1;
  }
  transaction.commit();
}

export { normalizeText } from "./g2p/text-normalize";
export { transcribeText } from "./transcribe-text";

function buildTextToKlattTrackDetailed(
  inputText: string,
  baseF0: number | undefined,
  transitionMs: number,
  options: TextToKlattTrackOptions,
): TextToKlattTrackDetailedResult {
  const frontendId = options.frontendId ?? "qlatt-english";
  const spec = loadBundledRulepackSpec(frontendId);
  const lowering = readLowerOptions(spec.output.lowering);
  const resources = loadFrontendResources(spec);
  const provenance = options.provenance ?? createProvenanceCollector();
  const utterance = new Utterance(buildUtteranceSchema(resources.inventory), provenance, options.diagnostics ?? undefined);
  for (const relationName of Object.keys(buildUtteranceSchema(resources.inventory).relations)) {
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
  let selectedVoice: ResolvedVoice | null = null;
  let speakerOverride: SpeakerProfileOverride | undefined;
  if (typeof options.speaker === "string") {
    if (!registry) throw new Error(`E_VOICE_REGISTRY_MISSING: frontend '${frontendId}' has no voice registry`);
    selectedVoice = resolveVoice(registry, options.speaker);
    speakerOverride = selectedVoice.override;
  } else if (options.speaker) {
    speakerOverride = options.speaker;
  } else if (registry) {
    selectedVoice = resolveVoice(registry, registry.default);
    speakerOverride = selectedVoice.override;
  }

  const speakerProfilePath = spec.speaker_profile_path ?? DEFAULT_SPEAKER_PROFILE_PATH;
  const speakerProfile = loadSpeakerProfileSync(speakerProfilePath);
  const resolvedSpeaker = resolveSpeakerProfile({ baseF0, speakerOverride, profileSpec: speakerProfile });
  const speakerDecision = provenance.add({
    stage: "frontend",
    type: "speaker_profile_selected",
    subject: "speaker_profile",
    reason: `Resolved speaker profile base_f0_hz=${resolvedSpeaker.base_f0_hz}, formant_scale=${resolvedSpeaker.formant_scale}, rd_default=${resolvedSpeaker.rd_default}, spectral_tilt_offset_db=${resolvedSpeaker.spectral_tilt_offset_db}`,
    citations: collectSpeakerProfileCitations(speakerProfile, speakerProfilePath),
  });

  const sourcePath = spec.source_contour_path ?? DEFAULT_SOURCE_CONTOUR_PATH;
  const source = resolveSourceContour({
    spec: loadSourceContourSync(sourcePath),
    requestedQuality: options.voiceQuality,
    speaker: resolvedSpeaker,
    baseF0Hz: resolvedSpeaker.base_f0_hz,
  });
  const sourceDecision = provenance.add({
    stage: "frontend",
    type: "source_contour_selected",
    subject: "source_contour",
    reason: `Resolved source contour preset=${source.presetName}, source_mode=${source.baseline.source_mode}, rd=${source.baseline.rd}, rd_ref=${source.baseline.rd_ref}, base_f0_hz=${source.effectiveBaseF0Hz}`,
    citations: source.citations,
    parents: [speakerDecision.id],
  });

  const normalization = isPlainObject(spec.normalization)
    ? {
        tablesPath: typeof spec.normalization.tables_path === "string" ? spec.normalization.tables_path : undefined,
        pipelinePath: typeof spec.normalization.pipeline_path === "string" ? spec.normalization.pipeline_path : undefined,
      }
    : undefined;
  const normalized = normalizeText(inputText, normalization);
  const transcribed = transcribeText(normalized, {
    provenance,
    utterance,
    compiledSpec: spec,
    transcriptionConfig: getTranscriptionConfig(spec),
    ltsPath: resources.ltsPath,
    morphologyPath: resources.morphologyPath,
    dictionaryMap: dictionary,
    dictLookup: dictionary == null && spec.skip_dictionary ? () => null : undefined,
  });

  const inventoryDecision = provenance.add({
    stage: "frontend",
    type: "inventory_selected",
    subject: `inventory:${frontendId}`,
    reason: `Selected frontend inventory '${resources.inventoryPath}'`,
    citations: [resources.inventoryPath],
  });
  const construct = utterance.beginTransaction({
    ruleId: "inventory_materialization",
    phase: "transcribe",
    tag: "inventory",
    reason: "Materialize transcribed phonemes as typed Segment Items",
    citations: [resources.inventoryPath],
    stage: "transcribe",
  });
  construct.dependOn(inventoryDecision.id);
  const segments = transcribed.map((token, index) => {
    if (token._pronDecisionId) construct.dependOn(token._pronDecisionId);
    const materialized = materializePhonemeTarget(token.phoneme, {
      stress: token.stress,
      inventorySpec: resources.inventory,
    });
    const item = construct.createItem("segment", `segment_${index.toString()}`);
    construct.set(item, "phoneme", token.phoneme);
    construct.set(item, "stress", token.stress);
    construct.set(item, "word", token.word);
    construct.set(item, "sourceTokenId", token.sourceTokenId);
    construct.set(item, "punctuationSymbol", token.isPunctuation ? token.symbol ?? null : null);
    construct.set(item, "active", true);
    for (const [key, value] of Object.entries(materialized)) {
      if (key === "phoneme" || key === "params") continue;
      construct.set(item, key, value ?? null);
    }
    for (const [key, value] of Object.entries(materialized.params)) construct.set(item, key, value);
    construct.append("Segment", item);
    return item;
  });
  if (segments.length > 0) {
    construct.partitionAnchors(segments, utterance.axis.start.id, utterance.axis.end.id);
  }
  construct.commit();
  createStructure(utterance, transcribed, segments, spec);

  const requestedRate = options.rate ?? 1;
  const durationPolicy = recordOrEmpty(policyRecord(spec).duration);
  const referenceRate = readPolicyNumber(durationPolicy.rate_reference);
  const rate = Math.max(0.5, Math.min(2, referenceRate && referenceRate > 0
    ? requestedRate / referenceRate
    : requestedRate));
  const speakerPolicy = { speaker: resolvedSpeaker };
  const graphInventory = { spec: resources.inventory, decisionId: inventoryDecision.id };
  const captureTooling = options.captureTooling === true;
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
  });
  // Prosodic structure (word class, accent, nuclear accent, accent types,
  // phrase-edge tones, break indices) is now fully declarative: the `annotation`
  // phase rules replace the former imperative annotateProsody() pass.
  runGraphRuleEngine(utterance, spec, {
    evaluationOwner,
    phases: ["annotation"],
    parameters: mergedPolicy(spec, speakerPolicy),
    inventory: graphInventory,
    captureTooling,
  });

  if (options.directionTrack) {
    const parsed = parseDirectionInput(
      { score: { text: normalized }, directionTrack: options.directionTrack },
      { provenance },
    );
    attachDirectionsToUtterance(parsed, utterance);
  }

  const ratePolicy = recordOrEmpty(policyRecord(spec).rate);
  const undershoot = requirePolicyNumber(ratePolicy.undershoot_coefficient, "rate.undershoot_coefficient");
  const f0Exponent = requirePolicyNumber(ratePolicy.f0_range_exponent, "rate.f0_range_exponent");
  const transitionExponent = requirePolicyNumber(ratePolicy.transition_scale_exponent, "rate.transition_scale_exponent");
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
  });
  runGraphRuleEngine(utterance, spec, {
    evaluationOwner,
    phases: ["formant"],
    parameters: mergedPolicy(spec, { ...speakerPolicy, formant: { rate_undershoot_factor: formantRate } }),
    inventory: graphInventory,
    captureTooling,
  });
  const f0Policy = recordOrEmpty(policyRecord(spec).f0);
  const f0Range = Math.pow(rate, -f0Exponent);
  runGraphRuleEngine(utterance, spec, {
    evaluationOwner,
    phases: ["prosody", "finalize"],
    parameters: mergedPolicy(spec, {
      ...speakerPolicy,
      f0: {
        base_hz: source.effectiveBaseF0Hz,
        continuation_rise_hz: (readPolicyNumber(f0Policy.continuation_rise_hz) ?? 8) * f0Range,
        continuation_minor_rise_hz: (readPolicyNumber(f0Policy.continuation_minor_rise_hz) ?? 5) * f0Range,
      },
    }),
    inventory: graphInventory,
    captureTooling,
  });

  const referenceVoice = registry ? resolveVoice(registry, registry.default) : null;
  const speakerStamp = utterance.beginTransaction({
    ruleId: "speaker_source_projection",
    phase: "frontend",
    tag: "speaker",
    reason: "Project selected speaker and source policy onto final Segment targets",
    citations: [...source.citations, ...collectSpeakerProfileCitations(speakerProfile, speakerProfilePath)],
    stage: "frontend",
  });
  speakerStamp.dependOn(speakerDecision.id).dependOn(sourceDecision.id);
  for (const item of utterance.relation("Segment").listItems()) {
    if (item.get("active") === false) continue;
    // Project the resolved source/speaker policy via the declarative projection
    // table (src/speaker-projection.ts) — kills the hardcoded field list and the
    // baked-in 1..10 formant count while preserving byte-identical values.
    projectSpeakerFields(
      {
        get: (field) => item.get(field),
        set: (field, value) => speakerStamp.set(item, field, value),
      },
      {
        source_mode: source.baseline.source_mode,
        rd: source.baseline.rd,
        rd_ref: source.baseline.rd_ref,
        spectral_tilt_offset_db: source.baseline.spectral_tilt_offset_db,
      },
      source.voiceQualityOverrides,
      resolvedSpeaker.formant_scale,
    );
    if (selectedVoice && registry) {
      for (const field of registry.speakerFrameParams) {
        const value = selectedVoice.params[field];
        if (typeof value === "number" && Number.isFinite(value)) speakerStamp.set(item, field, value);
      }
      if (referenceVoice) {
        for (const mapping of registry.speakerGainOffsets) {
          const selected = selectedVoice.params[mapping.gain];
          const reference = referenceVoice.params[mapping.gain];
          const current = item.get(mapping.param);
          if (typeof selected === "number" && typeof reference === "number" && typeof current === "number") {
            speakerStamp.set(item, mapping.param, current + selected - reference);
          }
        }
      }
    }
  }
  speakerStamp.commit();

  let speakerParams: Record<string, unknown> | undefined;
  if (isLayeredF0Model(spec.f0_model)) {
    speakerParams = {};
    const configured = recordOrEmpty(policyRecord(spec).speaker);
    for (const [key, value] of Object.entries(configured)) {
      const number = readPolicyNumber(value);
      if (number !== undefined) speakerParams[key] = number;
    }
    if (selectedVoice) Object.assign(speakerParams, selectedVoice.params);
    speakerParams.base_f0_hz = resolvedSpeaker.base_f0_hz;
  }

  const silence = materializePhonemeTarget("SIL", { inventorySpec: resources.inventory });
  const silenceDecision = provenance.add({
    stage: "frontend",
    type: "silence_resource_selected",
    subject: `inventory:${frontendId}:SIL`,
    reason: "Selected declared inventory silence target for lowering edges",
    citations: [resources.inventoryPath],
    parents: [inventoryDecision.id],
  });
  const scaledTransition = transitionMs * Math.pow(rate, -transitionExponent);
  const lowerOptions = {
    ...lowering,
    transitions: {
      ...lowering.transitions,
      default_transition_ms: { value: scaledTransition },
    },
  };
  const lowered = lowerToFrames(utterance, lowerOptions, {
    f0Model: isLayeredF0Model(spec.f0_model) ? spec.f0_model : undefined,
    speakerParams,
    speakerSex: selectedVoice?.sex,
    silence: {
      initialParams: silence.params,
      finalParams: silence.params,
      decisionId: silenceDecision.id,
    },
  });
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
