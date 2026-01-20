import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");

const scripts = [
  "scripts/klatt-tract-wasm-compare.mjs",
  "scripts/lf-source-wasm-compare.mjs",
  "scripts/render-phrase.mjs",
];

let failed = false;
for (const script of scripts) {
  const result = spawnSync(process.execPath, [path.join(repoRoot, script)], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    failed = true;
  }
}

process.exitCode = failed ? 1 : 0;
