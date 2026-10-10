/**
 * What a Speak click on the page asks the frontend for
 * (test/harness/speak-request.js, read by test/harness/runtime.js speak()).
 *
 * A base F0 passed to textToKlattTrack() replaces the selected voice's own
 * (src/speaker-profile.ts). So the page passes one only when the "Base F0" box
 * holds a number, and the box starts empty.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { readBaseF0, readSpeakRequest } from "./harness/speak-request.js";

/** The value the page's "Base F0" box starts with, from index.html. */
function initialBaseF0BoxValue(): string {
  const input = /<input id="baseF0"[^>]*>/.exec(readFileSync("index.html", "utf8"))?.[0];
  if (!input) throw new Error("index.html has no #baseF0 input");
  return / value="([^"]*)"/.exec(input)?.[1] ?? "";
}

function pageDocument(values: Record<string, string>) {
  return {
    getElementById: (id: string) => (id in values ? { value: values[id] } : null),
  };
}

const controls = { phrase: " hello world ", rate: "1.0", frontendSelect: "dectalk-english" };

describe("the page's Speak request", () => {
  it("starts with an empty Base F0 box", () => {
    expect(initialBaseF0BoxValue()).toBe("");
  });

  it("passes no base F0 when the box is as the page starts it", () => {
    const request = readSpeakRequest(
      pageDocument({ ...controls, baseF0: initialBaseF0BoxValue() }),
      "paul",
    );
    expect(request).toEqual({
      phrase: "hello world",
      baseF0: undefined,
      options: { rate: 1, frontendId: "dectalk-english", speaker: "paul" },
    });
  });

  it("passes the number the user entered", () => {
    const request = readSpeakRequest(pageDocument({ ...controls, baseF0: "140" }), null);
    expect(request.baseF0).toBe(140);
    expect(request.options).toEqual({ rate: 1, frontendId: "dectalk-english" });
  });

  it.each(["", "  ", "abc", "0", "-5"])("reads %j as no base F0", (value) => {
    expect(readBaseF0(pageDocument({ baseF0: value }))).toBeUndefined();
  });
});

describe("the frontend's own base F0, which the empty box leaves in force", () => {
  const speak = (frontendId: string, baseF0: number | undefined, speaker?: string) =>
    textToKlattTrackDetailed("hello world", baseF0, 30, {
      frontendId,
      rate: 1,
      ...(speaker ? { speaker } : {}),
    });

  // The 110 the box used to hold is this frontend's own default
  // (public/rules/policy/speaker-profile.yaml base_f0_hz; qlatt-english has no
  // voice registry), so its track does not change.
  it("qlatt-english: none is 110", () => {
    const none = speak("qlatt-english", undefined);
    expect(none.resolvedSpeaker.base_f0_hz).toBe(110);
    expect(none.track).toEqual(speak("qlatt-english", 110).track);
  });

  // qlatt-beauty's default voice sets 138 Hz
  // (public/rules/frontends/qlatt-beauty/speakers/beauty.yaml); 110 passed in
  // replaces it and moves the contour.
  it("qlatt-beauty: none is its voice's 138, and 110 is a different track", () => {
    const none = speak("qlatt-beauty", undefined);
    const overridden = speak("qlatt-beauty", 110);
    expect(none.resolvedSpeaker.base_f0_hz).toBe(138);
    expect(overridden.resolvedSpeaker.base_f0_hz).toBe(110);
    expect(overridden.track).not.toEqual(none.track);
  });

  // DECtalk 4.63 Paul's average pitch is 122 Hz (dectalk-english frontend.yaml
  // policy.speaker.base_f0_hz); 110 passed in replaces it and moves every F0.
  it("dectalk-english: none is Paul's 122, and 110 is a different track", () => {
    const none = speak("dectalk-english", undefined, "paul");
    const overridden = speak("dectalk-english", 110, "paul");
    expect(none.resolvedSpeaker.base_f0_hz).toBe(122);
    expect(overridden.resolvedSpeaker.base_f0_hz).toBe(110);
    expect(overridden.track).not.toEqual(none.track);
  });
});
