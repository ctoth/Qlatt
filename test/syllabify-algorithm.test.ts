import { describe, expect, it } from "vitest";
import {
  syllabifyWord,
  basePhonemeSymbol,
  parseSyllabificationTables,
  type SyllabificationTables,
} from "../src/declarative-frontend/syllabify";

// Tables extracted by scripts/dt10-extract-syllable-tables.ts from DECtalk 4.63
// p_us_sy1.c + l_all_ph.h.  Kept inline here so the algorithm test is hermetic.
const TABLES: SyllabificationTables = parseSyllabificationTables({
  nuclei: "a@AeEiIoOuU^WRc|xLN",
  onset_clusters: [
    "spl", "spr", "str", "skw", "skl", "skr", " Sm", " SL",
    "pl", "pr", "bl", "br", "fl", "fr", "tw", "tr", "dw", "dr", "Tw", "Tr",
    "kw", "kl", "kr", "gw", "gl", "gr", "sw", "sl", "sp", "st", "sk", "sm", "sn",
    "Sw", "Sl", "Sr", " Y",
    "y", "f", "t", "d", "T", "k", "g", "s", "S", "p", "w", "l", "r", "h",
    "D", "z", "Z", "C", "J", "n", "m", "v", "b",
  ],
  // a representative slice of us_common_affixes (ascky): -ment, -ship, -land
  affixes: ["mEnt", "mxnt", "SI|p", "l@nd", "lxnd"],
  ascky: {
    IY: "i", IH: "I", EY: "e", EH: "E", AE: "@", AA: "a", AY: "A", AW: "W",
    AH: "^", AO: "c", OW: "o", OY: "O", UH: "U", UW: "u", RR: "R", YU: "Y",
    AX: "x", IX: "|", W: "w", Y: "y", R: "r", LL: "l", HH: "h", M: "m", N: "n",
    NG: "G", EL: "L", EN: "N", F: "f", V: "v", TH: "T", DH: "D", S: "s", Z: "z",
    SH: "S", ZH: "Z", P: "p", B: "b", T: "t", D: "d", K: "k", G: "g", DX: "&",
    TX: "Q", GS: "q", CH: "C", JH: "J",
    // port-specific rhotic-vowel -> syllabic-r nucleus (see extractor comment)
    IR: "R", ER: "R", AR: "R", OR: "R", UR: "R",
  },
})!;

function describeSyll(phonemes: string[]): string {
  const ann = syllabifyWord(phonemes, TABLES);
  // Group phonemes by syllable index.
  const bySyll = new Map<number, string[]>();
  for (let i = 0; i < phonemes.length; i++) {
    const a = ann[i];
    if (!bySyll.has(a.syllableIndex)) bySyll.set(a.syllableIndex, []);
    bySyll.get(a.syllableIndex)!.push(phonemes[i]);
  }
  return [...bySyll.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, ps]) => "[" + ps.join(" ") + "]")
    .join("");
}

describe("syllabify algorithm: base symbol normalization", () => {
  it("strips stress digit and release/aspiration suffix", () => {
    expect(basePhonemeSymbol("IY1")).toBe("IY");
    expect(basePhonemeSymbol("AH0")).toBe("AH");
    expect(basePhonemeSymbol("T_REL")).toBe("T");
    expect(basePhonemeSymbol("P_ASP")).toBe("P");
    expect(basePhonemeSymbol("SIL")).toBe("SIL");
    expect(basePhonemeSymbol("T")).toBe("T");
  });
});

describe("syllabify algorithm: maximal onset + counts", () => {
  it("computer -> 3 syllables, onset-maximized", () => {
    // computer = K AH M P Y UW T ER (the port uses the glide Y + UW, not a YU
    // diphone).  /m/ codas syll 0, /p y/ onsets syll 1 (/py/ is not a table
    // cluster so maximal-onset takes the single consonant /y/ as onset and /p/
    // as the coda of syll 0... wait: between AH and UW the consonants are M P Y.
    // Maximal legal onset before UW from {M P Y}: no MPY/PY cluster, so single
    // /y/ is the onset, leaving M P as coda of syll 0).
    const ph = ["K", "AH0", "M", "P", "Y", "UW1", "T", "ER1"];
    expect(describeSyll(ph)).toBe("[K AH0 M P][Y UW1][T ER1]");
    const ann = syllabifyWord(ph, TABLES);
    expect(ann[0].syllableCount).toBe(3);
  });

  it("happy -> 2 syllables [hae][piy], /p/ onsets 2nd syllable", () => {
    const ph = ["HH", "AE1", "P", "IY0"];
    expect(describeSyll(ph)).toBe("[HH AE1][P IY0]");
  });

  it("apple -> 2 syllables [ae][p el], onset maximization gives /p/ to 2nd syll", () => {
    // apple = AE P EL.  Maximal onset: /p/ is a legal onset, so [ae][p el].
    const ph = ["AE1", "P", "EL"];
    expect(describeSyll(ph)).toBe("[AE1][P EL]");
  });

  it("strength -> one syllable, onset cluster [s t r]", () => {
    // strength = S T R EH NG TH
    const ph = ["S", "T", "R", "EH1", "NG", "TH"];
    expect(describeSyll(ph)).toBe("[S T R EH1 NG TH]");
    const ann = syllabifyWord(ph, TABLES);
    expect(ann[0].syllableCount).toBe(1);
    expect(ann[0].positionInWord).toBe("only");
    // onset roles
    expect(ann[0].role).toBe("onset");
    expect(ann[1].role).toBe("onset");
    expect(ann[2].role).toBe("onset");
    expect(ann[3].role).toBe("nucleus");
    expect(ann[4].role).toBe("coda");
    expect(ann[5].role).toBe("coda");
  });

  it("running -> 2 syllables [ruh][ning]", () => {
    // running = R AH N IH NG
    const ph = ["R", "AH1", "N", "IH0", "NG"];
    expect(describeSyll(ph)).toBe("[R AH1][N IH0 NG]");
  });

  it("legal cluster: secret -> [s iy][k r eh t] (k r is a legal onset)", () => {
    const ph = ["S", "IY1", "K", "R", "EH0", "T"];
    expect(describeSyll(ph)).toBe("[S IY1][K R EH0 T]");
  });

  it("split cluster: napkin -> [n ae p][k ih n] (p k not a legal onset)", () => {
    // napkin = N AE P K IH N. /pk/ is NOT a legal onset cluster, so /p/ codas
    // the first syllable and /k/ onsets the second.
    const ph = ["N", "AE1", "P", "K", "IH0", "N"];
    expect(describeSyll(ph)).toBe("[N AE1 P][K IH0 N]");
  });

  it("count matches nucleus count (count_word_vowels parity)", () => {
    // The DECtalk nucleus set includes syllabic EL/EN, so syllable count =
    // number of nucleus phones, not just 'vowel'-typed tokens.
    const ph = ["B", "AH1", "T", "EN"]; // button -> b uh / t en  (EN is a nucleus)
    const ann = syllabifyWord(ph, TABLES);
    expect(ann[0].syllableCount).toBe(2);
    expect(describeSyll(ph)).toBe("[B AH1][T EN]");
  });
});

describe("syllabify algorithm: affix stripping", () => {
  it("payment -> affix -ment forces a boundary [p ey][m eh n t]", () => {
    // payment = P EY M EH N T ; -ment (ascky mEnt) peels off forcing a boundary
    // before /m/.  Maximal-onset would also put /m/ as onset here, so the affix
    // step and onset step agree; assert the 2-syllable split.
    const ph = ["P", "EY1", "M", "EH0", "N", "T"];
    expect(describeSyll(ph)).toBe("[P EY1][M EH0 N T]");
    const ann = syllabifyWord(ph, TABLES);
    expect(ann[0].syllableCount).toBe(2);
  });

  it("shipment -> -ment boundary [sh ih p][m eh n t]", () => {
    // shipment = SH IH P M EH N T.  Onset /pm/ is not legal, so /p/ codas syll0
    // and the affix forces the boundary before /m/.
    const ph = ["SH", "IH1", "P", "M", "EH0", "N", "T"];
    expect(describeSyll(ph)).toBe("[SH IH1 P][M EH0 N T]");
  });
});

describe("syllabify algorithm: transparent (split-stop) phones", () => {
  it("release/aspiration phones inherit the syllable of their base consonant", () => {
    // Post-structural 'cat' might be K AE T_CL T_REL T_ASP -> base K AE T, T..
    // _CL/_REL/_ASP are transparent (not in ascky map) and inherit syllable 0.
    const ph = ["K", "AE1", "T_CL", "T_REL", "T_ASP"];
    const ann = syllabifyWord(ph, TABLES);
    expect(ann.every((a) => a.syllableCount === 1)).toBe(true);
    expect(ann[0].role).toBe("onset");
    expect(ann[1].role).toBe("nucleus");
    // transparent phones attach as coda (after the nucleus)
    expect(ann[2].role).toBe("coda");
    expect(ann[3].role).toBe("coda");
    expect(ann[4].role).toBe("coda");
  });
});
