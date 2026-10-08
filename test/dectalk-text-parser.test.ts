/**
 * The command text parser port (src/text-parser: the rule interpreter, the
 * clause reader and the dictionary question) against DECtalk 4.63's own
 * parser: for every text of the recorded fixtures
 * (test/fixtures/dectalk-oracle/dectalk-us-text-parser-v1.json and
 * dectalk-us-text-parser-b-v1.json, written by
 * scripts/oracle/export-text-parser-fixture.ts from the instrumented say.exe),
 * the clauses the port hands on must be the clauses DECtalk handed to its
 * letter-to-sound stage, character for character.
 */

import { describe, expect, it } from "vitest";
import { recordedClauses, textParserPort } from "../scripts/oracle/text-parser-port";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const recorded = Object.entries(recordedClauses()).filter(
  (entry): entry is [string, string[]] => entry[1] !== null && entry[1].length > 0,
);

describe("dectalk text parser", () => {
  it("has the recorded texts to compare", () => {
    expect(recorded.length).toBe(614);
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

describe("dectalk-english runs its text parser first", () => {
  const decisionsFor = (text: string, frontendId: string) => {
    const provenance = createProvenanceCollector();
    textToKlattTrackDetailed(text, undefined, 30, { frontendId, provenance });
    return provenance.getDecisions();
  };

  it("records the input and each rewrite with its rule and line", () => {
    const decisions = decisionsFor("Dr. Smith is here.", "dectalk-english");
    const input = decisions.find((decision) => decision.type === "text_parser_input");
    expect(input?.reason).toContain('"Dr. Smith is here."');
    const rewrites = decisions.filter((decision) => decision.type === "text_parser_rewrite");
    expect(rewrites.map((decision) => decision.subject)).toEqual(["text_parser:R315"]);
    expect(rewrites[0].reason).toBe(
      'Rule R315 (CMD/par_rule2.par line 523) rewrote "Dr. Smith" as "Doctor Smith"',
    );
    expect(rewrites[0].citations).toEqual(["DECtalk 4.63 CMD/par_rule2.par:523"]);
    expect(rewrites[0].parents).toEqual([input?.id]);
  });

  it("makes the source text depend on the parser's decisions", () => {
    const decisions = decisionsFor("Dr. Smith is here.", "dectalk-english");
    const parser = decisions
      .filter((decision) => decision.type.startsWith("text_parser_"))
      .map((decision) => decision.id);
    const source = decisions.find(
      (decision) => decision.type === "item_create" && decision.subject === "item:source_text",
    );
    expect(parser.length).toBe(2);
    expect(source?.parents).toEqual(expect.arrayContaining(parser));
  });

  it("reads the parser's comma written as phonemic text as a pause", () => {
    const decisions = decisionsFor("Call 555 1234.", "dectalk-english");
    const rewrite = decisions.find((decision) => decision.type === "text_parser_rewrite");
    expect(rewrite?.reason).toBe(
      'Rule R208 (CMD/par_rule2.par line 690) rewrote "555 1234." as "5 5 5, 1 2 3 4.{phonemes ,}"',
    );
    const pauses = decisions.filter(
      (decision) =>
        decision.type === "text_recognition" &&
        decision.recognition?.ruleId === "tn_parser_pause_source" &&
        decision.recognition.outcome === "accepted",
    );
    expect(pauses.length).toBe(1);
  });

  it("takes a command out of the text and says so", () => {
    const decisions = decisionsFor("Say this [:rate 180] and then that.", "dectalk-english");
    const dropped = decisions.filter((decision) => decision.type === "text_parser_command_dropped");
    expect(dropped.map((decision) => decision.reason)).toEqual([
      'The command "[:rate 180]" was taken out of the text and not carried out: in-text commands are not ported',
    ]);
  });

  it("speaks a text with a bracket or a very long clause without an error", () => {
    const long = `${"the long road went on and on past the low hills ".repeat(8)}to the sea.`;
    expect(long.length).toBeGreaterThan(300);
    for (const text of ["The array[3] holds a value.", "A lone [ bracket is here.", long]) {
      expect(() => decisionsFor(text, "dectalk-english")).not.toThrow();
    }
  });

  it("leaves a frontend without the policy block alone", () => {
    const decisions = decisionsFor("Dr. Smith is here.", "qlatt-english");
    expect(decisions.filter((decision) => decision.type.startsWith("text_parser_"))).toEqual([]);
  });
});
