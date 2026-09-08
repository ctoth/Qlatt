import { describe, expect, it } from "vitest";
import type { StressDomain, StressSyllable } from "../src/g2p/lexical-stress-types";
import { assignMetricalStress } from "../src/g2p/metrical-stress";
import { stressPronunciation } from "../src/g2p/stress";
import { loadStressPolicy, parseStressPolicy } from "../src/g2p/stress-policy";
import { loadYamlDocumentSync } from "../src/yaml-loader";

const path = "/rules/frontends/qlatt-english/stress-policy.yaml";
const policy = loadStressPolicy(path);
const syllable = (id: number, long = false, coda: string[] = []): StressSyllable => ({
  id: `s${id}`,
  nucleus: long ? "EY" : "AH",
  long,
  coda,
  inherited: null,
});
const domain = (id: string, end: number, rest: Partial<StressDomain> = {}): StressDomain => ({
  id,
  end,
  category: "noun",
  affix: "root",
  extrametricalSuffix: false,
  ...rest,
});
const pattern = (result: ReturnType<typeof assignMetricalStress>) =>
  result.stress.map((value) => ({ primary: "1", secondary: "2", unstressed: "0" })[value]).join("");

describe("Hayes (1982) derivational controls; supplied phonological quantity, American variants", () => {
  it("redraws the parent foot for parental and the homonym foot for homonymous (pp. 244–246)", () => {
    const parental = assignMetricalStress(
      [syllable(0), syllable(1, false, ["N"]), syllable(2, false, ["L"])],
      [
        domain("parent", 2),
        domain("parental", 3, {
          category: "adjective",
          affix: "adjectival",
          extrametricalSuffix: true,
          suffixStart: 2,
        }),
      ],
      policy,
    );
    const homonymous = assignMetricalStress(
      [syllable(0), syllable(1), syllable(2), syllable(3, false, ["S"])],
      [
        domain("homonym", 3),
        domain("homonymous", 4, {
          category: "adjective",
          affix: "adjectival",
          extrametricalSuffix: true,
          suffixStart: 3,
        }),
      ],
      policy,
    );
    expect(pattern(parental)).toBe("010");
    expect(pattern(homonymous)).toBe("0100");
    expect(
      homonymous.decisions.find(
        (step) => step.domain === "homonymous" && step.rule === "english_stress_rule",
      )?.feet,
    ).toContainEqual({ head: 1, members: [1, 2], domain: "homonymous" });
    expect(
      parental.decisions.find(
        (step) => step.domain === "parental" && step.rule === "cycle_peripherality",
      )?.excluded,
    ).toEqual([]);
  });

  it("distinguishes verbal and adjectival coruscate without a second suffix list (pp. 245–247, 273–274)", () => {
    const input = [syllable(0), syllable(1, false, ["S"]), syllable(2, true, ["T"])];
    const verb = assignMetricalStress(
      input,
      [domain("coruscate-verb", 3, { category: "verb", affix: "verbal" })],
      policy,
    );
    const adjective = assignMetricalStress(
      input,
      [
        domain("coruscate-adjective", 3, {
          category: "adjective",
          affix: "adjectival",
          extrametricalSuffix: true,
          suffixStart: 2,
        }),
      ],
      policy,
    );
    expect(pattern(verb)).toBe("102");
    expect(pattern(adjective)).toBe("012");
    expect(verb.decisions.find((step) => step.rule === "strong_retraction")?.feet).toContainEqual({
      head: 0,
      members: [0, 1],
      domain: "coruscate-verb",
    });
  });

  it("preserves fraternize feet but builds compurgation feet afresh (pp. 248–250)", () => {
    const fraternization = assignMetricalStress(
      [syllable(0), syllable(1, true), syllable(2), syllable(3, true), syllable(4, false, ["N"])],
      [
        domain("fraternize", 4, { category: "verb", affix: "verbal" }),
        domain("fraternization", 5, { affix: "other" }),
      ],
      policy,
    );
    const compurgation = assignMetricalStress(
      [syllable(0, false, ["M"]), syllable(1, true), syllable(2, true), syllable(3, false, ["N"])],
      [domain("compurgation", 4)],
      policy,
    );
    expect(pattern(fraternization)).toBe("02010");
    expect(pattern(compurgation)).toBe("2010");
    expect(
      fraternization.decisions.find(
        (step) => step.domain === "fraternization" && step.rule === "strong_retraction",
      )?.feet,
    ).toContainEqual({ head: 1, members: [1, 2], domain: "fraternize" });
  });

  it("retains compensation's binary cyclic foot (pp. 249–250)", () => {
    const result = assignMetricalStress(
      [
        syllable(0, false, ["M"]),
        syllable(1, false, ["N"]),
        syllable(2, true),
        syllable(3, false, ["N"]),
      ],
      [
        domain("compensate", 3, { category: "verb", affix: "verbal" }),
        domain("compensation", 4, { affix: "other" }),
      ],
      policy,
    );
    expect(pattern(result)).toBe("2010");
    expect(result.feet).toContainEqual({ head: 0, members: [0, 1], domain: "compensate" });
  });

  it("accepts condensation as a cited lexical exception, not invented productive rhythm adjustment (p. 250)", () => {
    const result = stressPronunciation(
      ["K", "AA", "N", "D", "AH", "N", "S", "EY", "SH", "AH", "N"],
      {
        policyPath: path,
        exception: {
          stress: ["secondary", "unstressed", "primary", "unstressed"],
          reason:
            "Condensation requires separately invoked rhythm adjustment; supply the lexical variant",
          citations: ["Hayes (1982), p. 250, example (59)"],
        },
      },
    );
    expect(pattern(result)).toBe("2010");
    expect(result.decisions.at(-1)?.rule).toBe("lexical_exception");
    expect(result.feet.map((foot) => foot.head)).toEqual([0, 2]);
  });

  it("deletes cursory's weak branching foot but protects creative's strong foot (pp. 258–259)", () => {
    // Post-vocalization checkpoints: these feet are supplied, not inferred from surface /i/.
    const checkpoint = {
      feet: [
        { head: 0, members: [0] },
        { head: 1, members: [1, 2] },
      ],
      citations: ["Hayes (1982), pp. 258–259, examples (80)–(82)"],
    };
    const cursory = assignMetricalStress(
      [syllable(0, true), syllable(1), syllable(2)],
      [domain("cursory", 3, { checkpoint: { ...checkpoint, excludedFrom: 1 } })],
      policy,
    );
    const creative = assignMetricalStress(
      [syllable(0), syllable(1, true), syllable(2, false, ["V"])],
      [
        domain("creative", 3, {
          category: "adjective",
          checkpoint: { ...checkpoint, excludedFrom: 2 },
        }),
      ],
      policy,
    );
    expect(pattern(cursory)).toBe("100");
    expect(pattern(creative)).toBe("010");
    expect(cursory.decisions.find((step) => step.rule === "poststress_destressing")?.feet).toEqual([
      { head: 0, members: [0, 1, 2], domain: "cursory" },
    ]);
    expect(creative.feet[0].head).toBe(1);
  });
});

describe("stress resource and input contracts", () => {
  type RawPolicy = {
    cycle: { when: string; citations: string[] }[];
    phonotactics_path?: string;
    long_vowels: string[];
  };
  it("does not mutate a caller's macro citation arrays while parsing", () => {
    const raw = loadYamlDocumentSync<unknown>(path);
    const before = JSON.stringify(raw);
    parseStressPolicy(raw);
    expect(JSON.stringify(raw) === before).toBe(true);
  });
  it.each([
    [
      "unknown CEL variable",
      (raw: RawPolicy) => {
        raw.cycle[0].when = "missingFeature";
      },
    ],
    [
      "wrong condition type",
      (raw: RawPolicy) => {
        raw.cycle[0].when = "42";
      },
    ],
    [
      "missing citation",
      (raw: RawPolicy) => {
        raw.cycle[0].citations = [];
      },
    ],
    [
      "invalid ordering",
      (raw: RawPolicy) => {
        raw.cycle.reverse();
      },
    ],
    [
      "missing phonotactics",
      (raw: RawPolicy) => {
        delete raw.phonotactics_path;
      },
    ],
    [
      "incompatible vowel classes",
      (raw: RawPolicy) => {
        raw.long_vowels = ["NOT_A_VOWEL"];
      },
    ],
    [
      "incompatible phonotactics resource",
      (raw: RawPolicy) => {
        raw.phonotactics_path = "/rules/frontends/qlatt-english/inventory.yaml";
      },
    ],
  ])("rejects %s", (_name, mutate) => {
    const raw = structuredClone(loadYamlDocumentSync<RawPolicy>(path));
    mutate(raw);
    expect(() => parseStressPolicy(raw)).toThrow(/E_STRESS_POLICY/);
  });
  it("rejects malformed supplied nuclei instead of silently reinterpreting them", () => {
    expect(() =>
      stressPronunciation(["AH"], {
        policyPath: path,
        underlying: [{ ...syllable(0), nucleus: "NOT_A_VOWEL" }],
      }),
    ).toThrow(/E_STRESS_INPUT/);
  });
  it("rejects an uncited exception", () => {
    expect(() =>
      stressPronunciation(["AH"], {
        policyPath: path,
        exception: { stress: ["primary"], reason: "test", citations: [] },
      }),
    ).toThrow(/E_STRESS_EXCEPTION/);
  });
});
