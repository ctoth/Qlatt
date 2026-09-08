import { createDiagnostics, type Diagnostics } from "../diagnostics";
import { isPlainObject, loadYamlDocumentSync } from "../yaml-loader";

export interface RdPolicy {
  min: number;
  max: number;
  citations: readonly string[];
}

export function readRdPolicy(document: unknown): RdPolicy {
  const value = isPlainObject(document) ? document.effective_rd : undefined;
  if (
    !isPlainObject(value) ||
    typeof value.min !== "number" ||
    !Number.isFinite(value.min) ||
    typeof value.max !== "number" ||
    !Number.isFinite(value.max) ||
    value.min > value.max ||
    !Array.isArray(value.citations) ||
    value.citations.length === 0 ||
    !value.citations.every((citation) => typeof citation === "string" && citation.trim().length > 0)
  ) {
    throw new Error("E_RD_POLICY: effective_rd requires finite ordered bounds and citations");
  }
  return { min: value.min, max: value.max, citations: value.citations };
}

export const RD_POLICY = readRdPolicy(loadYamlDocumentSync("/rules/policy/vq-channels.yaml"));

export interface RdProjectionContext {
  speakerParams?: Readonly<Record<string, unknown>>;
  diagnostics?: Diagnostics;
  itemId?: string;
}

/** Fant 1997: constrain effective Rd, then express it as an offset from resolved Rd. */
export function projectRd(
  params: Readonly<Record<string, number>>,
  delta: number,
  { speakerParams, diagnostics = createDiagnostics(), itemId }: RdProjectionContext = {},
): { Rd: number; RdPhraseOffset: number } {
  const base = params.Rd ?? speakerParams?.Rd;
  if (typeof base !== "number" || !Number.isFinite(base)) {
    const message =
      "E_RD_MISSING: affect projection requires Rd from the inventory or speaker profile";
    diagnostics.error(message, { itemId }, "E_RD_MISSING");
    throw new Error(message);
  }
  if (params.Rd === undefined) {
    diagnostics.info(
      "Resolved Rd from the speaker profile",
      { itemId, Rd: base },
      "RD_SPEAKER_RESOLVED",
    );
  }
  const priorOffset = params.RdPhraseOffset ?? 0;
  const requested = base + priorOffset + delta;
  const effective = Math.max(RD_POLICY.min, Math.min(RD_POLICY.max, requested));
  if (effective !== requested) {
    diagnostics.warn(
      "Affect projection clamped effective Rd to the declared range",
      { itemId, key: "RdPhraseOffset", requested, clamped: effective, ...RD_POLICY },
      "HRG_LOWER_VALUE_CLAMPED",
    );
  }
  return { Rd: base, RdPhraseOffset: effective - base };
}
