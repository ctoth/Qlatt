import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dump, load } from "js-yaml";
import { expect, it } from "vitest";
import { areaDocumentSchema, generate } from "../scripts/generate-formants-from-area";
import { parseInventorySpec } from "../src/declarative-frontend/inventory";

const sourcePath = "data/area-functions/story-1996.yaml";
const source = readFileSync(sourcePath, "utf8");
const inventory = readFileSync("public/rules/frontends/qlatt-english/inventory.yaml", "utf8");

it("preserves the verified Story table endpoints and P&B column alignment", () => {
  const data = areaDocumentSchema.parse(load(source));
  expect(Object.values(data.vowels).map((v) => v.areas_cm2.length)).toEqual([
    42, 42, 40, 42, 44, 44, 44, 44, 44, 46, 44, 46,
  ]);
  expect(data.vowels.UW.areas_cm2.slice(-2)).toEqual([0.41, 0.86]);
  expect(data.vowels.L.areas_cm2.slice(-2)).toEqual([4.57, 3.7]);
  expect(data.vowels.UH.areas_cm2[27]).toBe(1.79);
  expect(data.vowels.UH.peterson_barney_hz).toEqual([440, 1020, 2240]);
  expect(data.vowels.OW.peterson_barney_hz).toBeNull();
});

it("runs in plain Node and emits all four formants, bandwidths, comparisons and cited metadata", () => {
  const dir = mkdtempSync(join(tmpdir(), "qlatt-area-"));
  try {
    const out = join(dir, "generated.yaml"),
      report = join(dir, "report.md");
    const run = spawnSync(
      process.execPath,
      [
        "--loader",
        "ts-node/esm/transpile-only",
        "--experimental-specifier-resolution=node",
        "scripts/generate-formants-from-area.ts",
        "--out",
        out,
        "--report",
        report,
      ],
      { encoding: "utf8" },
    );
    expect(run.status, run.stderr).toBe(0);
    const result = load(readFileSync(out, "utf8")) as {
      phoneme_targets: Record<string, Record<string, unknown>>;
    };
    expect(Object.keys(result.phoneme_targets)).toHaveLength(12);
    for (const target of Object.values(result.phoneme_targets)) {
      expect(target.derived_from).toBe("area_function");
      for (const key of ["F1", "F2", "F3", "F4", "B1", "B2", "B3", "B4"])
        expect(target[key]).toBeGreaterThan(0);
      expect(Number(target.F4)).toBeGreaterThan(Number(target.F3));
    }
    const parsed = parseInventorySpec(inventory);
    // A generated fragment augments target features; it is not a replacement inventory.
    for (const [key, target] of Object.entries(result.phoneme_targets))
      Object.assign(parsed.phoneme_targets[key], target);
    expect(() => parseInventorySpec(dump(parsed))).not.toThrow();
    const text = readFileSync(report, "utf8");
    expect(readFileSync(out, "utf8")).toBe(
      readFileSync("data/area-functions/story-1996.generated.yaml", "utf8").replace(/\r\n/g, "\n"),
    );
    expect(text).toBe(
      readFileSync("data/area-functions/story-1996.comparison.md", "utf8").replace(/\r\n/g, "\n"),
    );
    expect(text).toContain("ΔP&B");
    expect(text).toContain("| IY (IY1) | 4 |");
    expect(text).toContain("radiation resistance");
    const scaled = generate(source, inventory, sourcePath, {
      tract_length_scale: 0.8,
      pharynx_scale: 0.65,
      mouth_scale: 0.95,
    });
    expect(scaled.inventory).not.toEqual(readFileSync(out, "utf8"));
    expect(scaled.report).toContain('"pharynx_scale":0.65');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 30000);

it("rejects invalid scales and missing geometry instead of silently defaulting", () => {
  expect(() => generate(source, inventory, sourcePath, { pharynx_scale: 0 })).toThrow(/scale/);
  expect(() => generate(source, inventory, sourcePath, { pharynx_sclae: 0.8 })).toThrow(/scale/);
  expect(() =>
    generate(source.replace("areas_cm2: [0.33", "areas_cm2: [0"), inventory, sourcePath),
  ).toThrow();
});
