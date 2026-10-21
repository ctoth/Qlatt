/**
 * The frame track of the `dectalk-vtm` experiment: DECtalk 4.63's PH packets
 * and speaker definitions as `KlattFrame`s.
 *
 * The words, their order and their scales are DECtalk's, documented word by
 * word in `scripts/oracle/dectalk-debug/ph-contract.md`. A track parameter
 * carries the packet word itself (an integer); only F0 is in Hz. The node's
 * parameters have DECtalk's names (`OUT_*`, `SPD_*`); the track's keys for the
 * packet words are the frontend's columns ([`PACKET_TRACK_KEYS`]).
 */

import type { KlattFrame } from "./klatt-interpreter";

/** Words in a voice packet. DECtalk 4.63 `PH/ph_defs.h:382` (`VOICE_PARS`). */
export const VOICE_PARS = 45;
/** Words in a speaker definition packet. `PH/ph_defs.h:388` (`SPDEF_PARS`). */
export const SPDEF_PARS = 51;

/**
 * One frame is 71 samples at 11025 Hz. DECtalk 4.63 `VTM/vtm3.c:2400-2411`.
 */
export const FRAME_SAMPLES = 71;
export const DECTALK_SAMPLE_RATE = 11025;
export const FRAME_PERIOD_SEC = FRAME_SAMPLES / DECTALK_SAMPLE_RATE;

/**
 * The voice packet words that reach the synthesizer, with their index in the
 * packet (`OUT_*`, `PH/ph_defs.h:559-604`). The other words are overwritten by
 * the VTM thread before anything reads them, or are never read
 * (ph-contract.md, "Words PH writes that the VTM thread ignores"). `OUT_DU`
 * and `OUT_PH2` are left out as well: the VTM thread only passes them to the
 * audio output for index-mark notifications (`VTM/vtmiont.c:1376-1377`).
 */
export const PACKET_WORDS: ReadonlyArray<readonly [name: string, index: number]> = [
  ["OUT_F1", 1],
  ["OUT_A2", 2],
  ["OUT_T0", 9],
  ["OUT_F2", 11],
  ["OUT_F3", 12],
  ["OUT_B2", 15],
  ["OUT_B3", 16],
  ["OUT_PH", 17],
  ["OUT_F4", 22],
  ["OUT_AG", 25],
  ["OUT_AL", 26],
  ["OUT_AN", 27],
  ["OUT_ABLADE", 28],
  ["OUT_PS", 29],
  ["OUT_CNK", 30],
  ["OUT_DC", 31],
  ["OUT_UE", 32],
  ["OUT_BRST", 35],
  ["OUT_ATB", 36],
  ["OUT_PLACE", 37],
];

/**
 * The track key that carries each packet word. These are the columns the
 * `dectalk-english` frontend's rules emit or are being written to emit (agreed
 * with the rule authors, 2026-10-07): the packet word itself, an integer, under
 * the `OUT_*` name without its prefix, except
 *
 * - `OUT_A2` is `A2_CODE` and `OUT_AN` is `AREA_N`, because `A2` and `AN`
 *   already name Klatt's dB levels in that frontend's track;
 * - `OUT_T0` has no column of its own: the track has `F0` in Hz and the
 *   semantics document forms the word, `round(F0 * 10)`.
 *
 * `PH` and `BRST` are this module's names for words no rule emits yet.
 */
export const F0_TRACK_KEY = "F0";
export const PACKET_TRACK_KEYS: Readonly<Record<string, string>> = {
  OUT_F1: "F1",
  OUT_A2: "A2_CODE",
  OUT_F2: "F2",
  OUT_F3: "F3",
  OUT_B2: "B2",
  OUT_B3: "B3",
  OUT_PH: "PH",
  OUT_F4: "F4",
  OUT_AG: "AG",
  OUT_AL: "AL",
  OUT_AN: "AREA_N",
  OUT_ABLADE: "ABLADE",
  OUT_PS: "PS",
  OUT_CNK: "CNK",
  OUT_DC: "DC",
  OUT_UE: "UE",
  OUT_BRST: "BRST",
  OUT_ATB: "ATB",
  OUT_PLACE: "PLACE",
};

/**
 * The speaker definition words the synthesizer reads, with their index in the
 * packet (struct `SPD_CHIP`, `PH/ph_defs.h:693-720`). `fnscale` (15) and
 * `rnpgain` (17) are stored and not used, `notused` (20) and `osgain` (21) are
 * not read, and `speaker` (22) is bookkeeping (ph-contract.md, "Per speaker").
 */
export const SPEAKER_WORDS: ReadonlyArray<readonly [name: string, index: number]> = [
  ["SPD_R4CB", 0],
  ["SPD_R4CC", 1],
  ["SPD_R5CB", 2],
  ["SPD_R5CC", 3],
  ["SPD_R4PB", 4],
  ["SPD_R5PB", 5],
  ["SPD_T0JIT", 6],
  ["SPD_R5CA", 7],
  ["SPD_R4CA", 8],
  ["SPD_R3CA", 9],
  ["SPD_R2CA", 10],
  ["SPD_R1CA", 11],
  ["SPD_NOPEN1", 12],
  ["SPD_NOPEN2", 13],
  ["SPD_ATURB", 14],
  ["SPD_AFGAIN", 16],
  ["SPD_AZGAIN", 18],
  ["SPD_APGAIN", 19],
  ["SPD_SEX", 23],
];

/**
 * Values the VTM thread reads that are in neither packet (ph-contract.md,
 * "Per speaker: hlsyn's speaker values" and "Other state the VTM thread
 * reads"), and the two controls of the node's frame clock
 * (`crates/dectalk-vtm/src/backend.rs`).
 */
export const SPEAKER_SHARED = ["last_voice", "NOM_Open_Quo", "Tiltm"] as const;
export const FRAME_SHARED = ["lang_curr", "vol_att"] as const;
export const RUN_PARAM = "run";
export const SPEAKER_EPOCH_PARAM = "speaker_epoch";

/** Every parameter of the node, in the order of its registry entry. */
export const NODE_PARAMS: readonly string[] = [
  RUN_PARAM,
  SPEAKER_EPOCH_PARAM,
  ...FRAME_SHARED,
  ...PACKET_WORDS.map(([name]) => name),
  ...SPEAKER_SHARED,
  ...SPEAKER_WORDS.map(([name]) => name),
];

/**
 * Every track parameter of the experiment's semantics document, in the order
 * of [`NODE_PARAMS`]: the node's own name except for the packet words.
 */
export const TRACK_PARAMS: readonly string[] = NODE_PARAMS.map((name) =>
  name === "OUT_T0" ? F0_TRACK_KEY : (PACKET_TRACK_KEYS[name] ?? name),
);

/** A speaker definition packet and the shared values read with it. */
export interface VtmSpeakerEvent {
  kind: "speaker";
  /** 51 words. */
  spdef: readonly number[];
  lastVoice: number;
  nomOpenQuo: number;
  tiltm: number;
}

/** A voice packet and the shared values read with it. */
export interface VtmPacketEvent {
  kind: "packet";
  /** 45 words. */
  words: readonly number[];
  langCurr: number;
  volAtt: number;
}

export type VtmEvent = VtmSpeakerEvent | VtmPacketEvent;

/**
 * Lays recorded VTM events out as a track: packet `n` is the frame at
 * `n * 71 / 11025` s, and a final frame ends the run. Every frame carries the
 * speaker definition in force; `speaker_epoch` counts the speaker packets
 * received so far, so the node reloads the definition at exactly the frame
 * DECtalk did, including when the same definition is sent again.
 */
export function vtmEventsToTrack(events: readonly VtmEvent[]): KlattFrame[] {
  const track: KlattFrame[] = [];
  let speaker: VtmSpeakerEvent | undefined;
  let epoch = 0;
  for (const event of events) {
    if (event.kind === "speaker") {
      if (event.spdef.length !== SPDEF_PARS) {
        throw new Error(`Speaker definition has ${event.spdef.length} words, not ${SPDEF_PARS}`);
      }
      speaker = event;
      epoch += 1;
      continue;
    }
    if (event.words.length !== VOICE_PARS) {
      throw new Error(`Voice packet has ${event.words.length} words, not ${VOICE_PARS}`);
    }
    if (!speaker) throw new Error("Voice packet before any speaker definition");
    const params: Record<string, number> = {
      [RUN_PARAM]: 1,
      [SPEAKER_EPOCH_PARAM]: epoch,
      lang_curr: event.langCurr,
      vol_att: event.volAtt,
      last_voice: speaker.lastVoice,
      NOM_Open_Quo: speaker.nomOpenQuo,
      Tiltm: speaker.tiltm,
    };
    for (const [name, index] of PACKET_WORDS) {
      const key = PACKET_TRACK_KEYS[name];
      // OUT_T0 is F0 in Hz x 10 (VTM/vtmiont.c:680); the track carries Hz.
      if (key === undefined) params[F0_TRACK_KEY] = event.words[index] / 10;
      else params[key] = event.words[index];
    }
    for (const [name, index] of SPEAKER_WORDS) params[name] = speaker.spdef[index];
    track.push({ time: track.length * FRAME_PERIOD_SEC, params });
  }
  track.push({ time: track.length * FRAME_PERIOD_SEC, params: { [RUN_PARAM]: 0 } });
  return track;
}
