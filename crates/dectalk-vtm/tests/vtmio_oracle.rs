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
//! Input comes from `<id>.hl.txt`: `S` (speaker definition packet), `H`
//! (`HLSpeaker` float bits, standing in for DECtalk's per-voice setup, which is
//! not ported) and `P` (PH packet, with the language in its first number).
//! Fixtures are written by `scripts/oracle/export-dectalk-vtm-fixture.ts`.
//!
//! Set `DECTALK_VTM_FIXTURE_DIR` to also replay another directory.

use std::fs;
use std::path::{Path, PathBuf};

use dectalk_vtm::hlsyn::{HLSpeaker, HLSPEAKER_WORDS};
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
                // vtmiont.c:1616-1645.
                vtm.load_speaker_definition(&spdef)
                    .expect("speaker definition within the model's tables");
                io.speaker_packet(&spdef);
            }
            "H" => {
                let bits: [u32; HLSPEAKER_WORDS] = numbers(words, hl_path, line_no);
                io.hl.speaker = HLSpeaker::from_words(&bits);
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
            "{}: frames={} exact_frames={} first_frame_mismatch={} samples={} oracle_samples={} exact_samples={} max_abs_sample_diff={} first_sample_mismatch={}",
            outcome.id,
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
