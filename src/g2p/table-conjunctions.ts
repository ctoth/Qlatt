/**
 * Multi-word conjunctions, as DECtalk 4.63's text stage finds them before it
 * speaks a clause (LTS/ls_task.c ls_task_search_for_conj, :4960-5025, over
 * the sequences of LTS/proverbs.h conj_words): "as soon as", "even if", "on
 * the other hand".
 *
 * The first word of a sequence is marked as a conjunction of several words
 * and every later word as a plain conjunction, whatever class it has of its
 * own. The sentence parse sets its clause breaks from those marks
 * (ls_task.c:5170-5229).
 *
 * The routine is transcribed with what it does, not what it means to:
 *   - sequences are tried in the table's order and the first that fits wins,
 *     so "in addition" is found and "in addition to" never is;
 *   - a sequence of three words reports the same length as one of four
 *     (`found_it = 3`), so the word after it is marked too ("as soon as the"
 *     marks "the"); measured on say.exe;
 *   - the scan goes on after the last word it marked.
 */

/** A word's part in a sequence: its first word, or one the sequence covers. */
export type ConjunctionRole = "first" | "rest";

/**
 * The role of each of `words`, in order; undefined for a word in no
 * sequence. `words` are the written words of a stretch the parse sees as one
 * (compared without regard to case). A word with a punctuation mark written
 * on it is not a word of any sequence: pass `markedLast` when the last word
 * has one.
 */
export function conjunctionRoles(
  words: readonly string[],
  sequences: readonly (readonly string[])[],
  markedLast = false,
): (ConjunctionRole | undefined)[] {
  const lower = words.map((word, index) =>
    markedLast && index === words.length - 1 ? null : word.toLowerCase(),
  );
  const roles: (ConjunctionRole | undefined)[] = words.map(() => undefined);
  for (let i = 0; i < lower.length; i += 1) {
    let found = 0;
    for (const sequence of sequences) {
      if (sequence[0] !== lower[i]) continue;
      // The next word must be there and fit (:4979-4984).
      if (i + 1 >= lower.length || lower[i + 1] !== sequence[1]) continue;
      if (sequence.length === 2) {
        found = 1;
        break;
      }
      if (i + 2 >= lower.length || lower[i + 2] !== sequence[2]) continue;
      if (sequence.length === 3) {
        found = 3;
        break;
      }
      if (i + 3 < lower.length && lower[i + 3] === sequence[3]) found = 3;
      // A sequence of four words whose last does not fit ends the search
      // for this word: the loop's condition is `found_it == 0`, and nothing
      // was found, so it goes on to the next sequence.
      if (found !== 0) break;
    }
    if (found === 0) continue;
    roles[i] = "first";
    for (let k = 1; k <= found && i + k < roles.length; k += 1) roles[i + k] = "rest";
    i += found;
  }
  return roles;
}
