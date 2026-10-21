/**
 * Every voice the dectalk-english frontend offers reaches the dectalk-vtm
 * node with the speaker definition DECtalk 4.63 sends for it.
 *
 * The voice files' speaker words are derived: scripts/oracle/
 * import-dectalk-voices.ts computes them from the voice definitions and
 * tuning tables in DECtalk's source, as setspdef() does. The check is the
 * packet the stock say.exe actually sent for each voice, recorded in
 * crates/dectalk-vtm/tests/fixtures/all-voices.speakers.txt.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";
import {
  DECTALK_VOICES,
  readRecordedSpeakerPackets,
  readVtmFixture,
} from "../scripts/oracle/dectalk-vtm-fixture";
import { renderDectalkVtmTrack, renderToInt16 } from "../scripts/rendering/dectalk-vtm-render";
import { SPEAKER_SHARED, SPEAKER_WORDS, vtmEventsToTrack } from "../src/dectalk-vtm-track";
import { textToKlattTrack } from "../src/tts-frontend";

const FRONTEND = "dectalk-english";
const SPEAKERS_DIR = "public/rules/frontends/dectalk-english/speakers";
const SPEAKER_PARAMS = [...SPEAKER_WORDS.map(([name]) => name), ...SPEAKER_SHARED];
const packets = readRecordedSpeakerPackets(
  path.join("crates", "dectalk-vtm", "tests", "fixtures", "all-voices.speakers.txt"),
);
const voiceFile = (voice: string) =>
  load(readFileSync(path.join(SPEAKERS_DIR, `${voice}.yaml`), "utf8")) as Record<string, unknown>;

describe("dectalk-english voices carry DECtalk's speaker definition", () => {
  it("offers the nine voices DECtalk has a definition for, and no other", () => {
    const frontend = load(
      readFileSync("public/rules/frontends/dectalk-english/frontend.yaml", "utf8"),
    ) as { speakers: { voices: string[]; rule_fields: Record<string, unknown> } };
    expect([...frontend.speakers.voices].sort()).toEqual([...DECTALK_VOICES].sort());
    // Every speaker word is a field rules may read, so every voice must give it.
    expect(Object.keys(frontend.speakers.rule_fields)).toEqual(
      expect.arrayContaining(SPEAKER_PARAMS),
    );
  });

  it("derives, for every voice, the packet the stock say.exe sent", () => {
    expect(packets.map((record) => record.voice)).toEqual([...DECTALK_VOICES]);
    const differences: string[] = [];
    for (const record of packets) {
      expect(Object.keys(record.fields)).toEqual(SPEAKER_PARAMS);
      const file = voiceFile(record.voice);
      for (const [name, sent] of Object.entries(record.fields)) {
        if (file[name] !== sent) {
          differences.push(`${record.voice}.${name}: file ${String(file[name])}, DECtalk ${sent}`);
        }
      }
    }
    expect(differences).toEqual([]);
  });

  // The gain fields the Klatt experiment reads are the tuned definition's,
  // which are the packet's gains: one voice definition, not two.
  it("has each voice's own gain fields equal to the gains it sends", () => {
    for (const record of packets) {
      const file = voiceFile(record.voice);
      expect(
        { G1: file.G1, G2: file.G2, G3: file.G3, G4: file.G4, LO: file.LO },
        record.voice,
      ).toEqual({
        G1: record.fields.SPD_R5CA,
        G2: record.fields.SPD_R4CA,
        G3: record.fields.SPD_R3CA,
        G4: record.fields.SPD_R2CA,
        LO: record.fields.SPD_R1CA,
      });
      expect({ GF: file.GF, GV: file.GV, GH: file.GH }, record.voice).toEqual({
        GF: record.fields.SPD_AFGAIN,
        GV: record.fields.SPD_AZGAIN,
        GH: record.fields.SPD_APGAIN,
      });
    }
  });

  it.each(packets.map((record) => [record.voice, record] as const))(
    "%s: every frame of the track carries the voice's packet",
    (voice, record) => {
      const track = textToKlattTrack("cat.", undefined, 30, {
        frontendId: FRONTEND,
        rate: 1,
        speaker: voice,
      });
      const running = track.filter((frame) => frame.params.run === 1);
      expect(running.length).toBeGreaterThan(100);
      for (const frame of running) {
        const sent = Object.fromEntries(SPEAKER_PARAMS.map((name) => [name, frame.params[name]]));
        expect(sent, `${voice} at ${frame.time} s`).toEqual(record.fields);
      }
    },
    120000,
  );
});

describe("dectalk-english voices through dectalk-vtm", () => {
  const fixtureDir = path.join("crates", "dectalk-vtm", "tests", "fixtures");

  // The node must load the selected voice's definition, not its default
  // (Paul's): rendering a voice's own recorded packets is sample-exact only
  // with that voice's definition, so the frontend's speaker words are put
  // on DECtalk's recorded packets here and the stock WAV is required.
  // The last row is the control: Betty's packets with Paul's definition must
  // not give Betty's WAV, or the rows above would prove nothing.
  it.each([
    ["betty-she", "betty", true],
    ["wendy-hello", "wendy", true],
    ["paul-cat", "paul", true],
    ["betty-she", "paul", false],
  ])(
    "%s: DECtalk's packets with the frontend's %s speaker words; the say.exe WAV: %s",
    async (id, voice, same) => {
      const fixture = readVtmFixture(fixtureDir, id);
      const frontendTrack = textToKlattTrack("cat.", undefined, 30, {
        frontendId: FRONTEND,
        rate: 1,
        speaker: voice,
      });
      const speakerWords = Object.fromEntries(
        SPEAKER_PARAMS.map((name) => [name, frontendTrack[0]?.params[name] as number]),
      );
      // DECtalk's packets, laid out as a track, then every speaker word
      // replaced by the frontend's and the reload serial left at its default.
      const track = vtmEventsToTrack(fixture.events).map((frame) =>
        frame.params.run === 1
          ? { ...frame, params: { ...frame.params, ...speakerWords, speaker_epoch: 0 } }
          : frame,
      );
      const render = await renderDectalkVtmTrack({
        repoRoot: process.cwd(),
        track,
        sampleRate: 11025,
      });
      expect(render.diagnostics.filter((entry) => entry.level !== "info")).toEqual([]);
      const samples = renderToInt16(render);
      let exact = 0;
      for (let i = 0; i < samples.length; i += 1) if (samples[i] === fixture.samples[i]) exact += 1;
      console.log(`${id} with ${voice}'s speaker words: exact ${exact}/${fixture.samples.length}`);
      expect(samples.length).toBe(fixture.samples.length);
      if (same) expect(exact).toBe(fixture.samples.length);
      else expect(exact).toBeLessThan(fixture.samples.length);
    },
    120000,
  );
});
