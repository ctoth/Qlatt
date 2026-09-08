import { readFileSync, writeFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { summarizeTrackMetrics } from "../src/analysis/track-metrics";
import type { materializePhonemeTarget } from "../src/declarative-frontend/inventory";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const control = vi.hoisted(() => ({ legacyTarget: false }));
vi.mock("../src/declarative-frontend/inventory", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/declarative-frontend/inventory")>();
  return {
    ...actual,
    materializePhonemeTarget: (...args: Parameters<typeof materializePhonemeTarget>) => {
      const [phone, options] = args;
      return actual.materializePhonemeTarget(
        phone,
        control.legacyTarget && options?.stress === 2 ? { ...options, stress: 0 } : options,
      );
    },
  };
});

it("reviews each corpus change with a legacy acoustic-mapping control", () => {
  const corpus = JSON.parse(readFileSync("test/phrase-sets/linguistic.json", "utf8")) as {
    name: string;
    baseF0: number;
    phrases: string[];
  };
  const before = JSON.parse(
    readFileSync("test/golden/declarative-corpus-summary.json", "utf8"),
  ) as {
    summaries: ({ phrase: string } & ReturnType<typeof summarizeTrackMetrics>)[];
  };
  const rows: string[] = [];
  const summaries = corpus.phrases.map((phrase, index) => {
    control.legacyTarget = false;
    const provenance = createProvenanceCollector();
    const candidate = textToKlattTrackDetailed(phrase, corpus.baseF0, 30, { provenance });
    const summary = { phrase, ...summarizeTrackMetrics(candidate.track) };
    control.legacyTarget = true;
    const legacy = {
      phrase,
      ...summarizeTrackMetrics(textToKlattTrackDetailed(phrase, corpus.baseF0).track),
    };
    control.legacyTarget = false;
    const old = before.summaries[index];
    const keys = Object.keys(summary).filter((key) => key !== "phrase") as (keyof ReturnType<
      typeof summarizeTrackMetrics
    >)[];
    const changed = keys.filter((key) => Math.abs(summary[key] - old[key]) > 1e-6);
    if (process.env.QLATT_STRESS_GOLDENS === "1") {
      // The old numeric summaries must be reproduced before replacing their expectations.
      for (const key of keys)
        expect(legacy[key], `${phrase}: legacy ${key}`).toBeCloseTo(old[key], 6);
      const segments = candidate.utterance.relation("Segment").listItems();
      const mappings = provenance
        .getDecisions()
        .filter((decision) => decision.type === "stress_inventory_projection")
        .map((decision) => {
          const segment = segments.find((item) => item.id === decision.subject);
          return `${String(segment?.get("word"))}: ${String(segment?.get("phoneme"))}2 → target 1`;
        });
      if (changed.length) expect(mappings.length).toBeGreaterThan(0);
      rows.push(
        `| ${phrase} | ${changed.length ? [...new Set(mappings)].join("; ") : "unchanged control"} | ${changed.map((key) => `${key}: ${old[key].toFixed(6)} → ${summary[key].toFixed(6)}`).join("; ") || "none"} |`,
      );
    } else {
      // After review the committed golden remains the ordinary production contract.
      for (const key of keys) expect(summary[key], `${phrase}: ${key}`).toBeCloseTo(old[key], 6);
    }
    return summary;
  });
  if (process.env.QLATT_STRESS_GOLDENS === "1") {
    writeFileSync(
      "docs/lexical-stress-golden-review.md",
      [
        "# Secondary-stress golden review",
        "",
        "Each phrase was rerun with the old secondary-to-unstressed acoustic mapping. That control reproduced every pre-change numeric summary within the existing 1e-6 tolerance. The candidate changes below therefore follow the declared secondary-to-primary target choice, while retaining lexical stress 2. Unaffected phrases remain controls.",
        "",
        "Justification: Hayes (1982), pp. 250–251, 271–274 supports preserving secondary prominence. Selecting unreduced target 1 is the explicit Qlatt engineering choice in the inventory citation, not an acoustic parameter attributed to the paper.",
        "",
        "Regenerate only against the pre-change golden with QLATT_STRESS_GOLDENS=1; ordinary runs verify the committed candidate golden. This review is of track metrics, not a listening test.",
        "",
        "| Phrase | Secondary target changes | Metric changes |",
        "|---|---|---|",
        ...rows,
        "",
      ].join("\n"),
    );
    writeFileSync(
      "test/golden/declarative-corpus-summary.json",
      `${JSON.stringify({ corpus: corpus.name, baseF0: corpus.baseF0, summaries }, null, 2)}\n`,
    );
  }
}, 75_000);
