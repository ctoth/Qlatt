import { isPlainObject, loadYamlDocumentSync } from "./yaml-loader";

export const DEFAULT_TUNE_GRAMMAR_PATH = "/rules/frontends/qlatt-english/policy/tune-grammar.yaml";

export type TunePhraseType = "declarative" | "question" | "exclamation" | "continuation";

export interface TunePhraseSpec {
  punctuation: string[];
  default?: boolean;
  citations: string[];
  prenuclear: {
    first: string;
    later: string;
  };
  nuclear: {
    with_prenuclear: string;
    without_prenuclear: string;
  };
  edge: {
    initial_boundary_tone: string | null;
    phrase_accent: string | null;
    boundary_tone: string | null;
  };
}

export interface TuneGrammar {
  version: string;
  citations: string[];
  phrase_types: Record<TunePhraseType, TunePhraseSpec>;
}

export interface SelectTuneOptions {
  punctuation: string | null;
  hasPrenuclearAccent: boolean;
}

export interface TuneSelection {
  phraseType: TunePhraseType;
  prenuclearFirstAccent: string;
  prenuclearLaterAccent: string;
  nuclearAccent: string;
  initialBoundaryTone: string | null;
  phraseAccent: string | null;
  boundaryTone: string | null;
  citations: string[];
}

const REQUIRED_PHRASE_TYPES: TunePhraseType[] = [
  "declarative",
  "question",
  "exclamation",
  "continuation",
];

const grammarCache = new Map<string, TuneGrammar>();

function expectNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`E_TUNE_GRAMMAR_SCHEMA: '${label}' must be a non-empty string`);
  }
  return value;
}

function expectStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`E_TUNE_GRAMMAR_SCHEMA: '${label}' must be an array`);
  }
  return value.map((entry, index) => expectNonEmptyString(entry, `${label}[${index}]`));
}

function expectOptionalTone(value: unknown, label: string): string | null {
  if (value == null) return null;
  return expectNonEmptyString(value, label);
}

function parsePhraseSpec(phraseType: TunePhraseType, value: unknown): TunePhraseSpec {
  if (!isPlainObject(value)) {
    throw new Error(`E_TUNE_GRAMMAR_SCHEMA: phrase type '${phraseType}' must be an object`);
  }

  const prenuclear = value.prenuclear;
  const nuclear = value.nuclear;
  const edge = value.edge;

  if (!isPlainObject(prenuclear)) {
    throw new Error(`E_TUNE_GRAMMAR_SCHEMA: '${phraseType}.prenuclear' must be an object`);
  }
  if (!isPlainObject(nuclear)) {
    throw new Error(`E_TUNE_GRAMMAR_SCHEMA: '${phraseType}.nuclear' must be an object`);
  }
  if (!isPlainObject(edge)) {
    throw new Error(`E_TUNE_GRAMMAR_SCHEMA: '${phraseType}.edge' must be an object`);
  }

  return {
    punctuation: expectStringArray(value.punctuation ?? [], `${phraseType}.punctuation`),
    default: value.default === true,
    citations: expectStringArray(value.citations ?? [], `${phraseType}.citations`),
    prenuclear: {
      first: expectNonEmptyString(prenuclear.first, `${phraseType}.prenuclear.first`),
      later: expectNonEmptyString(prenuclear.later, `${phraseType}.prenuclear.later`),
    },
    nuclear: {
      with_prenuclear: expectNonEmptyString(
        nuclear.with_prenuclear,
        `${phraseType}.nuclear.with_prenuclear`,
      ),
      without_prenuclear: expectNonEmptyString(
        nuclear.without_prenuclear,
        `${phraseType}.nuclear.without_prenuclear`,
      ),
    },
    edge: {
      initial_boundary_tone: expectOptionalTone(
        edge.initial_boundary_tone,
        `${phraseType}.edge.initial_boundary_tone`,
      ),
      phrase_accent: expectOptionalTone(edge.phrase_accent, `${phraseType}.edge.phrase_accent`),
      boundary_tone: expectOptionalTone(edge.boundary_tone, `${phraseType}.edge.boundary_tone`),
    },
  };
}

function parseTuneGrammarDocument(value: unknown): TuneGrammar {
  if (!isPlainObject(value)) {
    throw new Error("E_TUNE_GRAMMAR_SCHEMA: top-level document must be an object");
  }
  if (!isPlainObject(value.phrase_types)) {
    throw new Error("E_TUNE_GRAMMAR_SCHEMA: 'phrase_types' must be an object");
  }

  const phraseTypes = {} as Record<TunePhraseType, TunePhraseSpec>;
  for (const phraseType of REQUIRED_PHRASE_TYPES) {
    phraseTypes[phraseType] = parsePhraseSpec(phraseType, value.phrase_types[phraseType]);
  }

  return {
    version: expectNonEmptyString(value.version, "version"),
    citations: expectStringArray(value.citations ?? [], "citations"),
    phrase_types: phraseTypes,
  };
}

export function loadTuneGrammarSync(specPath: string = DEFAULT_TUNE_GRAMMAR_PATH): TuneGrammar {
  const cached = grammarCache.get(specPath);
  if (cached) return cached;

  const raw = loadYamlDocumentSync<unknown>(specPath);
  const grammar = parseTuneGrammarDocument(raw);
  grammarCache.set(specPath, grammar);
  return grammar;
}

export function classifyTunePhraseType(
  punctuation: string | null,
  grammar: TuneGrammar = loadTuneGrammarSync(),
): TunePhraseType {
  for (const phraseType of REQUIRED_PHRASE_TYPES) {
    if (punctuation != null && grammar.phrase_types[phraseType].punctuation.includes(punctuation)) {
      return phraseType;
    }
  }

  for (const phraseType of REQUIRED_PHRASE_TYPES) {
    if (grammar.phrase_types[phraseType].default === true) {
      return phraseType;
    }
  }

  throw new Error("E_TUNE_GRAMMAR_SCHEMA: no default phrase type is defined");
}

export function selectTuneForPhrase(
  grammar: TuneGrammar,
  options: SelectTuneOptions,
): TuneSelection {
  const phraseType = classifyTunePhraseType(options.punctuation, grammar);
  const spec = grammar.phrase_types[phraseType];

  return {
    phraseType,
    prenuclearFirstAccent: spec.prenuclear.first,
    prenuclearLaterAccent: spec.prenuclear.later,
    nuclearAccent: options.hasPrenuclearAccent
      ? spec.nuclear.with_prenuclear
      : spec.nuclear.without_prenuclear,
    initialBoundaryTone: spec.edge.initial_boundary_tone,
    phraseAccent: spec.edge.phrase_accent,
    boundaryTone: spec.edge.boundary_tone,
    citations: [
      DEFAULT_TUNE_GRAMMAR_PATH,
      ...grammar.citations,
      ...spec.citations,
    ].filter((value, index, all) => all.indexOf(value) === index),
  };
}
