/**
 * Optional inline shorthand serializer — DEMOTED, per design.
 *
 * 10-sota-control-surface.md §5 and 12-fe-architecture-recommendation.md §1 are
 * explicit: inline markup is REJECTED as the source of truth (it conflates
 * content with performance, doesn't compose, fights provenance, and is hostile
 * to a blind author). It survives ONLY as an optional convenience input whose
 * FIRST act is to lift itself into the Direction Track. The Direction Track —
 * never the annotated string — is the source of truth.
 *
 * The selected frontend declares two marker kinds (bundled defaults below):
 *   ((preset))  or  ((preset@degree))   → sets the GLOBAL affect (first wins).
 *   *word*                               → an emphasis span on that word.
 *
 * Everything else is plain score text. The cleaned text (markers removed) is the
 * score; the lifted DirectionTrack carries the directions.
 */

import { isPlainObject } from "../yaml-loader";
import type {
  DirectionInput,
  DirectionSpan,
  DirectionTrack,
  EmphasisDirective,
} from "./direction-track";

export interface InlineMarkers {
  global_affect: {
    open: string;
    close: string;
    degree_separator: string;
    selection: "first" | "last";
  };
  emphasis: { open: string; close: string; level: EmphasisDirective["level"] };
  citations: string[];
}

/** Validate the optional frontend-owned convenience syntax at resource acquisition. */
export function parseInlineMarkers(value: unknown): InlineMarkers {
  const fail = (message: string): never => {
    throw new Error(`E_INLINE_MARKERS: ${message}`);
  };
  if (!isPlainObject(value)) return fail("table must be an object");
  const affect = value.global_affect;
  const emphasis = value.emphasis;
  if (!isPlainObject(affect) || !isPlainObject(emphasis))
    return fail("global_affect and emphasis must be objects");
  const delimiter = (entry: unknown, label: string): string => {
    if (typeof entry !== "string" || !entry.length || /\s/.test(entry))
      return fail(`${label} must be a nonempty delimiter without whitespace`);
    return entry;
  };
  const open = delimiter(affect.open, "global_affect.open");
  const close = delimiter(affect.close, "global_affect.close");
  const separator = delimiter(affect.degree_separator, "global_affect.degree_separator");
  const emphasisOpen = delimiter(emphasis.open, "emphasis.open");
  const emphasisClose = delimiter(emphasis.close, "emphasis.close");
  if (
    open === emphasisOpen ||
    close === emphasisClose ||
    open.includes(separator) ||
    close.includes(separator)
  )
    return fail("affect and emphasis delimiters or degree separator are ambiguous");
  const selection = affect.selection;
  if (selection !== "first" && selection !== "last")
    return fail("global_affect.selection must be first or last");
  const level = emphasis.level;
  if (level !== "reduced" && level !== "none" && level !== "moderate" && level !== "strong")
    return fail("emphasis.level must be reduced, none, moderate or strong");
  if (
    !Array.isArray(value.citations) ||
    !value.citations.length ||
    !value.citations.every((citation) => typeof citation === "string" && citation.trim().length > 0)
  )
    return fail("citations must contain nonempty strings");
  return {
    global_affect: { open, close, degree_separator: separator, selection },
    emphasis: { open: emphasisOpen, close: emphasisClose, level },
    citations: [...value.citations],
  };
}

function literalPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Lift an inline-shorthand string into a (score, directionTrack) input. */
export function parseInline(source: string, policy: InlineMarkers): DirectionInput {
  const track: DirectionTrack = { version: "1" };

  const affect = policy.global_affect;
  const globalPattern = new RegExp(
    `${literalPattern(affect.open)}([\\s\\S]*?)${literalPattern(affect.close)}`,
    "g",
  );
  const working = source.replace(globalPattern, (marker: string, body: string) => {
    const parts = body.split(affect.degree_separator);
    const preset = parts[0].trim();
    const degreeText = parts[1]?.trim();
    if (
      !preset ||
      preset.includes(affect.open) ||
      parts.length > 2 ||
      (degreeText !== undefined && !/^[0-9]*\.?[0-9]+$/.test(degreeText))
    )
      return marker;
    const degree = degreeText === undefined ? undefined : Number(degreeText);
    if (degree !== undefined && !Number.isFinite(degree)) return marker;
    if (!track.global || affect.selection === "last")
      track.global = { affect: degree === undefined ? { preset } : { preset, degree } };
    return " ";
  });

  // Only complete single-word wrappers are removed; unmatched text stays intact.
  const rawTokens = working.split(/\s+/).filter((t) => t.length > 0);
  const cleanTokens: string[] = [];
  const spans: DirectionSpan[] = [];
  let spanSeq = 0;

  for (const token of rawTokens) {
    const { open, close, level } = policy.emphasis;
    const inner = token.slice(open.length, -close.length);
    const emphasized =
      token.startsWith(open) &&
      token.endsWith(close) &&
      inner.length > 0 &&
      !inner.includes(open) &&
      !inner.includes(close);
    const clean = emphasized ? inner : token;
    const wordIndex = cleanTokens.length;
    cleanTokens.push(clean);
    if (emphasized) {
      spans.push({
        id: `inline_emph_${spanSeq++}`,
        anchor: { unit: "word", start: wordIndex },
        emphasis: { level },
      });
    }
  }

  if (spans.length > 0) track.spans = spans;

  return {
    score: { text: cleanTokens.join(" ") },
    directionTrack: track,
  };
}
