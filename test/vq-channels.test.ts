import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";
import {
  loadBundledRulepackSpec,
  loadFrontendResources,
} from "../src/declarative-frontend/rule-pack";
import { parseDirectionInput } from "../src/input/parse";
import { parseVoiceQualityChannels } from "../src/input/vq-channels";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { isPlainObject, loadYamlDocumentSync } from "../src/yaml-loader";

describe("declarative voice-quality channels", () => {
  it("checks cached preset membership against each selected channel resource", () => {
    const directory = mkdtempSync(join(tmpdir(), "qlatt-vq-"));
    try {
      const presetPath = join(directory, "presets.yaml");
      const channelPath = join(directory, "channels.yaml");
      const spec = loadBundledRulepackSpec("qlatt-english");
      const selected = loadFrontendResources(spec);
      if (!selected.vqChannels || !selected.affectPresets) {
        throw new Error("expected declared VQ and affect resources");
      }
      const document = loadYamlDocumentSync(selected.vqChannels.path);
      if (!isPlainObject(document) || !Array.isArray(document.channels)) {
        throw new Error("expected channels document");
      }
      writeFileSync(presetPath, JSON.stringify(loadYamlDocumentSync(selected.affectPresets.path)));
      writeFileSync(
        channelPath,
        JSON.stringify({
          ...document,
          channels: document.channels.filter(
            (row) => isPlainObject(row) && row.channel !== "f0Scale",
          ),
        }),
      );
      const first = loadFrontendResources({
        ...spec,
        resources: {
          ...spec.resources,
          affect_presets: presetPath,
          vq_channels: selected.vqChannels.path,
        },
      });
      expect(first.affectPresets?.library.presets.tender).toBeDefined();
      expect(first.vqChannels?.channels.some((row) => row.channel === "f0Scale")).toBe(true);
      expect(first.vqChannels?.rdPolicy.min).toBe(0.3);
      rmSync(presetPath);
      expect(() =>
        loadFrontendResources({
          ...spec,
          resources: { ...spec.resources, affect_presets: presetPath, vq_channels: channelPath },
        }),
      ).toThrow("unknown voice-quality channel f0Scale");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("keeps DECtalk's no-delta path and rejects an actual VQ consumer", () => {
    const options = { frontendId: "dectalk-english" };
    const baseline = textToKlattTrackDetailed("hello", undefined, undefined, options);
    const directed = textToKlattTrackDetailed("hello", undefined, undefined, {
      ...options,
      directionTrack: { version: "1", global: { voice: {} } },
    });
    const acousticFrames = (track: typeof baseline.track) =>
      track.map(({ time, phoneme, params }) => ({ time, phoneme, params }));
    expect(acousticFrames(directed.track)).toEqual(acousticFrames(baseline.track));
    const input = {
      score: { text: "hello" },
      directionTrack: {
        version: "1" as const,
        spans: [
          { id: "pitch", anchor: { unit: "word" as const, start: 0 }, pitch: { semitones: 1 } },
        ],
      },
    };
    expect(() => parseDirectionInput(input, options)).toThrow(
      "E_FRONTEND_CONFIG: frontend 'dectalk-english' requires vq_channels",
    );
  });

  it.each([
    ["add", 0, 4, 14],
    ["mul", 1, 2, 20],
  ] as const)(
    "carries a new YAML %s channel through every consumer",
    async (algebra, neutral, delta, expected) => {
      const extra = load(`
channel: testChannel
algebra: ${algebra}
unit: test-unit
neutral: ${neutral}
backend_param: TEST
citations:
  - "engineering estimate: extension regression"
`);
      const document = loadYamlDocumentSync(
        "/rules/frontends/qlatt-english/policy/vq-channels.yaml",
      );
      if (!isPlainObject(document) || !Array.isArray(document.channels)) {
        throw new Error("expected channels document");
      }
      const channels = parseVoiceQualityChannels({
        ...document,
        channels: [...document.channels, extra],
      });
      const direction = await import("../src/input/direction-track");
      const parser = await import("../src/input/parse");
      const { applyAffectToTrack } = await import("../src/input/apply-affect");
      const { Utterance, lowerToFrames } = await import("../src/declarative-frontend/hrg");
      expect(direction.neutralVoiceQualityDelta(channels).testChannel).toBe(neutral);
      const vq = direction.materializeVoiceQualityDelta(channels, {
        testChannel: delta,
      });
      expect(direction.scaleVoiceQualityDelta(channels, vq, 0.5).testChannel).toBe(
        neutral + (delta - neutral) * 0.5,
      );
      const parsed = parser.parseDirectionInput(
        {
          score: { text: "red" },
          directionTrack: {
            version: "1",
            spans: [{ id: "extension", anchor: { unit: "word", start: 0 }, voiceQuality: vq }],
          },
        },
        { vqChannels: channels },
      );
      expect(parsed.directions[0].delta?.testChannel).toBe(delta);
      expect(
        applyAffectToTrack([{ time: 0, phoneme: "EH", params: { TEST: 10 } }], vq, {
          frontendId: "fixture",
          vqChannels: channels,
        }).track[0].params.TEST,
      ).toBe(expected);
      const utterance = new Utterance(
        {
          itemTypes: {
            direction: parser.buildDirectionItemSchema(channels),
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
      const frames = lowerToFrames(
        utterance,
        {
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
        },
        { vqChannels: channels },
      );
      expect(
        frames.frames.filter((frame) => frame.phoneme === "EH").map((frame) => frame.params.TEST),
      ).toEqual(expect.arrayContaining([expected]));
    },
  );
});
