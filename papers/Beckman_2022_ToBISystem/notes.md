# The ToBI Transcription System: Conventions, Strengths, and Challenges

**Authors:** Sun-Ah Jun (main chapter), Laura C. Dilley & Mara Breen (commentary)
**Year:** 2022
**Venue:** The Oxford Handbook of Language Prosody (Chapter 4, pp. 151-211)
**Publisher:** Oxford University Press

## One-Sentence Summary

Comprehensive specification of ToBI (Tones and Break Indices) prosodic annotation conventions based on Autosegmental-Metrical theory, including pitch accent inventory, boundary tones, break indices, plus a commentary proposing the enhanced AM+ theory with five pitch levels.

## Problem Addressed

Providing a standardized system for annotating prosodic features (pitch accents, phrase boundaries, prominence) at the phonological level, enabling research on intonation and informing TTS prosody generation.

## Key Contributions

1. Complete ToBI annotation conventions for Mainstream American English (MAE_ToBI)
2. Break Index scale (0-4) for marking perceived juncture strength
3. Pitch accent and boundary tone inventory with alignment rules
4. AM+ theory extension with five pitch levels (EH, H, M, L, EL)
5. RaP (Rhythm and Pitch) transcription system as alternative approach

## ToBI Framework

### The AM (Autosegmental-Metrical) Model
- Intonation = linear sequence of High (H) and Low (L) tones
- Tones associated with:
  - Syllables → **pitch accents** (marked with *)
  - Phrase edges → **boundary tones** (marked with - for ip, % for IP)

### Prosodic Hierarchy
```
        IP (Intonational Phrase)
       /  \
      ip   ip  (intermediate phrase)
     /  \
    AP   AP  (Accentual Phrase)
   /  \
  w    w   (prosodic word)
```

### Core ToBI Tiers
1. **Words tier**: Orthographic transcription aligned with audio
2. **Tones tier**: Pitch accents and boundary tones
3. **Break Indices tier**: Juncture strength (0-4)
4. **Miscellaneous tier**: Comments, silence, disfluencies

## Key Parameters

### Break Index Scale (MAE_ToBI)

| BI | Meaning | Example |
|----|---------|---------|
| 0 | Weaker than word boundary | Clitics, coalescence |
| 1 | Typical phrase-medial word boundary | Most word boundaries |
| 2 | Tonal/juncture mismatch | |
| 3 | intermediate phrase (ip) boundary | |
| 4 | Intonational Phrase (IP) boundary | |

### English Pitch Accent Inventory

| Label | Description | F0 Pattern |
|-------|-------------|------------|
| H* | High accent | Peak on accented syllable |
| L* | Low accent | Valley on accented syllable |
| L+H* | Rising | Valley before, peak on accented |
| L*+H | Rising (late peak) | Valley on accented, peak after |
| H+!H* | Falling (downstepped) | Fall from high to mid |

### Boundary Tones

| Label | Pattern | Usage |
|-------|---------|-------|
| L-L% | Low-low | Declarative (default) |
| H-H% | High-high | Yes-no question |
| L-H% | Low-high | Continuation rise |
| H-L% | High-low | Declarative variant |

### Downstep Convention
- **!** before H indicates reduced pitch range
- Triggered by preceding bitonal accent (H+L or similar)
- Examples: !H*, L+!H*, !H-

### Timing Markers
- **<** : Delayed F0 peak (later than expected)
- **>** : Early F0 peak (earlier than expected)

### Pitch Range Markers
- **HiF0**: Highest F0 in ip (for discourse analysis)
- **%reset**: Pitch range reset after disfluency
- **%e-prom**: Local pitch range expansion (emphasis)
- **%compressed**: Local compression after expansion

## AM+ Theory (Dilley & Breen)

### Five Pitch Levels

| Level | Features | Description |
|-------|----------|-------------|
| EH (Extra High) | [-same, +higher, -small] | Substantially above mean |
| H (High) | [-same, +higher, +small] | Slightly above mean |
| M (Mid) | [+same] | Equal to mean pitch |
| L (Low) | [-same, -higher, +small] | Slightly below mean |
| EL (Extra Low) | [-same, -higher, -small] | Substantially below mean |

### Syntagmatic Features
- **[+/- same]**: Is tone at same level as previous?
- **[+/- higher]**: Direction of pitch change
- **[+/- small]**: Magnitude of change (small vs large)

### RaP Pitch Tier Symbols

| Symbol | Features | Meaning |
|--------|----------|---------|
| H | [-same, +higher] | Higher than previous |
| !H | [-same, +higher, +small] | Slightly higher |
| E | [+same] | Equal to previous |
| !L | [-same, -higher, +small] | Slightly lower |
| L | [-same, -higher] | Lower than previous |

## Implementation Details

### F0 Generation from ToBI

```
1. Parse ToBI labels for utterance
2. For each pitch accent:
   - H* → local F0 maximum on accented syllable
   - L* → local F0 minimum on accented syllable
   - L+H* → valley before, peak on accented
   - L*+H → valley on accented, peak after
3. For each boundary tone:
   - L-L% → fall to bottom of range
   - H-H% → rise to top of range
   - L-H% → low then rise at boundary
4. Apply downstep (!H) by reducing subsequent H targets
5. Interpolate F0 between targets (monotonic, mostly)
6. Reset pitch range at IP boundaries (BI=4)
```

### Pitch Target Timing
- F0 maxima/minima: f'(x) = 0 (velocity zero-crossing)
- Slope changes ("elbows"): f''(x) = 0 (acceleration zero-crossing)

### Break Index to Duration/Pause

| BI | Pause Duration | Preboundary Lengthening |
|----|----------------|------------------------|
| 0 | None | None |
| 1 | None | Minimal |
| 2 | Variable | Variable |
| 3 | Short or none | Moderate |
| 4 | Possible pause | Strong lengthening |

### Downstep Implementation
1. Track running "pitch register" within ip
2. After H+L or bitonal accent, lower the register
3. Subsequent H tones realized relative to lowered register
4. Reset register at ip/IP boundary (BI >= 3)

### Nuclear vs Prenuclear Accents
- **Nuclear Pitch Accent (NPA)**: Last pitch accent in ip
- NPA typically most prominent, largest F0 excursion
- Prenuclear accents may have smaller excursions

## Figures of Interest

- **Fig 4.1 (p.156)**: MAE_ToBI transcription in waves software
- **Fig 4.2 (p.157)**: Same utterance in Praat with F0 track
- **Prosodic tree (p.153)**: IP > ip > AP > w hierarchy
- **Table 4c.1 (p.191)**: Five-level paradigmatic tone specifications

## Limitations

1. Only marks phonological categories, not phonetic F0 details
2. No marking of discourse-level prosodic phenomena
3. Not optimized for gradual/global prosodic events (declination)
4. Labeler variability in perception affects annotations
5. Different ToBI systems use different abstraction levels
6. Cross-language comparison complicated by different inventories

## Relevance to Qlatt

1. **Prosody generation**: ToBI provides target framework for F0 generation
2. **Phrasing**: Break indices inform pause insertion and boundary effects
3. **Pitch accent placement**: Content words typically accented, function words not
4. **Boundary tones**: L-L% for statements, H-H%/L-H% for questions
5. **Downstep**: Track register for natural pitch declination

### Practical Mapping

```javascript
// Example: ToBI label to F0 target
function tobiToF0Target(label, pitchRange, register) {
  switch(label) {
    case 'H*': return register.high;
    case 'L*': return register.low;
    case 'L+H*': return [register.low, register.high]; // valley then peak
    case '!H*': return register.high * 0.85; // downstepped
    case 'L-L%': return pitchRange.bottom;
    case 'H-H%': return pitchRange.top;
  }
}
```

## Open Questions

- [ ] How to map ToBI labels to actual Hz values for synthesis?
- [ ] Should Qlatt use 2-level (H/L) or 5-level pitch targets?
- [ ] How to model declination within phrases?
- [ ] What triggers downstep vs pitch range reset?

## Related Work Worth Reading

- Pierrehumbert (1980) - English Intonation (PhD thesis, MIT)
- Beckman & Ayers (1997) - Guidelines for ToBI labelling
- Ladd (2008) - Intonational Phonology
- Dilley & Heffner (2013) - "Bulging" interpolation
