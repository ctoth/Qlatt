/**
 * DECtalk homograph oracle.
 *
 * For each word of test/fixtures/dectalk-oracle/dectalk-us-homographs-v1.phonemes.json
 * (the dictionary words with two entries) and each of its sentences, the
 * entry the dectalk-english g2p path speaks is the one DECtalk 4.63 spoke
 * (scripts/oracle/export-homograph-fixture.ts): the same phones, the same
 * stress.
 *
 * KNOWN_GAPS is a ratchet: each listed `word context` must still differ, so
 * fixing one forces its removal.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dectalkAllophoneName, parsePhonemeLog } from "../scripts/oracle/allophones";
import { pronounceClause } from "../src/g2p";

const repoRoot = path.resolve(__dirname, "..");
const readJson = <T>(...parts: string[]): T =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, ...parts), "utf8")) as T;

const fixture = readJson<{
  contexts: Record<string, string[]>;
  entries: Record<string, Record<string, string>>;
}>("test", "fixtures", "dectalk-oracle", "dectalk-us-homographs-v1.phonemes.json");
const dictionary = readJson<Record<string, string>>("public", "dectalk-dictionary.json");
const lookup = (word: string): string[] | null => dictionary[word]?.split(" ") ?? null;
const options = {
  ltsPath: "/rules/frontends/dectalk-english/lts-table.json",
  morphologyPath: "/rules/frontends/qlatt-english/morphology.yaml",
  stressPolicyPath: "/rules/frontends/qlatt-english/stress-policy.yaml",
};

const KNOWN_GAPS: Readonly<Record<string, string>> = {};

function ours(word: string, context: string): string {
  const template = fixture.contexts[context];
  const words = template.map((part) => (part === "*" ? word : part));
  return pronounceClause(words, lookup, options)
    [template.indexOf("*")].phonemes.map((phoneme) => {
      const digit = /[12]$/.exec(phoneme)?.[0] ?? "";
      return `${dectalkAllophoneName(phoneme)}${digit}`;
    })
    .join(" ");
}
const theirs = (log: string): string =>
  parsePhonemeLog(log)
    .map((phone) => `${phone.name}${phone.stress ? phone.stress.toString() : ""}`)
    .join(" ");

const cases = Object.entries(fixture.entries).flatMap(([word, byContext]) =>
  Object.entries(byContext).map(([context, log]) => ({
    key: `${word} ${context}`,
    word,
    context,
    log,
  })),
);

describe("DECtalk homograph oracle", () => {
  it("lists only recorded sentences as known gaps", () => {
    const keys = new Set(cases.map(({ key }) => key));
    expect(Object.keys(KNOWN_GAPS).filter((key) => !keys.has(key))).toEqual([]);
  });

  it("speaks DECtalk's entry of every homograph in every recorded sentence", () => {
    const wrong: string[] = [];
    for (const { key, word, context, log } of cases) {
      if (key in KNOWN_GAPS) continue;
      const mine = ours(word, context);
      const expected = theirs(log);
      if (mine !== expected) wrong.push(`${key}: DECtalk ${expected} | frontend ${mine}`);
    }
    expect(wrong).toEqual([]);
  });

  // A suffixed word whose root has two entries: the rules that read the
  // suffix's class (LTS/ls_homo.h rules 0-7) come first. DECtalk's log for
  // each sentence, the word's own symbols.
  it.each([
    ["houses", 0, "hx' awz ixz "],
    ["the houses", 1, "hx' aws ixz "],
    ["they housed it", 1, "hx' awz d "],
    ["the used car", 1, "` yuz d "],
    ["he uses it", 1, "` yuz ixz "],
    ["they are living", 2, "ll' ihv ixnx"],
    ["the living cat", 1, "ll' ihv ixnx"],
    ["it closes", 1, "k ll' owz ixz "],
    ["the closes", 1, "k ll' owz ixz "],
    ["he presented it", 1, "p r ihz ' ehn t ixd "],
    ["the abused cat", 1, "axb ' yuz d "],
    ["they abused it", 1, "axb ' yuz d "],
    ["he reads", 1, "r ' iyd z "],
    ["she lives here", 1, "ll' ihv z "],
    ["the lives", 1, "ll' ihv z "],
  ])("speaks the suffixed homograph of '%s' as DECtalk does", (sentence, place, log) => {
    const spoken = pronounceClause(sentence.split(" "), lookup, options)
      [place].phonemes.map((phoneme) => {
        const digit = /[12]$/.exec(phoneme)?.[0] ?? "";
        return `${dectalkAllophoneName(phoneme)}${digit}`;
      })
      .join(" ");
    expect(spoken).toBe(theirs(log));
  });

  it.each(Object.entries(KNOWN_GAPS))("%s is still a known gap (%s)", (key) => {
    const found = cases.find((candidate) => candidate.key === key);
    expect(found && ours(found.word, found.context)).not.toBe(found && theirs(found.log));
  });
});
