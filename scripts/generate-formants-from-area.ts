/** Offline only. See docs/area-function-formants.md for model limits and usage. */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { dump, load } from "js-yaml";
import { z } from "zod";
import { parseInventorySpec } from "../src/declarative-frontend/inventory.ts";
import { resolveSpeakerProfile } from "../src/speaker-profile.ts";
import { deriveFormants, MODEL_ID, scaleGeometry } from "./area-formants.ts";

const citations = z.array(z.string().trim().min(1)).min(1);
const positive = z.number().finite().positive();
export const areaDocumentSchema = z.object({
  version: z.literal("v1"),
  citations,
  section_length_cm: positive,
  pharynx_fraction: z.number().gt(0).lt(1),
  pharynx_fraction_citation: z.string().trim().min(1),
  model: z.object({
    sound_speed_cm_s: positive,
    attenuation_neper: positive,
    lip_end_correction: z.number().finite().nonnegative(),
    citations,
  }),
  vowels: z
    .record(
      z.string().min(1),
      z.object({
        inventory_key: z.string().min(1),
        areas_cm2: z.array(positive).min(1),
        peterson_barney_hz: z.tuple([positive, positive, positive]).nullable(),
      }),
    )
    .refine((vowels) => Object.keys(vowels).length > 0, "at least one area function is required"),
});

export function generate(
  areaSource: string,
  inventorySource: string,
  sourcePath: string,
  overrides: Record<string, number> = {},
) {
  const data = areaDocumentSchema.parse(load(areaSource));
  const inventory = parseInventorySpec(inventorySource);
  const resolved = resolveSpeakerProfile({ speakerOverride: overrides });
  const speaker = Object.fromEntries(
    ["tract_length_scale", "pharynx_scale", "mouth_scale"].map((key) => [key, resolved[key]]),
  );
  for (const [key, value] of Object.entries(overrides)) {
    if (!(key in speaker) || !Number.isFinite(value) || value <= 0)
      throw new Error(`invalid offline speaker scale: ${key}`);
  }
  // Normalize checkout line endings so Windows and Linux identify the same source.
  const sourceHash = createHash("sha256").update(areaSource.replace(/\r\n/g, "\n")).digest("hex");
  const inventoryHash = createHash("sha256")
    .update(inventorySource.replace(/\r\n/g, "\n"))
    .digest("hex");
  const allCitations = [
    ...data.citations,
    ...data.model.citations,
    data.pharynx_fraction_citation,
    "Nordstrom 1977 (1975 report), experiment 2 (regional length and area scaling)",
  ];
  const targets: Record<string, Record<string, unknown>> = {};
  const rows: string[] = [];
  const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(1));
  for (const [symbol, vowel] of Object.entries(data.vowels)) {
    const original = inventory.phoneme_targets[vowel.inventory_key];
    if (!original) throw new Error(`inventory target ${vowel.inventory_key} is absent`);
    if (targets[vowel.inventory_key])
      throw new Error(`duplicate inventory target ${vowel.inventory_key}`);
    const geometry = scaleGeometry({ ...data, areas_cm2: vowel.areas_cm2 }, speaker);
    const formants = deriveFormants(geometry, data.model);
    const generated: Record<string, unknown> = {
      derived_from: "area_function",
      area_function: {
        source: `${sourcePath}#${symbol}`,
        source_sha256: sourceHash,
        model: MODEL_ID,
        model_settings: data.model,
        speaker,
        tract_length_cm: geometry.reduce((sum, s) => sum + s.length_cm, 0),
        pharynx_fraction: data.pharynx_fraction,
        citations: allCitations,
      },
    };
    formants.forEach((formant, index) => {
      const fKey = `F${index + 1}`,
        bKey = `B${index + 1}`;
      generated[fKey] = Number(formant.frequency_hz.toFixed(2));
      generated[bKey] = Number(formant.bandwidth_hz.toFixed(2));
      const baselineF = original[fKey] ?? inventory.base_params[fKey];
      const baselineB = original[bKey] ?? inventory.base_params[bKey];
      if (
        typeof baselineF !== "number" ||
        !Number.isFinite(baselineF) ||
        typeof baselineB !== "number" ||
        !Number.isFinite(baselineB)
      )
        throw new Error(`invalid comparison parameter for ${vowel.inventory_key} ${fKey}/${bKey}`);
      const pb = vowel.peterson_barney_hz?.[index] ?? null;
      rows.push(
        `| ${symbol} (${vowel.inventory_key}) | ${index + 1} | ${fmt(formant.frequency_hz)} | ${fmt(baselineF)} | ${fmt(formant.frequency_hz - baselineF)} | ${fmt(pb)} | ${fmt(pb === null ? null : formant.frequency_hz - pb)} | ${fmt(formant.bandwidth_hz)} | ${fmt(baselineB)} | ${fmt(formant.bandwidth_hz - baselineB)} |`,
      );
    });
    targets[vowel.inventory_key] = generated;
  }
  const report = [
    "# Area-function formant comparison",
    "",
    `Model: ${MODEL_ID}. Speaker: ${JSON.stringify(speaker)}.`,
    "",
    `Geometry: ${sourcePath}; SHA-256 ${sourceHash}.`,
    `Inventory SHA-256: ${inventoryHash}.`,
    "",
    "All values and signed differences are Hz (generated minus reference). P&B = Peterson & Barney adult male means. Missing F4, /o/ and /l/ P&B comparisons are shown as —. /l/ is a lateral control. OW is compared to the inventory's static target, not its trajectory.",
    "",
    "Reduced wave-reflection model: empirical distributed attenuation and lip end correction; no yielding-wall dynamics, radiation resistance, glottal damping or side branches. F and B come from complex resonance poles (B = twice the imaginary frequency), not spectral peak widths. Bandwidths are model predictions, not Story measurements. No shipped targets are changed.",
    "",
    "| Phone (target) | n | Generated Fn | Inventory Fn | ΔFn | P&B Fn | ΔP&B | Generated Bn | Inventory Bn | ΔBn |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...rows,
    "",
    "Sources:",
    "",
    ...allCitations.map((c) => `- ${c}`),
    "",
  ].join("\n");
  return {
    inventory: dump({ phoneme_targets: targets }, { lineWidth: 110, noRefs: true }),
    report,
  };
}

export function main(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      areas: { type: "string", default: "data/area-functions/story-1996.yaml" },
      inventory: { type: "string", default: "public/rules/frontends/qlatt-english/inventory.yaml" },
      speaker: { type: "string" },
      out: { type: "string" },
      report: { type: "string" },
    },
  });
  if (!values.out || !values.report)
    throw new Error("--out <inventory-fragment.yaml> and --report <comparison.md> are required");
  const inputPaths = [
    values.areas,
    values.inventory,
    ...(values.speaker ? [values.speaker] : []),
  ].map((p) => resolve(p));
  if (
    resolve(values.out) === resolve(values.report) ||
    [values.out, values.report].some((p) => inputPaths.includes(resolve(p)))
  )
    throw new Error("outputs must be distinct from each other and all inputs");
  const speaker = values.speaker
    ? z.record(z.string(), z.number().finite()).parse(load(readFileSync(values.speaker, "utf8")))
    : {};
  const result = generate(
    readFileSync(values.areas, "utf8"),
    readFileSync(values.inventory, "utf8"),
    values.areas,
    speaker,
  );
  writeFileSync(values.out, result.inventory);
  writeFileSync(values.report, result.report);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`E_AREA_FORMANTS: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
