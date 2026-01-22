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

## Key References

- Peterson & Barney (1952) - Canonical vowel formants
- Klatt (1980) - Klatt synthesizer specification
- Research reports in `reports/` directory
