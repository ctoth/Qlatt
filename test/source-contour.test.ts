import { describe, expect, it, vi } from "vitest";
import { loadYamlSourceSync } from "../src/yaml-loader";
import {
  DEFAULT_SOURCE_CONTOUR_PATH,
  loadSourceContourSync,
  resolveSourceContour,
} from "../src/source-contour";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

describe("source contour", () => {
  it("declares the canonical source contour document", () => {
    const source = loadYamlSourceSync(DEFAULT_SOURCE_CONTOUR_PATH);
    const spec = loadSourceContourSync();

    expect(source).toContain("version: v1");
    expect(spec.version).toBe("v1");
    expect(spec.baseline.source_mode).toBe(1);
    expect(spec.voice_quality_presets.breathy.ah_offset_db).toBe(20);
    expect(spec.voice_quality_presets.falsetto.f0_scale).toBe(1.5);
  });

  it("resolves the current LF baseline and falsetto preset behavior", () => {
    const spec = loadSourceContourSync();

    const modal = resolveSourceContour({
      spec,
      requestedQuality: undefined,
      speaker: {
        base_f0_hz: 110,
        formant_scale: 1.0,
        rd_default: 0.7,
        spectral_tilt_offset_db: 0,
      },
      baseF0Hz: 110,
    });
    expect(modal.baseline.source_mode).toBe(1);
    expect(modal.baseline.rd).toBe(0.7);
    expect(modal.baseline.rd_ref).toBe(0.7);
    expect(modal.voiceQualityOverrides).toBeUndefined();
    expect(modal.effectiveBaseF0Hz).toBe(110);

    const falsetto = resolveSourceContour({
      spec,
      requestedQuality: "falsetto",
      speaker: {
        base_f0_hz: 110,
        formant_scale: 1.0,
        rd_default: 0.7,
        spectral_tilt_offset_db: 0,
      },
      baseF0Hz: 110,
    });
    expect(falsetto.baseline.source_mode).toBe(1);
    expect(falsetto.voiceQualityOverrides?.rd).toBe(2.5);
    expect(falsetto.voiceQualityOverrides?.flutter).toBe(50);
    expect(falsetto.effectiveBaseF0Hz).toBe(165);
  });

  it("records the selected source contour in provenance", () => {
    const provenance = createProvenanceCollector();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      textToKlattTrackDetailed("hello world.", 110, 30, {
        provenance,
        voiceQuality: "breathy",
      });
    } finally {
      warnSpy.mockRestore();
    }

    const decision = provenance.getDecisions().find((entry) => entry.type === "source_contour_selected");
    expect(decision).toBeDefined();
    expect(decision?.stage).toBe("frontend");
    expect(decision?.citations).toContain(DEFAULT_SOURCE_CONTOUR_PATH);
    expect(decision?.reason).toContain("preset=breathy");
    expect(decision?.reason).toContain("source_mode=1");
  });
});
