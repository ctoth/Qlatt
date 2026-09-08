import { describe, expect, it } from "vitest";
import { deriveFormants, scaleGeometry } from "../scripts/area-formants";
import { resolveSpeakerProfile } from "../src/speaker-profile";

// Analytic closed/open uniform tube, Fant 1960 Eq. A.33-7.
const tube = { areas_cm2: Array(44).fill(4), section_length_cm: 17.5 / 44, pharynx_fraction: 0.4 };
const model = { sound_speed_cm_s: 35000, attenuation_neper: 0.007, lip_end_correction: 0 };

describe("offline wave-reflection formants", () => {
  it("matches the independent equal-length two-tube resonance equation", () => {
    // Continuity gives tan(kL)^2 = A_lips/A_glottis. Near-zero loss isolates
    // junction signs from the damping model; uniform tubes cannot expose this bug.
    const result = deriveFormants(
      [
        { area_cm2: 1, length_cm: 8.75 },
        { area_cm2: 4, length_cm: 8.75 },
      ],
      { ...model, attenuation_neper: 1e-8 },
    );
    const theta = Math.atan(2);
    const phases = [theta, Math.PI - theta, Math.PI + theta, 2 * Math.PI - theta];
    result.forEach((formant, index) => {
      expect(formant.frequency_hz).toBeCloseTo((phases[index] * 35000) / (2 * Math.PI * 8.75), 0);
    });
  });
  it("recovers four quarter-wave resonances and the analytic lossy-tube bandwidth", () => {
    const result = deriveFormants(scaleGeometry(tube, resolveSpeakerProfile({})), model);
    result.forEach((resonance, index) => {
      expect(resonance.frequency_hz).toBeCloseTo((2 * index + 1) * 500, 0);
      // Fant's pole damping convention B = alpha*c/pi.
      const alpha = 0.007 * Math.sqrt(Math.PI / 4);
      const bandwidth = (35000 * alpha) / Math.PI;
      expect(resonance.bandwidth_hz).toBeCloseTo(bandwidth, 0);
    });
  });

  it("scales geometry before deriving frequencies, including separate regional volume factors", () => {
    const neutral = resolveSpeakerProfile({});
    expect(neutral).toMatchObject({ tract_length_scale: 1, pharynx_scale: 1, mouth_scale: 1 });
    const baseline = deriveFormants(scaleGeometry(tube, neutral), model);
    const shorter = deriveFormants(
      scaleGeometry(tube, { ...neutral, tract_length_scale: 0.8 }),
      model,
    );
    shorter.forEach((formant, index) => {
      expect(formant.frequency_hz / baseline[index].frequency_hz).toBeCloseTo(1.25, 3);
    });
    const regional = scaleGeometry(tube, { ...neutral, pharynx_scale: 0.65, mouth_scale: 0.95 });
    expect(regional[0].area_cm2).toBeCloseTo(4 * 0.65 ** 2);
    expect(regional.at(-1)?.area_cm2).toBeCloseTo(4 * 0.95 ** 2);
    expect(regional.reduce((sum, section) => sum + section.length_cm, 0)).toBeCloseTo(
      17.5 * (0.4 * 0.65 + 0.6 * 0.95),
    );
    expect(deriveFormants(regional, model)[0].frequency_hz).not.toBeCloseTo(
      baseline[0].frequency_hz,
      0,
    );
  });

  it.each([0, -1, NaN, Infinity])("rejects invalid geometry or scaling (%s)", (value) => {
    expect(() => scaleGeometry({ ...tube, areas_cm2: [value] }, resolveSpeakerProfile({}))).toThrow(
      /area/i,
    );
    expect(() =>
      scaleGeometry(tube, { tract_length_scale: value, pharynx_scale: 1, mouth_scale: 1 }),
    ).toThrow(/scale/i);
  });
});
