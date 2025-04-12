import { describe, it, expect, beforeEach, vi } from 'vitest';
import { textToKlattTrack, normalizeText, transcribeText } from './tts-frontend.js'; // Corrected path
import { PHONEME_TARGETS, fillDefaultParams } from './tts-frontend-rules.js'; // Corrected path

describe('TTS Frontend', () => {
  beforeEach(() => {
    // Spy on console.log to reduce noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('normalizeText', () => {
    it('converts numbers to words', () => {
      expect(normalizeText('I have 5 apples')).toBe('i have five apples');
      expect(normalizeText('There are 42 books')).toBe('there are forty two books');
    });

    it('handles punctuation correctly', () => {
      expect(normalizeText('Hello, world!')).toBe('hello , world !');
      expect(normalizeText('Is this a test?')).toBe('is this a test ?');
    });

    it('normalizes whitespace', () => {
      expect(normalizeText('  too   many    spaces  ')).toBe('too many spaces');
    });
  });

  describe('transcribeText', () => {
    it('converts words to phoneme sequences', () => {
      const result = transcribeText('hello');
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('phoneme');
    });

    it('handles punctuation as silence', () => {
      const result = transcribeText('hello , world'); // Use normalized form for direct testing
      const commaIndex = result.findIndex(p => p.isPunctuation && p.symbol === ',');
      expect(commaIndex).toBeGreaterThanOrEqual(0); // Allow index 0
      expect(result[commaIndex].phoneme).toBe('SIL');
    });

    it('handles unknown words gracefully', () => {
      const result = transcribeText('xyzabc');
      expect(result).toBeInstanceOf(Array);
      // Should insert a silence for unknown word
      expect(result.some(p => p.phoneme === 'SIL')).toBe(true);
    });
  });

  describe('textToKlattTrack', () => {
    it('generates a valid Klatt track from text input', () => {
      const track = textToKlattTrack('hello');
      
      expect(track).toBeInstanceOf(Array);
      expect(track.length).toBeGreaterThan(0);
      
      // Check track structure
      expect(track[0]).toHaveProperty('time');
      expect(track[0]).toHaveProperty('params');
      
      // Check params structure
      const params = track[0].params;
      expect(params).toHaveProperty('F0');
      expect(params).toHaveProperty('AV');
      expect(params).toHaveProperty('F1');
    });

    it('applies phonological rules correctly', () => {
      // Test with a word that should trigger stop release
      const inputText = 'pat';
      const baseF0 = 110;

      // --- Step 1: Check Transcription ---
      const normalized = normalizeText(inputText);
      const initialPhonemes = transcribeText(normalized);
      expect(initialPhonemes.some(p => p.phoneme === 'P'), "Initial transcription should include 'P'").toBe(true);

      // --- Step 2: Check Parameter Sequence Preparation ---
      // (This part is complex to check directly without replicating logic, assume it works for now)
      // We can infer its success if P_CL exists before insertStopReleases

      // --- Step 3: Check insertStopReleases ---
      // Manually run the first part of textToKlattTrack to get the sequence *before* the final loop
      let parameterSequence = initialPhonemes.map((ph) => {
          let targetKeyBase = ph.phoneme;
          if (["P", "T", "K", "B", "D", "G"].includes(targetKeyBase)) {
              targetKeyBase += "_CL";
          }
          let baseTarget = PHONEME_TARGETS[targetKeyBase + "1"] || PHONEME_TARGETS[targetKeyBase + "0"] || PHONEME_TARGETS[targetKeyBase];
          if (!baseTarget && ph.isPunctuation) baseTarget = PHONEME_TARGETS["SIL"];
          if (!baseTarget) baseTarget = PHONEME_TARGETS["SIL"]; // Fallback
          const filledParams = fillDefaultParams(baseTarget);
          const flags = {};
          if (baseTarget) {
              if (baseTarget.type) flags.type = baseTarget.type;
              if (baseTarget.hasOwnProperty('voiceless')) flags.voiceless = baseTarget.voiceless;
              if (baseTarget.hasOwnProperty('voiced')) flags.voiced = baseTarget.voiced;
              if (baseTarget.hasOwnProperty('front')) flags.front = baseTarget.front;
              if (baseTarget.hasOwnProperty('back')) flags.back = baseTarget.back;
              if (baseTarget.hasOwnProperty('hi')) flags.hi = baseTarget.hi;
              if (baseTarget.hasOwnProperty('low')) flags.low = baseTarget.low;
          }
          return { phoneme: targetKeyBase, stress: ph.stress, params: filledParams, duration: baseTarget.dur || 100, ...flags };
      });

      // Check if P_CL exists before insertion
      expect(parameterSequence.some(p => p.phoneme === 'P_CL'), "Parameter sequence should contain 'P_CL' before release insertion").toBe(true);

      // Apply insertStopReleases (import it if needed, or replicate its logic simply)
      const releaseMap = { P_CL: "P_REL", T_CL: "T_REL", K_CL: "K_REL", B_CL: "B_REL", D_CL: "D_REL", G_CL: "G_REL" };
      const sequenceAfterRelease = [];
      for (let i = 0; i < parameterSequence.length; i++) {
          const current = parameterSequence[i];
          sequenceAfterRelease.push(current);
          const releasePhoneme = releaseMap[current.phoneme];
          if (releasePhoneme) {
              let addRelease = true; // Simplified check for test
              if (parameterSequence[i + 1]?.phoneme === 'SIL') addRelease = false;
              if (addRelease) {
                  sequenceAfterRelease.push({ phoneme: releasePhoneme, stress: current.stress }); // Insert release object
              }
          }
      }
      expect(sequenceAfterRelease.some(p => p.phoneme === 'P_REL'), "Sequence should contain 'P_REL' after insertStopReleases").toBe(true);

      // --- Step 4: Check Refill Step ---
      for (let i = 0; i < sequenceAfterRelease.length; i++) {
          const ph = sequenceAfterRelease[i];
          if (!ph.params) { // Simulate refill
              let baseTarget = PHONEME_TARGETS[ph.phoneme];
              if (!baseTarget) baseTarget = PHONEME_TARGETS["SIL"];
              ph.params = fillDefaultParams(baseTarget);
              ph.duration = baseTarget?.dur || 30;
              if (baseTarget) { // Copy flags
                  if (baseTarget.type) ph.type = baseTarget.type;
                  if (baseTarget.hasOwnProperty('voiceless')) ph.voiceless = baseTarget.voiceless;
                  if (baseTarget.hasOwnProperty('voiced')) ph.voiced = baseTarget.voiced;
              }
          }
      }
      const pRelAfterRefill = sequenceAfterRelease.find(p => p.phoneme === 'P_REL');
      expect(pRelAfterRefill, "'P_REL' should still exist after refill step").toBeDefined();
      expect(pRelAfterRefill.params, "'P_REL' should have params after refill").toBeDefined();
      expect(pRelAfterRefill.params.AF, "'P_REL' AF should be > 0 after refill").toBeGreaterThan(0);

      // --- Step 5: Check Final Track Generation ---
      // Now run the full function
      const track = textToKlattTrack(inputText, baseF0);

      // Check final track structure
      expect(track).toBeInstanceOf(Array);
      expect(track.length).toBeGreaterThan(0);
      expect(track[0]).toHaveProperty('time');
      expect(track[0]).toHaveProperty('params');

      // Final check (original failing assertion)
      const pRelEvent = track.find(event => event.phoneme === 'P_REL');
      expect(pRelEvent, "P_REL event should exist in the final track").toBeDefined();
      expect(pRelEvent.params.AF, "P_REL event AF should be > 0 in the final track").toBeGreaterThan(0);
    });

    it('generates F0 contours with appropriate values', () => {
      const track = textToKlattTrack('hello world', 120);
      
      // Get all F0 values from the track
      const f0Values = track
        .filter(event => event.params.F0 > 0)
        .map(event => event.params.F0);
      
      expect(f0Values.length).toBeGreaterThan(0);
      
      // Check that F0 values are in a reasonable range
      f0Values.forEach(f0 => {
        expect(f0).toBeGreaterThan(60);  // Lower than normal human range
        expect(f0).toBeLessThan(500);    // Higher than normal human range
      });
      
      // Check that average F0 is reasonably close to base, accounting for declination
      const avgF0 = f0Values.reduce((sum, val) => sum + val, 0) / f0Values.length;
      // Expect avg around 110Hz, allow +/- 5Hz (precision -1 means 10^1 = 10, so +/- 5)
      expect(avgF0).toBeCloseTo(110, -1); 
    });

    it('handles question intonation differently', () => {
      const statement = textToKlattTrack('hello world.');
      const question = textToKlattTrack('hello world?');
      
      // Get final F0 values (excluding silence)
      const getLastF0 = (track) => {
        const voicedEvents = track.filter(e => e.params.F0 > 0);
        return voicedEvents.length > 0 ? voicedEvents[voicedEvents.length - 1].params.F0 : 0;
      };
      
      const statementLastF0 = getLastF0(statement);
      const questionLastF0 = getLastF0(question);
      
      // Question should have higher final F0 than statement
      expect(questionLastF0).toBeGreaterThan(statementLastF0);
    });

    it('ensures all parameters are valid numbers', () => {
      const track = textToKlattTrack('test');
      
      // Check all parameters in all events
      track.forEach(event => {
        Object.entries(event.params).forEach(([key, value]) => {
          expect(typeof value).toBe('number');
          expect(isFinite(value)).toBe(true);
        });
      });
    });
  });

  describe('Parameter Filling', () => {
    it('fills missing parameters with defaults', () => {
      const partial = { F1: 500, AV: 60 };
      const filled = fillDefaultParams(partial);
      
      // Should have all BASE_PARAMS keys
      expect(Object.keys(filled).length).toBeGreaterThanOrEqual(Object.keys(PHONEME_TARGETS.SIL).length);
      
      // Should preserve specified values
      expect(filled.F1).toBe(500);
      expect(filled.AV).toBe(60);
      
      // Should fill missing values
      expect(filled.F2).toBeDefined();
      expect(filled.B1).toBeDefined();
    });

    it('handles null input gracefully', () => {
      const filled = fillDefaultParams(null);
      
      // Should use SIL defaults
      expect(filled.AV).toBe(0);
      expect(filled.F0).toBe(0);
    });
  });
});
