import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { FRAME_VALUES_SCHEMA } from "../src/declarative-frontend/hrg/frame-program";
import {
  PARAMETER_SCOPE_FEATURE,
  runGraphRuleEngine,
} from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

/**
 * Parameter scopes (src/declarative-frontend/hrg/parameter-scope.ts): a named
 * overlay on the run's parameters, bound to Items by a feature.
 *
 * The fixture is four Segments, the last two in the scope "fast", and a
 * parameter `policy.pace` that the scope changes from 100 to 250.
 */

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        duration: { kind: "number" },
        active: { kind: "boolean" },
        pace: { kind: "number" },
        other_pace: { kind: "number" },
        plain: { kind: "number" },
        found: { kind: "string" },
        pace_frames: FRAME_VALUES_SCHEMA,
        [PARAMETER_SCOPE_FEATURE]: { kind: "string" },
      },
    },
    mark: {
      features: {
        value: { kind: "number" },
        tag: { kind: "string" },
        [PARAMETER_SCOPE_FEATURE]: { kind: "string" },
      },
    },
  },
  relations: {
    Segment: { kind: "list", itemTypes: ["segment"] },
    Mark: { kind: "list", itemTypes: ["mark"] },
  },
} as const satisfies HrgSchema;

const CITATION = "fixture";

const RELATIONS = {
  Segment: {
    type: "base" as const,
    features: { phoneme: [], active: [true, false], found: [], pace_frames: [] },
    scalars: { duration: {}, pace: {}, other_pace: {}, plain: {} },
  },
  Mark: { type: "point" as const, value_type: "number" },
};

const PARAMETERS = { policy: { pace: { value: 100, citations: [CITATION] } } };
const SCOPES = { fast: { policy: { pace: 250 } } };

/** Segments a, b in no scope and c, d in `scope`; the decision that bound c and d. */
function fixture(scope: string | null = "fast"): { utterance: Utterance; binding?: string } {
  const utterance = new Utterance(SCHEMA);
  const build = utterance.beginTransaction({
    ruleId: "fixture",
    phase: "input",
    tag: "fixture",
    reason: "fixture",
    citations: [CITATION],
  });
  const items = ["a", "b", "c", "d"].map((id) => build.createItem("segment", id));
  for (const item of items) {
    build.set(item, "phoneme", item.id.toUpperCase());
    build.set(item, "duration", 10);
    build.set(item, "active", true);
    build.append("Segment", item);
  }
  build.partitionAnchors(items, utterance.axis.start.id, utterance.axis.end.id);
  build.commit();
  if (scope === null) return { utterance };
  const bind = utterance.beginTransaction({
    ruleId: "scope_fast",
    phase: "input",
    tag: "scope",
    reason: "a command made the scope fast for c and d",
    citations: [CITATION],
  });
  for (const item of items.slice(2)) bind.set(item, PARAMETER_SCOPE_FEATURE, scope);
  bind.commit();
  return {
    utterance,
    binding: utterance.getItem("c")?.latestWrite(PARAMETER_SCOPE_FEATURE)?.decisionId,
  };
}

const paceRule = {
  read_pace: {
    select: { relation: "Segment" },
    apply: [{ field: "pace", op: "set", value: "params.policy.pace", tag: "fixture" }],
    citations: [CITATION],
  },
};

describe("parameter scopes", () => {
  it("gives a rule the parameters of the scope of the Item it evaluates on", () => {
    const { utterance } = fixture();
    const spec = compileRuleEngineSpec({
      parameters: PARAMETERS,
      relations: RELATIONS,
      rules: paceRule,
      phases: [{ name: "prosody", rules: ["read_pace"] }],
    });
    runGraphRuleEngine(utterance, spec, { parameterScopes: SCOPES });
    expect(["a", "b", "c", "d"].map((id) => utterance.getItem(id)?.get("pace"))).toEqual([
      100, 100, 250, 250,
    ]);
  });

  it("makes the decision that read the parameters depend on the scope's binding, and no other", () => {
    const { utterance, binding } = fixture();
    expect(binding).toBeTruthy();
    const spec = compileRuleEngineSpec({
      parameters: PARAMETERS,
      relations: RELATIONS,
      rules: {
        ...paceRule,
        no_parameters: {
          select: { relation: "Segment" },
          apply: [{ field: "plain", op: "set", value: "1", tag: "fixture" }],
          citations: [CITATION],
        },
      },
      phases: [{ name: "prosody", rules: ["read_pace", "no_parameters"] }],
    });
    runGraphRuleEngine(utterance, spec, { parameterScopes: SCOPES });
    expect(utterance.getItem("c")?.latestWrite("pace")?.parents).toContain(binding);
    expect(utterance.getItem("a")?.latestWrite("pace")?.parents).not.toContain(binding);
    expect(utterance.getItem("c")?.latestWrite("plain")?.parents).not.toContain(binding);
  });

  it("keeps the rule's Item for the parameters inside a scan's condition", () => {
    const { utterance } = fixture();
    const spec = compileRuleEngineSpec({
      parameters: PARAMETERS,
      relations: RELATIONS,
      rules: {
        look_back: {
          select: { relation: "Segment", where: "current.id == 'c' || current.id == 'b'" },
          define: {
            // True at the first candidate when `params` is the rule Item's.
            seen: "look_back_where(current, 10, 'params.policy.pace == 250')",
          },
          apply: [
            { field: "found", op: "set", value: "seen == null ? 'none' : seen.id", tag: "fixture" },
          ],
          citations: [CITATION],
        },
      },
      phases: [{ name: "prosody", rules: ["look_back"] }],
    });
    runGraphRuleEngine(utterance, spec, { parameterScopes: SCOPES });
    // c is in the scope: its candidate b, in none, is tested with c's parameters.
    expect(utterance.getItem("c")?.get("found")).toBe("b");
    expect(utterance.getItem("b")?.get("found")).toBe("none");
  });

  it("reads another Item's parameters with params_of", () => {
    const { utterance, binding } = fixture();
    const spec = compileRuleEngineSpec({
      parameters: PARAMETERS,
      relations: RELATIONS,
      rules: {
        next_pace: {
          select: { relation: "Segment", where: "next != null" },
          apply: [
            {
              field: "other_pace",
              op: "set",
              value: "params_of(next).policy.pace",
              tag: "fixture",
            },
          ],
          citations: [CITATION],
        },
      },
      phases: [{ name: "prosody", rules: ["next_pace"] }],
    });
    runGraphRuleEngine(utterance, spec, { parameterScopes: SCOPES });
    expect(["a", "b", "c"].map((id) => utterance.getItem(id)?.get("other_pace"))).toEqual([
      100, 250, 250,
    ]);
    expect(utterance.getItem("b")?.latestWrite("other_pace")?.parents).toContain(binding);
  });

  it("puts an Item a rule creates in the scope of the Item it is created for", () => {
    const { utterance } = fixture();
    const spec = compileRuleEngineSpec({
      parameters: PARAMETERS,
      relations: RELATIONS,
      rules: {
        mark_each: {
          select: { relation: "Segment", where: "current.id == 'a' || current.id == 'c'" },
          insert_point: {
            relation: "Mark",
            at: "midpoint(current)",
            value: "params.policy.pace",
            tag: "fixture",
          },
          citations: [CITATION],
        },
      },
      phases: [{ name: "prosody", rules: ["mark_each"] }],
    });
    runGraphRuleEngine(utterance, spec, { parameterScopes: SCOPES });
    const marks = utterance.relation("Mark").listItems();
    expect(marks.map((mark) => mark.get("value"))).toEqual([100, 250]);
    expect(marks.map((mark) => mark.get(PARAMETER_SCOPE_FEATURE))).toEqual([undefined, "fast"]);
  });

  it("runs the frames of a unit with the parameters of the unit's scope", () => {
    const { utterance } = fixture();
    const spec = compileRuleEngineSpec({
      parameters: PARAMETERS,
      tags: { fixture: "fixture" },
      relations: RELATIONS,
      frame_programs: {
        pace: {
          relation: "Segment",
          frame_ms: "5",
          registers: { seen: 0 },
          outputs: { PACE: "r.seen" },
          write: "pace_frames",
          tag: "fixture",
          citations: [CITATION],
        },
      },
      rules: {
        pace_frame: {
          kind: "frame",
          program: "pace",
          set: [{ register: "seen", value: "params.policy.pace", tag: "fixture" }],
          citations: [CITATION],
        },
      },
      phases: [
        { name: "pace", rules: ["pace_frame"] },
        { name: "finalize", after: ["pace"], rules: [], compute_times: true },
      ],
    });
    runGraphRuleEngine(utterance, spec, { parameterScopes: SCOPES });
    const frames = (id: string): unknown =>
      (utterance.getItem(id)?.get("pace_frames") as { columns?: { PACE?: unknown } } | undefined)
        ?.columns?.PACE;
    expect(frames("a")).toEqual([100, 100]);
    expect(frames("d")).toEqual([250, 250]);
  });

  it("refuses a scope that is not declared", () => {
    const { utterance } = fixture("slow");
    const spec = compileRuleEngineSpec({
      parameters: PARAMETERS,
      relations: RELATIONS,
      rules: paceRule,
      phases: [{ name: "prosody", rules: ["read_pace"] }],
    });
    expect(() => runGraphRuleEngine(utterance, spec, { parameterScopes: SCOPES })).toThrow(
      /E_HRG_PARAMETER_SCOPE.*'slow'/,
    );
  });

  it("changes nothing when no scope is declared: the same journal as without the option", () => {
    const journal = (options: Parameters<typeof runGraphRuleEngine>[2]): string => {
      const { utterance } = fixture(null);
      const spec = compileRuleEngineSpec({
        parameters: PARAMETERS,
        relations: RELATIONS,
        rules: paceRule,
        phases: [{ name: "prosody", rules: ["read_pace"] }],
      });
      runGraphRuleEngine(utterance, spec, options);
      return JSON.stringify(utterance.journal());
    };
    expect(journal({ parameterScopes: {} })).toBe(journal({}));
    // Declared scopes that bind no Item change nothing either.
    expect(journal({ parameterScopes: SCOPES })).toBe(journal({}));
  });
});
