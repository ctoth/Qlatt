import { describe, expect, it, vi } from "vitest";
import {
  textToControlScore,
  textToKlattTrackDetailed,
} from "../src/tts-frontend";
import { createProvenanceCollector } from "../src/provenance";

describe("declarative control score builder", () => {
  it("emits a score artifact from the real frontend pipeline", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const score = textToControlScore("the quick brown fox jumps over the lazy dog.", 120);
      expect(score.version).toBe("v1");
      expect(score.frontend_id).toBe("qlatt-english");
      expect(score.tokens.length).toBeGreaterThan(0);
      expect(score.f0_events.length).toBeGreaterThan(0);

      const firstPhone = score.tokens.find((token) => token.phoneme !== "SIL");
      expect(firstPhone).toBeDefined();
      expect(firstPhone?.id.length).toBeGreaterThan(0);
      expect(firstPhone?.duration.realized_target_ms).toBeGreaterThan(0);
      expect(firstPhone?.prosody).toBeDefined();
      expect(Array.isArray(firstPhone?.filter?.formants ?? [])).toBe(true);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("is returned alongside the existing detailed track result", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const result = textToKlattTrackDetailed("hello world.", 110);
      expect(result.track.length).toBeGreaterThan(0);
      expect(result.frontendPhones.length).toBeGreaterThan(0);
      expect(result.controlScore.tokens.length).toBe(result.frontendPhones.length);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("records a provenance decision when the control score is created", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const provenance = createProvenanceCollector();
      textToKlattTrackDetailed("hello world.", 110, 30, { provenance });
      const decisions = provenance.getDecisions();
      const decision = decisions.find((entry) => entry.type === "control_score_created");
      expect(decision).toBeDefined();
      expect(decision?.stage).toBe("frontend");
      expect(decision?.citations).toContain("/rules/control-score.yaml");
    } finally {
      warnSpy.mockRestore();
    }
  });
});
