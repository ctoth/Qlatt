import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const YAML_LOADER_MODULE = "../src/yaml-loader";

describe("standalone Klatt conversion constants", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock(YAML_LOADER_MODULE);
  });

  it("imports and converts without loading any experiment", async () => {
    const loadYamlDocumentSync = vi.fn(() => {
      throw new Error("Experiment I/O is forbidden");
    });
    vi.doMock(YAML_LOADER_MODULE, () => ({
      loadYamlDocumentSync,
    }));

    const { dbToLinear, dbToLinearKlsyn, proximity } = await import("../src/builtin-functions");

    expect(dbToLinear(-72)).toBe(0);
    expect(dbToLinear(6)).toBe(2);
    expect(dbToLinear(99)).toBe(65536);
    expect(dbToLinearKlsyn(13)).toBe(0.006);
    expect(proximity(50)).toBe(10);
    expect(proximity(100)).toBe(9);
    expect(proximity(549)).toBe(1);
    expect(proximity(550)).toBe(0);
    expect(loadYamlDocumentSync).not.toHaveBeenCalled();
  });

  it("preserves every amplitude entry from the baseline experiment", async () => {
    const { readFileSync } = await import("node:fs");
    const { load } = await import("js-yaml");
    const { constants } = load(
      readFileSync("public/experiments/klatt80-baseline/semantics.yaml", "utf8"),
    ) as {
      constants: {
        ndbCor: number[];
        ndbScale: Record<string, number>;
        klsynAmpTable: number[];
        ndbCorMinHz: number;
        ndbCorMaxHz: number;
        ndbCorBinHz: number;
        klsynAmpScale: number;
        dbFloorDb: number;
        dbCeilingDb: number;
        dbPerDoubling: number;
      };
    };
    const builtins = await import("../src/builtin-functions");

    expect(builtins.ndbCor).toEqual(constants.ndbCor);
    expect(builtins.ndbScale).toEqual(constants.ndbScale);
    expect(builtins.klsynAmpTable).toEqual(constants.klsynAmpTable);
    for (let db = constants.dbFloorDb; db <= constants.dbCeilingDb; db += 0.5) {
      const expected = db <= constants.dbFloorDb ? 0 : 2 ** (db / constants.dbPerDoubling);
      expect(builtins.dbToLinear(db)).toBe(expected);
    }
    for (const [db, amplitude] of constants.klsynAmpTable.entries()) {
      expect(builtins.dbToLinearKlsyn(db)).toBe(amplitude * constants.klsynAmpScale);
    }
    for (let hz = constants.ndbCorMinHz; hz < constants.ndbCorMaxHz; hz += 1) {
      const bin = Math.floor((hz - constants.ndbCorMinHz) / constants.ndbCorBinHz);
      expect(builtins.proximity(hz)).toBe(constants.ndbCor[bin]);
    }
  });

  it("preserves conversion boundaries and nonfinite handling", async () => {
    const { dbToLinear, dbToLinearKlsyn, proximity } = await import("../src/builtin-functions");

    for (const value of [NaN, Infinity, -Infinity]) {
      expect(dbToLinear(value)).toBe(0);
      expect(dbToLinearKlsyn(value)).toBe(0);
      expect(proximity(value)).toBe(0);
    }
    expect(dbToLinearKlsyn(-1)).toBe(0);
    expect(dbToLinearKlsyn(13.9)).toBe(0.006);
    expect(dbToLinearKlsyn(100)).toBe(32.767);
    expect(proximity(49)).toBe(0);
  });
});
