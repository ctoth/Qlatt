import { describe, expect, it } from "vitest";
import {
  SPEAKER_FORMANT_KEYS,
  SPEAKER_PROJECTION_TABLE,
  projectSpeakerFields,
  type SpeakerProjectionBaseline,
} from "../src/speaker-projection";
import type { VoiceQualityOverrides } from "../src/source-contour";

/**
 * Locks the declarative speaker/source projection table (phase 4 item 3) to the
 * exact field/op/operand semantics of the former imperative speakerStamp loop.
 * Byte-identical audio is separately guarded by golden; these unit tests protect
 * the table against silent drift.
 */

const BASELINE: SpeakerProjectionBaseline = {
  source_mode: 1,
  rd: 0.7,
  rd_ref: 0.65,
  spectral_tilt_offset_db: 3,
};

function makeTarget(initial: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>(Object.entries(initial));
  return {
    store,
    get: (field: string) => store.get(field),
    set: (field: string, value: number) => store.set(field, value),
  };
}

describe("speaker projection table", () => {
  it("sets baseline constants (sourceMode, RdRef) unconditionally", () => {
    const t = makeTarget();
    projectSpeakerFields(t, BASELINE, undefined, 1);
    expect(t.store.get("sourceMode")).toBe(1);
    expect(t.store.get("RdRef")).toBe(0.65);
  });

  it("Rd falls back to baseline when no override, uses override when present", () => {
    const noOverride = makeTarget();
    projectSpeakerFields(noOverride, BASELINE, undefined, 1);
    expect(noOverride.store.get("Rd")).toBe(0.7);

    const withOverride = makeTarget();
    projectSpeakerFields(withOverride, BASELINE, { rd: 2.0 }, 1);
    expect(withOverride.store.get("Rd")).toBe(2.0);
  });

  it("OQ/flutter/jitter are set only when the override is defined", () => {
    const bare = makeTarget();
    projectSpeakerFields(bare, BASELINE, undefined, 1);
    expect(bare.store.has("OQ")).toBe(false);
    expect(bare.store.has("flutter")).toBe(false);
    expect(bare.store.has("jitter")).toBe(false);

    const overrides: VoiceQualityOverrides = { oq: 0, flutter: 50, jitter: 5 };
    const set = makeTarget();
    projectSpeakerFields(set, BASELINE, overrides, 1);
    expect(set.store.get("OQ")).toBe(0);
    expect(set.store.get("flutter")).toBe(50);
    expect(set.store.get("jitter")).toBe(5);
  });

  it("TL uses override.tl when set, else current + tilt offset, and is skipped when current is non-numeric", () => {
    const fromCurrent = makeTarget({ TL: 10 });
    projectSpeakerFields(fromCurrent, BASELINE, undefined, 1);
    expect(fromCurrent.store.get("TL")).toBe(13); // 10 + 3

    const fromOverride = makeTarget({ TL: 10 });
    projectSpeakerFields(fromOverride, BASELINE, { tl: 22 }, 1);
    expect(fromOverride.store.get("TL")).toBe(22);

    const noCurrent = makeTarget();
    projectSpeakerFields(noCurrent, BASELINE, { tl: 22 }, 1);
    expect(noCurrent.store.has("TL")).toBe(false);
  });

  it("AH is set only when current AH is numeric AND ah_offset_db is defined", () => {
    const applied = makeTarget({ AH: 40 });
    projectSpeakerFields(applied, BASELINE, { ah_offset_db: 20 }, 1);
    expect(applied.store.get("AH")).toBe(60);

    const noOffset = makeTarget({ AH: 40 });
    projectSpeakerFields(noOffset, BASELINE, undefined, 1);
    expect(noOffset.store.get("AH")).toBe(40); // untouched

    const noCurrent = makeTarget();
    projectSpeakerFields(noCurrent, BASELINE, { ah_offset_db: 20 }, 1);
    expect(noCurrent.store.has("AH")).toBe(false);
  });

  it("scales F1..F10 only when scale != 1 and value > 0", () => {
    const t = makeTarget({ F1: 500, F2: 1500, F3: 0, F4: -1 });
    projectSpeakerFields(t, BASELINE, undefined, 1.2);
    expect(t.store.get("F1")).toBeCloseTo(600, 6);
    expect(t.store.get("F2")).toBeCloseTo(1800, 6);
    expect(t.store.get("F3")).toBe(0); // value not > 0, untouched
    expect(t.store.get("F4")).toBe(-1); // value not > 0, untouched
  });

  it("does not scale formants when scale == 1", () => {
    const t = makeTarget({ F1: 500 });
    projectSpeakerFields(t, BASELINE, undefined, 1);
    expect(t.store.get("F1")).toBe(500);
  });

  it("declares all ten formant keys", () => {
    expect(SPEAKER_FORMANT_KEYS).toEqual(["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10"]);
  });

  it("table rows are ordered exactly as the original loop applied them", () => {
    expect(SPEAKER_PROJECTION_TABLE.map((row) => row.field)).toEqual([
      "sourceMode", "Rd", "RdRef", "OQ", "TL", "AH", "flutter", "jitter",
    ]);
  });
});
