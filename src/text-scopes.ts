/**
 * Text scopes: the places inside a text from which it is spoken differently.
 *
 * A frontend's text stage may find, inside a text, something that changes
 * how the rest is spoken: another voice, another rate, another pause. The
 * shared frontend (tts-frontend.ts) knows nothing of what that something is.
 * It gives the text stage the state the text starts in and a few tools, and
 * takes back a list of scopes, each the whole state from one place on. It
 * then makes a parameter scope of each
 * (declarative-frontend/hrg/parameter-scope.ts), binds the Items written
 * from that place on to it, and hands lowering the scope's voice.
 *
 * What a command is, which of them reset what, and what one voice keeps of
 * the voice before it are the text stage's own matters
 * (src/text-parser/command-scopes.ts for the DECtalk text parser).
 */

import type { DefinitionChange } from "./dectalk-speaker-definition";
import type { ResolvedVoice } from "./dectalk-voice";

/** The state a text is spoken in, from one place on. */
export interface TextScopeState {
  /** The voice, its rule fields as the rules are to read them. */
  voice: ResolvedVoice;
  /** Words per minute; undefined when the frontend's rate is not in them. */
  wordsPerMinute: number | undefined;
  /** What is added to the pause at a comma and at a sentence end, in ms. */
  pauses: { comma: number; period: number } | undefined;
}

/** One place inside a text and the state from there on. */
export interface TextScope extends TextScopeState {
  /** The parameter scope's name. */
  name: string;
  /** Where in the text stage's text the scope begins (UTF-16 offset). */
  offset: number;
  /** The text stage's decisions for what is in force in the scope. */
  decisionIds: string[];
  /** Speaker definitions sent since the text began, this scope's included. */
  definitionsSent: number;
  /** What has left this state, for the decision that binds Items to the scope. */
  summary: string;
  /** Citations for that decision. */
  citations: string[];
}

/** The state the text starts in, and the changes of the voice's definition already made. */
export interface TextScopeStart extends TextScopeState {
  definition: readonly DefinitionChange[];
}

/** What the shared frontend lends the text stage to work the scopes out. */
export interface TextScopeTools {
  /** The voices the frontend has; empty when it does not list them. */
  voices: readonly string[];
  /** A voice by name, with changes to its speaker definition. */
  resolveVoice(name: string, definition: readonly DefinitionChange[]): ResolvedVoice;
  /**
   * The rate the frontend speaks at for a rate asked in words per minute;
   * absent when the frontend's rate is not in words per minute.
   */
  wordsPerMinute?: (asked: number) => number | undefined;
  /** Tell the user of something asked for that cannot be given. */
  warn(message: string, data: Record<string, unknown>, code: string): void;
}

/** The hook: a text stage's scopes for a text, given where the text starts. */
export type TextScopeSource = (start: TextScopeStart, tools: TextScopeTools) => TextScope[];
