import { describe, expect, it, vi } from "vitest";
import * as frontendRules from "../src/tts-frontend-rules.js";
import { textToKlattTrack } from "../src/tts-frontend.js";

describe("tts frontend declarative prosody migration", () => {
  it("does not invoke imperative F0 contour generator in track synthesis", () => {
    const spy = vi.spyOn(frontendRules, "rule_GenerateF0Contour");
    textToKlattTrack("hello world.");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does not invoke imperative K-context mutator in track synthesis", () => {
    const spy = vi.spyOn(frontendRules, "rule_K_Context");
    textToKlattTrack("key coo.");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
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
