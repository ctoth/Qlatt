#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { dectalkFrameStartSec, parseDectalkTraceFile } from "./dectalk-trace";
import {
  eventIndexAt,
  FRAME_PARAMETERS,
  type FrameParameter,
  finiteNumber,
  normalizeQlattPhone,
  oracleSourceClockPhoneCode,
  phoneCodeToQlatt,
  qlattValue,
  sameSegmentLabel,
  type TrackEvent,
} from "./frame-parameters";

type Args = {
  runRoot: string;
  outPath?: string;
  maxPhaseDelta: number | null;
};

type TrackSelection = {
  event: TrackEvent;
  index: number;
};

type SegmentPhase = {
  startSec: number | null;
  endSec: number | null;
  phase: number | null;
};

type ParamBucketSummary = {
  compared: number;
  meanAbs: number;
  maxAbs: number;
  maxFrame: number | null;
  oracleAtMax: number | null;
  qlattAtMax: number | null;
  maxOraclePhone: string | null;
  maxOracleOutputPhone: string | null;
  maxQlattPhone: string | null;
  maxSegmentMatch: boolean | null;
  maxOracleSegmentStartSec: number | null;
  maxOracleSegmentEndSec: number | null;
  maxOracleSegmentPhase: number | null;
  maxQlattSegmentStartSec: number | null;
  maxQlattSegmentEndSec: number | null;
  maxQlattSegmentPhase: number | null;
  maxSegmentPhaseDelta: number | null;
};

type ParamSummary = {
  compared: number;
  meanAbs: number;
  maxAbs: number;
  maxFrame: number | null;
  oracleAtMax: number | null;
  qlattAtMax: number | null;
  maxOraclePhone: string | null;
  maxOracleOutputPhone: string | null;
  maxQlattPhone: string | null;
  maxSegmentMatch: boolean | null;
  maxOracleSegmentStartSec: number | null;
  maxOracleSegmentEndSec: number | null;
  maxOracleSegmentPhase: number | null;
  maxQlattSegmentStartSec: number | null;
  maxQlattSegmentEndSec: number | null;
  maxQlattSegmentPhase: number | null;
  maxSegmentPhaseDelta: number | null;
  sameSegment: ParamBucketSummary;
  phaseAlignedSameSegment: ParamBucketSummary;
  differentSegment: ParamBucketSummary;
  unknownSegment: ParamBucketSummary;
};

type PhraseSummary = {
  phraseId: string;
  oracleFrameCount: number;
  qlattDurationSec: number;
  oracleDurationSec: number;
  durationDeltaSec: number;
  alignment: {
    frames: number;
    sameSegment: number;
    differentSegment: number;
    unknown: number;
  };
  params: Record<string, ParamSummary>;
  ranked: Array<{ param: string } & ParamSummary>;
};

function parseArgs(argv: string[]): Args {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const next = argv[index + 1];
    if (next != null && !next.startsWith("--")) {
      flags.set(arg.slice(2), next);
      index += 1;
    } else {
      flags.set(arg.slice(2), "true");
    }
  }

  if (flags.has("help")) {
    throw new Error("Usage: summarize-trace-run --run-root dir [--out file] [--max-phase-delta n]");
  }
  const runRoot = flags.get("run-root");
  if (!runRoot) {
    throw new Error("Missing required --run-root");
  }
  const maxPhaseDeltaRaw = flags.get("max-phase-delta");
  const maxPhaseDelta = maxPhaseDeltaRaw == null ? null : Number(maxPhaseDeltaRaw);
  if (maxPhaseDelta != null && (!Number.isFinite(maxPhaseDelta) || maxPhaseDelta < 0)) {
    throw new Error(`Invalid --max-phase-delta: ${maxPhaseDeltaRaw}`);
  }
  return {
    runRoot: path.resolve(runRoot),
    outPath: flags.get("out") ? path.resolve(flags.get("out") as string) : undefined,
    maxPhaseDelta,
  };
}

function emptyBucket(): ParamBucketSummary {
  return {
    compared: 0,
    meanAbs: 0,
    maxAbs: 0,
    maxFrame: null,
    oracleAtMax: null,
    qlattAtMax: null,
    maxOraclePhone: null,
    maxOracleOutputPhone: null,
    maxQlattPhone: null,
    maxSegmentMatch: null,
    maxOracleSegmentStartSec: null,
    maxOracleSegmentEndSec: null,
    maxOracleSegmentPhase: null,
    maxQlattSegmentStartSec: null,
    maxQlattSegmentEndSec: null,
    maxQlattSegmentPhase: null,
    maxSegmentPhaseDelta: null,
  };
}

function accumulateBucket(
  bucket: ParamBucketSummary,
  sumAbs: number,
  frameIndex: number,
  oracleValue: number,
  qlattValueForFrame: number,
  abs: number,
  oraclePhone: string | null,
  oracleOutputPhone: string | null,
  qlattPhone: string | null,
  segmentMatch: boolean,
  oraclePhase: SegmentPhase,
  qlattPhase: SegmentPhase,
): number {
  bucket.compared += 1;
  const nextSum = sumAbs + abs;
  bucket.meanAbs = nextSum / bucket.compared;
  if (abs > bucket.maxAbs) {
    bucket.maxAbs = abs;
    bucket.maxFrame = frameIndex;
    bucket.oracleAtMax = oracleValue;
    bucket.qlattAtMax = qlattValueForFrame;
    bucket.maxOraclePhone = oraclePhone;
    bucket.maxOracleOutputPhone = oracleOutputPhone;
    bucket.maxQlattPhone = qlattPhone;
    bucket.maxSegmentMatch = segmentMatch;
    bucket.maxOracleSegmentStartSec = oraclePhase.startSec;
    bucket.maxOracleSegmentEndSec = oraclePhase.endSec;
    bucket.maxOracleSegmentPhase = oraclePhase.phase;
    bucket.maxQlattSegmentStartSec = qlattPhase.startSec;
    bucket.maxQlattSegmentEndSec = qlattPhase.endSec;
    bucket.maxQlattSegmentPhase = qlattPhase.phase;
    bucket.maxSegmentPhaseDelta =
      oraclePhase.phase != null && qlattPhase.phase != null
        ? qlattPhase.phase - oraclePhase.phase
        : null;
  }
  return nextSum;
}

function loadTrack(filePath: string): TrackEvent[] {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
  const track = parsed.track;
  if (!Array.isArray(track)) {
    throw new Error(`Qlatt payload has no track array: ${filePath}`);
  }
  return track.filter((event): event is TrackEvent => event != null && typeof event === "object");
}

function eventSelectionAt(track: TrackEvent[], timeSec: number): TrackSelection | null {
  const index = eventIndexAt(track, timeSec);
  return index < 0 ? null : { event: track[index]!, index };
}

function eventAt(track: TrackEvent[], timeSec: number): TrackEvent | null {
  return eventSelectionAt(track, timeSec)?.event ?? null;
}

function clampUnit(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function oracleSegmentPhaseAt(
  oracleFrames: ReturnType<typeof parseDectalkTraceFile>["frames"],
  frameIndex: number,
): SegmentPhase {
  const frame = oracleFrames[frameIndex];
  if (!frame) return { startSec: null, endSec: null, phase: null };
  let firstFrame = frameIndex;
  while (firstFrame > 0 && oracleFrames[firstFrame - 1]?.phoneIndex === frame.phoneIndex) {
    firstFrame -= 1;
  }
  let lastFrame = frameIndex;
  while (
    lastFrame + 1 < oracleFrames.length &&
    oracleFrames[lastFrame + 1]?.phoneIndex === frame.phoneIndex
  ) {
    lastFrame += 1;
  }
  const startSec = dectalkFrameStartSec(oracleFrames[firstFrame]!.frame);
  const endSec = dectalkFrameStartSec(oracleFrames[lastFrame]!.frame + 1);
  const spanSec = endSec - startSec;
  const frameSec = dectalkFrameStartSec(frame.frame);
  return {
    startSec,
    endSec,
    phase: spanSec > 0 ? clampUnit((frameSec - startSec) / spanSec) : null,
  };
}

function qlattSegmentPhaseAt(
  track: TrackEvent[],
  selection: TrackSelection | null,
  timeSec: number,
): SegmentPhase {
  if (selection == null) return { startSec: null, endSec: null, phase: null };
  const selectedPhone = normalizeQlattPhone(selection.event.phoneme);
  if (selectedPhone == null) return { startSec: null, endSec: null, phase: null };

  let firstIndex = selection.index;
  while (firstIndex > 0 && normalizeQlattPhone(track[firstIndex - 1]?.phoneme) === selectedPhone) {
    firstIndex -= 1;
  }

  let lastIndex = selection.index;
  while (
    lastIndex + 1 < track.length &&
    normalizeQlattPhone(track[lastIndex + 1]?.phoneme) === selectedPhone
  ) {
    lastIndex += 1;
  }

  const startSec = finiteNumber(track[firstIndex]?.time);
  const nextTime = finiteNumber(track[lastIndex + 1]?.time);
  const fallbackEndSec = finiteNumber(track[track.length - 1]?.time);
  const endSec = nextTime ?? fallbackEndSec;
  if (startSec == null || endSec == null) {
    return { startSec, endSec, phase: null };
  }
  const spanSec = endSec - startSec;
  return {
    startSec,
    endSec,
    phase: spanSec > 0 ? clampUnit((timeSec - startSec) / spanSec) : null,
  };
}

function summarizeParam(
  oracleFrames: ReturnType<typeof parseDectalkTraceFile>["frames"],
  track: TrackEvent[],
  parameter: FrameParameter,
  maxPhaseDelta: number | null = null,
): ParamSummary {
  const qlattKey = parameter.qlatt;
  let compared = 0;
  let sumAbs = 0;
  let maxAbs = 0;
  let maxFrame: number | null = null;
  let oracleAtMax: number | null = null;
  let qlattAtMax: number | null = null;
  let maxOraclePhone: string | null = null;
  let maxOracleOutputPhone: string | null = null;
  let maxQlattPhone: string | null = null;
  let maxSegmentMatch: boolean | null = null;
  let maxOracleSegmentStartSec: number | null = null;
  let maxOracleSegmentEndSec: number | null = null;
  let maxOracleSegmentPhase: number | null = null;
  let maxQlattSegmentStartSec: number | null = null;
  let maxQlattSegmentEndSec: number | null = null;
  let maxQlattSegmentPhase: number | null = null;
  let maxSegmentPhaseDelta: number | null = null;
  let sameSegmentSumAbs = 0;
  let phaseAlignedSameSegmentSumAbs = 0;
  let differentSegmentSumAbs = 0;
  let unknownSegmentSumAbs = 0;
  const sameSegment = emptyBucket();
  const phaseAlignedSameSegment = emptyBucket();
  const differentSegment = emptyBucket();
  const unknownSegment = emptyBucket();

  for (let frameIndex = 0; frameIndex < oracleFrames.length; frameIndex += 1) {
    const oracleFrame = oracleFrames[frameIndex]!;
    const oracleValue = parameter.oracleValue(oracleFrame);
    const frameTimeSec = dectalkFrameStartSec(oracleFrame.frame);
    const selection = eventSelectionAt(track, frameTimeSec);
    const event = selection?.event ?? null;
    const qlatt = qlattValue(event, qlattKey);
    if (oracleValue == null || qlatt == null) continue;
    if (qlattKey === "F0") {
      const oracleAv = finiteNumber(oracleFrame.out.AV);
      const qlattAv = qlattValue(event, "AV");
      // DECtalk maintains f0prime through unvoiced frames while Qlatt exposes
      // F0=0 there. Compare audible pitch only when both engines are voiced;
      // AV and voiced-ratio metrics retain the voicing disagreement itself.
      if (oracleAv == null || qlattAv == null || oracleAv <= 0 || qlattAv <= 0) continue;
    }

    const abs = Math.abs(qlatt - oracleValue);
    // Segment labels are compared on the controller (AV/TLT/T0) clock, where
    // Qlatt's Segment boundaries sit; see frame-parameters.ts.
    const oraclePhone = phoneCodeToQlatt(oracleSourceClockPhoneCode(oracleFrames, frameIndex));
    const oracleOutputPhone = phoneCodeToQlatt(oracleFrame.out.PH);
    const qlattPhone = normalizeQlattPhone(event?.phoneme);
    const sameLabel = sameSegmentLabel(oracleFrames, frameIndex, event?.phoneme);
    const knownSegmentPhones = sameLabel != null;
    const segmentMatch = sameLabel === true;
    const oraclePhase = oracleSegmentPhaseAt(oracleFrames, frameIndex);
    const qlattPhase = qlattSegmentPhaseAt(track, selection, frameTimeSec);
    compared += 1;
    sumAbs += abs;
    if (!knownSegmentPhones) {
      unknownSegmentSumAbs = accumulateBucket(
        unknownSegment,
        unknownSegmentSumAbs,
        frameIndex,
        oracleValue,
        qlatt,
        abs,
        oraclePhone,
        oracleOutputPhone,
        qlattPhone,
        segmentMatch,
        oraclePhase,
        qlattPhase,
      );
    } else if (segmentMatch) {
      sameSegmentSumAbs = accumulateBucket(
        sameSegment,
        sameSegmentSumAbs,
        frameIndex,
        oracleValue,
        qlatt,
        abs,
        oraclePhone,
        oracleOutputPhone,
        qlattPhone,
        segmentMatch,
        oraclePhase,
        qlattPhase,
      );
      const phaseDelta =
        oraclePhase.phase != null && qlattPhase.phase != null
          ? Math.abs(qlattPhase.phase - oraclePhase.phase)
          : null;
      if (maxPhaseDelta != null && phaseDelta != null && phaseDelta <= maxPhaseDelta) {
        phaseAlignedSameSegmentSumAbs = accumulateBucket(
          phaseAlignedSameSegment,
          phaseAlignedSameSegmentSumAbs,
          frameIndex,
          oracleValue,
          qlatt,
          abs,
          oraclePhone,
          oracleOutputPhone,
          qlattPhone,
          segmentMatch,
          oraclePhase,
          qlattPhase,
        );
      }
    } else {
      differentSegmentSumAbs = accumulateBucket(
        differentSegment,
        differentSegmentSumAbs,
        frameIndex,
        oracleValue,
        qlatt,
        abs,
        oraclePhone,
        oracleOutputPhone,
        qlattPhone,
        segmentMatch,
        oraclePhase,
        qlattPhase,
      );
    }
    if (abs > maxAbs) {
      maxAbs = abs;
      maxFrame = frameIndex;
      oracleAtMax = oracleValue;
      qlattAtMax = qlatt;
      maxOraclePhone = oraclePhone;
      maxOracleOutputPhone = oracleOutputPhone;
      maxQlattPhone = qlattPhone;
      maxSegmentMatch = segmentMatch;
      maxOracleSegmentStartSec = oraclePhase.startSec;
      maxOracleSegmentEndSec = oraclePhase.endSec;
      maxOracleSegmentPhase = oraclePhase.phase;
      maxQlattSegmentStartSec = qlattPhase.startSec;
      maxQlattSegmentEndSec = qlattPhase.endSec;
      maxQlattSegmentPhase = qlattPhase.phase;
      maxSegmentPhaseDelta =
        oraclePhase.phase != null && qlattPhase.phase != null
          ? qlattPhase.phase - oraclePhase.phase
          : null;
    }
  }

  return {
    compared,
    meanAbs: compared > 0 ? sumAbs / compared : 0,
    maxAbs,
    maxFrame,
    oracleAtMax,
    qlattAtMax,
    maxOraclePhone,
    maxOracleOutputPhone,
    maxQlattPhone,
    maxSegmentMatch,
    maxOracleSegmentStartSec,
    maxOracleSegmentEndSec,
    maxOracleSegmentPhase,
    maxQlattSegmentStartSec,
    maxQlattSegmentEndSec,
    maxQlattSegmentPhase,
    maxSegmentPhaseDelta,
    sameSegment,
    phaseAlignedSameSegment,
    differentSegment,
    unknownSegment,
  };
}

function summarizeAlignment(
  oracleFrames: ReturnType<typeof parseDectalkTraceFile>["frames"],
  track: TrackEvent[],
): PhraseSummary["alignment"] {
  let sameSegment = 0;
  let differentSegment = 0;
  let unknown = 0;
  for (let frameIndex = 0; frameIndex < oracleFrames.length; frameIndex += 1) {
    const event = eventAt(track, dectalkFrameStartSec(oracleFrames[frameIndex]!.frame));
    const sameLabel = sameSegmentLabel(oracleFrames, frameIndex, event?.phoneme);
    if (sameLabel == null) {
      unknown += 1;
    } else if (sameLabel) {
      sameSegment += 1;
    } else {
      differentSegment += 1;
    }
  }
  return {
    frames: oracleFrames.length,
    sameSegment,
    differentSegment,
    unknown,
  };
}

function phraseDirs(runRoot: string): string[] {
  return fs
    .readdirSync(runRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(runRoot, entry.name))
    .filter((entryPath) => {
      return (
        fs.existsSync(path.join(entryPath, "oracle", "oracle.trace.jsonl")) &&
        fs.existsSync(path.join(entryPath, "qlatt", "qlatt.json"))
      );
    })
    .sort((left, right) => path.basename(left).localeCompare(path.basename(right)));
}

function summarizePhrase(phraseDir: string, maxPhaseDelta: number | null): PhraseSummary {
  const oracleTrace = path.join(phraseDir, "oracle", "oracle.trace.jsonl");
  const qlattPayload = path.join(phraseDir, "qlatt", "qlatt.json");
  const oracle = parseDectalkTraceFile(oracleTrace);
  const track = loadTrack(qlattPayload);
  const lastTrackTime = finiteNumber(track[track.length - 1]?.time) ?? 0;

  const params = Object.fromEntries(
    FRAME_PARAMETERS.map((entry) => [
      entry.label,
      summarizeParam(oracle.frames, track, entry, maxPhaseDelta),
    ]),
  ) as Record<string, ParamSummary>;

  const ranked = Object.entries(params)
    .sort((left, right) => right[1].meanAbs - left[1].meanAbs)
    .map(([param, summary]) => ({ param, ...summary }));

  return {
    phraseId: path.basename(phraseDir),
    oracleFrameCount: oracle.frames.length,
    qlattDurationSec: lastTrackTime,
    oracleDurationSec: Number(oracle.summary.durationSec ?? 0),
    durationDeltaSec: lastTrackTime - Number(oracle.summary.durationSec ?? 0),
    alignment: summarizeAlignment(oracle.frames, track),
    params,
    ranked,
  };
}

function summarizeCorpus(phrases: PhraseSummary[]): Record<string, unknown> {
  const byParam = FRAME_PARAMETERS.map(({ label }) => {
    let compared = 0;
    let weightedAbs = 0;
    let sameCompared = 0;
    let sameWeightedAbs = 0;
    let differentCompared = 0;
    let differentWeightedAbs = 0;
    let unknownCompared = 0;
    let unknownWeightedAbs = 0;
    let maxAbs = 0;
    let maxPhraseId: string | null = null;
    let maxFrame: number | null = null;
    let oracleAtMax: number | null = null;
    let qlattAtMax: number | null = null;
    let maxOraclePhone: string | null = null;
    let maxOracleOutputPhone: string | null = null;
    let maxQlattPhone: string | null = null;
    let maxSegmentMatch: boolean | null = null;
    let maxOracleSegmentStartSec: number | null = null;
    let maxOracleSegmentEndSec: number | null = null;
    let maxOracleSegmentPhase: number | null = null;
    let maxQlattSegmentStartSec: number | null = null;
    let maxQlattSegmentEndSec: number | null = null;
    let maxQlattSegmentPhase: number | null = null;
    let maxSegmentPhaseDelta: number | null = null;

    for (const phrase of phrases) {
      const summary = phrase.params[label];
      if (!summary) continue;
      compared += summary.compared;
      weightedAbs += summary.meanAbs * summary.compared;
      sameCompared += summary.sameSegment.compared;
      sameWeightedAbs += summary.sameSegment.meanAbs * summary.sameSegment.compared;
      differentCompared += summary.differentSegment.compared;
      differentWeightedAbs += summary.differentSegment.meanAbs * summary.differentSegment.compared;
      unknownCompared += summary.unknownSegment.compared;
      unknownWeightedAbs += summary.unknownSegment.meanAbs * summary.unknownSegment.compared;
      if (summary.maxAbs > maxAbs) {
        maxAbs = summary.maxAbs;
        maxPhraseId = phrase.phraseId;
        maxFrame = summary.maxFrame;
        oracleAtMax = summary.oracleAtMax;
        qlattAtMax = summary.qlattAtMax;
        maxOraclePhone = summary.maxOraclePhone;
        maxOracleOutputPhone = summary.maxOracleOutputPhone;
        maxQlattPhone = summary.maxQlattPhone;
        maxSegmentMatch = summary.maxSegmentMatch;
        maxOracleSegmentStartSec = summary.maxOracleSegmentStartSec;
        maxOracleSegmentEndSec = summary.maxOracleSegmentEndSec;
        maxOracleSegmentPhase = summary.maxOracleSegmentPhase;
        maxQlattSegmentStartSec = summary.maxQlattSegmentStartSec;
        maxQlattSegmentEndSec = summary.maxQlattSegmentEndSec;
        maxQlattSegmentPhase = summary.maxQlattSegmentPhase;
        maxSegmentPhaseDelta = summary.maxSegmentPhaseDelta;
      }
    }

    return {
      param: label,
      compared,
      meanAbs: compared > 0 ? weightedAbs / compared : 0,
      maxAbs,
      maxPhraseId,
      maxFrame,
      oracleAtMax,
      qlattAtMax,
      maxOraclePhone,
      maxOracleOutputPhone,
      maxQlattPhone,
      maxSegmentMatch,
      maxOracleSegmentStartSec,
      maxOracleSegmentEndSec,
      maxOracleSegmentPhase,
      maxQlattSegmentStartSec,
      maxQlattSegmentEndSec,
      maxQlattSegmentPhase,
      maxSegmentPhaseDelta,
      sameSegmentCompared: sameCompared,
      sameSegmentMeanAbs: sameCompared > 0 ? sameWeightedAbs / sameCompared : 0,
      differentSegmentCompared: differentCompared,
      differentSegmentMeanAbs: differentCompared > 0 ? differentWeightedAbs / differentCompared : 0,
      unknownSegmentCompared: unknownCompared,
      unknownSegmentMeanAbs: unknownCompared > 0 ? unknownWeightedAbs / unknownCompared : 0,
    };
  }).sort((left, right) => right.meanAbs - left.meanAbs);

  const worstPhraseParam = phrases
    .flatMap((phrase) =>
      phrase.ranked.map((summary) => ({
        phraseId: phrase.phraseId,
        ...summary,
      })),
    )
    .sort((left, right) => right.meanAbs - left.meanAbs)
    .slice(0, 25);

  return {
    phraseCount: phrases.length,
    alignment: phrases.reduce(
      (total, phrase) => ({
        frames: total.frames + phrase.alignment.frames,
        sameSegment: total.sameSegment + phrase.alignment.sameSegment,
        differentSegment: total.differentSegment + phrase.alignment.differentSegment,
        unknown: total.unknown + phrase.alignment.unknown,
      }),
      { frames: 0, sameSegment: 0, differentSegment: 0, unknown: 0 },
    ),
    byParam,
    worstPhraseParam,
  };
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  const phrases = phraseDirs(args.runRoot).map((phraseDir) =>
    summarizePhrase(phraseDir, args.maxPhaseDelta),
  );
  const report = {
    schemaVersion: "v1",
    runRoot: args.runRoot,
    phaseAlignmentMaxDelta: args.maxPhaseDelta,
    summary: summarizeCorpus(phrases),
    phrases,
  };
  const text = `${JSON.stringify(report, null, 2)}\n`;
  if (args.outPath) {
    fs.mkdirSync(path.dirname(args.outPath), { recursive: true });
    fs.writeFileSync(args.outPath, text, "utf8");
  } else {
    process.stdout.write(text);
  }
  return 0;
}

try {
  // Let pending pipe writes drain before Node exits; reports can exceed the pipe buffer.
  process.exitCode = main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
