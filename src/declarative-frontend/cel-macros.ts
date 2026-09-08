/**
 * Rulepack `functions:` block: named CEL macros expanded at load time (#47).
 *
 * A frontend declares a predicate or formula once,
 *
 * ```yaml
 * functions:
 *   is_open_nucleus:
 *     params: [item]
 *     body: isTrue(item, 'is_nucleus') && !isTrue(item, 'has_coda')
 *     citations: [Klatt 1976]
 * ```
 *
 * and every rule expression may call it: `is_open_nucleus(current)`. Calls
 * are expanded TEXTUALLY before validation, so the rulepack that is validated,
 * executed, and traced is plain CEL:
 *
 * - a host that ports the rule engine needs no macro support;
 * - every existing validation pass (function surface, relation helpers,
 *   item-field reads, phoneme literals) sees the expansion;
 * - an argument that is a single primary expression (`current`,
 *   `params.k`, `3`, `ahead(current, 2)`) is substituted bare so the
 *   item-field read validator still sees `current.type`; any other argument
 *   is parenthesized; the whole body is parenthesized so operator precedence
 *   at the call site can never leak into it.
 *
 * Bodies may reference the ambient rule context (`current`, `sets`, ...)
 * directly and may call other macros; recursion is rejected. Parameter names
 * are substituted only where they occur as bare identifiers (never inside
 * string literals, after `.`, or as a call name).
 */

import { isPlainObject } from "../yaml-loader";
import { isCatalogFunctionName, validateExpressionSyntax } from "./cel-expressions";

export type CelMacroDefinition = {
  readonly name: string;
  readonly params: readonly string[];
  /** The body as declared. */
  readonly body: string;
  /** The body with every nested macro call already expanded. */
  readonly expandedBody: string;
  readonly citations: readonly string[];
  readonly description: string | null;
};

export type CelMacroTable = ReadonlyMap<string, CelMacroDefinition>;

const ERROR_PREFIX = "E_RULEPACK_FUNCTIONS";
const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ALLOWED_DEFINITION_KEYS = new Set(["params", "body", "citations", "description"]);
const OPERATOR_CHARS = new Set([..."+-*/%<>=!&|?: \t\r\n"]);

function fail(message: string): never {
  throw new Error(`${ERROR_PREFIX}: ${message}`);
}

function isIdentifierStart(char: string): boolean {
  return (char >= "A" && char <= "Z") || (char >= "a" && char <= "z") || char === "_";
}

function isIdentifierChar(char: string): boolean {
  return isIdentifierStart(char) || (char >= "0" && char <= "9");
}

function isQuote(char: string): boolean {
  return char === "'" || char === '"';
}

/**
 * Given `text[start]` is a quote, return the index just past the closing
 * quote. Handles CEL triple-quoted strings; `raw` disables backslash escapes.
 */
function skipStringLiteral(text: string, start: number, raw: boolean): number {
  const quote = text[start];
  const triple = text.startsWith(quote.repeat(3), start);
  let index = start + (triple ? 3 : 1);
  while (index < text.length) {
    const char = text[index];
    if (!raw && char === "\\") {
      index += 2;
      continue;
    }
    if (char === quote) {
      if (!triple) return index + 1;
      if (text.startsWith(quote.repeat(3), index)) return index + 3;
    }
    index++;
  }
  fail(`unterminated string literal in CEL expression: ${text}`);
}

/** CEL string prefixes: r/R (raw), b/B (bytes), and their combinations. */
function isStringPrefix(word: string): boolean {
  return /^(?:[rR]|[bB]|[rR][bB]|[bB][rR])$/.test(word);
}

type Token =
  | { kind: "identifier"; text: string; start: number; end: number }
  | { kind: "string"; text: string; start: number; end: number }
  | { kind: "char"; text: string; start: number; end: number };

/** Tokenize just enough of CEL to tell identifiers and string literals apart. */
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (isQuote(char)) {
      const end = skipStringLiteral(text, index, false);
      tokens.push({ kind: "string", text: text.slice(index, end), start: index, end });
      index = end;
      continue;
    }
    if (isIdentifierStart(char)) {
      let end = index + 1;
      while (end < text.length && isIdentifierChar(text[end])) end++;
      const word = text.slice(index, end);
      if (end < text.length && isQuote(text[end]) && isStringPrefix(word)) {
        const literalEnd = skipStringLiteral(text, end, /r/i.test(word));
        tokens.push({
          kind: "string",
          text: text.slice(index, literalEnd),
          start: index,
          end: literalEnd,
        });
        index = literalEnd;
        continue;
      }
      tokens.push({ kind: "identifier", text: word, start: index, end });
      index = end;
      continue;
    }
    tokens.push({ kind: "char", text: char, start: index, end: index + 1 });
    index++;
  }
  return tokens;
}

function previousSignificantChar(text: string, index: number): string | null {
  for (let cursor = index - 1; cursor >= 0; cursor--) {
    const char = text[cursor];
    if (char === " " || char === "\t" || char === "\r" || char === "\n") continue;
    return char;
  }
  return null;
}

function nextSignificantIndex(text: string, index: number): number {
  let cursor = index;
  while (cursor < text.length && /\s/.test(text[cursor])) cursor++;
  return cursor;
}

/** A member name after `.` or `.?` is never a macro call or a parameter. */
function isMemberPosition(text: string, index: number): boolean {
  const previous = previousSignificantChar(text, index);
  return previous === "." || (previous === "?" && text.slice(0, index).trimEnd().endsWith(".?"));
}

/**
 * Split the argument list that starts at `openIndex` (which must be `(`)
 * into top-level argument texts. Returns the arguments and the index just
 * past the closing `)`.
 */
function readArguments(text: string, openIndex: number): { args: string[]; end: number } {
  const args: string[] = [];
  let depth = 0;
  let argStart = openIndex + 1;
  let index = openIndex;
  while (index < text.length) {
    const char = text[index];
    if (isQuote(char)) {
      index = skipStringLiteral(text, index, false);
      continue;
    }
    if (char === "(" || char === "[" || char === "{") {
      depth++;
    } else if (char === ")" || char === "]" || char === "}") {
      depth--;
      if (depth === 0) {
        const last = text.slice(argStart, index).trim();
        if (last.length > 0 || args.length > 0) args.push(last);
        return { args, end: index + 1 };
      }
    } else if (char === "," && depth === 1) {
      args.push(text.slice(argStart, index).trim());
      argStart = index + 1;
    }
    index++;
  }
  fail(`unbalanced parentheses in CEL expression: ${text}`);
}

/**
 * Whether an argument is a single primary expression (identifier, member
 * path, literal, call, index, list, or map) that can be substituted without
 * parentheses. Anything with a top-level operator or whitespace is wrapped.
 */
function isAtomicArgument(text: string): boolean {
  let depth = 0;
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (isQuote(char)) {
      index = skipStringLiteral(text, index, false);
      continue;
    }
    if (char === "(" || char === "[" || char === "{") depth++;
    else if (char === ")" || char === "]" || char === "}") depth--;
    else if (depth === 0 && OPERATOR_CHARS.has(char)) return false;
    index++;
  }
  return true;
}

/** Substitute each bare parameter identifier in `body` with its argument text. */
function substituteParams(
  body: string,
  params: readonly string[],
  args: readonly string[],
): string {
  const replacements = new Map(params.map((param, index) => [param, args[index]]));
  let out = "";
  for (const token of tokenize(body)) {
    if (token.kind !== "identifier" || !replacements.has(token.text)) {
      out += token.text;
      continue;
    }
    if (
      isMemberPosition(body, token.start) ||
      body[nextSignificantIndex(body, token.end)] === "("
    ) {
      out += token.text;
      continue;
    }
    const argument = replacements.get(token.text) ?? "";
    out += isAtomicArgument(argument) ? argument : `(${argument})`;
  }
  return out;
}

/** Names of the macros called (as bare functions) anywhere in `text`. */
function calledMacroNames(text: string, macroNames: ReadonlySet<string>): string[] {
  const names: string[] = [];
  for (const token of tokenize(text)) {
    if (token.kind !== "identifier" || !macroNames.has(token.text)) continue;
    if (isMemberPosition(text, token.start)) continue;
    if (text[nextSignificantIndex(text, token.end)] !== "(") continue;
    names.push(token.text);
  }
  return names;
}

/**
 * Expand every macro call in `expression`. Arguments are expanded before
 * substitution; bodies were expanded when the table was built, so one pass
 * suffices. `location` names the spec path for error messages.
 */
export function expandCelMacros(
  expression: string,
  macros: CelMacroTable,
  location?: string,
): string {
  if (macros.size === 0) return expression;
  let out = "";
  let index = 0;
  const tokens = tokenize(expression);
  for (const token of tokens) {
    if (token.start < index) continue;
    if (token.kind !== "identifier" || !macros.has(token.text)) {
      out += expression.slice(index, token.end);
      index = token.end;
      continue;
    }
    const openIndex = nextSignificantIndex(expression, token.end);
    if (isMemberPosition(expression, token.start) || expression[openIndex] !== "(") {
      out += expression.slice(index, token.end);
      index = token.end;
      continue;
    }
    const macro = macros.get(token.text);
    if (!macro) continue;
    const { args, end } = readArguments(expression, openIndex);
    if (args.length !== macro.params.length) {
      const where = location ? ` (at ${location})` : "";
      fail(`${macro.name} expects ${macro.params.length} argument(s), got ${args.length}${where}`);
    }
    const expandedArgs = args.map((arg) => expandCelMacros(arg, macros, location));
    out += expression.slice(index, token.start);
    out += `(${substituteParams(macro.expandedBody, macro.params, expandedArgs)})`;
    index = end;
  }
  return out + expression.slice(index);
}

type RawDefinition = {
  name: string;
  params: string[];
  body: string;
  citations: string[];
  description: string | null;
};

function parseDefinition(name: string, raw: unknown): RawDefinition {
  if (!IDENTIFIER_PATTERN.test(name)) {
    fail(`functions name '${name}' must be an identifier ([A-Za-z_][A-Za-z0-9_]*)`);
  }
  if (isCatalogFunctionName(name)) {
    fail(`functions name '${name}' shadows a catalog function`);
  }
  if (!isPlainObject(raw)) fail(`functions['${name}'] must be an object with params and body`);
  for (const key of Object.keys(raw)) {
    if (!ALLOWED_DEFINITION_KEYS.has(key)) fail(`functions['${name}'] has unknown key '${key}'`);
  }
  const params = raw.params === undefined ? [] : raw.params;
  if (!Array.isArray(params)) fail(`functions['${name}'].params must be an array of identifiers`);
  const seen = new Set<string>();
  const names: string[] = [];
  params.forEach((param, index) => {
    if (typeof param !== "string" || !IDENTIFIER_PATTERN.test(param)) {
      fail(
        `functions['${name}'].params[${index}] must be an identifier, got ${JSON.stringify(param)}`,
      );
    }
    if (seen.has(param)) fail(`functions['${name}'] has duplicate param '${param}'`);
    seen.add(param);
    names.push(param);
  });
  if (typeof raw.body !== "string" || raw.body.trim().length === 0) {
    fail(`functions['${name}'] requires a non-empty string body`);
  }
  const citations = raw.citations === undefined ? [] : raw.citations;
  if (
    !Array.isArray(citations) ||
    citations.some((entry) => typeof entry !== "string" || entry.trim().length === 0)
  ) {
    fail(`functions['${name}'].citations must be an array of non-empty strings`);
  }
  if (raw.description !== undefined && typeof raw.description !== "string") {
    fail(`functions['${name}'].description must be a string`);
  }
  return {
    name,
    params: names,
    body: raw.body.trim(),
    citations: citations.map((entry) => entry.trim()),
    description: typeof raw.description === "string" ? raw.description : null,
  };
}

/**
 * Parse and validate a rulepack `functions:` block into an expansion table.
 * Bodies are expanded against each other in dependency order (a cycle is an
 * error) and each expanded body must be valid CEL on the rule-engine surface.
 */
export function parseCelMacroBlock(raw: unknown): CelMacroTable {
  if (raw === undefined || raw === null) return new Map<string, CelMacroDefinition>();
  if (!isPlainObject(raw)) fail("functions must be an object mapping name to {params, body}");

  const definitions = new Map<string, RawDefinition>();
  for (const [name, definition] of Object.entries(raw)) {
    const parsed = parseDefinition(name, definition);
    // Text substitution has no lexical binder renaming. Fail closed rather
    // than capturing caller variables inside a CEL comprehension.
    const binders = new Set(["map", "filter", "all", "exists", "exists_one"]);
    for (const token of tokenize(parsed.body)) {
      if (
        token.kind === "identifier" &&
        binders.has(token.text) &&
        isMemberPosition(parsed.body, token.start) &&
        parsed.body[nextSignificantIndex(parsed.body, token.end)] === "("
      ) {
        fail(`functions['${name}'] cannot contain a comprehension; use it at the call site`);
      }
    }
    definitions.set(name, parsed);
  }
  const macroNames = new Set(definitions.keys());

  const table = new Map<string, CelMacroDefinition>();
  const visiting: string[] = [];

  const build = (name: string): CelMacroDefinition => {
    const built = table.get(name);
    if (built) return built;
    const cycleStart = visiting.indexOf(name);
    if (cycleStart >= 0) {
      fail(`functions cycle: ${[...visiting.slice(cycleStart), name].join(" -> ")}`);
    }
    const definition = definitions.get(name);
    if (!definition) fail(`functions['${name}'] is not declared`);
    visiting.push(name);
    const dependencies = new Map<string, CelMacroDefinition>();
    for (const callee of calledMacroNames(definition.body, macroNames)) {
      dependencies.set(callee, build(callee));
    }
    visiting.pop();
    const expandedBody = expandCelMacros(definition.body, dependencies, `functions.${name}.body`);
    const syntaxError = validateExpressionSyntax(expandedBody);
    if (syntaxError) fail(`functions['${name}'].body is not valid CEL: ${syntaxError}`);
    const macro: CelMacroDefinition = Object.freeze({
      name,
      params: Object.freeze([...definition.params]),
      body: definition.body,
      expandedBody,
      citations: Object.freeze([
        ...new Set([
          ...definition.citations,
          ...[...dependencies.values()].flatMap((dependency) => dependency.citations),
        ]),
      ]),
      description: definition.description,
    });
    table.set(name, macro);
    return macro;
  };

  for (const name of definitions.keys()) build(name);
  return table;
}

const NON_EXPRESSION_KEYS = new Set([
  "functions",
  "citations",
  "citation",
  "description",
  "name",
  "kind",
  "op",
  "field",
  "tag",
  "relation",
  "capture",
  "predicate",
  "match",
]);

function expandValue(
  value: unknown,
  macros: CelMacroTable,
  path: string,
  citations: Set<string>,
): unknown {
  if (typeof value === "string") {
    const called = calledMacroNames(value, new Set(macros.keys()));
    if (called.length === 0) return value;
    for (const name of called) {
      for (const citation of macros.get(name)?.citations ?? []) citations.add(citation);
    }
    return expandCelMacros(value, macros, path);
  }
  if (Array.isArray(value)) {
    return value.map((entry, index) => expandValue(entry, macros, `${path}[${index}]`, citations));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        NON_EXPRESSION_KEYS.has(key) && !path.endsWith(".define")
          ? entry
          : expandValue(entry, macros, `${path}.${key}`, citations),
      ]),
    );
  }
  return value;
}

/** Expand executable rule surfaces only; literal policy data is not CEL. */
export function expandSpecCelMacros<T extends Record<string, unknown>>(
  spec: T,
  macros: CelMacroTable,
): T {
  if (macros.size === 0) return spec;
  const expanded: Record<string, unknown> = { ...spec };
  const sources = new Map<string, Set<string>>();
  if (isPlainObject(spec.text_recognition)) {
    const expandSpeaking = (value: unknown, path: string): unknown => {
      if (!isPlainObject(value)) return value;
      const entry = { ...value };
      const citations = new Set<string>();
      for (const key of ["when", "speak", "vocabulary_keys"]) {
        if (typeof entry[key] === "string")
          entry[key] = expandValue(entry[key], macros, `${path}.${key}`, citations);
      }
      if (Array.isArray(entry.citations))
        entry.citations = [...new Set([...entry.citations, ...citations])];
      return entry;
    };
    expanded.text_recognition = {
      ...spec.text_recognition,
      rules: Array.isArray(spec.text_recognition.rules)
        ? spec.text_recognition.rules.map((rule, index) =>
            expandSpeaking(rule, `text_recognition.rules[${index}]`),
          )
        : spec.text_recognition.rules,
      unmatched: expandSpeaking(spec.text_recognition.unmatched, "text_recognition.unmatched"),
    };
  }
  for (const root of ["predicates", "patterns", "rules"]) {
    const entries = spec[root];
    if (!isPlainObject(entries)) continue;
    expanded[root] = Object.fromEntries(
      Object.entries(entries).map(([name, value]) => {
        const citations = new Set<string>();
        const result = expandValue(value, macros, `${root}.${name}`, citations);
        sources.set(`${root}.${name}`, citations);
        return [name, result];
      }),
    );
  }

  // A rule may use a named predicate/pattern whose expression calls a macro.
  // Carry those source citations along the same rule provenance path.
  const collect = (value: unknown, citations: Set<string>, visited: Set<string>): void => {
    if (Array.isArray(value)) {
      for (const entry of value) collect(entry, citations, visited);
    } else if (isPlainObject(value)) {
      for (const [key, entry] of Object.entries(value)) {
        const root = key === "predicate" ? "predicates" : key === "match" ? "patterns" : null;
        if (root && typeof entry === "string") {
          const id = `${root}.${entry}`;
          if (visited.has(id)) continue;
          visited.add(id);
          for (const citation of sources.get(id) ?? []) citations.add(citation);
          const definitions = expanded[root];
          if (isPlainObject(definitions)) collect(definitions[entry], citations, visited);
        } else {
          collect(entry, citations, visited);
        }
      }
    }
  };
  if (isPlainObject(expanded.rules)) {
    for (const [name, rule] of Object.entries(expanded.rules)) {
      if (!isPlainObject(rule)) continue;
      const citations = new Set(sources.get(`rules.${name}`));
      collect(rule, citations, new Set());
      // Macros do not waive the existing requirement for rule citations.
      if (
        citations.size > 0 &&
        (Array.isArray(rule.citations) || typeof rule.citation === "string")
      ) {
        const own = Array.isArray(rule.citations) ? rule.citations : [rule.citation];
        rule.citations = [...new Set([...own, ...citations])];
      }
    }
  }
  return Object.assign({ ...spec }, expanded);
}
