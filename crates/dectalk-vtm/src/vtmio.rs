//! The per-packet path of DECtalk 4.63's VTM thread, between the PH packet
//! and the vocal tract model: `dapi/src/VTM/vtmiont.c:656-1319` as compiled
//! with `HLSYN` and without `USING_LLSYN`.
//!
//! For each voice packet it builds the `HLFrame`, runs
//! [`HLSynthesizeLLFrame`](crate::hlsyn::HLSynthesizeLLFrame), applies the
//! frication-gain and phoneme overrides DECtalk hard-codes after it
//! (lines 796-1219), and writes the low-level frame back into the packet
//! (lines 1292-1319). The result is the frame
//! [`Vtm::speech_waveform_generator`](crate::Vtm::speech_waveform_generator)
//! reads.
//!
//! Variable names follow the C. The overrides are keyed on control codes that
//! PH puts in the packet's `OUT_A2` word (1000, 1100, ..., 4000) and on
//! phoneme codes in `OUT_PH`.
//!
//! # Speaker setup
//!
//! For each speaker definition packet DECtalk runs
//! `initDefaultSpeakerValues`, `InitializeHLSynthesizer` and
//! `changeSpeakerValues` (`vtmiont.c:1641-1645`). The last one reads three
//! values that are not in the packet but in memory PH shares with the VTM
//! thread: the voice number `pKsd_t->last_voice`, and `NOM_Open_Quo` and
//! `Tiltm`, which PH's `setspdef` derives from the voice definition
//! (`PH/ph_vset.c:591`, 605, 672, 689) just before it sends the packet.
//! [`VtmIo::speaker_packet`] takes them as arguments.
//!
//! # Left out
//!
//! The values those two functions store for PH's own use (`STRESS_STEP`,
//! `UNSTRESS_PRESSURE`, `STRESS_PRESSURE`, `NOM_Sub_Pressure`,
//! `NOM_Fricative_Opening`, `NOM_Glot_Stop_Area`, `VOT_speed`,
//! `EndOfPhrase_Spread`): nothing in the VTM thread reads them. The
//! `EPSON_ARM7`, `KEN`, `GERMAN`, `DIANE`, `SUEB`, `why` and `TOMBUCHLER`
//! variants are not compiled into the stock binary; `OLD_VOICES` is
//! (`PH/ph_defs.h:121`).

#![allow(non_snake_case, non_upper_case_globals)]
// Kept in the shape of the C source so the two can be compared line by line.
#![allow(clippy::collapsible_else_if, clippy::if_same_then_else)]

use crate::hlsyn::{take_fault, HLSpeaker, HlError, HlSynth, LLFrame, OUT_SEX};
use crate::{
    OUT_A2, OUT_A3, OUT_A4, OUT_A5, OUT_A6, OUT_AB, OUT_AP, OUT_AV, OUT_B1, OUT_B2, OUT_B3, OUT_DP,
    OUT_F1, OUT_F2, OUT_F3, OUT_FNP, OUT_FZ, OUT_GF, OUT_PH, OUT_T0, OUT_TLT, SPDEF_PARS,
    VOICE_PARS,
};

/// `PH/ph_defs.h:598`.
pub const OUT_BNP: usize = 34;

/// `INCLUDE/kernel.h:423-425`.
pub const LANG_english: i32 = 0x0000;
pub const LANG_french: i32 = 0x0001;
pub const LANG_german: i32 = 0x0002;

// Phoneme codes, `(font << PSFONT) | code` with `PSFONT` 8
// (`CMD/cm_defs.h:233`); fonts and codes from `INCLUDE/l_all_ph.h:42-47`, 85-89,
// 119, 148, 208, 488; composed in `PH/p_all_ph.h:79-83`, 114, 144, 205, 382.
const USP_W: i32 = (0x01 << 8) | 24;
const USP_R: i32 = (0x01 << 8) | 26;
const USP_LL: i32 = (0x01 << 8) | 27;
const USP_HX: i32 = (0x01 << 8) | 28;
const USP_CZ: i32 = (0x01 << 8) | 58;
const UKP_HX: i32 = (0x02 << 8) | 28;
const GRP_H: i32 = (0x03 << 8) | 29;
const FP_R: i32 = (0x06 << 8) | 19;

// `currentSpeaker`, `PH/hlsynapi.h:456-468`.
pub const Paul: i32 = 0;
pub const Betty: i32 = 1;
pub const Harry: i32 = 2;
pub const Frank: i32 = 3;
pub const Dennis: i32 = 4;
pub const Kit: i32 = 5;
pub const Ursula: i32 = 6;
pub const Rita: i32 = 7;
pub const Wendy: i32 = 8;
pub const Chris: i32 = 9;

/// `initDefaultSpeakerValues`, `vtmiont.c:3430-3460`, the `HLSpeaker` part.
/// DECtalk calls it before `InitializeHLSynthesizer`, which then assigns
/// every one of these fields again.
pub fn initDefaultSpeakerValues(speaker: &mut HLSpeaker, NOM_Open_Quo: i16, Tiltm: i16) {
    speaker.OQm = f32::from(NOM_Open_Quo);
    speaker.B1m = 110.0;
    speaker.B2m = 110.0;
    speaker.B3m = 140.0;
    speaker.B4m = 230.0;
    speaker.B5m = 340.0;
    speaker.B2F = 250.0;
    speaker.B3F = 320.0;
    speaker.B4F = 260.0;
    speaker.B5F = 260.0;
    speaker.TLm = f32::from(Tiltm);
    speaker.F5 = 4500.0;
    speaker.F6 = 4700.0;
    speaker.B6F = 500.0;
}

/// `changeSpeakerValues`, `vtmiont.c:2899-3427`, the `HLSpeaker` part of the
/// branch compiled for Windows (the `#else` of `EPSON_ARM7`). `SpeakerName`
/// is a `currentSpeaker` value; any other number takes the `default` case.
pub fn changeSpeakerValues(
    speaker: &mut HLSpeaker,
    SpeakerName: i32,
    NOM_Open_Quo: i16,
    Tiltm: i16,
) {
    let NOM_Open_Quo = f32::from(NOM_Open_Quo);
    let Tiltm = f32::from(Tiltm);
    match SpeakerName {
        Paul => {
            // vtmiont.c:2976-3001 (the `#else` of KEN).
            speaker.OQm = NOM_Open_Quo;
            speaker.B1m = 90.0;
            speaker.B2m = 90.0;
            speaker.B3m = 130.0;
            speaker.B4m = 180.0;
            speaker.B5m = 200.0;
            speaker.B2F = 250.0;
            speaker.B3F = 320.0;
            speaker.B4F = 260.0;
            speaker.B5F = 270.0;
            speaker.TLm = Tiltm;
            speaker.F5 = 4500.0;
            speaker.F6 = 4800.0;
            speaker.B6F = 600.0;

            speaker.f1HiShift = 1180.0;
            speaker.acd_f1Break = 600.0;
        }
        Betty => {
            // vtmiont.c:3103-3128 (OLD_VOICES).
            speaker.OQm = NOM_Open_Quo;
            speaker.B1m = 120.0;
            speaker.B2m = 150.0;
            speaker.B3m = 200.0;
            speaker.B4m = 250.0;
            speaker.B5m = 350.0;
            speaker.B2F = 250.0;
            speaker.B3F = 220.0;
            speaker.B4F = 360.0;
            speaker.B5F = 500.0;
            speaker.TLm = Tiltm;
            speaker.F6 = 4900.0;
            speaker.B6F = 600.0;

            speaker.f1HiShift = 1180.0;
            speaker.acd_f1Break = 650.0;
        }
        Harry => {
            // vtmiont.c:3135-3143.
            speaker.OQm = NOM_Open_Quo;
            speaker.B1m = 100.0;
            speaker.B2m = 120.0;
            speaker.B3m = 130.0;
            speaker.TLm = Tiltm;
            speaker.F5 = 4400.0;
            speaker.F6 = 4990.0;
            speaker.B6F = 1200.0;
        }
        Kit => {
            // vtmiont.c:3159-3187.
            speaker.OQm = NOM_Open_Quo;
            speaker.B1m = 95.0;
            speaker.B2m = 130.0;
            speaker.B3m = 160.0;
            speaker.B4m = 180.0;
            speaker.B5m = 200.0;
            speaker.B2F = 250.0;
            speaker.B3F = 320.0;
            speaker.B4F = 260.0;
            speaker.B5F = 270.0;
            speaker.TLm = Tiltm;
            speaker.F5 = 4700.0;
            speaker.F6 = 4800.0;
            speaker.B6F = 1200.0;

            speaker.acd_f1Break = 950.0;
            speaker.f1HiShift = 1180.0;
        }
        Rita => {
            // vtmiont.c:3195-3215.
            speaker.OQm = NOM_Open_Quo;
            speaker.B1m = 100.0;
            speaker.B2m = 120.0;
            speaker.B3m = 100.0;
            speaker.F5 = 4800.0;
            speaker.F6 = 4800.0;
            speaker.B6F = 1200.0;
            speaker.TLm = Tiltm;

            speaker.f1HiShift = 1180.0;
            speaker.acd_f1Break = 650.0;
        }
        Frank => {
            // vtmiont.c:3224-3232.
            speaker.OQm = NOM_Open_Quo;
            speaker.B1m = 120.0;
            speaker.B2m = 110.0;
            speaker.B3m = 150.0;
            speaker.TLm = Tiltm;
            speaker.F5 = 4400.0;
            speaker.F6 = 4800.0;
            speaker.B6F = 1200.0;
        }
        Ursula => {
            // vtmiont.c:3253-3264.
            speaker.OQm = NOM_Open_Quo;
            speaker.B1m = 120.0;
            speaker.B2m = 130.0;
            speaker.B2F = 250.0;
            speaker.B3F = 220.0;
            speaker.B4F = 250.0;
            speaker.B5F = 200.0;
            speaker.TLm = Tiltm;
            speaker.F5 = 4650.0;
            speaker.F6 = 4800.0;
            speaker.B6F = 1200.0;
        }
        Wendy => {
            // vtmiont.c:3306-3317 (after the `why` block).
            speaker.OQm = NOM_Open_Quo;
            speaker.B1m = 120.0;
            speaker.B2m = 130.0;
            speaker.B2F = 250.0;
            speaker.B3F = 220.0;
            speaker.B4F = 250.0;
            speaker.B5F = 200.0;
            speaker.TLm = Tiltm;
            speaker.F5 = 4850.0;
            speaker.F6 = 4800.0;
            speaker.B6F = 1200.0;
        }
        Chris | Dennis => {
            // vtmiont.c:3332-3347 (Chris) and 3362-3377 (Dennis), which
            // assign the same values.
            speaker.OQm = NOM_Open_Quo;
            speaker.B1m = 70.0;
            speaker.B2m = 90.0;
            speaker.B3m = 130.0;
            speaker.B4m = 180.0;
            speaker.B5m = 200.0;
            speaker.B2F = 250.0;
            speaker.B3F = 320.0;
            speaker.B4F = 260.0;
            speaker.B5F = 270.0;
            speaker.TLm = Tiltm;
            speaker.F5 = 4500.0;
            speaker.F6 = 4800.0;
            speaker.B6F = 600.0;
        }
        _ => {
            // vtmiont.c:3395-3409.
            speaker.OQm = NOM_Open_Quo;
            speaker.B1m = 80.0;
            speaker.B2m = 90.0;
            speaker.B3m = 150.0;
            speaker.B4m = 230.0;
            speaker.B5m = 340.0;
            speaker.B2F = 250.0;
            speaker.B3F = 320.0;
            speaker.B4F = 400.0;
            speaker.B5F = 400.0;
            speaker.TLm = Tiltm;
            speaker.F5 = 4500.0;
            speaker.F6 = 4800.0;
            speaker.B6F = 1200.0;
        }
    }
}

/// The state `vtmiont.c` keeps between voice packets for hlsyn and for the
/// overrides: `VTM/vtminst.h:597-610`.
#[derive(Clone, Debug, Default)]
pub struct VtmIo {
    pub hl: HlSynth,
    in_region: i16,
    oldA2: i16,
    oldA3: i16,
    oldA4: i16,
    oldA5: i16,
    oldA6: i16,
    oldAB: i16,
    /// `supra_glot_press`: the mouth pressure of the last frame
    /// (`vtmiont.c:1218`).
    pub supra_glot_press: i16,
}

impl VtmIo {
    /// All zero, as in the `calloc`ed `VTM_T` (`vtmiont.c:447`).
    pub fn new() -> Self {
        Self::default()
    }

    /// The hlsyn part of handling a speaker definition packet,
    /// `vtmiont.c:1641-1645`. `InitializeHLSynthesizer` gets the packet's
    /// `sex` word (word `OUT_SEX` of the buffer the packet was read into).
    /// `last_voice`, `NOM_Open_Quo` and `Tiltm` are the shared values described
    /// in the module documentation.
    pub fn speaker_packet(
        &mut self,
        spdef: &[i16; SPDEF_PARS],
        last_voice: i32,
        NOM_Open_Quo: i16,
        Tiltm: i16,
    ) {
        initDefaultSpeakerValues(&mut self.hl.speaker, NOM_Open_Quo, Tiltm);
        self.hl.InitializeHLSynthesizer(spdef[OUT_SEX] != 0);
        changeSpeakerValues(&mut self.hl.speaker, last_voice, NOM_Open_Quo, Tiltm);
    }

    /// [`voice_packet`](Self::voice_packet) with fault reporting: `Err` if
    /// hlsyn read one of its tables out of bounds for this packet (see
    /// [`HlError`]). The frame such a call computed is discarded, and the
    /// state it leaves behind is not DECtalk's.
    ///
    /// The code of `vtmiont.c:796-1319` itself has no such read: it indexes no
    /// table, and its one division, `400000 / NF0` (line 1291), runs only for
    /// `NF0 >= 500`.
    pub fn try_voice_packet(
        &mut self,
        parambuff: &[i16; VOICE_PARS],
        lang_curr: i32,
    ) -> Result<[i16; VOICE_PARS], HlError> {
        take_fault();
        let frame = self.voice_packet(parambuff, lang_curr);
        match take_fault() {
            Some(error) => Err(error),
            None => Ok(frame),
        }
    }

    /// One voice packet, `vtmiont.c:656-1319`. `parambuff` is the PH packet;
    /// the returned frame is what the vocal tract model reads. `lang_curr` is
    /// `pKsd_t->lang_curr` (one of the `LANG_*` values).
    ///
    /// An out-of-bounds table read in hlsyn is left for
    /// [`take_fault`](crate::hlsyn::take_fault);
    /// [`try_voice_packet`](Self::try_voice_packet) returns it.
    pub fn voice_packet(
        &mut self,
        parambuff: &[i16; VOICE_PARS],
        lang_curr: i32,
    ) -> [i16; VOICE_PARS] {
        let mut parambuff = *parambuff;

        // vtmiont.c:660-718.
        self.hl.synthesize_packet(&parambuff);
        let llframe = &mut self.hl.llframe;

        // The packet buffer is `unsigned short` in the C.
        let A2 = i32::from(parambuff[OUT_A2] as u16);
        let PH = i32::from(parambuff[OUT_PH] as u16);

        // vtmiont.c:797-801.
        if A2 == 2000 && llframe.NAF > 40 {
            self.in_region = (i32::from(self.in_region) + 1) as i16;
        } else {
            self.in_region = 0;
        }

        // vtmiont.c:803-923.
        if A2 == 1000 {
            //dental
            set_gains(llframe, 30, 30, 0, 0, 0);
            llframe.NAB = 50;
        } else if A2 == 1100 {
            //dental--voiced
            set_gains(llframe, 40, 30, 0, 0, 0);
            llframe.NAB = 55;
        } else if A2 == 1200 {
            //dh th or dz weak burst
            set_gains(llframe, 0, 0, 0, 0, 40);
            llframe.NAB = 50;
        } else if A2 == 1300 {
            // Labial
            set_gains(llframe, 0, 0, 0, 0, 0);
            llframe.NAB = 50;
        } else if A2 == 2000 {
            //PALATEL
            if lang_curr == LANG_german {
                if llframe.NF2 > 2050 {
                    set_gains(llframe, 0, 43, 50, 40, 0);
                    llframe.NAB = 0;
                } else if llframe.NF2 > 1700 {
                    set_gains(llframe, 0, 45, 58, 40, 0);
                    llframe.NAB = 0;
                } else {
                    set_gains(llframe, 0, 48, 45, 35, 0);
                    llframe.NAB = 0;
                }
            } else {
                if llframe.NF2 > 2050 {
                    set_gains(llframe, 0, 42, 50, 40, 0);
                    llframe.NAB = 0;
                } else if llframe.NF2 > 1700 {
                    set_gains(llframe, 0, 45, 48, 40, 0);
                    llframe.NAB = 0;
                } else {
                    set_gains(llframe, 3, 48, 45, 35, 0);
                    llframe.NAB = 0;
                }
            }
        }

        // vtmiont.c:926-1077.
        if A2 == 2100 {
            //temp hack for tr blend
            llframe.NAH = 45;
        } else if A2 == 3000 {
            //alvelar
            if lang_curr == LANG_german {
                if llframe.NF3 > 2400 {
                    // NAB is left as it is here (vtmiont.c:945-952).
                    set_gains(llframe, 0, 0, 0, 50, 53);
                } else if llframe.NF3 < 2400 {
                    set_gains(llframe, 25, 25, 50, 0, 50);
                    llframe.NAB = 0;
                }
            } else if lang_curr == LANG_french {
                if llframe.NF3 > 2650 {
                    set_gains(llframe, 40, 40, 40, 30, 0);
                    llframe.NAB = 0;
                } else if llframe.NF3 > 2400 {
                    set_gains(llframe, 0, 0, 0, 0, 48);
                    llframe.NAB = 0;
                } else if llframe.NF3 < 2400 {
                    set_gains(llframe, 0, 0, 0, 0, 48);
                    llframe.NAB = 0;
                }
            } else {
                if llframe.NF3 > 2600 {
                    set_gains(llframe, 0, 0, 0, 40, 50);
                    llframe.NAB = 0;
                } else if llframe.NF3 > 2400 {
                    set_gains(llframe, 10, 10, 45, 30, 50);
                    llframe.NAB = 0;
                } else if llframe.NF3 < 2400 {
                    set_gains(llframe, 10, 10, 35, 50, 40);
                    llframe.NAB = 0;
                }
            }
        } else if A2 == 3300 {
            //voied fricative
            set_gains(llframe, 10, 10, 20, 60, 55);
            llframe.NAB = 0;
        } else if A2 == 3100 {
            //German alvelar TS
            set_gains(llframe, 10, 30, 30, 30, 50);
            llframe.NAB = 0;
        } else if A2 == 3200 {
            //affricate shift start ch and jh with a4 and then go to tables.
            // NAB is left as it is here (vtmiont.c:1067-1077).
            set_gains(llframe, 10, 30, 50, 30, 30);
        }

        // vtmiont.c:1079-1113: average with the previous frame's gains while
        // inside a palatal frication region.
        let temp2 = llframe.NA2F;
        let temp3 = llframe.NA3F;
        let temp4 = llframe.NA4F;
        let temp5 = llframe.NA5F;
        let temp6 = llframe.NA6F;
        let tempAB = llframe.NAB;

        if self.in_region != 0 && llframe.NAF > 40 {
            llframe.NA2F = ((i32::from(self.oldA2) + i32::from(llframe.NA2F)) >> 1) as i16;
            llframe.NA3F = ((i32::from(self.oldA3) + i32::from(llframe.NA3F)) >> 1) as i16;
            llframe.NA4F = ((i32::from(self.oldA4) + i32::from(llframe.NA4F)) >> 1) as i16;
            llframe.NA5F = ((i32::from(self.oldA5) + i32::from(llframe.NA5F)) >> 1) as i16;
            llframe.NA6F = ((i32::from(self.oldA6) + i32::from(llframe.NA6F)) >> 1) as i16;
            llframe.NAB = ((i32::from(self.oldAB) + i32::from(llframe.NAB)) >> 1) as i16;
        }

        if self.in_region != 0 {
            self.oldA2 = temp2;
            self.oldA3 = temp3;
            self.oldA4 = temp4;
            self.oldA5 = temp5;
            self.oldA6 = temp6;
            self.oldAB = tempAB;
        } else {
            self.oldA2 = 0;
            self.oldA3 = 0;
            self.oldA4 = 0;
            self.oldA5 = 0;
            self.oldA6 = 0;
            self.oldAB = 0;
        }

        // vtmiont.c:1116-1141 (without TOMBUCHLER).
        if PH == USP_HX {
            llframe.NA2F = 30;
        }
        if PH == UKP_HX || PH == GRP_H {
            llframe.NA2F = 30;
        }

        if PH == USP_CZ {
            llframe.NA5F = 30;
            llframe.NA4F = 30;
            llframe.NA3F = 30;
            llframe.NA2F = 50;
        }

        // vtmiont.c:1147-1178: for liquids.
        if A2 == 4000 {
            if PH == FP_R {
                llframe.NA5F = 30;
                llframe.NA4F = 35;
                llframe.NA3F = 30;
                llframe.NA2F = 50;
            } else if PH == USP_R || PH == USP_LL {
                llframe.NA4F = 15;
                llframe.NA3F = 20;
                llframe.NA2F = 45;
            } else if PH == USP_W {
                llframe.NA3F = 0;
                llframe.NA2F = 50;
            } else {
                llframe.NA3F = 0;
                llframe.NA2F = 0;
            }
        }

        // vtmiont.c:1198-1199.
        llframe.NB2 = (i32::from(llframe.NB2) + i32::from(parambuff[OUT_B2] as u16)) as i16;
        llframe.NB3 = parambuff[OUT_B3];

        // vtmiont.c:1215-1218.
        if llframe.NAF < 0 {
            llframe.NAF = 0;
        }

        self.supra_glot_press = llframe.NDB1;

        // vtmiont.c:1292-1319: write the low-level frame into the packet. B2
        // and B3 are not written back (lines 1321-1322 are commented out).
        if llframe.NF0 >= 500 {
            parambuff[OUT_T0] = (400000 / i32::from(llframe.NF0)) as i16;
        } else {
            parambuff[OUT_T0] = 500;
        }

        //test for new tongue body stuff
        if llframe.NF1 < 250 {
            llframe.NF1 = 250;
        }
        parambuff[OUT_F1] = llframe.NF1;
        parambuff[OUT_F2] = llframe.NF2;
        parambuff[OUT_F3] = llframe.NF3;
        parambuff[OUT_A2] = llframe.NA2F;
        parambuff[OUT_A3] = llframe.NA3F;
        parambuff[OUT_A4] = llframe.NA4F;
        parambuff[OUT_A5] = llframe.NA5F;
        parambuff[OUT_A6] = llframe.NA6F;
        parambuff[OUT_AB] = llframe.NAB;
        parambuff[OUT_FZ] = llframe.NFNZ;
        parambuff[OUT_FNP] = llframe.NFNP;
        parambuff[OUT_AV] = llframe.NAV;
        parambuff[OUT_GF] = llframe.NAF;
        parambuff[OUT_TLT] = llframe.NTL;
        parambuff[OUT_AV] = llframe.NAV;
        parambuff[OUT_AP] = llframe.NAH;
        parambuff[OUT_BNP] = llframe.NBNP;
        parambuff[OUT_DP] = llframe.NDI;
        parambuff[OUT_B1] = llframe.NB1;

        parambuff
    }
}

/// Assigns `NA2F`, `NA3F`, `NA4F`, `NA5F` and `NA6F`, the five frication
/// gains every override block of `vtmiont.c:803-1077` sets together.
fn set_gains(llframe: &mut LLFrame, a2: i16, a3: i16, a4: i16, a5: i16, a6: i16) {
    llframe.NA2F = a2;
    llframe.NA3F = a3;
    llframe.NA4F = a4;
    llframe.NA5F = a5;
    llframe.NA6F = a6;
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The second `P` line of `tests/fixtures/paul-cat.hl.txt`.
    fn paul_packet() -> [i16; VOICE_PARS] {
        let mut packet = [0i16; VOICE_PARS];
        packet[..33].copy_from_slice(&[
            0, 279, 0, 0, 0, 0, 0, 0, 0, 979, 0, 2091, 2702, 290, 300, 210, 280, 256, 4, 305, 290,
            0, 3500, 0, 0, 1410, 1000, 0, 1000, 200, 50, 0, 0,
        ]);
        packet
    }

    /// Without `InitializeHLSynthesizer` every speaker constant is zero, the
    /// circuit's coefficients are 0/0, and the NaN reaches `DT_f_sqrt`, which
    /// truncates it to `0x8000_0000` and would read `sqrttable[-pos/100]`.
    #[test]
    fn a_packet_without_speaker_setup_is_a_fault_not_a_panic() {
        let mut io = VtmIo::new();
        let error = io
            .try_voice_packet(&paul_packet(), LANG_english)
            .expect_err("fault");
        assert_eq!(error, HlError::SqrtTableIndex(i32::MIN / 100));
        assert_eq!(error.code(), -7);
    }

    #[test]
    fn a_fault_does_not_carry_over_to_the_next_packet() {
        let mut faulted = VtmIo::new();
        faulted
            .try_voice_packet(&paul_packet(), LANG_english)
            .expect_err("fault");

        // A fresh state with Perfect Paul's setup (`S` and `V` lines of
        // `tests/fixtures/paul-cat.hl.txt`) runs clean on the same thread.
        let mut spdef = [0i16; SPDEF_PARS];
        spdef[..24].copy_from_slice(&[
            3503, 260, 6000, 6000, 3550, 4850, 0, 87, 66, 58, 59, 76, 9800, 0, 0, 4100, 64, 87, 65,
            64, 0, 0, 0, 1,
        ]);
        let mut io = VtmIo::new();
        io.speaker_packet(&spdef, Paul, 0, 0);
        let mut unchecked = io.clone();
        let frame = io
            .try_voice_packet(&paul_packet(), LANG_english)
            .expect("no fault");
        // The checked call computes what the unchecked one does.
        assert_eq!(frame, unchecked.voice_packet(&paul_packet(), LANG_english));
        assert_eq!(take_fault(), None);
    }
}
