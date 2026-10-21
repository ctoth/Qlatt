// Run: npx tsx scripts/audit-citations.ts
// Authored declarations only; this does not resolve or verify citation prose.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isPlainObject, parseYamlString } from "../src/yaml-loader";

type Entry = {
  file: string;
  path: (string | number)[];
  category: string;
  status: "present" | "absent" | "invalid" | "no-slot";
};

export function auditDocument(file: string, document: unknown): Entry[] {
  const entries: Entry[] = [];
  if (!isPlainObject(document)) return entries;
  const collect = (category: string, prefix: (string | number)[], values: unknown) => {
    if (!isPlainObject(values)) return;
    for (const [name, value] of Object.entries(values)) {
      let status: Entry["status"];
      if (category === "constants" || !isPlainObject(value)) status = "no-slot";
      else if (!("citations" in value)) status = "absent";
      else {
        const citations = value.citations;
        status =
          Array.isArray(citations) &&
          citations.length > 0 &&
          citations.every((citation) => typeof citation === "string" && citation.trim())
            ? "present"
            : "invalid";
      }
      entries.push({ file, path: [...prefix, name], category, status });
    }
  };
  if (file.startsWith("public/rules/")) collect("rules", ["rules"], document.rules);
  if (file.endsWith("/semantics.yaml")) {
    collect("realize", ["realize"], document.realize);
    collect("params", ["params"], document.params);
    collect("constants", ["constants"], document.constants);
    if (Array.isArray(document.realize_each)) {
      document.realize_each.forEach((template, index) => {
        if (isPlainObject(template)) {
          collect("realize_each", ["realize_each", index, "rules"], template.rules);
        }
      });
    }
  }
  if (file.endsWith("/registry.yaml")) {
    collect("primitives", ["primitives"], document.primitives);
  }
  if (file.endsWith("/graph.yaml")) collect("nodes", ["nodes"], document.nodes);
  return entries;
}

export function auditCitations(root: string) {
  const files = execFileSync("git", ["-C", root, "ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter((file) => /^public\/(rules|experiments)\/.*\.ya?ml$/.test(file))
    .sort();
  const entries = files.flatMap((file) =>
    auditDocument(file, parseYamlString(readFileSync(path.join(root, file), "utf8"), file)),
  );
  const counts: Record<string, Record<Entry["status"] | "total", number>> = {};
  for (const entry of entries) {
    counts[entry.category] ??= {
      total: 0,
      present: 0,
      absent: 0,
      invalid: 0,
      "no-slot": 0,
    };
    const count = counts[entry.category];
    count.total += 1;
    count[entry.status] += 1;
  }
  return {
    scope: "Tracked public/rules and public/experiments YAML working-tree documents",
    files: files.length,
    counts,
    limits: [
      "Authored declarations only: inheritance, macros and graph expansion are not executed.",
      "realize_each counts authored rule templates separately, not generated instances.",
      "Constants count top-level raw CEL values; even a nested citations key is literal data.",
      "String realizations and other non-mapping entries have no citation metadata slot.",
      "Present means nonempty string-array metadata, not source verification or schema acceptance.",
      "Comments, source kinds, paper links and scientific fidelity are not inferred.",
      "These scoped counts are not comparable to the historical 740-entry audit.",
    ],
    entries,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  process.stdout.write(`${JSON.stringify(auditCitations(root), null, 2)}\n`);
}
