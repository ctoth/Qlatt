// test/harness/warmup-wait.js — The two waits around the frontend warm-up,
// each with a stated limit. Kept apart from warmup.js, with no import of the
// page, so that test/harness-warmup-wait.test.ts can run them.
//
// Both exist because a wait without a limit hung Speak: the warm-up waited for
// an idle callback, a tab that is not visible is never given one, and Speak
// waits for the warm-up.

/** The longest the warm-up's compile waits for an idle moment, in ms. Engineering estimate. */
export const IDLE_WAIT_LIMIT_MS = 200;

/**
 * The longest Speak waits for a warm-up that is still running, in ms.
 * Engineering estimate: about four times the 2.2 s the dectalk-english warm-up
 * took on a production build with 80 ms added to every response.
 */
export const SPEAK_WAIT_LIMIT_MS = 10000;

/** An idle moment, or `limitMs`, whichever is first. */
export function idle(limitMs = IDLE_WAIT_LIMIT_MS) {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === "function") requestIdleCallback(() => resolve());
    setTimeout(resolve, limitMs);
  });
}

/**
 * What Speak does about a warm-up: wait for it, but for no longer than
 * `limitMs`. Returns true if the warm-up finished. If it did not, or it
 * failed, says so through `warn` and returns false; Speak then goes ahead and
 * the frontend loads whatever is missing with blocking requests, as it did
 * before there was a warm-up.
 */
export async function waitForWarmup(pending, frontendId, limitMs = SPEAK_WAIT_LIMIT_MS, warn) {
  const outcome = await settledWithin(pending, limitMs);
  if (outcome.settled) return true;
  const why =
    outcome.reason === "timeout"
      ? `was not finished after ${limitMs} ms`
      : `failed (${outcome.reason instanceof Error ? outcome.reason.message : outcome.reason})`;
  (warn ?? console.warn)(
    `[QLATT] Warm-up of ${frontendId} ${why}; Speak proceeds and loads the frontend with blocking requests`,
  );
  return false;
}

/**
 * Wait for `pending` for at most `limitMs`. Never rejects and never waits
 * longer: resolves to `{ settled: true, value }`, or to `{ settled: false,
 * reason }` where `reason` is "timeout" or the error `pending` rejected with.
 * `pending` itself is left running.
 */
export function settledWithin(pending, limitMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ settled: false, reason: "timeout" }), limitMs);
    Promise.resolve(pending).then(
      (value) => {
        clearTimeout(timer);
        resolve({ settled: true, value });
      },
      (reason) => {
        clearTimeout(timer);
        resolve({ settled: false, reason });
      },
    );
  });
}
