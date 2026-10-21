#!/usr/bin/env node
// Ranks where the per-frame parameter error of a scoreboard run lies, by
// mechanism-shaped buckets instead of by phrase:
//
//   parameter x class of the phone DECtalk's controller is in x part of that
//   phone (its first frames, its last frames, the middle) x class of the
//   neighbouring phone on that side.
//
// A bucket's "mass" is the sum of |Qlatt - DECtalk| over its frames; its share
// is of the parameter's total. Frames whose Segment labels disagree are a
// timing error, not a parameter error, and are tallied apart as `misaligned`.
//
//   --run-root DIR   corpus run directory
//   --edge N         frames counted as a phone's onset/offset (default 5)
//   --limit N        buckets printed per parameter (default 8)
//   --params A,B     restrict to these parameters
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
  trackValueOf,
} from "./frame-parameters";

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

// p_all_ph.h US phone codes grouped by manner.
function phoneClass(code: number | null): string {
  if (code == null) return "?";
  const index = code & 0xff;
  if (index === 0) return "sil";
  if (index <= 23) return "vowel";
  if (index <= 27 || index === 29 || index === 30) return "sonorant";
  if (index === 28) return "h";
  if (index <= 33 || index === 34 || index === 36) return "nasal";
  if (index === 35 || (index >= 37 && index <= 44)) return "fricative";
  if (index === 54 || index === 55) return "affricate";
  return "stop";
}

type Bucket = { frames: number; mass: number; signed: number; example: string };

function main(): void {
  const runRoot = flag("run-root");
  if (!runRoot) throw new Error("Usage: rank-frame-causes --run-root dir [--edge 5] [--limit 8]");
  const edge = Number(flag("edge") ?? 5);
  const limit = Number(flag("limit") ?? 8);
  const wanted = (flag("params") ?? "").split(",").filter((label) => label.length > 0);
  const parameters = FRAME_PARAMETERS.filter(
    (parameter) => wanted.length === 0 || wanted.includes(parameter.label),
  );
  const buckets = new Map<string, Map<string, Bucket>>();
  const totals = new Map<string, { frames: number; mass: number }>();

  for (const entry of fs.readdirSync(runRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(runRoot, entry.name);
    const tracePath = path.join(dir, "oracle", "oracle.trace.jsonl");
    const payloadPath = path.join(dir, "qlatt", "qlatt.json");
    if (!fs.existsSync(tracePath) || !fs.existsSync(payloadPath)) continue;
    const oracle = parseDectalkTraceFile(tracePath).frames;
    const track = (JSON.parse(fs.readFileSync(payloadPath, "utf8")) as { track: TrackEvent[] })
      .track;
    const codes = oracle.map((_, index) => oracleSourceClockPhoneCode(oracle, index));
    // Runs of one controller phone: [start, end) packet indices.
    const runStart: number[] = [];
    const runEnd: number[] = [];
    for (let index = 0; index < oracle.length; index += 1) {
      const sameAsPrevious =
        index > 0 &&
        codes[index] === codes[index - 1] &&
        oracle[index]!.phoneIndex === oracle[index - 1]!.phoneIndex;
      runStart.push(sameAsPrevious ? runStart[index - 1]! : index);
    }
    for (let index = oracle.length - 1; index >= 0; index -= 1) {
      const sameAsNext = index + 1 < oracle.length && runStart[index + 1] === runStart[index];
      runEnd[index] = sameAsNext ? runEnd[index + 1]! : index + 1;
    }

    for (let index = 0; index < oracle.length; index += 1) {
      const frame = oracle[index]!;
      const event = track[eventIndexAt(track, dectalkFrameStartSec(frame.frame))];
      const same = sameSegmentLabel(oracle, index, event?.phoneme);
      const start = runStart[index]!;
      const end = runEnd[index]!;
      const previousClass = start > 0 ? phoneClass(codes[start - 1]!) : "start";
      const nextClass = end < oracle.length ? phoneClass(codes[end]!) : "end";
      const ownClass = phoneClass(codes[index]!);
      let where: string;
      if (same !== true) where = "misaligned";
      else if (index - start < edge) where = `${ownClass} onset after ${previousClass}`;
      else if (end - index <= edge) where = `${ownClass} offset before ${nextClass}`;
      else where = `${ownClass} middle`;

      for (const parameter of parameters) {
        const oracleValue = parameter.oracleValue(frame);
        const qlatt = trackValueOf(event, parameter);
        if (oracleValue == null || qlatt == null) continue;
        if (parameter.label === "F0") {
          // Pitch is audible only where both are voiced (summarize-trace-run.ts).
          if (frame.out.AV <= 0 || (qlattValue(event, "AV") ?? 0) <= 0) continue;
        }
        const difference = qlatt - oracleValue;
        const byWhere = buckets.get(parameter.label) ?? new Map<string, Bucket>();
        buckets.set(parameter.label, byWhere);
        const bucket = byWhere.get(where) ?? { frames: 0, mass: 0, signed: 0, example: "" };
        byWhere.set(where, bucket);
        bucket.frames += 1;
        bucket.mass += Math.abs(difference);
        bucket.signed += difference;
        if (!bucket.example && Math.abs(difference) > 0) {
          bucket.example = `${entry.name}#${frame.frame} ${phoneCodeToQlatt(codes[index])} dectalk=${oracleValue} qlatt=${Number(qlatt.toFixed(1))}`;
        }
        const total = totals.get(parameter.label) ?? { frames: 0, mass: 0 };
        totals.set(parameter.label, total);
        total.frames += 1;
        total.mass += Math.abs(difference);
      }
    }
  }

  for (const parameter of parameters) {
    const total = totals.get(parameter.label);
    const byWhere = buckets.get(parameter.label);
    if (!total || !byWhere) continue;
    process.stdout.write(
      `\n${parameter.label}: mean abs ${(total.mass / total.frames).toFixed(2)} over ${total.frames} frames\n`,
    );
    const ranked = [...byWhere.entries()].sort((a, b) => b[1].mass - a[1].mass).slice(0, limit);
    for (const [where, bucket] of ranked) {
      process.stdout.write(
        `  ${((100 * bucket.mass) / total.mass).toFixed(1).padStart(5)}%  ${where.padEnd(34)} frames ${String(bucket.frames).padStart(5)}  mean abs ${(bucket.mass / bucket.frames).toFixed(1).padStart(6)}  mean signed ${(bucket.signed / bucket.frames).toFixed(1).padStart(7)}  e.g. ${bucket.example}\n`,
      );
    }
  }
}

main();
