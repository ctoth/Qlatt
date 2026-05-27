import { describe, expect, it } from "vitest";
import { loadYamlSourceSync, parseYamlString } from "../src/yaml-loader";

type ControlScoreSchemaSpec = {
  version: string;
  top_level_sections: Record<string, unknown>;
  segment_fields: Record<string, unknown>;
  timeline_mark_fields: Record<string, unknown>;
  timed_control_fields: Record<string, unknown>;
  f0_point_fields: Record<string, unknown>;
  f0_layer_command_fields: Record<string, unknown>;
  global_overlay_fields: Record<string, unknown>;
  lowering_ref_fields: Record<string, unknown>;
};

describe("control-score schema", () => {
  const schema = parseYamlString<ControlScoreSchemaSpec>(
    loadYamlSourceSync("/rules/control-score.yaml"),
    "/rules/control-score.yaml",
  );

  it("exists and declares version v2", () => {
    expect(schema.version).toBe("v2");
  });

  it("declares required top-level score sections", () => {
    expect(Object.keys(schema.top_level_sections)).toEqual(
      expect.arrayContaining([
        "version",
        "frontend_id",
        "segments",
        "timeline_marks",
        "timed_controls",
        "f0_points",
        "f0_layer_commands",
        "global_overlays",
        "lowering_refs",
      ]),
    );
  });

  it("declares segment and timed-control fields", () => {
    expect(Object.keys(schema.segment_fields)).toEqual(
      expect.arrayContaining(["id", "phoneme", "type", "params", "prosody", "alignment", "duration"]),
    );
    expect(Object.keys(schema.timeline_mark_fields)).toEqual(
      expect.arrayContaining(["id", "segment_id", "edge"]),
    );
    expect(Object.keys(schema.timed_control_fields)).toEqual(
      expect.arrayContaining(["id", "target_segment_id", "start_offset_ms", "end_offset_ms", "fields"]),
    );
  });

  it("declares F0, overlay, and lowering-reference fields", () => {
    expect(Object.keys(schema.f0_point_fields)).toEqual(
      expect.arrayContaining(["id", "timing", "value_hz"]),
    );
    expect(Object.keys(schema.f0_layer_command_fields)).toEqual(
      expect.arrayContaining(["id", "timing", "layer", "value"]),
    );
    expect(Object.keys(schema.global_overlay_fields)).toEqual(
      expect.arrayContaining(["id", "fields"]),
    );
    expect(Object.keys(schema.lowering_ref_fields)).toEqual(
      expect.arrayContaining(["spec_id", "policy_paths"]),
    );
  });
});
