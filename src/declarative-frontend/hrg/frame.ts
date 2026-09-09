/** Event Frames and stamped values. Engineering contract: #228/#243;
 * Klatt 1980 (automation events), Taylor, Black & Caley 2001 (shared HRG identity).
 */
import type { KlattFrame } from "../../tts-frontend-types";
import type { Item } from "./item";
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
          parameterOrder: { kind: "array", items: { kind: "string" } },
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
    const tx = this.utterance.beginTransaction({
      ruleId: `lowering.${producer}`,
      phase: "frame",
      stage: "rules",
      tag: producer,
      reason: `${producer}: ${this.item.id}.${key} = ${value}`,
      citations: citations.length
        ? citations
        : ["Qlatt #243: preserve the existing lowering transformation"],
    });
    for (const parent of parents) if (parent) tx.dependOn(parent);
    tx.set(this.item, key, value);
    tx.commit();
    return this.item.latestWrite(key)!.decisionId;
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

  finish(): void {
    const tx = this.utterance.beginTransaction({
      ruleId: "lowering.parameter_order",
      phase: "frame",
      tag: "frame_copy",
      reason: "Retain parameter insertion order, including deletion and reinsertion",
      citations: ["Qlatt #243: exact public synthesis row contract"],
    });
    for (const parent of Object.values(this.provenance)) tx.dependOn(parent);
    tx.set(this.item, "parameterOrder", Object.keys(this.params));
    tx.commit();
  }
}

export function emitFrame(utterance: Utterance, item: Item): KlattFrame {
  function fail(code: string, key?: string): never {
    const message = `${code}: ${item.id}${key ? `.${key}` : ""}`;
    utterance.diagnostics.error(message, { itemId: item.id, key }, code);
    throw new Error(message);
  }
  const params: Record<string, number> = {};
  const provenance: Record<string, string> = {};
  const order = item.get("parameterOrder");
  if (!Array.isArray(order)) fail("E_FRAME_PARAMETER_ORDER");
  for (const key of order) {
    if (typeof key !== "string") fail("E_FRAME_PARAMETER_KEY");
    const value = item.get(key);
    const write = item.latestWrite(key);
    if (typeof value !== "number" || !write) fail("E_FRAME_VALUE", key);
    params[key] = value;
    provenance[key] = write.decisionId;
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
