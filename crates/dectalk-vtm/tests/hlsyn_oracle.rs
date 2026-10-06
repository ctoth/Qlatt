//! Replays DECtalk 4.63's own PH packets through the hlsyn port and compares
//! the low-level frame with the one DECtalk's `HLSynthesizeLLFrame` produced,
//! field by field. The target is exact equality of all 48 fields.
//!
//! Fixtures are `<id>.hl.txt` files written by
//! `scripts/oracle/export-dectalk-vtm-fixture.ts`, one trace event per line:
//!
//! - `S <uiSampleRate> <uiSampleRateChange> <51 words>`: a speaker definition
//!   packet; DECtalk calls `InitializeHLSynthesizer` with its `sex` word.
//! - `H <bytes> 0 <174 words>`: the `HLSpeaker` struct (float bits) in effect
//!   from the next frame on, after DECtalk's per-voice overrides.
//! - `P <lang> 0 <45 words>`: a PH packet as the VTM receives it.
//! - `L 0 0 <48 words>`: the `LLFrame` right after `HLSynthesizeLLFrame`.
//!
//! A full trace may also carry `X` (the `HLFrame` built from the packet) and
//! `T` (the `HLState` after the call) as float bits; when present they are
//! compared too, which localises a mismatch. `F`, `W`, `O` and `Q` lines are
//! ignored here.
//!
//! Set `DECTALK_VTM_FIXTURE_DIR` to also replay every `*.hl.txt` in another
//! directory.

use std::fs;
use std::path::{Path, PathBuf};

use dectalk_vtm::hlsyn::{HLSpeaker, HlSynth, HLSPEAKER_WORDS, LLFRAME_WORDS};
use dectalk_vtm::{SPDEF_PARS, VOICE_PARS};

/// Index of the `sex` word in a speaker definition packet
/// (`SPD_CHIP`, `PH/ph_defs.h:718`).
const SPD_SEX: usize = 23;

const LLFRAME_FIELDS: [&str; LLFRAME_WORDS] = [
    "NF0", "NAV", "NOQ", "NSQ", "NTL", "NFL", "NDI", "NAH", "NAF", "NF1", "NB1", "NDF1", "NDB1",
    "NF2", "NB2", "NF3", "NB3", "NF4", "NB4", "NF5", "NB5", "NF6", "NB6", "NFNP", "NBNP", "NFNZ",
    "NBNZ", "NFTP", "NBTP", "NFTZ", "NBTZ", "NA2F", "NA3F", "NA4F", "NA5F", "NA6F", "NAB", "NB2F",
    "NB3F", "NB4F", "NB5F", "NB6F", "NANV", "NA1V", "NA2V", "NA3V", "NA4V", "NATV",
];

const STATE_FIELDS: [&str; 17] = [
    "acl", "acd", "loc", "acx", "agx", "Pm", "Pcw", "Ug", "Uacx", "Un", "Uw", "f1c", "f1x", "b1x",
    "Cw", "Cg", "agf",
];

fn numbers<T, const N: usize>(fields: &[&str], path: &Path, line_no: usize) -> [T; N]
where
    T::Err: std::fmt::Display,
    T: std::str::FromStr + Copy + Default,
{
    assert_eq!(
        fields.len(),
        N,
        "{}:{}: expected {} words, found {}",
        path.display(),
        line_no,
        N,
        fields.len()
    );
    let mut out = [T::default(); N];
    for (slot, field) in out.iter_mut().zip(fields) {
        *slot = field
            .parse()
            .unwrap_or_else(|e| panic!("{}:{}: bad word {field:?}: {e}", path.display(), line_no));
    }
    out
}

#[derive(Default)]
struct Outcome {
    id: String,
    frames: usize,
    exact_frames: usize,
    field_mismatches: usize,
    max_abs_diff: i32,
    first_mismatch: Option<String>,
    hlframe_mismatches: usize,
    state_mismatches: usize,
    first_state_mismatch: Option<String>,
}

fn replay(path: &Path) -> Outcome {
    let text = fs::read_to_string(path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    let mut outcome = Outcome {
        id: path
            .file_name()
            .and_then(|name| name.to_str())
            .expect("fixture name")
            .to_string(),
        ..Outcome::default()
    };

    let mut hl = HlSynth::new();
    let mut pending_packet = None;
    let mut pending_hlframe = None;
    let mut frame_index = 0usize;
    for (index, line) in text.lines().enumerate() {
        let line_no = index + 1;
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let fields: Vec<&str> = line.split_ascii_whitespace().collect();
        assert!(
            fields.len() > 3,
            "{}:{}: truncated line",
            path.display(),
            line_no
        );
        let words = &fields[3..];
        match fields[0] {
            "S" => {
                let spdef: [i16; SPDEF_PARS] = numbers(words, path, line_no);
                // vtmiont.c:1643-1644.
                hl.InitializeHLSynthesizer(spdef[SPD_SEX] != 0);
            }
            "H" => {
                let bits: [u32; HLSPEAKER_WORDS] = numbers(words, path, line_no);
                hl.speaker = HLSpeaker::from_words(&bits);
            }
            "P" => {
                // The trace prints P when the packet arrives and H (if the
                // speaker changed) just before the call, so the frame runs
                // when its L line is reached.
                pending_packet = Some(numbers::<i16, VOICE_PARS>(words, path, line_no));
            }
            "X" => {
                pending_hlframe = Some(numbers::<u32, 15>(words, path, line_no));
            }
            "L" => {
                let expected: [i16; LLFRAME_WORDS] = numbers(words, path, line_no);
                let packet = pending_packet
                    .take()
                    .unwrap_or_else(|| panic!("{}:{}: L without P", path.display(), line_no));
                let actual = hl.synthesize_packet(&packet).to_words();
                frame_index += 1;
                if let Some(expected_hlframe) = pending_hlframe.take() {
                    if hl.frame.to_words() != expected_hlframe {
                        outcome.hlframe_mismatches += 1;
                    }
                }
                outcome.frames += 1;
                let mut exact = true;
                for (field, (ours, theirs)) in actual.iter().zip(&expected).enumerate() {
                    if ours != theirs {
                        exact = false;
                        outcome.field_mismatches += 1;
                        let diff = (i32::from(*ours) - i32::from(*theirs)).abs();
                        outcome.max_abs_diff = outcome.max_abs_diff.max(diff);
                        if outcome.first_mismatch.is_none() {
                            outcome.first_mismatch = Some(format!(
                                "frame {} {}: port {} DECtalk {}",
                                frame_index - 1,
                                LLFRAME_FIELDS[field],
                                ours,
                                theirs
                            ));
                        }
                    }
                }
                if exact {
                    outcome.exact_frames += 1;
                }
            }
            "T" => {
                let expected: [u32; 17] = numbers(words, path, line_no);
                let actual = hl.state.to_words();
                for (field, (ours, theirs)) in actual.iter().zip(&expected).enumerate() {
                    if ours != theirs {
                        outcome.state_mismatches += 1;
                        if outcome.first_state_mismatch.is_none() {
                            outcome.first_state_mismatch = Some(format!(
                                "frame {} {}: port {:e} DECtalk {:e}",
                                frame_index - 1,
                                STATE_FIELDS[field],
                                f32::from_bits(*ours),
                                f32::from_bits(*theirs)
                            ));
                        }
                    }
                }
                // The port keeps its own state; it is never resynchronised to
                // DECtalk's, so a difference here carries into later frames.
            }
            // V belongs to the speaker setup, which tests/vtmio_oracle.rs checks.
            "F" | "W" | "O" | "Q" | "V" => {}
            other => panic!("{}:{}: unknown event {other:?}", path.display(), line_no),
        }
    }
    outcome
}

fn hl_fixtures(dir: &Path) -> Vec<PathBuf> {
    let mut paths: Vec<PathBuf> = fs::read_dir(dir)
        .unwrap_or_else(|e| panic!("{}: {e}", dir.display()))
        .map(|entry| entry.expect("directory entry").path())
        .filter(|path| {
            path.file_name()
                .and_then(|name| name.to_str())
                .is_some_and(|name| name.ends_with(".hl.txt"))
        })
        .collect();
    paths.sort();
    paths
}

fn replay_directory(dir: &Path) {
    let fixtures = hl_fixtures(dir);
    assert!(!fixtures.is_empty(), "no *.hl.txt in {}", dir.display());

    let mut failures = Vec::new();
    for path in &fixtures {
        let outcome = replay(path);
        println!(
            "{}: frames={} exact_frames={} field_mismatches={} max_abs_diff={} first_mismatch={} hlframe_mismatches={} state_mismatches={} first_state_mismatch={}",
            outcome.id,
            outcome.frames,
            outcome.exact_frames,
            outcome.field_mismatches,
            outcome.max_abs_diff,
            outcome.first_mismatch.as_deref().unwrap_or("none"),
            outcome.hlframe_mismatches,
            outcome.state_mismatches,
            outcome.first_state_mismatch.as_deref().unwrap_or("none"),
        );
        if outcome.frames == 0
            || outcome.exact_frames != outcome.frames
            || outcome.hlframe_mismatches != 0
            || outcome.state_mismatches != 0
        {
            failures.push(outcome.id);
        }
    }
    assert!(
        failures.is_empty(),
        "hlsyn port differs from DECtalk in {}: {failures:?}",
        dir.display()
    );
}

#[test]
fn hlsyn_reproduces_dectalk_llframes_exactly() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures");
    replay_directory(&dir);
}

#[test]
fn hlsyn_reproduces_extra_fixture_directory_exactly() {
    let Ok(dir) = std::env::var("DECTALK_VTM_FIXTURE_DIR") else {
        println!("DECTALK_VTM_FIXTURE_DIR not set; nothing replayed");
        return;
    };
    replay_directory(Path::new(&dir));
}

/// `InitializeHLSynthesizer` must give DECtalk's `HLSpeaker` bit for bit in
/// every field except the ones DECtalk's per-voice code
/// (`initDefaultSpeakerValues` and `changeSpeakerValues`,
/// `VTM/vtmiont.c:2899-3460`, ported in `vtmio`) assigns: B1m-B5m, B2F-B5F, B6F, F5,
/// F6, OQm, TLm, acd_f1Break, f1HiShift, agm and f1Max.
#[test]
fn initialize_matches_dectalk_speaker_outside_the_per_voice_fields() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures");
    let mut speakers_checked = 0;
    for path in hl_fixtures(&dir) {
        let text = fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
        let mut is_male = None;
        for (index, line) in text.lines().enumerate() {
            let fields: Vec<&str> = line.split_ascii_whitespace().collect();
            match fields.first() {
                Some(&"S") => {
                    let spdef: [i16; SPDEF_PARS] = numbers(&fields[3..], &path, index + 1);
                    is_male = Some(spdef[SPD_SEX] != 0);
                }
                Some(&"H") => {
                    let bits: [u32; HLSPEAKER_WORDS] = numbers(&fields[3..], &path, index + 1);
                    let dectalk = HLSpeaker::from_words(&bits);
                    let mut hl = HlSynth::new();
                    hl.InitializeHLSynthesizer(is_male.expect("S before H"));
                    let mut ours = hl.speaker;
                    ours.B1m = dectalk.B1m;
                    ours.B2m = dectalk.B2m;
                    ours.B3m = dectalk.B3m;
                    ours.B4m = dectalk.B4m;
                    ours.B5m = dectalk.B5m;
                    ours.B2F = dectalk.B2F;
                    ours.B3F = dectalk.B3F;
                    ours.B4F = dectalk.B4F;
                    ours.B5F = dectalk.B5F;
                    ours.B6F = dectalk.B6F;
                    ours.F5 = dectalk.F5;
                    ours.F6 = dectalk.F6;
                    ours.OQm = dectalk.OQm;
                    ours.TLm = dectalk.TLm;
                    ours.acd_f1Break = dectalk.acd_f1Break;
                    ours.f1HiShift = dectalk.f1HiShift;
                    ours.agm = dectalk.agm;
                    ours.f1Max = dectalk.f1Max;
                    assert_eq!(
                        ours.to_words(),
                        bits,
                        "{}:{}: speaker constants differ from DECtalk's",
                        path.display(),
                        index + 1
                    );
                    speakers_checked += 1;
                }
                _ => {}
            }
        }
    }
    assert!(
        speakers_checked >= 4,
        "only {speakers_checked} speakers checked"
    );
}
