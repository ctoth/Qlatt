import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { createNodeRuntimeAssetLoader } from "../src/runtime-assets/node-loader";

it("retains WASM bytes while giving each render an independent buffer", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "qlatt-assets-"));
  await fs.writeFile(path.join(dir, "wasm-utils.js"), "");
  const file = path.join(dir, "test.wasm");
  await fs.writeFile(file, new Uint8Array([0, 97, 115, 109]));
  const loader = await createNodeRuntimeAssetLoader(dir);
  try {
    const first = await loader.loadWasmModule("test.wasm");
    new Uint8Array(first)[0] = 255;
    await fs.unlink(file);
    expect(new Uint8Array(await loader.loadWasmModule("test.wasm"))).toEqual(
      new Uint8Array([0, 97, 115, 109]),
    );
  } finally {
    await loader.dispose?.();
    await fs.rm(dir, { recursive: true });
  }
});
