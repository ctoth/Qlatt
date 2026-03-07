/**
 * Migration script: Split frontend.yaml rules into per-phase files.
 *
 * Reads public/rules/frontend.yaml, extracts rules by phase, normalizes
 * citation -> citations[] format, writes 5 per-phase rule files, and
 * rewrites frontend.yaml with include directives.
 *
 * Usage: npx tsx scripts/split-rules.ts
 */
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const RULES_DIR = path.resolve("public/rules");
const FRONTEND_YAML = path.join(RULES_DIR, "frontend.yaml");
const OUTPUT_DIR = path.join(RULES_DIR, "rules");

// ---------------------------------------------------------------------------
// Hardcoded rule-to-file classification (from scout report)
// ---------------------------------------------------------------------------

const DURATION_RULES = new Set([
  "stress_duration",
  "non_word_initial_consonant_shortening",
  "word_medial_consonant_shortening",
  "unstressed_consonant_shortening",
  "word_initial_lengthening",
  "punctuation_pause",
  "vowel_shortening",
  "pre_boundary_lengthening",
  "fricative_minimum_duration",
  "lock_stop_release_duration",
  "stop_unreleasing",
  "s_cluster_aspiration_reduction",
]);

type PhaseConfig = {
  filename: string;
  ruleNames: string[];
};

// ---------------------------------------------------------------------------
// Citation normalization
// ---------------------------------------------------------------------------

/**
 * Split a citation string on "; " at top level only — do NOT split inside
 * parentheses.
 */
function splitCitation(raw: string): string[] {
  const results: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);

    if (depth === 0 && ch === ";" && raw[i + 1] === " ") {
      const trimmed = current.trim();
      if (trimmed) results.push(trimmed);
      current = "";
      i++; // skip the space after semicolon
    } else {
      current += ch;
    }
  }
  const trimmed = current.trim();
  if (trimmed) results.push(trimmed);
  return results;
}

/**
 * Normalize a rule object: convert citation (string) -> citations (array).
 * Mutates the object in place.
 */
function normalizeCitations(rule: Record<string, any>): void {
  if (Array.isArray(rule.citations)) {
    // Already in array format, clean up
    rule.citations = rule.citations
      .map((c: any) => String(c).trim())
      .filter(Boolean);
    delete rule.citation;
    return;
  }

  if (typeof rule.citation === "string" && rule.citation.trim()) {
    rule.citations = splitCitation(rule.citation);
  } else {
    rule.citations = [];
  }
  delete rule.citation;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  // 1. Read and parse frontend.yaml
  const rawYaml = fs.readFileSync(FRONTEND_YAML, "utf-8");
  const doc = yaml.load(rawYaml) as Record<string, any>;

  if (!doc || typeof doc !== "object") {
    throw new Error("frontend.yaml did not parse to an object");
  }

  const allRules = doc.rules as Record<string, any> | undefined;
  if (!allRules || typeof allRules !== "object") {
    throw new Error("No 'rules:' block found in frontend.yaml");
  }

  const phases = doc.phases as Array<{ name: string; rules: string[] }>;
  if (!Array.isArray(phases)) {
    throw new Error("No 'phases:' block found in frontend.yaml");
  }

  // 2. Build the rule-to-file mapping from phases
  const fileMap: Record<string, PhaseConfig> = {
    postlexical: { filename: "postlexical.yaml", ruleNames: [] },
    structural: { filename: "structural.yaml", ruleNames: [] },
    duration: { filename: "duration.yaml", ruleNames: [] },
    formant: { filename: "formant.yaml", ruleNames: [] },
    prosody: { filename: "prosody.yaml", ruleNames: [] },
  };

  for (const phase of phases) {
    if (!phase.rules || phase.rules.length === 0) continue;

    if (phase.name === "postlexical") {
      fileMap.postlexical.ruleNames.push(...phase.rules);
    } else if (phase.name === "structural") {
      fileMap.structural.ruleNames.push(...phase.rules);
    } else if (phase.name === "duration") {
      for (const ruleName of phase.rules) {
        if (DURATION_RULES.has(ruleName)) {
          fileMap.duration.ruleNames.push(ruleName);
        } else {
          fileMap.formant.ruleNames.push(ruleName);
        }
      }
    } else if (phase.name === "prosody") {
      fileMap.prosody.ruleNames.push(...phase.rules);
    }
    // finalize has rules: [] — skip
  }

  // 3. Verify all rules are assigned
  const assignedRules = new Set<string>();
  for (const config of Object.values(fileMap)) {
    for (const name of config.ruleNames) {
      assignedRules.add(name);
    }
  }

  const unassigned: string[] = [];
  for (const ruleName of Object.keys(allRules)) {
    if (!assignedRules.has(ruleName)) {
      unassigned.push(ruleName);
    }
  }

  // 4. Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 5. Write each rule file
  const summary: { file: string; count: number }[] = [];

  for (const [key, config] of Object.entries(fileMap)) {
    const rulesForFile: Record<string, any> = {};

    for (const ruleName of config.ruleNames) {
      const rule = allRules[ruleName];
      if (!rule) {
        console.error(`WARNING: Rule "${ruleName}" listed in phase but not found in rules block`);
        continue;
      }
      // Deep clone the rule to avoid mutation issues
      const cloned = JSON.parse(JSON.stringify(rule));
      normalizeCitations(cloned);
      rulesForFile[ruleName] = cloned;
    }

    const fileDoc = { rules: rulesForFile };
    const yamlStr = yaml.dump(fileDoc, {
      lineWidth: 120,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false,
      sortKeys: false,
      flowLevel: -1,
    });

    const outPath = path.join(OUTPUT_DIR, config.filename);
    fs.writeFileSync(outPath, yamlStr, "utf-8");
    summary.push({ file: `rules/${config.filename}`, count: config.ruleNames.length });
  }

  // 6. Rewrite frontend.yaml: remove rules block, add include list
  const includeList = [
    "rules/postlexical.yaml",
    "rules/structural.yaml",
    "rules/duration.yaml",
    "rules/formant.yaml",
    "rules/prosody.yaml",
  ];

  // Remove the rules key from the doc
  delete doc.rules;

  // Add include list
  doc.include = includeList;

  // Write the rewritten frontend.yaml
  // We need to preserve the top-level key order: version, parameters, predicates, streams, phases, include, output, transcription
  const orderedDoc: Record<string, any> = {};
  const keyOrder = [
    "version",
    "parameters",
    "predicates",
    "streams",
    "phases",
    "include",
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

  // 7. Print summary
  console.log("\n=== Rule Split Summary ===\n");
  let totalRules = 0;
  for (const { file, count } of summary) {
    console.log(`  ${file}: ${count} rules`);
    totalRules += count;
  }
  console.log(`\n  Total: ${totalRules} rules`);
  console.log(`  Unassigned: ${unassigned.length}${unassigned.length > 0 ? ` — ${unassigned.join(", ")}` : ""}`);
  console.log(`\n  Frontend YAML rewritten with include: [${includeList.join(", ")}]`);
  console.log(`\n  Output directory: ${OUTPUT_DIR}`);
  console.log("\nDone.\n");
}

main();
