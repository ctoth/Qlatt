import { afterEach, describe, expect, it, vi } from "vitest";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";

describe("loadExperimentConfig", () => {
  it("preserves inherited semantics metadata for dectalk-english", async () => {
    const config = await loadExperimentConfig("dectalk-english");

    expect(config.semantics.name).toBe("klatt80");
    expect(config.semantics.defaultScheduling).toBe("ramp");
  });

  it("keeps dectalk high-formant sentinel params declared", async () => {
    const config = await loadExperimentConfig("dectalk-english");

    expect(config.semantics.params?.F9?.default).toBe(8500);
    expect(config.semantics.params?.F10?.default).toBe(9500);
    expect(config.semantics.params?.B9?.default).toBe(2125);
    expect(config.semantics.params?.B10?.default).toBe(4750);
  });
});

describe("loadExperimentConfig with a child that extends klatt80-baseline", () => {
  afterEach(() => {
    vi.doUnmock("../src/path-utils");
    vi.resetModules();
  });

  /**
   * Load `child`, whose directory holds exactly `childFiles` (file name to
   * text); the parent and everything else are the files on disk.
   */
  async function loadChild(childFiles: Record<string, string>) {
    const files: Record<string, string> = {
      "/experiments/manifest.json": JSON.stringify({
        experiments: [{ id: "klatt80-baseline" }, { id: "child", extends: "klatt80-baseline" }],
      }),
    };
    for (const [name, text] of Object.entries(childFiles)) {
      files[`/experiments/child/${name}`] = text;
    }
    vi.resetModules();
    vi.doMock("../src/path-utils", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../src/path-utils")>();
      return {
        ...actual,
        readFileFromFsSync: (specPath: string) =>
          Object.hasOwn(files, specPath) ? files[specPath] : actual.readFileFromFsSync(specPath),
      };
    });
    const loader = await import("../src/experiments/load-experiment-config");
    return loader.loadExperimentConfig("child");
  }

  it("uses the parent's graph and registry when the child has neither file", async () => {
    const parent = await loadExperimentConfig("klatt80-baseline");
    const child = await loadChild({
      "semantics.yaml": "params:\n  AV: { type: float, default: 50, range: [0, 80] }\n",
    });

    expect(child.graph).toEqual(parent.graph);
    expect(child.registry).toEqual(parent.registry);
    expect(child.semantics.params?.AV?.default).toBe(50);
    expect(child.semantics.realize).toEqual(parent.semantics.realize);
  });

  it("uses the parent's semantics when the child has no semantics.yaml", async () => {
    const parent = await loadExperimentConfig("klatt80-baseline");
    const child = await loadChild({});

    expect(child.semantics).toEqual(parent.semantics);
  });

  it("throws on a YAML syntax error in the child's semantics.yaml, naming the path", async () => {
    await expect(
      loadChild({ "semantics.yaml": "params:\n  AV: { type: float, default: 50\n" }),
    ).rejects.toThrow(/^E_YAML_PARSE: '\/experiments\/child\/semantics\.yaml': /);
  });

  it.each(["semantics.yaml", "graph.yaml", "registry.yaml"])(
    "throws when the child's %s is an empty document",
    async (name) => {
      // js-yaml refuses a file with no document in it...
      await expect(loadChild({ [name]: "# nothing here\n" })).rejects.toThrow(
        `E_YAML_PARSE: '/experiments/child/${name}': expected a document, but the input is empty`,
      );
      await expect(loadChild({ [name]: "" })).rejects.toThrow(
        `E_YAML_PARSE: '/experiments/child/${name}': expected a document, but the input is empty`,
      );
      // ...and parses a null document, which the loader refuses.
      await expect(loadChild({ [name]: "~\n" })).rejects.toThrow(
        `E_YAML_SCHEMA: '/experiments/child/${name}' resolved to empty document`,
      );
    },
  );

  it("throws on a YAML syntax error in the child's graph.yaml instead of inheriting", async () => {
    await expect(loadChild({ "graph.yaml": "nodes: [unclosed\n" })).rejects.toThrow(
      /^E_YAML_PARSE: '\/experiments\/child\/graph\.yaml': /,
    );
  });
});
