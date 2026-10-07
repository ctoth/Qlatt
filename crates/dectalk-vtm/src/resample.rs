//! Sample-rate conversion from DECtalk's 11025 Hz to a host's output rate.
//!
//! This is not DECtalk code. DECtalk 4.63 writes its 11025 Hz samples to the
//! sound device unchanged, so exactness against `say.exe` is defined before
//! this stage; what happens here is the reconstruction a host needs when its
//! output runs at another rate.
//!
//! # Method
//!
//! Band-limited interpolation: the output is the input convolved with a
//! windowed sinc and read at the output instants.
//!
//! - J. O. Smith and P. Gossett, "A flexible sampling-rate conversion method",
//!   Proc. IEEE ICASSP 1984, vol. 9, pp. 112-115,
//!   doi:10.1109/ICASSP.1984.1172555: `y(t) = sum_i x[i] h(t - i)` with `h` a
//!   windowed `sinc`, evaluated at arbitrary `t`.
//! - J. F. Kaiser, "Nonrecursive digital filter design using the I0-sinh window
//!   function", Proc. IEEE ISCAS 1974, pp. 20-23: the window
//!   `w(t) = I0(beta sqrt(1 - (t/L)^2)) / I0(beta)`, and
//!   `beta = 0.1102 (A - 8.7)` for a stopband attenuation `A > 50` dB.
//!
//! Only rates at or above 11025 Hz are supported. The sinc then has its zero
//! crossings at the input sample instants (cutoff at the input Nyquist
//! frequency, 5512.5 Hz), so an output instant that coincides with an input
//! sample returns that sample unchanged, and at 11025 Hz the stage is the
//! identity with no delay of its own.
//!
//! Smith and Gossett interpolate linearly in a stored table of the kernel.
//! Here each coefficient is computed from the formula instead, so there is no
//! table-interpolation error: for an output rate `R` the fractional position
//! takes only `R / gcd(R, 11025)` values, and the coefficients for each are
//! stored when that table is small and computed per sample otherwise. Both
//! paths give the same numbers.
//!
//! `sin` is the `libm` crate's, as for hlsyn's `tan`, so every target computes
//! the same coefficients.
//!
//! # Numbers that are not from a source
//!
//! - [`HALF_WIDTH`], 16 input samples on each side: engineering estimate. It
//!   sets the delay ([`Resampler::delay`], 16/11025 s = 1.45 ms) and, with the
//!   attenuation, the width of the transition band around 5512.5 Hz.
//! - [`STOPBAND_DB`], 80 dB: engineering estimate.
//! - [`MAX_TABLE_COEFFICIENTS`]: engineering estimate, a memory bound only.

use std::collections::VecDeque;

/// DECtalk's output rate, `INCLUDE/samprate.h:9`.
pub const IN_RATE: u64 = 11025;

/// Input samples the kernel spans on each side of the output instant.
/// Engineering estimate (see the module documentation).
pub const HALF_WIDTH: usize = 16;

/// Design stopband attenuation of the Kaiser window in dB.
/// Engineering estimate (see the module documentation).
pub const STOPBAND_DB: f64 = 80.0;

/// Largest coefficient table that is stored; above it coefficients are
/// computed per output sample. Engineering estimate (1 MiB of `f32`).
pub const MAX_TABLE_COEFFICIENTS: u64 = 1 << 18;

/// `beta = 0.1102 (A - 8.7)`, Kaiser 1974, for `A > 50` dB.
fn kaiser_beta() -> f64 {
    0.1102 * (STOPBAND_DB - 8.7)
}

/// Modified Bessel function of the first kind, order zero, by the power
/// series Kaiser 1974 gives: `I0(x) = sum_k ((x/2)^k / k!)^2`.
fn bessel_i0(x: f64) -> f64 {
    let half = x / 2.0;
    let mut sum = 1.0f64;
    let mut term = 1.0f64;
    let mut k = 1.0f64;
    // The terms fall monotonically once k > x/2; stop when one no longer
    // changes the sum.
    loop {
        let factor = half / k;
        term *= factor * factor;
        let next = sum + term;
        if next == sum {
            return sum;
        }
        sum = next;
        k += 1.0;
    }
}

/// The interpolation kernel at `t = whole - rem / out_rate` input samples from
/// the output instant: `sinc(t) w(t)`, zero for `|t| >= HALF_WIDTH`.
///
/// `rem / out_rate` is the fractional position of the output instant, kept as
/// an integer ratio so that an instant on an input sample (`rem == 0`) gets
/// exactly 1 at `whole == 0` and exactly 0 elsewhere.
fn kernel(whole: i64, rem: u64, out_rate: u64, i0_beta: f64) -> f64 {
    if rem == 0 {
        return if whole == 0 { 1.0 } else { 0.0 };
    }
    let t = whole as f64 - rem as f64 / out_rate as f64;
    let half_width = HALF_WIDTH as f64;
    let ratio = t / half_width;
    let inside = 1.0 - ratio * ratio;
    if inside <= 0.0 {
        return 0.0;
    }
    let window = bessel_i0(kaiser_beta() * inside.sqrt()) / i0_beta;
    let x = core::f64::consts::PI * t;
    libm::sin(x) / x * window
}

fn gcd(mut a: u64, mut b: u64) -> u64 {
    while b != 0 {
        (a, b) = (b, a % b);
    }
    a
}

/// A streaming 11025 Hz to `out_rate` converter. Input is pushed in frames;
/// output sample `j` is read at input position `j * 11025 / out_rate`, counted
/// from the first pushed sample, and must be requested in increasing order.
#[derive(Clone, Debug)]
pub struct Resampler {
    out_rate: u64,
    /// `gcd(out_rate, 11025)`: the fractional position is `phase * step / out_rate`.
    step: u64,
    /// `2 * HALF_WIDTH` coefficients per phase, or empty when computed per
    /// sample.
    table: Vec<f32>,
    i0_beta: f64,
    /// Input samples from index `history_base` on, scaled to +-1.
    history: VecDeque<f32>,
    history_base: u64,
}

impl Resampler {
    /// `None` unless `out_rate >= 11025`.
    pub fn new(out_rate: u32) -> Option<Self> {
        let out_rate = u64::from(out_rate);
        if out_rate < IN_RATE {
            return None;
        }
        let step = gcd(out_rate, IN_RATE);
        let phases = out_rate / step;
        let taps = 2 * HALF_WIDTH as u64;
        let i0_beta = bessel_i0(kaiser_beta());
        let mut table = Vec::new();
        if out_rate != IN_RATE && phases * taps <= MAX_TABLE_COEFFICIENTS {
            table.reserve_exact((phases * taps) as usize);
            for phase in 0..phases {
                for tap in 0..taps {
                    table.push(Self::coefficient(tap, phase * step, out_rate, i0_beta));
                }
            }
        }
        Some(Self {
            out_rate,
            step,
            table,
            i0_beta,
            history: VecDeque::new(),
            history_base: 0,
        })
    }

    /// Coefficient of input sample `q - HALF_WIDTH + 1 + tap` for an output
    /// instant at `q + rem / out_rate`.
    fn coefficient(tap: u64, rem: u64, out_rate: u64, i0_beta: f64) -> f32 {
        let whole = tap as i64 - HALF_WIDTH as i64 + 1;
        kernel(whole, rem, out_rate, i0_beta) as f32
    }

    /// Input samples after the output instant that an output sample needs:
    /// 0 at 11025 Hz, [`HALF_WIDTH`] otherwise.
    pub fn lookahead(&self) -> u64 {
        if self.out_rate == IN_RATE {
            0
        } else {
            HALF_WIDTH as u64
        }
    }

    /// The delay, in output samples, a caller must add so that every output
    /// sample's lookahead has been pushed: `ceil(lookahead * out_rate / 11025)`.
    pub fn delay(&self) -> u64 {
        (self.lookahead() * self.out_rate).div_ceil(IN_RATE)
    }

    /// Forgets all input.
    pub fn clear(&mut self) {
        self.history.clear();
        self.history_base = 0;
    }

    /// Appends input samples. 16-bit samples are scaled by 1/32768, the
    /// convention of 16-bit PCM in floating point (full scale -32768 is -1).
    pub fn push(&mut self, samples: &[i16]) {
        self.history
            .extend(samples.iter().map(|&sample| f32::from(sample) / 32768.0));
    }

    /// Input samples pushed so far.
    pub fn pushed(&self) -> u64 {
        self.history_base + self.history.len() as u64
    }

    fn input(&self, index: i64) -> f32 {
        if index < self.history_base as i64 {
            return 0.0;
        }
        self.history
            .get((index - self.history_base as i64) as usize)
            .copied()
            .unwrap_or(0.0)
    }

    /// Output sample `j`. Input that has not been pushed counts as zero, which
    /// is what flushes the tail after the last frame. Calls must not go back:
    /// input older than the kernel's reach from `j` is dropped.
    pub fn output(&mut self, j: u64) -> f32 {
        let position = j * IN_RATE;
        let q = (position / self.out_rate) as i64;
        let rem = position % self.out_rate;

        if self.out_rate == IN_RATE {
            let value = self.input(q);
            self.drop_before(q);
            return value;
        }

        let first = q - HALF_WIDTH as i64 + 1;
        let taps = 2 * HALF_WIDTH;
        let mut sum = 0.0f32;
        if self.table.is_empty() {
            for tap in 0..taps {
                let h = Self::coefficient(tap as u64, rem, self.out_rate, self.i0_beta);
                sum += self.input(first + tap as i64) * h;
            }
        } else {
            let row = (rem / self.step) as usize * taps;
            for tap in 0..taps {
                sum += self.input(first + tap as i64) * self.table[row + tap];
            }
        }
        self.drop_before(first);
        sum
    }

    fn drop_before(&mut self, index: i64) {
        while (self.history_base as i64) < index && !self.history.is_empty() {
            self.history.pop_front();
            self.history_base += 1;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rates_below_dectalks_are_refused() {
        assert!(Resampler::new(8000).is_none());
        assert!(Resampler::new(11025).is_some());
    }

    #[test]
    fn at_11025_hz_the_output_is_the_input() {
        let mut resampler = Resampler::new(11025).expect("supported rate");
        assert_eq!(resampler.delay(), 0);
        let input: Vec<i16> = (0..200).map(|i| (i * 163 - 16000) as i16).collect();
        resampler.push(&input);
        for (j, &sample) in input.iter().enumerate() {
            assert_eq!(resampler.output(j as u64), f32::from(sample) / 32768.0);
        }
        assert_eq!(resampler.output(200), 0.0);
    }

    #[test]
    fn output_instants_on_an_input_sample_return_that_sample() {
        // 44100 = 4 * 11025: every fourth output sample is an input sample.
        let mut resampler = Resampler::new(44100).expect("supported rate");
        assert_eq!(resampler.delay(), 64);
        let input: Vec<i16> = (0..300)
            .map(|i| ((i * 7919) % 20001 - 10000) as i16)
            .collect();
        resampler.push(&input);
        for (index, &sample) in input.iter().enumerate().take(250) {
            let value = resampler.output(index as u64 * 4);
            assert_eq!(value, f32::from(sample) / 32768.0, "input sample {index}");
            for between in 1..4 {
                resampler.output(index as u64 * 4 + between);
            }
        }
    }

    #[test]
    fn stored_and_computed_coefficients_agree() {
        // 48000 Hz stores 640 phases; compare every coefficient with the
        // formula evaluated directly.
        let resampler = Resampler::new(48000).expect("supported rate");
        assert_eq!(resampler.table.len(), 640 * 2 * HALF_WIDTH);
        for phase in 0..640u64 {
            for tap in 0..2 * HALF_WIDTH as u64 {
                let direct = Resampler::coefficient(
                    tap,
                    phase * resampler.step,
                    resampler.out_rate,
                    resampler.i0_beta,
                );
                let stored = resampler.table[phase as usize * 2 * HALF_WIDTH + tap as usize];
                assert_eq!(stored.to_bits(), direct.to_bits());
            }
        }
    }

    #[test]
    fn a_rate_with_too_many_phases_computes_coefficients_per_sample() {
        // 48001 = 23 * 2087 is coprime to 11025 = 3^2 * 5^2 * 7^2: 48001 phases
        // of 32 taps exceed the bound.
        let mut resampler = Resampler::new(48001).expect("supported rate");
        assert_eq!(resampler.step, 1);
        assert!(resampler.table.is_empty());
        resampler.push(&[16384; 400]);
        // Well inside a constant input the kernel sums to about 1.
        let value = resampler.output(48001 * 200 / 11025);
        assert!((value - 0.5).abs() < 1e-3, "{value}");
    }

    #[test]
    fn a_sine_in_the_passband_keeps_its_amplitude() {
        // 1 kHz at 11025 Hz, read at 48000 Hz: compare with the same sine
        // evaluated at the output instants.
        let mut resampler = Resampler::new(48000).expect("supported rate");
        let amplitude = 8192.0f64;
        let input: Vec<i16> = (0..2205)
            .map(|i| {
                (amplitude * libm::sin(2.0 * core::f64::consts::PI * 1000.0 * i as f64 / 11025.0))
                    .round() as i16
            })
            .collect();
        resampler.push(&input);
        let mut worst = 0.0f64;
        for j in 400..8000u64 {
            let expected = amplitude / 32768.0
                * libm::sin(2.0 * core::f64::consts::PI * 1000.0 * j as f64 / 48000.0);
            let got = f64::from(resampler.output(j));
            worst = worst.max((got - expected).abs());
        }
        // Rounding the input to 16 bits alone contributes up to 0.5/32768.
        assert!(worst < 1e-4, "worst error {worst}");
    }
}
