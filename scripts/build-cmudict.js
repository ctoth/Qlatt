import { dictionary } from "cmu-pronouncing-dictionary";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "src", "cmu-dictionary.js");

const payload = `export const CMU_DICT = ${JSON.stringify(dictionary)};\n`;
fs.writeFileSync(outPath, payload, "utf8");
console.log(`Wrote ${Object.keys(dictionary).length} entries to ${outPath}`);
