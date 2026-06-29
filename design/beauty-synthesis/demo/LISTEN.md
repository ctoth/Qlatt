# Listen — the beautiful synth, first voice (overnight 2026-06-29)

These are real renders of the NEW clean-room synthesizer: `qlatt-beauty` frontend ×
`qlatt-beauty` backend, 48 kHz, node render path. Female flagship, neutral. Play the WAVs;
the Praat measurements below are the non-visual proof of what you're hearing.

## Neutral demos (no affect yet)
| file | phrase | F0 median | formants (F1/F2/F3/F4) | HNR | notes |
|---|---|---|---|---|---|
| `beauty-moon.wav` | "she sees a calm blue moon" | 197 Hz | 649/1709/2851/4018 | 17.7 | varied vowels |
| `beauty-greeting.wav` | "hello, it is so good to hear your voice again" | 182 Hz | 636/1699/2859/4032 | 18.0 | warm, longer |
| `beauty-question.wav` | "are you coming home tonight?" | 192 Hz | 652/1693/2852/4045 | 19.7 | question — final rise |

All measure as a genuine FEMALE voice: F0 ~182–197, formants in female territory (F3 ~2850,
F4 ~4030 — raised upper formants, not a pitched-up male), clean phonation (HNR ~18–20 dB,
jitter ~0.02, shimmer ~0.05 — alive but not rough).

## What's in this voice (all committed tonight)
- **Female inventory** — Peterson & Barney women's-average formants, nonuniform female tract
  scaling, female bandwidths, posterior-chink breath floor, per-phoneme Rd.
- **Energized HF "air" band** — a dedicated branch puts real energy in the 7–11 kHz
  naturalness region (+33 dB vs a baseline Klatt that's dead above 5 kHz) — this is the
  "brilliance/presence" the design called for.
- **Dynamic voice quality** — Rd swings 0.42 (stressed/tense) → 1.20 (phrase-final breathy),
  with loudness/brightness auto-compensating (Fant covariation).
- **Female prosody** — Fujisaki-range melody, downstep, declination, statement-fall vs
  question-rise, micro-prosody (intrinsic vowel pitch, consonant perturbation), flutter+jitter.

## In flight as of this commit
- Affect/emotion wiring (tender/sad/happy/angry renders) — `affect-*.wav` will appear here.
- HF level push toward Monson's ideal; HRG live-pipeline wiring; final tuning.
See `../build/BUILD.md` and the per-track reports for the full accounting.
