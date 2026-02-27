import { describe, it, expect } from 'vitest';
import { decomposeWord, getStressHintForWord } from '../src/g2p/morphology';
import type { DictLookup } from '../src/g2p/types';

// Mock dictionary for testing
const mockDict: Record<string, string[]> = {
  'run': ['R', 'AH1', 'N'],
  'walk': ['W', 'AO1', 'K'],
  'plan': ['P', 'L', 'AE1', 'N'],
  'want': ['W', 'AA1', 'N', 'T'],
  'happy': ['HH', 'AE1', 'P', 'IY0'],
  'start': ['S', 'T', 'AA1', 'R', 'T'],
  'believe': ['B', 'IH0', 'L', 'IY1', 'V'],
  'water': ['W', 'AO1', 'T', 'ER0'],
  'under': ['AH1', 'N', 'D', 'ER0'],
  'the': ['DH', 'AH0'],
  'sing': ['S', 'IH1', 'NG'],
  'play': ['P', 'L', 'EY1'],
  'kind': ['K', 'AY1', 'N', 'D'],
  'quick': ['K', 'W', 'IH1', 'K'],
  'love': ['L', 'AH1', 'V'],
  'hope': ['HH', 'OW1', 'P'],
};
const mockLookup: DictLookup = (w) => mockDict[w.toLowerCase()] ?? null;

describe('decomposeWord', () => {
  describe('suffix stripping + dict lookup', () => {
    it('"running" -> strip -ing -> "run" + IH0 NG', () => {
      const result = decomposeWord('running', mockLookup);
      expect(result).not.toBeNull();
      expect(result!.source).toBe('morphology');
      expect(result!.rootWord).toBe('run');
      expect(result!.phonemes).toEqual(['R', 'AH1', 'N', 'IH0', 'NG']);
    });

    it('"walked" -> strip -ed -> "walk" + T (voiceless final)', () => {
      const result = decomposeWord('walked', mockLookup);
      expect(result).not.toBeNull();
      expect(result!.source).toBe('morphology');
      expect(result!.rootWord).toBe('walk');
      // walk ends in K (voiceless) -> -ed = T
      expect(result!.phonemes).toEqual(['W', 'AO1', 'K', 'T']);
    });

    it('"planned" -> strip -ed -> doubled consonant -> "plan" + D (voiced final)', () => {
      const result = decomposeWord('planned', mockLookup);
      expect(result).not.toBeNull();
      expect(result!.source).toBe('morphology');
      expect(result!.rootWord).toBe('plan');
      // plan ends in N (voiced) -> -ed = D
      expect(result!.phonemes).toEqual(['P', 'L', 'AE1', 'N', 'D']);
    });

    it('"wanted" -> strip -ed -> "want" + IH0 D (after t/d)', () => {
      const result = decomposeWord('wanted', mockLookup);
      expect(result).not.toBeNull();
      expect(result!.source).toBe('morphology');
      expect(result!.rootWord).toBe('want');
      // want ends in T -> -ed = IH0 D
      expect(result!.phonemes).toEqual(['W', 'AA1', 'N', 'T', 'IH0', 'D']);
    });

    it('"playing" -> strip -ing -> "play" + IH0 NG', () => {
      const result = decomposeWord('playing', mockLookup);
      expect(result).not.toBeNull();
      expect(result!.source).toBe('morphology');
      expect(result!.rootWord).toBe('play');
      expect(result!.phonemes).toEqual(['P', 'L', 'EY1', 'IH0', 'NG']);
    });

    it('"kindly" -> strip -ly -> "kind" + L IY0', () => {
      const result = decomposeWord('kindly', mockLookup);
      expect(result).not.toBeNull();
      expect(result!.source).toBe('morphology');
      expect(result!.rootWord).toBe('kind');
      expect(result!.phonemes).toEqual(['K', 'AY1', 'N', 'D', 'L', 'IY0']);
    });

    it('"quickly" -> strip -ly -> "quick" + L IY0', () => {
      const result = decomposeWord('quickly', mockLookup);
      expect(result).not.toBeNull();
      expect(result!.source).toBe('morphology');
      expect(result!.rootWord).toBe('quick');
      expect(result!.phonemes).toEqual(['K', 'W', 'IH1', 'K', 'L', 'IY0']);
    });

    it('"loved" -> strip -ed -> try "lov" (fail) -> try "love" (silent e) -> L AH1 V + D', () => {
      const result = decomposeWord('loved', mockLookup);
      expect(result).not.toBeNull();
      expect(result!.source).toBe('morphology');
      expect(result!.rootWord).toBe('love');
      // love ends in V (voiced) -> -ed = D
      expect(result!.phonemes).toEqual(['L', 'AH1', 'V', 'D']);
    });

    it('"hoping" -> strip -ing -> "hop" not in dict -> try "hope" (silent e) -> HH OW1 P + IH0 NG', () => {
      const result = decomposeWord('hoping', mockLookup);
      expect(result).not.toBeNull();
      expect(result!.source).toBe('morphology');
      expect(result!.rootWord).toBe('hope');
      expect(result!.phonemes).toEqual(['HH', 'OW1', 'P', 'IH0', 'NG']);
    });
  });

  describe('prefix stripping', () => {
    it('"unhappy" -> strip un- -> "happy" -> AH0 N + HH AE1 P IY0', () => {
      const result = decomposeWord('unhappy', mockLookup);
      expect(result).not.toBeNull();
      expect(result!.source).toBe('morphology');
      expect(result!.rootWord).toBe('happy');
      expect(result!.phonemes).toEqual(['AH0', 'N', 'HH', 'AE1', 'P', 'IY0']);
    });

    it('"restart" -> strip re- -> "start" -> R IY0 + S T AA1 R T', () => {
      const result = decomposeWord('restart', mockLookup);
      expect(result).not.toBeNull();
      expect(result!.source).toBe('morphology');
      expect(result!.rootWord).toBe('start');
      expect(result!.phonemes).toEqual(['R', 'IY0', 'S', 'T', 'AA1', 'R', 'T']);
    });
  });

  describe('guard rails (should return null)', () => {
    it('"water" -> strip -er -> "wat" NOT in dict -> null', () => {
      const result = decomposeWord('water', mockLookup);
      expect(result).toBeNull();
    });

    it('"under" -> strip un- -> "der" NOT in dict -> null', () => {
      // "under" is in the dict directly but morphology shouldn't handle direct lookups
      // When called, it tries stripping and fails
      const result = decomposeWord('under', mockLookup);
      expect(result).toBeNull();
    });

    it('"the" -> too short (< 4 chars) -> null', () => {
      const result = decomposeWord('the', mockLookup);
      expect(result).toBeNull();
    });

    it('"a" -> too short -> null', () => {
      const result = decomposeWord('a', mockLookup);
      expect(result).toBeNull();
    });

    it('"sing" -> strip -ing -> "s" too short (min root 3) -> null', () => {
      const result = decomposeWord('sing', mockLookup);
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('"" -> null', () => {
      const result = decomposeWord('', mockLookup);
      expect(result).toBeNull();
    });

    it('"xyz" -> no affixes match or roots not in dict -> null', () => {
      const result = decomposeWord('xyz', mockLookup);
      expect(result).toBeNull();
    });
  });
});

describe('getStressHintForWord', () => {
  it('returns forcing-penult hint for -ation words', () => {
    expect(getStressHintForWord('celebration')).toEqual({
      stressType: 'forcing',
      stressTarget: 'penult',
    });
  });

  it('returns non-affecting hint for -ness words', () => {
    expect(getStressHintForWord('kindness')).toEqual({
      stressType: 'non_affecting',
    });
  });

  it('returns undefined when no configured suffix matches', () => {
    expect(getStressHintForWord('blorf')).toBeUndefined();
  });
});
