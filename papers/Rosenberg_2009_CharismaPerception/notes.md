# Rosenberg & Hirschberg (2009) - Charisma Perception from Text and Speech

**Citation:** Rosenberg A, Hirschberg J (2009) Charisma perception from text and speech. Speech Communication 51, 640-655. doi:10.1016/j.specom.2008.11.001

## Experimental Design
- Stimuli: 2004 Democratic primary candidate speeches (Edwards, Sharpton, Dean, Lieberman, Kucinich, Gephardt, Kerry, Clark, Moseley Braun)
- 8 subjects rated 45 speech tokens on 26 personality statements (5-point Likert)
- Separate text experiment with transcripts rated by new subjects
- Inter-rater agreement (kappa) for charisma: 0.224 (speech), 0.132 (text)

## Functional Definition of Charisma

Traits most consistently correlated with "The speaker is charismatic":
- **Positive:** enthusiastic, charming, persuasive, convincing, passionate
- **Negative:** boring (strongly negative correlation)
- NOT correlated: desperate, threatening, accusatory, angry

## Acoustic-Prosodic Correlates of Charisma (Speech Tokens, Male Speakers)

### Pitch (F0)
| Feature | r | p |
|---|---|---|
| **Mean F0** | **0.252** | **1.69e-6** |
| SD of F0 | 0.129 | 8.65e-3 |
| Max F0 | 0.183 | 5.36e-4 |
| Min F0 | 0.126 | 0.0177 |

All positive: higher, more variable pitch = more charismatic.

**Normalized (z-scored across male + female speakers):**
- Mean F0 z-score: r=0.104, p=0.0504
- SD of F0 z-score: r=0.127, p=3.57e-3

### Intensity
- Mean intensity: r=0.0718, p=0.0549 (approaching significance, positive)
- Louder = more charismatic

### Speaking Rate
- Speaking rate (syl/s): r=0.094, p=0.0902 (approaching significance, positive)
- Faster = more charismatic

### Intonational Contours (ToBI)
| Feature | r | p | Direction |
|---|---|---|---|
| Proportion H* accents | 0.145 | 0.00658 | More H* = more charismatic |
| Proportion L*+H accents | -0.111 | 0.0363 | More L*+H = less charismatic |
| Proportion L* accents | -0.223 | 2.28e-5 | More L* = less charismatic |
| Rising phrase boundaries | -0.172 | 0.00119 | More rising = less charismatic |
| Downstepped contours | -0.109 | 0.0419 | More downstep = less charismatic |

### Phrasal-Level Features
- Mean normalized max intensity (IP): r=0.128, p=0.0166
- SD of normalized max intensity (IP): r=0.111, p=0.0361
- Words per intonational phrase: r=0.111, p=0.0358
- SD of normalized max pitch (ip): r=0.0781, p=0.144 (trend)

## Lexico-Syntactic Correlates
| Feature | r | p | Direction |
|---|---|---|---|
| Number of words | 0.097 | 0.068 | Longer = more charismatic |
| Function/content word ratio | 0.102 | 0.0569 | More function words = more charismatic |
| Lexical complexity (syl/word) | 0.123 | 0.021 | More complex = more charismatic |
| First person pronouns | 0.116 | 0.0294 | More personal = more charismatic |
| Disfluency ratio | -0.124 | 0.0204 | More disfluent = less charismatic |

## Speech vs. Text Comparison
- Most charismatic from speech: Edwards, Sharpton, Dean
- Most charismatic from text: Kerry, Clark, Edwards
- Southern accent speakers (Edwards, Sharpton) rated significantly MORE charismatic in speech than text
- Both modalities share "functional definition": charm, enthusiasm, persuasiveness, convincingness
- Some features reverse between modalities (e.g., first person pronouns positive in speech, negative in text)

## Speaker Rankings by Mean Charisma Rating (Speech)
1. Rep. Edwards: 3.75
2. Rev. Sharpton: 3.40
3. Gov. Dean: 3.33
4. (average ~3.0)
5. Rep. Gephardt: 2.77
6. Rep. Kucinich: 2.73
7. Sen. Lieberman: 2.38

## Implementation Relevance
- **Charismatic voice profile:**
  - Higher in speaker's pitch range (higher mean F0)
  - Greater F0 variability (wider range, higher SD)
  - Faster speaking rate
  - Louder
  - Predominantly H* (new information) pitch accents
  - Fewer rising boundaries (declarative, assertive)
  - No downstepped contours (avoid didactic tone)
  - Low disfluency
- **Anti-charismatic markers:** L* accents, rising boundaries, downstepped phrases, slow rate, disfluencies
- Effect sizes are modest (r = 0.1-0.25) suggesting charisma is multi-dimensional
- r=0.252 for mean F0 is the strongest single acoustic predictor
