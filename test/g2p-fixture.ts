import { loadFrontendResources } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { normalizeGraphText } from "../src/declarative-frontend/source-recognition";
import { pronounce as pronounceWithResources } from "../src/g2p";
import { applyLtsRules as applyConfiguredLtsRules } from "../src/g2p/lts-engine";
import { assignStress as assignConfiguredStress, type StressHint } from "../src/g2p/stress";
import { loadStressPolicy } from "../src/g2p/stress-policy";
import {
  isVowel as isConfiguredVowel,
  syllabify as syllabifyWithResources,
} from "../src/g2p/syllabify";
import type { DictLookup } from "../src/g2p/types";

// These behavior fixtures explicitly select one frontend; shared code has no defaults.
export const resources = loadFrontendResources(loadBundledRulepackSpec("qlatt-english"));
export const phonotacticsPath = loadStressPolicy(resources.stressPolicyPath).phonotacticsPath;
export const pronounce = (word: string, lookup: DictLookup) =>
  pronounceWithResources(word, lookup, resources);
export const applyLtsRules = (word: string) => applyConfiguredLtsRules(word, resources.ltsPath);
export const assignStress = (phones: string[], hint?: StressHint) =>
  assignConfiguredStress(phones, resources.stressPolicyPath, hint);
export const isVowel = (phone: string) => isConfiguredVowel(phone, phonotacticsPath);
export const syllabify = (phones: string[]) => syllabifyWithResources(phones, phonotacticsPath);
export const normalizeText = (text: string, spec = loadBundledRulepackSpec("qlatt-english")) =>
  normalizeGraphText(text, spec);
export const numberToWords = (value: number) => normalizeText(String(value));
