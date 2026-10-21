import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dictionary } from "cmu-pronouncing-dictionary";
import { loadYamlDocumentSync } from "../src/yaml-loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
// Read only the declaration: resource acquisition would require the output to exist.
const frontend = loadYamlDocumentSync<{ resources: { lexicon: string } }>(
  path.join(root, "public", "rules", "frontends", "qlatt-english", "frontend.yaml"),
);
const outPath = path.resolve(root, "public", frontend.resources.lexicon.replace(/^\/+/, ""));

const payload = `${JSON.stringify(dictionary)}\n`;
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, payload, "utf8");
console.log(`Wrote ${Object.keys(dictionary).length} entries to ${outPath}`);
