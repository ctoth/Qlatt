/**
 * Klatt Math Functions - Single Source of Truth
 *
 * All Klatt-specific math functions consolidated here.
 * Other modules should import from this file.
 */

// ndbCor correction values for proximity calculation
export const ndbCor = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

// ndbScale values WITH G0 compensation (from semantics.yaml)
// These are the floor values for dB parameters before dbToLinear conversion
export const ndbScale: Record<string, number> = {
  AV: -119,   // -72 base + -47 G0 compensation
  AVS: -91,   // -44 base + -47 G0 compensation
  AH: -134,   // -72 base + -62 G0 compensation (different for aspiration)
  AF: -119,   // -72 base + -47 G0 compensation
  A1: -72,
  A2: -72,
  A3: -72,
  A4: -72,
  A5: -72,
  A6: -72,
  AB: -72,
  AN: -72,
};

/**
 * Convert dB to linear amplitude (Klatt convention)
 * Uses 6 dB per doubling (power ratio)
 */
export function dbToLinear(db: number): number {
  if (!Number.isFinite(db) || db <= -72) return 0;
  return Math.pow(2, Math.min(96, db) / 6);
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
