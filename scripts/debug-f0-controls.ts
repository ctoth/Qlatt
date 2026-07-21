import { textToKlattTrackDetailed } from "../src/tts-frontend";

const args = process.argv.slice(2);
const frameArgument = args.find((argument) => argument.startsWith("--frames="));
const phrase = args.filter((argument) => argument !== frameArgument).join(" ") || "cake.";
const result = textToKlattTrackDetailed(phrase, 110, 30, {
  frontendId: "dectalk-english",
  speaker: "paul",
});

const controls = ["PhraseCommand", "Tilt"].flatMap((relationName) =>
  result.utterance.relation(relationName).listItems().map((item) => ({
    durationFrames: item.get("duration_frames"),
    id: item.id,
    layer: item.get("layer"),
    profilePoints: item.get("profile_points"),
    relation: relationName,
    tag: item.get("tag"),
    timeMs: result.utterance.resolveAnchorTime(item),
    value: item.get("value"),
  })),
).sort((left, right) => (left.timeMs ?? 0) - (right.timeMs ?? 0));

const segments = result.utterance.relation("Segment").listItems()
  .filter((item) => item.get("active") !== false)
  .map((item) => {
    const anchor = result.utterance.intervalAnchor(item);
    return {
      durationMs: item.get("duration"),
      id: item.id,
      phoneme: item.get("phoneme"),
      syncLeftMs: anchor ? result.utterance.axis.getMarkTime(anchor.leftMarkId) : null,
      syncRightMs: anchor ? result.utterance.axis.getMarkTime(anchor.rightMarkId) : null,
    };
  });

const frameMatch = frameArgument?.match(/^--frames=(\d+):(\d+)$/);
const nativeF0 = frameMatch
  ? Array.from(
      { length: Number(frameMatch[2]) - Number(frameMatch[1]) + 1 },
      (_, offset) => {
        const frame = Number(frameMatch[1]) + offset;
        const time = frame * 0.0064;
        return {
          f0: result.track.findLast((entry) => entry.time <= time + 1e-9)?.params.F0,
          frame,
        };
      },
    )
  : undefined;

console.log(JSON.stringify({ phrase, segments, controls, ...(nativeF0 ? { nativeF0 } : {}) }, null, 2));
