import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  const value = process.argv[i + 1];
  args.set(key.slice(2), value);
}

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const nodeBin = process.execPath;

const phrasesPath = args.get("phrases")
  ? path.resolve(args.get("phrases"))
  : path.join(repoRoot, "test", "phrase-sets", "linguistic.json");
const outDir = path.resolve(
  args.get("out-dir") ?? path.join(repoRoot, "test", "golden", "linguistic-master")
);
const baseF0 = Number(args.get("base-f0") ?? 110);
const sampleRate = Number(args.get("sample-rate") ?? 10000);
const normalize = (args.get("normalize") ?? "1") === "1";
const maxShift = Number(args.get("max-shift") ?? 128);
const qlattSourceMode = Number(args.get("qlatt-source-mode") ?? 2);
const qlattAgc = (args.get("qlatt-agc") ?? "0") === "1";
const qlattLeadTime = Number(args.get("qlatt-lead-time") ?? 0);
const qlattTailTime = Number(args.get("qlatt-tail-time") ?? 0.005);
const klattGlottal = args.get("klatt-glottal") ?? "natural";
const klattNoAgc = (args.get("klatt-no-agc") ?? "1") === "1";

if (!fs.existsSync(phrasesPath)) {
  console.error(`Phrase list not found: ${phrasesPath}`);
  process.exit(1);
}

const phrasePayload = JSON.parse(fs.readFileSync(phrasesPath, "utf8"));
const phrases = Array.isArray(phrasePayload)
  ? phrasePayload
  : phrasePayload.phrases ?? [];
if (!phrases.length) {
  console.error("No phrases found in list.");
  process.exit(1);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function run(cmd, cmdArgs, opts = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    cwd: repoRoot,
    stdio: "pipe",
    encoding: "utf8",
    ...opts,
  });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

fs.mkdirSync(outDir, { recursive: true });

const summary = [];
for (const phrase of phrases) {
  const slug = slugify(phrase);
  const phraseDir = path.join(outDir, slug);
  fs.mkdirSync(phraseDir, { recursive: true });

  const trackPath = path.join(phraseDir, "track.json");
  const trackWav = path.join(phraseDir, "track.wav");
  const qlattJson = path.join(phraseDir, "qlatt.json");
  const qlattWav = path.join(phraseDir, "qlatt.wav");
  const klattJson = path.join(phraseDir, "klatt-syn.json");
  const comparePath = path.join(phraseDir, "compare.json");

  run(nodeBin, [
    "scripts/render-phrase.mjs",
    "--phrase",
    phrase,
    "--base-f0",
    String(baseF0),
    "--sample-rate",
    String(sampleRate),
    "--out-json",
    trackPath,
    "--out-wav",
    trackWav,
  ]);

  run(nodeBin, [
    "scripts/render-qlatt-track.mjs",
    "--track-json",
    trackPath,
    "--sample-rate",
    String(sampleRate),
    "--lead-time",
    String(qlattLeadTime),
    "--tail-time",
    String(qlattTailTime),
    "--agc",
    qlattAgc ? "1" : "0",
    "--source-mode",
    String(qlattSourceMode),
    "--out-json",
    qlattJson,
    "--out-wav",
    qlattWav,
  ]);

  run(nodeBin, [
    "scripts/render-klatt-syn-track.mjs",
    "--track-json",
    trackPath,
    "--sample-rate",
    String(sampleRate),
    "--glottal",
    klattGlottal,
    "--no-agc",
    klattNoAgc ? "1" : "0",
    "--out-json",
    klattJson,
  ]);

  const compareOut = run(nodeBin, [
    "scripts/compare-renders.mjs",
    "--a",
    qlattJson,
    "--b",
    klattJson,
    "--normalize",
    normalize ? "1" : "0",
    "--max-shift",
    String(maxShift),
  ]);

  const compare = JSON.parse(compareOut || "{}");
  const entry = {
    phrase,
    slug,
    compare,
    paths: {
      track: path.relative(repoRoot, trackPath),
      qlatt: path.relative(repoRoot, qlattJson),
      klatt: path.relative(repoRoot, klattJson),
    },
  };
  fs.writeFileSync(comparePath, JSON.stringify(entry, null, 2));
  summary.push(entry);
  console.log(`${slug}: rmsError=${compare.rmsError?.toFixed(6)} shift=${compare.shift}`);
}

const summaryPath = path.join(outDir, "summary.json");
fs.writeFileSync(summaryPath, JSON.stringify({
  config: {
    phrasesPath: path.relative(repoRoot, phrasesPath),
    baseF0,
    sampleRate,
    normalize,
    maxShift,
    qlatt: {
      sourceMode: qlattSourceMode,
      agc: qlattAgc,
      leadTime: qlattLeadTime,
      tailTime: qlattTailTime,
    },
    klatt: {
      glottal: klattGlottal,
      noAgc: klattNoAgc,
    },
  },
  results: summary,
}, null, 2));

console.log(`Summary written to ${summaryPath}`);
