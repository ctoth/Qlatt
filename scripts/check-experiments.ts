import {
  loadExperimentConfig,
  loadExperimentManifest,
} from "../src/experiments/load-experiment-config.ts";

const manifest = await loadExperimentManifest();
for (const { id } of manifest.experiments) {
  try {
    const config = await loadExperimentConfig(id);
    console.log(`${id}: expanded graph, bindings and semantic references checked`);
    for (const { definition, source } of config.unreachable) {
      console.log(
        `${id}: unreachable ${definition} (${source.resource}:${source.line ?? "?"} ${source.path.join(".")})`,
      );
    }
  } catch (error) {
    console.error(`${id}: ${String(error)}`);
    process.exitCode = 1;
  }
}
