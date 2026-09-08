import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type CargoMetadata, wasmArtifacts } from "../scripts/build-wasm.ts";
import { validateRegistryBindings } from "../scripts/check-registry-bindings.ts";

describe("workspace WASM artifacts", () => {
  it("derives new members and explicit library names without including helpers or dependencies", () => {
    const metadata: CargoMetadata = {
      workspace_members: ["common", "new-filter"],
      target_directory: "/build-output",
      packages: [
        { id: "common", name: "common", targets: [{ name: "common", crate_types: ["rlib"] }] },
        {
          id: "new-filter",
          name: "new-filter",
          targets: [{ name: "custom_filter", crate_types: ["cdylib", "rlib"] }],
        },
        {
          id: "dependency",
          name: "dependency",
          targets: [{ name: "dependency", crate_types: ["cdylib"] }],
        },
      ],
    };
    expect(wasmArtifacts(metadata)).toEqual([
      {
        packageName: "new-filter",
        sourcePath: join(
          "/build-output",
          "wasm32-unknown-unknown",
          "release",
          "custom_filter.wasm",
        ),
        fileName: "new-filter.wasm",
      },
    ]);
  });
});

describe("registry binding producers", () => {
  const wasmFiles = new Set(["new-filter.wasm"]);
  const workletFiles = new Set(["new-filter-processor.js", "noise-source-processor.js"]);

  it("accepts native, JavaScript-only, and WASM-backed primitives", () => {
    expect(
      validateRegistryBindings(
        {
          primitives: {
            gain: { native: "GainNode" },
            noise: { worklet: "noise-source-processor.js" },
            filter: { wasm: "new-filter.wasm", worklet: "new-filter-processor.js" },
          },
        },
        wasmFiles,
        workletFiles,
        "registry.yaml",
      ),
    ).toEqual([]);
  });

  it.each([
    ["wasm", "stale.wasm"],
    ["worklet", "stale-processor.js"],
    ["wasm", "../new-filter.wasm"],
    ["worklet", 42],
  ])("rejects an unproduced %s binding %s with its registry and primitive", (kind, file) => {
    const diagnostics = validateRegistryBindings(
      { primitives: { broken: { [kind]: file } } },
      wasmFiles,
      workletFiles,
      "experiment/registry.yaml",
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toContain("experiment/registry.yaml: broken");
    expect(diagnostics[0]).toContain(kind);
  });
});
