// Timing context resolver — maps AudioContext.currentTime to the active track event.
// Replaces getRunContext()/findEventAtTime() from test/harness/diagnostics.js.

import type { TrackEvent } from "./types";

export interface TimingSnapshot {
  /** Time relative to run start. */
  relTime: number;
  /** The track event active at this time (last event whose time <= relTime). */
  event: TrackEvent | null;
  /** Index of the active event in the track. */
  eventIndex: number;
  /** Whether we're within the playback window (not before start, not after end + 0.5s). */
  inWindow: boolean;
  /** Whether we're within guard_ms of an event boundary (should skip checks). */
  inGuard: boolean;
  /** End time of the track (last event's time). */
  trackEnd: number;
}

/** Pre-start tolerance: allow up to 100ms before first event. */
const PRE_START_TOLERANCE = 0.1;
/** Post-end window: 0.5s after last event is still "in window". */
const POST_END_WINDOW = 0.5;

/**
 * Resolve the current AudioContext time to a timing snapshot against the track.
 *
 * @param now - AudioContext.currentTime
 * @param runStartTime - AudioContext time when playback started
 * @param track - ordered array of track events
 * @param guardMs - milliseconds near event boundaries to mark as guard zone
 */
export function resolveTimingSnapshot(
  now: number,
  runStartTime: number,
  track: TrackEvent[],
  guardMs: number,
): TimingSnapshot {
  const relTime = now - runStartTime;
  const trackEnd = track.length > 0 ? track[track.length - 1].time : 0;

  // Empty track — nothing to resolve
  if (track.length === 0) {
    return {
      relTime,
      event: null,
      eventIndex: -1,
      inWindow: false,
      inGuard: false,
      trackEnd: 0,
    };
  }

  // Find the active event: last event whose time <= relTime
  let eventIndex = -1;
  for (let i = track.length - 1; i >= 0; i--) {
    if (track[i].time <= relTime) {
      eventIndex = i;
      break;
    }
  }

  const event = eventIndex >= 0 ? track[eventIndex] : null;

  // Window: from -PRE_START_TOLERANCE before first event to trackEnd + POST_END_WINDOW
  const inWindow = relTime >= -PRE_START_TOLERANCE && relTime <= trackEnd + POST_END_WINDOW;

  // Guard zone: within guardMs of any event boundary
  const guardSec = guardMs / 1000;
  let inGuard = false;
  for (let i = 0; i < track.length; i++) {
    if (Math.abs(relTime - track[i].time) < guardSec) {
      inGuard = true;
      break;
    }
  }

  return {
    relTime,
    event,
    eventIndex,
    inWindow,
    inGuard,
    trackEnd,
  };
}
