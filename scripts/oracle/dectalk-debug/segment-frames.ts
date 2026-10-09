/**
 * segment-frames.ts
 * =================
 * The dectalk-english frontend's allophones and their durations in frames
 * for a text, one line: `DH:8 AX:9 M:13 ...`, to set beside the `ALLO` line
 * of the instrumented say.exe (f0-trace.md), which prints DECtalk's
 * allophone codes and frames the same way.
 *
 * A stop is its closure and release together; a silence is `SIL`. With
 * --corpus every entry is printed under its id.
 *
 * A measurement tool: exit code 0.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/oracle/dectalk-debug/segment-frames.ts [--corpus <corpus.json>] ["text" ...]
 */

import fs from "node:fs";
import { FRAME_PERIOD_SEC } from "../../../src/dectalk-vtm-track";
import { textToKlattTrackDetailed } from "../../../src/tts-frontend";

const argv = process.argv.slice(2);
const corpusAt = argv.indexOf("--corpus");
const corpusPath = corpusAt < 0 ? undefined : argv[corpusAt + 1];
const texts: Array<{ id: string; text: string }> = corpusPath
  ? (
      JSON.parse(fs.readFileSync(corpusPath, "utf8")) as {
        entries: Array<{ id: string; text: string }>;
      }
    ).entries
  : argv.map((text, index) => ({ id: (index + 1).toString(), text }));

for (const { id, text } of texts) {
  let line: string;
  try {
    const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
      rate: 1,
    });
    const parts: string[] = [];
    for (const item of utterance.relation("Segment").listItems()) {
      if (item.get("active") === false) continue;
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
    line = parts.join(" ");
  } catch (error) {
    line = `error: ${(error as Error).message.slice(0, 120)}`;
  }
  console.log(`${id}  ${text}\n  ${line}`);
}
