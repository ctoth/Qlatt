import fs from "node:fs";
import path from "node:path";
import { loadYamlDocumentSync } from "../src/yaml-loader";

type InventoryDoc = {
  base_params?: Record<string, unknown>;
  phoneme_targets?: Record<string, Record<string, unknown>>;
};

type FrontendDoc = {
  parameters?: {
    policy?: {
      speaker?: Record<string, unknown>;
    };
  };
};

type RuleFile = {
  rules?: Record<string, unknown>;
};

const REPO_ROOT = process.cwd();
const DEFAULT_DAPI_SRC = "C:/Users/Q/src/dectalk/463/dapi/src";
const FRONTEND_ROOT = path.join(
  REPO_ROOT,
  "public",
  "rules",
  "frontends",
  "dectalk-english",
);

function parseShortArray(source: string, arrayName: string): number[] {
  const pattern = new RegExp(
    `const\\s+short\\s+${arrayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\[\\]\\s*=\\s*\\{([\\s\\S]*?)\\}\\s*;`,
  );
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Array '${arrayName}' not found`);
  }
  return Array.from(match[1].matchAll(/-?\d+/g), (m) => Number(m[0]));
}

function countDiphthongPointers(values: number[]): number {
  return values.filter((value) => value < -1).length;
}

function hasAnyKey(entry: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(entry, key));
}

function countMatching(
  entries: Record<string, Record<string, unknown>>,
  predicate: (name: string, entry: Record<string, unknown>) => boolean,
): number {
  let count = 0;
  for (const [name, entry] of Object.entries(entries)) {
    if (predicate(name, entry)) count += 1;
  }
  return count;
}

function listRuleNames(doc: RuleFile): string[] {
  return Object.keys(doc.rules ?? {});
}

function readPolicyNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    value &&
    typeof value === "object" &&
    "value" in value &&
    typeof (value as { value?: unknown }).value === "number" &&
    Number.isFinite((value as { value: number }).value)
  ) {
    return (value as { value: number }).value;
  }
  return null;
}

function main(): void {
  const dapiSrc = process.argv[2] ?? DEFAULT_DAPI_SRC;
  const romPath = path.join(dapiSrc, "PH", "p_us_rom.h");
  const romSource = fs.readFileSync(romPath, "latin1");

  const usFeatb = parseShortArray(romSource, "us_featb");
  const usPlace = parseShortArray(romSource, "us_place");
  const usInhdr = parseShortArray(romSource, "us_inhdr");
  const usMindur = parseShortArray(romSource, "us_mindur");
  const usBurdr = parseShortArray(romSource, "us_burdr");
  const usMaltar = parseShortArray(romSource, "us_maltar");
  const usFemtar = parseShortArray(romSource, "us_femtar");
  const usMaldip = parseShortArray(romSource, "us_maldip");
  const usFemdip = parseShortArray(romSource, "us_femdip");
  const usPtram = parseShortArray(romSource, "us_ptram");
  const usBegtyp = parseShortArray(romSource, "us_begtyp");
  const usEndtyp = parseShortArray(romSource, "us_endtyp");
  const usMalamp = parseShortArray(romSource, "us_malamp");
  const usPhoneCount = usInhdr.length;

  const inventory = loadYamlDocumentSync<InventoryDoc>(
    path.join(FRONTEND_ROOT, "inventory.yaml"),
  );
  const frontend = loadYamlDocumentSync<FrontendDoc>(
    path.join(FRONTEND_ROOT, "frontend.yaml"),
  );
  const structural = loadYamlDocumentSync<RuleFile>(
    path.join(FRONTEND_ROOT, "phases", "structural.yaml"),
  );
  const duration = loadYamlDocumentSync<RuleFile>(
    path.join(FRONTEND_ROOT, "phases", "duration.yaml"),
  );
  const formant = loadYamlDocumentSync<RuleFile>(
    path.join(FRONTEND_ROOT, "phases", "formant.yaml"),
  );
  const prosody = loadYamlDocumentSync<RuleFile>(
    path.join(FRONTEND_ROOT, "phases", "prosody.yaml"),
  );

  const targets = inventory.phoneme_targets ?? {};
  const names = Object.keys(targets);
  const stressedVowels = names.filter((name) => /[01]$/.test(name)).length;
  const releaseTokens = names.filter((name) => name.includes("_REL")).length;
  const aspirationTokens = names.filter((name) => name.includes("_ASP")).length;

  const explicitMinDur = countMatching(
    targets,
    (_name, entry) => Object.prototype.hasOwnProperty.call(entry, "minimumDuration"),
  );
  const explicitBurstDur = countMatching(
    targets,
    (_name, entry) =>
      hasAnyKey(entry, ["burst", "burstDuration", "burst_duration", "releaseDuration"]),
  );
  const explicitCoreFormants = countMatching(
    targets,
    (_name, entry) => hasAnyKey(entry, ["F1", "F2", "F3", "B1", "B2", "B3", "AV"]),
  );
  const explicitHighFormants = countMatching(
    targets,
    (_name, entry) => hasAnyKey(entry, ["F4", "F5", "F6", "F7", "F8", "B4", "B5", "B6", "B7", "B8"]),
  );
  const explicitParallelSpectrum = countMatching(
    targets,
    (_name, entry) => hasAnyKey(entry, ["AB", "A1", "A2", "A3", "A4", "A5", "A6"]),
  );
  const exactFeatureMirrors = countMatching(
    targets,
    (_name, entry) => hasAnyKey(entry, ["features", "place", "featb_raw", "place_raw"]),
  );

  const formantRuleNames = listRuleNames(formant);
  const structuralRuleNames = listRuleNames(structural);
  const durationRuleNames = listRuleNames(duration);
  const prosodyRuleNames = listRuleNames(prosody);

  const hasObstruentSpectrumRule = formantRuleNames.includes(
    "dectalk_obstruent_parallel_amplitudes",
  );
  const hasStopReleaseRules = structuralRuleNames.some((name) =>
    name.startsWith("dectalk_insert_") && name.includes("stop_release"),
  );
  const hasFullSourceSmoothingRules = formantRuleNames.some((name) =>
    /smooth|backward|carryover|th|dh/i.test(name),
  );

  const speakerPolicy = frontend.parameters?.policy?.speaker ?? {};
  const speakerFieldCount = Object.keys(speakerPolicy).length;
  const baseF0Hz = readPolicyNumber((speakerPolicy as Record<string, unknown>).base_f0_hz);

  const lines: string[] = [];
  lines.push("DECtalk Frontend Audit");
  lines.push("");
  lines.push("Source tables:");
  lines.push(`- us_featb/us_place: ${usFeatb.length} total feature rows, ${usPlace.length} place rows (${usPhoneCount} US phones consume the first ${usPhoneCount})`);
  lines.push(`- us_inhdr/us_mindur/us_burdr: ${usInhdr.length}/${usMindur.length}/${usBurdr.length} entries`);
  lines.push(`- us_maltar/us_femtar: ${usMaltar.length}/${usFemtar.length} shorts (${usMaltar.length / usPhoneCount}/${usFemtar.length / usPhoneCount} blocks)`);
  lines.push(`- us_maldip/us_femdip: ${usMaldip.length}/${usFemdip.length} shorts`);
  lines.push(`- us_ptram/us_begtyp/us_endtyp/us_malamp: ${usPtram.length}/${usBegtyp.length}/${usEndtyp.length}/${usMalamp.length}`);
  lines.push(`- male target diphthong pointers in us_maltar: ${countDiphthongPointers(usMaltar)}`);
  lines.push("");
  lines.push("Current declarative frontend:");
  lines.push(`- phoneme_targets: ${names.length} entries`);
  lines.push(`- stressed vowel variants: ${stressedVowels}`);
  lines.push(`- stop release tokens: ${releaseTokens}`);
  lines.push(`- stop aspiration tokens: ${aspirationTokens}`);
  lines.push(`- entries with minimumDuration: ${explicitMinDur}`);
  lines.push(`- entries with explicit burst-duration field: ${explicitBurstDur}`);
  lines.push(`- entries with core F1/F2/F3/B1/B2/B3/AV targets: ${explicitCoreFormants}`);
  lines.push(`- entries with explicit F4+ targets: ${explicitHighFormants}`);
  lines.push(`- entries with explicit A*/AB spectrum in inventory: ${explicitParallelSpectrum}`);
  lines.push(`- entries preserving raw DECtalk feature/place tables: ${exactFeatureMirrors}`);
  lines.push(`- structural rules: ${structuralRuleNames.length}`);
  lines.push(`- duration rules: ${durationRuleNames.length}`);
  lines.push(`- formant rules: ${formantRuleNames.length}`);
  lines.push(`- prosody rules: ${prosodyRuleNames.length}`);
  lines.push(`- speaker policy fields: ${speakerFieldCount}${baseF0Hz != null ? ` (base_f0_hz=${baseF0Hz})` : ""}`);
  lines.push("");
  lines.push("Likely gaps:");

  if (explicitBurstDur === 0) {
    lines.push("- `us_burdr[]` is not represented as an explicit per-token declarative field. Stop release timing is synthesized procedurally in structural rules, so the original burst table is not directly auditable in the frontend data.");
  }

  if (countDiphthongPointers(usMaltar) > 0) {
    lines.push("- `us_maldip[]`/`us_femdip[]` diphthong trajectories are still flattened into static inventory targets. The frontend does not preserve the original trajectory tables as declarative path data.");
  }

  if (explicitHighFormants === 0) {
    lines.push("- The inventory does not carry explicit per-phoneme F4+ targets. High-formant coloration is mostly generic runtime defaulting right now, which leaves consonant identity under-specified.");
  }

  if (!hasObstruentSpectrumRule) {
    lines.push("- `us_ptram[]`/`us_malamp[]` obstruent spectra are not ported at all.");
  } else {
    lines.push("- `us_ptram[]`/`us_malamp[]` are only partially ported. There is one declarative spectrum rule, but it currently covers fricatives/affricates only; stop-release/burst class selection from the same table family still needs explicit declarative coverage.");
  }

  if (!hasStopReleaseRules) {
    lines.push("- Stop release insertion from `p_us_st1.c` is missing.");
  } else {
    lines.push("- Stop release insertion exists, but it is still a hand-ported approximation of `p_us_st1.c`. It should be audited against the original burst/VOT tables and source-amplitude carryover paths, not treated as complete.");
  }

  if (!hasFullSourceSmoothingRules) {
    lines.push("- The formant phase does not yet mirror most of `ph_setar.c` / `p_us_st1.c` dynamic target logic (backward smoothing, source-amplitude carryover, TH/DH special handling, boundary-value interpolation). Current formant rules are still extremely thin.");
  }

  if (exactFeatureMirrors === 0) {
    lines.push("- `us_featb[]`/`us_place[]` are not preserved 1:1 in the declarative inventory. We keep coarse type/feature booleans, but not the original feature-table surface for rule parity auditing.");
  }

  if (speakerFieldCount > 0) {
  lines.push("- The frontend has only a single baked speaker policy surface (effectively Paul defaults). DECtalk’s wider speaker table family is not yet exposed as a declarative speaker roster.");
  }

  lines.push("");
  lines.push("Concrete checklist (table -> target):");
  lines.push("- `us_maldip[]` / `us_femdip[]` -> extract with `scripts/extract-dectalk-diphthong-trajectories.ts` -> store trajectory payloads in `public/rules/frontends/dectalk-english/inventory.yaml` -> preserve through `src/declarative-frontend/inventory.ts` -> consume as timed declarative windows in `public/rules/frontends/dectalk-english/phases/structural.yaml`.");
  lines.push("- `us_burdr[]` -> reuse `C:/Users/Q/src/dectalk/463/scripts/extract_durations.py` semantics -> add explicit `burstDuration` fields in `public/rules/frontends/dectalk-english/inventory.yaml` -> read them in `public/rules/frontends/dectalk-english/phases/structural.yaml` instead of burying release timing in formulas only.");
  lines.push("- `us_ptram[]` / `us_malamp[]` -> extract with `scripts/extract-dectalk-obstruent-amps.ts` -> keep fricative and stop-burst spectra declarative in `public/rules/frontends/dectalk-english/phases/formant.yaml` and `public/rules/frontends/dectalk-english/phases/structural.yaml`.");
  lines.push("- `us_featb[]` / `us_place[]` -> reuse `C:/Users/Q/src/dectalk/463/scripts/extract_features.py` -> mirror raw feature/place metadata into `public/rules/frontends/dectalk-english/inventory.yaml` so future rules can match the original DECtalk feature surface directly.");
  lines.push("- speaker tables (`ph_vset.c` / extracted speaker data) -> reuse `C:/Users/Q/src/dectalk/463/scripts/extract_speakers.py` and `convert_speakers.py` -> expose a declarative speaker roster in `public/rules/frontends/dectalk-english/frontend.yaml`.");
  lines.push("");
  lines.push("Priority porting targets:");
  lines.push("1. Port the original diphthong trajectory tables (`us_maldip`) into declarative vowel paths/control windows instead of static first-point vowels.");
  lines.push("2. Port stop-burst spectra from the same `us_ptram/us_malamp` family used for fricatives so releases are table-driven instead of approximated.");
  lines.push("3. Port more of `ph_setar.c` / `p_us_st1.c` target-smoothing logic into declarative formant/source rules; the current formant phase only has three rules.");
  lines.push("4. Decide whether `us_burdr[]` should become an explicit inventory field so burst timing is directly traceable instead of hidden inside procedural splices.");
  lines.push("5. Add a declarative speaker roster if we want parity beyond Paul.");

  console.log(lines.join("\n"));
}

main();
