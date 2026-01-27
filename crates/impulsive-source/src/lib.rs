use klatt_wasm_common::export_alloc_fns;

export_alloc_fns!();

#[repr(C)]
pub struct ImpulsiveSource {
    sample_rate: f32,
    period_len: usize,
    pos_in_period: usize,
    open_len: usize,
    // Klatt/klsyn88: doublet impulse into a second-order resonator
    // Reference: C:\Users\Q\src\klsyn\c\parwv.c (impulsive_source, setabc, pitch_synch_par_reset)
    y1: f32,
    y2: f32,
    a: f32,
    b: f32,
    c: f32,
}

impl ImpulsiveSource {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            sample_rate,
            period_len: (sample_rate / 100.0) as usize,
            pos_in_period: 0,
            open_len: 0,
            y1: 0.0,
            y2: 0.0,
            a: 1.0,
            b: 0.0,
            c: 0.0,
        }
    }

    pub fn reset(&mut self) {
        self.pos_in_period = 0;
        self.y1 = 0.0;
        self.y2 = 0.0;
    }

    pub fn process(&mut self, f0: f32, open_quotient: f32) -> f32 {
        // At period boundary, recalculate
        if self.pos_in_period == 0 {
            let f0_hz = f0.max(20.0);
            self.period_len = ((self.sample_rate / f0_hz) as usize).max(1);

            // klsyn88 enforces a minimum open phase of ~1.0 ms (at 4x oversampling).
            // We approximate that constraint at the base sample rate.
            let min_open = (self.sample_rate * 0.001) as usize;
            let mut open_len =
                ((self.period_len as f32) * open_quotient.clamp(0.01, 0.99)) as usize;
            open_len = open_len.max(1).max(min_open);
            if open_len >= self.period_len {
                open_len = self.period_len.saturating_sub(1).max(1);
            }
            self.open_len = open_len;

            // In klsyn88, the glottal resonator is set via:
            //   temp = samrate / nopen; setabc(0, temp, &rgla, &rglb, &rglc)
            // where nopen is measured at 4x oversampling. We approximate by scaling
            // open_len to that domain before computing the effective bandwidth.
            let nopen_4x = (self.open_len.saturating_mul(4)).max(1) as f32;
            let bw = self.sample_rate / nopen_4x;

            // setabc(f=0, bw): r = exp(-pi*bw/fs), c = -(r^2), b = 2r, a = 1-b-c
            let r = (-std::f32::consts::PI * bw / self.sample_rate).exp();
            let mut a = 1.0 - (2.0 * r) - (-(r * r));
            let b = 2.0 * r;
            let c = -(r * r);

            // klsyn88 scales the input coefficient to stabilize gain at F1:
            //   temp1 = nopen * .00833; rgla *= temp1 * temp1
            // We apply the same scaling with the 4x-domain open length.
            let temp1 = nopen_4x * 0.00833;
            a *= temp1 * temp1;

            self.a = a;
            self.b = b;
            self.c = c;
        }

        // Generate a doublet impulse (fixed-point magnitudes in klsyn88).
        // We use normalized amplitudes here; downstream gains set the level.
        let impulse = match self.pos_in_period {
            0 => 0.0,
            1 => 1.0,
            2 => -1.0,
            _ => 0.0,
        };

        // Second-order resonator: y[n] = a*x[n] + b*y[n-1] + c*y[n-2]
        let output = self.a * impulse + self.b * self.y1 + self.c * self.y2;
        self.y2 = self.y1;
        self.y1 = output;

        self.pos_in_period += 1;
        if self.pos_in_period >= self.period_len {
            self.pos_in_period = 0;
        }

        output
    }
}

// FFI exports
#[no_mangle]
pub extern "C" fn impulsive_source_new(sample_rate: f32) -> *mut ImpulsiveSource {
    Box::into_raw(Box::new(ImpulsiveSource::new(sample_rate)))
}

#[no_mangle]
pub unsafe extern "C" fn impulsive_source_free(ptr: *mut ImpulsiveSource) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub unsafe extern "C" fn impulsive_source_reset(ptr: *mut ImpulsiveSource) {
    if let Some(src) = ptr.as_mut() {
        src.reset();
    }
}

#[no_mangle]
pub unsafe extern "C" fn impulsive_source_process(
    ptr: *mut ImpulsiveSource,
    f0: f32,
    open_quotient: f32,
) -> f32 {
    if let Some(src) = ptr.as_mut() {
        src.process(f0, open_quotient)
    } else {
        0.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Reference: klsyn88 pitch_synch_par_reset + setabc in C:\Users\Q\src\klsyn\c\parwv.c
    #[test]
    fn enforces_minimum_open_phase_and_sets_resonator_coeffs() {
        let sr = 48_000.0;
        let mut src = ImpulsiveSource::new(sr);

        // Very small OQ would otherwise create a sub-1ms open phase.
        let _ = src.process(100.0, 0.001);

        let min_open = (sr * 0.001) as usize;
        assert!(src.open_len >= min_open);
        assert!(src.open_len < src.period_len);

        // Coefficients should be finite and consistent with f=0 setabc structure.
        assert!(src.a.is_finite() && src.b.is_finite() && src.c.is_finite());
        assert!(src.b > 0.0);
        assert!(src.c < 0.0);
    }

    #[test]
    fn generates_doublet_excitation_shape() {
        let sr = 48_000.0;
        let mut src = ImpulsiveSource::new(sr);

        // Ensure we're at a period boundary.
        src.reset();

        let y0 = src.process(120.0, 0.4);
        let y1 = src.process(120.0, 0.4);
        let y2 = src.process(120.0, 0.4);

        // First sample is the 0 entry of the doublet.
        assert!(y0.abs() < 1e-6);
        // Subsequent samples should reflect the +/- excitation through the resonator.
        assert!(y1.is_finite());
        assert!(y2.is_finite());
    }
}
