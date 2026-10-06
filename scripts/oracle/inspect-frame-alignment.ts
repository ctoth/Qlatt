#!/usr/bin/env node
// Per-frame view of a scoreboard run (run-corpus.ts output): DECtalk's emitted
// packet beside the Qlatt event at the same packet time.
//
//   --run-root DIR                 corpus run directory (one sub-directory a phrase)
//   --phrase-id ID                 print the frame table for one phrase
//   --params F1,AV,...             columns for the table (oracle/qlatt); default none
//   --frames A-B                   restrict the table to packets A..B
//   --changes                      only rows where a Segment label changes
//
// Without --phrase-id it tallies, over the run, the frames whose Segment labels
// disagree on the controller clock (see frame-parameters.ts) by label pair.
import fs from "node:fs";
import path from "node:path";
import { dectalkFrameStartSec, parseDectalkTraceFile } from "./dectalk-trace";
import {
  eventIndexAt,
  FRAME_PARAMETERS,
  oracleSourceClockPhoneCode,
  phoneCodeToQlatt,
  qlattValue,
  sameSegmentLabel,
  type TrackEvent,
} from "./frame-parameters";

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function format(value: number | null): string {
  if (value == null) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function main(): void {
  const runRoot = flag("run-root");
  if (!runRoot) {
    throw new Error(
      "Usage: inspect-frame-alignment --run-root dir [--phrase-id id] [--params F1,AV] [--frames A-B] [--changes]",
    );
  }
  const only = flag("phrase-id");
  const labels = (flag("params") ?? "").split(",").filter((label) => label.length > 0);
  const columns = labels.map((label) => {
    const parameter = FRAME_PARAMETERS.find((entry) => entry.label === label);
    if (!parameter) throw new Error(`Unknown parameter ${label}`);
    return parameter;
  });
  const [firstFrame, lastFrame] = (flag("frames") ?? "0-1000000").split("-").map(Number);
  const changesOnly = process.argv.includes("--changes");
  const pairCounts = new Map<string, number>();
  let frames = 0;
  let different = 0;

  for (const entry of fs.readdirSync(runRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (only && entry.name !== only) continue;
    const dir = path.join(runRoot, entry.name);
    const tracePath = path.join(dir, "oracle", "oracle.trace.jsonl");
    const payloadPath = path.join(dir, "qlatt", "qlatt.json");
    if (!fs.existsSync(tracePath) || !fs.existsSync(payloadPath)) continue;
    const oracle = parseDectalkTraceFile(tracePath).frames;
    const track = (JSON.parse(fs.readFileSync(payloadPath, "utf8")) as { track: TrackEvent[] })
      .track;
    if (only) {
      process.stdout.write(
        `frame\tt_ms\tphIdx\tPH\tctlPH\tqlatt\tsame\t${columns.map((column) => column.label).join("\t")}\n`,
      );
    }
    let previousKey = "";
    for (let index = 0; index < oracle.length; index += 1) {
      const frame = oracle[index]!;
      const timeSec = dectalkFrameStartSec(frame.frame);
      const eventIndex = eventIndexAt(track, timeSec);
      const event = eventIndex >= 0 ? track[eventIndex] : undefined;
      const controllerPhone = phoneCodeToQlatt(oracleSourceClockPhoneCode(oracle, index));
      const same = sameSegmentLabel(oracle, index, event?.phoneme);
      frames += 1;
      if (same === false) {
        different += 1;
        const pair = `${entry.name}: ${controllerPhone} -> ${event?.phoneme ?? "(none)"}`;
        pairCounts.set(pair, (pairCounts.get(pair) ?? 0) + 1);
      }
      if (!only || frame.frame < firstFrame! || frame.frame > lastFrame!) continue;
      const key = `${frame.phoneIndex}|${frame.out.PH}|${event?.phoneme ?? ""}`;
      const changed = key !== previousKey;
      previousKey = key;
      if (changesOnly && !changed) continue;
      const cells = columns.map(
        (column) =>
          `${format(column.oracleValue(frame))}/${format(qlattValue(event, column.qlatt))}`,
      );
      process.stdout.write(
        `${frame.frame}\t${(timeSec * 1000).toFixed(2)}\t${frame.phoneIndex}\t${phoneCodeToQlatt(frame.out.PH)}\t${controllerPhone}\t${event?.phoneme ?? "(none)"}\t${same == null ? "?" : same ? "y" : "N"}\t${cells.join("\t")}\n`,
      );
    }
  }

  if (!only) {
    process.stdout.write(`frames ${frames}; Segment label differs on ${different}\n`);
    for (const [pair, count] of [...pairCounts.entries()].sort((a, b) => b[1] - a[1])) {
      process.stdout.write(`${count}\t${pair}\n`);
    }
  }
}

main();
