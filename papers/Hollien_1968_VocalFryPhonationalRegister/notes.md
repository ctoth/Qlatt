# Hollien & Michel 1968 — Vocal Fry as a Phonational Register

## Key Finding

Vocal fry (pulse register) is a distinct phonational register that occupies a frequency range **below** the modal register, with no overlap between fry and modal ranges in any of the 22 subjects tested.

## Register Definition (used in this study)

A **register** is defined as a series or range of consecutive vocal fundamental frequencies of similar quality, with little or no overlap in fundamental frequency between adjacent registers.

## Frequency Range Data (Table 1)

### Males (N=12)

| Measure | Vocal Fry | Modal | Falsetto |
|---------|-----------|-------|----------|
| Group range (Hz) | 7-78 | 71-561 | 156-795 |
| Mean range (Hz) | 24-52 | 94-287 | 275-634 |
| Mean range (tones) | 6.7 | 9.7 | 7.2 |

### Females (N=11, fry N=10)

| Measure | Vocal Fry | Modal | Falsetto |
|---------|-----------|-------|----------|
| Group range (Hz) | 2-78 | 122-798 | 210-1729 |
| Mean range (Hz) | 18-46 | 144-538 | 495-1131 |
| Mean range (tones) | 8.1 | 11.4 | 7.2 |

## Implementation-Relevant Parameters

### F0 boundaries for vocal fry register
- **Male vocal fry ceiling**: ~52 Hz (mean), 78 Hz (max observed)
- **Female vocal fry ceiling**: ~46 Hz (mean), 78 Hz (max observed)
- **Vocal fry floor**: as low as 2 Hz (female), 7 Hz (male)
- **No overlap** between fry and modal register in any subject

### F0 boundaries between modal and falsetto
- Approximately half of subjects showed no frequency overlap between modal and falsetto registers
- Some untrained individuals cannot phonate frequencies between upper modal limit and lower falsetto limit

## Synthesis Implications

For a Klatt synthesizer modeling vocal fry / creaky voice:
- F0 should be set in the range ~2-78 Hz (with typical range ~20-50 Hz)
- The glottal source must produce discrete, separated pulses at these very low rates
- Vocal fry is sex-independent in frequency placement (both sexes use similar fry ranges)
- The transition from fry to modal involves a register break, not a smooth continuum — no subjects produced intermediate frequencies

## Method Notes

- 12 males, 11 females (ages 20-35), no voice disorders, no singing training
- Subjects matched phonation (/a/ vowel) to recorded tones (62-2093 Hz, equal tempered scale)
- Vocal fry range determined by having subjects produce slowest and fastest pulse rates
- One female could not produce vocal fry at all
- Range limits judged subjectively by experimenter + independent observer + subject
