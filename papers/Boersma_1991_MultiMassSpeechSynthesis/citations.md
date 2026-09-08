# Citations

## Reference List

Flanagan, J.L. & L.L. Landgraf (1968): "Self-oscillating source for vocal-tract synthesizers", *IEEE Transactions on Audio and Electroacoustics* **AU-16**: 57-64. Reprinted in J.L. Flanagan & L.R. Rabiner (eds.) (1973): *Speech Synthesis*, Dowden, Hutchinson & Ross, Stroudsburg.

Flanagan, J.L. & K. Ishizaka (1977): "Acoustic characterization and computer simulation of the air volume displaced by the vibrating vocal cords: lateral and longitudinal motion", in: R. Carre, R. Descout & M. Wajskop (eds.): *Articulatory Modeling and Phonetics*, Proceedings of a Symposium held at Grenoble, G.A.L.F. Groupe de la Communication Parlée.

Ishizaka, K. & J.L. Flanagan (1972): "Synthesis of voiced sounds from a two-mass model of the vocal cords", *Bell System Technical Journal* **51**: 1233-1268. Reprinted in J.L. Flanagan & L.R. Rabiner (eds.) (1973): *Speech Synthesis*, Dowden, Hutchinson & Ross, Stroudsburg.

Landau, L.D. & E.M. Lifshitz (1953): *Gidrodinamika*. French translation: *Mécanique des fluides*, Editions Mir, Moscow 1971.

Mermelstein, P. (1973): "Articulatory model for the study of speech production", *Journal of the Acoustical Society of America* **53**: 1070-1082.

Mitchell, A.R. (1969): *Computational Methods in Partial Differential Equations*, John Wiley, London.

Press, W.H., B.P. Flannery, S.A. Teukolsky & W.T. Vetterling (1989): *Numerical Recipes in Pascal*, Cambridge University Press.

Sondhi, M.M. & J.R. Resnick (1983): "The inverse problem for the vocal tract: Numerical methods, acoustical experiments, and speech synthesis", *Journal of the Acoustical Society of America* **73** (3): 985-1002.

### Cited in text but absent from the reference list

Van den Berg, J. et al. (1957). Cited on p.88 as the source of the critical velocity of 10 m/s (critical volume velocity 200 cm³/s through an area of 1.07 x 20 mm) and of the measured turbulence loss of 0.875 relative to the Bernoulli pressure. No full entry appears in the printed reference list.

## Key Citations for Follow-up

1. **Ishizaka & Flanagan (1972)** — the direct predecessor and the explicit target of Boersma's eleven-point comparison in chapter 7. Understanding what Boersma changed requires this paper: where pressures versus flows are computed, the vena contracta treatment, the fixed damping factors of 0.1 and 0.6, and the turbulence resistance placed above the glottis regardless of flow direction.

2. **Sondhi & Resnick (1983)** — supplies the lip radiation boundary condition used verbatim as equation (20), and the integration-along-characteristics technique that motivates Boersma's space-averaging scheme in the appendix. Needed to implement the radiation load correctly.

3. **Flanagan & Landgraf (1968)** — origin of the dimensionless relative tension parameter k_rel that drives both mass and stiffness in equation (26), and of the self-oscillating source concept that Boersma generalizes to every tube wall.

4. **Mermelstein (1973)** — Boersma names this as the better treatment of the articulator-position to area-function mapping, the one component his own model deliberately does not do well. Essential for anyone wanting place features rather than manner features.

5. **Van den Berg et al. (1957)** — the empirical anchor for the turbulence model. The critical velocity of 10 m/s and the measured 0.875 loss ratio are the only external validation Boersma offers for equation (21), and the reference is incomplete in the printed paper, so it needs tracking down independently.
