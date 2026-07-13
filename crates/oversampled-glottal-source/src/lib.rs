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

// --- Fixed-virtual-rate glottal source + decimation (browser-silence fix) ---
//
// klsyn88's reference C (`~/src/klsyn/c/parwv.c`, `pitch_synch_par_reset`,
// lines 590-627) clamps the glottal open-phase length (`nopen`) to a raw
// absolute 4x-tick count (263, floor 40) that is NEVER rescaled by `samrate`
// -- unlike other constants in the same file (`FLPhz`/`BLPhz`,
// parwv.c:333-334, explicitly rescaled by `samrate/10000`) -- and the
// reference's own warning text ("truncated to 6.6 ms" = 263/(4*10000))
// confirms this clamp implicitly assumes klsyn88's native ~10kHz reference
// rate. Driving this primitive from a real WebAudio context (44100/48000Hz)
// collapses the open-phase duty cycle toward inaudibility. Fix (Q's chosen
// direction B, see investigations/dectalk-klglott-worklet-voice.md and the
// implementation plan): run all internal tick-domain physics at a FIXED
// virtual sample rate safely above real device rates (so decimation is
// always downsampling, never upsampling), and decimate down to whatever the
// live device rate actually is.
const VIRTUAL_SAMPLE_RATE: f32 = 192_000.0;
// klsyn88's implicit reference rate for the nopen/B0 clamp (see above).
const NOPEN_REFERENCE_RATE: f32 = 10_000.0;
const TICK_RESCALE: f32 = VIRTUAL_SAMPLE_RATE / NOPEN_REFERENCE_RATE; // 19.2
const NOPEN_MAX_TICKS: i32 = 5050; // round(263.0 * TICK_RESCALE)
const NOPEN_MIN_TICKS: i32 = 768; // round(40.0 * TICK_RESCALE)

/// A single 2-pole all-pole IIR section using this crate's existing
/// `setabc`-derived coefficient convention (`out = a*x + b*y[-1] + c*y[-2]`,
/// same difference equation as the `rlpa/rlpb/rlpc` downsample filter and
/// `rgla/rglb/rglc` impulsive-source filter already in this file). Extracted
/// as a small helper so the antialiasing cascade below (2 sections x 2
/// channels) does not duplicate the difference equation four times.
#[derive(Clone, Copy, Default)]
struct TwoPoleSection {
    a: f32,
    b: f32,
    c: f32,
    y1: f32,
    y2: f32,
}

impl TwoPoleSection {
    fn set_coeffs(&mut self, a: f32, b: f32, c: f32) {
        self.a = a;
        self.b = b;
        self.c = c;
    }

    fn step(&mut self, x: f32) -> f32 {
        let y = self.a * x + self.b * self.y1 + self.c * self.y2;
        self.y2 = self.y1;
        self.y1 = y;
        y
    }

    fn reset_state(&mut self) {
        self.y1 = 0.0;
        self.y2 = 0.0;
    }
}

/// Two cascaded `TwoPoleSection`s: the antialiasing filter used to decimate
/// the fixed 192kHz internal glottal-source stream down to the device output
/// rate. A single 2-pole section (like the existing `rlpa/rlpb/rlpc` filter)
/// gives only ~12-13dB of rejection at 44.1/48kHz decimation ratios --
/// inadequate, especially for the noise channel, which previously had no
/// antialiasing filter at all. Cutoff is tied to the actual device Nyquist
/// (not a fixed historical ratio) and is near-critically-damped (`freq =
/// 0.0`) rather than the old resonant Q~1.5 tuning used by `rlpa/rlpb/rlpc`,
/// since this filter's only job is antialiasing, not timbre shaping --
/// labeled an engineering estimate; revisit if `npm run lint:audio`/`npm run
/// measure` show residual aliasing.
#[derive(Clone, Copy, Default)]
struct AaCascade {
    stage1: TwoPoleSection,
    stage2: TwoPoleSection,
}

impl AaCascade {
    fn set_coeffs(&mut self, a: f32, b: f32, c: f32) {
        self.stage1.set_coeffs(a, b, c);
        self.stage2.set_coeffs(a, b, c);
    }

    fn step(&mut self, x: f32) -> f32 {
        self.stage2.step(self.stage1.step(x))
    }

    fn reset_state(&mut self) {
        self.stage1.reset_state();
        self.stage2.reset_state();
    }
}

/// Solve for the `setabc(sample_rate, 0.0, bw)` bandwidth parameter that
/// makes an `AaCascade` (2 identical DC-centered 2-pole `TwoPoleSection`s,
/// used here purely as an antialiasing lowpass) land its actual -3dB point
/// at `cutoff_hz`, instead of assuming `bw == cutoff_hz` directly.
///
/// Round-1 delivered `aa_bw = 0.45 * device_rate` and passed it straight to
/// `setabc` as `bw`. A round-2 investigation (frequency-response calculation
/// reimplementing `setabc`'s pole formula, corroborated numerically here via
/// bisection before deriving this closed form) found that mapping puts the
/// cascade's real -3dB point ~4.6x more aggressive than intended (e.g. at
/// device_sr=44100, intended cutoff ~19845Hz landed at ~4339Hz) -- because a
/// single freq=0 `TwoPoleSection` is a *double* real pole (not a single
/// pole), and this file cascades *two* of them (4 poles total), so `bw`
/// (which `setabc` calibrates as a single-resonance -3dB half-bandwidth) is
/// nowhere near the cascade's actual half-power point.
///
/// Derivation: with `freq = 0.0`, `setabc` gives a double real pole at
/// `r = exp(-pi*bw/sample_rate)`. A single DC-normalized section has
/// magnitude `H(w) = (1-r)^2 / (1 - 2r*cos(w) + r^2)`; the 2-section cascade
/// has magnitude `H(w)^2`. Setting `H(w_c)^2 = 1/sqrt(2)` (the -3dB point,
/// `w_c = 2*pi*cutoff_hz/sample_rate`) and solving for `r` yields a
/// quadratic: `(1-K)*r^2 + 2*(K - cos(w_c))*r + (1-K) = 0`, `K = 2^(1/4)`.
/// The root in `(0, 1)` is the physically valid pole radius; invert
/// `r = exp(-pi*bw/sample_rate)` for `bw`. Verified against an independent
/// bisection search (scratch script, not committed) before landing on this
/// closed form -- both agree to within floating-point tolerance across
/// 11025/22050/44100/48000Hz device rates.
///
/// Still an **engineering estimate** in the sense that "cutoff = 0.45 x
/// device rate" is itself a judgment call carried over from round 1 (per the
/// plan) -- this function only makes the bw->actual-cutoff mapping land
/// exactly on whatever target cutoff is passed in, re-validated via
/// `npm run lint:audio`/`npm run measure` rather than assumed correct from
/// formula alone.
fn aa_cascade_bw_for_cutoff(sample_rate: f32, cutoff_hz: f32) -> f32 {
    let wc = 2.0 * PI * cutoff_hz / sample_rate;
    let k = 2f32.powf(0.25); // K = 2^(1/4), see derivation above
    let a = 1.0 - k;
    let b = 2.0 * (k - wc.cos());
    let c = 1.0 - k;
    let disc = (b * b - 4.0 * a * c).max(0.0);
    let r = ((-b + disc.sqrt()) / (2.0 * a)).clamp(1e-6, 1.0 - 1e-6);
    -sample_rate * r.ln() / PI
}

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
    // Internal tick-domain physics always run at VIRTUAL_SAMPLE_RATE
    // (192kHz), decoupled from the live device rate -- see the
    // fixed-virtual-rate design note above. Every existing tick-domain
    // formula (t0, nopen, RGL bandwidth, skew, dipl_phase, flutter timing)
    // is a ratio of sample-rate-scaled quantities, so it stays algebraically
    // correct with this field simply always holding VIRTUAL_SAMPLE_RATE.
    sample_rate: f32,

    // The live device output rate, as passed to `new()`. Used only by the
    // decimation stage in `process()` to compute the internal-tick/output
    // ratio and the antialiasing filter cutoff -- never used for tick-domain
    // physics (that's `sample_rate`, above).
    device_sample_rate: f32,

    // Period tracking in 4x sample units
    t0: i32,
    nper: i32,
    nopen: i32,
    nmod: i32,
    skew: i32,

    // Absolute output-sample clock, used to evaluate F0 flutter in seconds.
    // Reference: Klatt & Klatt 1990, eq. 1 (flutter is a function of absolute time).
    // Repurposed (without changing its meaning) as the internal 192kHz-tick
    // counter for the decimation stage: it is still incremented exactly once
    // per `process_sample()` call, which now IS the 192kHz tick, so
    // `t = output_sample_count / sample_rate` is still real elapsed seconds.
    output_sample_count: i64,

    // Count of requested OUTPUT (device-rate) samples produced across all
    // `process()` calls. Drift-free by construction: `target` internal-tick
    // index for each output sample is recomputed fresh from this counter
    // every time (`floor(device_sample_count * ratio)`), never accumulated,
    // so long renders cannot accumulate rounding drift.
    device_sample_count: i64,

    // Antialiasing-filtered internal-tick samples bracketing the most
    // recently produced output sample's fractional position, used for linear
    // interpolation down to the device rate. `curr` is always exactly one
    // internal tick ahead of `prev` (a persistent 1-tick lookahead buffer,
    // primed by running one internal tick before the very first output
    // sample is computed -- see `process()`).
    voice_prev: f32,
    voice_curr: f32,
    noise_prev: f32,
    noise_curr: f32,

    // Antialiasing cascades (2 cascaded 2-pole sections each) applied to
    // every internal 192kHz tick before decimation. Coefficients are
    // construction-time constants (derived from device_sample_rate), only
    // the state registers are reset by `reset()`.
    voice_aa: AaCascade,
    noise_aa: AaCascade,

    // Rescaled noise recursive-smoother coefficient (see NOISE_SMOOTH_COEFF
    // derivation comment in `new()`). Construction-time constant.
    noise_smooth_coeff: f32,

    // Diplophonia (Klatt & Klatt 1990, §3): alternate glottal pulses are delayed and
    // attenuated. `dipl_phase` toggles each period (0 = normal pulse, 1 = alternate
    // pulse); `dipl_amp` is the amplitude factor applied to the current period's pulse.
    dipl_phase: i32,
    dipl_amp: f32,

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
    /// `sample_rate` here means the DEVICE output rate (the FFI contract is
    /// unchanged from before this fix). Internal tick-domain physics always
    /// run at the fixed `VIRTUAL_SAMPLE_RATE`; `sample_rate` (the struct
    /// field) is hardcoded to that constant so every existing tick-domain
    /// formula in this file stays correct unchanged. `device_sample_rate`
    /// stores the real argument for use by the decimation stage.
    pub fn new(sample_rate: f32) -> Self {
        let device_sr = if sample_rate > 0.0 { sample_rate } else { 44_100.0 };
        let virtual_sr = VIRTUAL_SAMPLE_RATE;

        // Downsample low-pass filter (klsyn88 parwv.c:151-152, "Low-pass
        // filter voicing waveform before downsampling from 4*samrate to
        // samrate"): this filter reduces the 4x-oversampled tick-domain
        // signal down to the *internal* 192kHz stream, so it must run at
        // VIRTUAL_SAMPLE_RATE now, not device_sample_rate -- same formula as
        // before, just fed the fixed virtual rate.
        let (rlpa, rlpb, rlpc) = setabc(virtual_sr, 0.095 * virtual_sr, 0.063 * virtual_sr);

        // Antialiasing cascade coefficients: run at VIRTUAL_SAMPLE_RATE (the
        // rate the internal tick stream is actually sampled at), cutoff tied
        // to the real device Nyquist. Edge case: if device_sample_rate ever
        // exceeds VIRTUAL_SAMPLE_RATE (hypothetical future >192kHz device),
        // clamp the reference rate at VIRTUAL_SAMPLE_RATE rather than letting
        // the cutoff exceed the internal Nyquist -- upsampling is explicitly
        // out of scope for this fix (known limitation, not silently wrong).
        let aa_reference_rate = device_sr.min(VIRTUAL_SAMPLE_RATE);
        // engineering estimate: target cutoff is 0.45x the device rate,
        // near-critically-damped (freq = 0.0); revisit if lint:audio/measure
        // show residual aliasing post-fix. `aa_bw` here is NOT passed
        // directly as `setabc`'s `bw` argument -- passing the target cutoff
        // straight through was round-1's implementation, and a round-2
        // investigation found that puts the cascade's actual -3dB point
        // ~4.6x more aggressive than intended (a single freq=0
        // `TwoPoleSection` is a double pole, and this cascade has two of
        // them). `aa_cascade_bw_for_cutoff` solves for the `bw` value that
        // actually lands the 2-section cascade's -3dB point at this target;
        // see its doc comment for the derivation.
        let aa_cutoff_hz = 0.45 * aa_reference_rate;
        let aa_bw = aa_cascade_bw_for_cutoff(virtual_sr, aa_cutoff_hz);
        let (aa_a, aa_b, aa_c) = setabc(virtual_sr, 0.0, aa_bw);
        let mut voice_aa = AaCascade::default();
        voice_aa.set_coeffs(aa_a, aa_b, aa_c);
        let mut noise_aa = AaCascade::default();
        noise_aa.set_coeffs(aa_a, aa_b, aa_c);

        // klsyn88 gen_noise (parwv.c:844-853) applies `noise = nrand +
        // 0.75*nlast` once per call, at whatever `samrate` klsyn88 was
        // configured for -- confirmed (by reading parwv.c) that gen_noise()
        // is called once per outer `ns` (samrate-domain) loop iteration, the
        // same implicit ~10kHz reference rate as the nopen/B0 clamp (see
        // TICK_RESCALE above). process_sample() (which contains this
        // smoother) now runs once per internal 192kHz tick instead of once
        // per device-rate output sample -- ~19.2x more often than the
        // reference's implicit call rate. To hold the real-time decay of a
        // one-pole smoother y[n] = x[n] + a*y[n-1] constant across a change
        // in call rate from rate_a to rate_b: a_b = a_a ^ (rate_a / rate_b).
        // So 0.75 tuned at ~10kHz becomes, at 192kHz: 0.75^(10000/192000).
        let noise_smooth_coeff = 0.75f32.powf(NOPEN_REFERENCE_RATE / VIRTUAL_SAMPLE_RATE);

        Self {
            sample_rate: virtual_sr,
            device_sample_rate: device_sr,
            t0: 0,
            nper: 0,
            nopen: 0,
            nmod: 0,
            skew: 0,
            output_sample_count: 0,
            device_sample_count: 0,
            voice_prev: 0.0,
            voice_curr: 0.0,
            noise_prev: 0.0,
            noise_curr: 0.0,
            voice_aa,
            noise_aa,
            noise_smooth_coeff,
            dipl_phase: 0,
            dipl_amp: 1.0,
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
        self.output_sample_count = 0;
        self.device_sample_count = 0;
        self.voice_prev = 0.0;
        self.voice_curr = 0.0;
        self.noise_prev = 0.0;
        self.noise_curr = 0.0;
        self.voice_aa.reset_state();
        self.noise_aa.reset_state();
        self.dipl_phase = 0;
        self.dipl_amp = 1.0;
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

    /// Compute the flutter-perturbed fundamental frequency.
    ///
    /// Reference: Klatt & Klatt 1990, "Analysis, synthesis, and perception of
    /// voice quality variations among female and male talkers", JASA 87(2),
    /// eq. 1:
    ///   Δf0(t) = (FL/50)·(F0/100)·[sin(2π·12.7·t) + sin(2π·7.1·t) + sin(2π·4.7·t)]
    /// where t is absolute time in seconds since utterance start, F0 is the
    /// current fundamental (Hz), and FL is the flutter percentage (0–100).
    /// The three incommensurate frequencies produce a deterministic quasi-random
    /// wander that models natural pitch instability.
    ///
    /// When `flutter <= 0.0` this returns `f0_hz` unchanged with no added term,
    /// so the no-flutter path is bit-identical to the pre-flutter synthesizer.
    fn flutter_f0(&self, f0_hz: f32, flutter: f32) -> f32 {
        if flutter > 0.0 {
            let t = self.output_sample_count as f64 / self.sample_rate as f64;
            let two_pi = 2.0 * core::f64::consts::PI;
            let wander = (two_pi * 12.7 * t).sin()
                + (two_pi * 7.1 * t).sin()
                + (two_pi * 4.7 * t).sin();
            let delta = (flutter as f64 / 50.0) * (f0_hz as f64 / 100.0) * wander;
            f0_hz + delta as f32
        } else {
            f0_hz
        }
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
        flutter: f32,
        diplophonia: f32,
    ) {
        self.source = source;
        if f0_hz.is_finite() && f0_hz > 0.0 {
            // Reference implementation: klsyn88 parwv.c (pitch_synch_par_reset).
            // F0 is perturbed by flutter (Klatt & Klatt 1990 eq. 1) before the
            // period length is derived; FL=0 leaves f0 bit-identical.
            let f0_eff = self.flutter_f0(f0_hz, flutter);
            let t0 = (4.0 * self.sample_rate / f0_eff).floor() as i32;
            self.t0 = if t0 > 0 { t0 } else { 4 };

            self.amp_breth = Self::db_to_linear(aturb_db) * 0.1;

            let mut nopen = (self.t0 as f32 * (open_quotient / 100.0)).floor() as i32;

            // nopen clamp, rescaled from klsyn88's raw ~10kHz-reference tick
            // counts (263/40) to this crate's fixed VIRTUAL_SAMPLE_RATE via
            // TICK_RESCALE -- see the fixed-virtual-rate design note above.
            if (source == 1 || source == 2) && nopen > NOPEN_MAX_TICKS {
                nopen = NOPEN_MAX_TICKS;
            }
            if nopen >= (self.t0 - 1) {
                nopen = self.t0 - 2;
            }
            if nopen < NOPEN_MIN_TICKS {
                nopen = NOPEN_MIN_TICKS;
            }
            self.nopen = nopen;
            self.nmod = if av_db > 0.0 { self.nopen } else { self.t0 };

            // Natural source coefficients
            // Reference: klsyn88 parwvt.h B0 table. B0_TABLE is indexed by
            // raw ~10kHz-reference tick count (224 entries, nopen 40..263 in
            // that domain) -- reindex the rescaled `nopen` back to an
            // "equivalent 10kHz-tick" index for the lookup while `nopen`
            // itself (used for the real open/closed-phase timing gate) stays
            // in the rescaled 192kHz-tick domain.
            let b0_index = ((nopen as f32 / TICK_RESCALE).round() as i32 - 40).clamp(0, (B0_TABLE.len() - 1) as i32);
            let b0 = B0_TABLE[b0_index as usize];
            // `self.a`/`self.b` drive a double integrator in process_sample's
            // source==2 branch (`self.a -= self.b; self.vwave += self.a;`),
            // run once per 192kHz-domain subtick with no explicit per-step
            // Δt term. Refining the tick rate by TICK_RESCALE without
            // compensating both accumulator steps inflates the doubly-
            // integrated `vwave` output by TICK_RESCALE squared, not just
            // TICK_RESCALE -- confirmed by round-2 investigation (simulated
            // against native-10kHz ground truth at DECtalk KLGLOTT runtime
            // parameters, f0=108.246Hz, swept f0=80-450Hz/oq=30-70%): single
            // rescale of both terms still comes out ~19x too big; this
            // double-rescale of `self.b` alone (with `self.a` derived from
            // the already-rescaled `self.b`) lands at 0.93x-0.99x of ground
            // truth. See plan CORRECTION (post-coder-round-1) in
            // validated-growing-lecun.md for the full derivation.
            self.b = b0 / (TICK_RESCALE * TICK_RESCALE);
            self.a = self.b * (nopen as f32) * 0.333;

            // Impulsive source low-pass (source==1 branch). Not currently
            // exercised by DECtalk (graph.yaml hardcodes source: 2.0), but
            // `temp1` has the same raw-unrescaled-`nopen` pattern as the
            // natural-source coefficients above (matches klsyn88 parwv.c:
            // 640-641, itself never rescaled by samrate even in the
            // reference) -- reindex back to the "equivalent 10kHz-tick"
            // domain via TICK_RESCALE for consistency, per plan.
            let bw = self.sample_rate / (nopen as f32);
            let (mut a, b, c) = setabc(self.sample_rate, 0.0, bw);
            let temp1 = (nopen as f32 / TICK_RESCALE) * 0.00833;
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

            // Diplophonia (Klatt & Klatt 1990, §3). On alternate glottal pulses the
            // pulse is both DELAYED and ATTENUATED:
            //   delay      = (DI/100)·(1 − OQ/100)·T0   (fraction of the closed phase;
            //                DI=50,OQ=50 ⇒ a quarter period, DI=100 ⇒ full closed phase)
            //   amp_factor = 1 − DI/100                 (linear; DI=50 ⇒ 0.5 ⇒ −6 dB)
            // The shipped klsyn88 C only delays alternate pulses (via Kskew) and never
            // attenuates; DI adds both halves as its own term, independent of the skew
            // control (not reusing the skew variable, so they do not double-apply).
            //
            // Mean F0 is preserved by shifting the boundary between a normal/alternate
            // pulse pair: the period that ENDS at the (delayed) alternate pulse is
            // lengthened by `delay`, and the alternate pulse's own period is shortened by
            // the same amount — exactly the ± alternation skew uses. `dipl_phase` tracks
            // which pulse begins this period (0 = normal, 1 = alternate) and toggles each
            // period. DI ≤ 0 leaves t0 and amplitude untouched (bit-identical no-op).
            if diplophonia > 0.0 {
                // delay in 4x sample units, derived from the current period length.
                let mut delay = ((diplophonia / 100.0)
                    * (1.0 - open_quotient / 100.0)
                    * (self.t0 as f32))
                    .round() as i32;
                // Keep the shortened period valid: leave at least one closed sample.
                let max_delay = (self.t0 - self.nopen - 1).max(0);
                if delay > max_delay {
                    delay = max_delay;
                }
                if self.dipl_phase == 0 {
                    // Normal pulse; the following alternate pulse is delayed, so this
                    // period (ending at that pulse) is lengthened.
                    self.t0 += delay;
                    self.dipl_amp = 1.0;
                } else {
                    // Alternate (delayed, attenuated) pulse: shorten this period and
                    // scale its amplitude.
                    self.t0 -= delay;
                    self.dipl_amp = 1.0 - diplophonia / 100.0;
                }
                self.dipl_phase ^= 1;
            } else {
                self.dipl_amp = 1.0;
            }

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
        flutter: f32,
        diplophonia: f32,
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
                flutter,
                diplophonia,
            );
        }

        // Noise generation
        // Reference implementation: klsyn88 parwv.c (gen_noise). Coefficient
        // rescaled from the reference's implicit ~10kHz call rate to this
        // crate's 192kHz internal tick rate -- see derivation in `new()`.
        let nrand = (self.rand31() >> 17) - 8192;
        let mut noise = (nrand as f32) + (self.noise_smooth_coeff * self.nlast);
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

            // Diplophonia amplitude attenuation (Klatt & Klatt 1990, §3): scale the
            // glottal pulse by the per-period factor. `dipl_amp` is exactly 1.0 when
            // DI = 0, so this multiply is bit-identical to the pre-diplophonia path.
            let sample = sample * self.dipl_amp;

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
                    flutter,
                    diplophonia,
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

        // Advance the absolute output-sample clock used for flutter timing
        // (Klatt & Klatt 1990 eq. 1). One increment per OUTPUT sample, so
        // t = output_sample_count / sample_rate is in seconds.
        self.output_sample_count += 1;

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
        flutter: &[f32],
        diplophonia: &[f32],
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
        let flutter_len = flutter.len();
        let dipl_len = diplophonia.len();

        // Fixed-virtual-rate decimation (see design note above `VIRTUAL_SAMPLE_RATE`):
        // internal tick-domain physics run at VIRTUAL_SAMPLE_RATE regardless
        // of device_sample_rate. `ratio` internal ticks are needed per
        // requested output (device-rate) sample; `.max(1.0)` floors it at 1.0
        // per the ">VIRTUAL_SAMPLE_RATE device" edge case (never upsample).
        let ratio = (VIRTUAL_SAMPLE_RATE / self.device_sample_rate).max(1.0) as f64;

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
            let flutter_val = if flutter_len == 0 { 0.0 } else if flutter_len > 1 { flutter[i % flutter_len] } else { flutter[0] };
            let dipl_val = if dipl_len == 0 { 0.0 } else if dipl_len > 1 { diplophonia[i % dipl_len] } else { diplophonia[0] };

            self.set_seed(seed_val.round() as i32);
            let source_i = source_val.round() as i32;

            // Prime the 1-tick lookahead buffer the very first time this
            // source ever generates an internal tick (construction, or right
            // after reset() -- both leave output_sample_count == 0). Without
            // this, the first interpolated output sample would read
            // zero-initialized voice_prev/curr (silently wrong,
            // discontinuous).
            if self.output_sample_count == 0 {
                let (v0, n0) = self.process_sample(
                    f0_val, av_val, aturb_val, tilt_val, oq_val, skew_val, asym_val,
                    source_i, flutter_val, dipl_val,
                );
                let vf0 = self.voice_aa.step(v0);
                let nf0 = self.noise_aa.step(n0);
                self.voice_prev = vf0;
                self.voice_curr = vf0;
                self.noise_prev = nf0;
                self.noise_curr = nf0;
            }

            // Drift-free index tracking: `target` is recomputed fresh from
            // `device_sample_count` every output sample (never accumulated),
            // so long renders cannot accumulate phase drift.
            self.device_sample_count += 1;
            let position = self.device_sample_count as f64 * ratio;
            let target = position.floor() as i64;

            // Generate internal ticks until `voice_curr`/`noise_curr` hold
            // tick #(target + 1) and `voice_prev`/`noise_prev` hold tick
            // #target -- the two internal samples bracketing this output
            // sample's fractional position (`<=` keeps the 1-tick lookahead
            // primed above intact: `output_sample_count` already equals the
            // previous iteration's `target + 1` on entry).
            while self.output_sample_count <= target {
                let (v, n) = self.process_sample(
                    f0_val, av_val, aturb_val, tilt_val, oq_val, skew_val, asym_val,
                    source_i, flutter_val, dipl_val,
                );
                let vf = self.voice_aa.step(v);
                let nf = self.noise_aa.step(n);
                self.voice_prev = self.voice_curr;
                self.voice_curr = vf;
                self.noise_prev = self.noise_curr;
                self.noise_curr = nf;
            }

            let frac = (position - target as f64) as f32;
            voice_out[i] = self.voice_prev + frac * (self.voice_curr - self.voice_prev);
            noise_out[i] = self.noise_prev + frac * (self.noise_curr - self.noise_prev);
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
    flutter_ptr: *const f32,
    flutter_len: usize,
    diplophonia_ptr: *const f32,
    diplophonia_len: usize,
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
    let flutter = if flutter_ptr.is_null() || flutter_len == 0 { &[][..] } else { core::slice::from_raw_parts(flutter_ptr, flutter_len) };
    let diplophonia = if diplophonia_ptr.is_null() || diplophonia_len == 0 { &[][..] } else { core::slice::from_raw_parts(diplophonia_ptr, diplophonia_len) };

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
            flutter,
            diplophonia,
            voice_out,
            noise_out,
        );
    }
}
