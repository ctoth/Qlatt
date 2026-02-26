/**
 * Tests for waitForNodeReady in klatt-runtime.ts
 *
 * Verifies that the function:
 * 1. Resolves when the worklet sends a 'ready' message
 * 2. Rejects on timeout when the worklet never responds
 * 3. Cleans up the message handler on timeout
 */
import { describe, it, expect, vi } from 'vitest';
import { waitForNodeReady } from '../src/klatt-runtime';

// ---------------------------------------------------------------------------
// Mock AudioWorkletNode with a controllable MessagePort
// ---------------------------------------------------------------------------

interface MockHandler {
  (event: { data: { type: string } }): void;
}

function createMockWorkletNode() {
  const handlers: MockHandler[] = [];
  return {
    port: {
      addEventListener: vi.fn((event: string, handler: MockHandler) => {
        if (event === 'message') handlers.push(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: MockHandler) => {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      }),
      start: vi.fn(),
      postMessage: vi.fn(),
    },
    /** Simulate the worklet sending a ready message */
    sendReady() {
      for (const h of [...handlers]) {
        h({ data: { type: 'ready' } });
      }
    },
    /** Get current number of registered message handlers */
    get handlerCount() {
      return handlers.length;
    },
  };
}

describe('waitForNodeReady', () => {
  it('resolves when worklet sends ready message', async () => {
    const mock = createMockWorkletNode();

    const promise = waitForNodeReady(
      mock as unknown as AudioWorkletNode,
      500,
    );

    // Simulate worklet sending ready
    mock.sendReady();

    // Should resolve without error
    await expect(promise).resolves.toBeUndefined();

    // Handler should have been cleaned up on success
    expect(mock.port.removeEventListener).toHaveBeenCalled();
  });

  it('rejects on timeout when worklet never responds', async () => {
    vi.useFakeTimers();
    try {
      const mock = createMockWorkletNode();

      const promise = waitForNodeReady(
        mock as unknown as AudioWorkletNode,
        50,
      );

      // Advance past the timeout
      vi.advanceTimersByTime(60);

      // Should reject, not resolve
      await expect(promise).rejects.toThrow(/timed out/i);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cleans up message handler on timeout', async () => {
    vi.useFakeTimers();
    try {
      const mock = createMockWorkletNode();

      const promise = waitForNodeReady(
        mock as unknown as AudioWorkletNode,
        50,
      );

      // Before timeout: handler should be registered
      expect(mock.port.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      expect(mock.handlerCount).toBe(1);

      // Advance past the timeout
      vi.advanceTimersByTime(60);

      // Catch the rejection so it doesn't become unhandled
      await promise.catch(() => {});

      // After timeout: handler should have been removed
      expect(mock.port.removeEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      expect(mock.handlerCount).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores non-ready messages', async () => {
    const mock = createMockWorkletNode();

    const promise = waitForNodeReady(
      mock as unknown as AudioWorkletNode,
      200,
    );

    // Send a non-ready message - should be ignored
    for (const h of [...(mock as any).port.addEventListener.mock.calls
      .filter((c: any) => c[0] === 'message')
      .map((c: any) => c[1])]) {
      h({ data: { type: 'status' } });
    }

    // Now send ready
    mock.sendReady();

    await expect(promise).resolves.toBeUndefined();
  });
});
