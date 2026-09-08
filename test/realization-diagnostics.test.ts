import { describe, expect, it, vi } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import { createKlattInterpreter, type KlattFrame } from "../src/klatt-interpreter";
import { createKlattRuntime } from "../src/klatt-runtime";
import type { SemanticsDocument } from "../src/semantics/types";

async function fixture(semantics: SemanticsDocument) {
  const diagnostics = createDiagnostics();
  const gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
  gain.setValueAtTime.mockImplementation((value: number) => {
    gain.value = value;
  });
  const audioContext = {
    currentTime: 0,
    sampleRate: 44100,
    createGain: () => ({ gain, connect: vi.fn(), disconnect: vi.fn() }),
  } as unknown as AudioContext;
  const runtime = await createKlattRuntime({
    audioContext,
    diagnostics,
    semantics,
    registry: { primitives: { gain: { native: "GainNode" } } },
    graph: { bacon: "0.1", nodes: { out: { type: "gain", params: { gain: { bind: "volume" } } } } },
  });
  const interpreter = createKlattInterpreter({ audioContext, runtime, semantics });
  gain.setValueAtTime.mockClear();
  return { diagnostics, gain, runtime, interpreter };
}

describe("realization degradation", () => {
  it("applies successful realization in both consumers without warnings", async () => {
    const { runtime, interpreter, gain, diagnostics } = await fixture({
      name: "test",
      params: { input: { default: 0.5 } },
      realize: { volume: "input * 2" },
    });
    expect(gain.value).toBe(1);
    runtime.setInputs({ input: 0.25 });
    expect(gain.value).toBe(0.5);
    gain.setValueAtTime.mockClear();
    interpreter.scheduleTrack([{ time: 0, params: { input: 0.125 } }], 2);
    expect(gain.setValueAtTime).toHaveBeenCalledWith(0.25, 2);
    expect(diagnostics.getEntries()).toEqual([]);
  });

  it("retains a previous successful runtime value when an update cannot realize it", async () => {
    const { runtime, gain, diagnostics } = await fixture({
      name: "test",
      params: { input: { default: 0.5 } },
      realize: { volume: "input * 2" },
    });
    runtime.setInputs({ input: 0.25 });
    runtime.setInputs({ input: "invalid" });
    expect(gain.value).toBe(0.5);
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "runtime.realization_failed",
        data: expect.objectContaining({
          affected: [
            expect.objectContaining({
              last: expect.objectContaining({
                appliedValue: 0.5,
                outcome: "previous/default value retained",
              }),
            }),
          ],
        }),
      }),
    );
  });

  it.each(["'invalid'", "0 / 0"])("omits a nonnumeric realized write from %s", async (expr) => {
    const { interpreter, diagnostics, gain } = await fixture({
      name: "test",
      params: {},
      realize: { volume: expr },
    });
    diagnostics.clear();
    interpreter.scheduleTrack([{ time: 0, params: {} }], 2);
    expect(gain.setValueAtTime).not.toHaveBeenCalled();
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({ code: "interpreter.compilation_omissions" }),
    );
  });

  it.each([NaN, Infinity, -1])("rejects invalid start time %s", async (start) => {
    const { interpreter, gain } = await fixture({ name: "test", params: {} });
    expect(() => interpreter.scheduleTrack([{ time: 0, params: { volume: 0.25 } }], start)).toThrow(
      /timing/i,
    );
    expect(gain.setValueAtTime).not.toHaveBeenCalled();
  });

  it("rejects backwards interior timing and accepts equal-time markers", async () => {
    const { interpreter, gain } = await fixture({ name: "test", params: {} });
    expect(() =>
      interpreter.scheduleTrack(
        [
          { time: 1, params: {} },
          { time: 0, params: {} },
          { time: 2, params: {} },
        ],
        0,
      ),
    ).toThrow(/timing/i);
    expect(gain.setValueAtTime).not.toHaveBeenCalled();
    interpreter.scheduleTrack(
      [
        { time: 0, params: {} },
        { time: 0, params: { volume: 0.25 } },
      ],
      2,
    );
    expect(gain.setValueAtTime).toHaveBeenCalledWith(0.25, 2);
  });
  it("reports seeded and input fallthrough at initialization and updates with bounded counts", async () => {
    const { runtime, gain, diagnostics } = await fixture({
      name: "test",
      params: { volume: { default: 0.5 } },
      realize: { volume: "missing()" },
    });
    expect(gain.value).toBe(0.5);
    for (let i = 0; i < 300; i++) runtime.setInputs({ volume: 0.25 });
    expect(gain.value).toBe(0.25);
    const entries = diagnostics.getEntries().filter((e) => e.code === "runtime.realization_failed");
    expect(entries).toHaveLength(1);
    expect(entries[0].data).toMatchObject({
      count: 301,
      affected: [
        expect.objectContaining({
          rule: "volume",
          error: expect.any(String),
          nodeId: "out",
          paramName: "gain",
          count: 301,
          last: expect.objectContaining({
            appliedValue: 0.25,
            outcome: "seeded/input value applied",
          }),
        }),
      ],
    });
  });

  it("reports retained runtime values and omitted interpreter writes without inventing defaults", async () => {
    const { runtime, interpreter, gain, diagnostics } = await fixture({
      name: "test",
      params: {},
      realize: { volume: "missing()" },
    });
    expect(gain.value).toBe(1);
    interpreter.scheduleTrack(
      [
        { time: 0, params: {} },
        { time: 1, params: {} },
      ],
      2,
    );
    expect(gain.setValueAtTime).not.toHaveBeenCalled();
    expect(runtime.getRealizedValues().volume).toBeUndefined();
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "runtime.realization_failed",
        data: expect.objectContaining({
          affected: [
            expect.objectContaining({
              last: expect.objectContaining({
                appliedValue: 1,
                outcome: "previous/default value retained",
              }),
            }),
          ],
        }),
      }),
    );
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "interpreter.compilation_omissions",
        data: expect.objectContaining({
          affected: [
            expect.objectContaining({
              rule: "volume",
              count: 2,
              last: expect.objectContaining({ frameIndex: 1, time: 3, outcome: "write omitted" }),
            }),
          ],
        }),
      }),
    );
  });

  it("schedules the actual seeded/input fallback and bounds repeated frame reports", async () => {
    const { interpreter, gain, diagnostics } = await fixture({
      name: "test",
      params: { volume: { default: 0.5 } },
      realize: { volume: "missing()" },
    });
    diagnostics.clear();
    interpreter.scheduleTrack(
      Array.from(
        { length: 300 },
        (_, i): KlattFrame => ({ time: i / 100, params: i ? {} : { volume: 0.25 } }),
      ),
      2,
    );
    expect(gain.setValueAtTime).toHaveBeenNthCalledWith(1, 0.25, 2);
    expect(gain.setValueAtTime).toHaveBeenLastCalledWith(0.5, 4.99);
    expect(diagnostics.getEntries()).toHaveLength(1);
    expect(diagnostics.getEntries()[0].data).toMatchObject({ count: 300 });
  });

  it("preserves sparse passthrough frames and warns only on supplied invalid values", async () => {
    const { interpreter, gain, diagnostics } = await fixture({
      name: "test",
      params: { volume: { default: 0.5 } },
    });
    interpreter.scheduleTrack(
      [
        { time: 0, params: { volume: 0.25 } },
        { time: 1, params: {} },
      ],
      2,
    );
    expect(gain.setValueAtTime).toHaveBeenCalledTimes(1);
    expect(diagnostics.getEntries()).toEqual([]);
    interpreter.scheduleTrack([{ time: 0, params: { volume: NaN } }], 3);
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({ code: "interpreter.compilation_omissions" }),
    );
    expect(gain.setValueAtTime).not.toHaveBeenCalledWith(NaN, 3);
  });

  it("reports malformed parameter frames while retaining valid final timing", async () => {
    const { interpreter, diagnostics, gain } = await fixture({ name: "test", params: {} });
    diagnostics.clear();
    interpreter.scheduleTrack(
      [
        { time: 0, params: { volume: 0.25 } },
        { time: 1, params: null },
      ] as unknown as KlattFrame[],
      2,
    );
    expect(interpreter.getTrackDuration()).toBe(1);
    expect(gain.setValueAtTime).toHaveBeenCalledWith(0.25, 2);
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "interpreter.compilation_omissions",
        data: expect.objectContaining({
          affected: [
            expect.objectContaining({
              last: expect.objectContaining({ frameIndex: 1, outcome: "frame omitted" }),
            }),
          ],
        }),
      }),
    );
  });

  it.each([
    undefined,
    { time: NaN, params: {} },
    { time: -1, params: {} },
    { time: Infinity, params: {} },
  ])("rejects invalid final timing before cancelling the existing schedule: %s", async (final) => {
    const { interpreter, gain, diagnostics } = await fixture({ name: "test", params: {} });
    interpreter.scheduleTrack(
      [
        { time: 0, params: { volume: 0.25 } },
        { time: 1, params: {} },
      ],
      2,
    );
    expect(() =>
      interpreter.scheduleTrack([{ time: 0, params: {} }, final] as KlattFrame[], 3),
    ).toThrow(/timing/i);
    expect(gain.cancelScheduledValues).not.toHaveBeenCalled();
    expect(interpreter.getTrackDuration()).toBe(1);
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({ code: "interpreter.invalid_timing", level: "error" }),
    );
  });
});
