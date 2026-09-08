//! Aerodynamic frication: Stevens (1971), pp. 1183-1186, and
//! Badin & Fant (1989), Eqs. 1-3. Areas are cm²; volume flows are cm³/s.

pub fn centre_frequency(area: f32, flow: f32) -> f32 {
    if !area.is_finite() || !flow.is_finite() || area <= 0.0 || flow <= 0.0 {
        return 0.0;
    }
    0.2 * flow / (area * area.sqrt())
}

/// Stevens Eq. 5: kinetic loss coefficient 0.9; air density 1.14 kg/m³.
pub fn pressure_drop_kpa(area: f32, flow: f32) -> f32 {
    if !area.is_finite() || !flow.is_finite() || area <= 0.0 || flow <= 0.0 {
        return 0.0;
    }
    let velocity = 0.01 * f64::from(flow) / f64::from(area);
    (0.9 * 1.14 * velocity * velocity / 2000.0).min(f64::from(f32::MAX)) as f32
}

/// Badin & Fant Eq. 3: relative pressure amplitude, normalized at
/// Ac=0.1 cm², U=300 cm³/s (inside Stevens' Fig. 9 speech region).
/// The reference fixes a dimensionless gain, not an absolute acoustic SPL.
pub fn drive_gain(area: f32, flow: f32, pressure_exponent: f32, area_exponent: f32) -> f32 {
    let pressure = pressure_drop_kpa(area, flow);
    if pressure == 0.0 || !pressure_exponent.is_finite() || !area_exponent.is_finite() {
        return 0.0;
    }
    let gain = (pressure / 0.4617).powf(pressure_exponent) * (area / 0.1).powf(area_exponent);
    if gain.is_finite() {
        gain
    } else {
        0.0
    }
}

pub struct FricationSource {
    seed: u32,
    low: f64,
    high: f64,
    low_pole: f64,
    high_pole: f64,
    scale: f64,
}

impl FricationSource {
    pub fn new(seed: u32) -> Self {
        Self {
            seed,
            low: 0.0,
            high: 0.0,
            low_pole: 0.0,
            high_pole: 0.0,
            scale: 0.0,
        }
    }

    pub fn configure(&mut self, area: f32, flow: f32, p: f32, q: f32, rate: f32) {
        let centre = centre_frequency(area, flow);
        let gain = drive_gain(area, flow, p, q);
        if !rate.is_finite() || rate <= 0.0 || !centre.is_finite() || centre <= 0.0 || gain == 0.0 {
            self.scale = 0.0;
            self.low = 0.0;
            self.high = 0.0;
            return;
        }
        // Stevens Fig. 4(a), p. 1184: broad pressure-source peak spanning
        // roughly 2-3 octaves. Engineering realization: difference of two
        // one-pole lowpasses with corners three octaves apart. The tract
        // and radiation remain downstream, rather than being applied twice.
        let rate = f64::from(rate);
        let centre = f64::from(centre).min(rate * 0.45);
        let half_span = 8.0_f64.sqrt();
        self.low_pole = (-std::f64::consts::TAU * centre / half_span / rate).exp();
        self.high_pole =
            (-std::f64::consts::TAU * (centre * half_span).min(rate * 0.45) / rate).exp();
        let a = self.low_pole;
        let b = self.high_pole;
        // Exact stationary variance of the two correlated AR(1) filters,
        // driven by uniform [-1,1] noise (variance 1/3). Normalize spectrum
        // changes out of the level law; no empirical RMS compensation table.
        let variance = ((1.0 - a) / (1.0 + a) + (1.0 - b) / (1.0 + b)
            - 2.0 * (1.0 - a) * (1.0 - b) / (1.0 - a * b))
            / 3.0;
        self.scale = if variance > 0.0 {
            f64::from(gain) / variance.sqrt()
        } else {
            0.0
        };
    }

    pub fn sample(&mut self) -> f32 {
        // Numerical Recipes LCG; deterministic across block partitions.
        self.seed = self.seed.wrapping_mul(1664525).wrapping_add(1013904223);
        let white = f64::from(self.seed) / 4294967296.0 * 2.0 - 1.0;
        self.low = self.low_pole * self.low + (1.0 - self.low_pole) * white;
        self.high = self.high_pole * self.high + (1.0 - self.high_pole) * white;
        ((self.high - self.low) * self.scale) as f32
    }
}

#[no_mangle]
pub extern "C" fn frication_source_new(seed: u32) -> *mut FricationSource {
    Box::into_raw(Box::new(FricationSource::new(seed)))
}

#[no_mangle]
pub unsafe extern "C" fn frication_source_free(ptr: *mut FricationSource) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub unsafe extern "C" fn frication_source_set_params(
    ptr: *mut FricationSource,
    area: f32,
    flow: f32,
    p: f32,
    q: f32,
    rate: f32,
) {
    if let Some(source) = ptr.as_mut() {
        source.configure(area, flow, p, q, rate);
    }
}

#[no_mangle]
pub unsafe extern "C" fn frication_source_process(
    ptr: *mut FricationSource,
    modulation: *const f32,
    output: *mut f32,
    len: usize,
) {
    if ptr.is_null() || output.is_null() || len == 0 {
        return;
    }
    let source = &mut *ptr;
    let output = core::slice::from_raw_parts_mut(output, len);
    for (index, sample) in output.iter_mut().enumerate() {
        let envelope = if modulation.is_null() {
            1.0
        } else {
            *modulation.add(index)
        };
        *sample = source.sample() * envelope;
    }
}

klatt_wasm_common::export_alloc_fns!();

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pressure_and_level_follow_aerodynamic_laws() {
        // Stevens Eq. 5, rho=1.14 kg/m³; reference jet speed=30 m/s.
        assert!((pressure_drop_kpa(0.1, 300.0) - 0.4617).abs() < 1e-5);
        assert!((drive_gain(0.1, 300.0, 1.3, 0.3) - 1.0).abs() < 1e-5);
        // Badin & Fant §1.4: doubling flow quadruples pressure, then gain=P^p.
        assert!((drive_gain(0.1, 600.0, 1.3, 0.3) - 4.0_f32.powf(1.3)).abs() < 1e-4);
        assert!((drive_gain(0.1, 600.0, 0.8, 0.2) - 4.0_f32.powf(0.8)).abs() < 1e-4);
    }

    #[test]
    fn source_has_calibrated_energy_and_tracks_flow() {
        let mut source = FricationSource::new(51);
        source.configure(0.1, 300.0, 1.3, 0.3, 48000.0);
        for _ in 0..4800 {
            source.sample();
        }
        let mut energy = 0.0_f64;
        for _ in 0..48000 {
            energy += f64::from(source.sample()).powi(2);
        }
        let rms = (energy / 48000.0).sqrt();
        assert!((rms - 1.0).abs() < 0.04, "reference_rms={rms}");
        source.configure(0.1, 0.0, 1.3, 0.3, 48000.0);
        assert_eq!(source.sample(), 0.0, "zero flow must silence the source");
    }

    #[test]
    fn source_is_seeded_and_block_partition_independent() {
        let mut first = FricationSource::new(51);
        let mut second = FricationSource::new(51);
        first.configure(0.1, 300.0, 1.3, 0.3, 48000.0);
        second.configure(0.1, 300.0, 1.3, 0.3, 48000.0);
        let expected: Vec<_> = (0..1024).map(|_| first.sample()).collect();
        assert!(expected.iter().any(|value| value.abs() > 0.1));
        let mut actual = Vec::new();
        for _ in 0..8 {
            second.configure(0.1, 300.0, 1.3, 0.3, 48000.0);
            actual.extend((0..128).map(|_| second.sample()));
        }
        assert_eq!(actual, expected);
    }

    #[test]
    fn volume_flow_uses_three_halves_area_exponent() {
        // Stevens (1971), p. 1184: 0.2 U / A^(3/2), not U / sqrt(A).
        let actual = centre_frequency(0.1, 300.0);
        assert!((actual - 1897.3666).abs() < 0.01, "centre_hz={actual}");
    }

    #[test]
    fn jet_scaling_follows_strouhal_similarity() {
        let base = centre_frequency(0.1, 300.0);
        assert!(base > 0.0);
        assert!((centre_frequency(0.1, 600.0) / base - 2.0).abs() < 1e-5);
        assert!((centre_frequency(0.4, 300.0) / base - 0.125).abs() < 1e-5);
    }
}
