/**
 * Migration script: Extract pipeline orchestration to pipeline.yaml.
 *
 * Reads public/rules/frontend.yaml, extracts the predicates, relations,
 * and phases blocks into public/rules/pipeline.yaml, removes those
 * blocks from frontend.yaml, and adds pipeline.yaml to the include list.
 *
 * After this, frontend.yaml becomes the lean root manifest containing:
 *   version, include, parameters, output, transcription
 *
 * And pipeline.yaml contains:
 *   predicates, relations, phases
 *
 * Usage: npx tsx scripts/extract-pipeline.ts
 */
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const RULES_DIR = path.resolve("public/rules");
const FRONTEND_YAML = path.join(RULES_DIR, "frontend.yaml");
const PIPELINE_YAML = path.join(RULES_DIR, "pipeline.yaml");

function main(): void {
  // 1. Read and parse frontend.yaml
  const rawYaml = fs.readFileSync(FRONTEND_YAML, "utf-8");
  const doc = yaml.load(rawYaml) as Record<string, any>;

  if (!doc || typeof doc !== "object") {
    throw new Error("frontend.yaml did not parse to an object");
  }

  // 2. Verify the blocks we need to extract exist
  const { predicates, relations, phases } = doc;

  if (!predicates || typeof predicates !== "object") {
    throw new Error("No 'predicates:' block found in frontend.yaml");
  }
  if (!relations || typeof relations !== "object") {
    throw new Error("No 'relations:' block found in frontend.yaml");
  }
  if (!Array.isArray(phases)) {
    throw new Error("No 'phases:' block found in frontend.yaml");
  }

  // 3. Build the pipeline document
  const pipelineDoc: Record<string, any> = {
    predicates,
    relations,
    phases,
  };

  // 4. Write pipeline.yaml
  const pipelineYaml = yaml.dump(pipelineDoc, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
    sortKeys: false,
    flowLevel: -1,
  });

  fs.writeFileSync(PIPELINE_YAML, pipelineYaml, "utf-8");
  console.log(`Wrote ${PIPELINE_YAML}`);

  // 5. Remove extracted blocks from doc
  delete doc.predicates;
  delete doc.relations;
  delete doc.phases;

  // 6. Add pipeline.yaml to the include list (prepend before rule files)
  const currentInclude: string[] = doc.include || [];
  if (!currentInclude.includes("pipeline.yaml")) {
    doc.include = ["pipeline.yaml", ...currentInclude];
  }

  // 7. Rewrite frontend.yaml with desired key order:
  //    version, include, parameters, output, transcription
  const orderedDoc: Record<string, any> = {};
  const keyOrder = [
    "version",
    "include",
    "parameters",
    "output",
    "transcription",
  ];

  for (const key of keyOrder) {
    if (doc[key] !== undefined) {
      orderedDoc[key] = doc[key];
    }
  }
  // Add any remaining keys not in the order list
  for (const key of Object.keys(doc)) {
    if (!keyOrder.includes(key)) {
      orderedDoc[key] = doc[key];
    }
  }

  const frontendYaml = yaml.dump(orderedDoc, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
    sortKeys: false,
    flowLevel: -1,
  });

  fs.writeFileSync(FRONTEND_YAML, frontendYaml, "utf-8");
  console.log(`Rewrote ${FRONTEND_YAML}`);

  // 8. Print summary
  console.log("\n=== Pipeline Extraction Summary ===\n");
  console.log(`  predicates: ${Object.keys(predicates).length} entries`);
  console.log(`  relations: ${Object.keys(relations).length} entries`);
  console.log(`  phases: ${phases.length} entries`);
  console.log(`\n  pipeline.yaml created at: ${PIPELINE_YAML}`);
  console.log(`  frontend.yaml rewritten with include: [${doc.include.join(", ")}]`);
  console.log(`\n  frontend.yaml remaining keys: ${Object.keys(orderedDoc).join(", ")}`);
  console.log("\nDone.\n");
}

main();
