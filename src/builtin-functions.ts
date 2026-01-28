/**
 * Builtin Functions - Single Source of Truth
 *
 * Common synthesizer math functions (dB conversion, proximity correction, etc.)
 * These are generic utilities used across different synthesizer implementations.
 * Other modules should import from this file.
 */

// ndbCor correction values for proximity calculation
export const ndbCor = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

// ndbScale values (from klatt-synth.js _applyKlattParams)
// Source amplitude scale factors (PARCOE.FOR lines 51-53: NDBSCA)
// AV, AH, AF, AVS are offset by -47 to compensate for G0 default of 47
// This keeps default output level while making G0 functional as overall gain control
export const ndbScale: Record<string, number> = {
  AV: -119,   // -72 - 47: compensates for G0 addition
  AVS: -91,   // -44 - 47: compensates for G0 addition
  // AH: Klatt 80 uses -102 (aspiration 30 dB quieter than voicing).
  // Our input AH values are ~15 dB lower than Klatt 80 (max ~40 vs ~55),
  // so we use -87 to maintain the same output amplitude relationship.
  // After G0 compensation: -87 - 47 = -134
  AH: -134,   // -87 - 47: compensates for G0 addition
  AF: -119,   // -72 - 47: compensates for G0 addition
  A1: -58,
  A2: -65,
  A3: -73,
  A4: -78,
  A5: -79,
  A6: -80,
  AB: -84,
  AN: -58,
};

// klsyn88 amptable (parwvt.h): DBtoLIN(dB) = amptable[dB] * 0.001
export const klsynAmpTable = [
  0, 0, 0, 0, 0,
  0, 0, 0, 0, 0,
  0, 0, 0, 6, 7,
  8, 9, 10, 11, 13,
  14, 16, 18, 20, 22,
  25, 28, 32, 35, 40,
  45, 51, 57, 64, 71,
  80, 90, 101, 114, 128,
  142, 159, 179, 202, 227,
  256, 284, 318, 359, 405,
  455, 512, 568, 638, 719,
  811, 911, 1024, 1137, 1276,
  1438, 1622, 1823, 2048, 2273,
  2552, 2875, 3244, 3645, 4096,
  4547, 5104, 5751, 6488, 7291,
  8192, 9093, 10207, 11502, 12976,
  14582, 16384, 18350, 20644, 23429,
  26214, 29491, 32767,
];

/**
 * Convert dB to linear amplitude (Klatt convention)
 * Uses 6 dB per doubling (power ratio)
 */
export function dbToLinear(db: number): number {
  if (!Number.isFinite(db) || db <= -72) return 0;
  return Math.pow(2, Math.min(96, db) / 6);
}

/**
 * Convert dB to linear amplitude (klsyn88 amptable)
 */
export function dbToLinearKlsyn(db: number): number {
  if (!Number.isFinite(db) || db < 0) return 0;
  const index = Math.max(0, Math.min(Math.floor(db), klsynAmpTable.length - 1));
  return klsynAmpTable[index] * 0.001;
}

/**
 * Proximity correction for formant amplitude
 * Compensates for spectral tilt when formants are close together
 */
export function proximity(delta: number): number {
  if (!Number.isFinite(delta) || delta < 50 || delta >= 550) return 0;
  const index = Math.floor(delta / 50) - 1;
  return ndbCor[Math.max(0, Math.min(index, ndbCor.length - 1))];
}

// Re-export Math functions for CEL/expression compatibility
export const min = Math.min;
export const max = Math.max;
export const pow = Math.pow;
