/**
 * Tests for waitForNodeReady in klatt-runtime.ts
 *
 * Verifies that the function:
 * 1. Resolves when the worklet sends a 'ready' message
 * 2. Rejects on timeout when the worklet never responds
 * 3. Cleans up the message handler on timeout
 */
import { describe, it, expect, vi } from 'vitest';
import { createKlattRuntime, waitForNodeReady } from '../src/klatt-runtime';
import { initWasmModule } from '../src/worklets/wasm-utils';

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

describe('KlattRuntime worklet lifecycle', () => {
  it('reuses one WASM instance for nodes backed by the same worklet module', async () => {
    const instance = { exports: {} } as unknown as WebAssembly.Instance;
    const instantiate = vi
      .spyOn(WebAssembly, 'instantiate')
      .mockResolvedValue({ instance, module: {} as WebAssembly.Module });

    try {
      const url = `https://qlatt.test/resonator-${Date.now()}.wasm`;
      const first = await initWasmModule(url, {}, new ArrayBuffer(8));
      const second = await initWasmModule(url, {}, new ArrayBuffer(8));

      expect(second).toBe(first);
      expect(instantiate).toHaveBeenCalledOnce();
    } finally {
      instantiate.mockRestore();
    }
  });

  it('tells worklet processors to dispose and closes their ports on disconnect', async () => {
    const messageHandlers: MockHandler[] = [];

    class MockAudioWorkletNode {
      static instances: MockAudioWorkletNode[] = [];
      parameters = new Map();
      connect = vi.fn();
      disconnect = vi.fn();
      port = {
        addEventListener: vi.fn((event: string, handler: MockHandler) => {
          if (event === 'message') messageHandlers.push(handler);
        }),
        removeEventListener: vi.fn((event: string, handler: MockHandler) => {
          const index = messageHandlers.indexOf(handler);
          if (index >= 0) messageHandlers.splice(index, 1);
        }),
        start: vi.fn(),
        close: vi.fn(),
        postMessage: vi.fn((message: { type?: string }) => {
          if (message.type === 'ping') {
            queueMicrotask(() => {
              for (const handler of [...messageHandlers]) {
                handler({ data: { type: 'ready' } });
              }
            });
          }
        }),
      };

      constructor() {
        MockAudioWorkletNode.instances.push(this);
      }
    }

    const runtime = await createKlattRuntime({
      audioContext: {
        audioWorklet: { addModule: vi.fn(async () => {}) },
      } as unknown as AudioContext,
      graph: {
        bacon: '0.1',
        nodes: { source: { type: 'source' } },
      },
      semantics: { params: {} },
      registry: {
        primitives: {
          source: {
            worklet: 'source-processor.js',
            inputs: 0,
            outputs: 1,
          },
        },
      },
      audioWorkletNodeCtor:
        MockAudioWorkletNode as unknown as NonNullable<
          Parameters<typeof createKlattRuntime>[0]['audioWorkletNodeCtor']
        >,
      assetLoader: {
        resolveWorkletModule: (moduleName) => moduleName,
        loadWasmModule: vi.fn(),
      },
    });

    const [node] = MockAudioWorkletNode.instances;
    runtime.disconnect();

    expect(node.port.postMessage).toHaveBeenCalledWith({ type: 'dispose' });
    expect(node.port.close).toHaveBeenCalledOnce();
    expect(node.disconnect).toHaveBeenCalledOnce();
  });

  it('rejects and disposes the graph when a worklet never becomes ready', async () => {
    vi.useFakeTimers();
    try {
      class UnreadyAudioWorkletNode {
        static instances: UnreadyAudioWorkletNode[] = [];
        parameters = new Map();
        connect = vi.fn();
        disconnect = vi.fn();
        port = {
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          start: vi.fn(),
          close: vi.fn(),
          postMessage: vi.fn(),
        };

        constructor() {
          UnreadyAudioWorkletNode.instances.push(this);
        }
      }

      const runtimePromise = createKlattRuntime({
        audioContext: {
          audioWorklet: { addModule: vi.fn(async () => {}) },
        } as unknown as AudioContext,
        graph: {
          bacon: '0.1',
          nodes: { source: { type: 'source' } },
        },
        semantics: { params: {} },
        registry: {
          primitives: {
            source: {
              worklet: 'source-processor.js',
              inputs: 0,
              outputs: 1,
            },
          },
        },
        audioWorkletNodeCtor:
          UnreadyAudioWorkletNode as unknown as NonNullable<
            Parameters<typeof createKlattRuntime>[0]['audioWorkletNodeCtor']
          >,
        assetLoader: {
          resolveWorkletModule: (moduleName) => moduleName,
          loadWasmModule: vi.fn(),
        },
      });
      const rejection = expect(runtimePromise).rejects.toThrow(/failed to initialize.*worklet/i);

      await vi.advanceTimersByTimeAsync(2100);
      await rejection;

      const [node] = UnreadyAudioWorkletNode.instances;
      expect(node.port.postMessage).toHaveBeenCalledWith({ type: 'dispose' });
      expect(node.port.close).toHaveBeenCalledOnce();
      expect(node.disconnect).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});
