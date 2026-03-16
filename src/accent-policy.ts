import { isPlainObject, loadYamlDocumentSync } from "./yaml-loader";

export const DEFAULT_ACCENT_POLICY_PATH = "/rules/frontends/qlatt-english/policy/accent-policy.yaml";

export interface AccentAssignmentPolicy {
  require_content_word: boolean;
  required_stress: number;
  carrier_selection: "first_primary_stress";
}

export interface AccentPolicy {
  version: string;
  citations: string[];
  function_words: string[];
  accent_assignment: AccentAssignmentPolicy;
}

export interface WordProsodyClassification {
  isFunctionWord: boolean;
  isContentWord: boolean;
}

export interface ResolveAccentAssignmentOptions {
  isContentWord: boolean;
  stresses: Array<number | null | undefined>;
}

export interface AccentAssignmentDecision {
  accented: boolean;
  carrierStress: number | null;
  carrierOrdinal: number | null;
}

let accentPolicyCache: AccentPolicy | null = null;
let functionWordSetCache: ReadonlySet<string> | null = null;

function expectNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`E_ACCENT_POLICY_SCHEMA: '${label}' must be a non-empty string`);
  }
  return value;
}

function expectBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`E_ACCENT_POLICY_SCHEMA: '${label}' must be a boolean`);
  }
  return value;
}

function expectFiniteNumber(value: unknown, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`E_ACCENT_POLICY_SCHEMA: '${label}' must be a finite number`);
  }
  return Number(value);
}

function expectStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`E_ACCENT_POLICY_SCHEMA: '${label}' must be an array`);
  }

  return value.map((entry, index) => expectNonEmptyString(entry, `${label}[${index}]`));
}

function expectLowerCaseStringArray(value: unknown, label: string): string[] {
  return expectStringArray(value, label).map((entry) => entry.toLowerCase());
}

function parseAccentPolicyDocument(value: unknown): AccentPolicy {
  if (!isPlainObject(value)) {
    throw new Error("E_ACCENT_POLICY_SCHEMA: top-level document must be an object");
  }
  if (!isPlainObject(value.accent_assignment)) {
    throw new Error("E_ACCENT_POLICY_SCHEMA: 'accent_assignment' must be an object");
  }

  const accentAssignment = value.accent_assignment;
  const carrierSelection = expectNonEmptyString(
    accentAssignment.carrier_selection,
    "accent_assignment.carrier_selection",
  );
  if (carrierSelection !== "first_primary_stress") {
    throw new Error(
      `E_ACCENT_POLICY_SCHEMA: unsupported carrier_selection '${carrierSelection}'`,
    );
  }

  return {
    version: expectNonEmptyString(value.version, "version"),
    citations: expectStringArray(value.citations ?? [], "citations"),
    function_words: expectLowerCaseStringArray(value.function_words ?? [], "function_words"),
    accent_assignment: {
      require_content_word: expectBoolean(
        accentAssignment.require_content_word,
        "accent_assignment.require_content_word",
      ),
      required_stress: expectFiniteNumber(
        accentAssignment.required_stress,
        "accent_assignment.required_stress",
      ),
      carrier_selection: "first_primary_stress",
    },
  };
}

export function loadAccentPolicySync(specPath: string = DEFAULT_ACCENT_POLICY_PATH): AccentPolicy {
  if (specPath === DEFAULT_ACCENT_POLICY_PATH && accentPolicyCache) {
    return accentPolicyCache;
  }

  const policy = parseAccentPolicyDocument(loadYamlDocumentSync(specPath));
  if (specPath === DEFAULT_ACCENT_POLICY_PATH) {
    accentPolicyCache = policy;
  }
  return policy;
}

export function getFunctionWordSet(
  policy: AccentPolicy = loadAccentPolicySync(),
): ReadonlySet<string> {
  if (policy === accentPolicyCache && functionWordSetCache) {
    return functionWordSetCache;
  }

  const set = new Set(policy.function_words.map((word) => word.toLowerCase()));
  if (policy === accentPolicyCache) {
    functionWordSetCache = set;
  }
  return set;
}

export function classifyWordProsody(
  policy: AccentPolicy,
  word: string | null | undefined,
): WordProsodyClassification {
  const normalized = typeof word === "string" ? word.toLowerCase() : "";
  const isFunctionWord = getFunctionWordSet(policy).has(normalized);
  return {
    isFunctionWord,
    isContentWord: !isFunctionWord,
  };
}

export function resolveAccentAssignment(
  policy: AccentPolicy,
  options: ResolveAccentAssignmentOptions,
): AccentAssignmentDecision {
  const { require_content_word, required_stress } = policy.accent_assignment;
  const hasRequiredStress = options.stresses.some((stress) => stress === required_stress);
  const accented = hasRequiredStress && (!require_content_word || options.isContentWord);

  if (!accented) {
    return {
      accented: false,
      carrierStress: null,
      carrierOrdinal: null,
    };
  }

  return {
    accented: true,
    carrierStress: required_stress,
    carrierOrdinal: 0,
  };
}
