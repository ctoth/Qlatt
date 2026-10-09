/**
 * Run boundaries on the page's Speak path (src/track-playback.ts).
 *
 * The first tests check the order of `playTrack`'s steps with stand-ins. The
 * others put the real interpreter and the real dectalk-vtm node behind it, in
 * an offline context. Every Speak and Stop is scheduled before the render
 * starts, each finding what a page's held context shows it: the clock at the
 * time of the press and the parameters at the values the playing track gives
 * them then. The fixtures supply the WAV the stock say.exe wrote.
 */

import path from "node:path";
import { AudioWorkletNode as NodeAudioWorkletNode, OfflineAudioContext } from "node-web-audio-api";
import { describe, expect, it } from "vitest";
import { readVtmFixture } from "../scripts/oracle/dectalk-vtm-fixture";
import { packetCount } from "../scripts/rendering/dectalk-vtm-render";
import { FRAME_SAMPLES } from "../src/dectalk-vtm-track";
import { createDiagnostics } from "../src/diagnostics";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import {
  createKlattInterpreter,
  type KlattFrame,
  type PreparedTrack,
} from "../src/klatt-interpreter";
import { createKlattRuntime } from "../src/klatt-runtime";
import { createNodeRuntimeAssetLoader } from "../src/runtime-assets/node-loader";
import {
  endPlayback,
  PLAYBACK_LEAD_SEC,
  type PlaybackGate,
  type PlaybackInterpreter,
  playTrack,
} from "../src/track-playback";
import { textToKlattTrack } from "../src/tts-frontend";

const fixtureDir = path.join("crates", "dectalk-vtm", "tests", "fixtures");
const FRONTEND = "dectalk-english";
const RATE = 11025;

describe("playTrack", () => {
  const stage = (calls: string[], failAt?: string) => {
    const clock = { currentTime: 3 };
    const prepared: PreparedTrack = {
      frames: 1,
      baseTime: 0,
      schedule: [],
      duration: 0,
      telemetry: [],
    };
    const gate: PlaybackGate = {
      hold: async () => {
        calls.push("hold");
        // The context's clock stops where it is when it is held.
        clock.currentTime = 3.5;
      },
      release: async () => {
        calls.push("release");
      },
    };
    const interpreter: PlaybackInterpreter = {
      prepareTrack: () => {
        calls.push("prepare");
        return prepared;
      },
      endTrack: () => {
        calls.push("end");
      },
      schedulePrepared: (given, startTime) => {
        if (failAt === "schedule") throw new Error("refused");
        calls.push(`schedule ${given === prepared ? "prepared" : "other"} at ${startTime}`);
      },
    };
    return { clock, gate, interpreter };
  };

  it("compiles, holds, ends what plays, then schedules a lead after the held time", async () => {
    const calls: string[] = [];
    const startTime = await playTrack({
      ...stage(calls),
      track: [],
      beforeSchedule: (time) => calls.push(`before ${time}`),
    });
    expect(startTime).toBe(3.5 + PLAYBACK_LEAD_SEC);
    expect(calls).toEqual([
      "prepare",
      "hold",
      "end",
      `before ${startTime}`,
      `schedule prepared at ${startTime}`,
      "release",
    ]);
  });

  it("lets the context run again when scheduling throws", async () => {
    const calls: string[] = [];
    await expect(playTrack({ ...stage(calls, "schedule"), track: [] })).rejects.toThrow("refused");
    expect(calls).toEqual(["prepare", "hold", "end", "release"]);
  });
});

describe("runs of the dectalk-vtm node on the Speak path", () => {
  const speak = (text: string): KlattFrame[] =>
    textToKlattTrack(text, undefined, 30, { frontendId: FRONTEND, rate: 1, speaker: "paul" });

  /** What the node says about a run when it starts or ends. */
  type Report = Record<string, number>;
  type Press = (
    clock: { readonly currentTime: number },
    interpreter: ReturnType<typeof createKlattInterpreter>,
  ) => Promise<void>;

  /**
   * Make each of a node's parameters report, as its `value`, the value its
   * automation has at the clock's time: what a context that is held at that
   * time reports. Before an offline render a parameter's `value` is its
   * default whatever is scheduled, and ending a track holds each parameter
   * at its `value`. The tracks of this node only step; a ramp is refused.
   */
  function reportScheduledValues(node: AudioNode, clock: { readonly currentTime: number }): void {
    const parameters = (node as AudioWorkletNode).parameters as unknown as Map<string, AudioParam>;
    parameters.forEach((param) => {
      const events: { time: number; value: number }[] = [];
      const initial = param.value;
      const set = param.setValueAtTime.bind(param);
      const cancel = param.cancelScheduledValues.bind(param);
      param.setValueAtTime = (value: number, time: number) => {
        events.push({ time, value });
        return set(value, time);
      };
      param.cancelScheduledValues = (time: number) => {
        for (let index = events.length - 1; index >= 0; index -= 1) {
          if ((events[index] as { time: number }).time >= time) events.splice(index, 1);
        }
        return cancel(time);
      };
      param.linearRampToValueAtTime = () => {
        throw new Error("the test's parameters do not model a ramp");
      };
      Object.defineProperty(param, "value", {
        configurable: true,
        get: () => {
          // The latest event at or before now; of two at one time, the later written.
          let value = initial;
          let at = Number.NEGATIVE_INFINITY;
          for (const event of events) {
            if (event.time <= clock.currentTime && event.time >= at) {
              value = event.value;
              at = event.time;
            }
          }
          return value;
        },
      });
    });
  }

  /**
   * Render `seconds`. Everything is scheduled before the render starts:
   * `first` is pressed at time 0 and each of `later` with the clock set to
   * its time, which is what a page's context reads when it is held there.
   * (The audio library's own OfflineAudioContext.suspend is not used: it
   * registers a suspension on another thread, and panics if startRendering
   * gets there first.)
   */
  async function render(seconds: number, first: Press, later: { at: number; press: Press }[]) {
    const config = structuredClone(await loadExperimentConfig("dectalk-vtm", FRONTEND));
    const assetLoader = await createNodeRuntimeAssetLoader(
      path.join(process.cwd(), "public", "worklets"),
    );
    const diagnostics = createDiagnostics({ maxEntries: 1000 });
    try {
      const ctx = new OfflineAudioContext(1, Math.ceil(seconds * RATE), RATE);
      const runtime = await createKlattRuntime({
        diagnostics,
        audioContext: ctx as unknown as AudioContext,
        graph: config.graph,
        semantics: config.semantics,
        registry: config.registry,
        assetLoader,
        audioWorkletNodeCtor: NodeAudioWorkletNode as unknown as typeof AudioWorkletNode,
      });
      runtime.connectToDestination();
      try {
        // The interpreter reads the time from a clock the test sets.
        const clock = { currentTime: 0, sampleRate: RATE };
        const nodes = config.graph.nodes as unknown;
        const nodeIds = Array.isArray(nodes)
          ? nodes.map((node) => String((node as { id: unknown }).id))
          : Object.keys(nodes as object);
        let shimmed = 0;
        for (const id of nodeIds) {
          const node = runtime.getNode(id);
          if (node && "parameters" in node) {
            reportScheduledValues(node, clock);
            shimmed += 1;
          }
        }
        expect(shimmed).toBeGreaterThan(0);
        const interpreter = createKlattInterpreter({
          audioContext: clock as unknown as AudioContext,
          runtime,
          semantics: config.semantics,
          bindingMap: runtime.getBindingMap(),
        });
        await first(clock, interpreter);
        for (const { at, press } of later) {
          expect(at).toBeGreaterThan(clock.currentTime);
          clock.currentTime = at;
          await press(clock, interpreter);
        }
        const buffer = await ctx.startRendering();
        const samples = new Float32Array(buffer.length);
        buffer.copyFromChannel(samples, 0);
        // Worklet messages are delivered on a later turn of the event loop.
        await new Promise((resolve) => setTimeout(resolve, 0));
        const entries = diagnostics.getEntries();
        const data = (code: string) =>
          entries
            .filter((entry) => entry.code === code)
            .map((entry) => entry.data as Record<string, number>);
        return {
          samples,
          problems: entries.filter((entry) => entry.level !== "info"),
          started: data("dectalk-vtm.run_started"),
          ended: data("dectalk-vtm.run_ended"),
        };
      } finally {
        runtime.disconnect();
      }
    } finally {
      await assetLoader.dispose?.();
    }
  }

  /** DECtalk samples of `oracle`, up to `count`, that the run's output does not equal. */
  function differing(
    samples: Float32Array,
    run: Record<string, number>,
    oracle: Int16Array,
    count: number,
  ): number {
    let wrong = 0;
    for (let i = 0; i < count; i += 1) {
      if ((samples[run.startFrame + run.delaySamples + i] as number) * 32768 !== oracle[i]) {
        wrong += 1;
      }
    }
    return wrong;
  }

  const gate: PlaybackGate = { hold: async () => {}, release: async () => {} };
  const moon = readVtmFixture(fixtureDir, "paul-moon").samples;
  const cat = readVtmFixture(fixtureDir, "paul-cat").samples;

  it("Speak during speech ends the run and starts another from the node's start-up state", async () => {
    const first = speak("moon.");
    const second = speak("cat.");
    const starts: number[] = [];
    let pressedAt = Number.NaN;
    const result = await render(
      1.6,
      async (clock, interpreter) => {
        starts.push(await playTrack({ clock, gate, interpreter, track: first }));
      },
      [
        {
          at: 0.3,
          press: async (clock, interpreter) => {
            pressedAt = clock.currentTime;
            starts.push(await playTrack({ clock, gate, interpreter, track: second }));
          },
        },
      ],
    );
    expect(result.problems).toEqual([]);
    expect(pressedAt).toBeGreaterThanOrEqual(0.3);
    expect(starts).toEqual([PLAYBACK_LEAD_SEC, pressedAt + PLAYBACK_LEAD_SEC]);
    expect(result.started).toHaveLength(2);
    expect(result.ended).toHaveLength(2);
    const [firstRun, secondRun] = result.started as [Report, Report];
    const [firstEnd, secondEnd] = result.ended as [Report, Report];
    // The first run ends at the first frame after the second Speak, not at its own end.
    expect(firstEnd.frames).toBeGreaterThan(0);
    expect(firstEnd.frames).toBeLessThan(packetCount(first));
    expect(firstRun.startFrame + firstEnd.frames * FRAME_SAMPLES).toBeLessThanOrEqual(
      Math.ceil(pressedAt * RATE) + FRAME_SAMPLES,
    );
    expect(secondRun.startFrame).toBeGreaterThanOrEqual(
      firstRun.startFrame + firstEnd.frames * FRAME_SAMPLES,
    );
    // It is DECtalk's up to there, and the second is DECtalk's whole text.
    expect(differing(result.samples, firstRun, moon, firstEnd.frames * FRAME_SAMPLES)).toBe(0);
    expect(secondEnd.frames).toBe(packetCount(second));
    expect(secondEnd.frames * FRAME_SAMPLES).toBe(cat.length);
    expect(differing(result.samples, secondRun, cat, cat.length)).toBe(0);
  }, 30000);

  it("Stop ends the run, and the Speak after it is a run of its own", async () => {
    const first = speak("moon.");
    const second = speak("cat.");
    let stoppedAt = Number.NaN;
    const result = await render(
      1.8,
      async (clock, interpreter) => {
        await playTrack({ clock, gate, interpreter, track: first });
      },
      [
        {
          at: 0.3,
          press: async (clock, interpreter) => {
            stoppedAt = clock.currentTime;
            endPlayback(interpreter);
          },
        },
        {
          at: 0.5,
          press: async (clock, interpreter) => {
            await playTrack({ clock, gate, interpreter, track: second });
          },
        },
      ],
    );
    expect(result.problems).toEqual([]);
    expect(result.started).toHaveLength(2);
    expect(result.ended).toHaveLength(2);
    const [firstRun, secondRun] = result.started as [Report, Report];
    const [firstEnd, secondEnd] = result.ended as [Report, Report];
    expect(firstEnd.frames).toBeGreaterThan(0);
    const stopped = firstRun.startFrame + firstEnd.frames * FRAME_SAMPLES;
    expect(firstEnd.frames).toBeLessThan(packetCount(first));
    expect(stopped).toBeLessThanOrEqual(Math.ceil(stoppedAt * RATE) + FRAME_SAMPLES);
    expect(differing(result.samples, firstRun, moon, firstEnd.frames * FRAME_SAMPLES)).toBe(0);
    // Nothing is heard between the end of the stopped run and the next one.
    const quietFrom = stopped + firstRun.delaySamples;
    const quietTo = secondRun.startFrame + secondRun.delaySamples;
    expect(quietTo).toBeGreaterThan(quietFrom);
    expect(result.samples.slice(quietFrom, quietTo).every((sample) => sample === 0)).toBe(true);
    expect(secondEnd.frames * FRAME_SAMPLES).toBe(cat.length);
    expect(differing(result.samples, secondRun, cat, cat.length)).toBe(0);
  }, 30000);
});
