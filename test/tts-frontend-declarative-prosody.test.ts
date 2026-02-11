import { describe, expect, it } from "vitest";
import * as frontendRules from "../src/tts-frontend-rules.js";
import { textToKlattTrack } from "../src/tts-frontend.js";

describe("tts frontend declarative prosody migration", () => {
  it("removes imperative contour/context mutators from frontend rule exports", () => {
    expect("rule_GenerateF0Contour" in frontendRules).toBe(false);
    expect("rule_K_Context" in frontendRules).toBe(false);
  });

  it("retains question-rise behavior through declarative prosody", () => {
    const statement = textToKlattTrack("hello world.");
    const question = textToKlattTrack("hello world?");

    const statementVoiced = statement.filter((frame) => Number(frame.params?.F0) > 0);
    const questionVoiced = question.filter((frame) => Number(frame.params?.F0) > 0);

    expect(statementVoiced.length).toBeGreaterThan(0);
    expect(questionVoiced.length).toBeGreaterThan(0);

    const statementTail = statementVoiced[statementVoiced.length - 1].params.F0;
    const questionTail = questionVoiced[questionVoiced.length - 1].params.F0;
    expect(questionTail).toBeGreaterThan(statementTail);
  });
});
