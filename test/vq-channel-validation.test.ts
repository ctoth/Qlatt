import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("../src/yaml-loader");
  vi.resetModules();
});

it.each([
  ["algebra", undefined],
  ["algebra", "invalid"],
  ["neutral", undefined],
  ["neutral", Number.NaN],
  ["neutral", 99],
  ["citations", undefined],
  ["citations", []],
  ["citations", [""]],
  ["unit", ""],
  ["backend_param", ""],
] as const)("rejects invalid %s at consumer load time (%s)", async (field, value) => {
  vi.resetModules();
  vi.doMock("../src/yaml-loader", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/yaml-loader")>();
    return {
      ...actual,
      loadYamlDocumentSync: (path: string) => {
        const document = actual.loadYamlDocumentSync(path);
        if (path !== "/rules/policy/vq-channels.yaml") return document;
        if (!actual.isPlainObject(document) || !Array.isArray(document.channels)) {
          throw new Error("expected channels document");
        }
        const first: unknown = document.channels[0];
        if (!actual.isPlainObject(first)) throw new Error("expected channel record");
        expect(first[field]).not.toEqual(value);
        return {
          ...document,
          channels: [{ ...first, [field]: value }, ...document.channels.slice(1)],
        };
      },
    };
  });
  await expect(import("../src/input/direction-track")).rejects.toThrow("E_VQ_CHANNEL_SCHEMA");
});
