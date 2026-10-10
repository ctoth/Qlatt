import { afterEach, describe, expect, it, vi } from "vitest";
import { expandFormantBanks } from "../src/formant-bank";
import { parseSemanticsDocument } from "../src/semantics/load-semantics";
import { expandRealizeEach, RealizeEachError } from "../src/semantics/realize-each";
import type { AuthoredSemanticsDocument } from "../src/semantics/types";

function document(overrides: Partial<AuthoredSemanticsDocument> = {}): AuthoredSemanticsDocument {
  return {
    name: "fixture",
    realize: { shared: { expr: "1.0" } },
    realize_each: [
      {
        index: "n",
        over: [2, 3],
        rules: {
          "gain{n}": {
            expr: "active ? dbToLinear(A{n}) * pole{n} : a{n}Linear",
            deps: ["active", "A{n}", "pole{n}", "a{n}Linear"],
            ramp: true,
          },
          "pole{n}": "F{n} / B{n}",
        },
      },
    ],
    ...overrides,
  };
}

/** Run `expand` and return the RealizeEachError it throws. */
function expansionError(authored: unknown, source?: string): RealizeEachError {
  try {
    expandRealizeEach(authored as AuthoredSemanticsDocument, source);
  } catch (error) {
    if (error instanceof RealizeEachError) return error;
    throw error;
  }
  throw new Error("expected expandRealizeEach to throw");
}

describe("expandRealizeEach", () => {
  it("substitutes the index in names and string fields and copies other fields", () => {
    const expanded = expandRealizeEach(document());

    expect(expanded.realize).toEqual({
      shared: { expr: "1.0" },
      gain2: {
        expr: "active ? dbToLinear(A2) * pole2 : a2Linear",
        deps: ["active", "A2", "pole2", "a2Linear"],
        ramp: true,
      },
      gain3: {
        expr: "active ? dbToLinear(A3) * pole3 : a3Linear",
        deps: ["active", "A3", "pole3", "a3Linear"],
        ramp: true,
      },
      pole2: "F2 / B2",
      pole3: "F3 / B3",
    });
  });

  it("appends generated rules after authored ones: entry, then rule, then over order", () => {
    const expanded = expandRealizeEach(document());
    expect(Object.keys(expanded.realize ?? {})).toEqual([
      "shared",
      "gain2",
      "gain3",
      "pole2",
      "pole3",
    ]);
  });

  it("removes realize_each and does not mutate the authored document", () => {
    const authored = document();
    const snapshot = structuredClone(authored);
    const expanded = expandRealizeEach(authored);

    expect(Object.hasOwn(expanded, "realize_each")).toBe(false);
    expect(expanded.name).toBe("fixture");
    expect(authored).toEqual(snapshot);
  });

  it("returns a document without realize_each unchanged", () => {
    const plain = { name: "plain", realize: { x: "1.0" } };
    expect(expandRealizeEach(plain)).toBe(plain);
  });

  it("creates the realize map when the document authors none", () => {
    const expanded = expandRealizeEach(document({ realize: undefined }));
    expect(Object.keys(expanded.realize ?? {})).toEqual(["gain2", "gain3", "pole2", "pole3"]);
  });

  it("accepts string index values and leaves CEL map literals alone", () => {
    const expanded = expandRealizeEach({
      name: "fixture",
      realize_each: [
        {
          index: "side",
          over: ["Left", "Right"],
          rules: { "pan{side}": '{"k": gain{side}}.k + {k: 1}.k' },
        },
      ],
    });
    expect(expanded.realize).toEqual({
      panLeft: '{"k": gainLeft}.k + {k: 1}.k',
      panRight: '{"k": gainRight}.k + {k: 1}.k',
    });
  });

  it("produces rules the formant bank collision check sees as ordinary realize rules", () => {
    const semantics = expandRealizeEach({
      name: "fixture",
      realize_each: [{ index: "n", over: [1], rules: { "a{n}Linear": "1.0" } }],
    });
    const graph: Parameters<typeof expandFormantBanks>[0] = {
      bacon: "0.1",
      nodes: {
        input: { type: "gain" },
        cascadeOutput: { type: "gain" },
        parallelOutput: { type: "gain" },
        parallelSource: { type: "gain" },
      },
      meta: {
        formantBanks: {
          main: {
            cascade: { input: "input", output: "cascadeOutput" },
            parallel: { output: "parallelOutput" },
            formants: [
              {
                index: 1,
                freqRange: [200, 1000],
                freqDefault: 500,
                bwRange: [40, 1000],
                bwDefault: 60,
                ampRange: [0, 80],
                ampDefault: 0,
                ndbScale: -58,
                sign: 1,
                parallelSource: "parallelSource",
              },
            ],
          },
        },
      },
    };

    expect(() => expandFormantBanks(graph, semantics)).toThrow(
      /E_FORMANT_BANK_COLLISION.*generated realization 'a1Linear' already exists/,
    );
  });
});

describe("expandRealizeEach errors", () => {
  it("rejects a generated name that is already authored under realize", () => {
    const error = expansionError(document({ realize: { gain3: "0.0" } }), "fixture.yaml");
    expect(error.code).toBe("E_REALIZE_EACH_COLLISION");
    expect(error.message).toBe(
      "E_REALIZE_EACH_COLLISION fixture.yaml: realize_each[0].rules.gain{n}: " +
        "generated rule 'gain3' is already authored under 'realize'",
    );
  });

  it("rejects two templates that generate the same name", () => {
    const error = expansionError({
      name: "fixture",
      realize_each: [
        { index: "n", over: [2], rules: { "gain{n}": "1.0" } },
        { index: "m", over: [2], rules: { "gain{m}": "2.0" } },
      ],
    });
    expect(error.code).toBe("E_REALIZE_EACH_COLLISION");
    expect(error.message).toBe(
      "E_REALIZE_EACH_COLLISION realize_each[1].rules.gain{m}: " +
        "generated rule 'gain2' was already generated by realize_each[0].rules.gain{n}",
    );
  });

  it("rejects a repeated over value as a collision", () => {
    const error = expansionError({
      name: "fixture",
      realize_each: [{ index: "n", over: [2, 2], rules: { "gain{n}": "1.0" } }],
    });
    expect(error.code).toBe("E_REALIZE_EACH_COLLISION");
    expect(error.message).toContain("realize_each[0].rules.gain{n}");
  });

  it("rejects a rule name without the placeholder", () => {
    const error = expansionError({
      name: "fixture",
      realize_each: [{ index: "n", over: [2, 3], rules: { gain: "A{n}" } }],
    });
    expect(error.code).toBe("E_REALIZE_EACH_NAME");
    expect(error.message).toContain("realize_each[0].rules.gain:");
    expect(error.message).toContain("'{n}'");
  });

  it.each([
    ["an empty list", []],
    ["a scalar", 3],
    ["a mapping", { from: 2, to: 4 }],
    ["missing", undefined],
  ])("rejects over given as %s", (_label, over) => {
    const error = expansionError({
      name: "fixture",
      realize_each: [{ index: "n", over, rules: { "gain{n}": "1.0" } }],
    });
    expect(error.code).toBe("E_REALIZE_EACH_OVER");
    expect(error.message).toContain("realize_each[0].over:");
  });

  it.each([
    ["a nested list", [[2, 3]]],
    ["a mapping item", [{ n: 2 }]],
    ["a boolean", [true]],
    ["an empty string", [""]],
    ["a null", [null]],
  ])("rejects an over item that is %s", (_label, over) => {
    const error = expansionError({
      name: "fixture",
      realize_each: [{ index: "n", over, rules: { "gain{n}": "1.0" } }],
    });
    expect(error.code).toBe("E_REALIZE_EACH_OVER");
    expect(error.message).toContain("realize_each[0].over[0]:");
  });

  it.each([
    ["the rule name", { "gain{n}{m}": "1.0" }, "realize_each[0].rules.gain{n}{m}:"],
    ["a bare CEL rule", { "gain{n}": "A{m}" }, "realize_each[0].rules.gain{n}:"],
    ["expr", { "gain{n}": { expr: "A{m}" } }, "realize_each[0].rules.gain{n}.expr:"],
    [
      "a deps item",
      { "gain{n}": { expr: "A{n}", deps: ["A{n}", "B{m}"] } },
      "realize_each[0].rules.gain{n}.deps[1]:",
    ],
    [
      "description",
      { "gain{n}": { expr: "A{n}", description: "gain of {formant}" } },
      "realize_each[0].rules.gain{n}.description:",
    ],
  ])("rejects a placeholder that is not the index in %s", (_label, rules, path) => {
    const error = expansionError({
      name: "fixture",
      realize_each: [{ index: "n", over: [2], rules }],
    });
    expect(error.code).toBe("E_REALIZE_EACH_PLACEHOLDER");
    expect(error.message).toContain(path);
  });

  it.each([
    ["realize_each is a mapping", { index: "n", over: [2], rules: {} }, "realize_each:"],
    ["realize_each is null", null, "realize_each:"],
    ["an entry is a string", ["n"], "realize_each[0]:"],
    [
      "an entry has an unknown key",
      [{ index: "n", over: [2], rules: { "g{n}": "1.0" }, where: "n > 2" }],
      "realize_each[0].where:",
    ],
    ["index is missing", [{ over: [2], rules: { "g{n}": "1.0" } }], "realize_each[0].index:"],
    [
      "index is not an identifier",
      [{ index: "n-1", over: [2], rules: { "g{n-1}": "1.0" } }],
      "realize_each[0].index:",
    ],
    ["rules is missing", [{ index: "n", over: [2] }], "realize_each[0].rules:"],
    ["rules is empty", [{ index: "n", over: [2], rules: {} }], "realize_each[0].rules:"],
    ["rules is a list", [{ index: "n", over: [2], rules: ["g{n}"] }], "realize_each[0].rules:"],
    [
      "a rule is a number",
      [{ index: "n", over: [2], rules: { "g{n}": 1 } }],
      "realize_each[0].rules.g{n}:",
    ],
    [
      "a rule has no expr",
      [{ index: "n", over: [2], rules: { "g{n}": { deps: ["A{n}"] } } }],
      "realize_each[0].rules.g{n}.expr:",
    ],
    [
      "deps is not a list of strings",
      [{ index: "n", over: [2], rules: { "g{n}": { expr: "A{n}", deps: ["A{n}", 2] } } }],
      "realize_each[0].rules.g{n}.deps:",
    ],
  ])("rejects a malformed document: %s", (_label, realizeEach, path) => {
    const error = expansionError({ name: "fixture", realize_each: realizeEach });
    expect(error.code).toBe("E_REALIZE_EACH_SHAPE");
    expect(error.message).toContain(path);
  });
});

describe("parseSemanticsDocument", () => {
  it("expands realize_each written in YAML and names the source in errors", () => {
    const yaml = [
      "name: fixture",
      "realize:",
      '  base: "1.0"',
      "realize_each:",
      "  - index: n",
      "    over: [2, 3]",
      "    rules:",
      '      "gain{n}":',
      '        expr: "base * A{n}"',
      '        deps: [base, "A{n}"]',
      "        step: true",
    ].join("\n");

    expect(parseSemanticsDocument(yaml, "fixture.yaml")).toEqual({
      name: "fixture",
      realize: {
        base: "1.0",
        gain2: { expr: "base * A2", deps: ["base", "A2"], step: true },
        gain3: { expr: "base * A3", deps: ["base", "A3"], step: true },
      },
    });
    expect(() => parseSemanticsDocument(`${yaml}\n  - index: n\n`, "fixture.yaml")).toThrow(
      /^E_REALIZE_EACH_OVER fixture\.yaml: realize_each\[1\]\.over:/,
    );
  });
});

describe("loadExperimentConfig with realize_each", () => {
  afterEach(() => {
    vi.doUnmock("../src/yaml-loader");
    vi.doUnmock("../src/path-utils");
    vi.resetModules();
  });

  /** Load `child` (which extends `parent`) through the real loader over in-memory documents. */
  async function loadChild(parentSemantics: unknown, childSemantics: unknown) {
    const documents: Record<string, unknown> = {
      "/experiments/parent/graph.yaml": { name: "graph", nodes: {}, connections: [] },
      "/experiments/parent/registry.yaml": { primitives: {} },
      "/experiments/parent/semantics.yaml": parentSemantics,
      "/experiments/child/semantics.yaml": childSemantics,
    };
    vi.resetModules();
    vi.doMock("../src/path-utils", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../src/path-utils")>();
      return {
        ...actual,
        // Only the manifest is replaced; modules the loader imports still read
        // their own policy files from disk.
        readFileFromFsSync: (specPath: string) =>
          specPath === "/experiments/manifest.json"
            ? JSON.stringify({
                experiments: [{ id: "parent" }, { id: "child", extends: "parent" }],
              })
            : actual.readFileFromFsSync(specPath),
      };
    });
    vi.doMock("../src/yaml-loader", async (importOriginal) => {
      const read = async (specPath: string) => {
        if (!Object.hasOwn(documents, specPath)) throw new Error(`missing ${specPath}`);
        return structuredClone(documents[specPath]);
      };
      return {
        ...(await importOriginal<typeof import("../src/yaml-loader")>()),
        loadYamlDocument: read,
        loadYamlDocumentOrNull: (specPath: string) => read(specPath).catch(() => null),
      };
    });
    const { loadExperimentConfig } = await import("../src/experiments/load-experiment-config");
    return loadExperimentConfig("child");
  }

  const parent = {
    name: "parent",
    realize: { base: "1.0" },
    realize_each: [
      {
        index: "n",
        over: [2, 3, 4],
        rules: { "gain{n}": { expr: "base * A{n}", deps: ["base", "A{n}"] } },
      },
    ],
  };

  it("expands each document before the extends merge, so a child rule overrides by key", async () => {
    const { semantics } = await loadChild(parent, {
      name: "child",
      // A concrete override of one generated parent rule...
      realize: { gain3: { expr: "0.5 * A3", deps: ["A3"] } },
      // ...and a child template that overrides another and adds a new one.
      realize_each: [{ index: "n", over: [4, 5], rules: { "gain{n}": "2.0 * A{n}" } }],
    });

    expect(Object.hasOwn(semantics, "realize_each")).toBe(false);
    expect(semantics.realize).toEqual({
      base: "1.0",
      gain2: { expr: "base * A2", deps: ["base", "A2"] },
      gain3: { expr: "0.5 * A3", deps: ["A3"] },
      gain4: "2.0 * A4",
      gain5: "2.0 * A5",
    });
  });

  it("reports a collision inside one document, naming that document", async () => {
    await expect(
      loadChild(parent, {
        name: "child",
        realize: { gain5: "1.0" },
        realize_each: [{ index: "n", over: [5], rules: { "gain{n}": "2.0" } }],
      }),
    ).rejects.toThrow(
      /^E_REALIZE_EACH_COLLISION \/experiments\/child\/semantics\.yaml: realize_each\[0\]/,
    );
  });

  it("loads the bundled experiments with no realize_each key left and every fric rule present", async () => {
    vi.resetModules();
    const { loadExperimentConfig } = await import("../src/experiments/load-experiment-config");
    for (const experimentId of ["klatt80-baseline", "steinecke95"]) {
      const { graph, semantics } = await loadExperimentConfig(experimentId);
      expect(Object.hasOwn(semantics, "realize_each"), experimentId).toBe(false);
      for (let n = 2; n <= 10; n++) {
        expect(semantics.realize?.[`fricA${n}`], `${experimentId} fricA${n}`).toBeDefined();
        expect(
          semantics.realize?.[`fricA${n}Linear`],
          `${experimentId} fricA${n}Linear`,
        ).toBeDefined();
      }
      expect(() => expandFormantBanks(graph, semantics)).not.toThrow();
    }
  });
});
