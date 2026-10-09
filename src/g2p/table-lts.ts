/**
 * Table-driven letter-to-sound, right to left, as DECtalk 4.63 runs it.
 *
 * This is a transcription of the rule interpreter in DECtalk 4.63
 * dapi/src/LTS/l_us_ru1.c (ls_rule_lts, ls_rule_add_graph, ls_rule_rule_match,
 * ls_rule_env_match) and LTS/ls_rule2.c (ls_rule_add_phone). It runs DECtalk's
 * compiled rule tables as data (scripts/build-dectalk-lts-table.ts); nothing
 * about any particular rule is written here.
 *
 * A word is an array of graphemes, each a code with a feature word. The
 * interpreter stands at the right end and repeatedly asks for the rule that
 * matches the longest block of graphemes to its LEFT, consumes that block,
 * and takes the rule's replacement: optionally some graphemes written back
 * into the word at that point (this is how a suffix or a silent e is handled:
 * the rewritten letters are matched again), then phonemes with stress and
 * boundary marks. Phonemes are added at the front of the list, so the list
 * ends up in speaking order.
 *
 * The result is the raw rule output. DECtalk then runs its adjustment passes
 * (LTS/ls_adju.c, LTS/l_us_ad1.c) over it.
 */

export interface LtsTable {
  /** True for the table with a language tag as the first word of each rule. */
  languageTagged: boolean;
  /** Words per rule record (LTS/ls_rule.h LSBUMP). */
  recordWords: number;
  /** `feats[]`, indexed by grapheme code. */
  graphemeFeatures: readonly number[];
  words: readonly number[];
  bytes: readonly number[];
  /**
   * The letter the rules read for a character above 127 (INCLUDE/ls_fold.tab,
   * used at LTS/l_us_ru1.c:108-112): "é" is read as "e".
   */
  letterFold?: Readonly<Record<string, string>>;
}

/** One generated phoneme (LTS/ls_defs.h PHONE). */
export interface LtsPhone {
  /** Phoneme if the syllable is stressed. */
  sphone: number;
  /** Phoneme if it is not; 0 when the rule gave only one. */
  uphone: number;
  flag: number;
  stress: number;
}

// Grapheme codes, LTS/ls_defs.h:309-346.
const GEOS = 0;
const GA = 1;
const GC = 3;
const GD = 4;
const GE = 5;
const GG = 7;
const GH = 8;
const GI = 9;
const GJ = 10;
const GO = 15;
const GQ = 17;
const GS = 19;
const GU = 21;
const GY = 25;
const GGU = 27;
const GQU = 28;
const GQUOTE = 29;
const GMBOUND = 30;
const GRANGE = 31;
const GDISJ = 32;
const GFEAT = 33;
const GWBOUND = 34;
/** LTS/ls_defs.h:145 NGWORD: graphemes in a word. */
const NGWORD = 128;

// Grapheme feature bits, LTS/ls_defs.h:470-485.
const FVOC = 0x0002;
const FCONS = 0x0004;
const FSIB = 0x0040;
const FGEM = 0x0200;
const FSYL = 0x8000;

// Phoneme-string codes, INCLUDE/l_com_ph.h and LTS/ls_defs.h:265-284.
const SIL = 0;
export const LTS_DASH = 108; // SBOUND, [-]
export const LTS_STAR = 109; // MBOUND, [*]
export const LTS_HASH = 110; // HYPHEN, [#]
const EQUAL = 115; // COMMA, [=]
const PLUS = 116; // PERIOD, [+]
export const LTS_SNONE = 122;
export const LTS_SUN = 123;
export const LTS_SSEC = 124;
export const LTS_SPRI = 125;
export const LTS_S1LEFT = 126;
export const LTS_S2LEFT = 127;
const TWOPH = 0x80;
const MSKPH = 0x7f;

// Phone flags, LTS/ls_defs.h:245-263.
export const PFDASH = 0x01;
export const PFSTAR = 0x02;
export const PFHASH = 0x04;
export const PFPLUS = 0x08;
export const PFSYLAB = 0x10;
export const PFRFUSE = 0x20;
export const PFLEFTC = 0x40;
export const PFBLOCK = 0x80;
export const PFBOUND = PFDASH | PFSTAR | PFHASH;
export const PFMORPH = PFDASH | PFSTAR | PFHASH | PFPLUS;

// Rule language tag, LTS/ls_acna.h:82-83.
const M_R_LANG = 0x7fff;
const M_R_SPECIFIC = 0x8000;

type Grapheme = { graph: number; feats: number };

const FORW = 0;
const BACK = 1;

/** LTS/ls_util.c:1512 ls_util_is_vowel. */
const isVowelGrapheme = (g: number): boolean =>
  g === GA || g === GE || g === GI || g === GO || g === GU || g === GY;

/**
 * Run the rules over one word. `defaultLanguage` and `selectedLanguage` are
 * the language groups of ls_rule_lts; an ordinary word uses 0 and 0.
 */
export function applyLtsRules(
  word: string,
  table: LtsTable,
  defaultLanguage = 0,
  selectedLanguage = 0,
): LtsPhone[] {
  const wtab = (n: number): number => (table.words[n] ?? 0) & 0xffff;
  const btabb = (n: number): number => (table.bytes[n] ?? 0) & 0xff;
  const btabw = (n: number): number => (btabb(n + 1) << 8) | btabb(n);
  const offset = table.languageTagged ? 1 : 0;

  // graph[] always ends with a GEOS entry.
  const graph: Grapheme[] = [{ graph: GEOS, feats: table.graphemeFeatures[GEOS] ?? 0 }];

  /** l_us_ru1.c:496-596 ls_rule_add_graph; returns [advance, index written]. */
  const addGraph = (at: number, g: number, insert: boolean): boolean => {
    let gp = at;
    let value = true;
    if (
      isVowelGrapheme(g) &&
      gp > 1 &&
      graph[gp - 1].graph === GU &&
      (graph[gp - 2].graph === GG || graph[gp - 2].graph === GQ)
    ) {
      gp -= 1;
      graph[gp - 1].graph = graph[gp - 1].graph === GG ? GGU : GQU;
      value = false;
    }
    if (insert) {
      if (graph.length < NGWORD) graph.splice(gp, 0, { graph: 0, feats: 0 });
    } else if (gp === graph.length - 1) {
      // Writing over the end mark: keep an end mark after it.
      graph.push({ graph: GEOS, feats: table.graphemeFeatures[GEOS] ?? 0 });
    }
    const slot = graph[gp];
    slot.graph = g;
    slot.feats = table.graphemeFeatures[g] ?? 0;
    if (g === GY) {
      slot.feats |= gp === 0 ? FCONS : FVOC | FSYL;
    }
    if (gp !== 0) {
      const g1 = graph[gp - 1].graph;
      if ((g1 === GS || g1 === GC) && g === GH) slot.feats |= FSIB;
      else if (g1 === GD && (g === GG || g === GJ)) slot.feats |= FSIB;
      if ((slot.feats & FCONS) !== 0 && g1 === g) slot.feats |= FGEM;
      if ((graph[gp - 1].feats & FSYL) !== 0) slot.feats |= FSYL;
    }
    return value;
  };

  // l_us_ru1.c:107-131: letters to grapheme codes.
  let gp1 = 0;
  // l_us_ru1.c:108-112: each character goes through ls_fold[] first, which
  // gives an accented letter its plain one.
  for (const written of word.toLowerCase()) {
    const char = table.letterFold?.[written] ?? written;
    if (gp1 >= NGWORD - 1) break;
    if (char >= "a" && char <= "z") {
      if (addGraph(gp1, char.charCodeAt(0) - 97 + GA, false)) gp1 += 1;
    } else if (char === "'") {
      if (addGraph(gp1, GQUOTE, false)) gp1 += 1;
    }
  }
  // The end mark sits at gp1; anything a merge left beyond it is dropped.
  graph.length = gp1 + 1;
  graph[gp1] = { graph: GEOS, feats: table.graphemeFeatures[GEOS] ?? 0 };

  /** l_us_ru1.c:759-896 ls_rule_env_match; returns the new position or -1. */
  const envMatch = (start: number, from: number, direction: number): number => {
    let ep1 = start;
    let gp = from;
    let npat = btabb(ep1++);
    const ep2 = ep1 + npat;
    while (ep1 !== ep2) {
      const type = btabb(ep1++);
      switch (type) {
        case GRANGE: {
          let llim = btabb(ep1++);
          let hlim = btabb(ep1++);
          while (llim-- > 0) {
            const next = envMatch(ep1, gp, direction);
            if (next < 0) return -1;
            gp = next;
          }
          while (hlim-- > 0) {
            const next = envMatch(ep1, gp, direction);
            if (next < 0) break;
            gp = next;
          }
          npat = btabb(ep1++);
          ep1 += npat;
          break;
        }
        case GDISJ: {
          npat = btabb(ep1++);
          const ep3 = ep1 + npat;
          let matched = -1;
          for (;;) {
            if (ep1 === ep3) return -1;
            matched = envMatch(ep1, gp, direction);
            if (matched >= 0) break;
            npat = btabb(ep1++);
            ep1 += npat;
          }
          gp = matched;
          ep1 = ep3;
          break;
        }
        case GFEAT: {
          const mask = btabw(ep1);
          ep1 += 2;
          const test = btabw(ep1);
          ep1 += 2;
          if (direction === FORW) {
            if (graph[gp].graph === GEOS) return -1;
            gp += 1;
          } else {
            if (gp === 0) return -1;
            gp -= 1;
          }
          if ((graph[gp].feats & mask) !== test) return -1;
          break;
        }
        case GMBOUND:
          if (direction === FORW) {
            if (graph[gp].graph === GEOS) return -1;
            const next = graph[gp + 1]?.graph ?? GEOS;
            if (next === GMBOUND) gp += 1;
            else if (next !== 0) return -1;
          } else if (gp !== 0) {
            gp -= 1;
            if (graph[gp].graph !== GMBOUND) return -1;
          }
          break;
        case GWBOUND:
          if (direction === FORW) {
            if (graph[gp].graph === GEOS || (graph[gp + 1]?.graph ?? GEOS) !== GEOS) return -1;
          } else if (gp !== 0) {
            return -1;
          }
          break;
        default:
          if (direction === FORW) {
            if (graph[gp].graph === GEOS) return -1;
            gp += 1;
          } else {
            if (gp === 0) return -1;
            gp -= 1;
          }
          if (graph[gp].graph !== type) return -1;
          break;
      }
    }
    return gp;
  };

  /**
   * l_us_ru1.c:621-733 ls_rule_rule_match: the rule for the block ending just
   * left of `from`. Returns the position after consuming it and the offset of
   * its replacement (0 when no rule matched and one grapheme is eaten).
   */
  const ruleMatch = (from: number): { position: number; replacement: number } => {
    const at = from - 1;
    const g = graph[at].graph;
    let rulep = wtab(2 * g);
    let nrule = wtab(2 * g + 1);
    while (nrule-- > 0) {
      const record = rulep;
      rulep += table.recordWords;
      if (table.languageTagged) {
        const tag = wtab(record);
        const specific = (tag & M_R_SPECIFIC) !== 0;
        const language = tag & M_R_LANG;
        if (
          specific
            ? language !== selectedLanguage
            : language !== defaultLanguage && language !== selectedLanguage
        ) {
          continue;
        }
      }
      let gp2 = at;
      let failed = false;
      let xrule = wtab(record + offset);
      if (xrule !== 0) {
        for (let code = btabb(xrule++); code !== GEOS; code = btabb(xrule++)) {
          if (gp2 === 0) {
            failed = true;
            break;
          }
          gp2 -= 1;
          if (graph[gp2].graph !== code) {
            failed = true;
            break;
          }
        }
      }
      if (failed) continue;
      xrule = wtab(record + offset + 3);
      if (xrule !== 0 && envMatch(xrule, at, FORW) < 0) continue;
      xrule = wtab(record + offset + 2);
      if (xrule !== 0 && envMatch(xrule, gp2, BACK) < 0) continue;
      return { position: gp2, replacement: wtab(record + offset + 1) };
    }
    return { position: at, replacement: 0 };
  };

  // l_us_ru1.c:136-232: the main loop. `phones[0]` is the head of the list.
  const phones: LtsPhone[] = [];
  let ssflag = false;
  while (gp1 !== 0) {
    const { position, replacement } = ruleMatch(gp1);
    gp1 = position;
    if (replacement === 0) continue;
    let rpart = replacement;
    if (btabb(rpart) !== GEOS) {
      for (let g = btabb(rpart++); g !== GEOS; g = btabb(rpart++)) {
        if (gp1 < NGWORD - 1 && addGraph(gp1, g, true)) gp1 += 1;
      }
    } else {
      rpart += 1;
    }
    let rsflag = false;
    for (let g = btabb(rpart++); g !== SIL; g = btabb(rpart++)) {
      const head = phones[0];
      switch (g) {
        case LTS_DASH:
          if (head) head.flag |= PFDASH;
          ssflag = false;
          rsflag = false;
          break;
        case LTS_STAR:
          if (head) head.flag |= PFSTAR;
          ssflag = false;
          rsflag = false;
          break;
        case LTS_HASH:
          if (head) head.flag |= PFHASH;
          ssflag = false;
          rsflag = false;
          break;
        case PLUS:
          if (head) head.flag |= PFPLUS;
          break;
        case EQUAL:
          if (!ssflag && head) head.flag |= PFSYLAB;
          break;
        default:
          if (g >= LTS_SNONE && g <= LTS_S2LEFT) {
            if (g !== LTS_SUN) rsflag = true;
            if (!ssflag && head) head.stress = g;
          } else if ((g & TWOPH) !== 0) {
            phones.unshift({
              sphone: g & MSKPH,
              uphone: btabb(rpart++),
              flag: 0,
              stress: LTS_SNONE,
            });
          } else {
            phones.unshift({ sphone: g, uphone: SIL, flag: 0, stress: LTS_SNONE });
          }
          break;
      }
    }
    if (rsflag) ssflag = true;
  }
  return phones;
}
