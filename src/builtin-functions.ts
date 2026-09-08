/**
 * Builtin Functions - Single Source of Truth
 *
 * Common synthesizer math functions (dB conversion, proximity correction, etc.)
 * These are generic utilities used across different synthesizer implementations.
 * Other modules should import from this file.
 *
 * Klatt amplitude tables are defined here with their sources so importing these
 * utilities requires no experiment configuration or I/O.
 */

const klattAmpTables = {
  // Klatt 1980 PARCOE.FOR GETAMP: conversion domain and 6 dB per doubling.
  dbFloorDb: -72,
  dbCeilingDb: 96,
  dbPerDoubling: 6,
  // Klatt 1980 PARCOE.FOR NDBCOR: 50 Hz bins over [50, 550) Hz.
  ndbCorBinHz: 50,
  ndbCorMinHz: 50,
  ndbCorMaxHz: 550,
  // klsyn88 parwvt.h: DBtoLIN(dB) = amptable[dB] * 0.001.
  klsynAmpScale: 0.001,
};

/**
 * ndbCor correction values for proximity calculation.
 * Source: Klatt 1980 PARCOE.FOR NDBCOR table.
 */
export const ndbCor: number[] = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

/**
 * ndbScale source amplitude scale factors keyed by Klatt parameter name.
 * Source: Klatt 1980 PARCOE.FOR NDBSCA, with Qlatt's -47 dB G0 compensation.
 * AH uses -87 before compensation (engineering estimate matching Qlatt's
 * lower aspiration inputs); A7-A10 are engineering extensions of the table.
 */
export const ndbScale: Record<string, number> = {
  AV: -119,
  AH: -134,
  AF: -119,
  AVS: -91,
  A1: -58,
  A2: -65,
  A3: -73,
  A4: -78,
  A5: -79,
  A6: -80,
  A7: -81,
  A8: -82,
  A9: -83,
  A10: -84,
  AN: -58,
  AB: -84,
};

/**
 * klsyn88 amplitude lookup table — DBtoLIN(dB) = klsynAmpTable[dB] * 0.001.
 * Source: klsyn88 parwvt.h.
 */
export const klsynAmpTable: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22, 25, 28, 32, 35,
  40, 45, 51, 57, 64, 71, 80, 90, 101, 114, 128, 142, 159, 179, 202, 227, 256, 284, 318, 359, 405,
  455, 512, 568, 638, 719, 811, 911, 1024, 1137, 1276, 1438, 1622, 1823, 2048, 2273, 2552, 2875,
  3244, 3645, 4096, 4547, 5104, 5751, 6488, 7291, 8192, 9093, 10207, 11502, 12976, 14582, 16384,
  18350, 20644, 23429, 26214, 29491, 32767,
];

/**
 * Convert dB to linear amplitude (Klatt convention)
 * Uses 6 dB per doubling (power ratio)
 */
export function dbToLinear(db: number): number {
  if (!Number.isFinite(db) || db <= klattAmpTables.dbFloorDb) return 0;
  return 2 ** (Math.min(klattAmpTables.dbCeilingDb, db) / klattAmpTables.dbPerDoubling);
}

/**
 * Convert dB to linear amplitude (klsyn88 amptable)
 */
export function dbToLinearKlsyn(db: number): number {
  if (!Number.isFinite(db) || db < 0) return 0;
  const index = Math.max(0, Math.min(Math.floor(db), klsynAmpTable.length - 1));
  return klsynAmpTable[index] * klattAmpTables.klsynAmpScale;
}

/**
 * Proximity correction for formant amplitude
 * Compensates for spectral tilt when formants are close together
 */
export function proximity(delta: number): number {
  if (
    !Number.isFinite(delta) ||
    delta < klattAmpTables.ndbCorMinHz ||
    delta >= klattAmpTables.ndbCorMaxHz
  ) {
    return 0;
  }
  const index = Math.floor((delta - klattAmpTables.ndbCorMinHz) / klattAmpTables.ndbCorBinHz);
  return ndbCor[Math.max(0, Math.min(index, ndbCor.length - 1))];
}

/**
 * Compute the magnitude (in dB) of a 2-pole resonator at a given evaluation frequency.
 * Used for PFE-based parallel formant amplitude correction (Lin 1995).
 *
 * @param evalFreq - frequency to evaluate at (Hz)
 * @param poleFreq - resonator center frequency (Hz)
 * @param poleBW - resonator bandwidth (Hz)
 * @param sampleRate - sample rate (Hz)
 * @returns magnitude in dB
 */
export function resonatorMagnitudeDb(
  evalFreq: number,
  poleFreq: number,
  poleBW: number,
  sampleRate: number,
): number {
  // Digital resonator pole: r * exp(±j*theta) where
  //   theta = 2*pi*poleFreq/sampleRate
  //   r = exp(-pi*poleBW/sampleRate)
  const theta = (2 * Math.PI * poleFreq) / sampleRate;
  const r = Math.exp((-Math.PI * poleBW) / sampleRate);
  // Evaluate H(z) = 1/((1 - r*e^jtheta * z^-1)(1 - r*e^-jtheta * z^-1))
  // at z = e^(j*2*pi*evalFreq/sampleRate)
  const w = (2 * Math.PI * evalFreq) / sampleRate;
  // Compute distances from e^jw to each pole on the unit circle
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  // Distance from e^jw to r*e^jtheta
  const dx1 = cosW - r * cosTheta;
  const dy1 = sinW - r * sinTheta;
  const d1sq = dx1 * dx1 + dy1 * dy1;
  // Distance from e^jw to r*e^-jtheta (conjugate pole)
  const dx2 = cosW - r * cosTheta;
  const dy2 = sinW + r * sinTheta;
  const d2sq = dx2 * dx2 + dy2 * dy2;
  // Magnitude squared = 1 / (d1sq * d2sq)
  const magSq = 1 / (d1sq * d2sq);
  return 10 * Math.log10(magSq);
}

// Re-export Math functions for CEL/expression compatibility
export const min = Math.min;
export const max = Math.max;
export const pow = Math.pow;

// Math builtins for bandwidth decomposition formulas (Fant 1960)
export function builtinSqrt(x: number): number {
  return Math.sqrt(x);
}
export function builtinExp(x: number): number {
  return Math.exp(x);
}
export function builtinAbs(x: number): number {
  return Math.abs(x);
}
export function builtinLog(x: number): number {
  return Math.log(x);
}
