import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { KlattSynth } from './klatt-synth.js'; // Corrected path
import { textToKlattTrack } from './tts-frontend.js'; // Corrected path
import { clearWebAudioMocks } from './src/__mocks__/webaudio.js'; // Corrected path

// Mock the worklet processor files to prevent Node trying to execute them
vi.mock('./voicing-source-processor.js', () => ({ default: class MockVoicingProcessor {} }), { virtual: true }); // Corrected path
vi.mock('./noise-source-processor.js', () => ({ default: class MockNoiseProcessor {} }), { virtual: true }); // Corrected path
vi.mock('./radiation-processor.js', () => ({ default: class MockRadiationProcessor {} }), { virtual: true }); // Corrected path

describe('TTS to Klatt Integration', () => {
  let audioContext;
  let klattSynth;

  beforeEach(async () => {
    audioContext = new AudioContext();
    klattSynth = new KlattSynth(audioContext);
    await klattSynth.initialize();

    // Spy on console methods to reduce test noise (keep if desired)
    // vi.spyOn(console, 'log').mockImplementation(() => {}); // Keep console spies if desired
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {}); // Also spy error
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearWebAudioMocks(audioContext);
    klattSynth.stop();
  });

  describe('End-to-End Text to Speech', () => {
    it('successfully generates and plays a track from text', () => {
      // Generate a track from text
      const track = textToKlattTrack('hello world', 110);
      
      // Verify track structure
      expect(track).toBeInstanceOf(Array);
      expect(track.length).toBeGreaterThan(0);
      
      // Set up spies
      const setTrackSpy = vi.spyOn(klattSynth, 'setTrack');
      const startSpy = vi.spyOn(klattSynth, 'start');
      
      // Set the track and start playback
      klattSynth.setTrack(track);
      klattSynth.start();
      
      // Verify methods were called
      expect(setTrackSpy).toHaveBeenCalledWith(track);
      expect(startSpy).toHaveBeenCalled();
      expect(klattSynth.isRunning).toBe(true);
    });

    it('handles parameter transitions correctly', () => {
      // Generate a track with known transitions
      const track = textToKlattTrack('test', 110);
      
      // Find events with different voicing states
      const voicedEvents = track.filter(e => e.params.AV > 0);
      const unvoicedEvents = track.filter(e => e.params.AV === 0 && e.params.AF > 0);
      
      // We should have both voiced and unvoiced segments
      expect(voicedEvents.length).toBeGreaterThan(0);
      expect(unvoicedEvents.length).toBeGreaterThan(0);
      
      // Set up parameter spies
      const avSpy = vi.spyOn(klattSynth, 'setParam');
      
      // Set the track
      klattSynth.setTrack(track);
      
      // Verify AV parameter was set multiple times (transitions)
      const avCalls = avSpy.mock.calls.filter(call => call[0] === 'AV');
      expect(avCalls.length).toBeGreaterThan(1);
      
      // Verify we have both zero and non-zero AV values
      const avValues = avCalls.map(call => call[1]);
      expect(avValues.some(v => v > 0)).toBe(true);
      expect(avValues.some(v => v === 0)).toBe(true);
    });
  });

  describe('Parameter Validation', () => {
    it('ensures all track parameters are valid before sending to synth', () => {
      // Create a track with potential edge cases
      const track = textToKlattTrack('p t k', 110); // Stop consonants
      
      // Set up console error spy to catch any validation errors
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      // Set the track
      klattSynth.setTrack(track);
      
      // Advance time to process some events
      audioContext.advanceTime(0.5);
      
      // No errors should occur during parameter setting
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/Invalid value.*for parameter/)
      );
    });

    it('handles F0=0 correctly for unvoiced segments', () => {
      // Generate a track with unvoiced segments (F0=0)
      const track = textToKlattTrack('s', 110); // Unvoiced fricative
      
      // Find events with F0=0
      const zeroF0Events = track.filter(e => e.params.F0 === 0);
      expect(zeroF0Events.length).toBeGreaterThan(0);
      
      // Set up parameter spy
      const f0Spy = vi.spyOn(klattSynth, 'setParam');
      
      // Set the track
      klattSynth.setTrack(track);
      
      // Verify F0=0 was set
      const f0Calls = f0Spy.mock.calls.filter(call => call[0] === 'F0');
      const f0Values = f0Calls.map(call => call[1]);
      expect(f0Values.some(v => v === 0)).toBe(true);
    });
  });

  describe('Bug Verification', () => {
    it('ensures voicing parameters are properly coordinated', () => {
      // Generate a track with voiced segments
      const track = textToKlattTrack('hello', 110);
      
      // Set up parameter spies
      const setParamSpy = vi.spyOn(klattSynth, 'setParam');
      
      // Set the track
      klattSynth.setTrack(track);
      
      // Get all calls to set AV and F0
      const avCalls = setParamSpy.mock.calls.filter(call => call[0] === 'AV');
      const f0Calls = setParamSpy.mock.calls.filter(call => call[0] === 'F0');
      
      // For each time AV > 0, there should be a corresponding F0 > 0
      avCalls.forEach((avCall, index) => {
        const [_, avValue, avTime] = avCall;
        if (avValue > 0) {
          // Find the F0 call with the closest time
          const matchingF0Call = f0Calls.find(f0Call => {
            const f0Time = f0Call[2];
            return Math.abs(f0Time - avTime) < 0.01; // Within 10ms
          });
          
          expect(matchingF0Call).toBeDefined();
          if (matchingF0Call) {
            const f0Value = matchingF0Call[1];
            expect(f0Value).toBeGreaterThan(0);
          }
        }
      });
    });
  });
});
