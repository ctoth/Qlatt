import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

describe("declarative frontend navigation helpers", () => {
  it("supports prev cursor over active stream order", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        first_only: {
          select: {
            stream: "phone",
            where: "prev == null",
          },
          apply: [{ field: "duration", op: "add", value: "10", tag: "n" }],
        },
      },
      phases: [{ name: "duration", rules: ["first_only"] }],
    };

    const input = [
      { stream: "phone", phoneme: "T", duration: 70, status: 1 },
      { stream: "phone", phoneme: "AE", duration: 100, status: 1 },
      { stream: "phone", phoneme: "S", duration: 80, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBe(80);
    expect(out[1].duration).toBe(100);
    expect(out[2].duration).toBe(80);
  });

  it("filters suppressed tokens for next cursor", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        last_active_only: {
          select: {
            stream: "phone",
            where: "next == null",
          },
          apply: [{ field: "duration", op: "add", value: "5", tag: "n2" }],
        },
      },
      phases: [{ name: "duration", rules: ["last_active_only"] }],
    };

    const input = [
      { stream: "phone", phoneme: "T", duration: 70, status: 1 },
      { stream: "phone", phoneme: "AE", duration: 100, status: 2 },
      { stream: "phone", phoneme: "S", duration: 80, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBe(70);
    expect(out[1].duration).toBe(100);
    expect(out[2].duration).toBe(85);
  });

  it("supports ahead()/behind() for deeper active-token navigation", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        ahead_rule: {
          select: {
            stream: "phone",
            where: "current.phoneme == 'A'",
          },
          define: {
            a2: "ahead(current, 2)",
          },
          apply: [
            {
              field: "duration",
              op: "add",
              value: "a2 != null && a2.phoneme == 'C' ? 7 : 0",
              tag: "ahead",
            },
          ],
        },
        behind_rule: {
          select: {
            stream: "phone",
            where: "current.phoneme == 'D'",
          },
          define: {
            b2: "behind(current, 2)",
          },
          apply: [
            {
              field: "duration",
              op: "add",
              value: "b2 != null && b2.phoneme == 'B' ? 9 : 0",
              tag: "behind",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["ahead_rule", "behind_rule"] }],
    };

    const input = [
      { stream: "phone", phoneme: "A", duration: 70, status: 1 },
      { stream: "phone", phoneme: "X", duration: 50, status: 2 },
      { stream: "phone", phoneme: "B", duration: 80, status: 1 },
      { stream: "phone", phoneme: "C", duration: 90, status: 1 },
      { stream: "phone", phoneme: "D", duration: 100, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBe(77);
    expect(out[2].duration).toBe(80);
    expect(out[4].duration).toBe(109);
  });

  it("supports look_back_where() for predicate-based backward scans", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        lookback_rule: {
          select: {
            stream: "phone",
            where: "current.phoneme == 'K'",
          },
          define: {
            hit: "look_back_where(current, 4, \"has(current.stress) && current.stress == 1\")",
          },
          apply: [
            {
              field: "duration",
              op: "add",
              value: "hit != null && hit.phoneme == 'EH' ? 13 : 0",
              tag: "look_back_where",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["lookback_rule"] }],
    };

    const input = [
      { stream: "phone", phoneme: "P", type: "stop", duration: 70, status: 1 },
      { stream: "phone", phoneme: "AA", type: "vowel", stress: 1, duration: 100, status: 2 },
      { stream: "phone", phoneme: "EH", type: "vowel", stress: 1, duration: 80, status: 1 },
      { stream: "phone", phoneme: "IH", type: "vowel", stress: 0, duration: 90, status: 1 },
      { stream: "phone", phoneme: "K", type: "stop", duration: 60, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[4].duration).toBe(73);
  });

  it("supports structural where predicates and look_back_pred()", () => {
    const spec = {
      streams: {
        phone: { type: "base", features: { type: ["vowel", "stop"] }, scalars: { duration: { unit: "ms" } } },
      },
      predicates: {
        is_stop: { expr: "current.type == 'stop'" },
        is_stressed: "has(current.stress) && current.stress == 1",
      },
      rules: {
        lookback_rule: {
          select: {
            stream: "phone",
            where: {
              all: [{ predicate: "is_stop" }, { expr: "current.phoneme == 'K'" }],
            },
          },
          define: {
            hit: "look_back_pred(current, 4, 'is_stressed')",
          },
          apply: [
            {
              field: "duration",
              op: "add",
              value: "hit != null && hit.phoneme == 'EH' ? 11 : 0",
              tag: "look_back_pred",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["lookback_rule"] }],
    };

    const input = [
      { stream: "phone", phoneme: "P", type: "stop", duration: 70, status: 1 },
      { stream: "phone", phoneme: "EH", type: "vowel", stress: 1, duration: 80, status: 1 },
      { stream: "phone", phoneme: "IH", type: "vowel", stress: 0, duration: 90, status: 1 },
      { stream: "phone", phoneme: "K", type: "stop", duration: 60, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[3].duration).toBe(71);
  });

  it("exposes current.next_boundary for the nearest same-word SIL break", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        boundary_rule: {
          select: {
            stream: "phone",
            where: "current.word == 'same'",
          },
          apply: [
            {
              field: "duration",
              op: "add",
              value: "current.next_boundary != null && current.next_boundary.breakIndex == 3 ? 17 : 0",
              tag: "next_boundary",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["boundary_rule"] }],
    };

    const input = [
      { stream: "phone", phoneme: "S", type: "fricative", word: "same", duration: 70, status: 1 },
      { stream: "phone", phoneme: "EY", type: "vowel", word: "same", duration: 100, status: 1 },
      { stream: "phone", phoneme: "M", type: "nasal", word: "same", duration: 80, status: 1 },
      { stream: "phone", phoneme: "SIL", breakIndex: 3, duration: 40, status: 1 },
      { stream: "phone", phoneme: "N", type: "nasal", word: "other", duration: 75, status: 1 },
      { stream: "phone", phoneme: "SIL", breakIndex: 4, duration: 40, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBe(87);
    expect(out[1].duration).toBe(117);
    expect(out[2].duration).toBe(97);
    expect(out[4].duration).toBe(75);
  });

  it("exposes punctuation SIL as current.next_boundary after same-word release tokens", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        boundary_rule: {
          select: {
            stream: "phone",
            where: "current.phoneme == 'AE'",
          },
          define: {
            boundary: "current.next_boundary",
          },
          apply: [
            {
              field: "duration",
              op: "add",
              value: "boundary != null && boundary.word == '.' ? 17 : 0",
              tag: "next_boundary",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["boundary_rule"] }],
    };

    const input = [
      { stream: "phone", phoneme: "AE", type: "vowel", word: "mat", duration: 100, status: 1 },
      { stream: "phone", phoneme: "T_CL", type: "stop_closure", word: "mat", duration: 40, status: 1 },
      { stream: "phone", phoneme: "T_REL", type: "stop_release", word: "mat", duration: 15, status: 1 },
      { stream: "phone", phoneme: "T_ASP", type: "stop_aspiration", word: "mat", duration: 15, status: 1 },
      { stream: "phone", phoneme: "SIL", type: "silence", word: ".", duration: 300, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBe(117);
  });

  it("exposes current.syllable.is_final for the final syllable of a word", () => {
    const spec = {
      streams: {
        syllable: { type: "span", spans: "phone" },
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      topology: { hierarchy: ["syllable", "phone"] },
      rules: {
        final_syllable_rule: {
          select: {
            stream: "phone",
            where: "current.syllable.is_final",
          },
          apply: [{ field: "duration", op: "add", value: "19", tag: "final_syllable" }],
        },
      },
      phases: [{ name: "duration", rules: ["final_syllable_rule"] }],
    };

    const input = [
      { id: "s1", stream: "syllable", status: 1 },
      { id: "p1", stream: "phone", parent: "s1", phoneme: "B", type: "stop", word: "better", duration: 70, status: 1 },
      { id: "p2", stream: "phone", parent: "s1", phoneme: "EH", type: "vowel", word: "better", duration: 100, status: 1 },
      { id: "s2", stream: "syllable", status: 1 },
      { id: "p3", stream: "phone", parent: "s2", phoneme: "T", type: "stop", word: "better", duration: 80, status: 1 },
      { id: "p4", stream: "phone", parent: "s2", phoneme: "ER", type: "vowel", word: "better", duration: 110, status: 1 },
      { id: "p5", stream: "phone", parent: "s2", phoneme: "SIL", breakIndex: 3, duration: 40, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out.find((t) => t.id === "p1")?.duration).toBe(70);
    expect(out.find((t) => t.id === "p2")?.duration).toBe(100);
    expect(out.find((t) => t.id === "p3")?.duration).toBe(99);
    expect(out.find((t) => t.id === "p4")?.duration).toBe(129);
  });

  it("supports find_within_word() scans that stop at word boundaries", () => {
    const spec = {
      streams: {
        phone: {
          type: "base",
          features: { type: ["vowel", "stop", "liquid"] },
          scalars: { duration: { unit: "ms" } },
        },
      },
      rules: {
        find_rule: {
          select: {
            stream: "phone",
            where: "current.phoneme == 'AE'",
          },
          define: {
            hit: "find_within_word(current, \"current.type == 'liquid'\")",
          },
          apply: [
            {
              field: "duration",
              op: "add",
              value: "hit != null && hit.phoneme == 'L' ? 23 : 0",
              tag: "find_within_word",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["find_rule"] }],
    };

    const input = [
      { stream: "phone", phoneme: "K", type: "stop", word: "call", duration: 70, status: 1 },
      { stream: "phone", phoneme: "AO", type: "vowel", word: "call", duration: 100, status: 1 },
      { stream: "phone", phoneme: "L", type: "liquid", word: "call", duration: 80, status: 1 },
      { stream: "phone", phoneme: "K", type: "stop", word: "cat", duration: 70, status: 1 },
      { stream: "phone", phoneme: "AE", type: "vowel", word: "cat", duration: 100, status: 1 },
      { stream: "phone", phoneme: "T", type: "stop", word: "cat", duration: 80, status: 1 },
      { stream: "phone", phoneme: "L", type: "liquid", word: "later", duration: 90, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[4].duration).toBe(100);
  });
});
