import { load } from "js-yaml";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("../src/yaml-loader");
  vi.resetModules();
});

describe("declarative voice-quality channels", () => {
  it.each([
    ["add", 0, 4, 14],
    ["mul", 1, 2, 20],
  ] as const)(
    "carries a new YAML %s channel through every consumer",
    async (algebra, neutral, delta, expected) => {
      vi.resetModules();
      const extra = load(`
channel: testChannel
algebra: ${algebra}
unit: test-unit
neutral: ${neutral}
backend_param: TEST
citations:
  - "engineering estimate: extension regression"
`);
      vi.doMock("../src/yaml-loader", async (importOriginal) => {
        const actual = await importOriginal<typeof import("../src/yaml-loader")>();
        return {
          ...actual,
          loadYamlDocumentSync: (path: string) => {
            const document = actual.loadYamlDocumentSync(path);
            if (path === "/rules/policy/vq-channels.yaml") {
              if (!actual.isPlainObject(document) || !Array.isArray(document.channels)) {
                throw new Error("expected channels document");
              }
              return { ...document, channels: [...document.channels, extra] };
            }
            return document;
          },
        };
      });
      const direction = await import("../src/input/direction-track");
      const parser = await import("../src/input/parse");
      const { applyAffectToTrack } = await import("../src/input/apply-affect");
      const { Utterance, lowerToFrames } = await import("../src/declarative-frontend/hrg");
      expect(Reflect.get(direction.NEUTRAL_VQ, "testChannel")).toBe(neutral);
      const vq = direction.materializeVoiceQualityDelta({
        ...direction.NEUTRAL_VQ,
        testChannel: delta,
      });
      expect(Reflect.get(direction.scaleVoiceQualityDelta(vq, 0.5), "testChannel")).toBe(
        neutral + (delta - neutral) * 0.5,
      );
      const parsed = parser.parseDirectionInput({
        score: { text: "red" },
        directionTrack: {
          version: "1",
          spans: [{ anchor: { unit: "word", start: 0 }, voiceQuality: vq }],
        },
      });
      expect(parsed.directions[0].delta?.testChannel).toBe(delta);
      expect(
        applyAffectToTrack([{ time: 0, phoneme: "EH", params: { TEST: 10 } }], vq).track[0].params
          .TEST,
      ).toBe(expected);
      const utterance = new Utterance(
        {
          itemTypes: {
            direction: parser.DIRECTION_ITEM_SCHEMA,
            segment: {
              features: {
                active: { kind: "boolean" },
                duration: { kind: "number" },
                phoneme: { kind: "string" },
                type: { kind: "string" },
                TEST: { kind: "number" },
              },
            },
            word: { features: { text: { kind: "string" } } },
          },
          relations: {
            Affect: { kind: "list", itemTypes: ["direction"] },
            Segment: { kind: "list", itemTypes: ["segment"] },
            Word: { kind: "list", itemTypes: ["word"] },
            SylStructure: { kind: "tree", itemTypes: ["word", "segment"] },
          },
        },
        parsed.provenance,
      );
      parser.attachDirectionsToUtterance(parsed, utterance);
      const build = utterance.beginTransaction({
        ruleId: "fixture",
        phase: "input",
        tag: "fixture",
        reason: "extension fixture",
        citations: ["engineering estimate: extension regression"],
      });
      const word = build.createItem("word", "word");
      build.set(word, "text", "red");
      build.append("Word", word);
      build.addRoot("SylStructure", word);
      const segment = build.createItem("segment", "segment");
      build.set(segment, "active", true);
      build.set(segment, "duration", 100);
      build.set(segment, "phoneme", "EH");
      build.set(segment, "type", "vowel");
      build.set(segment, "TEST", 10);
      build.append("Segment", segment);
      build.addDaughter("SylStructure", word, segment);
      build.partitionAnchors([segment], utterance.axis.start.id, utterance.axis.end.id);
      build.resolveMarkTime(utterance.axis.start.id, 0);
      build.resolveMarkTime(utterance.axis.end.id, 100);
      build.commit();
      const frames = lowerToFrames(utterance, {
        columns: ["TEST"],
        timeline: {
          initial_silence_ms: { value: 0 },
          final_silence_ms: { value: 0 },
          duration_floors: { stop_release_ms: { value: 1 }, default_ms: { value: 1 } },
          event_points: {
            include_segment_start: true,
            include_control_boundaries: true,
            include_f0_anchors: true,
            include_transition_steady_time: true,
          },
        },
        transitions: {
          min_transition_edge_ms: { value: 20, citations: ["engineering estimate: fixture"] },
          default_transition_ms: { value: 0 },
          blend: { factor: { value: 0.5 }, keys: [], smooth_types: [] },
        },
        f0: {
          renderer: { type: "point_interpolation" },
          output_clamp: { min_hz: { value: 0 }, max_hz: { value: 500 } },
        },
      });
      expect(
        frames.frames.filter((frame) => frame.phoneme === "EH").map((frame) => frame.params.TEST),
      ).toEqual(expect.arrayContaining([expected]));
    },
  );
});
