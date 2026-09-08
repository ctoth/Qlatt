# Abstract

## Original Text (Verbatim)

Like some existing vocal-tract models, this synthesizer views the vocal apparatus as a sequence of straight tubes. The walls of all these tubes, however, are modelled as coupled mass-spring systems, which in most models is privileged to the vocal cords. This, together with the ability to continuously vary the lengths of the tubes, leads to a principled treatment of the problems of source-filter interaction, which makes our model especially suitable for the generation of speech signals that include consonants.

The model is restricted to the last step in articulatory synthesis: from a list of time-target pairs for every articulator and a table with speaker characteristics, find the resulting acoustic signal. Among the examples that we show are various brands of voicing contrasts and their articulatory correlates.

---

## Our Interpretation

Existing vocal-tract models privilege the vocal cords as the only mass-spring element and treat the lungs as an ideal pressure source, which makes source-filter interaction ad hoc and consonants hard to generate from articulation. Boersma generalizes the mass-spring treatment to every tube wall in the apparatus, adds time-varying tube lengths, a smooth zipper collision model, and a turbulence noise source at any constriction, then publishes the full equation set and speaker parameter tables. The payoff is that voicing contrasts fall out of the aerodynamics: with no laryngeal gesture at all, voicing stops one period after lip closure and the glottis passively widens beyond its phonatory maximum, while aspiration, ejectives, implosives and lenis voicing each correspond to a specific articulatory recipe the paper gives in numbers.
