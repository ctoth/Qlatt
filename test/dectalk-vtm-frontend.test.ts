/**
 * Text to DECtalk's samples, the way the page does it: the dectalk-english
 * frontend's track, exactly as `textToKlattTrack` returns it, scheduled by the
 * interpreter onto the experiment the frontend is paired with
 * (`public/rules/frontends/manifest.json`), loaded with the frontend/experiment
 * vocabulary check. Nothing here reads DECtalk's packets: the fixture supplies
 * only the WAV the stock say.exe wrote for the same text.
 *
 * The page starts a track a lead after the time its context is held at
 * (src/track-playback.ts), which is not on the node's frame grid; the render
 * does the same.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readVtmFixture } from "../scripts/oracle/dectalk-vtm-fixture";
import { renderDectalkVtmTrack, renderToInt16 } from "../scripts/rendering/dectalk-vtm-render";
import { defaultExperimentFor, type FrontendManifest } from "../src/experiments/frontend-pairing";
import { PLAYBACK_LEAD_SEC } from "../src/track-playback";
import { textToKlattTrack } from "../src/tts-frontend";

const fixtureDir = path.join("crates", "dectalk-vtm", "tests", "fixtures");
const FRONTEND = "dectalk-english";
/** The page's lead from the time its context is held at to a track's start. */
const PAGE_START_DELAY_SEC = PLAYBACK_LEAD_SEC;

const frontendManifest = JSON.parse(
  readFileSync("public/rules/frontends/manifest.json", "utf8"),
) as FrontendManifest;
const experimentIds = (
  JSON.parse(readFileSync("public/experiments/manifest.json", "utf8")) as {
    experiments: { id: string }[];
  }
).experiments.map((experiment) => experiment.id);

describe("dectalk-english frontend through its paired experiment", () => {
  const experimentId = defaultExperimentFor(FRONTEND, frontendManifest, experimentIds);

  it("is paired with dectalk-vtm", () => {
    expect(experimentId).toBe("dectalk-vtm");
  });

  // The fixtures' say.exe text is `[:np] [:ra 180] <text>`: Perfect Paul at
  // DECtalk's default rate, which are the frontend's defaults.
  // The last two start the same phrase on a sample and at an arbitrary time:
  // where the track starts must not change a sample.
  it.each([
    ["paul-cat", "cat.", PAGE_START_DELAY_SEC],
    ["paul-moon", "moon.", PAGE_START_DELAY_SEC],
    ["paul-judge", "judge.", PAGE_START_DELAY_SEC],
    ["paul-cat", "cat.", 0],
    ["paul-cat", "cat.", 0.123456],
  ])(
    "%s: %j started at %f s is the say.exe WAV at 11025 Hz",
    async (id, text, startTime) => {
      const fixture = readVtmFixture(fixtureDir, id);
      // test/harness/runtime.js speak(): rate 1, the selected voice.
      const track = textToKlattTrack(text, undefined, 30, {
        frontendId: FRONTEND,
        rate: 1,
        speaker: "paul",
      });
      const render = await renderDectalkVtmTrack({
        repoRoot: process.cwd(),
        track,
        sampleRate: 11025,
        frontendId: FRONTEND,
        experimentId: experimentId as string,
        startTime,
      });
      const problems = render.diagnostics.filter((entry) => entry.level !== "info");
      expect(problems).toEqual([]);
      expect(render.frames * 71).toBe(fixture.samples.length);
      const samples = renderToInt16(render);
      let exact = 0;
      let first = -1;
      for (let i = 0; i < samples.length; i += 1) {
        if (samples[i] === fixture.samples[i]) exact += 1;
        else if (first < 0) first = i;
      }
      console.log(
        `${id}: start=${render.startSample} packets=${render.frames} samples=${samples.length} exact=${exact} firstMismatch=${first}`,
      );
      expect(first).toBe(-1);
      expect(exact).toBe(fixture.samples.length);
    },
    120000,
  );
});
