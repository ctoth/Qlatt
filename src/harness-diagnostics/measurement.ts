// Stateless measurement functions on AnalyserNode.
// Each function reads from an AnalyserNode and returns a scalar metric.
// No side effects, no retained state.

/**
 * RMS (root mean square) of the time-domain buffer.
 * Returns a value in [0, 1] for normalized audio.
 */
export function readRms(analyser: AnalyserNode): number {
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    sum += buf[i] * buf[i];
  }
  return Math.sqrt(sum / buf.length);
}

/**
 * Peak absolute value of the time-domain buffer.
 */
export function readPeak(analyser: AnalyserNode): number {
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  let peak = 0;
  for (let i = 0; i < buf.length; i++) {
    const abs = Math.abs(buf[i]);
    if (abs > peak) peak = abs;
  }
  return peak;
}

/**
 * Frequency (Hz) of the maximum FFT bin.
 * Optionally restricted to a frequency band [lowHz, highHz].
 * Returns 0 if no bins fall within the band.
 *
 * frequencyData is in dB (getFloatFrequencyData returns dB values).
 */
export function readFftPeakFreq(
  analyser: AnalyserNode,
  sampleRate: number,
  band?: [number, number],
): number {
  const binCount = analyser.frequencyBinCount;
  const buf = new Float32Array(binCount);
  analyser.getFloatFrequencyData(buf);

  const binWidth = sampleRate / analyser.fftSize;

  let lowBin = 0;
  let highBin = binCount - 1;
  if (band) {
    lowBin = Math.floor(band[0] / binWidth);
    highBin = Math.floor(band[1] / binWidth);
    // Clamp to valid range
    if (lowBin < 0) lowBin = 0;
    if (highBin >= binCount) highBin = binCount - 1;
    if (lowBin > highBin) return 0;
  }

  let maxVal = -Infinity;
  let maxBin = -1;
  for (let i = lowBin; i <= highBin; i++) {
    if (buf[i] > maxVal) {
      maxVal = buf[i];
      maxBin = i;
    }
  }

  if (maxBin < 0) return 0;
  return (maxBin * sampleRate) / analyser.fftSize;
}

/**
 * Sum of linear power within a frequency band [lowHz, highHz].
 * Converts dB values from getFloatFrequencyData to linear power (10^(dB/10))
 * and sums across bins in the band.
 */
export function readBandEnergy(
  analyser: AnalyserNode,
  sampleRate: number,
  band: [number, number],
): number {
  const binCount = analyser.frequencyBinCount;
  const buf = new Float32Array(binCount);
  analyser.getFloatFrequencyData(buf);

  const binWidth = sampleRate / analyser.fftSize;

  let lowBin = Math.floor(band[0] / binWidth);
  let highBin = Math.floor(band[1] / binWidth);
  if (lowBin < 0) lowBin = 0;
  if (highBin >= binCount) highBin = binCount - 1;

  let energy = 0;
  for (let i = lowBin; i <= highBin; i++) {
    energy += Math.pow(10, buf[i] / 10);
  }
  return energy;
}

/**
 * Fraction of total spectral power contained within a frequency band.
 * Useful for hiss/brightness checks where absolute level is less informative
 * than high-frequency share.
 */
export function readBandShare(
  analyser: AnalyserNode,
  sampleRate: number,
  band: [number, number],
): number {
  const binCount = analyser.frequencyBinCount;
  const buf = new Float32Array(binCount);
  analyser.getFloatFrequencyData(buf);

  const binWidth = sampleRate / analyser.fftSize;
  let lowBin = Math.floor(band[0] / binWidth);
  let highBin = Math.floor(band[1] / binWidth);
  if (lowBin < 0) lowBin = 0;
  if (highBin >= binCount) highBin = binCount - 1;

  let bandEnergy = 0;
  let totalEnergy = 0;
  for (let i = 0; i < binCount; i += 1) {
    const energy = Math.pow(10, buf[i] / 10);
    totalEnergy += energy;
    if (i >= lowBin && i <= highBin) {
      bandEnergy += energy;
    }
  }
  return totalEnergy > 0 ? bandEnergy / totalEnergy : 0;
}
