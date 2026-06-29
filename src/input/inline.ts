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
 * This is therefore deliberately tiny. Two markers only:
 *   ((preset))  or  ((preset@degree))   → sets the GLOBAL affect (first wins).
 *   *word*                               → an emphasis span on that word.
 *
 * Everything else is plain score text. The cleaned text (markers removed) is the
 * score; the lifted DirectionTrack carries the directions.
 */

import type { DirectionInput, DirectionSpan, DirectionTrack } from "./direction-track";

const GLOBAL_AFFECT = /\(\(\s*([a-zA-Z_]+)\s*(?:@\s*([0-9]*\.?[0-9]+)\s*)?\)\)/;
const EMPHASIS = /\*([^*\s]+)\*/g;

/** Lift an inline-shorthand string into a (score, directionTrack) input. */
export function parseInline(source: string): DirectionInput {
  const track: DirectionTrack = { version: "1" };

  // 1. Extract the first global affect marker, if any.
  let working = source;
  const affectMatch = GLOBAL_AFFECT.exec(working);
  if (affectMatch) {
    const preset = affectMatch[1];
    const degree = affectMatch[2] !== undefined ? Number(affectMatch[2]) : undefined;
    track.global = { affect: degree !== undefined ? { preset, degree } : { preset } };
    // Remove ALL global affect markers from the text.
    working = working.replace(new RegExp(GLOBAL_AFFECT.source, "g"), " ");
  }

  // 2. Walk tokens, stripping *emphasis* markers and recording word indices.
  const rawTokens = working.split(/\s+/).filter((t) => t.length > 0);
  const cleanTokens: string[] = [];
  const spans: DirectionSpan[] = [];
  let spanSeq = 0;

  for (const token of rawTokens) {
    EMPHASIS.lastIndex = 0;
    const emphasized = /^\*[^*\s]+\*$/.test(token);
    const clean = token.replace(/^\*/, "").replace(/\*$/, "");
    const wordIndex = cleanTokens.length;
    cleanTokens.push(clean);
    if (emphasized) {
      spans.push({
        id: `inline_emph_${spanSeq++}`,
        anchor: { unit: "word", start: wordIndex },
        emphasis: { level: "strong" },
      });
    }
  }

  if (spans.length > 0) track.spans = spans;

  return {
    score: { text: cleanTokens.join(" ") },
    directionTrack: track,
  };
}
