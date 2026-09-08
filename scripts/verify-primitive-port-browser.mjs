// Exercise browser-host WASM loading and compare each AudioWorklet's rendered
// output with direct WASM calls, including an explicit noise seed.
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";
import { createServer } from "vite";

const executablePath =
  process.env.CHROME_PATH ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find(existsSync);
if (!executablePath) throw new Error("Set CHROME_PATH to the browser executable");
const server = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ executablePath, headless: true });
  const address = server.httpServer.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const page = await browser.newPage();
  await page.route(`${origin}/primitive-probe`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Primitive probe</title>",
    }),
  );
  await page.goto(`${origin}/primitive-probe`);
  for (const name of [
    "impulse-train",
    "noise-source",
    "differentiator",
    "chalker-radiation",
    "glottal-mod",
  ]) {
    const result = await page.evaluate(async (name) => {
      const ctx = new OfflineAudioContext(1, 1024, 48000);
      await ctx.audioWorklet.addModule(`/worklets/${name}-processor.js`);
      const bytes = await (await fetch(`/worklets/${name}.wasm`)).arrayBuffer();
      const params =
        name === "impulse-train"
          ? { f0: 110, gain: 0.7, openPhaseRatio: 0.7 }
          : name === "noise-source"
            ? { gain: 0.7, cutoff: 1000 }
            : name === "glottal-mod"
              ? { f0: 110, oq: 0.5 }
              : {};
      const node = new AudioWorkletNode(ctx, `${name}-processor`, {
        parameterData: params,
        processorOptions: { seed: 51, wasmBytes: bytes },
      });
      await new Promise((resolve, reject) => {
        node.port.onmessage = ({ data }) => {
          if (data.type === "ready") resolve();
          if (data.type === "error") reject(new Error(data.message));
        };
        node.port.postMessage({ type: "ping" });
      });
      const input = Float32Array.from({ length: 1024 }, (_, i) => Math.sin(i * 0.17));
      if (name !== "impulse-train" && name !== "glottal-mod") {
        const buffer = ctx.createBuffer(1, input.length, ctx.sampleRate);
        buffer.copyToChannel(input, 0);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(node);
        source.start();
      }
      node.connect(ctx.destination);
      const rendered = (await ctx.startRendering()).getChannelData(0);
      const { instance } = await WebAssembly.instantiate(bytes);
      const prefix = name.replaceAll("-", "_");
      const state = instance.exports[`${prefix}_new`](48000, 51);
      let maximum = 0;
      for (let i = 0; i < input.length; i++) {
        const values =
          name === "impulse-train"
            ? [0, 110, Math.fround(0.7), Math.fround(0.7)]
            : name === "noise-source"
              ? [input[i], Math.fround(0.7), 1000, 0]
              : name === "glottal-mod"
                ? [0, 110, 0.5, 0]
                : [input[i], 0, 0, 0];
        const expected = Math.fround(instance.exports[`${prefix}_sample`](state, ...values));
        maximum = Math.max(maximum, Math.abs(rendered[i] - expected));
      }
      instance.exports[`${prefix}_free`](state);
      node.port.postMessage({ type: "dispose" });
      node.disconnect();
      node.port.close();
      return { name, maxDelta: maximum, audible: rendered.some((sample) => sample !== 0) };
    }, name);
    console.log(JSON.stringify(result));
    if (!(result.maxDelta <= 1e-6 && result.audible)) process.exitCode = 1;
  }
} finally {
  await browser?.close();
  await server.close();
}
