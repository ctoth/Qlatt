// Generate the `obstruent_place:`, `rounded_sonorant_consonant:` and `f2_back:`
// YAML block for the dectalk-english frontend lowering spec, from the
// DECtalk-extracted us_place_coartic.yaml.
//
// Source data: extracted by dectalk repo scripts/extract_place_coartic.py
// (us_place[] place bits + us_begtyp[] ROUNDED_SONOR_CONS). This script only
// re-shapes that data into the indented YAML that lives under
// output.lowering.transitions in frontend.yaml. DATA; one-time reshape kept for
// reproducibility. These three tables drive the two setloc prcnt adjustments
// (ph_sttr2.c:294-307) inside the generic locus resolver.
//
// `obstruent_place` is scoped to the obstruents that actually carry a locus
// block (so the resolver only ever queries those), read from frontend.yaml.
//
// Usage: node scripts/gen-dectalk-place-coartic-yaml.mjs [us_place_coartic.yaml] [frontend.yaml]
import { readFileSync } from "node:fs";
import { load as loadYaml } from "js-yaml";

const src = process.argv[2] ?? "C:/Users/Q/src/dectalk/463/output/us_place_coartic.yaml";
const frontendPath = process.argv[3] ?? "public/rules/frontends/dectalk-english/frontend.yaml";

const data = loadYaml(readFileSync(src, "utf8"));
const frontend = loadYaml(readFileSync(frontendPath, "utf8"));
const lociObstruents = new Set(Object.keys(frontend.output.lowering.transitions.loci ?? {}));

const indent = "      "; // 6 spaces: under transitions: (4)
const out = [];

out.push(`${indent}# setloc prcnt-adjustment DATA (ph_sttr2.c:294-307), extracted from`);
out.push(`${indent}# DECtalk 4.63 PH/p_us_rom.h us_place[] + us_begtyp[] via the dectalk repo`);
out.push(`${indent}# scripts/extract_place_coartic.py, reshaped by`);
out.push(`${indent}# scripts/gen-dectalk-place-coartic-yaml.mjs. Consumed by the generic locus`);
out.push(`${indent}# resolver (resolveLocusBoundary): no per-phoneme literals in code.`);

// obstruent_place: palatal_or_dental, scoped to obstruents with a locus block.
out.push(`${indent}# obstruent_place[obstruent].palatal_or_dental = us_place & (FPALATL|FDENTAL)`);
out.push(
  `${indent}# (ph_defs.h:340-341). Adjustment (a) fires only for NON-palatal/dental obstruents.`,
);
out.push(`${indent}obstruent_place:`);
for (const ph of Object.keys(data.obstruent_place).sort()) {
  if (!lociObstruents.has(ph)) continue;
  const pod = data.obstruent_place[ph].palatal_or_dental === true;
  out.push(`${indent}  ${ph}: { palatal_or_dental: ${pod} }`);
}

// rounded_sonorant_consonant: begtyp == ROUNDED_SONOR_CONS (5).
out.push(`${indent}# rounded_sonorant_consonant = sonorants with begtyp==ROUNDED_SONOR_CONS(5)`);
out.push(`${indent}# (ph_defs.h:176). Adjustment (a): prcnt=(prcnt>>1)+50 for F2/F3.`);
const rounded = data.rounded_sonorant_consonant.slice().sort();
out.push(`${indent}rounded_sonorant_consonant: [${rounded.join(", ")}]`);

// f2_back: F2BACKI (forward) / F2BACKF (backward) per vowel.
out.push(`${indent}# f2_back[vowel] = { forward: us_place & F2BACKI, backward: & F2BACKF }`);
out.push(
  `${indent}# (ph_defs.h:345-346). Adjustment (b) on F2: prcnt += 25-(prcnt>>2); durtran=(durtran>>1)+2.`,
);
out.push(`${indent}f2_back:`);
for (const ph of Object.keys(data.f2_back).sort()) {
  const c = data.f2_back[ph];
  out.push(
    `${indent}  ${ph}: { forward: ${c.forward === true}, backward: ${c.backward === true} }`,
  );
}

process.stdout.write(out.join("\n") + "\n");
