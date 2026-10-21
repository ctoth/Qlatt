import {
  loadBundledRulepackSpec,
  loadFrontendResources,
} from "../src/declarative-frontend/rule-pack";
import { normalizeGraphText } from "../src/declarative-frontend/source-recognition";
import { pronounce as pronounceWithResources } from "../src/g2p";
import { applyLtsRules as applyConfiguredLtsRules, type LtsRulesData } from "../src/g2p/lts-engine";
import { assignStress as assignConfiguredStress, type StressHint } from "../src/g2p/stress";
import {
  isVowel as isConfiguredVowel,
  syllabify as syllabifyWithResources,
} from "../src/g2p/syllabify";
import type { DictLookup } from "../src/g2p/types";

// These behavior fixtures explicitly select one frontend; shared code has no defaults.
const selected = loadFrontendResources(loadBundledRulepackSpec("qlatt-english"));
if (!selected.stress || !selected.morphology)
  throw new Error("Qlatt fixtures require shared G2P contexts");
export const resources = { ...selected, stress: selected.stress, morphology: selected.morphology };
export const phonotactics = resources.stress.phonotactics;
export const pronounce = (word: string, lookup: DictLookup) =>
  pronounceWithResources(word, lookup, resources);
export const applyLtsRules = (word: string) =>
  applyConfiguredLtsRules(word, resources.lts.document as LtsRulesData);
export const assignStress = (phones: string[], hint?: StressHint) =>
  assignConfiguredStress(phones, resources.stress, hint);
export const isVowel = (phone: string) => isConfiguredVowel(phone, phonotactics);
export const syllabify = (phones: string[]) => syllabifyWithResources(phones, phonotactics);
export const normalizeText = (text: string, spec = loadBundledRulepackSpec("qlatt-english")) =>
  normalizeGraphText(text, spec);
export const numberToWords = (value: number) => normalizeText(String(value));
