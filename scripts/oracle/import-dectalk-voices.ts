#!/usr/bin/env node

/**
 * import-dectalk-voices.ts
 * ========================
 * The voice files of the dectalk-english frontend
 * (public/rules/frontends/dectalk-english/speakers/<voice>.yaml), from the
 * speaker definitions DECtalk 4.63's US build compiles and from what
 * setspdef() makes of them.
 *
 * Which definitions. usevoice() copies voidef[voice], the 11 kHz table, when
 * the sample rate is 8763 Hz or more (PH/ph_vset.c:433-442; the rate is
 * 11025), and PH/ph_main.c:511-519 fills that table with us_paul, us_betty,
 * us_harry, us_frank, us_dennis, us_kit, us_ursula, us_rita, us_wendy
 * (voices 0 to 8). The structs are in PH/P_us_vdf1.h, several of them more
 * than once under #ifdef; this script reads the header through the build's
 * defines (BUILD_DEFINES below) and takes the one definition that is left.
 * A field is the entry at its SPD_ index (INCLUDE/cmd.h:159-205), whatever
 * the comment beside it says: the comments of the last entries are shifted.
 *
 * The tuning tables. usevoice() adds a table to the definition entry by entry
 * (PH/ph_vset.c:446-448), us_<voice>_tune of PH/p_us_vdf_tunehl.h in this
 * build (HLSYN, PH/ph_vdefi.c:69-70). They change the gains (GF, GH, GV, GN,
 * G1-G4, LO); every field here is computed from the sum.
 *
 * What setspdef() makes of them (PH/ph_vset.c:660-818, and for voice 3,
 * Frank, outside reading mode the block at 580-659 instead): the pitch
 * floor and range, the F0 filter, the hat rise, the formant scale, the
 * cascade F4 and F5 the generator gets, and the speaker definition packet it
 * sends the synthesizer, which the files carry as SPD_* fields with
 * last_voice, NOM_Open_Quo and Tiltm for the dectalk-vtm node.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/import-dectalk-voices.ts [--write | --check] [--dectalk <root>]
 *
 * Without a flag it prints, per voice, every field whose value in the
 * frontend's file differs from DECtalk's (`field: file -> DECtalk`). --write
 * rewrites the voice files. --check prints the same differences and exits 1
 * if there is one; test/dectalk-voice-files.test.ts runs it.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const dectalkFlag = argv.indexOf("--dectalk");
const dectalkRoot = path.resolve(
  (dectalkFlag >= 0 ? argv[dectalkFlag + 1] : undefined) ??
    process.env.DECTALK_SOURCE_ROOT ??
    "C:/Users/Q/src/dectalk/463",
);
const speakersDir = path.join(
  repoRoot,
  "public",
  "rules",
  "frontends",
  "dectalk-english",
  "speakers",
);

/**
 * What is defined when PH/ph_vdefi.c includes P_us_vdf1.h in the static US
 * build: the compiler's /D flags (dapi/src/dtstatic.mak:164) and OLD_VOICES
 * (PH/ph_defs.h:121; SUEB and DIANE are commented out at 119-120). KEN
 * (P_us_vdf1.h:646) and SCI (dectalkf.h:143) are commented out; FP_VTM is
 * defined only for ALPHA and OSF (dectalkf.h). The header defines SBART
 * itself (1087), which the reader below follows.
 */
const BUILD_DEFINES = [
  "ENGLISH_US",
  "ENGLISH",
  "ACNA",
  "NDEBUG",
  "i386",
  "WIN32",
  "_WINDOWS",
  "BLD_DECTALK_DLL",
  "STATIC_BUILD",
  "OLD_VOICES",
];

/** voidef[] order, PH/ph_main.c:511-519. */
const VOICES = [
  ["paul", "us_paul"],
  ["betty", "us_betty"],
  ["harry", "us_harry"],
  ["frank", "us_frank"],
  ["dennis", "us_dennis"],
  ["kit", "us_kit"],
  ["ursula", "us_ursula"],
  ["rita", "us_rita"],
  ["wendy", "us_wendy"],
] as const;

/** INCLUDE/cmd.h:159-205. */
const SPD = {
  SEX: 0,
  SM: 1,
  AS: 2,
  AP: 3,
  PR: 4,
  BR: 5,
  RI: 6,
  NF: 7,
  LA: 8,
  HS: 9,
  F4: 10,
  B4: 11,
  F5: 12,
  B5: 13,
  P4: 14,
  P5: 15,
  GF: 16,
  GH: 17,
  GV: 18,
  GN: 19,
  G1: 20,
  G2: 21,
  G3: 22,
  G4: 23,
  LO: 24,
  FT: 25,
  BF: 26,
  LX: 27,
  QU: 28,
  HR: 29,
  SR: 30,
  AGO: 31,
  AGVO: 32,
  AGUO: 33,
  UNVOW: 34,
  CHINK: 35,
  OQ: 36,
} as const;

/** PH/ph_defs.h:733-734, 726-727 (the non-MSDOS values). */
const CONSTANTS: Readonly<Record<string, number>> = { MALE: 1, FEMALE: 0, ZAPF: 6000, ZAPB: 6000 };
const ZAPF = 6000;
const ZAPB = 6000;

/** The lines of a header that survive #ifdef, #ifndef, #else and #endif. */
function compiledLines(text: string, defines: readonly string[]): { line: number; text: string }[] {
  const defined = new Set(defines);
  const stack: { parentActive: boolean; taken: boolean; active: boolean }[] = [];
  const active = (): boolean => stack.every((frame) => frame.active);
  const kept: { line: number; text: string }[] = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    const directive = /^\s*#\s*(\w+)\s*(.*)$/.exec(raw);
    if (!directive) {
      if (active()) kept.push({ line: index + 1, text: raw });
      return;
    }
    const [, keyword, rest] = directive as unknown as [string, string, string];
    const name = rest.replace(/\/\/.*$|\/\*.*$/, "").trim();
    if (keyword === "ifdef" || keyword === "ifndef") {
      const parentActive = active();
      const condition = keyword === "ifdef" ? defined.has(name) : !defined.has(name);
      stack.push({ parentActive, taken: condition, active: condition });
    } else if (keyword === "else") {
      const frame = stack[stack.length - 1];
      if (!frame) throw new Error(`E_VOICE_HEADER: #else without #if at line ${index + 1}`);
      frame.active = !frame.taken;
    } else if (keyword === "endif") {
      if (!stack.pop()) throw new Error(`E_VOICE_HEADER: #endif without #if at line ${index + 1}`);
    } else if (keyword === "define") {
      if (active()) defined.add(name.split(/\s+/)[0] as string);
    } else if (keyword === "if" || keyword === "elif") {
      throw new Error(`E_VOICE_HEADER: unsupported #${keyword} at line ${index + 1}`);
    }
  });
  return kept;
}

type Struct = { values: number[]; firstLine: number; lastLine: number };

/**
 * The one compiled initializer of `const short <name>[<size>]`. The voice
 * definitions are declared `[SPDEF]`, the tuning tables `[]`.
 */
function readStruct(lines: { line: number; text: string }[], name: string, size = "SPDEF"): Struct {
  const starts = lines
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) =>
      new RegExp(`const\\s+short\\s+${name}\\s*\\[${size}\\]`).test(entry.text),
    );
  if (starts.length !== 1) {
    throw new Error(`E_VOICE_STRUCT: ${starts.length} compiled definitions of ${name}`);
  }
  const start = (starts[0] as { index: number }).index;
  let body = "";
  let end = start;
  for (let index = start; index < lines.length; index += 1) {
    const text = (lines[index] as { text: string }).text.replace(/\/\/.*$/, "");
    body += `${text}\n`;
    end = index;
    if (text.includes("};")) break;
  }
  const inside = body
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[\s\S]*?\{/, "")
    .replace(/\}[\s\S]*$/, "");
  const values = inside
    .split(",")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
    .map((cell) => {
      const value = cell in CONSTANTS ? (CONSTANTS[cell] as number) : Number(cell);
      if (!Number.isInteger(value)) throw new Error(`E_VOICE_CELL: ${name}: '${cell}'`);
      return value;
    });
  // The initializers stop after SPD_CHINK; the entries after it are zero.
  if (values.length <= SPD.CHINK) {
    throw new Error(`E_VOICE_STRUCT: ${name} has ${values.length} entries`);
  }
  return {
    values,
    firstLine: (lines[start] as { line: number }).line,
    lastLine: (lines[end] as { line: number }).line,
  };
}

const header = fs.readFileSync(
  path.join(dectalkRoot, "dapi", "src", "PH", "P_us_vdf1.h"),
  "latin1",
);
const lines = compiledLines(header, BUILD_DEFINES);

// The tuning tables. usevoice() does not copy the definition alone: it adds
// the voice's tuning table to it, entry by entry,
// `curspdef[i] = newspdef[i] + tunespdef[i]` (PH/ph_vset.c:446-448), with
// tunedef[voice] set to us_<voice>_tune (ph_vset.c:285-293). With HLSYN
// defined (dectalkf.h:114), PH/ph_vdefi.c:69-70 takes those tables from
// PH/p_us_vdf_tunehl.h. Everything setspdef() and the rules read is the sum.
const tuneLines = compiledLines(
  fs.readFileSync(path.join(dectalkRoot, "dapi", "src", "PH", "p_us_vdf_tunehl.h"), "latin1"),
  BUILD_DEFINES,
);

type VoiceFile = { comment: string[]; fields: Record<string, number | string> };

function voiceFile(voice: string, structName: string, voiceNumber: number): VoiceFile {
  const struct = readStruct(lines, structName);
  const tune = readStruct(tuneLines, `${structName}_tune`, "");
  // curspdef: the definition plus its tuning table. Entries past either
  // initializer are zero.
  const spd = (name: keyof typeof SPD): number =>
    (struct.values[SPD[name]] ?? 0) + (tune.values[SPD[name]] ?? 0);
  const tuned = (Object.keys(SPD) as (keyof typeof SPD)[]).filter(
    (name) => (tune.values[SPD[name]] ?? 0) !== 0,
  );
  // Voice 3 outside reading mode: ph_vset.c:580-659.
  const frank = voice === "frank";
  const male = spd("SEX") === CONSTANTS.MALE;
  const fnscale = frank ? (200 - 100) * 41 : (200 - spd("HS")) * 41;
  const scaled = (hz: number): number => Math.floor((hz * fnscale) / 4096);
  // ph_vset.c:714-757: the cascade F4 and F5 the generator gets.
  let f4 = frank ? scaled(3400) : spd("F4") === ZAPF ? ZAPF : scaled(spd("F4"));
  let b4 = frank ? 260 : spd("B4");
  if (!frank && f4 > 4950) {
    f4 = ZAPF;
    b4 = ZAPB;
  }
  let f5 = frank || spd("F5") === ZAPF ? ZAPF : scaled(spd("F5"));
  let b5 = frank ? ZAPB : spd("B5");
  if (!frank && f5 > Math.floor(11025 / 2)) {
    f5 = ZAPF;
    b5 = ZAPB;
  }
  const lowpass = frank ? 1500 + 15 * (spd("QU") + 40) : 1500 + 15 * spd("QU");
  const breathiness = frank ? 0 : spd("BR");
  const fields: Record<string, number | string> = {
    name: voice[0]?.toUpperCase() + voice.slice(1),
    sex: male ? "male" : "female",
    fnscale,
    base_f0_hz: spd("AP"),
    // Not DECtalk's: the Klatt-graph backend's own stand-ins for a voice's
    // formant scale and source quality. engineering estimate
    formant_scale: male ? 1 : 1.17,
    rd_default:
      Math.round(Math.max(0.3, Math.min(2.7, (male ? 0.7 : 0.8) + breathiness * 0.004)) * 100) /
      100,
    spectral_tilt_offset_db: Math.round(breathiness * 0.1 * 10) / 10,
    f0_minimum: frank ? (spd("AP") - 65) * 10 : (spd("AP") - 12) * 10,
    f0_scale_factor: spd("PR") * 41,
    f0_lp_filter: lowpass,
    f0_lp_filter_alpha: lowpass / 16384,
    hat_rise_hz10: frank ? (spd("HR") - 10) * 10 : spd("HR") * 10,
    scale_str_rise: spd("SR"),
    assertiveness: spd("AS") * 41,
    baseline_fall_hz10: spd("BF") * 10,
    falling_target: spd("FT"),
    F4: f4,
    B4: b4,
    F5: f5,
    B5: b5,
    F7: frank ? 3400 : spd("P4"),
    F8: frank ? 4800 : spd("P5"),
    GF: frank ? spd("GF") - 3 : spd("GF"),
    GH: frank ? spd("GH") - 3 : spd("GH"),
    GV: frank ? spd("GV") - 5 : spd("GV"),
    GN: spd("GN"),
    G1: frank ? 65 : spd("G1"),
    G2: frank ? 65 : spd("G2"),
    G3: frank ? 66 : spd("G3"),
    G4: frank ? 60 : spd("G4"),
    LO: frank ? 70 : spd("LO"),
    AGO: spd("AGO"),
    AGVO: spd("AGVO"),
    AGUO: spd("AGUO"),
    UNVOW: spd("UNVOW"),
    CHINK: spd("CHINK"),
    smoothness: spd("SM"),
    breathiness,
    richness: frank ? 30 : spd("RI"),
    nopen_fraction: frank ? 20 : spd("NF"),
    laryngealization: frank ? 0 : spd("LA"),
    head_size: spd("HS"),
    quickness: spd("QU"),
    // The voice definition's own fourth formant, which the packets carry
    // (OUT_F4, ph_draw.c:4189); F4 above is the generator's, scaled.
    spd_F4: spd("F4"),
  };
  // The speaker definition packet setspdef() sends the synthesizer (struct
  // SPD_CHIP, PH/ph_defs.h:693-720) and the three values the VTM thread reads
  // beside it, under the names of the dectalk-vtm node's parameters
  // (public/experiments/dectalk-vtm/registry.yaml). Line numbers are the
  // general path's, PH/ph_vset.c; Frank's block (580-659) sets the same words
  // from the values above.
  const number = (key: string): number => fields[key] as number;
  Object.assign(fields, {
    SPD_R4CB: f4, // r4cb, 714-730
    SPD_R4CC: b4, // r4cc, 725-730
    SPD_R5CB: f5, // r5cb, 732-760
    SPD_R5CC: b5, // r5cc, 755-760
    SPD_R4PB: number("F7"), // r4pb = P4, 761
    SPD_R5PB: number("F8"), // r5pb = P5, 762
    SPD_T0JIT: number("laryngealization"), // t0jit = LA, 763
    SPD_R5CA: number("G1"), // r5ca, 765
    SPD_R4CA: number("G2"), // r4ca, 766
    SPD_R3CA: number("G3"), // r3ca, 767
    SPD_R2CA: number("G4"), // r2ca, 772
    SPD_R1CA: number("LO"), // r1ca, 775
    SPD_NOPEN1: 5000 + 160 * (100 - number("richness")), // nopen1, 783
    SPD_NOPEN2: number("nopen_fraction") * 4, // nopen2, 784
    SPD_ATURB: breathiness, // aturb = BR, 786
    SPD_AFGAIN: number("GF"), // afgain, 816
    SPD_AZGAIN: number("GV"), // azgain, 810
    SPD_APGAIN: number("GH"), // apgain, 818
    SPD_SEX: spd("SEX"), // sex = malfem = SPD_SEX, 537-538
    // pKsd_t->last_voice: the voice's place in voidef[] (ph_main.c:511-519).
    last_voice: voiceNumber,
    // NOM_Open_Quo = curspdef[SPD_OQ], 672 (591 for Frank): past the end of
    // the definition's initializer, so zero.
    NOM_Open_Quo: spd("OQ"),
    // Tiltm = SM * 20 / 100 in integers, 689; SM - 40 in Frank's block, 605.
    Tiltm: frank ? spd("SM") - 40 : Math.trunc((spd("SM") * 20) / 100),
  });
  const comment = [
    `DECtalk voice "${fields.name}". Generated from DECtalk 4.63`,
    `dapi/src/PH/P_us_vdf1.h:${struct.firstLine}-${struct.lastLine} (${structName}, by SPD_ index, INCLUDE/cmd.h:159-205)`,
    "and setspdef() (PH/ph_vset.c) by scripts/oracle/import-dectalk-voices.ts --write.",
    "Do not edit: change the script and run it again.",
    "",
    "sex: SPD_SEX. fnscale: (200 - HS) * 41 (ph_vset.c:712). base_f0_hz: AP.",
    "f0_minimum: (AP - 12) * 10. f0_scale_factor: PR * 41. f0_lp_filter:",
    "1500 + 15 * QU, and f0_lp_filter_alpha that over 16384 (the F0 filter's Q14",
    "coefficient, Ph_drwt02.c). hat_rise_hz10: HR * 10. scale_str_rise: SR.",
    "assertiveness: AS * 41. baseline_fall_hz10: BF * 10. falling_target: FT",
    "(ph_vset.c:675-685). F4, F5: the definition's times fnscale >> 12, or 6000",
    "(off) when the definition says so or the result is too high; B4, B5 with",
    "them (ph_vset.c:714-757). F7, F8: P4, P5. spd_F4: the definition's own F4.",
    "GF..LO, AGO, AGVO, AGUO, UNVOW, CHINK, smoothness (SM), breathiness (BR),",
    "richness (RI), nopen_fraction (NF), laryngealization (LA), head_size (HS),",
    "quickness (QU): the definition's entries.",
    "",
    "Every entry is the definition's plus the voice's tuning table's, as",
    `usevoice() adds them (ph_vset.c:446-448; PH/p_us_vdf_tunehl.h:${tune.firstLine}-${tune.lastLine},`,
    `${structName}_tune). The table changes ${
      tuned.length > 0
        ? tuned
            .map((name) => {
              const delta = tune.values[SPD[name]] as number;
              return `${name} by ${delta > 0 ? "+" : ""}${delta}`;
            })
            .join(", ")
        : "nothing"
    }.`,
    "",
    "SPD_R4CB..SPD_SEX: the speaker definition packet setspdef() sends the",
    "synthesizer (struct SPD_CHIP, ph_defs.h:693-720), word by word: r4cb F4,",
    "r4cc B4, r5cb F5, r5cc B5 as above; r4pb F7; r5pb F8; t0jit LA; r5ca G1;",
    "r4ca G2; r3ca G3; r2ca G4; r1ca LO; nopen1 5000 + 160 * (100 - RI); nopen2",
    "NF * 4; aturb BR; afgain GF; azgain GV; apgain GH; sex SPD_SEX",
    "(ph_vset.c:537-538, 714-818). last_voice: the voice number. NOM_Open_Quo:",
    "entry SPD_OQ (672). Tiltm: SM * 20 / 100 (689). The dectalk-vtm node takes",
    'these (scripts/oracle/dectalk-debug/ph-contract.md, "Per speaker"); they',
    "equal the packet the stock say.exe sent",
    "(test/dectalk-speaker-packets.test.ts).",
    ...(frank
      ? [
          "",
          "Voice 3 outside reading mode takes setspdef()'s own block",
          "(ph_vset.c:580-659): head size 100 for fnscale, f0_minimum",
          "(AP - 65) * 10, hat rise (HR - 10) * 10, filter 1500 + 15 * (QU + 40),",
          "F4 3400 scaled and B4 260, no F5, F7 3400, F8 4800, G1 65, G2 65, G3 66,",
          "G4 60, LO 70, GV - 5, GF - 3, GH - 3, richness 30, nopen_fraction 20, no",
          "breathiness, no laryngealization, Tiltm SM - 40 (605).",
        ]
      : []),
    "",
    "formant_scale, rd_default and spectral_tilt_offset_db are not DECtalk's:",
    "the Klatt-graph backend's stand-ins (1 or 1.17 by sex; 0.7 or 0.8 plus",
    "0.004 a dB of breathiness; a tenth of the breathiness). engineering estimate",
  ];
  return { comment, fields };
}

function render(file: VoiceFile, structName: string): string {
  const out = file.comment.map((line) => (line.length > 0 ? `# ${line}` : "#"));
  out.push("citations:");
  out.push(`  - "DECtalk 4.63 PH/P_us_vdf1.h ${structName}; INCLUDE/cmd.h:159-205 SPD_ indices"`);
  out.push(
    `  - "DECtalk 4.63 PH/p_us_vdf_tunehl.h ${structName}_tune; ph_vset.c:446-448 (definition plus tuning table)"`,
  );
  out.push('  - "DECtalk 4.63 PH/ph_vset.c:537-538, 580-818 setspdef"');
  out.push('  - "DECtalk 4.63 PH/ph_main.c:511-519 voidef; ph_vset.c:433-442 usevoice"');
  for (const [key, value] of Object.entries(file.fields)) out.push(`${key}: ${value}`);
  return `${out.join("\n")}\n`;
}

// --listing <file>: check this script's reading of the #if chain against the
// compiler's. The file is ph_vdefi.c preprocessed with the build's flags
// (`cl /P /C` with the /I and /D of dapi/src/dtstatic.mak:164; see
// scripts/oracle/dectalk-debug/compiled-lines.awk), in which every voice has
// the one definition the compiler saw, macros expanded.
const listingFlag = argv.indexOf("--listing");
if (listingFlag >= 0) {
  const listing = fs.readFileSync(path.resolve(argv[listingFlag + 1] as string), "latin1");
  let failed = false;
  for (const [voice, structName] of VOICES) {
    const pattern = new RegExp(
      `const\\s+short\\s+${structName}\\s*\\[[^\\]]*\\]\\s*=\\s*\\{([\\s\\S]*?)\\};`,
      "g",
    );
    const compiled = [...listing.matchAll(pattern)].map((match) =>
      (match[1] as string)
        .replace(/^\s*#line.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "")
        .split(",")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0)
        .map(Number),
    );
    const mine = readStruct(lines, structName).values;
    const same =
      compiled.length === 1 &&
      (compiled[0] as number[]).length === mine.length &&
      (compiled[0] as number[]).every((value, index) => value === mine[index]);
    if (!same) failed = true;
    process.stdout.write(
      `${voice}: ${structName} ${compiled.length} definition(s) in the listing, ${
        same ? `${mine.length} entries equal` : "DIFFERENT from this script's reading"
      }\n`,
    );
  }
  process.exit(failed ? 1 : 0);
}

const differences: string[] = [];
for (const [voiceNumber, [voice, structName]] of VOICES.entries()) {
  const file = voiceFile(voice, structName, voiceNumber);
  const target = path.join(speakersDir, `${voice}.yaml`);
  if (argv.includes("--write")) {
    fs.writeFileSync(target, render(file, structName));
    process.stdout.write(`wrote ${target}\n`);
    continue;
  }
  const current = (yaml.load(fs.readFileSync(target, "utf8")) ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(file.fields)) {
    if (current[key] !== value) {
      differences.push(`${voice}.${key}: ${String(current[key])} -> ${String(value)}`);
    }
  }
}
if (!argv.includes("--write")) {
  for (const difference of differences) process.stdout.write(`${difference}\n`);
  process.stdout.write(
    differences.length === 0
      ? "voice files match P_us_vdf1.h and setspdef\n"
      : `${differences.length} differences\n`,
  );
  if (argv.includes("--check")) process.exit(differences.length === 0 ? 0 : 1);
}
