# Sound Quality Investigation Notes

## Issues Reported
1. Audio gets quieter and quieter until inaudible
2. "Bouncy" characteristic
3. Possibly missing features
4. Skepticism about ramping behavior
5. Pauses may not be handled well
6. Default speed too slow

## Observed Data ("The quick brown fox jumps over the lazy dog.")

### Track Duration
- Total: 3.384s for 9 words = ~2.7 words/sec (VERY slow for conversational speech)
- Natural: ~4-5 words/sec for normal speaking rate
- rate_scale is 1.0 — not being used at all

### EePhraseDb Progression (source contour declination)
- t=0.03: -0.12 dB
- t=0.98: -0.37 dB
- t=1.79: -0.56 dB
- t=2.76: -1.06 dB
- t=3.02: -1.32 dB (final vowel of "dog")
- t=3.05: -1.58 dB (G closure)
- t=3.10: -1.63 dB (G release)

Total declination: ~1.6 dB over 3.1s = 0.5 dB/sec (matches ee_declination_db_per_sec = 0.5)
The final fall kicks in too: ee_final_fall_db_per_sec = 1.5 near phrase end

**Verdict**: 1.6 dB overall decline is NOT enough to cause "inaudible". The source contour
declination is NOT the primary cause of the quieting issue. Need to look elsewhere.

### RdPhraseOffset Progression
- Stays at 0.000 for most of the phrase
- Only rises near phrase-final: 0.008, 0.011, 0.031, 0.054, 0.059
- rd_final_offset = 0.06 (very conservative)
- This is also NOT causing significant quieting.

### AV Values
- Vowels: 57-64 dB (consistent through entire phrase)
- Voiced closures: 47 dB (consistent)
- Unstressed vowels (AH0): 57 dB
- Stressed vowels (AA1, AE1): 64 dB
- No decline in AV through the phrase!

### Key Finding: AV is CONSTANT — GO is CONSTANT at 47
**Resolved by #54 (vocal effort).** The original observation below describes
the unmodulated input AV. The frontend now emits cited `effort` in dB from
ToBI accent carriers and phrase position; semantics realizes `AV + effort`
alongside F0, F1, parallel spectral balance, OQ and TL. GO remains the fixed
calibration gain at 47. Existing Ee/Rd source contours remain separate.

Reproduce the comparison on identical frames with:
`node scripts/run-frontend-script.mjs scripts/report-vocal-effort.ts`
The script emits every voiced segment; these are representative rows for
"The quick brown fox jumps over the lazy dog." at 110 Hz:

| Time (s) | Phone | Effort (dB) | AV before (effort=0) | AV after | GO |
|---|---|---|---|---|---|
| 0.102 | AH | -0.031 | 57.000 | 56.969 | 47 |
| 0.354 | IH | 1.912 | 62.000 | 63.912 | 47 |
| 0.671 | AE1 | 1.811 | 64.000 | 65.811 | 47 |
| 1.097 | AA | 1.686 | 64.000 | 65.686 | 47 |
| 2.494 | AH | -0.656 | 57.000 | 56.344 | 47 |
| 2.618 | EH1 | 1.284 | 62.000 | 63.284 | 47 |
| 2.984 | AO | 1.100 | 63.000 | 64.100 | 47 |

These are realized control levels, not measured sound-pressure levels. Lienard
& Di Benedetto (1999), Figs. 3–4, supplies the F0/F1 and formant-amplitude
slopes. Parallel A1–A3 use residual slopes after the shared AVS increment.
The OQ offsets interpolate Holmberg (1988) male soft/modal/loud observations;
the accent magnitude, phrase fall, and mapping of A3–A1 balance to TL are
explicit engineering estimates. This closes the missing AV covariation,
without claiming to diagnose the original perceived fading or to reproduce
measured vowel spectra exactly in the cascade branch.

Original investigation:
The "getting quieter" issue is NOT in the track data. It must be in:
- The WebAudio runtime/interpreter scheduling
- The semantics realize rules (voiceGain etc.)
- Or a perception issue from the F0 contour

### F0 Contour (observed)
- Starts at 110 Hz baseline
- "quick" IH1: peaks at 178 Hz (H* accent)
- "brown" AE1: 164.6→150.8→140.9 Hz
- Steady decline through mid-phrase
- "lazy" EH1: peaks at 146.6→130 Hz (second accent)
- "dog" AO1: 122.8→130→122 Hz (nuclear accent, but very mild)
- Final G_CL: 115.9→110 Hz

The F0 is declining significantly. The downstep_k=0.6 is quite aggressive.
By "dog" the nuclear accent only reaches 130 Hz — barely above baseline!

### Duration Issues
- AH0 in "the": 22ms (VERY short — basically inaudible)
- Some vowels quite long: AO in "dog" = 293ms (phrase-final lengthening 1.5x + nuclear accent)
- Total sentence is 3.38s — very slow

## Diagnosis

### Issue 1: "Getting quieter" — likely F0 + perceptual
The track amplitudes (AV, GO) are stable. But perceived loudness correlates with F0.
As F0 drops from 178 Hz to 122 Hz, the voice sounds quieter even at constant AV.
The downstep_k=0.6 is too aggressive for one phrase with 6 content words.
With 5 accents, the 5th accent is at 0.85 * 0.6^4 = 0.11 of range = only 8.8 Hz above base.
That's almost monotone by the end.

### Issue 2: "Bouncy"
The ToBI model creates sharp F0 peaks on accented syllables then immediate drops.
Between accents, the unaccented_declination rule does `fallback * 0.98` per syllable,
creating a staircase. The rapid H* → unaccented → H* → unaccented creates the "bounce."
Sagging transitions (sag_depth_hz=12) help but may not be enough.

### Issue 3: Speed too slow
rate_scale=1.0, no compression. Inventory durations are at isolated-word values.
Need rate_scale ~1.3-1.5 for conversational speed.

### Issue 4: Missing features (TODO investigate)
- No amplitude contouring for perceived loudness (AV should track F0 somewhat)
- No spectral emphasis rule (higher formant amplitudes for accented vowels)
- Very short unstressed vowels (22ms) may cause artifacts
- No consonant-vowel amplitude transitions (instant AV 0→62 at boundaries)
- Possible missing: glottalization at phrase boundaries

## Proposed Fixes (priority order)

1. **Increase default speaking rate**: rate_scale 1.0 → ~1.3
2. **Reduce downstep aggressiveness**: downstep_k 0.6 → 0.75 (or reduce floor)
3. **Add AV-F0 correlation rule**: louder on accented syllables, quiet at phrase end
4. **Smooth F0 transitions**: the current model has sharp targets, could use more interpolation
5. **Review minimum vowel durations**: 22ms for AH0 is very short
6. **Review the ramping/scheduling in the interpreter** (separate investigation)
