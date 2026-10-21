import { afterEach, describe, expect, it, vi } from "vitest";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { createCelEvaluator } from "../src/semantics/cel-evaluator";

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
  async function loadChild(
    childFiles: Record<string, string>,
    extraEntries: Array<{ id: string; extends?: string }> = [],
    extraFiles: Record<string, string> = {},
    selected = "child",
  ) {
    const files: Record<string, string> = {
      ...extraFiles,
      "/experiments/manifest.json": JSON.stringify({
        experiments: [
          { id: "klatt80-baseline" },
          { id: "child", extends: "klatt80-baseline" },
          ...extraEntries,
        ],
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
    return loader.loadExperimentConfig(selected);
  }

  it("resolves three generations with whole-entry overrides and nested constant replacement", async () => {
    const config = await loadChild(
      {
        "semantics.yaml": `
params:
  local: { type: float, default: 1, range: [0, 10] }
constants:
  tree: { nested: { keep: 2, change: 3 }, list: [1, 2], cleared: { x: 1 }, scalar: 9 }
realize:
  localResult: { expr: local, deps: [local], citations: ["engineering estimate: parent fixture"] }
realize_each:
  - index: n
    over: [1, 2]
    rules:
      'generated{n}': 'local + {n}'
`,
        "registry.yaml": "primitives:\n  local: { native: GainNode, inputs: 1 }\n",
      },
      [{ id: "grandchild", extends: "child" }],
      {
        // This inheritance fixture replaces the whole graph; use a coherent
        // root without baseline formulas that depend on its formant macro.
        "/experiments/klatt80-baseline/graph.yaml": "bacon: '0.1'\nnodes: {}\n",
        "/experiments/klatt80-baseline/registry.yaml": "bacon: '0.1'\nprimitives: {}\n",
        "/experiments/klatt80-baseline/semantics.yaml": "name: fixture\nparams: {}\n",
        "/experiments/grandchild/semantics.yaml": `
params:
  local: { default: 4 }
constants:
  tree: { nested: { change: 5 }, list: [7], cleared: null, scalar: { x: 8 } }
realize:
  localResult: 'local * 2'
  generated1: 'local * 3'
`,
        "/experiments/grandchild/registry.yaml":
          "primitives:\n  local: { native: ConstantSourceNode }\n",
        "/experiments/grandchild/graph.yaml": "bacon: '0.1'\nnodes: { local: { type: local } }\n",
      },
      "grandchild",
    );
    expect(config.semantics.params?.local).toEqual({ default: 4 });
    expect(config.semantics.realize?.localResult).toMatchObject({ expr: "local * 2" });
    expect(config.semantics.realize?.generated1).toMatchObject({ expr: "local * 3" });
    expect(config.semantics.realize?.generated2).toMatchObject({ expr: "local + 2" });
    expect(config.registry.primitives.local).toEqual({ native: "ConstantSourceNode" });
    expect(config.graph.nodes).toEqual({ local: { type: "local" } });
    expect(config.semantics.constants?.tree).toEqual({
      nested: { keep: 2, change: 5 },
      list: [7],
      cleared: null,
      scalar: { x: 8 },
    });
    // Nested maps, arrays and null reach the actual CEL consumer unchanged.
    const cel = createCelEvaluator();
    expect(
      cel.evaluate("tree.nested.keep + tree.list[0] + tree.scalar.x", {
        params: {},
        constants: config.semantics.constants ?? {},
      }),
    ).toBe(17);
    expect(
      cel.evaluate("tree.cleared == null", {
        params: {},
        constants: config.semantics.constants ?? {},
      }),
    ).toBe(true);
  });

  it("inherits through an intermediate experiment with no documents", async () => {
    const parent = await loadExperimentConfig("klatt80-baseline");
    const child = await loadChild({}, [{ id: "grandchild", extends: "child" }], {}, "grandchild");
    expect(child).toEqual(parent);
    child.graph.nodes = {};
    child.semantics.params = {};
    child.registry.primitives = {};
    expect(await loadExperimentConfig("klatt80-baseline")).toEqual(parent);
  });

  it("replaces array/map/scalar constants without merging array indices", async () => {
    const config = await loadChild(
      { "semantics.yaml": "constants:\n  a: [1, 2]\n  b: { keep: 1 }\n  c: { keep: 2 }\n" },
      [{ id: "grandchild", extends: "child" }],
      {
        "/experiments/grandchild/semantics.yaml": "constants:\n  a: { own: 3 }\n  b: [4]\n  c: 5\n",
      },
      "grandchild",
    );
    expect(config.semantics.constants).toMatchObject({ a: { own: 3 }, b: [4], c: 5 });
  });

  it("reports unknown identities and complete missing-parent/cycle chains", async () => {
    await expect(loadChild({}, [], {}, "unknown")).rejects.toThrow(
      "E_EXPERIMENT_UNKNOWN: '/experiments/manifest.json': unknown",
    );
    await expect(
      loadChild({}, [{ id: "grandchild", extends: "missing" }], {}, "grandchild"),
    ).rejects.toThrow("grandchild -> missing");
    await expect(
      loadChild(
        {},
        [
          { id: "a", extends: "b" },
          { id: "b", extends: "a" },
        ],
        {},
        "a",
      ),
    ).rejects.toThrow("E_EXPERIMENT_CYCLE: '/experiments/manifest.json': a -> b -> a");
  });

  it("rejects duplicate experiment IDs instead of choosing the first", async () => {
    await expect(loadChild({}, [{ id: "child" }])).rejects.toThrow(
      "E_EXPERIMENT_MANIFEST: '/experiments/manifest.json' duplicate experiment 'child'",
    );
  });

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
