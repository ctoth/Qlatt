#![allow(clippy::too_many_arguments)]
#![allow(clippy::missing_safety_doc)]

use core::f32::consts::PI;
use klatt_wasm_common::export_alloc_fns;

export_alloc_fns!();

const LINEAR_TILT: [f32; 35] = [
    0.000, 0.100, 0.167, 0.233, 0.300, 0.367, 0.433, 0.467, 0.500, 0.533,
    0.567, 0.600, 0.633, 0.667, 0.700, 0.730, 0.750, 0.770, 0.790, 0.810,
    0.825, 0.840, 0.855, 0.870, 0.885, 0.900, 0.915, 0.925, 0.935, 0.945,
    0.955, 0.965, 0.975, 0.985, 0.995,
];

const DOUBLET: [f32; 3] = [0.0, 13_000_000.0, -13_000_000.0];
const KLSYN_AMPTABLE: [f32; 88] = [
    0.0, 0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 6.0, 7.0,
    8.0, 9.0, 10.0, 11.0, 13.0,
    14.0, 16.0, 18.0, 20.0, 22.0,
    25.0, 28.0, 32.0, 35.0, 40.0,
    45.0, 51.0, 57.0, 64.0, 71.0,
    80.0, 90.0, 101.0, 114.0, 128.0,
    142.0, 159.0, 179.0, 202.0, 227.0,
    256.0, 284.0, 318.0, 359.0, 405.0,
    455.0, 512.0, 568.0, 638.0, 719.0,
    811.0, 911.0, 1024.0, 1137.0, 1276.0,
    1438.0, 1622.0, 1823.0, 2048.0, 2273.0,
    2552.0, 2875.0, 3244.0, 3645.0, 4096.0,
    4547.0, 5104.0, 5751.0, 6488.0, 7291.0,
    8192.0, 9093.0, 10207.0, 11502.0, 12976.0,
    14582.0, 16384.0, 18350.0, 20644.0, 23429.0,
    26214.0, 29491.0, 32767.0,
];
const B0_TABLE: [f32; 224] = [
    1200.0, 1142.0, 1088.0, 1038.0, 991.0,
    948.0, 907.0, 869.0, 833.0, 799.0,
    768.0, 738.0, 710.0, 683.0, 658.0,
    634.0, 612.0, 590.0, 570.0, 551.0,
    533.0, 515.0, 499.0, 483.0, 468.0,
    454.0, 440.0, 427.0, 415.0, 403.0,
    391.0, 380.0, 370.0, 360.0, 350.0,
    341.0, 332.0, 323.0, 315.0, 307.0,
    300.0, 292.0, 285.0, 278.0, 272.0,
    265.0, 259.0, 253.0, 247.0, 242.0,
    237.0, 231.0, 226.0, 221.0, 217.0,
    212.0, 208.0, 204.0, 199.0, 195.0,
    192.0, 188.0, 184.0, 180.0, 177.0,
    174.0, 170.0, 167.0, 164.0, 161.0,
    158.0, 155.0, 153.0, 150.0, 147.0,
    145.0, 142.0, 140.0, 137.0, 135.0,
    133.0, 131.0, 128.0, 126.0, 124.0,
    122.0, 120.0, 119.0, 117.0, 115.0,
    113.0, 111.0, 110.0, 108.0, 106.0,
    105.0, 103.0, 102.0, 100.0, 99.0,
    97.0, 96.0, 95.0, 93.0, 92.0,
    91.0, 90.0, 88.0, 87.0, 86.0,
    85.0, 84.0, 83.0, 82.0, 80.0,
    79.0, 78.0, 77.0, 76.0, 75.0,
    75.0, 74.0, 73.0, 72.0, 71.0,
    70.0, 69.0, 68.0, 68.0, 67.0,
    66.0, 65.0, 64.0, 64.0, 63.0,
    62.0, 61.0, 61.0, 60.0, 59.0,
    59.0, 58.0, 57.0, 57.0, 56.0,
    56.0, 55.0, 55.0, 54.0, 54.0,
    53.0, 53.0, 52.0, 52.0, 51.0,
    51.0, 50.0, 50.0, 49.0, 49.0,
    48.0, 48.0, 47.0, 47.0, 46.0,
    46.0, 45.0, 45.0, 44.0, 44.0,
    43.0, 43.0, 42.0, 42.0, 41.0,
    41.0, 41.0, 41.0, 40.0, 40.0,
    39.0, 39.0, 38.0, 38.0, 38.0,
    38.0, 37.0, 37.0, 36.0, 36.0,
    36.0, 36.0, 35.0, 35.0, 35.0,
    35.0, 34.0, 34.0, 33.0, 33.0,
    33.0, 33.0, 32.0, 32.0, 32.0,
    32.0, 31.0, 31.0, 31.0, 31.0,
    30.0, 30.0, 30.0, 30.0, 29.0,
    29.0, 29.0, 29.0, 28.0, 28.0,
    28.0, 28.0, 27.0, 27.0,
];

#[repr(C)]
pub struct OversampledGlottalSource {
    sample_rate: f32,

    // Period tracking in 4x sample units
    t0: i32,
    nper: i32,
    nopen: i32,
    nmod: i32,
    skew: i32,

    // Source selection
    source: i32,

    // Noise generator state
    rng_state: u32,
    last_seed: i32,
    nlast: f32,

    // Tilt filter state
    decay: f32,
    onemd: f32,
    vlast: f32,

    // Natural source state
    a: f32,
    b: f32,
    vwave: f32,

    // Impulsive source filter
    rgla: f32,
    rglb: f32,
    rglc: f32,
    rgl_1: f32,
    rgl_2: f32,

    // Downsample low-pass filter
    rlpa: f32,
    rlpb: f32,
    rlpc: f32,
    rlp_1: f32,
    rlp_2: f32,

    // Triangular source state
    nfirsthalf: i32,
    nsecondhalf: i32,
    slopet1: f32,
    slopet2: f32,
    maxt1: f32,
    maxt2: f32,
    afinal: f32,

    // Cached gain values
    amp_breth: f32,
}

impl OversampledGlottalSource {
    pub fn new(sample_rate: f32) -> Self {
        let sr = if sample_rate > 0.0 { sample_rate } else { 44_100.0 };
        let (rlpa, rlpb, rlpc) = setabc(sr, 0.095 * sr, 0.063 * sr);
        Self {
            sample_rate: sr,
            t0: 0,
            nper: 0,
            nopen: 0,
            nmod: 0,
            skew: 0,
            source: 2,
            rng_state: 1,
            last_seed: 1,
            nlast: 0.0,
            decay: 0.0,
            onemd: 1.0,
            vlast: 0.0,
            a: 0.0,
            b: 0.0,
            vwave: 0.0,
            rgla: 1.0,
            rglb: 0.0,
            rglc: 0.0,
            rgl_1: 0.0,
            rgl_2: 0.0,
            rlpa,
            rlpb,
            rlpc,
            rlp_1: 0.0,
            rlp_2: 0.0,
            nfirsthalf: 1,
            nsecondhalf: 1,
            slopet1: 0.0,
            slopet2: 0.0,
            maxt1: 0.0,
            maxt2: 0.0,
            afinal: -7000.0,
            amp_breth: 0.0,
        }
    }

    fn reset(&mut self) {
        self.t0 = 0;
        self.nper = 0;
        self.nopen = 0;
        self.nmod = 0;
        self.skew = 0;
        self.nlast = 0.0;
        self.vlast = 0.0;
        self.a = 0.0;
        self.b = 0.0;
        self.vwave = 0.0;
        self.rgl_1 = 0.0;
        self.rgl_2 = 0.0;
        self.rlp_1 = 0.0;
        self.rlp_2 = 0.0;
    }

    fn set_seed(&mut self, seed: i32) {
        if seed != self.last_seed && seed > 0 {
            self.rng_state = seed as u32;
            self.last_seed = seed;
        }
    }

    fn rand31(&mut self) -> i32 {
        // ANSI C style 31-bit LCG to match rand() >> 17 usage in klsyn88.
        self.rng_state = (self.rng_state.wrapping_mul(1103515245).wrapping_add(12345)) & 0x7fffffff;
        self.rng_state as i32
    }

    fn db_to_linear(db: f32) -> f32 {
        // Reference: klsyn88 parwvt.h amptable.
        if !db.is_finite() || db < 0.0 {
            return 0.0;
        }
        let index = db.round().clamp(0.0, (KLSYN_AMPTABLE.len() - 1) as f32) as usize;
        KLSYN_AMPTABLE[index] * 0.001
    }

    fn pitch_sync_reset(
        &mut self,
        f0_hz: f32,
        av_db: f32,
        aturb_db: f32,
        tl_db: f32,
        open_quotient: f32,
        skew_param: f32,
        asymmetry: f32,
        source: i32,
    ) {
        self.source = source;
        if f0_hz.is_finite() && f0_hz > 0.0 {
            // Reference implementation: klsyn88 parwv.c (pitch_synch_par_reset).
            let t0 = (4.0 * self.sample_rate / f0_hz).floor() as i32;
            self.t0 = if t0 > 0 { t0 } else { 4 };

            self.amp_breth = Self::db_to_linear(aturb_db) * 0.1;

            let mut nopen = (self.t0 as f32 * (open_quotient / 100.0)).floor() as i32;

            if (source == 1 || source == 2) && nopen > 263 {
                nopen = 263;
            }
            if nopen >= (self.t0 - 1) {
                nopen = self.t0 - 2;
            }
            if nopen < 40 {
                nopen = 40;
            }
            self.nopen = nopen;
            self.nmod = if av_db > 0.0 { self.nopen } else { self.t0 };

            // Natural source coefficients
            // Reference: klsyn88 parwvt.h B0 table.
            let b0 = B0_TABLE[(nopen - 40) as usize];
            self.b = b0;
            self.a = (b0 * nopen as f32) * 0.333;

            // Impulsive source low-pass
            let bw = self.sample_rate / (nopen as f32);
            let (mut a, b, c) = setabc(self.sample_rate, 0.0, bw);
            let temp1 = nopen as f32 * 0.00833;
            a *= temp1 * temp1;
            self.rgla = a;
            self.rglb = b;
            self.rglc = c;

            // Triangular source
            if source == 3 {
                let assym = ((nopen as f32) * (asymmetry - 50.0) / 100.0) as i32;
                let mut nfirsthalf = (nopen >> 1) + assym;
                if nfirsthalf >= nopen {
                    nfirsthalf = nopen - 1;
                }
                if nfirsthalf <= 0 {
                    nfirsthalf = 1;
                }
                let nsecondhalf = nopen - nfirsthalf;

                self.nfirsthalf = nfirsthalf;
                self.nsecondhalf = nsecondhalf;
                self.afinal = -7000.0;
                self.maxt2 = self.afinal * 0.25;
                self.slopet2 = self.afinal / nsecondhalf as f32;
                self.vwave = -(self.afinal * nsecondhalf as f32) / nfirsthalf as f32;
                self.maxt1 = self.vwave * 0.25;
                self.slopet1 = -self.vwave / nfirsthalf as f32;
            }

            // Skewness
            let mut kskew = skew_param.round() as i32;
            let temp = self.t0 - nopen;
            if kskew > temp {
                kskew = temp;
            }
            if self.skew >= 0 {
                self.skew = kskew;
            } else {
                self.skew = -kskew;
            }
            self.t0 += self.skew;
            self.skew = -self.skew;

            // Tilt filter update
            let mut tilt = tl_db.round() as i32;
            if tilt < 0 { tilt = 0; }
            if tilt > 34 { tilt = 34; }
            self.decay = LINEAR_TILT[tilt as usize];
            self.onemd = 1.0 - self.decay;
        } else {
            self.t0 = 4;
            self.nmod = self.t0;
            self.amp_breth = 0.0;
            self.a = 0.0;
            self.b = 0.0;
            self.nopen = 0;
        }
    }

    fn process_sample(
        &mut self,
        f0_hz: f32,
        av_db: f32,
        aturb_db: f32,
        tl_db: f32,
        open_quotient: f32,
        skew_param: f32,
        asymmetry: f32,
        source: i32,
    ) -> (f32, f32) {
        if self.t0 <= 0 {
            self.pitch_sync_reset(
                f0_hz,
                av_db,
                aturb_db,
                tl_db,
                open_quotient,
                skew_param,
                asymmetry,
                source,
            );
        }

        // Noise generation
        // Reference implementation: klsyn88 parwv.c (gen_noise).
        let nrand = (self.rand31() >> 17) - 8192;
        let mut noise = (nrand as f32) + (0.75 * self.nlast);
        self.nlast = noise;
        if self.nper > self.nmod {
            noise *= 0.5;
        }

        let mut voice = 0.0;
        for _ in 0..4 {
            // Glottal source at 4x sample rate
            let sample = match self.source {
                1 => {
                    let v = if self.nper < 3 { DOUBLET[self.nper as usize] } else { 0.0 };
                    let out = self.rgla * v + self.rglb * self.rgl_1 + self.rglc * self.rgl_2;
                    self.rgl_2 = self.rgl_1;
                    self.rgl_1 = out;
                    out
                }
                2 => {
                    if self.nper < self.nopen {
                        self.a -= self.b;
                        self.vwave += self.a;
                        self.vwave * 0.03
                    } else {
                        self.vwave = 0.0;
                        0.0
                    }
                }
                3 => {
                    if self.nper < self.nopen {
                        if self.nper < self.nfirsthalf {
                            self.vwave += self.slopet1;
                            if self.vwave > self.maxt1 { self.maxt1 } else { self.vwave }
                        } else {
                            self.vwave += self.slopet2;
                            if self.vwave < self.maxt2 { self.maxt2 } else { self.vwave }
                        }
                    } else {
                        0.0
                    }
                }
                _ => {
                    if self.nper < self.nopen { -1750.0 } else { 1750.0 }
                }
            };

            if self.nper >= self.t0 {
                self.nper = 0;
                self.pitch_sync_reset(
                    f0_hz,
                    av_db,
                    aturb_db,
                    tl_db,
                    open_quotient,
                    skew_param,
                    asymmetry,
                    source,
                );
            }

            // Downsample low-pass filter
            let out = self.rlpa * sample + self.rlpb * self.rlp_1 + self.rlpc * self.rlp_2;
            self.rlp_2 = self.rlp_1;
            self.rlp_1 = out;
            voice = out;

            self.nper += 1;
        }

        // Tilt filter
        voice = (voice * self.onemd) + (self.vlast * self.decay);
        self.vlast = voice;

        // Breathiness during open phase
        if self.nper < self.nopen {
            voice += self.amp_breth * (nrand as f32);
        }

        (voice, noise)
    }

    fn process(
        &mut self,
        f0: &[f32],
        av: &[f32],
        aturb: &[f32],
        tilt: &[f32],
        open_quotient: &[f32],
        skew: &[f32],
        asymmetry: &[f32],
        source: &[f32],
        seed: &[f32],
        voice_out: &mut [f32],
        noise_out: &mut [f32],
    ) {
        let len = voice_out.len();
        let f0_len = f0.len();
        let av_len = av.len();
        let aturb_len = aturb.len();
        let tilt_len = tilt.len();
        let oq_len = open_quotient.len();
        let skew_len = skew.len();
        let asym_len = asymmetry.len();
        let source_len = source.len();
        let seed_len = seed.len();

        for i in 0..len {
            let f0_val = if f0_len == 0 { 0.0 } else if f0_len > 1 { f0[i % f0_len] } else { f0[0] };
            let av_val = if av_len == 0 { 0.0 } else if av_len > 1 { av[i % av_len] } else { av[0] };
            let aturb_val = if aturb_len == 0 { 0.0 } else if aturb_len > 1 { aturb[i % aturb_len] } else { aturb[0] };
            let tilt_val = if tilt_len == 0 { 0.0 } else if tilt_len > 1 { tilt[i % tilt_len] } else { tilt[0] };
            let oq_val = if oq_len == 0 { 50.0 } else if oq_len > 1 { open_quotient[i % oq_len] } else { open_quotient[0] };
            let skew_val = if skew_len == 0 { 0.0 } else if skew_len > 1 { skew[i % skew_len] } else { skew[0] };
            let asym_val = if asym_len == 0 { 50.0 } else if asym_len > 1 { asymmetry[i % asym_len] } else { asymmetry[0] };
            let source_val = if source_len == 0 { 2.0 } else if source_len > 1 { source[i % source_len] } else { source[0] };
            let seed_val = if seed_len == 0 { 1.0 } else if seed_len > 1 { seed[i % seed_len] } else { seed[0] };

            self.set_seed(seed_val.round() as i32);
            let (voice, noise) = self.process_sample(
                f0_val,
                av_val,
                aturb_val,
                tilt_val,
                oq_val,
                skew_val,
                asym_val,
                source_val.round() as i32,
            );
            voice_out[i] = voice;
            noise_out[i] = noise;
        }
    }
}

fn setabc(sample_rate: f32, freq: f32, bw: f32) -> (f32, f32, f32) {
    let r = (-PI * bw / sample_rate).exp();
    let c = -(r * r);
    let b = 2.0 * r * (2.0 * PI * freq / sample_rate).cos();
    let a = 1.0 - b - c;
    (a, b, c)
}

// FFI exports
#[no_mangle]
pub extern "C" fn oversampled_glottal_source_new(sample_rate: f32) -> *mut OversampledGlottalSource {
    Box::into_raw(Box::new(OversampledGlottalSource::new(sample_rate)))
}

#[no_mangle]
pub unsafe extern "C" fn oversampled_glottal_source_free(ptr: *mut OversampledGlottalSource) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub unsafe extern "C" fn oversampled_glottal_source_reset(ptr: *mut OversampledGlottalSource) {
    if let Some(src) = ptr.as_mut() {
        src.reset();
    }
}

#[no_mangle]
pub unsafe extern "C" fn oversampled_glottal_source_process(
    ptr: *mut OversampledGlottalSource,
    f0_ptr: *const f32,
    f0_len: usize,
    av_ptr: *const f32,
    av_len: usize,
    aturb_ptr: *const f32,
    aturb_len: usize,
    tilt_ptr: *const f32,
    tilt_len: usize,
    open_quotient_ptr: *const f32,
    open_quotient_len: usize,
    skew_ptr: *const f32,
    skew_len: usize,
    asymmetry_ptr: *const f32,
    asymmetry_len: usize,
    source_ptr: *const f32,
    source_len: usize,
    seed_ptr: *const f32,
    seed_len: usize,
    voice_ptr: *mut f32,
    noise_ptr: *mut f32,
    output_len: usize,
) {
    if ptr.is_null() || voice_ptr.is_null() || noise_ptr.is_null() || output_len == 0 {
        return;
    }

    let f0 = if f0_ptr.is_null() || f0_len == 0 { &[][..] } else { core::slice::from_raw_parts(f0_ptr, f0_len) };
    let av = if av_ptr.is_null() || av_len == 0 { &[][..] } else { core::slice::from_raw_parts(av_ptr, av_len) };
    let aturb = if aturb_ptr.is_null() || aturb_len == 0 { &[][..] } else { core::slice::from_raw_parts(aturb_ptr, aturb_len) };
    let tilt = if tilt_ptr.is_null() || tilt_len == 0 { &[][..] } else { core::slice::from_raw_parts(tilt_ptr, tilt_len) };
    let open_quotient = if open_quotient_ptr.is_null() || open_quotient_len == 0 { &[][..] } else { core::slice::from_raw_parts(open_quotient_ptr, open_quotient_len) };
    let skew = if skew_ptr.is_null() || skew_len == 0 { &[][..] } else { core::slice::from_raw_parts(skew_ptr, skew_len) };
    let asymmetry = if asymmetry_ptr.is_null() || asymmetry_len == 0 { &[][..] } else { core::slice::from_raw_parts(asymmetry_ptr, asymmetry_len) };
    let source = if source_ptr.is_null() || source_len == 0 { &[][..] } else { core::slice::from_raw_parts(source_ptr, source_len) };
    let seed = if seed_ptr.is_null() || seed_len == 0 { &[][..] } else { core::slice::from_raw_parts(seed_ptr, seed_len) };

    let voice_out = core::slice::from_raw_parts_mut(voice_ptr, output_len);
    let noise_out = core::slice::from_raw_parts_mut(noise_ptr, output_len);

    if let Some(src) = ptr.as_mut() {
        src.process(
            f0,
            av,
            aturb,
            tilt,
            open_quotient,
            skew,
            asymmetry,
            source,
            seed,
            voice_out,
            noise_out,
        );
    }
}
