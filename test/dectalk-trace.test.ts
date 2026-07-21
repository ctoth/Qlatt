import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
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
          JSON.stringify({ frame: 0, timeFrames: 0, tcum: 1, phoneIndex: 0, f0prime: 1000, out: { F1: 100 } }),
          JSON.stringify({ frame: 1, timeFrames: 1, tcum: 2, phoneIndex: 0, f0prime: 1000, out: { F1: 200 } }),
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
          out: { AP: 0, AV: 0 },
        }),
      );
      writeFileSync(
        path.join(qlattDirectory, "qlatt.json"),
        JSON.stringify({
          track: [
            { time: packetTime - 0.001, params: { AH: 0, AV: 0 } },
            { time: packetTime + Number.EPSILON, params: { AH: 48, AV: 65 } },
          ],
        }),
      );
      writeFileSync(
        path.join(directory, `${phraseId}-trace-compare.json`),
        JSON.stringify({
          params: {
            AP: { compared: 1, meanAbs: 48, maxAbs: 48, maxFrame: 57 },
            AV: { compared: 1, meanAbs: 65, maxAbs: 65, maxFrame: 57 },
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
