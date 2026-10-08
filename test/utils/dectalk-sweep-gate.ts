/**
 * The sweep gate's entries, each asserted sample for sample against its
 * checked-in say.exe WAV. The entries are dealt across several test files
 * (test/dectalk-sweep-gate-<n>.test.ts) so vitest runs them side by side.
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
} from "../../scripts/oracle/dectalk-voice-compare";
import { SWEEP_GATE_FIXTURE_DIR, SWEEP_GATE_LIST_PATH } from "../../scripts/oracle/sweep-gate-list";

/** How many test files the gate's entries are dealt across. */
export const SWEEP_GATE_PARTS = 4;

export function describeSweepGatePart(part: number): void {
  const corpus = readVoiceCorpus(SWEEP_GATE_LIST_PATH);
  const entries = corpus.entries.filter((_, index) => index % SWEEP_GATE_PARTS === part);

  describe(`DECtalk sweep gate, part ${(part + 1).toString()} of ${SWEEP_GATE_PARTS.toString()}`, () => {
    it("has entries", () => {
      expect(entries.length).toBeGreaterThan(0);
    });

    it.each(entries.map((entry) => [entry.id, entry.voiceId, entry.rate, entry] as const))(
      "%s (%s, %i) is the say.exe WAV, sample for sample",
      async (_id, _voice, _rate, entry) => {
        const result = await compareVoiceEntry(
          entry,
          corpus.defaults,
          path.resolve(SWEEP_GATE_FIXTURE_DIR),
        );
        expect(result.error).toBeUndefined();
        expect(result.problems).toEqual([]);
        expect(result.samplesOracle).toBeGreaterThan(0);
        expect(result.packetsRender).toBe(result.packetsOracle);
        expect(result.firstMismatch).toBe(-1);
        expect(result.samplesEqual).toBe(result.samplesOracle);
        expect(isExact(result)).toBe(true);
      },
      120000,
    );
  });
}
