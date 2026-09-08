import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";
import { evaluateExpression } from "../src/declarative-frontend/cel-expressions";
import { expandCelMacros, parseCelMacroBlock } from "../src/declarative-frontend/cel-macros";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

type Condition = string | { all: Condition[] };
type Document = {
  functions?: Record<string, { params: string[]; body: string; citations: string[] }>;
  rules: Record<string, { select: { where: Condition }; citations: string[] }>;
};

function readDocument(path: string): Document {
  return load(readFileSync(`public/rules/frontends/${path}`, "utf8")) as Document;
}

const ACOUSTIC =
  "has(current.F1) && ((has(current.AV) && current.AV > 0) || (has(current.AVS) && current.AVS > 0))";
const ORIGINAL: Record<string, Condition> = {
  tobi_accent: {
    all: [
      `has(current.isAccented) && current.isAccented == true && current.stress == 1 && ${ACOUSTIC}`,
      "has(current.accentType) && current.accentType in ['H*', 'H*+L', 'L+H*', 'H+!H*', 'H*+H', 'H+L*', 'L*', 'L*+H']",
    ],
  },
  tobi_unaccented_declination: `current.phoneme != 'SIL' && (has(current.isAccented) ? current.isAccented != true : true) && ${ACOUSTIC}`,
  connected_speech_source_contour: `current.phoneme != 'SIL' && ${ACOUSTIC}`,
};

function expression(condition: Condition): string {
  return typeof condition === "string"
    ? condition
    : condition.all.map((part) => `(${expression(part)})`).join(" && ");
}

function outcome(predicate: string, current: Record<string, unknown>): unknown {
  try {
    return evaluateExpression(predicate, { current });
  } catch (error) {
    // Explicit null amplitudes can differ from absent fields. Preserve errors too.
    return { error: (error instanceof Error ? error.message : String(error)).split("\n")[0] };
  }
}

describe("prosody acoustic eligibility", () => {
  it("declares one inherited macro with an explicit item argument", () => {
    const base = readDocument("qlatt-english/frontend.yaml");
    expect(base.functions?.has_voiced_formants).toMatchObject({ params: ["item"] });
    expect(
      readDocument("qlatt-beauty/frontend.yaml").functions?.has_voiced_formants,
    ).toBeUndefined();
    const macros = parseCelMacroBlock(base.functions);
    for (const frontend of ["qlatt-english", "qlatt-beauty"]) {
      const raw = readDocument(`${frontend}/phases/prosody.yaml`);
      const compiled = loadBundledRulepackSpec(frontend);
      for (const ruleId of Object.keys(ORIGINAL)) {
        const caller = expression(raw.rules[ruleId].select.where);
        expect(caller).toContain("has_voiced_formants(current)");
        expect(expandCelMacros(caller, macros)).not.toContain("has_voiced_formants(");
        expect(compiled.rules[ruleId].citations).toEqual(
          expect.arrayContaining(raw.rules[ruleId].citations),
        );
        expect(compiled.rules[ruleId].citations).toEqual(
          expect.arrayContaining(base.functions!.has_voiced_formants.citations),
        );
      }
    }
  });

  for (const frontend of ["qlatt-english", "qlatt-beauty"]) {
    it(`${frontend} preserves complete selectors across missing, null, and amplitude cases`, () => {
      const spec = loadBundledRulepackSpec(frontend);
      const accents = [
        {},
        { isAccented: false },
        ...["H*", "H*+L", "L+H*", "H+!H*", "H*+H", "H+L*", "L*", "L*+H", "unknown"].map(
          (accentType) => ({ isAccented: true, accentType }),
        ),
      ];
      for (const [ruleId, original] of Object.entries(ORIGINAL)) {
        const candidate = expression((spec.rules[ruleId].select as { where: Condition }).where);
        for (const F1 of [undefined, null, 0, 500]) {
          for (const AV of [undefined, null, -1, 0, 60]) {
            for (const AVS of [undefined, null, -1, 0, 60]) {
              for (const accent of accents) {
                for (const stress of [0, 1]) {
                  for (const phoneme of ["AA", "SIL"]) {
                    const current = {
                      phoneme,
                      stress,
                      ...accent,
                      ...Object.fromEntries(
                        Object.entries({ F1, AV, AVS }).filter(([, value]) => value !== undefined),
                      ),
                    };
                    expect(
                      outcome(candidate, current),
                      JSON.stringify({ ruleId, current }),
                    ).toEqual(outcome(expression(original), current));
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  it("preserves DECtalk's separate null-guarded source eligibility", () => {
    const rule =
      loadBundledRulepackSpec("dectalk-english").rules.dectalk_connected_speech_source_contour;
    expect(expression((rule.select as { where: Condition }).where).replace(/\s+/g, " ")).toBe(
      "current.phoneme != 'SIL' && has(current.F1) && ((current.AV != null && current.AV > 0) || (current.AVS != null && current.AVS > 0))",
    );
  });

  for (const frontendId of ["qlatt-english", "qlatt-beauty"]) {
    it(`${frontendId} preserves F0 targets, tags, and rule matches`, () => {
      // Recorded before extraction: compare actual graph output, including Beauty's
      // voice-specific rise. The separate selector test retains a DECtalk control.
      const results = ["The cat sat.", "Will the cat sit?"].map((text) => {
        const provenance = createProvenanceCollector();
        const { utterance } = textToKlattTrackDetailed(text, 110, 30, { frontendId, provenance });
        const raw = readDocument(`${frontendId}/phases/prosody.yaml`);
        const macro = readDocument("qlatt-english/frontend.yaml").functions!.has_voiced_formants;
        for (const record of provenance.getDecisions()) {
          const ruleId = Object.keys(ORIGINAL).find((id) => record.reason === `${id} matched`);
          if (ruleId) {
            expect(record.citations).toEqual(expect.arrayContaining(macro.citations));
            expect(record.citations).toEqual(expect.arrayContaining(raw.rules[ruleId].citations));
          }
        }
        const matches = provenance
          .getDecisions()
          .filter((record) =>
            Object.keys(ORIGINAL).some((ruleId) => record.reason === `${ruleId} matched`),
          )
          .map(({ subject, reason }) => ({ subject, reason }));
        expect(matches.length).toBeGreaterThan(0);
        const points = utterance
          .relation("F0Point")
          .listItems()
          .map((point) => {
            const anchor = utterance.temporalAnchor(point);
            return {
              value: point.get("value"),
              tag: point.get("tag"),
              anchor: anchor && {
                leftMarkId: anchor.leftMarkId,
                rightMarkId: anchor.rightMarkId,
                ratio: anchor.ratio,
              },
            };
          });
        expect(points.length).toBeGreaterThan(0);
        return {
          text,
          points,
          matches,
        };
      });
      expect(results).toMatchSnapshot();
    });
  }
});
