import type { ProvenanceCollector } from "./provenance";

/**
 * A single token produced by the transcription stage.
 *
 * Each token represents one phoneme (with optional stress) extracted from
 * the input text, or a punctuation-generated silence marker.
 */
export interface TranscriptionToken {
  /** ARPABET phoneme symbol (e.g. "HH", "AH", "L", "OW", "SIL") */
  phoneme: string;
  /** Lexical stress: 0 = unstressed, 1 = primary, 2 = secondary, null = N/A */
  stress: number | null;
  /** The source word this phoneme was produced from */
  word: string;
  /** True if this token was generated from a punctuation mark */
  isPunctuation?: boolean;
  /** The original punctuation symbol (e.g. ".", ",", "?") */
  symbol?: string;
  /** Duration hint in ms (only set for empty-word SIL fallback) */
  duration?: number;
  /** Provenance decision ID linking back to the pronunciation decision */
  _pronDecisionId?: string;
}

/** YAML-sourced transcription configuration. */
export type TranscriptionConfig = {
  diagnostic_symbols?: Record<string, string[]>;
  punctuation_tokens?: string[];
};

export type TranscriptionOptions = {
  provenance?: ProvenanceCollector | null;
  /** Transcription config from YAML (overrides hardcoded defaults). */
  transcriptionConfig?: TranscriptionConfig;
  /** Path to alternative LTS rules YAML. When set, applyLtsRules uses this file. */
  ltsPath?: string;
  /** Override the default CMU dictionary lookup function. */
  dictLookup?: (word: string) => string[] | null;
};

/** The segment a control window applies to.
 *  Generic timed control windows may affect the current segment or an adjacent
 *  one, enabling overlap-style behavior without forcing synthetic extra tokens.
 *  Citations: Abramson & Whalen 2017 (closure/release/aspiration subspans),
 *  Volenec 2015 (window-model framing for overlap in frame-based synthesis) */
export type ControlWindowTarget = "current" | "next" | "prev";

/** Per-field operation inside a control window.
 *  Field-wise ops generalize timed control from whole-object replacement to
 *  additive/subtractive scaling and explicit clearing.
 *  Citation: Burkhardt 2009 (additive/subtractive Klatt parameter modification) */
export type ControlFieldOp = "set" | "add" | "mul" | "max" | "min" | "unset";

/** A single field operation within a control window. */
export interface ControlFieldSpec {
  /** Operation to apply while the window is active. */
  op: ControlFieldOp;
  /** Numeric operand (not used for `unset`). */
  value?: number;
  [key: string]: unknown;
}

/**
 * A token-local timed control window.
 *
 * The track assembler resolves these into frame-local parameter operations over
 * the addressed segment. Offsets may be expressed in milliseconds or as a
 * ratio of the target segment duration, with optional prefix/suffix shorthands.
 *
 * Citations:
 * - Klatt 1980 (5 ms frame control parameters)
 * - Allen 1977 (rule-driven control parameters every 5 ms)
 * - Volenec 2015 (window-model overlap as a generic control concept)
 */
export interface ControlWindowSpec {
  /** Which segment this window applies to. Defaults to `current` if omitted. */
  target?: ControlWindowTarget;
  /** Window start offset in milliseconds from the target segment onset. */
  start_ms?: number;
  /** Window end offset in milliseconds from the target segment onset. */
  end_ms?: number;
  /** Window start offset as a ratio of target duration [0,1]. */
  start_ratio?: number;
  /** Window end offset as a ratio of target duration [0,1]. */
  end_ratio?: number;
  /** Shorthand for a window spanning [0, prefix_ms]. */
  prefix_ms?: number;
  /** Shorthand for a window spanning [duration-suffix_ms, duration]. */
  suffix_ms?: number;
  /** Field-wise control operations active within the window. */
  fields?: Record<string, ControlFieldSpec>;
  /** Optional diagnostic/provenance tag. */
  tag?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Engine token types (Phase 8)
// ---------------------------------------------------------------------------

/**
 * A phone-stream token with typed known fields.
 *
 * Produced by the TTS frontend pipeline: transcription -> inventory lookup ->
 * rule engine phases -> track assembly. The index signature allows rule-injected
 * dynamic fields (boolean phoneme flags, scalar states, etc.).
 */
export interface PhoneToken {
  /** Unique token identifier (e.g. "ph_0", "ph_1") */
  id: string;
  /** Stream discriminator — always "phone" for phone tokens */
  stream: "phone";
  /** Token status: 1 = active, 2 = deleted/suppressed */
  status: number;
  /** ARPABET phoneme symbol (e.g. "HH", "AH", "SIL") */
  phoneme: string;
  /** Klatt synthesis parameters (F0, F1, AV, etc.) */
  params: Record<string, number>;
  /** Duration in milliseconds */
  duration: number;
  /** Inherent (inventory-sourced) duration in milliseconds, if known */
  inherentDuration?: number;
  /** Phoneme class (e.g. "vowel", "fricative", "stop_release", "stop_closure") */
  type: string;
  /** Lexical stress: 0 = unstressed, 1 = primary, 2 = secondary, null = N/A */
  stress: number | null;
  /** The source word this phoneme was produced from */
  word: string;
  /** Punctuation symbol if this token originated from punctuation, else null */
  punctuationSymbol?: string | null;
  /** Inventory-sourced SW (cascade/parallel switch) value */
  inventorySW?: unknown;
  /** Token-local timed control windows. */
  control_windows?: ControlWindowSpec[];
  /** Sync axis left boundary mark */
  sync_left?: string;
  /** Sync axis right boundary mark */
  sync_right?: string;
  // Boolean phoneme classification flags (from inventory)
  voiced?: boolean;
  voiceless?: boolean;
  nasal?: boolean;
  stop?: boolean;
  fricative?: boolean;
  liquid?: boolean;
  glide?: boolean;
  affricate?: boolean;
  aspirated?: boolean;
  // Allow rule-injected dynamic fields
  [key: string]: unknown;
}

/**
 * An F0-stream (or other point-stream) token.
 *
 * Point tokens carry a single scalar value anchored to the time axis.
 * They are produced by prosody rules (insert_point actions).
 */
export interface F0PointToken {
  /** Unique token identifier (e.g. "f0_0", "f0_1") */
  id: string;
  /** Stream name — typically "f0" for pitch contour points */
  stream: string;
  /** Token status: 1 = active, 2 = deleted/suppressed */
  status: number;
  /** The scalar value (e.g. F0 in Hz) */
  value?: number;
  /** Resolved time in milliseconds (set after finalize phase) */
  time?: number;
  /** Left anchor token or mark reference */
  anchor_left?: unknown;
  /** Right anchor token or mark reference */
  anchor_right?: unknown;
  /** Position ratio between anchors (0.0 = left, 1.0 = right) */
  ratio?: number;
  /** Sync axis left boundary mark */
  sync_left?: string;
  /** Sync axis right boundary mark */
  sync_right?: string;
  // Allow dynamic fields
  [key: string]: unknown;
}

/** Union of token types the engine produces */
export type EngineToken = PhoneToken | F0PointToken;

/**
 * A Klatt frame in the output track.
 *
 * Produced by the track assembler — a time-stamped snapshot of Klatt
 * synthesis parameters ready for the interpreter to schedule.
 */
export interface KlattFrame {
  /** Time offset in seconds from utterance start */
  time: number;
  /** ARPABET phoneme label (omitted for initial silence) */
  phoneme?: string;
  /** Source word (for diagnostics) */
  word?: string;
  /** Klatt synthesis parameters (F0, F1, AV, etc.) */
  params: Record<string, number>;
  // Allow additional metadata
  [key: string]: unknown;
}

/** Type guard for phone tokens */
export function isPhoneToken(token: EngineToken): token is PhoneToken {
  return token.stream === "phone";
}

/** Type guard for F0/point tokens */
export function isF0PointToken(token: EngineToken): token is F0PointToken {
  return typeof token.stream === "string" && token.stream !== "phone";
}
