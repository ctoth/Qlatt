# Integration of Rule-Based Formant Synthesis and Waveform Concatenation: A Hybrid Approach to Text-to-Speech Synthesis

**Authors:** Susan R. Hertz
**Year:** 2002
**Venue:** Proceedings IEEE 2002 Workshop On Speech Synthesis, Santa Monica, CA
**Affiliation:** SpeechWorks International, Inc. & Department of Linguistics, Cornell University

## One-Sentence Summary

Demonstrates that formant-synthesized obstruents and reduced vowels can seamlessly replace ~37% of natural speech segments in concatenative TTS while maintaining perceived quality, with implications for database size reduction and consonant enhancement.

## Problem Addressed

Formant-based TTS (ETI-Eloquence) produces highly intelligible speech with natural prosody, but poor voice quality—especially for female voices. The paper explores which segments contribute to unnaturalness by splicing synthetic and natural segments together.

## Key Contributions

1. **Segment-specific quality findings**: Identified which phone types can be successfully synthesized vs. require natural samples
2. **Database reduction potential**: Non-nasal obstruents (37% of phones, 32% of duration) can be synthesized, reducing database size
3. **Hybrid TTS prototype**: Demonstrated working system combining ETI-Eloquence rules with Speechify concatenation
4. **Diagnostic tool**: Hybrid approach useful for identifying problems in both formant and concatenative systems

## Methodology

Two experimental approaches:
1. **Hand construction**: ~30 utterances (~300 words) manually spliced using WSOLA joins at 8 kHz
2. **Prototype TTS system**: Automated system combining ETI-Eloquence 6.0 (Shelley voice) with Speechify 2.0 (Mara database)

Systems used:
- **Formant synthesis**: ETI-Eloquence 6.0 (Reed/Shelley voices)
- **Synthesizer**: Similar to KLSYN-88 with KLGLOTT-88 glottal source, cascade vocal tract, parallel fricative
- **Concatenation**: Speechify 2.0 with half-phone units and WSOLA joins
- **Sampling rate**: 8 kHz

## Key Findings by Segment Type

### Segments That Work Well (Can Be Synthesized)

| Segment Type | Context | Notes |
|--------------|---------|-------|
| Voiceless stops | All contexts | Often preferred over natural (better aspiration control) |
| Voiced stops | All contexts | Sometimes preferred |
| Voiceless fricatives | All contexts | [s], [t], [d] sometimes preferred; lower freq noise at 8kHz helps |
| Voiced fricatives | All contexts | Good results |
| Reduced vowels | Between non-sonorants | Best when breathiness increased (spectral tilt + aspiration) |
| Reduced V+sonorant sequences | Between non-sonorants | Minimal join problems |

### Segments That Need Natural Samples

| Segment Type | Context | Problem |
|--------------|---------|---------|
| Stressed vowels | All | Main contributor to unnatural voice quality |
| Long syllable nuclei | Especially female voice | Sound unnatural |
| Nasals in codas | Pitch-accented syllables | Pitch discontinuity with preceding vowel |
| /l/, /r/ in codas | With preceding vowel | Form single durational/pitch units; hard to segment |

### Context-Dependent Results

| Segment Type | Works In | Fails In |
|--------------|----------|----------|
| Nasals | Syllable onsets | Syllable codas (especially accented) |
| /l/, /r/ | Syllable onsets | Tautosyllabic with vowel |

## Parameters Found

| Parameter | Modification | Effect |
|-----------|--------------|--------|
| Spectral tilt | Increase | More breathiness; helps reduced vowels sound natural |
| Aspiration amplitude (AH) | Increase | More breathiness; helps reduced vowels |
| F2 bandwidth | Narrow | Reduces excess nasality in coda nasals |
| F0 | Adjust to context | Sometimes needed for synthetic nuclei |

## Implementation Details

### ETI-Eloquence Architecture
- Phone-and-transition model (transitions are independent units) [4]
- For hybrid experiments: treated transitions as parts of phones
- Voiced transitions between obstruents/sonorants → part of sonorant
- Aspirated transitions out of stops → part of stop
- Vowel-to-vowel transitions → split evenly between vowels

### Synthesizer Configuration
- KLSYN-88-like formant synthesizer [3]
- KLGLOTT-88-like glottal source model [3]
- Cascade vocal tract model
- Parallel fricative model
- Full speech generation component: <200K for all voices and segments

### Statistics (from 160,225 English sentences, 11,967,343 phones)
- Non-nasal obstruents: 37% of phones
- Non-nasal obstruents: 32% of total duration
- Potential synthesizable segments: up to 2/3 of phones per sentence

## Figures of Interest

- **Fig 1 (p.2)**: Sample hybrid sentences with synthetic segments marked
- **Fig 2 (p.2)**: Spectrograms comparing human vs. hybrid "with the pro golfer"—shows spectral differences don't always correlate with perceived differences

## Results Summary

1. Listeners often rated hybrid utterances (with high % synthetic) equal to fully concatenative versions
2. Even speech researchers couldn't reliably identify synthetic segments (except long stressed nuclei)
3. Hybrid utterances still sounded like the target voice (Rick/Mara)
4. Voice quality perception stems primarily from stressed syllable nuclei

## Practical Applications

1. **Database reduction**: Eliminate non-nasal obstruents from databases, synthesize dynamically
2. **Consonant enhancement**: Formant rules can enhance consonants for telephony/noisy environments (e.g., lowering fricative noise frequency at 8kHz)
3. **Unit selection optimization**: Collapse candidate network at synthetic insertion points → reduced search complexity
4. **F0 modification**: Adjust F0 in synthesized segments without waveform degradation
5. **Diagnostic tool**: Identify segmentation errors and poor units in concatenative databases

## Limitations

- Only informal listening tests conducted (10 listeners)
- 8 kHz sampling rate only
- Did not optimize hybrid prototype for performance
- Nasal/liquid results "less consistent" and need more research
- Did not return to pure formant voice quality improvements

## Relevance to Qlatt Project

### Direct Implications

1. **Obstruent synthesis is viable**: Focus quality efforts on stressed vowels, not stops/fricatives
2. **Breathiness parameters matter**: Spectral tilt and aspiration amplitude help reduced vowels
3. **F2 bandwidth for nasals**: Narrowing B2 reduces over-nasalization in codas
4. **Syllable position matters**: Onset sonorants easier than coda sonorants

### Design Guidance

- For a pure formant synthesizer like Qlatt, the main quality bottleneck is **stressed syllable nuclei**
- Transitions into/out of obstruents are relatively easy
- Phone-and-transition model (ETI-Eloquence's approach) may be worth studying

### Specific Fixes to Consider

1. Check if nasal F2 bandwidth needs adjustment in coda position
2. Verify spectral tilt and aspiration settings for reduced vowels
3. Consider syllable position in prosodic rules (onsets vs. codas)

## Open Questions

- [ ] What specific spectral tilt values work best for reduced vowels?
- [ ] How does ETI-Eloquence's phone-and-transition model differ from phone-target interpolation?
- [ ] What makes female voice quality harder than male in formant synthesis?
- [ ] Would the 37% obstruent percentage hold for Qlatt's output?

## Related Work Worth Reading

- [1] Hertz et al. 1999 - ETI-Eloquence multi-language TTS (ICPhS) - system architecture
- [2] Verhelst 2000 - WSOLA overlap-add methods - join technique
- [3] **Klatt & Klatt 1990** - KLSYN-88, KLGLOTT-88, voice quality variations *(already in papers/)*
- [4] Hertz 1991 - Phone-and-transition model for formant timing - core ETI-Eloquence approach
- [5] Hertz & Huffman 1992 - Nucleus-based timing model - syllable structure effects
