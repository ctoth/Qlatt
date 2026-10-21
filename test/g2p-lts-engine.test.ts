import { describe, expect, it } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import { applyLtsRules, type LtsRulesData, parseLtsRulesData } from "../src/g2p/lts-engine";
import { resources } from "./g2p-fixture";

const QLATT_LTS_RULES = resources.lts.document as LtsRulesData;

describe("resource input policy", () => {
  function fixture(): LtsRulesData {
    return {
      input_policy: {
        case_mode: "preserve",
        boundary_marker: "|",
        categories: { DIGIT: "١" },
        fallback: null,
        filtered_markers: ["MARK"],
        citations: ["fixture input policy"],
      },
      context_symbols: {},
      rules_by_letter: {
        é: [{ left: "|", letters: "é", right: "", phonemes: ["EH", "MARK", "AX"] }],
        "😀": [{ left: "", letters: "😀", right: "", phonemes: ["HH"] }],
        DIGIT: [{ left: "", letters: "١", right: "|", phonemes: ["W", "AH", "N"] }],
      },
    };
  }

  it("uses Unicode keys, declared categories/boundaries and marker filtering without normalization", () => {
    const data = fixture();
    expect(applyLtsRules("é😀١", data)).toEqual(["EH", "AX", "HH", "W", "AH", "N"]);
    const alternate = fixture();
    alternate.input_policy.filtered_markers = ["AX"];
    expect(applyLtsRules("é", alternate)).toEqual(["EH", "MARK"]);
    const direct = fixture();
    direct.rules_by_letter["١"] = [{ left: "", letters: "١", right: "", phonemes: ["D"] }];
    expect(applyLtsRules("١", direct)).toEqual(["D"]);
  });

  it.each(["upper", "lower", "preserve"] as const)("honors %s scalar case mode", (mode) => {
    const data = fixture();
    data.input_policy.case_mode = mode;
    data.rules_by_letter["É"] = [{ left: "", letters: "É", right: "", phonemes: ["IY"] }];
    expect(applyLtsRules(mode === "lower" ? "É" : "é", data)).toEqual(
      mode === "upper" ? ["IY"] : ["EH", "AX"],
    );
  });

  it("summarizes original UTF-16 positions once and excludes only generated boundaries", () => {
    const data = fixture();
    data.input_policy.case_mode = "upper";
    data.input_policy.categories.MISSING = "X";
    data.rules_by_letter.S = [];
    const diagnostics = createDiagnostics();
    expect(applyLtsRules("😀ßX|", data, { diagnostics, resource: "fixture.yaml" })).toEqual(["HH"]);
    expect(diagnostics.getEntries()).toEqual([
      expect.objectContaining({
        code: "LTS_UNMATCHED_INPUT",
        data: expect.objectContaining({
          word: "😀ßX|",
          resource: "fixture.yaml",
          positionUnit: "UTF-16",
          affected: [
            { character: "ß", position: 2, reason: "no-match" },
            { character: "X", position: 3, reason: "no-rule-category" },
            { character: "|", position: 4, reason: "no-rule-category" },
          ],
          citations: ["fixture input policy"],
        }),
      }),
    ]);
    const fallback = fixture();
    fallback.input_policy.fallback = "OTHER";
    fallback.rules_by_letter.OTHER = [{ left: "", letters: "?", right: "", phonemes: ["Q"] }];
    expect(applyLtsRules("?", fallback)).toEqual(["Q"]);
  });

  it.each([
    { case_mode: "locale" },
    { boundary_marker: "" },
    { boundary_marker: "ab" },
    { categories: { one: "x", two: "x" } },
    { fallback: "" },
    { filtered_markers: [3] },
    { citations: [] },
    { citations: [" "] },
  ])("rejects malformed supplied policy %j", (policy) => {
    const data = fixture();
    expect(() =>
      parseLtsRulesData({ ...data, input_policy: { ...data.input_policy, ...policy } }),
    ).toThrow("E_LTS_POLICY");
  });
});

// Note: Symbol normalization (AX->AH, NX->NG, WH->W) is now handled by
// the normalize rule phase (public/rules/frontends/qlatt-english/phases/normalize.yaml), not by
// the LTS engine. Tests below expect raw Elovitz notation.

describe("context pattern compilation", () => {
  it("keeps compiled patterns with the supplied document", () => {
    const first: LtsRulesData = {
      input_policy: QLATT_LTS_RULES.input_policy,
      context_symbols: { "#": "[AEIOU]" },
      rules_by_letter: {
        A: [
          { left: "#", letters: "A", right: "", phonemes: ["IY"] },
          { left: "", letters: "A", right: "", phonemes: ["AE"] },
        ],
      },
    };
    const second = structuredClone(first);
    second.context_symbols["#"] = "[B]";
    expect(applyLtsRules("ba", first)).toEqual(["AE"]);
    expect(applyLtsRules("ba", second)).toEqual(["IY"]);
    expect(applyLtsRules("ba", first)).toEqual(["AE"]);
  });

  // These are tested indirectly through rule application.
  // The context symbols from the JSON define:
  //   # = [AEIOUY]+ (one or more vowels)
  //   ^ = [BCDFGHJKLMNPQRSTVWXZ] (single consonant)
  //   . = [BDVGJLMNRWZ] (voiced consonant)
  //   + = [EIY] (front vowel)
  //   : = [BCDFGHJKLMNPQRSTVWXZ]* (zero or more consonants)
  //   % = (?:ER|E|ES|ED|ING|ELY) (suffix)
  //   & = (?:S|C|G|Z|X|J|CH|SH) (sibilant)
  //   @ = (?:T|S|R|D|L|Z|N|J|TH|CH|SH) (specific consonants)

  it("# matches one or more vowels via rule application", () => {
    // E rule: #:E -> [] (silent E after vowel + consonants)
    // "make" = " MAKE " -> M + A rule -> EY + K + silent E
    // This is verified through full word tests below
  });

  it("^ matches single consonant via rule application", () => {
    // A rule: A -> EY when right context is ^+# (consonant + front vowel + vowel)
    // "ACING" -> A before C(^) + I(+) + NG(#) -> EY
    // Verified through full word tests
  });
});

describe("individual rule application", () => {
  it('" THE " -> DH AX', () => {
    // Rule: left=" " letters="THE" right=" " phonemes=["DH","AX"]
    // AX preserved; normalize phase maps to AH later
    const result = applyLtsRules("the", QLATT_LTS_RULES);
    expect(result).toEqual(["DH", "AX"]);
  });

  it('"TO " -> T UW', () => {
    // Rule: left="" letters="TO" right=" " phonemes=["T","UW"]
    const result = applyLtsRules("to", QLATT_LTS_RULES);
    expect(result).toEqual(["T", "UW"]);
  });

  it("[SH] -> SH", () => {
    const result = applyLtsRules("she", QLATT_LTS_RULES);
    // SH rule matches first, then E -> IY (at end " E " with left context : -> IY)
    expect(result).toEqual(["SH", "IY"]);
  });

  it('[CH] -> CH in "chin"', () => {
    const result = applyLtsRules("chin", QLATT_LTS_RULES);
    // CH -> CH, I -> IH (I before ^+:# = IH), N -> N
    expect(result).toEqual(["CH", "IH", "N"]);
  });

  it('[TH] -> TH (unvoiced) in "through"', () => {
    // Rule: letters="THROUGH" phonemes=["TH","R","UW"]
    const result = applyLtsRules("through", QLATT_LTS_RULES);
    expect(result).toEqual(["TH", "R", "UW"]);
  });

  it('" A " -> AX (isolated a)', () => {
    // Rule: left="" letters="A" right=" " phonemes=["AX"]
    // AX preserved; normalize phase maps to AH later
    const result = applyLtsRules("a", QLATT_LTS_RULES);
    expect(result).toEqual(["AX"]);
  });

  it('[QU] -> K W in "quick"', () => {
    // Rule: left="" letters="QU" phonemes=["K","W"]
    const result = applyLtsRules("quick", QLATT_LTS_RULES);
    // QU -> K W, I -> IH, CK -> K
    expect(result).toEqual(["K", "W", "IH", "K"]);
  });
});

describe("full word tests", () => {
  it('"cat" -> K AE T', () => {
    const result = applyLtsRules("cat", QLATT_LTS_RULES);
    expect(result).toEqual(["K", "AE", "T"]);
  });

  it('"the" -> DH AX', () => {
    const result = applyLtsRules("the", QLATT_LTS_RULES);
    expect(result).toEqual(["DH", "AX"]);
  });

  it('"phone" -> F OW N', () => {
    // PH -> F, O before N+E -> OW (O^EN rule? or O^% rule?), N, silent E
    const result = applyLtsRules("phone", QLATT_LTS_RULES);
    expect(result).toEqual(["F", "OW", "N"]);
  });

  it('"ship" -> SH IH P', () => {
    const result = applyLtsRules("ship", QLATT_LTS_RULES);
    expect(result).toEqual(["SH", "IH", "P"]);
  });

  it('"through" -> TH R UW', () => {
    const result = applyLtsRules("through", QLATT_LTS_RULES);
    expect(result).toEqual(["TH", "R", "UW"]);
  });

  it('"that" -> DH AE T', () => {
    // Rule: left="" letters="THAT" right=" " phonemes=["DH","AE","T"]
    const result = applyLtsRules("that", QLATT_LTS_RULES);
    expect(result).toEqual(["DH", "AE", "T"]);
  });

  it('"quick" -> K W IH K', () => {
    const result = applyLtsRules("quick", QLATT_LTS_RULES);
    expect(result).toEqual(["K", "W", "IH", "K"]);
  });

  it('"know" -> N OW', () => {
    // K before N at word start -> silent K (rule: left=" " letters="K" right="N" phonemes=[])
    // N -> N, OW -> OW
    const result = applyLtsRules("know", QLATT_LTS_RULES);
    expect(result).toEqual(["N", "OW"]);
  });

  it('"write" -> R AY T', () => {
    // WR -> R (rule: letters="WR" phonemes=["R"])
    // I -> AY (I before ^+:# context), T, silent E
    const result = applyLtsRules("write", QLATT_LTS_RULES);
    expect(result).toEqual(["R", "AY", "T"]);
  });
});

describe("edge cases", () => {
  it("empty string -> empty array", () => {
    const result = applyLtsRules("", QLATT_LTS_RULES);
    expect(result).toEqual([]);
  });

  it('"a" -> single phoneme (AX)', () => {
    const result = applyLtsRules("a", QLATT_LTS_RULES);
    expect(result).toEqual(["AX"]);
  });
});

describe("extended word tests", () => {
  it('"make" -> M EY K (silent E)', () => {
    const result = applyLtsRules("make", QLATT_LTS_RULES);
    expect(result).toEqual(["M", "EY", "K"]);
  });

  it('"thought" -> TH AO T', () => {
    // OUGH -> AO T (rule: OUGHT -> AO T), then? No...
    // Actually: TH -> TH, OUGHT -> AO T
    const result = applyLtsRules("thought", QLATT_LTS_RULES);
    expect(result).toEqual(["TH", "AO", "T"]);
  });

  it('"light" -> L AY T', () => {
    // L -> L, IGH -> AY (I rule: I before GH), T -> T
    // Actually need to check I rules more carefully
    const result = applyLtsRules("light", QLATT_LTS_RULES);
    expect(result).toEqual(["L", "AY", "T"]);
  });

  it('"judge" -> JH AH D JH', () => {
    // J -> JH, U -> AH (U before ^^ = two consonants),
    // D -> D (default), G before E -> JH, silent E
    // No DG digraph rule exists in Elovitz ruleset
    const result = applyLtsRules("judge", QLATT_LTS_RULES);
    expect(result).toEqual(["JH", "AH", "D", "JH"]);
  });

  it('"nation" -> N EY SH AX N (via -TION -> SH)', () => {
    // N -> N, A before ^+# -> EY, TI before O -> SH, ION -> AX N
    const result = applyLtsRules("nation", QLATT_LTS_RULES);
    expect(result).toEqual(["N", "EY", "SH", "AX", "N"]);
  });

  it('"enough" -> EH N AH F (OUGH -> AH F)', () => {
    // E -> EH (default), N -> N, OUGH -> AH F
    // Note: Elovitz rules produce EH for initial E, not IH
    const result = applyLtsRules("enough", QLATT_LTS_RULES);
    expect(result).toEqual(["EH", "N", "AH", "F"]);
  });

  it('"knight" -> N AY T (silent K before N)', () => {
    // K before N at word start -> silent, N -> N, IGH -> AY, T -> T
    const result = applyLtsRules("knight", QLATT_LTS_RULES);
    expect(result).toEqual(["N", "AY", "T"]);
  });

  it('"edge" -> EH D JH', () => {
    // E -> EH (default), D -> D, G before E -> JH, silent E
    const result = applyLtsRules("edge", QLATT_LTS_RULES);
    expect(result).toEqual(["EH", "D", "JH"]);
  });

  it('"psychology" -> P S IH CH AA L AA JH IY', () => {
    // Note: Elovitz rules do not handle silent P before S —
    // this is a known limitation of the rule set
    const result = applyLtsRules("psychology", QLATT_LTS_RULES);
    expect(result).toEqual(["P", "S", "IH", "CH", "AA", "L", "AA", "JH", "IY"]);
  });

  it('"pneumonia" -> P N Y UW M OW N IH AX', () => {
    // Note: Elovitz rules do not handle silent P before N —
    // this is a known limitation of the rule set
    const result = applyLtsRules("pneumonia", QLATT_LTS_RULES);
    expect(result).toEqual(["P", "N", "Y", "UW", "M", "OW", "N", "IH", "AX"]);
  });

  it('"hello" -> HH EH L OW', () => {
    const result = applyLtsRules("hello", QLATT_LTS_RULES);
    expect(result).toEqual(["HH", "EH", "L", "OW"]);
  });

  it('"world" -> W ER L D', () => {
    const result = applyLtsRules("world", QLATT_LTS_RULES);
    expect(result).toEqual(["W", "ER", "L", "D"]);
  });

  it('"beautiful" -> B IY Y UW T IH F UH L', () => {
    // EA -> IY (rule 28), U -> Y UW (default U), T -> T,
    // I -> IH, FUL -> F UH L
    const result = applyLtsRules("beautiful", QLATT_LTS_RULES);
    expect(result).toEqual(["B", "IY", "Y", "UW", "T", "IH", "F", "UH", "L"]);
  });
});
