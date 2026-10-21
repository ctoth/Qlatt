import type { ExperimentConfig } from "../src/experiments/load-experiment-config";
import { prepareExperimentConfig } from "../src/experiments/prepare-experiment-config";
import { createKlattRuntime, type KlattRuntimeOptions } from "../src/klatt-runtime";

export type RuntimeFixtureOptions = ExperimentConfig & Omit<KlattRuntimeOptions, "config">;

/** Programmatic tests cross the same explicit preparation boundary as loaded experiments. */
export async function createPreparedRuntime(options: RuntimeFixtureOptions) {
  const { graph, semantics, registry, sources, ...host } = options;
  const config = prepareExperimentConfig({ graph, semantics, registry, sources }, "runtime fixture", host.diagnostics);
  return createKlattRuntime({ ...host, config });
}
