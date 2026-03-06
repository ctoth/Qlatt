import { describe, expect, it } from "vitest";
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
