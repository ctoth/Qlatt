//! DECtalk 4.63's VTM thread as one host node: PH packets and speaker
//! definitions in, audio at the host's sample rate out.
//!
//! Per packet it runs what `dapi/src/VTM/vtmiont.c` runs: [`VtmIo`]
//! (`vtmiont.c:656-1319`: hlsyn and the overrides) and then [`Vtm`]
//! (`speech_waveform_generator`, called at `vtmiont.c:1351`). The 71 samples
//! of each frame are DECtalk's, bit for bit; [`Resampler`] then converts them
//! to the host rate. The words of a packet and of a speaker definition are
//! described in `scripts/oracle/dectalk-debug/ph-contract.md`.
//!
//! This module is not DECtalk code. It is the owned definition of the
//! `dectalk-vtm` primitive (`docs/host-contract.md`, section 3), and the rest
//! of this comment is that definition.
//!
//! # Frame clock
//!
//! DECtalk's VTM thread has no clock: it makes one frame per packet it is
//! sent. A host that schedules parameters against time needs one, so the node
//! keeps DECtalk's frame period, 71 samples at 11025 Hz (`VTM/vtm3.c:2400-2411`).
//!
//! [`Backend::start`] begins a run at an output sample of the host's choosing.
//! Counting output samples `m` from there at the host rate `R`, frame `n` is
//! due at
//!
//! ```text
//! m = floor(n * 71 * R / 11025) + LATCH_GUARD
//! ```
//!
//! and the host must hand over frame `n`'s packet ([`Backend::frame`]), or end
//! the run ([`Backend::stop`]), when [`Backend::samples_until_frame`] reaches
//! 0, before rendering further. The packet is the host's parameter values at
//! that output sample. [`LATCH_GUARD`] puts the instant just after the frame
//! boundary, so that a parameter change a host scheduled for the boundary
//! itself has taken effect whichever way its time was rounded to a sample.
//!
//! # Output and delay
//!
//! Output sample `m` of a run is the resampled signal at input position
//! `(m - delay) * 11025 / R`, where the input is the run's frames laid end to
//! end from position 0, and
//!
//! ```text
//! delay = LATCH_GUARD + ceil(lookahead * R / 11025)      (Backend::delay)
//! ```
//!
//! with `lookahead` the resampler's (0 at 11025 Hz, 16 input samples
//! otherwise). That is the node's whole latency: 2 samples at 11025 Hz, 72
//! samples (1.5 ms) at 48000 Hz. It is what makes every output sample
//! computable from frames already handed over: at output sample `m` the
//! frames due so far cover the input up to `(m - LATCH_GUARD) * 11025 / R`.
//! Before `delay` samples have passed, and before the first run, the output
//! is zero.
//!
//! After [`Backend::stop`] no further frame is due; the output continues from
//! the frames already made, followed by zeros.
//!
//! # A run starts from DECtalk's start-up state
//!
//! [`Backend::start`] replaces the model with a new one (the `calloc`ed
//! `VTM_T` of `vtmiont.c:447` after `DTSetSampleRate`, line 515) and forgets
//! the previous run's audio. A frame is refused until a speaker definition has
//! been loaded, because DECtalk's start-up also runs
//! `InitializeHLSynthesizer` (`vtmiont.c:479-480`) and its first packet is
//! always a speaker definition.
//!
//! # Faults
//!
//! A packet or speaker definition for which the C would read a table out of
//! bounds or divide by zero ([`VtmError`], [`HlError`]) is not run to
//! completion as DECtalk's memory would have it. The call returns the fault,
//! the model is put back to its state before the call, and for a packet the
//! frame's 71 samples are zero. So a faulted frame is silence and leaves no
//! trace in later frames.
//!
//! # Numbers that are not from DECtalk
//!
//! - [`LATCH_GUARD`], 2 output samples: engineering estimate. A host converts
//!   a scheduled time to a sample index by rounding, at the start of the run
//!   and at each frame, so a change meant for a frame boundary can land up to
//!   two samples after the instant computed here.
//! - The resampler's own constants, listed in [`crate::resample`].

use crate::hlsyn::HlError;
use crate::resample::{Resampler, IN_RATE};
use crate::vtmio::VtmIo;
use crate::{Vtm, VtmError, DECTALK_VTM_BAD_ARGUMENT, SPDEF_PARS, VOICE_PARS};

/// Samples in a frame at 11025 Hz, `VTM/vtm3.c:2411`.
pub const FRAME_SAMPLES: usize = 71;

/// Output samples after a frame boundary at which the frame's packet is taken.
/// Engineering estimate (see the module documentation).
pub const LATCH_GUARD: u64 = 2;

/// Why a call did not run the model.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BackendError {
    /// The vocal tract model faulted.
    Vtm(VtmError),
    /// hlsyn faulted.
    Hl(HlError),
    /// A packet arrived before any speaker definition in this run.
    NoSpeaker,
    /// A packet or speaker definition arrived outside a run.
    NotRunning,
}

impl BackendError {
    /// A stable negative code for the C ABI: [`VtmError::code`] (-2..=-6),
    /// [`HlError::code`] (-7, -8), then -9 and -10.
    pub fn code(self) -> i32 {
        match self {
            BackendError::Vtm(error) => error.code(),
            BackendError::Hl(error) => error.code(),
            BackendError::NoSpeaker => -9,
            BackendError::NotRunning => -10,
        }
    }

    /// The offending table index, or 0 for a fault that has none.
    pub fn detail(self) -> i32 {
        match self {
            BackendError::Vtm(
                VtmError::AmplitudeIndex(index)
                | VtmError::CosineIndex(index)
                | VtmError::RadiusIndex(index)
                | VtmError::OpenPhaseIndex(index),
            ) => index,
            BackendError::Hl(error) => error.index(),
            BackendError::Vtm(VtmError::NasalZeroDivide)
            | BackendError::NoSpeaker
            | BackendError::NotRunning => 0,
        }
    }
}

impl core::fmt::Display for BackendError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            BackendError::Vtm(error) => write!(f, "{error}"),
            BackendError::Hl(error) => write!(f, "{error}"),
            BackendError::NoSpeaker => write!(f, "voice packet before a speaker definition"),
            BackendError::NotRunning => write!(f, "packet outside a run"),
        }
    }
}

impl std::error::Error for BackendError {}

/// The node. See the module documentation.
#[derive(Clone, Debug)]
pub struct Backend {
    io: VtmIo,
    vtm: Vtm,
    resampler: Resampler,
    out_rate: u64,
    running: bool,
    speaker_loaded: bool,
    /// Frames handed over in this run, faulted ones included.
    frames: u64,
    /// Output samples rendered in this run.
    rendered: u64,
    /// The last frame as the vocal tract model read it, and its samples.
    last_frame: [i16; VOICE_PARS],
    last_samples: [i16; FRAME_SAMPLES],
    last_fault: Option<BackendError>,
}

impl Backend {
    /// `None` unless `out_rate >= 11025`.
    pub fn new(out_rate: u32) -> Option<Self> {
        let resampler = Resampler::new(out_rate)?;
        let vtm = Vtm::new();
        debug_assert_eq!(vtm.samples_per_frame(), FRAME_SAMPLES);
        debug_assert_eq!(u64::from(vtm.sample_rate()), IN_RATE);
        Some(Self {
            io: VtmIo::new(),
            vtm,
            resampler,
            out_rate: u64::from(out_rate),
            running: false,
            speaker_loaded: false,
            frames: 0,
            rendered: 0,
            last_frame: [0; VOICE_PARS],
            last_samples: [0; FRAME_SAMPLES],
            last_fault: None,
        })
    }

    /// Output samples between an input position and its appearance.
    pub fn delay(&self) -> u64 {
        LATCH_GUARD + self.resampler.delay()
    }

    /// Whether a run is in progress (started and not stopped).
    pub fn is_running(&self) -> bool {
        self.running
    }

    /// Begins a run at the next rendered sample, from DECtalk's start-up
    /// state.
    pub fn start(&mut self) {
        self.io = VtmIo::new();
        self.vtm = Vtm::new();
        self.resampler.clear();
        self.running = true;
        self.speaker_loaded = false;
        self.frames = 0;
        self.rendered = 0;
        self.last_fault = None;
    }

    /// Ends the run: no further frame is due. Rendering continues with the
    /// frames already made, then zeros.
    pub fn stop(&mut self) {
        self.running = false;
    }

    /// Output samples to render before the next frame is due; 0 means it is
    /// due now. `u64::MAX` outside a run.
    pub fn samples_until_frame(&self) -> u64 {
        if !self.running {
            return u64::MAX;
        }
        let due = self.frames * FRAME_SAMPLES as u64 * self.out_rate / IN_RATE + LATCH_GUARD;
        due.saturating_sub(self.rendered)
    }

    /// A speaker definition packet with the three values DECtalk's speaker
    /// setup reads from memory shared with PH, `vtmiont.c:1616-1645`.
    pub fn speaker(
        &mut self,
        spdef: &[i16; SPDEF_PARS],
        last_voice: i32,
        nom_open_quo: i16,
        tiltm: i16,
    ) -> Result<(), BackendError> {
        if !self.running {
            return Err(self.fault(BackendError::NotRunning));
        }
        let before = self.vtm.clone();
        if let Err(error) = self.vtm.load_speaker_definition(spdef) {
            self.vtm = before;
            return Err(self.fault(BackendError::Vtm(error)));
        }
        self.io
            .speaker_packet(spdef, last_voice, nom_open_quo, tiltm);
        self.speaker_loaded = true;
        Ok(())
    }

    /// The frame that is due: one voice packet through hlsyn, the overrides
    /// and the vocal tract model. `lang_curr` and `vol_att` are
    /// `pKsd_t->lang_curr` and `pKsd_t->vol_att`. Returns the frame's 71
    /// samples at 11025 Hz; on a fault they are zero.
    pub fn frame(
        &mut self,
        packet: &[i16; VOICE_PARS],
        lang_curr: i32,
        vol_att: i32,
    ) -> Result<&[i16; FRAME_SAMPLES], BackendError> {
        if !self.running {
            return Err(self.fault(BackendError::NotRunning));
        }
        let result = self.run_packet(packet, lang_curr, vol_att);
        if result.is_err() {
            self.last_frame = [0; VOICE_PARS];
            self.last_samples = [0; FRAME_SAMPLES];
        }
        self.resampler.push(&self.last_samples);
        self.frames += 1;
        match result {
            Ok(()) => Ok(&self.last_samples),
            Err(error) => Err(self.fault(error)),
        }
    }

    /// Takes the frame that is due without running the model: 71 zero samples.
    /// For a host that could not form a packet (a parameter that is not a
    /// 16-bit word). The model's state does not change.
    pub fn silent_frame(&mut self) -> Result<(), BackendError> {
        if !self.running {
            return Err(self.fault(BackendError::NotRunning));
        }
        self.last_frame = [0; VOICE_PARS];
        self.last_samples = [0; FRAME_SAMPLES];
        self.resampler.push(&self.last_samples);
        self.frames += 1;
        Ok(())
    }

    fn run_packet(
        &mut self,
        packet: &[i16; VOICE_PARS],
        lang_curr: i32,
        vol_att: i32,
    ) -> Result<(), BackendError> {
        if !self.speaker_loaded {
            return Err(BackendError::NoSpeaker);
        }
        let io_before = self.io.clone();
        let frame = match self.io.try_voice_packet(packet, lang_curr) {
            Ok(frame) => frame,
            Err(error) => {
                self.io = io_before;
                return Err(BackendError::Hl(error));
            }
        };
        let vtm_before = self.vtm.clone();
        match self.vtm.speech_waveform_generator(&frame, vol_att) {
            Ok(samples) => {
                self.last_samples.copy_from_slice(samples);
                self.last_frame = frame;
                Ok(())
            }
            Err(error) => {
                self.io = io_before;
                self.vtm = vtm_before;
                Err(BackendError::Vtm(error))
            }
        }
    }

    fn fault(&mut self, error: BackendError) -> BackendError {
        self.last_fault = Some(error);
        error
    }

    /// The fault of the most recent failed call in this run.
    pub fn last_fault(&self) -> Option<BackendError> {
        self.last_fault
    }

    /// The last frame as the vocal tract model read it (the `F` record of
    /// `vtm-trace.md`); zero after a faulted frame.
    pub fn last_frame_words(&self) -> &[i16; VOICE_PARS] {
        &self.last_frame
    }

    /// The last frame's samples at 11025 Hz; zero after a faulted frame.
    pub fn last_frame_samples(&self) -> &[i16; FRAME_SAMPLES] {
        &self.last_samples
    }

    /// Renders the next `out.len()` output samples. Returns how many of them
    /// came before a frame that was due and not handed over; those are zero
    /// and the run's later output is shifted, so a nonzero result is a host
    /// error.
    pub fn render(&mut self, out: &mut [f32]) -> usize {
        let delay = self.delay();
        let mut late = 0;
        for sample in out.iter_mut() {
            if self.running && self.samples_until_frame() == 0 {
                late += 1;
                *sample = 0.0;
                continue;
            }
            *sample = if self.rendered >= delay {
                self.resampler.output(self.rendered - delay)
            } else {
                0.0
            };
            self.rendered += 1;
        }
        late
    }
}

// FFI exports, in the pattern of the other primitives: the host allocates
// buffers in WASM memory, writes a packet, makes one call per event and reads
// samples back.

/// A node for the given output rate, or null unless the rate is a whole number
/// of Hz, at least 11025 and below 2^32.
#[no_mangle]
pub extern "C" fn dectalk_backend_new(sample_rate: f64) -> *mut Backend {
    if !sample_rate.is_finite()
        || sample_rate < IN_RATE as f64
        || sample_rate > f64::from(u32::MAX)
        || sample_rate != libm::floor(sample_rate)
    {
        return core::ptr::null_mut();
    }
    match Backend::new(sample_rate as u32) {
        Some(backend) => Box::into_raw(Box::new(backend)),
        None => core::ptr::null_mut(),
    }
}

/// # Safety
/// `ptr` must be null or a live pointer returned by `dectalk_backend_new`.
#[no_mangle]
pub unsafe extern "C" fn dectalk_backend_free(ptr: *mut Backend) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}

/// [`Backend::delay`], or 0 for null.
///
/// # Safety
/// `ptr` must be null or a live pointer returned by `dectalk_backend_new`.
#[no_mangle]
pub unsafe extern "C" fn dectalk_backend_delay(ptr: *const Backend) -> u32 {
    match ptr.as_ref() {
        Some(backend) => backend.delay() as u32,
        None => 0,
    }
}

/// [`Backend::start`].
///
/// # Safety
/// `ptr` must be null or a live pointer returned by `dectalk_backend_new`.
#[no_mangle]
pub unsafe extern "C" fn dectalk_backend_start(ptr: *mut Backend) {
    if let Some(backend) = ptr.as_mut() {
        backend.start();
    }
}

/// [`Backend::stop`].
///
/// # Safety
/// `ptr` must be null or a live pointer returned by `dectalk_backend_new`.
#[no_mangle]
pub unsafe extern "C" fn dectalk_backend_stop(ptr: *mut Backend) {
    if let Some(backend) = ptr.as_mut() {
        backend.stop();
    }
}

/// [`Backend::samples_until_frame`], saturated to `u32::MAX` (which it also
/// returns outside a run and for null).
///
/// # Safety
/// `ptr` must be null or a live pointer returned by `dectalk_backend_new`.
#[no_mangle]
pub unsafe extern "C" fn dectalk_backend_samples_until_frame(ptr: *const Backend) -> u32 {
    match ptr.as_ref() {
        Some(backend) => u32::try_from(backend.samples_until_frame()).unwrap_or(u32::MAX),
        None => u32::MAX,
    }
}

/// [`Backend::speaker`] with exactly `SPDEF_PARS` words. Returns 0,
/// `DECTALK_VTM_BAD_ARGUMENT`, or a [`BackendError::code`].
///
/// # Safety
/// `ptr` must be null or a live pointer returned by `dectalk_backend_new`;
/// `words` must be null or valid for reading `words_len` 16-bit words.
#[no_mangle]
pub unsafe extern "C" fn dectalk_backend_speaker(
    ptr: *mut Backend,
    words: *const i16,
    words_len: usize,
    last_voice: i32,
    nom_open_quo: i32,
    tiltm: i32,
) -> i32 {
    let Some(backend) = ptr.as_mut() else {
        return DECTALK_VTM_BAD_ARGUMENT;
    };
    let (Ok(nom_open_quo), Ok(tiltm)) = (i16::try_from(nom_open_quo), i16::try_from(tiltm)) else {
        return DECTALK_VTM_BAD_ARGUMENT;
    };
    if words.is_null() || words_len != SPDEF_PARS {
        return DECTALK_VTM_BAD_ARGUMENT;
    }
    let mut spdef = [0i16; SPDEF_PARS];
    spdef.copy_from_slice(core::slice::from_raw_parts(words, SPDEF_PARS));
    match backend.speaker(&spdef, last_voice, nom_open_quo, tiltm) {
        Ok(()) => 0,
        Err(error) => error.code(),
    }
}

/// [`Backend::frame`] with exactly `VOICE_PARS` words. Returns the number of
/// 11025 Hz samples made (71), `DECTALK_VTM_BAD_ARGUMENT` (the frame is then
/// still due), or a [`BackendError::code`] (the frame was taken and is
/// silent, except for the not-running code).
///
/// # Safety
/// `ptr` must be null or a live pointer returned by `dectalk_backend_new`;
/// `packet` must be null or valid for reading `packet_len` 16-bit words.
#[no_mangle]
pub unsafe extern "C" fn dectalk_backend_frame(
    ptr: *mut Backend,
    packet: *const i16,
    packet_len: usize,
    lang_curr: i32,
    vol_att: i32,
) -> i32 {
    let Some(backend) = ptr.as_mut() else {
        return DECTALK_VTM_BAD_ARGUMENT;
    };
    if packet.is_null() || packet_len != VOICE_PARS {
        return DECTALK_VTM_BAD_ARGUMENT;
    }
    let mut words = [0i16; VOICE_PARS];
    words.copy_from_slice(core::slice::from_raw_parts(packet, VOICE_PARS));
    match backend.frame(&words, lang_curr, vol_att) {
        Ok(samples) => samples.len() as i32,
        Err(error) => error.code(),
    }
}

/// [`Backend::silent_frame`]. Returns 0, `DECTALK_VTM_BAD_ARGUMENT`, or a
/// [`BackendError::code`].
///
/// # Safety
/// `ptr` must be null or a live pointer returned by `dectalk_backend_new`.
#[no_mangle]
pub unsafe extern "C" fn dectalk_backend_silent_frame(ptr: *mut Backend) -> i32 {
    let Some(backend) = ptr.as_mut() else {
        return DECTALK_VTM_BAD_ARGUMENT;
    };
    match backend.silent_frame() {
        Ok(()) => 0,
        Err(error) => error.code(),
    }
}

/// [`BackendError::detail`] of the most recent failed call, or 0.
///
/// # Safety
/// `ptr` must be null or a live pointer returned by `dectalk_backend_new`.
#[no_mangle]
pub unsafe extern "C" fn dectalk_backend_fault_detail(ptr: *const Backend) -> i32 {
    match ptr.as_ref().and_then(Backend::last_fault) {
        Some(error) => error.detail(),
        None => 0,
    }
}

/// Copies [`Backend::last_frame_samples`] to `out` (at least 71 samples).
/// Returns the number written or `DECTALK_VTM_BAD_ARGUMENT`.
///
/// # Safety
/// `ptr` must be null or a live pointer returned by `dectalk_backend_new`;
/// `out` must be null or valid for writing `out_len` 16-bit samples.
#[no_mangle]
pub unsafe extern "C" fn dectalk_backend_frame_samples(
    ptr: *const Backend,
    out: *mut i16,
    out_len: usize,
) -> i32 {
    let Some(backend) = ptr.as_ref() else {
        return DECTALK_VTM_BAD_ARGUMENT;
    };
    if out.is_null() || out_len < FRAME_SAMPLES {
        return DECTALK_VTM_BAD_ARGUMENT;
    }
    core::slice::from_raw_parts_mut(out, FRAME_SAMPLES)
        .copy_from_slice(backend.last_frame_samples());
    FRAME_SAMPLES as i32
}

/// Copies [`Backend::last_frame_words`] to `out` (at least `VOICE_PARS`
/// words). Returns the number written or `DECTALK_VTM_BAD_ARGUMENT`.
///
/// # Safety
/// `ptr` must be null or a live pointer returned by `dectalk_backend_new`;
/// `out` must be null or valid for writing `out_len` 16-bit words.
#[no_mangle]
pub unsafe extern "C" fn dectalk_backend_frame_words(
    ptr: *const Backend,
    out: *mut i16,
    out_len: usize,
) -> i32 {
    let Some(backend) = ptr.as_ref() else {
        return DECTALK_VTM_BAD_ARGUMENT;
    };
    if out.is_null() || out_len < VOICE_PARS {
        return DECTALK_VTM_BAD_ARGUMENT;
    }
    core::slice::from_raw_parts_mut(out, VOICE_PARS).copy_from_slice(backend.last_frame_words());
    VOICE_PARS as i32
}

/// [`Backend::render`] into `out`. Returns the number of late samples, or
/// `DECTALK_VTM_BAD_ARGUMENT`.
///
/// # Safety
/// `ptr` must be null or a live pointer returned by `dectalk_backend_new`;
/// `out` must be null or valid for writing `len` `f32` samples.
#[no_mangle]
pub unsafe extern "C" fn dectalk_backend_render(
    ptr: *mut Backend,
    out: *mut f32,
    len: usize,
) -> i32 {
    let Some(backend) = ptr.as_mut() else {
        return DECTALK_VTM_BAD_ARGUMENT;
    };
    if out.is_null() {
        return DECTALK_VTM_BAD_ARGUMENT;
    }
    backend.render(core::slice::from_raw_parts_mut(out, len)) as i32
}

klatt_wasm_common::export_alloc_fns!();

#[cfg(test)]
mod tests {
    use super::*;

    /// Perfect Paul's speaker definition packet: the `S` line of
    /// `tests/fixtures/paul-cat.hl.txt`.
    fn paul_spdef() -> [i16; SPDEF_PARS] {
        let mut spdef = [0i16; SPDEF_PARS];
        spdef[..24].copy_from_slice(&[
            3503, 260, 6000, 6000, 3550, 4850, 0, 87, 66, 58, 59, 76, 9800, 0, 0, 4100, 64, 87, 65,
            64, 0, 0, 0, 1,
        ]);
        spdef
    }

    /// The second `P` line of `tests/fixtures/paul-cat.hl.txt`.
    fn paul_packet() -> [i16; VOICE_PARS] {
        let mut packet = [0i16; VOICE_PARS];
        packet[..33].copy_from_slice(&[
            0, 279, 0, 0, 0, 0, 0, 0, 0, 979, 0, 2091, 2702, 290, 300, 210, 280, 256, 4, 305, 290,
            0, 3500, 0, 0, 1410, 1000, 0, 1000, 200, 50, 0, 0,
        ]);
        packet
    }

    #[test]
    fn frames_fall_due_every_71_samples_at_11025_hz() {
        let mut backend = Backend::new(11025).expect("supported rate");
        assert_eq!(backend.delay(), LATCH_GUARD);
        assert_eq!(backend.samples_until_frame(), u64::MAX);
        backend.start();
        backend
            .speaker(&paul_spdef(), 0, 0, 0)
            .expect("speaker loads");
        let mut out = [0.0f32; 71];
        for n in 0..4u64 {
            let wait = backend.samples_until_frame();
            assert_eq!(wait, if n == 0 { LATCH_GUARD } else { 71 });
            assert_eq!(backend.render(&mut out[..wait as usize]), 0);
            assert_eq!(backend.samples_until_frame(), 0);
            backend.frame(&paul_packet(), 0, 100).expect("frame runs");
        }
    }

    #[test]
    fn frames_fall_due_at_the_floor_of_the_frame_boundary_at_48000_hz() {
        let mut backend = Backend::new(48000).expect("supported rate");
        // 2 + ceil(16 * 48000 / 11025).
        assert_eq!(backend.delay(), 72);
        backend.start();
        backend
            .speaker(&paul_spdef(), 0, 0, 0)
            .expect("speaker loads");
        let mut rendered = 0u64;
        let mut out = vec![0.0f32; 400];
        for n in 0..300u64 {
            let wait = backend.samples_until_frame() as usize;
            assert_eq!(backend.render(&mut out[..wait]), 0);
            rendered += wait as u64;
            assert_eq!(rendered, n * 71 * 48000 / 11025 + LATCH_GUARD);
            backend.frame(&paul_packet(), 0, 100).expect("frame runs");
        }
    }

    #[test]
    fn rendering_past_a_due_frame_is_reported_and_does_not_advance() {
        let mut backend = Backend::new(11025).expect("supported rate");
        backend.start();
        let mut out = [1.0f32; 10];
        assert_eq!(backend.render(&mut out), 8);
        assert_eq!(out, [0.0; 10]);
        assert_eq!(backend.samples_until_frame(), 0);
    }

    #[test]
    fn a_packet_before_a_speaker_definition_is_a_silent_frame() {
        let mut backend = Backend::new(11025).expect("supported rate");
        assert_eq!(
            backend.frame(&paul_packet(), 0, 100),
            Err(BackendError::NotRunning)
        );
        backend.start();
        assert_eq!(
            backend.frame(&paul_packet(), 0, 100),
            Err(BackendError::NoSpeaker)
        );
        assert_eq!(backend.last_frame_samples(), &[0; FRAME_SAMPLES]);
        // The frame was taken: the next one is due 71 samples later.
        assert_eq!(backend.samples_until_frame(), 71 + LATCH_GUARD);
    }

    #[test]
    fn a_faulted_frame_is_silent_and_leaves_no_trace() {
        let mut clean = Backend::new(11025).expect("supported rate");
        let mut faulted = Backend::new(11025).expect("supported rate");
        for backend in [&mut clean, &mut faulted] {
            backend.start();
            backend
                .speaker(&paul_spdef(), 0, 0, 0)
                .expect("speaker loads");
            backend.frame(&paul_packet(), 0, 100).expect("frame runs");
        }

        // F2 of 5000 Hz is beyond the cosine table (`VtmError::CosineIndex`).
        let mut bad = paul_packet();
        bad[crate::OUT_F2] = 5000;
        let error = faulted.frame(&bad, 0, 100).expect_err("fault");
        assert!(matches!(error, BackendError::Vtm(_)), "{error:?}");
        assert_eq!(faulted.last_fault(), Some(error));
        assert_eq!(faulted.last_frame_samples(), &[0; FRAME_SAMPLES]);

        // Both now run the same packets and must produce the same samples.
        for _ in 0..20 {
            let expected = *clean.frame(&paul_packet(), 0, 100).expect("frame runs");
            let actual = *faulted.frame(&paul_packet(), 0, 100).expect("frame runs");
            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn a_silent_frame_leaves_the_model_as_it_was() {
        let mut clean = Backend::new(11025).expect("supported rate");
        let mut skipped = Backend::new(11025).expect("supported rate");
        for backend in [&mut clean, &mut skipped] {
            backend.start();
            backend
                .speaker(&paul_spdef(), 0, 0, 0)
                .expect("speaker loads");
            backend.frame(&paul_packet(), 0, 100).expect("frame runs");
        }
        skipped.silent_frame().expect("in a run");
        assert_eq!(skipped.last_frame_samples(), &[0; FRAME_SAMPLES]);
        assert_eq!(skipped.samples_until_frame(), 2 * 71 + LATCH_GUARD);
        for _ in 0..20 {
            let expected = *clean.frame(&paul_packet(), 0, 100).expect("frame runs");
            let actual = *skipped.frame(&paul_packet(), 0, 100).expect("frame runs");
            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn a_faulted_speaker_definition_keeps_the_previous_one() {
        let mut backend = Backend::new(11025).expect("supported rate");
        backend.start();
        // A cascade gain of 88 dB is beyond `amptable`.
        let mut bad = paul_spdef();
        bad[crate::SPD_R1CA] = 88;
        let error = backend.speaker(&bad, 0, 0, 0).expect_err("fault");
        assert_eq!(error, BackendError::Vtm(VtmError::AmplitudeIndex(88)));
        assert_eq!(error.detail(), 88);
        assert_eq!(
            backend.frame(&paul_packet(), 0, 100),
            Err(BackendError::NoSpeaker)
        );
    }

    #[test]
    fn start_gives_the_same_samples_as_a_new_node() {
        let mut reused = Backend::new(11025).expect("supported rate");
        reused.start();
        reused
            .speaker(&paul_spdef(), 0, 0, 0)
            .expect("speaker loads");
        for _ in 0..30 {
            reused.frame(&paul_packet(), 0, 100).expect("frame runs");
        }
        reused.stop();

        let mut fresh = Backend::new(11025).expect("supported rate");
        for backend in [&mut reused, &mut fresh] {
            backend.start();
            backend
                .speaker(&paul_spdef(), 0, 0, 0)
                .expect("speaker loads");
        }
        for _ in 0..30 {
            let expected = *fresh.frame(&paul_packet(), 0, 100).expect("frame runs");
            let actual = *reused.frame(&paul_packet(), 0, 100).expect("frame runs");
            assert_eq!(actual, expected);
        }
    }

    #[test]
    fn ffi_refuses_unsupported_rates() {
        assert!(dectalk_backend_new(8000.0).is_null());
        assert!(dectalk_backend_new(44100.5).is_null());
        assert!(dectalk_backend_new(f64::NAN).is_null());
        let backend = dectalk_backend_new(44100.0);
        assert!(!backend.is_null());
        // 2 + 16 * 4.
        assert_eq!(unsafe { dectalk_backend_delay(backend) }, 66);
        unsafe { dectalk_backend_free(backend) };
    }
}
