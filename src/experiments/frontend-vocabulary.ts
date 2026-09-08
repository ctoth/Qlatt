import { readLowerOptions } from "../declarative-frontend/hrg/lowering";
import { preloadBundledRulepackSpec } from "../declarative-frontend/rule-pack";
import { expandFormantBanks } from "../formant-bank";
import type { ExperimentConfig } from "./load-experiment-config";

export interface VocabularyMismatch {
  undeclaredColumns: string[];
  missingRequiredParams: string[];
}

/** Compare declared inputs without changing the config used to build the runtime. */
export function checkVocabulary(
  columns: readonly string[],
  experimentConfig: Pick<ExperimentConfig, "graph" | "semantics">,
): VocabularyMismatch {
  const { graph, semantics } = structuredClone(experimentConfig);
  expandFormantBanks(graph, semantics);
  const params = semantics.params ?? {};
  const emitted = new Set(columns);
  return {
    undeclaredColumns: [...emitted].filter((name) => !Object.hasOwn(params, name)),
    missingRequiredParams: Object.entries(params)
      .filter(([name, definition]) => definition.default === undefined && !emitted.has(name))
      .map(([name]) => name),
  };
}

export async function assertFrontendVocabulary(
  frontendId: string,
  experimentConfig: Pick<ExperimentConfig, "graph" | "semantics">,
): Promise<void> {
  const spec = await preloadBundledRulepackSpec(frontendId);
  const { undeclaredColumns, missingRequiredParams } = checkVocabulary(
    readLowerOptions(spec.output.lowering).columns,
    experimentConfig,
  );
  if (undeclaredColumns.length || missingRequiredParams.length) {
    throw new Error(
      `E_FRONTEND_VOCABULARY: frontend '${frontendId}'; ` +
        `undeclared columns: [${undeclaredColumns.join(", ")}]; ` +
        `missing required params: [${missingRequiredParams.join(", ")}]`,
    );
  }
}
