/**
 * A render request's `speaker` (scripts/render-phrase.ts `--speaker`) reaches
 * the frontend: the Node render backend, given the dectalk-english frontend, a
 * voice and that voice's text, produces the samples the stock say.exe wrote
 * for that voice, and without the voice it does not.
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import { readWavInt16 } from "../scripts/oracle/dectalk-vtm-fixture";
import { browserRuntimeBackend } from "../scripts/rendering/backends/browser-runtime";
import { nodeRuntimeBackend } from "../scripts/rendering/backends/node-runtime";
import type { RenderRequest } from "../src/rendering/types";

const fixtureDir = path.join("crates", "dectalk-vtm", "tests", "fixtures");

function request(phrase: string, speaker?: string): RenderRequest {
  return {
    repoRoot: process.cwd(),
    phrase,
    frontendId: "dectalk-english",
    ...(speaker ? { speaker } : {}),
    experimentId: "dectalk-vtm",
    engine: "runtime",
    rate: 1,
    transitionMs: 30,
    // DECtalk's own rate: the node does not resample and its output is
    // DECtalk's 16-bit samples divided by 32768.
    sampleRate: 11025,
    leadTime: 0.05,
    tailTime: 0.2,
    includeTrack: false,
    noiseSeed: 20260214,
    persistWav: true,
    allowBrowserRender: false,
    renderHost: "node",
  };
}

/**
 * The offset at which `oracle` occurs in `samples` (scaled back to 16-bit
 * values), or -1. The run starts `leadTime` in and the node adds its own
 * short delay, so the offset is a little over 551 samples; the search covers
 * the first 0.1 s.
 */
function offsetOf(oracle: Int16Array, samples: readonly number[]): number {
  for (let offset = 0; offset < 1103; offset += 1) {
    let equal = true;
    for (let i = 0; i < oracle.length && equal; i += 1) {
      equal = samples[offset + i] * 32768 === oracle[i];
    }
    if (equal) return offset;
  }
  return -1;
}

describe("render request speaker", () => {
  // crates/dectalk-vtm/tests/fixtures: say.exe text `[:nb] [:ra 180] she.`
  // and `[:nw] [:ra 180] hello.`.
  it.each([
    ["betty-she", "she.", "betty"],
    ["wendy-hello", "hello.", "wendy"],
  ])(
    "%s: %j rendered with speaker %s is the say.exe WAV; without it, it is not",
    async (id, text, speaker) => {
      const oracle = readWavInt16(path.join(fixtureDir, `${id}.wav`)).samples;
      // The oracle is not silence: a match means something.
      expect(oracle.some((sample) => Math.abs(sample) > 1000)).toBe(true);

      const withVoice = await nodeRuntimeBackend.render(request(text, speaker));
      expect(offsetOf(oracle, withVoice.samples)).toBeGreaterThan(0);

      const defaultVoice = await nodeRuntimeBackend.render(request(text));
      expect(offsetOf(oracle, defaultVoice.samples)).toBe(-1);
    },
    120000,
  );

  it("an unregistered voice is refused, not replaced by the default", async () => {
    await expect(nodeRuntimeBackend.render(request("she.", "nobody"))).rejects.toThrow(
      /E_VOICE_UNKNOWN/,
    );
  });

  it("the browser backend refuses a voice it cannot select", async () => {
    await expect(
      browserRuntimeBackend.render({
        ...request("she.", "betty"),
        allowBrowserRender: true,
        renderHost: "browser",
      }),
    ).rejects.toThrow(/cannot select a voice/);
  });
});
