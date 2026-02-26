# Abstract

## Original Text (Verbatim)

Over the years there has been widespread controversy over the relative merits of the cascade and parallel connections of formant generators in a speech synthesizer. This report shows that the theoretically less attractive parallel connection is able to produce closer approximations to the properties of real speech signals than is generally possible for a cascade synthesizer, both for vowels and for consonants. However, to achieve this result it is necessary to take care over the phase characteristics of the formant generators, and to appropriately shape the skirts of the formant response curves. Although extra amplitude information is needed for a parallel synthesizer, the form of the acoustic specification is in consequence directly related to properties of human speech that can be easily measured from a spectrum display.

---

## Our Interpretation

This paper tackles the long-standing debate in speech synthesis: should formant resonators be connected in series (cascade) or in parallel? While cascade connections have the theoretical advantage that vowel formant amplitudes emerge automatically from the formant frequencies, Holmes demonstrates that in practice the parallel connection produces more natural-sounding speech—if you design the filters carefully. The catch is that parallel synthesis requires explicit amplitude controls for each formant, but this turns out to be an advantage: you can directly specify what the speech spectrum should look like based on measurements, rather than relying on the cascade model to get it right (which it often doesn't, especially above 3 kHz or when vocal effort changes). For Qlatt's formant synthesizer, this paper provides the theoretical foundation for understanding why we need both cascade and parallel branches, and how the parallel path should be designed with proper spectral shaping filters.
