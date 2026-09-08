---
title: "A Model of Articulatory Dynamics and Control"
authors: "Cecil H. Coker"
year: 1976
venue: "Proceedings of the IEEE, Vol. 64, No. 4, April 1976, pp. 452-460"
pages: "452-460"
affiliation: "Acoustics Research Department, Bell Laboratories, Murray Hill, NJ 07974"
---

# A Model of Articulatory Dynamics and Control

> **Scan note:** the source PDF has 10 page images. PDF pages 0-7 are the article's printed pages 452-459; PDF page 8 is printed page 460 (references, followed by the start of the *next* article in the issue, Atal's "Automatic Recognition of Speakers from Their Voices" — not part of this paper). PDF page 9 is a clean high-resolution reproduction of Figs. 3 and 4. All page citations below use the **printed** page numbers 452-460.

## One-Sentence Summary
Coker describes a complete articulatory text-to-speech system: a spatial vocal-tract model with ~8-10 controllable articulatory degrees of freedom, a mode-oriented linear dynamic model (principal-axis / diagonalized transfer matrix) that interpolates realistic intermediate shapes, and an open-loop "rehearsal" controller in which each phoneme assigns per-articulator *priorities* (time offsets) that lead or lag the nominal segment boundary to produce correct coarticulatory overlap. *(p.452)*

## Problem Addressed
Terminal-analog synthesizers require formant tracks to be specified directly; articulatory models promise fewer, more linguistically natural parameters, but no prior model produced correctly *timed* articulatory movement from a phonetic string. Coker's aim is a model whose spatial *and* dynamic characteristics match natural speech closely enough that spectrograms are "not casually distinguishable" from natural speech. *(p.452)*

## Key Contributions
- A spatial articulatory model with a fixed circular tongue-body mass movable in a plane, plus separate lip, tongue-tip, velum, and glottal variables *(p.452)*
- A "mode-oriented" dynamics model built by *inverting* the classical principal-axis (eigenvalue) problem: define the system by its diagonal response matrix D and the mixing matrix P, rather than solving for them from an unknown H *(pp.453-454)*
- The **priority** mechanism: per-phoneme, per-articulator lead/lag times that reproduce anticipatory and carryover coarticulation *(p.456)*
- Context-dependent priority for /g/ that reproduces the observed circular (loop) tongue-body motion in VgV *(p.457)*
- A complete text-to-speech chain (dictionary + letter-to-sound, duration rules, intonation) driving the articulatory model *(pp.458-460, pending)*

## Study Design
Not an empirical study with a population. This is a **model/system description paper** with validation by (a) comparison of model articulator trajectories against Houde's X-ray measurements [8] (Fig. 7), (b) comparison of simulated vocal-cord area against optical measurements of vocal-cord opening (Figs. 8-9), and (c) spectrogram comparison of synthesized vs natural sentences (Fig. 10). No statistics are reported. *(pp.457-459)*

## Methodology
1. Build a **static spatial articulatory model** with ~8-10 controllable coordinates whose shapes match human vocal-tract shapes without resolving muscles. *(p.452)*
2. Assume the dynamics are **linear** and **diagonalizable by a real matrix**; therefore the system decomposes into independent one-input one-output modal filters. *(pp.453-454)*
3. **Invert the principal-axis problem**: instead of solving for $D$ and $P$ from the unknown $H$, estimate $D$ from spectrographic temporal signatures and $P$ from cross-correlations in static X-ray vowel data, then work backwards through Eqs. (4)-(8) to physical coordinates. *(p.454)*
4. Handle the moving-vs-fixed reference frame problem for lip and tongue-tip consonantal variables by treating them as **interpolation factors** downstream of the dynamics (linear with variable coefficients). *(p.455)*
5. Drive the dynamic system with an **open-loop feed-forward controller**: each segment carries per-articulator approach/leave **priorities** (in ms) that offset the nominal boundary time, plus per-articulator response-delay compensation. *(p.456)*
6. Add **context-dependent priority** for /g/ horizontal tongue-body motion and a scalar **allophonic control digit** for stress/boundary-driven variation. *(pp.457-458)*
7. Generate sound either by driving the Flanagan-Ishizaka articulatory model directly from the area function, or (usual path) by computing formants via a zero-crossing binary search on the quantized Webster equation and driving a digital resonance synthesizer. *(pp.458-459)*

---

## II. The Static Articulatory Model *(p.452)*

Level of detail: match human vocal-tract *shapes* closely, but do not resolve individual muscles. Fig. 1 shows the spatial model.

- **Three coordinates** specify location of a large central portion of the tongue and regulate jaw movement.
  - The tongue body is treated as a **fixed circular section movable in a plane** (a "circle within a circle", credited to Fujimura [1]). For closer fits to high front and back phonemes the palate of the present model is flatter, with the front and back corners rounded almost to the radius of the tongue mass. *(p.452, footnote 1)*
  - Two of the three tongue-body coordinates define vowels and influence jaw angle.
  - A third produces the more rapid tongue-body movement for /g/ and similar consonants, but does **not** affect jaw angle.
- **Five other parameters** are significant for other consonants:
  - Two coordinates specify **closure** and **rounding** of the lips.
  - Two regulate **raising** and **curling back** (retroflexion) of the tongue tip.
  - One controls the general-purpose **cross-section transformation**.
- **Ninth variable**: position of the **velum** — in this implementation it affects only an acoustic-domain simulation of nasality. *(p.452)*
- Another variable represents an **upper-pharyngeal constriction** for the "bunched-tongue" /ɚ/ (er) of American English; also handled as an acoustic-domain correction. *(p.452)*
- **Three excitation variables**: (a) action of the arytenoid cartilages opening/closing the vocal cords; (b) vocal cord tension; (c) subglottal pressure. *(p.452)*
- Several internal variables govern pharyngeal-section shape, area at the teeth, etc., but are not independently controllable. *(p.452)*

### Acknowledged missing degrees of freedom *(p.452)*
- No independent upper-lip control ⇒ /f/ and /v/ must currently be synthesized as **bilabials**.
- Close matching of /ʃ/ and /ʒ/ (sh, zh) shapes would require an **additional degree of freedom**.

### Cross-section saturation equation
The model accounts for vocal-tract width except where the tract is severely constricted. To regulate rate of change of area as an articulator closes off the tract, the cross-section/constriction parameter C produces a saturation of the form:

$$
A' = \frac{A + \sqrt{A^2 + 4C^2}}{2}
$$
Where: $A$ = nominal (unsaturated) cross-sectional area; $C$ = the cross-section/constriction control parameter; $A'$ = the resulting saturated area. *(p.452, Eq. 1)*

- Most critical action: distinguish tongue-tip shapes in /s/, /d/, /l/, and make specification of these phonemes **less sensitive to context**. *(p.452)*
- Because saturation area is an **even function of C**, /s/ and /l/ can be assigned target values with **opposite signs**, representing tongue-tip curvature less than and greater than palate curvature respectively. Consequently smooth transitions between /s/ and /l/ automatically insert "homorganic stops" /t/ or /d/. *(p.452)*

---

## III. Dynamics of the Articulatory System

### A. What we know and do not know *(pp.452-453)*
- Tongue-body tissue density is very close to water; viscosity at low frequencies must be much higher than a nearly lossless fluid. Muscles are fibrous; stretch and shear are direction-dependent. It is unclear whether interwoven fibers contract in unison or can be excited differently in different layers / at different points. *(p.453)*
- A faithful representation would need second-degree PDEs in three dimensions and time; available data is inadequate to characterize such equations. *(p.453)*
- **But the form of the solutions is predictable**: whether PDE or lumped-constant, if linearity holds, solutions are additive combinations of **modes of response**, each with a characteristic spatial and temporal signature. *(p.453)*
- **Number of modes: no more than about ten have dynamic activity in most English speech.** Vocal-tract shapes during most speech are approximated closely by a model with **seven to ten degrees of freedom**. *(p.453)*
- Modes used in speech are identifiable: lips, tongue tip, velum, glottis and to an extent the tongue body are physically isolated parts with little or no directly connecting tissue or bone ⇒ **roughly one or two modes per independent articulator**. *(p.453)*
- Temporal characteristics are visible in spectrograms: lip rounding in /w/; bilabial closure in /b/; tongue-tip raising in /d/; tongue-body movement in vowel-vowel and /g/ transitions. *(p.453)*

### B. Mode-oriented approach *(p.453)*
Goal: a system whose solutions match the vocal system's, spatially and temporally. The vocal-tract model already generates all spatial solutions of interest. The procedure is the **reverse of the classical principal-axis / eigenvalue problem [3],[4]**: build the model so that individual terms of the solution appear explicitly as internal variables, and their linear summations appear as explicit combinations of the internal variables. An approximate model is constructed, compared with real data, and **manually converged by successive iteration** to fit the real vocal system. *(p.453)*

### C. Transformations to independent variables *(p.453)*

$$
y_i = h_{ij} x_j
$$
$$
Y = HX
$$
Where: $Y$ = vector of position coordinates; $X$ = vector of inputs; $H$ = matrix of convolutions (elements are time waveforms or discrete time series; the procedure also applies for continuous functions with $H$ an integral or differential operator). The $x$'s can represent forces; if the system has restoring forces proportional to displacement, the $x$'s can, with simple rescaling, be viewed as **positions (target configurations)**. *(p.453, Eqs. 2-3)*

Change of variables to new coordinates $R$ and inputs $C$ via transformation $P$:

$$
R = P^{-1}Y \quad Y = PR \quad C = P^{-1}X \quad X = PC
$$
*(p.453, Eq. 4)*

$$
R = PY = P^{-1}HPP^{-1}X = P^{-1}HPC = DC
$$
*(p.453, Eq. 5)*

$$
D = P^{-1}HP
$$
$$
R = DC
$$
*(p.453, Eq. 6)*

**Principal-axis crux:** for a reasonably general class of physical systems (see Section III-E) there exists a $P$ reducing the system response equations to a **diagonal** matrix; hence a coordinate system in which each individual term of $R$ depends on exactly one term of $C$:

$$
r_i = d_{ii} c_i
$$
*(p.453, Eq. 7)*

Consequence: the large simultaneous system is replaced by a set of smaller independent equations — a group of **independent one-input one-output systems** (Fig. 2). Each simulates the response of one term in the overall response to the input component that excites it. Rows of $P$ describe the composition of any physical coordinate $y$ in terms of the principal-axis variables $r$:

$$
y_i = p_{ij} r_j
$$
*(p.453, Eq. 8)*

### D. Modeling articulatory movements *(pp.453-454)*
- Classical problem: find $D$ and $P$ from $H$. Here **$H$ is the unknown**; only individual components of $H$ have direct physical counterparts, and even they are unknown. But $P$ and $D$ have direct associations with **measurable responses**: elements of $D$ describe temporal characteristics of modes; rows of $P$ describe relative amounts of each mode in a particular physical coordinate $y$. *(pp.453-454)*
- It is easy to find speech sequences that excite predominantly one or a very few modes at a time; from such utterances both $D$ and $P$ can be pinned down. *(p.454)*
- **Approach: define the model in terms of $D$, and work backwards through Eqs. (4)-(8) to the physical coordinates $Y$.** *(p.454)*
- The procedure is independent of the original definition of the $y$'s (lumped-constant model [5]-[7], quantized PDE points, or continuous functions with linear differential/integral $H$). For different $Y$, $P$ changes appropriately; but except for ordering and ignorable higher-order terms, **$D$, $C$ and $R$ are the same in each case — they are intrinsic properties of the physical system**. *(p.454)*
- $Y$ is chosen to be the spatial-model variables, which were intentionally selected to be good guesses for the $r$'s, so $P$ is expected to be **close to the identity matrix**. Ultimately $P$ is incorporated into the model and $R$ used as its inputs; $P$ is incorporated into the **definitions of phonemes**, and the independent command variables $C$ are stored instead of $X$. *(p.454)*

### E. Underlying assumptions *(p.454)*
- **Linearity**: questionable because muscles pull but cannot push. In Houde's X-ray data [8] linearity seems to hold — Houde [8, Fig. 3.3.8] shows tongue-body responses with essentially the same waveshape independent of starting point, direction, and distance of travel. *(p.454)*
- **Diagonalizability** of $H$ may or may not be a restriction depending on operations permitted in $P$. If elements of $P$ were themselves transfer functions there would be no restriction; in this case a **real-number $P$** produces close fits to available data. *(p.454)*
- Diagonalizability by a real matrix normally implies $H$ (and its inverse) is a **two-element kind**:

$$
H = H_1 f_1 + H_2 f_2
$$
Where: $H_1$, $H_2$ are matrices of real numbers, and $f_1$, $f_2$ are scalar response functions [9]. *(p.454, Eq. 9)*

A more general spring-mass-damping system would require **three** such terms (if vector $Y$ is to contain only positions), so simple proportionalities are implied in $H$ and its inverse — most likely following from the **uniformity of density, viscosity and stretch properties of muscle tissue**. *(p.454)*

### F. Estimating matrices D and P *(p.454)*
- Starting point for $P$: the **identity matrix**.
- Since $P$ must diagonalize the system for all conditions including steady state, **off-diagonal terms of $P$ are estimated by cross-correlating positions of extremity variables with tongue-body variables in an ensemble of static X-ray data for vowels [10]** (excluding rounded vowels from data used for lip variables). This establishes the effect of the tongue-body-jaw assembly on lip and tongue-tip variables and on internal variables such as pharynx opening. *(p.454)*
- The only significant remaining interactions are between **lip closure and rounding**. The two lip variables have very different speeds of response, so each is identifiable in spectrograms and converges rapidly under "analysis by synthesis". Fig. 3 shows /bo/ (beau) with superimposed exponentials for the slower poles of lip closure and rounding: **there is a component of lip closure due to rounding, but not the reverse**. *(p.454)*
- The lip-variable solution is **not unique**: one can trade between the coefficient of closure due to rounding and the target value for the rounding command variable. This trade apparently exists in real speech too — there are variations between individuals, dialects and languages in the actual amount of lip extension in "rounded" phonemes. *(p.454)*
- Terms of $D$ (temporal responses of other modes) are identified in spectrograms by observing which articulatory gestures dominate the spectrum in various configurations. *(p.454)*

#### Acoustic identification heuristics *(p.454)*
- If the tract is **not strongly constricted**, there is close correspondence between the articulatory "vowel triangle" and the $F_1$-$F_2$ plane: **$F_1$ identifies with forward motion of the tongue mass; $F_2$ with downward motion.**
- When there **is** a constriction, the cavity in front of the constriction dominates one formant and the one behind it another. **The lower of these is $F_2$, the higher $F_3$.**
- $F_1$ is then the resonance of a **Helmholtz cavity with the yielding wall acting to increase the effective constriction area**. $F_1^2$ is **proportional to the product of cavity volume and constriction area, plus a constant**. Using this, identifications for $F_1$ can be made with tongue-tip raising, lip closure, rounding, and tongue-body closure of /d/, /b/, /w/, /g/. *(p.454)*
- Fig. 4: spectrogram of /IgU/ ("big"/"good" vowels). Tongue-body **vertical** movements identify with $F_1$. **Horizontal** movements are reflected very directly in the **front-cavity resonance** ($F_3$ of /I/, then $F_2$ of /U/), and also in the **back-cavity resonance** ($F_2$ of /I/, $F_3$ of /U/). Spectrogram made from a synthesized utterance; superimposed plot is the actual synthesis parameter. *(pp.454-455)*

### G. Tongue-body variables: time-varying coefficients or separate parameters *(pp.454-455)*
Houde's data show the tongue body has **two speeds of motion**:
- slow, **~150 ms**, for transitions not involving tongue-body consonants;
- faster, **~80 ms**, for vertical motion in tongue-body consonants. *(pp.454-455)*

Rather than presume a time-variable system, the implementation uses a **separate variable for tongue-body consonants**. Advantages: (a) jaw angle is strongly correlated with tongue height in vowels but not strongly coupled in consonants; (b) relative timing of articulatory commands differs between tongue-body consonants and vowels. A separate variable handles both regularly, like other consonantal gestures. *(p.455)*

### H. Interpolation variables; a departure from linearity *(p.455)*
Problem with constant coefficients: in the **rest** position the lower lip is fixed relative to the **movable jaw**, and the tongue tip is fixed relative to the **movable tongue body**. But during their specific consonants, these variables and the consonantal tongue-body variable seek values **fixed relative to the fixed structure of the head**.

- Could be handled by open-loop compensation (predict the anticipated position of the movable large structure and set the incremental consonant variable to make up the difference). *(p.455)*
- More likely explanation: **nonlinear compressibility or nonlinear feedback** — as the tongue tip approaches its spatially fixed target, contact with fixed parts of the head increases, first at the teeth and progressively against more of the palate. At the time of closure the tongue tip does have a fixed reference frame. *(p.455)*
- **Working expedient in the present system: an ad hoc feed-forward compensation downstream of the dynamics.** Variables controlling consonantal constrictions (lips, tongue tip, tongue body) are used **not as actual coordinates but as interpolation factors**: when the variable is low the corresponding coordinate follows the (actually moving) "rest position" value; when the control variable is near unity the coordinate assumes its (actually fixed) value appropriate for the consonant. As this "switching function" is processed into smoothed transitions by its characteristic filter, the corresponding coordinate makes smooth interpolations from its movable rest position to its fixed active position. **The resulting system is not strictly nonlinear, but linear with variable coefficients.** *(p.455)*

---

## IV. The Articulatory Controller; Sequencing of Articulatory Commands *(p.455)*

Shape and dynamics of the articulatory system are physiological and should be basically **language independent**. The **sequencing** of commands must be learned and can vary between languages. Command structure is expected to be complex: a human spends as much time perfecting this motor skill as learning to stand and walk, play an instrument, or become an accomplished gymnast. *(p.455)*

### A. Choice of command variables *(p.455)*
- In moving from one phoneme shape to another, **all articulators do not change at the same time**. At consonant-consonant boundaries the essential feature of one segment is held until the essential feature of the successive segment is achieved. **At any time the vocal system is usually dealing with three or more phonemes**: producing the current one, recovering from one or more previous ones, and preparing for one or more upcoming ones. *(p.455)*
- Articulatory overlap looks very different in different coordinate systems. For two representations related by

$$
U = QV \quad V = Q^{-1}U
$$
*(p.455, Eq. 10)*

the two are equivalent for describing **target positions**. But if the change from one target to the next is done by **sequentially switching each $u_i$ at time $t_i$**, then in the $v$'s each component of $V$ is a summation of many steps occurring at different times. **A simple control sequence looks simple only in its proper coordinates.** *(p.455)*
- Coordinates for linguistic control must be learned; they are not intrinsic properties of the articulators. Fortunately **linguistic control appears to be organized around the modes of articulatory response** — probably nothing more than the physical separation of articulators; but languages would tend to align around modes even without physically separate articulators, since a mode-oriented control strategy is simplest to learn (cause and effect most directly associated). *(p.455)*
- The specific articulatory gestures of consonants happen also to be **extrema of mode variables**: lip rounding, lip closure, raised tongue tip, retroflexed tongue tip, tongue-body-velar closure, nasalization, glottal closure, opening, etc. In terms of (2)-(10), proper overlapping of articulatory gestures is obtained by simply **delaying or advancing the steps from one target value to another of the individual coordinates $c_i$**. *(pp.455-456)*

### B. Timing of articulatory commands *(p.456)*
Control is **open-loop feed-forward, a "rehearsal" philosophy**, as opposed to a feedback principle (cf. Hinke [6]). Transition times are calculated directly as operating variables.

**Priority mechanism:**
1. Each speech segment (phoneme or subphoneme) is assigned, **for each articulatory variable, two priorities**: one for transitions *toward* the segment and one for those *leaving* it. *(p.456)*
2. The intended duration of a segment is computed **open-loop from phonological rules**, giving an official time for the beginning and end of a segment. *(p.456)*
3. The actual time to step each articulatory variable is computed to **lead or lag that official time according to the difference in priorities**. **Priority has the dimension of time** (or time normalized by speed of the variable). *(p.456)*

Fig. 5 illustrates priorities on tongue tip and lips in the /db/ sequence of "goodbye". Lighter lines: command variables (step functions) and responses with **neutral** priorities; heavy lines: variables with **correct** priorities. Proper time for the /db/ boundary is $T$.

- Without priorities, tongue-tip and lip commands would lead $T$ by amounts $D_B$ and $D_W$ appropriate to compensate for the delays of each characteristic response filter. But since vocal-tract closure corresponds to an **extreme** of each articulator's movement, the release of /d/ would occur **tens of milliseconds before** the correct time and the closure of /b/ equally late. *(p.456)*
- In the correct case, /d/ has positive priority for tongue tip and /b/ does not, so a positive priority difference gives a positive timing correction $P_T$. Actual time for the tongue-tip command step between /d/ and /b/:

$$
T_B = T - D_B + P_B
$$
*(p.456, Eq. 11)*

thus causing the release of /d/ to occur at the proper time. Priorities of /d/ and /b/ are reversed for the lip variable, so signs of the priority difference and consequent timing correction reverse:

$$
T_W = T - D_W + (-P_W)
$$
*(p.456, Eq. 12)*
Where: $T$ = nominal (official) segment-boundary time; $D_B$, $D_W$ = characteristic response-filter delay compensation for the tongue-tip (B) and lip (W) variables; $P_B$, $P_W$ = priority values. *(p.456)*

**Dominant effect of priorities:** specify how far, in the transition from one target value toward the next, each articulator is to progress **by the time of the intended phoneme boundary**. For constriction-oriented phonemes and articulators, this point is very near one extreme of articulatory movement. *(p.456)*

**Design rule (quantitative):** if the articulatory target is chosen to **overshoot closure by 10 percent**, then at phoneme boundaries the closure-producing transient should be **90 percent complete** and the release transient **10 percent complete**. For phonemes where lip rounding, lip closure, tongue-tip raising, retroflexing (and anti-retroflexing), and consonantal tongue-body closure are significant, this leads to timing adjustments of **~40 percent of the rise time of each specific articulator** — for both anticipation and holdover. *(p.456)*

**Normalization convention:** since the model operates on *differences* of priorities, absolute priority values for a given articulator are insensitive to an additive constant. Convention: set absolute levels so that the **largest number of phonemes have zero priority** for any given articulator. This leads to **negative priorities** for a few phonemes that defer certain decisions to their neighbors:
- Negative tongue-body priorities for **/h/** allow it to take on the "coloration" of adjacent vowels. *(p.456)*
- Negative priorities for control of **glottal opening in voiced fricatives /v/, /ð/, /z/, /ʒ/** allow these to become **pure fricatives** in regions adjacent to voiceless sounds and silence. *(p.456)*

### C. Priorities, targets, and distinctive features *(p.456)*
Priorities and parameter target values parallel distinctive features [11],[12]:

| Model variable | Feature counterpart |
|---|---|
| Lip rounding target + priority | + rounded |
| Bilabial closure target + priority | + labial |
| Tongue-tip raising + priorities | + alveolar |
| Glottal width variable | voiced/voiceless (but **no parallel in priorities** for glottal control) |
| Tongue-tip front-back, back position | + retroflex |
| Tongue-body consonantal variable + priorities | + velar |
| Tongue-body vowel variables | front/back and high/low |

- The **opposite extreme** of the tongue-tip front-back variable is equally critical for tongue-tip-**dental** phonemes /θ/ and /ð/ ("thin", "then"); these extrema are also assigned **high priority**, compared with /t/, /d/, etc. *(p.456)*
- The tongue-body consonantal variable is given **nonzero targets and priorities also for the front-palatal consonants /ʃ/ and /j/ (Sh and Y)**. *(p.456)*
- The tongue-body vowel variables align with front/back and high/low, but **there appears no reason to favor either extreme with a priority**. *(p.456)*

### D. Context-dependent priorities: /g/ *(pp.456-457)*
One conspicuous case where sequencing varies with phonemic context: relative timing of **horizontal and vertical tongue-body motions** to and from /g/.

Observed (Houde) behavior *(p.457)*:
- General tendency during vocal-tract closure of /g/ for the constriction to move **from the back of the palate toward the front** — or at least never toward the back.
- The effect shows up in **initial movements from the vowel to /g/, well before closure**, and in the **departure from /g/ well after release**.
- Initial movement of /ig/ is **horizontal**; final movement of /gi/ is **vertical**. Initial movement of /ug/ is **vertical**; final movement of /gu/ is **horizontal**. *(p.457)*
- Fig. 6: schematic loop/circular tongue-body motion for /g/ between /i/, /a/, /u/. *(p.457)*

**Proposed physiological rationale:** active adjustment in sequencing to prevent devoicing. When the tract is closed for /g/ the enclosed cavity is smaller and more hard-walled than for other consonants; to prevent a pressure buildup that would quickly devoice /g/, the cavity **gradually enlarges**, making room for air flowing through the glottis. Staggered timing of horizontal and vertical tongue-body movements moves the constriction forward during /g/ in most contexts and minimizes backward movements in the most difficult contexts. **Apparently the perceptual process anticipates this: if the circular motion is not properly modeled in synthesis, /g/ is easily confused with /d/ in many contexts.** *(p.457)*

**Rejected alternative:** giving vowels strong asymmetries in priorities for the consonantal tongue-body variable would produce the circular motion but cause **serious irregularities in the duration of closure** — the /g/ of /ugi/ would occur **50 ms before** the nominal closure time; that of /igu/ **50 ms late**. *(p.457)*

**Adopted mechanism — context-dependent priority for horizontal tongue-body movement of /g/** *(p.457)*:
- If /g/ is **preceded by a front vowel**, its **initial** priority is **increased by 50 ms**; if by a **back vowel**, **decreased by 50 ms**.
- If /g/ is **followed by a front vowel**, its **final** priority is **increased**; if by a **back vowel**, **decreased**.
- "This procedure produces exceptionally good matches to X-ray data." Fig. 7 superimposes model performance on Houde's data for /g/ with /i/, /a/, /u/. *(p.457)*

### E. "Intentional" allophonic variation *(pp.457-458)*
Adjustments governed by higher-level factors — **stress** and **presence/absence of word boundaries** (in the model, a **continuously adjustable degree of boundary**). Most notable variant: **timing of glottal closure in voiceless stops**.

Devoicing time of /t/ from real speech (Umeda [13, fig. 12], [14]) *(p.457)*:

| Condition | Devoicing time |
|---|---|
| Word- and stressed-syllable-initial /t/ | 60-70 ms |
| Word-medial, nonstressed /t/ | ~40 ms average (context-dependent) |
| Final /t/ | 0-20 ms |

Physiological mechanism: timing of a step command from "open-glottis" to "closed-glottis". *(p.457)*
- In **word- and stress-initial stops**, the glottis reaches its widest opening at the time of stop release, then takes **60-70 ms** to close back to the point where significant vocal-cord vibrations occur.
- In the **word-final** stop, the glottis **never opens**.
- **Word-medial** stops show various intermediate degrees of glottal opening and delay of closure depending on phonological conditions. *(p.457)*

Similar but subtler initial-final contrasts occur in **all consonants** *(p.457)*:
- Fricatives: contrast is mainly **intensity**. Data show **wider glottal opening for initial and stressed fricatives**, and for higher stress levels **heightened subglottal pressure**.
- The subglottal-pressure effect reaches adjacent vowels: portions nearest the stressed consonant can be **louder by two to four dB** than the remainder of the vowel.
- Fricative intensity is presumably also affected by the shape and degree of constriction.
- Voiced consonants: initial allophones have subjectively **lower intensity during the actual consonant**, followed by a rapid increase going into the vowel; a portion of the vowel adjacent to the stressed consonant can be **louder than it would be following a final or medial consonant**. *(pp.457-458)*

#### Mechanism for lowering apparent consonantal-murmur intensity, by consonant type *(p.458)*
The mechanism appears to differ per consonant class, despite possibly heightened subglottal pressure:
- **Initial voiced stops:** a **glottal readjustment** producing increased fundamental and lower harmonics, but **sharply decreased fourth, fifth and higher harmonics** [15] (see Umeda [13, Fig. 11]).
- **Nasals:** the intensity change is probably the result of a **continuing change in velar opening throughout the consonant**. Strongly initial nasals will **not nasalize the preceding vowel**, and thus begin their consonantal murmurs with characteristics **quite like their place-cognate voiced stops**, with intensity growing as the nasal path opens. A **less extreme opposite** effect occurs with final nasals.
- **/w/ and /j/:** intensity effect achieved mainly through **regulation of the degree of constriction**.
- **/r/:** achieves the initial-final contrast through **lip rounding**. Initial /r/ is strongly rounded relative to /w/; final /r/ is **nonrounded** relative to the vowel /ɚ/.
- **/l/:** quite possibly regulates degree of constriction, but also makes **strong shifts in target positions and timing priorities of the tongue body**. Initial /l/ is relatively **palatal** and quite deferent to its vowel neighbors. Final /l/ has **strong initial priorities for the tongue body and a target position for the tongue body almost as far back as the vowel /a/**.
- **/n/:** to a lesser extent has tongue-body variations that are the **reverse of /l/**.

### F. Modeling "intentional" allophones *(p.458)*
Initial-final contrasts are handled by a **one-dimensional attribute**: in the phonetic input, a **control digit from 0 to 9**.

Algorithm *(p.458)*:
1. The control digit is used variously to modify **both the target values of variables and the timing priorities of variables**, as appropriate for different phonemes.
2. Internally, the control digit is translated into a **fractional coefficient between -1 and 1**.
3. To have this coefficient produce different effects for different phonemes, **each phoneme can be provided a set of allophonic incremental factors, with pointers indicating which variables they are to modify**.
4. The **products of these increments and the allophonic coefficient are added to the designated target variable or priority (approaching or leaving)** to produce the actual values used by the processor.

Fig. 9 illustrates the effect of allophonic control of the **arytenoid variable of /t/**: two traces simulate vocal-cord area for the two sentences of the natural-speech data in Fig. 8. Control data for the synthesis was produced **by rule from printed text**, then modified slightly (changes in phoneme duration and small changes in the allophonic control variable of /t/) to more closely parallel those particular natural utterances. *(p.458)*

### G. Generating sound output *(pp.458-459)*
Two methods:

**Method 1 — direct articulatory synthesis.** The model derives area functions which, together with the model's variables for subglottal pressure, vocal-cord tension and neutral glottal area, directly control the **Flanagan-Ishizaka vocal-cord–vocal-tract model [16]**. Executing on a **CSP-30** computer this generates **one second of speech in about 6 minutes of computation**. *(p.458)*

**Method 2 (the usual method) — intermediate formant computation.** An intermediate computation of **formant frequencies and amplitudes of noise and voicing**, used to control a **commercial digital resonance synthesizer [17]**. *(p.458)*

Formant calculation begins with **Webster's equation** for pressure $P$ in a hard-walled lossless vocal tract with steady-state sinusoidal excitation:

$$
\frac{1}{a(x)}\frac{\partial}{\partial x}\left(a(x)\frac{\partial}{\partial x}P\right) + \frac{\omega^2}{C^2}P = 0
$$
Where: $a(x)$ = cross-sectional area as a function of distance $x$ along the tract; $P$ = pressure; $\omega$ = radian frequency (printed as $W$ in the scan); $C$ = speed of sound. *(p.458, Eq. 13)*

Quantizing vocal-tract position $X$ yields:

$$
\frac{P_{i+1} - P_i}{\Delta X^2} - \frac{A_{i-1}}{A_i}\frac{P_i - P_{i-1}}{\Delta X^2} + \frac{\omega^2}{C^2}P_i = 0
$$
Where: $P_i$ = pressure at section $i$; $A_i$ = area of section $i$; $\Delta X$ = section length. *(p.458, Eq. 14; the printed subscripts in the scan are ambiguous — this is the form consistent with Eq. 15.)*

$$
P_{i+1} = \left(1 - \frac{\omega^2 \Delta X^2}{C^2}\right)P_i + \frac{A_{i-1}}{A_i}(P_i - P_{i-1})
$$
*(p.458, Eq. 15 — the forward recursion actually iterated.)*

**Zero-crossing formant search algorithm** *(p.458)*:
1. Key property: if the tract is excited at the resonance frequency of the **N**th formant, **pressure will peak at the glottis** and there will be **exactly N zero crossings of P along the length of the tract — one of them occurring precisely at the lips**.
2. Guess a frequency.
3. Iterate the recursion (Eq. 15; the text cites "(17)") from the **glottis to the lips**.
4. If the lips are reached **before** the correct number of zero-crossings occurs, the guess frequency is **too low**.
5. If the correct number of zero-crossings occurs **before** iteration reaches the lips, the guess is **too high**.
6. A **binary search** finds the correct frequency.

**Yielding-wall correction.** Having found the hard-walled resonances, yielding-wall effects are included by the transformation:

$$
F_1 = \sqrt{F_1^2 + F_0^2}
$$
Where: $F_0$ = the approximate $F_1$ frequency for the **totally closed** yielding-wall vocal tract, **about 200 Hz** (cf. Sondhi [18]). (As printed, $F_1$ appears on both sides; read the left-hand $F_1$ as the corrected value and the right-hand $F_1$ as the hard-walled resonance.) *(pp.458-459, Eq. 16)*

**Further constraints** *(p.459)*:
- Formants are constrained to a **minimum separation of 175 Hz**.
- **Bandwidths** are determined by **table lookup and interpolation from Dunn's data on natural speech [19]**.

**Excitation state for formant synthesis** *(p.459)*:
- Determined by modeling the **low-frequency behavior of the interoral pressure**.
- From the **transglottal pressure, the neutral-glottal-area variable, and the prior state of oscillation**, the current **amplitude of vocal-cord oscillation** and the **on-off ratio of vocal-cord closure** are estimated, following data obtained from the Flanagan-Ishizaka model [15].
- **Amplitudes of noise and aspiration** are inferred from the **constriction area and glottal area, the transconstriction and transglottal pressures**.

**Compute cost:** calculation of control data for formant synthesis, on a fixed-point **Honeywell 516**, requires about **13 s of computation for each second of speech**. *(p.459)*

Fig. 10 compares a natural spectrogram with model output (formant synthesis) for "We were away in September". *(p.459)*

---

## V. Conclusion *(p.459)*

- Spoken language is **literally designed around the articulatory process** — to exploit its capabilities and compensate for its weaknesses. *(p.459)*
- **Dominant weakness:** slowness of articulatory movements. *(p.459)*
- **Exploitable features:** (a) the large number of independently controllable articulatory movements; (b) most of these movements have **nonlinear effects on the output sound** — certain critical extremes of movement have pronounced effects, opposite extremes have little effect. *(p.459)*
- The speech code exploits these by setting **more than one articulator into motion at once**. Using a form of **"pulse stretching"**, it assures that articulatory commands last long enough for each articulator to reach its critical position, for the proper amount of time, and in the proper sequence. *(p.459)*
- By this **"orchestration" of overlapping commands**, discrete speech segments are successfully transmitted through the sluggish multivariate vocal mechanism at **peak rates exceeding 20 segments per second — more than twice the Nyquist limit for the faster variables; four or five times it for the slower ones**. *(p.459)*
- Linguistic control is organized around the **independent characteristic modes of response** of the articulators. Languages apparently select for consonants an assortment of modes that can be **discriminated perceptually, either by spatial or temporal characteristics**: /b/, /d/ and /g/ are discriminated by **spatial (hence spectral)** characteristics; /b/-/w/ and /d/-/j/ are discriminated by **temporal** characteristics. This alignment probably simplifies language acquisition, in much the same way it simplifies modeling. *(p.459)*
- The model is incorporated into an overall system for speech synthesis, either from phonetic controls or from **ordinary English text [20],[21]**; it generalizes well beyond its original "training data". *(p.459)*

---

## Parameters

### Articulatory degrees of freedom (spatial model)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Tongue-body coordinates (vowel-defining) | — | position | — | 2 of 3 tongue-body coords | 452 | Define vowels; influence jaw angle |
| Tongue-body consonantal coordinate | — | position | — | — | 452, 455 | Rapid movement for /g/ and similar; does **not** affect jaw angle; separate variable, not time-varying coefficient |
| Lip closure | — | position | — | — | 452 | One of two lip coordinates |
| Lip rounding | — | position | — | — | 452 | Component of lip closure derives from rounding, not the reverse |
| Tongue-tip raising | — | position | — | — | 452 | + alveolar |
| Tongue-tip curling back / front-back | — | position | — | — | 452, 456 | Back extreme = + retroflex; front extreme critical for /θ/, /ð/ |
| Cross-section transformation | C | — | — | signed (opposite signs for /s/ vs /l/) | 452 | Even function in saturation Eq. 1 |
| Velum position | — | position | — | — | 452 | Affects only acoustic-domain nasality simulation in this implementation |
| Upper-pharyngeal constriction (bunched-tongue /ɚ/) | — | position | — | — | 452 | Acoustic-domain correction |
| Arytenoid / glottal opening | — | area | — | — | 452 | Excitation variable; maps to voiced/voiceless |
| Vocal-cord tension | — | — | — | — | 452 | Excitation variable |
| Subglottal pressure | Ps | — | — | — | 452 | Excitation variable; raised for high stress |
| Total dynamic degrees of freedom | — | count | — | 7-10 | 453 | "No more than about ten modes have dynamic activity in most English speech" |

### Dynamic / timing parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Tongue-body slow transition time | — | ms | 150 | ~150 | 454-455 | Transitions not involving tongue-body consonants (Houde data) |
| Tongue-body fast transition time | — | ms | 80 | ~80 | 454-455 | Vertical motion in tongue-body consonants |
| Priority (per phoneme, per articulator, approaching) | P | ms | 0 | negative to positive | 456 | Normalized so most phonemes have zero priority |
| Priority (per phoneme, per articulator, leaving) | P | ms | 0 | negative to positive | 456 | Two priorities per segment per articulator |
| Response-filter delay compensation | D | ms | — | — | 456 | Per articulator (D_B tongue tip, D_W lips) |
| Target closure overshoot | — | % | 10 | — | 456 | Target overshoots closure by 10% |
| Closure transient completion at boundary | — | % | 90 | — | 456 | Consequence of 10% overshoot |
| Release transient completion at boundary | — | % | 10 | — | 456 | Consequence of 10% overshoot |
| Resulting timing adjustment | — | % of articulator rise time | ~40 | — | 456 | Both anticipation and holdover |
| /g/ horizontal priority context adjustment | — | ms | ±50 | ±50 | 457 | +50 ms if adjacent vowel is front; -50 ms if back; applied to initial (preceding V) and final (following V) priorities |
| /g/ closure-time error if handled via vowel priority asymmetry | — | ms | ±50 | — | 457 | Rejected alternative: /ugi/ 50 ms early, /igu/ 50 ms late |
| Allophonic control digit | — | — | — | 0-9 | 458 | Phonetic-input attribute |
| Allophonic internal coefficient | — | — | — | -1 to 1 | 458 | Fractional translation of the control digit |
| Peak segment rate achieved | — | segments/s | — | >20 | 459 | >2x Nyquist for fast variables; 4-5x for slow |

### Devoicing time of /t/ (from Umeda [13],[14])

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Devoicing time, word- and stress-initial /t/ | — | ms | 65 | 60-70 | 457 | Glottis widest at release, then closes over this interval |
| Devoicing time, word-medial nonstressed /t/ | — | ms | 40 | context-dependent | 457 | Average |
| Devoicing time, final /t/ | — | ms | 10 | 0-20 | 457 | Glottis never opens in word-final stop |
| Glottal reclosure time after initial/stressed stop release | — | ms | — | 60-70 | 457 | Measured (Fig. 8) |
| Vowel-portion intensity boost adjacent to stressed consonant | — | dB | — | 2-4 | 457 | Attributed to subglottal-pressure effect |

### Acoustic / synthesis parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Yielding-wall closed-tract F1 | F0 | Hz | 200 | ~200 | 459 | Correction constant in Eq. 16; cf. Sondhi [18] |
| Minimum formant separation | — | Hz | 175 | — | 459 | Hard constraint after formant search |
| Formant bandwidths | — | Hz | — | — | 459 | Table lookup + interpolation from Dunn [19] |
| Articulatory synthesis compute cost | — | min per s of speech | 6 | — | 458 | Flanagan-Ishizaka model on CSP-30 |
| Formant-control compute cost | — | s per s of speech | 13 | — | 459 | Honeywell 516, fixed point |

---

## Figures of Interest
- **Fig. 1 (p.452):** Spatial model of the articulatory system — labeled articulatory coordinates (N, R, B, K, Y, X, W, L, G, Q, Ps) on a midsagittal head outline, showing the circular tongue-body mass.
- **Fig. 2 (p.454):** (a) The real system as simultaneous equations H(τ) mapping x_i → y_i; (b) the workable modeling approach — inverse change of variables P^-1, a bank of independent one-input one-output filters d_ii(τ), then change of variables P.
- **Fig. 3 (pp.455, 460-clean):** Spectrogram of /bo/ ("bow") with superimposed exponentials for the two modes of lip movement — a "simple close-open transient" and a slower "lip-rounding transient".
- **Fig. 4 (pp.455, 460-clean):** Spectrogram of the synthesized /IgU/ with the tongue-body horizontal coordinate superimposed on the F3→F2 (front cavity, high-to-low) and F2→F3 (back cavity, low-to-high) transitions.
- **Fig. 5 (p.456):** Tongue-tip-height and lip-closure command (step) and response curves for the /db/ sequence of "goodbye", with and without priorities; marks τ_P, τ_D, τ_P2 and boundary times T1, T2, T3. **The central diagram for the priority mechanism.**
- **Fig. 6 (p.457):** Schematic loop/circular tongue-body motion for /g/ between /i/, /a/, /u/ — the "circular motion" that prevents pressure buildup.
- **Fig. 7 (p.457):** Model tongue-body motion (smooth, lighter traces) vs Houde's X-ray data, vertical and horizontal, for igagi, igugi, agugo, agiga, ugigu, ugagu.
- **Fig. 8 (p.458):** Spectrograms and optical measurements of vocal-cord opening for "gray tie" and "great eye" — in the stressed /t/ of "tie" the glottis opens wide to allow airflow for a burst of turbulence; in "great eye" the tract is kept closed to prevent a burst.
- **Fig. 9 (p.459):** Model performance (simulated vocal-cord area) for the same two utterances as Fig. 8.
- **Fig. 10 (p.459):** Two spectrograms of "We were away in September" — one real speech, one synthesis by rule.

---

## Results Summary
- The model's tongue-body trajectories match Houde's X-ray data closely for /g/ in i/a/u contexts once context-dependent horizontal priority is applied ("exceptionally good matches"). *(p.457)*
- Simulated vocal-cord area traces (Fig. 9) reproduce the measured open/closed glottal behavior distinguishing stressed "tie" from "great eye". *(pp.458-459)*
- Synthesized spectrograms of full sentences are "not casually distinguishable" from natural speech and the system generalizes beyond its training data. *(pp.452, 459)*
- The system achieves peak transmission rates exceeding 20 segments/s through a mechanism whose faster variables have a Nyquist limit under half that. *(p.459)*

## Limitations *(author-acknowledged)*
- No independent **upper-lip** control ⇒ /f/ and /v/ must be synthesized as **bilabials**. *(p.452)*
- Close matching of /ʃ/ and /ʒ/ articulatory shapes would need **another degree of freedom**. *(p.452)*
- **Velum** and the **bunched-tongue /ɚ/ pharyngeal constriction** are handled only as **acoustic-domain corrections**, not true articulatory geometry. *(p.452)*
- Several internal variables (pharyngeal-section shape, area at the teeth) are **not independently controllable**. *(p.452)*
- The **linearity** assumption is physiologically questionable (muscles pull, cannot push); it is defended empirically from Houde's data rather than derived. *(p.454)*
- **Diagonalizability by a real matrix** implies $H$ is a restricted "two-element" kind; a general spring-mass-damping system would need three terms. *(p.454)*
- The **lip-variable solution is not unique** — there is a trade between the closure-due-to-rounding coefficient and the rounding target value. *(p.454)*
- The fixed-vs-moving reference-frame problem for the lower lip and tongue tip is handled by an **ad hoc feed-forward compensation** (interpolation variables), not a principled nonlinear model. *(p.455)*
- Estimation of $D$ and $P$ is **manual convergence / analysis by synthesis**, not an automatic fit. *(pp.453-454)*
- To match particular natural utterances in Fig. 9, phoneme durations and the /t/ allophonic control digit had to be **hand-adjusted** away from the by-rule values. *(p.458)*

## Arguments Against Prior Work
- **Against full physical modeling of the tongue:** faithful representation would require 3-D second-degree PDEs with "messy-to-describe" shapes, internal characteristics, excitations and boundary conditions — and **the available data is inadequate to characterize such equations**. Coker argues the mode structure of the solutions is knowable even when the equations are not. *(p.453)*
- **Against classical principal-axis estimation:** the standard approach determines $D$ and $P$ from $H$, but $H$ is unknown and even its individual components are unknown; only $D$ and $P$ have measurable counterparts. Hence the procedure is deliberately run in reverse. *(pp.453-454)*
- **Against feedback control:** the controller uses an open-loop feed-forward "rehearsal" philosophy **as opposed to a feedback principle (cf. Hinke [6])**; transition times are computed directly as operating variables. *(p.456)*
- **Against neutral (priority-free) command timing:** with neutral priorities, releases and closures land tens of milliseconds off, because vocal-tract closure is an *extreme* of articulator movement rather than a midpoint of it. *(p.456)*
- **Against time-varying coefficients for tongue-body speed:** rather than a time-variable system, use a separate tongue-body consonant variable — jaw angle correlates with tongue height in vowels but not consonants, and the relative timing of commands differs between the two. *(p.455)*
- **Against handling /g/ loop motion via vowel priority asymmetries:** would cause serious closure-duration irregularities (±50 ms). *(p.457)*
- **Against terminal-analog-only accounts of /g/:** if the circular tongue-body motion is not modeled, /g/ is **easily confused with /d/** in many contexts — a perceptual, not merely articulatory, failure. *(p.457)*

## Design Rationale
- **Choose Y equal to the spatial-model variables** so that $P$ is close to the identity matrix, minimizing the size of the correction. *(p.454)*
- **Fold P into the phoneme definitions** and store the independent command variables $C$ rather than $X$, so the runtime system works directly in mode coordinates. *(p.454)*
- **Estimate off-diagonal P by cross-correlating extremity variables with tongue-body variables** over static X-ray vowel data, excluding rounded vowels for lip variables. *(p.454)*
- **Represent priorities as times, not as abstract weights**, so that the timing correction is a direct additive offset on the segment boundary (Eqs. 11-12). *(p.456)*
- **Normalize priorities so most phonemes are zero**, exploiting the fact that only differences matter; negative priorities then encode phonemes that *defer* an articulatory decision to their neighbors (/h/, voiced fricatives). *(p.456)*
- **Give /s/ and /l/ opposite-signed cross-section targets** so that the even saturation function automatically inserts homorganic /t/ or /d/ on the transition. *(p.452)*
- **Use consonantal constriction variables as interpolation factors rather than as coordinates**, so the system stays linear-with-variable-coefficients instead of genuinely nonlinear. *(p.455)*
- **One-dimensional allophonic control digit with per-phoneme incremental factors and pointers**, so a single scalar from the phonetic input can drive heterogeneous per-phoneme target and priority modifications. *(p.458)*

## Testable Properties
- The number of dynamically active articulatory modes in English is **≤ ~10**; vocal-tract shapes are approximated closely by **7-10 degrees of freedom**. *(p.453)*
- $A' = (A + \sqrt{A^2 + 4C^2})/2$ is **even in C**, so $\pm C$ give the same area — required for the /s/-/l/ sign trick. *(p.452)*
- Lip closure has a component due to rounding, but **rounding has no component due to closure** (asymmetric coupling). *(p.454)*
- Tongue-body transition time must be **~150 ms** for non-tongue-body-consonant transitions and **~80 ms** for vertical motion in tongue-body consonants. *(pp.454-455)*
- With a target overshooting closure by 10 %, at the phoneme boundary the closing transient is **90 % complete** and the releasing transient **10 % complete**. *(p.456)*
- Priority-derived timing offsets are **~40 % of each articulator's rise time**, in both anticipatory and carryover directions. *(p.456)*
- Adding a constant to all priorities of a given articulator leaves output unchanged (invariance under additive constant). *(p.456)*
- /g/ preceded by a front vowel ⇒ initial horizontal priority **+50 ms**; preceded by a back vowel ⇒ **-50 ms**; symmetric rule on the following vowel for the final priority. *(p.457)*
- Devoicing time of /t/ is monotonically ordered: word/stress-initial (60-70 ms) > word-medial nonstressed (~40 ms) > final (0-20 ms). *(p.457)*
- Vowel portions adjacent to a stressed consonant are **2-4 dB louder** than the rest of the vowel. *(p.457)*
- $F_1^2 \propto (\text{cavity volume} \times \text{constriction area}) + \text{const}$ for a constricted tract. *(p.454)*
- At the Nth formant resonance, pressure peaks at the glottis and there are exactly **N zero crossings** of P along the tract, one exactly at the lips. *(p.458)*
- Corrected $F_1 = \sqrt{F_1^2 + F_0^2}$ with $F_0 \approx 200$ Hz; formants constrained to **≥175 Hz** separation. *(pp.458-459)*
- Strongly initial nasals **do not nasalize the preceding vowel** and begin with murmur characteristics like their place-cognate voiced stops. *(p.458)*
- Initial /r/ is strongly rounded relative to /w/; final /r/ is nonrounded relative to /ɚ/. *(p.458)*
- Final /l/ has a tongue-body target almost as far back as /a/; initial /l/ is relatively palatal. *(p.458)*

## Relevance to Project
Qlatt is a Klatt-lineage formant synthesizer with a rule-driven front end, so this paper is relevant on three separate axes:

1. **Timing/coarticulation model.** The priority mechanism is a compact, implementable alternative to per-parameter transition tables: two numbers (approach, leave) per phoneme per parameter, plus a per-parameter response-filter delay, plus the boundary time. Equations 11-12 are directly codable and the 10 %-overshoot / 90 %-complete rule gives a concrete calibration target. This is the same problem Qlatt's parameter-track interpolation solves, but with an explicit account of *why* closure timing must lead or lag the segment boundary.
2. **Allophonic control as a scalar.** The 0-9 control digit translated to a -1..1 coefficient, multiplied by per-phoneme incremental factors with pointers to target variables and priorities, is a clean design for a stress/boundary-sensitive allophone layer that does not require enumerating allophones.
3. **Numbers usable directly in a formant synthesizer.** /t/ devoicing times by position, the 2-4 dB stressed-consonant-adjacent vowel boost, the 175 Hz minimum formant separation, the ~200 Hz yielding-wall F1 floor, Dunn bandwidth lookup, and the F1 correction transformation are all applicable to a Klatt-style parameter generator regardless of whether the geometry is articulatory.

The articulatory geometry itself (Sections II-III) is *not* directly transplantable to a formant synthesizer, but Section III-F's acoustic identification heuristics (F1 with forward tongue motion when unconstricted; front cavity → the lower of the constriction-split pair; F1 as a Helmholtz resonance) are a useful sanity check for formant-target tables.

## Open Questions
- [ ] What are the actual numeric priority values per phoneme per articulator? The paper describes the mechanism and gives only the /g/ ±50 ms case and the ~40 %-of-rise-time magnitude. The tables are presumably in the Coker/Umeda/Browman system papers [20],[21] or Umeda [13].
- [ ] What are the actual entries of $D$ and $P$? Only the estimation procedure is given, never the matrices.
- [ ] The paper's Eq. 16 is printed with $F_1$ on both sides; confirm the intended reading (corrected vs hard-walled) against Sondhi [18].
- [ ] The text cites "(17)" for the iterated recursion but the paper's numbered equations stop at (16); (15) is the recursion. Confirm whether an equation was dropped in typesetting.
- [ ] Eq. 14's subscripts as scanned are internally inconsistent with Eq. 15; verify against a cleaner copy.
- [ ] Which of the ~10 modes correspond to which articulators, and what are their pole frequencies? Only the two tongue-body speeds (150/80 ms) are given numerically.
- [ ] How is the "continuously adjustable degree of boundary" quantified and how does it map to the allophonic control digit? *(p.457)*

## Related Work Worth Reading
- **Houde 1967 [8]** — "A study of tongue body motion during selected speech sounds", PhD, Univ. Michigan. The empirical backbone: linearity evidence, the two tongue-body speeds, and the /g/ X-ray data of Fig. 7.
- **Umeda 1976 [13]** — "Linguistic rules for text-to-speech synthesis", *this same issue*, pp. 443-451. The companion rule system that supplies durations and phonological conditions. Likely holds the numeric tables absent here.
- **Umeda & Coker 1974 [14]** — "Allophonic variation in American English", *J. Phonetics* 2-5, pp. 1-5. Source of the /t/ devoicing figures.
- **Coker, Umeda & Browman 1973 [21]** — "Automatic synthesis from ordinary English text", *IEEE Trans. Audio Electroacoust.* AU-21, pp. 293-298. The full TTS system. **Already in this collection as `Coker_1973_AutomaticSynthesisOrdinaryEnglish`.**
- **Flanagan, Ishizaka & Shipley 1975 [16]** — "Synthesis of speech from a dynamic model of the vocal cords and vocal tracts", *BSTJ* 54, pp. 485-506. The direct articulatory synthesis back end.
- **Coker & Umeda 1975 [15]** — "The importance of spectral detail in initial-final contrasts of voiced stops", *J. Phonetics* 3-1, pp. 63-68. Source of the harmonic-tilt account of initial voiced stops.
- **Sondhi 1974 [18]** — "Model for wave propagation in a lossy vocal tract", *JASA* 55, pp. 1070-1075. Source of the ~200 Hz yielding-wall constant.
- **Dunn 1961 [19]** — "Methods of measuring vowel formant bandwidths", *JASA* 33, pp. 1737-1746. The bandwidth table.
- **Öhman 1966 [5]** — "Numerical models of coarticulation", *JASA* 41, pp. 310-320.
- **Rabiner, Jackson, Schafer & Coker 1971 [17]** — "A hardware realization of a digital formant synthesizer", *IEEE Trans. Commun. Technol.* COM-19, pp. 1016-1020. The synthesizer driven by method 2.

## Collection Cross-References

### Already in Collection
- [Coker, Umeda, Browman (1973) — Automatic Synthesis from Ordinary English Text](../Coker_1973_AutomaticSynthesisOrdinaryEnglish/notes.md) - cited as [21], the full text-to-speech chain this articulatory/dynamics model plugs into; predates this paper so has no reciprocal forward citation, but is annotated below with a "Cited By" pointer.

### New Leads (Not Yet in Collection)
- Umeda (1976) - "Linguistic rules for text-to-speech synthesis" - companion paper in the same *Proceedings of the IEEE* issue, likely holds the numeric priority/duration tables this paper omits.
- Umeda & Coker (1974) - "Allophonic variation in American English" - direct source of the /t/ devoicing times reused here.
- Coker & Umeda (1975) - "The importance of spectral detail in initial-final contrasts of voiced stops" - source of the harmonic-tilt account of initial voiced stops.
- Flanagan, Ishizaka & Shipley (1975) - "Synthesis of speech from a dynamic model of the vocal cords and vocal tracts" (*BSTJ* 54) - the direct articulatory-to-acoustic back end (Method 1) this paper drives; distinct from the collection's `Ishizaka_1972_TwoMassModelVocalCords`, which is the earlier two-mass source model this 1975 system builds on.
- Sondhi (1974) - "Model for wave propagation in a lossy vocal tract" - source of the ~200 Hz yielding-wall constant used in the F1 correction.
- Dunn (1961) - "Methods of measuring vowel formant bandwidths" - the bandwidth lookup table used in formant synthesis.
- Rabiner, Jackson, Schafer & Coker (1971) - "A hardware realization of a digital formant synthesizer" - the synthesizer driven by Method 2 (formant-control path); not the same paper as the collection's `Rabiner_1968_DigitalFormantSynthesizer`, which is an earlier, separate Rabiner synthesizer paper.

### Cited By (in Collection)
- [Coker, Umeda, Browman (1973) — Automatic Synthesis from Ordinary English Text](../Coker_1973_AutomaticSynthesisOrdinaryEnglish/notes.md) - the 1973 TTS system predates this paper and cannot cite it; listed here only as the reciprocal side of the "Already in Collection" entry above.
- [Byrd (2003) — Elastic Phrase-Boundary Lengthening](../Byrd_2003_ElasticPhraseBoundaryLengthening/notes.md) - cites this paper's reference list entry for the articulatory dynamics model.
- [Carlson (1995) — Models of Speech Synthesis](../Carlson_1995_ModelsOfSpeechSynthesis/notes.md) - lists Coker among the key articulatory-synthesis models surveyed.
- [Chappell & Hansen (2002) — Spectral Smoothing for Segment Synthesis](../Chappell_Hansen_2002_SpectralSmoothingSegmentSynthesis/notes.md) - cites this paper's articulatory dynamics model in its reference list.
- [Hertz (1985) — The Delta Rule Development System](../Hertz_1985_DeltaRuleSystem/notes.md) - lists this paper under synthesis approaches; see-also and lead-list annotation added below.
- [Kaburagi (2007) — Vocal-Tract Spectrum from Articulatory Movements](../Kaburagi_2007_VocalTractSpectrum/notes.md) - cites this paper as an early articulatory dynamics/trajectory-timing model; see-also and lead-list annotation added below.

### Conceptual Links (not citation-based)
- [Browman & Goldstein (1989) — Articulatory Gestures as Phonological Units](../Browman_1989_ArticulatoryGesturesPhonologicalUnits/notes.md) - both papers explain coarticulation as a timing phenomenon between independently-scheduled articulator movements rather than a spatial-target phenomenon: Coker's per-phoneme lead/lag priority offsets and Browman & Goldstein's inter-gestural overlap in a gestural score are different formalisms (engineering timing correction vs. task-dynamics phonological primitive) converging on the same mechanism.
- [Birkholz (2013) — Modeling Consonant-Vowel Coarticulation for Articulatory Speech Synthesis](../Birkholz_2013_ModelingConsonant-VowelCoarticulationArticulatory/notes.md) - both solve coarticulation for articulatory synthesis but with opposite strategies: Coker keeps fixed per-phoneme targets and varies *when* each articulator moves toward them (priority timing), while Birkholz keeps timing simple and varies the *target itself* via context-weighted interpolation between corner-vowel reference shapes.
- Öhman's VCV coarticulation work is represented in the collection by [Öhman (1966) — Coarticulation in VCV Utterances: Spectrographic Measurements](../Ohman_1966_CoarticulationVCV/notes.md), a distinct 1966 paper (*JASA* 39:151-168) from the "Numerical models of coarticulation" (*JASA* 41:310-320) cited here as [5]; both address vowel-consonant-vowel coarticulation timing and are relevant to the same priority/coarticulation question this paper's Section IV addresses.
