/**
 * Builtin Functions - Single Source of Truth
 *
 * Common synthesizer math functions (dB conversion, proximity correction, etc.)
 * These are generic utilities used across different synthesizer implementations.
 * Other modules should import from this file.
 *
 * Klatt amplitude tables (ndbCor, ndbScale, klsynAmpTable) are loaded from
 * public/experiments/klatt80-baseline/semantics.yaml at module load time.
 * There is no TS-side fallback — a missing YAML constant is a build error.
 */

import { loadYamlDocumentSync } from "./yaml-loader";

const KLATT_AMPS_YAML_PATH =
  "/experiments/klatt80-baseline/semantics.yaml";

interface KlattAmpsDocument {
  constants?: {
    ndbCor?: unknown;
    ndbScale?: unknown;
    klsynAmpTable?: unknown;
  };
}

function requireNumberArray(value: unknown, label: string): number[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `E_KLATT_AMP_TABLE_MISSING: '${label}' is not an array in ${KLATT_AMPS_YAML_PATH}`,
    );
  }
  return value.map((entry, index) => {
    if (typeof entry !== "number" || !Number.isFinite(entry)) {
      throw new Error(
        `E_KLATT_AMP_TABLE_INVALID: '${label}[${index}]' is not a finite number in ${KLATT_AMPS_YAML_PATH}`,
      );
    }
    return entry;
  });
}

function requireNumberMap(
  value: unknown,
  label: string,
): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      `E_KLATT_AMP_TABLE_MISSING: '${label}' is not a map in ${KLATT_AMPS_YAML_PATH}`,
    );
  }
  const out: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry !== "number" || !Number.isFinite(entry)) {
      throw new Error(
        `E_KLATT_AMP_TABLE_INVALID: '${label}.${key}' is not a finite number in ${KLATT_AMPS_YAML_PATH}`,
      );
    }
    out[key] = entry;
  }
  return out;
}

function loadKlattAmpTables(): {
  ndbCor: number[];
  ndbScale: Record<string, number>;
  klsynAmpTable: number[];
} {
  const doc = loadYamlDocumentSync<KlattAmpsDocument>(KLATT_AMPS_YAML_PATH);
  const constants = doc.constants;
  if (!constants) {
    throw new Error(
      `E_KLATT_AMP_TABLE_MISSING: 'constants' block missing in ${KLATT_AMPS_YAML_PATH}`,
    );
  }
  return {
    ndbCor: requireNumberArray(constants.ndbCor, "constants.ndbCor"),
    ndbScale: requireNumberMap(constants.ndbScale, "constants.ndbScale"),
    klsynAmpTable: requireNumberArray(
      constants.klsynAmpTable,
      "constants.klsynAmpTable",
    ),
  };
}

const klattAmpTables = loadKlattAmpTables();

/**
 * ndbCor correction values for proximity calculation.
 * Loaded from semantics.yaml constants.ndbCor.
 * Source: Klatt 1980 PARCOE.FOR NDBCOR table.
 */
export const ndbCor: number[] = klattAmpTables.ndbCor;

/**
 * ndbScale source amplitude scale factors keyed by Klatt parameter name.
 * Loaded from semantics.yaml constants.ndbScale.
 * Source: Klatt 1980 PARCOE.FOR NDBSCA (with G0 compensation offset).
 */
export const ndbScale: Record<string, number> = klattAmpTables.ndbScale;

/**
 * klsyn88 amplitude lookup table — DBtoLIN(dB) = klsynAmpTable[dB] * 0.001.
 * Loaded from semantics.yaml constants.klsynAmpTable.
 * Source: klsyn88 parwvt.h.
 */
export const klsynAmpTable: number[] = klattAmpTables.klsynAmpTable;

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
  evalFreq: number, poleFreq: number, poleBW: number, sampleRate: number
): number {
  // Digital resonator pole: r * exp(±j*theta) where
  //   theta = 2*pi*poleFreq/sampleRate
  //   r = exp(-pi*poleBW/sampleRate)
  const theta = 2 * Math.PI * poleFreq / sampleRate;
  const r = Math.exp(-Math.PI * poleBW / sampleRate);
  // Evaluate H(z) = 1/((1 - r*e^jtheta * z^-1)(1 - r*e^-jtheta * z^-1))
  // at z = e^(j*2*pi*evalFreq/sampleRate)
  const w = 2 * Math.PI * evalFreq / sampleRate;
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
export function builtinSqrt(x: number): number { return Math.sqrt(x); }
export function builtinExp(x: number): number { return Math.exp(x); }
export function builtinAbs(x: number): number { return Math.abs(x); }
export function builtinLog(x: number): number { return Math.log(x); }
