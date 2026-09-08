import { describe, expect, it } from "vitest";
import { replayJournal } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import {
  compileRuleEngineSpec,
  loadBundledRulepackSpec,
} from "../src/declarative-frontend/rule-pack";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { isPlainObject } from "../src/yaml-loader";

function beforeProsody(phrase = "Cat.") {
  const original = textToKlattTrackDetailed(phrase, 110).utterance;
  const journal = original.journal();
  return replayJournal(
    original.schemaDefinition(),
    journal.slice(
      0,
      journal.findIndex((entry) => entry.metadata.phase === "prosody"),
    ),
  );
}

describe("tone association in the production frontend", () => {
  it("rejects stale phonetic alignment outside the associated syllable before emitting points", () => {
    const utterance = beforeProsody("Cat sat.");
    const base = loadBundledRulepackSpec("qlatt-english");
    const associateOnly = {
      ...base,
      phases: [
        {
          name: "associate_only",
          rules: ["associate_accent_tones"],
          after: [],
          resolve_points: [],
          resolve_scalars: [],
        },
      ],
    };
    runGraphRuleEngine(utterance, associateOnly);
    const carrier = utterance
      .relation("Segment")
      .listItems()
      .find((item) => item.get("isAccentCarrier") === true)!;
    const tone = utterance.associatedItems(carrier, "tones")[0];
    const original = utterance.associatedItems(tone, "tone_bearer")[0];
    const other = utterance
      .relation("Syllable")
      .listItems()
      .find((item) => item !== original)!;
    const tx = utterance.beginTransaction({
      ruleId: "fixture_reassociation",
      phase: "test",
      tag: "tone_association",
      reason: "Move the tone to another syllable",
      citations: ["Goldsmith 1976"],
    });
    tx.disassociate("tone_bearer", tone, original);
    tx.associate("tone_bearer", tone, other);
    tx.commit();
    const before = utterance.graphDigest();
    expect(() =>
      runGraphRuleEngine(utterance, {
        ...base,
        phases: [
          {
            name: "realize_only",
            rules: ["tobi_accent"],
            after: [],
            resolve_points: [],
            resolve_scalars: [],
          },
        ],
      }),
    ).toThrow(/E_TONE_REALIZATION.*outside/);
    expect(utterance.graphDigest()).toBe(before);
    expect(utterance.relation("F0Point").listItems()).toEqual([]);
    expect(
      utterance.diagnostics.getEntries().some((entry) => entry.code === "E_TONE_REALIZATION"),
    ).toBe(true);
  });

  it("keeps stacked targets ordered in a very short carrier", () => {
    const utterance = beforeProsody();
    const carrier = utterance
      .relation("Segment")
      .listItems()
      .find((item) => item.get("isAccentCarrier") === true)!;
    const tx = utterance.beginTransaction({
      ruleId: "short_fixture",
      phase: "test",
      tag: "duration",
      reason: "One millisecond synthetic stress test",
      citations: ["Engineering estimate: adversarial fixture, not a speech duration"],
    });
    tx.set(carrier, "duration", 1);
    tx.set(carrier, "accentType", "L+H*");
    tx.commit();
    runGraphRuleEngine(utterance, loadBundledRulepackSpec("qlatt-english"), {
      phases: ["prosody", "finalize"],
    });
    const tones = utterance.associatedItems(carrier, "tones");
    expect(tones).toHaveLength(2);
    const points = utterance
      .relation("F0Point")
      .listItems()
      .filter((point) =>
        utterance.associatedItems(point, "realizes_tone").some((tone) => tones.includes(tone)),
      );
    expect(points).toHaveLength(2);
    expect(points.every((point) => Number.isFinite(Number(point.get("value"))))).toBe(true);
    expect(utterance.temporalAnchor(points[1])?.ratio).toBe(0.45);
  });
  it.each([
    ["H*", ["H*"]],
    ["H*+L", ["H*", "L"]],
    ["L+H*", ["L", "H*"]],
    ["H+!H*", ["H", "H*"]],
    ["H*+H", ["H*", "H"]],
    ["H+L*", ["H", "L*"]],
    ["L*", ["L*"]],
    ["L*+H", ["L*", "H"]],
  ])("associates and realizes the declared %s melody", (accent, expected) => {
    const utterance = beforeProsody();
    const carrier = utterance
      .relation("Segment")
      .listItems()
      .find((item) => item.get("isAccentCarrier") === true)!;
    const tx = utterance.beginTransaction({
      ruleId: "authored_tune",
      phase: "annotation",
      tag: "accent_type",
      reason: "Fixture tune choice",
      citations: ["Pierrehumbert 1980"],
    });
    tx.set(carrier, "accentType", accent);
    tx.commit();
    runGraphRuleEngine(utterance, loadBundledRulepackSpec("qlatt-english"), {
      phases: ["prosody", "finalize"],
    });
    const tones = utterance.associatedItems(carrier, "tones");
    expect(tones.map((tone) => `${tone.get("symbol")}${tone.get("starred") ? "*" : ""}`)).toEqual(
      expected,
    );
    const points = utterance.relation("F0Point").listItems();
    for (const tone of tones) {
      expect(
        points.filter((point) => utterance.associatedItems(point, "realizes_tone").includes(tone)),
      ).toHaveLength(1);
      expect(utterance.associatedItems(tone, "tone_bearer")[0].id).toBe(
        utterance.relation("SylStructure").node(carrier)!.parent!.item.id,
      );
    }
    expect(
      replayJournal(
        utterance.schemaDefinition(),
        utterance.journal(),
        utterance.provenance.getDecisions(),
      ).graphDigest(),
    ).toBe(utterance.graphDigest());
  });

  it("changes the realized tone through melody data without changing the selected accent label", () => {
    const utterance = beforeProsody();
    const base = loadBundledRulepackSpec("qlatt-english");
    if (!isPlainObject(base.maps) || !isPlainObject(base.maps.accent_melodies))
      throw new Error("Missing declared melody inventory");
    const changed = compileRuleEngineSpec({
      ...base,
      maps: {
        ...base.maps,
        accent_melodies: { ...base.maps.accent_melodies, "H*": "L*:f0_l_star" },
      },
    });
    runGraphRuleEngine(utterance, changed, { phases: ["prosody", "finalize"] });
    const carrier = utterance
      .relation("Segment")
      .listItems()
      .find((item) => item.get("isAccentCarrier") === true)!;
    expect(carrier.get("accentType")).toBe("H*");
    expect(utterance.associatedItems(carrier, "tones").map((tone) => tone.get("symbol"))).toEqual([
      "L",
    ]);
    const points = utterance.relation("F0Point").listItems();
    expect(points.some((point) => point.get("tag") === "f0_h_star")).toBe(false);
    expect(points.find((point) => point.get("tag") === "f0_l_star")?.get("value")).toBe(122);
  });

  it.each(["Gag, gang; go!", "Did Bob buy a blue balloon?"])(
    "preserves punctuation domains, weak breaks, suppressed items and structural syllable identity: %s",
    (phrase) => {
      const { utterance } = textToKlattTrackDetailed(phrase, 110);
      for (const segment of utterance.relation("Segment").listItems()) {
        const tones = utterance.associatedItems(segment, "tones");
        if (segment.get("active") === false) expect(tones).toEqual([]);
        if (
          segment.get("phoneme") === "SIL" &&
          [3, 4].includes(Number(segment.get("breakIndex")))
        ) {
          expect(tones).toHaveLength(2);
          expect(
            tones.every((tone) => utterance.associatedItems(tone, "tone_bearer")[0] === segment),
          ).toBe(true);
        }
        if ([1, 2].includes(Number(segment.get("breakIndex"))))
          expect(tones.some((tone) => String(tone.get("role")).includes("boundary"))).toBe(false);
        if (tones.some((tone) => tone.get("starred"))) {
          const syllable = utterance.relation("SylStructure").node(segment)!.parent!.item;
          expect(
            tones.every((tone) => utterance.associatedItems(tone, "tone_bearer")[0] === syllable),
          ).toBe(true);
        }
      }
      expect(
        replayJournal(
          utterance.schemaDefinition(),
          utterance.journal(),
          utterance.provenance.getDecisions(),
        ).graphDigest(),
      ).toBe(utterance.graphDigest());
    },
  );
  it("links accent and edge tones to canonical bearers and their F0 targets", () => {
    const { utterance } = textToKlattTrackDetailed("Did Bob buy a blue balloon?", 110);
    const tones = utterance.getRelation("Tone")?.listItems() ?? [];
    expect(tones.length).toBeGreaterThan(5);
    for (const tone of tones) {
      const bearers = utterance.associatedItems(tone, "tone_bearer");
      expect(bearers).toHaveLength(1);
      expect(["syllable", "segment"]).toContain(bearers[0].type);
      expect(
        tone.latestWrite("symbol")?.citations.some((citation) => citation.includes("Goldsmith")),
      ).toBe(true);
    }
    const points = utterance
      .relation("F0Point")
      .listItems()
      .filter((point) =>
        [
          "f0_h_star",
          "f0_l_leading",
          "f0_l_star",
          "f0_boundary_rise",
          "f0_initial_boundary_high",
        ].includes(String(point.get("tag"))),
      );
    expect(points.length).toBeGreaterThan(2);
    const decisions = new Map(
      utterance.provenance.getDecisions().map((decision) => [decision.id, decision]),
    );
    for (const point of points) {
      const realized = utterance.associatedItems(point, "realizes_tone");
      expect(realized).toHaveLength(1);
      const tone = realized[0];
      const ancestors = new Set<string>();
      const pending = [point.latestWrite("value")!.decisionId];
      while (pending.length) {
        const id = pending.pop()!;
        if (ancestors.has(id)) continue;
        ancestors.add(id);
        pending.push(...(decisions.get(id)?.parents ?? []));
      }
      expect(ancestors.has(tone.latestWrite("symbol")!.decisionId)).toBe(true);
      const bearerLink = utterance.latestAssociationWrites(tone, "tone_bearer")[0];
      expect(ancestors.has(bearerLink.decisionId)).toBe(true);
      const source = utterance
        .relation("Segment")
        .listItems()
        .find((item) => utterance.associatedItems(item, "tones").includes(tone))!;
      const inputKeys =
        source.get("accentType") != null
          ? ["accentType", "stress"]
          : source.get("initialBoundaryTone") === "%H"
            ? ["initialBoundaryTone"]
            : ["boundaryTone", "breakIndex"];
      for (const key of inputKeys)
        expect(ancestors.has(source.latestWrite(key)!.decisionId)).toBe(true);
    }
  });

  it("keeps beauty accent eligibility and DECtalk's own intonation contract", () => {
    const beauty = textToKlattTrackDetailed("The cat sat.", 110, 30, {
      frontendId: "qlatt-beauty",
    }).utterance;
    const tones = beauty.getRelation("Tone")?.listItems() ?? [];
    expect(tones.length).toBeGreaterThan(0);
    expect(tones.every((tone) => tone.get("starred") === false)).toBe(true);
    const dectalk = textToKlattTrackDetailed("The cat sat.", 110, 30, {
      frontendId: "dectalk-english",
    }).utterance;
    expect(dectalk.getRelation("Tone")?.listItems() ?? []).toEqual([]);
  });
});
