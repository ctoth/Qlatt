/**
 * Reader for the DECtalk vocal tract model fixtures that
 * `scripts/oracle/export-dectalk-vtm-fixture.ts` writes (record format in
 * `scripts/oracle/dectalk-debug/vtm-trace.md`).
 *
 * A fixture `<id>` is three files:
 *   <id>.hl.txt      S (speaker definition), V (shared speaker values) and
 *                    P (PH packet) lines, in the order DECtalk handled them
 *   <id>.frames.txt  F lines: the frame the vocal tract model read for each
 *                    packet, with `vol_att` as its first number
 *   <id>.wav         the stock say.exe output, 16-bit mono 11025 Hz
 */

import fs from "node:fs";
import path from "node:path";
import {
  SPDEF_PARS,
  SPEAKER_WORDS,
  VOICE_PARS,
  type VtmEvent,
  type VtmSpeakerEvent,
} from "../../src/dectalk-vtm-track.ts";

export interface VtmFixture {
  id: string;
  /** Speaker definitions and packets in DECtalk's order. */
  events: VtmEvent[];
  /** The frame DECtalk's vocal tract model read for each packet (`F` lines). */
  frames: number[][];
  /** The stock say.exe samples. */
  samples: Int16Array;
  sampleRate: number;
}

function integers(fields: string[], count: number, where: string): number[] {
  if (fields.length !== count) {
    throw new Error(`${where}: expected ${count} words, found ${fields.length}`);
  }
  return fields.map((field) => {
    const value = Number(field);
    if (!Number.isInteger(value)) throw new Error(`${where}: bad word '${field}'`);
    return value;
  });
}

/** 16-bit mono PCM samples and the sample rate of a RIFF/WAVE file. */
export function readWavInt16(file: string): { samples: Int16Array; sampleRate: number } {
  const bytes = fs.readFileSync(file);
  if (bytes.toString("latin1", 0, 4) !== "RIFF" || bytes.toString("latin1", 8, 12) !== "WAVE") {
    throw new Error(`${file}: not a RIFF/WAVE file`);
  }
  let sampleRate = 0;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = bytes.toString("latin1", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === "fmt ") {
      const format = bytes.readUInt16LE(start);
      const channels = bytes.readUInt16LE(start + 2);
      const bits = bytes.readUInt16LE(start + 14);
      if (format !== 1 || channels !== 1 || bits !== 16) {
        throw new Error(`${file}: expected 16-bit mono PCM`);
      }
      sampleRate = bytes.readUInt32LE(start + 4);
    } else if (id === "data") {
      const end = Math.min(start + size, bytes.length);
      const samples = new Int16Array((end - start) >> 1);
      for (let i = 0; i < samples.length; i += 1) samples[i] = bytes.readInt16LE(start + 2 * i);
      return { samples, sampleRate };
    }
    offset = start + size + (size & 1);
  }
  throw new Error(`${file}: no data chunk`);
}

export function readVtmFixture(directory: string, id: string): VtmFixture {
  const framesFile = path.join(directory, `${id}.frames.txt`);
  const frames: number[][] = [];
  const volAtt: number[] = [];
  fs.readFileSync(framesFile, "utf8")
    .split(/\r?\n/)
    .forEach((line, index) => {
      const fields = line.trim().split(/\s+/);
      if (fields[0] !== "F") return;
      volAtt.push(integers([fields[1]], 1, `${framesFile}:${index + 1}`)[0]);
      frames.push(integers(fields.slice(3), VOICE_PARS, `${framesFile}:${index + 1}`));
    });

  const hlFile = path.join(directory, `${id}.hl.txt`);
  const events: VtmEvent[] = [];
  let pendingSpdef: number[] | undefined;
  let packets = 0;
  fs.readFileSync(hlFile, "utf8")
    .split(/\r?\n/)
    .forEach((line, index) => {
      const where = `${hlFile}:${index + 1}`;
      const fields = line.trim().split(/\s+/);
      const words = fields.slice(3);
      switch (fields[0]) {
        case "S":
          pendingSpdef = integers(words, SPDEF_PARS, where);
          break;
        case "V": {
          if (!pendingSpdef) throw new Error(`${where}: V without S`);
          const [nomOpenQuo, tiltm] = integers(words, 2, where);
          const speaker: VtmSpeakerEvent = {
            kind: "speaker",
            spdef: pendingSpdef,
            lastVoice: integers([fields[1]], 1, where)[0],
            nomOpenQuo,
            tiltm,
          };
          events.push(speaker);
          pendingSpdef = undefined;
          break;
        }
        case "P": {
          if (packets >= volAtt.length) throw new Error(`${where}: more P lines than F lines`);
          events.push({
            kind: "packet",
            words: integers(words, VOICE_PARS, where),
            langCurr: integers([fields[1]], 1, where)[0],
            volAtt: volAtt[packets],
          });
          packets += 1;
          break;
        }
        default:
          // H, L, X, T, O, Q records, comments and blank lines are not input.
          break;
      }
    });
  if (pendingSpdef) throw new Error(`${hlFile}: S without V`);
  if (packets !== frames.length) {
    throw new Error(`${id}: ${packets} P lines but ${frames.length} F lines`);
  }

  const { samples, sampleRate } = readWavInt16(path.join(directory, `${id}.wav`));
  return { id, events, frames, samples, sampleRate };
}

/**
 * DECtalk's voices by number, `pKsd_t->last_voice` (voidef[] order,
 * DECtalk 4.63 PH/ph_main.c:511-519), as the dectalk-english frontend names
 * its voice files.
 */
export const DECTALK_VOICES = [
  "paul",
  "betty",
  "harry",
  "frank",
  "dennis",
  "kit",
  "ursula",
  "rita",
  "wendy",
] as const;

/** A voice's recorded speaker definition, by `dectalk-vtm` parameter name. */
export interface RecordedSpeakerPacket {
  voice: string;
  fields: Record<string, number>;
}

/**
 * The speaker definition the stock say.exe sent for each voice: every `S`
 * record of a `.speakers.txt` fixture with the `V` record after it
 * (`V <last_voice> 0 <NOM_Open_Quo> <Tiltm>`), reduced to the words the
 * synthesizer reads.
 */
export function readRecordedSpeakerPackets(file: string): RecordedSpeakerPacket[] {
  const out: RecordedSpeakerPacket[] = [];
  let spdef: number[] | undefined;
  fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, index) => {
      const where = `${file}:${index + 1}`;
      const fields = line.trim().split(/\s+/);
      if (fields[0] === "S") {
        spdef = integers(fields.slice(3), SPDEF_PARS, where);
      } else if (fields[0] === "V") {
        if (!spdef) throw new Error(`${where}: V without S`);
        const [lastVoice, , nomOpenQuo, tiltm] = integers(fields.slice(1), 4, where);
        const voice = DECTALK_VOICES[lastVoice as number];
        if (voice === undefined) throw new Error(`${where}: no voice ${lastVoice}`);
        const record: Record<string, number> = {};
        for (const [name, word] of SPEAKER_WORDS) record[name] = spdef[word] as number;
        record.last_voice = lastVoice as number;
        record.NOM_Open_Quo = nomOpenQuo as number;
        record.Tiltm = tiltm as number;
        out.push({ voice, fields: record });
        spdef = undefined;
      }
    });
  return out;
}

/** Ids of the fixtures in a directory that have all three files. */
export function listVtmFixtures(directory: string): string[] {
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".hl.txt"))
    .map((name) => name.slice(0, -".hl.txt".length))
    .filter(
      (id) =>
        fs.existsSync(path.join(directory, `${id}.frames.txt`)) &&
        fs.existsSync(path.join(directory, `${id}.wav`)),
    )
    .sort();
}
