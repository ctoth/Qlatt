/**
 * The command text parser port (src/text-parser: the rule interpreter, the
 * clause reader and the dictionary question) against DECtalk 4.63's own
 * parser: for every text of the recorded fixture
 * (test/fixtures/dectalk-oracle/dectalk-us-text-parser-v1.json, written by
 * scripts/oracle/export-text-parser-fixture.ts from the instrumented say.exe),
 * the clauses the port hands on must be the clauses DECtalk handed to its
 * letter-to-sound stage, character for character.
 */

import { describe, expect, it } from "vitest";
import { recordedClauses, textParserPort } from "../scripts/oracle/text-parser-port";

const recorded = Object.entries(recordedClauses()).filter(
  (entry): entry is [string, string[]] => entry[1] !== null && entry[1].length > 0,
);

describe("dectalk text parser", () => {
  it("has the recorded texts to compare", () => {
    expect(recorded.length).toBe(594);
  });

  it("cuts and rewrites every recorded text as DECtalk does", () => {
    const port = textParserPort();
    const different = recorded
      .map(([text, clauses]) => ({ text, dectalk: clauses, port: port(text) }))
      .filter((row) => JSON.stringify(row.port) !== JSON.stringify(row.dectalk));
    expect(different).toEqual([]);
  });

  it("needs the dictionary for the clause after an abbreviation", () => {
    // A control: without the dictionary the same text is cut at the full stop,
    // so the test above cannot pass by ignoring it.
    const text = "Dr. Smith is here.";
    expect(textParserPort()(text)).toEqual(["Doctor Smith is here. "]);
    expect(textParserPort({ dictionary: false })(text)).toEqual(["Dr. ", "Smith is here. "]);
  });
});
