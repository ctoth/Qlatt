import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface CargoMetadata {
  workspace_members: string[];
  target_directory: string;
  packages: {
    id: string;
    name: string;
    targets: { name: string; crate_types: string[] }[];
  }[];
}

export interface WasmArtifact {
  packageName: string;
  sourcePath: string;
  fileName: string;
}

export function wasmArtifacts(metadata: CargoMetadata): WasmArtifact[] {
  const members = new Set(metadata.workspace_members);
  return metadata.packages
    .filter((pkg) => members.has(pkg.id))
    .flatMap((pkg) =>
      pkg.targets
        .filter((target) => target.crate_types.includes("cdylib"))
        .map((target) => ({
          packageName: pkg.name,
          sourcePath: join(
            metadata.target_directory,
            "wasm32-unknown-unknown",
            "release",
            `${target.name.replaceAll("-", "_")}.wasm`,
          ),
          fileName: `${pkg.name}.wasm`,
        })),
    );
}

export function readWorkspaceMetadata(root: string): CargoMetadata {
  return JSON.parse(
    execFileSync(
      "cargo",
      [
        "metadata",
        "--no-deps",
        "--format-version",
        "1",
        "--manifest-path",
        join(root, "Cargo.toml"),
      ],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
    ),
  ) as CargoMetadata;
}

export function buildWasm(root: string): void {
  const artifacts = wasmArtifacts(readWorkspaceMetadata(root));
  if (artifacts.length === 0) throw new Error("Cargo workspace has no WASM cdylib targets");
  // Keep the existing per-package release invocation and workspace profiles:
  // combining packages can change Cargo feature unification and emitted bytes.
  for (const artifact of artifacts) {
    execFileSync(
      "cargo",
      ["build", "--release", "--target", "wasm32-unknown-unknown", "-p", artifact.packageName],
      { cwd: root, stdio: "inherit" },
    );
  }
  const destination = join(root, "public", "worklets");
  mkdirSync(destination, { recursive: true });
  for (const artifact of artifacts) {
    copyFileSync(artifact.sourcePath, join(destination, artifact.fileName));
  }
  console.log(`WASM artifacts copied to ${destination}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    buildWasm(process.cwd());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
