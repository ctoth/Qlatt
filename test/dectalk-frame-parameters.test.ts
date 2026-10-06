import { describe, expect, it } from "vitest";
import { parseDectalkTraceJsonl } from "../scripts/oracle/dectalk-trace";
import {
  oracleSourceClockPhoneCode,
  phoneCodeToQlatt,
  sameSegmentLabel,
} from "../scripts/oracle/frame-parameters";

const US = 256;

/** One packet a line: the clause-local allophone index and the (delayed) PH. */
function trace(rows: ReadonlyArray<readonly [phoneIndex: number, ph: number]>) {
  return parseDectalkTraceJsonl(
    rows
      .map(([phoneIndex, ph], frame) =>
        JSON.stringify({
          frame,
          timeFrames: frame,
          tcum: 0,
          phoneIndex,
          f0prime: 1000,
          out: { PH: US + ph },
        }),
      )
      .join("\n"),
  ).frames;
}

function controllerPhones(frames: ReturnType<typeof trace>): Array<string | null> {
  return frames.map((_, index) => phoneCodeToQlatt(oracleSourceClockPhoneCode(frames, index)));
}

describe("DECtalk packet labels", () => {
  it("reads the controller's phone from the next packet's PH", () => {
    // send_pars delays PH one frame behind AV/TLT/T0 (ph_claus.c:754-757, 874):
    // the controller enters allophone 1 (/k/, 49) at packet 1, PH shows it at 2.
    const frames = trace([
      [0, 0],
      [1, 0],
      [1, 49],
      [2, 49],
      [2, 5],
    ]);
    expect(controllerPhones(frames)).toEqual(["SIL", "K", "K", "AE", "AE"]);
  });

  it("labels by phone code, so a clause restart of phoneIndex does not shift the labels", () => {
    // Two clauses: phoneIndex runs 0,1 (/s/, 41) then restarts at 0,1 (/w/, 24).
    const frames = trace([
      [0, 0],
      [1, 0],
      [1, 41],
      [0, 41],
      [1, 0],
      [1, 24],
      [1, 24],
    ]);
    expect(controllerPhones(frames)).toEqual(["SIL", "S", "S", "SIL", "W", "W", "W"]);
    expect(sameSegmentLabel(frames, 1, "S")).toBe(true);
    expect(sameSegmentLabel(frames, 4, "W")).toBe(true);
    expect(sameSegmentLabel(frames, 4, "S")).toBe(false);
  });

  it("accepts the frontend's SIL label for DECtalk's dummy release vowel before a silence", () => {
    // ph_inton1.c Rule 9 (1780-1820): /t/ (47) releases into IX (18), then silence.
    const frames = trace([
      [1, 5],
      [2, 47],
      [2, 18],
      [3, 18],
      [3, 0],
    ]);
    expect(controllerPhones(frames)).toEqual(["T", "IX", "IX", "SIL", "SIL"]);
    expect(sameSegmentLabel(frames, 1, "SIL")).toBe(true);
    expect(sameSegmentLabel(frames, 1, "T")).toBe(false);
  });

  it("does not accept SIL for an IX that a phone follows", () => {
    const frames = trace([
      [1, 5],
      [2, 18],
      [2, 18],
      [3, 47],
      [3, 47],
    ]);
    expect(controllerPhones(frames)).toEqual(["IX", "IX", "T", "T", "T"]);
    expect(sameSegmentLabel(frames, 0, "SIL")).toBe(false);
  });

  it("has no verdict without a Qlatt label", () => {
    const frames = trace([[0, 0]]);
    expect(sameSegmentLabel(frames, 0, undefined)).toBeNull();
  });
});
