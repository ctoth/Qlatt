/**
 * Runtime contract tests for Qlatt-owned formant-bank YAML extensions.
 *
 * Acoustic fields follow Klatt (1980); parallel amplitude fields follow the
 * partial-fraction expansion described by Lin (1995).
 */
import { describe, expect, it } from "vitest";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import {
  expandFormantBanks,
  FormantBankValidationError,
  parseFormantBanks,
} from "../src/formant-bank";
import type { BaconGraph } from "../src/klatt-runtime";
import type { SemanticsDocument } from "../src/semantics/types";

const validBank = {
  cascade: { input: "input", output: "cascadeOutput" },
  parallel: { output: "parallelOutput" },
  formants: [
    {
      index: 1,
      freqRange: [200, 1000],
      freqDefault: 500,
      bwRange: [40, 1000],
      bwDefault: 60,
      ndbScale: -58,
      sign: 1,
      parallelSource: "parallelSource",
      bypassAtZero: true,
    },
  ],
};

function expectSchemaError(value: unknown): FormantBankValidationError {
  try {
    parseFormantBanks(value);
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(FormantBankValidationError);
    if (error instanceof FormantBankValidationError) return error;
    throw error;
  }
  throw new Error("expected formant-bank schema validation to fail");
}

function makeGraph(formantBanks: unknown): BaconGraph {
  return {
    bacon: "0.1",
    meta: { formantBanks },
    nodes: {
      input: { type: "gain" },
      cascadeOutput: { type: "gain" },
      parallelOutput: { type: "gain" },
      parallelSource: { type: "gain" },
    },
  };
}

function makeSemantics(): SemanticsDocument {
  return {
    name: "formant-bank-validation-test",
    params: {},
    constants: {},
    realize: {},
  };
}

describe("formant-bank source schema", () => {
  it("parses a strict, complete bank declaration", () => {
    const banks = parseFormantBanks({ main: validBank });

    expect(Object.keys(banks)).toEqual(["main"]);
    expect(banks.main.formants[0].freqDefault).toBe(500);
  });

  it("rejects fields from the removed proximity approximation", () => {
    const error = expectSchemaError({
      main: {
        ...validBank,
        proximity: [{ pair: [1, 2], offset: 0 }],
      },
    });

    expect(error.code).toBe("E_FORMANT_BANK_SCHEMA");
    expect(error.issues).toContainEqual(
      expect.objectContaining({
        path: "meta.formantBanks.main",
      }),
    );
  });

  it("rejects defaults outside their declared ranges", () => {
    const error = expectSchemaError({
      main: {
        ...validBank,
        formants: [{ ...validBank.formants[0], freqDefault: 1200 }],
      },
    });

    expect(error.issues).toContainEqual(
      expect.objectContaining({
        path: "meta.formantBanks.main.formants.0.freqDefault",
      }),
    );
  });

  it("rejects duplicate formant indices", () => {
    const error = expectSchemaError({
      main: {
        ...validBank,
        formants: [validBank.formants[0], validBank.formants[0]],
      },
    });

    expect(error.issues).toContainEqual(
      expect.objectContaining({
        path: "meta.formantBanks.main.formants.1.index",
      }),
    );
  });

  it("requires complete amplitude data for parallel formants", () => {
    const { sign: _sign, ...incompleteFormant } = validBank.formants[0];
    const error = expectSchemaError({
      main: { ...validBank, formants: [incompleteFormant] },
    });

    expect(error.issues).toContainEqual(
      expect.objectContaining({
        path: "meta.formantBanks.main.formants.0.sign",
      }),
    );
  });

  it("fails closed when more than one bank is declared", () => {
    const error = expectSchemaError({ main: validBank, secondary: validBank });

    expect(error.issues).toContainEqual(
      expect.objectContaining({
        path: "meta.formantBanks",
        message: "exactly one formant bank is supported; received 2",
      }),
    );
  });
});

describe("formant-bank expansion preflight", () => {
  it("rejects generated node collisions before mutating either document", () => {
    const graph = makeGraph({ main: validBank });
    graph.nodes.cascadeF1 = { type: "gain" };
    const semantics = makeSemantics();
    const graphBefore = JSON.stringify(graph);
    const semanticsBefore = JSON.stringify(semantics);

    expect(() => expandFormantBanks(graph, semantics)).toThrow(
      /E_FORMANT_BANK_COLLISION.*cascadeF1/,
    );
    expect(JSON.stringify(graph)).toBe(graphBefore);
    expect(JSON.stringify(semantics)).toBe(semanticsBefore);
  });

  it("rejects missing node references before mutation", () => {
    const graph = makeGraph({
      main: {
        ...validBank,
        cascade: { ...validBank.cascade, input: "missingInput" },
      },
    });
    const semantics = makeSemantics();

    expect(() => expandFormantBanks(graph, semantics)).toThrow(
      /E_FORMANT_BANK_REFERENCE.*missingInput/,
    );
    expect(graph.meta?.formantBanks).toBeDefined();
    expect(graph.nodes.cascadeF1).toBeUndefined();
  });
});

describe("bundled formant-bank declarations", () => {
  for (const experimentId of ["klatt80-baseline", "dectalk-english", "stevens91", "qlatt-beauty"]) {
    it(`validates and expands ${experimentId}`, async () => {
      const { graph, semantics } = await loadExperimentConfig(experimentId);

      expect(() => expandFormantBanks(graph, semantics)).not.toThrow();
      expect(graph.meta?.formantBanks).toBeUndefined();
      expect(graph.nodes.cascadeF1).toBeDefined();
      expect(semantics.params?.F1?.default).toBe(500);
    });
  }
});
