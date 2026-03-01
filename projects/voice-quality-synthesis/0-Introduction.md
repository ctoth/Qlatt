# Voice Quality Synthesis Module

## Overview

The Voice Quality Synthesis Module adds expressive voice control to Qlatt's text-to-speech pipeline. Default formant synthesizers produce robotic speech partly because voice quality never varies -- every vowel uses the same glottal pulse shape. This module fixes that by computing a per-segment voice quality parameter from phonetic context, then modulating the glottal source accordingly.

The module controls *how* the voice sounds, not just *what* it says. It varies voice quality from pressed (tense, authoritative) to breathy (intimate, fatigued) based on what's being said, how stressed each syllable is, and what emotion is being conveyed. The approach is grounded in phonetic research on what acoustic features humans actually perceive as "emotional" or "natural."

A key insight from the literature (France 2000) is that F0 variation alone doesn't convey emotion effectively -- formant modulation matters more. This module therefore includes frequency and bandwidth adjustments in emotion presets, not just pitch and voice quality changes. All parameters are constrained by perceptual JND thresholds (vanDinther 2001, 2004) to avoid inaudible over-specification.

---

## Background: What is Voice Quality?

Voice quality refers to the characteristic sound of a person's voice beyond the words being spoken. When we describe a voice as "breathy," "creaky," "tense," or "warm," we are describing its quality. Voice quality conveys rich information about a speaker's emotional state, physical health, age, and social intent.

Consider the difference between:
- A whispered secret (breathy, intimate)
- A drill sergeant's command (pressed, authoritative)
- A tired sigh (very breathy, low effort)
- An angry shout (tense, high effort)

These differences come primarily from how the vocal folds vibrate -- specifically, the shape and timing of the airflow pulse they produce with each glottal cycle.

### The Source-Filter Model

Speech production follows the **source-filter model**:

```
┌─────────────┐      ┌─────────────┐
│   Source    │ ───▶ │   Filter    │ ───▶ Speech
│  (glottis)  │      │(vocal tract)│
└─────────────┘      └─────────────┘
```

- **Source**: The vocal folds open and close periodically, producing a quasi-periodic airflow pulse. The shape of this pulse determines voice quality.
- **Filter**: The vocal tract (pharynx, mouth, nasal cavities) shapes the sound by amplifying certain frequencies (formants) and attenuating others. This determines vowel identity.

Voice quality is primarily a **source phenomenon**. While the filter affects the final sound, the fundamental character of pressed vs. breathy voice comes from the glottal source waveform.

---

## Background: The LF Model and Rd Parameter

### The LF Model

The **Liljencrants-Fant (LF) model** (Fant 1985) mathematically describes the glottal airflow waveform -- the pattern of air rushing through the vocal folds during each vibration cycle.

```
        Airflow
           │
           │    ╭──────╮
           │   ╱        ╲
           │  ╱          ╲
           │ ╱            ╲     ← Opening phase (controlled by Rg)
           │╱              ╲
       ────┼────────────────╲───────────────── Time
           │                 ╲   ↑
           │                  ╲  │ Return phase
           │                   ╲ │ (controlled by Ra)
           │                    ╲│
           │                     │
           └─────────────────────┘
               One glottal cycle (T0 = 1/F0)
```

The LF model uses four timing parameters:
- **Rg**: Controls the rate of glottal opening
- **Rk**: Controls the asymmetry of the open phase
- **Ra**: Controls the speed of glottal return (closure)
- **Oq**: Open quotient -- fraction of the cycle the glottis is open

### The Rd Parameter

Managing four interdependent parameters is complex. Fortunately, research by Fant (1995, 1997) established that these parameters covary in predictable ways during natural speech. The **Rd parameter** is a single "super-parameter" that bundles all four:

```
Rd ──────────────▶ Ra, Rk, Rg, Oq (all derived)
```

**Rd ranges and interpretation:**

| Rd Value | Voice Quality | Physical Interpretation |
|----------|---------------|-------------------------|
| 0.3 | Pressed/Tense | Tight vocal fold adduction, abrupt closure |
| 1.0 | Modal | Normal, relaxed phonation |
| 2.7 | Breathy | Loose adduction, gradual closure, incomplete seal |

### Why Rd is Sufficient

Perceptual research by vanDinther (2001, 2004) demonstrated that humans are relatively insensitive to individual LF parameters. Key findings:

1. The LF model is **perceptually 1-2 dimensional** -- most variation in Ra, Rk, Rg, and Oq is inaudible
2. **Ra (the return phase)** carries most perceptual weight because it controls spectral tilt
3. A just-noticeable difference (JND) requires about **4.3 dB EPD** (Equivalent Perceived Difference)
4. In Rd terms, approximately **ΔRd = 0.15** corresponds to 1 JND

Since Rd controls Ra (and thus spectral tilt), controlling Rd is perceptually equivalent to controlling the full LF model for most purposes. This dramatically simplifies implementation without sacrificing perceived voice quality variation.

---

## How This Module Works

### The Five-Factor Additive Model

Voice quality emerges from the combination of five independent factors, each contributing an offset to a base Rd value:

```
Rd_final = Rd_base + ΔRd_phoneme + ΔRd_stress + ΔRd_effort + ΔRd_emotion + ΔRd_phrase
```

| Factor | Description | Typical Range |
|--------|-------------|---------------|
| **Base Rd** | Speaker-specific default (male: 0.7, female: 1.4) | -- |
| **Phoneme** | Segment-specific offset (vowels breathy, stops tense) | ±1.0 |
| **Stress** | Stressed syllables are more adducted | ±0.3 |
| **Effort** | Derived from vocal intensity (loud = tense) | ±0.5 |
| **Emotion** | Preset offset for emotional states | ±0.7 |
| **Phrase** | Contour over utterance (onset rise, final breathiness) | ±0.5 |

Each factor is independently capped before summation to prevent runaway values. The final Rd is clamped to [0.3, 2.7] to stay within LF model constraints.

### Formant Modulation for Emotion

A key finding from France (2000) is that F0 features are **surprisingly ineffective** as discriminators of emotional state. In classification studies of control vs. depressed vs. suicidal speech, formant frequencies and spectral features achieved 75-94% accuracy, while F0 contributed little.

This module therefore includes **formant frequency and bandwidth adjustments** in emotion presets, not just Rd and F0 changes:

| Emotion | F1 Δ (Hz) | F2 Δ (Hz) | B1 Scale | Rd Δ |
|---------|-----------|-----------|----------|------|
| Neutral | 0 | 0 | 1.0 | 0 |
| Sad | +10 | +15 | 1.2 | +0.3 |
| Happy | -5 | -10 | 0.9 | -0.1 |
| Angry | -10 | 0 | 0.8 | -0.4 |

---

## Where This Fits in Qlatt

The voice quality module integrates into Qlatt's existing TTS pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TTS FRONTEND                                    │
│                                                                              │
│   Text ──▶ Normalize ──▶ Transcribe ──▶ Apply Rules ──▶ Generate Track     │
│                                              │                               │
│                               ┌──────────────┴──────────────┐                │
│                               │   VOICE QUALITY MODULE      │                │
│                               │   - rule_VoiceQuality()     │                │
│                               │   - rule_RdPhraseContour()  │                │
│                               │   - Emotion formant mods    │                │
│                               └──────────────┬──────────────┘                │
│                                              │                               │
└──────────────────────────────────────────────┼───────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                               TRACK (JSON frames)                            │
│   { time: 0.0, F0: 120, F1: 500, ..., Rd: 0.8, effort: 3.2 }                │
│   { time: 0.01, F0: 121, F1: 502, ..., Rd: 0.79, effort: 3.1 }              │
│   ...                                                                        │
└──────────────────────────────────────────────┬───────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             SEMANTICS EVALUATION                             │
│   semantics.yaml                                                             │
│   - Effort-based F0/F1 shifts: F0 + effort * 5.1 Hz/dB                      │
│   - Spectral tilt scaling: A1/A2/A3 effort modulation                       │
│   - Rd passed directly to LF source                                         │
└──────────────────────────────────────────────┬───────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              WEBAUDIO GRAPH                                  │
│   LF Source (WASM) ──▶ Formant Filters ──▶ Output                           │
│       ↑                                                                      │
│       └── Rd AudioParam (scheduled by interpreter)                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key integration points:**

1. **TTS Frontend** (`src/tts-frontend-rules.js`): Computes Rd and effort per phoneme
2. **Track Frames**: Carries Rd and effort alongside traditional Klatt parameters
3. **Semantics** (`semantics.yaml`): Evaluates effort-based F0/F1 shifts using CEL expressions
4. **LF Source** (`crates/lf-source/`): Already implements Rd-to-LF derivation; receives Rd via AudioParam

---

## Glossary

| Term | Definition |
|------|------------|
| **AH** | Aspiration noise amplitude (dB); turbulent noise at the glottis |
| **AV** | Voicing amplitude (dB); amplitude of the periodic glottal source |
| **Bandwidth (B1-B6)** | Width of formant resonance peaks in Hz |
| **Cascade/Parallel** | Two filter topologies in Klatt synthesizers; cascade for voiced sounds, parallel for noise-excited |
| **CEL** | Common Expression Language; used in semantics.yaml for parameter derivation |
| **Effort** | Vocal effort in dB; modulates F0, F1, and spectral tilt (Lienard 1999) |
| **EPD** | Equivalent Perceived Difference; perceptual distance metric for LF parameters |
| **F0** | Fundamental frequency (Hz); pitch |
| **Fa** | Spectral tilt cutoff frequency; controls high-frequency rolloff of the source |
| **Formants (F1-F6)** | Resonance frequencies of the vocal tract; determine vowel quality |
| **Frame** | One time-slice of Klatt parameters (typically 5-10 ms) |
| **Glottal source** | The quasi-periodic airflow produced by vocal fold vibration |
| **JND** | Just Noticeable Difference; smallest perceivable change |
| **LF Model** | Liljencrants-Fant model; mathematical description of glottal airflow waveform |
| **LFLM** | Linear Filter LF Model; efficient digital filter equivalent of LF (Perrotin 2021) |
| **Modal voice** | Normal, relaxed phonation; neither pressed nor breathy |
| **Oq** | Open quotient; fraction of glottal cycle that the glottis is open |
| **Ra, Rk, Rg** | LF model timing parameters controlling return, asymmetry, and opening rate |
| **Rd** | Single parameter controlling voice quality (0.3=pressed, 1.0=modal, 2.7=breathy) |
| **Realize rules** | CEL expressions in semantics.yaml that compute output values from input parameters |
| **Spectral tilt** | Rate of energy decrease with frequency; breathy voice has steeper tilt |
| **TL** | Tilt parameter in KLSYN88; controls spectral slope in dB/octave |
| **Track** | Array of time-stamped Klatt parameter frames; output of TTS frontend |

---

## Document Guide

This introduction is part of a 7-document design specification. Here's what each document covers:

| Document | Purpose | Read If You... |
|----------|---------|----------------|
| **0-Introduction** (this file) | Background, concepts, architecture overview | Are new to the project or need a refresher |
| **1-Design-Decisions** | Why Rd was chosen, the five-factor model, computation order | Want to understand the rationale behind design choices |
| **2-Parameter-Specifications** | Concrete values, formulas, lookup tables | Need specific numbers for implementation |
| **3-Conflict-Resolutions** | How contradictions between papers were resolved | Are evaluating the scientific soundness |
| **4-Implementation-Architecture** | Code structure, function signatures, file locations | Are implementing the module |
| **5-Perceptual-Constraints** | JND thresholds, clamping rationale, what's audible | Want to avoid over-engineering |
| **6-Citation-Summary** | Paper reference table with page numbers | Need to trace claims to sources |
| **7-Summary-What-to-Implement** | Phased implementation checklist | Want a quick-start task list |

### For Developers

Start with **Document 7** for a concrete implementation checklist, then reference **Document 4** for code structure and **Document 2** for parameter values. Return to **Document 1** when you need to understand *why* something was designed a particular way.

### For Researchers

Start with **Document 6** for the citation summary, then read **Document 1** for design rationale and **Document 3** for how conflicting findings were reconciled. **Document 5** covers perceptual constraints that informed engineering decisions.

---

## Key Citations

| Paper | Key Contribution |
|-------|------------------|
| Fant (1985) | LF model definition |
| Fant (1995, 1997) | Rd parameter, Rd-to-LF derivation, phrase contours |
| vanDinther (2001, 2004) | Perceptual relevance of LF parameters; 4.3 dB EPD = 1 JND |
| Lienard & Di Benedetto (1999) | Effort coefficients (F0: 5.1 Hz/dB, F1: 3.5 Hz/dB) |
| France (2000) | F0 ineffective for emotion; formant modulation matters more |
| Gobl (2003) | KLSYN88 parameters for 7 voice qualities |
| Cummings (1995) | Emotion-to-voice-quality mappings |
| Perrotin (2021) | LFLM digital filter equivalent (10-100x faster) |

---

*Generated: 2026-01-27*
