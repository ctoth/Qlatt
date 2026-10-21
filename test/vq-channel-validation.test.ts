import { expect, it } from "vitest";
import { parseVoiceQualityChannels } from "../src/input/vq-channels";
import { isPlainObject, loadYamlDocumentSync } from "../src/yaml-loader";

it.each([
  ["algebra", undefined],
  ["algebra", "invalid"],
  ["neutral", undefined],
  ["neutral", Number.NaN],
  ["neutral", 99],
  ["citations", undefined],
  ["citations", []],
  ["citations", [""]],
  ["unit", ""],
  ["backend_param", ""],
] as const)("rejects invalid %s when parsing the selected resource (%s)", (field, value) => {
  const document = loadYamlDocumentSync("/rules/policy/vq-channels.yaml");
  if (!isPlainObject(document) || !Array.isArray(document.channels)) {
    throw new Error("expected channels document");
  }
  const channels = document.channels;
  const first: unknown = channels[0];
  if (!isPlainObject(first)) throw new Error("expected channel record");
  expect(first[field]).not.toEqual(value);
  expect(() =>
    parseVoiceQualityChannels({
      ...document,
      channels: [{ ...first, [field]: value }, ...channels.slice(1)],
    }),
  ).toThrow("E_VQ_CHANNEL_SCHEMA");
});
