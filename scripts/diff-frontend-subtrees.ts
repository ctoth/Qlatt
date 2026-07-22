/**
 * diff-frontend-subtrees.ts — one-off analysis helper (Phase 5.1).
 * Loads two raw frontend.yaml docs and reports which leaf paths differ in the
 * `parameters`, `output`, and `transcription` subtrees. Used to compute the
 * exact beauty-vs-english delta so `extends` inheritance can express beauty as
 * english + delta without changing compiled output.
 */
import { loadYamlSourceSync, parseYamlString } from "../src/yaml-loader";

function leaves(obj: unknown, prefix: string, out: Map<string, string>): void {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      leaves(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else {
    out.set(prefix, JSON.stringify(obj));
  }
}

function load(path: string): Record<string, unknown> {
  return parseYamlString(loadYamlSourceSync(path), path) as Record<string, unknown>;
}

function compareSubtree(name: string, a: unknown, b: unknown): void {
  const la = new Map<string, string>();
  const lb = new Map<string, string>();
  leaves(a, "", la);
  leaves(b, "", lb);
  const allKeys = new Set([...la.keys(), ...lb.keys()]);
  const diffs: string[] = [];
  for (const key of [...allKeys].sort()) {
    const va = la.get(key);
    const vb = lb.get(key);
    if (va !== vb) diffs.push(`  ${key}: english=${va ?? "<absent>"} | beauty=${vb ?? "<absent>"}`);
  }
  console.log(`=== ${name}: ${diffs.length} differing leaves (english total=${la.size}, beauty total=${lb.size}) ===`);
  for (const d of diffs) console.log(d);
}

const eng = load("/rules/frontends/qlatt-english/frontend.yaml");
const beauty = load("/rules/frontends/qlatt-beauty/frontend.yaml");

compareSubtree("parameters", eng.parameters, beauty.parameters);
compareSubtree("output", eng.output, beauty.output);
compareSubtree("transcription", eng.transcription, beauty.transcription);
