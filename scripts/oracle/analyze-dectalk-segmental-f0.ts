#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseDectalkTraceFile } from "./dectalk-trace";

const FRAME_PERIOD_SEC = 0.0064;
const Q14_ONE = 16384;
const SEGMENT_FILTER = 3000;
const SEGMENT_TARGET_DECAY = 16064;
const F0_SHIFT = 3;

type TrackEvent = {
  time?: number;
  phoneme?: string;
  params?: Record<string, unknown>;
};

type Allophone = {
  name: string;
  durationFrames: number;
  target: number;
  voiceless: boolean;
  plosive: boolean;
  stressed: boolean;
};

// DECtalk 4.63 active US male controller sequence for `cake.`.
// Sources: Ph_drwt02.c us_f0msegtars/pht0draw(), p_us_tim.c output,
// and the oracle allophone trace used by notes-dectalk-stress-impulse.md.
const CAKE_ALLOPHONES: readonly Allophone[] = [
  { name: "SI", durationFrames: 4, target: 50, voiceless: true, plosive: false, stressed: false },
  { name: "K", durationFrames: 17, target: 0, voiceless: true, plosive: true, stressed: false },
  { name: "EY", durationFrames: 37, target: 50, voiceless: false, plosive: false, stressed: true },
  { name: "K", durationFrames: 14, target: 0, voiceless: true, plosive: true, stressed: false },
  { name: "IX", durationFrames: 6, target: 70, voiceless: false, plosive: false, stressed: false },
];

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parsePhraseDir(argv: readonly string[]): string {
  const flagIndex = argv.indexOf("--phrase-dir");
  const supplied = flagIndex >= 0 ? argv[flagIndex + 1] : undefined;
  return path.resolve(
    supplied ??
      path.join("test", "oracle-output", "dectalk-stress-step-ramp", "dectalk-us-v1", "g2p-cake"),
  );
}

function loadTrack(filePath: string): TrackEvent[] {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
  if (!Array.isArray(parsed.track))
    throw new Error(`Qlatt payload has no track array: ${filePath}`);
  return parsed.track.filter(
    (event): event is TrackEvent => event != null && typeof event === "object",
  );
}

function eventAt(track: readonly TrackEvent[], timeSec: number): TrackEvent | null {
  let selected: TrackEvent | null = null;
  for (const event of track) {
    const time = finiteNumber(event.time);
    if (time == null) continue;
    if (time <= timeSec + 1e-9) selected = event;
    else break;
  }
  return selected;
}

// DECtalk ph_defs.h mlsh1: signed 32-bit product followed by arithmetic >>14.
function q14Multiply(left: number, right: number): number {
  return Math.floor((left * right) / Q14_ONE);
}

function renderSegmentalContribution(frameCount: number): {
  internal: number[];
  transitions: string[];
} {
  let allophoneIndex = -1;
  let nframs = 0;
  let segmentDuration = 0;
  let extraDuration = -3;
  let slowTarget = 0;
  let fastTarget = 0;
  let firstPoleState = 0;
  let secondPoleState = 0;
  const internal: number[] = [];
  const transitions: string[] = [];

  for (let frame = 0; frame < frameCount; frame += 1) {
    if (allophoneIndex + 1 < CAKE_ALLOPHONES.length && nframs >= segmentDuration + extraDuration) {
      if (allophoneIndex >= 0) nframs -= segmentDuration;
      allophoneIndex += 1;
      const current = CAKE_ALLOPHONES[allophoneIndex]!;
      segmentDuration = current.durationFrames;
      transitions.push(`${frame}:${current.name}`);

      // Ph_drwt02.c compensates the first spoken allophone for the segmental
      // filter delay after advancing from initialized SI.
      if (allophoneIndex === 1) nframs = -3;

      const next = CAKE_ALLOPHONES[allophoneIndex + 1];
      extraDuration = next?.voiceless ? 0 : -3;
      if (current.voiceless) {
        slowTarget = 0;
        fastTarget = current.target;
        extraDuration = current.plosive ? (current.stressed ? 5 : 3) : 1;
      } else {
        slowTarget = current.target;
        fastTarget = 0;
      }
    }

    slowTarget = q14Multiply(slowTarget, SEGMENT_TARGET_DECAY);
    const first =
      q14Multiply(SEGMENT_FILTER << F0_SHIFT, slowTarget) +
      q14Multiply(Q14_ONE - SEGMENT_FILTER, firstPoleState);
    firstPoleState = first;
    const second =
      q14Multiply(SEGMENT_FILTER, first + (fastTarget << F0_SHIFT)) +
      q14Multiply(Q14_ONE - SEGMENT_FILTER, secondPoleState);
    secondPoleState = second;
    internal.push(second >> F0_SHIFT);
    nframs += 1;
  }

  return { internal, transitions };
}

function main(): void {
  const phraseDir = parsePhraseDir(process.argv.slice(2));
  const oracle = parseDectalkTraceFile(path.join(phraseDir, "oracle", "oracle.trace.jsonl"));
  const track = loadTrack(path.join(phraseDir, "qlatt", "qlatt.json"));
  const segmental = renderSegmentalContribution(oracle.frames.length);
  const speakerDeltaScale = (4100 / 4096) * 0.1;

  let compared = 0;
  let baselineSum = 0;
  let adjustedSum = 0;
  let baselineMax = 0;
  let adjustedMax = 0;
  for (let frame = 0; frame < oracle.frames.length; frame += 1) {
    const oracleFrame = oracle.frames[frame]!;
    const event = eventAt(track, frame * FRAME_PERIOD_SEC);
    const oracleF0 = finiteNumber(oracleFrame.f0prime);
    const oracleAv = finiteNumber(oracleFrame.out.AV);
    const qlattF0 = finiteNumber(event?.params?.F0);
    const qlattAv = finiteNumber(event?.params?.AV);
    if (
      oracleF0 == null ||
      oracleAv == null ||
      oracleAv <= 0 ||
      qlattF0 == null ||
      qlattAv == null ||
      qlattAv <= 0
    )
      continue;

    const oracleHz = oracleF0 / 10;
    const baselineError = Math.abs(qlattF0 - oracleHz);
    const adjustedF0 = qlattF0 + segmental.internal[frame]! * speakerDeltaScale;
    const adjustedError = Math.abs(adjustedF0 - oracleHz);
    compared += 1;
    baselineSum += baselineError;
    adjustedSum += adjustedError;
    baselineMax = Math.max(baselineMax, baselineError);
    adjustedMax = Math.max(adjustedMax, adjustedError);
  }

  const contributionHzAt = (frame: number): number =>
    (segmental.internal[frame] ?? 0) * speakerDeltaScale;
  process.stdout.write(
    `${JSON.stringify(
      {
        phraseDir,
        arithmetic: {
          mlsh1Shift: 14,
          segmentFilterQ14: SEGMENT_FILTER,
          slowTargetDecayQ14: SEGMENT_TARGET_DECAY,
          speakerDeltaScale,
        },
        transitions: segmental.transitions,
        contributionHz: {
          frame28: contributionHzAt(28),
          frame40: contributionHzAt(40),
          frame62: contributionHzAt(62),
        },
        alignedVoiced: {
          compared,
          baselineMeanAbsHz: compared > 0 ? baselineSum / compared : null,
          adjustedMeanAbsHz: compared > 0 ? adjustedSum / compared : null,
          baselineMaxAbsHz: baselineMax,
          adjustedMaxAbsHz: adjustedMax,
        },
      },
      null,
      2,
    )}\n`,
  );
}

main();
