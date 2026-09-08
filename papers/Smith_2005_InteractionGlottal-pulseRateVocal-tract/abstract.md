# Abstract

## Original Text (Verbatim)

Glottal-pulse rate (GPR) and vocal-tract length (VTL) are related to the size, sex, and age of the speaker but it is not clear how the two factors combine to influence our perception of speaker size, sex, and age. This paper describes experiments designed to measure the effect of the interaction of GPR and VTL upon judgements of speaker size, sex, and age. Vowels were scaled to represent people with a wide range of GPRs and VTLs, including many well beyond the normal range of the population, and listeners were asked to judge the size and sex/age of the speaker. The judgements of speaker size show that VTL has a strong influence upon perceived speaker size. The results for the sex and age categorization (man, woman, boy, or girl) show that, for vowels with GPR and VTL values in the normal range, judgements of speaker sex and age are influenced about equally by GPR and VTL. For vowels with abnormal combinations of low GPRs and short VTLs, the VTL information appears to decide the sex/age judgement.

*(p.1)*

---

## Our Interpretation

The problem is that in natural speech pitch and formant scale are confounded, so no recording-based study can say how the two combine to signal who is speaking. The authors break the confound with STRAIGHT resynthesis, sampling a 7x7 logarithmic grid of glottal-pulse rate against vocal-tract length twice, once over the normal population range and once far outside it, and collecting both a seven-point height rating and a four-way man/woman/boy/girl categorization on every trial from eight listeners.

The key finding is asymmetric. Vocal-tract length dominates perceived height, with every fitted log-VTL slope steeper than every log-GPR slope, and the two cues interact: pitch stops affecting perceived size entirely once the tract is short enough. For category judgements the two cues carry roughly equal weight inside the normal range, but outside it vocal-tract length wins, and the low-pitch plus short-tract corner is heard consistently as "boy" even though no real boy produces that combination.

For a source-filter speech synthesizer this is directly usable calibration. It supplies the formant-scaling law and its 15.5 cm adult-male anchor, target regions in pitch-by-tract-length space for man, woman, boy, and girl presets, a quality constraint that pitch must stay below the first formant during scaling, and perceptual step sizes of about 6 to 10 percent for tract length against 2 percent for pitch.
