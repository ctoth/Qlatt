# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Qlatt is a WebAudio-based Klatt formant synthesizer with a TTS frontend. It uses WASM-backed AudioWorklet DSP nodes for real-time audio synthesis in the browser.

## Build Commands

```bash
# Build WASM modules (requires Rust + wasm32-unknown-unknown target)
./build.sh                    # Linux/macOS
pwsh -File build.ps1          # Windows

# Start dev server
npm run dev                   # Starts Vite at http://localhost:8000/

# Run golden master tests (WASM comparison + phrase rendering)
npm run test:golden

# Build CMU dictionary subset
npm run build:dict
```
## PRAAT

Praat is installed


## Testing Audio in Chrome

Dev server: `npm run dev` → `http://localhost:8000/`
Test harness: `http://localhost:8000/test/test-harness.html`

To trigger TTS playback via Chrome automation:
```javascript
Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Speak')).click()
```

## Architecture

### Signal Flow

```
Text → tts-frontend.js → Klatt parameter track → klatt-synth.js → AudioWorklet graph → Audio output
```

### Core Modules

- **`src/tts-frontend.js`** - Text normalization, G2P (via CMU dictionary + fallback rules), phoneme-to-Klatt parameter mapping
- **`src/tts-frontend-rules.js`** - Phoneme acoustic targets (formant frequencies, bandwidths, durations), prosody rules (stress, preboundary lengthening, F0 contour)
- **`src/klatt-synth.js`** - Klatt synthesizer core; builds WebAudio graph connecting WASM worklets
- **`src/cmu-dictionary.js`** - Subset of CMU pronouncing dictionary for G2P

### Audio Graph (klatt-synth.js)

Two parallel synthesis branches (Klatt 80 architecture):
- **Cascade branch**: Voice source → glottal resonators → nasal antiformant/formant → F1-F6 cascade resonators
- **Parallel branch**: Differentiated source → parallel formant resonators with individual amplitude controls (A1-A6)

Source selection controlled by `SW` parameter:
- `SW=0`: Cascade mode (vowels, nasals, liquids, glides)
- `SW=1`: Parallel mode (fricatives, affricates, stop releases)

### WASM Worklets

DSP primitives in Rust (`crates/`), compiled to WASM and loaded by AudioWorklet processors:
- **`resonator`** - Two-pole resonator (formant filter)
- **`antiresonator`** - Two-zero antiresonator (zero filter)
- **`lf-source`** - LF model glottal source with Rd voice quality control

JavaScript worklet processors in `public/worklets/`:
- `resonator-processor.js`, `antiresonator-processor.js` - Wrap WASM resonators
- `lf-source-processor.js` - LF glottal source
- `impulse-train-processor.js` - Classic Klatt impulse source
- `noise-source-processor.js` - Filtered noise for aspiration/frication
- `differentiator-processor.js` - First-difference for radiation characteristic
- `glottal-mod-processor.js` - Amplitude modulation synchronized to glottal cycle

### TTS Pipeline Detail

1. **Text normalization**: Lowercase, expand numbers, separate punctuation
2. **G2P**: CMU dictionary lookup with fallback letter-to-sound rules
3. **Phoneme processing**: Map to closure forms (P→P_CL), insert releases/aspiration
4. **Duration rules**: Stress lengthening, vowel shortening, preboundary lengthening
5. **F0 generation**: Declination + phrase-final fall + stressed syllable peaks
6. **Track generation**: Time-stamped Klatt parameter frames with formant transitions

## Reference Implementations

- `~/src/klatt80/` - Original Klatt 80 FORTRAN code
  - `PARCOE.FOR` - Parameter coefficient calculation (A2COR, PLSTEP burst mechanism)
  - `COEWAV.FOR` - Waveform generation
- `~/src/klatt-syn/` - TypeScript Klatt implementation by chdh
  - Does NOT implement A2COR correction (uses dB directly)
  - Clean modern implementation for comparison

## Research Resources

- **`papers/CLAUDE.md`** - Detailed summaries of 90+ research papers with implementation notes
- **`reports/`** - Investigation reports and implementation findings
- Key papers: Klatt 1980 (synthesizer spec), Fant 1985 (LF model), Peterson & Barney 1952 (vowel formants)
