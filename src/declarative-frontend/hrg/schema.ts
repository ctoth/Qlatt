import { isPlainObject } from "../../yaml-loader";
import { compileFeatureSchema } from "./feature-schema";
import type { FeatureSchema, HrgSchema } from "./types";

/** Authored path for the existing schema error, shared by loader and runtime. */
export class HrgSchemaError extends Error {
  constructor(
    message: string,
    readonly path: string,
    cause?: unknown,
  ) {
    super(message, { cause });
  }
}

/** Check declarations without adding request/runtime-owned features. */
export function compileHrgSchema(input: unknown): HrgSchema {
  if (!isPlainObject(input) || !isPlainObject(input.itemTypes) || !isPlainObject(input.relations)) {
    throw new HrgSchemaError(
      "E_HRG_SCHEMA_SHAPE: expected itemTypes and relations mappings",
      "schema",
    );
  }
  const itemTypes: Record<string, { features: Readonly<Record<string, FeatureSchema>> }> = {};
  for (const [itemType, itemSchema] of Object.entries(input.itemTypes)) {
    const path = `schema.itemTypes.${itemType}`;
    if (!isPlainObject(itemSchema) || !isPlainObject(itemSchema.features)) {
      throw new HrgSchemaError("E_HRG_SCHEMA_SHAPE: expected item features mapping", path);
    }
    const features: Record<string, FeatureSchema> = {};
    for (const [feature, featureSchema] of Object.entries(itemSchema.features)) {
      try {
        features[feature] = compileFeatureSchema(featureSchema);
      } catch (cause) {
        throw new HrgSchemaError(
          cause instanceof Error ? cause.message : String(cause),
          `${path}.features.${feature}`,
          cause,
        );
      }
    }
    itemTypes[itemType] = Object.freeze({ features: Object.freeze(features) });
  }
  const relations: Record<string, HrgSchema["relations"][string]> = {};
  for (const [name, relation] of Object.entries(input.relations)) {
    const path = `schema.relations.${name}`;
    if (!isPlainObject(relation) || (relation.kind !== "list" && relation.kind !== "tree")) {
      throw new HrgSchemaError("E_HRG_SCHEMA_SHAPE: expected list or tree relation", path);
    }
    if (
      !Array.isArray(relation.itemTypes) ||
      relation.itemTypes.some((type) => typeof type !== "string")
    ) {
      throw new HrgSchemaError("E_HRG_SCHEMA_SHAPE: expected itemTypes string array", path);
    }
    if (relation.itemTypes.length === 0) {
      throw new HrgSchemaError(
        `E_HRG_SCHEMA_RELATION_EMPTY: relation '${name}' requires an allowed item type`,
        path,
      );
    }
    const allowed = Object.freeze([...new Set(relation.itemTypes as string[])]);
    for (const itemType of allowed) {
      if (!Object.hasOwn(itemTypes, itemType)) {
        throw new HrgSchemaError(
          `E_HRG_SCHEMA_RELATION_ITEM_TYPE: relation '${name}' references undeclared item type '${itemType}'`,
          path,
        );
      }
    }
    relations[name] = Object.freeze({ kind: relation.kind, itemTypes: allowed });
  }
  return Object.freeze({
    itemTypes: Object.freeze(itemTypes),
    relations: Object.freeze(relations),
  });
}
