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

import { isPlainObject } from "../../yaml-loader";
import type { HrgNode } from "./relation";
import type {
  FeatureSchema,
  FeatureValue,
  FeatureWrite,
  FeatureWriteInput,
  ItemTypeSchema,
  Stamper,
} from "./types";

/** What {@link fitFeatureValue} answers for a value its schema does not accept. */
const REJECTED = Symbol("rejected");

/**
 * Where a value was rejected and what was expected there. `path` is relative
 * to the feature and grows outward as the rejection is passed up.
 */
type Rejection = { path: string; expected: string };

function rejected(rejection: Rejection | null, expected: string): typeof REJECTED {
  if (rejection) rejection.expected = expected;
  return REJECTED;
}

/**
 * The validated, frozen copy of `value`, or {@link REJECTED}. A union tries
 * its variants in turn and most values are written through one, so nothing is
 * thrown here and nothing is said about a value that does not fit unless
 * `rejection` is given to be filled in.
 */
function fitFeatureValue(
  value: unknown,
  schema: FeatureSchema,
  rejection: Rejection | null,
): FeatureValue | typeof REJECTED {
  switch (schema.kind) {
    case "string":
      if (typeof value !== "string") return rejected(rejection, "a string");
      if (schema.values && !schema.values.includes(value)) {
        return rejection ? rejected(rejection, `one of [${schema.values.join(", ")}]`) : REJECTED;
      }
      return value;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return rejected(rejection, "a finite number");
      }
      return value;
    case "boolean":
      if (typeof value !== "boolean") return rejected(rejection, "a boolean");
      return value;
    case "null":
      if (value !== null) return rejected(rejection, "null");
      return null;
    case "literal":
      if (value !== schema.value) {
        return rejection
          ? rejected(rejection, `the literal ${JSON.stringify(schema.value)}`)
          : REJECTED;
      }
      return schema.value;
    case "array": {
      if (!Array.isArray(value)) return rejected(rejection, "an array");
      const output = new Array<FeatureValue>(value.length);
      for (let index = 0; index < value.length; index += 1) {
        // An index the array does not have stays absent in the copy.
        if (!(index in value)) continue;
        const fitted = fitFeatureValue(value[index], schema.items, rejection);
        if (fitted === REJECTED) {
          if (rejection) rejection.path = `[${index}]${rejection.path}`;
          return REJECTED;
        }
        output[index] = fitted;
      }
      return Object.freeze(output);
    }
    case "object": {
      if (!isPlainObject(value)) return rejected(rejection, "an object");
      const output: Record<string, FeatureValue> = {};
      for (const [field, fieldSchema] of Object.entries(schema.fields)) {
        let fitted: FeatureValue | typeof REJECTED;
        if (Object.hasOwn(value, field)) {
          fitted = fitFeatureValue(value[field], fieldSchema, rejection);
        } else {
          if (schema.optional?.includes(field)) continue;
          fitted = rejected(rejection, "present");
        }
        if (fitted === REJECTED) {
          if (rejection) rejection.path = `.${field}${rejection.path}`;
          return REJECTED;
        }
        output[field] = fitted;
      }
      for (const [field, entry] of Object.entries(value)) {
        if (Object.hasOwn(schema.fields, field)) continue;
        const fitted = schema.additional
          ? fitFeatureValue(entry, schema.additional, rejection)
          : rejected(rejection, "a declared field");
        if (fitted === REJECTED) {
          if (rejection) rejection.path = `.${field}${rejection.path}`;
          return REJECTED;
        }
        output[field] = fitted;
      }
      return Object.freeze(output);
    }
    case "union": {
      for (const variant of schema.variants) {
        const fitted = fitFeatureValue(value, variant, null);
        if (fitted !== REJECTED) return fitted;
      }
      return rejection
        ? rejected(rejection, `one of the declared union variants (received ${typeof value})`)
        : REJECTED;
    }
  }
}

function validateFeatureValue(
  itemType: string,
  key: string,
  value: unknown,
  schema: FeatureSchema,
): FeatureValue {
  const fitted = fitFeatureValue(value, schema, null);
  if (fitted !== REJECTED) return fitted;
  // Walked again, this time to say where it was rejected and why.
  const rejection: Rejection = { path: "", expected: "" };
  fitFeatureValue(value, schema, rejection);
  throw new Error(
    `E_HRG_FEATURE_VALUE: item type '${itemType}' feature '${key}' at '${key}${rejection.path}' must be ${rejection.expected}`,
  );
}

export class Item {
  /** Per-relation nodes: relationName -> node wrapping THIS item in that relation. */
  readonly nodes = new Map<string, HrgNode>();

  /** Append-only version stacks: featureKey -> writes (latest is current). */
  private readonly featureWrites = new Map<string, FeatureWrite[]>();
  private creationDecision: string | null = null;

  constructor(
    readonly id: string,
    readonly type: string,
    private readonly stamper: Stamper,
    private readonly schema: ItemTypeSchema,
  ) {}

  /** Stamped feature write. Returns the recorded write (with its decision id). */
  set(key: string, value: unknown, input: FeatureWriteInput): FeatureWrite {
    const validated = this._validateFeature(key, value);
    return this.stamper(this, key, validated, input);
  }

  /** Internal transaction preflight; validates and snapshots without mutation. */
  _validateFeature(key: string, value: unknown): FeatureValue {
    const featureSchema = this.schema.features[key];
    if (!featureSchema) {
      throw new Error(
        `E_HRG_FEATURE_UNDECLARED: item type '${this.type}' does not declare feature '${key}'`,
      );
    }
    return validateFeatureValue(this.type, key, value, featureSchema);
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
    return Object.freeze([...(this.featureWrites.get(key) ?? [])]);
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

  creationDecisionId(): string | null {
    return this.creationDecision;
  }

  _setCreationDecision(decisionId: string): void {
    if (this.creationDecision) throw new Error(`E_HRG_ITEM_ALREADY_CREATED: '${this.id}'`);
    this.creationDecision = decisionId;
  }

  /** Internal rollback inverse of {@link _setCreationDecision}. */
  _clearCreationDecision(): void {
    this.creationDecision = null;
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

  /**
   * Internal rollback inverse of {@link _push}: remove `write`, which must be
   * the latest version of its feature (undo runs in reverse commit order).
   */
  _popWrite(write: FeatureWrite): void {
    const stack = this.featureWrites.get(write.key);
    if (!stack || stack[stack.length - 1] !== write) {
      throw new Error(`E_HRG_UNDO_MISMATCH: '${this.id}.${write.key}' is not the latest write`);
    }
    stack.pop();
    if (stack.length === 0) this.featureWrites.delete(write.key);
  }
}
