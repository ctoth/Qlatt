// Run: node --experimental-strip-types scripts/paper-coverage.ts
// Lexical source-reference coverage only; paper contents are never read.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Evidence = { path: string; line: number; kind: "exact-folder" | "author-year" };
type Paper = { folder: string; references: Evidence[]; ambiguous: Evidence[] };
const root = fileURLToPath(new URL("../", import.meta.url));
const scopes = ["src/", "crates/", "public/rules/", "public/experiments/", "scripts/"];
const extensions = [".ts", ".js", ".mjs", ".rs", ".yaml", ".yml"];
const tracked = execFileSync("git", ["-C", root, "ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean)
  .sort();
const papers: Paper[] = tracked.flatMap((file) => {
  const match = /^papers\/([^/]+)\/notes\.md$/.exec(file);
  return match ? [{ folder: match[1], references: [], ambiguous: [] }] : [];
});
const sources = tracked.filter(
  (file) =>
    scopes.some((scope) => file.startsWith(scope)) && extensions.includes(path.extname(file)),
);
function bounded(value: string, flags = "", author = false): RegExp {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = author ? escaped.replace(/(?<=\p{L})(?=\p{L})/gu, "[\\s'’]*") : escaped;
  return new RegExp(`(?<![\\p{L}\\p{N}_])${pattern}(?![\\p{L}\\p{N}_])`, `${flags}u`);
}
const exactPatterns = papers.map((paper) => ({ paper, pattern: bounded(paper.folder) }));
const groups = new Map<string, { author: RegExp; year: RegExp; papers: Paper[] }>();
for (const paper of papers) {
  const parts = paper.folder.split("_");
  const year = parts.slice(1).find((part) => /^\d{4}$/.test(part));
  if (!year) continue;
  const author = parts[0].replace(/[\s'’]/g, "").toLowerCase();
  const key = `${author} ${year}`;
  let group = groups.get(key);
  if (!group) {
    group = { author: bounded(author, "i", true), year: bounded(year), papers: [] };
    groups.set(key, group);
  }
  group.papers.push(paper);
}
for (const file of sources) {
  const lines = readFileSync(path.join(root, file), "utf8").split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const exact = new Set<Paper>();
    for (const { paper, pattern } of exactPatterns) {
      if (!pattern.test(line)) continue;
      exact.add(paper);
      paper.references.push({ path: file, line: index + 1, kind: "exact-folder" });
    }
    for (const group of groups.values()) {
      if (group.papers.some((paper) => exact.has(paper))) continue;
      if (!group.author.test(line) || !group.year.test(line)) continue;
      const evidence: Evidence = { path: file, line: index + 1, kind: "author-year" };
      for (const paper of group.papers) {
        (group.papers.length === 1 ? paper.references : paper.ambiguous).push(evidence);
      }
    }
  }
}
const referenced = papers.filter((paper) => paper.references.length > 0);
const ambiguous = papers.filter(
  (paper) => paper.references.length === 0 && paper.ambiguous.length > 0,
);
const noDetectedReference = papers
  .filter((paper) => paper.references.length === 0 && paper.ambiguous.length === 0)
  .map((paper) => paper.folder);
const report = {
  counts: {
    papers: papers.length,
    sourceFiles: sources.length,
    referenced: referenced.length,
    ambiguousOnly: ambiguous.length,
    noDetectedReference: noDetectedReference.length,
  },
  scope: {
    inventory: "tracked papers/*/notes.md filenames",
    sourceDirectories: scopes,
    extensions,
  },
  limits: [
    "Source text includes comments and strings; matches do not establish runtime use or scientific fidelity.",
    "Exact folder names are case-sensitive; author/year matches are case-insensitive author and four-digit year tokens on the same line.",
    "Author matching permits optional spaces and straight or curly apostrophes between letters; author groups normalize those separators.",
    "Author/year co-occurrence is heuristic, not bibliographic resolution; split-line references, aliases, and alternate spellings may be missed.",
    "Same-author/year candidates remain ambiguous unless that line names an exact folder; yearless folders use exact matching only.",
    "No detected reference means no lexical match in this scope, not evidence that a paper is unused.",
    "Only tracked working-tree files are scanned; paper contents and generated public worklets are excluded.",
  ],
  referenced,
  ambiguous,
  noDetectedReference,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
