import { expect, it, type MockInstance, vi } from "vitest";
import { nodeRuntimeBackend } from "../scripts/rendering/backends/node-runtime";
import { getAudioParam } from "../src/audio-param-utils";
import * as interpreterModule from "../src/klatt-interpreter";

it("the Node render backend writes exactly the host-neutral schedule", async () => {
  const createInterpreter = interpreterModule.createKlattInterpreter;
  let compared = false;
  const factory = vi
    .spyOn(interpreterModule, "createKlattInterpreter")
    .mockImplementation((options) => {
      const bindings = options.bindingMap ?? options.runtime.getBindingMap();
      const compiler = interpreterModule.createKlattScheduleCompiler({
        semantics: options.semantics,
        bindingMap: bindings,
        sampleRate: options.audioContext.sampleRate,
      });
      const interpreter = createInterpreter(options);
      const calls: interpreterModule.ScheduleEntry[] = [];
      const spies: MockInstance[] = [];
      const seen = new Set<AudioParam>();
      for (const targets of bindings.values()) {
        for (const { nodeId, paramName } of targets) {
          const param = getAudioParam(options.runtime.getNode(nodeId)!, paramName)!;
          expect(param).toBeTruthy();
          if (seen.has(param)) continue;
          seen.add(param);
          for (const [method, mode] of [
            ["setValueAtTime", "step"],
            ["linearRampToValueAtTime", "ramp"],
          ] as const) {
            const original = param[method].bind(param);
            spies.push(
              vi.spyOn(param, method).mockImplementation((value, time) => {
                calls.push({ time, target: { nodeId, paramName }, value, mode });
                return original(value, time);
              }),
            );
          }
        }
      }
      return {
        ...interpreter,
        scheduleTrack(track, startTime) {
          try {
            const expected = compiler.compileSchedule(track, startTime);
            expect(expected.some((event) => event.mode === "ramp")).toBe(true);
            expect(expected.some((event) => event.mode === "step")).toBe(true);
            interpreter.scheduleTrack(track, startTime);
            expect(calls).toEqual(expected);
            compared = true;
          } finally {
            for (const spy of spies) spy.mockRestore();
          }
        },
      };
    });
  try {
    const result = await nodeRuntimeBackend.render({
      repoRoot: process.cwd(),
      phrase: "See me.",
      frontendId: "qlatt-english",
      experimentId: "klatt80-baseline",
      engine: "runtime",
      rate: 1,
      transitionMs: 30,
      sampleRate: 22050,
      leadTime: 0.05,
      tailTime: 0.1,
      includeTrack: false,
      noiseSeed: 87,
      persistWav: false,
      allowBrowserRender: false,
      renderHost: "node",
    });
    expect(compared).toBe(true);
    expect(result.metrics.rms).toBeGreaterThan(0);
  } finally {
    factory.mockRestore();
  }
}, 30000);
