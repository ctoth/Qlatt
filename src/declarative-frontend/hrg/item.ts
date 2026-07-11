/**
 * HRG Item — a typed feature bundle with a stable id.
 *
 * The SAME item object can belong to multiple relations at once (shared
 * identity, no copying): a segment item is a member of the flat `Segment` list
 * AND a leaf of the `SylStructure` tree. Per-relation topology lives in
 * `HrgNode` objects keyed by relation name in `nodes`.
 *
 * Every feature is an append-only stack of {@link FeatureWrite} versions; the
 * current value is the latest write. Writes are stamped through a {@link Stamper}
 * supplied by the owning Utterance so each write is a DecisionRecord.
 *
 * Citations: Taylor, Black & Caley 2001 (item = feature bundle, shared across
 * relations); design/beauty-synthesis/11-sota-frontend-architecture.md §2c.
 */
import type { HrgNode } from "./relation";
import { isPlainObject } from "../../yaml-loader";
import type {
  FeatureSchema,
  FeatureValue,
  FeatureWrite,
  FeatureWriteInput,
  ItemTypeSchema,
  Stamper,
} from "./types";

function featureValueError(itemType: string, key: string, path: string, expected: string): never {
  throw new Error(
    `E_HRG_FEATURE_VALUE: item type '${itemType}' feature '${key}' at '${path}' must be ${expected}`,
  );
}

function validateFeatureValue(
  itemType: string,
  key: string,
  value: unknown,
  schema: FeatureSchema,
  path = key,
): FeatureValue {
  switch (schema.kind) {
    case "string":
      if (typeof value !== "string") featureValueError(itemType, key, path, "a string");
      if (schema.values && !schema.values.includes(value)) {
        featureValueError(itemType, key, path, `one of [${schema.values.join(", ")}]`);
      }
      return value;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        featureValueError(itemType, key, path, "a finite number");
      }
      return value;
    case "boolean":
      if (typeof value !== "boolean") featureValueError(itemType, key, path, "a boolean");
      return value;
    case "null":
      if (value !== null) featureValueError(itemType, key, path, "null");
      return null;
    case "literal":
      if (value !== schema.value) {
        featureValueError(itemType, key, path, `the literal ${JSON.stringify(schema.value)}`);
      }
      return schema.value;
    case "array": {
      if (!Array.isArray(value)) featureValueError(itemType, key, path, "an array");
      return Object.freeze(
        value.map((entry, index) =>
          validateFeatureValue(itemType, key, entry, schema.items, `${path}[${index}]`),
        ),
      );
    }
    case "object": {
      if (!isPlainObject(value)) {
        featureValueError(itemType, key, path, "an object");
      }
      const optional = new Set(schema.optional ?? []);
      const output: Record<string, FeatureValue> = {};
      for (const [field, fieldSchema] of Object.entries(schema.fields)) {
        if (!Object.prototype.hasOwnProperty.call(value, field)) {
          if (optional.has(field)) continue;
          featureValueError(itemType, key, `${path}.${field}`, "present");
        }
        output[field] = validateFeatureValue(
          itemType,
          key,
          value[field],
          fieldSchema,
          `${path}.${field}`,
        );
      }
      for (const [field, entry] of Object.entries(value)) {
        if (Object.prototype.hasOwnProperty.call(schema.fields, field)) continue;
        if (!schema.additional) {
          featureValueError(itemType, key, `${path}.${field}`, "a declared field");
        }
        output[field] = validateFeatureValue(
          itemType,
          key,
          entry,
          schema.additional,
          `${path}.${field}`,
        );
      }
      return Object.freeze(output);
    }
    case "union": {
      for (const variant of schema.variants) {
        try {
          return validateFeatureValue(itemType, key, value, variant, path);
        } catch (error) {
          if (!(error instanceof Error) || !error.message.startsWith("E_HRG_FEATURE_VALUE:")) {
            throw error;
          }
        }
      }
      return featureValueError(itemType, key, path, "one of the declared union variants");
    }
  }
}

export class Item {
  /** Per-relation nodes: relationName -> node wrapping THIS item in that relation. */
  readonly nodes = new Map<string, HrgNode>();

  /** Append-only version stacks: featureKey -> writes (latest is current). */
  private readonly featureWrites = new Map<string, FeatureWrite[]>();

  constructor(
    readonly id: string,
    readonly type: string,
    private readonly stamper: Stamper,
    private readonly schema: ItemTypeSchema,
  ) {}

  /** Stamped feature write. Returns the recorded write (with its decision id). */
  set(key: string, value: unknown, input: FeatureWriteInput): FeatureWrite {
    const featureSchema = this.schema.features[key];
    if (!featureSchema) {
      throw new Error(
        `E_HRG_FEATURE_UNDECLARED: item type '${this.type}' does not declare feature '${key}'`,
      );
    }
    const validated = validateFeatureValue(this.type, key, value, featureSchema);
    return this.stamper(this, key, validated, input);
  }

  /** Current value of a feature, or undefined if never written. */
  get(key: string): FeatureValue | undefined {
    const stack = this.featureWrites.get(key);
    return stack && stack.length > 0 ? stack[stack.length - 1].value : undefined;
  }

  has(key: string): boolean {
    const stack = this.featureWrites.get(key);
    return stack != null && stack.length > 0;
  }

  /** All versioned writes of a feature, oldest first. */
  writes(key: string): readonly FeatureWrite[] {
    return this.featureWrites.get(key) ?? [];
  }

  /** Latest (current) write of a feature, or undefined. */
  latestWrite(key: string): FeatureWrite | undefined {
    const stack = this.featureWrites.get(key);
    return stack && stack.length > 0 ? stack[stack.length - 1] : undefined;
  }

  /** Keys that have at least one write. */
  featureKeys(): string[] {
    return [...this.featureWrites.keys()];
  }

  /** The node wrapping this item in `relationName`, or undefined if absent. */
  node(relationName: string): HrgNode | undefined {
    return this.nodes.get(relationName);
  }

  /** Internal: append a write to a feature's version stack. Use {@link set}. */
  _push(write: FeatureWrite): void {
    const stack = this.featureWrites.get(write.key);
    if (stack) {
      stack.push(write);
    } else {
      this.featureWrites.set(write.key, [write]);
    }
  }
}
