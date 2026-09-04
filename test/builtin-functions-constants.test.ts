import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const YAML_LOADER_MODULE = "../src/yaml-loader";

function mockAmpConstants(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    constants: {
      ndbCor: [10, 5],
      ndbScale: { AV: -119 },
      klsynAmpTable: [0, 100],
      ndbCorBinHz: 100,
      ndbCorMinHz: 100,
      ndbCorMaxHz: 300,
      klsynAmpScale: 0.01,
      dbFloorDb: -10,
      dbCeilingDb: 12,
      dbPerDoubling: 3,
      ...overrides,
    },
  };
}

describe("declarative Klatt conversion constants", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock(YAML_LOADER_MODULE);
  });

  it("drives conversion behavior from semantics constants", async () => {
    vi.doMock(YAML_LOADER_MODULE, () => ({
      loadYamlDocumentSync: () => mockAmpConstants(),
    }));

    const { dbToLinear, dbToLinearKlsyn, proximity } = await import("../src/builtin-functions");

    expect(dbToLinear(-10)).toBe(0);
    expect(dbToLinear(3)).toBe(2);
    expect(dbToLinear(99)).toBe(16);
    expect(dbToLinearKlsyn(1)).toBe(1);
    expect(proximity(100)).toBe(10);
    expect(proximity(250)).toBe(5);
    expect(proximity(300)).toBe(0);
  });

  it("rejects an ndbCor table whose length does not match its bins", async () => {
    vi.doMock(YAML_LOADER_MODULE, () => ({
      loadYamlDocumentSync: () => mockAmpConstants({ ndbCor: [10] }),
    }));

    await expect(import("../src/builtin-functions")).rejects.toThrow("E_KLATT_AMP_TABLE_LENGTH");
  });
});
