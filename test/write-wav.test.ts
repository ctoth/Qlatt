import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import { toInt16, writeWav } from "../src/rendering/write-wav";

const directories: string[] = [];
const originalArgv = process.argv;
const originalExitCode = process.exitCode;
function outputPath() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "qlatt-pcm-"));
  directories.push(directory);
  return path.join(directory, "render.wav");
}
afterEach(() => {
  process.argv = originalArgv;
  process.exitCode = originalExitCode;
  vi.doUnmock("../src/rendering/select-backend.ts");
  vi.resetModules();
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true });
});

it("preserves PCM mapping and does not count exact full-scale endpoints as clipping", () => {
  const samples = [-1, -0.5, 0, 0.5, 1];
  expect([...toInt16(samples)]).toEqual([-32767, -16383, 0, 16384, 32767]);
  const diagnostics = createDiagnostics();
  const wav = outputPath();
  expect(writeWav(wav, samples, 22050, diagnostics)).toEqual({
    finitePeak: 1,
    clippedSamples: 0,
    invalidSamples: 0,
  });
  expect(diagnostics.getEntries()).toEqual([]);
  expect(fs.readFileSync(wav).readInt16LE(44)).toBe(-32767);
});

it("reports the original finite peak and both signs of clipping once", () => {
  const wav = outputPath();
  const diagnostics = createDiagnostics();
  const stats = writeWav(wav, [1.2, -2.5, 1, -1, 0], 22050, diagnostics);
  expect(stats).toEqual({ finitePeak: 2.5, clippedSamples: 2, invalidSamples: 0 });
  const bytes = fs.readFileSync(wav);
  expect([bytes.readInt16LE(44), bytes.readInt16LE(46)]).toEqual([32767, -32767]);
  expect(diagnostics.getEntries()).toEqual([
    expect.objectContaining({ level: "warn", code: "W_PCM_CLIPPING", data: { path: wav, ...stats } }),
  ]);
});

it("rejects all nonfinite samples separately from finite clipping before writing", () => {
  const wav = outputPath();
  const samples = [NaN, Infinity, -Infinity, 2, -3];
  const diagnostics = createDiagnostics();
  expect(() => writeWav(wav, samples, 22050, diagnostics)).toThrow(
    "3 nonfinite samples (2 finite clipped samples)",
  );
  expect(fs.existsSync(wav)).toBe(false);
  expect(() => toInt16(samples)).toThrow("E_PCM_NONFINITE");
  expect(diagnostics.getEntries()).toEqual([
    expect.objectContaining({
      level: "error",
      code: "E_PCM_NONFINITE",
      data: { path: wav, finitePeak: 3, clippedSamples: 2, invalidSamples: 3 },
    }),
  ]);
});

async function renderReport(samples: number[], wav: string, encode = true) {
  vi.resetModules();
  vi.doMock("../src/rendering/select-backend.ts", () => ({
    selectRenderBackend: () => ({
      render: async () => ({ samples, sampleRate: 22050, diagnostics: [{ code: "EXISTING" }] }),
    }),
  }));
  process.argv = ["node", "render-phrase.ts", "--out-json", `${wav}.json`, "--compare-golden", "0"];
  if (encode) process.argv.push("--out-wav", wav);
  await import("../scripts/render-phrase.ts");
  return JSON.parse(fs.readFileSync(`${wav}.json`, "utf8"));
}

it("persists encoding evidence and one clipping diagnostic with existing diagnostics", async () => {
  const wav = outputPath();
  const report = await renderReport([0, 1.5, -2], wav);
  expect(report.wavEncoding).toEqual({ path: wav, finitePeak: 2, clippedSamples: 2, invalidSamples: 0 });
  expect(report.diagnostics).toEqual([
    { code: "EXISTING" },
    expect.objectContaining({ code: "W_PCM_CLIPPING", data: report.wavEncoding }),
  ]);
});

it("does not publish a success report or WAV after invalid encoding", async () => {
  const wav = outputPath();
  await expect(renderReport([NaN, 2], wav)).rejects.toThrow("E_PCM_NONFINITE");
  expect(fs.existsSync(`${wav}.json`)).toBe(false);
  expect(fs.existsSync(wav)).toBe(false);
});

it("does not claim encoding clearance when only JSON is requested", async () => {
  const wav = outputPath();
  const report = await renderReport([2], wav, false);
  expect(report.wavEncoding).toBeUndefined();
  expect(report.diagnostics).toEqual([{ code: "EXISTING" }]);
  expect(fs.existsSync(wav)).toBe(false);
});
