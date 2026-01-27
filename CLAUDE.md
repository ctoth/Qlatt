# Qlatt Project

JavaScript Klatt formant synthesizer with TTS frontend.

## Testing Audio in Chrome

Dev server: `npm run dev` → `http://localhost:8000/`

To trigger TTS playback via Chrome automation:
```javascript
// This is the pattern that works (find button by text content)
Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Speak')).click()
```

Note: User must click once manually first to "unlock" audio (browser security policy), then JS clicks work.

## Architecture

- `src/tts-frontend.js` - Main TTS pipeline, text → phonemes → Klatt frames
- `src/tts-frontend-rules.js` - Phoneme targets, prosody rules
- `src/klatt.js` - Klatt synthesizer core

## WASM Primitives (crates/)

- `resonator` - Two-pole resonator (formant filter)
- `antiresonator` - Two-pole antiresonator (nasal zero)
- `lf-source` - Liljencrants-Fant glottal source
- `decay-envelope` - Exponential decay for PLSTEP bursts
- `edge-detector` - Threshold crossing detector for PLSTEP trigger
- `signal-switch` - N-to-1 signal selector (SW parameter, source selection)

## Key References

- Peterson & Barney (1952) - Canonical vowel formants
- Klatt (1980) - Klatt synthesizer specification
- Research reports in `reports/` directory

## Reference Implementations (Local)

- `~/src/klatt80/` - Original Klatt 80 FORTRAN code
  - `PARCOE.FOR` - Parameter coefficient calculation (A2COR, PLSTEP burst mechanism)
  - `COEWAV.FOR` - Waveform generation
- `~/src/klatt-syn/` - TypeScript Klatt implementation by chdh
  - Does NOT implement A2COR correction (uses dB directly)
  - Clean modern implementation for comparison
- `~/src/klsyn/` - klsyn88 Nim implementation
  - Target for next synthesizer port
  - Investigate for architecture and features beyond klatt80
