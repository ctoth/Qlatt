import {
  loadBundledRulepackSpec,
  loadFrontendResources,
} from "../src/declarative-frontend/rule-pack";

const lexicon = loadFrontendResources(loadBundledRulepackSpec("dectalk-english")).lexicon;
if (!lexicon) throw new Error("E_FRONTEND_CONFIG: dectalk-english requires resources.lexicon");
const d = lexicon.dictionary;
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
