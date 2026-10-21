/**
 * `realize_each`: load-time expansion of indexed realize-rule templates.
 *
 * A semantics document may write a family of realize rules that differ only
 * in one scalar index (for example one rule per formant) once, as a template:
 *
 *   realize_each:
 *     - index: n
 *       over: [2, 3, 4]
 *       rules:
 *         "gain{n}":
 *           expr: "dbToLinear(A{n})"
 *           deps: ["A{n}"]
 *
 * `expandRealizeEach` substitutes `{n}` textually for every value in `over`
 * and merges the generated rules into the document's ordinary `realize` map.
 * The `realize_each` key does not survive expansion, so the interpreter,
 * `expandFormantBanks`, track analysis and every other consumer see plain
 * realize rules. This follows the `expandFormantBanks` precedent
 * (`src/formant-bank.ts`): generate ordinary rules at load, reject collisions.
 *
 * Expansion is per document. A loader that merges a parent and a child
 * experiment expands each document first and merges afterwards, so a child's
 * concrete rule overrides a parent's generated rule by key.
 *
 * The construct is a Qlatt authoring convenience and carries no acoustic
 * content of its own: the citations for a generated rule are the ones written
 * on its template.
 */

import type {
  AuthoredSemanticsDocument,
  CelExpression,
  RealizationRule,
  SemanticsDocument,
} from "./types";

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
// A placeholder is a brace pair holding exactly one identifier. CEL map
// literals such as `{a: 1}` or `{"k": v}` do not match and pass through.
const PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
const ENTRY_KEYS = new Set(["index", "over", "rules"]);

export type RealizeEachErrorCode =
  | "E_REALIZE_EACH_SHAPE"
  | "E_REALIZE_EACH_OVER"
  | "E_REALIZE_EACH_NAME"
  | "E_REALIZE_EACH_PLACEHOLDER"
  | "E_REALIZE_EACH_COLLISION";

export class RealizeEachError extends Error {
  readonly code: RealizeEachErrorCode;

  constructor(code: RealizeEachErrorCode, path: string, message: string) {
    super(`${code} ${path}: ${message}`);
    this.name = "RealizeEachError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Reject any `{name}` whose name is not the entry's index; return the rest. */
function substitute(template: string, index: string, value: string, path: string): string {
  return template.replace(PLACEHOLDER, (_match, name: string) => {
    if (name !== index) {
      throw new RealizeEachError(
        "E_REALIZE_EACH_PLACEHOLDER",
        path,
        `placeholder '{${name}}' is not the entry's index '{${index}}'`,
      );
    }
    return value;
  });
}

function validateRuleShape(rule: unknown, path: string): asserts rule is RealizationRule | string {
  if (typeof rule === "string") return;
  if (!isRecord(rule)) {
    throw new RealizeEachError(
      "E_REALIZE_EACH_SHAPE",
      path,
      "a rule must be a CEL string or a mapping with 'expr'",
    );
  }
  if (typeof rule.expr !== "string") {
    throw new RealizeEachError("E_REALIZE_EACH_SHAPE", `${path}.expr`, "must be a CEL string");
  }
  if (rule.deps !== undefined) {
    if (!Array.isArray(rule.deps) || rule.deps.some((dep) => typeof dep !== "string")) {
      throw new RealizeEachError(
        "E_REALIZE_EACH_SHAPE",
        `${path}.deps`,
        "must be a list of strings",
      );
    }
  }
}

/** Substitute the index in every string field and string-list item of a rule. */
function instantiateRule(
  rule: RealizationRule | CelExpression,
  index: string,
  value: string,
  path: string,
): RealizationRule | CelExpression {
  if (typeof rule === "string") return substitute(rule, index, value, path);
  const result: Record<string, unknown> = {};
  for (const [field, fieldValue] of Object.entries(rule)) {
    const fieldPath = `${path}.${field}`;
    if (typeof fieldValue === "string") {
      result[field] = substitute(fieldValue, index, value, fieldPath);
    } else if (Array.isArray(fieldValue)) {
      result[field] = fieldValue.map((item, itemIndex) =>
        typeof item === "string"
          ? substitute(item, index, value, `${fieldPath}[${itemIndex}]`)
          : item,
      );
    } else {
      // ramp, step and any other non-string field are copied unchanged.
      result[field] = fieldValue;
    }
  }
  return result as unknown as RealizationRule;
}

/**
 * Expand a document's `realize_each` entries into its `realize` map.
 *
 * Returns the input unchanged when it has no `realize_each` key; otherwise
 * returns a new document (the input is not mutated) whose `realize` holds the
 * authored rules followed by the generated ones, in entry order, then rule
 * order, then `over` order.
 *
 * `source` names the document in error messages (normally its path).
 */
export function expandRealizeEach(
  document: AuthoredSemanticsDocument,
  source?: string,
): SemanticsDocument {
  if (!isRecord(document) || !Object.hasOwn(document, "realize_each")) return document;
  const root = source ? `${source}: realize_each` : "realize_each";
  const { realize_each: entries, ...rest } = document as AuthoredSemanticsDocument & {
    realize_each: unknown;
  };

  if (!Array.isArray(entries)) {
    throw new RealizeEachError("E_REALIZE_EACH_SHAPE", root, "must be a list of entries");
  }

  const authored = rest.realize ?? {};
  const realize: Record<string, RealizationRule | CelExpression> = { ...authored };
  // Where each generated name came from, for the collision message.
  const generatedBy = new Map<string, string>();

  for (const [entryIndex, entry] of entries.entries()) {
    const entryPath = `${root}[${entryIndex}]`;
    if (!isRecord(entry)) {
      throw new RealizeEachError(
        "E_REALIZE_EACH_SHAPE",
        entryPath,
        "an entry must be a mapping with 'index', 'over' and 'rules'",
      );
    }
    for (const key of Object.keys(entry)) {
      if (!ENTRY_KEYS.has(key)) {
        throw new RealizeEachError(
          "E_REALIZE_EACH_SHAPE",
          `${entryPath}.${key}`,
          "unknown key; an entry has only 'index', 'over' and 'rules'",
        );
      }
    }

    const { index, over, rules } = entry;
    if (typeof index !== "string" || !IDENTIFIER.test(index)) {
      throw new RealizeEachError(
        "E_REALIZE_EACH_SHAPE",
        `${entryPath}.index`,
        "must be an identifier naming the placeholder (for example 'n')",
      );
    }
    if (!Array.isArray(over) || over.length === 0) {
      throw new RealizeEachError(
        "E_REALIZE_EACH_OVER",
        `${entryPath}.over`,
        "must be a non-empty list of scalar values",
      );
    }
    const values = over.map((value, valueIndex) => {
      const scalar =
        (typeof value === "number" && Number.isFinite(value)) ||
        (typeof value === "string" && value.length > 0);
      if (!scalar) {
        throw new RealizeEachError(
          "E_REALIZE_EACH_OVER",
          `${entryPath}.over[${valueIndex}]`,
          "must be a finite number or a non-empty string",
        );
      }
      return String(value);
    });
    if (!isRecord(rules) || Object.keys(rules).length === 0) {
      throw new RealizeEachError(
        "E_REALIZE_EACH_SHAPE",
        `${entryPath}.rules`,
        "must be a non-empty mapping of rule-name templates to rules",
      );
    }

    const placeholder = `{${index}}`;
    for (const [nameTemplate, rule] of Object.entries(rules)) {
      const rulePath = `${entryPath}.rules.${nameTemplate}`;
      if (!nameTemplate.includes(placeholder)) {
        throw new RealizeEachError(
          "E_REALIZE_EACH_NAME",
          rulePath,
          `rule name does not contain the placeholder '${placeholder}', ` +
            "so every value would generate the same rule",
        );
      }
      validateRuleShape(rule, rulePath);

      for (const value of values) {
        const name = substitute(nameTemplate, index, value, rulePath);
        if (Object.hasOwn(authored, name)) {
          throw new RealizeEachError(
            "E_REALIZE_EACH_COLLISION",
            rulePath,
            `generated rule '${name}' is already authored under 'realize'`,
          );
        }
        const earlier = generatedBy.get(name);
        if (earlier !== undefined) {
          throw new RealizeEachError(
            "E_REALIZE_EACH_COLLISION",
            rulePath,
            `generated rule '${name}' was already generated by ${earlier}`,
          );
        }
        generatedBy.set(name, rulePath);
        realize[name] = instantiateRule(rule, index, value, rulePath);
      }
    }
  }

  return { ...rest, realize };
}
