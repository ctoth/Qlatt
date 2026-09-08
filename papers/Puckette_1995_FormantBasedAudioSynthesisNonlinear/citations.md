# Citations

## Reference List

[1] Dodge, C. and Jerse, T., 1985. *Computer Music*, Shirmer (New York), pp. 78-79.

[2] *ibid.*, pp. 155-194.

[3] Rabiner, L., *et al.*, 1974. "Some comparisons between FIR and IIR digital filters," *Bell System Technical Journal* 53, pp. 305-331.

[4] Chowning, J., 1973. "The synthesis of complex audio spectra by means of frequency modulation," *Journal of the Audio Engineering Society* 21/7, pp. 526-534.

[5] LeBrun, M., 1979. "Digital waveshaping synthesis," *Journal of the Audio Engineering Society* 27/4, pp. 250-266.

[6] Templaars, S., 1977. "The VOSIM signal spectrum," *Interface* 6, pp. 81-96.

[7] Rodet, X., Potard, Y., and Barriere, J.-B., 1984. "The CHANT project: from the synthesis of the singing voice to synthesis in general." *Computer Music Journal* 8/3, pp. 15-31.

[8] Moorer, J. A., 1976. "The synthesis of complex audio spectra by means of discrete summation formulae," *Journal of the Audio Engineering Society* 24/8, pp. 717-727.

[9] Puckette, M., 1990. "EXPLODE: a user interface for sequencing and score following," *Proceedings*, International Computer Music Conference, pp. 259-261.

[10] Lindemann, E. et al. 1991. "The Architecture of the IRCAM Music Workstation." *Computer Music Journal* 15(3), pp. 41-49.

[11] Holland, B., 1993. "Boulez musters his high-tech Parisian forces," *New York Times* Monday, Nov. 15, p. B3.

## Key Citations for Follow-up

- **[7] Rodet, Potard & Barriere 1984 (CHANT / FOF).** The closest competitor and the most directly voice-oriented. PAF is explicitly positioned against FOF's unbounded, parameter-dependent computational cost and unpredictable phase. Essential for any formant-grain comparison in a speech synthesizer.
- **[8] Moorer 1976 (discrete summation formulae).** The mathematical ancestor: the closed-form summation of a geometric series of partials that PAF's modulator follows (Eq. 12 is derived "following the example of [8]"). Read this to understand the family of closed-form band-limited pulse generators.
- **[6] Templaars 1977 (VOSIM).** The other direct-specification formant technique criticized here; useful for the historical spread of time-domain formant methods.
- **[5] LeBrun 1979 (digital waveshaping).** Source of the naive $p_1 s_1(x_1\cos)$ formulation that Puckette shows is numerically unusable, and the general waveshaping framework that Eq. 44's unexplored generalization lives in.
- **[3] Rabiner et al. 1974 (FIR vs IIR).** The cited basis for the claim that recursive filters have poor numerical accuracy, which is one of the three charges against subtractive (filter-bank) formant synthesis.
