import { OfflineAudioContext } from "node-web-audio-api";
import { describe, expect, it, vi } from "vitest";
import { createKlattInterpreter, createKlattScheduleCompiler } from "../src/klatt-interpreter";
import type { BindingSpec, KlattRuntime } from "../src/klatt-runtime";
import { createProvenanceCollector } from "../src/provenance";
import type { SemanticsDocument } from "../src/semantics/types";

// Executable examples of docs/host-contract.md section 5.
const bindingMap = new Map<string, BindingSpec[]>([
  ["level", [{ nodeId: "amplitude", paramName: "gain", bindName: "level" }]],
  ["branch", [{ nodeId: "branch", paramName: "gain", bindName: "branch" }]],
]);
const track = [
  { time: 0, params: { level: 0.25, SW: 0 } },
  { time: 0.5, params: { level: 0.75, SW: 1 } },
];
function semantics(defaultScheduling?: "step" | "ramp", override = {}): SemanticsDocument {
  return {
    name: "automation-contract",
    defaultScheduling,
    realize: {
      level: { expr: "level", ...override },
      branch: { expr: "SW == 0 ? 1 : 0", step: true },
    },
  };
}

describe("host-neutral automation contract", () => {
  it.each([
    ["ramp default", "ramp", {}, "ramp"],
    ["step override", "ramp", { step: true }, "step"],
    ["ramp override", "step", { ramp: true }, "ramp"],
    ["step wins", "ramp", { step: true, ramp: true }, "step"],
    ["step default", "step", {}, "step"],
    ["absent default", undefined, {}, "step"],
  ] as const)("%s", (_name, defaultScheduling, override, mode) => {
    const provenance = createProvenanceCollector();
    const compiler = createKlattScheduleCompiler({
      provenance,
      semantics: semantics(defaultScheduling, override),
      bindingMap,
      sampleRate: 8000,
    });
    expect(compiler.compileSchedule(track, 1)).toEqual([
      { time: 1, target: { nodeId: "amplitude", paramName: "gain" }, value: 0.25, mode: "step" },
      { time: 1, target: { nodeId: "branch", paramName: "gain" }, value: 1, mode: "step" },
      { time: 1.5, target: { nodeId: "amplitude", paramName: "gain" }, value: 0.75, mode },
      { time: 1.5, target: { nodeId: "branch", paramName: "gain" }, value: 0, mode: "step" },
    ]);
    const decisions = provenance.getDecisions();
    expect(decisions).toHaveLength(4);
    const selection =
      "step" in override && override.step
        ? "realize rule step: true"
        : "ramp" in override && override.ramp
          ? "realize rule ramp: true"
          : `defaultScheduling: ${defaultScheduling ?? "absent (step)"}`;
    expect(decisions[0].reason).toContain(
      `compiled schedule time 1s: step selected by ${mode === "ramp" ? "first-frame anchor" : selection}`,
    );
    expect(decisions[1].reason).toContain("step selected by realize rule step: true");
    expect(decisions[2].reason).toContain(
      `compiled schedule time 1.5s: ${mode} selected by ${selection}`,
    );
    expect(decisions[3].reason).toContain("step selected by realize rule step: true");
    for (const decision of decisions) {
      expect(decision.stage).toBe("interpreter");
      expect(decision.type).toBe("schedule_mode_selected");
      expect(decision.citations).toContain(
        "docs/host-contract.md section 5 (automation mode selection and first-frame anchor)",
      );
      expect(decision.timestampMs).toBeUndefined();
      expect(decision.reason).toContain("not playback time");
    }
  });

  it("preserves passthrough fan-out and repeated compilation without host state", () => {
    const provenance = createProvenanceCollector();
    const compiler = createKlattScheduleCompiler({
      provenance,
      semantics: { name: "passthrough", defaultScheduling: "ramp" },
      sampleRate: 8000,
      bindingMap: new Map([
        [
          "level",
          [
            { nodeId: "a", paramName: "gain", bindName: "level" },
            { nodeId: "b", paramName: "gain", bindName: "level" },
          ],
        ],
      ]),
    });
    const schedule = compiler.compileSchedule(track);
    expect(schedule).toEqual([
      { time: 0, target: { nodeId: "a", paramName: "gain" }, value: 0.25, mode: "step" },
      { time: 0, target: { nodeId: "b", paramName: "gain" }, value: 0.25, mode: "step" },
      { time: 0.5, target: { nodeId: "a", paramName: "gain" }, value: 0.75, mode: "ramp" },
      { time: 0.5, target: { nodeId: "b", paramName: "gain" }, value: 0.75, mode: "ramp" },
    ]);
    expect(JSON.parse(JSON.stringify(schedule))).toEqual(schedule);
    expect(compiler.compileSchedule(track)).toEqual(schedule);
    expect(provenance.getDecisions()).toHaveLength(8);
    expect(provenance.getDecisions()[0]).toMatchObject({ subject: "binding:a.gain" });
    expect(provenance.getDecisions()[1]).toMatchObject({ subject: "binding:b.gain" });
    expect(provenance.getDecisions()[0].reason).toContain("level (passthrough)");
    expect(compiler.compileSchedule([])).toEqual([]);
    expect(compiler.compileSchedule([{ time: 0, params: { level: Number.NaN } }])).toEqual([]);
    expect(provenance.getDecisions()).toHaveLength(8);
    expect(() => compiler.compileSchedule([...track].reverse())).toThrow("Invalid track timing");
  });

  it("applies the same schedule to real Node AudioParams and renders ramp/step values", async () => {
    const ctx = new OfflineAudioContext(2, 8000, 8000);
    const amplitude = ctx.createGain();
    const branch = ctx.createGain();
    const source = ctx.createConstantSource();
    const merger = ctx.createChannelMerger(2);
    source.offset.value = 1;
    source.connect(amplitude);
    source.connect(branch);
    amplitude.connect(merger, 0, 0);
    branch.connect(merger, 0, 1);
    merger.connect(ctx.destination);
    source.start();
    const nodes = new Map([
      ["amplitude", amplitude],
      ["branch", branch],
    ]);
    const calls: unknown[] = [];
    for (const [nodeId, node] of nodes) {
      for (const [method, mode] of [
        ["setValueAtTime", "step"],
        ["linearRampToValueAtTime", "ramp"],
      ] as const) {
        const original = node.gain[method].bind(node.gain);
        vi.spyOn(node.gain, method).mockImplementation((value, time) => {
          calls.push({ time, target: { nodeId, paramName: "gain" }, value, mode });
          return original(value, time);
        });
      }
    }
    const doc = semantics("ramp");
    const expected = createKlattScheduleCompiler({
      semantics: doc,
      bindingMap,
      sampleRate: 8000,
    }).compileSchedule(track, 0.125);
    const provenance = createProvenanceCollector();
    const interpreter = createKlattInterpreter({
      provenance,
      audioContext: ctx as unknown as AudioContext,
      runtime: {
        getNode: (id: string) => nodes.get(id),
        getBindingMap: () => bindingMap,
      } as unknown as KlattRuntime,
      semantics: doc,
    });
    const prepared = interpreter.prepareTrack(track);
    interpreter.schedulePrepared(prepared, 0.125);
    expect(calls).toEqual(expected);
    const decisions = provenance.getDecisions();
    const resolved = decisions.filter((decision) => decision.type === "binding_resolved");
    expect(resolved.map((decision) => decision.subject)).toEqual([
      "binding:amplitude.gain",
      "binding:branch.gain",
    ]);
    expect(resolved[0].reason).toContain("level resolved to available AudioParam amplitude.gain");
    expect(resolved[0].timestampMs).toBeUndefined();
    const modes = decisions.filter((decision) => decision.type === "schedule_mode_selected");
    expect(modes).toHaveLength(4);
    expect(modes[0].reason).toContain("compiled schedule time 0s");
    expect(modes[0].timestampMs).toBeUndefined();
    const buffer = await ctx.startRendering();
    expect(buffer.getChannelData(0)[1000]).toBeCloseTo(0.25, 5);
    expect(buffer.getChannelData(0)[3000]).toBeCloseTo(0.5, 5);
    expect(buffer.getChannelData(0)[5000]).toBeCloseTo(0.75, 5);
    expect(buffer.getChannelData(1)[4999]).toBe(1);
    expect(buffer.getChannelData(1)[5000]).toBe(0);
  });
});
