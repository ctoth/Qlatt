/**
 * Prosodic Structure Annotator
 *
 * Annotates pipeline tokens with prosodic structure information:
 * break indices, pitch accent types, function/content word classification,
 * and nuclear accent identification.
 *
 * This module is an annotation pass — it ONLY adds new properties to tokens
 * and never modifies existing properties (params, duration, F0, etc.).
 *
 * Citations:
 * - Silverman et al. 1992 (ToBI break index tier)
 * - Pierrehumbert 1980 (pitch accent inventory, phrase accent, boundary tone)
 * - O'Shaughnessy 1976 (accent priority by word class)
 * - Allen, Hunnicutt & Klatt 1987 (MITalk POS-to-accent mapping, Table 10-1)
 * - Ladd 2008 (prosodic phonology overview, nuclear accent = last accent in phrase)
 */

import type { Item, Utterance } from "./declarative-frontend/hrg";
import {
  loadAccentPolicySync,
  resolveAccentAssignment,
  type AccentPolicy,
} from "./accent-policy";
import {
  loadBreakPolicySync,
  resolveLongPhraseBreak,
  resolvePunctuationBreakIndex,
  type BreakPolicy,
  type LongPhraseBreakDecision,
} from "./break-policy";
import { loadTuneGrammarSync, selectTuneForPhrase, type TuneSelection } from "./tune-grammar";

interface ProsodyToken {
  item: Item;
  active: boolean;
  phoneme: string;
  stress: number | null;
  word: string;
  punctuationSymbol: string | null;
  phraseAccent: string | null;
  boundaryTone: string | null;
  initialBoundaryTone: string | null;
  isFunctionWord: boolean;
  isContentWord: boolean;
  isAccented: boolean;
  isAccentCarrier: boolean;
  isNuclearAccent: boolean;
  accentType: string | null;
  breakIndex: number;
}

// ---------------------------------------------------------------------------
// Types for internal phrase representation
// ---------------------------------------------------------------------------

interface Phrase {
  /** Indices into the token array for non-SIL tokens in this phrase. */
  tokenIndices: number[];
  /** Index of the trailing SIL token (phrase boundary), or -1 if none. */
  trailingSilIndex: number;
  /** The punctuation symbol at the phrase boundary, or null. */
  punctuation: string | null;
}

function isSuppressedToken(token: ProsodyToken | null | undefined): boolean {
  return token?.active === false;
}

// ---------------------------------------------------------------------------
// Main annotator
// ---------------------------------------------------------------------------

/**
 * Annotate pipeline tokens with prosodic structure.
 *
 * Adds the following properties to tokens (never modifies existing ones):
 * - isFunctionWord (boolean)
 * - isContentWord (boolean)
 * - isAccented (boolean)
 * - isAccentCarrier (boolean)
 * - isNuclearAccent (boolean)
 * - accentType (string | null) — "H*", "L*", "L+H*", etc.
 * - breakIndex (number 0-4)
 * - initialBoundaryTone (string | null) — "%H" when phrase-initial high edge is marked
 * - phraseAccent (string | null) — "H-" or "L-"
 * - boundaryTone (string | null) — "H%" or "L%"
 *
 * Citations:
 * - Silverman et al. 1992 (ToBI break indices)
 * - Pierrehumbert 1980 (pitch accent types, phrase accent, boundary tone)
 * - O'Shaughnessy 1976 (accent priority, function word identification)
 * - Allen, Hunnicutt & Klatt 1987 (MITalk accent levels)
 * - Ladd 2008 (nuclear accent = last accent in phrase, DTE)
 */
export function annotateProsody(utterance: Utterance): void {
  const accentPolicy = loadAccentPolicySync();
  const breakPolicy = loadBreakPolicySync();
  const tuneGrammar = loadTuneGrammarSync();
  const transaction = utterance.beginTransaction({
    ruleId: "prosodic_structure_annotation",
    phase: "annotation",
    tag: "prosody",
    reason: "Derive word class, accent, break, and ToBI phrase annotations",
    citations: [
      "Silverman et al. 1992",
      "Pierrehumbert 1980",
      "O'Shaughnessy 1976",
      "Allen, Hunnicutt & Klatt 1987",
      "Ladd 2008",
    ],
    stage: "prosody",
  });
  const result: ProsodyToken[] = utterance.relation("Segment").listItems().map((item) => {
    const view = transaction.view(item);
    return {
      item,
      active: view.active !== false,
      phoneme: typeof view.phoneme === "string" ? view.phoneme : "",
      stress: typeof view.stress === "number" ? view.stress : null,
      word: typeof view.word === "string" ? view.word : "",
      punctuationSymbol: typeof view.punctuationSymbol === "string" ? view.punctuationSymbol : null,
      phraseAccent: null,
      boundaryTone: null,
      initialBoundaryTone: null,
      // Word-class flags are now assigned by the declarative `mark_function_words`
      // rule in the annotation phase (runs before this pass); read the committed
      // value so the remaining accent passes see identical classification.
      isFunctionWord: view.isFunctionWord === true,
      isContentWord: view.isContentWord === true,
      isAccented: false,
      isAccentCarrier: false,
      isNuclearAccent: false,
      accentType: null,
      breakIndex: 0,
    };
  });

  // Step 1: Identify phrases by splitting at SIL tokens with punctuation.
  const phrases = identifyPhrases(result);

  // Step 2: Mark function/content words — now the declarative `mark_function_words`
  // rule (phases/annotation.yaml), read into result above via the item view.

  // Step 3: Assign accent (stress==1 AND content word).
  assignAccent(result, accentPolicy);

  // Steps 4-7: Per-phrase passes (nuclear accent, accent types, edge tones, long-phrase breaking).
  for (let pi = 0; pi < phrases.length; pi++) {
    const phrase = phrases[pi];

    // Step 4: find last accented token in phrase (nuclear accent).
    identifyNuclearAccent(result, phrase);

    const hasPrenuclearAccent = phraseHasPrenuclearAccent(result, phrase);
    const tuneSelection = selectTuneForPhrase(tuneGrammar, {
      punctuation: phrase.punctuation,
      hasPrenuclearAccent,
    });

    // Step 5: Assign accent types.
    assignAccentTypes(result, phrase, tuneSelection);

    // Step 6: Assign phrase accent and boundary tone on phrase boundary.
    assignPhraseEdgeTones(result, phrase, tuneSelection);

    // Step 7: Long phrase breaking heuristic.
    const breakDecision = applyLongPhraseBreaking(result, phrase, breakPolicy);

    void pi;
    void breakDecision;
  }

  // Step 8: Assign break indices.
  assignBreakIndices(result, phrases, breakPolicy);

  // Step 9: Assign accentIndexInPhrase — now the declarative
  // `accent_index_in_phrase` scan rule (phases/prosody.yaml), which runs after
  // this annotator and reads the committed isAccentCarrier / breakIndex.

  for (const token of result) {
    // isFunctionWord / isContentWord are written by the declarative
    // mark_function_words rule (annotation phase); not re-committed here.
    transaction.set(token.item, "isAccented", token.isAccented);
    transaction.set(token.item, "isAccentCarrier", token.isAccentCarrier);
    transaction.set(token.item, "isNuclearAccent", token.isNuclearAccent);
    transaction.set(token.item, "accentType", token.accentType);
    // accentIndexInPhrase is now written by the declarative
    // accent_index_in_phrase scan rule (prosody phase); not committed here.
    transaction.set(token.item, "breakIndex", token.breakIndex);
    transaction.set(token.item, "initialBoundaryTone", token.initialBoundaryTone);
    transaction.set(token.item, "phraseAccent", token.phraseAccent);
    transaction.set(token.item, "boundaryTone", token.boundaryTone);
  }
  transaction.commit();
}

// ---------------------------------------------------------------------------
// Step 1: Identify phrases
// ---------------------------------------------------------------------------

function identifyPhrases(tokens: ProsodyToken[]): Phrase[] {
  const phrases: Phrase[] = [];
  let currentIndices: number[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const isSilWithPunctuation =
      token.phoneme === "SIL" && token.punctuationSymbol != null && !isSuppressedToken(token);

    if (isSilWithPunctuation) {
      // End of a phrase — record it if we have any phone tokens.
      if (currentIndices.length > 0) {
        phrases.push({
          tokenIndices: currentIndices,
          trailingSilIndex: i,
          punctuation: token.punctuationSymbol ?? null,
        });
      }
      currentIndices = [];
    } else if (token.phoneme !== "SIL" && !isSuppressedToken(token)) {
      // Non-SIL phone token — belongs to current phrase.
      currentIndices.push(i);
    }
    // Leading SIL (no punctuation) is ignored — it's utterance-initial silence.
  }

  // Handle trailing tokens with no punctuation boundary (rare but possible).
  if (currentIndices.length > 0) {
    phrases.push({
      tokenIndices: currentIndices,
      trailingSilIndex: -1,
      punctuation: null,
    });
  }

  return phrases;
}

// ---------------------------------------------------------------------------
// Step 3: Assign accent
// ---------------------------------------------------------------------------

function assignAccent(tokens: ProsodyToken[], accentPolicy: AccentPolicy): void {
  // First pass: determine which words are accented (content word + primary stress).
  // We need to propagate accent to ALL phones of the same word within a phrase.
  // A word is accented if ANY of its phones has stress==1 and the word is a content word.

  // Build word groups: map from (word, contiguous group index) to token indices.
  const wordGroups: number[][] = [];
  let currentGroup: number[] = [];
  let currentWord: string | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.phoneme === "SIL") {
      if (currentGroup.length > 0) {
        wordGroups.push(currentGroup);
        currentGroup = [];
        currentWord = null;
      }
      token.isAccented = false;
      token.isAccentCarrier = false;
      token.isNuclearAccent = false;
      token.accentType = null;
      continue;
    }
    if (isSuppressedToken(token)) {
      token.isAccented = false;
      token.isAccentCarrier = false;
      token.isNuclearAccent = false;
      token.accentType = null;
      continue;
    }

    const word = token.word ?? "";
    if (word !== currentWord) {
      if (currentGroup.length > 0) {
        wordGroups.push(currentGroup);
      }
      currentGroup = [i];
      currentWord = word;
    } else {
      currentGroup.push(i);
    }

    // Initialize defaults — will be overwritten below.
    token.isAccented = false;
    token.isAccentCarrier = false;
    token.isNuclearAccent = false;
    token.accentType = null;
  }
  if (currentGroup.length > 0) {
    wordGroups.push(currentGroup);
  }

  // For each word group, determine if accented.
  for (const group of wordGroups) {
    const isContent = group.some((idx) => tokens[idx].isContentWord === true);
    const accentDecision = resolveAccentAssignment(accentPolicy, {
      isContentWord: isContent,
      stresses: group.map((idx) => tokens[idx].stress),
    });
    let primaryStressOrdinal = 0;
    for (const idx of group) {
      tokens[idx].isAccented = accentDecision.accented;
      tokens[idx].isAccentCarrier = false;
      if (tokens[idx].stress === accentDecision.carrierStress) {
        const isSelectedCarrier =
          accentDecision.accented &&
          accentDecision.carrierOrdinal != null &&
          primaryStressOrdinal === accentDecision.carrierOrdinal;
        if (isSelectedCarrier && !isSuppressedToken(tokens[idx])) {
          tokens[idx].isAccentCarrier = true;
        }
        primaryStressOrdinal += 1;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Step 4: Identify nuclear accent (per phrase)
// ---------------------------------------------------------------------------

function identifyNuclearAccent(tokens: ProsodyToken[], phrase: Phrase): void {
  // Nuclear accent = last accent carrier in the phrase.
  // This is the first active stressed segment of the accented word, which keeps
  // diphthong offglides from receiving separate pitch accents.
  let lastAccentedStressIndex = -1;

  for (const idx of phrase.tokenIndices) {
    if (!isSuppressedToken(tokens[idx]) && tokens[idx].isAccentCarrier === true) {
      lastAccentedStressIndex = idx;
    }
  }

  if (lastAccentedStressIndex >= 0) {
    tokens[lastAccentedStressIndex].isNuclearAccent = true;
  }
}

// ---------------------------------------------------------------------------
// Step 5: Assign accent types (per phrase)
// ---------------------------------------------------------------------------

/**
 * Assign accent types within the frontend's Pierrehumbert-style inventory.
 *
 * - Initial prenuclear accent: L+H* (common rising prenuclear default)
 * - Later prenuclear accents: H+!H*
 * - Nuclear accent in declarative (. or no punctuation): H* or H*+L
 * - Nuclear accent in continuation (, ; :): H+L*
 * - Nuclear accent in exclamation (!): H*+L
 * - Nuclear accent in question (?): L* if lone accent, L*+H if postnuclear rise is available
 *
 * Accent labels intentionally follow the original Pierrehumbert/Ladd symbols
 * used by the rulepack, while break indices remain ToBI-compatible.
 *
 * Citations: Pierrehumbert 1980, Ladd 2008 Ch.3
 */
function assignAccentTypes(
  tokens: ProsodyToken[],
  phrase: Phrase,
  tuneSelection: TuneSelection,
): void {
  let prenuclearAccentCount = 0;
  for (const idx of phrase.tokenIndices) {
    const token = tokens[idx];
    if (isSuppressedToken(token) || token.isAccentCarrier !== true) continue;

    if (token.isNuclearAccent) {
      token.accentType = tuneSelection.nuclearAccent;
    } else if (prenuclearAccentCount === 0) {
      token.accentType = tuneSelection.prenuclearFirstAccent;
    } else {
      token.accentType = tuneSelection.prenuclearLaterAccent;
    }
    prenuclearAccentCount += token.isNuclearAccent ? 0 : 1;
  }
}

// ---------------------------------------------------------------------------
// Step 9: Assign accentIndexInPhrase
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Step 8: Assign break indices
// ---------------------------------------------------------------------------

/**
 * Assign break indices to tokens.
 *
 * - breakIndex=4: After terminal punctuation (., ?, !) — intonation phrase boundary
 * - breakIndex=3: After clause punctuation (,, ;, :) — intermediate phrase boundary
 * - breakIndex=1: Normal word boundary (last phone of each word)
 * - breakIndex=0: Default (within-word)
 *
 * Break index is placed on the SIL token for punctuation boundaries, and on the
 * last phone of each word for word boundaries.
 *
 * Citation: Silverman et al. 1992 (ToBI break index tier)
 */
function assignBreakIndices(tokens: ProsodyToken[], phrases: Phrase[], breakPolicy: BreakPolicy): void {
  // Default all to 0.
  for (const token of tokens) {
    if (token.breakIndex == null) {
      token.breakIndex = 0;
    }
    if (isSuppressedToken(token)) {
      token.breakIndex = 0;
    }
  }

  // Assign break indices on SIL tokens at phrase boundaries.
  // Resolved from punctuation_break_indices in break-policy.yaml.
  // Citation: Silverman et al. 1992 (ToBI break index tier)
  for (const phrase of phrases) {
    if (phrase.trailingSilIndex >= 0) {
      const silToken = tokens[phrase.trailingSilIndex];
      const resolvedIndex = resolvePunctuationBreakIndex(breakPolicy, phrase.punctuation);
      if (resolvedIndex > 0) {
        silToken.breakIndex = resolvedIndex;
      }
    }
  }

  // Assign breakIndex=1 on the last phone of each word (normal word boundary).
  // Walk tokens, track current word, and mark the last phone per word.
  let prevWord: string | null = null;
  let lastPhoneOfWord = -1;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.phoneme === "SIL") {
      // Flush the previous word's last phone.
      if (lastPhoneOfWord >= 0 && tokens[lastPhoneOfWord].breakIndex === 0) {
        tokens[lastPhoneOfWord].breakIndex = 1;
      }
      prevWord = null;
      lastPhoneOfWord = -1;
      continue;
    }
    if (isSuppressedToken(token)) {
      continue;
    }

    const word = token.word ?? "";
    if (word !== prevWord) {
      // New word started — mark previous word's last phone.
      if (lastPhoneOfWord >= 0 && tokens[lastPhoneOfWord].breakIndex === 0) {
        tokens[lastPhoneOfWord].breakIndex = 1;
      }
      prevWord = word;
    }
    lastPhoneOfWord = i;
  }

  // Don't forget the very last token.
  if (lastPhoneOfWord >= 0 && tokens[lastPhoneOfWord].breakIndex === 0) {
    tokens[lastPhoneOfWord].breakIndex = 1;
  }
}

// ---------------------------------------------------------------------------
// Step 6: Assign phrase accent and boundary tone
// ---------------------------------------------------------------------------

/**
 * Assign phrase accent and boundary tone at phrase edges.
 *
 * - Declarative (.): phraseAccent='L-', boundaryTone='L%'
 * - Question (?): phraseAccent='H-', boundaryTone='H%'
 * - Continuation (,, ;, :): phraseAccent='L-', boundaryTone='H%'
 * - Question onset: initialBoundaryTone='%H'
 *
 * Set on the SIL token at the phrase boundary.
 *
 * Citations: Pierrehumbert 1980, Silverman et al. 1992
 */
function assignPhraseEdgeTones(
  tokens: ProsodyToken[],
  phrase: Phrase,
  tuneSelection: TuneSelection,
): void {
  if (phrase.trailingSilIndex < 0) return;

  const silToken = tokens[phrase.trailingSilIndex];
  const firstTokenIndex = phrase.tokenIndices.find(
    (idx) => !isSuppressedToken(tokens[idx]) && tokens[idx].phoneme !== "SIL",
  );

  if (firstTokenIndex != null && firstTokenIndex >= 0) {
    tokens[firstTokenIndex].initialBoundaryTone = tuneSelection.initialBoundaryTone;
  }

  silToken.phraseAccent = tuneSelection.phraseAccent;
  silToken.boundaryTone = tuneSelection.boundaryTone;
}

// ---------------------------------------------------------------------------
// Step 7: Long phrase breaking
// ---------------------------------------------------------------------------

/**
 * For phrases with >6 content words and no internal punctuation, insert a
 * synthetic break (breakIndex=2) at the content word nearest the midpoint.
 *
 * Heuristic from O'Shaughnessy 1976: allocate ~1 break per 4 content words.
 * We use the simpler threshold of >6 with one midpoint break.
 *
 * Citation: O'Shaughnessy 1976
 */
function applyLongPhraseBreaking(
  tokens: ProsodyToken[],
  phrase: Phrase,
  breakPolicy: BreakPolicy,
): LongPhraseBreakDecision {
  // Collect the last phone index of each content word.
  const contentWordEnds: number[] = [];
  let currentWord: string | null = null;
  let currentIsContent = false;
  let lastIdx = -1;

  for (const idx of phrase.tokenIndices) {
    const token = tokens[idx];
    const word = token.word ?? "";

    if (word !== currentWord) {
      // Flush previous word.
      if (currentWord !== null && currentIsContent && lastIdx >= 0) {
        contentWordEnds.push(lastIdx);
      }
      currentWord = word;
      currentIsContent = token.isContentWord === true;
      lastIdx = idx;
    } else {
      if (token.isContentWord === true) currentIsContent = true;
      lastIdx = idx;
    }
  }
  // Flush last word.
  if (currentWord !== null && currentIsContent && lastIdx >= 0) {
    contentWordEnds.push(lastIdx);
  }

  const breakDecision = resolveLongPhraseBreak(breakPolicy, contentWordEnds);
  if (breakDecision.breakTokenIndex != null && breakDecision.breakTokenIndex >= 0) {
    tokens[breakDecision.breakTokenIndex].breakIndex = breakDecision.breakIndex;
  }
  return breakDecision;
}

function phraseHasPrenuclearAccent(tokens: ProsodyToken[], phrase: Phrase): boolean {
  return phrase.tokenIndices.some(
    (idx) =>
      !isSuppressedToken(tokens[idx]) &&
      tokens[idx].isAccentCarrier === true &&
      tokens[idx].isNuclearAccent !== true,
  );
}
