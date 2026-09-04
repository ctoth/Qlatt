import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const baselinePath = path.join(repoRoot, "public", "experiments", "klatt80-baseline", "graph.yaml");
const outputPath = path.join(repoRoot, "public", "experiments", "dectalk-english", "graph.yaml");

function requireReplace(
  source: string,
  pattern: RegExp,
  replacement: string,
  label: string,
): string {
  if (!pattern.test(source)) {
    throw new Error(`Failed to find expected graph section for ${label}`);
  }
  return source.replace(pattern, replacement);
}

let graph = readFileSync(baselinePath, "utf8");

graph = requireReplace(graph, /^name: klatt80-synth$/m, "name: dectalk-463-synth", "graph name");

graph = requireReplace(
  graph,
  /description: \|\r?\n {4}Klatt 80 formant synthesizer topology per Klatt \(1980\)\.\r?\n {4}Conditional routing \(source selection, cascade\/parallel switching\)\r?\n {4}is implemented via gain-gated paths with CEL expressions in semantics\.yaml\.\r?\n/m,
  [
    "description: |",
    "    DECtalk 4.63-oriented cascade/parallel formant topology.",
    "    Derived from the klatt80-baseline graph, but trimmed to the core",
    "    DECtalk-style path: impulse-first source defaults, eight-formant bank,",
    "    and direct output summing without the baseline reconstruction filter.",
    "    Citations: Klatt 1980; DECtalk 4.63 COEWAV/PARWAV descendants.",
    "",
  ].join("\n"),
  "meta description",
);

graph = requireReplace(
  graph,
  / {6}# F7-F10: Higher formants with both cascade and parallel routing\.\r?\n {6}# Cascade: shapes voiced speech spectrum \(though contribution is small due to cascade attenuation\)\.\r?\n {6}# Parallel: shapes fricative\/burst spectra above 6 kHz — \/f\/ peaks ~8\.5 kHz, \/theta\/ ~7\.5 kHz\.\r?\n {6}# A7-A10 default to 0; frontend rules must supply non-zero values for audible parallel output\.\r?\n {6}# Fant neutral model spacing \(1000 Hz from F6\), Rabiner \(1968\) Q-factor bandwidths\.\r?\n/,
  [
    "      # F7-F8: Keep the first two high-formant slots for fricative coloration.",
    "      # Engineering choice: the DECtalk experiment stays on the core eight-band",
    "      # path here so we do not inherit the full ten-formant baseline voicing tail.",
    "      # Citations: Klatt 1980 cascade/parallel topology;",
    "      # DECtalk 4.63 COEWAV/PARWAV family; Rabiner (1968) Q-factor bandwidths.",
    "",
  ].join("\n"),
  "high-formant comment block",
);

graph = requireReplace(
  graph,
  / {6}- index: 9\r?\n {8}freqRange: \[7000, 10000\]\r?\n {8}freqDefault: 8500\r?\n {8}bwRange: \[500, 5000\]\r?\n {8}bwDefault: 2125\r?\n {8}parallelSource: parallelFricGain\r?\n {8}ndbScale: -83\r?\n {8}sign: 1\r?\n {8}# Rabiner \(1968\) Q=4; parallel source: frication only \(same as F5-F6\)\r?\n {6}- index: 10\r?\n {8}freqRange: \[8000, 12000\]\r?\n {8}freqDefault: 9500\r?\n {8}bwRange: \[1000, 8000\]\r?\n {8}bwDefault: 4750\r?\n {8}parallelSource: parallelFricGain\r?\n {8}ndbScale: -84\r?\n {8}sign: -1\r?\n {8}# Rabiner \(1968\) Q=2; parallel source: frication only \(same as F5-F6\)\r?\n/m,
  "",
  "remove F9/F10",
);

graph = requireReplace(
  graph,
  / {2}# Klatt \(1980\) Fig\. 1 and Appendix A place an external 5 kHz low-pass\r?\n {2}# after the D\/A converter\. This dedicated DSP node models that output stage\.\r?\n {2}outputLp:\r?\n {4}type: reconstruction-filter\r?\n\r?\n/m,
  [
    "  # Direct output sum for the DECtalk experiment.",
    "  # Engineering choice: keep the summed source/cascade/parallel signal visible",
    "  # without the baseline reconstruction-filter stage while we align the core",
    "  # cascade/parallel path to DECtalk's actual output behavior.",
    "",
  ].join("\n"),
  "remove reconstruction filter node",
);

graph = requireReplace(
  graph,
  / {2}# ---------------------------------------------------------------------------\r?\n {2}# Output chain\r?\n {2}# ---------------------------------------------------------------------------\r?\n {2}- \[outputSum, outputLp\]\r?\n {2}- \[outputLp, masterGain\]\r?\n {2}- \[masterGain, outputGain\]\r?\n/m,
  [
    "  # ---------------------------------------------------------------------------",
    "  # Output chain",
    "  # ---------------------------------------------------------------------------",
    "  - [outputSum, masterGain]",
    "  - [masterGain, outputGain]",
    "",
  ].join("\n"),
  "replace output chain",
);

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, graph);

console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
