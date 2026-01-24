# Analysis and Synthesis of Intonation using the Tilt Model

**Authors:** Paul Taylor
**Year:** 2000
**Venue:** Speech Communication (journal article)
**Affiliation:** Centre for Speech Technology Research, University of Edinburgh

## One-Sentence Summary

Provides a complete framework for representing F0 contours using three continuous parameters (amplitude, duration, tilt) per intonational event, with algorithms for both automatic analysis from acoustics and synthesis back to F0 contours.

## Problem Addressed

Existing intonation models either:
1. Have too many degrees of freedom (redundant, hard to interpret)
2. Use discrete categorical labels that are difficult to assign consistently
3. Cannot support both automatic analysis AND synthesis

The Tilt model aims to balance constraint (compact representation) with coverage (ability to describe intonational phenomena) while being linguistically meaningful.

## Key Contributions

1. **Tilt representation**: Reduces 4 RFC parameters to 3 independent parameters (amplitude, duration, tilt)
2. **Automatic event detection**: HMM-based system achieving 72.7% correct on spontaneous speech
3. **Automatic Tilt analysis**: Algorithm to extract Tilt parameters from detected events
4. **F0 synthesis**: Equations to generate F0 contours from Tilt representations
5. **Comparison with ToBI**: Shows Tilt's continuous parameters capture variation lost in categorical AM/ToBI labels

## Core Concepts

### Intonational Events

Two types of events:
- **Pitch accents (a)**: F0 excursions associated with syllables for emphasis
- **Boundary tones (b)**: Rising F0 at phrase edges signaling continuation/questioning
- **Combined (ab)**: Accent and boundary occurring together as single movement

Events are linked to syllable nuclei (vowels) in a separate segmental stream. Not every syllable has an event.

### RFC Model (Rise-Fall-Connection)

The underlying parameterization. Each event has:
- Rise amplitude ($A_{rise}$)
- Rise duration ($D_{rise}$)
- Fall amplitude ($A_{fall}$)
- Fall duration ($D_{fall}$)

Three points defined per event: start, peak, end.

### Tilt Parameters

Transform RFC's 4 parameters into 3 more meaningful ones:

| Parameter | Symbol | Description | Range |
|-----------|--------|-------------|-------|
| Amplitude | $A_{event}$ | Total F0 excursion (Hz) | 0 to ~100+ Hz |
| Duration | $D_{event}$ | Total event duration (s) | typically 0.1-0.5s |
| Tilt | $tilt$ | Shape of event (rise vs fall) | -1.0 to +1.0 |

**Tilt values:**
- +1.0 = pure rise
- 0.0 = equal rise and fall
- -1.0 = pure fall

## Key Equations

### RFC to Tilt Conversion (Analysis)

**Amplitude tilt:**
$$tilt_{amp} = \frac{|A_{rise}| - |A_{fall}|}{|A_{rise}| + |A_{fall}|}$$

**Duration tilt:**
$$tilt_{dur} = \frac{D_{rise} - D_{fall}}{D_{rise} + D_{fall}}$$

**Combined tilt** (average of amplitude and duration tilt):
$$tilt = \frac{|A_{rise}| - |A_{fall}|}{2(|A_{rise}| + |A_{fall}|)} + \frac{D_{rise} - D_{fall}}{2(D_{rise} + D_{fall})}$$

**Event amplitude:**
$$A_{event} = |A_{rise}| + |A_{fall}|$$

**Event duration:**
$$D_{event} = D_{rise} + D_{fall}$$

### Tilt to RFC Conversion (Synthesis)

$$A_{rise} = \frac{A_{event}(1 + tilt)}{2}$$

$$A_{fall} = \frac{A_{event}(1 - tilt)}{2}$$

$$D_{rise} = \frac{D_{event}(1 + tilt)}{2}$$

$$D_{fall} = \frac{D_{event}(1 - tilt)}{2}$$

### F0 Synthesis from RFC

**Quadratic contour for rise/fall components:**
$$f_0(t) = A_{abs} + A - 2A \cdot (t/D)^2 \quad \text{for } 0 < t < D/2$$
$$f_0(t) = A_{abs} + 2A \cdot (1 - t/D)^2 \quad \text{for } D/2 < t < D$$

Where:
- $A$ = rise or fall amplitude
- $D$ = rise or fall duration
- $A_{abs}$ = absolute F0 at start of component

**Linear connection between events:**
$$f_0(t) = A_{abs} + A \cdot (t/D) \quad \text{for } 0 < t < D$$

Where:
- $A$ = connection amplitude
- $D$ = connection duration
- $A_{abs}$ = end F0 of previous event

## Parameters

| Name | Symbol | Units | Typical Value | Notes |
|------|--------|-------|---------------|-------|
| Amplitude | $A_{event}$ | Hz | 20-80 Hz | Total F0 excursion |
| Duration | $D_{event}$ | seconds | 0.1-0.4s | Total event time |
| Tilt | $tilt$ | dimensionless | -1 to +1 | Shape parameter |
| Start F0 | $F0_{start}$ | Hz | speaker-dependent | Absolute pitch at event start |
| Syllabic position | $P$ | seconds or relative | varies | Peak position relative to syllable |
| Median filter window | - | frames | 7-11 points | For F0 smoothing |
| Search region | - | frames | 10 frames (100ms) | For RFC fitting |

## Event Detection System

### Architecture
- Uses continuous-density Hidden Markov Models (HMMs)
- Trained with Baum-Welch algorithm
- Recognition via Viterbi algorithm with n-gram language model
- HTK toolkit used for implementation

### Features (best configuration - F4)
- Normalized F0
- RMS energy
- Delta coefficients (first derivatives)
- Delta-delta coefficients (second derivatives)
- 10ms frame intervals

### Labels
Five core labels: **a** (accent), **b** (boundary), **ab** (combined), **c** (connection), **sil** (silence)

### Performance

| Dataset | % Correct | % Accuracy |
|---------|-----------|------------|
| SI-DCIEM (speaker-independent) | 72.7 | 47.7 |
| SD-DCIEM (speaker-dependent) | 82.1 | 63.1 |
| Radio News | 69.4 | 49.7 |
| Switchboard | 60.7 | 35.1 |

Human labeler consistency: 81.6% correct, 60.4% accuracy

## Synthesis Accuracy

| Representation | Smooth F0 RMSE (Hz) | Smooth F0 correlation |
|----------------|---------------------|----------------------|
| Complete RFC | 6.94 | 0.837 |
| Complete Tilt | 7.14 | 0.829 |
| Automatic Tilt | 7.51 | 0.833 |

Key finding: Tilt synthesis achieves nearly identical accuracy to RFC despite having fewer parameters.

## Correlation Between Parameters

### RFC Parameters (high correlation = redundancy)
| | rise amp | rise dur | fall amp | fall dur |
|-|----------|----------|----------|----------|
| rise amplitude | 1.0 | | | |
| rise duration | 0.33 | 1.0 | | |
| fall amplitude | -0.48 | -0.04 | 1.0 | |
| fall duration | -0.18 | -0.46 | 0.025 | 1.0 |

### Tilt Parameters (low correlation = independent)
| | amplitude | duration | tilt |
|-|-----------|----------|------|
| amplitude | 1.0 | | |
| duration | 0.17 | 1.0 | |
| tilt | 0.06 | -0.09 | 1.0 |

This confirms Tilt parameters are nearly orthogonal (independent).

## Implementation Details

### Automatic RFC Analysis Algorithm

1. **Preprocessing**: Median smooth F0 contour (7-11 point window)
2. **Interpolation**: Fill unvoiced regions within events
3. **Peak detection**: Determine if event is rise, fall, or rise-fall
4. **Search regions**: Define 10-frame windows at start/end
5. **Curve fitting**: Generate 100 candidate curves (10x10 start/end combinations)
6. **Best fit**: Select curve with lowest Euclidean distance to actual F0

### Synthesis Procedure

1. Convert event-based description to segmental (connection-based)
2. Convert Tilt → RFC using equations 8-11
3. For each event: synthesize rise then fall using quadratic curves
4. For connections: synthesize linear interpolation
5. Concatenate all segments

### Position Parameter

The *syllabic position* measures alignment:
- For rise-fall events: distance from syllable nucleus start to F0 peak
- For rise-only: distance to rise end
- For fall-only: distance to fall start

This captures the H* vs L+H* distinction in ToBI (late vs early peak alignment).

## Figures of Interest

- **Fig 1 (p. 5)**: Schematic of F0 contour with intonational stream and syllable stream
- **Fig 2 (p. 13)**: Search regions for RFC fitting algorithm
- **Fig 3 (p. 15)**: Five events with tilt values from +1.0 to -1.0
- **Fig 4 (p. 23)**: Tilt vs AM/ToBI representations for common utterance types
- **Fig 5 (p. 24)**: Two-dimensional Tilt/Position space mapped to ToBI accents

## Comparison with ToBI/AM

The Tilt model and Autosegmental-Metrical (AM/ToBI) model share:
- Event-based representation
- Events linked to syllables
- Accents and boundary tones as primitives

Key difference: Tilt uses **continuous** parameters while ToBI uses **discrete** categories.

### ToBI Accent Types Mapped to Tilt

| ToBI | Tilt | Position |
|------|------|----------|
| H* | T = -1.0 | P = 40ms (late) |
| L+H* | T = +1.0 | P = -70ms (early) |
| H+L* | T = -1.0 | P = -70ms (early) |
| L* | T = 0.0 | P = 0ms |
| H% | T = +1.0 | P = varies |

Finding: In natural speech, ~79% of accents are H*, ~15% are L+H*. This uneven distribution makes categorical classification less useful than continuous parameters.

## Limitations

1. **Falling boundaries not modeled**: Only rising boundaries (b) are events; falling boundaries are default (no event)
2. **Level accents problematic**: Accents with no F0 movement have zero amplitude/duration in phonetic representation
3. **Duration parameter phonetic**: Duration depends on segmental content, may not be truly phonological
4. **Position not purely local**: Requires syllable segmentation information
5. **Spontaneous speech harder**: Switchboard performance significantly worse than read speech

## Relevance to Project

**Direct application to TTS prosody:**

1. **F0 contour generation**: Use Tilt synthesis equations (12-13) to generate F0 from prosodic markup
2. **Accent placement**: Mark syllables as accented (a) or boundary (b) based on:
   - Sentence position (phrase-final → boundary tone)
   - Word stress (stressed syllables → pitch accents)
   - Information structure (new information → stronger accent)
3. **Parameter prediction**:
   - Amplitude: ~40-60 Hz for normal accents, higher for emphasis
   - Tilt: typically -0.5 to -1.0 for declaratives (falling), +0.5 to +1.0 for questions
   - Duration: ~200-300ms typical

**Implementation approach:**
1. Identify accent-bearing syllables
2. Assign Tilt parameters based on sentence type and position
3. Convert to RFC
4. Generate quadratic F0 curves
5. Interpolate connections linearly
6. Sample at Klatt frame rate (5ms)

## Open Questions

- [ ] How to predict tilt values from text alone (would need prosody rules or ML model)?
- [ ] How to handle emphasis/contrast (larger amplitude)?
- [ ] What are typical parameter values for different sentence types?
- [ ] How to model declination (gradual F0 lowering across utterance)?
- [ ] Integration with Klatt F0 parameter - convert Hz to internal representation?

## Related Work Worth Reading

- **Pierrehumbert (1980)** - Original AM/ToBI phonology of English intonation
- **Taylor (1995)** - Original RFC model paper with more analysis detail
- **Dusterhoff & Black (1997)** - CART-based F0 prediction using Tilt model
- **Black (1997)** - Learning Tilt parameters from data
- **Fujisaki & Ohno (1997)** - Alternative superposition model for comparison
- **Silverman et al. (1992)** - ToBI labeling standard

## Software Availability

- Tilt analysis/synthesis code: Edinburgh Speech Tools (Festival)
- Available from: http://www.cstr.ed.ac.uk/projects/festival
- CART F0 generation: Also in Festival
- Derived F0 contours and labellings: http://www.cstr.ed.ac.uk/projects/intonation
