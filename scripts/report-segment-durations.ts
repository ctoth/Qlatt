import { readFileSync, writeFileSync } from "node:fs";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { loadYamlDocumentSync } from "../src/yaml-loader";

// Capture both checkouts with the same script/corpus, then compare by stable
// phrase + structural item identity; never align solely by rounded frame times.
const [out, beforePath] = process.argv.slice(2);
if (!out) throw new Error("Usage: report-segment-durations.ts OUT.json [BEFORE.json]");
const frontend = loadYamlDocumentSync<{
  parameters: { policy: { duration: Record<string, { value: number }> } };
}>("/rules/frontends/qlatt-english/frontend.yaml");
const policy = frontend.parameters.policy.duration;
function classFloor(type: unknown, inherent: unknown): number {
  return (
    Number(inherent) *
    policy[type === "vowel" ? "incompressibility_ratio_vowel" : "incompressibility_ratio_consonant"]
      .value
  );
}
const corpus = JSON.parse(readFileSync("test/phrase-sets/linguistic.json", "utf8")) as {
  phrases: string[];
  baseF0: number;
};
const segments = corpus.phrases.flatMap((phrase) => {
  const { utterance } = textToKlattTrackDetailed(phrase, corpus.baseF0);
  return utterance
    .relation("Segment")
    .listItems()
    .filter((item) => item.get("active") !== false)
    .map((item) => ({
      phrase,
      id: item.id,
      phoneme: item.get("phoneme"),
      stress: item.get("stress") ?? null,
      type: item.get("type"),
      inherentDuration: item.get("inherentDuration"),
      floor:
        item.get("durationFloor") ?? classFloor(item.get("type"), item.get("inherentDuration")),
      floorWrite: item.latestWrite("durationFloor") ?? null,
      model: item.get("duration_model") ?? null,
      duration: Number(item.get("duration")),
      writes: item.writes("duration"),
    }));
});
type Segment = (typeof segments)[number];
const before = beforePath
  ? (JSON.parse(readFileSync(beforePath, "utf8")) as { segments: Segment[] })
  : null;
const previous = new Map(before?.segments.map((s) => [`${s.phrase}\0${s.id}`, s]));
const comparison = before
  ? segments.map((segment) => {
      const old = previous.get(`${segment.phrase}\0${segment.id}`);
      if (!old) throw new Error(`Missing base segment: ${segment.phrase} ${segment.id}`);
      return {
        ...segment,
        beforeDuration: old.duration,
        beforeFloor: old.floor,
        delta: segment.duration - old.duration,
      };
    })
  : null;
if (before && before.segments.length !== segments.length) throw new Error("Segment count changed");
if (comparison) {
  const rows: unknown[][] = [
    [
      "phrase",
      "id",
      "phoneme",
      "stress",
      "type",
      "inherent_ms",
      "before_floor_ms",
      "after_floor_ms",
      "before_ms",
      "after_ms",
      "delta_ms",
      "source",
      "rules",
    ],
  ];
  for (const s of comparison)
    rows.push([
      s.phrase,
      s.id,
      s.phoneme,
      s.stress,
      s.type,
      s.inherentDuration,
      s.beforeFloor,
      s.floor,
      s.beforeDuration,
      s.duration,
      s.delta,
      JSON.stringify(s.model),
      s.writes.map((w) => w.ruleId ?? w.reason).join("; "),
    ]);
  writeFileSync(
    `${out}.csv`,
    rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n") + "\n",
  );
}
writeFileSync(
  out,
  `${JSON.stringify(
    {
      segments,
      comparison,
      summary: comparison
        ? {
            total: comparison.length,
            changed: comparison.filter((s) => s.delta !== 0).length,
            unchanged: comparison.filter((s) => s.delta === 0).length,
            shorter: comparison.filter((s) => s.delta < 0).length,
            longer: comparison.filter((s) => s.delta > 0).length,
            minDelta: Math.min(...comparison.map((s) => s.delta)),
            maxDelta: Math.max(...comparison.map((s) => s.delta)),
          }
        : null,
    },
    null,
    2,
  )}\n`,
);
