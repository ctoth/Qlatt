/**
 * The silence symbol "_" inside a bracket of DECtalk's phoneme mode
 * (test/oracle-corpora/dectalk-us-phoneme-silence-v1.json, written before
 * any export).
 *
 * Carried out, and asserted here: the silence is an allophone inside its
 * clause, with the frames DECtalk gives it and its neighbours. FRAMES holds,
 * for each text, the frames of each allophone as the instrumented say.exe
 * printed them (the ALLO line of scripts/oracle/dectalk-debug/f0-trace.md;
 * the port's side is scripts/oracle/dectalk-debug/segment-frames.ts), the
 * clause's opening and closing pauses left off.
 *
 * Not carried out: the pitch and the formants around such a silence, which
 * the frontend draws as at a clause's edge (DECtalk 4.63 PH/Ph_inton2.c:678,
 * 1620-1650 does otherwise inside a clause). No text of the corpus is
 * DECtalk's samples; each is in NOT_EXACT, and a text there that becomes
 * exact fails its test, so that it is taken off the list.
 *
 * The fixtures are the say.exe WAVs alone
 * (scripts/oracle/export-dectalk-vtm-fixture.ts --corpus ... --wav-only).
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
} from "../scripts/oracle/dectalk-voice-compare";
import { FRAME_PERIOD_SEC } from "../src/dectalk-vtm-track";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const fixtureDir = path.join("test", "fixtures", "dectalk-phoneme-silence");
const corpus = readVoiceCorpus(
  path.join("test", "oracle-corpora", "dectalk-us-phoneme-silence-v1.json"),
);

/** DECtalk's frames per allophone, measured; a stop is one allophone. */
const FRAMES: Readonly<Record<string, string>> = {
  "ps-01": "DH:8 AX:9 M:13 UW:17 SIL:4 N:7 R:8 OW:37 Z:22",
  "ps-02": "DH:8 AX:9 M:13 UW:17 SIL:47 N:7 R:8 OW:37 Z:22",
  "ps-04": "DH:8 AX:9 M:13 UW:16 N:9 SIL:31 R:10 OW:37 Z:22",
  "ps-07": "SIL:63 DH:8 AX:9 M:13 UW:19 N:9 R:9 OW:41 Z:22",
  "ps-08": "DH:8 AX:9 M:13 UW:19 N:9 R:9 OW:29 Z:19 SIL:47 S:16 L:8 OW:23 L:6 IY:20",
  "ps-09": "DH:8 AX:9 S:16 SIL:24 T:14 AR:28 R:10 OW:37 Z:22",
  "ps-10": "DH:8 AX:9 M:13 UW:17 SIL:16 SIL:16 N:7 R:8 OW:37 Z:22",
  "ps-11": "W:6 IY:16 S:20 AO:26 DH:8 AX:9 R:12 IH:19 V:13 SIL:39 RR:17 T:11 UW:12 D:12 EY:33",
  "ps-12": "M:13 UW:19 N:9 SIL:31 R:12 OW:25 Z:13 P:12 IR:32 IY:14 AX:20 D:10",
};

/**
 * Texts whose frames are not DECtalk's yet, with DECtalk's: in each the
 * silence is the first allophone after a word boundary that follows a
 * vowel. Cause not found.
 */
const FRAMES_DIFFER: Readonly<Record<string, string>> = {
  "ps-03": "DECtalk has UW:24 where the frontend has 20",
  "ps-05": "DECtalk has DH:8 AX:9 where the frontend has 10 and 17",
  "ps-06": "DECtalk has DH:8 AX:9 where the frontend has 10 and 17",
};

/** The frontend's allophones and frames, the clause's own pauses left off. */
const framesOf = (text: string): string => {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
    speaker: "paul",
    rate: 1,
  });
  const parts: string[] = [];
  for (const item of utterance.relation("Segment").listItems()) {
    if (item.get("active") === false) continue;
    if (item.get("phoneme") === "SIL" && item.get("written_silence") !== true) continue;
    const frames = Math.round(Number(item.get("duration")) / (FRAME_PERIOD_SEC * 1000));
    const type = String(item.get("type"));
    const last = parts.at(-1);
    if ((type === "stop_release" || type === "stop_aspiration") && last !== undefined) {
      const [name, count] = last.split(":");
      parts[parts.length - 1] = `${name ?? ""}:${(Number(count) + frames).toString()}`;
    } else {
      parts.push(`${String(item.get("phoneme"))}:${frames.toString()}`);
    }
  }
  return parts.join(" ");
};

describe("the silence symbol in a bracket of the phoneme mode", () => {
  it("sorts every text of the corpus into one of the two lists", () => {
    const ids = corpus.entries.map((entry) => entry.id).sort();
    expect([...Object.keys(FRAMES), ...Object.keys(FRAMES_DIFFER)].sort()).toEqual(ids);
  });

  it.each(corpus.entries.filter((entry) => entry.id in FRAMES).map((entry) => [entry.id, entry]))(
    "%s has DECtalk's frames on the silence and the phones around it",
    (id, entry) => {
      expect(framesOf(entry.text)).toBe(FRAMES[id]);
    },
  );

  it.each(corpus.entries.map((entry) => [entry.id, entry] as const))(
    "%s renders, and is not DECtalk's samples yet",
    async (id, entry) => {
      const result = await compareVoiceEntry(entry, corpus.defaults, fixtureDir);
      expect(result.error).toBeUndefined();
      expect(result.samplesOracle).toBeGreaterThan(0);
      expect(isExact(result), `${id} is exact now: assert it`).toBe(false);
    },
    120000,
  );
});
