/**
 * Parser / lowering — (score, directionTrack) → a list of typed, anchor-resolved
 * Direction records, each emitting a provenance `DecisionRecord`.
 *
 * This is the lowering pass of the input contract: the author's clean SCORE and
 * separate DIRECTION TRACK are resolved into first-class, addressable Direction
 * objects (the (b) architecture, 12-fe-architecture-recommendation.md §1). Each
 * Direction carries citations + a tag + parents so it is provenance-traceable,
 * and is shaped to later attach to an HRG `Affect` relation (the
 * provenance-stamped HRG of design doc 12 §2) WITHOUT wiring the HRG here.
 *
 * Compatibility with the HRG (not wired now, just shape-compatible):
 *  - Each Direction.decision is a `DecisionRecord` (src/provenance.ts schema).
 *  - Direction.hrgRelation names the relation the directive belongs on
 *    ("Affect" for affect/voice-quality/gesture; "Intonation"/"Word" for
 *    emphasis; "Break" for breaks). A later HRG pass can attach the directive's
 *    feature-write to that relation and reuse decision.id as the write's parent.
 *  - Direction.tokenRange (resolved token indices) is exactly what an HRG
 *    span→Segment alignment needs.
 */

import type { ProvenanceCollector, DecisionRecord } from "../provenance";
import { createProvenanceCollector } from "../provenance";
import type {
  AffectSpec,
  AnchorRange,
  DirectionInput,
  DirectionSpan,
  GestureName,
  VoiceIdentity,
  VoiceQualityDelta,
} from "./direction-track";
import { GESTURE_LIBRARY, materializeVoiceQualityDelta, scaleVoiceQualityDelta } from "./direction-track";
import type { CompiledAffect } from "./affect";
import { compileAffect } from "./affect";

/** The kind of resolved direction (drives the tag + downstream HRG relation). */
export type DirectionKind =
  | "voice_identity"
  | "global_affect"
  | "local_affect"
  | "emphasis"
  | "break"
  | "pitch"
  | "rate"
  | "voice_quality"
  | "gesture";

/** A resolved token span (inclusive indices into the score word list). */
export interface TokenRange {
  startToken: number;
  endToken: number;
}

/** One lowered, typed, anchor-resolved direction. */
export interface Direction {
  /** Stable id (mirrors the DecisionRecord id). */
  id: string;
  kind: DirectionKind;
  /** Provenance tag describing the kind of modification (feeds diagnostics). */
  tag: "affect" | "voice_quality" | "emphasis" | "break" | "gesture" | "pitch" | "rate" | "voice";
  /** "utterance" for global state; a token range for local spans. */
  scope: "utterance" | TokenRange;
  /** The HRG relation this directive should later attach to (not wired now). */
  hrgRelation: "Affect" | "Intonation" | "Break" | "Word";
  /** Compiled affect substrate (for affect kinds). */
  affect?: CompiledAffect;
  /** The resolved voice-quality / prosody delta this direction imposes. */
  delta?: VoiceQualityDelta;
  /** The author label (preset name, gesture name, emphasis level, …). */
  label?: string;
  /** Voice identity payload (for voice_identity). */
  voice?: VoiceIdentity;
  citations: string[];
  /** The provenance decision this direction emitted. */
  decision: DecisionRecord;
}

/** The resolved score: the original text plus its tokenization. */
export interface ResolvedScore {
  text: string;
  /** Whitespace-delimited words (= tokens). */
  tokens: string[];
  /** Per-phrase inclusive token ranges (phrases split on . , ; : ! ?). */
  phrases: TokenRange[];
}

export interface ParseResult {
  score: ResolvedScore;
  directions: Direction[];
  decisions: DecisionRecord[];
  provenance: ProvenanceCollector;
}

export interface ParseOptions {
  /** Optional injected provenance collector (else one is created). */
  provenance?: ProvenanceCollector;
}

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------

const PHRASE_BOUNDARY = /[.,;:!?]/;

/** Tokenize a clean score into words + phrase token-ranges. */
export function tokenizeScore(text: string): ResolvedScore {
  const rawTokens = text.split(/\s+/).filter((t) => t.length > 0);

  const phrases: TokenRange[] = [];
  let phraseStart = 0;
  for (let i = 0; i < rawTokens.length; i++) {
    if (PHRASE_BOUNDARY.test(rawTokens[i])) {
      phrases.push({ startToken: phraseStart, endToken: i });
      phraseStart = i + 1;
    }
  }
  if (phraseStart < rawTokens.length) {
    phrases.push({ startToken: phraseStart, endToken: rawTokens.length - 1 });
  }

  return { text, tokens: rawTokens, phrases };
}

/** Resolve an anchor range into inclusive token indices against a score. */
export function resolveAnchor(anchor: AnchorRange, score: ResolvedScore): TokenRange {
  const end = anchor.end ?? anchor.start;
  if (anchor.unit === "token" || anchor.unit === "word") {
    const startToken = clampIndex(anchor.start, score.tokens.length);
    const endToken = clampIndex(end, score.tokens.length);
    return normalizeRange(startToken, endToken);
  }
  // phrase
  const startPhrase = clampIndex(anchor.start, score.phrases.length);
  const endPhrase = clampIndex(end, score.phrases.length);
  const lo = Math.min(startPhrase, endPhrase);
  const hi = Math.max(startPhrase, endPhrase);
  if (score.phrases.length === 0) return { startToken: 0, endToken: 0 };
  return {
    startToken: score.phrases[lo].startToken,
    endToken: score.phrases[hi].endToken,
  };
}

function clampIndex(index: number, length: number): number {
  const max = Math.max(0, length - 1);
  const i = Math.trunc(index);
  if (i < 0) return 0;
  if (i > max) return max;
  return i;
}

function normalizeRange(a: number, b: number): TokenRange {
  return { startToken: Math.min(a, b), endToken: Math.max(a, b) };
}

// ---------------------------------------------------------------------------
// Lowering
// ---------------------------------------------------------------------------

const EMPHASIS_CITATION = "Pierrehumbert_1980";
const BREAK_CITATION = "Crystal_House_1988";

/** Parse + lower a DirectionInput into typed directions and provenance. */
export function parseDirectionInput(input: DirectionInput, options: ParseOptions = {}): ParseResult {
  const provenance = options.provenance ?? createProvenanceCollector();
  const score = tokenizeScore(input.score.text);
  const directions: Direction[] = [];

  const global = input.directionTrack.global;
  const sex = global?.voice?.sex;

  // 1. Voice identity (if any).
  if (global?.voice) {
    const decision = provenance.add({
      stage: "frontend",
      type: "voice_identity",
      subject: "utterance",
      reason: `Voice identity${global.voice.name ? ` '${global.voice.name}'` : ""}` +
        `${global.voice.sex ? ` (${global.voice.sex})` : ""}` +
        `${global.voice.baseF0Hz ? ` baseF0=${global.voice.baseF0Hz}Hz` : ""}`,
      citations: ["Cahn_1990"],
    });
    directions.push({
      id: decision.id,
      kind: "voice_identity",
      tag: "voice",
      scope: "utterance",
      hrgRelation: "Affect",
      voice: global.voice,
      label: global.voice.name,
      citations: decision.citations,
      decision,
    });
  }

  // 2. Global affect (the (c) base case). Absent ⇒ neutral ⇒ nothing emitted.
  let globalAffectDecisionId: string | undefined;
  if (global?.affect) {
    const dir = lowerAffect(provenance, global.affect, "global_affect", "utterance", sex, undefined);
    directions.push(dir);
    globalAffectDecisionId = dir.decision.id;
  }

  // 3. Local override spans, in declaration order.
  const spans = input.directionTrack.spans ?? [];
  for (const span of spans) {
    const range = resolveAnchor(span.anchor, score);
    directions.push(...lowerSpan(provenance, span, range, sex, globalAffectDecisionId));
  }

  return { score, directions, decisions: provenance.getDecisions(), provenance };
}

function lowerAffect(
  provenance: ProvenanceCollector,
  spec: AffectSpec,
  kind: "global_affect" | "local_affect",
  scope: "utterance" | TokenRange,
  sex: VoiceIdentity["sex"],
  parentId: string | undefined,
): Direction {
  const degree = spec.degree ?? 1;
  const compiled = compileAffect(spec.preset, degree, { sex });
  const subject = scope === "utterance" ? "utterance" : tokenSubject(scope);
  const decision = provenance.add({
    stage: "frontend",
    type: kind,
    subject,
    reason:
      `Affect '${spec.preset}'@${degree} → ` +
      `V/A/D {${fmt(compiled.dimensions.valence)},${fmt(compiled.dimensions.arousal)},${fmt(compiled.dimensions.dominance)}}` +
      `, Rd${signed(compiled.vq.rdDelta)}, F0×${fmt(compiled.vq.f0Scale)}` +
      (compiled.resolvedSex ? ` (sex=${compiled.resolvedSex})` : ""),
    citations: compiled.citations,
    parents: parentId ? [parentId] : undefined,
  });
  return {
    id: decision.id,
    kind,
    tag: "affect",
    scope,
    hrgRelation: "Affect",
    affect: compiled,
    delta: compiled.vq,
    label: spec.preset,
    citations: decision.citations,
    decision,
  };
}

function lowerSpan(
  provenance: ProvenanceCollector,
  span: DirectionSpan,
  range: TokenRange,
  sex: VoiceIdentity["sex"],
  globalAffectDecisionId: string | undefined,
): Direction[] {
  const out: Direction[] = [];
  const subject = tokenSubject(range);

  if (span.affect) {
    out.push(lowerAffect(provenance, span.affect, "local_affect", range, sex, globalAffectDecisionId));
  }

  if (span.emphasis) {
    const decision = provenance.add({
      stage: "frontend",
      type: "emphasis",
      subject,
      reason: `Emphasis '${span.emphasis.level}' on ${subject}`,
      citations: [EMPHASIS_CITATION],
    });
    out.push({
      id: decision.id,
      kind: "emphasis",
      tag: "emphasis",
      scope: range,
      hrgRelation: "Intonation",
      label: span.emphasis.level,
      citations: decision.citations,
      decision,
    });
  }

  if (span.break) {
    const decision = provenance.add({
      stage: "frontend",
      type: "break",
      subject,
      reason:
        `Break strength ${span.break.strength}` +
        (span.break.timeMs !== undefined ? ` (${span.break.timeMs}ms)` : "") +
        ` at ${subject}`,
      citations: [BREAK_CITATION],
    });
    out.push({
      id: decision.id,
      kind: "break",
      tag: "break",
      scope: range,
      hrgRelation: "Break",
      label: `strength_${span.break.strength}`,
      citations: decision.citations,
      decision,
    });
  }

  if (span.pitch) {
    const delta = materializeVoiceQualityDelta({
      f0Scale: span.pitch.rangeScale ?? 1,
    });
    const decision = provenance.add({
      stage: "frontend",
      type: "pitch",
      subject,
      reason:
        `Local pitch` +
        (span.pitch.semitones !== undefined ? ` ${signed(span.pitch.semitones)} st` : "") +
        (span.pitch.rangeScale !== undefined ? ` range×${fmt(span.pitch.rangeScale)}` : "") +
        ` on ${subject}`,
      citations: ["Pierrehumbert_1980"],
    });
    out.push({
      id: decision.id,
      kind: "pitch",
      tag: "pitch",
      scope: range,
      hrgRelation: "Intonation",
      delta,
      citations: decision.citations,
      decision,
    });
  }

  if (span.rate !== undefined) {
    // rate is a speaking-rate multiplier; durationScale is its inverse.
    const durationScale = span.rate > 0 ? 1 / span.rate : 1;
    const delta = materializeVoiceQualityDelta({ durationScale });
    const decision = provenance.add({
      stage: "frontend",
      type: "rate",
      subject,
      reason: `Local rate ×${fmt(span.rate)} (durationScale ×${fmt(durationScale)}) on ${subject}`,
      citations: ["Rutledge_1995"],
    });
    out.push({
      id: decision.id,
      kind: "rate",
      tag: "rate",
      scope: range,
      hrgRelation: "Affect",
      delta,
      citations: decision.citations,
      decision,
    });
  }

  if (span.voiceQuality) {
    const delta = materializeVoiceQualityDelta(span.voiceQuality);
    const decision = provenance.add({
      stage: "frontend",
      type: "voice_quality",
      subject,
      reason: `Local voice-quality override on ${subject}`,
      citations: ["Gobl_2003"],
    });
    out.push({
      id: decision.id,
      kind: "voice_quality",
      tag: "voice_quality",
      scope: range,
      hrgRelation: "Affect",
      delta,
      citations: decision.citations,
      decision,
    });
  }

  if (span.gesture) {
    out.push(lowerGesture(provenance, span.gesture.name, span.gesture.degree ?? 1, range, subject));
  }

  return out;
}

function lowerGesture(
  provenance: ProvenanceCollector,
  name: GestureName,
  degree: number,
  range: TokenRange,
  subject: string,
): Direction {
  const def = GESTURE_LIBRARY[name];
  const full = materializeVoiceQualityDelta(def.delta);
  const delta = scaleVoiceQualityDelta(full, degree);
  const decision = provenance.add({
    stage: "frontend",
    type: "gesture",
    subject,
    reason: `Performance gesture '${name}'@${degree} — ${def.description}`,
    citations: def.citations,
  });
  return {
    id: decision.id,
    kind: "gesture",
    tag: "gesture",
    scope: range,
    hrgRelation: "Affect",
    delta,
    label: name,
    citations: decision.citations,
    decision,
  };
}

// ---------------------------------------------------------------------------
// Span precedence resolution
// ---------------------------------------------------------------------------

/**
 * The effective set of override spans covering a given token index, sorted by
 * precedence (highest first; ties broken by later declaration order). Use
 * {@link effectiveSpanFieldAt} to read a single field with precedence applied.
 */
export function spansAt(input: DirectionInput, tokenIndex: number): DirectionSpan[] {
  const score = tokenizeScore(input.score.text);
  const spans = input.directionTrack.spans ?? [];
  const covering = spans
    .map((span, declIndex) => ({ span, declIndex, range: resolveAnchor(span.anchor, score) }))
    .filter(({ range }) => tokenIndex >= range.startToken && tokenIndex <= range.endToken);

  covering.sort((a, b) => {
    const pa = a.span.precedence ?? 0;
    const pb = b.span.precedence ?? 0;
    if (pa !== pb) return pb - pa; // higher precedence first
    return b.declIndex - a.declIndex; // later declaration wins ties
  });
  return covering.map((c) => c.span);
}

/**
 * Resolve a single span field at a token index with precedence applied: the
 * highest-precedence span that *defines* `field` wins (ties → later-declared).
 * Returns undefined if no covering span defines it.
 */
export function effectiveSpanFieldAt<K extends keyof DirectionSpan>(
  input: DirectionInput,
  tokenIndex: number,
  field: K,
): { value: NonNullable<DirectionSpan[K]>; spanId: string } | undefined {
  for (const span of spansAt(input, tokenIndex)) {
    const value = span[field];
    if (value !== undefined) {
      return { value: value as NonNullable<DirectionSpan[K]>, spanId: span.id };
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function tokenSubject(range: TokenRange): string {
  return range.startToken === range.endToken
    ? `token:${range.startToken}`
    : `token:${range.startToken}-${range.endToken}`;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function signed(n: number): string {
  return n >= 0 ? `+${fmt(n)}` : fmt(n);
}
