import { describe, expect, it } from "vitest";
import { textToKlattTrack, type KlattFrame } from "../src/tts-frontend";

function averageParam(frames: KlattFrame[], key: string): number {
  if (frames.length === 0) return 0;
  return (
    frames.reduce((sum, frame) => sum + Number(frame.params?.[key] ?? 0), 0) / frames.length
  );
}

function rhoticFrames(track: KlattFrame[], word: string): KlattFrame[] {
  return track.filter((frame) => frame.word === word && frame.phoneme === "ER");
}

function rhoticTailFrames(track: KlattFrame[], word: string): KlattFrame[] {
  return track.filter((frame) => frame.word === word && frame.phoneme === "R");
}

describe("tts frontend rhotic vowels", () => {
  it("keeps unstressed ER0 distinct from stressed ER1", () => {
    const stressedTrack = textToKlattTrack("heard", 110);
    const unstressedTrack = textToKlattTrack("other brother", 110);

    const heardEr = rhoticFrames(stressedTrack, "heard");
    const otherEr = rhoticFrames(unstressedTrack, "other");
    const brotherEr = rhoticFrames(unstressedTrack, "brother");

    expect(heardEr.length).toBeGreaterThan(0);
    expect(otherEr.length).toBeGreaterThan(0);
    expect(brotherEr.length).toBeGreaterThan(0);

    const stressedF1 = averageParam(heardEr, "F1");
    const stressedF2 = averageParam(heardEr, "F2");
    const stressedF3 = averageParam(heardEr, "F3");

    const otherF1 = averageParam(otherEr, "F1");
    const otherF2 = averageParam(otherEr, "F2");
    const otherF3 = averageParam(otherEr, "F3");
    const brotherF1 = averageParam(brotherEr, "F1");
    const brotherF2 = averageParam(brotherEr, "F2");
    const brotherF3 = averageParam(brotherEr, "F3");

    // Peterson & Barney 1952 gives stressed ER near F1=490/F2=1350/F3=1690.
    // For unstressed American /ɚ/, Espy-Wilson et al. 2000 reports a tighter,
    // less open rhotic configuration (syllabic /r/ mean F1 ~388, F2 ~1384, F3 ~1665).
    // The key regression to avoid is collapsing ER0 onto the stressed ER1 target.
    expect(otherF1).toBeLessThan(stressedF1 - 20);
    expect(brotherF1).toBeLessThan(stressedF1 - 20);
    expect(otherF2).toBeGreaterThanOrEqual(stressedF2);
    expect(brotherF2).toBeGreaterThanOrEqual(stressedF2);
    expect(otherF3).toBeLessThanOrEqual(stressedF3);
    expect(brotherF3).toBeLessThanOrEqual(stressedF3);
  });

  it("realizes rhotic vowels with an explicit rhotic tail", () => {
    const track = textToKlattTrack("other mother heard", 110);

    const otherEr = rhoticFrames(track, "other");
    const otherR = rhoticTailFrames(track, "other");
    const motherEr = rhoticFrames(track, "mother");
    const motherR = rhoticTailFrames(track, "mother");
    const heardEr = rhoticFrames(track, "heard");
    const heardR = rhoticTailFrames(track, "heard");

    expect(otherEr.length).toBeGreaterThan(0);
    expect(motherEr.length).toBeGreaterThan(0);
    expect(heardEr.length).toBeGreaterThan(0);
    expect(otherR.length).toBeGreaterThan(0);
    expect(motherR.length).toBeGreaterThan(0);
    expect(heardR.length).toBeGreaterThan(0);

    // Espy-Wilson 2000: the salient /r/ cue is a very low F3. If we realize a
    // rhotic tail explicitly, its F3 should sit below the preceding ER target.
    expect(averageParam(otherR, "F3")).toBeLessThan(averageParam(otherEr, "F3"));
    expect(averageParam(motherR, "F3")).toBeLessThan(averageParam(motherEr, "F3"));
    expect(averageParam(heardR, "F3")).toBeLessThan(averageParam(heardEr, "F3"));
  });
});
