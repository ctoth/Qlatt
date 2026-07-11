import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";

describe("declarative frontend resource identity", () => {
  it.each([
    ["qlatt-english", "F2", 1990],
    ["dectalk-english", "TL", 7],
    ["qlatt-beauty", "F2", 2288],
  ])(
    "materializes structural targets from %s inventory",
    (frontendId, parameter, expected) => {
      const output = runDeclarativeFrontend(
        [
          {
            id: "stop",
            phoneme: "K",
            type: "stop",
            stream: "phone",
            status: 1,
            duration: 80,
            inherentDuration: 80,
            params: {},
            is_stop_base: true,
            is_obstruent: true,
            voiceless: true,
            velar: true,
            word: "cat",
          },
          {
            id: "vowel",
            phoneme: "IY",
            type: "vowel",
            stream: "phone",
            status: 1,
            duration: 100,
            inherentDuration: 100,
            params: { F1: 300, F2: 2300, F3: 3000, B1: 60, B2: 90, AV: 60 },
            stress: 1,
            word: "key",
          },
        ],
        { frontendId, phases: ["structural"] },
      );

      const release = output.find(
        (token) => token.phoneme === "K_REL" && token.status !== 2,
      );
      expect(release).toBeDefined();
      expect(release?.params[parameter]).toBe(expected);
    },
  );
});
