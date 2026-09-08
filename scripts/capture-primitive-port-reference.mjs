// Freeze pre-port processor output from an explicit Git revision. Never reads
// candidate DSP code. Run from the repository root with the reference revision.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const revision = process.argv[2];
if (!revision) throw new Error("Pass the pre-port Git revision");
const names = [
  "impulse-train",
  "noise-source",
  "differentiator",
  "chalker-radiation",
  "glottal-mod",
];
const cases = [];
for (const name of names) {
  const source = execFileSync("git", ["show", `${revision}:public/worklets/${name}-processor.js`], {
    encoding: "utf8",
  });
  for (const rate of [10000, 22050, 48000]) {
    let Constructor;
    runInNewContext(source.replace(/^import .*;\r?\n/gm, ""), {
      AudioWorkletProcessor: class {
        port = { postMessage() {}, close() {} };
      },
      registerProcessor: (_name, ctor) => {
        Constructor = ctor;
      },
      sampleRate: rate,
    });
    const processor = new Constructor({ processorOptions: { seed: 51 } });
    const samples = [];
    for (let block = 0; block < 8; block++) {
      const input = Float32Array.from({ length: 128 }, (_, i) =>
        Math.sin((block * 128 + i) * 0.17),
      );
      const output = new Float32Array(128);
      processor.process([[input]], [[output]], {
        f0: Float32Array.from({ length: 128 }, (_, i) =>
          block === 3 ? 0 : 110 + Math.floor((block * 128 + i) / 200) * 20,
        ),
        gain: Float32Array.from({ length: 128 }, (_, i) => i / 128),
        openPhaseRatio: new Float32Array([block < 4 ? 0.7 : 0.4]),
        cutoff: new Float32Array([block < 4 ? 1000 : 4000]),
        oq: new Float32Array([block < 4 ? 0.5 : 0.7]),
      });
      samples.push(...output);
    }
    cases.push({
      name,
      rate,
      samples: Buffer.from(new Float32Array(samples).buffer).toString("base64"),
    });
  }
}
writeFileSync(
  "test/fixtures/primitive-port-reference.json",
  `${JSON.stringify({ revision, cases }, null, 2)}\n`,
);
