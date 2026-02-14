import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";

describe("declarative frontend rulepack structural impact", () => {
  it("keeps active phone order stable while retaining suppressed provenance tokens", () => {
    const sequence = [
      { phoneme: "P_CL", stress: 1, word: "pat", type: "stop_closure" },
      { phoneme: "AE", stress: 1, word: "pat", type: "vowel" },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence" },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"] });
    const activePhones = out.filter((token) => token.status !== 2).map((token) => token.phoneme);
    const suppressedOriginalVowel = out.find((token) => token.phoneme === "AE" && token.status === 2);
    const activeReplacementVowel = out.find((token) => token.phoneme === "AE" && token.status !== 2);

    expect(activePhones).toEqual(["P_CL", "P_REL", "P_ASP", "AE", "SIL"]);
    expect(suppressedOriginalVowel).toBeTruthy();
    expect(activeReplacementVowel).toBeTruthy();
  });

  it("assigns non-zero [L,R] spans to inserted release and aspiration tokens", () => {
    const sequence = [
      { phoneme: "T_CL", stress: 1, word: "tap", type: "stop_closure" },
      { phoneme: "AE", stress: 1, word: "tap", type: "vowel" },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence" },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"] });
    const rel = out.find((token) => token.phoneme === "T_REL" && token.status !== 2);
    const asp = out.find((token) => token.phoneme === "T_ASP" && token.status !== 2);

    expect(rel).toBeTruthy();
    expect(asp).toBeTruthy();
    expect(rel?.sync_left).not.toEqual(rel?.sync_right);
    expect(asp?.sync_left).not.toEqual(asp?.sync_right);
    expect(rel?.sync_right).toBe(asp?.sync_left);
  });
});
