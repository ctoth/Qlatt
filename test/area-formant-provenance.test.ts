import { expect, it, vi } from "vitest";
import * as inventoryModule from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { loadYamlSourceSync } from "../src/yaml-loader";

const path = "/rules/frontends/qlatt-english/inventory.yaml";
const geometry = {
  source: "data/area-functions/story-1996.yaml#IY",
  model: "wave-reflection-fant-loss-v1",
  speaker: { tract_length_scale: 1, pharynx_scale: 1, mouth_scale: 1 },
  citations: ["Story et al. 1996 Table III", "Fant 1960 Eq. A.34-23"],
};

it("carries geometry and model through inventory selection into the decision DAG", () => {
  const original = inventoryModule.loadInventorySpecFromPath(path);
  const inventory = {
    ...original,
    phoneme_targets: {
      ...original.phoneme_targets,
      IY1: {
        ...original.phoneme_targets.IY1,
        F4: 3300,
        B4: 250,
        derived_from: "area_function",
        area_function: geometry,
      },
    },
  };
  const resources = inventoryModule.loadFrontendResources(loadBundledRulepackSpec("qlatt-english"));
  const spy = vi
    .spyOn(inventoryModule, "loadFrontendResources")
    .mockReturnValue({ ...resources, inventory });
  const provenance = createProvenanceCollector();
  try {
    textToKlattTrackDetailed("see", 110, 30, { provenance });
    const decision = provenance
      .getDecisions()
      .find((d) => d.type === "inventory_target_selected" && d.reason.includes("IY1"));
    expect(decision?.reason).toContain(geometry.source);
    expect(decision?.reason).toContain(geometry.model);
    expect(decision?.citations).toEqual(expect.arrayContaining(geometry.citations));
    expect(decision?.parents?.length).toBeGreaterThan(0);
    expect(decision?.inventorySelection).toMatchObject({ areaFunction: geometry });
    decision!.inventorySelection!.areaFunction!.speaker.mouth_scale = 2;
    expect(
      provenance.getDecisions().find((d) => d.id === decision?.id)?.inventorySelection?.areaFunction
        ?.speaker.mouth_scale,
    ).toBe(1);
  } finally {
    spy.mockRestore();
  }
});

it("rejects a derived target without cited geometry, while retaining table targets", () => {
  const source = loadYamlSourceSync(path);
  expect(() => inventoryModule.parseInventorySpec(source)).not.toThrow();
  expect(() =>
    inventoryModule.parseInventorySpec(
      source.replace("  IY1:", "  IY1:\n    derived_from: area_function"),
    ),
  ).toThrow(/area_function/);
});
