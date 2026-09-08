import { normalizeText } from "../g2p/text-normalize";
import type { RecognitionEvidence } from "../provenance";
import { evaluateExpression } from "./cel-expressions";
import type { HrgSchema, Item, Utterance } from "./hrg";
import { parseRecognitionConfig, type SpeakingDeclaration } from "./recognition-config";
import type { CompiledRulepack } from "./rule-pack";

/** Source offsets are half-open UTF-16 indices, never temporal anchors. */
export const NORMALIZATION_SCHEMA = {
  itemTypes: {
    sourceText: { features: { text: { kind: "string" } } },
    normalization: {
      features: {
        text: { kind: "string" },
        sourceStart: { kind: "number" },
        sourceEnd: { kind: "number" },
        sourceTextId: { kind: "string" },
        class: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
        ruleId: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
        features: {
          kind: "object",
          fields: {},
          additional: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
        },
        spokenText: { kind: "string" },
        normalizedText: { kind: "string" },
        vocabularyKeys: { kind: "array", items: { kind: "string" } },
      },
    },
  },
  relations: {
    SourceText: { kind: "list", itemTypes: ["sourceText"] },
    Normalization: { kind: "list", itemTypes: ["normalization"] },
  },
} as const satisfies HrgSchema;

export type SourceTranscriptionInput = { word: string; source: Item };

type Candidate = {
  evidence: RecognitionEvidence;
  class: string | null;
  features: Record<string, string | null>;
  spokenText: string;
  declaration: SpeakingDeclaration;
};

function speak(
  declaration: SpeakingDeclaration,
  context: Record<string, unknown>,
): { spokenText: string; vocabularyKeys: string[] } {
  const spokenText = evaluateExpression(declaration.speak, context);
  const vocabularyKeys = evaluateExpression(declaration.vocabulary_keys, context);
  if (
    typeof spokenText !== "string" ||
    !Array.isArray(vocabularyKeys) ||
    !vocabularyKeys.every((key): key is string => typeof key === "string" && key.length > 0)
  ) {
    throw new Error(
      "E_RECOGNITION_RESULT: speak must return a string and vocabulary_keys a string array",
    );
  }
  return { spokenText, vocabularyKeys };
}

/** Host span matching only. The selected rulepack owns eligibility and speech. */
export function recognizeText(text: string, utterance: Utterance, spec: CompiledRulepack): void {
  const config = parseRecognitionConfig(spec);
  if (!config) throw new Error("E_RECOGNITION_CONFIG: text_recognition is required");
  const sourceItemId = "source_text";
  if (utterance.getItem(sourceItemId))
    throw new Error("E_RECOGNITION_SOURCE_EXISTS: raw text was already ingested");
  const accepted: Candidate[] = [];
  const decisions: Candidate[] = [];
  const contextFor = (
    start: number,
    end: number,
    features: Record<string, string | null>,
    captures: Record<string, string | null>,
  ) => ({
    current: { text: text.slice(start, end), sourceStart: start, sourceEnd: end, features },
    captures,
    source: { text },
    maps: spec.maps,
    sets: spec.string_sets,
  });
  // Sticky matching at successive source positions preserves lookaround/anchors
  // in the original input and permits overlapping retries after rejection.
  for (const rule of config.rules) {
    const regex = new RegExp(rule.pattern, `${rule.flags}dy`);
    for (let start = 0; start <= text.length; ) {
      regex.lastIndex = start;
      const match = regex.exec(text);
      const next = start + ((text.codePointAt(start) ?? 0) > 0xffff ? 2 : 1);
      if (!match) {
        start = next;
        continue;
      }
      const end = start + match[0].length;
      if (end === start)
        throw new Error(`E_RECOGNITION_EMPTY_MATCH: rule '${rule.id}' at UTF-16 offset ${start}`);
      const captures = Object.fromEntries(
        Object.entries(match.groups ?? {}).map(([key, value]) => [key, value ?? null]),
      );
      const features = Object.fromEntries(
        Object.entries(rule.captures).map(([feature, capture]) => [feature, captures[capture]]),
      );
      const evidence: RecognitionEvidence = {
        outcome: "accepted",
        ruleId: rule.id,
        sourceItemId,
        sourceStart: start,
        sourceEnd: end,
        captures: Object.fromEntries(
          Object.entries(captures).map(([key, value]) => {
            const offsets = match.indices?.groups?.[key];
            return [key, { text: value, start: offsets?.[0] ?? null, end: offsets?.[1] ?? null }];
          }),
        ),
        vocabularyKeys: [],
      };
      const context = contextFor(start, end, features, captures);
      let spokenText = "";
      if (
        accepted.some(
          (candidate) =>
            start < candidate.evidence.sourceEnd && end > candidate.evidence.sourceStart,
        )
      ) {
        evidence.outcome = "overlap";
      } else {
        const eligible = evaluateExpression(rule.when, context);
        if (typeof eligible !== "boolean")
          throw new Error(`E_RECOGNITION_RESULT: '${rule.id}' when must return a boolean`);
        if (!eligible) evidence.outcome = "ineligible";
        else {
          const result = speak(rule, context);
          spokenText = result.spokenText;
          evidence.vocabularyKeys = result.vocabularyKeys;
        }
      }
      const candidate: Candidate = {
        evidence,
        class: rule.class,
        features,
        spokenText,
        declaration: rule,
      };
      decisions.push(candidate);
      if (evidence.outcome === "accepted") accepted.push(candidate);
      start = evidence.outcome === "accepted" ? end : next;
    }
  }
  accepted.sort((left, right) => left.evidence.sourceStart - right.evidence.sourceStart);
  const spans: Candidate[] = [];
  const addGap = (start: number, end: number) => {
    if (end <= start) return;
    const result = speak(config.unmatched, contextFor(start, end, {}, {}));
    const candidate: Candidate = {
      evidence: {
        outcome: "unmatched",
        ruleId: null,
        sourceItemId,
        sourceStart: start,
        sourceEnd: end,
        captures: {},
        vocabularyKeys: result.vocabularyKeys,
      },
      class: null,
      features: {},
      spokenText: result.spokenText,
      declaration: config.unmatched,
    };
    spans.push(candidate);
    decisions.push(candidate);
  };
  let cursor = 0;
  for (const candidate of accepted) {
    addGap(cursor, candidate.evidence.sourceStart);
    spans.push(candidate);
    cursor = candidate.evidence.sourceEnd;
  }
  addGap(cursor, text.length);

  // Finish all recognition and CEL evaluation before changing the graph.
  const ingestion = utterance.beginTransaction({
    ruleId: "source_text_ingestion",
    phase: "recognition",
    tag: "source",
    reason: "Preserved original input and UTF-16 source coordinates",
    citations: ["Issue #142: source-backed normalization contract"],
    stage: "transcribe",
  });
  const source = ingestion.createItem("sourceText", sourceItemId);
  ingestion.set(source, "text", text);
  ingestion.append("SourceText", source);
  ingestion.commit();
  const decisionIds = new Map<Candidate, string>();
  for (const candidate of decisions) {
    const evidence = candidate.evidence;
    const decision = utterance.provenance.add({
      stage: "transcribe",
      type: "text_recognition",
      subject: `${sourceItemId}:${evidence.sourceStart}:${evidence.sourceEnd}`,
      reason: `${evidence.ruleId ?? "unmatched"}: ${evidence.outcome}; class=${candidate.class}; vocabulary_keys=${JSON.stringify(evidence.vocabularyKeys)}`,
      citations: candidate.declaration.citations,
      parents: [source.latestWrite("text")!.decisionId],
      recognition: evidence,
    });
    decisionIds.set(candidate, decision.id);
  }
  for (const [index, candidate] of spans.entries()) {
    const evidence = candidate.evidence;
    const transaction = utterance.beginTransaction({
      ruleId: evidence.ruleId ?? "source_unmatched",
      phase: "recognition",
      tag: "recognition",
      reason: `Materialized ${evidence.outcome} source span [${evidence.sourceStart}, ${evidence.sourceEnd})`,
      citations: candidate.declaration.citations,
      stage: "transcribe",
    });
    transaction.dependOn(decisionIds.get(candidate)!);
    transaction.read(source, "text");
    const item = transaction.createItem("normalization", `normalization_${index}`);
    transaction.set(item, "text", text.slice(evidence.sourceStart, evidence.sourceEnd));
    transaction.set(item, "sourceStart", evidence.sourceStart);
    transaction.set(item, "sourceEnd", evidence.sourceEnd);
    transaction.set(item, "sourceTextId", sourceItemId);
    transaction.set(item, "class", candidate.class);
    transaction.set(item, "ruleId", evidence.ruleId);
    transaction.set(item, "features", candidate.features);
    transaction.set(item, "spokenText", candidate.spokenText);
    transaction.set(item, "vocabularyKeys", evidence.vocabularyKeys);
    transaction.associate("source_text", item, source);
    transaction.append("Normalization", item);
    transaction.commit();
  }
}

/** Interim handoff: reuse selected readers; each emitted word retains its source item. */
export function normalizeSourceItems(
  utterance: Utterance,
  spec: CompiledRulepack,
): SourceTranscriptionInput[] {
  if (!parseRecognitionConfig(spec))
    throw new Error("E_RECOGNITION_CONFIG: text_recognition is required");
  const config = {
    tablesPath: spec.normalization.tables_path as string,
    pipelinePath: spec.normalization.pipeline_path as string,
    punctuationTokens: spec.transcription.punctuation_tokens as string[],
  };
  const entries: SourceTranscriptionInput[] = [];
  for (const source of utterance.relation("Normalization").listItems()) {
    const transaction = utterance.beginTransaction({
      ruleId: "source_normalization_handoff",
      phase: "recognition",
      tag: "normalization",
      reason: "Applied the selected frontend normalization resources to source-backed speech",
      citations: [config.tablesPath, config.pipelinePath],
      stage: "transcribe",
    });
    const spokenText = transaction.read(source, "spokenText");
    if (typeof spokenText !== "string")
      throw new Error(`E_RECOGNITION_RESULT: '${source.id}' has no spokenText`);
    const normalizedText = normalizeText(spokenText, config);
    transaction.set(source, "normalizedText", normalizedText);
    transaction.commit();
    for (const word of normalizedText.split(" ").filter(Boolean)) entries.push({ word, source });
  }
  return entries;
}
