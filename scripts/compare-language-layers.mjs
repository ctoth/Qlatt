import { existsSync, readFileSync } from "node:fs";
import { load as yamlLoad } from "js-yaml";

const fe = (id) => `public/rules/frontends/${id}`;
const load = (p) => (existsSync(p) ? yamlLoad(readFileSync(p, "utf8")) : null);
const A = load(`${fe("qlatt-english")}/pipeline.yaml`);
const B = load(`${fe("dectalk-english")}/pipeline.yaml`);
for (const key of ["predicates", "functions", "string_sets", "maps"]) {
  const a = A?.[key] ?? {},
    b = B?.[key] ?? {};
  const ka = Object.keys(a),
    kb = Object.keys(b);
  const shared = ka.filter((k) => k in b);
  const identical = shared.filter((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));
  console.log(
    `${key.padEnd(12)} qlatt-english=${ka.length}  dectalk=${kb.length}  shared-name=${shared.length}  identical=${identical.length}`,
  );
  if (key === "string_sets") console.log("  qlatt-english sets:", ka.join(", "));
  if (key === "predicates")
    console.log("  shared-not-identical:", shared.filter((k) => !identical.includes(k)).join(", "));
}
// inventory: phonological features vs acoustic targets
const inv = load(`${fe("qlatt-english")}/inventory.yaml`);
const featKeys = new Map();
for (const t of Object.values(inv.phoneme_targets))
  for (const [k, v] of Object.entries(t)) {
    const kind = typeof v === "boolean" || k === "type" ? "phonological" : "acoustic";
    featKeys.set(k, kind);
  }
const phon = [...featKeys].filter(([, k]) => k === "phonological").map(([k]) => k);
const acou = [...featKeys].filter(([, k]) => k === "acoustic").map(([k]) => k);
console.log(`inventory keys: phonological=${phon.length} [${phon.join(" ")}]`);
console.log(
  `                acoustic=${acou.length} [${acou.slice(0, 20).join(" ")}${acou.length > 20 ? " ..." : ""}]`,
);
// dectalk inventory phoneme set overlap
const invD = load(`${fe("dectalk-english")}/inventory.yaml`);
const pa = new Set(Object.keys(inv.phoneme_targets).map((s) => s.replace(/[0-2]$/, "")));
const pd = new Set(Object.keys(invD.phoneme_targets).map((s) => s.replace(/[0-2]$/, "")));
console.log(
  `phoneme symbols: qlatt-english=${pa.size} dectalk=${pd.size} shared=${[...pa].filter((s) => pd.has(s)).length}`,
);
// function words location
for (const id of ["qlatt-english", "dectalk-english"]) {
  const hits = [];
  for (const f of [
    "pipeline.yaml",
    "frontend.yaml",
    "phases/annotation.yaml",
    "phases/prosody.yaml",
    "phases/postlexical.yaml",
  ]) {
    const p = `${fe(id)}/${f}`;
    if (!existsSync(p)) continue;
    const src = readFileSync(p, "utf8");
    const m = src.match(/function_words?/g);
    if (m) hits.push(`${f}:${m.length}`);
  }
  console.log(`${id} function_words mentions:`, hits.join(" ") || "none");
}
