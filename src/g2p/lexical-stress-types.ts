/** Lexical prominence is independent of both ARPAbet digits and acoustic realization. */
export type LexicalStress = "primary" | "secondary" | "unstressed";
export type LexicalCategory = "noun" | "verb" | "adjective" | "unknown";
export interface StressSyllable {
  id: string;
  nucleus: string;
  long: boolean;
  coda: string[];
  inherited: LexicalStress | null;
}
/** One contiguous morphological cycle; end is exclusive. */
export interface StressDomain {
  id: string;
  start?: number;
  end: number;
  category: LexicalCategory;
  affix: "root" | "neutral" | "adjectival" | "verbal" | "other";
  extrametricalSuffix: boolean;
  suffixStart?: number;
  spelling?: string;
  stressTarget?: "penult" | "antepenult" | "final";
  citations?: string[];
  /** Cited postcyclic state, e.g. after glide vocalization; never inferred from surface phones. */
  checkpoint?: {
    feet: { head: number; members: number[] }[];
    excludedFrom?: number;
    citations: string[];
  };
}
/** Hayes (1982), pp. 237–244: binary, left-headed feet, retained across cycles. */
export interface StressFoot {
  head: number;
  members: number[];
  domain: string;
}
export interface StressDecision {
  id: string;
  rule: string;
  domain: string;
  reason: string;
  citations: string[];
  tag: string;
  parents: string[];
  feet: StressFoot[];
  excluded: number[];
  excludedOwners?: { owner: string; start: number; end: number }[];
}
export interface LexicalStressResult {
  stress: LexicalStress[];
  feet: StressFoot[];
  decisions: StressDecision[];
}
