/**
 * Print the F0 commands the dectalk-english rules issue for a text: one line
 * per PhraseCommand or Tilt Item, in time order, with its layer, tag, value,
 * length in frames and its anchor's time in 6.4 ms frames from the first
 * phone. For comparison with DECtalk's own commands (make_f0_command,
 * ph_inton1.c:1857), which an instrumented build prints; see
 * scripts/oracle/dectalk-debug/README.md.
 *
 *   --text "<text>"     the text (required)
 *   --speaker <voice>   a voice of the frontend (default: its own default)
 *   --layers a,b        only these layers (default: all but `segmental`)
 *
 * A measurement tool: exit code 0.
 */

import { textToKlattTrackDetailed } from "../../src/tts-frontend";

const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const text = flag("text");
if (!text) throw new Error("--text is required");
const speaker = flag("speaker");
const layers = flag("layers")?.split(",");

// DECtalk 4.63 ph_claus.c: one controller frame is 6.4 ms.
const FRAME_MS = 6.4;

const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
  frontendId: "dectalk-english",
  ...(speaker ? { speaker } : {}),
});
const items = [
  ...(utterance.getRelation("PhraseCommand")?.listItems() ?? []),
  ...(utterance.getRelation("Tilt")?.listItems() ?? []),
];
const rows = items
  .map((item) => ({
    layer: String(item.get("layer")),
    tag: String(item.get("tag")),
    value: item.get("value"),
    frames: item.get("duration_frames"),
    points: item.get("profile_points"),
    timeMs: utterance.resolveAnchorTime(item) ?? Number.NaN,
  }))
  .filter((row) => (layers ? layers.includes(row.layer) : row.layer !== "segmental"))
  .sort((left, right) => left.timeMs - right.timeMs);

process.stdout.write(`${text}${speaker ? ` (${speaker})` : ""}\n`);
process.stdout.write("frame\tlayer\ttag\tvalue\tlength\tpoints\n");
for (const row of rows) {
  const frame = Math.round((row.timeMs / FRAME_MS) * 100) / 100;
  const points = Array.isArray(row.points) ? row.points.join(" ") : "";
  process.stdout.write(
    `${frame}\t${row.layer}\t${row.tag}\t${String(row.value)}\t${String(row.frames ?? "")}\t${points}\n`,
  );
}
