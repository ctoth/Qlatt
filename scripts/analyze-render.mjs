import fs from "node:fs";
import path from "node:path";
import FFT from "fft.js";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  args.set(key.slice(2), process.argv[i + 1]);
}

const inputPath = args.get("input") ? path.resolve(args.get("input")) : null;
if (!inputPath) {
  console.error("Usage: node scripts/analyze-render.mjs --input render.json [--out-json report.json]");
  process.exit(1);
}

const outJson = args.get("out-json") ? path.resolve(args.get("out-json")) : null;
const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const samples = payload.samples;
if (!Array.isArray(samples) || samples.length === 0) {
  throw new Error(`Render JSON has no non-empty samples array: ${inputPath}`);
}

const sampleRate = Number(payload.sampleRate ?? 22050);
const leadTime = Number(payload.leadTime ?? 0);
const tailTime = Number(payload.tailTime ?? 0);
const track = Array.isArray(payload.track) ? payload.track : [];

function clampIndex(value) {
  return Math.max(0, Math.min(samples.length, Math.floor(value)));
}

function rmsPeak(slice) {
  let sum = 0;
  let peak = 0;
  let dc = 0;
  let zeroCrossings = 0;
  let prev = 0;
  let clipped = 0;
  for (let i = 0; i < slice.length; i += 1) {
    const value = Number(slice[i]) || 0;
    const abs = Math.abs(value);
    sum += value * value;
    dc += value;
    if (abs > peak) peak = abs;
    if (abs >= 0.999) clipped += 1;
    if (i > 0 && Math.sign(value) !== Math.sign(prev) && value !== 0 && prev !== 0) {
      zeroCrossings += 1;
    }
    prev = value;
  }
  const rms = slice.length ? Math.sqrt(sum / slice.length) : 0;
  return {
    rms,
    peak,
    dc: slice.length ? dc / slice.length : 0,
    crestDb: rms > 0 ? 20 * Math.log10(peak / rms) : null,
    zcr: slice.length ? zeroCrossings / slice.length : 0,
    clippedSamples: clipped,
    clippedShare: slice.length ? clipped / slice.length : 0,
  };
}

function nextPow2(value) {
  let n = 1;
  while (n < value) n *= 2;
  return n;
}

function bandMetrics(slice, sr) {
  const maxSize = Number(args.get("fft-size") ?? 32768);
  const size = Math.min(nextPow2(slice.length), maxSize);
  if (size < 64) return null;

  const fft = new FFT(size);
  const input = new Array(size).fill(0);
  const offset = Math.max(0, Math.floor((slice.length - size) / 2));
  for (let i = 0; i < size && i + offset < slice.length; i += 1) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
    input[i] = (Number(slice[i + offset]) || 0) * window;
  }

  const complexInput = fft.toComplexArray(input);
  const output = fft.createComplexArray();
  fft.transform(output, complexInput);

  const nyquist = sr / 2;
  const binHz = sr / size;
  const bands = [
    ["sub", 0, 300],
    ["low", 300, 1000],
    ["mid", 1000, 3000],
    ["presence", 3000, 6000],
    ["hiss", 6000, Math.min(10000, nyquist)],
    ["ultra", Math.min(10000, nyquist), nyquist],
  ];
  const bandPower = Object.fromEntries(bands.map(([name]) => [name, 0]));
  let totalPower = 0;
  let weightedHz = 0;
  let geometricSum = 0;
  let geometricCount = 0;
  const cumulative = [];

  for (let bin = 1; bin <= size / 2; bin += 1) {
    const re = output[2 * bin];
    const im = output[2 * bin + 1];
    const power = re * re + im * im;
    const hz = bin * binHz;
    totalPower += power;
    weightedHz += hz * power;
    if (power > 0) {
      geometricSum += Math.log(power);
      geometricCount += 1;
    }
    for (const [name, low, high] of bands) {
      if (hz >= low && hz < high) {
        bandPower[name] += power;
        break;
      }
    }
    cumulative.push([hz, totalPower]);
  }

  let rolloff95 = 0;
  const target = totalPower * 0.95;
  for (const [hz, power] of cumulative) {
    if (power >= target) {
      rolloff95 = hz;
      break;
    }
  }

  const bandShare = {};
  for (const [name] of bands) {
    bandShare[name] = totalPower > 0 ? bandPower[name] / totalPower : 0;
  }
  const speechBandPower = bandPower.low + bandPower.mid;
  const highBandPower = bandPower.presence + bandPower.hiss + bandPower.ultra;
  const hissBandPower = bandPower.hiss + bandPower.ultra;

  const arithmeticMean = totalPower / Math.max(1, size / 2);
  const geometricMean = geometricCount ? Math.exp(geometricSum / geometricCount) : 0;

  return {
    fftSize: size,
    spectralCentroidHz: totalPower > 0 ? weightedHz / totalPower : 0,
    rolloff95Hz: rolloff95,
    spectralFlatness: arithmeticMean > 0 ? geometricMean / arithmeticMean : 0,
    bandPower,
    bandShare,
    highShareAbove3000: totalPower > 0 ? highBandPower / totalPower : 0,
    hissShareAbove6000: totalPower > 0 ? hissBandPower / totalPower : 0,
    highToSpeechRatioDb: speechBandPower > 0 && highBandPower > 0
      ? 10 * Math.log10(highBandPower / speechBandPower)
      : null,
    hissToSpeechRatioDb: speechBandPower > 0 && hissBandPower > 0
      ? 10 * Math.log10(hissBandPower / speechBandPower)
      : null,
  };
}

function sliceForTime(startSec, endSec) {
  return samples.slice(
    clampIndex(startSec * sampleRate),
    clampIndex(endSec * sampleRate),
  );
}

function classifyFrame(frame) {
  const params = frame?.params ?? {};
  if (frame?.phoneme === "SIL") return "silence";
  if ((Number(params.AV) || 0) > 0 || (Number(params.AVS) || 0) > 0) return "voiced";
  return "unvoiced";
}

function segmentMetrics() {
  if (track.length === 0) return { byClass: {}, loudestFrames: [], releaseFrames: [], releaseSummary: null };
  const byClassSamples = new Map();
  const releaseSamples = [];
  const frames = [];
  const releaseFrames = [];

  for (let i = 0; i < track.length; i += 1) {
    const frame = track[i];
    const next = track[i + 1];
    const start = leadTime + Number(frame.time ?? 0);
    const end = leadTime + Number(next?.time ?? payload.trackSummary?.totalTime ?? frame.time ?? 0);
    if (end <= start) continue;
    const slice = sliceForTime(start, end);
    const metrics = rmsPeak(slice);
    const spectral = bandMetrics(slice, sampleRate);
    const cls = classifyFrame(frame);
    const phoneme = frame.phoneme ?? "";
    if (!byClassSamples.has(cls)) byClassSamples.set(cls, []);
    byClassSamples.get(cls).push(...slice);
    frames.push({
      time: frame.time,
      endTime: end - leadTime,
      phoneme,
      class: cls,
      duration: end - start,
      rms: metrics.rms,
      peak: metrics.peak,
      zcr: metrics.zcr,
    });
    if (phoneme.endsWith("_REL")) {
      releaseSamples.push(...slice);
      releaseFrames.push({
        time: frame.time,
        endTime: end - leadTime,
        phoneme,
        duration: end - start,
        ...metrics,
        spectral,
      });
    }
  }

  const byClass = {};
  for (const [cls, clsSamples] of byClassSamples) {
    byClass[cls] = {
      ...rmsPeak(clsSamples),
      spectral: bandMetrics(clsSamples, sampleRate),
    };
  }

  frames.sort((a, b) => b.rms - a.rms);
  return {
    byClass,
    loudestFrames: frames.slice(0, 12),
    releaseFrames,
    releaseSummary: releaseSamples.length
      ? {
          ...rmsPeak(releaseSamples),
          spectral: bandMetrics(releaseSamples, sampleRate),
        }
      : null,
  };
}

const fullMetrics = rmsPeak(samples);
const activeStart = leadTime;
const activeEnd =
  leadTime +
  (track.length
    ? Number(track[track.length - 1].time ?? payload.trackSummary?.totalTime ?? 0)
    : Number(payload.trackSummary?.totalTime ?? samples.length / sampleRate));
const activeSamples = sliceForTime(activeStart, activeEnd);
const activeMetrics = rmsPeak(activeSamples);

const report = {
  input: inputPath,
  phrase: payload.phrase,
  experimentId: payload.experimentId,
  frontendId: payload.frontendId,
  sampleRate,
  sampleCount: samples.length,
  durationSec: samples.length / sampleRate,
  leadTime,
  tailTime,
  renderMetrics: payload.metrics,
  full: {
    ...fullMetrics,
    spectral: bandMetrics(samples, sampleRate),
  },
  active: {
    ...activeMetrics,
    spectral: bandMetrics(activeSamples, sampleRate),
  },
  segments: segmentMetrics(),
};

if (outJson) {
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify({
  input: report.input,
  phrase: report.phrase,
  experimentId: report.experimentId,
  frontendId: report.frontendId,
  durationSec: report.durationSec,
  activeRms: report.active.rms,
  activePeak: report.active.peak,
  activeCrestDb: report.active.crestDb,
  activeHissShareAbove6000: report.active.spectral?.hissShareAbove6000,
  activeHighShareAbove3000: report.active.spectral?.highShareAbove3000,
  activeCentroidHz: report.active.spectral?.spectralCentroidHz,
  activeFlatness: report.active.spectral?.spectralFlatness,
  activeHighToSpeechRatioDb: report.active.spectral?.highToSpeechRatioDb,
  activeHissToSpeechRatioDb: report.active.spectral?.hissToSpeechRatioDb,
  releaseSummary: report.segments.releaseSummary,
  releaseFrames: report.segments.releaseFrames,
  clippedShare: report.full.clippedShare,
  loudestFrames: report.segments.loudestFrames.slice(0, 5),
  outJson,
}, null, 2));
