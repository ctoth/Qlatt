/**
 * DECtalk letter-to-sound oracle.
 *
 * For each word of test/fixtures/dectalk-oracle/dectalk-us-lts-v1.phonemes.json
 * (417 words that are not in DECtalk's dictionary, with DECtalk's phoneme log;
 * scripts/oracle/export-lts-fixture.ts), the pronunciation the dectalk-english
 * frontend's g2p path gives (dictionary, suffix stripping, table
 * letter-to-sound) equals DECtalk's in phonemes and in stress.
 *
 * KNOWN_GAPS is a ratchet: each listed word must still differ, so fixing one
 * forces its removal.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dectalkAllophoneName, parsePhonemeLog } from "../scripts/oracle/allophones";
import { pronounce } from "../src/g2p";
import { applyLtsRules, type LtsTable } from "../src/g2p/table-lts";
import { receivedFormClassWord } from "../src/g2p/table-lts-pronounce";
import { stripSuffixes } from "../src/g2p/table-suffix";

const repoRoot = path.resolve(__dirname, "..");
const readJson = <T>(...parts: string[]): T =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, ...parts), "utf8")) as T;

const fixture = readJson<{ entries: Record<string, string> }>(
  "test",
  "fixtures",
  "dectalk-oracle",
  "dectalk-us-lts-v1.phonemes.json",
);
const dictionary = readJson<Record<string, string>>("public", "dectalk-dictionary.json");
const lookup = (word: string): string[] | null => dictionary[word]?.split(" ") ?? null;
const options = {
  ltsPath: "/rules/frontends/dectalk-english/lts-table.json",
  morphologyPath: "/rules/frontends/qlatt-english/morphology.yaml",
  stressPolicyPath: "/rules/frontends/qlatt-english/stress-policy.yaml",
};

const KNOWN_GAPS: Readonly<Record<string, string>> = {
  mrs: "DECtalk reads the abbreviation letter by letter (EH M AA R EH S)",
};

/** Words whose form classes differ from DECtalk's; the same ratchet. */
const FORM_CLASS_GAPS: Readonly<Record<string, string>> = {
  are: "first in a sentence, as the fixture says it, it takes the class of LTS/ls_task.c verbs[]",
  fbi: "DECtalk reports no class for the upper-case dictionary entry FBI",
};

/** `["K", "EY1", "P"]` as DECtalk names with the stress digit kept. */
const ours = (word: string): string[] =>
  pronounce(word, lookup, options).phonemes.map((phoneme) => {
    const digit = /[0-9]$/.exec(phoneme)?.[0] ?? "";
    return `${dectalkAllophoneName(phoneme)}${digit}`;
  });
const theirs = (log: string): string[] =>
  parsePhonemeLog(log).map((phone) => `${phone.name}${phone.stress ?? ""}`);

describe("DECtalk letter-to-sound oracle", () => {
  it("lists only oracle words as known gaps", () => {
    expect(Object.keys(KNOWN_GAPS).filter((word) => !(word in fixture.entries))).toEqual([]);
  });

  it("pronounces every other oracle word as DECtalk does, with its stress", () => {
    const wrong: string[] = [];
    for (const [word, log] of Object.entries(fixture.entries)) {
      if (word in KNOWN_GAPS) continue;
      const mine = ours(word).join(" ");
      const expected = theirs(log).join(" ");
      if (mine !== expected) wrong.push(`${word}: DECtalk ${expected} | frontend ${mine}`);
    }
    expect(wrong).toEqual([]);
  });

  it.each(Object.entries(KNOWN_GAPS))("%s is still a known gap (%s)", (word) => {
    expect(ours(word).join(" ")).not.toBe(theirs(fixture.entries[word]).join(" "));
  });
});

describe("table letter-to-sound, by stage", () => {
  const table = readJson<LtsTable & Parameters<typeof stripSuffixes>[2]>(
    "public",
    "rules",
    "frontends",
    "dectalk-english",
    "lts-table.json",
  );

  it("gives a vowel before a silent e its long form, with an unstressed alternative", () => {
    // "cape": K, EY (AX when unstressed), P; the e produces nothing.
    expect(applyLtsRules("cape", table).map((phone) => [phone.sphone, phone.uphone])).toEqual([
      [49, 0],
      [3, 17],
      [45, 0],
    ]);
  });

  it("marks a suffix as a morpheme and writes its letters back", () => {
    // "barked": the D of -ed carries the [+] morpheme flag (0x08).
    const raw = applyLtsRules("barked", table);
    expect(raw.at(-1)).toMatchObject({ sphone: 48, flag: 0x08 });
  });

  it("strips a suffix to a dictionary root and voices it by the root's last phoneme", () => {
    const roots: Record<string, string[]> = {
      nurse: ["N", "RR1", "S"],
      reply: ["R", "IH0", "P", "L", "AY1"],
      cat: ["K", "AE1", "T"],
    };
    const find = (word: string): string[] | null => roots[word] ?? null;
    // After a sibilant: IX Z. "i" back to "y", then Z after a vowel. S after
    // a voiceless consonant.
    expect(stripSuffixes("nurses", find, table).phonemes).toEqual(["N", "RR1", "S", "IX0", "Z"]);
    expect(stripSuffixes("replies", find, table).phonemes).toEqual([
      "R",
      "IH0",
      "P",
      "L",
      "AY1",
      "Z",
    ]);
    expect(stripSuffixes("cats", find, table).phonemes).toEqual(["K", "AE1", "T", "S"]);
    expect(stripSuffixes("cats", find, table).root).toBe("cat");
    expect(stripSuffixes("dogs", find, table)).toEqual({
      phonemes: null,
      formClass: 0,
      root: null,
    });
  });

  it("marks the words DECtalk enters with a verb-phrase start", () => {
    // DECtalk's phoneme log prints ")" before the word: "hx` iy) g ' owz",
    // "dhey) w ` ehn t"; none before "tested" (test is noun and verb) or "is".
    const starts = (word: string): unknown => pronounce(word, lookup, options).phraseStart;
    expect(starts("go")).toBe("vp");
    expect(starts("goes")).toBe("vp");
    expect(starts("went")).toBe("vp");
    expect(starts("tested")).toBeUndefined();
    expect(starts("is")).toBeUndefined();
  });

  it("marks the mini-dictionary words as prepositional-phrase starts", () => {
    // The log prints "(" before them: "^ ( t uh", "^ ( aen d", "^ ( f rr".
    const starts = (word: string): unknown => pronounce(word, lookup, options).phraseStart;
    expect(starts("to")).toBe("pp");
    expect(starts("and")).toBe("pp");
    expect(starts("for")).toBe("pp");
    expect(starts("from")).toBeUndefined();
  });

  it("gives the class word as DECtalk's phonetic stage receives it", () => {
    // PH/ph_task.c:600 adds a sign-extended low half: with bit 15 (that) set
    // the high half arrives one less.
    expect(receivedFormClassWord(0x00800000)).toBe(0x00800000);
    expect(receivedFormClassWord(0x00808000)).toBe(0x007f8000);
    expect(receivedFormClassWord(0x00008000)).toBe(0xffff8000);
    // "what" (adj adv pron that func) loses func and counts as a verb;
    // "where" (no that bit) arrives as it is.
    const what = pronounce("what", lookup, options);
    expect(what.formClasses).toEqual(["adj", "adv", "pron", "that", "func"]);
    expect(what.receivedFormClasses).toContain("verb");
    expect(what.receivedFormClasses).not.toContain("func");
    const where = pronounce("where", lookup, options);
    expect(where.receivedFormClasses).toEqual(where.formClasses);
  });

  it("reports the phones the dictionary exempts from allophone rules", () => {
    // Dic_us.txt: yellow y'E~lo, bladder bl'@~dR; "~" blocks the next phone.
    const blocked = (word: string): unknown => pronounce(word, lookup, options).rulesBlockedAt;
    expect(blocked("yellow")).toEqual([2]);
    expect(blocked("bladder")).toEqual([3]);
    // A suffixed word keeps its root's marks: "bladders" is bladder + Z.
    expect(pronounce("bladders", lookup, options).source).toBe("morphology");
    expect(blocked("bladders")).toEqual([3]);
    expect(blocked("hello")).toBeUndefined();
  });
});

describe("DECtalk form class oracle", () => {
  // DECtalk's form log for one word at a time
  // (scripts/oracle/export-form-class-fixture.ts): the bit numbers of the
  // word's form class, "" when DECtalk does not know the word.
  const recorded = readJson<{ entries: Record<string, string> }>(
    "test",
    "fixtures",
    "dectalk-oracle",
    "dectalk-us-form-classes-v1.json",
  ).entries;
  const names = readJson<{ formClassNames: (string | null)[] }>(
    "public",
    "rules",
    "frontends",
    "dectalk-english",
    "lts-table.json",
  ).formClassNames;
  const bitsOf = (word: string): string =>
    (pronounce(word, lookup, options).formClasses ?? ["absent"])
      .map((name) => names.indexOf(name).toString())
      .join(" ");

  it("lists only oracle words as known gaps", () => {
    expect(Object.keys(FORM_CLASS_GAPS).filter((word) => !(word in recorded))).toEqual([]);
  });

  it("gives every other oracle word DECtalk's form classes", () => {
    const wrong: string[] = [];
    for (const [word, bits] of Object.entries(recorded)) {
      if (word in FORM_CLASS_GAPS) continue;
      const mine = bitsOf(word);
      if (mine !== bits) wrong.push(`${word}: DECtalk [${bits}] | frontend [${mine}]`);
    }
    expect(wrong).toEqual([]);
  });

  it.each(Object.entries(FORM_CLASS_GAPS))("%s is still a known gap (%s)", (word) => {
    expect(bitsOf(word)).not.toBe(recorded[word]);
  });
});
