#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function walkYamlFiles(root: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkYamlFiles(fullPath));
      continue;
    }
    if (entry.isFile() && (fullPath.endsWith(".yaml") || fullPath.endsWith(".yml"))) {
      results.push(fullPath);
    }
  }
  return results;
}

function countLeadingSpaces(line: string): number {
  let count = 0;
  while (count < line.length && line[count] === " ") count += 1;
  return count;
}

function migrateFile(filePath: string): boolean {
  const original = fs.readFileSync(filePath, "utf8");
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  const lines = original.split(/\r?\n/);
  const output: string[] = [];

  let inControlWindowBlock = false;
  let blockIndent = -1;

  for (const line of lines) {
    const indent = countLeadingSpaces(line);
    const trimmed = line.trim();

    if (
      inControlWindowBlock &&
      trimmed.length > 0 &&
      !trimmed.startsWith("#") &&
      indent <= blockIndent
    ) {
      inControlWindowBlock = false;
      blockIndent = -1;
    }

    const paramWindowMatch = line.match(/^(\s*)param_windows:(.*)$/);
    if (paramWindowMatch) {
      output.push(`${paramWindowMatch[1]}control_windows:${paramWindowMatch[2]}`);
      inControlWindowBlock = true;
      blockIndent = paramWindowMatch[1].length;
      continue;
    }

    if (inControlWindowBlock) {
      const itemMatch = line.match(/^(\s*)-\s(.*)$/);
      if (itemMatch) {
        output.push(line);
        output.push(`${itemMatch[1]}  target: "'current'"`);
        continue;
      }

      const paramsMatch = line.match(/^(\s*)params:(.*)$/);
      if (paramsMatch) {
        output.push(`${paramsMatch[1]}fields:${paramsMatch[2]}`);
        continue;
      }
    }

    output.push(line);
  }

  const migrated = output.join(newline);
  if (migrated === original) return false;
  fs.writeFileSync(filePath, migrated, "utf8");
  return true;
}

function main(): number {
  const repoRoot = process.cwd();
  const frontendsRoot = path.join(repoRoot, "public", "rules", "frontends");
  const yamlFiles = walkYamlFiles(frontendsRoot);
  let updated = 0;
  for (const filePath of yamlFiles) {
    if (migrateFile(filePath)) updated += 1;
  }
  process.stdout.write(`Migrated control window schema in ${updated} file(s).\n`);
  return 0;
}

process.exit(main());
