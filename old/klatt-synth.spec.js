import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { KlattSynth } from './klatt-synth.js';
import { clearWebAudioMocks } from './src/__mocks__/webaudio.js'; // Corrected path

describe('KlattSynth', () => {
  let audioContext;
  let klattSynth;

  beforeEach(async () => { // Make async if initialize is called here
    audioContext = new AudioContext();
    klattSynth = new KlattSynth(audioContext);
    // Spy on console methods used by KlattSynth (optional, if needed)
    // vi.spyOn(console, 'log').mockImplementation(() => {}); // Keep console spies if desired
    // vi.spyOn(console, 'warn').mockImplementation(() => {});
    // vi.spyOn(console, 'error').mockImplementation(() => {});

    // NOTE: If initialize() is called within beforeEach, it needs to be awaited
    // await klattSynth.initialize(); // Example if init was here
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearWebAudioMocks(audioContext);
  });

  describe('Initialization', () => {
    it('creates an instance with default parameters', () => {
      expect(klattSynth).toBeDefined();
      expect(klattSynth.isInitialized).toBe(false);
      expect(klattSynth.isRunning).toBe(false);
      expect(klattSynth.params).toBeDefined();
      expect(klattSynth.params.F0).toBe(100);
    });

    it('initializes audio nodes when initialize() is called', async () => {
      const spy = vi.spyOn(audioContext.audioWorklet, 'addModule');
      
      await klattSynth.initialize();
      
      expect(spy).toHaveBeenCalledTimes(2); // Expect 2 worklets: voicing and noise
      expect(klattSynth.isInitialized).toBe(true);
      expect(klattSynth.nodes).toBeDefined();
      expect(klattSynth.nodes.voicingSource).toBeDefined();
      expect(klattSynth.nodes.outputGain).toBeDefined();
    });
  });

  describe('Parameter Setting', () => {
    beforeEach(async () => {
      await klattSynth.initialize();
    });

    it('updates internal parameter state when setParam is called', () => {
      klattSynth.setParam('F0', 150);
      expect(klattSynth.params.F0).toBe(150);
      
      klattSynth.setParam('AV', 60);
      expect(klattSynth.params.AV).toBe(60);
    });

    it('schedules parameter changes on the appropriate nodes', () => {
      const f0Param = klattSynth.nodes.voicingSource.parameters.get('f0');
      const spy = vi.spyOn(f0Param, 'linearRampToValueAtTime');
      
      klattSynth.setParam('F0', 200);
      
      expect(spy).toHaveBeenCalled();
      expect(f0Param.value).toBe(200);
    });

    it('handles invalid parameter values gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      klattSynth.setParam('F0', NaN);
      expect(klattSynth.params.F0).not.toBe(NaN);
      
      klattSynth.setParam('F0', Infinity);
      expect(klattSynth.params.F0).not.toBe(Infinity);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Audio Graph Connections', () => {
    beforeEach(async () => {
      await klattSynth.initialize();
    });

    it('connects nodes in cascade/parallel mode when SW=0', () => {
      klattSynth.setParam('SW', 0);
      klattSynth._reconnectGraph();
      
      // Check that voicedSourceSum (formerly laryngealSourceSum) output (via radiationDiff and cascadeInputSum)
      // is connected to the start of the cascade formant path (R1C)
      const cascadeInputSumConnections = klattSynth.nodes.cascadeInputSum.getConnections();
      expect(cascadeInputSumConnections.some(conn => conn.destination === klattSynth.nodes.r1CascFilter)).toBe(true);

      // Check that finalSum is connected to finalLpFilter (radiation node removed)
      const finalSumConnections = klattSynth.nodes.finalSum.getConnections();
      expect(finalSumConnections.some(conn => conn.destination === klattSynth.nodes.finalLpFilter)).toBe(true);
    });

    it('connects nodes in all-parallel mode when SW=1', () => {
      klattSynth.setParam('SW', 1);
      klattSynth._reconnectGraph();
      
      // In SW=1, cascadeInputSum (derived from voicedSourceSum -> radiationDiff) should connect to R1P (r1ParFilter)
      const cascadeInputSumConnections = klattSynth.nodes.cascadeInputSum.getConnections();
      expect(cascadeInputSumConnections.some(conn => conn.destination === klattSynth.nodes.r1ParFilter)).toBe(true);
      
      // Check that parallelSum is connected to finalLpFilter (radiation node removed)
      const parallelSumConnections = klattSynth.nodes.parallelSum.getConnections();
      expect(parallelSumConnections.some(conn => conn.destination === klattSynth.nodes.finalLpFilter)).toBe(true);
    });
  });

  describe('Track Playback', () => {
    beforeEach(async () => {
      await klattSynth.initialize();
    });

    it('schedules parameter changes from a track', () => {
      const track = [
        { time: 0, params: { F0: 110, AV: 60 } },
        { time: 0.1, params: { F0: 120, AV: 62 } },
        { time: 0.2, params: { F0: 100, AV: 0 } }
      ];
      
      const f0Param = klattSynth.nodes.voicingSource.parameters.get('f0');
      const f0Spy = vi.spyOn(f0Param, 'setValueAtTime');
      const f0RampSpy = vi.spyOn(f0Param, 'linearRampToValueAtTime');
      
      klattSynth.setTrack(track);
      
      // Should set initial values immediately
      expect(f0Spy).toHaveBeenCalledWith(110, expect.any(Number));
      
      // Should schedule ramps for subsequent values
      expect(f0RampSpy).toHaveBeenCalledTimes(2);
    });

    it('cancels previous schedules when setting a new track', () => {
      const cancelSpy = vi.spyOn(klattSynth, 'cancelScheduledValues');
      
      klattSynth.setTrack([{ time: 0, params: { F0: 110 } }]);
      
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('Start/Stop Control', () => {
    beforeEach(async () => {
      await klattSynth.initialize();
      vi.useFakeTimers(); // Use fake timers for stop() test
    });

    afterEach(() => {
      vi.runOnlyPendingTimers(); // Run any pending timers
      vi.useRealTimers(); // Restore real timers
    });

    it('connects output to destination when start() is called', () => {
      const connectSpy = vi.spyOn(klattSynth.nodes.outputGain, 'connect');
      
      klattSynth.start();
      
      expect(connectSpy).toHaveBeenCalledWith(audioContext.destination);
      expect(klattSynth.isRunning).toBe(true);
    });

    it('disconnects output from destination when stop() is called', () => {
      klattSynth.start();
      
      const disconnectSpy = vi.spyOn(klattSynth.nodes.outputGain, 'disconnect');
      
      klattSynth.stop();
      
      // Advance timers to trigger the setTimeout in stop()
      vi.advanceTimersByTime(100); // Advance by more than RAMP_DOWN_TIME + buffer

      expect(disconnectSpy).toHaveBeenCalledWith(audioContext.destination);
      expect(klattSynth.isRunning).toBe(false);
    });

    it('resumes the audio context if suspended', async () => {
      audioContext.state = 'suspended';
      const resumeSpy = vi.spyOn(audioContext, 'resume');
      
      klattSynth.start();
      
      expect(resumeSpy).toHaveBeenCalled();
    });
  });
});
