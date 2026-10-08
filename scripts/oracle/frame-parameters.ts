// Shared definitions for comparing Qlatt's track with DECtalk 4.63's emitted
// parameter packets (the `-lt` trace, ph_claus.c:695-744).
//
// What one trace line holds. send_pars() (ph_claus.c:746-891) keeps every
// parameter except AV, TLT and T0 back by one frame ("Special buffer to delay
// all pars except AV, TILT, & T0 by one frame", ph_claus.c:754-757): on each
// call it copies the current AV/TLT/T0 into the packet (771-792), writes the
// packet, then loads the other parameters for the NEXT packet (836-887). The
// first call writes nothing. So packet j carries
//   - F1..B3, A2..AB, AP and PH/DU/PH2 of control frame j, and
//   - AV, TLT, T0 of control frame j + 1,
// and the `phoneIndex`, `tcum`, `f0prime` printed beside it are the controller
// state of frame j + 1. `phoneIndex` is `nphone`, an index into the CURRENT
// CLAUSE's allophone array (ph_claus.c:400, 440): it restarts at every clause
// and counts allophones after the allophone rules, so it cannot index the
// utterance-wide phoneme log.
import {
  DECTALK_NATIVE_SAMPLE_RATE_HZ,
  DECTALK_SAMPLES_PER_FRAME,
  type DectalkTraceFrame,
} from "./dectalk-trace";

export type TrackEvent = {
  time?: number;
  phoneme?: string;
  params?: Record<string, unknown>;
};

export type FrameParameter = {
  label: string;
  oracleValue: (frame: DectalkTraceFrame) => number | null;
  qlatt: string;
  /** True for AV, TLT and F0, which DECtalk does not delay (ph_claus.c:771-792). */
  sourceClock: boolean;
  /**
   * True when a packet whose track event lacks the key counts as differing.
   * Without it a parameter the frontend never emits would compare nowhere and
   * so appear to match.
   */
  required?: boolean;
};

/**
 * A word the synthesizer reads. DECtalk sends these one frame late
 * (ph_claus.c:754-757) and so does the track (`delay_frames` of the frame
 * program that writes them), so they compare packet for packet.
 */
function frameWord(
  label: string,
  oracleValue: FrameParameter["oracleValue"],
  qlatt = label,
): FrameParameter {
  return { label, oracleValue, qlatt, sourceClock: false, required: true };
}

const US_PHONE = 1 << 8;
const USP_W = US_PHONE + 24;
const USP_R = US_PHONE + 26;
const USP_LL = US_PHONE + 27;
const USP_HX = US_PHONE + 28;
const USP_CZ = US_PHONE + 58;

// p_all_ph.h US phone codes, named as the Qlatt inventory names them. Phones
// Qlatt's track labels do not tell apart map to one name.
export const PHONE_BY_CODE: Readonly<Record<number, string>> = {
  0: "SIL",
  1: "IY",
  2: "IH",
  3: "EY",
  4: "EH",
  5: "AE",
  6: "AA",
  7: "AY",
  8: "AW",
  9: "AH",
  10: "AO",
  11: "OW",
  12: "OY",
  13: "UH",
  14: "UW",
  15: "ER",
  16: "YU",
  17: "AX",
  18: "IX",
  19: "IR",
  20: "ER",
  21: "AR",
  22: "OR",
  23: "UR",
  24: "W",
  25: "Y",
  26: "R",
  27: "L",
  28: "HH",
  29: "R",
  30: "L",
  31: "M",
  32: "N",
  33: "NG",
  34: "EL",
  35: "DH",
  36: "EN",
  37: "F",
  38: "V",
  39: "TH",
  40: "DH",
  41: "S",
  42: "Z",
  43: "SH",
  44: "ZH",
  45: "P",
  46: "B",
  47: "T",
  48: "D",
  49: "K",
  50: "G",
  51: "DX",
  52: "T",
  53: "Q",
  54: "CH",
  55: "JH",
  56: "DF",
  57: "TZ",
  58: "CZ",
};

export function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function phoneCodeToQlatt(value: unknown): string | null {
  const numeric = finiteNumber(value);
  if (numeric == null) return null;
  const code = numeric >= US_PHONE ? numeric - US_PHONE : numeric;
  return PHONE_BY_CODE[code] ?? null;
}

export function normalizeQlattPhone(phoneme: unknown): string | null {
  if (typeof phoneme !== "string") return null;
  const trimmed = phoneme
    .trim()
    .toUpperCase()
    .replace(/[0-2]$/u, "");
  if (!trimmed) return null;
  if (trimmed.endsWith("_REL") || trimmed.endsWith("_ASP")) {
    return trimmed.slice(0, trimmed.lastIndexOf("_"));
  }
  if (trimmed === "LL" || trimmed === "LX") return "L";
  if (trimmed === "RX") return "R";
  if (trimmed === "RR") return "ER";
  if (trimmed === "TX") return "T";
  if (trimmed === "DZ") return "DH";
  return trimmed;
}

/**
 * The phone DECtalk's controller is in while it computes packet `index`'s AV,
 * TLT and T0: the PH of the next packet, because PH itself is delayed one
 * frame (ph_claus.c:754-757, 874). Qlatt's Segment boundaries sit on this
 * clock. The last packet has no successor; its own PH is silence by then.
 */
export function oracleSourceClockPhoneCode(
  frames: readonly DectalkTraceFrame[],
  index: number,
): number | null {
  const frame = frames[index + 1] ?? frames[index];
  return frame == null ? null : finiteNumber(frame.out.PH);
}

/**
 * Whether Qlatt's Segment label names the phone DECtalk's controller is in.
 * DECtalk releases a plosive before a silence into a dummy vowel
 * (ph_inton1.c:1780-1820, Rule 9), emitted with PH = IX or AX; the frontend keeps
 * that release as a non-syllabic `SIL` Segment (structural.yaml
 * dectalk_insert_voiceless_stop_release_into_silence), so before a silence the
 * two labels name the same interval.
 */
export function sameSegmentLabel(
  frames: readonly DectalkTraceFrame[],
  index: number,
  qlattPhoneme: unknown,
): boolean | null {
  const oraclePhone = phoneCodeToQlatt(oracleSourceClockPhoneCode(frames, index));
  const qlattPhone = normalizeQlattPhone(qlattPhoneme);
  if (oraclePhone == null || qlattPhone == null) return null;
  if (oraclePhone === qlattPhone) return true;
  if (qlattPhone === "SIL" && (oraclePhone === "IX" || oraclePhone === "AX")) {
    const code = oracleSourceClockPhoneCode(frames, index);
    let next = index + 1;
    while (next < frames.length && oracleSourceClockPhoneCode(frames, next) === code) next += 1;
    const following =
      next < frames.length ? phoneCodeToQlatt(oracleSourceClockPhoneCode(frames, next)) : "SIL";
    return following === "SIL";
  }
  return false;
}

function dectalkA2Db(frame: DectalkTraceFrame): number | null {
  const raw = finiteNumber(frame.out.A2);
  if (raw == null) return null;

  const phone = finiteNumber(frame.out.PH);
  if (raw === 4000) {
    if (phone === USP_R || phone === USP_LL) return 45;
    if (phone === USP_W) return 50;
    return 0;
  }

  // DECtalk 4.63 VTM/vtmiont.c HLSYN decodes OUT_A2 sentinels into NA2F dB.
  let decoded: number | null;
  switch (raw) {
    case 1000:
      decoded = 30;
      break;
    case 1100:
      decoded = 40;
      break;
    case 1200:
    case 1300:
      decoded = 0;
      break;
    case 2000: {
      const f2 = finiteNumber(frame.out.F2);
      decoded = f2 == null ? null : f2 > 1700 ? 0 : 3;
      break;
    }
    case 3000: {
      const f3 = finiteNumber(frame.out.F3);
      if (f3 == null) {
        decoded = null;
      } else if (f3 > 2600) {
        decoded = 0;
      } else if (f3 !== 2400) {
        decoded = 10;
      } else {
        decoded = null;
      }
      break;
    }
    case 3100:
    case 3200:
    case 3300:
      decoded = 10;
      break;
    default:
      decoded = raw < 1000 ? raw : null;
      break;
  }

  if (phone === USP_HX) return 30;
  if (phone === USP_CZ) return 50;
  return decoded;
}

const out =
  (key: keyof DectalkTraceFrame["out"]) =>
  (frame: DectalkTraceFrame): number | null =>
    finiteNumber(frame.out[key]);

/** A packet word the `-lt` trace does not print, by its packet-word name. */
const area =
  (key: string) =>
  (frame: DectalkTraceFrame): number | null =>
    finiteNumber(frame.area?.[key]);

export const FRAME_PARAMETERS: readonly FrameParameter[] = [
  {
    label: "F0",
    oracleValue: (frame) => (finiteNumber(frame.f0prime) == null ? null : frame.f0prime / 10),
    qlatt: "F0",
    sourceClock: true,
  },
  { label: "F1", oracleValue: out("F1"), qlatt: "F1", sourceClock: false },
  { label: "F2", oracleValue: out("F2"), qlatt: "F2", sourceClock: false },
  { label: "F3", oracleValue: out("F3"), qlatt: "F3", sourceClock: false },
  { label: "B1", oracleValue: out("B1"), qlatt: "B1", sourceClock: false },
  { label: "B2", oracleValue: out("B2"), qlatt: "B2", sourceClock: false },
  { label: "B3", oracleValue: out("B3"), qlatt: "B3", sourceClock: false },
  { label: "AV", oracleValue: out("AV"), qlatt: "AV", sourceClock: true },
  { label: "AP", oracleValue: out("AP"), qlatt: "AH", sourceClock: false },
  { label: "A2", oracleValue: dectalkA2Db, qlatt: "A2", sourceClock: false },
  { label: "A3", oracleValue: out("A3"), qlatt: "A3", sourceClock: false },
  { label: "A4", oracleValue: out("A4"), qlatt: "A4", sourceClock: false },
  { label: "A5", oracleValue: out("A5"), qlatt: "A5", sourceClock: false },
  { label: "A6", oracleValue: out("A6"), qlatt: "A6", sourceClock: false },
  { label: "AB", oracleValue: out("AB"), qlatt: "AB", sourceClock: false },
  { label: "TLT", oracleValue: out("TLT"), qlatt: "TL", sourceClock: true },
  // The words DECtalk's synthesizer builds voicing and noise from
  // (VTM/vtmiont.c:660-683), under the track's names and in the packet's own
  // integer scale. Two names differ from the packet's because the track
  // already uses them: AREA_N is OUT_AN (the track's AN is a nasal amplitude)
  // and A2_CODE is the raw OUT_A2 control code (the track's A2 is a level;
  // the A2 row above decodes the code to that level).
  frameWord("AG", area("AG")),
  frameWord("PS", area("PS")),
  frameWord("CNK", area("CNK")),
  frameWord("AL", area("AL")),
  frameWord("ABLADE", area("ABLADE")),
  frameWord("ATB", area("ATB")),
  frameWord("AREA_N", area("AN")),
  frameWord("DC", area("DC")),
  frameWord("UE", area("UE")),
  frameWord("PLACE", area("PLACE")),
  frameWord("A2_CODE", out("A2")),
  frameWord("F4", area("F4")),
  // OUT_PH, the allophone with its font in the high byte. The Segment labels
  // above are checked on the source clock; this is the word itself.
  frameWord("PH", out("PH")),
];

export function eventIndexAt(track: readonly TrackEvent[], timeSec: number): number {
  let selected = -1;
  for (let index = 0; index < track.length; index += 1) {
    const eventTime = finiteNumber(track[index]?.time);
    if (eventTime == null) continue;
    if (eventTime <= timeSec + 1e-9) {
      selected = index;
      continue;
    }
    break;
  }
  return selected;
}

export type ParameterComparison = {
  compared: number;
  mismatched: number;
  /** Of `mismatched`: packets whose track event lacks a required key. */
  missing: number;
  sumAbs: number;
  maxAbs: number;
  firstMismatch: { packet: number; dectalk: number; qlatt: number } | null;
};

export type TrackComparison = {
  packets: number;
  /** Packets whose Segment label is not DECtalk's controller phone. */
  segmentLabelsDiffer: number;
  parameters: Record<string, ParameterComparison>;
};

/**
 * DECtalk emits integers (F0 in tenths of a hertz); the track carries floats.
 * A packet matches when the track's value is within half of DECtalk's unit,
 * that is, when it rounds to the integer DECtalk sent.
 */
export function parameterTolerance(parameter: FrameParameter): number {
  return parameter.label === "F0" ? 0.05 : 0.5;
}

/** Compare a track with DECtalk's packets, each packet at its own start time. */
export function compareTrackToFrames(
  frames: readonly DectalkTraceFrame[],
  track: readonly TrackEvent[],
): TrackComparison {
  const parameters: Record<string, ParameterComparison> = Object.fromEntries(
    FRAME_PARAMETERS.map((parameter) => [
      parameter.label,
      { compared: 0, mismatched: 0, missing: 0, sumAbs: 0, maxAbs: 0, firstMismatch: null },
    ]),
  );
  let segmentLabelsDiffer = 0;
  let cursor = -1;
  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index] as DectalkTraceFrame;
    const timeSec = (frame.frame * DECTALK_SAMPLES_PER_FRAME) / DECTALK_NATIVE_SAMPLE_RATE_HZ;
    while (cursor + 1 < track.length) {
      const nextTime = finiteNumber(track[cursor + 1]?.time);
      if (nextTime == null || nextTime > timeSec + 1e-9) break;
      cursor += 1;
    }
    const event = cursor >= 0 ? track[cursor] : undefined;
    if (sameSegmentLabel(frames, index, event?.phoneme) === false) segmentLabelsDiffer += 1;
    for (const parameter of FRAME_PARAMETERS) {
      const dectalk = parameter.oracleValue(frame);
      const qlatt = qlattValue(event, parameter.qlatt);
      if (dectalk == null) continue;
      const summary = parameters[parameter.label] as ParameterComparison;
      if (qlatt == null) {
        if (parameter.required) {
          summary.compared += 1;
          summary.mismatched += 1;
          summary.missing += 1;
        }
        continue;
      }
      const abs = Math.abs(qlatt - dectalk);
      summary.compared += 1;
      summary.sumAbs += abs;
      if (abs > summary.maxAbs) summary.maxAbs = abs;
      if (abs > parameterTolerance(parameter) + 1e-9) {
        summary.mismatched += 1;
        summary.firstMismatch ??= { packet: frame.frame, dectalk, qlatt };
      }
    }
  }
  return { packets: frames.length, segmentLabelsDiffer, parameters };
}

export function qlattValue(event: TrackEvent | null | undefined, key: string): number | null {
  if (!event?.params || typeof event.params !== "object") return null;
  return finiteNumber(event.params[key]);
}
