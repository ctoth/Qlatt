/**
 * HRG bridge — route the REAL frontend output THROUGH the provenance-stamped HRG
 * and back out as a Klatt control-frame track.
 *
 * This is an ADDITIVE demonstration that the HRG IR can carry a live voice to
 * audio. It does NOT replace the engine: it runs the existing `tts-frontend`
 * pipeline unchanged to obtain the realized phone sequence (phonemes, durations,
 * per-frame acoustic params, F0 contour), then POPULATES an `Utterance` —
 * Word/Syllable/Segment items wired into the `SylStructure` tree, every acoustic
 * feature written as a provenance-stamped `DecisionRecord` — and finally
 * `lowerToFrames` projects the Segment relation into a `KlattFrame[]` track whose
 * every param is queryable via `whyParamAt`.
 *
 * Fidelity note: the lowering holds each segment's params steady across its
 * duration (stepwise at boundaries), so the HRG track is a SIMPLER rendering of
 * the same voice than the full pipeline's smoothed/ramped track. It is audibly
 * the same speaker (same sampled formants, F0, source params), not byte-identical.
 *
 * Citations:
 *  - Taylor, Black & Caley 2001 (HRG item/relation model; Word/Syllable/Segment).
 *  - Klatt 1980 (5 ms control-frame param vocabulary).
 *  - Klatt 1976 (segmental duration as the timing source).
 *  - O'Shaughnessy 1976 (F0 contour / declination).
 *  - Allen 1987 MITalk PHONET (flatten structure to a param track only at the end).
 */
import {
  textToKlattTrackDetailed,
  type FrontendPhoneSummary,
} from "../../tts-frontend";
import type { KlattFrame } from "../../tts-frontend-types";
import { Utterance } from "./utterance";
import { lowerToFrames, type LoweredTrack } from "./lowering";
import type { Item } from "./item";

export interface BuildUtteranceOptions {
  /** Base F0 in Hz forwarded to the frontend (frontend default if omitted). */
  baseF0?: number;
  /** Formant transition duration in ms forwarded to the frontend (default 30). */
  transitionMs?: number;
  /** Frame period for the HRG lowering, in seconds (default 0.005 = 5 ms). */
  framePeriodSec?: number;
}

export interface HrgBridgeResult {
  /** The populated, provenance-stamped HRG utterance. */
  utterance: Utterance;
  /** The HRG-lowered Klatt track (5 ms frames, per-param provenance index). */
  lowered: LoweredTrack;
  /** The original frontend event-track (for reference / comparison). */
  sourceTrack: KlattFrame[];
  /** The realized phone summaries from the frontend. */
  frontendPhones: FrontendPhoneSummary[];
  /** Union of numeric param columns carried through the HRG. */
  paramKeys: string[];
}

/** Find the source frame whose time is nearest `timeSec`. Returns null if empty. */
function nearestFrame(frames: KlattFrame[], timeSec: number): KlattFrame | null {
  let best: KlattFrame | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const frame of frames) {
    const delta = Math.abs(frame.time - timeSec);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = frame;
    }
  }
  return best;
}

/** Collect the numeric-valued param keys of a frame. */
function numericParamKeys(params: Record<string, number>): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "number" && Number.isFinite(value)) keys.push(key);
  }
  return keys;
}

/**
 * Run the existing frontend for `phrase`/`frontendId`, then build a
 * provenance-stamped HRG utterance from the realized phones and lower it to a
 * Klatt control-frame track.
 */
export function buildUtteranceFromPhrase(
  phrase: string,
  frontendId: string,
  options: BuildUtteranceOptions = {},
): HrgBridgeResult {
  const transitionMs = options.transitionMs ?? 30;
  const detailed = textToKlattTrackDetailed(phrase, options.baseF0, transitionMs, {
    frontendId,
  });
  const sourceTrack = detailed.track;
  const frontendPhones = detailed.frontendPhones;

  const utterance = new Utterance();

  // Per-phone realized timing windows (cumulative from frontend durations) and
  // the source frame sampled at each phone's temporal midpoint.
  const sampled: Array<{
    phone: FrontendPhoneSummary;
    durationMs: number;
    params: Record<string, number>;
  }> = [];
  let cursorMs = 0;
  for (const phone of frontendPhones) {
    const durationMs = phone.durationMs > 0 ? phone.durationMs : 100;
    const midSec = (cursorMs + durationMs / 2) / 1000;
    const frame = nearestFrame(sourceTrack, midSec);
    const params = (frame?.params ?? {}) as Record<string, number>;
    sampled.push({ phone, durationMs, params });
    cursorMs += durationMs;
  }

  // Union of numeric param columns across all sampled frames — the column set
  // the HRG must carry for the synth to make its full sound (the default Klatt
  // column set is too small for the beauty engine: SW, A1..A10, Rd, sourceMode…).
  const paramKeySet = new Set<string>();
  for (const { params } of sampled) {
    for (const key of numericParamKeys(params)) paramKeySet.add(key);
  }
  // F0 is carried as a first-class write below; keep it in the column set too.
  const paramKeys = [...paramKeySet];

  const cite = {
    hrg: "Taylor Black & Caley 2001",
    duration: "Klatt 1976",
    f0: "O'Shaughnessy 1976",
    target: "Klatt 1980",
  };

  let wordIndex = 0;
  let syllableIndex = 0;
  let segmentIndex = 0;
  let currentWordKey: string | null = null;
  let wordItem: Item | null = null;
  let wordNode: ReturnType<Utterance["sylStructure"]["addRoot"]> | null = null;
  let syllableItem: Item | null = null;
  let syllableNode: ReturnType<Utterance["sylStructure"]["addDaughter"]> | null = null;
  let lastWordDecisionId: string | undefined;
  let lastSyllableDecisionId: string | undefined;

  for (const { phone, durationMs, params } of sampled) {
    const wordKey = `${phone.word ?? ""}#${phone.index === 0 ? 0 : -1}`;
    // Start a new word whenever the source word string changes between
    // consecutive phones (ordered phones => consecutive runs are words).
    const wordLabel = phone.word ?? "";
    const isNewWord = wordLabel !== currentWordKey;
    void wordKey;

    if (isNewWord || wordItem == null) {
      currentWordKey = wordLabel;
      wordItem = utterance.createItem("word", `word_${wordIndex}`);
      const w = wordItem.set("name", wordLabel, {
        stage: "transcribe",
        type: "word_realized",
        reason: `word "${wordLabel}" realized by frontend transcription`,
        citations: [cite.hrg],
      });
      lastWordDecisionId = w.decisionId;
      utterance.words.append(wordItem);
      wordNode = utterance.sylStructure.addRoot(wordItem);
      wordIndex += 1;

      // One syllable per word (the beauty frontend declares no syllabification;
      // the Syllable relation is still the structural backbone the tree needs).
      syllableItem = utterance.createItem("syllable", `syl_${syllableIndex}`);
      const s = syllableItem.set("index", syllableIndex, {
        type: "syllable_realized",
        reason: `syllable of word "${wordLabel}"`,
        citations: [cite.hrg],
        parents: lastWordDecisionId ? [lastWordDecisionId] : undefined,
      });
      lastSyllableDecisionId = s.decisionId;
      utterance.syllables.append(syllableItem);
      syllableNode = utterance.sylStructure.addDaughter(wordNode, syllableItem);
      syllableIndex += 1;
    }

    if (!syllableNode || !syllableItem) {
      throw new Error("E_HRG_BRIDGE_NO_SYLLABLE: internal invariant violated");
    }

    const segment = utterance.createItem("segment", `seg_${segmentIndex}`);
    segmentIndex += 1;

    const phonemeWrite = segment.set("phoneme", phone.phoneme, {
      stage: "transcribe",
      type: "segment_realized",
      reason: `phone "${phone.phoneme}" realized by frontend (${frontendId})`,
      citations: [cite.hrg],
      parents: lastSyllableDecisionId ? [lastSyllableDecisionId] : undefined,
    });

    segment.set("dur_ms", durationMs, {
      type: "duration_realized",
      reason: `segmental duration ${durationMs} ms from frontend duration rules`,
      citations: [cite.duration],
      parents: [phonemeWrite.decisionId],
    });

    // F0: sampled from the frontend's realized intonation contour at this phone.
    const f0 = params.F0;
    if (typeof f0 === "number" && Number.isFinite(f0)) {
      segment.set("F0", f0, {
        type: "f0_realized",
        reason: `F0 ${f0.toFixed(1)} Hz sampled from frontend intonation contour`,
        citations: [cite.f0],
        parents: [phonemeWrite.decisionId],
      });
    }

    // All other acoustic targets (formants, bandwidths, source, parallel gains,
    // nasal, switch) sampled from the realized frame — each a stamped write.
    for (const key of paramKeys) {
      if (key === "F0") continue;
      const value = params[key];
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      segment.set(key, value, {
        type: "param_realized",
        reason: `acoustic target ${key}=${value} from frontend inventory/rules`,
        citations: [cite.target],
        parents: [phonemeWrite.decisionId],
      });
    }

    utterance.segments.append(segment);
    utterance.sylStructure.addDaughter(syllableNode, segment);
  }

  const lowered = lowerToFrames(utterance, {
    framePeriodSec: options.framePeriodSec ?? 0.005,
    paramKeys,
  });

  return { utterance, lowered, sourceTrack, frontendPhones, paramKeys };
}
