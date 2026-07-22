/**
 * HRG path navigation — Festival feature-function pathnames.
 *
 * From any node you reach any related node by a dot-path that mixes traversal
 * operators and relation switches:
 *   - traversal: `n` (next), `p` (prev), `nn`, `pp`, `parent`,
 *                `first`/`last` (head/tail of the sibling chain),
 *                `daughter1`..`daughterN`, `daughtern` (last daughter)
 *   - relation switch: `R:<RelationName>` jumps THIS item into another relation
 *     and continues from its node there.
 * A trailing segment that is not a recognized operator is read as a feature.
 *
 * Examples (design/beauty-synthesis/11-sota-frontend-architecture.md §2c):
 *   from a syllable:  `R:SylStructure.parent.R:Word`        -> owning word node
 *   from a syllable:  `R:SylStructure.parent.R:Word.n.name` -> next word's name
 *   from a syllable:  `R:SylStructure.daughtern.ph_vc`      -> last segment's feature
 *
 * Citations: Taylor, Black & Caley 2001; Festival manual §14 (feature paths).
 */
import type { HrgNode } from "./relation";
import type { FeatureValue } from "./types";

const DAUGHTER_RE = /^daughter(\d+|n)$/;

/** True if `segment` is a recognized navigation operator (vs a feature name). */
export function isNavOp(segment: string): boolean {
  if (
    segment === "n" ||
    segment === "p" ||
    segment === "nn" ||
    segment === "pp" ||
    segment === "parent" ||
    segment === "first" ||
    segment === "last"
  ) {
    return true;
  }
  if (segment.startsWith("R:")) return true;
  return DAUGHTER_RE.test(segment);
}

/** Apply one navigation operator to a node. Returns null if it leads nowhere. */
export function step(node: HrgNode, op: string): HrgNode | null {
  switch (op) {
    case "n":
      return node.next;
    case "p":
      return node.prev;
    case "nn":
      return node.next?.next ?? null;
    case "pp":
      return node.prev?.prev ?? null;
    case "parent":
      return node.parent;
    case "first":
      return node.firstSibling();
    case "last":
      return node.lastSibling();
    default:
      break;
  }
  if (op.startsWith("R:")) {
    const relationName = op.slice(2);
    return node.item.nodes.get(relationName) ?? null;
  }
  const daughterMatch = DAUGHTER_RE.exec(op);
  if (daughterMatch) {
    const daughters = node.daughters;
    if (daughterMatch[1] === "n") {
      return daughters[daughters.length - 1] ?? null;
    }
    const index = Number(daughterMatch[1]) - 1;
    return daughters[index] ?? null;
  }
  throw new Error(`E_HRG_PATH_OP: unknown navigation operator '${op}'`);
}

export interface PathResult {
  /** Final node reached (null if any hop fell off the graph). */
  node: HrgNode | null;
  /** Feature value, if the path ended in a feature read. */
  value?: FeatureValue;
}

/**
 * Optional side-effect hooks for a provenance-aware walk. The HRG rule engine
 * passes these so path navigation records the same dependency edges and
 * versioned feature reads as the rest of its transaction; default callers
 * (tests, tooling) omit them and get a plain in-memory read.
 */
export interface PathHooks {
  /** Called with each node successfully stepped onto (not the start node). */
  onStep?: (node: HrgNode) => void;
  /** How to read the terminal feature; defaults to `item.get(key)`. */
  readFeature?: (item: HrgNode["item"], key: string) => FeatureValue | undefined;
}

function splitPath(path: string): string[] {
  return path
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

/**
 * Evaluate a path from a starting node. If the final segment is a feature name
 * (not a nav op), the result carries that feature's value; otherwise the result
 * is the navigated node.
 */
export function evalPath(start: HrgNode, path: string, hooks?: PathHooks): PathResult {
  const segments = splitPath(path);
  if (segments.length === 0) return { node: start };

  const lastIsFeature = !isNavOp(segments[segments.length - 1]);
  const navSegments = lastIsFeature ? segments.slice(0, -1) : segments;

  let node: HrgNode | null = start;
  for (const op of navSegments) {
    if (!node) break;
    node = step(node, op);
    if (node) hooks?.onStep?.(node);
  }

  if (lastIsFeature) {
    const featureKey = segments[segments.length - 1];
    const readFeature = hooks?.readFeature ?? ((item, key) => item.get(key));
    return { node, value: node ? readFeature(node.item, featureKey) : undefined };
  }
  return { node };
}

/** Navigate to a node (path must be navigation-only). */
export function pathNode(start: HrgNode, path: string): HrgNode | null {
  return evalPath(start, path).node;
}

/** Read a feature reached by a path (path must end in a feature name). */
export function pathFeature(start: HrgNode, path: string): FeatureValue | undefined {
  return evalPath(start, path).value;
}
