/**
 * Tests for isAudioWorkletNode type guard in klatt-runtime.ts
 *
 * Verifies that the guard uses instanceof (not duck typing) to distinguish
 * AudioWorkletNode from other AudioNode types that happen to have a `port`
 * property.
 *
 * Since AudioWorkletNode is not a global in Node.js, tests mock it via
 * globalThis to simulate browser and non-browser environments.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { isAudioWorkletNode } from '../src/klatt-runtime';

// ---------------------------------------------------------------------------
// Mock AudioWorkletNode class for tests
// ---------------------------------------------------------------------------

/** Minimal mock that satisfies the AudioWorkletNode shape */
class MockAudioWorkletNode {
  port = { postMessage() {}, addEventListener() {}, start() {} };
  parameters = new Map();
  connect() {}
  disconnect() {}
}

// Store original so we can restore after tests
const originalAudioWorkletNode = (globalThis as any).AudioWorkletNode;

describe('isAudioWorkletNode', () => {
  describe('when AudioWorkletNode is defined globally', () => {
    beforeAll(() => {
      // Install mock as global so instanceof checks work
      (globalThis as any).AudioWorkletNode = MockAudioWorkletNode;
    });

    afterAll(() => {
      // Restore original (undefined in Node.js)
      if (originalAudioWorkletNode !== undefined) {
        (globalThis as any).AudioWorkletNode = originalAudioWorkletNode;
      } else {
        delete (globalThis as any).AudioWorkletNode;
      }
    });

    it('returns true for AudioWorkletNode instances', () => {
      const node = new MockAudioWorkletNode();
      expect(isAudioWorkletNode(node as unknown as AudioNode, MockAudioWorkletNode as any)).toBe(true);
    });

    it('returns false for a plain object with a port property', () => {
      // This is the key regression test: the old 'port' in node check
      // would return true for this, but instanceof should return false.
      const fakeNode = { port: {}, connect() {}, disconnect() {} };
      expect(isAudioWorkletNode(fakeNode as unknown as AudioNode, MockAudioWorkletNode as any)).toBe(false);
    });

    it('returns false for GainNode-like objects', () => {
      const gainLike = {
        gain: { value: 1 },
        connect() {},
        disconnect() {},
      };
      expect(isAudioWorkletNode(gainLike as unknown as AudioNode, MockAudioWorkletNode as any)).toBe(false);
    });

    it('returns false for ConstantSourceNode-like objects', () => {
      const constSourceLike = {
        offset: { value: 0 },
        connect() {},
        disconnect() {},
      };
      expect(isAudioWorkletNode(constSourceLike as unknown as AudioNode, MockAudioWorkletNode as any)).toBe(false);
    });
  });

  describe('when AudioWorkletNode is NOT defined globally', () => {
    beforeAll(() => {
      // Remove the global to simulate environments where it does not exist
      delete (globalThis as any).AudioWorkletNode;
    });

    afterAll(() => {
      // Restore for any subsequent test suites
      if (originalAudioWorkletNode !== undefined) {
        (globalThis as any).AudioWorkletNode = originalAudioWorkletNode;
      }
    });

    it('returns false for any node (cannot instanceof a missing class)', () => {
      const node = new MockAudioWorkletNode();
      expect(isAudioWorkletNode(node as unknown as AudioNode, undefined)).toBe(false);
    });

    it('returns false for plain objects with port property', () => {
      const fakeNode = { port: {}, connect() {}, disconnect() {} };
      expect(isAudioWorkletNode(fakeNode as unknown as AudioNode, undefined)).toBe(false);
    });
  });
});
