/**
 * The two tables of DECtalk 4.63 LTS/proverbs.h that the text stage's
 * sentence parse reads (LTS/ls_task.c ls_task_find_verb_particles and
 * ls_task_search_for_conj): a word list, and the sequences of its words that
 * are taken as one conjunction ("as soon as", "even if").
 *
 * `verb_pairs_index[i]` is where word i starts in `verb_pairs_words`, each
 * word ended by a 0; word 0 is empty. A row of `conj_words` holds two to four
 * word indices, 0 after the last.
 */

/** The numbers of `name[...] = { ... };`, nested braces flattened. */
function numbersOf(text: string, name: string): number[] {
  const start = text.indexOf(`${name}[`);
  if (start < 0) throw new Error(`E_PROVERBS: no array '${name}'`);
  const open = text.indexOf("{", start);
  const close = text.indexOf("};", open);
  if (open < 0 || close < 0) throw new Error(`E_PROVERBS: array '${name}' has no body`);
  return text
    .slice(open, close)
    .replace(/[{}]/g, " ")
    .split(",")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
    .map((cell) => {
      const value = Number(cell);
      if (!Number.isInteger(value)) throw new Error(`E_PROVERBS: '${cell}' in '${name}'`);
      return value;
    });
}

/** The word list, by index. */
export function proverbWords(text: string): string[] {
  const index = numbersOf(text, "verb_pairs_index");
  const bytes = numbersOf(text, "verb_pairs_words");
  return index.map((at) => {
    let word = "";
    for (let k = at; k < bytes.length && bytes[k] !== 0; k += 1) {
      word += String.fromCharCode(bytes[k] as number);
    }
    return word;
  });
}

/** The conjunction sequences in the table's order, each as word indices. */
export function conjunctionIndexRows(text: string): number[][] {
  const cells = numbersOf(text, "conj_words");
  if (cells.length % 4 !== 0) throw new Error("E_PROVERBS: conj_words is not rows of four");
  const rows: number[][] = [];
  for (let at = 0; at < cells.length; at += 4) {
    rows.push(cells.slice(at, at + 4).filter((cell) => cell !== 0));
  }
  return rows;
}

/** The conjunction sequences in the table's order, each as its words. */
export function conjunctionSequences(text: string): string[][] {
  const words = proverbWords(text);
  return conjunctionIndexRows(text).map((row) =>
    row.map((index) => {
      const word = words[index];
      if (!word) throw new Error(`E_PROVERBS: conj_words names word ${index.toString()}`);
      return word;
    }),
  );
}
