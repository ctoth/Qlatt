import { isPlainObject, loadYamlDocumentSync } from "../yaml-loader";

export interface VoiceQualityChannel {
  readonly channel: string;
  readonly algebra: "mul" | "add";
  readonly unit: string;
  readonly neutral: number;
  readonly backend_param: string;
  readonly citations: readonly string[];
  readonly projection: "param" | "special";
  readonly floor?: number;
  readonly apply_track: boolean;
}

/** Validate before any consumer derives its schema, neutral vector, or projection. */
export function parseVoiceQualityChannels(document: unknown): readonly VoiceQualityChannel[] {
  const fail = (message: string): never => {
    throw new Error(`E_VQ_CHANNEL_SCHEMA: ${message}`);
  };
  if (
    !isPlainObject(document) ||
    !Array.isArray(document.channels) ||
    document.channels.length === 0
  ) {
    return fail("channels must be a non-empty array");
  }
  const names = new Set<string>();
  return Object.freeze(
    document.channels.map((entry: unknown) => {
      if (!isPlainObject(entry)) return fail("channel must be an object");
      const { channel, algebra, unit, neutral, backend_param, citations, floor } = entry;
      if (typeof channel !== "string" || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(channel)) {
        return fail("channel must be an identifier");
      }
      if (names.has(channel)) return fail(`duplicate channel '${channel}'`);
      names.add(channel);
      if (algebra !== "mul" && algebra !== "add")
        return fail(`${channel}: algebra must be mul or add`);
      if (typeof neutral !== "number" || !Number.isFinite(neutral))
        return fail(`${channel}: neutral must be finite`);
      if (neutral !== (algebra === "mul" ? 1 : 0))
        return fail(`${channel}: neutral must be the algebra identity`);
      if (typeof unit !== "string" || !unit.trim()) return fail(`${channel}: unit is required`);
      if (typeof backend_param !== "string" || !backend_param.trim())
        return fail(`${channel}: backend_param is required`);
      if (
        !Array.isArray(citations) ||
        citations.length === 0 ||
        !citations.every(
          (citation: unknown) => typeof citation === "string" && citation.trim().length > 0,
        )
      ) {
        return fail(`${channel}: citations must contain a non-empty citation`);
      }
      if (floor !== undefined && (typeof floor !== "number" || !Number.isFinite(floor))) {
        return fail(`${channel}: floor must be finite`);
      }
      const projection = entry.projection ?? "param";
      if (projection !== "param" && projection !== "special")
        return fail(`${channel}: invalid projection`);
      const apply_track = entry.apply_track ?? true;
      if (typeof apply_track !== "boolean") return fail(`${channel}: apply_track must be boolean`);
      return Object.freeze({
        channel,
        algebra,
        unit,
        neutral,
        backend_param,
        citations: Object.freeze([...citations] as string[]),
        projection,
        floor,
        apply_track,
      });
    }),
  );
}

export const VQ_CHANNELS = parseVoiceQualityChannels(
  loadYamlDocumentSync("/rules/policy/vq-channels.yaml"),
);
export const VQ_FIELDS: readonly string[] = Object.freeze(VQ_CHANNELS.map((row) => row.channel));
export const VQ_NEUTRAL: Readonly<Record<string, number>> = Object.freeze(
  Object.fromEntries(VQ_CHANNELS.map((row) => [row.channel, row.neutral])),
);
export const VQ_MULTIPLICATIVE_FIELDS: readonly string[] = Object.freeze(
  VQ_CHANNELS.filter((row) => row.algebra === "mul").map((row) => row.channel),
);
export const VQ_PARAM_CHANNELS = Object.freeze(
  VQ_CHANNELS.filter((row) => row.projection === "param"),
);
