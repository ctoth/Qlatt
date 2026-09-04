// dt-1 voice importer: reads the converted DECtalk voice YAMLs from the
// dectalk source tree and writes them as declarative voice data under the
// dectalk-english frontend (public/rules/frontends/dectalk-english/speakers/).
//
// Each output file carries:
//   - all converted DECtalk voice params (verbatim values)
//   - a derived f0_lp_filter_alpha = f0_lp_filter / 4096 (DECtalk frac4mul
//     coefficient, Ph_drwt02.c) so the consumed F0-filter field is present
//   - a file-level `citations:` list documenting the DECtalk 4.63 source
//
// This script is a one-shot importer; rerun it to regenerate the voice files
// from the canonical converted source. Keep it for reproducibility.
//
// Usage: node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/dt1-import-voices.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dump as dumpYaml, load as loadYaml } from "js-yaml";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");

const SOURCE_DIR = "C:/Users/Q/src/dectalk/463/output/qlatt/speakers";
const OUT_DIR = path.join(repoRoot, "public", "rules", "frontends", "dectalk-english", "speakers");

const VOICES = [
  "paul",
  "harry",
  "frank",
  "dennis",
  "betty",
  "ursula",
  "wendy",
  "rita",
  "kit",
  "chris",
];

// DECtalk Ph_drwt02.c F0 low-pass filter coefficient: alpha = f0_lp_filter / 4096
// (frac4mul divisor). Present in the legacy inline Paul block; derived here for
// every voice so the consumed field is self-contained per voice.
const F0_LP_DIVISOR = 4096;

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const voice of VOICES) {
  const srcPath = path.join(SOURCE_DIR, `${voice}.yaml`);
  const raw = loadYaml(fs.readFileSync(srcPath, "utf8")) as Record<string, unknown>;

  const f0LpFilter = Number(raw.f0_lp_filter);
  const alpha = f0LpFilter / F0_LP_DIVISOR;

  // Preserve all source fields; insert f0_lp_filter_alpha right after f0_lp_filter.
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key] = value;
    if (key === "f0_lp_filter") {
      out.f0_lp_filter_alpha = alpha;
    }
  }

  const header =
    `# DECtalk voice "${raw.name}" — converted from DECtalk 4.63 voice tables.\n` +
    `# Imported by scripts/dt1-import-voices.ts from the canonical converted\n` +
    `# source (dectalk/463 ph_vset.c / Ph_drwt02.c voice parameter set).\n` +
    `# f0_lp_filter_alpha is derived: f0_lp_filter / ${F0_LP_DIVISOR}\n` +
    `# (DECtalk 4.63 Ph_drwt02.c frac4mul coefficient).\n` +
    `#\n` +
    `# F4-F8, per-voice gains (GF/GH/GV/GN/G1-G4/LO), and glottal params\n` +
    `# (AGO/AGVO/AGUO/UNVOW/CHINK, smoothness/breathiness/richness/...) are\n` +
    `# STORED here but not yet wired into the synthesis graph (deferred chunk).\n` +
    `citations:\n` +
    `  - "DECtalk 4.63 ph_vset.c (speaker-dependent parameter set)"\n` +
    `  - "DECtalk 4.63 Ph_drwt02.c (F0 scaling and filter coefficients)"\n`;

  const body = dumpYaml(out, { lineWidth: 120, sortKeys: false });
  const outPath = path.join(OUT_DIR, `${voice}.yaml`);
  fs.writeFileSync(outPath, header + body, "utf8");
  console.log(`wrote ${path.relative(repoRoot, outPath)}`);
}
