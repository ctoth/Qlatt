// Holmes, Mattingly & Shearme 1964 Appendix 1, pp.140–142.
// Reproducible transcription into Qlatt's existing consonant inventory. This
// changes boundary metadata only; modern steady-state targets are retained.
import { readFileSync, writeFileSync } from "node:fs";
import { load } from "js-yaml";

const path = "public/rules/frontends/qlatt-english/inventory.yaml";
const text = readFileSync(path, "utf8");
const inventory = load(text);
const newline = text.includes("\r\n") ? "\r\n" : "\n";
// rank, fixed F1/F2/F3 (Hz), F1/F2 proportion, F3 proportion, external/internal ms.
const rows = {
  P: [23, 110, 350, 0, 0.5, 1, 20, 20],
  T: [23, 110, 950, 2680, 0.5, 0, 20, 20],
  K: [23, 110, 1550, 1580, 0.5, 0.5, 30, 30],
  B: [26, 110, 350, 0, 0.5, 1, 20, 20],
  D: [26, 110, 950, 2680, 0.5, 0, 20, 20],
  G: [26, 110, 1550, 1580, 0.5, 0.5, 30, 30],
  M: [15, 110, 350, 0, 0.5, 1, 30, 0],
  N: [15, 110, 950, 2680, 0.5, 0, 30, 0],
  NG: [15, 110, 1550, 1580, 0.5, 0.5, 30, 0],
  F: [18, 170, 350, 980, 0.5, 0.5, 30, 20],
  TH: [18, 170, 1190, 2680, 0.5, 0, 30, 20],
  S: [18, 170, 950, 0, 0.5, 1, 30, 20],
  SH: [18, 170, 1190, 0, 0.5, 1, 30, 20],
  HH: [9, 0, 0, 0, 1, 1, 0, 70],
  V: [20, 170, 350, 980, 0.5, 0.5, 30, 20],
  DH: [20, 170, 1190, 0, 0.5, 1, 30, 20],
  Z: [20, 170, 950, 0, 0.5, 1, 30, 20],
  ZH: [20, 170, 1190, 0, 0.5, 1, 30, 20],
  L: [11, 230, 710, 1220, 0.5, 0.5, 60, 0],
  R: [10, 0, 590, 740, 0.5, 0.5, 50, 50],
  W: [10, 50, 350, 980, 0.5, 0.5, 40, 40],
  Y: [10, 110, 1190, 1460, 0.5, 0.5, 40, 40],
};
const assignments = new Map(
  Object.keys(rows)
    .filter((key) => inventory.phoneme_targets[key])
    .map((key) => [key, key]),
);
for (const phone of ["P", "T", "K", "B", "D", "G"]) {
  assignments.set(`${phone}_CL`, phone);
  assignments.set(`${phone}_REL`, phone);
}
for (const phone of ["P", "T", "K"]) assignments.set(`${phone}_ASP`, phone);
assignments.set("CH_CL", "T");
assignments.set("JH_CL", "D");
assignments.set("CH", "SH");
assignments.set("JH", "ZH");
// The RP table does not contain DX or a glottal-stop element. Preserve their
// existing lowering and its diagnostic fallback instead of inventing values.
const replacements = [];
for (const [phone, source] of assignments) {
  const target = inventory.phoneme_targets[phone];
  if (!target) throw new Error(`Missing inventory target ${phone}`);
  if (target.boundary_fixed) continue;
  const [rank, f1, f2, f3, p12, p3, external, internal] = rows[source];
  const burst = phone.endsWith("_REL");
  const e3 = source === "P" || source === "B" ? 0 : external;
  const i3 = phone === "T_ASP" ? 0 : internal;
  const headers = [
    ...text.matchAll(new RegExp(`^  (?:${phone}|'${phone}'|"${phone}"):\\r?\\n`, "gm")),
  ];
  if (headers.length !== 1) throw new Error(`Nonunique anchor ${phone}`);
  const anchor = headers[0][0];
  const lines = [
    `    # Holmes et al. 1964 Appendix 1; ${source} mapped to ${phone}.`,
    `    boundary_rank: ${burst ? 29 : rank}`,
    `    boundary_fixed: {F1: ${f1}, F2: ${f2}, F3: ${f3}}`,
    `    boundary_proportion: {F1: ${p12}, F2: ${p12}, F3: ${p3}}`,
    `    boundary_external_ms: {F1: ${burst ? 0 : external}, F2: ${burst ? 0 : external}, F3: ${burst ? 0 : e3}}`,
    `    boundary_internal_ms: {F1: ${burst ? 0 : internal}, F2: ${burst ? 0 : internal}, F3: ${burst ? 0 : i3}}`,
    "    boundary_citations:",
    '      - "Holmes, Mattingly & Shearme 1964 Appendix 1 pp.140–142"',
  ];
  replacements.push([anchor, anchor + lines.join(newline) + newline]);
}
let updated = text;
for (const [before, after] of replacements) updated = updated.replace(before, after);
load(updated); // Validate the complete candidate before writing any bytes.
writeFileSync(path, updated, "utf8");
console.log(`Holmes inventory targets updated: ${replacements.length}`);
