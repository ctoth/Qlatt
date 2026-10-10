/**
 * Texts in DECtalk's punctuation mode pass, from text, against the stock
 * say.exe's audio sample for sample
 * (test/oracle-corpora/dectalk-us-punct-pass-v1.json, written before any
 * export), through the page's path (scripts/oracle/dectalk-voice-compare.ts).
 *
 * In the mode pass DECtalk's text stage hands each character on to
 * letter-to-sound as it comes: no clause is read and no text rule is run
 * (CMD/cm_text.c:379-399; the frontend's reader, src/text-parser/clauses.ts).
 * Letter-to-sound then meets what the text rules would have taken away or
 * rewritten, and reads it its own way:
 *
 *   - a parenthesis, angle bracket or curly brace on a word's edge is
 *     stripped and forces a comma (LTS/l_us_con.c:135-136,
 *     LTS/ls_task.c:2244-2275, 2303-2319);
 *   - marks of one kind in a row: the last one ends the clause, the others
 *     stay on the word, which is spelled with their names
 *     (LTS/ls_task.c:4118-4150);
 *   - a word with one of @ & = # $ * + % in it is spelled, the sign by its
 *     name (the same lines), but a number with a percent sign is the number
 *     and "percent" (LTS/ls_task.c:4001-4060);
 *   - two or more hyphens standing alone are nothing; digits with slashes
 *     are a part number, not a date; "Dr." is "drive", the dictionary's
 *     abbreviation, where the text rules would have written "Doctor".
 *
 * NOT_EXACT lists the texts that are not DECtalk's samples; none now. A text
 * there that becomes exact fails its test, so that it is taken off the list.
 * Measured and not ported (no text of the corpus has them): a word with a
 * period inside it ("example.com", "a.b") or one period before the clause's
 * ("What.."), which are spelled; a bracket inside a word ("tide(at"), also
 * spelled; an opening bracket on a clause's first word, which begins with a
 * comma's clause; a closing bracket before the clause's own mark.
 *
 * The fixtures are the say.exe WAVs alone. Regenerate with the instrumented
 * and stock builds (scripts/oracle/export-dectalk-vtm-fixture.ts header):
 *
 *   ... scripts/oracle/export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-punct-pass-v1.json \
 *     --out-dir test/fixtures/dectalk-punct-pass --wav-only
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
} from "../scripts/oracle/dectalk-voice-compare";
import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import { normalizeText, textToKlattTrackDetailed } from "../src/tts-frontend";

const fixtureDir = path.join("test", "fixtures", "dectalk-punct-pass");
const corpus = readVoiceCorpus(
  path.join("test", "oracle-corpora", "dectalk-us-punct-pass-v1.json"),
);

/** Not DECtalk's samples yet. */
const NOT_EXACT: Readonly<Record<string, string>> = {};

const PASS = "[:punct pass] ";

const run = (text: string) => {
  const provenance = createProvenanceCollector();
  const diagnostics = createDiagnostics();
  const result = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
    provenance,
    diagnostics,
  });
  return {
    result,
    decisions: provenance.getDecisions(),
    warnings: diagnostics.getEntries().filter((event) => event.code?.startsWith("W_TEXT_")),
  };
};

/** The phones of the text, a comma for each clause-ending silence but the last. */
const phones = (text: string): string => {
  const segments = run(text)
    .result.utterance.relation("Segment")
    .listItems()
    .filter((item) => item.get("active") !== false);
  return segments
    .map((item) =>
      item.get("phoneme") === "SIL"
        ? String(item.get("punctuationSymbol") ?? "")
        : String(item.get("phoneme")),
    )
    .filter((name) => name !== "" && !name.endsWith("_REL"))
    .join(" ");
};

describe("DECtalk's punctuation mode pass", () => {
  it("carries the command out and says so", () => {
    const { decisions, warnings } = run(`${PASS}The tide went out.`);
    const command = decisions.find((decision) => decision.type === "text_parser_command");
    expect(command?.reason).toContain("punctuation mode to pass");
    expect(command?.citations.join(" ")).toContain("CMD/cm_text.c:379-399");
    expect(warnings).toEqual([]);
  });

  it("hands the text on as written, and reads clauses again when the mode is left", () => {
    // In the mode the brackets reach letter-to-sound, which makes commas of
    // them; out of it the text rules have taken them away.
    expect(normalizeText(`${PASS}The tide (at noon) went out.`, "dectalk-english")).toBe(
      "the tide , at noon , went out .",
    );
    expect(
      normalizeText(
        `${PASS}The tide went out. [:punct some] The tide (at noon) came in.`,
        "dectalk-english",
      ),
    ).toBe("the tide went out . the tide at noon came in .");
  });

  it("puts a comma where a bracket was stripped from a word's edge", () => {
    expect(phones(`${PASS}See the (red) car.`)).toBe("S IY DH AX , R EH D , K AR .");
    expect(phones(`${PASS}The tide at noon) went out.`)).toContain("N UW N , W EH N");
  });

  it("spells a word with marks of one kind in a row, the last of them ending the clause", () => {
    // "N O exclamation point", then the exclamation's clause end.
    expect(phones(`${PASS}No!!`)).toBe("EH N OW EH K S K L AX M EY SH AX N P OY N T !");
  });

  it("spells a word with a sign in it, and reads a number with a percent sign", () => {
    // The sign's name is the word "at", reduced as that word is.
    expect(phones(`${PASS}See a@b now.`)).toBe("S IY EY EH T B IY N AW .");
    expect(phones(`${PASS}Take 12% now.`)).toBe("T EY K T W EH LX V P RR S EH N T N AW .");
  });

  it("speaks nothing for two hyphens standing alone, and a part number for a slashed date", () => {
    expect(phones(`${PASS}One -- two.`)).toBe("W AH N T UW .");
    expect(phones(`${PASS}Take 3/4/2024 now.`)).toContain("S L AE SH");
  });

  it("lists only texts of the corpus as not exact", () => {
    const ids = corpus.entries.map((entry) => entry.id);
    expect(Object.keys(NOT_EXACT).filter((id) => !ids.includes(id))).toEqual([]);
  });

  it.each(corpus.entries.map((entry) => [entry.id, entry] as const))(
    "%s against the say.exe WAV, sample for sample",
    async (id, entry) => {
      const result = await compareVoiceEntry(entry, corpus.defaults, fixtureDir);
      expect(result.error).toBeUndefined();
      expect(result.problems).toEqual([]);
      expect(result.samplesOracle).toBeGreaterThan(0);
      if (id in NOT_EXACT) {
        expect(isExact(result), `${id} is exact now: take it off NOT_EXACT`).toBe(false);
        return;
      }
      expect(result.packetsRender).toBe(result.packetsOracle);
      expect(result.firstMismatch).toBe(-1);
      expect(isExact(result)).toBe(true);
    },
    120000,
  );
});
