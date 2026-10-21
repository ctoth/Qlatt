/**
 * A render request's `speaker` (scripts/render-phrase.ts `--speaker`) reaches
 * the frontend: the Node render backend, given the dectalk-english frontend, a
 * voice and that voice's text, produces the samples the stock say.exe wrote
 * for that voice, and without the voice it does not.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readWavInt16 } from "../scripts/oracle/dectalk-vtm-fixture";
import {
  browserRenderOptions,
  browserRuntimeBackend,
} from "../src/rendering/backends/browser-runtime";
import {
  createNodeRuntimeBackend,
  nodeRuntimeBackend,
} from "../src/rendering/backends/node-runtime";
import { trackOnlyBackend } from "../src/rendering/backends/track-only";
import { openBrowserSession, resolveChromePath } from "../src/rendering/browser-session";
import type { RenderRequest } from "../src/rendering/types";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

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

  // No browser is launched here. That the browser's render with a voice is
  // say.exe's audio is measured by scripts/oracle/browser-sweep.ts.
  it("the browser backend hands the voice to the page's offline driver", () => {
    const browser = { allowBrowserRender: true, renderHost: "browser" } as const;
    expect(browserRenderOptions({ ...request("she.", "betty"), ...browser }).speaker).toBe("betty");
    expect(browserRenderOptions({ ...request("she."), ...browser })).not.toHaveProperty("speaker");
    // The driver gives it to the frontend as the page's voice selection does.
    const page = fs.readFileSync(path.join("test", "render-runtime-offline.html"), "utf8");
    expect(page).toContain("resolvedSpeaker: frontend?.resolvedSpeaker,");
  });

  it("the browser backend refuses a voice for the legacy page, which cannot select one", async () => {
    await expect(
      browserRuntimeBackend.render({
        ...request("she.", "betty"),
        engine: "legacy",
        allowBrowserRender: true,
        renderHost: "browser",
      }),
    ).rejects.toThrow(/cannot select a voice/);
  });
});

function direct(req: RenderRequest) {
  return textToKlattTrackDetailed(req.phrase, req.baseF0, req.transitionMs, {
    frontendId: req.frontendId,
    rate: req.rate,
    speaker: req.speaker,
    pitchScale: req.pitchScale,
    voiceQuality: req.voiceQuality,
    directionTrack: req.directionTrack,
  });
}

const performanceRequest: RenderRequest = {
  ...request("See me."),
  frontendId: "qlatt-beauty",
  experimentId: "qlatt-beauty",
  includeTrack: true,
  baseF0: 140,
  pitchScale: 1.1,
  speaker: { base_f0_hz: 180 },
  voiceQuality: "breathy",
  directionTrack: {
    version: "1",
    global: { affect: { preset: "happy", degree: 0.4 } },
    spans: [{ id: "opening", anchor: { unit: "word", start: 0 }, pitch: { semitones: 2 } }],
  },
};

describe("render request frontend options", () => {
  it("matches direct frames and resolved profiles through warm Node and track-only A/B/A", async () => {
    const warm = createNodeRuntimeBackend({ keepWarm: true });
    const plain = {
      ...performanceRequest,
      speaker: undefined,
      voiceQuality: undefined,
      directionTrack: undefined,
    };
    const expected = direct(performanceRequest);
    expect(expected.track).not.toEqual(direct(plain).track);
    // Existing policy selects request.base_f0_hz before positional baseF0.
    expect(expected.resolvedSpeaker.base_f0_hz).toBeCloseTo(198);
    try {
      for (const req of [
        performanceRequest,
        plain,
        performanceRequest,
        { ...request("she.", "betty"), includeTrack: true },
      ]) {
        const result = direct(req);
        for (const backend of [warm, trackOnlyBackend]) {
          const rendered = await backend.render(req);
          expect(rendered.track).toEqual(result.track);
          expect(rendered.resolvedSpeaker).toEqual(result.resolvedSpeaker);
          expect(rendered.speaker).toEqual(req.speaker);
          expect(rendered.voiceQuality).toBe(req.voiceQuality);
          expect(rendered.directionTrack).toEqual(req.directionTrack);
          expect(rendered.pitchScale).toBe(req.pitchScale);
          expect(rendered).not.toHaveProperty("utterance");
          expect(rendered).not.toHaveProperty("provenance");
        }
      }
    } finally {
      await warm.dispose();
    }
  }, 120000);

  it.each([
    { speaker: "nobody" },
    { voiceQuality: "not-a-preset" },
    {
      directionTrack: {
        version: "1",
        spans: [
          {
            id: "bad",
            anchor: { unit: "syllable", word: 99, start: 0 },
            stress: { level: 1 },
          },
        ],
      },
    },
  ] satisfies Array<Partial<RenderRequest>>)(
    "preserves the frontend error for %j",
    async (options) => {
      const req = { ...request("she."), ...options };
      let message = "";
      try {
        direct(req);
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message).not.toBe("");
      for (const backend of [nodeRuntimeBackend, trackOnlyBackend]) {
        await expect(backend.render(req)).rejects.toThrow(message);
      }
    },
  );

  it.each(["voiceQuality", "directionTrack"] as const)(
    "rejects %s on the legacy browser driver",
    async (field) => {
      await expect(
        browserRuntimeBackend.render({
          ...request("See me."),
          engine: "legacy",
          allowBrowserRender: true,
          [field]: performanceRequest[field],
        }),
      ).rejects.toThrow(/cannot apply voiceQuality or directionTrack/);
    },
  );

  const chromePath =
    resolveChromePath() ??
    ["/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
  it.skipIf(!chromePath)(
    "serializes directions and profile overrides through the actual browser page",
    async () => {
      const session = await openBrowserSession({
        repoRoot: process.cwd(),
        engine: "runtime",
        browserExecutablePath: chromePath,
        log: (line) => process.stderr.write(`${line}\n`),
      });
      try {
        const plain = {
          ...performanceRequest,
          speaker: undefined,
          voiceQuality: undefined,
          directionTrack: undefined,
        };
        for (const req of [performanceRequest, plain, performanceRequest]) {
          const payload = await session.render(browserRenderOptions(req));
          const expected = direct(req);
          expect(payload.track).toEqual(expected.track);
          expect(payload.resolvedSpeaker).toEqual(expected.resolvedSpeaker);
          expect(payload.directionTrack).toEqual(req.directionTrack);
          expect(payload.speaker).toEqual(req.speaker);
          expect(payload.voiceQuality).toBe(req.voiceQuality);
        }
        await expect(
          session.render(
            browserRenderOptions({ ...performanceRequest, voiceQuality: "not-a-preset" }),
          ),
        ).rejects.toThrow(/not-a-preset/);
      } finally {
        await session.close();
      }
    },
    120000,
  );
});
