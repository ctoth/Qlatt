# Models of Aspirated Stops in English

**Authors:** Helen M. Hanson, Kenneth N. Stevens
**Year:** 2003
**Venue:** 15th International Congress of Phonetic Sciences (ICPhS), Barcelona
**URL:** https://www.internationalphoneticassociation.org/icphs-proceedings/ICPhS2003/papers/p15_0783.pdf

## One-Sentence Summary
Challenges the classical three-phase model of aspirated stop releases (transient-frication-aspiration) by showing that some speakers produce frication noise during the "aspiration" phase, with place-dependent spectral characteristics that provide alternative cues to place of articulation.

## Problem Addressed
The classical model assumes three cleanly separable phases in voiceless aspirated stop releases: (1) transient, (2) frication at the supraglottal constriction, (3) aspiration with glottal noise exciting the full vocal tract. Previous work (Klatt 1975, Zue 1976) noted difficulty distinguishing the frication and aspiration phases spectrally, but no systematic investigation had been done. This paper examines whether the "aspiration" phase may actually contain continued frication noise rather than pure aspiration.

## Key Contributions
- Demonstrates that the aspiration phase of voiceless aspirated stops is not purely aspiration noise; for some speakers, frication noise dominates during this phase
- Shows this mixed frication/aspiration pattern is place-dependent: velar stops show F2/F3 frication prominence, alveolar stops show F4-F5 frication prominence, labial stops follow classical aspiration model
- Proposes that speakers can choose between two equally effective strategies for enhancing place of articulation cues: formant transitions (classical) or extended burst frication
- Uses /h/ as a reference baseline for comparing aspiration energy across consonants

## Methodology
- 4 subjects (2M, 2F), stimulus phrases of form /@ CV C@ 'CVC/
- Vowel /A/ only analyzed here; consonants /h, p, t, k/ (voiced stops /b, d, g/ recorded but not analyzed)
- 6 tokens per phrase, 5 analyzed; 16 kHz sampling, lowpass filtered
- Labeling: stop release time $t_r$ and voice onset $t_{v+}$; for /h/: voice offset $t_{v-}$ and onset $t_{v+}$
- Spectral analysis via averaged wideband spectra (see equations below)
- Formant-amplitude tracks (A1-A6) extracted at 3-ms steps over stop releases from $t_r$ to $t_{v+}+30$ ms
- Tracks aligned either at release or at voice onset for cross-consonant comparison

## Key Equations

### Average Wideband Spectrum

$$
\bar{S}_{t_0}(\omega) = 10 \log_{10}\left[\frac{1}{K+1} \sum_{t=t_0-K/2}^{t_0+K/2} |S_t(\omega)|^2\right]
$$

Where:
- $t_0$ = center of the averaging frame
- $K$ = frame size in ms over which averaging occurs (6 ms in this study, i.e., 7 frames at 1-ms steps)
- $S_t(\omega)$ = DFT of windowed speech signal

### Windowed DFT

$$
S_t(\omega) = \mathcal{F}[s(\tau) w(\tau - [t - T_w/2])]
$$

Where:
- $s(t)$ = speech signal
- $w$ = Hamming window of length $T_w = 3$ ms

## Parameters

| Name | Symbol | Units | Value | Notes |
|------|--------|-------|-------|-------|
| Averaging frame size | K | ms | 6 | Number of 1-ms steps for spectrum averaging |
| Window length | T_w | ms | 3 | Hamming window for each DFT |
| Sampling rate | - | kHz | 16 | Lowpass filtered |
| Analysis step size | - | ms | 3 | Step between averaged spectra over release |
| Analysis range | - | ms | t_r to t_v+ + 30 | From release to 30 ms past voice onset |
| Formant peaks tracked | A1-A6 | dB | - | Amplitudes at F1 through F6 |

## Implementation Details

### Analysis Procedure
1. At each time point t_0 in the release, compute 7 short-time DFTs (3-ms Hamming windows at 1-ms steps over a 6-ms interval)
2. Square the magnitudes, average them, convert to dB to get the averaged wideband spectrum
3. From each averaged spectrum, measure amplitudes at spectral peaks corresponding to F1-F6
4. If no clear peak exists at a formant location (e.g., just a spectral shoulder), measure at the frequency where the peak would be expected for the following vowel
5. Align all tokens of a consonant at the release, average the amplitude tracks
6. Compare across consonants by aligning at voice onset (to normalize for VOT differences across place)

### Three-Phase Model of Stop Release (Classical, Being Challenged)
1. **Transient**: Abrupt pressure release, volume velocity burst excites entire vocal tract
2. **Frication**: Turbulence at supraglottal constriction excites cavity in front of constriction
3. **Aspiration**: Turbulence near glottis excites entire vocal tract

For voiceless aspirated stops, phase 3 is considerably longer than for unaspirated stops.

### Revised Model (Proposed)
The aspiration phase may contain:
- Pure aspiration (classical model) -- observed for /p/ at all places, and for some speakers for /k/ and /t/
- Mixed frication + aspiration -- observed for other speakers, especially for /k/ (F2 region) and /t/ (F3-F6 regions)
- The frication source appears to be at the original supraglottal constriction (maintained beyond burst), NOT at a tongue-body constriction formed for the following vowel

### Place-Specific Patterns for Extended Frication
- **Velar /k/**: Extended F2 or F3 prominence following release (some subjects)
- **Alveolar /t/**: Long interval of frication as prominence in F4-F5 region (most subjects)
- **Labial /p/**: Initial transient + brief frication, then classical aspiration with multiple formant excitation (all subjects)

## Figures of Interest
- **Fig 1 (p. 1):** Schematic of classical three-phase model for voiceless unaspirated stop release (from Stevens 1993). Shows transient, frication, aspiration, and voicing phases with temporal overlap.
- **Fig 2 (p. 2):** Spectrograms comparing synthesized (HLsyn/Klatt) vs. natural "a Kaiser" (female speaker). The synthesized version shows clean frication-to-aspiration transition; the natural version shows continued F2 prominence throughout the aspiration period.
- **Fig 3 (p. 3):** Average wideband spectrum of a /k/ burst (male speaker) with A1-A6 peaks labeled. Shows how formant amplitudes are measured even when peaks are not well-defined.
- **Fig 4 (p. 3):** F2-amplitude tracks for all 4 subjects, comparing /h, p, t, k/ aligned at voice onset. Key finding: for subjects KS and HH, /k/ F2 amplitude exceeds /h/ during aspiration phase.
- **Fig 5 (p. 3):** F5-amplitude tracks for all 4 subjects. Key finding: /t/ F5 amplitude exceeds /h/ for all subjects, suggesting frication dominates.

## Results Summary

### Using /h/ as Reference
If the aspiration phase were purely aspiration (glottal source), formant amplitudes should not exceed those of /h/ (which is purely aspiration-excited). When amplitudes exceed /h/, this indicates frication noise is present.

### By Place of Articulation
- **/p/ (labial)**: F2 and F5 amplitudes generally equal to or weaker than /h/ during aspiration -- follows classical model for all subjects
- **/k/ (velar)**: F2 amplitude exceeds /h/ for subjects KS and HH during both burst and aspiration, suggesting frication near velar constriction. Subjects SO and JV follow classical model.
- **/t/ (alveolar)**: F5 amplitude exceeds /h/ for all 4 subjects. F3 mixed for 3 subjects. F4 mixed for 2 subjects. F6 mixed for 1 subject.

### By Subject
- **KS and HH**: Show extended frication patterns (more complex model needed)
- **SO and JV**: Largely follow classical model

### Perceptual Implication
Despite inter-speaker variability in production strategy, listeners identify consonants without difficulty. Two equally effective strategies exist for cueing place of articulation:
1. Formant transitions into following vowel (classical)
2. Extended frication from front-cavity resonance (alternative)

## Limitations
- Only 4 subjects analyzed
- Only vowel /A/ context examined (other vowel contexts recorded but not yet analyzed)
- Only qualitative/visual comparison of amplitude tracks -- no statistical analysis reported
- Does not propose a quantitative acoustic model or parameter values for the extended frication
- Short conference paper format limits depth of analysis

## Testable Properties

- For /p/ releases, formant amplitudes during the aspiration phase should not systematically exceed those measured during /h/ in the same vowel context
- For /t/ releases, at least the F4-F5 amplitude should exceed /h/ levels during the aspiration phase (observed across all 4 subjects)
- For /k/ releases before /A/, F2 amplitude may exceed /h/ levels during the aspiration phase (speaker-dependent)
- If frication dominates the aspiration phase, the dominant spectral peak should correspond to the front-cavity resonance of the original constriction (F2-F3 for velar, F4-F5 for alveolar)
- Labial stops should show the most classical aspiration pattern because they have no significant front-cavity resonance during release

## Relevance to Project

Directly relevant to Qlatt's stop consonant synthesis. The Klatt synthesizer models aspiration as a single source (AH parameter, glottal noise) during the aspiration phase. This paper suggests that for some speakers/contexts, the AF (frication) parameter should remain active or be re-activated during the aspiration interval for /t/ and /k/, with frication amplitude concentrated at place-specific formant regions. This could improve the naturalness of synthesized stop releases by:

1. For /t/: maintaining AF with energy in the F4-F5 region during what would classically be pure aspiration
2. For /k/: maintaining AF with energy in the F2-F3 region during post-burst aspiration
3. For /p/: using the classical model (AF drops, AH dominates)

The PLSTEP burst mechanism in Qlatt handles the transient, but the transition from frication to aspiration currently follows the classical model. This paper suggests the structural rules for stop releases should allow place-dependent frication extension.

## Open Questions
- [ ] What are quantitative amplitude values for the extended frication? (Not provided in this paper)
- [ ] How does vowel context affect the frication/aspiration mix? (Acknowledged as future work)
- [ ] Is the extended frication modeled by simply extending the AF parameter duration, or does it require a separate noise source?
- [ ] How does this interact with the parallel/cascade branch switching (SW parameter) in the Klatt model?
- [ ] Hanson & Stevens 1999 (not in references but same authors) may have more detailed spectral data

## Related Work Worth Reading
- Stevens 1993 [1] - Models for production and acoustics of stop consonants (source of classical three-phase model)
- Fant 1960 [2] - Acoustic Theory of Speech Production (p. 185 discusses aspiration as possible mix of fricative and aspirated sound)
- Klatt 1975 [4] - VOT, frication, and aspiration measurements (noted difficulty separating phases)
- Zue 1976 [5] - Acoustic characteristics of stop consonants (detailed controlled study, already in project collection)
- Stevens, Manuel & Matthies 1999 [6] - Place of articulation measures for stops

## Collection Cross-References

### Already in Collection
- [[Zue_1976_StopConsonantAcoustics]] — cited as [5], the most detailed controlled study of stop consonant acoustics; provides VOT, burst frequency, and burst amplitude data that this paper builds upon
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited as [2], p. 185 discusses aspiration phase as possible mix of fricative and aspirated sound, which this paper empirically investigates
- [[Lisker_Abramson_1964_CrossLanguageVoicingStops]] — cited as [3], provides the VOT measurement framework used to define the aspiration phase duration

### New Leads (Not Yet in Collection)
- Stevens (1993) — "Models for the production and acoustics of stop consonants," Speech Commun. 13:367-375 — source of the classical three-phase model (Fig. 1) that this paper challenges; directly relevant to stop synthesis
- Klatt (1975) — "Voice onset time, frication, and aspiration in word-initial consonant clusters," JSHR 18:686-706 — VOT and frication/aspiration timing measurements; foundational for AF/AH parameter transitions
- Stevens, Manuel & Matthies (1999) — "Revisiting place of articulation measures for stop consonants," ICPhS 99, pp. 1117-1120 — complementary burst spectra analysis

### Conceptual Links (not citation-based)
- [[Hertz_1991_StreamsPhonesTransitions]] — Hertz treats aspiration as an independent stream overlaying the CV transition after voiceless stops. Hanson & Stevens' finding that /t/ and /k/ releases contain supraglottal frication (not just glottal aspiration) complicates this model: the AF parameter may need place-dependent extension into what Hertz models as the aspiration interval, rather than a clean AH overlay.

### Cited By (in Collection)
- [[McGowan_Howe_2007_CompactGreensFunction]] — Hanson & Stevens' finding that /t/ aspiration contains frication noise from supraglottal constriction is explained by McGowan & Howe's aeroacoustic coupling theory

### Conceptual Links (not citation-based — added during reconciliation)
- [[Karthikeyan_2023_ArticulatoryStatusAttractiveness]] — Karthikeyan shows that fully released/aspirated word-final /t/ increases perceived prestige and long-term attractiveness; Hanson & Stevens' acoustic models of aspiration (supraglottal frication + glottal noise) describe exactly the acoustic properties that distinguish Karthikeyan's two speaker groups
- [[Abramson_Whalen_2017_VOTat50]] — Abramson & Whalen's VOT measurement framework defines the aspiration interval that Hanson & Stevens model acoustically; the Praat labeling scheme (REL + ASP) maps directly onto the noise generation mechanisms described here (Strong)
