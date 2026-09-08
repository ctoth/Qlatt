export type ProvenanceStage =
  | "transcribe"
  | "rules"
  | "prosody"
  | "semantics"
  | "interpreter"
  | "runtime"
  | "frontend";

export interface RecognitionEvidence {
  outcome: "accepted" | "ineligible" | "overlap" | "unmatched";
  ruleId: string | null;
  sourceItemId: string;
  sourceStart: number;
  sourceEnd: number;
  captures: Record<string, { text: string | null; start: number | null; end: number | null }>;
  vocabularyKeys: string[];
}

export interface DecisionRecord {
  id: string;
  seq: number;
  stage: ProvenanceStage;
  type: string;
  subject: string;
  reason: string;
  citations: string[];
  parents?: string[];
  timestampMs?: number;
  recognition?: RecognitionEvidence;
  inventorySelection?: InventorySelectionEvidence;
  vocabularyLookup?: VocabularyLookupEvidence;
}

export interface VocabularyLookupEvidence {
  resource: string;
  table: string;
  key: string;
  value: string;
  ruleId: string;
}

export interface InventorySelectionEvidence {
  inputPhone: string;
  stress: number | null;
  lookupKey: string;
  selectedKey: string;
  secondaryStressFallback: boolean;
  sourceTokenId: string;
}

export interface AddDecisionInput {
  stage: ProvenanceStage;
  type: string;
  subject: string;
  reason: string;
  citations?: string[];
  parents?: string[];
  timestampMs?: number;
  recognition?: RecognitionEvidence;
  inventorySelection?: InventorySelectionEvidence;
  vocabularyLookup?: VocabularyLookupEvidence;
}

export interface ProvenanceCollector {
  add(input: AddDecisionInput): DecisionRecord;
  getDecisions(): DecisionRecord[];
  /** Number of locally recorded decisions, excluding external replay ancestors. */
  readonly size: number;
  /** Discard trailing local decisions and rewind their ID sequence for rollback. */
  truncate(length: number): void;
}

function toDecisionId(seq: number): string {
  return `d${String(seq).padStart(6, "0")}`;
}

function normalizeCitation(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return value == null ? null : String(value);
}

export function createProvenanceCollector(): ProvenanceCollector {
  const decisions: DecisionRecord[] = [];
  let seq = 0;

  return {
    get size(): number {
      return decisions.length;
    },
    truncate(length: number): void {
      if (!Number.isInteger(length) || length < 0 || length > decisions.length) {
        throw new Error(`E_PROVENANCE_TRUNCATE: invalid length ${String(length)}`);
      }
      decisions.length = length;
      seq = length;
    },
    add(input: AddDecisionInput): DecisionRecord {
      seq += 1;
      const decision: DecisionRecord = {
        id: toDecisionId(seq),
        seq,
        stage: input.stage,
        type: input.type,
        subject: input.subject,
        reason: input.reason,
        citations: Array.isArray(input.citations)
          ? input.citations
              .map((citation) => normalizeCitation(citation))
              .filter(
                (citation): citation is string =>
                  typeof citation === "string" && citation.length > 0,
              )
          : [],
        parents:
          Array.isArray(input.parents) && input.parents.length > 0 ? [...input.parents] : undefined,
        timestampMs: Number.isFinite(input.timestampMs) ? Number(input.timestampMs) : undefined,
        ...(input.recognition ? { recognition: structuredClone(input.recognition) } : {}),
        ...(input.vocabularyLookup ? { vocabularyLookup: { ...input.vocabularyLookup } } : {}),
        ...(input.inventorySelection
          ? { inventorySelection: { ...input.inventorySelection } }
          : {}),
      };
      decisions.push(decision);
      return decision;
    },

    getDecisions(): DecisionRecord[] {
      return decisions.map((decision) => ({
        ...decision,
        citations: [...decision.citations],
        parents: decision.parents ? [...decision.parents] : undefined,
        ...(decision.recognition ? { recognition: structuredClone(decision.recognition) } : {}),
        ...(decision.vocabularyLookup
          ? { vocabularyLookup: { ...decision.vocabularyLookup } }
          : {}),
        ...(decision.inventorySelection
          ? { inventorySelection: { ...decision.inventorySelection } }
          : {}),
      }));
    },
  };
}

export type RangeKind = "seq" | "time" | "token" | "id";

export interface RangeSpec {
  kind: RangeKind;
  start?: number | string;
  end?: number | string;
  raw: string;
}

function parseNumericBound(raw: string | undefined): number | undefined {
  if (raw == null || raw.length === 0) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric range bound '${raw}'`);
  }
  return value;
}

function splitRangeBody(body: string): [string, string] {
  const dashIndex = body.indexOf("-");
  if (dashIndex < 0) {
    throw new Error(`Range must include '-' separator: '${body}'`);
  }
  return [body.slice(0, dashIndex), body.slice(dashIndex + 1)];
}

export function parseRangeSpec(raw: string): RangeSpec {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error("Range cannot be empty");
  }

  const colonIndex = raw.indexOf(":");
  if (colonIndex < 0) {
    throw new Error(`Range must include kind prefix: '${raw}'`);
  }

  const kindRaw = raw.slice(0, colonIndex).trim();
  const body = raw.slice(colonIndex + 1).trim();
  if (body.length === 0) {
    throw new Error(`Range body is empty: '${raw}'`);
  }

  if (kindRaw === "seq" || kindRaw === "time") {
    const [startRaw, endRaw] = splitRangeBody(body);
    const start = parseNumericBound(startRaw.trim());
    const end = parseNumericBound(endRaw.trim());
    if (start == null && end == null) {
      throw new Error(`Range must include at least one bound: '${raw}'`);
    }
    return {
      kind: kindRaw,
      start,
      end,
      raw,
    };
  }

  if (kindRaw === "token" || kindRaw === "id") {
    const [startRaw, endRaw] = splitRangeBody(body);
    const start = startRaw.trim() || undefined;
    const end = endRaw.trim() || undefined;
    if (!start && !end) {
      throw new Error(`Range must include at least one bound: '${raw}'`);
    }
    return {
      kind: kindRaw,
      start,
      end,
      raw,
    };
  }

  throw new Error(`Unsupported range kind '${kindRaw}'`);
}

function isWithinNumericRange(value: number | undefined, start?: number, end?: number): boolean {
  if (!Number.isFinite(value)) return false;
  const numericValue = Number(value);
  if (start != null && numericValue < start) return false;
  if (end != null && numericValue > end) return false;
  return true;
}

function resolveSequenceWindowFromStringBounds(
  decisions: DecisionRecord[],
  selector: "subject" | "id",
  start?: string,
  end?: string,
): { startSeq?: number; endSeq?: number } {
  const matchesSelector = (value: string, needle: string): boolean => {
    if (value === needle) return true;
    if (selector === "subject" && value.endsWith(`:${needle}`)) return true;
    if (selector === "subject" && value.startsWith(`item:${needle}.`)) return true;
    return false;
  };

  let startSeq: number | undefined;
  let endSeq: number | undefined;

  if (start) {
    const match = decisions.find((decision) => matchesSelector(decision[selector], start));
    startSeq = match?.seq;
  }
  if (end) {
    // Selection decisions can precede a batched materialization transaction.
    // End at the initial feature-write block when one exists, so an earlier
    // selection record cannot cut the requested Item's actual writes out.
    const hasItemWrites =
      selector === "subject" &&
      decisions.some(
        (decision) =>
          decision.subject.startsWith(`item:${end}.`) &&
          (startSeq == null || decision.seq >= startSeq),
      );
    const firstEndIndex = decisions.findIndex((decision) => {
      if (hasItemWrites && !decision.subject.startsWith(`item:${end}.`)) return false;
      if (!matchesSelector(decision[selector], end)) return false;
      if (startSeq == null) return true;
      return decision.seq >= startSeq;
    });
    if (firstEndIndex >= 0) {
      endSeq = decisions[firstEndIndex].seq;
      let cursor = firstEndIndex + 1;
      while (cursor < decisions.length && matchesSelector(decisions[cursor][selector], end)) {
        endSeq = decisions[cursor].seq;
        cursor += 1;
      }
    }
  }

  return { startSeq, endSeq };
}

export function applyRange(decisions: DecisionRecord[], range: RangeSpec): DecisionRecord[] {
  if (!Array.isArray(decisions) || decisions.length === 0) return [];

  if (range.kind === "seq") {
    const start = typeof range.start === "number" ? range.start : undefined;
    const end = typeof range.end === "number" ? range.end : undefined;
    return decisions.filter((decision) => isWithinNumericRange(decision.seq, start, end));
  }

  if (range.kind === "time") {
    const start = typeof range.start === "number" ? range.start : undefined;
    const end = typeof range.end === "number" ? range.end : undefined;
    return decisions.filter((decision) => isWithinNumericRange(decision.timestampMs, start, end));
  }

  if (range.kind === "token") {
    const bounds = resolveSequenceWindowFromStringBounds(
      decisions,
      "subject",
      typeof range.start === "string" ? range.start : undefined,
      typeof range.end === "string" ? range.end : undefined,
    );
    return decisions.filter((decision) =>
      isWithinNumericRange(decision.seq, bounds.startSeq, bounds.endSeq),
    );
  }

  const bounds = resolveSequenceWindowFromStringBounds(
    decisions,
    "id",
    typeof range.start === "string" ? range.start : undefined,
    typeof range.end === "string" ? range.end : undefined,
  );
  return decisions.filter((decision) =>
    isWithinNumericRange(decision.seq, bounds.startSeq, bounds.endSeq),
  );
}
