// Compare candidate graphs against the five JavaScript primitives from an
// explicit pre-port revision, using scripts/render-phrase.ts's tolerances.
// Vite supplies the application's import.meta.env contract to the Node backend.
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer } from "vite";

const revision = process.argv[2];
if (!revision) throw new Error("Pass the pre-port Git revision");
const root = process.cwd();
const referenceRoot = mkdtempSync(path.join(tmpdir(), "qlatt-primitive-reference-"));
function removeReference() {
  if (
    path.dirname(referenceRoot) !== path.resolve(tmpdir()) ||
    !path.basename(referenceRoot).startsWith("qlatt-primitive-reference-")
  )
    throw new Error(`Unexpected temporary directory: ${referenceRoot}`);
  rmSync(referenceRoot, { recursive: true });
}
const server = await createServer({ root, server: { middlewareMode: true }, logLevel: "error" });
try {
  const assets = path.join(referenceRoot, "public", "worklets");
  cpSync(path.join(root, "public", "worklets"), assets, { recursive: true });
  for (const name of [
    "impulse-train",
    "noise-source",
    "differentiator",
    "chalker-radiation",
    "glottal-mod",
  ]) {
    const file = `${name}-processor.js`;
    writeFileSync(
      path.join(assets, file),
      execFileSync("git", ["show", `${revision}:public/worklets/${file}`]),
    );
  }
  const { nodeRuntimeBackend } = await server.ssrLoadModule(
    "/scripts/rendering/backends/node-runtime.ts",
  );
  for (const experimentId of ["klatt80-baseline", "qlatt-beauty"]) {
    const request = {
      repoRoot: root,
      phrase: "She sees a bright blue sky.",
      frontendId: experimentId === "qlatt-beauty" ? "qlatt-beauty" : "qlatt-english",
      experimentId,
      engine: "runtime",
      rate: 1,
      transitionMs: 30,
      sampleRate: 22050,
      leadTime: 0.05,
      tailTime: 0.2,
      includeTrack: false,
      noiseSeed: 20260214,
      persistWav: true,
      allowBrowserRender: false,
      renderHost: "node",
    };
    const before = await nodeRuntimeBackend.render({ ...request, repoRoot: referenceRoot });
    const after = await nodeRuntimeBackend.render(request);
    if (before.samples.length !== after.samples.length)
      throw new Error(`${experimentId}: length mismatch`);
    let maximum = 0;
    let squares = 0;
    for (let i = 0; i < before.samples.length; i++) {
      const delta = after.samples[i] - before.samples[i];
      maximum = Math.max(maximum, Math.abs(delta));
      squares += delta * delta;
    }
    const rms = Math.sqrt(squares / before.samples.length);
    console.log(
      JSON.stringify({
        experimentId,
        samples: after.samples.length,
        maxDelta: maximum,
        rmsError: rms,
      }),
    );
    if (!(maximum <= 1e-6 && rms <= 1e-7 && after.metrics.rms > 0)) process.exitCode = 1;
  }
} finally {
  await server.close();
  removeReference();
}
