//! HLsyn 2.2 as built into DECtalk 4.63: maps one frame of high-level
//! (articulatory) parameters to the low-level frame that the vocal tract model
//! in the crate root consumes.
//!
//! A transcription of `HLSynthesizeLLFrame` and everything it calls, from the
//! DECtalk 4.63 source tree (`dapi/src/hlsyn`, Copyright (c) 1993-1998
//! Sensimetrics Corporation), plus the packet-to-`HLFrame` conversion of
//! `dapi/src/VTM/vtmiont.c:660-683`. Function and variable names follow the C
//! and each block cites `file:line`.
//!
//! # Build configuration transcribed
//!
//! `dtstatic.mak:172-256` links `acxf1c.obj`, `brent.obj`, `circuit.obj`,
//! `hlframe.obj`, `inithl.obj`, `log10table.obj`, `nasalf1x.obj` and
//! `sqrttable.obj` into the library the stock `say.exe` uses. `HLSYN`
//! (`dectalkf.h:114`) and `TONGUE_BODY_AREA` (`dectalkf.h:186`) are defined;
//! `INVTMIONT`, `in_phdraw`, `DEBUG`, `WARNINGS`, `LOWCOMPUTE_MITSU` and every
//! `FLAV_*` switch of `hlsyn/flavor.h` are not, so those branches are left out.
//!
//! # Arithmetic
//!
//! The C is single-precision `float` code compiled for x86 with SSE2, where
//! each operation is evaluated in the precision of its operands. `float` is
//! `f32` here and every place where C promotes to `double` (a `double`
//! literal such as `30.`, or `fabs`, `tan`, `sqrt`, `log10`) is written out as
//! `f64`. Conversions to `short`/`int` go through [`cvtt`], which reproduces
//! the x86 truncating conversion including its out-of-range result.
//!
//! `SusceptanceSum` calls the C library's `tan`, and `DT_f_sqrt`/`DT_f_log10`
//! call `sqrt`/`log10` outside their tables. DECtalk links Microsoft's
//! `__libm_sse2_tan_precise` and `__libm_sse2_log10_precise`. The port uses
//! the `libm` crate's `tan` and `log10` instead of the platform's, so every
//! target runs the same code; `sqrt` is correctly rounded everywhere. Those
//! two functions need not agree with Microsoft's to the last bit. On the
//! traced corpus the results are exact, a relative change of 1e-7 in `tan`
//! changes no output word, and the `log10` path above 100 never influences
//! one.
//!
//! # Left out
//!
//! - `changeSpeakerValues` and `initDefaultSpeakerValues`
//!   (`VTM/vtmiont.c:2899-3460`), which overwrite some [`HLSpeaker`] fields per
//!   voice after [`HlSynth::InitializeHLSynthesizer`]. Callers set those
//!   fields through [`HlSynth::speaker`].
//! - The frication and phoneme overrides `vtmiont.c:796-1219` applies to the
//!   low-level frame after `HLSynthesizeLLFrame` returns.

#![allow(non_snake_case, non_upper_case_globals)]
// Kept in the shape of the C source so the two can be compared line by line.
#![allow(
    clippy::approx_constant,
    clippy::collapsible_else_if,
    clippy::collapsible_if,
    clippy::excessive_precision,
    clippy::if_same_then_else,
    clippy::manual_clamp,
    clippy::needless_late_init,
    clippy::neg_cmp_op_on_partial_ord,
    clippy::too_many_arguments
)]

use crate::hlsyn_tables::{LOG10TABLE, SQRTTABLE};
use crate::{OUT_F1, OUT_F2, OUT_F3, OUT_T0, VOICE_PARS};

// Frame words read only by hlsyn. `PH/ph_defs.h:587-601`.
pub const OUT_F4: usize = 22;
pub const OUT_SEX: usize = 23;
pub const OUT_AG: usize = 25;
pub const OUT_AL: usize = 26;
pub const OUT_AN: usize = 27;
pub const OUT_ABLADE: usize = 28;
pub const OUT_PS: usize = 29;
pub const OUT_CNK: usize = 30;
pub const OUT_DC: usize = 31;
pub const OUT_UE: usize = 32;
pub const OUT_ATB: usize = 36;
pub const OUT_PLACE: usize = 37;

// `hlsyn/hlsyn.h:157-165`.
const SPEEDSOUND: f32 = 35400.0; /* cm/s */
const PI: f32 = 3.14159265359;
const RHO: f32 = 0.00114; /* g/cm^3 */

const LIPS: i16 = 1;
const BLADE: i16 = 2;
const DORSUM: i16 = 3;
const LIQUID: i16 = 4;

/// `hlsyn/hlsyn.h:66-67`.
const REMOVE_FORMANT: i16 = 1000;
const REMOVE_BANDWIDTH: i16 = 200;

/// `hlsyn/hlsyn.h:89-90`. `FLT_MIN` is 1.175494351e-38.
const L_EPS: f32 = 0.001; /* cm */
const FLOAT_EPS: f32 = 10.0 * f32::MIN_POSITIVE;
/// `hlsyn/hlsyn.h:92`.
const AN_NO_NASAL_BREAKPOINT: f32 = -0.0; /* sq. mm */
/// `hlsyn/hlsyn.h:98`, the value without `FLAV_AGHISOURCECUTOFF_ON`.
const AGHIKLSOURCECUTOFF_VAL: f32 = 999999.0; /* sq. mm */
/// `hlsyn/hlsyn.h:253`.
const NasalBandwidth: f32 = 200.0;

/// `hlsyn/hlsyn.h:121-124`.
const BRENT_DEFAULT_ITMAX: i32 = 100;
const BRENT_DEFAULT_EPS: f32 = 3.0e-4;
const BRENT_BRACKET_DEFAULT_FACTOR: f32 = 1.6;
const BRENT_BRACKET_DEFAULT_NTRY: i32 = 50;

/// `hlsyn/circuit.c:83`, the value without `LOWCOMPUTE_MITSU`.
const CIRCUIT_TOL: f32 = 2.0e-3;

/// `hlsyn/acxf1c.c:34`.
const UNCOMPUTABLE: f32 = -1.0;

// `hlsyn/nasalf1x.c:62-71`.
const FINITE_OFFSET: f32 = 0.1;
const MAX_FINITE_ITERATIONS: i16 = 50;
const ITMAX: i32 = 100;
const EPS: f32 = 3.0e-8;
const FNP_TOL: f32 = 1.0e-5;

/// `hlsyn/hlsyn.h:77-80`.
#[inline]
fn CMWATER_TO_CGS(CMWATER: f32) -> f32 {
    CMWATER * 980.0
}
#[inline]
fn CGS_TO_CMWATER(CGS: f32) -> f32 {
    CGS / 980.0
}
#[inline]
fn CMSQ_TO_MMSQ(CMSQ: f32) -> f32 {
    CMSQ * 100.0
}
#[inline]
fn MMSQ_TO_CMSQ(MMSQ: f32) -> f32 {
    MMSQ * 0.01
}

/// `hlsyn/hlsyn.h:60`: `((x) > (y) ?  (x) : (y))`.
#[inline]
fn MAX(x: f32, y: f32) -> f32 {
    if x > y {
        x
    } else {
        y
    }
}

/// The x86 truncating float-to-int conversion (`cvttss2si`/`cvttsd2si`) the
/// compiled C uses for `(int)` and, followed by a 16-bit truncation, for
/// `(short)`. Out-of-range and NaN inputs give `0x8000_0000`, as on x86.
#[inline]
fn cvtt(x: f64) -> i32 {
    if x.is_nan() || !(-2147483649.0 < x && x < 2147483648.0) {
        i32::MIN
    } else {
        x as i32
    }
}

/// `(short)` of a `float` expression.
#[inline]
fn short_f(x: f32) -> i16 {
    cvtt(f64::from(x)) as i16
}

/// `(short)` of a `double` expression.
#[inline]
fn short_d(x: f64) -> i16 {
    cvtt(x) as i16
}

/// `DT_f_sqrt`, `hlsyn/sqrttable.c:1059-1084`.
///
/// Returns the value the compiled function leaves in the x87 return register
/// (see the module documentation): the `sqrttable[pos/100]*10.0f` products
/// are not rounded to `float`; every other path returns a `float` value.
fn DTsqrt(input: f32) -> f64 {
    if input > 40000.0 {
        return f64::from(f64::from(input).sqrt() as f32);
    }

    if input < -40000.0 {
        return f64::from((-f64::from(-input).sqrt()) as f32);
    }

    let pos = cvtt(f64::from(input));
    if pos > 400 {
        return f64::from(SQRTTABLE[(pos / 100) as usize]) * 10.0;
    }

    if pos < -400 {
        return f64::from(-SQRTTABLE[(-pos / 100) as usize]) * 10.0;
    }

    if pos < 0 {
        return f64::from(-SQRTTABLE[(-pos) as usize]);
    }
    f64::from(SQRTTABLE[pos as usize])
}

/// `DT_f_log10`, `hlsyn/log10table.c:299-315`. Every call site guards its
/// argument to be positive, so the table index is never negative.
///
/// Returns the value left in the x87 return register: `log10table[pos]+1` is
/// not rounded to `float`; the other paths return a `float` value.
fn DTlog10(input: f32) -> f64 {
    if input > 100.0 {
        return f64::from(libm::log10(f64::from(input)) as f32);
    }

    if input > 10.0 {
        let pos = cvtt(f64::from(input * 10.0));
        return f64::from(LOG10TABLE[pos as usize]) + 1.0;
    }

    let pos = cvtt(f64::from(input * 100.0));
    f64::from(LOG10TABLE[pos as usize])
}

/// `HLFrame`, `PH/hlsynapi.h:31-49`. Areas in mm^2.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct HLFrame {
    pub atb: f32,
    pub place: i32,
    pub ag: f32,
    pub al: f32,
    pub ab: f32,
    pub an: f32,
    pub ue: f32, /* cm^3/s */
    pub f0: f32, /* deciHz */
    pub f1: f32,
    pub f2: f32,
    pub f3: f32,
    pub f4: f32,
    pub ps: f32, /* cm H20 */
    pub dc: f32, /* % */
    pub ap: f32,
}

impl HLFrame {
    /// The frame as `VTM/vtmiont.c:660-683` builds it from a PH packet. The
    /// packet buffer is `unsigned short` there, so words convert unsigned
    /// unless the C casts to `short` first.
    pub fn from_packet(parambuff: &[i16; VOICE_PARS]) -> Self {
        let u = |index: usize| f32::from(parambuff[index] as u16);
        let s = |index: usize| f32::from(parambuff[index]);
        HLFrame {
            ag: u(OUT_AG) * 0.01,
            al: u(OUT_AL) * 0.1,
            ab: u(OUT_ABLADE) * 0.1,
            ap: u(OUT_CNK) * 0.01,
            an: u(OUT_AN) * 0.1,
            ue: s(OUT_UE),
            f4: u(OUT_F4),
            ps: u(OUT_PS) * 0.01,
            dc: s(OUT_DC),
            // ((float)(short)(pVtm_t->parambuff[OUT_ATB + 1]*.1f))
            atb: f32::from(short_f(u(OUT_ATB) * 0.1)),
            place: i32::from(parambuff[OUT_PLACE]),
            f0: u(OUT_T0),
            f1: u(OUT_F1),
            f2: u(OUT_F2),
            f3: u(OUT_F3),
        }
    }

    /// The 15 words of the struct in memory order (float bits; `place` as an
    /// integer), as the `X` and `O` trace records print them.
    pub fn to_words(&self) -> [u32; 15] {
        [
            self.atb.to_bits(),
            self.place as u32,
            self.ag.to_bits(),
            self.al.to_bits(),
            self.ab.to_bits(),
            self.an.to_bits(),
            self.ue.to_bits(),
            self.f0.to_bits(),
            self.f1.to_bits(),
            self.f2.to_bits(),
            self.f3.to_bits(),
            self.f4.to_bits(),
            self.ps.to_bits(),
            self.dc.to_bits(),
            self.ap.to_bits(),
        ]
    }
}

/// `HLState`, `PH/hlsynapi.h:55-75`. Areas in mm^2.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct HLState {
    pub acl: f32,
    pub acd: f32,
    pub loc: i16,
    pub acx: f32,
    pub agx: f32,
    pub Pm: f32,  /* dynes/cm^2 */
    pub Pcw: f32, /* dynes/cm^2 */
    pub Ug: f32,
    pub Uacx: f32,
    pub Un: f32,
    pub Uw: f32,
    pub f1c: f32,
    pub f1x: f32,
    pub b1x: f32,
    pub Cw: f32,
    pub Cg: f32,
    pub agf: f32,
}

impl HLState {
    /// The 17 fields in struct order (float bits; `loc` sign-extended), as the
    /// `Q` and `T` trace records print them.
    pub fn to_words(&self) -> [u32; 17] {
        [
            self.acl.to_bits(),
            self.acd.to_bits(),
            i32::from(self.loc) as u32,
            self.acx.to_bits(),
            self.agx.to_bits(),
            self.Pm.to_bits(),
            self.Pcw.to_bits(),
            self.Ug.to_bits(),
            self.Uacx.to_bits(),
            self.Un.to_bits(),
            self.Uw.to_bits(),
            self.f1c.to_bits(),
            self.f1x.to_bits(),
            self.b1x.to_bits(),
            self.Cw.to_bits(),
            self.Cg.to_bits(),
            self.agf.to_bits(),
        ]
    }
}

/// `TableRow`, `PH/hlsynapi.h:85-88`. Column1 is the known value, Column2 the
/// unknown.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct TableRow {
    pub Column1: f32,
    pub Column2: f32,
}

const fn row(Column1: f32, Column2: f32) -> TableRow {
    TableRow { Column1, Column2 }
}

pub const MAXANFN: usize = 9;
pub const MAXF1LOVERA: usize = 11;
pub const MAXANA: usize = 6;
pub const MAXANB: usize = 6;
pub const MAXF1C: usize = 7;
pub const MAXANK2: usize = 17;

/// Global `anfnTable_fno`, set at `hlsyn/inithl.c:109`.
const anfnTable_fno: f32 = 500.0; /* Hz */

/// Global `anfnTable` (an in sq mm, fn in Hz), set at `hlsyn/inithl.c:110-128`.
const anfnTable: [TableRow; MAXANFN] = [
    row(0.0, 500.0),
    row(10.0, 580.0),
    row(20.0, 660.0),
    row(30.0, 730.0),
    row(40.0, 780.0),
    row(50.0, 810.0),
    row(60.0, 840.0),
    row(70.0, 870.0),
    row(80.0, 900.0),
];

/// Global `f1LOverATable` (f1 in Hz, L/A in 1/cm), set at
/// `hlsyn/inithl.c:138-160`.
const f1LOverATable: [TableRow; MAXF1LOVERA] = [
    row(180.0, 1000.0),
    row(200.0, 25.0),
    row(250.0, 20.0),
    row(300.0, 10.0),
    row(350.0, 7.0),
    row(400.0, 5.0),
    row(450.0, 4.0),
    row(500.0, 3.0),
    row(600.0, 2.5),
    row(700.0, 2.0),
    row(800.0, 1.8),
];

/// Number of 32-bit words in the C `HLSpeaker` (`sizeof(HLSpeaker) / 4`).
pub const HLSPEAKER_WORDS: usize = 174;

/// `HLSpeaker`, `PH/hlsynapi.h:147-281`, without the `INVTMIONT` alveolar
/// table. Field order is the C struct's.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct HLSpeaker {
    pub Val: f32,
    pub Lc_al: f32,
    pub HelmholtzZeroAreaFrequency: f32,

    pub Vab: f32,
    pub Lc_ab: f32,

    pub f1Min: f32,
    pub f1Max: f32,
    pub f2RetroflexMax: f32,
    pub f3RetroflexMax: f32,
    pub f2LateralMax: f32,
    pub f3LateralMin: f32,
    pub Kacl: f32,
    pub aclFreq: f32,

    pub Vacd: f32,
    pub Lc_acd: f32,
    pub acdMax: f32,
    pub acd_f1Break: f32,
    pub KHi: f32,
    pub f1HiShift: f32,

    pub fno: f32,

    pub fm_f1BreakPoint: f32,

    pub BNZ_f1BreakPoint: f32,

    pub BNP_B1_anLow: f32,
    pub BNP_B1_anHigh: f32,
    pub anaTable: [TableRow; MAXANA],
    pub anbTable: [TableRow; MAXANB],
    pub f1cTable: [TableRow; MAXF1C],
    pub fp_f2BreakPoint: f32,
    pub anK2Table: [TableRow; MAXANK2],
    pub PharangealArea: f32,

    pub Cwm: f32,
    pub Rw: f32,
    pub Psm: f32,
    pub Cgm: f32,
    pub Lg: f32,

    pub NewtonInterpTimeStep: f32,
    pub UpdateInterval: f32,

    pub LabialAB: f32,
    pub PalVelarA2F: f32,
    pub PalVelarA5F: f32,
    pub PalVelarA3F: f32,
    pub PalVelar_f2Offset: f32,
    pub PalVelar_f2Overf3_Slope: f32,
    pub RetroflexA3F: f32,
    pub LateralA3F: f32,
    pub B2F: f32,
    pub B3F: f32,
    pub B4F: f32,
    pub B5F: f32,

    pub agm: f32,
    pub agAVModalOffsetMax: f32,
    pub agAVModalOffsetOnOff: f32,
    pub agMin: f32,
    pub agHiKLSourceCutoff: f32,
    pub AVPressureThreshold: f32,
    pub Kv: f32,
    pub KdAV0: f32,
    pub KdAV: f32,
    pub KdAV1: f32,
    pub Ka: f32,

    pub Kf: f32,
    pub AFInterpTimeStep: f32,
    pub AFThreshold: f32,

    pub OQm: f32,
    pub KOQ: f32,
    pub OQMax: f32,
    pub OQMin: f32,

    pub TLBreakArea: f32,
    pub KTL: f32,
    pub TLm: f32,
    pub SFromf4: f32,
    pub SDefault: f32,
    pub PctSfordBTL: f32,
    pub dBTLforPctS: f32,
    pub TLMax: f32,
    pub TLMin: f32,

    pub agDIMin: f32,
    pub KDI: f32,

    pub KdF: f32,
    pub F1T: f32,

    pub B1m: f32,
    pub B2m: f32,
    pub B3m: f32,
    pub B4m: f32,
    pub B5m: f32,
    pub KB3: f32,
    pub KB4: f32,
    pub KB5: f32,

    pub F5: f32,

    pub A6f: f32,
    pub F6: f32,
    pub B6F: f32,

    pub KCw: f32,
    pub KCg: f32,
    pub Kdf0dc: f32,
    pub Kpd: f32,
    pub Kf1: f32,
    pub f1_neutral: f32,
    pub KdPTdc: f32,
    pub f0_vowelshift_f1_break: f32,
    pub Lt: f32,
    pub At: f32,
    pub Lvg: f32,
    pub Lv: f32,
    pub Av: f32,
    pub Lhp: f32,
}

impl HLSpeaker {
    /// Every field as a mutable reference, in C struct (memory) order.
    fn fields_mut(&mut self) -> Vec<&mut f32> {
        let mut out: Vec<&mut f32> = Vec::with_capacity(HLSPEAKER_WORDS);
        out.extend([
            &mut self.Val,
            &mut self.Lc_al,
            &mut self.HelmholtzZeroAreaFrequency,
            &mut self.Vab,
            &mut self.Lc_ab,
            &mut self.f1Min,
            &mut self.f1Max,
            &mut self.f2RetroflexMax,
            &mut self.f3RetroflexMax,
            &mut self.f2LateralMax,
            &mut self.f3LateralMin,
            &mut self.Kacl,
            &mut self.aclFreq,
            &mut self.Vacd,
            &mut self.Lc_acd,
            &mut self.acdMax,
            &mut self.acd_f1Break,
            &mut self.KHi,
            &mut self.f1HiShift,
            &mut self.fno,
            &mut self.fm_f1BreakPoint,
            &mut self.BNZ_f1BreakPoint,
            &mut self.BNP_B1_anLow,
            &mut self.BNP_B1_anHigh,
        ]);
        for table_row in self.anaTable.iter_mut() {
            out.push(&mut table_row.Column1);
            out.push(&mut table_row.Column2);
        }
        for table_row in self.anbTable.iter_mut() {
            out.push(&mut table_row.Column1);
            out.push(&mut table_row.Column2);
        }
        for table_row in self.f1cTable.iter_mut() {
            out.push(&mut table_row.Column1);
            out.push(&mut table_row.Column2);
        }
        out.push(&mut self.fp_f2BreakPoint);
        for table_row in self.anK2Table.iter_mut() {
            out.push(&mut table_row.Column1);
            out.push(&mut table_row.Column2);
        }
        out.extend([
            &mut self.PharangealArea,
            &mut self.Cwm,
            &mut self.Rw,
            &mut self.Psm,
            &mut self.Cgm,
            &mut self.Lg,
            &mut self.NewtonInterpTimeStep,
            &mut self.UpdateInterval,
            &mut self.LabialAB,
            &mut self.PalVelarA2F,
            &mut self.PalVelarA5F,
            &mut self.PalVelarA3F,
            &mut self.PalVelar_f2Offset,
            &mut self.PalVelar_f2Overf3_Slope,
            &mut self.RetroflexA3F,
            &mut self.LateralA3F,
            &mut self.B2F,
            &mut self.B3F,
            &mut self.B4F,
            &mut self.B5F,
            &mut self.agm,
            &mut self.agAVModalOffsetMax,
            &mut self.agAVModalOffsetOnOff,
            &mut self.agMin,
            &mut self.agHiKLSourceCutoff,
            &mut self.AVPressureThreshold,
            &mut self.Kv,
            &mut self.KdAV0,
            &mut self.KdAV,
            &mut self.KdAV1,
            &mut self.Ka,
            &mut self.Kf,
            &mut self.AFInterpTimeStep,
            &mut self.AFThreshold,
            &mut self.OQm,
            &mut self.KOQ,
            &mut self.OQMax,
            &mut self.OQMin,
            &mut self.TLBreakArea,
            &mut self.KTL,
            &mut self.TLm,
            &mut self.SFromf4,
            &mut self.SDefault,
            &mut self.PctSfordBTL,
            &mut self.dBTLforPctS,
            &mut self.TLMax,
            &mut self.TLMin,
            &mut self.agDIMin,
            &mut self.KDI,
            &mut self.KdF,
            &mut self.F1T,
            &mut self.B1m,
            &mut self.B2m,
            &mut self.B3m,
            &mut self.B4m,
            &mut self.B5m,
            &mut self.KB3,
            &mut self.KB4,
            &mut self.KB5,
            &mut self.F5,
            &mut self.A6f,
            &mut self.F6,
            &mut self.B6F,
            &mut self.KCw,
            &mut self.KCg,
            &mut self.Kdf0dc,
            &mut self.Kpd,
            &mut self.Kf1,
            &mut self.f1_neutral,
            &mut self.KdPTdc,
            &mut self.f0_vowelshift_f1_break,
            &mut self.Lt,
            &mut self.At,
            &mut self.Lvg,
            &mut self.Lv,
            &mut self.Av,
            &mut self.Lhp,
        ]);
        out
    }

    /// Builds the struct from its memory image as 32-bit words (float bits),
    /// as the `H` trace record prints it.
    pub fn from_words(words: &[u32; HLSPEAKER_WORDS]) -> Self {
        let mut speaker = HLSpeaker::default();
        let fields = speaker.fields_mut();
        assert_eq!(fields.len(), HLSPEAKER_WORDS);
        for (field, word) in fields.into_iter().zip(words) {
            *field = f32::from_bits(*word);
        }
        speaker
    }

    /// The memory image as 32-bit words (float bits).
    pub fn to_words(&self) -> [u32; HLSPEAKER_WORDS] {
        let mut copy = *self;
        let mut words = [0u32; HLSPEAKER_WORDS];
        for (word, field) in words.iter_mut().zip(copy.fields_mut()) {
            *word = field.to_bits();
        }
        words
    }
}

/// Number of `short` fields in the C `LLFrame`.
pub const LLFRAME_WORDS: usize = 48;

/// `LLFrame`, `PH/hlsynapi.h:399-451`. Field order is the C struct's.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct LLFrame {
    pub NF0: i16,
    pub NAV: i16,
    pub NOQ: i16,
    pub NSQ: i16,
    pub NTL: i16,
    pub NFL: i16,
    pub NDI: i16,
    pub NAH: i16,
    pub NAF: i16,

    pub NF1: i16,
    pub NB1: i16,
    pub NDF1: i16,
    pub NDB1: i16,
    pub NF2: i16,
    pub NB2: i16,
    pub NF3: i16,
    pub NB3: i16,
    pub NF4: i16,
    pub NB4: i16,
    pub NF5: i16,
    pub NB5: i16,
    pub NF6: i16,
    pub NB6: i16,

    pub NFNP: i16,
    pub NBNP: i16,
    pub NFNZ: i16,
    pub NBNZ: i16,
    pub NFTP: i16,
    pub NBTP: i16,
    pub NFTZ: i16,
    pub NBTZ: i16,

    pub NA2F: i16,
    pub NA3F: i16,
    pub NA4F: i16,
    pub NA5F: i16,
    pub NA6F: i16,
    pub NAB: i16,
    pub NB2F: i16,
    pub NB3F: i16,
    pub NB4F: i16,
    pub NB5F: i16,
    pub NB6F: i16,

    pub NANV: i16,
    pub NA1V: i16,
    pub NA2V: i16,
    pub NA3V: i16,
    pub NA4V: i16,
    pub NATV: i16,
}

impl LLFrame {
    /// The 48 fields in struct order, as the `L` trace record prints them.
    pub fn to_words(&self) -> [i16; LLFRAME_WORDS] {
        [
            self.NF0, self.NAV, self.NOQ, self.NSQ, self.NTL, self.NFL, self.NDI, self.NAH,
            self.NAF, self.NF1, self.NB1, self.NDF1, self.NDB1, self.NF2, self.NB2, self.NF3,
            self.NB3, self.NF4, self.NB4, self.NF5, self.NB5, self.NF6, self.NB6, self.NFNP,
            self.NBNP, self.NFNZ, self.NBNZ, self.NFTP, self.NBTP, self.NFTZ, self.NBTZ, self.NA2F,
            self.NA3F, self.NA4F, self.NA5F, self.NA6F, self.NAB, self.NB2F, self.NB3F, self.NB4F,
            self.NB5F, self.NB6F, self.NANV, self.NA1V, self.NA2V, self.NA3V, self.NA4V, self.NATV,
        ]
    }
}

/// The hlsyn members of `VTM_T` (`VTM/vtminst.h:597-603`): current and
/// previous frame and state, the speaker, and the low-level frame.
#[derive(Clone, Debug, Default)]
pub struct HlSynth {
    pub state: HLState,
    pub oldstate: HLState,
    pub frame: HLFrame,
    pub oldframe: HLFrame,
    pub speaker: HLSpeaker,
    pub llframe: LLFrame,
}

impl HlSynth {
    /// All zero, as in the `calloc`ed `VTM_T` (`VTM/vtmiont.c:447`). DECtalk
    /// calls `InitializeHLSynthesizer` at start-up (line 480) and again for
    /// every speaker definition packet (line 1643) before any frame.
    pub fn new() -> Self {
        Self::default()
    }

    /// `InitializeHLSynthesizer`, `hlsyn/inithl.c:68-427`. Sets every speaker
    /// constant and the previous frame and state; it does not touch `state`,
    /// whose `Pm` the next frame still reads (`hlsyn/circuit.c:269`).
    ///
    /// DECtalk passes the `sex` word of the speaker definition packet as
    /// `IsMale` (`VTM/vtmiont.c:1643-1644`).
    pub fn InitializeHLSynthesizer(&mut self, IsMale: bool) {
        let speaker = &mut self.speaker;
        let pick = |male: f32, female: f32| if IsMale { male } else { female };

        // inithl.c:77-102.
        speaker.Val = pick(60.0, 45.0); /* cu. cm */
        speaker.Lc_al = 0.5; /* cm */
        speaker.HelmholtzZeroAreaFrequency = 180.0; /* Hz */

        speaker.Vab = pick(60.0, 45.0); /* cu. cm */
        speaker.Lc_ab = 1.0; /* cm */
        speaker.f1Min = pick(350.0, 350.0); /* Hz */
        speaker.f1Max = pick(500.0, 650.0); /* Hz */
        speaker.f2RetroflexMax = pick(1400.0, 1600.0); /* Hz */
        speaker.f3RetroflexMax = pick(1800.0, 2000.0); /* Hz */
        speaker.f2LateralMax = pick(1300.0, 1400.0); /* Hz */
        speaker.f3LateralMin = pick(2600.0, 2800.0); /* Hz */
        speaker.Kacl = 25.0;
        speaker.aclFreq = pick(400.0, 450.0); /* Hz */

        speaker.Vacd = pick(50.0, 40.0); /* cu. cm */
        speaker.Lc_acd = pick(4.0, 3.5); /* cm */
        speaker.acdMax = 100.0; /* sq. mm */
        speaker.acd_f1Break = pick(540.0, 650.0); /* Hz */
        speaker.KHi = pick(12.5, 8.8);
        speaker.f1HiShift = pick(1180.0, 1280.0); /* Hz */

        speaker.fno = pick(500.0, 550.0); /* Hz */

        // inithl.c:134-135.
        speaker.fm_f1BreakPoint = 250.0; /* Hz */
        speaker.BNZ_f1BreakPoint = 700.0; /* Hz */

        // inithl.c:163-164.
        speaker.BNP_B1_anLow = 10.0; /* mm^2 */
        speaker.BNP_B1_anHigh = 20.0; /* mm^2 */

        // inithl.c:170-182: the an,a table (sq. mm, cm^5/dyne).
        speaker.anaTable = [
            row(10.0, 0.00200),
            row(15.0, 0.00045),
            row(20.0, 0.00032),
            row(30.0, 0.00025),
            row(50.0, 0.00020),
            row(80.0, 0.00014),
        ];

        // inithl.c:188-200: the an,b table (sq. mm, cm^5/dyne).
        speaker.anbTable = [
            row(10.0, 0.00006),
            row(15.0, 0.00008),
            row(20.0, 0.00010),
            row(30.0, 0.00015),
            row(50.0, 0.00020),
            row(80.0, 0.00014),
        ];

        // inithl.c:206-220: the f1,c table (Hz, cm^5/dyne).
        speaker.f1cTable = [
            row(180.0, 0.00040),
            row(200.0, 0.00032),
            row(300.0, 0.00026),
            row(400.0, 0.00024),
            row(500.0, 0.00022),
            row(600.0, 0.00021),
            row(700.0, 0.00021),
        ];

        // inithl.c:222.
        speaker.fp_f2BreakPoint = pick(1000.0, 1100.0); /* Hz */

        // inithl.c:228-262: the an,K2 table (sq. mm, cm^5 s^-2/dyne).
        speaker.anK2Table = [
            row(0.0, 0.0),
            row(5.0, 1.8),
            row(10.0, 3.5),
            row(15.0, 4.8),
            row(20.0, 6.0),
            row(25.0, 7.3),
            row(30.0, 8.5),
            row(35.0, 9.7),
            row(40.0, 10.8),
            row(45.0, 11.7),
            row(50.0, 12.5),
            row(55.0, 13.8),
            row(60.0, 14.0),
            row(65.0, 14.6),
            row(70.0, 15.1),
            row(75.0, 15.6),
            row(80.0, 16.1),
        ];

        // inithl.c:264-274.
        speaker.PharangealArea = 3.0; /* sq. cm */

        speaker.Cwm = 0.001; /* cm^5/dyne */
        speaker.Rw = 10.0; /* dyne-sec-cm^-5 */
        speaker.Psm = pick(8.0, 6.5); /* cm H20 */
        speaker.Cgm = 8.0e-6; /* cm^3/dyne */
        speaker.Lg = pick(1.0, 0.7); /* cm */
        speaker.KCw = 1.0; /* dimensionless */
        speaker.KCg = 0.34; /* dimensionless */

        speaker.NewtonInterpTimeStep = 100.0e-6; /* sec */

        // inithl.c:282-291.
        speaker.UpdateInterval = 5.0e-3; /* sec */
        speaker.LabialAB = 55.0; /* dB */
        speaker.PalVelarA2F = 50.0; /* dB */
        speaker.PalVelarA5F = 45.0; /* dB */
        speaker.PalVelarA3F = 50.0; /* dB */
        speaker.PalVelar_f2Offset = pick(1950.0, 2200.0); /* Hz */
        speaker.PalVelar_f2Overf3_Slope = 0.0; /* Hz/Hz */
        speaker.LateralA3F = 45.0; /* dB */
        speaker.RetroflexA3F = 50.0; /* dB */

        // inithl.c:302-321.
        speaker.B2F = 250.0; /* Hz */
        speaker.B3F = 320.0; /* Hz */
        speaker.B4F = 350.0; /* Hz */
        speaker.B5F = 500.0; /* Hz */

        speaker.agm = pick(4.0, 3.0); /* sq. mm */
        speaker.agAVModalOffsetMax = pick(11.0, 9.0); /* sq. mm */
        speaker.agAVModalOffsetOnOff = pick(7.0, 6.0); /* sq. mm */
        speaker.agMin = 1.0; /* sq. mm */
        speaker.agHiKLSourceCutoff = AGHIKLSOURCECUTOFF_VAL; /* sq. mm */
        speaker.AVPressureThreshold = 3.5; /* cm H20 */
        speaker.KdPTdc = 0.03; /* cm H20 */
        speaker.Kv = 33.0; /* dB */
        speaker.KdAV0 = pick(200.0, 220.0); /* dB / sq. cm */
        speaker.KdAV = pick(100.0, 120.0); /* dB / sq. cm */
        speaker.KdAV1 = pick(400.0, 420.0); /* dB / sq. cm */
        speaker.Ka = 27.0; /* dB */
        speaker.Kf = 40.0; /* dB */
        speaker.AFInterpTimeStep = 0.001; /* sec */
        speaker.AFThreshold = 35.0; /* dB */

        // inithl.c:323-342.
        speaker.OQm = pick(50.0, 65.0); /* Percent */
        speaker.KOQ = pick(3.3, 3.96);
        speaker.OQMax = 99.0; /* Percent */
        speaker.OQMin = 0.0; /* Percent */

        speaker.TLBreakArea = 20.0; /* sq. mm */
        speaker.KTL = pick(1.5, 1.8);
        speaker.TLm = pick(5.0, 10.0); /* dB */
        speaker.SFromf4 = 0.29;
        speaker.SDefault = pick(1000.0, 1150.0); /* Hz */
        speaker.PctSfordBTL = 0.10; /* Percent (fractional) */
        speaker.dBTLforPctS = 4.0; /* dB */
        speaker.TLMax = 41.0; /* dB */
        speaker.TLMin = 0.0; /* dB */

        speaker.KDI = 15.0;
        speaker.agDIMin = 1.0; /* mm^2 */

        speaker.KdF = 20.0; /* mm^2/s */
        speaker.F1T = 600.0; /* Hz */

        // inithl.c:349-382.
        speaker.B1m = 80.0; /* Hz */
        speaker.B2m = 90.0; /* Hz */
        speaker.B3m = 150.0; /* Hz */
        speaker.B4m = pick(350.0, 400.0); /* Hz */
        speaker.B5m = pick(500.0, 600.0); /* Hz */
        speaker.KB3 = 4.0;
        speaker.KB4 = 2.0;
        speaker.KB5 = 2.0;

        speaker.F5 = pick(4500.0, 5200.0); /* Hz */

        speaker.A6f = 0.0; /* dB */
        speaker.F6 = 4990.0; /* Hz */
        speaker.B6F = 1500.0; /* Hz */
        speaker.Kdf0dc = 3.0; /* dHz */
        speaker.Kpd = 30.0; /* dHz / cm H20 */
        speaker.Kf1 = pick(5.0e-4, 4.6e-4); /* 1 / Hz */
        speaker.f1_neutral = pick(500.0, 590.0); /* Hz */
        speaker.f0_vowelshift_f1_break = 250.0; /* Hz */
        speaker.Lt = pick(12.0, 11.0); /* cm */
        speaker.At = pick(2.5, 2.0); /* cm^2 */
        speaker.Lvg = pick(0.4, 0.3); /* cm */
        speaker.Lv = pick(17.0, 15.0); /* cm */
        speaker.Av = pick(3.5, 3.0); /* cm^2 */
        speaker.Lhp = pick(0.3, 0.2); /* cm */

        // inithl.c:389-407: the previous state.
        let oldstate = &mut self.oldstate;
        oldstate.acl = 0.0;
        oldstate.acd = 0.0;
        oldstate.loc = 0;
        oldstate.acx = 0.0;
        oldstate.agx = 0.0;

        oldstate.Pm = 0.0;

        oldstate.Pcw = 0.0;
        oldstate.Ug = 0.0;
        oldstate.Uacx = 0.0;
        oldstate.Un = 0.0;
        oldstate.Uw = 0.0;
        oldstate.f1c = 0.0;
        oldstate.f1x = 0.0;
        oldstate.b1x = 0.0;
        oldstate.Cw = speaker.Cwm;
        oldstate.Cg = speaker.Cgm;
        oldstate.agf = 0.0;

        // inithl.c:414-426: the previous frame. atb and place are not reset.
        let oldframe = &mut self.oldframe;
        oldframe.ag = 0.0;
        oldframe.al = 0.0;
        oldframe.ab = 0.0;
        oldframe.an = 0.0;
        oldframe.ue = 0.0;
        oldframe.f0 = 0.0;
        oldframe.f1 = 0.0;
        oldframe.f2 = 0.0;
        oldframe.f3 = 0.0;
        oldframe.f4 = 0.0;
        oldframe.ps = 0.0;
        oldframe.dc = 0.0;
        oldframe.ap = 0.0;
    }

    /// One frame the way `VTM/vtmiont.c:660-718` runs it: build the `HLFrame`
    /// from the PH packet, call `HLSynthesizeLLFrame`, then keep the state and
    /// frame as the previous ones. Returns the low-level frame as it is before
    /// `vtmiont.c:796-1219` edits it.
    pub fn synthesize_packet(&mut self, parambuff: &[i16; VOICE_PARS]) -> LLFrame {
        self.frame = HLFrame::from_packet(parambuff);
        HLSynthesizeLLFrame(
            &self.frame,
            &self.oldframe,
            &self.speaker,
            &mut self.state,
            &self.oldstate,
            &mut self.llframe,
        );
        self.oldstate = self.state;
        self.oldframe = self.frame;
        self.llframe
    }
}

/// `HLSynthesizeLLFrame`, `hlsyn/hlframe.c:140-176`.
pub fn HLSynthesizeLLFrame(
    frame: &HLFrame,
    oldframe: &HLFrame,
    speaker: &HLSpeaker,
    state: &mut HLState,
    oldstate: &HLState,
    llframe: &mut LLFrame,
) {
    /* acxf1c.c */
    Tongue_acx_f1c(frame, speaker, state);

    /* circuit.c */
    SpeechCircuit(frame, oldframe, speaker, state, oldstate);

    /* hlframe.c */
    MapGlottalFormantsNotF1(frame, speaker, state, llframe);

    /* nasalf1x.c */
    SetNasals_f1x(frame, speaker, state, llframe);

    /* hlframe.c */
    SourceAmplitudes(frame, speaker, state, oldstate, llframe);

    /* hlframe.c, depends on value of AF */
    FricativeFilters(frame, speaker, state, llframe);

    /* hlframe.c */
    GlottalInteraction(frame, speaker, state, llframe);

    /* hlframe.c */
    SourceSpecifics(frame, speaker, state, llframe);

    /* hlframe.c */
    UnusedLLParameters(llframe);
}

/// `Tongue_acx_f1c`, `hlsyn/acxf1c.c:50-123` (`TONGUE_BODY_AREA`).
fn Tongue_acx_f1c(frame: &HLFrame, speaker: &HLSpeaker, state: &mut HLState) {
    if frame.ab < 30.0 || frame.al < 30.0 || frame.atb < 30.0 {
        /* Compute the area adjusted f1, which is the minimum f1 of f1, R1al,
        and R1ab. */
        let R1al = HelmholtzFrequency(
            MMSQ_TO_CMSQ(frame.al),
            speaker.Val,
            speaker.Lc_al,
            speaker.HelmholtzZeroAreaFrequency,
        );

        let R1ab = if frame.ab <= frame.atb {
            HelmholtzFrequency(
                MMSQ_TO_CMSQ(frame.ab),
                speaker.Vab,
                speaker.Lc_ab,
                speaker.HelmholtzZeroAreaFrequency,
            )
        } else {
            HelmholtzFrequency(
                MMSQ_TO_CMSQ(frame.atb),
                speaker.Vab,
                speaker.Lc_ab,
                speaker.HelmholtzZeroAreaFrequency,
            )
        };

        if R1al < R1ab && R1al < frame.f1 {
            state.f1c = R1al;
        } else if R1ab <= R1al && R1ab < frame.f1 {
            state.f1c = R1ab;
        } else {
            state.f1c = frame.f1;
        }
    } else {
        state.f1c = frame.f1;
    }

    /* Compute the minimum constriction area (acx) and its location (loc)
    which is the minimum of acl, acd, al and ab. */
    state.acl = Compute_acl(frame, speaker);
    let temp = Compute_acd(frame, speaker);
    if temp < frame.atb {
        state.acd = temp;
    } else {
        state.acd = frame.atb;
    }

    Set_acx_loc(frame, state);
}

/// `HelmholtzFrequency`, `hlsyn/acxf1c.c:125-141`. CGS units.
fn HelmholtzFrequency(
    ConstrictionArea: f32,
    Volume: f32,
    Length: f32,
    ZeroAreaNaturalFrequency: f32,
) -> f32 {
    let temp: f32 = 1253160000.0f32 * ConstrictionArea / (39.478417604f32 * Volume * Length);
    DTsqrt(temp + ZeroAreaNaturalFrequency * ZeroAreaNaturalFrequency) as f32
}

/// `Compute_acl`, `hlsyn/acxf1c.c:161-180`.
fn Compute_acl(frame: &HLFrame, speaker: &HLSpeaker) -> f32 {
    if (speaker.f1Min < frame.f1 && frame.f1 < speaker.f1Max)
        && ((frame.f2 < speaker.f2RetroflexMax && frame.f3 < speaker.f3RetroflexMax)
            || (frame.f2 < speaker.f2LateralMax && frame.f3 > speaker.f3LateralMin))
    {
        (frame.f1 / speaker.aclFreq) * (frame.f1 / speaker.aclFreq) * speaker.Kacl
    } else {
        UNCOMPUTABLE
    }
}

/// `Compute_acd`, `hlsyn/acxf1c.c:182-233` (`TONGUE_BODY_AREA`).
fn Compute_acd(frame: &HLFrame, speaker: &HLSpeaker) -> f32 {
    let temp = (speaker.f1HiShift - frame.f1) / speaker.HelmholtzZeroAreaFrequency;
    let acd = speaker.KHi * temp * temp - speaker.KHi;

    if acd > speaker.acdMax {
        speaker.acdMax
    } else if acd < 0.0 {
        0.0
    } else {
        acd
    }
}

/// `Set_acx_loc`, `hlsyn/acxf1c.c:235-298`.
fn Set_acx_loc(frame: &HLFrame, state: &mut HLState) {
    let LiquidDorsumArea: f32;
    let LipsBladeArea: f32;
    let LiquidDorsumPlace: i16;
    let LipsBladePlace: i16;

    /* Sort through the Liquid and Dorsum areas first. */
    if state.acl == UNCOMPUTABLE {
        LiquidDorsumArea = state.acd;
        LiquidDorsumPlace = DORSUM;
    } else if state.acd <= state.acl {
        LiquidDorsumArea = state.acd;
        LiquidDorsumPlace = DORSUM;
    } else {
        LiquidDorsumArea = state.acl;
        LiquidDorsumPlace = LIQUID;
    }

    /* Sort through the lips and blade next. */
    if frame.ab <= frame.al {
        LipsBladeArea = frame.ab;
        LipsBladePlace = BLADE;
    } else {
        LipsBladeArea = frame.al;
        LipsBladePlace = LIPS;
    }

    /* Finally, set the loc and acx. */
    if LiquidDorsumArea <= LipsBladeArea {
        state.acx = LiquidDorsumArea;
        state.loc = LiquidDorsumPlace;
    } else {
        state.acx = LipsBladeArea;
        state.loc = LipsBladePlace;
    }
}

/// `PmRootFunctionArgs`, `hlsyn/circuit.c:60-74`.
#[derive(Clone, Copy, Default)]
struct PmRootFunctionArgs {
    rootTwoOverRho: f32,
    ag: f32,
    acx: f32,
    an: f32,
    ap: f32,
    ue: f32,
    ps: f32,
    Lg: f32,
    Cg: f32,
    Cw: f32,
    A: f32,
    B: f32,
}

/// Macro `NEXT_Uw`, `hlsyn/circuit.c:150-151`.
#[inline]
fn NEXT_Uw(Pm: f32, p: &PmRootFunctionArgs) -> f32 {
    p.A * Pm - p.B
}

/// `PmRootFunction`, `hlsyn/circuit.c:330-345`.
fn PmRootFunction(Pm: f32, pOtherArgs: &PmRootFunctionArgs) -> f32 {
    let agx0 = pOtherArgs.ag + Pm * pOtherArgs.Cg * pOtherArgs.Lg; /* agx = max(agx0,0) */
    let agf = (if agx0 < 0.0 { 0.0 } else { agx0 }) + pOtherArgs.ap;
    // x87 (circuit.obj): the first product is stored as float; the second
    // stays in the x87 register and is subtracted there before the store.
    let glottal: f32 = (f64::from(agf) * DTsqrt(pOtherArgs.ps - Pm)) as f32;
    let difference: f32 =
        (f64::from(glottal) - f64::from(pOtherArgs.acx + pOtherArgs.an) * DTsqrt(Pm)) as f32;
    let Uw: f32 = -(pOtherArgs.ue) + pOtherArgs.rootTwoOverRho * difference;
    Uw - NEXT_Uw(Pm, pOtherArgs)
}

/// `SpeechCircuit`, `hlsyn/circuit.c:153-326`: solves the lumped element
/// circuit of the mouth and nose for the mouth pressure.
fn SpeechCircuit(
    frame: &HLFrame,
    oldframe: &HLFrame,
    speaker: &HLSpeaker,
    state: &mut HLState,
    oldstate: &HLState,
) {
    let NumInterpolations: i16;
    let NumInterpolationsDivider: f32;
    let mut otherArgs = PmRootFunctionArgs::default();

    // circuit.c:170-185: set up for the interpolations on areas and ue.
    if oldstate.Pm <= 2.0e+03 {
        NumInterpolations = 1;
        NumInterpolationsDivider = 1.0;
    } else if oldstate.Pm < 4.0e+3 {
        NumInterpolations = 2;
        NumInterpolationsDivider = 0.5;
    } else {
        NumInterpolations = 4;
        NumInterpolationsDivider = 0.25;
    }

    // circuit.c:187-211.
    let agprev = MMSQ_TO_CMSQ(oldframe.ag);
    let agstep = (MMSQ_TO_CMSQ(frame.ag) - agprev) * NumInterpolationsDivider;

    let acxprev = MMSQ_TO_CMSQ(oldstate.acx);
    let acxstep = (MMSQ_TO_CMSQ(state.acx) - acxprev) * NumInterpolationsDivider;

    let anprev = MAX(0.0, MMSQ_TO_CMSQ(oldframe.an));
    let anstep = (MAX(0.0, MMSQ_TO_CMSQ(frame.an)) - anprev) * NumInterpolationsDivider;

    let ueprev = oldframe.ue;
    let uestep = (frame.ue - ueprev) * NumInterpolationsDivider;

    let apprev = MMSQ_TO_CMSQ(oldframe.ap);
    let apstep = (MMSQ_TO_CMSQ(frame.ap) - apprev) * NumInterpolationsDivider;

    let psprev = CMWATER_TO_CGS(oldframe.ps);
    let psstep = (CMWATER_TO_CGS(frame.ps) - psprev) * NumInterpolationsDivider;

    state.Cg = speaker.Cgm + speaker.KCg * 0.01 * frame.dc * speaker.Cgm;
    let Cgprev = oldstate.Cg;
    let Cgstep = (state.Cg - Cgprev) * NumInterpolationsDivider;

    state.Cw = speaker.Cwm + speaker.KCw * 0.01 * frame.dc * speaker.Cwm;
    let Cwprev = oldstate.Cw;
    let Cwstep = (state.Cw - Cwprev) * NumInterpolationsDivider;

    // circuit.c:219: the actual update time interval.
    let deltaTOver2 = 0.5 * speaker.UpdateInterval * NumInterpolationsDivider;

    // circuit.c:226-227.
    otherArgs.rootTwoOverRho = 41.885390829169; //(float)DTsqrt(2.0 / RHO);
    otherArgs.Lg = speaker.Lg;

    // circuit.c:233-236: use last frame as initial state.
    let mut Pm = oldstate.Pm;
    let mut Pcw = oldstate.Pcw;
    let mut Uw = oldstate.Uw;
    otherArgs.Cw = if oldstate.Cw < 0.0 { 0.0 } else { oldstate.Cw }; /* make it non-negative */

    // circuit.c:238-297.
    for interp in 1..=NumInterpolations {
        let interp = f32::from(interp);

        /* First update the controlling parameters and old state info. */
        otherArgs.ag = agprev + agstep * interp;
        otherArgs.acx = acxprev + acxstep * interp;
        otherArgs.an = anprev + anstep * interp;
        otherArgs.ap = apprev + apstep * interp;
        otherArgs.ap = if otherArgs.ap < 0.0 {
            0.0
        } else {
            otherArgs.ap
        };
        otherArgs.ue = ueprev + uestep * interp;
        otherArgs.ps = psprev + psstep * interp;
        otherArgs.Cg = Cgprev + Cgstep * interp;
        otherArgs.Cg = if otherArgs.Cg < 0.0 {
            0.0
        } else {
            otherArgs.Cg
        };
        let oldCw = otherArgs.Cw;
        otherArgs.Cw = Cwprev + Cwstep * interp;
        otherArgs.Cw = if otherArgs.Cw < 0.0 {
            0.0
        } else {
            otherArgs.Cw
        };

        /* For efficiency pre-compute coefficients inside the equation for
        Pm. */
        let RwCwPlusDeltaTOver2 = speaker.Rw * otherArgs.Cw + deltaTOver2;
        otherArgs.A = otherArgs.Cw / RwCwPlusDeltaTOver2;
        otherArgs.B = (oldCw * Pcw + Uw * deltaTOver2) / RwCwPlusDeltaTOver2;

        /* Next update Pm. */
        let mut MinGuess: f32 = 0.0;
        let mut MaxGuess: f32 = 7840.0; //speaker->Psm*98;

        // circuit.c:269: `state->Pm` still holds the previous frame's value
        // here, because vtmiont.c copies `state` to `oldstate` after each call
        // and InitializeHLSynthesizer resets only `oldstate`.
        if state.Pm > 100.0 {
            let _BracketReturn = BrentBracket(
                |x| PmRootFunction(x, &otherArgs),
                &mut MinGuess,
                &mut MaxGuess,
                BRENT_BRACKET_DEFAULT_FACTOR,
                BRENT_BRACKET_DEFAULT_NTRY,
            );
        }

        Pm = Brent(
            |x| PmRootFunction(x, &otherArgs),
            MinGuess,
            MaxGuess,
            CIRCUIT_TOL,
            BRENT_DEFAULT_ITMAX,
            BRENT_DEFAULT_EPS,
        );

        /* Using the new Pm update Uw. */
        Uw = NEXT_Uw(Pm, &otherArgs);

        /* Finally update the Pcw value. */
        Pcw = Pm - speaker.Rw * Uw;
    }

    // circuit.c:299-309.
    state.Pm = Pm;
    state.Pcw = Pcw;

    /* areas are in sq. mm. */
    state.agx = frame.ag
        + CMSQ_TO_MMSQ(state.Pm * (if state.Cg < 0.0 { 0.0 } else { state.Cg }) * speaker.Lg);
    state.agx = if state.agx < 0.0 { 0.0 } else { state.agx };
    state.agf = state.agx + (if frame.ap < 0.0 { 0.0 } else { frame.ap });

    // circuit.c:314-325: flows are in CGS.
    // x87 (circuit.obj): the square roots for Ug and Uacx are stored as float
    // before the multiply; the one for Un is multiplied in the x87 register.
    state.Ug = (DTsqrt(2.0 * (CMWATER_TO_CGS(frame.ps) - state.Pm) / RHO) as f32)
        * MMSQ_TO_CMSQ(state.agf);

    state.Uacx = (DTsqrt(2.0 * state.Pm / RHO) as f32) * MMSQ_TO_CMSQ(state.acx);
    state.Un = (DTsqrt(2.0 * state.Pm / RHO) * f64::from(MAX(0.0, MMSQ_TO_CMSQ(frame.an)))) as f32;

    /* Uw does not include the flow through ue just the flow through Rw */
    state.Uw = state.Ug - state.Uacx - state.Un - frame.ue;
}

/// `BrentBracket`, `hlsyn/brent.c:39-69`.
fn BrentBracket(
    pF: impl Fn(f32) -> f32,
    x1: &mut f32,
    x2: &mut f32,
    factor: f32,
    ntry: i32,
) -> i16 {
    let mut f1 = pF(*x1);
    let mut f2 = pF(*x2);

    for _j in 1..=ntry {
        if f1 * f2 < 0.0 {
            return 1;
        }

        if f1.abs() < f2.abs() {
            *x1 += factor * (*x1 - *x2);
            f1 = pF(*x1);
        } else {
            *x2 += factor * (*x2 - *x1);
            f2 = pF(*x2);
        }
    }

    0
}

/// `Brent`, `hlsyn/brent.c:72-182`: Brent's method, from Numerical Recipes in
/// C, page 268. `fabs` returns `double`, so the expressions it appears in are
/// evaluated in `f64`.
fn Brent(pF: impl Fn(f32) -> f32, x1: f32, x2: f32, tol: f32, itmax: i32, eps: f32) -> f32 {
    let mut a = x1;
    let mut b = x2;
    let mut c: f32 = 0.0;
    let mut d: f32 = 0.0;
    let mut e: f32 = 0.0;
    let mut fa = pF(a);
    let mut fb = pF(b);
    let mut fc: f32;
    let mut p: f32;
    let mut q: f32;

    fc = fb;
    for _iter in 1..=itmax {
        if fb * fc > 0.0 {
            /* Rename a,b,c and adjust bounding interval d. */
            c = a;
            fc = fa;
            d = b - a;
            e = d;
        }

        if f64::from(fc).abs() < f64::from(fb).abs() {
            a = b;
            b = c;
            c = a;
            fa = fb;
            fb = fc;
            fc = fa;
        }

        /* Convergence check */
        let tol1: f32 =
            (f64::from(2.0f32 * eps) * f64::from(b).abs() + f64::from(0.5f32 * tol)) as f32;
        let xm: f32 = 0.5 * (c - b);

        if f64::from(xm).abs() <= f64::from(tol1) || fb == 0.0 {
            return b;
        }
        if f64::from(e).abs() >= f64::from(tol1) && f64::from(fa).abs() > f64::from(fb).abs() {
            /* Attempt inverse quadratic interpolation */
            let s: f32 = fb / fa;
            if a == c {
                p = 2.0 * xm * s;
                q = 1.0 - s;
            } else {
                q = fa / fc;
                let r: f32 = fb / fc;
                p = s * (2.0 * xm * q * (q - r) - (b - a) * (r - 1.0));
                q = (q - 1.0) * (r - 1.0) * (s - 1.0);
            }
            if p > 0.0 {
                /* Check whether in bounds */
                q = -q;
            }
            p = f64::from(p).abs() as f32;
            let min1: f32 = (f64::from(3.0f32 * xm * q) - f64::from(tol1 * q).abs()) as f32;
            let min2: f32 = f64::from(e * q).abs() as f32;
            if 2.0 * p < (if min1 < min2 { min1 } else { min2 }) {
                e = d; /* Accept interpolation */
                d = p / q;
            } else {
                /* Interpolation failed, use bisection. */
                d = xm;
                e = d;
            }
        } else {
            /* Bounds decreasing too slowly, use bisection. */
            d = xm;
            e = d;
        }
        a = b; /* Move last best guess to a. */
        fa = fb;
        if f64::from(d).abs() > f64::from(tol1) {
            /* evaluate new trial root. */
            b += d;
        } else {
            b += (if xm > 0.0 {
                f64::from(tol1).abs()
            } else {
                -f64::from(tol1).abs()
            }) as f32;
        }

        fb = pF(b);
    }

    if x1 < x2 {
        x2 + 1.0 /* error code, return out of bounds */
    } else {
        x2 - 1.0
    }
}

/// `MapGlottalFormantsNotF1`, `hlsyn/hlframe.c:178-222` (without `in_phdraw`).
fn MapGlottalFormantsNotF1(
    frame: &HLFrame,
    speaker: &HLSpeaker,
    state: &mut HLState,
    llframe: &mut LLFrame,
) {
    if frame.f0 > 0.0 {
        llframe.NF0 = short_f(frame.f0 + 0.5 /* round, not truncate */);

        if llframe.NF0 < 0 {
            /* don't let it go negative! */
            llframe.NF0 = 0;
        }
    } else {
        llframe.NF0 = 0;
    }

    /* Adjust f1c for tracheal coupling */
    if frame.an < 3.0 && state.f1c < 300.0 {
        if state.agf > speaker.agm && state.f1c < speaker.F1T {
            state.f1c += speaker.KdF * (1.0 - state.f1c / speaker.F1T) * (state.agf - speaker.agm);
        }
    }

    llframe.NF2 = short_f(frame.f2);
    llframe.NF3 = short_f(frame.f3);
    llframe.NF4 = short_f(frame.f4);
    llframe.NF5 = short_f(speaker.F5);
}

/// `FricativeFilters`, `hlsyn/hlframe.c:224-397` (without `INVTMIONT` and
/// `DEBUG`).
fn FricativeFilters(frame: &HLFrame, speaker: &HLSpeaker, state: &HLState, llframe: &mut LLFrame) {
    /* Zero all of the gains initially */
    llframe.NA2F = 0;
    llframe.NA3F = 0;
    llframe.NA4F = 0;
    llframe.NA5F = 0;
    llframe.NA6F = 0;
    llframe.NAB = 0;

    /* First, set the gains of the parallel fricative filter */
    if f32::from(llframe.NAF) > speaker.AFThreshold {
        // The C `switch` falls from the DORSUM case into the LIQUID case for
        // place 42 and for any place it does not name (hlframe.c:297-345).
        let mut fall_into_liquid = state.loc == LIQUID;
        match state.loc {
            LIPS => {
                /* Labial */
                llframe.NAB = short_f(speaker.LabialAB);
            }
            BLADE => { /* Alveolar */ }
            DORSUM => {
                /* Pal/Velar */
                if frame.place == 40 {
                    if frame.f2
                        > (speaker.PalVelar_f2Offset + speaker.PalVelar_f2Overf3_Slope * frame.f3)
                    {
                        llframe.NA3F = short_f(speaker.PalVelarA3F);
                    } else {
                        llframe.NA2F = 45;
                        llframe.NA3F = 0;
                        llframe.NA5F = 45;
                    }
                } else if frame.place == 42 {
                    llframe.NA2F = 45;
                    llframe.NA3F = 40;
                    llframe.NA5F = 30;
                    fall_into_liquid = true;
                } else if frame.place == 45 {
                    llframe.NA2F = 0;
                    llframe.NA3F = 45;
                    llframe.NA5F = 50;
                } else if frame.place == 80 {
                    llframe.NA2F = 50;
                    llframe.NA3F = 0;
                    llframe.NA4F = 30;
                    llframe.NA5F = 30;
                } else {
                    fall_into_liquid = true;
                }
            }
            _ => {}
        }
        if fall_into_liquid {
            /* Lateral/Retroflex */
            if frame.f3 < speaker.f3RetroflexMax {
                /* Retroflex */
                llframe.NA3F = short_f(speaker.RetroflexA3F);
            } else {
                /* Must be lateral */
                llframe.NA3F = short_f(speaker.LateralA3F);
            }
        }

        /* The sixth formant gain is set to the Klatt default value. */
        llframe.NA6F = short_f(speaker.A6f);
    }

    llframe.NF6 = short_f(speaker.F6);

    /* Then set the bandwidths of the fricative filter to default values. */
    llframe.NB2F = short_f(speaker.B2F);
    llframe.NB3F = short_f(speaker.B3F);
    llframe.NB4F = short_f(speaker.B4F);
    llframe.NB5F = short_f(speaker.B5F);
    llframe.NB6F = short_f(speaker.B6F);
    llframe.NDB1 = short_f(state.Pm); //this is to eventual bring in pressure rules
}

/// `SourceAmplitudes`, `hlsyn/hlframe.c:399-509`. Pressures in cm H2O, areas
/// in cm^2.
fn SourceAmplitudes(
    frame: &HLFrame,
    speaker: &HLSpeaker,
    state: &HLState,
    oldstate: &HLState,
    llframe: &mut LLFrame,
) {
    if frame.ag >= speaker.agHiKLSourceCutoff {
        llframe.NAF = 0;
    } else {
        llframe.NAF = short_f(InterpolateAF(speaker, state, oldstate));
    }

    /* Compute AV dependent on the actual size of the glottal opening (agx).
    The leading `30.` is a double constant, so these sums are double. */
    if state.agx < speaker.agMin
        || state.agx > speaker.agAVModalOffsetMax + speaker.agm
        || frame.ag >= speaker.agHiKLSourceCutoff
        || frame.ps - CGS_TO_CMWATER(state.Pm) < FLOAT_EPS
        || frame.ps - CGS_TO_CMWATER(state.Pm)
            < speaker.AVPressureThreshold - speaker.KdPTdc * frame.dc
    {
        llframe.NAV = 0;
    } else if state.agx < speaker.agm {
        llframe.NAV = short_d(
            30.0f64 * DTlog10(frame.ps - CGS_TO_CMWATER(state.Pm)) + f64::from(speaker.Kv)
                - f64::from(speaker.KdAV0 * MMSQ_TO_CMSQ(speaker.agm - state.agx)),
        );
    } else if state.agx < speaker.agm + speaker.agAVModalOffsetOnOff {
        llframe.NAV = short_d(
            30.0f64 * DTlog10(frame.ps - CGS_TO_CMWATER(state.Pm)) + f64::from(speaker.Kv)
                - f64::from(speaker.KdAV * MMSQ_TO_CMSQ(state.agx - speaker.agm)),
        );
    } else {
        llframe.NAV = short_d(
            30.0f64 * DTlog10(frame.ps - CGS_TO_CMWATER(state.Pm)) + f64::from(speaker.Kv)
                - f64::from(speaker.KdAV * MMSQ_TO_CMSQ(speaker.agAVModalOffsetOnOff))
                - f64::from(
                    speaker.KdAV1
                        * MMSQ_TO_CMSQ(state.agx - speaker.agm - speaker.agAVModalOffsetOnOff),
                ),
        );
    }

    /* Must not be negative. From Williams. */
    if llframe.NAV < 0 {
        llframe.NAV = 0;
    }

    if llframe.NAV == 0 {
        llframe.NF0 = 0;
    }

    /* Compute AH, conditions are from Dave Williams code hlkl.c */
    if state.agf < speaker.agMin
        || frame.ag >= speaker.agHiKLSourceCutoff
        || (frame.an <= 0.0 && state.acx <= 0.0)
        || f64::from(frame.ps - CGS_TO_CMWATER(state.Pm)).abs() < f64::from(FLOAT_EPS)
        || state.agf < FLOAT_EPS
    {
        llframe.NAH = 0;
    } else {
        // x87 (hlframe.obj): the first product is stored as float, the second
        // is added to it in the x87 register, then Ka is added in float.
        let pressure_term: f32 =
            (30.0f64 * DTlog10(f64::from(frame.ps - CGS_TO_CMWATER(state.Pm)).abs() as f32)) as f32;
        let sum: f32 =
            (f64::from(pressure_term) + 10.0f64 * DTlog10(MMSQ_TO_CMSQ(state.agf))) as f32;
        llframe.NAH = short_f(sum + speaker.Ka);

        if f32::from(llframe.NAH) > speaker.Ka {
            if state.agf > 12.0 {
                llframe.NAH = (i32::from(llframe.NAH) + 9) as i16;
            } else if state.agf > 9.0 {
                llframe.NAH =
                    (i32::from(llframe.NAH) + i32::from(short_f((state.agf - 9.0) * 3.0))) as i16;
            }
        }
    }

    /* Must not be negative. From Williams. */
    if llframe.NAH < 0 {
        llframe.NAH = 0;
    }
}

/// `InterpolateAF`, `hlsyn/hlframe.c:512-584`. As in the C, the value
/// returned is the last interpolation step's `AF`, not `MaxAF`.
fn InterpolateAF(speaker: &HLSpeaker, state: &HLState, oldstate: &HLState) -> f32 {
    let mut AF: f32 = 0.0;

    if state.agx <= 0.0 || state.acx <= 0.0 {
        /* From hlkl.c */
        return 0.0;
    }

    let NumberAFInterpolations: i32 =
        cvtt(f64::from(speaker.UpdateInterval / speaker.AFInterpTimeStep));

    let acxPrev = MMSQ_TO_CMSQ(oldstate.acx);
    let acxStep = (MMSQ_TO_CMSQ(state.acx) - acxPrev) / (NumberAFInterpolations as f32);

    let PmPrev = CGS_TO_CMWATER(oldstate.Pm);
    let PmStep = (CGS_TO_CMWATER(state.Pm) - PmPrev) / (NumberAFInterpolations as f32);

    let mut i: i16 = 1;
    while i32::from(i) <= NumberAFInterpolations {
        let acx = acxPrev + f32::from(i) * acxStep;
        let Pm = PmPrev + f32::from(i) * PmStep;

        /* AF = 20 log10 ( Pm ^ (3/2) * acx ^ (1/2) ) + Kf. If there is no
        pressure in the mouth then there will be no fricative. Also complete
        closure will not cause frication. */
        if Pm < FLOAT_EPS || acx < FLOAT_EPS {
            AF = 0.0;
        } else {
            // x87 (hlframe.obj): as for AH in SourceAmplitudes.
            let pressure_term: f32 = (30.0f64 * DTlog10(Pm)) as f32;
            let sum: f32 = (f64::from(pressure_term) + 10.0f64 * DTlog10(acx)) as f32;
            AF = sum + speaker.Kf;
        }

        i += 1;
    }

    AF
}

/// `GlottalInteraction`, `hlsyn/hlframe.c:586-652`.
fn GlottalInteraction(
    frame: &HLFrame,
    speaker: &HLSpeaker,
    state: &HLState,
    llframe: &mut LLFrame,
) {
    llframe.NF1 = short_f(state.f1x); /* glottal coupling is accounted for in f1c */

    if state.agf > speaker.agm {
        llframe.NB3 = short_f(speaker.B3m + (state.agf - speaker.agm) * speaker.KB3);
        llframe.NB4 = short_f(speaker.B4m + (state.agf - speaker.agm) * speaker.KB4);
        llframe.NB5 = short_f(speaker.B5m + (state.agf - speaker.agm) * speaker.KB5);
    } else {
        llframe.NB3 = short_f(speaker.B3m);
        llframe.NB4 = short_f(speaker.B4m);
        llframe.NB5 = short_f(speaker.B5m);
    }

    if state.agf > speaker.agm {
        let mut a: f32 = 9523445.0372631; //(SPEEDSOUND * SPEEDSOUND * DTsqrt(RHO / 2.0f) / PI);
        a /= if speaker.Av > L_EPS * L_EPS {
            speaker.Av
        } else {
            3.5
        };

        a /= if speaker.Lv > L_EPS { speaker.Lv } else { 17.0 };

        let b: f32 = 2.2502698034486e-2f32 * speaker.Lvg * speaker.Lvg;

        let Ptransg: f32 = f64::from(CMWATER_TO_CGS(frame.ps) - state.Pm).abs() as f32;

        // x87 (hlframe.obj): `a * area * DTsqrt()` multiplies the square root
        // in the x87 register and is then stored as float.
        let numerator: f32 =
            (f64::from(a * MMSQ_TO_CMSQ(state.agf - speaker.agm)) * DTsqrt(Ptransg)) as f32;
        llframe.NB1 = short_f(state.b1x + numerator / (Ptransg + b * state.f1x * state.f1x));
        let numerator: f32 =
            (f64::from(a * MMSQ_TO_CMSQ(state.agf - speaker.agm)) * DTsqrt(Ptransg)) as f32;
        llframe.NB2 = short_f(speaker.B2m + numerator / (Ptransg + b * frame.f2 * frame.f2));
    } else {
        llframe.NB1 = short_f(state.b1x);
        llframe.NB2 = short_f(speaker.B2m);
    }
}

/// `SourceSpecifics`, `hlsyn/hlframe.c:654-752`.
fn SourceSpecifics(frame: &HLFrame, speaker: &HLSpeaker, state: &HLState, llframe: &mut LLFrame) {
    /* Compute OQ */
    llframe.NOQ = short_f(speaker.OQm + (state.agx - speaker.agm) * speaker.KOQ);
    if f32::from(llframe.NOQ) > speaker.OQMax {
        llframe.NOQ = short_f(speaker.OQMax);
    } else if f32::from(llframe.NOQ) < speaker.OQMin {
        llframe.NOQ = short_f(speaker.OQMin);
    }

    /* Compute TL */
    let acx_anMax = if state.acx > frame.an {
        state.acx
    } else {
        frame.an
    };
    let mut TLFloat: f32;
    if acx_anMax < speaker.TLBreakArea {
        TLFloat = speaker.TLm
            + ((speaker.TLBreakArea - acx_anMax) + (state.agx - speaker.agm)) * speaker.KTL;
    } else {
        TLFloat = speaker.TLm + (state.agx - speaker.agm) * speaker.KTL;
    }

    /* Include posterior glottal opening correction on TL. */
    let mut m: f32 = if f64::from(speaker.At).abs() > f64::from(L_EPS * L_EPS) {
        speaker.Lt / speaker.At
    } else {
        speaker.Lt / 2.5
    };

    m += if f64::from(speaker.Av).abs() > f64::from(L_EPS) {
        speaker.Lv / speaker.Av
    } else {
        speaker.Lv / 3.5
    };

    /* The additional tilt at 3kHz is 20 log10 (6kHz pi T); see the derivation
    at hlframe.c:701-715. */
    let apCgs = MMSQ_TO_CMSQ(frame.ap);
    let apCgs2 = apCgs * apCgs;
    //  RkApCubedOverRho = DTsqrt(2.0f * fabs(CMWATER_TO_CGS(frame->ps) - state->Pm) / RHO) * apCgs * apCgs;
    // x87 (hlframe.obj): the square root is multiplied in the x87 register.
    let RkApCubedOverRho: f32 =
        (DTsqrt((f64::from(CMWATER_TO_CGS(frame.ps) - state.Pm).abs() as f32) * 1754.385964912f32)
            * f64::from(apCgs2)) as f32;
    //  RvApCubedOverRho = 12.0f * (float)(MU/RHO) * speaker->Lvg * speaker->Lhp * speaker->Lhp;
    let RvApCubedOverRho: f32 = 2.0421052631578f32 * speaker.Lvg * speaker.Lhp * speaker.Lhp;
    let SixkHzpiT: f32 =
        6000.0f32 * PI * apCgs2 * (m * apCgs + speaker.Lvg) / (RkApCubedOverRho + RvApCubedOverRho);

    // x87 (hlframe.obj): product and sum happen in the x87 register.
    TLFloat = (f64::from(TLFloat)
        + 20.0f64 * DTlog10(if SixkHzpiT < 1.0 { 1.0 } else { SixkHzpiT })) as f32;

    /* Include formant spacing correction on TL */
    llframe.NTL = short_f(
        TLFloat
            + (speaker.SFromf4 * frame.f4 - speaker.SDefault) * speaker.dBTLforPctS
                / (speaker.PctSfordBTL * speaker.SDefault),
    );

    if f32::from(llframe.NTL) > speaker.TLMax {
        llframe.NTL = short_f(speaker.TLMax);
    } else if f32::from(llframe.NTL) < speaker.TLMin {
        llframe.NTL = short_f(speaker.TLMin);
    }

    /* Compute DI */
    if state.agx > speaker.agDIMin && state.agx < speaker.agm {
        llframe.NDI = short_f(((speaker.agm - state.agx) / state.agx) * speaker.KDI);
    } else {
        llframe.NDI = 0;
    }
}

/// `UnusedLLParameters`, `hlsyn/hlframe.c:754-806`.
fn UnusedLLParameters(llframe: &mut LLFrame) {
    /* The tracheal pole/zero pair is eliminated by setting them equal. */
    llframe.NFTZ = REMOVE_FORMANT;
    llframe.NFTP = REMOVE_FORMANT;
    llframe.NBTZ = REMOVE_BANDWIDTH;
    llframe.NBTP = REMOVE_BANDWIDTH;

    /* Only the Klatt natural source is used. */
    llframe.NSQ = 0;

    /* The flutter is not set by HLSYN */
    llframe.NFL = 0;

    /* DF1 is not used; DB1 carries the mouth pressure (hlframe.c:395). */
    llframe.NDF1 = 0;

    /* The special parallel synthesizer for voiced speech is not used. */
    llframe.NANV = 0;
    llframe.NA1V = 0;
    llframe.NA2V = 0;
    llframe.NA3V = 0;
    llframe.NA4V = 0;
    llframe.NATV = 0;

    llframe.NB6 = 1000;
}

/// Local `FNPVars`, `hlsyn/nasalf1x.c:74-80`.
#[derive(Clone, Copy, Default)]
struct FNPVars {
    K1: f32,
    K2: f32,
    r#fn: f32,
    fp: f32,
    f1c: f32,
}

/// `SetNasals_f1x`, `hlsyn/nasalf1x.c:101-131`.
fn SetNasals_f1x(frame: &HLFrame, speaker: &HLSpeaker, state: &mut HLState, llframe: &mut LLFrame) {
    if frame.an <= AN_NO_NASAL_BREAKPOINT {
        /* Nasal cavity does not connect to oral cavity. The nasal pole and
        zero are set equal so they cancel out. */
        state.f1x = state.f1c;
        state.b1x = speaker.B1m;
        llframe.NFNP = short_f(speaker.fno + 0.5);
        llframe.NFNZ = llframe.NFNP;
        llframe.NBNP = short_f(NasalBandwidth + 0.5);
        llframe.NBNZ = llframe.NBNP;
    } else {
        let (f1x, b1x) = NasalFirstFormant(frame, speaker, state);
        state.f1x = f1x;
        state.b1x = b1x;
        let (FNZ, BNZ) = NasalZero(frame, speaker, state);
        let (FNP, BNP) = NasalPole(frame, speaker, state);
        llframe.NFNZ = short_f(FNZ);
        llframe.NBNZ = short_f(BNZ);
        llframe.NFNP = short_f(FNP);
        llframe.NBNP = short_f(BNP);
    }
}

/// `NasalZero`, `hlsyn/nasalf1x.c:133-190`. Returns `(FNZ, BNZ)`.
fn NasalZero(frame: &HLFrame, speaker: &HLSpeaker, state: &HLState) -> (f32, f32) {
    let an = MAX(0.0, frame.an);

    /* The an to fn table is based on an assumed fno. If fno is different then
    the result is scaled. */
    let r#fn = InterpolateTable(&anfnTable, an) * (speaker.fno / anfnTable_fno);

    let fm = Compute_fm(frame, speaker);

    /* We must use the constriction modified f1 (f1c) to compute any nasal
    interactions. */
    let LOverA = InterpolateTable(&f1LOverATable, state.f1c);

    // x87 (nasalf1x.obj): InterpolateTable's result is multiplied and divided
    // in the x87 register, then stored as float.
    let MmOverMn: f32 =
        (f64::from(LOverA) * f64::from(an) / f64::from(3.7f32 * an + 100.0f32)) as f32;

    // x87: the square root is multiplied by fn in the x87 register.
    let FNZ = (f64::from(r#fn)
        * DTsqrt((1.0 + MmOverMn) / (1.0 + MmOverMn * r#fn * r#fn / (fm * fm))))
        as f32;

    /* Compute the bandwidth of the nasal zero. */
    let BNZ = if state.f1c < speaker.BNZ_f1BreakPoint {
        NasalBandwidth
    } else {
        NasalBandwidth + 100.0 * MmOverMn
    };

    (FNZ, BNZ)
}

/// `Compute_fm`, `hlsyn/nasalf1x.c:192-215`.
fn Compute_fm(frame: &HLFrame, speaker: &HLSpeaker) -> f32 {
    /* Must use f1 here because these effects are irrespective of the closure
    acx. */
    if frame.f1 >= speaker.fm_f1BreakPoint {
        0.8f32 * frame.f2 + 0.2f32 * frame.f3
    } else {
        let r: f32 = 1.0f32 + 0.0143f32 * (frame.f1 - speaker.fm_f1BreakPoint);
        // `(1.-r) * 3000.` is double.
        (f64::from(r * (0.8f32 * frame.f2 + 0.2f32 * frame.f3))
            + (1.0f64 - f64::from(r)) * 3000.0f64) as f32
    }
}

/// `InterpolateTable`, `hlsyn/nasalf1x.c:217-263`. Column1 is assumed to be
/// increasing; values off the table take its first or last entry.
fn InterpolateTable(TheTable: &[TableRow], Column1Point: f32) -> f32 {
    let TableLength = TheTable.len();
    let mut Column2Point: f32 = 0.0;

    if TheTable[0].Column1 >= Column1Point {
        Column2Point = TheTable[0].Column2;
    } else if TheTable[TableLength - 1].Column1 <= Column1Point {
        Column2Point = TheTable[TableLength - 1].Column2;
    } else {
        for i in 0..TableLength - 1 {
            if Column1Point >= TheTable[i].Column1 && Column1Point < TheTable[i + 1].Column1 {
                Column2Point = LinearInterpolate(
                    Column1Point,
                    TheTable[i].Column1,
                    TheTable[i].Column2,
                    TheTable[i + 1].Column1,
                    TheTable[i + 1].Column2,
                );
                break;
            }
        }
    }

    Column2Point
}

/// `LinearInterpolate`, `hlsyn/nasalf1x.c:265-282`.
fn LinearInterpolate(x: f32, x1: f32, y1: f32, x2: f32, y2: f32) -> f32 {
    let Slope = (y2 - y1) / (x2 - x1);
    let yIntercept = y1 - Slope * x1;

    Slope * x + yIntercept
}

/// `NasalFirstFormant`, `hlsyn/nasalf1x.c:284-370`. Returns `(f1x, b1x)`.
fn NasalFirstFormant(frame: &HLFrame, speaker: &HLSpeaker, state: &HLState) -> (f32, f32) {
    let Qf1c: f32;
    let Qfno: f32;
    let an = MAX(0.0, frame.an);
    let b1x: f32;
    let f1x: f32;

    /* First, compute the bandwidth of the first formant b1x */
    let temp = speaker.B1m + MMSQ_TO_CMSQ(an) * NasalBandwidth;

    if state.f1c <= speaker.fno {
        b1x = temp;
    } else {
        if an <= speaker.BNP_B1_anLow {
            b1x = NasalBandwidth;
        } else if an >= speaker.BNP_B1_anHigh {
            b1x = temp;
        } else {
            b1x = LinearInterpolate(
                an,
                speaker.BNP_B1_anLow,
                NasalBandwidth,
                speaker.BNP_B1_anHigh,
                temp,
            );
        }
    }

    /* For f1x, the smaller solution to the sum of the susceptances, Bn and
    (Bp + Bm) are approximated as straight lines whose slopes come from the
    tables. */
    let c = InterpolateTable(&speaker.f1cTable, state.f1c);

    if state.f1c >= speaker.fno {
        let a = InterpolateTable(&speaker.anaTable, an);
        if an < speaker.anaTable[0].Column1 {
            /* interpolate from the first tabulated value of a to
            a = +infinity at an = 0, using a hyperbola a = const/an */
            Qf1c = an * c;
            Qfno = speaker.anaTable[0].Column1 * a;
        } else {
            Qf1c = c;
            Qfno = a;
        }
    } else {
        let b = InterpolateTable(&speaker.anbTable, an);
        if an < speaker.anbTable[0].Column1 {
            /* linearly interpolate from the first tabulated value of b to
            b = 0 at an = 0 */
            Qf1c = speaker.anbTable[0].Column1 * c;
            Qfno = an * b;
        } else {
            Qf1c = c;
            Qfno = b;
        }
    }

    if f64::from(Qf1c + Qfno).abs() < f64::from(FLOAT_EPS) {
        f1x = (state.f1c + speaker.fno) / 2.0; /* a guess */
    } else {
        f1x = (Qf1c * state.f1c + Qfno * speaker.fno) / (Qf1c + Qfno);
    }

    (f1x, b1x)
}

/// `NasalPole`, `hlsyn/nasalf1x.c:372-455`. Returns `(FNP, BNP)`.
fn NasalPole(frame: &HLFrame, speaker: &HLSpeaker, state: &HLState) -> (f32, f32) {
    let mut FNPvars = FNPVars::default();
    let mut Brac_low: f32 = 0.0;
    let mut Brac_high: f32 = 0.0;
    let an = MAX(0.0, frame.an);
    let BNP: f32;
    let FNP: f32;

    /* First, compute the bandwidth of the nasal pole */
    let temp = speaker.B1m + MMSQ_TO_CMSQ(an) * NasalBandwidth;

    if state.f1c <= speaker.fno {
        if an <= speaker.BNP_B1_anLow {
            BNP = NasalBandwidth;
        } else if an >= speaker.BNP_B1_anHigh {
            BNP = temp;
        } else {
            BNP = LinearInterpolate(
                an,
                speaker.BNP_B1_anLow,
                NasalBandwidth,
                speaker.BNP_B1_anHigh,
                temp,
            );
        }
    } else {
        BNP = temp;
    }

    /* Compute the frequency of the nasal pole. */
    FNPvars.r#fn = InterpolateTable(&anfnTable, an) * (speaker.fno / anfnTable_fno);

    if frame.f2 >= speaker.fp_f2BreakPoint {
        FNPvars.fp = 0.00036f32 * state.f1c * (frame.f2 - speaker.fp_f2BreakPoint)
            + (speaker.fp_f2BreakPoint - 100.0f32);
    } else {
        FNPvars.fp = frame.f2 - 100.0f32;
    }

    if FNPvars.fp <= FNPvars.r#fn {
        FNP = 0.5 * (FNPvars.fp + FNPvars.r#fn);
    } else {
        /* Must search for an FNP which sets the susceptances
        Bm + Bp + Bn = 0 */
        FNPvars.K1 = speaker.PharangealArea / (RHO * SPEEDSOUND);
        FNPvars.K2 = InterpolateTable(&speaker.anK2Table, an);
        FNPvars.f1c = state.f1c;

        if SusceptanceSum((1.0f32 + 2.5f32 * f32::EPSILON) * FNPvars.r#fn, &FNPvars) >= 0.0 {
            /* K2 is (essentially) zero; the Bn hyperbola degenerates to an L */
            FNP = MAX(state.f1c, FNPvars.r#fn);
        } else if FiniteBracketFNP(&FNPvars, state.f1c, &mut Brac_low, &mut Brac_high) {
            FNP = Brent(
                |x| SusceptanceSum(x, &FNPvars),
                Brac_low,
                Brac_high,
                FNP_TOL,
                ITMAX,
                EPS,
            );
        } else {
            FNP = 0.5 * (FNPvars.fp + FNPvars.r#fn); /* rough guess */
        }
    }

    (FNP, BNP)
}

/// `SusceptanceSum`, `hlsyn/nasalf1x.c:457-470`. The argument of `tan` and
/// the product with `K1` are double.
fn SusceptanceSum(FNPGuess: f32, FNPvars: &FNPVars) -> f32 {
    let Bn: f32 = -FNPvars.K2 / (FNPGuess - FNPvars.r#fn);

    let BpPlusBm: f32 = (f64::from(FNPvars.K1)
        * libm::tan(
            f64::from(PI) / 2.0f64 * f64::from(FNPGuess - FNPvars.f1c)
                / f64::from(FNPvars.fp - FNPvars.f1c),
        )) as f32;

    Bn + BpPlusBm
}

/// `FiniteBracketFNP`, `hlsyn/nasalf1x.c:472-547`. Returns whether the root
/// of `SusceptanceSum` was bracketed by finite values.
fn FiniteBracketFNP(FNPvars: &FNPVars, f1c: f32, Brac_low: &mut f32, Brac_high: &mut f32) -> bool {
    let min_f: f32;

    /* Root is known to lie above fn and f1c, and below fp, and one must avoid
    the singularities at fn and fp. */
    if FNPvars.r#fn >= f1c {
        *Brac_low = FNPvars.r#fn + FINITE_OFFSET * (FNPvars.fp - FNPvars.r#fn);
        min_f = FNPvars.r#fn;
    } else {
        *Brac_low = f1c;
        min_f = f1c;
    }

    *Brac_high = FNPvars.r#fn + (1.0f32 - FINITE_OFFSET) * (FNPvars.fp - FNPvars.r#fn);

    let max_f = FNPvars.fp;

    /* Decrease lower endpoint 'till the function is negative there. */
    let mut i: i16 = 0;
    while i < MAX_FINITE_ITERATIONS {
        if SusceptanceSum(*Brac_low, FNPvars) <= 0.0 {
            break;
        } else {
            *Brac_low -= (1.0f32 - FINITE_OFFSET) * (*Brac_low - min_f);
        }
        i += 1;
    }

    if i == MAX_FINITE_ITERATIONS {
        return false;
    }

    /* Increase upper endpoint 'till the function is positive there. */
    let mut i: i16 = 0;
    while i < MAX_FINITE_ITERATIONS {
        if SusceptanceSum(*Brac_high, FNPvars) >= 0.0 {
            break;
        } else {
            *Brac_high += (1.0f32 - FINITE_OFFSET) * (max_f - *Brac_high);
        }
        i += 1;
    }

    if i == MAX_FINITE_ITERATIONS {
        return false;
    }

    true
}
