/**
 * Starting and ending a track on a context that runs in real time.
 *
 * An offline render schedules its track before the context starts. A page
 * schedules while the context's clock runs, and two things follow from that:
 *
 * - If the start time is chosen first and the automation written after, the
 *   writing eats into the lead, and for a long track it eats all of it: the
 *   run begins before its first events exist and its opening is lost. So the
 *   track is compiled first, with no clock involved, and the events are
 *   written while the context is held (suspended): its clock stands still, the
 *   start is a lead after that standing time, and nothing can begin before
 *   every event is in place, however many there are.
 *
 * - A track scheduled over one that is still playing is not a new run for a
 *   node that keeps state from frame to frame (dectalk-vtm): its `run` never
 *   drops, so it never starts again. The earlier track is ended first, at the
 *   same standing time: its final frame's values (its resting state: `run` 0,
 *   or silence for a formant graph) are applied there, and the new track
 *   starts a lead later, from the node's start-up state.
 */

import type { KlattFrame, KlattInterpreter } from "./klatt-interpreter";

/** The context as far as playback needs it. */
export interface PlaybackClock {
  readonly currentTime: number;
}

/** Holds the context's clock still and lets it run again. */
export interface PlaybackGate {
  hold(): Promise<void>;
  release(): Promise<void>;
}

/** A real-time context's gate: suspend and resume. */
export function contextGate(context: {
  suspend(): Promise<void>;
  resume(): Promise<void>;
}): PlaybackGate {
  return { hold: () => context.suspend(), release: () => context.resume() };
}

/**
 * Seconds from the held clock to a track's start. It does not cover the time
 * scheduling takes, which the gate makes irrelevant. It is the time a node
 * whose earlier run was just ended has to see that end before the next run
 * starts: the dectalk-vtm node reads `run` once a frame, every 6.44 ms
 * (src/worklets/dectalk-vtm-processor.ts, latch()), so the lead must span a
 * frame boundary whatever the phase; 20 ms spans three.
 * engineering estimate. The page used 50 ms when the lead also had to cover
 * the scheduling.
 */
export const PLAYBACK_LEAD_SEC = 0.02;

export type PlaybackInterpreter = Pick<
  KlattInterpreter,
  "prepareTrack" | "schedulePrepared" | "endTrack"
>;

/**
 * Play a track: end what is playing, and start the track `leadTime` after
 * the moment the context was held. Returns the context time the track starts
 * at. The context is running again when this resolves.
 */
export async function playTrack(options: {
  clock: PlaybackClock;
  gate: PlaybackGate;
  interpreter: PlaybackInterpreter;
  track: KlattFrame[];
  leadTime?: number;
  /** Called with the start time once it is known, before anything is scheduled at it. */
  beforeSchedule?: (startTime: number) => void;
}): Promise<number> {
  const { clock, gate, interpreter, track } = options;
  // The slow part, with the context still running and no time chosen yet.
  const prepared = interpreter.prepareTrack(track);
  await gate.hold();
  try {
    interpreter.endTrack();
    const startTime = clock.currentTime + (options.leadTime ?? PLAYBACK_LEAD_SEC);
    options.beforeSchedule?.(startTime);
    interpreter.schedulePrepared(prepared, startTime);
    return startTime;
  } finally {
    // Measured in Chrome 154: the context takes about as long to run again
    // as the track took to compile (17 ms for 1 s of dectalk-vtm speech, 380
    // ms for 33 s), which is the time its audio thread needs to take in the
    // events. Without the hold that time is spent after the start time.
    await gate.release();
  }
}

/**
 * End what is playing, now. The context keeps running; a caller that then
 * suspends it should let it advance first (`untilAdvanced`), or the nodes
 * never render the end.
 */
export function endPlayback(interpreter: Pick<KlattInterpreter, "endTrack">): void {
  interpreter.endTrack();
}

/**
 * Resolves when the context's clock has advanced `seconds` from now, so that
 * the nodes have rendered what was just scheduled at the current time; or
 * after `timeoutMs` if the clock is not running.
 */
export async function untilAdvanced(
  clock: PlaybackClock,
  seconds: number,
  timeoutMs = 500,
): Promise<void> {
  const target = clock.currentTime + seconds;
  const deadline = Date.now() + timeoutMs;
  while (clock.currentTime < target && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
