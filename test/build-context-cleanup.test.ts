/**
 * Tests for buildContext cleanup in klatt-interpreter.ts
 *
 * Verifies:
 * 1. staticContext does NOT contain function-valued keys after initialization
 * 2. buildContext produces context with only numeric/string/object values (no functions)
 * 3. Deep copy doesn't corrupt staticContext between calls (nested object mutation safety)
 */
import { describe, it, expect } from 'vitest';
import { buildStaticContext, buildFrameContext } from '../src/klatt-interpreter';

describe('buildStaticContext', () => {
  const constants = {
    ndbScale: { AV: -119, AH: -134, AF: -119 },
    ndbCor: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  };
  const paramDefaults = new Map<string, number>([
    ['F0', 100],
    ['F1', 500],
    ['AV', 60],
  ]);
  const sampleRate = 44100;

  it('does not contain function-valued keys', () => {
    const ctx = buildStaticContext(constants, paramDefaults, sampleRate);
    for (const [key, value] of Object.entries(ctx)) {
      expect(typeof value, `key "${key}" should not be a function`).not.toBe('function');
    }
  });

  it('contains constants, param defaults, and sampleRate', () => {
    const ctx = buildStaticContext(constants, paramDefaults, sampleRate);
    // Constants should be present
    expect(ctx['ndbScale']).toEqual({ AV: -119, AH: -134, AF: -119 });
    expect(ctx['ndbCor']).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    // Param defaults should be present
    expect(ctx['F0']).toBe(100);
    expect(ctx['F1']).toBe(500);
    expect(ctx['AV']).toBe(60);
    // sampleRate should be present
    expect(ctx['sampleRate']).toBe(44100);
  });
});

describe('buildFrameContext', () => {
  const constants = {
    ndbScale: { AV: -119, AH: -134, AF: -119 },
  };
  const paramDefaults = new Map<string, number>([
    ['F0', 100],
    ['F1', 500],
    ['F2', 1500],
    ['F3', 2500],
    ['F4', 3500],
    ['AV', 60],
  ]);
  const sampleRate = 44100;

  it('produces context with no function values', () => {
    const staticCtx = buildStaticContext(constants, paramDefaults, sampleRate);
    const frameCtx = buildFrameContext(staticCtx, { F0: 120, F1: 400 });
    for (const [key, value] of Object.entries(frameCtx)) {
      expect(typeof value, `key "${key}" should not be a function`).not.toBe('function');
    }
  });

  it('overlays frame params onto defaults', () => {
    const staticCtx = buildStaticContext(constants, paramDefaults, sampleRate);
    const frameCtx = buildFrameContext(staticCtx, { F0: 120, F1: 400 });
    // Frame params override defaults
    expect(frameCtx['F0']).toBe(120);
    expect(frameCtx['F1']).toBe(400);
    // Defaults remain for unspecified params
    expect(frameCtx['AV']).toBe(60);
    // sampleRate preserved
    expect(frameCtx['sampleRate']).toBe(44100);
  });

  it('does not corrupt staticContext between calls (nested object mutation safety)', () => {
    const staticCtx = buildStaticContext(constants, paramDefaults, sampleRate);

    // Build first context and mutate a nested object
    const ctx1 = buildFrameContext(staticCtx, { F0: 120 });
    const ndbScale1 = ctx1['ndbScale'] as Record<string, number>;
    ndbScale1['AV'] = 9999;  // mutate nested object in first copy

    // Build second context — should get original values, not the mutated ones
    const ctx2 = buildFrameContext(staticCtx, { F0: 130 });
    const ndbScale2 = ctx2['ndbScale'] as Record<string, number>;
    expect(ndbScale2['AV']).toBe(-119);  // original value, not 9999

    // Also verify staticContext itself wasn't corrupted
    const ndbScaleOriginal = staticCtx['ndbScale'] as Record<string, number>;
    expect(ndbScaleOriginal['AV']).toBe(-119);
  });
});
