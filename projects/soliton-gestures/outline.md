\# Coarticulation as Scattering: Soliton Dynamics in the Gestural Score



\## Working title alternatives

\- "The Missing PDE: Soliton Dynamics in the Gestural Score"

\- "Gestures as Dissipative Solitons in a Nonlinear Gestural Field"

\- "Why Speech is Segmentable: Soliton Persistence and the Coarticulation Problem"



---



\## 1. Introduction: the segmentability problem and the interdisciplinary gap



Speech is a continuous signal produced by a continuous dynamical system, yet listeners recover discrete units. The standard explanation presupposes discreteness in the underlying plan and treats continuity as corruption (coarticulation as smearing). This inverts the explanatory burden. The productive question: what class of dynamical systems produces stable, localized structures that survive interaction with neighboring structures and re-emerge with preserved identity?



The answer in mathematical physics is well-known: systems supporting solitons. Soliton-like behavior requires two ingredients, a medium with coupling that spreads localized structures and a nonlinearity that balances spreading, both of which are empirically present in articulatory dynamics. The standard framework for gestural dynamics (Saltzman \& Munhall 1989) uses coupled ordinary differential equations at discrete points. Extensions have introduced the specific nonlinearities (cubic restoring forces, double-well potentials) that generate solitons in field-theoretic contexts, but the step from ODE to PDE, treating the gestural score as a coupled system supporting localized structures, has not been taken.



This gap is partly disciplinary. Soliton physics and articulatory phonology occupy non-overlapping institutional spaces. The mathematical structures on each side are compatible and in some cases formally identical; the connection has not been drawn. The formant-synthesis tradition that dominates speech acoustics emerged from electrical engineering (transmission-line models, transfer functions, frequency-domain analysis), which oriented the field toward spectral snapshots rather than dynamical trajectories.



This paper proposes that articulatory gestures are dissipative-soliton-like structures in a driven nonlinear coupled system: localized, stable, and identity-preserving through coarticulatory collision. We derive a minimal PDE from existing empirically-grounded gesture dynamics, show that it falls within the Complex Ginzburg-Landau family (with classical soliton equations as limiting cases), and generate quantitative predictions testable against existing articulatory datasets.



\## 2. Current formalism and its limitations



\### 2.1 Task dynamics: gestures as damped harmonic oscillators

\- Saltzman \& Munhall (1989): critically damped linear oscillators with tract-variable control

\- Each gesture governs one tract variable (lip aperture, tongue tip constriction location, glottal aperture, etc.)

\- Gestural overlap handled by activation-weighted blending: $T\_{\\text{blend}} = \\sum\_i \\alpha\_i T\_i / \\sum\_i \\alpha\_i$



\### 2.2 The blending problem

\- Blending is formally analogous to inelastic collision: gesture identity is destroyed during overlap

\- The "blended" trajectory during overlap is an averaged intermediate, not a superposition of distinguishable entities

\- No mechanism for gestures to pass through each other and re-emerge intact

\- Coarticulation resistance (Recasens' DAC) is an empirical observation without dynamical explanation. Volenec (2015) provides the standard review: DAC values 1-3 assigned by tongue dorsum involvement, predicting coarticulation magnitude and direction, but the rankings are stipulated from articulatory anatomy, not derived from dynamics.

\- Fowler's coproduction theory (1977-2006): gestures are invariant, coarticulation is overlap of unmodified gestures, listeners parse the overlapping signal to recover individual contributions. Philosophically soliton-native but never formalized dynamically.



\### 2.3 The parsimony challenge: why not just PID control?



Standard task dynamics already captures trajectory shaping via stiffness ($k$) and damping ($b$). Coarticulation resistance (DAC) can be modeled by setting higher feedback gain for segments that resist coarticulation more. Why add a PDE?



The answer is the difference between a lookup table and a generating function. PID control \*stipulates\* DAC rankings: you assign high gain to /i/ and low gain to /a/ by hand. Why /i/ has higher DAC than /a/ is external to the model. The soliton/dissipative-soliton framework \*derives\* the ranking from the depth of the attractor basin, which depends on the nonlinearity and target geometry. These are measurable physical quantities, not free parameters. The PID model has $N$ free gain parameters for $N$ segment types; the field model has a small number of equation parameters that generate all $N$ rankings.



Furthermore, PID control makes no prediction about \*collision dynamics\*: what happens to two gestures during overlap is handled by the blending rule, which is stipulated separately. The field model derives collision dynamics from the same equation that determines single-gesture stability. The parsimony argument cuts the other way: one equation replaces two separate stipulations (stiffness ranking + blending rule).



Whether this additional explanatory power justifies the mathematical machinery is a legitimate question. The answer is empirical: if the field model's collision predictions (phase shifts, energy conservation, Yang-Baxter) are confirmed, it explains more with fewer free parameters. If they're not, PID-with-blending is the simpler correct model.



\### 2.4 Extensions approaching but not reaching the PDE step

\- Sorensen \& Gafos (2016): cubic nonlinear restoring force producing a Duffing oscillator: $\\ddot{x} + b\\dot{x} + k(x-T) + d(x-T)^3 = 0$. The cubic term is structurally identical to the nonlinearity in KdV and NLS.

\- Kirkham (2025): SINDy on electromagnetic articulography data confirms ~1/3 of gesture tokens require this cubic nonlinearity. This is the empirical anchor.

\- Gafos \& Benus (2006): double-well potentials $V(x) = -\\frac{1}{2}kx^2 + \\frac{1}{4}x^4$, mathematically identical to the φ⁴ field theory that supports topological kink solitons when extended to a spatial dimension.

\- Nam et al. (2009): same double-well structure for syllabic coordination modes.

\- Roon \& Gafos (2016), Tilsen (2018, 2019): neural field models with integro-differential equations over continuous parameter spaces producing localized bump attractors that exhibit collision dynamics (merging, repulsion, pass-through depending on interaction kernel).

\- Iskarous: spatial representations in articulatory phonology, critical examination of how space and time enter the framework. His work on discrete phonological categories emerging from continuous dynamics through bifurcation, and his hydrodynamic treatment of the tongue as a fluid, are the closest existing approaches to considering the field-equation step. \*\*Critical coordinate distinction:\*\* Iskarous' hydrodynamic models work in \*\*Eulerian\*\* coordinates (fixed spatial frame, fluid moves through it). The present proposal works in what is effectively a \*\*Lagrangian\*\* or \*\*phase-space\*\* coordinate ($\\xi$ = position along the gestural score). Eulerian hydrodynamics of the tongue gives Navier-Stokes (viscous, diffusive); the present framework works in the score coordinate where coupling character is empirical. Thorough comparative engagement required before claiming full novelty.

\- Keating's Window Model (1985, 1990; reviewed in Volenec 2015): each phonological feature has a permissible range ("window") of articulatory values; specified features get narrow windows (less coarticulation), unspecified features get wide windows (more coarticulation). Structurally analogous to variable attractor basin depth in the present framework — but the Window Model stipulates window widths per feature per language, whereas the soliton model derives coarticulation resistance from equation parameters. The key differentiator: the Window Model makes no prediction about collision dynamics (what happens when two specified gestures overlap), only about single-gesture variability. The soliton model predicts specific collision outcomes (phase shifts, energy conservation) from the same parameters that determine single-gesture stability.

\- All remain ODE frameworks or operate over abstract parameter spaces. None treat the gestural score as a coupled system supporting localized wave-like structures.



\## 3. Soliton physics: what's needed and what's present



\### 3.1 Ingredients for soliton-like behavior

\- A system with coupling that spreads localized structures (dispersive, diffusive, or mixed)

\- A nonlinearity that balances spreading

\- In driven-dissipative systems: energy injection and loss that maintain localized structures

\- The balance produces dissipative solitons: localized, stable structures

\- Canonical equations: KdV, sine-Gordon, NLS (conservative); Complex Ginzburg-Landau (driven-dissipative)

\- Key soliton property: identity preservation through collision with phase shifts as residual



\### 3.2 The ontological status of the field: what the continuum limit does and does not claim



\*\*The strongest objection to this framework:\*\* the gestural score is a timing plan, not a physical medium. Treating it as a continuous field capable of supporting wave mechanics assigns physical laws to a conceptual abstraction.



\*\*What the model claims:\*\* That discrete gesture sites are coupled, and the coupling dynamics are well-approximated by a PDE in the limit of dense packing. The continuum limit is a \*mathematical approximation\* of a discrete coupled system (the Duffing lattice of Section 7.2), not an ontological claim that a physical substance exists between gestures. This is standard practice in condensed matter physics: the Debye model treats a crystal lattice as a continuous elastic medium. Nobody claims there is a physical substance between atoms. The claim is that the inter-atomic coupling dynamics are well-approximated by continuum equations.



\*\*What must be empirically true for the approximation to work:\*\*

\- Gesture sites must be coupled (coarticulation exists; uncontroversial)

\- The coupling must have specific dynamical properties (dispersive, diffusive, or mixed; testable)

\- The coupling must be local or near-local in $\\xi$ (next-neighbor coupling dominant; testable by measuring how influence decays with gestural distance)



\*\*What the model does NOT claim:\*\*

\- That a physical medium exists between gestures

\- That coarticulatory influence literally "propagates" through a substance

\- That the gestural score has intrinsic material properties independent of the gestures occupying it



\*\*The anticipatory coarticulation test:\*\* The reviewer's challenge that "anticipatory lip rounding for /u/ during a preceding /k/ is a discrete planning instruction, not a wave" is exactly the empirical question. If anticipatory effects appear instantaneously at arbitrary distances in $\\xi$ (consistent with a look-ahead buffer), the coupling is non-local and the lattice/PDE approximation is wrong. If anticipatory effects show distance-dependent decay with a specific functional form (consistent with nearest-neighbor coupling propagating through the lattice), the approximation holds. This is testable (Section 6.1). The framework does not assume the answer; it predicts specific coupling profiles and can be falsified if coupling is non-local.



\### 3.3 The coupling character question: dispersive, diffusive, or mixed?



The character of inter-site coupling along the gestural score determines which equation regime applies.



\*\*Dispersive\*\* (wave-like): oscillatory tails, frequency-dependent coupling. Produces conservative solitons (KdV, NLS). Signature: oscillatory/non-monotonic decay of inter-site influence.



\*\*Diffusive\*\* (heat-like): monotonic smooth decay. Produces reaction-diffusion structures. Collision phenomenology tends toward inelastic.



\*\*Mixed\*\* (driven-dissipative): the most physically realistic regime. Complex Ginzburg-Landau (CGL) handles both components. Supports \*\*dissipative solitons\*\* maintained by gain/loss/nonlinearity balance.



\*\*Why CGL is the natural starting point:\*\* Given (a) heavy damping, (b) critical damping baseline, (c) continuous energy injection, (d) unknown coupling character, CGL is the most honest description. Conservative equations are limiting cases, not assumed starting points.



\*\*Empirical discriminant:\*\* How one gesture's influence on a non-adjacent neighbor decays with distance in $\\xi$.

\- Oscillatory/non-monotonic → dispersive dominant → NLS/KdV limit

\- Smooth monotonic → diffusive dominant → reaction-diffusion limit

\- Mixed → CGL proper



\*\*Caution on existing evidence:\*\* Articulatory overshoot has established control-theory explanations (underdamped single-oscillator response) that don't require dispersive \*inter-site coupling\*. Local oscillatory behavior ≠ dispersive coupling between sites. The test requires measuring inter-site influence propagation specifically.



\*\*Candidate mechanisms for dispersive coupling:\*\*

\- Sensory feedback delays (strongest candidate; produces effective dispersion in controller; caveat: complicates clean measurement under controller-plant commitment)

\- Elastic tissue rebound at short timescales

\- Frequency-dependent biomechanical coupling through muscular hydrostat



Under CGL, the question is "what ratio of dispersive to diffusive coupling?" (continuous parameter), not "dispersive or diffusive?" (binary gate).



\### 3.4 Why gestures are localized structures, not propagating pulses



Articulatory gestures don't propagate. The lip closure for /p/ occupies a temporal slot, influences neighbors, and remains localized. The appropriate mathematical object is a localized stationary or quasi-stationary structure: a dissipative soliton in CGL, a kink in φ⁴, or a breather in NLS (if oscillatory dynamics demonstrated).



\*\*The coordinate system:\*\*



Let $\\xi$ = position along the gestural score, $t$ = physical evolution time. A gesture is localized in $\\xi$, evolving in $t$.



\*\*The metric on $\\xi$:\*\* Three candidates:



\*\*Candidate 1: Planned temporal proximity\*\* (adopted as primary). Distance = planned inter-gesture timing. $\\Delta\\xi$ decreases with speech rate (lattice compression). Coupling constant $C$ and spacing $\\Delta\\xi$ are separate quantities; $\\alpha = C(\\Delta\\xi)^2$ is rate-dependent by construction. Consistent with coarticulatory effects increasing with speech rate.



\*\*Critical test:\*\* The real prediction is $C$ is rate-independent while $\\Delta\\xi$ compresses. Measure coarticulatory influence magnitude at different rates, factor out spacing. If $C$ varies with rate, metric is wrong (Section 6.11).



\*\*Candidate 2: Shared articulator involvement.\*\* Distance = degree of biomechanical coupling. Graph topology rather than linear ordering. Laplacian becomes graph Laplacian. Soliton theory on graphs exists (Ablowitz, Noja) but less mature. Stronger predictions (coarticulation clusters by coupling topology, not temporal adjacency) but harder to formalize and test. Worth parallel development.



\*\*Candidate 3: Articulatory similarity.\*\* Deferred.



\### 3.5 Driven-dissipative solitons: the right physical regime



The articulatory system is heavily damped (critically damped baseline). Classical soliton theory applies to conservative systems. The resolution: \*\*dissipative solitons\*\* in a driven system, maintained by muscle activation against viscous loss.



\*\*The controller-plant commitment:\*\* The soliton lives in the combined plant-plus-controller system. Controller shapes $F(\\xi)$; plant provides nonlinearity and damping; the dissipative soliton emerges in the coupled dynamics. Analogous to mode-locked lasers. Collapses without driving; this is standard for dissipative solitons.



The cochlear precedent: Eguíluz, Hudspeth, and Magnasco (2000), Duke and Jülicher (2003). Active energy injection balances viscous dissipation. If the auditory system uses driven-dissipative nonlinear wave physics, the articulatory system may use the same physics.



\### 3.6 The dimensionality constraint



Task dynamics provides dimensional reduction: one gesture, one primary tract variable. The soliton model operates within single tract-variable channels. Multi-variable coordination involves coupled 1+1D fields (vector NLS/CGL).



Predicts cleaner soliton phenomenology for within-tract-variable interactions than between-tract-variable interactions. Consistent with Recasens' finding that coarticulation depends on articulator sharing.



\### 3.7 Prosodic boundaries as field boundary conditions



Utterance-initial and utterance-final gestures lack neighbors on one side. In field-theoretic terms: boundary conditions at utterance edges.



\*\*Prosodic strengthening as boundary effect:\*\* Gestures at phrase edges are hyperarticulated. In soliton physics, boundary conditions affect localized structures near edges (reflection, amplification, compression).



\*\*Prediction:\*\* Strengthening magnitude decays with distance from edge, with equation-determined profile. Distinguishable from controller-driven strengthening (increased $F(\\xi)$) by the specific decay form. Consistent with phonological literature: prosodic strengthening is gradient and decays over the first few segments.



\### 3.8 The small-N problem: boundary-dominated regimes



Typical phrases are 3-10 gestures long. In soliton physics, this is a "small box": boundary conditions dominate and bulk soliton dynamics may not establish cleanly.



\*\*Honest assessment of the constraint:\*\*

\- Within-utterance predictions (phase shifts, elastic scattering) operate in a boundary-dominated regime where edge effects are always present. Predictions must account for boundary contributions, not assume periodic or infinite-domain solutions.

\- The soliton gas statistics (Section 6.9) aggregate across many utterances, which mitigates the small-N problem for population-level predictions but doesn't eliminate it for individual-utterance dynamics.

\- Longer utterances (read speech, narrative) provide better approximation to the "bulk" regime. Short utterances (isolated words, commands) are maximally boundary-dominated.



\*\*This is a scope limitation, not a falsification.\*\* The model predicts that soliton-like collision dynamics should be more clearly observable in longer utterances and in utterance-medial positions (far from boundaries). If collision dynamics show no improvement with utterance length or boundary distance, the model has a problem beyond boundary effects.



\*\*Partial mitigation:\*\* The Duffing lattice (Section 7.2) is finite by construction. Phase 0 simulations should use realistic utterance lengths (5-15 sites), not infinite domains. All quantitative predictions should be derived from finite-lattice simulations with appropriate boundary conditions, not from infinite-domain analytical solutions.



\## 4. The mapping



\### 4.1 Coupling = coarticulatory interaction between gesture sites

\- Nearest-neighbor coupling spreads each gesture's influence into adjacent temporal windows

\- Anticipatory and carryover coarticulation as forward and backward coupling

\- The dispersive vs diffusive character determines the equation regime (Section 3.3)

\- Critical: inter-site coupling, not local oscillatory behavior

\- The coupling must be local/near-local in $\\xi$ for the lattice approximation to hold; non-local coupling (instantaneous look-ahead) would falsify the framework (Section 3.2)

\- \*\*Empirical scope constraints (Volenec 2015):\*\* Anticipatory labial coarticulation spans up to 6 segments (Benguerel \& Cowan 1974); lip rounding can begin 600 ms before the rounded vowel (Lubker et al. 1975). Lingual coarticulation is usually within-syllable. Velar (nasality) crosses syllable and word boundaries. This articulator-dependent scope hierarchy (labial > velar > lingual) must emerge from the lattice model if coupling is local — the model must explain why labial coupling propagates further than lingual, likely through lower DAC (shallower attractor basins) allowing more transparent pass-through of influence.



\### 4.2 Nonlinearity = quantal stability + articulatory constraints

\- Stevens' quantal theory (1989): nonlinear articulatory-to-acoustic mapping with stable plateaus

\- Kirkham's cubic nonlinearity, subject to boundary-condition check (Section 7.1)

\- \*\*Sign of $d$:\*\* $d > 0$ (hard spring) = defocusing; $d < 0$ (soft spring) = focusing. Determines collision behavior.

\- Double-well potentials for categorical contrasts (Gafos \& Benus 2006)



\### 4.3 Coarticulation as elastic scattering (replacing blending)

\- Proposed: elastic or near-elastic collision with phase shifts

\- Fowler's coproduction provides philosophy; this provides mathematics

\- \*\*Important phenomenological constraint:\*\* Same-target overlap (e.g., /p/ and /b/, both labial closures) is \*not\* a soliton collision test. Same-target gestures are indistinguishable in the tract variable and their overlap is fusion by definition. The soliton test requires different-target gestures on the same tract variable (e.g., /i/ and /a/ tongue body in VCV sequences) where the post-overlap trajectories can be checked for identity preservation and phase shifts.



\### 4.4 Toward a token-level conserved quantity



Candidate: trajectory energy from SINDy-identified dynamics. In the field formulation, the relevant quantity depends on equation type (energy for CGL/φ⁴, topological charge for sine-Gordon). DAC as attractor basin depth provides the most general explanation.



\## 5. Existing infrastructure awaiting synthesis



\### 5.1 Nonlinear dynamics already in articulatory phonology

\- Duffing oscillator (Sorensen \& Gafos, Kirkham)

\- φ⁴ double-well (Gafos \& Benus, Nam et al.)

\- Neural field bumps (Roon \& Gafos, Tilsen)



\### 5.2 Inverse scattering already in speech acoustics

\- Gopinath \& Sondhi (1970), Forbes, Pike \& Sharp (2003-2006), Bruckstein, Levy \& Kailath (1985), Aktosun (2005-2021)



\### 5.3 Acoustic solitons in vocal-tract-like geometry

\- Richoux et al. (2015), Sougleridis et al. (2022)



\### 5.4 Cochlear mechanics as driven-dissipative precedent

\- Eguíluz, Hudspeth \& Magnasco (2000), Duke \& Jülicher (2003)



\### 5.5 Wavelet scattering

\- Andén \& Mallat (2014), Rudzicz et al. (2016)



\## 6. Testable predictions



\### 6.0 Emergent dynamics vs forced response



Compare EMG (motor command shape) with EMA (trajectory shape) for same gesture tokens. If shapes differ: emergent dynamics. If identical: no single-gesture emergence.



\*\*Intellectual status:\*\* Cannot kill the framework alone. Even with matching shapes, emergent \*interaction\* dynamics may survive (nonlinearity activates only under superposition). The load-bearing gate is coupling character (6.1).



\### 6.1 Coupling character and locality (the load-bearing gate)



\*\*Two sub-tests, both critical:\*\*



\*\*(a) Coupling locality:\*\* Does coarticulatory influence show distance-dependent decay along $\\xi$, or does it appear at arbitrary distances instantaneously?

\- Distance-dependent decay → local coupling → lattice/PDE approximation holds

\- Instantaneous at arbitrary distance → non-local planning instruction → lattice model wrong, framework requires reformulation or abandonment (Section 3.2)



\*\*(b) Coupling character:\*\* Is the distance-dependent decay oscillatory or monotonic?

\- Oscillatory/non-monotonic → dispersive component → CGL supports dissipative solitons

\- Purely monotonic → diffusive → CGL parameter regime may not support elastic collisions

\- Under CGL, the question is the dispersive-to-diffusive ratio (continuous), not a binary gate



\*\*Most likely outcome:\*\* Ambiguous, with some non-monotonicity but noise and confounds. CGL handles this because it operates across the full spectrum. A purely diffusive result with clearly local coupling is the only outcome that kills the framework cleanly.



Data: Wisconsin XRMB, Haskins XRMB, Kirkham's EMA corpus, Recasens' Catalan/Spanish data.

\*\*Scope hierarchy test:\*\* The lattice model must reproduce the articulator-dependent scope ordering documented in Volenec (2015): labial coarticulation propagates across more sites than velar, which propagates more than lingual. In the soliton framework, this ordering should follow from attractor basin depth (DAC): labial gestures (DAC 1, shallow basins) are more transparent to coupling propagation than dorsal gestures (DAC 3, deep basins). This is a parameter-free prediction given independently measured DAC-derived basin depths: no additional fitting should be needed to reproduce the scope ranking.



\### 6.2 Boundary-condition check on cubic nonlinearity (go/no-go gate)



See Section 7.1. Which gesture types show Kirkham's cubic terms?

\- Contact-only → boundary saturation → framework fails

\- Non-contact gestures show cubic → distributed nonlinearity → proceed



\### 6.3 Phase shifts in post-overlap gestures



Directional commitment depends on sign of $d$. Specific functional form from equation parameters with no free parameters beyond Kirkham's measurements.



\*\*Measurability:\*\* Must exceed ~2ms EMA resolution. Phase 0 simulation determines this. If below: pivot to soliton gas statistics (6.9).



\*\*All predictions must be derived from finite-lattice simulations\*\* (realistic utterance lengths of 5-15 sites), not infinite-domain solutions (Section 3.8).



\### 6.4 Token-level energy conservation



\### 6.5 Radiation loss as integrability probe



\### 6.6 Multi-gesture clusters (Yang-Baxter)



Tightly controlled nonsense-word paradigms likely necessary.



\### 6.7 Phonological assimilation as kink propagation

The coarticulation/assimilation boundary is unresolved in the phonetics literature (Volenec 2015 §5): coarticulation is gradient and phonetic; assimilation is categorical and phonological. In Articulatory Phonology, Browman (1995) proposed that assimilation is simply extreme gestural overlap. Fowler offered a perceptual criterion: if listeners perceive the change, it's assimilation (grammatical); if only instrumentally measurable, it's coarticulation (non-grammatical).

The soliton framework provides a dynamical criterion: coarticulation = elastic scattering (gestures survive collision with phase shifts); assimilation = inelastic capture (one gesture's attractor basin absorbs the other). The transition between these regimes is a bifurcation in the equation parameters — specifically, when overlap exceeds a critical threshold determined by relative attractor basin depths, the elastic collision transitions to capture. This predicts: (a) the coarticulation/assimilation boundary should be sharp in parameter space but gradient in observation (because parameter values vary continuously across tokens); (b) assimilation should preferentially target low-DAC gestures (shallow basins, easier to capture); (c) the critical overlap threshold should be measurable from lattice simulations.



\### 6.8 Action minimization test



\### 6.9 Soliton gas statistics (population-level test)



Connected speech as dense soliton ensemble. Soliton gas theory (El, Tovbis) predicts spacing and amplitude distributions.



\*\*Small-N caveat:\*\* Individual utterances are short (3-10 gestures). Soliton gas predictions apply to the ensemble across many utterances, not within single short utterances. The aggregation mitigates the small-N problem but introduces utterance-boundary effects as a confound. Analysis should control for utterance length and boundary proximity.



Data: MOCHA-TIMIT, mngu0, USC-TIMIT rtMRI.



\### 6.10 Prosodic boundary effects



Strengthening decay profile from utterance edge, distinguishable from controller-driven strengthening by spatial form.



\### 6.11 Coupling constant rate-independence (metric validation)



$C$ should be rate-independent while $\\Delta\\xi$ compresses. If $C$ varies: temporal-proximity metric absorbing physics it shouldn't.



\## 7. Formal model



\### 7.1 The boundary-condition check (go/no-go gate)



\*\*Possibility A: Distributed nonlinearity.\*\* Cubic intrinsic to dynamics throughout movement range. Non-contact gestures show it.



\*\*Possibility B: Boundary saturation.\*\* Cubic from palatal contact (tissue compression, hard wall). Most consonantal gestures involve contact or near-contact.



\*\*Test:\*\* Which gesture types require cubic terms in Kirkham's data?

\- \*\*Non-contact gestures to check:\*\* lip aperture (bilabials have contact, but lip protrusion/spreading don't); glottal opening/closing; tongue body position in open vowels (/a/, /æ/); velopharyngeal port.

\- \*\*If cubic appears in ANY non-contact gesture type:\*\* Possibility A holds for at least some gestures. Framework survives for those.

\- \*\*If cubic is EXCLUSIVELY in gestures with contact targets:\*\* boundary saturation is the parsimonious explanation. Framework fails as stated.



\### 7.2 From Duffing oscillator to gestural field equation



\#### Discrete starting point: Duffing lattice



$$\\ddot{x}\_n + b\\dot{x}\_n + k(x\_n - T\_n) + d(x\_n - T\_n)^3 = C(x\_{n+1} - 2x\_n + x\_{n-1}) + F\_n$$



Direct physical interpretation: lattice site = gesture slot, $C$ = coarticulatory coupling, $d$ from Kirkham. \*\*All Phase 0 simulations use this finite lattice directly, with realistic N (5-15 sites) and explicit boundary conditions. The continuum limit is for analytical tractability, not for numerical work.\*\*



\#### Continuum limit



$$C(x\_{n+1} - 2x\_n + x\_{n-1}) \\to \\alpha \\frac{\\partial^2 u}{\\partial \\xi^2}, \\quad \\alpha = C(\\Delta\\xi)^2$$



Under temporal-proximity metric: $\\alpha \\propto (\\text{rate})^{-2}$ if $C$ rate-independent (Section 6.11).



\#### Primary equation: Complex Ginzburg-Landau



$$\\frac{\\partial u}{\\partial t} = (1 + i\\alpha\_d)\\frac{\\partial^2 u}{\\partial \\xi^2} - (1 + i\\beta\_d)u|u|^2 + \\gamma u + F(\\xi, t)$$



$\\alpha\_d$ = dispersive/diffusive ratio. Primary model; no assumption about coupling character.



\#### Limiting cases as parameter regimes:



\*\*$\\alpha\_d$ large (dispersive coupling):\*\*



\*Real-valued (no carrier):\*

$$u\_{tt} + bu\_t + ku + du^3 = \\alpha u\_{\\xi\\xi} + F(\\xi, t)$$

Driven-dissipative φ⁴. Kinks, lumps. Directly from lattice.



\*Envelope (requires oscillatory dynamics):\*

$$i\\frac{\\partial A}{\\partial t} + \\alpha \\frac{\\partial^2 A}{\\partial \\xi^2} + d|A|^2 A = -ibA + F(\\xi)$$

NLS. Requires demonstrating driven system oscillates.



\*\*$\\alpha\_d$ small (diffusive):\*\* Reaction-diffusion limit. Typically inelastic collisions.



\*\*Categorical contrasts (sine-Gordon):\*\*

$$\\phi\_{tt} + b\\phi\_t - c^2 \\phi\_{\\xi\\xi} + \\omega\_0^2 \\sin(\\phi) = F(\\xi, t)$$

Kinks (topological, propagating). Topological charge = phonological feature. Exactly conserved.



\#### The carrier question



Saltzman-Munhall is critically damped: no carrier $\\omega\_0$. NLS requires one. Either driving creates effective underdamping (testable from EMA ringing) or NLS is inapplicable and φ⁴/CGL is primary. Phase 0 determines regime.



\#### Parameters

\- $(k, d, b)$: Kirkham SINDy. Sign of $d$ recorded.

\- $C$: coarticulation extent. Rate-independence testable.

\- $\\Delta\\xi$: inter-gesture timing. Rate-dependent.

\- $\\alpha\_d$: from coupling character test (6.1).

\- $F(\\xi, t)$: EMG or trajectory fitting.



\### 7.3 Equation regime map



| Regime | Equation | Soliton type | Carrier? | Domain |

|--------|----------|-------------|----------|--------|

| General (primary) | CGL | Dissipative solitons | No | All driven-dissipative |

| Dispersive limit | φ⁴ | Kinks, lumps | No | Strong dispersive coupling |

| Dispersive + oscillatory | NLS | Breathers | Yes | Oscillatory driven dynamics |

| Categorical | Sine-Gordon | Kinks, breathers | No | Periodic potentials |

| Diffusive limit | Reaction-diffusion | Fronts, pulses | No | Diffusive coupling dominant |



\### 7.4 Action principle and variational structure



\*\*For limiting cases (φ⁴, sine-Gordon, NLS):\*\* standard Lagrangians and Noether conserved quantities.



\*\*For CGL proper:\*\* no Lagrangian (non-Hamiltonian). Dissipative soliton stability via Akhmediev approach: stationary solutions are attractors of the dynamics. DAC = attractor basin depth.



\*\*Topological charge (sine-Gordon):\*\* $Q = \\frac{1}{2\\pi}\[\\phi(\\infty) - \\phi(-\\infty)]$. Integer. Exactly conserved regardless of dissipation. Phonological features as topological charges: discrete, error-correcting categories from continuous dynamics.



\*\*Coarticulation as optimization:\*\* dissipative solitons are dynamical attractors. Coarticulation is the system finding its optimal trajectory, not corruption. From "speech is lazy" to "speech trajectories are attractors of a nonlinear PDE."



\### 7.5 The inverse problem



Pipeline: acoustics → tract shape (IST/LPC) → tract variables → soliton decomposition (novel step 3). Discrete spectrum = gestures, continuous spectrum = coarticulatory residue. For sine-Gordon: kink count = phonological structure.



Relation to predictive coding: the field equation \*is\* the generative model; inverse scattering \*is\* the inference algorithm. Compatible with Bayesian perception frameworks.



\## 8. Implications



\### 8.1 For speech science

\- Segmentability as emergent dynamical property

\- DAC derived from attractor basin depth, not stipulated as parameter

\- Coarticulation reframed from blending to scattering

\- Parsimony gain: one equation replaces separate stiffness-ranking and blending-rule stipulations



\### 8.2 For speech synthesis

\- Soliton-based synthesis preserving interpretable parametric structure



\### 8.3 For speech perception

\- Gesture recovery = inverse scattering

\- Motor theory reinterpreted: perception tracks soliton invariants

\- Compatible with predictive coding (field equation as generative model)



\### 8.4 For phonological theory

\- Discreteness from dynamics (topological charge)

\- Sound change as parameter drift; categories as bifurcation points



\## 9. Explicit failure modes



\*\*(a)\*\* EMG/EMA shapes match AND no elastic scattering → no emergent dynamics → dead



\*\*(b)\*\* Cubic only in contact gestures → boundary saturation → dead



\*\*(c)\*\* Coupling non-local (instantaneous at arbitrary distance) → lattice model wrong → dead or requires non-local reformulation



\*\*(d)\*\* Coupling purely diffusive AND collisions inelastic → reaction-diffusion regime, framework loses elastic scattering claim → weakened to reaction-diffusion localized structures



\*\*(e)\*\* Phase shifts wrong direction → model with identified parameters wrong



\*\*(f)\*\* Phase shifts below measurement floor → untestable by this method; pivot to soliton gas (6.9)



\*\*(g)\*\* Concatenation has lower action than coarticulation → optimization argument wrong



\*\*(h)\*\* Token energy not conserved → no quasi-conserved quantity



\*\*(i)\*\* Yang-Baxter violated → far from integrable



\*\*(j)\*\* Soliton gas statistics mismatch → ensemble-level failure



\*\*(k)\*\* $C$ rate-dependent → temporal-proximity metric wrong



\*\*(l)\*\* Prosodic strengthening profile doesn't match equation prediction → boundary interpretation wrong



\*\*(m)\*\* Collision dynamics don't improve with utterance length or boundary distance → small-N isn't just a limitation, it's a sign the model is wrong even in favorable conditions



\## 10. Scope limitations



\- Single tract-variable channels; multi-variable requires coupled fields

\- NLS regime requires demonstrating oscillatory dynamics; CGL and φ⁴ are safer

\- CGL has no Lagrangian; action principle applies only to limiting cases

\- The $\\xi$ metric is a choice (temporal proximity) with testable consequences; alternatives (graph-Laplacian on articulator-coupling topology) may be more physical

\- Small N (3-10 gestures per phrase) means boundary effects are always present; all predictions must be derived from finite-domain simulations, not infinite-domain analytics

\- Iskarous' work requires thorough comparative engagement

\- Active driving $F(\\xi)$ is treated as given; derivation from motor planning is a separate problem



---



\## Execution strategy



\### Phase 0: Simulation and parameter check

1\. \*\*Check sign of $d$\*\* in Kirkham's data

2\. \*\*Check which gesture types\*\* show cubic terms (go/no-go gate 7.1 can partially be answered from the published paper)

3\. \*\*Implement finite Duffing lattice\*\* (N=5-15 sites, explicit boundary conditions) with Kirkham's parameters and estimated $C$

4\. \*\*Simulate driven-damped collision\*\* of two localized excitations

5\. \*\*Measure phase shift magnitude.\*\* Below ~2ms → pivot to soliton gas statistics

6\. \*\*Determine equation regime:\*\* oscillatory (NLS-like) or non-oscillatory (φ⁴-like)?

7\. \*\*Map to CGL parameter space.\*\* Which published dissipative soliton results apply?



\### Phase 1: Prerequisite empirical checks

1\. Kirkham boundary-condition test (7.1)

2\. Coupling character and locality (6.1): the load-bearing gate

3\. Forced-response (6.0): informative, not framework-killing alone

4\. $C$ rate-independence (6.11): metric validation



\### Phase 2: Publication



\*\*Recommended sequence:\*\*

1\. \*\*Journal of Phonetics\*\* first: conceptual synthesis, gap identification, Fowler formalized, full prediction suite. Engages the community with the data; cites physics paper "in preparation."

2\. \*\*PRL\*\* second: lattice derivation, CGL identification, simulation results, headline predictions. 4 pages, high visibility.

3\. \*\*PRE\*\* third: full formal treatment with complete equation hierarchy and prediction suite.



\### Phase 3: Empirical validation

\- Phase shifts: Wisconsin XRMB, Haskins XRMB, Kirkham's corpus, Recasens' VCV data

\- Forced-response: Ostry, Keller, Parrell EMG/EMA corpora

\- Token energy (6.4), action comparison (6.8)

\- Soliton gas: MOCHA-TIMIT, mngu0, USC-TIMIT rtMRI

\- Clusters (6.6), kink dynamics (6.7)

\- Prosodic boundaries (6.10), speech rate (6.11)



\### Key citations

\- Kirkham (2025): cubic nonlinearity, SINDy

\- Sorensen \& Gafos (2016): Duffing oscillator

\- Recasens (1997, 2002, 2014): DAC

\- Volenec (2015): standard coarticulation review; DAC taxonomy, scope hierarchy, three frameworks, coarticulation/assimilation boundary

\- Fowler (1977-2006): coproduction

\- Stevens (1989): quantal theory

\- Gafos \& Benus (2006): double-well / φ⁴

\- Nam et al. (2009): syllable coordination

\- Roon \& Gafos (2016), Tilsen (2018, 2019): neural fields

\- Iskarous: spatial representations, hydrodynamics, bifurcation

\- Gopinath \& Sondhi (1970): inverse scattering

\- Bruckstein, Levy \& Kailath (1985): LPC as inverse scattering

\- Forbes, Pike \& Sharp (2003-2006): Klein-Gordon

\- Richoux et al. (2015), Sougleridis et al. (2022): acoustic solitons

\- Eguíluz, Hudspeth \& Magnasco (2000), Duke \& Jülicher (2003): cochlear physics

\- Saltzman \& Munhall (1989): task dynamics

\- Šimko \& Cummins (2010, 2011): embodied task dynamics

\- Andén \& Mallat (2014): wavelet scattering

\- Liberman \& Mattingly (1985): motor theory

\- Ostry, Keller, Parrell: EMG/EMA data

\- Akhmediev et al.: CGL dissipative solitons

\- El \& Tovbis: soliton gas theory

\- Ablowitz, Noja: solitons on graphs

