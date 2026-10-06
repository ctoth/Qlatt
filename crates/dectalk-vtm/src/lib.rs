//! DECtalk 4.63 vocal tract model, integer arithmetic.
//!
//! A transcription of the routine that turns one frame of control words plus a
//! speaker definition into 16-bit samples, as compiled into the stock Windows
//! `say.exe` of DECtalk 4.63. It is a transcription, not a reimplementation:
//! variable names, statement order and integer widths follow the C so the two
//! can be read side by side, and every block cites `file:line` in the DECtalk
//! 4.63 source tree (`dapi/src/...`).
//!
//! # Which source the stock binary compiles
//!
//! - `dapi/src/dtstatic.mak:164` (`CFG=dtstatic - Win32 Release`, the library
//!   `samples/SAY/say.mak` links for `say - Win32 Release Static`) compiles
//!   `.\Vtm\vtm.c` with `/D ENGLISH_US /D ENGLISH /D ACNA /D NDEBUG /D i386
//!   /D WIN32 /D _WINDOWS /D BLD_DECTALK_DLL /D STATIC_BUILD`.
//! - `VTM/vtm.c:33` is `#include "vtm3.c"`.
//! - `VTM/vtm3.c:164-166` switches to the floating-point model (`vtm_fa.c`)
//!   only under `FP_VTM`, and `dectalkf.h:182-184` defines `FP_VTM` only for
//!   `ALPHA` or `__osf__`. So the binary runs the integer model in `vtm3.c`.
//! - `dectalkf.h` switches that shape `vtm3.c`: `HLSYN` (114), `NEW_VTM` (226),
//!   `NEW_TILT` (231) and `NEW_NOISE` (235) are on; `LOWCOMPUTE` (237-239,
//!   CASIO only), `COMPRESSION` (253, commented out), `HLSYN_NEWPOLE`,
//!   `UPGRADES1999`, `F1_B1_UPGRADE`, `NEW_TEST`, `LOWEST`, `ACI_LICENSE`,
//!   `GERMAN` and `MULTIPLE_LANGUAGES_LOADED` are off. Only the branches
//!   compiled under those settings are transcribed.
//!
//! # Arithmetic
//!
//! `S16` is `i16`, `S32` and `int` are `i32`. C integer promotion is written
//! out: operands widen to `i32`, the result is truncated with `as i16` where
//! the C stores into an `S16`. Signed overflow wraps, as it does in the x86
//! binary. Right shifts of negative values are arithmetic in both.
//!
//! # Left out
//!
//! - The tuner/overload bookkeeping (`vtm3.c:1762-1845`, `vtdTuneResults`,
//!   `voicemark`): it writes statistics and, with no tuner attached, never
//!   changes a sample.
//! - State the compiled configuration writes but never reads: `lastf1`,
//!   `lastfnp`, `fnscal`, `vrnpg`, `sex`, `amp_voice`, `noiseb`, `ablas1/2`,
//!   `vlast`, `decay`, `one_minus_decay`, `temp`.
//! - The high-level synthesizer (`hlsyn`) that `VTM/vtmiont.c:658-1319` runs on
//!   each frame before calling this routine. The frame this model expects is
//!   the one `vtmiont.c` hands to `speech_waveform_generator` at line 1351,
//!   after lines 1292-1319 have overwritten T0, F1-F3, B1, the amplitudes, FZ,
//!   FNP, GF, TLT and DP with hlsyn's output.
//!
//! # Out-of-range input
//!
//! Where the C indexes a table out of bounds (a dB word outside 0..=87, a
//! frequency at or above 4962 Hz in `d2pole_cf123`, an open phase under 40
//! samples), it reads whatever memory follows. This port panics instead.

#![allow(non_snake_case)]
// Kept in the shape of the C source so the two can be compared line by line.
#![allow(
    clippy::collapsible_else_if,
    clippy::collapsible_if,
    clippy::needless_late_init,
    clippy::manual_clamp,
    clippy::needless_range_loop,
    clippy::too_many_arguments,
    clippy::comparison_chain
)]

mod tables;

use tables::{AMPTABLE, B0, COSINE_TABLE, INT_VOLUME_TABLE, NTILTF, RADIUS_TABLE};

/// Words in a voice frame on Windows. `PH/ph_defs.h:382`.
pub const VOICE_PARS: usize = 45;
/// Words in a speaker definition packet, `SPDEF + 1`.
/// `PH/ph_defs.h:388`, `INCLUDE/cmd.h:209`.
pub const SPDEF_PARS: usize = 51;
/// `VTM/vtminst.h:73`.
pub const MAXIMUM_FRAME_SIZE: usize = 100;

/// `INCLUDE/samprate.h:9`.
pub const PC_SAMPLE_RATE: u32 = 11025;
/// `INCLUDE/samprate.h:10`.
pub const MULAW_SAMPLE_RATE: u32 = 8000;

// Order of the frame words. `PH/ph_defs.h:559-604`.
pub const OUT_AP: usize = 0;
pub const OUT_F1: usize = 1;
pub const OUT_A2: usize = 2;
pub const OUT_A3: usize = 3;
pub const OUT_A4: usize = 4;
pub const OUT_A5: usize = 5;
pub const OUT_A6: usize = 6;
pub const OUT_AB: usize = 7;
pub const OUT_TLT: usize = 8;
pub const OUT_T0: usize = 9;
pub const OUT_AV: usize = 10;
pub const OUT_F2: usize = 11;
pub const OUT_F3: usize = 12;
pub const OUT_FZ: usize = 13;
pub const OUT_B1: usize = 14;
pub const OUT_B2: usize = 15;
pub const OUT_B3: usize = 16;
pub const OUT_PH: usize = 17;
pub const OUT_FNP: usize = 20;
pub const OUT_GF: usize = 21;
pub const OUT_DP: usize = 24;
pub const OUT_BRST: usize = 35;

// Order of the speaker definition words, struct `SPD_CHIP`.
// `PH/ph_defs.h:693-720`.
pub const SPD_R4CB: usize = 0;
pub const SPD_R4CC: usize = 1;
pub const SPD_R5CB: usize = 2;
pub const SPD_R5CC: usize = 3;
pub const SPD_R4PB: usize = 4;
pub const SPD_R5PB: usize = 5;
pub const SPD_T0JIT: usize = 6;
pub const SPD_R5CA: usize = 7;
pub const SPD_R4CA: usize = 8;
pub const SPD_R3CA: usize = 9;
pub const SPD_R2CA: usize = 10;
pub const SPD_R1CA: usize = 11;
pub const SPD_NOPEN1: usize = 12;
pub const SPD_NOPEN2: usize = 13;
pub const SPD_ATURB: usize = 14;
pub const SPD_AFGAIN: usize = 16;
pub const SPD_AZGAIN: usize = 18;
pub const SPD_APGAIN: usize = 19;

/// Mask selecting the phoneme code of `OUT_PH`. `CMD/cm_defs.h:230`.
const PVALUE: i32 = 0x00FF;

/// `VTM/vtminst.h:74-76`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SampleRateChange {
    /// `SAMPLE_RATE_INCREASE`: 11025 Hz output.
    Increase,
    /// `SAMPLE_RATE_DECREASE`: 8000 Hz output.
    Decrease,
    /// `NO_SAMPLE_RATE_CHANGE`: the 10 kHz the tables were built for.
    NoChange,
}

/// `PH/ph_defs.h:798`: `(((S32)(x)*(S32)(y))>>12)`.
#[inline]
fn frac4mul(x: i32, y: i32) -> i32 {
    x.wrapping_mul(y) >> 12
}

/// `PH/ph_defs.h:799`: `(((S32)(x)*(S32)(y))>>15)`.
#[inline]
fn frac1mul(x: i32, y: i32) -> i32 {
    x.wrapping_mul(y) >> 15
}

/// Macro `two_pole_filter`, `VTM/vtmfunc.h:77-89`.
#[inline]
fn two_pole_filter(
    tp_input: i32,
    tp_delay_1: &mut i32,
    tp_delay_2: &mut i32,
    tp_a: i32,
    tp_b: i32,
    tp_c: i32,
) {
    let mut temp1 = tp_c.wrapping_mul(*tp_delay_2);
    *tp_delay_2 = *tp_delay_1;
    let temp0 = tp_b.wrapping_mul(*tp_delay_1);
    temp1 = temp1.wrapping_add(temp0);
    let temp0 = tp_a.wrapping_mul(tp_input);
    temp1 = temp1.wrapping_add(temp0);
    *tp_delay_1 = temp1 >> 12;
}

/// Macro `two_pole_filter` as it expands for the parallel branch, whose input
/// argument is the expression `noise+impulse` (`vtm3.c:1604`, 1617, 1632, 1645,
/// 1653). The macro body `temp0 = tp_a * (S32)tp_input;` (`vtmfunc.h:87`) then
/// reads `temp0 = tp_a * (S32)noise+impulse;`: the gain multiplies the noise
/// only and the impulse is added to the product unscaled.
#[inline]
fn two_pole_filter_noise_plus_impulse(
    noise: i16,
    impulse: i16,
    tp_delay_1: &mut i32,
    tp_delay_2: &mut i32,
    tp_a: i32,
    tp_b: i32,
    tp_c: i32,
) {
    let mut temp1 = tp_c.wrapping_mul(*tp_delay_2);
    *tp_delay_2 = *tp_delay_1;
    let temp0 = tp_b.wrapping_mul(*tp_delay_1);
    temp1 = temp1.wrapping_add(temp0);
    let temp0 = tp_a
        .wrapping_mul(i32::from(noise))
        .wrapping_add(i32::from(impulse));
    temp1 = temp1.wrapping_add(temp0);
    *tp_delay_1 = temp1 >> 12;
}

/// Macro `two_zero_filter`, `VTM/vtmfunc.h:17-29`. Returns `tz_output`.
#[inline]
fn two_zero_filter(
    tz_input: i32,
    tz_delay_1: &mut i32,
    tz_delay_2: &mut i32,
    tz_a: i32,
    tz_b: i32,
    tz_c: i32,
) -> i32 {
    let mut temp1 = tz_c.wrapping_mul(*tz_delay_2);
    temp1 = temp1.wrapping_add(tz_b.wrapping_mul(*tz_delay_1));
    temp1 = temp1.wrapping_add(tz_a.wrapping_mul(tz_input));
    *tz_delay_2 = *tz_delay_1;
    *tz_delay_1 = tz_input;
    temp1 >> 12
}

/// The state of `VTM_T` (`VTM/vtminst.h:98-655`) that the integer model reads,
/// plus the two `KSD_T` values it uses (`uiSampleRate`, and `vol_att` passed
/// per frame).
#[derive(Clone, Debug)]
pub struct Vtm {
    // vtminst.h:101-104, 141; kernel share data `uiSampleRate`.
    uiSampleRateChange: SampleRateChange,
    rate_scale: i16,
    inv_rate_scale: i16,
    uiNumberOfSamplesPerFrame: usize,
    uiSampleRate: u32,

    // vtminst.h:133-134.
    iwave: [i16; MAXIMUM_FRAME_SIZE],
    variabpars: [i16; VOICE_PARS],

    // vtminst.h:329-343.
    dpulse: i16,
    t0jitr: i16,
    Aturb: i16,

    // vtminst.h:354-402. Resonator memories are S32, the tilt filter's are S16.
    r2pd1: i32,
    r2pd2: i32,
    r3pd1: i32,
    r3pd2: i32,
    r4pd1: i32,
    r4pd2: i32,
    r5pd1: i32,
    r5pd2: i32,
    r6pd1: i32,
    r6pd2: i32,
    r1cd1: i32,
    r1cd2: i32,
    r2cd1: i32,
    r2cd2: i32,
    r3cd1: i32,
    r3cd2: i32,
    r4cd1: i32,
    r4cd2: i32,
    r5cd1: i32,
    r5cd2: i32,
    rnpd1: i32,
    rnpd2: i32,
    rnzd1: i32,
    rnzd2: i32,
    rlpd1: i32,
    rlpd2: i32,
    rtcc: i16,
    rtcb: i16,
    rtca: i16,
    rtd2: i16,
    rtd1: i16,

    // vtminst.h:441-442.
    noblast: i16,
    nolast: i16,

    // vtminst.h:448-515. Note the mixed widths of the "a" coefficients.
    R4pb: i16,
    r4pc: i16,
    R5pb: i16,
    r5pc: i16,
    R6pb: i16,
    r6pc: i16,
    R1ca: i16,
    r1cb: i16,
    r1cc: i16,
    R2ca: i32,
    r2cb: i16,
    r2cc: i16,
    R3ca: i32,
    r3cb: i16,
    r3cc: i16,
    R4ca: i32,
    R4cb: i16,
    R4cc: i16,
    R5ca: i32,
    R5cb: i16,
    R5cc: i16,
    rnpa: i16,
    rnpb: i16,
    rnpc: i16,
    rnza: i32,
    rnzb: i16,
    rnzc: i16,
    rlpa: i32,
    rlpb: i16,
    rlpc: i16,

    // vtminst.h:533-557.
    voice0: i16,
    avgain: i16,
    aturb1: i16,
    APgain: i16,
    AFgain: i16,
    AFcgain: i16,
    r3cg: i16,
    r2cg: i16,
    r1cg: i16,
    avlin: i16,
    avlind: i16,
    a: i16,
    b: i16,
    k1: i16,
    k2: i16,
    lastFZinHZ: i16,

    // vtminst.h:564-575.
    nper: i16,
    par_count: i32,
    cas_count: i32,
    T0: i16,
    nopen: i16,
    topen: i16,
    nmod: i16,

    // vtminst.h:622-633.
    randomx: i16,
    ldspdef: i32,
    rampdown: i16,
}

impl Default for Vtm {
    fn default() -> Self {
        Self::new()
    }
}

impl Vtm {
    /// The state after the VTM thread start-up in `VTM/vtmiont.c`: `VTM_T` is
    /// allocated with `calloc` (line 447), so every field starts at zero, then
    /// lines 486-515 set the 11025 Hz rate and call
    /// `DTSetSampleRate(phTTS, PC_SAMPLE_RATE)`.
    pub fn new() -> Self {
        let mut vtm = Self {
            // vtmiont.c:486-493.
            uiSampleRateChange: SampleRateChange::Increase,
            rate_scale: 18063,
            inv_rate_scale: 29722,
            uiNumberOfSamplesPerFrame: 71,
            uiSampleRate: 11025,
            iwave: [0; MAXIMUM_FRAME_SIZE],
            variabpars: [0; VOICE_PARS],
            dpulse: 0,
            t0jitr: 0,
            Aturb: 0,
            r2pd1: 0,
            r2pd2: 0,
            r3pd1: 0,
            r3pd2: 0,
            r4pd1: 0,
            r4pd2: 0,
            r5pd1: 0,
            r5pd2: 0,
            r6pd1: 0,
            r6pd2: 0,
            r1cd1: 0,
            r1cd2: 0,
            r2cd1: 0,
            r2cd2: 0,
            r3cd1: 0,
            r3cd2: 0,
            r4cd1: 0,
            r4cd2: 0,
            r5cd1: 0,
            r5cd2: 0,
            rnpd1: 0,
            rnpd2: 0,
            rnzd1: 0,
            rnzd2: 0,
            rlpd1: 0,
            rlpd2: 0,
            rtcc: 0,
            rtcb: 0,
            rtca: 0,
            rtd2: 0,
            rtd1: 0,
            noblast: 0,
            nolast: 0,
            R4pb: 0,
            r4pc: 0,
            R5pb: 0,
            r5pc: 0,
            R6pb: 0,
            r6pc: 0,
            R1ca: 0,
            r1cb: 0,
            r1cc: 0,
            R2ca: 0,
            r2cb: 0,
            r2cc: 0,
            R3ca: 0,
            r3cb: 0,
            r3cc: 0,
            R4ca: 0,
            R4cb: 0,
            R4cc: 0,
            R5ca: 0,
            R5cb: 0,
            R5cc: 0,
            rnpa: 0,
            rnpb: 0,
            rnpc: 0,
            rnza: 0,
            rnzb: 0,
            rnzc: 0,
            rlpa: 0,
            rlpb: 0,
            rlpc: 0,
            voice0: 0,
            avgain: 0,
            aturb1: 0,
            APgain: 0,
            AFgain: 0,
            AFcgain: 0,
            r3cg: 0,
            r2cg: 0,
            r1cg: 0,
            avlin: 0,
            avlind: 0,
            a: 0,
            b: 0,
            k1: 0,
            k2: 0,
            lastFZinHZ: 0,
            nper: 0,
            par_count: 0,
            cas_count: 0,
            T0: 0,
            nopen: 0,
            topen: 0,
            nmod: 0,
            randomx: 0,
            ldspdef: 0,
            rampdown: 0,
        };
        // vtmiont.c:515.
        vtm.DTSetSampleRate(PC_SAMPLE_RATE);
        vtm
    }

    /// Samples produced per frame at the current sample rate.
    pub fn samples_per_frame(&self) -> usize {
        self.uiNumberOfSamplesPerFrame
    }

    /// Output sample rate in Hz.
    pub fn sample_rate(&self) -> u32 {
        self.uiSampleRate
    }

    /// `DTSetSampleRate`, `VTM/vtm3.c:2378-2442`. The caller must send the
    /// speaker definition again afterwards, as DECtalk does (lines 2438-2439).
    pub fn DTSetSampleRate(&mut self, uiSampRate: u32) {
        // vtm3.c:2388.
        self.uiSampleRate = uiSampRate;

        // vtm3.c:2400-2432.
        if self.uiSampleRate == PC_SAMPLE_RATE {
            self.uiSampleRateChange = SampleRateChange::Increase;
            self.rate_scale = 18063; /* Equals 1.1 in Q14 format for 11 KHz. */
            self.inv_rate_scale = 29722; /* Equals 0.909 in Q15 format. */
            self.uiNumberOfSamplesPerFrame = 71;
        } else if self.uiSampleRate == MULAW_SAMPLE_RATE {
            self.uiSampleRateChange = SampleRateChange::Decrease;
            self.rate_scale = 26214; /* Equals 0.8 in Q15 format for 8 KHz */
            self.inv_rate_scale = 20480; /* Equals 1.25 in Q14 format. */
            self.uiNumberOfSamplesPerFrame = 51;
        } else {
            self.uiSampleRateChange = SampleRateChange::NoChange;
        }
    }

    /// Handles one speaker definition packet the way `VTM/vtmiont.c:1616-1638`
    /// does: `InitializeVTM`, then `read_speaker_definition`.
    pub fn load_speaker_definition(&mut self, spdeftochip: &[i16; SPDEF_PARS]) {
        self.InitializeVTM();
        self.read_speaker_definition(spdeftochip);
    }

    /// `InitializeVTM`, `VTM/vtm3.c:2251-2311`.
    fn InitializeVTM(&mut self) {
        self.nper = 0;

        self.cas_count = 0;
        self.par_count = 0;
        self.r2pd1 = 0;
        self.r2pd2 = 0;

        self.r3pd1 = 0;
        self.r3pd2 = 0;

        self.r4pd1 = 0;
        self.r4pd2 = 0;

        self.r5pd1 = 0;
        self.r5pd2 = 0;

        self.r6pd1 = 0;
        self.r6pd2 = 0;

        self.r1cd1 = 0;
        self.r1cd2 = 0;

        self.r2cd1 = 0;
        self.r2cd2 = 0;

        self.r3cd1 = 0;
        self.r3cd2 = 0;

        self.r4cd1 = 0;
        self.r4cd2 = 0;

        self.r5cd1 = 0;
        self.r5cd2 = 0;

        self.rnpd1 = 0;
        self.rnpd2 = 0;

        self.rnzd1 = 0;
        self.rnzd2 = 0;

        self.rlpd1 = 0;
        self.rlpd2 = 0;

        self.rampdown = 0;
    }

    /// `read_speaker_definition`, `VTM/vtm3.c:1864-2232`.
    fn read_speaker_definition(&mut self, spdeftochip: &[i16; SPDEF_PARS]) {
        // vtm3.c:1905-1964: zero the model's memories.
        self.ldspdef = 1; /* flag that we loaded a speaker def eab 10/96 */
        self.r2pd1 = 0;
        self.r2pd2 = 0;

        self.r3pd1 = 0;
        self.r3pd2 = 0;

        self.r4pd1 = 0;
        self.r4pd2 = 0;

        self.r5pd1 = 0;
        self.r5pd2 = 0;

        self.r6pd1 = 0;
        self.r6pd2 = 0;

        self.r1cd1 = 0;
        self.r1cd2 = 0;

        self.r2cd1 = 0;
        self.r2cd2 = 0;

        self.r3cd1 = 0;
        self.r3cd2 = 0;

        self.r4cd1 = 0;
        self.r4cd2 = 0;

        self.r5cd1 = 0;
        self.r5cd2 = 0;

        self.rnpd1 = 0;
        self.rnpd2 = 0;

        self.rnzd1 = 0;
        self.rnzd2 = 0;

        self.rlpd1 = 0;
        self.rlpd2 = 0;

        self.avlind = 0; // tek 08oct96
        self.voice0 = 0; // tek 08oct96

        // vtm3.c:2026-2047: coefficients for the fixed downsampling low-pass
        // filter.
        let flp: i16;
        let blp: i16;
        let rlpg: i16;
        match self.uiSampleRateChange {
            SampleRateChange::Increase => {
                flp = 948;
                blp = 615;
                rlpg = 2400;
            }
            SampleRateChange::Decrease => {
                flp = 698;
                blp = 453;
                rlpg = 2400;
            }
            SampleRateChange::NoChange => {
                flp = 860;
                blp = 558;
                rlpg = 2400;
            }
        }
        let (acoef, bcoef, ccoef) = self.d2pole_pf(flp, blp, rlpg);
        self.rlpa = i32::from(acoef);
        self.rlpb = bcoef;
        self.rlpc = ccoef;

        // vtm3.c:2054-2061: cascade fourth formant.
        let f4c = spdeftochip[SPD_R4CB]; /*  1 */
        let b4c = spdeftochip[SPD_R4CC]; /*  2 */
        if i64::from(f4c) > i64::from(self.uiSampleRate >> 1) - 100 {
            self.R4cb = 0;
        } else {
            let (_, bcoef, ccoef) = self.d2pole_cf45(f4c, b4c, 0);
            self.R4cb = bcoef;
            self.R4cc = ccoef;
        }

        // vtm3.c:2067-2075: cascade fifth formant.
        let f5c = spdeftochip[SPD_R5CB]; /*  3 */
        let b5c = spdeftochip[SPD_R5CC]; /*  4 */
        if i64::from(f5c) > i64::from(self.uiSampleRate >> 1) - 100 {
            self.R5cb = 0;
        } else {
            let (_, bcoef, ccoef) = self.d2pole_cf45(f5c, b5c, 0);
            self.R5cb = bcoef;
            self.R5cc = ccoef;
        }

        // vtm3.c:2081-2084: parallel fourth formant.
        let f4p = spdeftochip[SPD_R4PB]; /*  5 */
        let b4p: i16 = 400;
        let (_, bcoef, ccoef) = self.d2pole_pf(f4p, b4p, 0);
        self.R4pb = bcoef;
        self.r4pc = ccoef;

        // vtm3.c:2090-2098: parallel fifth formant.
        let f5p = spdeftochip[SPD_R5PB]; /*  6 */
        let b5p: i16 = 500;
        if i64::from(f5p) >= i64::from(self.uiSampleRate >> 1) {
            self.R5pb = 0;
            self.r5pc = 0;
        } else {
            let (_, bcoef, ccoef) = self.d2pole_pf(f5p, b5p, 0);
            self.R5pb = bcoef;
            self.r5pc = ccoef;
        }

        // vtm3.c:2101-2108: parallel sixth formant.
        let f6p: i16 = match self.uiSampleRateChange {
            SampleRateChange::Increase => 4900,
            SampleRateChange::Decrease => 3900,
            SampleRateChange::NoChange => 4400,
        };
        let (_, bcoef, ccoef) = self.d2pole_pf(f6p, 1200, 0);
        self.R6pb = bcoef;
        self.r6pc = ccoef;

        // vtm3.c:2125-2142: jitter keeps the sign it currently has, and is a
        // time, so it is scaled with the sample rate.
        if self.t0jitr < 0 {
            self.t0jitr = (-i32::from(spdeftochip[SPD_T0JIT])) as i16; /*  8 */
        } else {
            self.t0jitr = spdeftochip[SPD_T0JIT];
        }
        match self.uiSampleRateChange {
            SampleRateChange::Increase => {
                self.t0jitr =
                    (frac1mul(i32::from(self.rate_scale), i32::from(self.t0jitr)) << 1) as i16;
            }
            SampleRateChange::Decrease => {
                self.t0jitr = frac1mul(i32::from(self.rate_scale), i32::from(self.t0jitr)) as i16;
            }
            SampleRateChange::NoChange => {}
        }

        // vtm3.c:2149-2158: gains of the cascade resonators.
        let a5gain = spdeftochip[SPD_R5CA]; /*  9  */
        self.R5ca = i32::from(amptable(a5gain));
        let a4gain = spdeftochip[SPD_R4CA]; /*  10 */
        self.R4ca = i32::from(amptable(a4gain));
        let a3gain = spdeftochip[SPD_R3CA]; /*  11 */
        self.r3cg = amptable(a3gain);
        let a2gain = spdeftochip[SPD_R2CA]; /*  12 */
        self.r2cg = amptable(a2gain);
        let a1gain = spdeftochip[SPD_R1CA]; /*  13 */
        self.r1cg = amptable(a1gain);

        // vtm3.c:2165-2166: open phase of the glottal period.
        self.k1 = spdeftochip[SPD_NOPEN1]; /* 14 */
        self.k2 = spdeftochip[SPD_NOPEN2]; /* 15 */

        // vtm3.c:2172-2176: breathiness coefficient.
        self.Aturb = spdeftochip[SPD_ATURB]; /*  16 */
        if self.Aturb != 0 {
            self.Aturb = amptable(self.Aturb);
        } else {
            self.Aturb = 0;
        }

        // vtm3.c:2194: overall gain of frication source re other sources.
        self.AFgain = (i32::from(spdeftochip[SPD_AFGAIN]) + 8) as i16; /*  19 */

        // vtm3.c:2211-2212: overall gain of voicing source.
        let avg = spdeftochip[SPD_AZGAIN]; /*  21 */
        self.avgain = amptable(avg);

        // vtm3.c:2218-2222: overall gain of aspiration source.
        let apg = spdeftochip[SPD_APGAIN]; /*  22 */
        self.APgain = amptable(apg);
    }

    /// The sample-rate scaling of frequency and bandwidth shared by the three
    /// `d2pole_*` functions (`VTM/vtmfunc.h:121-133`, 207-219, 295-307).
    #[inline]
    fn scale_frequency_and_bandwidth(&self, frequency: i16, bandwidth: i16) -> (i16, i16) {
        match self.uiSampleRateChange {
            SampleRateChange::Decrease => (
                (frac1mul(i32::from(self.inv_rate_scale), i32::from(frequency)) << 1) as i16,
                (frac1mul(i32::from(self.inv_rate_scale), i32::from(bandwidth)) << 1) as i16,
            ),
            SampleRateChange::Increase => (
                frac1mul(i32::from(self.inv_rate_scale), i32::from(frequency)) as i16,
                frac1mul(i32::from(self.inv_rate_scale), i32::from(bandwidth)) as i16,
            ),
            SampleRateChange::NoChange => (frequency, bandwidth),
        }
    }

    /// `d2pole_cf45`, `VTM/vtmfunc.h:106-173`. Returns `(acoef, bcoef, ccoef)`.
    fn d2pole_cf45(&self, frequency: i16, bandwidth: i16, gain: i16) -> (i16, i16, i16) {
        let (frequency, bandwidth) = self.scale_frequency_and_bandwidth(frequency, bandwidth);

        /*  calculate radius = exp( -pi * T * bandwidth ). */
        let radius = radius_table(i32::from(bandwidth) >> 3);
        /*  bcoef = radius * 2 * cos( 2* pi * T * frequency ) */
        let bcoef = frac4mul(
            i32::from(radius),
            i32::from(cosine_table(i32::from(frequency) >> 3)),
        ) as i16;
        /*  Let ccoef = - r^2 */
        let ccoef = (-frac4mul(i32::from(radius), i32::from(radius))) as i16;
        /*  Let acoef = 1.0 - bcoef - ccoef */
        let temp: i32 = 4096 - i32::from(bcoef) - i32::from(ccoef);
        let acoef = (frac4mul(i32::from(gain), temp) << 1) as i16;

        (acoef, bcoef, ccoef)
    }

    /// `d2pole_cf123`, `VTM/vtmfunc.h:191-264`. Returns `(acoef, bcoef,
    /// ccoef)`; `acoef` is `S32` here.
    fn d2pole_cf123(&self, frequency: i16, bandwidth: i16, gain: i16) -> (i32, i16, i16) {
        let (mut frequency, mut bandwidth) =
            self.scale_frequency_and_bandwidth(frequency, bandwidth);

        /*  Zap resonator if center frequency above maximum frequency. */
        if frequency >= 4500 {
            frequency = (self.uiSampleRate >> 1) as i16;
            bandwidth = (self.uiSampleRate >> 2) as i16;
        }

        let radius = radius_table(i32::from(bandwidth) >> 3);
        let bcoef = frac4mul(
            i32::from(radius),
            i32::from(cosine_table(i32::from(frequency) >> 3)),
        ) as i16;
        let ccoef = (-frac4mul(i32::from(radius), i32::from(radius))) as i16;
        let temp: i32 = 4096 - i32::from(bcoef) - i32::from(ccoef);
        let acoef: i32 = frac4mul(i32::from(gain), temp) << 1;

        (acoef, bcoef, ccoef)
    }

    /// `d2pole_pf`, `VTM/vtmfunc.h:280-347`. Returns `(acoef, bcoef, ccoef)`.
    fn d2pole_pf(&self, frequency: i16, bandwidth: i16, gain: i16) -> (i16, i16, i16) {
        let (frequency, bandwidth) = self.scale_frequency_and_bandwidth(frequency, bandwidth);

        let radius = radius_table(i32::from(bandwidth) >> 3);
        let bcoef = frac4mul(
            i32::from(radius),
            i32::from(cosine_table(i32::from(frequency) >> 3)),
        ) as i16;
        let ccoef = (-frac4mul(i32::from(radius), i32::from(radius))) as i16;
        let temp: i32 = 4096 - i32::from(bcoef) - i32::from(ccoef);
        let acoef = (frac4mul(i32::from(gain), temp) << 1) as i16;

        (acoef, bcoef, ccoef)
    }

    /// `speech_waveform_generator`, `VTM/vtm3.c:479-1848`.
    ///
    /// `frame` is the 45-word voice frame as `VTM/vtmiont.c:1351` passes it
    /// (after hlsyn). `ksd_vol_att` is `pKsd_t->vol_att`, the volume setting
    /// (100 is unity). Returns the frame's samples.
    pub fn speech_waveform_generator(
        &mut self,
        frame: &[i16; VOICE_PARS],
        ksd_vol_att: i32,
    ) -> &[i16] {
        // vtm3.c:597. The C reads the frame in place and writes to it below.
        self.variabpars = *frame;

        // vtm3.c:614-620.
        let mut ksd_vol_att = ksd_vol_att;
        if ksd_vol_att > 140 {
            ksd_vol_att = 140;
        }
        if ksd_vol_att <= 0 {
            ksd_vol_att = 0;
        }
        let vol_att: i32 = INT_VOLUME_TABLE[ksd_vol_att as usize];

        // vtm3.c:625-641: the first frame after a speaker definition is forced
        // to silence.
        if self.ldspdef == 1 {
            self.ldspdef += 1;
            self.variabpars[OUT_AV] = 0;
            self.variabpars[OUT_AP] = 0;
            self.variabpars[OUT_A2] = 0;
            self.variabpars[OUT_A3] = 0;
            self.variabpars[OUT_A4] = 0;
            self.variabpars[OUT_A5] = 0;
            self.variabpars[OUT_A6] = 0;
            self.variabpars[OUT_AB] = 0;
            self.variabpars[OUT_AP] = 0;
            self.avlin = 0;
        }

        if self.ldspdef >= 3 {
            self.ldspdef -= 1;
        }

        // vtm3.c:661-675: T0inS4 is a time, so it is scaled if fs != 10K.
        let mut T0inS4: i16 = self.variabpars[OUT_T0];
        match self.uiSampleRateChange {
            SampleRateChange::Increase => {
                T0inS4 = (frac1mul(i32::from(self.rate_scale), i32::from(T0inS4)) << 1) as i16;
            }
            SampleRateChange::Decrease => {
                T0inS4 = frac1mul(i32::from(self.rate_scale), i32::from(T0inS4)) as i16;
            }
            SampleRateChange::NoChange => {}
        }

        // vtm3.c:683-713.
        let F1inHZ: i16 = self.variabpars[OUT_F1];
        let F2inHZ: i16 = self.variabpars[OUT_F2];
        let F3inHZ: i16 = self.variabpars[OUT_F3];

        let B1inHZ: i16 = self.variabpars[OUT_B1];
        let B2inHZ: i16 = self.variabpars[OUT_B2];
        let B3inHZ: i16 = self.variabpars[OUT_B3];
        let AVinDB: i16 = self.variabpars[OUT_AV];
        let APinDB: i16 = self.variabpars[OUT_AP];
        let A2inDB: i16 = self.variabpars[OUT_A2];
        let A3inDB: i16 = self.variabpars[OUT_A3];
        let A4inDB: i16 = self.variabpars[OUT_A4];
        let mut A5inDB: i16 = self.variabpars[OUT_A5];
        let mut A6inDB: i16 = self.variabpars[OUT_A6];
        if self.uiSampleRate == 8000 || self.R5pb == 0 {
            if A5inDB > 40 {
                A6inDB = A5inDB;
                A5inDB = 0;
            }
        }
        let ABinDB: i16 = self.variabpars[OUT_AB];

        // vtm3.c:721-724 (NEW_TILT).
        let mut TILTDB: i16 = self.variabpars[OUT_TLT];
        if TILTDB < 0 {
            TILTDB = 0;
        }

        // vtm3.c:732-738: convert dB to linear.
        let mut APlin: i16 = amptable(APinDB);
        let mut r2pg: i16 = amptable(A2inDB);
        let mut r3pg: i16 = amptable(A3inDB);
        let mut r4pa: i16 = amptable(A4inDB);
        let mut r5pa: i16 = amptable(A5inDB);
        let mut r6pa: i16 = amptable(A6inDB);
        let mut ABlin: i16 = amptable(ABinDB);

        // vtm3.c:755-760.
        let ampsum: i16 = (i32::from(A2inDB)
            + i32::from(A3inDB)
            + i32::from(A4inDB)
            + i32::from(A5inDB)
            + i32::from(A6inDB)
            + i32::from(ABinDB)) as i16;
        if ampsum != 0 {
            self.par_count = 5;
        } else if self.par_count != 0 {
            self.par_count -= 1;
        }

        // vtm3.c:768-805: nasal antiresonator frequency and (HLSYN) bandwidth,
        // scaled for the sample rate.
        let mut FZinHZ: i16 = self.variabpars[OUT_FZ];
        let mut BZinHZ: i16 = 200;
        let FNPinHZ: i16 = self.variabpars[OUT_FNP];

        match self.uiSampleRateChange {
            SampleRateChange::Decrease => {
                FZinHZ = (frac1mul(i32::from(self.inv_rate_scale), i32::from(FZinHZ)) << 1) as i16;
                BZinHZ = (frac1mul(i32::from(self.inv_rate_scale), i32::from(BZinHZ)) << 1) as i16;
            }
            SampleRateChange::Increase => {
                FZinHZ = frac1mul(i32::from(self.inv_rate_scale), i32::from(FZinHZ)) as i16;
                BZinHZ = frac1mul(i32::from(self.inv_rate_scale), i32::from(BZinHZ)) as i16;
            }
            SampleRateChange::NoChange => {}
        }

        // vtm3.c:807.
        let Diplo: i16 = self.variabpars[OUT_DP];

        // vtm3.c:811-822.
        APlin = frac4mul(i32::from(APlin), i32::from(self.APgain)) as i16; /*  Scale asp by spdef GV */
        self.AFcgain = self.variabpars[OUT_GF];

        if self.AFcgain != 0 {
            self.AFcgain = (i32::from(self.AFcgain) + (i32::from(self.AFgain) - 55)) as i16;
            if self.AFcgain < 0 {
                self.AFcgain = 0;
            }
        }

        // vtm3.c:831-836: scale the frication amplitudes by spdef GF.
        let afc = i32::from(amptable(self.AFcgain));
        r2pg = frac1mul(i32::from(r2pg), afc) as i16;
        r3pg = frac1mul(i32::from(r3pg), afc) as i16;
        r4pa = frac1mul(i32::from(r4pa), afc) as i16;
        r5pa = frac1mul(i32::from(r5pa), afc) as i16;
        r6pa = frac1mul(i32::from(r6pa), afc) as i16;
        ABlin = frac4mul(i32::from(ABlin), afc) as i16;

        // vtm3.c:842-843: variable parallel resonator R2.
        let b2p: i16 = 210;
        let (r2pa, r2pb, r2pc) = self.d2pole_pf(F2inHZ, b2p, r2pg);

        // vtm3.c:849-850: variable parallel resonator R3.
        let b3p: i16 = 280;
        let (r3pa, r3pb, r3pc) = self.d2pole_pf(F3inHZ, b3p, r3pg);

        // vtm3.c:861: MAIN LOOP. Calculate each sample of the current frame.
        for ns in 0..self.uiNumberOfSamplesPerFrame {
            let mut out: i32;
            let mut voice: i16 = 0;

            // vtm3.c:864-870.
            let impulse: i16;
            if ns == 0 && self.variabpars[OUT_BRST] >= 1 {
                self.par_count = 5;
                impulse = -2345;
            } else {
                impulse = 0;
            }

            // vtm3.c:880-902 (NEW_NOISE): noise generator.
            self.randomx = (i32::from(self.randomx)
                .wrapping_mul(20077)
                .wrapping_add(12345)) as i16;
            let noisef: i16 = self.randomx >> 2;
            /*  Tilt down aspiration noise spectrum at high freqs by low-pass
            filtering. */
            let mut noise: i16 =
                (i32::from(noisef) + frac1mul(24576, i32::from(self.nolast))) as i16;
            self.nolast = noisef;

            /*  Amplitude modulate noise. Reduce noise amplitude during the
            second half of the glottal period if "avlin" > 0. */
            if self.nper < self.nmod {
                noise >>= 1;
            }

            /*  Random number for breathiness (first diff preemphasis) */
            let noiseb: i16 = (i32::from(noise) - i32::from(self.noblast)) as i16;
            self.noblast = noise;

            // vtm3.c:950-1381: glottal pulse at 4 times the output rate.
            for _nsr4 in 0..4 {
                // vtm3.c:979-1028: voicing has fixed waveshape, at**2 - bt**3.
                if i32::from(self.nper) > i32::from(self.T0) - i32::from(self.nopen) {
                    self.a = (i32::from(self.a) - i32::from(self.b)) as i16;
                    /*  Differentiated glottal flow. */
                    self.voice0 = (i32::from(self.voice0) + i32::from(self.a >> 4)) as i16;
                    /*  Delay action of "avlin" change. */
                    self.avlind = self.avlin;
                } else {
                    /* Reset tilt filter at glottal open time */
                    if self.nper == self.topen {
                        let mut temp: i16 = TILTDB;
                        if temp < 2 {
                            temp = 1;
                        }
                        if temp > 41 {
                            temp = 41;
                        }

                        let BWtilt: i16 = NTILTF[temp as usize];
                        /* 0.6 (fold into table)*/
                        let Ftilt: i16 = ((9831 * i32::from(BWtilt)) >> 14) as i16;
                        let mut rtltg: i16 = 4096;

                        /* Make gain approx. constant at f=300 rather than at
                        f=0 */
                        if temp > 10 {
                            rtltg = (i32::from(rtltg)
                                + ((i32::from(temp) - 10) * (i32::from(temp) - 10) * 4))
                                as i16;
                        }
                        let (acoef, bcoef, ccoef) = self.d2pole_pf(Ftilt, BWtilt, rtltg);
                        self.rtca = acoef;
                        self.rtcb = bcoef;
                        self.rtcc = ccoef;
                    }

                    self.voice0 = 0;
                }

                // vtm3.c:1038-1040: scale the glottal waveform.
                voice = frac4mul(i32::from(self.avlind), i32::from(self.voice0)) as i16;
                voice = frac4mul(i32::from(voice), i32::from(self.avgain)) as i16;

                // vtm3.c:1048-1364: parameters updated pitch synchronously.
                if self.nper == self.T0 {
                    /*  Reset period when 'nper' reaches T0, glottis about to
                    open. */
                    self.nper = 0;

                    /*  'avlin' moved to 'avlind' after half period. */
                    self.avlin = amptable(AVinDB);

                    // vtm3.c:1069-1075.
                    self.T0 = T0inS4;
                    self.T0 = (i32::from(self.T0)
                        + frac4mul(i32::from(self.t0jitr), i32::from(self.T0)))
                        as i16; /*  Add jitter, if any. */
                    self.t0jitr = (-i32::from(self.t0jitr)) as i16; /*  Change sign for alternating jitter. */

                    // vtm3.c:1079-1098: double pulsing.
                    if Diplo == 0 {
                        self.dpulse = 0;
                    } else {
                        if self.dpulse > 0 {
                            /* Open phase is at end of period */
                            self.dpulse = (-i32::from(self.dpulse)) as i16;
                        } else {
                            /* Dur of closed phase in samples*4 */
                            let mut temp: i16 = (i32::from(self.T0) - i32::from(self.nopen)) as i16;
                            if temp < 1 {
                                temp = 1;
                            }
                            self.dpulse = ((i32::from(temp) * i32::from(Diplo)) / 100) as i16;
                        }

                        /* Add double-pulsing delay to voicing period */
                        self.T0 = (i32::from(self.T0) - i32::from(self.dpulse)) as i16;
                    }

                    // vtm3.c:1104.
                    self.aturb1 = self.Aturb;

                    // vtm3.c:1138-1141: uses the previous period's nopen.
                    self.nmod = 0;
                    if self.avlin > 0 {
                        self.nmod = self.nopen;
                    }

                    // vtm3.c:1150-1163 (HLSYN).
                    self.nopen = (frac1mul(i32::from(self.k1), i32::from(self.T0))
                        + i32::from(self.k2)) as i16; /*  in open part of period */
                    match self.uiSampleRateChange {
                        SampleRateChange::Increase => {
                            self.nopen =
                                (frac1mul(i32::from(self.rate_scale), i32::from(self.nopen)) << 1)
                                    as i16;
                        }
                        SampleRateChange::Decrease => {
                            self.nopen =
                                frac1mul(i32::from(self.rate_scale), i32::from(self.nopen)) as i16;
                        }
                        SampleRateChange::NoChange => {}
                    }

                    // vtm3.c:1171-1178.
                    if self.nopen < 40 {
                        self.nopen = 40; /*  Min is 40 */
                    } else if self.nopen > 263 {
                        self.nopen = 263; /*  Max is 263 */
                    }

                    if i32::from(self.nopen) >= ((i32::from(self.T0) * 3) >> 2) {
                        self.nopen = ((i32::from(self.T0) * 3) >> 2) as i16; /*  or 3/4 T0 */
                    }

                    // vtm3.c:1193.
                    self.topen = (i32::from(self.T0) - i32::from(self.nopen)) as i16;

                    // vtm3.c:1207-1220: reset a & b, which determine shape of
                    // glottal waveform. Let a = (b * nopen) / 3 without doing
                    // the divide.
                    self.b = b0(i32::from(self.nopen) - 40);
                    let mut temp: i16 = (i32::from(self.b) + 1) as i16; //Yes the plus one is necessary

                    if self.nopen > 95 {
                        temp = (i32::from(temp) * i32::from(self.nopen)) as i16;
                        self.a = frac1mul(10923, i32::from(temp)) as i16;
                    } else {
                        temp = frac1mul(10923, i32::from(temp)) as i16;
                        self.a = (i32::from(temp) * i32::from(self.nopen)) as i16;
                    }

                    // vtm3.c:1230 (NEW_VTM, HLSYN): nasal pole.
                    let (acoef, bcoef, ccoef) = self.d2pole_cf123(FNPinHZ, 200, 18596);
                    self.rnpa = acoef as i16;
                    self.rnpb = bcoef;
                    self.rnpc = ccoef;

                    // vtm3.c:1243-1252: variable cascade resonators.
                    if self.R1ca > 16383 {
                        self.R1ca = 16383;
                    }

                    let (acoef, bcoef, ccoef) = self.d2pole_cf123(F3inHZ, B3inHZ, self.r3cg);
                    self.R3ca = acoef;
                    self.r3cb = bcoef;
                    self.r3cc = ccoef;
                    let (acoef, bcoef, ccoef) = self.d2pole_cf123(F2inHZ, B2inHZ, self.r2cg);
                    self.R2ca = acoef;
                    self.r2cb = bcoef;
                    self.r2cc = ccoef;
                    let (acoef, bcoef, ccoef) = self.d2pole_cf123(F1inHZ, B1inHZ, self.r1cg);
                    self.R1ca = acoef as i16;
                    self.r1cb = bcoef;
                    self.r1cc = ccoef;
                    if self.R2ca < 0 {
                        self.R2ca += 1;
                    }

                    // vtm3.c:1260: scale up R1 gain here.
                    self.R1ca = (i32::from(self.R1ca) << 1) as i16;

                    // vtm3.c:1355-1359 (HLSYN): nasal zero.
                    if self.lastFZinHZ != FZinHZ {
                        let (sacoef, sbcoef, sccoef) =
                            setzeroabc(i32::from(FZinHZ), i32::from(BZinHZ), 500);
                        self.rnza = sacoef;
                        self.rnzb = sbcoef;
                        self.rnzc = sccoef;
                        self.lastFZinHZ = FZinHZ;
                    }
                }

                // vtm3.c:1376-1380: downsampling low-pass filter.
                two_pole_filter(
                    i32::from(voice),
                    &mut self.rlpd1,
                    &mut self.rlpd2,
                    self.rlpa,
                    i32::from(self.rlpb),
                    i32::from(self.rlpc),
                );

                voice = self.rlpd1 as i16;

                self.nper = (i32::from(self.nper) + 1) as i16;
            }

            // vtm3.c:1402-1420.
            if (i32::from(self.avlind) + i32::from(self.avlin) + i32::from(APlin)) != 0 {
                self.cas_count = 80;
            } else if self.cas_count != 0 {
                self.cas_count -= 1;
            }

            if self.cas_count == 0 {
                self.rtca = 0;
                self.rtd1 = 0;
                self.rtd2 = 0;
                out = 0;
                // goto skip_cascade
            } else {
                // vtm3.c:1434-1435 (NEW_TILT): tilt spectrum of voicing source
                // down by soft low-pass filtering. rtd1 and rtd2 are S16.
                let mut rtd1 = i32::from(self.rtd1);
                let mut rtd2 = i32::from(self.rtd2);
                two_pole_filter(
                    i32::from(voice),
                    &mut rtd1,
                    &mut rtd2,
                    i32::from(self.rtca),
                    i32::from(self.rtcb),
                    i32::from(self.rtcc),
                );
                self.rtd1 = rtd1 as i16;
                self.rtd2 = rtd2 as i16;
                voice = self.rtd1;

                // vtm3.c:1453-1457: add breathiness, then aspiration.
                if self.avlind > 20 {
                    voice = (i32::from(voice) + frac1mul(i32::from(self.aturb1), i32::from(noiseb)))
                        as i16;
                }

                voice = (i32::from(voice) + frac1mul(i32::from(APlin), i32::from(noise))) as i16;

                // vtm3.c:1480: nasal antiresonator of cascade vocal tract.
                let rnzout: i32 = two_zero_filter(
                    i32::from(voice),
                    &mut self.rnzd1,
                    &mut self.rnzd2,
                    self.rnza,
                    i32::from(self.rnzb),
                    i32::from(self.rnzc),
                );

                // vtm3.c:1488: nasal resonator of cascade vocal tract.
                two_pole_filter(
                    rnzout,
                    &mut self.rnpd1,
                    &mut self.rnpd2,
                    i32::from(self.rnpa),
                    i32::from(self.rnpb),
                    i32::from(self.rnpc),
                );

                // vtm3.c:1518: third formant.
                two_pole_filter(
                    self.rnpd1,
                    &mut self.r3cd1,
                    &mut self.r3cd2,
                    self.R3ca,
                    i32::from(self.r3cb),
                    i32::from(self.r3cc),
                );

                // vtm3.c:1527-1534: fifth formant.
                if self.R5cb != 0 {
                    two_pole_filter(
                        self.r3cd1,
                        &mut self.r5cd1,
                        &mut self.r5cd2,
                        self.R5ca,
                        i32::from(self.R5cb),
                        i32::from(self.R5cc),
                    );
                } else {
                    self.r5cd1 = self.r3cd1;
                }

                // vtm3.c:1542-1549: fourth formant.
                if self.R4cb != 0 {
                    two_pole_filter(
                        self.r5cd1,
                        &mut self.r4cd1,
                        &mut self.r4cd2,
                        self.R4ca,
                        i32::from(self.R4cb),
                        i32::from(self.R4cc),
                    );
                } else {
                    self.r4cd1 = self.r5cd1;
                }

                // vtm3.c:1559: second formant.
                two_pole_filter(
                    self.r4cd1,
                    &mut self.r2cd1,
                    &mut self.r2cd2,
                    self.R2ca,
                    i32::from(self.r2cb),
                    i32::from(self.r2cc),
                );

                // vtm3.c:1568: first formant of cascade vocal tract.
                two_pole_filter(
                    self.r2cd1,
                    &mut self.r1cd1,
                    &mut self.r1cd2,
                    i32::from(self.R1ca),
                    i32::from(self.r1cb),
                    i32::from(self.r1cc),
                );

                out = self.r1cd1;
            }

            // skip_cascade: vtm3.c:1575.
            // PARALLEL VOCAL TRACT, excited by the frication noise source.
            // Outputs are added with alternating sign.
            if self.par_count != 0 {
                // vtm3.c:1604-1606: sixth formant.
                two_pole_filter_noise_plus_impulse(
                    noise,
                    impulse,
                    &mut self.r6pd1,
                    &mut self.r6pd2,
                    i32::from(r6pa),
                    i32::from(self.R6pb),
                    i32::from(self.r6pc),
                );

                out = self.r6pd1.wrapping_sub(out);

                // vtm3.c:1615-1624: fifth formant.
                if self.uiSampleRate > 9600 && (self.R5pb | self.r5pc) != 0 {
                    two_pole_filter_noise_plus_impulse(
                        noise,
                        impulse,
                        &mut self.r5pd1,
                        &mut self.r5pd2,
                        i32::from(r5pa),
                        i32::from(self.R5pb),
                        i32::from(self.r5pc),
                    );
                } else {
                    self.r5pd1 = 0;
                }

                out = self.r5pd1.wrapping_sub(out);

                // vtm3.c:1630-1639: fourth formant.
                if (self.R4pb | self.r4pc) != 0 {
                    two_pole_filter_noise_plus_impulse(
                        noise,
                        impulse,
                        &mut self.r4pd1,
                        &mut self.r4pd2,
                        i32::from(r4pa),
                        i32::from(self.R4pb),
                        i32::from(self.r4pc),
                    );
                } else {
                    self.r4pd1 = 0;
                }

                out = self.r4pd1.wrapping_sub(out);

                // vtm3.c:1645-1647: third formant.
                two_pole_filter_noise_plus_impulse(
                    noise,
                    impulse,
                    &mut self.r3pd1,
                    &mut self.r3pd2,
                    i32::from(r3pa),
                    i32::from(r3pb),
                    i32::from(r3pc),
                );

                out = self.r3pd1.wrapping_sub(out);

                // vtm3.c:1653-1655: second formant.
                two_pole_filter_noise_plus_impulse(
                    noise,
                    impulse,
                    &mut self.r2pd1,
                    &mut self.r2pd2,
                    i32::from(r2pa),
                    i32::from(r2pb),
                    i32::from(r2pc),
                );

                out = self.r2pd1.wrapping_sub(out);

                // vtm3.c:1657-1659: bypass path.
                let about: i16 = frac1mul(i32::from(ABlin), i32::from(noise)) as i16;

                out = i32::from(about).wrapping_sub(out);

                // vtm3.c:1661-1664.
                if self.variabpars[OUT_BRST] == 1 {
                    out = out.wrapping_sub(i32::from(impulse >> 6));
                } else if self.variabpars[OUT_BRST] == 2 {
                    out = out.wrapping_sub(i32::from(impulse >> 2));
                }
            }

            // skip_parallel: vtm3.c:1666-1682. With voicing off in a silence
            // phoneme, ramp the gain down to choke limit cycles.
            if self.avlind == 0 && (i32::from(self.variabpars[OUT_PH]) & PVALUE) == 0 {
                self.rampdown = (i32::from(self.rampdown) + 200) as i16;
                if self.rampdown >= 4096 {
                    self.rampdown = 4096;
                }
                out = frac4mul(out, 4096 - i32::from(self.rampdown));
            } else {
                self.rampdown = 0;
            }

            // vtm3.c:1750-1755: bDoTuning is FALSE (vtmiont.c:497). There is no
            // clipping; the S32 result is stored into the S16 iwave.
            out = frac1mul(out, vol_att);
            self.iwave[ns] = out as i16;
        }

        &self.iwave[..self.uiNumberOfSamplesPerFrame]
    }
}

/// `amptable[db]`, `VTM/vtmtable.h:216-227`.
#[inline]
fn amptable(db: i16) -> i16 {
    AMPTABLE[usize::try_from(db).expect("dB word below 0 indexes amptable out of bounds")]
}

/// `cosine_table[index]`, `VTM/vtmtable.h:244-371`.
#[inline]
fn cosine_table(index: i32) -> i16 {
    COSINE_TABLE
        [usize::try_from(index).expect("negative frequency indexes cosine_table out of bounds")]
}

/// `radius_table[index]`, `VTM/vtmtable.h:381-508`.
#[inline]
fn radius_table(index: i32) -> i16 {
    RADIUS_TABLE
        [usize::try_from(index).expect("negative bandwidth indexes radius_table out of bounds")]
}

/// `B0[index]`, `VTM/vtmtable.h:88-134`.
#[inline]
fn b0(index: i32) -> i16 {
    B0[usize::try_from(index).expect("open phase under 40 samples indexes B0 out of bounds")]
}

/// `setzeroabc`, `VTM/vtm3.c:2537-2577`. Returns `(*sacoef, *sbcoef, *sccoef)`.
fn setzeroabc(f: i32, bw: i32, rnzg: i32) -> (i32, i16, i16) {
    /*    First compute ordinary resonator coefficients */
    /*    Let r  =  exp(-pi bw t) */
    let r: i16 = radius_table(bw >> 3);

    /* Let c  =  -r**2 */
    let ccoef: i16 = (-frac4mul(i32::from(r), i32::from(r))) as i16;

    /* Let b = r * 2*cos(2 pi f t) */
    let bcoef: i16 = frac4mul(i32::from(r), i32::from(cosine_table(f >> 3))) as i16;

    /* Let a = 1.0 - b - c */
    let acoef: i16 = (4096 - i32::from(bcoef) - i32::from(ccoef)) as i16;

    /* Now convert to antiresonator coefficients (a'=1/a, b'=-b/a, c'=-c/a) */
    let acoef = i32::from(acoef);
    let sacoef: i32 = (4096 * rnzg) / acoef;
    let sbcoef: i16 = (-((i32::from(bcoef) * rnzg) / acoef)) as i16;
    let sccoef: i16 = (-((i32::from(ccoef) * rnzg) / acoef)) as i16;

    (sacoef, sbcoef, sccoef)
}
