// DECtalk's emitted parameter packets for an oracle corpus, as a checked-in
// fixture: test/fixtures/dectalk-oracle/<corpus>.frames.json, written by
// export-frame-fixture.ts and read by test/dectalk-frame-gate.test.ts.
//
// One entry a phrase; one column a trace field; each column run-length encoded
// as [value, count, value, count, ...] because pauses repeat one packet.
import type { DectalkTraceFrame } from "./dectalk-trace";

/** Trace fields kept, in file order. `f0prime` and `phoneIndex` sit beside `out`. */
export const FRAME_FIXTURE_COLUMNS = [
  "f0prime",
  "phoneIndex",
  "PH",
  "F1",
  "F2",
  "F3",
  "B1",
  "B2",
  "B3",
  "AV",
  "AP",
  "A2",
  "A3",
  "A4",
  "A5",
  "A6",
  "AB",
  "TLT",
] as const;

export type FrameFixtureColumn = (typeof FRAME_FIXTURE_COLUMNS)[number];

export type FrameFixtureEntry = {
  text: string;
  packets: number;
  runs: Record<FrameFixtureColumn, number[]>;
};

export type FrameFixture = {
  schemaVersion: "v1";
  corpusId: string;
  engine: string;
  columns: readonly FrameFixtureColumn[];
  entries: Record<string, FrameFixtureEntry>;
};

function columnValue(frame: DectalkTraceFrame, column: FrameFixtureColumn): number {
  if (column === "f0prime") return frame.f0prime;
  if (column === "phoneIndex") return frame.phoneIndex;
  return frame.out[column];
}

export function encodeRuns(values: readonly number[]): number[] {
  const runs: number[] = [];
  for (const value of values) {
    if (runs.length > 0 && runs[runs.length - 2] === value) {
      runs[runs.length - 1] = (runs[runs.length - 1] as number) + 1;
    } else {
      runs.push(value, 1);
    }
  }
  return runs;
}

export function decodeRuns(runs: readonly number[]): number[] {
  const values: number[] = [];
  for (let index = 0; index + 1 < runs.length; index += 2) {
    const value = runs[index] as number;
    const count = runs[index + 1] as number;
    for (let repeat = 0; repeat < count; repeat += 1) values.push(value);
  }
  return values;
}

export function encodeFrameFixtureEntry(
  text: string,
  frames: readonly DectalkTraceFrame[],
): FrameFixtureEntry {
  return {
    text,
    packets: frames.length,
    runs: Object.fromEntries(
      FRAME_FIXTURE_COLUMNS.map((column) => [
        column,
        encodeRuns(frames.map((frame) => columnValue(frame, column))),
      ]),
    ) as Record<FrameFixtureColumn, number[]>,
  };
}

/** The packets of one entry. Fields the fixture does not keep (DU, PH2, T0) read 0. */
export function decodeFrameFixtureEntry(entry: FrameFixtureEntry): DectalkTraceFrame[] {
  const columns = Object.fromEntries(
    FRAME_FIXTURE_COLUMNS.map((column) => [column, decodeRuns(entry.runs[column])]),
  ) as Record<FrameFixtureColumn, number[]>;
  for (const column of FRAME_FIXTURE_COLUMNS) {
    if (columns[column].length !== entry.packets) {
      throw new Error(
        `E_FRAME_FIXTURE: column ${column} has ${columns[column].length} packets, entry says ${entry.packets}`,
      );
    }
  }
  const at = (column: FrameFixtureColumn, index: number): number =>
    columns[column][index] as number;
  return Array.from({ length: entry.packets }, (_, index) => ({
    frame: index,
    timeFrames: index,
    tcum: 0,
    phoneIndex: at("phoneIndex", index),
    f0prime: at("f0prime", index),
    out: {
      PH: at("PH", index),
      DU: 0,
      PH2: 0,
      T0: 0,
      F1: at("F1", index),
      F2: at("F2", index),
      F3: at("F3", index),
      B1: at("B1", index),
      B2: at("B2", index),
      B3: at("B3", index),
      AV: at("AV", index),
      AP: at("AP", index),
      A2: at("A2", index),
      A3: at("A3", index),
      A4: at("A4", index),
      A5: at("A5", index),
      A6: at("A6", index),
      AB: at("AB", index),
      TLT: at("TLT", index),
    },
  }));
}
