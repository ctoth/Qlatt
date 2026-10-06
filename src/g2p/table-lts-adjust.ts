/**
 * DECtalk 4.63's adjustment passes over raw letter-to-sound output.
 *
 * A transcription of the passes ls_rule_lts runs after its rule loop
 * (LTS/l_us_ru1.c:233-340), from LTS/ls_adju.c and LTS/l_us_ad1.c:
 *
 *   per morpheme chunk   ls_adju_allo1      voicing and epenthesis of -s, -ed
 *                        ls_adju_sylables   syllable starts, stress marks moved
 *   whole word           ls_rule_delete_geminate_pairs
 *   per morpheme chunk   ls_adju_stress     primary on the first chunk,
 *                                           secondary on later ones
 *   whole word           ls_adju_allo2      the unstressed vowel form, and
 *                                           context rewrites
 *
 * and of the output routine ls_rule_lts_out (l_us_ru1.c:346-420).
 *
 * The C works on a doubly linked list with a sentinel head, and several tests
 * look one or two nodes past a position and rely on reaching the sentinel.
 * The same list is used here so each test reads as it does in the source.
 *
 * Only English stress is here: the name-language stress routines the ACNA
 * build calls for a word classified as a foreign name (lsa_util_stress_*) are
 * not ported.
 */

import {
  LTS_S1LEFT,
  LTS_S2LEFT,
  LTS_SNONE,
  LTS_SPRI,
  LTS_SSEC,
  LTS_SUN,
  type LtsPhone,
  PFBLOCK,
  PFBOUND,
  PFDASH,
  PFHASH,
  PFLEFTC,
  PFMORPH,
  PFRFUSE,
  PFSTAR,
  PFSYLAB,
} from "./table-lts";

export interface LtsAdjustTables {
  /** `pfeat[]`, indexed by phoneme code (LTS/l_us_con.c:1102). */
  phonemeFeatures: readonly number[];
  /** `preftab[]` (LTS/l_ac_con.c:107 with language tags, else l_us_con.c:1232). */
  prefixes: readonly number[];
  /** True when each prefix entry starts with a language tag byte. */
  languageTagged: boolean;
}

/** One symbol of the word as DECtalk sends it on (ls_rule_lts_out). */
export type LtsOutput =
  | { kind: "phone"; phone: number; stress: 0 | 1 | 2 }
  | { kind: "syllable_boundary" | "morpheme_boundary" | "compound_boundary" };

// Allophone codes, INCLUDE/l_all_ph.h US_<name>.
const SIL = 0;
const US_IY = 1;
const US_IH = 2;
const US_EY = 3;
const US_EH = 4;
const US_AE = 5;
const US_AA = 6;
const US_AY = 7;
const US_AH = 9;
const US_UW = 14;
const US_RR = 15;
const US_AX = 17;
const US_IX = 18;
const US_W = 24;
const US_Y = 25;
const US_R = 26;
const US_LL = 27;
const US_M = 31;
const US_N = 32;
const US_NX = 33;
const US_EL = 34;
const US_F = 37;
const US_TH = 39;
const US_S = 41;
const US_Z = 42;
const US_SH = 43;
const US_P = 45;
const US_B = 46;
const US_T = 47;
const US_D = 48;
const US_K = 49;
const US_G = 50;
const US_CH = 54;
const US_JH = 55;

// Phoneme feature bits, LTS/ls_defs.h:497-502.
const PCONS = 0x0001;
const PVOC = 0x0002;
const PVOICE = 0x0008;
const PSIB = 0x0010;
const POBS = 0x0020;

// Prefix table flags, LTS/ls_defs.h:615-619.
const PLENGTH = 0x0f;
const PCONT = 0x10;
const PRCON = 0x20;
const PRVOC = 0x40;
const P2SYL = 0x80;

/** LTS/ls_defs.h:148 NSYL. */
const NSYL = 10;

// Cluster kinds, LTS/ls_defs.h:677-679.
const ILLEGAL = 0;
const DT_OK = 1;
const TRYS = 2;

type Node = { sphone: number; uphone: number; flag: number; stress: number; fp: Node; bp: Node };

/** LTS/l_us_ad1.c:73-152 ls_adju_cluster. */
function cluster(f: number, s: number): number {
  switch (f) {
    case US_P:
      if (s === US_LL || s === US_R) return TRYS;
      break;
    case US_B:
      if (s === US_LL || s === US_R) return DT_OK;
      break;
    case US_F:
      if (s === US_R) return TRYS;
      if (s === US_LL) return DT_OK;
      break;
    case US_T:
      if (s === US_R) return TRYS;
      if (s === US_W) return DT_OK;
      break;
    case US_D:
    case US_TH:
      if (s === US_W || s === US_R) return DT_OK;
      break;
    case US_K:
      if (s === US_W || s === US_LL || s === US_R) return TRYS;
      break;
    case US_G:
      if (s === US_W || s === US_LL || s === US_R) return DT_OK;
      break;
    case US_S:
      if ([US_W, US_LL, US_P, US_T, US_K, US_M, US_N, US_F].includes(s)) return DT_OK;
      break;
    case US_SH:
      if ([US_W, US_LL, US_R, US_P, US_T, US_M, US_N].includes(s)) return DT_OK;
      break;
  }
  return ILLEGAL;
}

/**
 * Run DECtalk's passes over the raw rule output of one word.
 * `selectedLanguage` is the language group the word was classified as; an
 * ordinary word is 0 (NAME_ENGLISH).
 */
export function adjustLts(
  raw: readonly LtsPhone[],
  tables: LtsAdjustTables,
  selectedLanguage = 0,
): LtsOutput[] {
  const head = { sphone: SIL, uphone: SIL, flag: 0, stress: LTS_SNONE } as Node;
  head.fp = head;
  head.bp = head;
  for (const phone of raw) {
    const node = { ...phone, fp: head, bp: head.bp } as Node;
    head.bp.fp = node;
    head.bp = node;
  }

  const pfeat = (node: Node): number => tables.phonemeFeatures[node.sphone] ?? 0;
  const isCons = (node: Node): boolean => (pfeat(node) & PCONS) !== 0;
  const isVoc = (node: Node): boolean => (pfeat(node) & PVOC) !== 0;
  const isObs = (node: Node): boolean => (pfeat(node) & POBS) !== 0;

  /** ls_adju.c:1259 ls_adju_ins_phone: a new phone before `fpp`, taking its flags. */
  const insPhone = (fpp: Node, sph: number, uph: number, stress: number): void => {
    const bpp = fpp.bp;
    const ipp = { sphone: sph, uphone: uph, flag: fpp.flag, stress, fp: fpp, bp: bpp } as Node;
    bpp.fp = ipp;
    fpp.bp = ipp;
    fpp.flag = 0;
    fpp.stress = LTS_SNONE;
  };
  /** ls_adju.c:1302 ls_adju_del_phone. */
  const delPhone = (dpp: Node): void => {
    dpp.bp.fp = dpp.fp;
    dpp.fp.bp = dpp.bp;
  };
  /** ls_adju.c:1197 ls_adju_delgemphone: drop the phone before `pp`, keep its marks. */
  const delGemPhone = (pp: Node, ph: number): void => {
    const bp = pp.bp;
    pp.sphone = ph;
    pp.flag |= bp.flag;
    if (bp.stress > pp.stress) pp.stress = bp.stress;
    delPhone(bp);
  };

  /** ls_adju.c US ls_adju_allo1: the plural/possessive [z] and past [d]. */
  const allo1 = (fpp: Node, lpp: Node): void => {
    let pp1 = fpp;
    while (pp1 !== lpp) {
      const suffix = (pp1.flag & PFMORPH) !== 0 && pp1.fp === lpp && pp1 !== fpp;
      if (pp1.sphone === US_Z && suffix) {
        const features = pfeat(pp1.bp);
        if ((features & (PCONS | PSIB)) === (PCONS | PSIB)) {
          insPhone(pp1, US_IX, SIL, LTS_SUN);
          pp1 = pp1.fp;
          continue;
        }
        if ((features & (PCONS | PVOICE)) === PCONS) {
          pp1.sphone = US_S;
          pp1 = pp1.fp;
          continue;
        }
      }
      if (pp1.sphone === US_D && suffix) {
        const before = pp1.bp.sphone;
        if (before === US_T || before === US_D) {
          insPhone(pp1, US_IX, SIL, LTS_SUN);
          pp1 = pp1.fp;
          continue;
        }
        if (((tables.phonemeFeatures[before] ?? 0) & (PCONS | PVOICE)) === PCONS) {
          pp1.sphone = US_T;
          pp1 = pp1.fp;
          continue;
        }
      }
      pp1 = pp1.fp;
    }
  };

  /** ls_adju.c:145-275 ls_adju_sylables. */
  const sylables = (fpp: Node, lpp: Node): void => {
    let lsp: Node | null = null;
    let pp1 = fpp;
    while (pp1 !== lpp) {
      if ((pp1.flag & PFSYLAB) !== 0) {
        lsp = pp1;
        break;
      }
      pp1 = pp1.fp;
    }
    while (pp1 !== fpp) {
      let stype = LTS_SNONE;
      let pp2: Node;
      const take = (node: Node): void => {
        if (node.stress !== LTS_SNONE) {
          stype = node.stress;
          node.stress = LTS_SNONE;
        }
      };
      do {
        pp2 = pp1.bp;
        if (!isCons(pp2)) break;
        pp1 = pp2;
        take(pp1);
      } while (pp1 !== fpp);
      if (pp1 === fpp) {
        // No vowel to the left: "gdansk".
        if (lsp !== null) {
          lsp.flag &= ~PFSYLAB;
          stype = lsp.stress;
          lsp.stress = LTS_SNONE;
        }
        pp1.flag |= PFSYLAB;
        pp1.stress = stype;
        break;
      }
      pp1 = pp1.bp; // the vowel
      pp1.flag |= PFLEFTC;
      take(pp1);
      // Extend the syllable leftwards over an allowed onset; each early
      // return is one of the C's `goto out`.
      const extendOnset = (vowel: Node): Node => {
        let at = vowel;
        if ((at.flag & PFMORPH) !== 0 || at === fpp) return at;
        let left = at.bp;
        if (!isCons(left)) return at;
        at = left; // one consonant
        at.flag |= PFLEFTC;
        take(at);
        if ((at.flag & PFMORPH) !== 0 || at === fpp) return at;
        left = at.bp;
        if (!isCons(left)) return at;
        const type = cluster(left.sphone, at.sphone);
        if (type === ILLEGAL) return at;
        at = left; // two consonants
        at.flag |= PFLEFTC;
        take(at);
        if (type === TRYS && (at.flag & PFMORPH) === 0 && at !== fpp) {
          left = at.bp;
          if (left.sphone === US_S || left.sphone === US_SH) {
            at = left;
            at.flag |= PFLEFTC;
            take(at);
          }
        }
        return at;
      };
      pp1 = extendOnset(pp1);
      pp1.flag |= PFSYLAB;
      pp1.stress = stype;
      lsp = pp1;
    }
  };

  /** l_us_ru1.c:421-495 ls_rule_delete_geminate_pairs. */
  const deleteGeminatePairs = (): void => {
    let pp1 = head.fp;
    while (pp1 !== head) {
      const ph1 = pp1.sphone;
      const ph2 = pp1.bp.sphone;
      // The second half of this test is `ph1==US_EL && ph1==US_LL` in the C
      // and can never hold; only [l][L] order is caught.
      if (ph1 === US_LL && ph2 === US_EL) {
        delGemPhone(pp1, US_EL);
        pp1 = pp1.fp;
        continue;
      }
      if ((pp1.flag & PFMORPH) === 0) {
        if ((ph1 === US_T && ph2 === US_TH) || (ph1 === US_TH && ph2 === US_T)) {
          delGemPhone(pp1, US_TH);
          pp1 = pp1.fp;
          continue;
        }
        if ((ph1 === US_S && ph2 === US_SH) || (ph1 === US_SH && ph2 === US_S)) {
          delGemPhone(pp1, US_SH);
          pp1 = pp1.fp;
          continue;
        }
        if (ph1 === ph2 && isCons(pp1)) {
          delGemPhone(pp1, pp1.sphone);
          pp1 = pp1.fp;
          continue;
        }
      }
      pp1 = pp1.fp;
    }
  };

  // Stress state shared by the routines below (PLTS_T sylp, nsyl, rsyl, psyl).
  let sylp: Node[] = [];
  let nsyl = 0;
  let rsyl = -1;
  let psyl = -1;

  /** ls_adju.c:609 ls_adju_suffixscan. */
  const suffixScan = (fpp: Node, lpp: Node): boolean => {
    sylp = [];
    nsyl = 0;
    rsyl = -1;
    psyl = -1;
    for (let pp = fpp; pp !== lpp; pp = pp.fp) {
      if ((pp.flag & PFSYLAB) === 0) continue;
      if (nsyl >= NSYL) return false;
      if (pp.stress !== LTS_SNONE) {
        if (rsyl < 0) rsyl = nsyl;
        if (psyl < 0 && pp.stress >= LTS_SPRI) psyl = nsyl;
      }
      sylp[nsyl++] = pp;
    }
    if (rsyl < 0) rsyl = nsyl;
    return true;
  };

  /** ls_adju.c:661 ls_adju_prefixscan: syllables of a prefix refuse the stress. */
  const prefixScan = (fpp: Node, lpp: Node): boolean => {
    const table = tables.prefixes;
    const lead = tables.languageTagged ? 1 : 0;
    let pp1 = fpp;
    let csyl = 0;
    scan: for (;;) {
      if (csyl >= nsyl - 1) return true;
      let ptp = 0;
      for (
        let len = (table[ptp + lead] ?? 0) & PLENGTH;
        len !== 0;
        len = (table[ptp + lead] ?? 0) & PLENGTH
      ) {
        if (tables.languageTagged) {
          const tag = table[ptp];
          if (tag !== 0xff && tag !== selectedLanguage) {
            ptp += len + 2;
            continue;
          }
          ptp += 1;
        }
        const flags = table[ptp];
        let pp2 = pp1;
        let i = 0;
        for (; i < len; i += 1) {
          if (pp2 === lpp || pp2.sphone !== table[ptp + i + 1]) break;
          pp2 = pp2.fp;
        }
        const next = ptp + len + 1;
        if (i !== len) {
          ptp = next;
          continue;
        }
        if (pp2 !== lpp && (pp2.flag & PFLEFTC) === 0) {
          ptp = next;
          continue;
        }
        if ((flags & PRCON) !== 0 && (pp2 === lpp || !isCons(pp2))) {
          ptp = next;
          continue;
        }
        if ((flags & PRVOC) !== 0 && (pp2 === lpp || !isVoc(pp2))) {
          ptp = next;
          continue;
        }
        sylp[csyl].flag |= PFRFUSE;
        csyl += 1;
        if ((flags & P2SYL) !== 0 && csyl < nsyl - 1) {
          sylp[csyl].flag |= PFRFUSE;
          csyl += 1;
        }
        if ((flags & PCONT) === 0) return true;
        pp1 = pp2;
        continue scan;
      }
      break;
    }
    if (csyl >= nsyl - 1) return true;
    // V-C1-C2 with C1 == C2 starting the next syllable.
    if (pp1 !== lpp && isVoc(pp1)) {
      pp1 = pp1.fp;
      if (pp1 !== lpp && isCons(pp1)) {
        const pp2 = pp1.fp;
        if (pp2 !== lpp && (pp2.flag & PFSYLAB) !== 0 && pp1.sphone === pp2.sphone) {
          sylp[csyl].flag |= PFRFUSE;
        }
      }
    }
    return true;
  };

  /** ls_adju.c:562 ls_adju_unstressed: a syllable whose nucleus is syllabic l. */
  const unstressed = (n: number): boolean => {
    let pp = sylp[n];
    while (isCons(pp)) pp = pp.fp;
    return pp.sphone === US_EL;
  };

  /** ls_adju.c:872 ls_adju_best2syl. */
  const best2syl = (): void => {
    const pp = sylp[0];
    const ph = pp.sphone;
    if (ph === US_AE && (pp.fp.flag & PFSYLAB) !== 0) {
      psyl = 1;
      return;
    }
    if (isVoc(pp) && isCons(pp.fp) && isCons(pp.fp.fp)) {
      if (ph === US_AE || ph === US_EH || ph === US_IH || ph === US_AH) {
        psyl = 1;
        return;
      }
    }
    psyl = 0;
  };

  /** ls_adju.c:799 ls_adju_bestdefault. */
  const bestDefault = (): void => {
    switch (rsyl) {
      case 0:
      case 1:
        psyl = 0;
        break;
      case 2:
        best2syl();
        break;
      case 3:
        psyl = isCons(sylp[2].bp) ? 1 : 0;
        break;
      default:
        // A word ending in "ia" ([iy][ax]) is stressed one syllable earlier.
        psyl =
          sylp[rsyl - 1].bp.sphone === US_IY && sylp[rsyl - 1].sphone === US_AX
            ? rsyl - 3
            : rsyl - 2;
        break;
    }
  };

  /** ls_adju.c:937 ls_adju_final_fixes. */
  const finalFixes = (): void => {
    let last = LTS_SPRI;
    while (psyl !== 0 && sylp[psyl - 1].stress !== LTS_SNONE) {
      psyl -= 1;
      last = sylp[psyl].stress;
    }
    while (psyl !== 0) {
      psyl -= 1;
      if (last === LTS_SUN) {
        if (sylp[psyl].stress === LTS_SNONE) sylp[psyl].flag |= PFBLOCK;
        last = LTS_SSEC;
      } else {
        last = LTS_SUN;
      }
      if (sylp[psyl].stress === LTS_SNONE) sylp[psyl].stress = LTS_SUN;
    }
    // Word-initial [ax][n] before a syllable start becomes stressed [ah].
    let pp = head.fp;
    if (pp.sphone === US_AX) {
      pp = pp.fp;
      if (pp !== head && pp.sphone === US_N) {
        pp = pp.fp;
        if (pp !== head && (pp.flag & PFSYLAB) !== 0) {
          const first = head.fp;
          first.sphone = US_AH;
          first.uphone = SIL;
          first.stress = LTS_SPRI;
        }
      }
    }
    // The "camera" rule.
    if (nsyl === 3) {
      const lastPhone = head.bp;
      if (lastPhone.sphone === US_AA && lastPhone.uphone === US_AX) sylp[2].flag &= ~PFBLOCK;
    }
  };

  /** Mark the syllables after the primary: alternate, blocking every other reduction. */
  const markAfterPrimary = (pstype: number): void => {
    sylp[psyl].stress = pstype;
    let isReduced = true;
    for (let csyl = psyl + 1; csyl < nsyl; csyl += 1) {
      if (!isReduced) {
        if (sylp[csyl].stress === LTS_SNONE) sylp[csyl].flag |= PFBLOCK;
        isReduced = true;
      } else {
        isReduced = false;
      }
      if (sylp[csyl].stress === LTS_SNONE) sylp[csyl].stress = LTS_SUN;
    }
    finalFixes();
  };

  /** ls_adju.c:334-512 ls_adju_stress, English path. */
  const stress = (fpp: Node, lpp: Node, pstype: number): void => {
    if (!suffixScan(fpp, lpp)) return;
    if (!prefixScan(fpp, lpp)) return;
    if (nsyl === 0) return;
    if (psyl >= 0) {
      const type = sylp[psyl].stress;
      if ((type === LTS_S1LEFT || type === LTS_S2LEFT) && psyl !== 0) {
        sylp[psyl].stress = LTS_SUN;
        psyl -= 1;
        if (type === LTS_S2LEFT && psyl !== 0) {
          sylp[psyl].stress = LTS_SUN;
          psyl -= 1;
        }
      }
      while (psyl !== 0 && unstressed(psyl)) psyl -= 1;
      while (psyl < nsyl - 1 && (sylp[psyl].flag & PFRFUSE) !== 0) psyl += 1;
      while (psyl < nsyl - 1 && unstressed(psyl)) psyl += 1;
      markAfterPrimary(pstype);
      return;
    }
    if ((sylp[0].flag & PFRFUSE) !== 0) {
      psyl = 0;
      while (psyl < nsyl - 1 && (sylp[psyl].flag & PFRFUSE) !== 0) psyl += 1;
      while (psyl < nsyl - 1 && unstressed(psyl)) psyl += 1;
      markAfterPrimary(pstype);
      return;
    }
    bestDefault();
    markAfterPrimary(pstype);
  };

  /** l_us_ad1.c:153-550 ls_adju_allo2. */
  const allo2 = (): void => {
    let sthis = LTS_SNONE;
    let fthis = 0;
    for (let pp = head.fp; pp !== head; pp = pp.fp) {
      if ((pp.flag & PFSYLAB) !== 0) {
        sthis = pp.stress;
        fthis = pp.flag;
      }
      if ((fthis & PFBLOCK) === 0 && pp.uphone !== SIL && sthis === LTS_SUN) {
        pp.sphone = pp.uphone;
        pp.uphone = SIL;
      }
    }
    // The head stands for silence at a morpheme boundary.
    head.sphone = SIL;
    head.uphone = SIL;
    head.flag = PFMORPH;
    const atMorphEnd = (node: Node): boolean => (node.fp.flag & PFMORPH) !== 0;
    sthis = LTS_SNONE;
    let sleft = LTS_SNONE;
    let pp1 = head.fp;
    while (pp1 !== head) {
      let ph1 = pp1.sphone;
      if ((pp1.flag & PFSYLAB) !== 0) {
        sleft = sthis;
        sthis = pp1.stress;
      }
      let pp2: Node;
      let pp3: Node;
      let pp4: Node;
      if (sthis === LTS_SUN && (ph1 === US_AX || ph1 === US_IX)) {
        pp2 = pp1.fp;
        if (pp2.sphone === US_LL && (pp2.flag & PFSYLAB) === 0 && atMorphEnd(pp2)) {
          delPhone(pp2);
          pp1.sphone = US_EL;
          pp1 = pp1.fp;
          continue;
        }
      }
      if (
        sthis !== LTS_SUN &&
        (ph1 === US_LL || ph1 === US_R) &&
        isObs(pp1.bp) &&
        atMorphEnd(pp1)
      ) {
        pp1.sphone = ph1 === US_LL ? US_EL : US_RR;
        pp1 = pp1.fp;
        continue;
      }
      pp2 = pp1.fp;
      if (ph1 === US_AX && pp2.sphone === US_R && (pp2.flag & PFSYLAB) === 0) {
        delPhone(pp2);
        pp2 = pp1.fp;
        if (pp2.sphone === US_R) {
          if ((pp2.flag & PFSYLAB) === 0) {
            delPhone(pp2);
            pp1.sphone = US_RR;
          }
        } else {
          pp1.sphone = US_RR;
        }
        pp1 = pp1.fp;
        continue;
      }
      if (ph1 === US_N) {
        pp2 = pp1.fp;
        if (pp2.sphone === US_UW) {
          pp3 = pp2.fp;
          if (pp3.sphone === US_EL && atMorphEnd(pp3)) {
            insPhone(pp2, US_Y, SIL, LTS_SNONE);
            pp1 = pp2;
            continue;
          }
        }
        if ((pp2.sphone === US_K || pp2.sphone === US_G) && (pp2.flag & PFSYLAB) === 0) {
          pp1.sphone = US_NX;
          pp1 = pp1.fp;
          continue;
        }
      }
      if (ph1 === US_G || ph1 === US_K) {
        ph1 = ph1 === US_G ? US_JH : US_S;
        pp2 = pp1.fp;
        if (pp2.sphone === US_AY) {
          pp2 = pp2.fp;
          if (pp2.sphone === US_Z && atMorphEnd(pp2)) {
            pp1.sphone = ph1;
            pp1 = pp1.fp;
            continue;
          }
        } else if (pp2.sphone === US_IX) {
          pp2 = pp2.fp;
          if (pp2.sphone === US_D && atMorphEnd(pp2)) {
            pp1.sphone = ph1;
            pp1 = pp1.fp;
            continue;
          }
          if (pp2.sphone === US_Z) {
            pp3 = pp2.fp;
            if (pp3.sphone === US_AX) {
              pp3 = pp3.fp;
              if (pp3.sphone === US_M && atMorphEnd(pp3)) {
                pp1.sphone = ph1;
                pp1 = pp1.fp;
                continue;
              }
            }
          }
          if (pp2.sphone === US_S) {
            pp3 = pp2.fp;
            if (pp3.sphone === US_T && atMorphEnd(pp3)) {
              pp1.sphone = ph1;
              pp1 = pp1.fp;
              continue;
            }
          }
        }
      }
      if (ph1 === US_D) {
        pp2 = pp1.fp;
        if (pp2.sphone === US_UW) {
          pp2 = pp2.fp;
          if ((pp2.sphone === US_LL || pp2.sphone === US_EL) && atMorphEnd(pp2)) {
            pp1.sphone = US_JH;
            pp1 = pp1.fp;
            continue;
          }
        }
      }
      if (ph1 === US_S) {
        pp2 = pp1.bp;
        if (
          pp2.sphone === US_K &&
          pp2.bp.sphone === US_IX &&
          sleft === LTS_SUN &&
          isVoc(pp1.fp) &&
          sthis !== LTS_SUN
        ) {
          // "exact": [ix][k][s] before a stressed vowel becomes [g][z]. The C
          // does not advance here; the phone is no longer [s] on the next pass.
          pp2.sphone = US_G;
          pp1.sphone = US_Z;
          continue;
        }
        if (pp2.sphone === US_S) {
          pp3 = pp1.fp;
          if (pp3.sphone === US_UW && atMorphEnd(pp3)) {
            if ((pp2.flag & PFSYLAB) !== 0) return;
            delPhone(pp2);
            pp1.sphone = US_SH;
            pp1 = pp1.fp;
            continue;
          }
        }
        pp2 = pp1.fp;
        if (pp2.sphone === US_IY) {
          pp3 = pp2.fp;
          if (pp3.sphone === US_AX) {
            pp4 = pp3.fp;
            if (pp4.sphone === US_S && atMorphEnd(pp4)) {
              if ((pp2.flag & PFSYLAB) !== 0) return;
              delPhone(pp2);
              pp1.sphone = US_SH;
              pp1 = pp1.fp;
              continue;
            }
          }
        }
      }
      if (ph1 === US_T) {
        pp2 = pp1.fp;
        if (pp2.sphone === US_UW) {
          pp3 = pp2.fp;
          if ((pp3.flag & PFMORPH) !== 0) {
            pp1.sphone = US_CH;
            pp1 = pp1.fp;
            continue;
          }
          if (pp3.sphone === US_EL && atMorphEnd(pp3)) {
            pp1.sphone = US_CH;
            pp1 = pp1.fp;
            continue;
          }
          if (pp3.sphone === US_EY) {
            pp4 = pp3.fp;
            if (pp4.sphone === US_R) {
              pp4 = pp4.fp;
              if (pp4.sphone === US_IY && atMorphEnd(pp4)) {
                pp1.sphone = US_CH;
                pp1 = pp1.fp;
                continue;
              }
            }
          }
        } else if (pp2.sphone === US_IY) {
          pp3 = pp2.fp;
          if (pp3.sphone === US_AX && atMorphEnd(pp3)) {
            if ((pp2.flag & PFSYLAB) !== 0) return;
            delPhone(pp2);
            pp1.sphone = US_SH;
            pp1 = pp1.fp;
            continue;
          }
          if (pp3.sphone === US_EY) {
            pp4 = pp3.fp;
            if (pp4.sphone === US_T) {
              pp4 = pp4.fp;
              if (pp4.sphone === US_RR && atMorphEnd(pp4)) {
                pp1.sphone = US_SH;
                pp1 = pp1.fp;
                continue;
              }
            }
          }
        }
      }
      pp1 = pp1.fp;
    }
  };

  // l_us_ru1.c:233-340: the pass sequence. A chunk runs from a phone to the
  // next one that carries a boundary flag.
  const chunkEnd = (start: Node): Node => {
    let end = start.fp;
    while (end !== head && (end.flag & PFBOUND) === 0) end = end.fp;
    return end;
  };
  for (let pp1 = head.fp; pp1 !== head; ) {
    const pp3 = chunkEnd(pp1);
    allo1(pp1, pp3);
    sylables(pp1, pp3);
    pp1 = pp3;
  }
  deleteGeminatePairs();
  let pstype = LTS_SPRI;
  for (let pp1 = head.fp; pp1 !== head; ) {
    const pp3 = chunkEnd(pp1);
    stress(pp1, pp3, pstype);
    pstype = LTS_SSEC;
    pp1 = pp3;
  }
  allo2();

  // l_us_ru1.c:346-420 ls_rule_lts_out. The stress mark goes before the first
  // phone of the syllable that is not a consonant.
  const output: LtsOutput[] = [];
  let s = 0;
  for (let pp1 = head.fp; pp1 !== head; pp1 = pp1.fp) {
    if ((pp1.flag & PFDASH) !== 0) output.push({ kind: "syllable_boundary" });
    if ((pp1.flag & PFSTAR) !== 0) output.push({ kind: "morpheme_boundary" });
    if ((pp1.flag & PFHASH) !== 0) output.push({ kind: "compound_boundary" });
    if ((pp1.flag & PFSYLAB) !== 0) s = pp1.stress;
    let mark: 0 | 1 | 2 = 0;
    if (s !== LTS_SUN && !isCons(pp1)) {
      if (s === LTS_SPRI) mark = 1;
      else if (s === LTS_SSEC) mark = 2;
      s = LTS_SUN;
    }
    output.push({ kind: "phone", phone: pp1.sphone, stress: mark });
  }
  return output;
}
