import { describe, it, expect } from 'vitest';
import { dbToLinear, bwToQ } from './klatt-synth.js'; // Corrected path

describe('Klatt Synth Helper Functions', () => {
  describe('dbToLinear', () => {
    it('converts dB values to linear amplitude correctly', () => {
      // Test standard conversions
      expect(dbToLinear(0)).toBeCloseTo(1.0);
      expect(dbToLinear(6)).toBeCloseTo(2.0);
      expect(dbToLinear(-6)).toBeCloseTo(0.5);
      expect(dbToLinear(20)).toBeCloseTo(10.0);
      expect(dbToLinear(-20)).toBeCloseTo(0.1);
    });

    it('returns 0 for very low dB values', () => {
      expect(dbToLinear(-70)).toBe(0);
      expect(dbToLinear(-80)).toBe(0);
      expect(dbToLinear(-Infinity)).toBe(0);
    });
  });

  describe('bwToQ', () => {
    it('calculates Q factor from frequency and bandwidth correctly', () => {
      expect(bwToQ(1000, 100)).toBeCloseTo(10);
      expect(bwToQ(500, 50)).toBeCloseTo(10);
      expect(bwToQ(1000, 200)).toBeCloseTo(5);
    });

    it('handles edge cases gracefully', () => {
      // Default Q for invalid inputs
      expect(bwToQ(0, 100)).toBeCloseTo(0.707);
      expect(bwToQ(100, 0)).toBeCloseTo(0.707);
      expect(bwToQ(-100, 50)).toBeCloseTo(0.707);
    });
  });
});
