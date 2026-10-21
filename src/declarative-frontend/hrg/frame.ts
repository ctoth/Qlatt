/** Event Frames and evaluated values. Engineering contract: #228/#243;
 * Klatt 1980 (automation events), Taylor, Black & Caley 2001 (shared HRG identity).
 */
import type { KlattFrame } from "../../tts-frontend-types";
import type { Item } from "./item";
import type { AttributeEvidence, CheckedAttributes } from "./requested-attributes";
import type { FeatureSchema, HrgSchema } from "./types";
import type { Utterance } from "./utterance";

export function withFrameSchema(schema: HrgSchema, columns: readonly string[] = []): HrgSchema {
  const numeric: FeatureSchema = {
    kind: "union",
    variants: [{ kind: "number" }, { kind: "null" }],
  };
  const includesNumber = (feature: FeatureSchema): boolean =>
    feature.kind === "number" ||
    (feature.kind === "union" && feature.variants.some(includesNumber));
  const scalarKeys = Object.entries(schema.itemTypes.segment?.features ?? {})
    .filter(([, feature]) => includesNumber(feature))
    .map(([key]) => key);
  const keys = [...new Set([...scalarKeys, ...columns])].filter(
    (key) => !["segment", "word", "phoneme"].includes(key),
  );
  const values = Object.fromEntries(
    keys.flatMap((key) =>
      [key, `_transition_${key}_start`, `_transition_${key}_end`].map((name) => [name, numeric]),
    ),
  );
  return {
    itemTypes: {
      ...schema.itemTypes,
      frame: {
        features: {
          ...values,
          Rd: numeric,
          RdPhraseOffset: numeric,
          _f0VarianceCenter: numeric,
          _f0ContourSample: numeric,
          controlTimeMs: { kind: "number" },
          outputTimeMs: { kind: "number" },
          segmentOffsetMs: { kind: "number" },
          segmentRatio: { kind: "number" },
          ordinal: { kind: "number" },
          silenceEdge: { kind: "string" },
          phoneme: { kind: "string" },
          word: { kind: "string" },
        },
      },
    },
    relations: { ...schema.relations, Frames: { kind: "list", itemTypes: ["frame"] } },
  };
}

export class FrameValues {
  readonly params: Record<string, number> = {};
  readonly provenance: Record<string, string> = {};

  constructor(
    readonly utterance: Utterance,
    readonly item: Item,
  ) {}

  derive(
    key: string,
    value: number | null,
    producer: string,
    parents: readonly (string | undefined)[],
    citations: readonly string[] = [],
  ): string {
    // These remaining imperative transformations migrate under #244–#247.
    // Recording their actual inputs is not a checked-definition evaluation.
    return this.utterance.provenance.add({
      stage: "rules",
      type: "frame_value_computed",
      subject: `item:${this.item.id}.${key}`,
      reason: `${producer}: ${this.item.id}.${key} = ${value}`,
      parents: [...new Set(parents.filter((parent): parent is string => !!parent))],
      citations: citations.length
        ? [...citations]
        : ["Qlatt #243: preserve the existing lowering transformation"],
    }).id;
  }

  write(
    key: string,
    value: number | null,
    producer: string,
    parents: readonly (string | undefined)[],
    citations: readonly string[] = [],
  ) {
    const decisionId = this.derive(key, value, producer, parents, citations);
    if (value === null) {
      delete this.params[key];
      delete this.provenance[key];
    } else {
      this.params[key] = value;
      this.provenance[key] = decisionId;
    }
  }
}

/** Project actual evaluation ancestry once, without graph writes or synthetic stamps. */
export function recordFrameEvaluation(
  utterance: Utterance,
  program: CheckedAttributes,
  evidence: AttributeEvidence,
  decisions: WeakMap<AttributeEvidence, string>,
): string {
  const existing = decisions.get(evidence);
  if (existing) return existing;
  const parents = evidence.parents.map((parent) =>
    recordFrameEvaluation(utterance, program, parent, decisions),
  );
  for (const read of evidence.reads) parents.push(...read.decisionIds);
  const citations = program.artifact.rules[program.rule].citations;
  const decision = utterance.provenance.add({
    stage: "rules",
    type: "attribute_evaluated",
    subject: `item:${evidence.item.id}.${evidence.definition.path.at(-1)}`,
    reason: `${program.rule} (frame_copy): ${JSON.stringify({
      path: evidence.definition.path,
      sources: evidence.definition.sources,
      expression: evidence.definition.expression,
      value: evidence.value,
      reads: evidence.reads,
    })}`,
    citations: Array.isArray(citations) ? citations : [],
    parents: [...new Set(parents)],
  });
  decisions.set(evidence, decision.id);
  return decision.id;
}

export function emitFrame(utterance: Utterance, values: FrameValues): KlattFrame {
  const { item } = values;
  function fail(code: string, key?: string): never {
    const message = `${code}: ${item.id}${key ? `.${key}` : ""}`;
    utterance.diagnostics.error(message, { itemId: item.id, key }, code);
    throw new Error(message);
  }
  const params: Record<string, number> = {};
  const provenance: Record<string, string> = {};
  for (const [key, value] of Object.entries(values.params)) {
    const decisionId = values.provenance[key];
    if (typeof value !== "number" || !decisionId) fail("E_FRAME_VALUE", key);
    params[key] = value;
    provenance[key] = decisionId;
  }
  const outputTime = item.get("outputTimeMs");
  if (typeof outputTime !== "number") fail("E_FRAME_OUTPUT_TIME");
  const row: KlattFrame = { time: outputTime / 1000, params, provenance };
  const association = utterance
    .latestAssociationWrites(item, "segment")
    .find((write) => write.active);
  if (association) row.segmentId = association.toItemId;
  const phoneme = item.get("phoneme");
  if (typeof phoneme === "string") row.phoneme = phoneme;
  const word = item.get("word");
  if (typeof word === "string") row.word = word;
  return row;
}
