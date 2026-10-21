import { isPlainObject } from "../../yaml-loader";
import type { FeatureSchema } from "./types";

/** Compile authored shapes and typed host schemas through the same frozen representation. */
export function compileFeatureSchema(source: unknown): FeatureSchema {
  if (!isPlainObject(source)) throw new Error("E_HRG_SCHEMA_SHAPE: expected a feature schema object");
  const fail = (detail: string): never => {
    throw new Error(`E_HRG_SCHEMA_SHAPE: ${detail}`);
  };
  switch (source.kind) {
    case "string":
      if (
        source.values !== undefined &&
        (!Array.isArray(source.values) || source.values.some((v) => typeof v !== "string"))
      )
        fail("string values must be strings");
      return Object.freeze({
        kind: "string",
        ...(source.values ? { values: Object.freeze([...(source.values as string[])]) } : {}),
      });
    case "number":
    case "boolean":
    case "null":
      return Object.freeze({ kind: source.kind });
    case "literal":
      if (source.value !== null && !["string", "boolean", "number"].includes(typeof source.value))
        fail("literal value must be primitive");
      if (typeof source.value === "number" && !Number.isFinite(source.value))
        fail("literal number must be finite");
      return Object.freeze({ kind: "literal", value: source.value as string | boolean | number | null });
    case "array":
      return Object.freeze({ kind: "array", items: compileFeatureSchema(source.items) });
    case "object": {
      if (!isPlainObject(source.fields)) fail("object fields must be a mapping");
      const fields = Object.fromEntries(
        Object.entries(source.fields as Record<string, unknown>).map(([name, shape]) => [
          name,
          compileFeatureSchema(shape),
        ]),
      );
      if (
        source.optional !== undefined &&
        (!Array.isArray(source.optional) || source.optional.some((v) => typeof v !== "string"))
      )
        fail("optional fields must be strings");
      const optional = source.optional ? Object.freeze([...(source.optional as string[])]) : undefined;
      if (optional?.some((name) => !Object.hasOwn(fields, name))) {
        throw new Error(
          "E_HRG_SCHEMA_OPTIONAL_FIELD: optional fields must be declared object fields",
        );
      }
      return Object.freeze({
        kind: "object",
        fields: Object.freeze(fields),
        ...(optional ? { optional } : {}),
        ...(source.additional !== undefined
          ? { additional: compileFeatureSchema(source.additional) }
          : {}),
      });
    }
    case "union":
      if (!Array.isArray(source.variants)) fail("union variants must be an array");
      if ((source.variants as unknown[]).length === 0) {
        throw new Error("E_HRG_SCHEMA_UNION_EMPTY: a feature union requires at least one variant");
      }
      return Object.freeze({
        kind: "union",
        variants: Object.freeze((source.variants as unknown[]).map(compileFeatureSchema)),
      });
    default:
      return fail(`unknown feature kind '${String(source.kind)}'`);
  }
}
