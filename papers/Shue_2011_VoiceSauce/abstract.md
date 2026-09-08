# Abstract

## Original Text (Verbatim)

VoiceSauce is a new application, implemented in Matlab, which provides automated voice measurements over audio recordings. VoiceSauce computes many voice measures, including those using corrections for formant frequencies and bandwidths. It outputs values as text or for Emu database, and incorporates output from a separate program for automatic analysis of electroglottographic signals. VoiceSauce is available online for free download.

**Keywords:** voice, phonation, acoustic analysis, software

---

## Our Interpretation

Voice-quality measures such as H1-H2 were traditionally read by hand off FFT spectra or computed by ad-hoc Praat scripts, neither of which is pitch-synchronous or corrected for the influence of formants on harmonic amplitudes. VoiceSauce automates the whole standard battery over running speech on a 1 ms frame grid, estimating harmonic magnitudes pitch-synchronously by maximum search around F0-predicted locations and correcting every harmonic amplitude per frame using tracked formant frequencies with formula-estimated bandwidths. For a formant synthesizer project this is the reference specification for the analysis side: the measure list defines what to compute when validating synthesized voice quality, and the window conventions define how to compute it so results are comparable with the published phonetics literature.
