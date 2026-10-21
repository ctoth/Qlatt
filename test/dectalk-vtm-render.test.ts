/**
 * The `dectalk-vtm` experiment end to end on the Node host: DECtalk's recorded
 * packets as a frame track, scheduled by the interpreter onto the node's
 * AudioParams, rendered by an OfflineAudioContext.
 *
 * At 11025 Hz the node does not resample, so the render must be the stock
 * say.exe WAV sample for sample.
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import { listVtmFixtures, readVtmFixture } from "../scripts/oracle/dectalk-vtm-fixture";
import {
  dectalkVtmDelaySamples,
  renderDectalkVtmTrack,
  renderToInt16,
} from "../scripts/rendering/dectalk-vtm-render";
import { vtmEventsToTrack } from "../src/dectalk-vtm-track";
import { createProvenanceCollector } from "../src/provenance";

const fixtureDir = path.join("crates", "dectalk-vtm", "tests", "fixtures");

describe("dectalk-vtm experiment renders DECtalk's packets", () => {
  it.each(listVtmFixtures(fixtureDir))(
    "%s: the 11025 Hz render equals the say.exe WAV",
    async (id) => {
      const fixture = readVtmFixture(fixtureDir, id);
      const render = await renderDectalkVtmTrack({
        repoRoot: process.cwd(),
        track: vtmEventsToTrack(fixture.events),
        sampleRate: 11025,
      });
      const problems = render.diagnostics.filter((entry) => entry.level !== "info");
      expect(problems).toEqual([]);
      const samples = renderToInt16(render);
      expect(samples.length).toBe(fixture.samples.length);
      let exact = 0;
      let first = -1;
      for (let i = 0; i < samples.length; i += 1) {
        if (samples[i] === fixture.samples[i]) exact += 1;
        else if (first < 0) first = i;
      }
      console.log(`${id}: samples=${samples.length} exact=${exact} firstMismatch=${first}`);
      expect(first).toBe(-1);
      expect(exact).toBe(fixture.samples.length);
      // Nothing but the node's delay precedes the run, and nothing follows it.
      expect(render.delaySamples).toBe(2);
      expect(Array.from(render.samples.subarray(0, 2))).toEqual([0, 0]);
      expect(render.samples.subarray(2 + samples.length).every((value) => value === 0)).toBe(true);
    },
    60000,
  );

  it("reports the run, the conversion and each speaker definition as decisions", async () => {
    const fixture = readVtmFixture(fixtureDir, "paul-harry-switch");
    const provenance = createProvenanceCollector();
    const render = await renderDectalkVtmTrack({
      repoRoot: process.cwd(),
      track: vtmEventsToTrack(fixture.events),
      sampleRate: 48000,
      provenance,
    });
    expect(render.delaySamples).toBe(72);
    expect(dectalkVtmDelaySamples(44100)).toBe(66);
    const started = render.diagnostics.find((entry) => entry.code === "dectalk-vtm.run_started");
    expect(started?.data).toMatchObject({
      node: "vtm",
      sampleRate: 48000,
      delaySamples: 72,
      resampling: "kaiser-windowed-sinc",
    });
    const decisions = provenance.getDecisions();
    expect(decisions.map((decision) => decision.type)).toEqual([
      "dectalk_vtm_run_started",
      "dectalk_vtm_speaker_loaded",
      "dectalk_vtm_speaker_loaded",
    ]);
    expect(decisions[0].citations).toEqual([
      "DECtalk 4.63 VTM/vtmiont.c:656-1351",
      "Smith & Gossett 1984, A flexible sampling-rate conversion method (ICASSP)",
      "Kaiser 1974, Nonrecursive digital filter design using the I0-sinh window function (ISCAS)",
    ]);
    expect(decisions[1].parents).toEqual([decisions[0].id]);
    // Paul at frame 0, Harry (last_voice 2) where DECtalk sent the second packet.
    expect(decisions[1].reason).toContain("frame 0");
    expect(decisions[2].reason).toContain("last_voice 2");
    expect(render.samples.every(Number.isFinite)).toBe(true);
  }, 60000);
});
