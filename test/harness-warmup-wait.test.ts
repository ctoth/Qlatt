/**
 * The waits around the page's frontend warm-up (test/harness/warmup-wait.js)
 * have limits. A warm-up that waited for an idle callback without one hung
 * Speak in a tab that was not visible, where the callback never comes.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  IDLE_WAIT_LIMIT_MS,
  idle,
  SPEAK_WAIT_LIMIT_MS,
  settledWithin,
  waitForWarmup,
} from "./harness/warmup-wait.js";

/** Whether `pending` has resolved, after letting queued microtasks run. */
async function isDone(pending: Promise<unknown>): Promise<boolean> {
  let done = false;
  void pending.then(() => {
    done = true;
  });
  await vi.advanceTimersByTimeAsync(0);
  return done;
}

describe("warm-up waits", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("the idle wait ends at its limit when the idle callback never comes", async () => {
    // A hidden tab: the callback is accepted and never called.
    const requested = vi.fn();
    vi.stubGlobal("requestIdleCallback", requested);
    const waiting = idle();
    expect(requested).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(IDLE_WAIT_LIMIT_MS - 1);
    expect(await isDone(waiting)).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await isDone(waiting)).toBe(true);
  });

  it("the idle wait ends at once when the idle callback comes", async () => {
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => callback());
    expect(await isDone(idle())).toBe(true);
  });

  it("the idle wait ends at its limit where there are no idle callbacks at all", async () => {
    vi.stubGlobal("requestIdleCallback", undefined);
    const waiting = idle();
    await vi.advanceTimersByTimeAsync(IDLE_WAIT_LIMIT_MS);
    expect(await isDone(waiting)).toBe(true);
  });

  it("Speak stops waiting for a warm-up that never finishes, and says so", async () => {
    const warn = vi.fn();
    const never = new Promise(() => {});
    const waiting = waitForWarmup(never, "dectalk-english", undefined, warn);
    await vi.advanceTimersByTimeAsync(SPEAK_WAIT_LIMIT_MS - 1);
    expect(await isDone(waiting)).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await waiting).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain(
      `Warm-up of dectalk-english was not finished after ${SPEAK_WAIT_LIMIT_MS} ms`,
    );
    expect(warn.mock.calls[0]?.[0]).toContain("Speak proceeds");
  });

  it("Speak goes ahead after a warm-up that fails, and says why", async () => {
    const warn = vi.fn();
    const failed = Promise.reject(new Error("manifest unreadable"));
    expect(await waitForWarmup(failed, "dectalk-english", undefined, warn)).toBe(false);
    expect(warn.mock.calls[0]?.[0]).toContain(
      "Warm-up of dectalk-english failed (manifest unreadable)",
    );
  });

  it("Speak waits for a warm-up that finishes in time, without a warning", async () => {
    const warn = vi.fn();
    const warmUp = new Promise((resolve) => setTimeout(() => resolve("report"), 2000));
    const waiting = waitForWarmup(warmUp, "dectalk-english", undefined, warn);
    await vi.advanceTimersByTimeAsync(1999);
    expect(await isDone(waiting)).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await waiting).toBe(true);
    expect(warn).not.toHaveBeenCalled();
    // The limit's timer is gone: nothing is left to fire.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("settledWithin reports the value, the error, or the timeout", async () => {
    expect(await settledWithin(Promise.resolve(7), 50)).toEqual({ settled: true, value: 7 });
    const error = new Error("no");
    expect(await settledWithin(Promise.reject(error), 50)).toEqual({
      settled: false,
      reason: error,
    });
    const late = settledWithin(new Promise(() => {}), 50);
    await vi.advanceTimersByTimeAsync(50);
    expect(await late).toEqual({ settled: false, reason: "timeout" });
  });
});
