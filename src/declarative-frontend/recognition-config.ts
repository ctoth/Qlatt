import { isPlainObject } from "../yaml-loader";
import { validateExpressionSyntax } from "./cel-expressions";

export type SpeakingDeclaration = {
  speak: string;
  vocabulary_keys: string;
  citations: string[];
};
export type RecognitionRule = SpeakingDeclaration & {
  id: string;
  pattern: string;
  flags: string;
  class: string;
  captures: Record<string, string>;
  when: string;
};
export type RecognitionConfig = {
  rules: RecognitionRule[];
  unmatched: SpeakingDeclaration;
};

const immutableConfigs = new WeakMap<object, RecognitionConfig>();

function deeplyFrozen(value: unknown): boolean {
  return (
    value === null ||
    typeof value !== "object" ||
    (Object.isFrozen(value) && Object.values(value).every(deeplyFrozen))
  );
}

function invalid(path: string, message: string): never {
  throw new Error(`E_RECOGNITION_CONFIG: ${path}: ${message}`);
}

function object(value: unknown, path: string): Record<string, unknown> {
  if (!isPlainObject(value)) invalid(path, "must be an object");
  return value;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0)
    invalid(path, "must be a non-empty string");
  return value;
}

function expression(value: unknown, path: string): string {
  const text = string(value, path);
  const error = validateExpressionSyntax(text, {
    variables: ["current", "captures", "source", "maps", "sets"],
  });
  if (error) invalid(path, error);
  return text;
}

function speaking(raw: Record<string, unknown>, path: string): SpeakingDeclaration {
  if (!Array.isArray(raw.citations) || raw.citations.length === 0)
    invalid(path, "citations are required");
  return {
    speak: expression(raw.speak, `${path}.speak`),
    vocabulary_keys: expression(raw.vocabulary_keys, `${path}.vocabulary_keys`),
    citations: raw.citations.map((value, index) => string(value, `${path}.citations[${index}]`)),
  };
}

/** The RegExp constructor checks syntax; this scan identifies only real named groups. */
function captureNames(pattern: string): Set<string> {
  const names = new Set<string>();
  let inClass = false;
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "\\") {
      index += 1;
      continue;
    }
    if (char === "[") inClass = true;
    if (char === "]") inClass = false;
    if (!inClass && pattern.startsWith("(?<", index) && !["=", "!"].includes(pattern[index + 3])) {
      const end = pattern.indexOf(">", index + 3);
      names.add(pattern.slice(index + 3, end));
    }
  }
  return names;
}

/** Called by the existing rulepack validator, before any input is executed. */
export function parseRecognitionConfig(
  spec: Record<string, unknown>,
): RecognitionConfig | undefined {
  const cached = immutableConfigs.get(spec);
  if (cached) return cached;
  if (!Object.hasOwn(spec, "text_recognition")) return undefined;
  const raw = object(spec.text_recognition, "text_recognition");
  for (const key of Object.keys(raw)) {
    if (key !== "rules" && key !== "unmatched")
      invalid(`text_recognition.${key}`, "unknown declaration");
  }
  const normalization = object(spec.normalization, "normalization");
  if (Object.hasOwn(normalization, "phases")) {
    if (!Array.isArray(normalization.phases) || normalization.phases.length === 0)
      invalid("normalization.phases", "requires ordered phase names");
    const declared = new Set(
      Array.isArray(spec.phases) ? spec.phases.map((phase) => object(phase, "phases").name) : [],
    );
    normalization.phases.forEach((phase, index) => {
      string(phase, `normalization.phases[${index}]`);
      if (!declared.has(phase)) invalid("normalization.phases", `unknown phase '${phase}'`);
    });
  }
  const transcription = object(spec.transcription, "transcription");
  if (
    !Array.isArray(transcription.punctuation_tokens) ||
    transcription.punctuation_tokens.length === 0
  ) {
    invalid("transcription.punctuation_tokens", "must be an explicit non-empty array");
  }
  transcription.punctuation_tokens.forEach((value, index) => {
    string(value, `transcription.punctuation_tokens[${index}]`);
  });
  if (!Array.isArray(raw.rules)) invalid("text_recognition.rules", "must be an ordered array");
  const ids = new Set<string>();
  const rules = raw.rules.map((value, index): RecognitionRule => {
    const path = `text_recognition.rules[${index}]`;
    const entry = object(value, path);
    for (const key of Object.keys(entry)) {
      if (
        ![
          "id",
          "pattern",
          "table",
          "prefix",
          "suffix",
          "flags",
          "class",
          "captures",
          "when",
          "speak",
          "vocabulary_keys",
          "citations",
        ].includes(key)
      )
        invalid(`${path}.${key}`, "unknown declaration");
    }
    const id = string(entry.id, `${path}.id`);
    if (ids.has(id)) invalid(path, `duplicate rule id '${id}'`);
    ids.add(id);
    let pattern: string;
    if (Object.hasOwn(entry, "table")) {
      if (Object.hasOwn(entry, "pattern")) invalid(path, "declare table or pattern, not both");
      const tableName = string(entry.table, `${path}.table`);
      const maps = object(spec.maps, "maps");
      const table = object(maps[tableName], `maps.${tableName}`);
      const keys = Object.keys(table);
      if (!keys.length || keys.some((key) => !key.length))
        invalid(path, "table needs nonempty literal keys");
      if (typeof entry.prefix !== "string" || typeof entry.suffix !== "string")
        invalid(path, "table matching needs explicit prefix and suffix");
      const escaped = keys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      pattern = `${entry.prefix}(?<key>${escaped.join("|")})${entry.suffix}`;
    } else pattern = string(entry.pattern, `${path}.pattern`);
    if (typeof entry.flags !== "string" || !/^[imsu]*$/.test(entry.flags))
      invalid(`${path}.flags`, "only explicit i, m, s, u flags are supported");
    try {
      const regex = new RegExp(pattern, entry.flags);
      if (regex.test("")) invalid(path, "pattern accepts an empty match");
    } catch (error) {
      invalid(path, error instanceof Error ? error.message : String(error));
    }
    const names = captureNames(pattern);
    const captures = Object.fromEntries(
      Object.entries(object(entry.captures, `${path}.captures`)).map(([feature, capture]) => {
        const name = string(capture, `${path}.captures.${feature}`);
        if (!names.has(name)) invalid(path, `unknown capture '${name}'`);
        return [feature, name];
      }),
    );
    return {
      id,
      pattern,
      flags: entry.flags,
      class: string(entry.class, `${path}.class`),
      captures,
      when: expression(entry.when, `${path}.when`),
      ...speaking(entry, path),
    };
  });
  const fallback = object(raw.unmatched, "text_recognition.unmatched");
  for (const key of Object.keys(fallback)) {
    if (!["speak", "vocabulary_keys", "citations"].includes(key))
      invalid(`text_recognition.unmatched.${key}`, "unknown declaration");
  }
  const config = { rules, unmatched: speaking(fallback, "text_recognition.unmatched") };
  // Loaded rulepacks are immutable. Mutable programmatic documents must still
  // be validated on every call so edits cannot reuse stale recognition data.
  if (
    Object.isFrozen(spec) &&
    [raw, normalization, transcription, spec.phases, spec.maps].every(deeplyFrozen)
  ) {
    for (const rule of rules) {
      Object.freeze(rule.captures);
      Object.freeze(rule.citations);
      Object.freeze(rule);
    }
    Object.freeze(rules);
    Object.freeze(config.unmatched.citations);
    Object.freeze(config.unmatched);
    Object.freeze(config);
    immutableConfigs.set(spec, config);
  }
  return config;
}
