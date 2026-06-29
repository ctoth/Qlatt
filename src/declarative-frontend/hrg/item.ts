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
import type { FeatureValue, FeatureWrite, FeatureWriteInput, Stamper } from "./types";

export class Item {
  /** Per-relation nodes: relationName -> node wrapping THIS item in that relation. */
  readonly nodes = new Map<string, HrgNode>();

  /** Append-only version stacks: featureKey -> writes (latest is current). */
  private readonly featureWrites = new Map<string, FeatureWrite[]>();

  constructor(
    readonly id: string,
    readonly type: string,
    private readonly stamper: Stamper,
  ) {}

  /** Stamped feature write. Returns the recorded write (with its decision id). */
  set(key: string, value: FeatureValue, input: FeatureWriteInput): FeatureWrite {
    return this.stamper(this, key, value, input);
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
