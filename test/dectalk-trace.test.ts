import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DECTALK_NATIVE_SAMPLE_RATE_HZ,
  DECTALK_SAMPLES_PER_FRAME,
  dectalkFrameStartSample,
  dectalkFrameStartSec,
  parseDectalkTraceJsonl,
} from "../scripts/oracle/dectalk-trace";

describe("DECtalk trace packet timing", () => {
  it("maps every emitted VTM packet to its exact 71-sample native block", () => {
    expect(DECTALK_NATIVE_SAMPLE_RATE_HZ).toBe(11_025);
    expect(DECTALK_SAMPLES_PER_FRAME).toBe(71);
    expect(dectalkFrameStartSample(0)).toBe(0);
    expect(dectalkFrameStartSample(1)).toBe(71);
    expect(dectalkFrameStartSample(2)).toBe(142);
    expect(dectalkFrameStartSec(2)).toBe(142 / 11_025);
  });

  it("summarizes trace duration from emitted native packets, not nominal control time", () => {
    const trace = [
      JSON.stringify({
        frame: 0,
        timeFrames: 0,
        tcum: 1,
        phoneIndex: 0,
        f0prime: 1000,
        out: {},
      }),
      JSON.stringify({
        frame: 1,
        timeFrames: 1,
        tcum: 2,
        phoneIndex: 0,
        f0prime: 1000,
        out: {},
      }),
    ].join("\n");

    const { summary } = parseDectalkTraceJsonl(trace);

    expect(summary.durationSamples).toBe(142);
    expect(summary.durationSec).toBe(142 / 11_025);
  });

  it("compares Qlatt controls at the native packet start rather than nominal 6.4 ms", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "qlatt-dectalk-trace-"));
    try {
      const tracePath = path.join(directory, "oracle.trace.jsonl");
      const payloadPath = path.join(directory, "qlatt.json");
      writeFileSync(
        tracePath,
        [
          JSON.stringify({
            frame: 0,
            timeFrames: 0,
            tcum: 1,
            phoneIndex: 0,
            f0prime: 1000,
            out: { F1: 100 },
          }),
          JSON.stringify({
            frame: 1,
            timeFrames: 1,
            tcum: 2,
            phoneIndex: 0,
            f0prime: 1000,
            out: { F1: 200 },
          }),
        ].join("\n"),
      );
      writeFileSync(
        payloadPath,
        JSON.stringify({
          track: [
            { time: 0, params: { F1: 100 } },
            { time: 0.0064, params: { F1: 999 } },
            { time: 71 / 11_025, params: { F1: 200 } },
          ],
        }),
      );

      const stdout = execFileSync(
        process.execPath,
        [
          "--loader",
          "ts-node/esm/transpile-only",
          "--experimental-specifier-resolution=node",
          "scripts/oracle/compare-trace.ts",
          "--oracle-trace",
          tracePath,
          "--qlatt-payload",
          payloadPath,
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      );
      const report: unknown = JSON.parse(stdout);
      const params = objectAt(report, "params");
      const f1 = objectAt(params, "F1");

      expect(numberAt(f1, "maxAbs")).toBe(0);
      expect(arrayAt(f1, "mismatchRanges")).toHaveLength(0);
      expect(f1.firstMismatch).toBeNull();
      expect(numberAt(report, "oracleDurationSec")).toBe(142 / 11_025);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("summarizes events within the comparator's packet-time tolerance", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "qlatt-dectalk-summary-"));
    try {
      const phraseId = "packet-boundary";
      const phraseRoot = path.join(directory, phraseId);
      const oracleDirectory = path.join(phraseRoot, "oracle");
      const qlattDirectory = path.join(phraseRoot, "qlatt");
      mkdirSync(oracleDirectory, { recursive: true });
      mkdirSync(qlattDirectory, { recursive: true });
      const packetTime = dectalkFrameStartSec(57);
      writeFileSync(
        path.join(oracleDirectory, "oracle.trace.jsonl"),
        JSON.stringify({
          frame: 57,
          timeFrames: 57,
          tcum: 58,
          phoneIndex: 0,
          f0prime: 1000,
          out: { AP: 0, AV: 0, TLT: 0 },
        }),
      );
      writeFileSync(
        path.join(qlattDirectory, "qlatt.json"),
        JSON.stringify({
          track: [
            { time: packetTime - 0.001, params: { AH: 0, AV: 0, TL: 0 } },
            { time: packetTime + Number.EPSILON, params: { AH: 48, AV: 65, TL: 10 } },
          ],
        }),
      );
      writeFileSync(
        path.join(directory, `${phraseId}-trace-compare.json`),
        JSON.stringify({
          params: {
            AP: { compared: 1, meanAbs: 48, maxAbs: 48, maxFrame: 57 },
            AV: { compared: 1, meanAbs: 65, maxAbs: 65, maxFrame: 57 },
            TLT: { compared: 1, meanAbs: 10, maxAbs: 10, maxFrame: 57 },
          },
          oraclePhoneGroups: [],
          qlattTrackRuns: [],
        }),
      );

      const stdout = execFileSync(
        process.execPath,
        [
          "--loader",
          "ts-node/esm/transpile-only",
          "--experimental-specifier-resolution=node",
          "scripts/oracle/summarize-phrase-window.ts",
          "--run-root",
          directory,
          "--phrase-id",
          phraseId,
          "--param",
          "AV",
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(stdout).toContain("qlattAV=65 delta=65.000");

      const apStdout = execFileSync(
        process.execPath,
        [
          "--loader",
          "ts-node/esm/transpile-only",
          "--experimental-specifier-resolution=node",
          "scripts/oracle/summarize-phrase-window.ts",
          "--run-root",
          directory,
          "--phrase-id",
          phraseId,
          "--param",
          "AP",
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(apStdout).toContain("qlattAP=48 delta=48.000");

      const tltStdout = execFileSync(
        process.execPath,
        [
          "--loader",
          "ts-node/esm/transpile-only",
          "--experimental-specifier-resolution=node",
          "scripts/oracle/summarize-phrase-window.ts",
          "--run-root",
          directory,
          "--phrase-id",
          phraseId,
          "--param",
          "TLT",
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(tltStdout).toContain("qlattTLT=10 delta=10.000");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("recomputes a same-segment bucket from cells within the requested phase delta", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "qlatt-dectalk-phase-summary-"));
    try {
      const phraseId = "phase-filter";
      const phraseRoot = path.join(directory, phraseId);
      const oracleDirectory = path.join(phraseRoot, "oracle");
      const qlattDirectory = path.join(phraseRoot, "qlatt");
      mkdirSync(oracleDirectory, { recursive: true });
      mkdirSync(qlattDirectory, { recursive: true });
      writeFileSync(
        path.join(oracleDirectory, "oracle.trace.jsonl"),
        [0, 1, 2]
          .map((frame) =>
            JSON.stringify({
              frame,
              timeFrames: frame,
              tcum: frame + 1,
              phoneIndex: 1,
              f0prime: 1000,
              out: { PH: 288, B3: 100 },
            }),
          )
          .join("\n"),
      );
      writeFileSync(
        path.join(oracleDirectory, "oracle.json"),
        JSON.stringify({ symbolic: { comparisonTokens: ["n"] } }),
      );
      writeFileSync(
        path.join(qlattDirectory, "qlatt.json"),
        JSON.stringify({
          track: [
            { time: 0, phoneme: "N", params: { B3: 100 } },
            { time: 0.0064, phoneme: "N", params: { B3: 999 } },
            { time: dectalkFrameStartSec(1), phoneme: "N", params: { B3: 130 } },
            { time: 0.0128, phoneme: "N", params: { B3: 999 } },
            { time: dectalkFrameStartSec(2), phoneme: "N", params: { B3: 160 } },
            { time: 0.0384, phoneme: "IH", params: { B3: 190 } },
          ],
        }),
      );

      const stdout = execFileSync(
        process.execPath,
        [
          "--loader",
          "ts-node/esm/transpile-only",
          "--experimental-specifier-resolution=node",
          "scripts/oracle/summarize-trace-run.ts",
          "--run-root",
          directory,
          "--max-phase-delta",
          "0.2",
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      );
      const report: unknown = JSON.parse(stdout);
      const phrases = arrayAt(report, "phrases");
      const phrase = phrases[0];
      const params = objectAt(phrase, "params");
      const b3 = objectAt(params, "B3");
      const sameSegment = objectAt(b3, "sameSegment");
      const phaseAligned = objectAt(b3, "phaseAlignedSameSegment");

      expect(numberAt(sameSegment, "compared")).toBe(3);
      expect(numberAt(sameSegment, "maxAbs")).toBe(60);
      expect(numberAt(phaseAligned, "compared")).toBe(2);
      expect(numberAt(phaseAligned, "meanAbs")).toBe(15);
      expect(numberAt(phaseAligned, "maxAbs")).toBe(30);
      expect(numberAt(phaseAligned, "maxFrame")).toBe(1);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("ranks the phase-aligned bucket rather than the unknown-segment bucket", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "qlatt-dectalk-phase-rank-"));
    try {
      const summaryPath = path.join(directory, "trace-summary.json");
      writeFileSync(
        summaryPath,
        JSON.stringify({
          phrases: [
            {
              phraseId: "phase-rank",
              params: {
                B3: {
                  phaseAlignedSameSegment: {
                    compared: 3,
                    meanAbs: 15,
                    maxAbs: 30,
                    maxFrame: 7,
                    oracleAtMax: 100,
                    qlattAtMax: 130,
                    maxOraclePhone: "N",
                    maxOracleOutputPhone: "N",
                    maxQlattPhone: "N",
                    maxOracleSegmentPhase: 0.4,
                    maxQlattSegmentPhase: 0.5,
                    maxSegmentPhaseDelta: 0.1,
                  },
                  unknownSegment: {
                    compared: 2,
                    meanAbs: 502,
                    maxAbs: 502,
                    maxFrame: 0,
                  },
                },
              },
            },
          ],
        }),
      );

      const stdout = execFileSync(
        process.execPath,
        [
          "--loader",
          "ts-node/esm/transpile-only",
          "--experimental-specifier-resolution=node",
          "scripts/oracle/rank-trace-targets.ts",
          "--summary",
          summaryPath,
          "--bucket",
          "phaseAlignedSameSegment",
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(stdout).toContain("phase-rank\tB3\t3\t15.000\t30.000\t7\t100.000\t130.000");
      expect(stdout).toContain("N/N/N\t0.4000/0.5000\t0.1000");
      expect(stdout).not.toContain("502.000");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function objectAt(value: unknown, key: string): Record<string, unknown> {
  if (!isRecord(value) || !isRecord(value[key])) {
    throw new Error(`Expected object at ${key}`);
  }
  return value[key];
}

function numberAt(value: unknown, key: string): number {
  if (!isRecord(value) || typeof value[key] !== "number") {
    throw new Error(`Expected number at ${key}`);
  }
  return value[key];
}

function arrayAt(value: unknown, key: string): unknown[] {
  if (!isRecord(value) || !Array.isArray(value[key])) {
    throw new Error(`Expected array at ${key}`);
  }
  return value[key];
}
