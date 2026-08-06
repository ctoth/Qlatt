import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../..");

const crates = [
  ["resonator", "resonator.wasm"],
  ["antiresonator", "antiresonator.wasm"],
  ["biquad-notch", "biquad_notch.wasm"],
  ["tilt-filter", "tilt_filter.wasm"],
  ["pitch-sync-mod", "pitch_sync_mod.wasm"],
  ["fujisaki-resonator", "fujisaki_resonator.wasm"],
  ["reconstruction-filter", "reconstruction_filter.wasm"],
  ["f0-filters", "f0_filters.wasm"],
];

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const requestedOutput = argument("--out");
if (!requestedOutput) {
  console.error("Usage: node scripts/filter-perf/build.mjs --out <directory>");
  process.exit(2);
}

const outputRoot = resolve(repoRoot, requestedOutput);
const cargoTarget = resolve(outputRoot, "cargo-target");
const artifacts = resolve(outputRoot, "artifacts");
mkdirSync(artifacts, { recursive: true });

const cargoArgs = [
  "build",
  "--release",
  "--target",
  "wasm32-unknown-unknown",
  "--target-dir",
  cargoTarget,
];
for (const [crate] of crates) {
  cargoArgs.push("-p", crate);
}

const build = spawnSync("cargo", cargoArgs, {
  cwd: repoRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const releaseDir = resolve(cargoTarget, "wasm32-unknown-unknown/release");
for (const [, compiledName] of crates) {
  copyFileSync(resolve(releaseDir, compiledName), resolve(artifacts, compiledName));
}

console.log(artifacts);
