# The Motor Theory of Speech Perception Revised

**Authors:** Alvin M. Liberman, Ignatius G. Mattingly
**Year:** 1985
**Venue:** Cognition, 21, pp. 1-36
**Affiliation:** Haskins Laboratories, University of Connecticut, Yale University

## One-Sentence Summary

Speech perception operates on intended phonetic gestures (articulatory motor commands), not acoustic patterns - explaining why formant synthesis works despite acoustic simplification and why coarticulation is essential.

## Problem Addressed

Why does speech perception work despite:
1. No acoustic invariants for phonemes (same phoneme has different acoustics in different contexts)
2. Formant transitions that sound like chirps in isolation but cue consonants in context
3. Multiple acoustic cues that trade off against each other
4. Category boundaries that shift with speaking rate and context

## Key Contributions

1. **Gestures as perceptual objects**: Phonetic perception targets articulatory gestures, not acoustic patterns
2. **Modularity**: A specialized neural "phonetic module" processes speech differently from general auditory perception
3. **Innate perception-production link**: The link between hearing and articulation is biologically specified
4. **Explains coarticulation**: Overlapping gestures produce overlapping acoustics - this is a feature, not a bug
5. **Analysis-by-synthesis**: Listeners accept any acoustic pattern that could plausibly be produced by a vocal tract

## Core Arguments

### Why Gestures, Not Acoustics?

1. **No acoustic invariants**: The acoustic signal for [d] varies dramatically before different vowels
2. **Trading relations**: Multiple cues compensate for each other (silence, transitions, burst)
3. **Duplex perception**: Same acoustic pattern processed as both speech and nonspeech chirp simultaneously
4. **Context-conditioned perception**: Category boundaries shift with articulatory factors

### The Phonetic Module (Fodor's modularity)

| Property | Description |
|----------|-------------|
| Domain-specific | Only processes linguistically significant gestures |
| Mandatory | Automatically engaged by speech-like input |
| Encapsulated | Not influenced by general cognition |
| Fast | Much faster than general cognitive processes |
| Shallow output | Produces phonetic categories, not full analyses |

## Key Evidence

### 1. Duplex Perception
- Formant transitions to one ear + syllable base to other ear
- Listeners hear BOTH: speech syllable AND nonspeech chirp
- Same acoustic information processed by two separate modules
- Chirps 18 dB below threshold still cue stop identity

### 2. McGurk Effect (Audio-Visual Integration)
- Acoustic [ba] + visual [ga] → perceived [da]
- Optical and acoustic signals converge on single gesture
- Speech perception is about gestures, not sounds

### 3. Sinewave Speech
- Three sine waves following formant trajectories perceived as speech
- Acoustically abnormal but trajectories match possible articulations
- Gestural information matters, not acoustic naturalness

### 4. Infant Speech Perception
- 4-month-olds prefer faces articulating the vowel they hear
- Prelinguistic infants categorize phonetic distinctions like adults
- Perception-production link is innate

### 5. Silence as a Cue
- Identical transitions cue [sa] vs [sta] depending on silence presence
- Silence signals complete vocal tract closure (articulation)
- Perception is about what the speaker did, not just what was heard

## Parameters

### Acoustic Cues That Trade

| Feature | Cues That Trade |
|---------|-----------------|
| Stop place | Burst spectrum, F2 transition, F3 transition |
| Stop voicing | VOT, F0 onset, F1 cutback, closure duration |
| Stop vs fricative | Silence duration, burst duration, transition rate |
| Vowel identity | F1, F2, F3, duration, context |

### Timing Critical for Manner

| Distinction | Timing Factor |
|-------------|---------------|
| Stop vs fricative | Silence presence/duration |
| Stop vs affricate | Burst duration, release characteristics |
| Single vs geminate | Closure duration |

## Relevance to Qlatt TTS

### Why Formant Synthesis Works

1. **Perception tolerates simplification**: The phonetic module accepts any acoustics that could have been produced by a vocal tract
2. **Gestural information preserved**: Klatt synthesis preserves formant trajectories (gestural encoding)
3. **Analysis-by-synthesis**: Listeners compare input with internal production models

### Implementation Guidance

1. **Formant Transitions Are Critical**
   - Carry consonant place information
   - Must be context-appropriate
   - F2 transitions especially important for place

2. **Coarticulation Is Essential**
   - Static targets sound unnatural
   - Gestures overlap temporally
   - Acoustic manifestation depends heavily on context

3. **Timing Must Be Precise**
   - Closure duration distinguishes stops from fricatives
   - VOT determines voicing category
   - Wrong timing changes manner perception

4. **Use Redundant Cueing**
   - Multiple cues contribute to each percept
   - If one cue is weak, strengthen related cues
   - Burst + transitions + closure all contribute

5. **Focus on Trajectories**
   - Natural formant trajectories matter more than exact values
   - Transition rates should match articulator dynamics
   - Even simplified acoustics work if trajectories are right

### Practical Implications

```
Formant synthesis works because:
  1. Formant trajectories encode articulatory gestures
  2. The phonetic module recovers gestures from acoustics
  3. Listeners tolerate acoustic abnormality if gestures are recoverable
  4. Multiple cues provide redundancy

Focus on:
  - Context-appropriate formant transitions
  - Proper timing (closures, VOT, transitions)
  - Coarticulation rules for natural trajectories
  - Redundant cueing for robustness
```

## Quotes Worth Preserving

> "The objects of speech perception are the intended phonetic gestures of the speaker, represented in the brain as invariant motor commands."

> "The relation between gesture and signal is systematic because it results from lawful dependencies among gestures, articulator movements, vocal-tract shapes, and signal."

> "Speech perception is not to be explained by principles that apply to perception of sounds in general, but must rather be seen as a specialization for phonetic gestures."

## Limitations

1. Theory is about perception, not production - doesn't specify acoustic parameters
2. Doesn't explain how the phonetic module works mechanistically
3. Controversial claim of speech-specific module (some argue general auditory processes suffice)
4. Doesn't quantify trading relations or cue weights

## Open Questions

- [ ] What are the exact weights for trading relations between cues?
- [ ] How does the internal synthesis model work?
- [ ] Can non-speech sounds engage the phonetic module?
- [ ] How modular is speech perception really?

## Related Work Worth Reading

- Fowler (1986) - Direct realist alternative to motor theory
- Stevens & Blumstein (1981) - Acoustic invariance approach
- Remez et al. (1981) - Sinewave speech
- McGurk & MacDonald (1976) - Audio-visual integration
- Eimas et al. (1971) - Infant categorical perception
