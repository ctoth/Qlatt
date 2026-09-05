import { readFileSync } from "node:fs";

const d = JSON.parse(readFileSync("public/dectalk-dictionary.json", "utf8")) as Record<
  string,
  string
>;
console.log("entries:", Object.keys(d).length);
for (const w of [
  "judicial",
  "hello",
  "world",
  "nuclear",
  "read",
  "the",
  "a",
  "colonel",
  "tomato",
]) {
  console.log(w.padEnd(12), "->", d[w] ?? "(absent)");
}
