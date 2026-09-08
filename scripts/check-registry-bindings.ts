import { readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { load } from "js-yaml";
import ts from "typescript";
import { readWorkspaceMetadata, wasmArtifacts } from "./build-wasm.ts";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateRegistryBindings(
  document: unknown,
  wasmFiles: ReadonlySet<string>,
  workletFiles: ReadonlySet<string>,
  registry: string,
): string[] {
  if (!record(document) || !record(document.primitives)) {
    return [`${registry}: expected a primitives mapping`];
  }
  const diagnostics: string[] = [];
  for (const [name, primitive] of Object.entries(document.primitives)) {
    if (!record(primitive)) {
      diagnostics.push(`${registry}: ${name}: expected a primitive mapping`);
      continue;
    }
    for (const kind of ["wasm", "worklet"] as const) {
      if (!(kind in primitive)) continue;
      const file = primitive[kind];
      const produced = kind === "wasm" ? wasmFiles : workletFiles;
      if (typeof file !== "string" || !produced.has(file)) {
        diagnostics.push(
          `${registry}: ${name}: ${kind} binding ${String(file)} has no build producer`,
        );
      }
    }
  }
  return diagnostics;
}

export function workletOutputs(root: string): Set<string> {
  const config = ts.getParsedCommandLineOfConfigFile(
    join(root, "tsconfig.worklets.json"),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic(diagnostic) {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      },
    },
  );
  if (!config || config.errors.length > 0) {
    throw new Error("Invalid worklet TypeScript configuration");
  }
  const destination = join(root, "public", "worklets");
  const outputs = new Set<string>();
  for (const input of config.fileNames) {
    for (const output of ts.getOutputFileNames(config, input, !ts.sys.useCaseSensitiveFileNames)) {
      const file = relative(destination, output);
      if (
        !isAbsolute(file) &&
        file !== ".." &&
        !file.startsWith(`..${sep}`) &&
        file.endsWith(".js")
      ) {
        outputs.add(file.split(sep).join("/"));
      }
    }
  }
  return outputs;
}

function registryFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return registryFiles(path);
    return /^registry\.ya?ml$/.test(entry.name) ? [path] : [];
  });
}

export function checkRegistryBindings(root: string): string[] {
  const wasmFiles = new Set(
    wasmArtifacts(readWorkspaceMetadata(root)).map((artifact) => artifact.fileName),
  );
  const workletFiles = workletOutputs(root);
  const registries = registryFiles(join(root, "public"));
  if (registries.length === 0) throw new Error("No registry files found under public/");
  return registries.flatMap((path) =>
    validateRegistryBindings(
      load(readFileSync(path, "utf8")),
      wasmFiles,
      workletFiles,
      relative(root, path),
    ),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const diagnostics = checkRegistryBindings(process.cwd());
    if (diagnostics.length > 0) {
      for (const diagnostic of diagnostics) console.error(diagnostic);
      process.exitCode = 1;
    } else {
      console.log("Registry bindings match workspace WASM and TypeScript worklet producers.");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
