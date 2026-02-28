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

import type { ProvenanceCollector } from "./provenance";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PipelineToken = Record<string, any>;

export interface ProsodicAnnotatorOptions {
  provenance?: ProvenanceCollector | null;
  /** Base F0 in Hz (for provenance reporting only). */
  baseF0?: number;
}

// ---------------------------------------------------------------------------
// Function Word Set
// ---------------------------------------------------------------------------

/**
 * Function words that do not receive pitch accent in neutral (broad-focus) speech.
 *
 * Compiled from O'Shaughnessy 1976 accent priority levels 0-3 and
 * Allen, Hunnicutt & Klatt 1987 Table 10-1 levels 0-3.
 *
 * Categories:
 * - Articles (accent 0): a, an, the
 * - Conjunctions (accent 1): and, or, but, ...
 * - Relative pronouns (accent 1): who, whom, whose, which, that
 * - Prepositions (accent 2): in, on, at, to, for, from, ...
 * - Auxiliary verbs (accent 2): is, am, are, was, were, ...
 * - B-group modals (accent 2): will, would, can, could, shall, should
 * - Personal pronouns (accent 3): i, me, my, mine, you, ...
 * - Determiners (accent 0-2): this, that, these, those, some, ...
 * - Common contractions of function word bases
 *
 * Citations:
 * - O'Shaughnessy 1976, Table (accent priority levels 0-3 = function words)
 * - Allen, Hunnicutt & Klatt 1987, Table 10-1 (POS accent levels 0-3)
 */
export const FUNCTION_WORDS: ReadonlySet<string> = new Set([
  // Articles (accent 0)
  "a", "an", "the",

  // Conjunctions (accent 1)
  "and", "or", "but", "so", "yet", "nor", "for", "if", "when", "while",
  "as", "than", "that", "because", "since", "although", "though", "unless",
  "until", "whether",

  // Relative pronouns (accent 1) — "that" already included above
  "who", "whom", "whose", "which",

  // Prepositions (accent 2)
  "in", "on", "at", "to", "from", "with", "by", "of", "about", "into",
  "through", "during", "before", "after", "above", "below", "between",
  "under", "over", "up", "down", "out", "off", "near", "around", "among",
  "along", "across", "against", "toward", "towards", "upon", "within",
  "without", "beside", "besides", "beyond", "beneath", "throughout",

  // Auxiliary verbs (accent 2)
  "is", "am", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "having", "do", "does", "did",

  // B-group modals (accent 2) — O'Shaughnessy 1976
  "will", "would", "can", "could", "shall", "should",

  // Personal pronouns (accent 3)
  "i", "me", "my", "mine", "you", "your", "yours",
  "he", "him", "his", "she", "her", "hers",
  "it", "its", "we", "us", "our", "ours",
  "they", "them", "their", "theirs",

  // Determiners / other function words (accent 0-2)
  "this", "these", "those", "some", "any", "each", "every", "no",
  "all", "both", "such", "other", "another",

  // Contractions (function word base forms)
  "i'm", "i've", "i'll", "i'd",
  "you're", "you've", "you'll", "you'd",
  "he's", "he'll", "he'd",
  "she's", "she'll", "she'd",
  "it's", "it'll",
  "we're", "we've", "we'll", "we'd",
  "they're", "they've", "they'll", "they'd",
  "isn't", "aren't", "wasn't", "weren't",
  "haven't", "hasn't", "hadn't",
  "don't", "doesn't", "didn't",
  "won't", "wouldn't",
  "can't", "couldn't",
  "shan't", "shouldn't", "mustn't",
  "let's", "that's", "who's", "what's", "here's", "there's",
]);

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

// ---------------------------------------------------------------------------
// Terminal and clause punctuation sets
// ---------------------------------------------------------------------------

const TERMINAL_PUNCTUATION = new Set([".", "?", "!"]);
const CLAUSE_PUNCTUATION = new Set([",", ";", ":"]);

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
 * - isNuclearAccent (boolean)
 * - accentType (string | null) — "H*", "L*", etc.
 * - accentIndexInPhrase (number) — 0-based index of accented token within phrase; -1 for non-accented
 * - breakIndex (number 0-4)
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
export function annotateProsody(
  tokens: PipelineToken[],
  options: ProsodicAnnotatorOptions = {},
): PipelineToken[] {
  const provenance = options.provenance ?? null;

  // Work on a shallow copy of each token so we never mutate the input array
  // entries directly. The spread preserves all existing properties.
  const result = tokens.map((t) => ({ ...t }));

  // Step 1: Identify phrases by splitting at SIL tokens with punctuation.
  const phrases = identifyPhrases(result);

  // Step 2-3: Mark function/content words.
  markFunctionWords(result);

  // Step 4: Assign accent (stress==1 AND content word).
  assignAccent(result);

  // Step 5-6: Identify nuclear accent and assign accent types per phrase.
  for (let pi = 0; pi < phrases.length; pi++) {
    const phrase = phrases[pi];
    const isQuestion = phrase.punctuation === "?";

    // Step 4 (nuclear accent): find last accented token in phrase.
    identifyNuclearAccent(result, phrase);

    // Step 5: Assign accent types.
    assignAccentTypes(result, phrase, isQuestion);

    // Step 5b: Assign accentIndexInPhrase — sequential count of accented
    // stressed tokens per phrase.  Reset at each phrase boundary (breakIndex=4).
    // The counter continues across breakIndex=3 (intermediate phrases),
    // matching Pierrehumbert 1980's downstep domain = IP.
    // Citation: Pierrehumbert 1980 (downstep resets at IP boundaries)
    assignAccentIndices(result, phrase);

    // Step 7: Assign phrase accent and boundary tone on phrase boundary.
    assignPhraseEdgeTones(result, phrase);

    // Step 8: Long phrase breaking heuristic.
    applyLongPhraseBreaking(result, phrase);

    // Provenance
    if (provenance) {
      emitPhraseProvenance(provenance, result, phrase, pi);
    }
  }

  // Step 6: Assign break indices.
  assignBreakIndices(result, phrases);

  return result;
}

// ---------------------------------------------------------------------------
// Step 1: Identify phrases
// ---------------------------------------------------------------------------

function identifyPhrases(tokens: PipelineToken[]): Phrase[] {
  const phrases: Phrase[] = [];
  let currentIndices: number[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const isSilWithPunctuation =
      token.phoneme === "SIL" && token.punctuationSymbol != null;

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
    } else if (token.phoneme !== "SIL") {
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
// Step 2-3: Mark function/content words
// ---------------------------------------------------------------------------

function markFunctionWords(tokens: PipelineToken[]): void {
  for (const token of tokens) {
    // Initialize phrase-edge tone properties on ALL tokens for consistency.
    // These are only set to non-null values on SIL tokens at phrase boundaries
    // (in assignPhraseEdgeTones), but initializing to null prevents undefined
    // in CEL expressions. Citation: Silverman et al. 1992 (ToBI tone tier).
    token.phraseAccent = null;
    token.boundaryTone = null;

    if (token.phoneme === "SIL") {
      // SIL tokens are neither function nor content words.
      token.isFunctionWord = false;
      token.isContentWord = false;
      continue;
    }
    const word = typeof token.word === "string" ? token.word.toLowerCase() : "";
    const isFn = FUNCTION_WORDS.has(word);
    token.isFunctionWord = isFn;
    token.isContentWord = !isFn;
  }
}

// ---------------------------------------------------------------------------
// Step 4: Assign accent
// ---------------------------------------------------------------------------

function assignAccent(tokens: PipelineToken[]): void {
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
    token.isNuclearAccent = false;
    token.accentType = null;
  }
  if (currentGroup.length > 0) {
    wordGroups.push(currentGroup);
  }

  // For each word group, determine if accented.
  for (const group of wordGroups) {
    const hasPrimaryStress = group.some((idx) => tokens[idx].stress === 1);
    const isContent = group.some((idx) => tokens[idx].isContentWord === true);
    const accented = hasPrimaryStress && isContent;
    for (const idx of group) {
      tokens[idx].isAccented = accented;
    }
  }
}

// ---------------------------------------------------------------------------
// Step 5: Identify nuclear accent (per phrase)
// ---------------------------------------------------------------------------

function identifyNuclearAccent(tokens: PipelineToken[], phrase: Phrase): void {
  // Nuclear accent = last accented token with stress==1 in the phrase.
  // Set isNuclearAccent on the stressed vowel only (the token with stress==1).
  let lastAccentedStressIndex = -1;

  for (const idx of phrase.tokenIndices) {
    if (tokens[idx].isAccented && tokens[idx].stress === 1) {
      lastAccentedStressIndex = idx;
    }
  }

  if (lastAccentedStressIndex >= 0) {
    tokens[lastAccentedStressIndex].isNuclearAccent = true;
  }
}

// ---------------------------------------------------------------------------
// Step 5: Assign accent types
// ---------------------------------------------------------------------------

/**
 * Assign ToBI accent types within a phrase.
 *
 * - Prenuclear accents: H* (Pierrehumbert 1980 — most common default)
 * - Nuclear accent in declarative (. or no punctuation): H*
 * - Nuclear accent in question (?): L*
 *
 * Citations: Pierrehumbert 1980, Ladd 2008 Ch.3
 */
function assignAccentTypes(
  tokens: PipelineToken[],
  phrase: Phrase,
  isQuestion: boolean,
): void {
  for (const idx of phrase.tokenIndices) {
    const token = tokens[idx];
    if (!token.isAccented) continue;

    if (token.isNuclearAccent) {
      // Nuclear accent: L* for questions, H* for declaratives.
      // Citation: Pierrehumbert 1980, Ladd 2008
      token.accentType = isQuestion ? "L*" : "H*";
    } else {
      // Prenuclear accent: H* (default).
      // Citation: Pierrehumbert 1980
      token.accentType = "H*";
    }
  }
}

// ---------------------------------------------------------------------------
// Step 5b: Assign accentIndexInPhrase
// ---------------------------------------------------------------------------

/**
 * Assign a 0-based accent index to each accented stressed token within a phrase.
 * Non-accented tokens get accentIndexInPhrase = -1.
 *
 * The index is used by the ToBI downstep formula: H_n = V * k^n, where n is
 * accentIndexInPhrase.  The counter resets per phrase (naturally, since each
 * phrase iteration starts fresh).
 *
 * Citations:
 * - Pierrehumbert 1980 (downstep formula H_n = V * k^n)
 * - Ladd 2008 Ch.2 (constant-proportion downstep ratio)
 */
function assignAccentIndices(tokens: PipelineToken[], phrase: Phrase): void {
  let accentCount = 0;
  for (const idx of phrase.tokenIndices) {
    const token = tokens[idx];
    if (token.isAccented && token.stress === 1) {
      token.accentIndexInPhrase = accentCount;
      accentCount++;
    } else {
      token.accentIndexInPhrase = -1;
    }
  }
}

// ---------------------------------------------------------------------------
// Step 6: Assign break indices
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
function assignBreakIndices(tokens: PipelineToken[], phrases: Phrase[]): void {
  // Default all to 0.
  for (const token of tokens) {
    if (token.breakIndex == null) {
      token.breakIndex = 0;
    }
  }

  // Assign break indices on SIL tokens at phrase boundaries.
  for (const phrase of phrases) {
    if (phrase.trailingSilIndex >= 0) {
      const silToken = tokens[phrase.trailingSilIndex];
      const punct = phrase.punctuation;
      if (punct && TERMINAL_PUNCTUATION.has(punct)) {
        silToken.breakIndex = 4;
      } else if (punct && CLAUSE_PUNCTUATION.has(punct)) {
        silToken.breakIndex = 3;
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
// Step 7: Assign phrase accent and boundary tone
// ---------------------------------------------------------------------------

/**
 * Assign phrase accent and boundary tone at phrase edges.
 *
 * - Declarative (.): phraseAccent='L-', boundaryTone='L%'
 * - Question (?): phraseAccent='H-', boundaryTone='H%'
 * - Continuation (,, ;, :): phraseAccent='L-', boundaryTone='H%'
 *
 * Set on the SIL token at the phrase boundary.
 *
 * Citations: Pierrehumbert 1980, Silverman et al. 1992
 */
function assignPhraseEdgeTones(tokens: PipelineToken[], phrase: Phrase): void {
  if (phrase.trailingSilIndex < 0) return;

  const silToken = tokens[phrase.trailingSilIndex];
  const punct = phrase.punctuation;

  if (punct === "?") {
    silToken.phraseAccent = "H-";
    silToken.boundaryTone = "H%";
  } else if (punct === "." || punct === "!") {
    silToken.phraseAccent = "L-";
    silToken.boundaryTone = "L%";
  } else if (punct && CLAUSE_PUNCTUATION.has(punct)) {
    silToken.phraseAccent = "L-";
    silToken.boundaryTone = "H%";
  }
}

// ---------------------------------------------------------------------------
// Step 8: Long phrase breaking
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
function applyLongPhraseBreaking(tokens: PipelineToken[], phrase: Phrase): void {
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

  if (contentWordEnds.length <= 6) return;

  // Insert breakIndex=2 at the content word nearest the midpoint.
  const midpoint = Math.floor(contentWordEnds.length / 2);
  const breakTokenIdx = contentWordEnds[midpoint - 1]; // -1 because "after" the midpoint word
  if (breakTokenIdx >= 0) {
    tokens[breakTokenIdx].breakIndex = 2;
  }
}

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

function emitPhraseProvenance(
  provenance: ProvenanceCollector,
  tokens: PipelineToken[],
  phrase: Phrase,
  phraseIndex: number,
): void {
  // Count content words and find nuclear word.
  let contentWordCount = 0;
  let nuclearWord = "";
  let prevWord: string | null = null;

  for (const idx of phrase.tokenIndices) {
    const token = tokens[idx];
    const word = token.word ?? "";
    if (word !== prevWord) {
      if (token.isContentWord === true) contentWordCount++;
      prevWord = word;
    }
    if (token.isNuclearAccent === true) {
      nuclearWord = word;
    }
  }

  provenance.add({
    stage: "prosody",
    type: "prosodic_annotation",
    subject: `phrase:${phraseIndex}`,
    reason: `Identified phrase with ${contentWordCount} content words${nuclearWord ? `, nuclear accent on "${nuclearWord}"` : ", no nuclear accent"}`,
    citations: ["Silverman 1992", "O'Shaughnessy 1976", "Allen 1987"],
  });
}
