import { isPlainObject, loadYamlDocumentSync } from "../yaml-loader";
import type { AffectPreset } from "./affect";
import { VQ_FIELDS } from "./vq-channels";

export interface AffectLibrary {
  presets: ReadonlyMap<string, AffectPreset>;
  variants: ReadonlyMap<string, ReadonlyMap<string, string>>;
  degree: { points: readonly (readonly [number, number])[]; citations: string[] };
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!isPlainObject(value)) throw new Error(`${label} must be an object`);
  return value;
}

function strings(value: unknown, label: string, required = true): string[] {
  if (
    !Array.isArray(value) ||
    (required && value.length === 0) ||
    !value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
  ) {
    throw new Error(`${label} must be ${required ? "a nonempty" : "an"} array of strings`);
  }
  return [...value];
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`${label} must be finite`);
  return value;
}

/** Validate the data boundary before any preset can be used. */
export function parseAffectPresets(document: unknown): AffectLibrary {
  const root = object(document, "affect presets");
  if (!Array.isArray(root.presets) || root.presets.length === 0)
    throw new Error("presets must be nonempty");
  const presets = new Map<string, AffectPreset>();
  const fields = new Set(VQ_FIELDS);
  for (const entry of root.presets) {
    const row = object(entry, "preset");
    if (typeof row.name !== "string" || row.name.trim().length === 0)
      throw new Error("preset name is required");
    const name = row.name;
    if (presets.has(name)) throw new Error(`Duplicate affect preset name: ${name}`);
    if (
      row.group !== "emotion" &&
      row.group !== "epistemic" &&
      row.group !== "pragmatic" &&
      row.group !== "speech_act" &&
      row.group !== "clinical"
    )
      throw new Error(`${name}: invalid group`);
    const dimensions = object(row.dimensions, `${name}.dimensions`);
    for (const key of Object.keys(dimensions)) {
      if (!["valence", "arousal", "dominance"].includes(key))
        throw new Error(`${name}: unknown dimension ${key}`);
    }
    const vq = object(row.vq, `${name}.vq`);
    const values: Record<string, number> = {};
    for (const [key, value] of Object.entries(vq)) {
      if (!fields.has(key)) throw new Error(`${name}: unknown voice-quality channel ${key}`);
      values[key] = finite(value, `${name}.${key}`);
    }
    if (row.note !== undefined && typeof row.note !== "string")
      throw new Error(`${name}: invalid note`);
    if (row.requiresSex !== undefined && typeof row.requiresSex !== "boolean")
      throw new Error(`${name}: invalid requiresSex`);
    if (row.engineeringEstimate !== undefined && typeof row.engineeringEstimate !== "boolean")
      throw new Error(`${name}: invalid engineeringEstimate`);
    presets.set(name, {
      name,
      group: row.group,
      dimensions: {
        valence: finite(dimensions.valence, `${name}.valence`),
        arousal: finite(dimensions.arousal, `${name}.arousal`),
        dominance: finite(dimensions.dominance, `${name}.dominance`),
      },
      vq: values,
      citations: strings(row.citations, `${name}.citations`),
      ...(typeof row.note === "string" ? { note: row.note } : {}),
      ...(typeof row.requiresSex === "boolean" ? { requiresSex: row.requiresSex } : {}),
      ...(typeof row.engineeringEstimate === "boolean"
        ? { engineeringEstimate: row.engineeringEstimate }
        : {}),
    });
  }
  const variants = new Map<string, ReadonlyMap<string, string>>();
  for (const [name, value] of Object.entries(object(root.variants, "variants"))) {
    if (presets.has(name)) throw new Error(`Variant name shadows preset: ${name}`);
    const mapping = object(value, `variants.${name}`);
    const resolved = new Map<string, string>();
    for (const sex of ["male", "female"]) {
      const target = mapping[sex];
      if (typeof target !== "string" || !presets.has(target))
        throw new Error(`${name}: invalid ${sex} variant`);
      resolved.set(sex, target);
    }
    if (Object.keys(mapping).some((key) => !resolved.has(key)))
      throw new Error(`${name}: unknown variant selector`);
    variants.set(name, resolved);
  }
  const degree = object(root.degree, "degree");
  if (!Array.isArray(degree.points) || degree.points.length < 2)
    throw new Error("degree.points requires endpoints");
  const points: [number, number][] = degree.points.map((entry: unknown) => {
    if (!Array.isArray(entry) || entry.length !== 2)
      throw new Error("degree point must be [input, output]");
    return [finite(entry[0], "degree input"), finite(entry[1], "degree output")];
  });
  for (let index = 0; index < points.length; index++) {
    const [input, output] = points[index];
    if (
      input < 0 ||
      input > 1 ||
      output < 0 ||
      output > 1 ||
      (index > 0 && input <= points[index - 1][0])
    )
      throw new Error("degree points must ascend within [0,1]");
  }
  if (points[0][0] !== 0 || points[points.length - 1][0] !== 1)
    throw new Error("degree points must cover [0,1]");
  return {
    presets,
    variants,
    degree: { points, citations: strings(degree.citations, "degree.citations", false) },
  };
}

export const AFFECT_LIBRARY = parseAffectPresets(
  loadYamlDocumentSync("/rules/affect/presets.yaml"),
);

/** Piecewise linear evaluation; the asset declares the curve and endpoint clamp values. */
export function affectDegree(value: number, curve = AFFECT_LIBRARY.degree): number {
  const points = curve.points;
  if (!Number.isFinite(value) || value <= points[0][0]) return points[0][1];
  for (let index = 1; index < points.length; index++) {
    const [right, upper] = points[index];
    const [left, lower] = points[index - 1];
    if (value <= right) return lower + ((value - left) / (right - left)) * (upper - lower);
  }
  return points[points.length - 1][1];
}
