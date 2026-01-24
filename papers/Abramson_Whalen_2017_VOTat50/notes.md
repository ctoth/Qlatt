# Voice Onset Time (VOT) at 50: Theoretical and practical issues in measuring voicing distinctions

**Authors:** Arthur S. Abramson, D.H. Whalen
**Year:** 2017
**Venue:** Journal of Phonetics, Vol. 63, pp. 75-86
**DOI:** 10.1016/j.wocn.2017.05.002

## One-Sentence Summary
A comprehensive retrospective on VOT measurement after 50 years, clarifying the original definition, proposing extensions for medial/final positions and fricatives/affricates, discussing limitations (Hindi voiced aspirates, Korean, preaspirates), and providing standardized Praat labeling recommendations.

## Problem Addressed
After 50 years of widespread use, VOT measurement practices have diverged. This paper clarifies the original definition, addresses edge cases, proposes extensions, and provides practical labeling standards for consistent cross-study analysis.

## Key Contributions
1. Clarified original VOT definition with modern measurement context
2. Extended VOT to intervocalic (MVOT) and final positions (VOFT)
3. Extended VOT to fricatives and affricates
4. Identified languages/categories where VOT alone is insufficient
5. Proposed standardized Praat labeling scheme with automated tools

## Original VOT Definition (1964)

**VOT** = temporal relation between stop release and onset of glottal pulsing

- **Release = 0 ms** (reference point)
- **Voicing lead** (prevoicing): Pulsing starts during closure → negative values
- **Voicing lag**: Pulsing starts after release → positive values

### Three Main Categories (Fig. 1 - Thai examples)
| Category | VOT | Example |
|----------|-----|---------|
| Fully voiced | -85 ms (lead) | /di/ |
| Voiceless unaspirated | +15 ms (short lag) | /ti/ |
| Voiceless aspirated | +110 ms (long lag) | /tʰi/ |

## Parameters

### VOT Zones by Language Type
| Zone | VOT Range | Description | Example Languages |
|------|-----------|-------------|-------------------|
| Lead | < 0 ms | Prevoicing during closure | French /b d g/, Spanish |
| Short lag | 0-25 ms | Near-simultaneous release/voicing | Spanish /p t k/, French /p t k/ |
| Long lag | > 25 ms | Aspiration before voicing | English /p t k/, Thai /pʰ tʰ kʰ/ |

### Place of Articulation Effect
VOT increases as articulation moves posteriorly:
- Labial < Alveolar < Velar
- Due to: cavity size, contact area, laryngeal aerodynamics

### Typical English VOT Values (from Fig. 7)
| Stop | Position | VOT |
|------|----------|-----|
| [b] | Intervocalic | -158 ms |
| [p] | Intervocalic | +13 ms |
| [pʰ] | Intervocalic | +62 ms |

## Measurement Labels (Praat TextGrid)

### Recommended Interval Labels
```
(V1) VDCLO VLCLO REL ASP (V2)
```

| Label | Description | Boundary Criteria |
|-------|-------------|-------------------|
| V1 | Preceding vowel | Not part of VOT but contextually useful |
| VDCLO | Voiced closure | Closure onset (if voiced) to voicing offset or release |
| VLCLO | Voiceless closure | Start at closure (no VDCLO) or end of VDCLO, end at release |
| REL | Release burst | Burst onset to aspiration onset (or end of burst noise) |
| ASP | Aspiration | End of REL to onset of voiced vocalic segment |
| V2 | Following vowel | Not part of VOT but contextually useful |

### Prevoicing Criterion
- Stop is **prevoiced** (negative VOT) if voiced closure ≥ 50% of total closure duration
- Otherwise positive VOT (configurable via `pct_voicing` variable)

### Tools Available
- `prepopulate.praat` - Creates annotation tier with VOT labels
- `get_vot.praat` - Computes VOT values from labels
- Available at: github.com/HaskinsLabs/get_vot

## Extensions to Original Definition

### Intervocalic Stops (MVOT)
- Negative VOT = closure duration if ≥50% voiced
- Otherwise positive VOT
- "Unbroken voicing" = continuous voicing from preceding vowel through closure

### Final Position (VOFT - Voice Offset Time)
- VOT less useful due to frequent unreleased stops
- Other cues (preceding vowel duration) may distinguish voicing

### Fricatives
- VOT = duration from noise offset to voicing onset in following vowel
- If voicing during frication → negative VOT
- Aspirated fricatives (e.g., Sgaw Karen /sʰ/) have long positive VOT

### Affricates
- Frication treated as part of closure
- End of frication = release point
- Positive VOT includes aspiration on following formants

## Limitations of VOT

### Hindi Voiced Aspirates (4-way system: b bʰ p pʰ)
- VOT distinguishes: voiceless unaspirated vs aspirated, voiced vs voiceless
- VOT does NOT distinguish: /b/ vs /bʰ/
- **Additional cue needed**: Phonation type (murmur/breathy voice)

### Korean (3-way voiceless system)
- All three categories voiceless in initial position
- VOT overlap between categories I and II
- **Additional cues**: F0, H1-H2, burst energy, possibly emerging tone

### Preaspirated Stops (Icelandic, Swedish, Scots Gaelic)
- Aspiration precedes closure
- Requires different metric: duration of devoicing
- Often fricative-like, not true aspiration

### Ejectives and Implosives
- Ejectives: positive VOT, but not distinguished from aspirated by VOT alone
- Implosives: prevoiced, not distinguished from voiced stops by VOT alone

## Ancillary Cues to Voicing

| Cue | Effect | Reference |
|-----|--------|-----------|
| F0 at release | Higher for voiceless | Hombert et al. 1979 |
| Aspiration amplitude | More → more voiceless percept | Repp 1979 |
| Preceding vowel duration | Longer before voiced finals | Raphael 1972 |
| Prosodic boundary strength | Affects VOT gradience | Cho & Keating 2001 |

## Automatic VOT Measurement

- AutoVOT (Keshet et al. 2014): ~80% agreement within 5 ms, ~90% within 10 ms
- github.com/mlml/autovot/
- Manual checking still recommended

## Measurement Reliability Notes

### Temporal Resolution
| Method | Resolution | Notes |
|--------|------------|-------|
| Waveform | ~1 ms realistic | Sample-level possible but signal noise limits |
| Spectrogram | ~5-15 ms | 5 ms window, ±1 frame error |
| Perceptual | ~5 ms | Differences below this suspect |

### Voicing-Aspiration Overlap
- Glottal pulses can begin while aspiration continues
- Assign consistently to VOT or vocalic segment
- Document decision explicitly

## Figures of Interest
- **Fig. 1 (p. 2)**: Three VOT categories in Thai (original 1964)
- **Fig. 2 (p. 3)**: Prevoiced [ga] with burst highlighted
- **Fig. 3 (p. 6)**: "books" vs "two books" - initial vs medial [b]
- **Fig. 4 (p. 6)**: "tugging" vs "tucking" - voiced vs voiceless closure
- **Fig. 5 (p. 7)**: Aspirated [sʰ] in Sgaw Karen
- **Fig. 6 (p. 8)**: Voicing-aspiration overlap in [kʰɑ]
- **Fig. 7 (p. 10)**: Complete labeling examples for [b], [p], [pʰ]

## Relevance to Qlatt Project
- **Direct application**: VOT values for stop consonant synthesis
- **Aspiration timing**: REL + ASP durations guide aspiration synthesis
- **Place effects**: Velar > Alveolar > Labial VOT for aspiration timing
- **Voiced stops**: Prevoicing = voice bar during closure (already implemented)
- **Labeling scheme**: Could adopt for diagnostic output

## Open Questions
- [ ] What are typical VOT distributions for American English by place?
- [ ] How does speaking rate affect VOT?
- [ ] Optimal aspiration noise amplitude relative to VOT duration?

## Related Work Worth Reading
- Lisker & Abramson (1964) - Original VOT paper (Word, 20, 384-422) **STILL NEEDED**
- Cho & Ladefoged (1999) - VOT variation across 18 languages
- Klatt (1975) - VOT, frication, aspiration in clusters
- Keating (1984) - Phonetic/phonological representation of voicing
