/**
 * STOI / ESTOI — Short-Time Objective Intelligibility measure.
 *
 * Ported from pystoi (https://github.com/mpariente/pystoi).
 *
 * References:
 *   [1] C.H. Taal et al., "An Algorithm for Intelligibility Prediction of
 *       Time-Frequency Weighted Noisy Speech", IEEE Trans. ASLP, 2011.
 *   [2] J. Jensen & C.H. Taal, "An Algorithm for Predicting the
 *       Intelligibility of Speech Masked by Modulated Noise Maskers",
 *       IEEE/ACM Trans. ASLP, 2016.
 */

// Use default import for CJS module fft.js
import FFT from "fft.js";
import type { Diagnostics } from "../diagnostics";

// ── Constants (Taal 2011, Table I) ──────────────────────────────────────────
const FS = 10_000; // target sample rate (Hz)
const N_FRAME = 256; // analysis window length (samples)
const NFFT = 512; // FFT size
const NUMBAND = 15; // number of 1/3-octave bands
const MINFREQ = 150; // center freq of lowest band (Hz)
const N = 30; // segment length in frames (~384 ms)
const BETA = -15; // SDR floor (dB) — Taal 2011 Eq. 3
const DYN_RANGE = 40; // silence threshold (dB)
const EPS = Number.EPSILON; // ~2.22e-16, matching numpy float64

// ── Public API ──────────────────────────────────────────────────────────────

export interface StoiResult {
  /** Intelligibility index d, approximately in [0, 1]. */
  score: number;
  /** True when ESTOI was computed (Jensen & Taal 2016). */
  extended: boolean;
}

export interface StoiOptions {
  /** Compute ESTOI instead of STOI. Default false. */
  extended?: boolean;
  /** Optional diagnostics sink. */
  diagnostics?: Diagnostics;
}

/**
 * Compute the (E)STOI intelligibility index between a clean reference
 * signal and a degraded signal.
 *
 * @param clean   Clean reference signal (mono, any sample rate).
 * @param degraded Degraded/processed signal (same length & sample rate).
 * @param sampleRate Sample rate of both signals (Hz).
 * @param options  Optional: {extended, diagnostics}.
 * @returns StoiResult with score and extended flag.
 *
 * Citation: Taal et al. 2011 Eq. 6, Jensen & Taal 2016 Eq. 5.
 */
export function stoi(
  clean: Float64Array,
  degraded: Float64Array,
  sampleRate: number,
  options: StoiOptions = {},
): StoiResult {
  const extended = options.extended ?? false;
  const diag = options.diagnostics;

  if (clean.length !== degraded.length) {
    diag?.error(`STOI: signal length mismatch: clean=${clean.length}, degraded=${degraded.length}`);
    throw new Error(
      `clean and degraded must have the same length, got ${clean.length} and ${degraded.length}`,
    );
  }

  let x = clean;
  let y = degraded;

  // 1. Resample to 10 kHz if necessary
  if (sampleRate !== FS) {
    diag?.info(`STOI: resampling from ${sampleRate} Hz to ${FS} Hz`);
    x = resampleOct(x, FS, sampleRate);
    y = resampleOct(y, FS, sampleRate);
  }

  // 2. Remove silent frames (Taal 2011 Section III-A)
  const beforeLen = x.length;
  [x, y] = removeSilentFrames(x, y, DYN_RANGE, N_FRAME, N_FRAME >> 1);
  diag?.info(`STOI: silence removal — ${beforeLen} → ${x.length} samples`);

  // 3. STFT — 256-sample Hann, hop=128, 512-point FFT
  // pystoi transposes to (freq, time), then we apply OBM
  const xSpec = stft(x, N_FRAME, NFFT, 2); // (T, NFFT/2+1) complex
  const ySpec = stft(y, N_FRAME, NFFT, 2);
  const T = xSpec.length; // number of time frames

  if (T < N) {
    diag?.warn(
      `STOI: only ${T} STFT frames after silence removal (need ${N}). Returning sentinel 1e-5.`,
    );
    return { score: 1e-5, extended };
  }

  // 4. Apply OBM → 1/3-octave band envelopes (Taal 2011 Eq. 1)
  const obm = thirdOctaveBandMatrix();
  const xTob = applyObm(obm, xSpec); // (NUMBAND, T)
  const yTob = applyObm(obm, ySpec);

  // 5. Extract N-frame segments → (S, NUMBAND, N)
  const S = T - N + 1; // number of segments
  const xSegs = extractSegments(xTob, N); // S × NUMBAND × N
  const ySegs = extractSegments(yTob, N);

  let score: number;
  if (extended) {
    // ── ESTOI path (Jensen & Taal 2016) ──────────────────────────────
    const xNorm = rowColNormalize(xSegs, S);
    const yNorm = rowColNormalize(ySegs, S);
    // d = (1/N) * sum(xNorm .* yNorm) / S  — Jensen 2016 Eq. 5
    let total = 0;
    for (let s = 0; s < S; s++) {
      for (let j = 0; j < NUMBAND; j++) {
        for (let n = 0; n < N; n++) {
          total += xNorm[s][j * N + n] * yNorm[s][j * N + n];
        }
      }
    }
    score = total / N / S;
  } else {
    // ── STOI path (Taal 2011 Eq. 3–6) ───────────────────────────────
    const clipValue = 10 ** (-BETA / 20); // = 10^(15/20) ≈ 5.623

    let corrSum = 0;
    for (let s = 0; s < S; s++) {
      for (let j = 0; j < NUMBAND; j++) {
        const xOff = j * N;

        // Compute norms
        let xNorm2 = 0;
        let yNorm2 = 0;
        for (let n = 0; n < N; n++) {
          xNorm2 += xSegs[s][xOff + n] ** 2;
          yNorm2 += ySegs[s][xOff + n] ** 2;
        }
        const alpha = Math.sqrt(xNorm2) / (Math.sqrt(yNorm2) + EPS);

        // Normalize and clip — Taal 2011 Eq. 3
        const yPrime = new Float64Array(N);
        for (let n = 0; n < N; n++) {
          const normalized = alpha * ySegs[s][xOff + n];
          const ceil = xSegs[s][xOff + n] * (1 + clipValue);
          yPrime[n] = Math.min(normalized, ceil);
        }

        // Pearson correlation — Taal 2011 Eq. 5
        let xMean = 0;
        let yMean = 0;
        for (let n = 0; n < N; n++) {
          xMean += xSegs[s][xOff + n];
          yMean += yPrime[n];
        }
        xMean /= N;
        yMean /= N;

        let xVar = 0;
        let yVar = 0;
        let cov = 0;
        for (let n = 0; n < N; n++) {
          const dx = xSegs[s][xOff + n] - xMean;
          const dy = yPrime[n] - yMean;
          xVar += dx * dx;
          yVar += dy * dy;
          cov += dx * dy;
        }
        corrSum += cov / (Math.sqrt(xVar) * Math.sqrt(yVar) + EPS);
      }
    }
    // Taal 2011 Eq. 6: d = (1 / (J * M)) Σ d_jm
    score = corrSum / (NUMBAND * S);
  }

  diag?.info(`STOI${extended ? " (extended)" : ""}: score = ${score.toFixed(6)}`);
  return { score, extended };
}

// ── Internal helpers ────────────────────────────────────────────────────────

/**
 * Construct 15×257 binary third-octave band matrix.
 * Citation: Taal 2011 Eq. 1 / pystoi utils.thirdoct().
 */
export function thirdOctaveBandMatrix(): Float64Array[] {
  const freqBins = NFFT / 2 + 1; // 257
  const f = new Float64Array(freqBins);
  for (let i = 0; i < freqBins; i++) {
    f[i] = (i * FS) / NFFT; // 0, 19.53, 39.06, ...
  }

  const obm: Float64Array[] = [];
  for (let band = 0; band < NUMBAND; band++) {
    const _cf = MINFREQ * 2 ** (band / 3);
    const freqLow = MINFREQ * 2 ** ((2 * band - 1) / 6);
    const freqHigh = MINFREQ * 2 ** ((2 * band + 1) / 6);

    // Snap to nearest FFT bin
    let flIdx = 0;
    let fhIdx = 0;
    let minDistLow = Infinity;
    let minDistHigh = Infinity;
    for (let i = 0; i < freqBins; i++) {
      const dLow = (f[i] - freqLow) ** 2;
      const dHigh = (f[i] - freqHigh) ** 2;
      if (dLow < minDistLow) {
        minDistLow = dLow;
        flIdx = i;
      }
      if (dHigh < minDistHigh) {
        minDistHigh = dHigh;
        fhIdx = i;
      }
    }

    const row = new Float64Array(freqBins);
    for (let i = flIdx; i < fhIdx; i++) {
      row[i] = 1;
    }
    obm.push(row);
  }
  return obm;
}

/**
 * Hanning window matching MATLAB/Octave convention: hanning(N+2)[1:-1].
 * Citation: pystoi utils.stft().
 */
export function hanningWindow(size: number): Float64Array {
  // np.hanning(size+2)[1:-1] — excludes the zero endpoints
  const w = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * (i + 1)) / (size + 1)));
  }
  return w;
}

/**
 * Short-time Fourier transform for real 1-D signals.
 * Returns array of (NFFT/2+1)-length Float64Array pairs: magnitude spectrum per frame.
 * Actually returns complex arrays as [re, im, re, im, ...] interleaved, but we
 * only need |X(k)|^2, so we store (NFFT/2+1) power values per frame.
 *
 * For STOI we need complex spectra → |X(k,m)|^2 for OBM application.
 * We return an array of Float64Array where each entry holds |X(k)|^2 for bins 0..NFFT/2.
 *
 * Citation: pystoi utils.stft().
 */
export function stft(
  x: Float64Array,
  winSize: number,
  fftSize: number,
  overlap: number,
): Float64Array[] {
  const hop = Math.floor(winSize / overlap);
  const w = hanningWindow(winSize);
  const fft = new FFT(fftSize);
  const freqBins = fftSize / 2 + 1;
  const frames: Float64Array[] = [];

  // Windowed frame buffer, zero-padded to fftSize
  const input = new Float64Array(fftSize);
  // fft.js realTransform output: interleaved complex, length = fftSize (only first fftSize/2+1 bins valid)
  const complexOut = fft.createComplexArray();

  for (let i = 0; i <= x.length - winSize; i += hop) {
    // Window and zero-pad
    input.fill(0);
    for (let k = 0; k < winSize; k++) {
      input[k] = w[k] * x[i + k];
    }

    fft.realTransform(complexOut, input);
    fft.completeSpectrum(complexOut);

    // Extract power spectrum |X(k)|^2
    const power = new Float64Array(freqBins);
    for (let k = 0; k < freqBins; k++) {
      const re = complexOut[2 * k];
      const im = complexOut[2 * k + 1];
      power[k] = re * re + im * im;
    }
    frames.push(power);
  }
  return frames;
}

/**
 * Apply the OBM matrix to power spectra to get 1/3-octave band envelopes.
 * Returns (NUMBAND, T) as array-of-rows, each row is Float64Array of length T.
 *
 * X_j(m) = sqrt( Σ_k OBM[j,k] * |X(k,m)|^2 )  — Taal 2011 Eq. 1
 */
function applyObm(obm: Float64Array[], powerSpectra: Float64Array[]): Float64Array[] {
  const T = powerSpectra.length;
  const result: Float64Array[] = [];
  for (let j = 0; j < NUMBAND; j++) {
    const row = new Float64Array(T);
    for (let m = 0; m < T; m++) {
      let sum = 0;
      for (let k = 0; k < obm[j].length; k++) {
        if (obm[j][k] > 0) {
          sum += powerSpectra[m][k];
        }
      }
      row[m] = Math.sqrt(sum);
    }
    result.push(row);
  }
  return result;
}

/**
 * Extract overlapping N-frame segments from band envelopes.
 * Input: (NUMBAND, T) as array of row Float64Arrays.
 * Output: S segments, each a flat Float64Array of size NUMBAND*N
 *         laid out as [band0_frame0..band0_frameN-1, band1_frame0..., ...]
 */
function extractSegments(tob: Float64Array[], segLen: number): Float64Array[] {
  const T = tob[0].length;
  const S = T - segLen + 1;
  const segments: Float64Array[] = [];
  for (let s = 0; s < S; s++) {
    const seg = new Float64Array(NUMBAND * segLen);
    for (let j = 0; j < NUMBAND; j++) {
      for (let n = 0; n < segLen; n++) {
        seg[j * segLen + n] = tob[j][s + n];
      }
    }
    segments.push(seg);
  }
  return segments;
}

/**
 * Row-and-column normalize segments for ESTOI.
 * Uses deterministic small perturbation (EPS * index-based offset) instead of
 * random noise for reproducibility.
 *
 * Citation: Jensen & Taal 2016 Section III-B / pystoi utils.row_col_normalize().
 */
function rowColNormalize(segments: Float64Array[], S: number): Float64Array[] {
  const result: Float64Array[] = [];
  for (let s = 0; s < S; s++) {
    // Work on a copy; layout: (NUMBAND rows, N cols), row-major
    const x = new Float64Array(segments[s]);

    // Add deterministic perturbation instead of random noise
    for (let i = 0; i < x.length; i++) {
      x[i] += EPS * (((i * 7 + 13) % 97) / 97); // deterministic, small
    }

    // Row normalization: for each band j (row), zero-mean then unit-norm
    for (let j = 0; j < NUMBAND; j++) {
      const off = j * N;
      let mean = 0;
      for (let n = 0; n < N; n++) mean += x[off + n];
      mean /= N;
      for (let n = 0; n < N; n++) x[off + n] -= mean;

      let norm2 = 0;
      for (let n = 0; n < N; n++) norm2 += x[off + n] ** 2;
      const invNorm = 1 / (Math.sqrt(norm2) + EPS);
      for (let n = 0; n < N; n++) x[off + n] *= invNorm;
    }

    // Add perturbation again before column normalization
    for (let i = 0; i < x.length; i++) {
      x[i] += EPS * (((i * 11 + 29) % 101) / 101);
    }

    // Column normalization: for each frame n (col), zero-mean then unit-norm
    for (let n = 0; n < N; n++) {
      let mean = 0;
      for (let j = 0; j < NUMBAND; j++) mean += x[j * N + n];
      mean /= NUMBAND;
      for (let j = 0; j < NUMBAND; j++) x[j * N + n] -= mean;

      let norm2 = 0;
      for (let j = 0; j < NUMBAND; j++) norm2 += x[j * N + n] ** 2;
      const invNorm = 1 / (Math.sqrt(norm2) + EPS);
      for (let j = 0; j < NUMBAND; j++) x[j * N + n] *= invNorm;
    }

    result.push(x);
  }
  return result;
}

/**
 * Remove silent frames from both signals based on clean signal energy.
 * A frame is silent if its energy is more than dynRange dB below the max.
 *
 * Citation: Taal 2011 Section III-A / pystoi utils.remove_silent_frames().
 */
export function removeSilentFrames(
  x: Float64Array,
  y: Float64Array,
  dynRange: number,
  frameLen: number,
  hop: number,
): [Float64Array, Float64Array] {
  const w = hanningWindow(frameLen);

  // Frame both signals
  const xFrames: Float64Array[] = [];
  const yFrames: Float64Array[] = [];
  for (let i = 0; i <= x.length - frameLen; i += hop) {
    const xf = new Float64Array(frameLen);
    const yf = new Float64Array(frameLen);
    for (let k = 0; k < frameLen; k++) {
      xf[k] = w[k] * x[i + k];
      yf[k] = w[k] * y[i + k];
    }
    xFrames.push(xf);
    yFrames.push(yf);
  }

  // Energy in dB for clean signal
  const energies = new Float64Array(xFrames.length);
  for (let i = 0; i < xFrames.length; i++) {
    let norm2 = 0;
    for (let k = 0; k < frameLen; k++) norm2 += xFrames[i][k] ** 2;
    energies[i] = 20 * Math.log10(Math.sqrt(norm2) + EPS);
  }

  // Mask: keep frames within dynRange of max
  const maxEnergy = energies.reduce((a, b) => Math.max(a, b), -Infinity);
  const mask: boolean[] = [];
  for (let i = 0; i < energies.length; i++) {
    mask.push(maxEnergy - dynRange - energies[i] < 0);
  }

  // Filter frames
  const xKept = xFrames.filter((_, i) => mask[i]);
  const yKept = yFrames.filter((_, i) => mask[i]);

  if (xKept.length === 0) {
    return [new Float64Array(0), new Float64Array(0)];
  }

  // Overlap-add reconstruction
  return [overlapAndAdd(xKept, hop), overlapAndAdd(yKept, hop)];
}

/**
 * Simple overlap-and-add reconstruction from windowed frames.
 * Citation: pystoi utils._overlap_and_add() (simplified loop version).
 */
export function overlapAndAdd(frames: Float64Array[], hop: number): Float64Array {
  if (frames.length === 0) return new Float64Array(0);
  const frameLen = frames[0].length;
  const outLen = (frames.length - 1) * hop + frameLen;
  const out = new Float64Array(outLen);
  for (let i = 0; i < frames.length; i++) {
    const offset = i * hop;
    for (let k = 0; k < frameLen; k++) {
      out[offset + k] += frames[i][k];
    }
  }
  return out;
}

/**
 * Octave-compatible polyphase resampler.
 * Designs a Kaiser-windowed sinc FIR filter and applies polyphase resampling.
 *
 * Citation: pystoi utils.resample_oct() + _resample_window_oct().
 */
export function resampleOct(x: Float64Array, p: number, q: number): Float64Array {
  const h = resampleWindowOct(p, q);
  // Normalize filter
  let hSum = 0;
  for (let i = 0; i < h.length; i++) hSum += h[i];
  const window = new Float64Array(h.length);
  for (let i = 0; i < h.length; i++) window[i] = h[i] / hSum;

  return resamplePoly(x, p, q, window);
}

/**
 * Design the resampling FIR filter (Octave-compatible Kaiser window).
 * Citation: pystoi utils._resample_window_oct().
 */
function resampleWindowOct(p: number, q: number): Float64Array {
  const g = gcd(p, q);
  const pn = p / g;
  const qn = q / g;

  // Anti-aliasing filter properties
  const log10Rejection = -3.0;
  const stopbandCutoff = 1.0 / (2 * Math.max(pn, qn));
  const rollOffWidth = stopbandCutoff / 10;

  // Filter length
  const rejectionDb = -20 * log10Rejection; // = 60
  const L = Math.ceil((rejectionDb - 8) / (28.714 * rollOffWidth));

  // Ideal sinc filter
  const len = 2 * L + 1;
  const h = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i - L;
    const arg = 2 * stopbandCutoff * t;
    // sinc(x) = sin(πx)/(πx), sinc(0) = 1
    const sinc = arg === 0 ? 1 : Math.sin(Math.PI * arg) / (Math.PI * arg);
    h[i] = 2 * pn * stopbandCutoff * sinc;
  }

  // Kaiser window parameter
  let beta: number;
  if (rejectionDb >= 21 && rejectionDb <= 50) {
    beta = 0.5842 * (rejectionDb - 21) ** 0.4 + 0.07886 * (rejectionDb - 21);
  } else if (rejectionDb > 50) {
    beta = 0.1102 * (rejectionDb - 8.7);
  } else {
    beta = 0;
  }

  // Apply Kaiser window
  const kaiser = kaiserWindow(len, beta);
  for (let i = 0; i < len; i++) {
    h[i] *= kaiser[i];
  }
  return h;
}

/** Kaiser window of length N with parameter beta. */
function kaiserWindow(N: number, beta: number): Float64Array {
  const w = new Float64Array(N);
  const denom = besselI0(beta);
  for (let i = 0; i < N; i++) {
    const arg = beta * Math.sqrt(1 - ((2 * i) / (N - 1) - 1) ** 2);
    w[i] = besselI0(arg) / denom;
  }
  return w;
}

/** Modified Bessel function of the first kind, order 0. */
function besselI0(x: number): number {
  let sum = 1;
  let term = 1;
  for (let k = 1; k <= 25; k++) {
    term *= (x / (2 * k)) ** 2;
    sum += term;
    if (term < EPS * sum) break;
  }
  return sum;
}

/** Greatest common divisor via Euclidean algorithm. */
function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Polyphase FIR resampling: upsample by p, filter, downsample by q.
 * Simplified implementation matching scipy.signal.resample_poly behavior.
 */
function resamplePoly(x: Float64Array, p: number, q: number, filter: Float64Array): Float64Array {
  const g = gcd(p, q);
  p = Math.round(p / g);
  q = Math.round(q / g);

  if (p === 1 && q === 1) return new Float64Array(x);

  const filterLen = filter.length;

  // Pad filter length to be a multiple of p
  const padLen = p - (filterLen % p === 0 ? p : filterLen % p);
  const paddedFilter = new Float64Array(filterLen + padLen);
  paddedFilter.set(filter);

  const numTaps = paddedFilter.length / p;
  const outLen = Math.ceil((x.length * p) / q);
  const out = new Float64Array(outLen);

  // Half-length of original filter for offset calculation
  const halfLen = (filterLen - 1) / 2;

  for (let i = 0; i < outLen; i++) {
    // Which sample in the upsampled sequence?
    const upIdx = i * q;
    // Phase index within polyphase filter
    const phase = upIdx % p;
    // Starting input sample index
    const startInput = Math.floor(upIdx / p);

    let sum = 0;
    for (let t = 0; t < numTaps; t++) {
      const inputIdx = startInput - Math.floor(halfLen / p) + t - Math.floor(padLen / (2 * p));
      if (inputIdx >= 0 && inputIdx < x.length) {
        sum += x[inputIdx] * paddedFilter[phase + t * p];
      }
    }
    out[i] = sum;
  }
  return out;
}
