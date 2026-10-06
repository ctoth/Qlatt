//! Replays DECtalk 4.63's own per-frame VTM input through the port and compares
//! the result with DECtalk's own WAV, sample by sample. The target is
//! bit-exact.
//!
//! Each fixture is a pair written by
//! `scripts/oracle/export-dectalk-vtm-fixture.ts`:
//!
//! - `<id>.frames.txt`: the VTM events of one `say.exe` run, in order. `S`
//!   lines are speaker definition packets (51 words), `F` lines are voice
//!   frames (45 words) as handed to `speech_waveform_generator`.
//! - `<id>.wav`: the WAV the stock `say.exe` wrote for the same text.
//!
//! Set `DECTALK_VTM_FIXTURE_DIR` to also replay every fixture pair in another
//! directory (for example a full corpus export that is not checked in).

use std::fs;
use std::path::{Path, PathBuf};

use dectalk_vtm::{Vtm, SPDEF_PARS, VOICE_PARS};

enum Event {
    /// `S <uiSampleRate> <uiSampleRateChange> <51 words>`
    Speaker {
        sample_rate: u32,
        words: Box<[i16; SPDEF_PARS]>,
    },
    /// `F <vol_att> <uiSampleRate> <45 words>`
    Frame {
        vol_att: i32,
        sample_rate: u32,
        words: Box<[i16; VOICE_PARS]>,
    },
}

fn parse_words<const N: usize>(fields: &[&str], path: &Path, line_no: usize) -> Box<[i16; N]> {
    assert_eq!(
        fields.len(),
        N,
        "{}:{}: expected {} words, found {}",
        path.display(),
        line_no,
        N,
        fields.len()
    );
    let mut words = Box::new([0i16; N]);
    for (slot, field) in words.iter_mut().zip(fields) {
        *slot = field
            .parse()
            .unwrap_or_else(|e| panic!("{}:{}: bad word {field:?}: {e}", path.display(), line_no));
    }
    words
}

fn read_events(path: &Path) -> Vec<Event> {
    let text = fs::read_to_string(path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    let mut events = Vec::new();
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
        let a: i64 = fields[1]
            .parse()
            .unwrap_or_else(|e| panic!("{}:{}: {e}", path.display(), line_no));
        let b: i64 = fields[2]
            .parse()
            .unwrap_or_else(|e| panic!("{}:{}: {e}", path.display(), line_no));
        match fields[0] {
            "S" => events.push(Event::Speaker {
                sample_rate: a as u32,
                words: parse_words(&fields[3..], path, line_no),
            }),
            "F" => events.push(Event::Frame {
                vol_att: a as i32,
                sample_rate: b as u32,
                words: parse_words(&fields[3..], path, line_no),
            }),
            other => panic!("{}:{}: unknown event {other:?}", path.display(), line_no),
        }
    }
    events
}

struct Wav {
    sample_rate: u32,
    samples: Vec<i16>,
}

fn read_wav(path: &Path) -> Wav {
    let bytes = fs::read(path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    assert!(
        bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WAVE",
        "{}: not a RIFF/WAVE file",
        path.display()
    );
    let mut sample_rate = None;
    let mut samples = None;
    let mut offset = 12;
    while offset + 8 <= bytes.len() {
        let id = &bytes[offset..offset + 4];
        let size = u32::from_le_bytes(bytes[offset + 4..offset + 8].try_into().unwrap()) as usize;
        let body_start = offset + 8;
        let body_end = (body_start + size).min(bytes.len());
        let body = &bytes[body_start..body_end];
        if id == b"fmt " {
            let format = u16::from_le_bytes(body[0..2].try_into().unwrap());
            let channels = u16::from_le_bytes(body[2..4].try_into().unwrap());
            let bits = u16::from_le_bytes(body[14..16].try_into().unwrap());
            assert_eq!(
                (format, channels, bits),
                (1, 1, 16),
                "{}: expected 16-bit mono PCM",
                path.display()
            );
            sample_rate = Some(u32::from_le_bytes(body[4..8].try_into().unwrap()));
        } else if id == b"data" {
            samples = Some(
                body.as_chunks::<2>()
                    .0
                    .iter()
                    .map(|pair| i16::from_le_bytes(*pair))
                    .collect::<Vec<i16>>(),
            );
        }
        offset = body_start + size + (size & 1);
    }
    Wav {
        sample_rate: sample_rate.unwrap_or_else(|| panic!("{}: no fmt chunk", path.display())),
        samples: samples.unwrap_or_else(|| panic!("{}: no data chunk", path.display())),
    }
}

fn render(events: &[Event]) -> (Vec<i16>, u32) {
    let mut vtm = Vtm::new();
    let mut rendered = Vec::new();
    for event in events {
        match event {
            Event::Speaker { sample_rate, words } => {
                assert_eq!(
                    *sample_rate,
                    vtm.sample_rate(),
                    "speaker packet sample rate"
                );
                vtm.load_speaker_definition(words);
            }
            Event::Frame {
                vol_att,
                sample_rate,
                words,
            } => {
                assert_eq!(*sample_rate, vtm.sample_rate(), "frame sample rate");
                rendered.extend_from_slice(vtm.speech_waveform_generator(words, *vol_att));
            }
        }
    }
    (rendered, vtm.sample_rate())
}

struct Comparison {
    id: String,
    rendered_len: usize,
    oracle_len: usize,
    compared: usize,
    exact: usize,
    max_abs_diff: i32,
    first_mismatch: Option<usize>,
    correlation: f64,
}

impl Comparison {
    fn is_bit_exact(&self) -> bool {
        self.rendered_len == self.oracle_len && self.exact == self.compared
    }
}

fn correlation(a: &[i16], b: &[i16]) -> f64 {
    let (mut sab, mut saa, mut sbb) = (0.0f64, 0.0f64, 0.0f64);
    for (x, y) in a.iter().zip(b) {
        let (x, y) = (f64::from(*x), f64::from(*y));
        sab += x * y;
        saa += x * x;
        sbb += y * y;
    }
    if saa == 0.0 || sbb == 0.0 {
        return f64::NAN;
    }
    sab / (saa.sqrt() * sbb.sqrt())
}

fn compare(frames_path: &Path) -> Comparison {
    let id = frames_path
        .file_name()
        .and_then(|name| name.to_str())
        .and_then(|name| name.strip_suffix(".frames.txt"))
        .expect("fixture name")
        .to_string();
    let wav_path = frames_path.with_file_name(format!("{id}.wav"));

    let events = read_events(frames_path);
    let oracle = read_wav(&wav_path);
    let (rendered, sample_rate) = render(&events);
    assert_eq!(oracle.sample_rate, sample_rate, "{id}: WAV sample rate");

    let compared = rendered.len().min(oracle.samples.len());
    let mut exact = 0;
    let mut max_abs_diff = 0;
    let mut first_mismatch = None;
    for (i, (ours, theirs)) in rendered.iter().zip(&oracle.samples).enumerate() {
        let diff = (i32::from(*ours) - i32::from(*theirs)).abs();
        if diff == 0 {
            exact += 1;
        } else if first_mismatch.is_none() {
            first_mismatch = Some(i);
        }
        max_abs_diff = max_abs_diff.max(diff);
    }

    Comparison {
        id,
        rendered_len: rendered.len(),
        oracle_len: oracle.samples.len(),
        compared,
        exact,
        max_abs_diff,
        first_mismatch,
        correlation: correlation(&rendered, &oracle.samples),
    }
}

fn fixture_pairs(dir: &Path) -> Vec<PathBuf> {
    let mut paths: Vec<PathBuf> = fs::read_dir(dir)
        .unwrap_or_else(|e| panic!("{}: {e}", dir.display()))
        .map(|entry| entry.expect("directory entry").path())
        .filter(|path| {
            path.file_name()
                .and_then(|name| name.to_str())
                .is_some_and(|name| name.ends_with(".frames.txt"))
        })
        .collect();
    paths.sort();
    paths
}

fn replay_directory(dir: &Path) {
    let pairs = fixture_pairs(dir);
    assert!(!pairs.is_empty(), "no fixtures in {}", dir.display());

    let mut failures = Vec::new();
    for frames_path in &pairs {
        let result = compare(frames_path);
        println!(
            "{}: rendered={} oracle={} compared={} exact={} max_abs_diff={} first_mismatch={} correlation={:.9}",
            result.id,
            result.rendered_len,
            result.oracle_len,
            result.compared,
            result.exact,
            result.max_abs_diff,
            result
                .first_mismatch
                .map_or_else(|| "none".to_string(), |i| i.to_string()),
            result.correlation,
        );
        if !result.is_bit_exact() {
            failures.push(result.id);
        }
    }
    assert!(
        failures.is_empty(),
        "not bit-exact against DECtalk in {}: {failures:?}",
        dir.display()
    );
}

#[test]
fn reproduces_dectalk_wav_bit_exactly() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures");
    replay_directory(&dir);
}

#[test]
fn reproduces_extra_fixture_directory_bit_exactly() {
    let Ok(dir) = std::env::var("DECTALK_VTM_FIXTURE_DIR") else {
        println!("DECTALK_VTM_FIXTURE_DIR not set; nothing replayed");
        return;
    };
    replay_directory(Path::new(&dir));
}
