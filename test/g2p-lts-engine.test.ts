import { describe, it, expect } from 'vitest';
import { applyLtsRules } from '../src/g2p/lts-engine';

const QLATT_LTS_PATH = "/rules/frontends/qlatt-english/lts-rules.yaml";

// Note: Symbol normalization (AX->AH, NX->NG, WH->W) is now handled by
// the normalize rule phase (public/rules/frontends/qlatt-english/phases/normalize.yaml), not by
// the LTS engine. Tests below expect raw Elovitz notation.

describe('context pattern compilation', () => {
  // These are tested indirectly through rule application.
  // The context symbols from the JSON define:
  //   # = [AEIOUY]+ (one or more vowels)
  //   ^ = [BCDFGHJKLMNPQRSTVWXZ] (single consonant)
  //   . = [BDVGJLMNRWZ] (voiced consonant)
  //   + = [EIY] (front vowel)
  //   : = [BCDFGHJKLMNPQRSTVWXZ]* (zero or more consonants)
  //   % = (?:ER|E|ES|ED|ING|ELY) (suffix)
  //   & = (?:S|C|G|Z|X|J|CH|SH) (sibilant)
  //   @ = (?:T|S|R|D|L|Z|N|J|TH|CH|SH) (specific consonants)

  it('# matches one or more vowels via rule application', () => {
    // E rule: #:E -> [] (silent E after vowel + consonants)
    // "make" = " MAKE " -> M + A rule -> EY + K + silent E
    // This is verified through full word tests below
  });

  it('^ matches single consonant via rule application', () => {
    // A rule: A -> EY when right context is ^+# (consonant + front vowel + vowel)
    // "ACING" -> A before C(^) + I(+) + NG(#) -> EY
    // Verified through full word tests
  });
});

describe('individual rule application', () => {
  it('" THE " -> DH AX', () => {
    // Rule: left=" " letters="THE" right=" " phonemes=["DH","AX"]
    // AX preserved; normalize phase maps to AH later
    const result = applyLtsRules('the', QLATT_LTS_PATH);
    expect(result).toEqual(['DH', 'AX']);
  });

  it('"TO " -> T UW', () => {
    // Rule: left="" letters="TO" right=" " phonemes=["T","UW"]
    const result = applyLtsRules('to', QLATT_LTS_PATH);
    expect(result).toEqual(['T', 'UW']);
  });

  it('[SH] -> SH', () => {
    const result = applyLtsRules('she', QLATT_LTS_PATH);
    // SH rule matches first, then E -> IY (at end " E " with left context : -> IY)
    expect(result).toEqual(['SH', 'IY']);
  });

  it('[CH] -> CH in "chin"', () => {
    const result = applyLtsRules('chin', QLATT_LTS_PATH);
    // CH -> CH, I -> IH (I before ^+:# = IH), N -> N
    expect(result).toEqual(['CH', 'IH', 'N']);
  });

  it('[TH] -> TH (unvoiced) in "through"', () => {
    // Rule: letters="THROUGH" phonemes=["TH","R","UW"]
    const result = applyLtsRules('through', QLATT_LTS_PATH);
    expect(result).toEqual(['TH', 'R', 'UW']);
  });

  it('" A " -> AX (isolated a)', () => {
    // Rule: left="" letters="A" right=" " phonemes=["AX"]
    // AX preserved; normalize phase maps to AH later
    const result = applyLtsRules('a', QLATT_LTS_PATH);
    expect(result).toEqual(['AX']);
  });

  it('[QU] -> K W in "quick"', () => {
    // Rule: left="" letters="QU" phonemes=["K","W"]
    const result = applyLtsRules('quick', QLATT_LTS_PATH);
    // QU -> K W, I -> IH, CK -> K
    expect(result).toEqual(['K', 'W', 'IH', 'K']);
  });
});

describe('full word tests', () => {
  it('"cat" -> K AE T', () => {
    const result = applyLtsRules('cat', QLATT_LTS_PATH);
    expect(result).toEqual(['K', 'AE', 'T']);
  });

  it('"the" -> DH AX', () => {
    const result = applyLtsRules('the', QLATT_LTS_PATH);
    expect(result).toEqual(['DH', 'AX']);
  });

  it('"phone" -> F OW N', () => {
    // PH -> F, O before N+E -> OW (O^EN rule? or O^% rule?), N, silent E
    const result = applyLtsRules('phone', QLATT_LTS_PATH);
    expect(result).toEqual(['F', 'OW', 'N']);
  });

  it('"ship" -> SH IH P', () => {
    const result = applyLtsRules('ship', QLATT_LTS_PATH);
    expect(result).toEqual(['SH', 'IH', 'P']);
  });

  it('"through" -> TH R UW', () => {
    const result = applyLtsRules('through', QLATT_LTS_PATH);
    expect(result).toEqual(['TH', 'R', 'UW']);
  });

  it('"that" -> DH AE T', () => {
    // Rule: left="" letters="THAT" right=" " phonemes=["DH","AE","T"]
    const result = applyLtsRules('that', QLATT_LTS_PATH);
    expect(result).toEqual(['DH', 'AE', 'T']);
  });

  it('"quick" -> K W IH K', () => {
    const result = applyLtsRules('quick', QLATT_LTS_PATH);
    expect(result).toEqual(['K', 'W', 'IH', 'K']);
  });

  it('"know" -> N OW', () => {
    // K before N at word start -> silent K (rule: left=" " letters="K" right="N" phonemes=[])
    // N -> N, OW -> OW
    const result = applyLtsRules('know', QLATT_LTS_PATH);
    expect(result).toEqual(['N', 'OW']);
  });

  it('"write" -> R AY T', () => {
    // WR -> R (rule: letters="WR" phonemes=["R"])
    // I -> AY (I before ^+:# context), T, silent E
    const result = applyLtsRules('write', QLATT_LTS_PATH);
    expect(result).toEqual(['R', 'AY', 'T']);
  });
});

describe('edge cases', () => {
  it('empty string -> empty array', () => {
    const result = applyLtsRules('', QLATT_LTS_PATH);
    expect(result).toEqual([]);
  });

  it('"a" -> single phoneme (AX)', () => {
    const result = applyLtsRules('a', QLATT_LTS_PATH);
    expect(result).toEqual(['AX']);
  });
});

describe('extended word tests', () => {
  it('"make" -> M EY K (silent E)', () => {
    const result = applyLtsRules('make', QLATT_LTS_PATH);
    expect(result).toEqual(['M', 'EY', 'K']);
  });

  it('"thought" -> TH AO T', () => {
    // OUGH -> AO T (rule: OUGHT -> AO T), then? No...
    // Actually: TH -> TH, OUGHT -> AO T
    const result = applyLtsRules('thought', QLATT_LTS_PATH);
    expect(result).toEqual(['TH', 'AO', 'T']);
  });

  it('"light" -> L AY T', () => {
    // L -> L, IGH -> AY (I rule: I before GH), T -> T
    // Actually need to check I rules more carefully
    const result = applyLtsRules('light', QLATT_LTS_PATH);
    expect(result).toEqual(['L', 'AY', 'T']);
  });

  it('"judge" -> JH AH D JH', () => {
    // J -> JH, U -> AH (U before ^^ = two consonants),
    // D -> D (default), G before E -> JH, silent E
    // No DG digraph rule exists in Elovitz ruleset
    const result = applyLtsRules('judge', QLATT_LTS_PATH);
    expect(result).toEqual(['JH', 'AH', 'D', 'JH']);
  });

  it('"nation" -> N EY SH AX N (via -TION -> SH)', () => {
    // N -> N, A before ^+# -> EY, TI before O -> SH, ION -> AX N
    const result = applyLtsRules('nation', QLATT_LTS_PATH);
    expect(result).toEqual(['N', 'EY', 'SH', 'AX', 'N']);
  });

  it('"enough" -> EH N AH F (OUGH -> AH F)', () => {
    // E -> EH (default), N -> N, OUGH -> AH F
    // Note: Elovitz rules produce EH for initial E, not IH
    const result = applyLtsRules('enough', QLATT_LTS_PATH);
    expect(result).toEqual(['EH', 'N', 'AH', 'F']);
  });

  it('"knight" -> N AY T (silent K before N)', () => {
    // K before N at word start -> silent, N -> N, IGH -> AY, T -> T
    const result = applyLtsRules('knight', QLATT_LTS_PATH);
    expect(result).toEqual(['N', 'AY', 'T']);
  });

  it('"edge" -> EH D JH', () => {
    // E -> EH (default), D -> D, G before E -> JH, silent E
    const result = applyLtsRules('edge', QLATT_LTS_PATH);
    expect(result).toEqual(['EH', 'D', 'JH']);
  });

  it('"psychology" -> P S IH CH AA L AA JH IY', () => {
    // Note: Elovitz rules do not handle silent P before S —
    // this is a known limitation of the rule set
    const result = applyLtsRules('psychology', QLATT_LTS_PATH);
    expect(result).toEqual(['P', 'S', 'IH', 'CH', 'AA', 'L', 'AA', 'JH', 'IY']);
  });

  it('"pneumonia" -> P N Y UW M OW N IH AX', () => {
    // Note: Elovitz rules do not handle silent P before N —
    // this is a known limitation of the rule set
    const result = applyLtsRules('pneumonia', QLATT_LTS_PATH);
    expect(result).toEqual(['P', 'N', 'Y', 'UW', 'M', 'OW', 'N', 'IH', 'AX']);
  });

  it('"hello" -> HH EH L OW', () => {
    const result = applyLtsRules('hello', QLATT_LTS_PATH);
    expect(result).toEqual(['HH', 'EH', 'L', 'OW']);
  });

  it('"world" -> W ER L D', () => {
    const result = applyLtsRules('world', QLATT_LTS_PATH);
    expect(result).toEqual(['W', 'ER', 'L', 'D']);
  });

  it('"beautiful" -> B IY Y UW T IH F UH L', () => {
    // EA -> IY (rule 28), U -> Y UW (default U), T -> T,
    // I -> IH, FUL -> F UH L
    const result = applyLtsRules('beautiful', QLATT_LTS_PATH);
    expect(result).toEqual(['B', 'IY', 'Y', 'UW', 'T', 'IH', 'F', 'UH', 'L']);
  });
});
