#!/usr/bin/env node

/**
 * replay-dectalk-durations.ts
 * ===========================
 * Executable reading of DECtalk 4.63's US duration rules (p_us_tim.c:157-941).
 *
 * It replays the routine from DECtalk's OWN recorded inputs (phoneme, structure
 * word, feature word, inherent and minimum duration per allophone, from
 * test/fixtures/dectalk-oracle/<corpus>.durations.json) and compares every
 * intermediate state and every final duration with what DECtalk recorded.
 * A mismatch here is a misreading of the C, independent of this frontend.
 * The declarative port (phases/duration.yaml) is transcribed from the reading
 * that this script proves.
 *
 * Constants and line numbers refer to DECtalk 4.63 dapi/src/PH:
 *   p_us_tim.c   the rules
 *   ph_defs.h    feature bits (219-275, 316-334), NFxxMS (435-449),
 *                NxxPRCNT (465-506), mlsh1 (794), DIV_BY128 (411)
 *   ph_romi.c    all_featb[0] == us_featb, so phone_feature(n) for a bare
 *                integer n reads the US feature table (214-225)
 *
 * The phoneme feature table us_featb is read from the DECtalk source tree
 * (p_us_rom.h); nothing from it is stored in this repository.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/replay-dectalk-durations.ts \
 *     [--corpus <file> ...] [--dectalk C:/Users/Q/src/dectalk/463] [--verbose] [--id <phraseId>]
 *
 * Exit code 1 if any state or duration differs.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type RuleState = { prcnt: number; deldur: number; durmin: number };
type Recorded =
  | { kind: "silence"; struc: number; frames: number }
  | {
      kind: "phone";
      n: number;
      ph: number;
      struc: number;
      fea: number;
      nallotot: number;
      durinh: number;
      durmin: number;
      after: Record<string, RuleState>;
      frames: number;
    };

// ph_defs.h structure bits.
const FSTRESS = 0o3;
const FSTRESS_1 = 0o1;
const FEMPHASIS = 0o3;
const FWINITC = 0o4;
const FTYPESYL = 0o30;
const FMONOSYL = 0;
const FFIRSTSYL = 0o10;
const FMEDIALSYL = 0o20;
const FBOUNDARY = 0o740;
const FMBNEXT = 0o100;
const FWBNEXT = 0o140;
const FPPNEXT = 0o200;
const FVPNEXT = 0o240;
const FCBNEXT = 0o340;
const FHAT_ENDS = 0o2000;
// ph_defs.h phoneme feature bits.
const FSYLL = 0o1;
const FVOICD = 0o2;
const FVOWEL = 0o4;
const FSON1 = 0o10;
const FOBST = 0o40;
const FPLOSV = 0o100;
const FNASAL = 0o200;
const FCONSON = 0o400;
const FSONCON = 0o1000;
const FSON2 = 0o2000;
// Frame counts and Q14 fractions.
const NF15MS = 2;
const NF20MS = 3;
const NF25MS = 4;
const NF30MS = 5;
const NF40MS = 6;
const FRAC_ONE = 16384;
const FRAC_HALF = 8192;
const N10PRCNT = 1638;
const N25PRCNT = 4096;
const N35PRCNT = 5734;
const N60PRCNT = 9831;
const N70PRCNT = 11469;
const N80PRCNT = 13108;
const N85PRCNT = 13927;
const N90PRCNT = 13927; // sic: ph_defs.h:488 gives N90PRCNT the N85PRCNT value
const N120PRCNT = 19661;
const N150PRCNT = 24576;
// Phoneme codes: (PFUSA << 8) | US_<name>; GEN_SIL is 0x100.
const US = 0x100;
const GEN_SIL = 0x100;
const P = {
  IY: US | 1,
  RR: US | 15,
  AX: US | 17,
  IX: US | 18,
  W: US | 24,
  LL: US | 27,
  HX: US | 28,
  RX: US | 29,
  LX: US | 30,
  N: US | 32,
  NX: US | 33,
  EN: US | 36,
  TH: US | 39,
  S: US | 41,
  SH: US | 43,
  T: US | 47,
  DX: US | 51,
  CH: US | 54,
  DF: US | 56,
};
// The corpus is rendered at [:ra 180] (p_us_tim.c:319 tests sprate > 160).
const SPRATE = 180;

const toS16 = (value: number): number => (value << 16) >> 16;
/** ph_defs.h:794 mlsh1(x,y) = (S16)(((S32)x * (S32)y) >> 14). */
const mlsh1 = (x: number, y: number): number => toS16((x * y) >> 14);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flags = (name: string): string[] =>
  argv.flatMap((arg, index) => (arg === `--${name}` && argv[index + 1] ? [argv[index + 1]] : []));
const dectalkRoot = path.resolve(
  flags("dectalk")[0] ?? process.env.DECTALK_SOURCE_ROOT ?? "C:/Users/Q/src/dectalk/463",
);
const verbose = argv.includes("--verbose");
const onlyId = flags("id")[0];
const corpusFiles =
  flags("corpus").length > 0
    ? flags("corpus").map((file) => path.resolve(file))
    : ["dectalk-us-v1.json", "dectalk-us-heldout-v1.json"].map((file) =>
        path.join(repoRoot, "test", "oracle-corpora", file),
      );

function readUsFeatb(): number[] {
  const rom = fs.readFileSync(path.join(dectalkRoot, "dapi", "src", "PH", "p_us_rom.h"), "utf8");
  const match = /const\s+short\s+us_featb\s*\[\]\s*=\s*\{([^}]*)\}/.exec(rom);
  if (!match) throw new Error("E_ROM_TABLE_MISSING: us_featb");
  const body = match[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*#.*$/gm, "");
  return body
    .split(",")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
    .map((cell) => Number(cell));
}
const usFeatb = readUsFeatb();
/** phone_feature(a,b) = all_featb[b>>8][b&0xff]; fonts 0 and 1 are both US. */
const phoneFeature = (phone: number): number => usFeatb[phone & 0xff] ?? 0;

type Replayed = { after: Record<string, RuleState>; frames: number };

/** Replay one clause; DECtalk runs the routine once per clause. */
function replay(allophones: Recorded[]): Array<Replayed | null> {
  const count = allophones.length;
  // allophons[] / allofeats[]. Silences are GEN_SIL.
  const phones = allophones.map((a) => (a.kind === "phone" ? US | a.ph : GEN_SIL));
  const strucs = allophones.map((a) => a.struc);
  const phoneAt = (index: number): number => phones[index] ?? 0;
  const strucAt = (index: number): number => strucs[index] ?? 0;

  // Locals of the C routine that persist across iterations.
  let pholas = 0;
  let struclas = 0;
  let fealas = 0;
  let phonex = 0;
  let strucnex = 0;
  let feanex = 0;
  let emphasissw = false;
  let arg1 = 0;

  const out: Array<Replayed | null> = [];
  for (let nphon = 0; nphon < count; nphon += 1) {
    if (nphon > 0) {
      pholas = phoneAt(nphon - 1);
      struclas = strucAt(nphon - 1);
      fealas = phoneFeature(pholas);
    }
    const phocur = phoneAt(nphon);
    const struccur = strucAt(nphon);
    const strucboucur = struccur & FBOUNDARY;
    const feacur = phoneFeature(phocur);
    const syllabic = (feacur & FSYLL) !== 0;
    const stress = struccur & FSTRESS;
    if (nphon < count - 1) {
      phonex = phoneAt(nphon + 1);
      strucnex = strucAt(nphon + 1);
      feanex = phoneFeature(phonex);
    }
    const recorded = allophones[nphon];
    if (recorded.kind === "silence") {
      // Rule 1 sets the pause and skips the rest (goto break3).
      out.push(null);
      continue;
    }
    const nallotot = recorded.nallotot;
    const durinh = recorded.durinh;
    let durmin = recorded.durmin;
    let deldur = 0;
    let prcnt = 128;
    const after: Record<string, RuleState> = {};
    const snap = (rule: number): void => {
      after[String(rule)] = { prcnt, deldur, durmin };
    };
    const typesyl = struccur & FTYPESYL;
    let earlyExit: number | undefined;

    // Rule 2: lengthening in the clause-final rime (281-314).
    if (strucboucur >= FCBNEXT) {
      deldur = NF40MS;
      if ((feacur & FVOICD) !== 0 && (feacur & FOBST) !== 0) deldur = NF20MS;
      if ((feacur & FPLOSV) !== 0) deldur = 0;
      if (
        (phocur === P.RX || phocur === P.LX) &&
        (feanex & FOBST) !== 0 &&
        (feanex & FVOICD) === 0
      ) {
        deldur = NF15MS;
      }
      if (nallotot < 10 && syllabic && stress !== 0) deldur += NF30MS - (nallotot >> 1);
      if ((feanex & FSON1) !== 0) deldur -= NF20MS;
    }
    snap(2);

    // Rule 3: non-phrase-final syllabics (316-330), then adjacent nasals (332-338).
    if (syllabic) {
      if ((strucboucur < FVPNEXT && SPRATE > 160) || strucboucur < FPPNEXT) {
        prcnt = mlsh1(N70PRCNT, prcnt);
      }
    }
    if ((feacur & FNASAL) !== 0 && (fealas & FNASAL) !== 0) {
      if (phocur !== pholas) deldur += NF30MS;
    }
    snap(3);

    // Rules 4 and 5 (349-406).
    if (syllabic) {
      if (typesyl === FMONOSYL) {
        arg1 = N90PRCNT;
        if ((stress & FSTRESS_1) === 0) {
          arg1 = N85PRCNT;
          if (stress === 0) arg1 = N70PRCNT;
          prcnt = mlsh1(arg1, prcnt);
        }
      } else if (strucboucur < FWBNEXT) {
        arg1 = N85PRCNT;
        prcnt = mlsh1(arg1, prcnt);
      }
      if (typesyl !== FMONOSYL) {
        arg1 = prcnt;
        prcnt = mlsh1(arg1, N80PRCNT);
      }
    }
    snap(5);

    // Rule 6: non-word-initial consonants (408-427).
    if (!syllabic && (struccur & FWINITC) === 0) {
      if ((feacur & FOBST) !== 0 && (feacur & FPLOSV) === 0 && strucboucur >= FWBNEXT) {
        deldur += NF20MS;
      } else {
        arg1 = prcnt;
        prcnt = mlsh1(arg1, N85PRCNT);
      }
    }
    snap(6);

    // Rule 7: unstressed segments (429-508).
    if ((stress & FSTRESS_1) === 0) {
      if (durmin < durinh && (feacur & FOBST) === 0) {
        if (stress === 0) durmin = durmin >> 1;
        else durmin -= durmin >> 2;
        if (durmin < 3) durmin = 3;
      }
      if (syllabic) {
        if (typesyl === FMEDIALSYL) {
          prcnt = prcnt >> 1;
        } else {
          arg1 = prcnt;
          prcnt = mlsh1(arg1, N70PRCNT);
        }
        if (phocur === P.AX || phocur === P.IX) {
          if (pholas === P.DX || phonex === P.DX || phonex === P.HX) deldur += NF25MS;
        }
      } else if (phocur >= P.W && phocur <= P.LL) {
        prcnt = prcnt >> 1;
      } else {
        arg1 = prcnt;
        prcnt = mlsh1(arg1, N70PRCNT);
      }
    } else if (syllabic) {
      if ((struccur & FHAT_ENDS) !== 0 && strucboucur < FVPNEXT && strucboucur > FMBNEXT) {
        deldur += NF25MS;
      }
    }
    snap(7);

    // Rule 8: emphasis (510-525).
    if ((struccur & FWINITC) !== 0 || (syllabic && stress !== FEMPHASIS)) emphasissw = false;
    if (stress === FEMPHASIS) emphasissw = true;
    if (emphasissw) {
      deldur += NF20MS;
      if (syllabic) deldur += NF40MS;
    }
    snap(8);

    // Rule 9: postvocalic consonant (527-645).
    let psonsw = 0;
    arg1 = FRAC_ONE;
    let posvoc = GEN_SIL;
    if (
      syllabic ||
      (phocur >= P.RX &&
        phocur <= P.NX &&
        (struccur & (FSTRESS | FWINITC)) === 0 &&
        (feanex & FOBST) !== 0)
    ) {
      // 539: phone_feature(pDph_t, nphon+1) is called with the allophone
      // POSITION, not a phoneme code, so it reads us_featb[nphon+1].
      if ((phoneFeature(nphon + 1) & FSYLL) !== 0) prcnt = mlsh1(prcnt, N70PRCNT);
      if ((feanex & FSYLL) === 0 && (strucnex & (FSTRESS | FWINITC)) === 0) {
        posvoc = phonex;
        if (
          posvoc >= P.RX &&
          posvoc <= P.NX &&
          (phoneFeature(phoneAt(nphon + 2)) & FOBST) !== 0 &&
          (strucAt(nphon + 2) & (FSTRESS | FWINITC)) === 0
        ) {
          psonsw = 1;
          posvoc = phoneAt(nphon + 2);
        }
        if (posvoc !== GEN_SIL) {
          const feaPosvoc = phoneFeature(posvoc);
          if ((feaPosvoc & FVOICD) === 0) {
            deldur = deldur - (deldur >> 1);
            arg1 = N80PRCNT;
            if ((feaPosvoc & FPLOSV) !== 0 || posvoc === P.CH) arg1 = N70PRCNT;
          } else if ((feaPosvoc & FOBST) !== 0 && phocur !== P.EN) {
            arg1 = N120PRCNT;
            if ((feaPosvoc & FPLOSV) === 0 && posvoc !== P.DX && (feacur & FSYLL) !== 0) {
              deldur += NF25MS;
            }
          } else if ((feaPosvoc & FNASAL) !== 0) {
            arg1 = N85PRCNT;
          }
        }
      }
      if (strucboucur < FVPNEXT || psonsw === 1) arg1 = FRAC_HALF + (arg1 >> 1);
      if (phocur === P.N && phonex === P.T && (strucnex & (FWINITC | FSTRESS)) === 0) {
        arg1 = N10PRCNT;
        if (
          (phoneFeature(phoneAt(nphon + 2)) & FSYLL) !== 0 &&
          (strucAt(nphon + 2) & FMEDIALSYL) === 0
        ) {
          // 636: the following [t] becomes [d] after durations.
          arg1 = N70PRCNT;
        }
      }
      prcnt = mlsh1(arg1, prcnt);
    }
    snap(9);

    if (syllabic) {
      // Rule 10 (647-653), Rule 11 (655-661), Rule 12 (663-674).
      if ((feanex & FSYLL) !== 0) deldur += NF30MS;
      if (typesyl === FFIRSTSYL && (struccur & FSTRESS_1) !== 0 && (struclas & FWINITC) === 0) {
        deldur += NF25MS;
      }
      if (phonex === P.LX) {
        deldur -= NF20MS;
        arg1 = N70PRCNT;
        prcnt = mlsh1(arg1, prcnt);
      }
    } else if ((feacur & FCONSON) !== 0) {
      // Rule 13: consonant clusters (677-755). `arg1` keeps whatever Rule 9
      // left in it unless one of the assignments below runs.
      if ((feanex & FCONSON) !== 0 && strucboucur < FWBNEXT) {
        if ((feanex & FPLOSV) === 0 || (feacur & FPLOSV) === 0) arg1 = N70PRCNT;
        if ((feacur & FNASAL) !== 0 && (strucnex & FWINITC) !== 0) arg1 = N150PRCNT;
        else durmin -= durmin >> 2;
        if (phocur === P.S || phocur === P.TH) {
          if ((feanex & FPLOSV) !== 0) arg1 = FRAC_HALF;
          if (phonex === P.SH) earlyExit = NF15MS;
        }
        if (earlyExit == null) prcnt = mlsh1(arg1, prcnt);
      }
      if (earlyExit == null && (fealas & FCONSON) !== 0 && (struclas & FBOUNDARY) < FVPNEXT) {
        arg1 = N70PRCNT;
        durmin -= durmin >> 2;
        if ((feacur & FPLOSV) !== 0) {
          if (pholas === P.S) arg1 = N60PRCNT;
          if ((fealas & FNASAL) !== 0 && stress === 0) arg1 = 1638;
        }
        prcnt = mlsh1(arg1, prcnt);
      }
    }
    if (earlyExit != null) {
      // 713-717: [s]/[th] before [sh] takes NF15MS and skips everything else.
      out.push({ after, frames: earlyExit });
      continue;
    }
    snap(13);

    // Rule 14 (757-765), Rule 15 (767-774), Rule 16 (776-786).
    if ((feacur & FSON1) !== 0 && (fealas & FVOICD) === 0 && (fealas & FPLOSV) !== 0) {
      deldur += NF20MS;
    }
    if ((feacur & FVOWEL) !== 0 && pholas === GEN_SIL) deldur += NF20MS;
    if ((feacur & FVOWEL) !== 0 && (fealas & FSON2) !== 0 && (fealas & FNASAL) === 0) {
      if (deldur === 0) deldur = NF20MS;
    }
    snap(16);

    // Rule 17 (788-802).
    if (nallotot < 10 && durinh !== durmin) prcnt += 30;
    // Rule 18 (804-815).
    if ((feacur & FSONCON) !== 0 && (fealas & FOBST) !== 0) {
      arg1 = prcnt;
      prcnt = mlsh1(arg1, N70PRCNT);
    }
    // Rule 19 (817-825).
    if (phocur === P.TH && typesyl === FMONOSYL && strucboucur >= FWBNEXT && stress === 0) {
      arg1 = prcnt;
      prcnt = mlsh1(arg1, N60PRCNT);
    }
    // Rule 20 (827-835).
    if (phocur === P.IY && strucboucur > FMBNEXT && stress === 0 && typesyl === FMONOSYL) {
      arg1 = prcnt;
      prcnt = mlsh1(arg1, N150PRCNT);
    }
    // Rule 21 (837-856).
    if (
      (feacur & FPLOSV) !== 0 &&
      (fealas & FPLOSV) !== 0 &&
      (feanex & FOBST) !== 0 &&
      strucboucur > FMBNEXT
    ) {
      durmin = durmin >> 1;
      arg1 = prcnt;
      prcnt = mlsh1(arg1, N25PRCNT);
    }
    // Rule 23 (858-867).
    if (phonex === P.DF) {
      arg1 = prcnt;
      prcnt = mlsh1(arg1, N35PRCNT);
    }
    // 871-877: retroflex vowel minimum.
    if (phocur === P.RR && durmin <= 13) durmin = 13;
    // Rule 24 (879-889) reads allophons[nphon+1] directly.
    if (phoneAt(nphon + 1) === P.NX) {
      arg1 = prcnt;
      prcnt = mlsh1(arg1, N60PRCNT);
    }
    snap(24);

    // 895-941: final duration.
    let durxx = ((prcnt * (durinh - durmin)) >> 7) + durmin + deldur;
    if (durxx < 0) durxx = 1;
    if (phocur === P.HX && durxx > 11) durxx = 11;
    out.push({ after, frames: durxx });
  }
  return out;
}

let phonesChecked = 0;
let phonesExact = 0;
let framesExact = 0;
const firstDivergence = new Map<string, number>();
const failures: string[] = [];
for (const corpusFile of corpusFiles) {
  const corpusId = (JSON.parse(fs.readFileSync(corpusFile, "utf8")) as { corpusId: string })
    .corpusId;
  const fixture = JSON.parse(
    fs.readFileSync(
      path.join(repoRoot, "test", "fixtures", "dectalk-oracle", `${corpusId}.durations.json`),
      "utf8",
    ),
  ) as { entries: Record<string, { text: string; clauses: Recorded[][] }> };
  const clauses = Object.entries(fixture.entries).flatMap(([id, entry]) =>
    onlyId && id !== onlyId ? [] : entry.clauses.map((allophones) => ({ id, allophones })),
  );
  for (const { id, allophones } of clauses) {
    const replayed = replay(allophones);
    allophones.forEach((recorded, index) => {
      if (recorded.kind !== "phone") return;
      const mine = replayed[index];
      if (!mine) return;
      phonesChecked += 1;
      let divergedAt: string | undefined;
      for (const rule of Object.keys(recorded.after).sort((a, b) => Number(a) - Number(b))) {
        const theirs = recorded.after[rule];
        const ours = mine.after[rule];
        if (
          !ours ||
          ours.prcnt !== theirs.prcnt ||
          ours.deldur !== theirs.deldur ||
          ours.durmin !== theirs.durmin
        ) {
          divergedAt = rule;
          break;
        }
      }
      if (mine.frames === recorded.frames) framesExact += 1;
      if (divergedAt == null && mine.frames === recorded.frames) {
        phonesExact += 1;
        return;
      }
      const key = divergedAt ?? "final";
      firstDivergence.set(key, (firstDivergence.get(key) ?? 0) + 1);
      const theirs = divergedAt ? recorded.after[divergedAt] : undefined;
      const ours = divergedAt ? mine.after[divergedAt] : undefined;
      failures.push(
        `${id} n=${recorded.n} ph=${recorded.ph} first differs after rule ${key}: ` +
          `DECtalk ${JSON.stringify(theirs ?? recorded.frames)} replay ${JSON.stringify(ours ?? mine.frames)}`,
      );
    });
  }
}

if (verbose) for (const failure of failures) console.log(failure);
console.log(
  JSON.stringify({
    phonesChecked,
    phonesExact,
    framesExact,
    firstDivergenceByRule: Object.fromEntries(
      [...firstDivergence].sort((a, b) => Number(a[0]) - Number(b[0])),
    ),
  }),
);
process.exitCode = phonesExact === phonesChecked ? 0 : 1;
