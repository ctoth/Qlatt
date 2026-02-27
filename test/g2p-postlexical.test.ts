import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";
import { endOrder, finiteOrder, startOrder } from "./utils/order-marks";

/**
 * Postlexical phonological rules tests.
 * Citation: Miller 1998, Pronunciation Modeling in Speech Synthesis
 *
 * These rules apply across word boundaries or modify phonemes based on
 * their environment in the phrase.
 */

function makeToken(
  id: string,
  phoneme: string,
  type: string,
  stress: number,
  duration: number,
  syncLeft: ReturnType<typeof startOrder> | ReturnType<typeof finiteOrder>,
  syncRight: ReturnType<typeof finiteOrder> | ReturnType<typeof endOrder>,
  extra: Record<string, unknown> = {}
) {
  return {
    id,
    stream: "phone",
    phoneme,
    type,
    stress,
    duration,
    inherentDuration: duration,
    params: { AV: type === "vowel" ? 60 : 0, AVS: 0 },
    sync_left: syncLeft,
    sync_right: syncRight,
    status: 1,
    ...extra,
  };
}

function getActivePhoneTokens(result: any): any[] {
  const seq = result.sequence ?? result;
  return (seq as any[]).filter(
    (t: any) => t.stream === "phone" && t.status === 1
  );
}

describe("postlexical rules", () => {
  describe('"the" reduction: AH (stress=0) -> IH before vowel-initial word', () => {
    it('reduces "the" before vowel-initial word (the apple)', () => {
      // "the apple" -> DH AH(0) AE(1) P_CL L SIL
      // Pipeline stores phoneme without stress suffix; stress is a separate field.
      // The AH in "the" (stress=0) should reduce to IH because "apple" starts with a vowel.
      const s0 = startOrder();
      const s1 = finiteOrder(1);
      const s2 = finiteOrder(2);
      const s3 = finiteOrder(3);
      const s4 = finiteOrder(4);
      const s5 = finiteOrder(5);
      const sEnd = endOrder();

      const sequence = [
        makeToken("ph0", "DH", "fricative", 0, 70, s0, s1, { word: "the" }),
        makeToken("ph1", "AH", "vowel", 0, 50, s1, s2, { word: "the" }),
        makeToken("ph2", "AE", "vowel", 1, 170, s2, s3, { word: "apple" }),
        makeToken("ph3", "P_CL", "stop_closure", 0, 50, s3, s4, { word: "apple" }),
        makeToken("ph4", "L", "liquid", 0, 80, s4, s5, { word: "apple" }),
        makeToken("ph5", "SIL", "silence", 0, 300, s5, sEnd, { punctuationSymbol: "." }),
      ];

      const result = runDeclarativeFrontend(sequence, {
        includeTrace: true,
        phases: ["postlexical"],
      });

      const phoneTokens = getActivePhoneTokens(result);
      // The splice replaces AH with a new token that has phoneme IH.
      // The original ph1 is suppressed; the replacement has a generated ID.
      // Check that no AH remains and IH is present for word "the".
      const theVowels = phoneTokens.filter(
        (t: any) => t.word === "the" && t.type === "vowel"
      );
      expect(theVowels.length).toBe(1);
      expect(theVowels[0].phoneme).toBe("IH");
    });

    it('does NOT reduce "the" before consonant-initial word (the book)', () => {
      // "the book" -> DH AH(0) B_CL UH(1) K_CL SIL
      // AH should stay because "book" starts with a consonant
      const s0 = startOrder();
      const s1 = finiteOrder(1);
      const s2 = finiteOrder(2);
      const s3 = finiteOrder(3);
      const s4 = finiteOrder(4);
      const s5 = finiteOrder(5);
      const sEnd = endOrder();

      const sequence = [
        makeToken("ph0", "DH", "fricative", 0, 70, s0, s1, { word: "the" }),
        makeToken("ph1", "AH", "vowel", 0, 50, s1, s2, { word: "the" }),
        makeToken("ph2", "B_CL", "stop_closure", 1, 45, s2, s3, { word: "book" }),
        makeToken("ph3", "UH", "vowel", 1, 110, s3, s4, { word: "book" }),
        makeToken("ph4", "K_CL", "stop_closure", 0, 60, s4, s5, { word: "book" }),
        makeToken("ph5", "SIL", "silence", 0, 300, s5, sEnd, { punctuationSymbol: "." }),
      ];

      const result = runDeclarativeFrontend(sequence, {
        includeTrace: true,
        phases: ["postlexical"],
      });

      const phoneTokens = getActivePhoneTokens(result);
      const theVowel = phoneTokens.find((t: any) => t.id === "ph1");
      expect(theVowel).toBeDefined();
      expect(theVowel.phoneme).toBe("AH");
    });
  });

  describe("/t/ flapping: T -> DX between stressed vowel and unstressed vowel", () => {
    it('flaps T in "better" (stressed EH + T + unstressed ER)', () => {
      // "better" -> B EH1 T ER0 SIL (raw phonemes, before structural)
      // T is between stressed EH1 and unstressed ER0 -> should become DX
      const s0 = startOrder();
      const s1 = finiteOrder(1);
      const s2 = finiteOrder(2);
      const s3 = finiteOrder(3);
      const s4 = finiteOrder(4);
      const sEnd = endOrder();

      const sequence = [
        makeToken("ph0", "B", "stop", 0, 45, s0, s1, { word: "better" }),
        makeToken("ph1", "EH", "vowel", 1, 120, s1, s2, { word: "better" }),
        makeToken("ph2", "T", "stop", 0, 40, s2, s3, { word: "better" }),
        makeToken("ph3", "ER", "vowel", 0, 70, s3, s4, { word: "better" }),
        makeToken("ph4", "SIL", "silence", 0, 300, s4, sEnd, { punctuationSymbol: "." }),
      ];

      const result = runDeclarativeFrontend(sequence, {
        includeTrace: true,
        phases: ["postlexical"],
      });

      const phoneTokens = getActivePhoneTokens(result);
      // The T (ph2) should be suppressed and replaced with a DX token
      const phonemes = phoneTokens.map((t: any) => t.phoneme);
      expect(phonemes).toContain("DX");
      expect(phonemes).not.toContain("T");
    });

    it('flaps T in "butter" (stressed AH + T + unstressed ER)', () => {
      const s0 = startOrder();
      const s1 = finiteOrder(1);
      const s2 = finiteOrder(2);
      const s3 = finiteOrder(3);
      const s4 = finiteOrder(4);
      const sEnd = endOrder();

      const sequence = [
        makeToken("ph0", "B", "stop", 0, 45, s0, s1, { word: "butter" }),
        makeToken("ph1", "AH", "vowel", 1, 100, s1, s2, { word: "butter" }),
        makeToken("ph2", "T", "stop", 0, 40, s2, s3, { word: "butter" }),
        makeToken("ph3", "ER", "vowel", 0, 70, s3, s4, { word: "butter" }),
        makeToken("ph4", "SIL", "silence", 0, 300, s4, sEnd, { punctuationSymbol: "." }),
      ];

      const result = runDeclarativeFrontend(sequence, {
        includeTrace: true,
        phases: ["postlexical"],
      });

      const phoneTokens = getActivePhoneTokens(result);
      const phonemes = phoneTokens.map((t: any) => t.phoneme);
      expect(phonemes).toContain("DX");
      expect(phonemes).not.toContain("T");
    });

    it('flaps T in "water" (stressed AO + T + unstressed ER)', () => {
      const s0 = startOrder();
      const s1 = finiteOrder(1);
      const s2 = finiteOrder(2);
      const s3 = finiteOrder(3);
      const s4 = finiteOrder(4);
      const sEnd = endOrder();

      const sequence = [
        makeToken("ph0", "W", "glide", 0, 80, s0, s1, { word: "water" }),
        makeToken("ph1", "AO", "vowel", 1, 160, s1, s2, { word: "water" }),
        makeToken("ph2", "T", "stop", 0, 40, s2, s3, { word: "water" }),
        makeToken("ph3", "ER", "vowel", 0, 70, s3, s4, { word: "water" }),
        makeToken("ph4", "SIL", "silence", 0, 300, s4, sEnd, { punctuationSymbol: "." }),
      ];

      const result = runDeclarativeFrontend(sequence, {
        includeTrace: true,
        phases: ["postlexical"],
      });

      const phoneTokens = getActivePhoneTokens(result);
      const phonemes = phoneTokens.map((t: any) => t.phoneme);
      expect(phonemes).toContain("DX");
      expect(phonemes).not.toContain("T");
    });

    it("does NOT flap word-final T in 'cat'", () => {
      const s0 = startOrder();
      const s1 = finiteOrder(1);
      const s2 = finiteOrder(2);
      const s3 = finiteOrder(3);
      const sEnd = endOrder();

      const sequence = [
        makeToken("ph0", "K", "stop", 0, 60, s0, s1, { word: "cat" }),
        makeToken("ph1", "AE", "vowel", 1, 170, s1, s2, { word: "cat" }),
        makeToken("ph2", "T", "stop", 0, 40, s2, s3, { word: "cat" }),
        makeToken("ph3", "SIL", "silence", 0, 300, s3, sEnd, { punctuationSymbol: "." }),
      ];

      const result = runDeclarativeFrontend(sequence, {
        includeTrace: true,
        phases: ["postlexical"],
      });

      const phoneTokens = getActivePhoneTokens(result);
      const tToken = phoneTokens.find((t: any) => t.id === "ph2");
      expect(tToken).toBeDefined();
      expect(tToken.phoneme).toBe("T");
    });

    it("does NOT flap T before N in 'button'", () => {
      const s0 = startOrder();
      const s1 = finiteOrder(1);
      const s2 = finiteOrder(2);
      const s3 = finiteOrder(3);
      const s4 = finiteOrder(4);
      const sEnd = endOrder();

      const sequence = [
        makeToken("ph0", "B", "stop", 0, 45, s0, s1, { word: "button" }),
        makeToken("ph1", "AH", "vowel", 1, 100, s1, s2, { word: "button" }),
        makeToken("ph2", "T", "stop", 0, 40, s2, s3, { word: "button" }),
        makeToken("ph3", "N", "nasal", 0, 70, s3, s4, { word: "button" }),
        makeToken("ph4", "SIL", "silence", 0, 300, s4, sEnd, { punctuationSymbol: "." }),
      ];

      const result = runDeclarativeFrontend(sequence, {
        includeTrace: true,
        phases: ["postlexical"],
      });

      const phoneTokens = getActivePhoneTokens(result);
      const tToken = phoneTokens.find((t: any) => t.id === "ph2");
      expect(tToken).toBeDefined();
      expect(tToken.phoneme).toBe("T");
    });
  });
});
