import { describe, it, expect, beforeEach, vi } from 'vitest'; // Keep imports
import { textToKlattTrack, normalizeText, transcribeText } from './tts-frontend.js';
import { PHONEME_TARGETS, fillDefaultParams } from './tts-frontend-rules.js';

describe('TTS Frontend', () => {
  // Remove console spies to allow logging from the failing test
  // beforeEach(() => {
  //   // Spy on console.log to reduce noise in tests
  //   vi.spyOn(console, 'log').mockImplementation(() => {});
  //   vi.spyOn(console, 'warn').mockImplementation(() => {});
  // });

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
      // (Intermediate simulation steps removed to focus on the final output)

      // --- Step 5: Check Final Track Generation ---
      // Now run the full function
      console.log(`--- Running textToKlattTrack('${inputText}') ---`); // Log marker
      const track = textToKlattTrack(inputText, baseF0);
      console.log(`--- textToKlattTrack finished ---`); // Log marker

      // *** ADDED: Log the final track for inspection ***
      console.log("--- FINAL TRACK ---");
      track.forEach((event, index) => {
        console.log(`[${index}] Time: ${event.time.toFixed(3)}, Phoneme: ${event.phoneme}, AV: ${event.params?.AV?.toFixed(1)}, AF: ${event.params?.AF?.toFixed(1)}`);
      });
      console.log("-------------------");

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

    // *** NEW TESTS START HERE ***
    it('generates correct parallel amplitude parameters (A*) for fricatives', () => {
        const track = textToKlattTrack('ship'); // Contains SH
        const shEvent = track.find(e => e.phoneme === 'SH');
        expect(shEvent, "'SH' event should exist").toBeDefined();
        if (!shEvent) return; // Guard for TS/Linter

        const shTargets = PHONEME_TARGETS.SH;
        expect(shEvent.params.A3, "SH A3").toBeCloseTo(shTargets.A3);
        expect(shEvent.params.A4, "SH A4").toBeCloseTo(shTargets.A4);
        expect(shEvent.params.A5, "SH A5").toBeCloseTo(shTargets.A5);
        expect(shEvent.params.A6, "SH A6").toBeCloseTo(shTargets.A6);

        // Check others are default (0)
        expect(shEvent.params.A1, "SH A1").toBeCloseTo(0);
        expect(shEvent.params.A2, "SH A2").toBeCloseTo(0);
        expect(shEvent.params.AN, "SH AN").toBeCloseTo(0);
        expect(shEvent.params.AB, "SH AB").toBeCloseTo(0);
    });

    it('generates correct parameters for stop releases (e.g., P_REL)', () => {
        const track = textToKlattTrack('pat'); // Contains P -> P_CL + P_REL
        const pRelEvent = track.find(e => e.phoneme === 'P_REL');
        expect(pRelEvent, "'P_REL' event should exist").toBeDefined();
         if (!pRelEvent) return; // Guard

        const pRelTargets = PHONEME_TARGETS.P_REL;
        expect(pRelEvent.params.AF, "P_REL AF").toBeCloseTo(pRelTargets.AF);
        expect(pRelEvent.params.AH, "P_REL AH").toBeCloseTo(pRelTargets.AH);
        expect(pRelEvent.params.AB, "P_REL AB").toBeCloseTo(pRelTargets.AB);
        expect(pRelEvent.params.AV, "P_REL AV").toBeCloseTo(0); // Voiceless release
        expect(pRelEvent.params.AVS, "P_REL AVS").toBeCloseTo(0); // Voiceless release

        // Check other parallel gains are default (0)
        expect(pRelEvent.params.A1, "P_REL A1").toBeCloseTo(0);
        expect(pRelEvent.params.A2, "P_REL A2").toBeCloseTo(0);
        expect(pRelEvent.params.A3, "P_REL A3").toBeCloseTo(0);
        expect(pRelEvent.params.A4, "P_REL A4").toBeCloseTo(0);
        expect(pRelEvent.params.A5, "P_REL A5").toBeCloseTo(0);
        expect(pRelEvent.params.A6, "P_REL A6").toBeCloseTo(0);
        expect(pRelEvent.params.AN, "P_REL AN").toBeCloseTo(0);
    });

    // --- Add More Tests Below ---

    it('generates correct parameters for nasals (e.g., M)', () => {
        const track = textToKlattTrack('man'); // Contains M, AE, N
        const mEvent = track.find(e => e.phoneme === 'M');
        expect(mEvent, "'M' event should exist").toBeDefined();
        if (!mEvent) return;

        const mTargets = PHONEME_TARGETS.M;
        expect(mEvent.params.AV, "M AV").toBeGreaterThan(0);
        expect(mEvent.params.AN, "M AN").toBeCloseTo(mTargets.AN);
        expect(mEvent.params.FNP, "M FNP").toBeCloseTo(mTargets.FNP);
        expect(mEvent.params.FNZ, "M FNZ").toBeCloseTo(mTargets.FNZ);
        expect(mEvent.params.AF, "M AF").toBeCloseTo(0); // No frication
        expect(mEvent.params.AH, "M AH").toBeCloseTo(0); // No aspiration
    });

    it('generates correct parameters for liquids/glides (e.g., L, R, W, Y)', () => {
        const trackL = textToKlattTrack('lie');
        const lEvent = trackL.find(e => e.phoneme === 'L');
        expect(lEvent, "'L' event should exist").toBeDefined();
        if (lEvent) expect(lEvent.params.AV, "L AV").toBeGreaterThan(0);

        const trackR = textToKlattTrack('rye');
        const rEvent = trackR.find(e => e.phoneme === 'R');
        expect(rEvent, "'R' event should exist").toBeDefined();
        if (rEvent) expect(rEvent.params.AV, "R AV").toBeGreaterThan(0);

        const trackW = textToKlattTrack('why');
        const wEvent = trackW.find(e => e.phoneme === 'W');
        expect(wEvent, "'W' event should exist").toBeDefined();
        if (wEvent) expect(wEvent.params.AV, "W AV").toBeGreaterThan(0);

        const trackY = textToKlattTrack('yie'); // Using 'yie' as 'y' needs a vowel context
        const yEvent = trackY.find(e => e.phoneme === 'Y');
        expect(yEvent, "'Y' event should exist").toBeDefined();
        if (yEvent) expect(yEvent.params.AV, "Y AV").toBeGreaterThan(0);
    });

     it('generates correct parameters for affricates (e.g., CH, JH)', () => {
        const trackCh = textToKlattTrack('church');
        const chEvent = trackCh.find(e => e.phoneme === 'CH');
        expect(chEvent, "'CH' event should exist").toBeDefined();
        if (chEvent) {
            const chTargets = PHONEME_TARGETS.CH;
            expect(chEvent.params.AV, "CH AV").toBeCloseTo(0); // Voiceless
            expect(chEvent.params.AF, "CH AF").toBeCloseTo(chTargets.AF);
            expect(chEvent.params.A3, "CH A3").toBeCloseTo(chTargets.A3); // Check some parallel gains
            expect(chEvent.params.A6, "CH A6").toBeCloseTo(chTargets.A6);
        }

        const trackJh = textToKlattTrack('judge');
        const jhEvent = trackJh.find(e => e.phoneme === 'JH');
        expect(jhEvent, "'JH' event should exist").toBeDefined();
        if (jhEvent) {
            const jhTargets = PHONEME_TARGETS.JH;
            expect(jhEvent.params.AV, "JH AV").toBeGreaterThan(0); // Voiced
            expect(jhEvent.params.AF, "JH AF").toBeCloseTo(jhTargets.AF);
            expect(jhEvent.params.AVS, "JH AVS").toBeGreaterThan(0); // Voiced source for frication
            expect(jhEvent.params.A4, "JH A4").toBeCloseTo(jhTargets.A4); // Check some parallel gains
            expect(jhEvent.params.A5, "JH A5").toBeCloseTo(jhTargets.A5);
        }
    });

    it('applies vowel shortening rule correctly', () => {
        const trackCat = textToKlattTrack('cat'); // AE before voiceless stop T
        const trackCad = textToKlattTrack('cad'); // AE before voiced stop D

        const aeCatEvent = trackCat.find(e => e.phoneme === 'AE');
        const aeCadEvent = trackCad.find(e => e.phoneme === 'AE');

        expect(aeCatEvent, "'AE' in 'cat' should exist").toBeDefined();
        expect(aeCadEvent, "'AE' in 'cad' should exist").toBeDefined();

        if (aeCatEvent && aeCadEvent) {
            // *** CORRECTED findDuration to get duration OF the specified phoneme ***
            const findDuration = (track, phoneme) => {
                // Find the index of the event *marking the end* of the target phoneme
                const index = track.findIndex(e => e.phoneme === phoneme);
                // Ensure the event and the *previous* event exist
                if (index === -1 || index === 0) return -1;
                const currentEvent = track[index];
                const prevEvent = track[index - 1];
                return currentEvent.time - prevEvent.time; // Duration is end_time - start_time
            };
            // Find the duration of the AE vowel segment
            const durCat = findDuration(trackCat, 'AE');
            const durCad = findDuration(trackCad, 'AE');

            expect(durCat).toBeGreaterThan(0);
            expect(durCad).toBeGreaterThan(0);
            // Expect AE before T to be shorter than AE before D
            expect(durCat).toBeLessThan(durCad);
        }
    });


    it('applies K context rule correctly', () => {
        const trackKey = textToKlattTrack('key'); // K before front vowel IY
        const trackCoo = textToKlattTrack('coo'); // K before back vowel UW

        const kClKey = trackKey.find(e => e.phoneme === 'K_CL');
        const kClCoo = trackCoo.find(e => e.phoneme === 'K_CL');

        expect(kClKey, "'K_CL' in 'key' should exist").toBeDefined();
        expect(kClCoo, "'K_CL' in 'coo' should exist").toBeDefined();

        if (kClKey && kClCoo) {
            // Expect F2 to be higher before front vowel
            // Check specific values instead of just greater than
            expect(kClKey.params.F2, "F2 for K before front vowel (key)").toBeCloseTo(1500);
            expect(kClCoo.params.F2, "F2 for K before back vowel (coo)").toBeCloseTo(1200);
            // The original assertion is still valid if the specific values are correct:
            expect(kClKey.params.F2).toBeGreaterThan(kClCoo.params.F2);
        }
    });

    it('handles empty input string', () => {
        const track = textToKlattTrack('');
        expect(track).toBeInstanceOf(Array);
        // Should contain initial and final silence
        expect(track.length).toBe(2);
        expect(track[0].params.AV).toBe(0);
        expect(track[1].params.AV).toBe(0);
    });

    it('handles input with only punctuation', () => {
        const track = textToKlattTrack('? , !');
        expect(track).toBeInstanceOf(Array);
        // Should contain initial silence, punctuation silences, and final silence
        expect(track.length).toBeGreaterThan(2);
        track.forEach(event => {
            expect(event.params.AV).toBe(0); // All should be silent
        });
        // Check if punctuation pauses were applied (longer than default SIL)
        const commaPauseEventIndex = track.findIndex(e => e.phoneme === 'SIL' && e.time > 0 && e.time < track[track.length - 1].time); // Find a SIL event between start/end
        expect(commaPauseEventIndex).toBeGreaterThan(0); // Ensure it's not the first event
        const commaPauseDuration = track[commaPauseEventIndex].time - track[commaPauseEventIndex - 1].time;
        // Check if duration is roughly 150ms (comma pause) + 300ms (question mark pause) etc.
        // This is still a weak check, depends on exact rule implementation.
        // A better check might be to verify the duration property if it were added to the track event.
        expect(commaPauseDuration).toBeGreaterThan(0.1); // Check it's longer than default 100ms SIL
    });


    it('ensures voicing parameters (AV, AVS) are consistent', () => {
        const track = textToKlattTrack('buzz'); // B, AH0, Z
        const bEvents = track.filter(e => e.phoneme === 'B_CL' || e.phoneme === 'B_REL');
        const zEvent = track.find(e => e.phoneme === 'Z');
        const ahEvent = track.find(e => e.phoneme === 'AH'); // AH0

        expect(bEvents.length).toBeGreaterThan(0); // Should have B_CL and maybe B_REL
        expect(zEvent, "'Z' event should exist").toBeDefined();
        expect(ahEvent, "'AH' event should exist").toBeDefined();

        bEvents.forEach(bEvent => expect(bEvent.params.AV, `B event (${bEvent.phoneme}) AV`).toBeGreaterThan(0));
        if (zEvent) expect(zEvent.params.AV, "Z AV").toBeGreaterThan(0);
        if (zEvent) expect(zEvent.params.AVS, "Z AVS").toBeGreaterThan(0); // Voiced frication source
        if (ahEvent) expect(ahEvent.params.AV, "AH AV").toBeGreaterThan(0); // Vowel is voiced
    });


    it('ensures noise parameters (AF, AH) are consistent', () => {
        const track = textToKlattTrack('fast'); // F, AE1, S, T_CL, T_REL
        const fEvent = track.find(e => e.phoneme === 'F');
        const sEvent = track.find(e => e.phoneme === 'S');
        const tRelEvent = track.find(e => e.phoneme === 'T_REL');
        const aeEvent = track.find(e => e.phoneme === 'AE');

        expect(fEvent, "'F' event should exist").toBeDefined();
        expect(sEvent, "'S' event should exist").toBeDefined();
        expect(tRelEvent, "'T_REL' event should exist").toBeDefined();
        expect(aeEvent, "'AE' event should exist").toBeDefined();

        if (fEvent) expect(fEvent.params.AF, "F AF").toBeGreaterThan(0);
        if (fEvent) expect(fEvent.params.AH, "F AH").toBeCloseTo(0);
        if (sEvent) expect(sEvent.params.AF, "S AF").toBeGreaterThan(0);
        if (sEvent) expect(sEvent.params.AH, "S AH").toBeCloseTo(0);
        if (tRelEvent) expect(tRelEvent.params.AF, "T_REL AF").toBeGreaterThan(0); // Frication burst
        if (tRelEvent) expect(tRelEvent.params.AH, "T_REL AH").toBeGreaterThan(0); // Aspiration
        if (aeEvent) expect(aeEvent.params.AF, "AE AF").toBeCloseTo(0); // Vowel has no noise
        if (aeEvent) expect(aeEvent.params.AH, "AE AH").toBeCloseTo(0);
    });

    // *** NEW TESTS END HERE ***

  }); // End of describe('textToKlattTrack')

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
