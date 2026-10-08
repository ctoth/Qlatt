/**
 * The sweep gate: a subset of the sweep corpora (Paul's sentences, Betty's,
 * paragraphs, three other rates, seven other voices) whose say.exe WAVs are
 * checked in, so that a rule change that breaks a text which was sample-exact
 * fails a test instead of waiting for the next manual sweep.
 *
 * This file checks the list and the fixtures; the renders themselves are in
 * test/dectalk-sweep-gate-<n>.test.ts, dealt across files to run side by side.
 *
 * The list is computed, not written by hand: scripts/oracle/sweep-gate-list.ts
 * (its header has the rule) from the sweep corpora and the record of the last
 * full sweep run, test/fixtures/dectalk-sweep-gate/sweep-record.json
 * (scripts/oracle/sweep-table.ts --out). To move the gate:
 *
 *   ... scripts/oracle/sweep-table.ts --fixture-root <sweep WAVs> \
 *         --out test/fixtures/dectalk-sweep-gate/sweep-record.json
 *   ... scripts/oracle/sweep-gate-list.ts --write
 *   ... scripts/oracle/export-dectalk-vtm-fixture.ts \
 *         --corpus test/oracle-corpora/dectalk-us-sweep-gate-v1.json \
 *         --out-dir test/fixtures/dectalk-sweep-gate --wav-only
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readVoiceCorpus } from "../scripts/oracle/dectalk-voice-compare";
import { DECTALK_VOICES } from "../scripts/oracle/dectalk-vtm-fixture";
import {
  GATE_RULES,
  readSweepRecord,
  SWEEP_GATE_FIXTURE_DIR,
  SWEEP_GATE_LIST_PATH,
  sweepGateList,
  sweepGateListText,
} from "../scripts/oracle/sweep-gate-list";
import { SWEEP_GATE_PARTS } from "./utils/dectalk-sweep-gate";

const repoRoot = process.cwd();
const corpus = readVoiceCorpus(SWEEP_GATE_LIST_PATH);
const record = readSweepRecord(repoRoot);

describe("DECtalk sweep gate list", () => {
  it("is what the rule gives for the sweep corpora and the recorded run", () => {
    const listed = fs.readFileSync(SWEEP_GATE_LIST_PATH, "utf8").replace(/\r\n/gu, "\n");
    expect(listed).toBe(sweepGateListText(sweepGateList(repoRoot, record)));
  });

  it("takes nothing that was not sample-exact in the recorded run", () => {
    for (const rule of GATE_RULES) {
      const misses = new Set(record.corpora[rule.corpusId]?.misses ?? []);
      const taken = corpus.entries
        .filter((entry) => entry.id.startsWith(`${rule.prefix}--`))
        .map((entry) => entry.id.slice(rule.prefix.length + 2));
      expect(taken.length, rule.corpusId).toBeGreaterThan(0);
      expect(
        taken.filter((id) => misses.has(id)),
        rule.corpusId,
      ).toEqual([]);
    }
  });

  it("covers every kind of text, all nine voices and four rates", () => {
    for (const rule of GATE_RULES.filter((candidate) => candidate.walk === "group")) {
      const source = readVoiceCorpus(path.join("test", "oracle-corpora", `${rule.corpusId}.json`));
      const groups = new Set(source.entries.map((entry) => `${rule.corpusId}:${entry.group}`));
      const gated = new Set(corpus.entries.map((entry) => entry.group));
      expect(
        [...groups].filter((group) => !gated.has(group)),
        rule.corpusId,
      ).toEqual([]);
    }
    expect([...new Set(corpus.entries.map((entry) => entry.voiceId))].sort()).toEqual(
      [...DECTALK_VOICES].sort(),
    );
    expect([...new Set(corpus.entries.map((entry) => entry.rate))].sort()).toEqual([
      100, 140, 180, 260,
    ]);
  });

  it("has one WAV for each entry and no other, under 8 MB together", () => {
    const wavs = fs.readdirSync(SWEEP_GATE_FIXTURE_DIR).filter((name) => name.endsWith(".wav"));
    expect(wavs.sort()).toEqual(corpus.entries.map((entry) => `${entry.id}.wav`).sort());
    const bytes = wavs.reduce(
      (sum, name) => sum + fs.statSync(path.join(SWEEP_GATE_FIXTURE_DIR, name)).size,
      0,
    );
    expect(bytes).toBeLessThan(8 * 1024 * 1024);
  });

  it("is dealt across test files that together hold every entry", () => {
    const files = fs
      .readdirSync("test")
      .filter((name) => /^dectalk-sweep-gate-\d+\.test\.ts$/u.test(name));
    expect(files.sort()).toEqual(
      Array.from(
        { length: SWEEP_GATE_PARTS },
        (_, part) => `dectalk-sweep-gate-${(part + 1).toString()}.test.ts`,
      ),
    );
  });
});
