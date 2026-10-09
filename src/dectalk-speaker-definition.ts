/**
 * A DECtalk speaker definition and what setspdef() makes of it (DECtalk 4.63
 * PH/ph_vset.c:537-818): the fields of a voice file of the dectalk-english
 * frontend, from the definition's entries by SPD_ index (INCLUDE/cmd.h:159-205).
 *
 * Two callers: scripts/oracle/import-dectalk-voices.ts, which writes the
 * voice files from DECtalk's own definitions, and the frontend, when a text
 * changes entries of the selected voice's definition with the command
 * "[:dv <word> <number>]" before anything is spoken (setparam,
 * PH/ph_vset.c:175-232).
 *
 * The entries' names by index and their limits are data
 * (public/rules/frontends/dectalk-english/speaker-definition.json, written by
 * the importer from INCLUDE/cmd.h and PH/ph_vdefi.c limit[]).
 */

/** PH/ph_defs.h:733-734 (MALE), 726-727 (ZAPF, ZAPB, the non-MSDOS values). */
const MALE = 1;
const ZAPF = 6000;
const ZAPB = 6000;
/** The sample rate setspdef() tests F5 against (PH/ph_vset.c:738-757). */
const SAMPLE_RATE = 11025;
/**
 * The voice setspdef() gives its own block outside reading mode: voice 3 of
 * voidef[], Frank (PH/ph_vset.c:580-583 tests last_voice == 3;
 * PH/ph_main.c:511-519).
 */
export const OWN_BLOCK_VOICE = 3;

/** The entries' names by index, and each entry's lowest and highest value. */
export interface SpeakerDefinitionData {
  names: string[];
  limits: [number, number][];
}

/** A voice's definition as usevoice() loads it, and its tuning table. */
export interface SpeakerDefinition {
  /** curspdef: the definition plus the voice's tuning table (ph_vset.c:446-448). */
  values: number[];
  /** tunedef[voice]: what setparam() adds to a number it is given (219). */
  tune: number[];
}

/** One "[:dv <word> <number>]": the entry's index and the number typed. */
export interface DefinitionChange {
  index: number;
  value: number;
}

export function isSpeakerDefinitionData(value: unknown): value is SpeakerDefinitionData {
  if (typeof value !== "object" || value === null) return false;
  const { names, limits } = value as { names?: unknown; limits?: unknown };
  return (
    Array.isArray(names) &&
    names.every((name) => typeof name === "string") &&
    Array.isArray(limits) &&
    limits.length >= names.length &&
    limits.every(
      (limit) =>
        Array.isArray(limit) &&
        limit.length === 2 &&
        limit.every((bound) => typeof bound === "number"),
    )
  );
}

export function isSpeakerDefinition(value: unknown): value is SpeakerDefinition {
  if (typeof value !== "object" || value === null) return false;
  const { values, tune } = value as { values?: unknown; tune?: unknown };
  const numbers = (list: unknown): boolean =>
    Array.isArray(list) && list.every((entry) => typeof entry === "number");
  return numbers(values) && numbers(tune);
}

/**
 * setparam() (PH/ph_vset.c:175-232, the branch taken when the synthesizer is
 * not tuning): an index outside the definition is ignored; the number has the
 * voice's tuning table's entry added, is held between the entry's limits, and
 * replaces the entry.
 */
export function changeDefinition(
  definition: SpeakerDefinition,
  data: SpeakerDefinitionData,
  changes: readonly DefinitionChange[],
): SpeakerDefinition {
  const values = [...definition.values];
  for (const { index, value } of changes) {
    const limit = data.limits[index];
    if (index < 0 || index >= data.names.length || !limit) continue;
    const tuned = value + (definition.tune[index] ?? 0);
    values[index] = Math.min(limit[1], Math.max(limit[0], tuned));
  }
  return { values, tune: definition.tune };
}

/**
 * The voice file's fields that come from the definition, in the file's
 * order. `frank` is voice 3 outside reading mode, which setspdef() gives its
 * own block (ph_vset.c:580-659).
 */
export function voiceFieldsOfDefinition(
  values: readonly number[],
  data: SpeakerDefinitionData,
  options: { frank: boolean; voiceNumber: number },
): Record<string, number | string> {
  const spd = (name: string): number => {
    const index = data.names.indexOf(name);
    if (index < 0) throw new Error(`E_VOICE_SOURCE: the speaker definition has no entry ${name}`);
    return values[index] ?? 0;
  };
  const { frank } = options;
  const male = spd("SEX") === MALE;
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
  if (!frank && f5 > Math.floor(SAMPLE_RATE / 2)) {
    f5 = ZAPF;
    b5 = ZAPB;
  }
  const lowpass = frank ? 1500 + 15 * (spd("QU") + 40) : 1500 + 15 * spd("QU");
  const breathiness = frank ? 0 : spd("BR");
  const fields: Record<string, number | string> = {
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
    last_voice: options.voiceNumber,
    // NOM_Open_Quo = curspdef[SPD_OQ], 672 (591 for Frank): past the end of
    // the definition's initializer, so zero.
    NOM_Open_Quo: spd("OQ"),
    // Tiltm = SM * 20 / 100 in integers, 689; SM - 40 in Frank's block, 605.
    Tiltm: frank ? spd("SM") - 40 : Math.trunc((spd("SM") * 20) / 100),
  });
  return fields;
}
