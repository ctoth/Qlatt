import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";
import { describe, expect, it, vi } from "vitest";

const speakerDir = "public/rules/frontends/dectalk-english/speakers";
const voices = readdirSync(speakerDir).filter((name) => name.endsWith(".yaml"));

function parseVoice(text: string): Record<string, unknown> {
  const value = load(text);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a voice parameter record");
  }
  return value as Record<string, unknown>;
}

// DECtalk 4.63 Ph_drwt02.c passes f0a2=f0_lp_filter to mlsh1.
// ph_defs.h defines FRAC_ONE=16384 and mlsh1(x,y)=(x*y)>>14.
// frac4mul's Q12 scale belongs to the separate speaker pitch-range transform.
describe("DECtalk Q14 pitch-filter coefficients", () => {
  it.each(voices)("uses the native filter scale for %s", (name) => {
    const voice = parseVoice(readFileSync(join(speakerDir, name), "utf8"));
    expect(typeof voice.f0_lp_filter).toBe("number");
    expect(voice.f0_lp_filter_alpha).toBe(Number(voice.f0_lp_filter) / 16384);
  });

  it("preserves the Q14 scale when importing voice tables", async () => {
    const outputs: string[] = [];
    vi.doMock("node:fs", () => ({
      default: {
        mkdirSync() {},
        readFileSync: () => "name: Betty\nf0_lp_filter: 2175\n",
        writeFileSync: (_path: string, text: string) => outputs.push(text),
      },
    }));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await import("../scripts/dt1-import-voices");
      expect(outputs.length).toBeGreaterThan(0);
      for (const output of outputs) {
        const voice = parseVoice(output);
        expect(voice.f0_lp_filter).toBe(2175);
        expect(voice.f0_lp_filter_alpha).toBe(2175 / 16384);
      }
    } finally {
      vi.doUnmock("node:fs");
      log.mockRestore();
    }
  });
});
