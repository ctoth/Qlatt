import { describe, expect, it } from "vitest";
import { loadYamlSourceSync, parseYamlString } from "../src/yaml-loader";

type ControlScoreSchemaSpec = {
  version: string;
  token_fields: Record<string, unknown>;
  f0_event_fields: Record<string, unknown>;
};

describe("control-score schema", () => {
  const schema = parseYamlString<ControlScoreSchemaSpec>(
    loadYamlSourceSync("/rules/control-score.yaml"),
    "/rules/control-score.yaml",
  );

  it("exists and declares version v1", () => {
    expect(schema.version).toBe("v1");
  });

  it("declares required top-level token fields", () => {
    expect(Object.keys(schema.token_fields)).toEqual(
      expect.arrayContaining(["id", "phoneme", "type", "prosody", "alignment", "duration"]),
    );
  });

  it("declares required F0 event fields", () => {
    expect(Object.keys(schema.f0_event_fields)).toEqual(
      expect.arrayContaining(["id", "value_hz"]),
    );
  });
});
