import { describe, expect, it } from "vitest";
import { getIncompressibleMin } from "../src/declarative-frontend/engine";

/**
 * Tests for incompressible duration ratio configuration.
 *
 * The incompressible minimum duration is a floor below which duration compression
 * cannot reduce a segment. It is computed as inherentDuration * ratio, where the
 * ratio differs for vowels (0.42) and consonants (0.6).
 *
 * Citations:
 * - Klatt 1976 Eq. 1 (MINDUR = 0.42 * inherent duration as compressibility floor)
 * - Engineering estimate: consonants have higher incompressibility floor than vowels
 */

describe("getIncompressibleMin", () => {
  describe("default behavior (no runtime params)", () => {
    it("returns inherent * 0.42 for vowel tokens", () => {
      const vowelToken = { type: "vowel", phoneme: "AH" };
      const result = getIncompressibleMin(vowelToken, 100);
      expect(result).toBeCloseTo(42, 5);
    });

    it("returns inherent * 0.6 for consonant tokens", () => {
      const consonantToken = { type: "stop_closure", phoneme: "T_CL" };
      const result = getIncompressibleMin(consonantToken, 100);
      expect(result).toBeCloseTo(60, 5);
    });

    it("returns 0 for non-finite inherent duration", () => {
      const token = { type: "vowel", phoneme: "AH" };
      expect(getIncompressibleMin(token, NaN)).toBe(0);
      expect(getIncompressibleMin(token, Infinity)).toBe(0);
      expect(getIncompressibleMin(token, -10)).toBe(0);
    });

    it("returns 0 for null/undefined token", () => {
      // null token is treated as non-vowel (consonant ratio 0.6)
      expect(getIncompressibleMin(null, 100)).toBeCloseTo(60, 5);
      expect(getIncompressibleMin(undefined, 100)).toBeCloseTo(60, 5);
    });
  });

  describe("with runtime policy parameters", () => {
    it("reads vowel ratio from policy params when provided", () => {
      const vowelToken = { type: "vowel", phoneme: "AH" };
      const runtimeParams = {
        policy: {
          duration: {
            incompressibility_ratio_vowel: 0.5,
            incompressibility_ratio_consonant: 0.7,
          },
        },
      };
      const result = getIncompressibleMin(vowelToken, 100, runtimeParams);
      expect(result).toBeCloseTo(50, 5);
    });

    it("reads consonant ratio from policy params when provided", () => {
      const consonantToken = { type: "fricative", phoneme: "S" };
      const runtimeParams = {
        policy: {
          duration: {
            incompressibility_ratio_vowel: 0.5,
            incompressibility_ratio_consonant: 0.7,
          },
        },
      };
      const result = getIncompressibleMin(consonantToken, 100, runtimeParams);
      expect(result).toBeCloseTo(70, 5);
    });

    it("falls back to defaults when policy params are missing", () => {
      const vowelToken = { type: "vowel", phoneme: "AH" };
      const emptyParams = { policy: { duration: {} } };
      expect(getIncompressibleMin(vowelToken, 100, emptyParams)).toBeCloseTo(42, 5);
    });

    it("falls back to defaults when params is null", () => {
      const vowelToken = { type: "vowel", phoneme: "AH" };
      expect(getIncompressibleMin(vowelToken, 100, null)).toBeCloseTo(42, 5);
    });
  });
});
