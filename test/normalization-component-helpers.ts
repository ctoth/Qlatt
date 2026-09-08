import { readFileSync } from "node:fs";
import { Utterance } from "../src/declarative-frontend/hrg";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";
import {
  NORMALIZATION_SCHEMA,
  normalizeSourceItems,
  recognizeText,
} from "../src/declarative-frontend/source-recognition";
import { parseYamlString } from "../src/yaml-loader";

/** Test-only composition, with the same keyed blocks and ordered phases as includes. */
export function readingFixture(
  components: string[],
  maps: Record<string, Record<string, string>> = {},
) {
  const raw: Record<string, unknown> = {
    transcription: { punctuation_tokens: [".", ",", "!", "?", ":", ";"] },
  };
  const phases: Record<string, unknown>[] = [];
  for (const name of [...components, "numbers"]) {
    const component = parseYamlString(
      readFileSync(`public/rules/normalization/${name}.yaml`, "utf8"),
      name,
    ) as Record<string, unknown>;
    for (const key of ["maps", "rules", "functions", "relations", "tags"]) {
      raw[key] = { ...((raw[key] as object) ?? {}), ...((component[key] as object) ?? {}) };
    }
    if (component.text_recognition) raw.text_recognition = component.text_recognition;
    phases.push(...((component.phases as Record<string, unknown>[]) ?? []));
  }
  raw.maps = { ...(raw.maps as object), ...maps };
  raw.phases = phases;
  raw.normalization = { phases: phases.map((phase) => phase.name) };
  raw.text_recognition ??= {
    rules: [],
    unmatched: {
      speak: "current.text",
      vocabulary_keys: "[]",
      citations: ["Issue #38: nested request fixture"],
    },
  };
  const spec = compileRuleEngineSpec(raw);
  return (kind: string, payload: Record<string, string>, original?: string) => {
    const graph = new Utterance(NORMALIZATION_SCHEMA);
    recognizeText(original ?? "fixture", graph, spec);
    if (original !== undefined)
      return {
        text: normalizeSourceItems(graph, spec)
          .map((entry) => entry.word)
          .join(" "),
        graph,
      };
    const source = graph.relation("Normalization").listItems()[0];
    const tx = graph.beginTransaction({
      ruleId: "fixture_request",
      phase: "input",
      tag: "fixture",
      reason: "Composed reading request",
      citations: ["Issue #38"],
    });
    tx.set(source, "outputType", "request");
    tx.set(source, "kind", kind);
    tx.set(source, "payload", payload);
    tx.commit();
    return {
      text: normalizeSourceItems(graph, spec)
        .map((entry) => entry.word)
        .join(" "),
      graph,
    };
  };
}
