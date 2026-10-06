//! Runs the whole VTM-thread path on DECtalk 4.63's own PH packets: hlsyn,
//! the overrides of `vtmiont.c`, then the vocal tract model. Two things are
//! compared, both for exact equality:
//!
//! - the 45-word frame produced for each packet, against the frame DECtalk
//!   handed to `speech_waveform_generator` (the `F` lines of
//!   `<id>.frames.txt`);
//! - the samples generated from the port's own frames, against the stock
//!   `say.exe` WAV (`<id>.wav`).
//!
//! Input comes from `<id>.hl.txt`: `S` (speaker definition packet), `V` (the
//! voice number and the two values DECtalk's speaker setup reads from memory
//! shared with PH) and `P` (PH packet, with the language in its first number).
//! The `H` lines (DECtalk's `HLSpeaker` as float bits) are not input: the
//! port's own speaker setup is compared with them, all 174 words.
//!
//! `<id>.speakers.txt` files hold only `S`, `V` and `H` lines; the checked-in
//! `all-voices.speakers.txt` covers the nine built-in voices.
//! Fixtures are written by `scripts/oracle/export-dectalk-vtm-fixture.ts`.
//!
//! Set `DECTALK_VTM_FIXTURE_DIR` to also replay another directory.

// NOM_Open_Quo and Tiltm keep DECtalk's names.
#![allow(non_snake_case)]

use std::fs;
use std::path::{Path, PathBuf};

use dectalk_vtm::hlsyn::HLSPEAKER_WORDS;
use dectalk_vtm::vtmio::VtmIo;
use dectalk_vtm::{Vtm, SPDEF_PARS, VOICE_PARS};

fn numbers<T, const N: usize>(fields: &[&str], path: &Path, line_no: usize) -> [T; N]
where
    T: std::str::FromStr + Copy + Default,
    T::Err: std::fmt::Display,
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

/// The `F` lines of `<id>.frames.txt`: `(vol_att, 45 words)`.
fn dectalk_frames(path: &Path) -> Vec<(i32, [i16; VOICE_PARS])> {
    let text = fs::read_to_string(path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    let mut frames = Vec::new();
    for (index, line) in text.lines().enumerate() {
        let fields: Vec<&str> = line.split_ascii_whitespace().collect();
        if fields.first() == Some(&"F") {
            let vol_att: i32 = fields[1]
                .parse()
                .unwrap_or_else(|e| panic!("{}:{}: {e}", path.display(), index + 1));
            frames.push((vol_att, numbers(&fields[3..], path, index + 1)));
        }
    }
    frames
}

fn wav_samples(path: &Path) -> Vec<i16> {
    let bytes = fs::read(path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    assert!(
        bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WAVE",
        "{}: not a RIFF/WAVE file",
        path.display()
    );
    let mut offset = 12;
    while offset + 8 <= bytes.len() {
        let size = u32::from_le_bytes(bytes[offset + 4..offset + 8].try_into().unwrap()) as usize;
        let start = offset + 8;
        if &bytes[offset..offset + 4] == b"data" {
            let end = (start + size).min(bytes.len());
            return bytes[start..end]
                .as_chunks::<2>()
                .0
                .iter()
                .map(|pair| i16::from_le_bytes(*pair))
                .collect();
        }
        offset = start + size + (size & 1);
    }
    panic!("{}: no data chunk", path.display());
}

struct Outcome {
    id: String,
    speakers: usize,
    speaker_mismatches: usize,
    frames: usize,
    exact_frames: usize,
    first_frame_mismatch: Option<String>,
    samples: usize,
    oracle_samples: usize,
    exact_samples: usize,
    max_abs_sample_diff: i32,
    first_sample_mismatch: Option<usize>,
}

fn replay(hl_path: &Path) -> Outcome {
    let id = hl_path
        .file_name()
        .and_then(|name| name.to_str())
        .and_then(|name| name.strip_suffix(".hl.txt"))
        .expect("fixture name")
        .to_string();
    let expected_frames = dectalk_frames(&hl_path.with_file_name(format!("{id}.frames.txt")));
    let oracle = wav_samples(&hl_path.with_file_name(format!("{id}.wav")));

    let mut io = VtmIo::new();
    let mut vtm = Vtm::new();
    let mut rendered: Vec<i16> = Vec::new();
    let mut pending: Option<(i32, [i16; VOICE_PARS])> = None;
    let mut pending_spdef: Option<[i16; SPDEF_PARS]> = None;
    let mut speakers = 0usize;
    let mut speaker_mismatches = 0usize;
    let mut frame_index = 0usize;
    let mut exact_frames = 0usize;
    let mut first_frame_mismatch = None;

    // A packet is run when the next packet, speaker definition or the end of
    // the file is reached, so that an `H` line printed after its `P` line (the
    // trace prints `H` just before the hlsyn call) is already applied.
    let mut run = |io: &mut VtmIo,
                   vtm: &mut Vtm,
                   pending: &mut Option<(i32, [i16; VOICE_PARS])>,
                   rendered: &mut Vec<i16>| {
        let Some((lang_curr, packet)) = pending.take() else {
            return;
        };
        let frame = io.voice_packet(&packet, lang_curr);
        let (vol_att, expected) = expected_frames
            .get(frame_index)
            .unwrap_or_else(|| panic!("{id}: more P lines than F lines"));
        if frame == *expected {
            exact_frames += 1;
        } else if first_frame_mismatch.is_none() {
            let word = (0..VOICE_PARS)
                .find(|&i| frame[i] != expected[i])
                .expect("a differing word");
            first_frame_mismatch = Some(format!(
                "frame {frame_index} word {word}: port {} DECtalk {}",
                frame[word], expected[word]
            ));
        }
        frame_index += 1;
        rendered.extend_from_slice(
            vtm.speech_waveform_generator(&frame, *vol_att)
                .expect("frame within the model's tables"),
        );
    };

    let text = fs::read_to_string(hl_path).unwrap_or_else(|e| panic!("{}: {e}", hl_path.display()));
    for (index, line) in text.lines().enumerate() {
        let line_no = index + 1;
        let fields: Vec<&str> = line.split_ascii_whitespace().collect();
        if fields.is_empty() || fields[0].starts_with('#') {
            continue;
        }
        let words = &fields[3..];
        match fields[0] {
            "S" => {
                run(&mut io, &mut vtm, &mut pending, &mut rendered);
                let spdef: [i16; SPDEF_PARS] = numbers(words, hl_path, line_no);
                // vtmiont.c:1616-1638.
                vtm.load_speaker_definition(&spdef)
                    .expect("speaker definition within the model's tables");
                pending_spdef = Some(spdef);
            }
            "V" => {
                // vtmiont.c:1641-1645, with the shared values of this V line.
                let spdef = pending_spdef
                    .take()
                    .unwrap_or_else(|| panic!("{}:{}: V without S", hl_path.display(), line_no));
                let last_voice: i32 = fields[1]
                    .parse()
                    .unwrap_or_else(|e| panic!("{}:{}: {e}", hl_path.display(), line_no));
                let [NOM_Open_Quo, Tiltm]: [i16; 2] = numbers(words, hl_path, line_no);
                io.speaker_packet(&spdef, last_voice, NOM_Open_Quo, Tiltm);
            }
            "H" => {
                // DECtalk's HLSpeaker for the frame about to run: the port's
                // own speaker setup must already equal it.
                let bits: [u32; HLSPEAKER_WORDS] = numbers(words, hl_path, line_no);
                speakers += 1;
                if io.hl.speaker.to_words() != bits {
                    speaker_mismatches += 1;
                }
            }
            "P" => {
                run(&mut io, &mut vtm, &mut pending, &mut rendered);
                let lang_curr: i32 = fields[1]
                    .parse()
                    .unwrap_or_else(|e| panic!("{}:{}: {e}", hl_path.display(), line_no));
                pending = Some((lang_curr, numbers(words, hl_path, line_no)));
            }
            "L" | "X" | "T" => {}
            other => panic!("{}:{}: unknown event {other:?}", hl_path.display(), line_no),
        }
    }
    run(&mut io, &mut vtm, &mut pending, &mut rendered);

    let mut exact_samples = 0;
    let mut max_abs_sample_diff = 0;
    let mut first_sample_mismatch = None;
    for (i, (ours, theirs)) in rendered.iter().zip(&oracle).enumerate() {
        let diff = (i32::from(*ours) - i32::from(*theirs)).abs();
        if diff == 0 {
            exact_samples += 1;
        } else if first_sample_mismatch.is_none() {
            first_sample_mismatch = Some(i);
        }
        max_abs_sample_diff = max_abs_sample_diff.max(diff);
    }

    Outcome {
        id,
        speakers,
        speaker_mismatches,
        frames: frame_index,
        exact_frames,
        first_frame_mismatch,
        samples: rendered.len(),
        oracle_samples: oracle.len(),
        exact_samples,
        max_abs_sample_diff,
        first_sample_mismatch,
    }
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
            "{}: speakers={} speaker_mismatches={} frames={} exact_frames={} first_frame_mismatch={} samples={} oracle_samples={} exact_samples={} max_abs_sample_diff={} first_sample_mismatch={}",
            outcome.id,
            outcome.speakers,
            outcome.speaker_mismatches,
            outcome.frames,
            outcome.exact_frames,
            outcome.first_frame_mismatch.as_deref().unwrap_or("none"),
            outcome.samples,
            outcome.oracle_samples,
            outcome.exact_samples,
            outcome.max_abs_sample_diff,
            outcome
                .first_sample_mismatch
                .map_or_else(|| "none".to_string(), |i| i.to_string()),
        );
        if outcome.frames == 0
            || outcome.speakers == 0
            || outcome.speaker_mismatches != 0
            || outcome.exact_frames != outcome.frames
            || outcome.samples != outcome.oracle_samples
            || outcome.exact_samples != outcome.samples
        {
            failures.push(outcome.id);
        }
    }
    assert!(
        failures.is_empty(),
        "PH packet to WAV differs from DECtalk in {}: {failures:?}",
        dir.display()
    );
}

#[test]
fn ph_packets_reproduce_dectalk_frames_and_wav_exactly() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures");
    replay_directory(&dir);
}

#[test]
fn ph_packets_reproduce_extra_fixture_directory_exactly() {
    let Ok(dir) = std::env::var("DECTALK_VTM_FIXTURE_DIR") else {
        println!("DECTALK_VTM_FIXTURE_DIR not set; nothing replayed");
        return;
    };
    replay_directory(Path::new(&dir));
}

/// The speaker setup of `vtmiont.c:1641-1645` for every built-in voice:
/// from the speaker definition packet and the `V` values, the port must
/// produce DECtalk's `HLSpeaker`, all 174 words, bit for bit.
#[test]
fn speaker_setup_matches_dectalk_for_every_built_in_voice() {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join("all-voices.speakers.txt");
    let text = fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));

    let mut io = VtmIo::new();
    let mut pending_spdef: Option<[i16; SPDEF_PARS]> = None;
    let mut last_voice = -1;
    let mut voices_checked = Vec::new();
    for (index, line) in text.lines().enumerate() {
        let line_no = index + 1;
        let fields: Vec<&str> = line.split_ascii_whitespace().collect();
        if fields.is_empty() || fields[0].starts_with('#') {
            continue;
        }
        let words = &fields[3..];
        match fields[0] {
            "S" => pending_spdef = Some(numbers(words, &path, line_no)),
            "V" => {
                let spdef = pending_spdef.take().expect("S before V");
                last_voice = fields[1].parse().expect("voice number");
                let [NOM_Open_Quo, Tiltm]: [i16; 2] = numbers(words, &path, line_no);
                io.speaker_packet(&spdef, last_voice, NOM_Open_Quo, Tiltm);
            }
            "H" => {
                let bits: [u32; HLSPEAKER_WORDS] = numbers(words, &path, line_no);
                let ours = io.hl.speaker.to_words();
                let differing: Vec<usize> = (0..HLSPEAKER_WORDS)
                    .filter(|&i| ours[i] != bits[i])
                    .collect();
                assert!(
                    differing.is_empty(),
                    "{}:{}: voice {last_voice}: HLSpeaker words {differing:?} differ from DECtalk's",
                    path.display(),
                    line_no
                );
                voices_checked.push(last_voice);
            }
            other => panic!("{}:{}: unknown event {other:?}", path.display(), line_no),
        }
    }
    // Paul, Betty, Harry, Frank, Dennis, Kit, Ursula, Rita, Wendy.
    assert_eq!(voices_checked, vec![0, 1, 2, 3, 4, 5, 6, 7, 8]);
}
