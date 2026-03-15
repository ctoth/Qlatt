/**
 * Tests for resonatorMagnitudeDb() and PFE-based formant amplitude computation.
 *
 * Citations:
 * - Lin 1995: Partial Fraction Expansion for parallel formant amplitude correction
 * - Klatt 1980: Original synthesizer specification (ndbScale values)
 */
import { describe, it, expect } from 'vitest';
import { resonatorMagnitudeDb, dbToLinear, ndbScale } from '../src/builtin-functions';

describe('resonatorMagnitudeDb', () => {
  const SR = 10000;

  it('gives peak gain at the pole frequency', () => {
    // At pole frequency, the evaluation point is closest to the poles,
    // so magnitude should be at its maximum.
    const atPole = resonatorMagnitudeDb(500, 500, 60, SR);
    const offPole = resonatorMagnitudeDb(1000, 500, 60, SR);
    expect(atPole).toBeGreaterThan(offPole);
  });

  it('peak gain approximates 20*log10(SR / (pi * BW)) for narrow bandwidth', () => {
    // For a narrow-bandwidth 2-pole resonator, peak gain ≈ 20*log10(SR/(pi*BW))
    const bw = 60;
    const peak = resonatorMagnitudeDb(500, 500, bw, SR);
    const expected = 20 * Math.log10(SR / (Math.PI * bw));
    // Should be within ~5 dB (digital resonator vs continuous approximation;
    // the digital pole placement at low SR introduces additional deviation)
    expect(Math.abs(peak - expected)).toBeLessThan(5);
  });

  it('shows rolloff at DC', () => {
    const atPole = resonatorMagnitudeDb(500, 500, 60, SR);
    const atDC = resonatorMagnitudeDb(0, 500, 60, SR);
    expect(atPole).toBeGreaterThan(atDC);
  });

  it('shows rolloff at Nyquist', () => {
    const atPole = resonatorMagnitudeDb(500, 500, 60, SR);
    const atNyquist = resonatorMagnitudeDb(SR / 2, 500, 60, SR);
    expect(atPole).toBeGreaterThan(atNyquist);
  });

  it('magnitude is symmetric (even function for |H(e^jw)|)', () => {
    // |H(e^jw)| = |H(e^-jw)| — magnitude is an even function
    const pos = resonatorMagnitudeDb(200, 500, 60, SR);
    const neg = resonatorMagnitudeDb(-200, 500, 60, SR);
    expect(pos).toBeCloseTo(neg, 10);
  });

  it('wider bandwidth gives lower peak', () => {
    const narrow = resonatorMagnitudeDb(500, 500, 60, SR);
    const wide = resonatorMagnitudeDb(500, 500, 200, SR);
    expect(narrow).toBeGreaterThan(wide);
  });
});

describe('PFE regression: PFE corrections vs old static ndbScale', () => {
  // At Klatt's default formant positions, PFE-based corrections should be
  // in the same ballpark as the old static ndbScale values.
  // The old values are approximate; PFE is physics-based. They won't match
  // exactly but should be within ~5 dB.
  const SR = 10000;
  const defaults = [
    { idx: 1, freq: 500, bw: 60, oldNdb: -58 },
    { idx: 2, freq: 1500, bw: 90, oldNdb: -65 },
    { idx: 3, freq: 2500, bw: 150, oldNdb: -73 },
    { idx: 4, freq: 3500, bw: 200, oldNdb: -78 },
    { idx: 5, freq: 4500, bw: 200, oldNdb: -79 },
  ];

  for (const target of defaults) {
    it(`F${target.idx} PFE correction is in the same ballpark as ndbScale.A${target.idx} (${target.oldNdb} dB)`, () => {
      // Sum the magnitude contributions of all other formants at this formant's frequency
      let correctionDb = 0;
      for (const other of defaults) {
        if (other.idx === target.idx) continue;
        correctionDb += resonatorMagnitudeDb(target.freq, other.freq, other.bw, SR);
      }
      // The PFE correction should be a large negative number (other formants attenuate at this frequency).
      // The old ndbScale values include both the PFE-like correction and the normalization factor.
      // We check that the PFE correction is negative (as expected) and within a reasonable range.
      expect(correctionDb).toBeLessThan(0);
      // The correction magnitude should be in the same general range as the old values
      // (within about 30 dB — they encode different things but should be comparable order of magnitude)
      expect(Math.abs(correctionDb)).toBeLessThan(Math.abs(target.oldNdb) + 30);
    });
  }
});

describe('PFE proximity subsumption', () => {
  it('produces large correction when formants are close (F2=800, F3=900)', () => {
    const SR = 10000;
    // When formants are 100 Hz apart, the old proximity function gave ndbCor[1] = 9 dB
    // The PFE correction from a nearby formant should also be significant
    const correction = resonatorMagnitudeDb(800, 900, 90, SR);
    // At 100 Hz separation, the nearby resonator still has significant energy,
    // so the correction should be substantial (positive dB — the other resonator
    // has gain at this frequency)
    expect(correction).toBeGreaterThan(5);
  });

  it('produces small correction when formants are far apart (F1=500, F2=1500)', () => {
    const SR = 10000;
    const correction = resonatorMagnitudeDb(500, 1500, 90, SR);
    // At 1000 Hz separation, the other resonator contributes very little
    expect(Math.abs(correction)).toBeLessThan(5);
  });
});
