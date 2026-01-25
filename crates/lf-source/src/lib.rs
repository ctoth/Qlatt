use core::f32::consts::PI;

#[derive(Clone, Copy)]
struct Biquad {
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,
    bypass: bool,
}

#[derive(Clone, Copy)]
enum LfMode {
    Legacy = 0,
    LfLm = 1,
    LfCalm = 2,
}

impl LfMode {
    fn from_u32(value: u32) -> Self {
        match value {
            1 => Self::LfLm,
            2 => Self::LfCalm,
            _ => Self::Legacy,
        }
    }
}

impl Biquad {
    fn new() -> Self {
        Self {
            b0: 0.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            bypass: true,
        }
    }

    fn set_coeffs(&mut self, b0: f32, b1: f32, b2: f32, a1: f32, a2: f32) {
        if !b0.is_finite()
            || !b1.is_finite()
            || !b2.is_finite()
            || !a1.is_finite()
            || !a2.is_finite()
        {
            self.bypass = true;
            self.x1 = 0.0;
            self.x2 = 0.0;
            self.y1 = 0.0;
            self.y2 = 0.0;
            return;
        }

        self.b0 = b0;
        self.b1 = b1;
        self.b2 = b2;
        self.a1 = a1;
        self.a2 = a2;
        self.bypass = false;
    }

    fn step(&mut self, x: f32) -> f32 {
        if self.bypass {
            return x;
        }
        let y = self.b0 * x + self.b1 * self.x1 + self.b2 * self.x2 - self.a1 * self.y1 - self.a2 * self.y2;
        self.x2 = self.x1;
        self.x1 = x;
        self.y2 = self.y1;
        self.y1 = y;
        y
    }
}

#[derive(Clone, Copy)]
struct LpPole {
    b: f32,
    a: f32,
    y1: f32,
    bypass: bool,
}

impl LpPole {
    fn new() -> Self {
        Self {
            b: 1.0,
            a: 0.0,
            y1: 0.0,
            bypass: true,
        }
    }

    fn set_coeffs(&mut self, b: f32, a: f32) {
        if !b.is_finite() || !a.is_finite() {
            self.bypass = true;
            self.y1 = 0.0;
            return;
        }
        self.b = b;
        self.a = a;
        self.bypass = false;
    }

    fn step(&mut self, x: f32) -> f32 {
        if self.bypass {
            return x;
        }
        let y = self.b * x + self.a * self.y1;
        self.y1 = y;
        y
    }
}

#[repr(C)]
pub struct LfSource {
    sample_rate: f32,
    period_len: usize,
    pos_in_period: usize,
    voiced: bool,
    glottal: Biquad,
    tilt: LpPole,
    mode: LfMode,
}

impl LfSource {
    fn new(sample_rate: f32) -> Self {
        Self {
            sample_rate,
            period_len: 1,
            pos_in_period: 0,
            voiced: false,
            glottal: Biquad::new(),
            tilt: LpPole::new(),
            mode: LfMode::Legacy,
        }
    }

    fn set_mode(&mut self, mode: LfMode) {
        // CALM is anti-causal and cannot be implemented sample-by-sample.
        // Map to the causal LFLM form for real-time rendering.
        self.mode = match mode {
            LfMode::LfCalm => LfMode::LfLm,
            _ => mode,
        };
    }

    fn start_period(&mut self, f0: f32, rd: f32) {
        if !f0.is_finite() || f0 <= 0.0 || !rd.is_finite() {
            self.period_len = 1;
            self.pos_in_period = 0;
            self.voiced = false;
            return;
        }

        let f0_clamped = clamp(f0, 40.0, self.sample_rate * 0.45);
        let rd_clamped = clamp(rd, 0.3, 2.7);
        let t0 = 1.0 / f0_clamped;

        let ra = (-1.0 + 4.8 * rd_clamped) / 100.0;
        let rk = (22.4 + 11.8 * rd_clamped) / 100.0;
        let rg_denom = 0.44 * rd_clamped - 4.0 * ra * (0.5 + 1.2 * rk);
        if rg_denom.abs() < 1e-6 {
            self.voiced = false;
            return;
        }
        let rg = rk * (0.5 + 1.2 * rk) / rg_denom;

        let oq = (1.0 + rk) / (2.0 * rg);
        let alpha_m = 1.0 / (1.0 + rk);
        let ta = ra * t0;

        if !oq.is_finite() || !alpha_m.is_finite() || !ta.is_finite() || oq <= 0.0 || ta <= 0.0 {
            self.voiced = false;
            return;
        }

        let tan_term = (PI * (1.0 - alpha_m)).tan();
        if !tan_term.is_finite() || tan_term.abs() < 1e-6 {
            self.voiced = false;
            return;
        }

        let fg = 1.0 / (2.0 * oq * t0);
        let bg = 1.0 / (oq * t0 * tan_term);

        let a1 = -2.0 * f32::exp(-PI * bg / self.sample_rate)
            * f32::cos(2.0 * PI * fg / self.sample_rate);
        let a2 = f32::exp(-2.0 * PI * bg / self.sample_rate);
        let ag = 1.0;

        // LF_LM uses a causal z^-1 numerator. LF_CALM is non-causal; we fall
        // back to the causal form in real-time and verify CALM offline.
        let (b0, b1, b2) = match self.mode {
            LfMode::LfCalm => (0.0, -ag, ag),
            _ => (0.0, -ag, ag),
        };

        self.glottal.set_coeffs(b0, b1, b2, a1, a2);

        let fa = 1.0 / (2.0 * PI * ta);
        let pole = f32::exp(-2.0 * PI * fa / self.sample_rate);
        let b_st = 1.0 - pole;
        let a_st = pole;
        self.tilt.set_coeffs(b_st, a_st);

        self.period_len = (self.sample_rate / f0_clamped).round().max(1.0) as usize;
        self.pos_in_period = 0;
        self.voiced = true;
    }

    fn process(&mut self, f0: &[f32], rd: &[f32], output: &mut [f32]) {
        let f0_len = f0.len();
        let rd_len = rd.len();
        let len = output.len();

        for i in 0..len {
            if !self.voiced || self.pos_in_period >= self.period_len {
                let f0_value = if f0_len > 1 { f0[i] } else { f0[0] };
                let rd_value = if rd_len > 1 { rd[i] } else { rd[0] };
                self.start_period(f0_value, rd_value);
            }

            if !self.voiced {
                output[i] = 0.0;
                self.pos_in_period += 1;
                continue;
            }

            let impulse = if self.pos_in_period == 0 { 1.0 } else { 0.0 };
            let mut sample = self.glottal.step(impulse);
            sample = self.tilt.step(sample);
            output[i] = sample;
            self.pos_in_period += 1;
        }
    }
}

fn clamp(value: f32, min: f32, max: f32) -> f32 {
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

#[no_mangle]
pub extern "C" fn lf_source_new(sample_rate: f32) -> *mut LfSource {
    Box::into_raw(Box::new(LfSource::new(sample_rate)))
}

#[no_mangle]
pub extern "C" fn lf_source_set_mode(ptr: *mut LfSource, mode: u32) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        (*ptr).set_mode(LfMode::from_u32(mode));
    }
}

#[no_mangle]
pub extern "C" fn lf_source_free(ptr: *mut LfSource) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(Box::from_raw(ptr));
    }
}

#[no_mangle]
pub extern "C" fn lf_source_process(
    ptr: *mut LfSource,
    f0_ptr: *const f32,
    f0_len: usize,
    rd_ptr: *const f32,
    rd_len: usize,
    output_ptr: *mut f32,
    len: usize,
) {
    if ptr.is_null() || output_ptr.is_null() || len == 0 {
        return;
    }
    unsafe {
        let f0 = if f0_ptr.is_null() || f0_len == 0 {
            &[][..]
        } else {
            core::slice::from_raw_parts(f0_ptr, f0_len)
        };
        let rd = if rd_ptr.is_null() || rd_len == 0 {
            &[][..]
        } else {
            core::slice::from_raw_parts(rd_ptr, rd_len)
        };
        let output = core::slice::from_raw_parts_mut(output_ptr, len);
        if f0.is_empty() || rd.is_empty() {
            for sample in output.iter_mut() {
                *sample = 0.0;
            }
            return;
        }
        (*ptr).process(f0, rd, output);
    }
}

#[no_mangle]
pub extern "C" fn alloc_f32(len: usize) -> *mut f32 {
    let mut buf = Vec::<f32>::with_capacity(len);
    let ptr = buf.as_mut_ptr();
    core::mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern "C" fn dealloc_f32(ptr: *mut f32, len: usize) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, len);
    }
}
