import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workstreamPath = path.join(
  repoRoot,
  "notes",
  "track-assembler-declarative-workstream-2026-05-27.md",
);

const text = fs.readFileSync(workstreamPath, "utf8");
const expected = [
  "control-score target schema",
  "lowering spec schema",
  "score builder completion",
  "mechanical lowering api",
  "frontend cutover",
  "old-path deletion and search gates",
  "provenance and diagnostics",
  "verification",
];

const dependencyBlock = text.match(
  /## Dependency Order[\s\S]*?The phases are topologically ordered[\s\S]*?\n\n([\s\S]*?)\n\nOrder check:/,
);
if (!dependencyBlock) {
  throw new Error("Dependency Order block not found");
}

const dependencyItems = [...dependencyBlock[1].matchAll(/^\d+\.\s+(.+)$/gm)].map(
  (match) => match[1].trim().toLowerCase(),
);

const phaseHeadings = [...text.matchAll(/^## Phase \d+ - (.+)$/gm)].map((match) =>
  match[1].trim().toLowerCase(),
);

function assertSame(label, actual) {
  if (actual.length !== expected.length) {
    throw new Error(`${label} has ${actual.length} items, expected ${expected.length}`);
  }
  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] !== expected[index]) {
      throw new Error(
        `${label} item ${index + 1} is '${actual[index]}', expected '${expected[index]}'`,
      );
    }
  }
}

assertSame("Dependency order", dependencyItems);
assertSame("Phase headings", phaseHeadings);

console.log(`Order check passed: ${expected.length} phases are topologically ordered.`);
