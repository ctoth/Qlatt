# Acoustic Correlates of Emotional Dimensions in Laughter: Arousal, Dominance, and Valence

**Authors:** Diana P. Szameitat, Chris J. Darwin, Dirk Wildgruber, Kai Alter, André J. Szameitat
**Year:** 2011
**Venue:** Cognition and Emotion, 25(4), 599–611
**DOI:** 10.1080/02699931.2010.508624

## One-Sentence Summary
Establishes quantitative acoustic correlates of four emotional dimensions (arousal, dominance, sender's valence, receiver-directed valence) in laughter using 43 acoustic parameters extracted from 123 acted laughter sequences.

## Problem Addressed
While emotional dimensions in speech have been studied extensively, the acoustic correlates of emotional dimensions specifically in laughter were unknown. This paper tests whether laughter encodes the same emotional dimensions as speech through comparable acoustic cues.

## Key Contributions
- Comprehensive analysis of 43 acoustic parameters across four emotional dimensions in laughter
- Demonstrates that arousal and dominance in laughter share acoustic correlates with speech
- Shows sender's valence and receiver-directed valence have weaker/more ambiguous acoustic coding
- Regression models predict all four dimensions from 13 acoustic parameters (r = .75–.91)

## Methodology
- 8 professional actors (3 male) portrayed laughter for 4 emotions: joy, taunt, *schadenfreude*, tickling
- Auto-induction method (actors put themselves in appropriate emotional state)
- 123 laughter sequences selected (correctly classified above chance, p=.05)
- 24 participants rated each sequence on 4 emotional dimensions (4-point scale: ++, +, −, −−)
- Emotional dimension scale: −100 (calm/submissive/unpleasant) to +100 (excited/dominant/pleasant)
- Cronbach's alpha: arousal .97, dominance .95, receiver-directed valence .89, sender's valence .89
- 43 acoustic parameters extracted via Praat 4.02.04
- Bonferroni-corrected correlations (p < .00029 per individual correlation)
- Linear regression with 13 selected parameters per dimension

## Parameters

### Table 1: Complete Parameter Set (43 parameters)

| Category | Parameter | Abbrev | Unit | Description |
|----------|-----------|--------|------|-------------|
| **Sequence level** | | | | |
| | Number of vocalic segments | N_Sg | # | Number of segments |
| | Number of bouts | N_Bt | # | Bouts separated by inspiration |
| | Segments per bout | N_Sg_Bt | # | Average segments in bout |
| | Total duration | TotDur | ms | Onset to end of sequence |
| | Bout duration | BtDur | ms | Average duration of bouts |
| | Inter-bout duration | IntBtDur | ms | Average duration between bouts |
| | Laugh rate | LgRate | 1/s | Segments per second |
| **Segment level** | | | | |
| | Segment duration | SgDur | ms | Average segment duration |
| | Inter-segment duration | IntSgDur | ms | End of segment to start of next within bout |
| | Event duration | EvntDur | ms | SgDur + IntSgDur |
| **Amplitude** | | | | |
| | Amplitude ratio | AmpMN_Max | — | Mean intensity / maximal intensity |
| | Amplitude bandwidth | AmpBW | dB | Max intensity − min intensity |
| | Amplitude SD ratio | AmpSD_MN | — | Intensity SD / mean intensity |
| | Time of max amplitude | tiAmpMax | ms | Relative position of max from voice onset |
| **F0** | | | | |
| | Mean F0 | F0MN | Hz | Average F0 across time segments |
| | Minimal F0 | F0Min | Hz | Minimum F0 |
| | Maximal F0 | F0Max | Hz | Maximum F0 |
| | F0 bandwidth | F0BW | Hz | F0Max − F0Min |
| | F0 start | F0Start | Hz | F0 at segment 1 |
| | F0 end | F0End | Hz | F0 at segment N |
| | F0 change | F0Chg | Hz | F0End − F0Start |
| | Time of max F0 | tiF0Max | ms | Relative position of max F0 from voice onset |
| **Formants** | | | | |
| | F1–F5 | F1–F5 | Hz | First through fifth formant |
| | F1 bandwidth | BwF1 | Hz | Bandwidth of first formant |
| **Peak frequency** | | | | |
| | Mean PF | PFMN | Hz | Average peak frequency across segments |
| | Maximal PF | PFMax | Hz | Maximum peak frequency |
| | Ratio mean PF/mean F0 | PFMN_F0MN | — | Mean PF to mean F0 |
| | Ratio max PF/mean F0 | PFMax_F0MN | — | Max PF to mean F0 |
| | Time of max PF | tiPFMax | ms | Relative position of max PF |
| **Voice parameters** | | | | |
| | Ratio of voiced elements | %voice | % | Percent of time with harmonic structure |
| | Mean HNR | HNRMN | — | Average harmonic-to-noise ratio |
| | HNR SD | HNRSD | — | Standard deviation of HNR |
| | Maximal HNR | HNRMax | — | Peak HNR |
| | Time of max HNR | tiHNRMax | ms | Relative position of max HNR |
| | Jitter | Jitt | % | Micro-irregularities in F0 |
| | Shimmer | Shim | % | Micro-irregularities in amplitude of F0 |
| | Centre of gravity | CoG | Hz | Frequency dividing energy into halves |
| | Skewness | Skew | — | Third central moment / (second)^1.5 |
| | Kurtosis | Kurt | — | Fourth central moment / (second)^2 |

### Table 2: Significant Correlations (% shared variance, Bonferroni-corrected p < .05)

| Parameter | Arousal | Dominance | Sender's Val. | Receiver Val. |
|-----------|---------|-----------|---------------|---------------|
| IntBtDur | −41 | −15 | −30 | |
| LgRate | 12 | | | 30 |
| SgDur | | 18 | | −16 |
| EvntDur | | 10 | | |
| AmpMN_Max | | −25 | | 18 |
| AmpBW | | 28 | | −26 |
| AmpSD_MN | | 29 | | −26 |
| tiAmpMax | | 24 | | −14 |
| F0MN | 41 | | | |
| F0Min | 42 | | | |
| F0Max | 39 | | | |
| F0BW | 21 | −10 | | 11 |
| F0Start | 38 | | | |
| F0End | 44 | | | |
| tiF0Max | 12 | 10 | | |
| F1 | 32 | 43 | | −36 |
| F3 | 12 | | | |
| F5 | 17 | | | |
| PFMN | 39 | 36 | | −24 |
| PFMax | 23 | 33 | | −26 |
| PFMN_F0MN | | 38 | | −27 |
| PFMax_F0MN | | 37 | | −28 |
| tiPFMax | | 29 | | −16 |
| %voice | | | −22 | 14 |
| HNRMN | 24 | | | |
| HNRSD | 16 | 15 | | −10 |
| Jitt | −37 | −19 | | |
| Shim | −33 | | | |
| CoG | | −18 | | 12 |
| Skew | 23 | 29 | | −25 |
| Kurt | | −19 | | 17 |
| N_Sg | | | 13 | |
| N_Sg_Bt | | | 10 | |

### Table 3: Synopsis of Acoustic Correlates (Direction of Change)

| Parameter domain | Arousal | Dominance | Sender's Val. | Receiver Val. |
|------------------|---------|-----------|---------------|---------------|
| **Temporal** | | | | |
| Number of segments | | | ↑ | |
| Segment duration | | ↑ | | ↓ |
| Event duration | | ↑ | | |
| Laugh rate | ↑ | | ↑ | |
| Inter-bout duration | ↓ | ↓ | ↓ | |
| **Intensity** | | | | |
| Intensity parameters | | ↑ | | ↓ |
| **Frequency** | | | | |
| F0 parameters | ↑ | | | |
| F0 bandwidth | | ↓ | ↑ | |
| Peak freq parameters | ↑ | ↑ | | ↓ |
| PF/F0 | | ↑ | | ↓ |
| F1 | ↑ | ↑ | | ↓ |
| F3, F5 | ↑ | | | |
| **Voice parameters** | | | | |
| % voiced elements | | | ↓ | ↑ |
| HNRMN | ↑ | | | |
| HNRSD | ↑ | ↑ | | ↓ |
| Jitter | ↓ | ↓ | | |
| Shimmer | ↓ | | | |
| Centre of gravity | | ↓ | | ↑ |
| Skewness | ↑ | ↑ | | ↓ |
| Kurtosis | | ↓ | | ↑ |

### Regression Results

| Dimension | r | df | p |
|-----------|---|-----|---|
| Arousal | .90 | 13 | < .001 |
| Dominance | .90 | 13 | < .001 |
| Sender's valence | .75 | 13 | < .001 |
| Receiver-directed valence | .82 | 13 | < .001 |

## Implementation Details

### Acoustic Measurement Protocol (Praat-based)
- Laughter segmented into vocalic segments (burst of energy with single vocal peak)
- Segments grouped into bouts (separated by inhaled breaths)
- Segment boundaries determined visually from amplitude-time spectrum
- First segment excluded (often pure aspiration)
- Segments 2–7 analyzed per bout (8+ excluded due to rarity)
- Parameters averaged across segments within bout, then across bouts per sequence
- Speaker weighting applied to compensate for unequal stimulus counts

### Key Acoustic Dimension Profiles

**High Arousal Laughter:**
- Fast rate (higher LgRate), short pauses between bouts (lower IntBtDur)
- High F0 (all F0 parameters elevated)
- Higher F1, F3, F5 (higher formants = more open vocal tract)
- More high-frequency energy (higher peak frequency)
- Precisely articulated (lower jitter, lower shimmer)
- Higher mean HNR (cleaner harmonics)
- Higher skewness (energy concentrated in low frequencies)

**Dominant Laughter:**
- Longer segments and events (higher SgDur, EvntDur)
- Higher intensity variability (higher AmpBW, AmpSD_MN)
- Higher F1 and peak frequency
- More high-frequency energy (higher PF, PF/F0 ratios)
- More precisely articulated (lower jitter)
- Higher skewness, lower kurtosis
- Lower centre of gravity (energy shifted down despite high PF — indicates energy concentrated in low harmonics with high-frequency peak)

**Positive Sender's Valence Laughter:**
- More segments, higher laugh rate
- Shorter pauses between bouts
- Lower percent of voiced elements

**Positive Receiver-Directed Valence Laughter:**
- More harmonic energy (higher % voiced elements)
- Shorter segments
- Lower intensity variability
- Higher F0 bandwidth
- Lower F1 and peak frequency
- Higher centre of gravity, higher kurtosis, lower skewness

## Figures of Interest
- **Table 1 (pages 5–6):** Complete list of 43 acoustic parameters with definitions
- **Table 2 (page 8):** Percentage of shared variance between each parameter and each emotional dimension
- **Table 3 (page 9):** Synopsis of acoustic correlates showing directional effects

## Results Summary
- All four emotional dimensions correlated with multiple acoustic parameters (r = .22–.66, df = 105–122)
- Arousal most robustly encoded: F0 parameters (41–44% shared variance), inter-bout duration (41%), jitter/shimmer (33–37%)
- Dominance second most robust: F1 (43%), peak frequency (33–38%), intensity variability (28–29%)
- Sender's valence weakest encoding: only inter-bout duration (30%), % voiced (22%), N_Sg (13%)
- Receiver-directed valence moderate: F1 (36%), laugh rate (30%), peak frequency (24–28%), intensity (26%)
- Common mechanism hypothesis supported: arousal and dominance correlates in laughter parallel findings from speech

## Limitations
- Acted (portrayed) laughter, not spontaneous — though authors cite evidence that portrayed and spontaneous laughter are acoustically similar (Szameitat et al., 2009b)
- Only relative intensity measured (varying microphone distances) — cannot assess absolute intensity changes
- Male speakers only (3 male, 8 total actors; only male speakers apparently)
- Four emotions tested — limited emotional range
- Cannot determine whether sender's valence reflects sender's state or listener's attribution
- Inter-bout duration strongly confounded with arousal (41% shared variance)

## Testable Properties
- Arousal should correlate positively with F0 (r ≥ .60, largest shared variance 44%)
- Arousal should correlate negatively with jitter (r magnitude ≥ .37)
- Dominance should correlate positively with F1 (43% shared variance)
- Receiver-directed valence should correlate positively with % voiced elements
- All four dimensions should be predictable from 13 acoustic parameters with r ≥ .75
- F0 parameters should NOT significantly correlate with dominance (divergent finding from some speech studies)

## Relevance to Project
This paper provides quantitative acoustic profiles for emotional dimensions in non-verbal vocalizations (laughter), complementing the speech-based emotional profiles from Banse & Scherer (1996), Larrouy-Maestri (2024), and Belyk (2014) already in our collection. The key insight for Qlatt is that arousal and dominance share acoustic correlates between speech and laughter, supporting a unified emotion-acoustic mapping. If Qlatt ever extends to non-verbal vocalization synthesis, these profiles provide the parametric targets. For speech synthesis specifically, the arousal correlates (F0 ↑, jitter ↓, shimmer ↓, HNR ↑, F1 ↑, high-frequency energy ↑) reinforce findings from the speech emotion literature and can be used to validate our emotion preset mappings.

## Open Questions
- [ ] Does the arousal-F0 relationship hold for spontaneous laughter?
- [ ] Are the dominance correlates (F1, PF, intensity variability) generalizable across cultures?
- [ ] Can receiver-directed valence be reliably detected from acoustics alone in natural settings?

## Related Work Worth Reading
- Szameitat et al. (2009a) — Differentiation of emotions in laughter at the behavioral level (precursor study)
- Szameitat et al. (2009b) — Acoustic profiles of distinct emotional expressions in laughter (companion study)
- Nwokah et al. (1993) — Vocal affect in three-year-olds: acoustic analysis of child laughter
- Bachorowski & Owren (2001) — Voiced vs. unvoiced laughter and affect
- Schroeder (2003) — Experimental study of affect bursts

## Collection Cross-References

### Already in Collection
- [[Banse_1996_VocalEmotionAcousticProfiles]] — cited for acoustic profiles of 14 emotions in speech; this paper extends the dimensional approach to laughter
- [[Belyk_2014_AcousticValenceEmotion]] — cited indirectly; provides complementary valence-coding framework (Pitch × Loudness expression rules) that could integrate with laughter findings
- **Larrouy-Maestri_2024_EmotionalProsody** — comprehensive review of emotional prosody parameters in speech; laughter findings here converge with speech arousal correlates

### New Leads (Not Yet in Collection)
- Laukka & Juslin (2005) — "A dimensional approach to vocal expression of emotion" (frequently cited for speech emotion correlates)
- Scherer & Oshinsky (1977) — "Cue utilization in emotion attribution from auditory stimuli" (foundational)
- Schroeder et al. (2001) — "Acoustic correlates of emotion dimensions in view of speech synthesis"
- Williams & Stevens (1972) — "Emotions and speech: Some acoustical correlates" (JASA, foundational)
