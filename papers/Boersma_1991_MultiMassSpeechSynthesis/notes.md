---
title: "Synthesis of Speech Sounds from a Multi-Mass Model of the Lungs, Vocal Tract, and Glottis"
authors: "Paul Boersma"
year: 1991
venue: "Institute of Phonetic Sciences, University of Amsterdam, Proceedings 15"
pages: "79-108"
doi_url: ""
---

# Synthesis of Speech Sounds from a Multi-Mass Model of the Lungs, Vocal Tract, and Glottis

## One-Sentence Summary
A complete, fully specified articulatory speech synthesizer in which the entire vocal apparatus (lungs, bronchi, trachea, glottis, larynx, pharynx, velum, palate, apex, lips) is a chain of straight tubes whose walls are *all* mass-spring systems, driven by 1-D aerodynamic equations with turbulence, collision, and time-varying tube lengths, so that source-filter interaction, voicing contrasts, and consonants emerge from the physics rather than being imposed. *(p.79)*

## Problem Addressed
Existing vocal-tract models privilege the vocal cords as the only mass-spring element and treat the supraglottal tract as a passive rigid or lightly yielding filter, with the lungs as an ideal pressure source. That makes source-filter interaction ad hoc and makes consonants (especially voicing contrasts in obstruents, trills, and fricatives) hard to generate from articulation. Boersma generalizes the two-mass cord model to *every* tube wall in the tract and to the lungs, and allows tube lengths to vary in time. *(p.79-80)*

## Key Contributions
- Every tube wall in the whole apparatus is a coupled mass-spring system, not just the vocal cords, so any articulator (tongue tip, velum, lips) can vibrate and produce trills without special-casing. *(p.80)*
- Lungs modelled as a finite-capacity volume whose neutral width is reduced by expiration, not as an ideal pressure source. *(p.79-80)*
- Time-varying tube lengths Δx, which model lip rounding/spreading, larynx raising/lowering, and dorsal constriction. *(p.80, p.90)*
- A smooth, differentiable "zipper" collision model for wall contact with a leakage term w_min that keeps the aerodynamics well-behaved through closure. *(p.82-83)*
- A turbulence-noise model tied to a critical particle velocity and the area ratio of the constriction, generating frication and aspiration directly. *(p.88)*
- A complete, published parameter set for three model speakers (woman, man, child). *(p.90-91)*
- Input format restricted to the last stage of articulatory synthesis: a list of time-target pairs per articulator plus a speaker table. *(p.79)*

## Methodology
The vocal apparatus is a straightened one-dimensional chain of straight tubes containing air (Fig. 1, p.80). Each tube has two opposing walls along the y-axis, each wall a mass on a linear-plus-cubic spring with damping, and optionally coupled by springs to the corresponding walls of adjacent tubes. Air is driven by 1-D continuity, fluid-motion (Navier-Stokes reduced), and adiabatic state equations. Sound radiates from the rightmost (lip) boundary; the moving masses also radiate. The model has no nasal tract. *(p.79-80)*

Tubes need not be equal in length: the upper glottis may be 1 mm thick while the pharynx spans centimetres, though the implementation subdivides large regions into tubes of roughly 10 mm for computational reasons (correct simulation of short wavelengths requires tubes not much smaller than 1 cm). *(p.80, p.89)*

Wall oscillation is not privileged: walls of any tube oscillate if close enough together with sufficient air flow along them, which follows automatically from the aerodynamic and myo-elastic equations. Noise is generated immediately downstream of a constriction when particle velocity exceeds a threshold; the fraction of kinetic energy converted to turbulence depends on the relative widths of both tubes involved. *(p.80)*

## Key Equations / Statistical Models

### 2. The springs and the masses

$$
m \frac{d^2 w}{dt^2} = \text{total force} = \text{tension force} + \text{damping force} + \text{air pressure force}
$$
Where: $m$ = mass of either wall (kg); $w$ = distance between the two walls (m). The acceleration of the walls in the y-direction is given by the total force on the two walls, which is twice the force on either wall. $m$ need not be constant: it is the part of the wall that actually moves and may slowly vary in time as a function of wall tension.
*(p.81)*

$$
\text{tension force} = k^{(1)} (w_{eq} - w) + k^{(3)} (w_{eq} - w)^3
$$
Where: $k^{(1)}$ = linear spring "constant" (N/m) of either spring, a function of muscle activity; $w_{eq}$ = equilibrium distance between the walls, adjustable by articulatory muscles (posterior crico-arytenoid activity increases $w_{eq}$ in the glottis, risorius does the same for the lips, expiration is equivalent to reducing $w_{eq}$ in the lungs); $k^{(3)}$ = one quarter of the cubic spring constant (N/m³) of either spring. Valid when the walls are not in contact. The tension force is due to muscles inside the wall (vocalis, pharyngeal constrictors) and muscles pulling the edges of the wall (cricothyroid).
*(p.81)*

$$
\text{damping force} = - B_{open} \frac{dw}{dt}
$$
Where: $B_{open}$ = damping (kg/s) of either spring, depending on tissue properties and dynamically also on $k^{(1)}$, $k^{(3)}$, and $m$. Due to internal friction in the tissue; tries to bring wall velocity to zero.
*(p.82)*

$$
\text{air pressure force} = 2 P \Delta x \Delta z
$$
Where: $P$ = mean air pressure inside the tube (relative to atmospheric); $\Delta x$ = tube length; $\Delta z$ = third dimension ("breadth") of the tube, so $\Delta x \Delta z$ is the wall area. Factor 2 because there are two walls. Positive $P$ pushes walls apart, negative pulls them together.
*(p.82)*

Full equation of motion including collision:

$$
m \frac{d^2 w}{dt^2} = k^{(1)} (w_{eq} - w) + k^{(3)} (w_{eq} - w)^3 + F_s^{(1)} + F_s^{(3)} - (B_{open} + B_{closed}) \frac{dw}{dt} + 2 P \Delta x \Delta z
$$
Where: $F_s^{(1)}$, $F_s^{(3)}$ = stiffness forces (N) representing the reaction of the tissue against being pressed together; $B_{closed}$ = damping inside the compressed tissue.
*(p.82)*

Because the masses are not exactly parallel, collision is not simultaneous along the z-axis: the walls close upon one another like a zipper (Fig. 3). Linear stiffness force from average penetration depth over the whole width Δz:

$$
F_s^{(1)} = \begin{cases} 0 & \text{for } w \geq \Delta w \\[4pt] \dfrac{s^{(1)} (\Delta w - w)^2}{4 \Delta w} & \text{for } -\Delta w \leq w \leq \Delta w \\[4pt] - s^{(1)} w & \text{for } w \leq -\Delta w \end{cases}
$$
Where: $s^{(1)}$ = linear spring constant of the tissue stiffness; $\Delta w$ = the "zipperiness", the wall non-parallelism scale.
*(p.82)*

Cubic part, from the average cubed depth:

$$
F_s^{(3)} = \begin{cases} 0 & \text{for } w \geq \Delta w \\[4pt] \dfrac{s^{(3)} (\Delta w - w)^4}{8 \Delta w} & \text{for } -\Delta w \leq w \leq \Delta w \\[4pt] - s^{(3)} w (w^2 + \Delta w^2) & \text{for } w \leq -\Delta w \end{cases}
$$
Where: $s^{(3)}$ = one quarter of the cubic spring constant of the tissue stiffness. Both $F_s^{(1)}$ and $F_s^{(3)}$ are smooth functions of $w$: differentiable at $-\Delta w$ and at $\Delta w$.
*(p.82-83)*

Coupling stiffness when the walls of tube $m$ are connected to those of adjacent tubes $m{-}1$ and $m{+}1$ (this term is *added* to the tension forces):

$$
k^{(1)}_{m-1,m} (w_{m-1} - w_m) + k^{(3)}_{m-1,m} (w_{m-1} - w_m)^3 + k^{(1)}_{m,m+1} (w_{m+1} - w_m) + k^{(3)}_{m,m+1} (w_{m+1} - w_m)^3
$$
*(p.83)*

Cross section $A$ as a smooth function of $w$, with leakage $w_{min}$ (again differentiable at $-\Delta w$ and $\Delta w$):

$$
A = \begin{cases} (w + w_{min}) \Delta z & \text{for } w \geq \Delta w \\[4pt] \left( \dfrac{(\Delta w + w)^2}{4 \Delta w} + w_{min} \right) \Delta z & \text{for } -\Delta w \leq w \leq \Delta w \\[4pt] w_{min} \Delta z & \text{for } w \leq -\Delta w \end{cases}
$$
Where: $w_{min}$ = a very small leakage allowed through every tube. Rationale: very small values of $A$ (which appear as $w$ approaches $-\Delta w$) make very high positive or negative pressures arise immediately before or after contact, i.e. unrealistic aerodynamics. A good value for $w_{min}$ is 0.01 mm; then the relative changes in $A$ during a sampling period are not too large (if $\Delta w \geq w_{min}$), while the amount of air leaking through the orifice is negligible because of the large viscous resistance. In Fig. 3 the mean distance $w$ between the masses can even become negative; $A$ stays positive as long as $w > -\Delta w$.
*(p.83)*

### 3. Air flows and pressures

Continuity of mass, 3-D (Landau & Lifshitz 1953):

$$
\frac{\partial \rho}{\partial t} + \operatorname{div}(\rho \mathbf{v}) = 0
$$
Where: $\rho(\mathbf{x},t)$ = mass density (kg/m³); $\mathbf{v}(\mathbf{x},t)$ = particle velocity (m/s). A "particle" is an infinitesimally small piece of fluid supposed nonetheless to contain infinitely many molecules.
*(p.84)*

1-D rigid straight tube ($v_y = v_z = 0$):

$$
\frac{\partial \rho}{\partial t} + \frac{\partial (\rho v)}{\partial x} = 0
$$
Where: $v$ = signed velocity in the x-direction averaged over all y- and z-coordinates inside the tube.
*(p.84)*

Straight tube with moving walls, time-varying cross section $A(t)$ (m²) — here $v_y$, $v_z$ are not zero but the form stays simple:

$$
\frac{\partial (\rho A)}{\partial t} + \frac{\partial (\rho v A)}{\partial x} = 0
$$
It is of crucial importance that $A$ is *inside* the parentheses. For an incompressible fluid this reduces to $\partial A/\partial t + \partial(vA)/\partial x = 0$, which correctly states that an incompressible fluid flows out of any shrinking tube. Flanagan & Ishizaka (1977) show this effect is negligible for vocal-cord vibration, but it probably cannot be neglected for lung-volume changes and for supralaryngeal tension variations that partly cause voicing contrasts in obstruents.
*(p.84)*

Tube boundaries also moving in the x-direction (tube lengthening/shortening), approximately:

$$
\frac{\partial (\rho A \Delta x)}{\partial t} + (\rho v A)_{\text{right}} - (\rho v A)_{\text{left}} = 0
$$
Where: $\Delta x$ = tube length; $v$ = particle velocity *relative to the velocity of the left or right boundary*.
*(p.85)*

Equation of fluid motion, 3-D:

$$
\rho \frac{d\mathbf{v}}{dt} = -\operatorname{grad} P + \mu \Delta \mathbf{v}
$$
Where: $P(\mathbf{x},t)$ = pressure (N/m²); $\mu$ = coefficient of shear viscosity, given in the paper as $1.86 \cdot 10^5$ Ns/m² for air (this is a typographical sign error; the physical value is $1.86 \cdot 10^{-5}$ Ns/m²); $\Delta$ = Laplace operator.
*(p.85)*

Navier-Stokes in three dimensions:

$$
-\operatorname{grad} P = \rho \frac{d\mathbf{v}}{dt} - \mu \Delta \mathbf{v} = \rho \left( \frac{\partial \mathbf{v}}{\partial t} + \tfrac{1}{2} \operatorname{grad} v^2 - \mathbf{v} \times \operatorname{curl} \mathbf{v} \right) - \mu \Delta \mathbf{v}
$$
*(p.85)*

Inside a straight tube, neglecting $v_y$ and $v_z$:

$$
\rho \frac{\partial v_x}{\partial t} = - \frac{\partial P}{\partial x} - \rho v_x \frac{\partial v_x}{\partial x} + \mu \Delta v_x
$$
*(p.85)*

Viscous resistance of a tube shaped as in Fig. 3, from the boundary condition $v_x = 0$ on the walls, for $\Delta w \ll \Delta z$, in the stationary-flow approximation:

$$
R_{visc} = \frac{-\mu \Delta v_x}{v} = -\frac{\mu}{v} \frac{\partial^2 v_x}{\partial y^2} = \begin{cases} \dfrac{12\mu}{w^2 + \Delta w^2 + w_{min}^2} & \text{for } w \geq \Delta w \\[6pt] \dfrac{12\mu}{\tfrac{1}{2}(\Delta w + w)^2 + w_{min}^2} & \text{for } -\Delta w \leq w \leq \Delta w \\[6pt] \dfrac{12\mu}{w_{min}^2} & \text{for } w \leq -\Delta w \end{cases}
$$
Where: $v$ is $v_x$ averaged over all $y$ between the plates.
*(p.85)*

All resistances subsumed under one term $Rv$:

$$
\rho \frac{\partial v}{\partial t} + \frac{\partial P}{\partial x} + \rho v \frac{\partial v}{\partial x} + R v = 0
$$
One such resistance is due to turbulent noise (section 3.6).
*(p.85)*

Adiabatic pressure law (equation of state), assuming processes swift enough to neglect heat conduction, temperatures varying with material pressure, and no heat exchange between particles:

$$
\frac{P}{P_0} = \left( \frac{\rho}{\rho_0} \right)^{\gamma}
$$
Where: $P_0$, $\rho_0$ = reference pressure and density; $\gamma$ = constant of the fluid, approximately 1.4 for a diatomic gas like air.
*(p.86)*

Choosing $P_0 = P_{atm}$, $\rho_0 = \rho_{atm}$ (no flow, no temperature gradient), a differential pressure change is:

$$
dP = P_{atm} \gamma \frac{d\rho}{\rho_{atm}} \equiv c^2 d\rho
$$
Where: $c$ = velocity of sound, depending only on temperature and mean pressure, computed as 353 m/s for $P_{atm} = 1.013 \cdot 10^5$ N/m² and $\rho_{atm} = 1.14$ kg/m³.
*(p.86)*

From here on $P$ is the difference between the real pressure and atmospheric pressure, so for small pressures:

$$
P = c^2 (\rho - \rho_{atm}), \qquad dP = c^2 d\rho
$$
*(p.86)*

Mass flow (continuous at tube boundaries), a vector in kg/s:

$$
J \equiv \rho v A
$$
On the boundary between two tubes of different area most quantities are discontinuous: particle velocity suddenly increases entering a narrower tube, pressure suddenly drops (Bernoulli), and density drops as a consequence. Mass flow is continuous because the air leaving a tube must enter the adjacent tube with no matter lost.
*(p.86)*

Continuous pressure $Q$ (N/m²), defined implicitly from conservation of energy flow, valid if the flow stays laminar crossing the boundary so the particle keeps moving in the x-direction:

$$
dQ \equiv dP + \tfrac{1}{2} \rho \, d(v^2)
$$
Thus $\Delta Q = 0$ over tube boundaries. This equation expresses conservation of the sum of a potential-energy term $dP$ and a kinetic-energy term $\tfrac{1}{2}\rho \, d(v^2)$. Bernoulli's law states $dQ = 0$ for stationary, inviscid, non-turbulent flow.
*(p.87)*

$$
Q \approx P + \tfrac{1}{2} \rho v^2
$$
To a good approximation: 1% error in $\tfrac{1}{2}\rho v^2$ if $v < 0.2c$.
*(p.87)*

The third quantity that is continuous in the hydrodynamics of unbounded fluids, the flow of momentum $\rho v$, is *not* continuous here: at tube boundaries the air transfers momentum to the vertical walls and vice versa.
*(p.87)*

The three 1-D aerodynamic equations in the continuous quantities $J$ and $Q$ (which are exactly the ones appearing in the divergence and gradient parts):

$$
\frac{\partial (\rho A)}{\partial t} + \frac{\partial J}{\partial x} = 0
$$

$$
\rho \frac{\partial v}{\partial t} + \frac{\partial Q}{\partial x} + R v = 0
$$

$$
dP = c^2 d\rho
$$
*(p.87)*

### 3.5 Boundary conditions

Leftmost (closed lung) boundary — no air flows into the lungs from the bottom:

$$
J = 0
$$
*(p.87)*

Rightmost (lip radiation) boundary, for a round orifice (Sondhi & Resnick, 1983):

$$
\frac{\partial Q}{\partial t} - \frac{\partial \left( \dfrac{cJ}{A_{lip}} \right)}{\partial t} + \frac{Qc}{a_{lip}} = 0
$$
Where: $a_{lip}$ = radius of the lip opening, taken constant at 2 cm in order not to attain unrealistically low damping values for small lip openings. Radiation damping is still smaller for small openings than for large ones, because of the $A_{lip}$ factor. At $t = 0$ all flows and pressures vanish.
*(p.87)*

### 3.6 Turbulence

Turbulent air movements are generated when air with velocity greater than a critical velocity $v_{crit}$ flows out of a narrower tube with cross section $A_<$ into a tube with larger cross section $A_>$. Energy loss as a pressure drop:

$$
Q_{turb} = \tfrac{1}{2} \rho v \, (|v| - v_{crit}) \left( 1 - \frac{A_<}{A_>} \right)^2
$$
In reality this is not a pressure drop but a failure to completely recover from the Bernoulli pressure drop $\tfrac{1}{2}\rho v^2$. Equation (21) accords with equation (6) of Ishizaka & Flanagan (1972), which describes pressure recovery if $v_{crit} = 0$.
*(p.88)*

Extra resistance term added to the fluid-motion equation:

$$
R_{turb} \, v = \frac{Q_{turb}}{\Delta x}
$$
Where: $\Delta x$ = length of the tube section.
*(p.88)*

Noise pressure added to the pressure at the boundary between sections, assuming the acoustic energy is translated into low-pass Gaussian noise with cut-off frequency $f_{cutoff}$:

$$
Q_{noise}(t) = (1 - 2\pi f_{cutoff} \, dt) \, Q_{noise}(t - dt) + \sqrt{\frac{1 - (1 - 2\pi f_{cutoff} \, dt)^2}{3}} \; Q_{turb}(t) \, \mathbf{N}(t)
$$
Where: $\mathbf{N}(t)$ = Gaussian white noise of unit power. The factor 1/3 comes from the reasoning that turbulence converts x-direction kinetic energy into chaotic particle movements of the same kinetic energy, one third of which is again in the x-direction. In Boersma's implementation a frequency cut-off arises automatically as a side-effect of the integration method: if the longest tubes are about 1 cm long, the integration cut-off frequency is just above 6 kHz, so the only noise pressure remaining to be added to the continuous pressure is the *second* term of equation (23).
*(p.88)*

### 4. Articulatory parameters and their time evolution

Linear interpolation between nearest specified targets:

$$
k(t) = k_1 + \frac{t - t_1}{t_2 - t_1} (k_2 - k_1)
$$
Where: $k_1$ at time $t_1$, $k_2$ at time $t_2$, with no specification in between.
*(p.89)*

### 5. Speaker characteristics

Tube length from the relative-length articulatory parameter:

$$
\Delta x = \Delta x_{rel} \, \Delta x_{eq}
$$
*(p.90)*

Muscle contraction decreases the mass of the vibrating wall part and increases its tension:

$$
m = \frac{m_{eq}}{k_{rel}}, \qquad k^{(1)} = k^{(1)}_{eq} \, k_{rel}
$$
Where: $k_{rel}$ = dimensionless relative tension (Flanagan & Landgraf 1968; Ishizaka & Flanagan 1972). For the vocal cords this is made greater than 1 by the combined efforts of the cricothyroid muscle (pulling the cords from outside) and the vocalis muscle (contracting them from within).
*(p.91)*

Free-oscillation frequency for small displacements is therefore proportional to $k_{rel}$:

$$
f \approx \frac{1}{2\pi} \sqrt{\frac{k^{(1)}}{m}} = \frac{k_{rel}}{2\pi} \sqrt{\frac{k^{(1)}_{eq}}{m_{eq}}}
$$
*(p.91)*

Cubic spring constant:

$$
k^{(3)} = k^{(1)}_{eq} \left( \frac{10}{\Delta z} \right)^2
$$
which means that for a relative tension $k_{rel} = 1$, the distance where the third-power force equals the linear force is $\Delta z / 10$. For pharynx, velum and palate the $\Delta z$ in this equation is *doubled*, because of the different attachment of the muscles in the cheeks.
*(p.91)*

Linear tissue stiffness, proportional to the equilibrium area of the wall:

$$
s^{(1)} = (5 \cdot 10^{6}\ \text{N/m}^5) \, \Delta x_{eq} \, \Delta z
$$
*(p.91)*

Cubic tissue stiffness constant:

$$
s^{(3)} = \frac{s^{(1)}}{(0.9\ \text{mm})^2}
$$
*(p.92)*

Coupling springs within a region: if tissue tension is isotropic, the coupling-spring *linear* constants within a region are approximately the average of $\tfrac{1}{2}(\Delta z / 2 \Delta x_{eq})$ times the linear spring constants of the separate masses; the coupling *cubic* constants approximately equal the averages of $\left[\tfrac{1}{2}(\Delta z / 2 \Delta x_{eq})\right]^3$ times those of the separate masses. No couplings exist *between* regions of the tract, except between the two parts of the glottis (see Table 2). *(p.92)*

### 5.3 Damping

Critical damping for small displacements (does not depend on $k_{rel}$, from eq. 26):

$$
B_{open,crit} = 2 \sqrt{k \, m} \approx 2 \sqrt{k_{eq} \, m_{eq}}
$$
*(p.92)*

Boersma prefers damping constant relative to the *true* critical damping, which involves the cubic spring constants as well; otherwise relaxation times of the oscillations would be longer in the cubic-force region than in the linear-force region, instead of the other way around:

$$
B_{open,crit} = 2 \sqrt{k_{eff} \, m}
$$
*(p.92)*

Effective spring constant:

$$
k_{eff} = - \frac{\partial (\text{tension force})}{\partial w} = k^{(1)} + 3 k^{(3)} (w_{eq} - w)^2
$$
*(p.92)*

Damping ratios in Table 2 are relative to this critical damping:

$$
B_{open} = B_{rel} \, B_{open,crit}
$$
*(p.92)*

Damping of the compressed tissue is chosen to be critical:

$$
B_{closed} = B_{closed,crit} = 2 \sqrt{s_{eff} \, m_{eff}}
$$
*(p.92)*

Effective mass, i.e. the mass of the wall that is in contact with its counterpart:

$$
m_{eff} = \begin{cases} 0 & \text{for } w \geq \Delta w \\[4pt] m \dfrac{\Delta w - w}{2 \Delta w} & \text{for } -\Delta w \leq w \leq \Delta w \\[4pt] m & \text{for } w \leq -\Delta w \end{cases}
$$
*(p.92)*

Effective stiffness:

$$
s_{eff} = \begin{cases} 0 & \text{for } w \geq \Delta w \\[4pt] \dfrac{\Delta w - w}{2 \Delta w} \left( s^{(1)} + s^{(3)} (\Delta w - w)^2 \right) & \text{for } -\Delta w \leq w \leq \Delta w \\[4pt] s^{(1)} + s^{(3)} (3 w^2 + \Delta w^2) & \text{for } w \leq -\Delta w \end{cases}
$$
If some tissue should be able to vibrate, the open-damping ratio must be appreciably smaller than 1. Flanagan & Landgraf (1968) use a damping factor of 0 for the vocal cords in an open glottis; Ishizaka & Flanagan (1972) use 0.1 and 0.6 for the lower and upper glottis respectively.
*(p.93)*

### 5.4 Viscosity

Viscous resistance is basically computed from equation (12). This cannot be correct for the lung region, which is subdivided into many "parallel" branches. For the lung region the viscosity is therefore multiplied by:

$$
1 + \frac{\Delta x_{lungs} - x}{\Delta x_{lungs}} (\textit{parallel subdivision} - 1)
$$
Where: $\Delta x_{lungs}$ = total length of the lung region; $x$ = distance of the centre of each tube to the bottom of the lungs; *parallel subdivision* = a number chosen to be 1000.
*(p.93)*

### 6. Implementation

Output pressure at a given distance from the mouth, derived from the flow at the lips *and* from the vibrations of the walls:

$$
\text{output pressure} = \frac{1}{4 \pi \, \Delta t \, \textit{distance}} \left( J_M^{n+1} - J_M^{n} + \rho_{atm} \Delta x \Delta z \sum_{m=1}^{M} \left( \dot{w}_m^{n+1} - \dot{w}_m^{n} \right) \right)
$$
Where: $J_M$ = mass flow at the lip boundary; $M$ = total number of tubes; $\dot{w}_m$ = wall velocity of tube $m$; *distance* = distance from the mouth.
*(p.93)*

## Parameters

### Vocal-tract dimensions per region — Table 1 (values given as woman, man, child)

The tract is divided into 11 regions for a two-mass vocal-cord model (the adults) or 10 parts for a one-mass model (the child). Each region consists of several tubes whose lengths are not much more than 1 cm. *(p.90)*

| Name | Symbol | Units | Default (woman, man, child) | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Lungs: number of tubes | — | count | 23 | — | 90 | Same for all three speakers |
| Lungs: equilibrium tube length | Δx_eq | mm | 9, 10, 6 | — | 90 | |
| Lungs: third dimension | Δz | mm | 207, 230, 138 | — | 90 | |
| Lungs: zipperiness | Δw | mm | 0.01 | — | 90 | |
| Bronchi: number of tubes | — | count | 6 | — | 90 | |
| Bronchi: equilibrium tube length | Δx_eq | mm | 9, 10, 6 | — | 90 | |
| Bronchi: third dimension | Δz | mm | 28, 30, 19 | — | 90 | |
| Bronchi: zipperiness | Δw | mm | 0.01 | — | 90 | |
| Bronchi: equilibrium wall distance | w_eq | mm | 15 | — | 90 | Fixed, not muscle-adjustable |
| Trachea: number of tubes | — | count | 6 | — | 90 | |
| Trachea: equilibrium tube length | Δx_eq | mm | 9, 10, 6 | — | 90 | |
| Trachea: third dimension | Δz | mm | 15, 16, 10 | — | 90 | |
| Trachea: zipperiness | Δw | mm | 0.01 | — | 90 | |
| Trachea: equilibrium wall distance | w_eq | mm | 15 | — | 90 | Fixed |
| Lower glottis: number of tubes | — | count | 1 | — | 90 | |
| Lower glottis: equilibrium tube length | Δx_eq | mm | 1.4, 2, 1 | — | 90 | |
| Lower glottis: third dimension | Δz | mm | 10, 18, 6 | — | 90 | |
| Lower glottis: zipperiness | Δw | mm | 0.01 | — | 90 | |
| Upper glottis: number of tubes | — | count | 1, 1, 0 | — | 90 | Absent for the child (one-mass model) |
| Upper glottis: equilibrium tube length | Δx_eq | mm | 0.7, 1, — | — | 90 | |
| Upper glottis: third dimension | Δz | mm | 10, 18, — | — | 90 | |
| Upper glottis: zipperiness | Δw | mm | 0.01 | — | 90 | |
| Larynx: number of tubes | — | count | 2 | — | 90 | Upper part of larynx |
| Larynx: equilibrium tube length | Δx_eq | mm | 9, 10, 6 | — | 90 | |
| Larynx: third dimension | Δz | mm | 15, 16, 10 | — | 90 | |
| Larynx: zipperiness | Δw | mm | 0.01 | — | 90 | |
| Larynx: equilibrium wall distance | w_eq | mm | 15 | — | 90 | Fixed |
| Pharynx: number of tubes | — | count | 6, 6, 4 | — | 90 | Child's pharynx is relatively short |
| Pharynx: equilibrium tube length | Δx_eq | mm | 9, 10, 6 (±) | — | 90 | ± marks a time-varying length (larynx height) |
| Pharynx: third dimension | Δz | mm | 28, 30, 19 | — | 90 | |
| Pharynx: zipperiness | Δw | mm | 0.01 | — | 90 | |
| Velum: number of tubes | — | count | 3 | — | 90 | |
| Velum: equilibrium tube length | Δx_eq | mm | 9, 10, 6 (±) | — | 90 | ± time-varying in principle; neglected in this implementation |
| Velum: third dimension | Δz | mm | 28, 30, 19 | — | 90 | |
| Velum: zipperiness | Δw | mm | 0.01 | — | 90 | |
| Palate: number of tubes | — | count | 4 | — | 90 | |
| Palate: equilibrium tube length | Δx_eq | mm | 9, 10, 6 | — | 90 | |
| Palate: third dimension | Δz | mm | 28, 30, 19 | — | 90 | |
| Palate: zipperiness | Δw | mm | 0.01 | — | 90 | |
| Apex: number of tubes | — | count | 3 | — | 90 | |
| Apex: equilibrium tube length | Δx_eq | mm | 9, 10, 6 | — | 90 | |
| Apex: third dimension | Δz | mm | 28, 30, 19 | — | 90 | |
| Apex: zipperiness | Δw | mm | 0.01 | — | 90 | |
| Lips: number of tubes | — | count | 4 | — | 90 | |
| Lips: equilibrium tube length | Δx_eq | mm | 4.5, 5, 3 (±) | — | 90 | ± time-varying: rounding/spreading |
| Lips: third dimension | Δz | mm | 19, 20, 12 | — | 90 | |
| Lips: zipperiness | Δw | mm | 0.01 | — | 90 | |

### Wall properties per region — Table 2 (values given as woman, man, child)

| Name | Symbol | Units | Default (woman, man, child) | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Lungs: equilibrium mass of one tube | m_eq | g | 72, 80, 48 | — | 91 | |
| Lungs: equilibrium tension of one tube | k_eq^(1) | N/m | 200 | — | 91 | |
| Lungs: damping ratio | B/B_crit | — | 0.8 | — | 91 | |
| Lungs: relative coupling to next region | — | — | 0 | — | 91 | |
| Bronchi: equilibrium mass | m_eq | g | 9, 10, 6 | — | 91 | |
| Bronchi: equilibrium tension | k_eq^(1) | N/m | 40 | — | 91 | |
| Bronchi: damping ratio | B/B_crit | — | 0.8 | — | 91 | |
| Bronchi: relative coupling | — | — | 0 | — | 91 | |
| Trachea: equilibrium mass | m_eq | g | 4, 5, 3 | — | 91 | |
| Trachea: equilibrium tension | k_eq^(1) | N/m | 160 | — | 91 | |
| Trachea: damping ratio | B/B_crit | — | 0.8 | — | 91 | |
| Trachea: relative coupling | — | — | 0 | — | 91 | |
| Lower glottis: equilibrium mass | m_eq | g | 0.02, 0.1, 0.005 | — | 91 | |
| Lower glottis: equilibrium tension | k_eq^(1) | N/m | 10, 12, 8 | — | 91 | |
| Lower glottis: damping ratio | B/B_crit | — | 0.1 | — | 91 | Low so cords can vibrate |
| Lower glottis: relative coupling | — | — | 1 | — | 91 | The only nonzero inter-region coupling |
| Upper glottis: equilibrium mass | m_eq | g | 0.01, 0.05, — | — | 91 | Absent for the child |
| Upper glottis: equilibrium tension | k_eq^(1) | N/m | 4, 4, — | — | 91 | |
| Upper glottis: damping ratio | B/B_crit | — | 0.6 | — | 91 | |
| Upper glottis: relative coupling | — | — | 0 | — | 91 | |
| Larynx: equilibrium mass | m_eq | g | 4, 5, 3 | — | 91 | |
| Larynx: equilibrium tension | k_eq^(1) | N/m | 40 | — | 91 | |
| Larynx: damping ratio | B/B_crit | — | 0.8 | — | 91 | |
| Pharynx: equilibrium mass | m_eq | g | 9, 10, 6 | — | 91 | |
| Pharynx: equilibrium tension | k_eq^(1) | N/m | 40 | — | 91 | |
| Pharynx: damping ratio | B/B_crit | — | 0.8 | — | 91 | |
| Velum: equilibrium mass | m_eq | g | 9, 10, 6 | — | 91 | |
| Velum: equilibrium tension | k_eq^(1) | N/m | 40 | — | 91 | |
| Velum: damping ratio | B/B_crit | — | 0.3 | — | 91 | Low: velum can vibrate (uvular trill) |
| Palate: equilibrium mass | m_eq | g | 9, 10, 6 | — | 91 | |
| Palate: equilibrium tension | k_eq^(1) | N/m | 40 | — | 91 | |
| Palate: damping ratio | B/B_crit | — | 0.8 | — | 91 | |
| Apex: equilibrium mass | m_eq | g | 9, 10, 6 | — | 91 | |
| Apex: equilibrium tension | k_eq^(1) | N/m | 40 | — | 91 | |
| Apex: damping ratio | B/B_crit | — | 0.3 | — | 91 | Low: apex can trill |
| Lips: equilibrium mass | m_eq | g | 6, 6, 4 | — | 91 | |
| Lips: equilibrium tension | k_eq^(1) | N/m | 10 | — | 91 | |
| Lips: damping ratio | B/B_crit | — | 0.5 | — | 91 | |

### Global physical and numerical constants

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Velocity of sound | c | m/s | 353 | — | 86 | Computed from P_atm and ρ_atm below |
| Atmospheric pressure | P_atm | N/m² | 1.013e5 | — | 86 | |
| Atmospheric density | ρ_atm | kg/m³ | 1.14 | — | 86 | |
| Adiabatic constant | γ | — | 1.4 | — | 86 | Diatomic gas |
| Shear viscosity of air | μ | Ns/m² | 1.86e5 as printed | — | 85 | Printed sign is a typo; physical value is 1.86e-5 |
| Leakage | w_min | mm | 0.01 | — | 83, 90 | Same for all regions of all three model speakers |
| Critical velocity for turbulence | v_crit | m/s | 10 | — | 88, 90 | Same for all regions of all three speakers; from Van den Berg et al. (1957) |
| Critical volume velocity (source datum) | — | cm³/s | 200 | — | 88 | Van den Berg et al. (1957), for area 1.07 x 20 mm |
| Lip radiation radius | a_lip | cm | 2 | — | 87 | Held constant to avoid unrealistically low damping for small openings |
| Linear tissue stiffness coefficient | — | N/m⁵ | 5e6 | — | 91 | Multiplied by Δx_eq Δz to give s^(1) |
| Cubic-stiffness reference distance | — | mm | 0.9 | — | 92 | s^(3) = s^(1)/(0.9 mm)² |
| Cubic-spring reference length | — | mm | Δz/10 | — | 91 | Δz doubled for pharynx, velum, palate |
| Parallel subdivision of lungs | — | count | 1000 | — | 93 | Viscosity multiplier for the lung region |
| Noise cut-off frequency (implicit) | f_cutoff | kHz | just above 6 | — | 88 | Side-effect of the integration method for ~1 cm tubes |
| Max tube length for short-wavelength accuracy | Δx | cm | ~1 | not much smaller than 1 cm | 80, 89 | |
| Bernoulli approximation validity | v | — | v < 0.2 c | — | 87 | 1% error in ½ρv² |
| Turbulence loss at A_< = 0.1 A_> | — | — | 0.81 (Boersma) | 0.875 measured (Van den Berg), 1.19 (Ishizaka & Flanagan) | 88 | Relative to Bernoulli pressure |

### Resonance frequencies of the model speakers (Table 2 equilibrium values)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Lower-glottis equilibrium resonance, woman | f | Hz | 112.5 | — | 91 | |
| Lower-glottis equilibrium resonance, man | f | Hz | 55.1 | — | 91 | |
| Lower-glottis equilibrium resonance, child | f | Hz | 201.3 | — | 91 | |
| Upper-glottis equilibrium resonance, woman | f | Hz | 100.7 | — | 91 | |
| Upper-glottis equilibrium resonance, man | f | Hz | 45.0 | — | 91 | |

### Articulatory gestures used in the examples (male speaker)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Glottis rest width (modal phonation) | w_eq | mm | 1 | — | 94 | Figs. 5 and 7a |
| Vocal-cord relative tension (modal) | k_rel | — | 1.5 | — | 94 | |
| Lung equilibrium width, start | w_eq | mm | 100 | — | 94 | |
| Lung equilibrium width, after contraction | w_eq | mm | 90 | — | 94 | Reduced over the first 0.1 s |
| Lip equilibrium width, open | w_eq | mm | 40 | — | 94 | |
| Lip equilibrium width, closed | w_eq | mm | -10 | — | 94 | Negative: walls pressed together |
| Lip closing gesture interval | — | s | 0.1-0.2 | — | 94 | |
| Lip opening gesture interval | — | s | 0.3-0.4 | — | 94 | |
| Spread-glottis width (aspiration) | w_eq | mm | 4 | — | 96 | Fig. 7b |
| Constricted-glottis width (ejective) | w_eq | mm | -1 | — | 96 | Fig. 7d |
| Narrowed-glottis width (voiced closure) | w_eq | mm | 0 | — | 97 | Fig. 7c |
| Pharynx lengthening for implosive | Δx_rel | — | 1.3 | — | 97 | At 0.4 s relative to 0.2 s, Fig. 7h |
| Lung pressure, mid-utterance | P | cm H₂O | 5 falling to 3 | — | 95 | Between 0.3 and 0.5 s |
| Pharynx length change, stylohyoid contraction | — | % | -20 | — | 90 | |
| Pharynx length change, sternohyoid contraction | — | % | +30 | — | 90 | |
| Lip length, spread (risorius) | Δx_rel | — | 0.5 | — | 90 | Half the Table 1 value |
| Lip length, rounded (orbicularis oris) | Δx_rel | — | 2 | — | 90 | Twice the Table 1 value |
| Δw giving audible breathy voicing | Δw | mm | 0.1 | realistic ~1 mm does not vibrate | 98 | |
| Acoustic power difference [u] vs [a] | — | dB | -17 | — | 94 | |

## Methods & Implementation Details
- Only eleven quantities are governed by the articulatory muscles: the equilibrium wall distances w_eq of the lungs, glottis, pharynx, velum, palate, apex, and lips (seven equilibrium positions); the relative spring constant k_rel of the vocal cords, which influences k^(1), the masses m, and the dampings B_open in the glottis; the relative spring constant k_rel of the supralaryngeal tubes, influencing spring constants, masses and dampings of the vocal-tract walls; and the relative tube lengths Δx_rel of the lips (rounding) and of the pharynx (larynx height). These are slowly varying functions of time. *(p.89)*
- Values are interpolated linearly between the nearest specified target values. At least two targets must be specified for each articulatory dimension: the starting points at t = 0 (the starting values of w_eq are also the starting values of the distances w), and the end points at t = T, the time at which the simulation stops. *(p.89)*
- Speaker-specific constants required per region: number of tubes, equilibrium length Δx_eq, third dimension Δz, zipperiness Δw, equilibrium wall mass m_eq, equilibrium linear spring constant k_eq^(1), cubic spring constant k^(3), damping ratio B_rel, and the equilibrium distance w_eq where it is not muscle-adjustable (bronchi, trachea, upper larynx). *(p.89)*
- The vocal apparatus is 10 or 11 regions: lungs, bronchi, trachea, glottis (one region for a one-mass cord model, two for a two-mass model), upper part of larynx, pharynx, velum, palate, apex, lips. Within each region the tubes have equal properties. Boersma notes that applying the model to supraglottal articulation rather than glottis-tract interaction would require a more sophisticated model of the transition from articulator positions to tube properties. *(p.89)*
- The zipperiness Δw is taken to be the minimum needed for smooth contact. *(p.90)*
- Time step Δt is taken as the time it takes sound to travel the smallest tube length; this is the largest time that guarantees a stable integration. *(p.93)*
- System state at time nΔt: the distances w between the walls, their velocities, and the lengths Δx for every tube m from the first tube in the lungs (m = 1) to the last tube in the lips (m = M), plus the values of the continuous quantities J and Q at the tube boundaries m = 0 through M. *(p.93)*
- State changes between nΔt and (n+1)Δt come from three sources: the aerodynamic equations (ch. 3), the myoelastic equations (ch. 2), and the articulation data (ch. 4). *(p.93)*
- Integration scheme: a simple explicit scheme suffices for the springs, because spring motion is relatively slow and sufficiently damped. For the hyperbolic part of the aerodynamic equations, a second-order accurate scheme based on Lax-Wendroff (Mitchell 1969; Press et al. 1989) is used. Step 1: compute half-way values at (n+½)Δt of the conserved fluxes J and Q from the values at nΔt using first-order forward Euler. Step 2: use these half-way values to compute values at (n+1)Δt to second-order accuracy. Second-order accuracy in step 1 could be had by using values at (n-½)Δt, making it staggered-leapfrog, but in this case that would lead to instabilities. *(p.99)*
- Two modifications to Lax-Wendroff are needed. First, because of the discontinuities at tube boundaries, the left- and right-limit values of the mass flow densities and of the masses must be averaged, with weighting suggested by integration along characteristics for constant and equal tube lengths. Second, because tube lengths are not equal, the distances appearing in the gradient parts of the equations of motion must also be averaged, by a method that produces the correct resonance frequencies in the tract. *(p.99)*
- Only the mass flow J and the continuous pressure Q are defined on tube boundaries; w, A, v and ρ are defined inside tubes. *(p.99)*

## Figures of Interest
- **Fig. 1 (p.80):** Mid-sagittal view of the model. A sequence of straight tubes with walls of masses and springs. Leftmost tube is the lung volume, closed at the left edge; rightmost tube is the lip opening, open to the atmosphere at the right edge where air-flow fluctuations radiate as sound. The glottis is one or two tubes, treated exactly like all other tubes. Speech muscles alter rest positions and tensions of the vertical springs. Some masses are connected with springs to their nearest neighbours.
- **Fig. 2 (p.81):** Mid-sagittal view of one tube with its springs and masses (lower springs not shown). Muscles directly adjust the rest position w_eq, the linear spring constant k^(1), and the tube length Δx, and indirectly vary the mass m, the damping B_open, and the cubic spring constant k^(3). These plus the internal air pressure determine the development of the tube-wall state, represented by mutual distance w and mutual velocity dw/dt.
- **Fig. 3 (p.83):** Cross-sectional view showing how the walls make contact. In the right sub-figure the mean distance w between the masses is Δw/2. This distance can even become negative; the cross section A stays positive as long as w is greater than -Δw.
- **Fig. 5 (p.95):** Realized glottal width against time for [a]-like and [u]-like tract shapes, plus a close-up of [a] between 0.27 and 0.3 s. Plots scaled -1 to +5 mm. Oscillation frequency is lower in [u] than in [a].
- **Fig. 6 (p.96):** Articulatory and realized properties of an [apa]-like articulation. Four panels: lip width (target w_eq as straight lines against realized w), lung width (same), pressure at the bottom of the lungs in cm water, and mean particle velocity in the glottis in m/s.
- **Fig. 7 (p.97):** Glottal widths of eight [aba]- and [apa]-like utterances, scaled between -1 and +5 mm: (a) [apa], (b) spread glottis, (c) narrowed glottis, (d) constricted glottis, (e) slack vocal cords, (f) tense, (g) lax, (h) implosive.
- **Fig. A1 (p.99):** Some inner tubes showing aerodynamic quantities with place labels. Only mass flow J and continuous pressure Q are defined on boundaries.

## Results Summary
- Voicing of [a] and [u], male speaker: glottis rest width 1 mm, relative tension 1.5, lung equilibrium width reduced from 100 to 90 mm during the first 0.1 s, with very strong coupling effectively simulating a one-mass cord model. Oscillation frequency is lower in [u] than in [a], possibly because the amplitude of vocal-cord oscillation is higher in [u]: the constriction causes a higher mean pressure in the glottis, which pushes the cords apart. Acoustic power radiated in [u] is 17 dB lower than in [a]. *(p.94)*
- Lung volume follows the equilibrium volume set by the expiration muscles only reluctantly, because the relatively narrow glottis blocks the expiration. From 0.2 to 0.3 s the glottis is open but lung volume does not decrease at all, because no air can escape into the atmosphere with the lips closed. Lung pressure is also constant during that period; between 0.1 and 0.2 s and between 0.3 and 0.5 s it falls from 5 to 3 cm water. *(p.94-95)*
- Particle velocity in the glottis is small during labial closure because the glottis is open. The velocity oscillation lags somewhat behind the glottal-width oscillation, and this phase difference is what keeps the cords vibrating. *(p.95)*
- With no laryngeal gestures at all beyond the lip movements, voicing stops one period after the lips close, and the glottal width during oral closure is greater than the maximum width during phonation, without any laryngeal activity. This is voiceless-plosive behaviour emerging purely from aerodynamics. *(p.95-96)*
- The consonant is made more voiceless by spreading the glottis to 4 mm synchronously with the lip movement, which is the aspiration gesture. Another voiceless consonant is made by constricting the glottis to -1 mm, the ejective gesture, in which the release burst deprived of pulmonic excitation is obtained by pulling up the larynx. Yet another voiceless consonant is made if the vocal-tract walls are stiff. *(p.96)*
- Voicing is maintained longer if the cords are brought together to 0 mm. If this narrowing is done during phonation the acoustic power diminishes, and the fundamental frequency falls even with no adjustment of vocal-cord tension. *(p.97)*
- Additional lowering of the larynx between 0.2 and 0.4 s, so that at 0.4 s the pharynx is 1.3 times longer than at 0.2 s, helps voicing considerably: the implosive articulation. *(p.97)*
- Making the cords slack during closure causes phonation to continue only a little longer. The same goes for reducing the tension of the pharynx walls, the lax or lenis articulation. If the speaker's cubic spring constant is reduced as well, the consonant does become very voiced, which points to the possibility that the perfect-string approximation is not realistic here. *(p.97)*
- Voicing can therefore be maintained during labial closure either by relaxing the wall muscles in the vocal tract, or by simultaneously narrowing the glottis and lowering the larynx, making an implosive consonant. *(p.97)*
- The model can make vowels, with F0 influenced by vocal-tract shape; voiceless plosives, where after oral closure the intra-oral pressure rises, the glottal flow falls, and the cords stop vibrating and part, involving no laryngeal muscle gestures at all; voiced plosives, where smaller pharynx-wall tension supports maintenance of glottal flow and smaller cord tension helps the Bernoulli force; implosives, where the larynx is lowered during oral closure to maintain glottal flow and at release air is sucked into the mouth; ejectives, where the pressure behind the constriction is greater than for plain plosives and the volume smaller, so the noise burst is stronger and shorter; aspiration, by enlarging the equilibrium width of the glottis; fricatives, where if damping is too high for the walls to vibrate a narrow constriction can easily be maintained, accompanied by turbulence noise; clicks, only possible with coupling between different regions in the mouth, where after making two constrictions the rest width of the region in between is enlarged, the pressure falls, the two constrictions are pulled tighter by this pressure, and the coupling finally causes a strong release; and trills, where the damping of the apex is low enough for it to vibrate. *(p.98)*

## Limitations
- The present model does not feature a nasal tract, so it makes no nasal sounds. Boersma states a nasal tract can be added in a straightforward manner. *(p.80, p.98)*
- The focus is on manner features. Modelling place features realistically would require other subdivisions of the supralaryngeal vocal tract; the transition from articulator positions to supraglottal area functions has been better modelled by Mermelstein (1973). *(p.98)*
- Ideally the articulatory parameters should be the activities of the twenty-odd most important muscles, instead of the seven equilibrium positions, two relative tensions, and two relative lengths actually used. *(p.98)*
- Breathy voicing can be included by making Δw of the vocal cords dynamically dependent on w_eq, maintaining a triangular rest shape so the cords can vibrate without closing. However, realistic values of Δw of about 1 mm do not lead to vibration, because of the rigidity of the walls in this model. Breathy voicing is heard in the model output only if Δw is about 0.1 mm. *(p.98)*
- Tubes must not be much smaller than 1 cm for correct simulation of short wavelengths, which constrains spatial resolution. *(p.89)*
- The velum-length dependence on tongue-body height, due to vocal-tract curvature near the velum, is neglected in the present implementation. *(p.90)*
- The influences of the stylohyoid and sternohyoid muscles on the shape of what lies below the glottis are neglected. *(p.90)*
- The lip radiation radius is held artificially constant at 2 cm rather than tracking the actual opening. *(p.87)*
- The very-small-area problem is not solved physically but circumvented by an artificial leakage w_min. *(p.83)*
- Second-order accuracy in the first Lax-Wendroff half-step is not achievable here: the staggered-leapfrog alternative would lead to instabilities. *(p.99)*
- Evidence that the perfect-string approximation for the cubic spring constant may be unrealistic: reducing the speaker's cubic spring constant along with wall tension makes a lax consonant very voiced. *(p.97)*
- The flow of momentum is not continuous at tube boundaries because air transfers momentum to the vertical walls, so the usual third conserved quantity of unbounded hydrodynamics is unavailable. *(p.87)*

## Arguments Against Prior Work
Boersma lists eleven differences from Ishizaka & Flanagan (1972), the reference two-mass model. *(p.94)*
- Ishizaka & Flanagan compute pressures inside the tubes and flows at the boundaries, except in the glottis where both are computed inside. Boersma's integration computes the flows at the same places as the pressures, for all tubes, which he says might be a more principled modelling of glottis-tract interaction. *(p.94)*
- The use of different tube lengths enhances the chances of treating glottis and tract alike. *(p.94)*
- The use of time-varying lengths enables the system to model extra articulatory gestures found in the sounds of the languages of the world. *(p.94)*
- The direct influence of moving walls on flows allows the lungs to be modelled as a finite-capacity volume, and allows consonants that use sucking. *(p.94)*
- The influence of air pressure on wall motion allows modelling the acoustic correlates of the articulatory feature "tense". *(p.94)*
- The smooth closing of the walls prevents spurious pressure peaks and allows walls to vibrate even without complete closure. *(p.94)*
- Turbulence is used as an acoustic pressure source, making frication noise possible in most tubes rather than only at the glottis. *(p.94)*
- Damping is dynamic: if the cubic spring forces play a role, there is larger damping. *(p.94)*
- The cubic spring constant does not depend on the linear spring constant, which is true at least of the model of a perfect string. Boersma explicitly says he does not know whether this is an improvement. *(p.94)*
- In Ishizaka & Flanagan's glottis, a turbulence resistance is found above the glottis regardless of the direction of the flow in the glottis. Boersma calls this unrealistic. *(p.94)*
- Boersma neglects the effects of vena contracta, having decided that his speakers have a laminar flow there. *(p.94)*
- On the vena contracta specifically: Ishizaka & Flanagan use a resistance at the glottis entrance as well as at the exit, but the pressure drop there is just the Bernoulli pressure for a vena contracta, i.e. the stream is contracted and the entrance area is smaller than the wall distance would suggest. Ishizaka & Flanagan acknowledge this but do not use the smaller area in their subsequent computations. If the inlet flow is laminar, the resistance represents no energy loss and the pressure loss is recovered somewhere in the glottis, so the effect can be neglected. Boersma's equation (21) then predicts, for A_< = 0.1 A_>, a turbulence loss of 0.81 relative to the Bernoulli pressure, comparing favourably with Van den Berg's measured 0.875, as opposed to the 1.19 predicted by Ishizaka & Flanagan. *(p.88, p.94)*
- Against models that treat the lungs as an ideal pressure source: modelling the respiratory mechanism as lung-volume control rather than as an ideal pressure source expresses the finite capacity of the lungs. *(p.79-80)*
- Against models that privilege the vocal cords as the sole mass-spring system: nothing withholds other articulators from vibrating, and tongue tip, velum and lips are likely candidates for producing trills. *(p.80)*
- On the incompressibility assumption: Flanagan & Ishizaka (1977) show the shrinking-tube outflow effect is negligible for vocal cord vibration, but Boersma argues it probably cannot be neglected in modelling lung volume changes and the supralaryngeal tension variations partly responsible for voicing contrasts in obstruents. *(p.84)*
- Against Flanagan & Landgraf (1968), who use a damping factor of 0 for the vocal cords in an open glottis, and against Ishizaka & Flanagan's 0.1 and 0.6: Boersma notes only that a vibrating tissue needs an open-damping ratio appreciably smaller than 1, and adopts damping relative to the *true* critical damping including cubic terms, because otherwise relaxation times would be longer in the cubic-force region than in the linear-force region, the opposite of what should happen. *(p.92-93)*

## Design Rationale
- Every wall is a mass-spring system rather than only the vocal cords, so that vibration of any articulator (trills at the tongue tip, velum, or lips) and source-filter interaction follow automatically from the aerodynamic and myo-elastic equations instead of being special-cased. *(p.80)*
- Lungs as a finite-capacity volume driven by reducing the neutral width of the leftmost tube, not as an ideal pressure source, so that lung pressure is a consequence of volume control and airway impedance. This is visible in the result that lung volume does not fall while the lips are closed. *(p.79-80, p.94-95)*
- Time-varying tube lengths, so that lip rounding/spreading, larynx raising/lowering, and dorsal constriction are modelled directly rather than approximated by area changes. Boersma flags this as what makes implosives and ejectives expressible. *(p.80, p.90, p.94)*
- Cross section A written *inside* the parentheses in the continuity equation is "of crucial importance", because it is what makes an incompressible fluid correctly flow out of a shrinking tube. *(p.84)*
- The zipper collision model rather than a hard contact: because the masses are not exactly parallel, the collision is not simultaneous along the z-axis, and the resulting F_s forces and the area function A are smooth and differentiable at both -Δw and +Δw. This prevents spurious pressure peaks and lets walls vibrate without complete closure. *(p.82-83, p.94)*
- The leakage w_min exists to keep the aerodynamics well-behaved: without it, very small tube volumes create very high positive or negative pressures immediately before and after contact. With w_min = 0.01 mm the relative changes in A during a sampling period are not too large (provided Δw ≥ w_min), while the leaked air is negligible because of the large viscous resistance. *(p.83)*
- The lip radiation radius is held constant at 2 cm so that small lip openings do not attain unrealistically low damping; the A_lip factor still makes radiation damping smaller for small openings than for large ones. *(p.87)*
- Damping expressed relative to the true critical damping including cubic terms, so relaxation times are shorter, not longer, in the cubic-force region. *(p.92)*
- Damping of compressed tissue chosen to be exactly critical. *(p.92)*
- Cubic spring constant chosen so that at k_rel = 1 the third-power force equals the linear force at a distance Δz/10; Δz is doubled for pharynx, velum and palate because of the different attachment of the muscles in the cheeks. *(p.91)*
- Lung viscosity multiplied by a parallel-subdivision factor (1000) that ramps with distance from the bottom of the lungs, because the lung region physically consists of many parallel branches and the single-slit viscous formula cannot apply. *(p.93)*
- Time step chosen as the sound-travel time across the smallest tube, the largest step that guarantees stability. *(p.93)*
- Lax-Wendroff chosen over staggered-leapfrog despite the latter's better first-half-step accuracy, because staggered-leapfrog would be unstable here. *(p.99)*
- Output pressure sums the lip flow derivative and the derivative of the total wall motion, so radiation from moving walls is included, not only radiation from the mouth. *(p.93)*
- Turbulence modelled as a failure to recover the Bernoulli pressure drop rather than as an independent pressure drop, with only the fraction of kinetic energy set by the area ratio and the excess over v_crit converted. *(p.88)*
- Only one third of the turbulent kinetic energy is taken to be in the x-direction, which sets the noise amplitude scaling. *(p.88)*

## Testable Properties
- The cross section A must stay strictly positive: A ≥ w_min Δz > 0 for all w, including w < -Δw. *(p.83)*
- Both F_s^(1) and F_s^(3) must be continuous and differentiable at w = -Δw and w = +Δw; the area function A must be likewise. *(p.82-83)*
- w_min must satisfy Δw ≥ w_min for the relative changes in A during a sampling period to stay bounded; with Δw = w_min = 0.01 mm this is the equality case. *(p.83)*
- The free-oscillation frequency of a wall must be proportional to k_rel for small displacements. *(p.91)*
- Increasing k_rel must decrease the moving mass (m = m_eq/k_rel) and increase the linear spring constant proportionally. *(p.91)*
- The equilibrium lower-glottis resonance must be 112.5 Hz (woman), 55.1 Hz (man), 201.3 Hz (child) for the Table 2 parameters. *(p.91)*
- The Bernoulli approximation Q ≈ P + ½ρv² must hold to within 1% in the kinetic term for v < 0.2c, i.e. v < ~70.6 m/s. *(p.87)*
- Mass flow J must be continuous across every tube boundary; continuous pressure Q must satisfy ΔQ = 0 across boundaries; momentum flow ρv must NOT be continuous. *(p.86-87)*
- At the closed lung boundary, J = 0 for all time. *(p.87)*
- At t = 0 all flows and pressures must vanish. *(p.87)*
- Time step Δt must not exceed the sound-travel time across the smallest tube, or the integration becomes unstable. *(p.93)*
- Turbulence must be zero for |v| ≤ v_crit = 10 m/s and must vanish when A_< = A_> (no area expansion). *(p.88)*
- For A_< = 0.1 A_>, the predicted turbulence loss relative to the Bernoulli pressure must be 0.81. *(p.88)*
- For a tissue to be able to vibrate, its open-damping ratio B_rel must be appreciably smaller than 1; the regions given B_rel = 0.3 (velum, apex) and 0.1 (lower glottis) should vibrate, while those at 0.8 should not. *(p.93, p.91)*
- With no laryngeal gesture at all, voicing must stop approximately one period after the lips close, and the glottal width during oral closure must exceed the maximum width during phonation. *(p.95-96)*
- Narrowing the glottis during phonation must lower both the acoustic power and the fundamental frequency, even with vocal-cord tension held constant. *(p.97)*
- Lowering the larynx so the pharynx is 1.3 times longer must extend voicing during closure more than making the cords slack does. *(p.97)*
- Radiated acoustic power for [u] must be about 17 dB below that for [a] at matched glottal settings. *(p.94)*
- Breathy voicing must be audible at Δw of the vocal cords near 0.1 mm and absent at the anatomically realistic ~1 mm. *(p.98)*
- Lung volume must not decrease while the lips are closed, even with the glottis open and expiratory muscle activity present. *(p.94-95)*
- The glottal particle-velocity oscillation must lag the glottal-width oscillation; this phase difference is required for sustained vibration. *(p.95)*

## Appendix: The Complete Difference-Equation Algorithm

Difference equations relate the continuous quantities at time $t + (n{+}1)\Delta t$ to those at $t + n\Delta t$, where $\Delta t$ is the sampling period or integration time step, constant in these evaluations. They do so for every tube $m$ from the lungs ($m = 1$) to the lips ($m = M$) and for every tube boundary $m$ from the bottom of the lungs ($m = 0$) through the inner boundaries ($m = 1 \ldots M{-}1$) to the place where sound radiates from the lips ($m = M$). Upper indices count time steps, lower indices count tubes or tube boundaries. *(p.99-100)*

### Initial state (A1)

$$
J_m^0 = 0, \quad Q_m^0 = 0 \quad \text{for } m = 0 \ldots M
$$

$$
w_m^0 = w_{eq,m}^0 \text{ or } w_{eq,m}, \quad \dot{w}_m^0 = 0 \quad \text{for } m = 1 \ldots M
$$

$$
\Delta x_m^0 = \Delta x_{rel,m}^0 \, \Delta x_{eq,m} \text{ or just } \Delta x_{eq,m} \quad \text{for } m = 1 \ldots M
$$
*(p.100)*

### Aerodynamic equations in conserved-variable form (A2)

$$
\frac{\partial (\rho A \Delta x)}{\partial t} = J_{left} - J_{right}
$$

$$
\frac{\partial (\rho v)}{\partial t} = - \frac{\partial Q}{\partial x} - R v
$$
The left-hand-side quantities are called the *mass* $\rho A \Delta x$ and the *momentum density* $\rho v$.
*(p.100)*

### Continuous quantities in terms of mass and momentum density (A3)

$$
J = (\rho v) A
$$

$$
Q = \left( \frac{\rho A \Delta x}{A \, \Delta x} - \rho_{atm} \right) c^2 + \frac{(\rho v)^2}{2 \rho_{atm}}
$$
*(p.100)*

### Inverse relations (A4)

$$
\rho v = \frac{J}{A}
$$

$$
\rho A \Delta x = \left( \rho_{atm} + \frac{Q}{c^2} \right) A \, \Delta x - \frac{J^2 \Delta x}{2 \rho_{atm} c^2 A}
$$
*(p.100)*

### Step 1: compute momentum densities, air masses, and state variables in the tubes, from the mass flows and continuous pressures at the tube boundaries

Mean values of the continuous quantities inside tube $m$ (A5):

$$
\bar{Q}_m^n = \tfrac{1}{2} \left( Q_{m-1}^n + Q_m^n \right), \qquad \bar{J}_m^n = \tfrac{1}{2} \left( J_{m-1}^n + J_m^n \right)
$$
*(p.100)*

Mean momentum density (A6):

$$
(\rho v)_m^n = \frac{\bar{J}_m^n}{A_m^n}
$$
*(p.101)*

Mean value of the state variable $P$, to be used in the mass-spring equations (A7):

$$
P_m^n = \bar{Q}_m^n - \frac{\left( (\rho v)_m^n \right)^2}{2 \rho_{atm}}
$$
*(p.101)*

Mean values of the state variables $\rho$ and $v$ (A8). This velocity is what is then used to compute the resistances:

$$
\rho_m^n = \rho_{atm} + \frac{P_m^n}{c^2}, \qquad v_m^n = \frac{(\rho v)_m^n}{\rho_m^n}
$$
*(p.101)*

Total mass of air inside the tube (A9):

$$
(\rho A \Delta x)_m^n = \rho_m^n \, A_m^n \, \Delta x_m^n
$$
*(p.101)*

### Step 2: compute the new cross sections from the old cross sections, the articulation data, and the old mean pressures, using first-order explicit integration; interpolate the half-way values

The second-order equation (5) is split into two parts (A10):

$$
\dot{w}_m^{n+1} = \frac{\dot{w}_m^n + \dfrac{\Delta t}{m_m^n} \left( \text{tension}_m^n + 2 P_m^n \Delta z_m \Delta x_m^n \right)}{1 + \dfrac{B_m^n \Delta t}{m_m^n}}
$$

$$
w_m^{n+1} = w_m^n + \dot{w}_m^{n+1} \Delta t
$$
Where the tension is computed from equations (2), (6), (7) and (8), and the damping from (30) through (35). This integration is first-order explicit for the harmonic part and first-order implicit for the dissipative part. The method of integrating the harmonic part, which uses the *new* value of $\dot{w}$ to compute the new $w$, conserves energy.
*(p.101)*

The new cross section $A_m^{n+1}$ is derived from $w_m^{n+1}$ using equation (9), and the half-way value is interpolated (A11):

$$
A_m^{n+1/2} = \tfrac{1}{2} \left( A_m^{n+1} + A_m^n \right)
$$
*(p.102)*

### Step 3: compute the new tube lengths from the articulation data; interpolate the half-way values (A12)

$$
\Delta x_m^{n+1} = \Delta x_{rel,m}^n \, \Delta x_{eq,m}
$$

$$
\Delta x_m^{n+1/2} = \tfrac{1}{2} \left( \Delta x_m^{n+1} + \Delta x_m^n \right)
$$
*(p.102)*

### Step 4: compute half-way mean mass flow densities inside the tubes from the old densities and the old boundary pressures, using first-order explicit integration; then the half-way mean mass flows

For the sake of stability, implicit (backward) integration is used for the resistance part (A13):

$$
(\rho v)_m^{n+1/2} = (\rho v)_m^n + \tfrac{1}{2} \Delta t \left( \frac{Q_{m-1}^n - Q_m^n}{\Delta x_m^n} - R_m^n \frac{(\rho v)_m^{n+1/2}}{\rho_{atm}} \right)
$$

or, solved:

$$
\left( 1 + \frac{R_m^n \Delta t}{2 \rho_{atm}} \right) (\rho v)_m^{n+1/2} = (\rho v)_m^n + \tfrac{1}{2} \Delta t \, \frac{Q_{m-1}^n - Q_m^n}{\Delta x_m^n}
$$

$$
\bar{J}_m^{n+1/2} = (\rho v)_m^{n+1/2} \, A_m^{n+1/2}
$$
*(p.102)*

### Step 5: compute half-way masses inside the tubes from the old masses and the old boundary mass flows, using first-order explicit integration; then the half-way mean continuous pressures (A14)

$$
(\rho A \Delta x)_m^{n+1/2} = (\rho A \Delta x)_m^n + \tfrac{1}{2} \Delta t \left( J_{m-1}^n - J_m^n \right)
$$

$$
\bar{Q}_m^{n+1/2} = \left( \frac{(\rho A \Delta x)_m^{n+1/2}}{A_m^{n+1/2} \Delta x_m^{n+1/2}} - \rho_{atm} \right) c^2 + \frac{\left( (\rho v)_m^{n+1/2} \right)^2}{2 \rho_{atm}}
$$
*(p.102-103)*

### Step 6: compute the new mass flows at the tube boundaries from their old values and the half-way mean continuous pressures, using an appropriate weighting of the left- and right-limit values of the new mass flow densities at the boundaries

The momentum density is not continuous at tube boundaries, so the equation of motion is integrated using (A4), giving (A15):

$$
\left( \frac{r_m^n}{A_m^{n+1}} + \frac{r_{m+1}^n}{A_{m+1}^{n+1}} \right) J_m^{n+1} = \left( \frac{1}{A_m^n} + \frac{1}{A_{m+1}^n} \right) J_m^n + \frac{4 \Delta t}{\Delta x_m^{n+1/2} + \Delta x_{m+1}^{n+1/2}} \left( \bar{Q}_m^{n+1/2} - \bar{Q}_{m+1}^{n+1/2} \right)
$$

where

$$
r_m^n \equiv 1 + \frac{R_m^n \Delta t}{\rho_{atm}} \qquad \text{for } m = 1 \ldots M
$$
Equation (A15) is second-order accurate for the hyperbolic part and only first-order accurate for the dissipative part. For dissipation, only an implicit, first-order accurate integration guarantees results that are stable in the sense of reaching equilibrium faster when there are stronger resistances, whereas second-order accuracy features stability only in the Von Neumann sense.
*(p.103)*

### Step 7: compute the new continuous pressures at the tube boundaries from their old values, the half-way mean mass flows inside the tubes, and the new mass flows at the boundaries, using an appropriate weighting of the left- and right-limit values of the new "masses" at the boundaries

The masses are not continuous at boundaries, so again equation (A4) is used (A16):

$$
\left( \rho_{atm} c^2 + Q_m^{n+1} \right) \left( A_m^{n+1} \Delta x_m^{n+1} + A_{m+1}^{n+1} \Delta x_{m+1}^{n+1} \right) - \frac{\left( J_m^{n+1} \right)^2}{2 \rho_{atm}} \left( \frac{\Delta x_m^{n+1}}{A_m^{n+1}} + \frac{\Delta x_{m+1}^{n+1}}{A_{m+1}^{n+1}} \right)
$$

$$
= \left( \rho_{atm} c^2 + Q_m^{n} \right) \left( A_m^{n} \Delta x_m^{n} + A_{m+1}^{n} \Delta x_{m+1}^{n} \right) - \frac{\left( J_m^{n} \right)^2}{2 \rho_{atm}} \left( \frac{\Delta x_m^{n}}{A_m^{n}} + \frac{\Delta x_{m+1}^{n}}{A_{m+1}^{n}} \right) + 2 \Delta t \left( \bar{J}_m^{n+1/2} - \bar{J}_{m+1}^{n+1/2} \right) c^2
$$
This integration is second-order accurate too, as it is equally balanced in time.
*(p.103-104)*

### Boundary conditions in difference form

At the lungs (A17):

$$
J_0^{n+1} = 0
$$

$$
\left( \rho_{atm} c^2 + Q_0^{n+1} \right) A_1^{n+1} \Delta x_1^{n+1} = \left( \rho_{atm} c^2 + Q_0^{n} \right) A_1^{n} \Delta x_1^{n} - 2 \Delta t \, \bar{J}_1^{n+1/2} c^2
$$
*(p.104)*

At the lips, from integrating equation (20) to second-order precision (A18):

$$
0 = Q_M^{n+1} - Q_M^n - \frac{c J_M^{n+1}}{A_M^{n+1}} + \frac{c J_M^n}{A_M^n} + \frac{c \Delta t}{a_{lip}} \frac{Q_M^{n+1} + Q_M^n}{2} = \frac{Q_M^{n+1}}{r_{rad}} - \frac{Q_M^n}{g_{rad}} - \frac{c J_M^{n+1}}{A_M^{n+1}} + \frac{c J_M^n}{A_M^n}
$$

where

$$
r_{rad} \equiv \frac{1}{1 + \dfrac{c \Delta t}{2 a_{lip}}}, \qquad g_{rad} \equiv \frac{1}{1 - \dfrac{c \Delta t}{2 a_{lip}}}
$$
*(p.104)*

New flow and pressure at the lips (A19):

$$
\frac{r_M^n + r_{rad}}{A_M^{n+1}} J_M^{n+1} = \frac{1 + r_{rad}}{A_M^n} J_M^n + \frac{2 \Delta t}{\Delta x_M^{n+1/2}} \left( \bar{Q}_M^{n+1/2} - Q_M^n \right) + \left( Q_M^n - \frac{r_{rad} Q_M^n}{g_{rad}} \right) c^{-1}
$$

$$
\frac{Q_M^{n+1}}{r_{rad}} = \frac{Q_M^n}{g_{rad}} + c \left( \frac{J_M^{n+1}}{A_M^{n+1}} - \frac{J_M^n}{A_M^n} \right)
$$
*(p.104)*

### Derivation of the space-averaging via integration along characteristics

The space-averaging in (A15), (A16) and (A19) was suggested by integrating along the characteristics of the hyperbolic parts of the aerodynamic equations. These characteristics are the lines $x = x_0 \pm ct$, and integration along them can only be done if the tube lengths are equal and constant. An alternative way of writing the aerodynamic difference equations (18) is:

$$
0 = \frac{\partial J}{\partial x} + A \frac{\partial \rho}{\partial t} + \rho \frac{\partial A}{\partial t} = \frac{\partial J}{\partial x} + \frac{A}{c^2} \left( \frac{\partial Q}{\partial t} - \rho v \frac{\partial v}{\partial t} \right) + \rho \frac{\partial A}{\partial t}
$$

$$
0 = \rho \frac{\partial \left( \dfrac{J}{\rho A} \right)}{\partial t} + \frac{\partial Q}{\partial x} + R v = \frac{1}{A} \frac{\partial J}{\partial t} - \frac{v}{A} \frac{\partial (\rho A)}{\partial t} + \frac{\partial Q}{\partial x} + R v = \frac{1}{A} \frac{\partial J}{\partial t} + \frac{\partial Q}{\partial x} + \frac{v}{A} \frac{\partial J}{\partial x} + R v
$$

Made to look more similar:

$$
0 = c \frac{\partial J}{\partial x} + A \frac{\partial Q}{\partial ct} - J \frac{\partial v}{\partial ct} + \rho c^2 \frac{\partial A}{\partial ct}
$$

$$
0 = c \frac{\partial J}{\partial ct} + A \frac{\partial Q}{\partial x} + v \frac{\partial J}{\partial x} + R v A
$$
*(p.105)*

Integrated along the x-coordinate over the entire $m$th tube of constant length $\Delta x$:

$$
0 = c (J_m - J_{m-1}) + \tfrac{1}{2} A_m \frac{\partial (Q_{m-1} + Q_m)}{\partial ct} \Delta x + \left( - \bar{J}_m \frac{\partial v_m}{\partial ct} + \rho_m c^2 \frac{\partial A_m}{\partial ct} \right) \Delta x
$$

$$
0 = \tfrac{1}{2} c \frac{\partial (J_{m-1} + J_m)}{\partial ct} \Delta x_m + A_m (Q_m - Q_{m-1}) + v_m (J_m - J_{m-1}) + R_m v_m A_m \Delta x
$$
*(p.105)*

Integrating over time yields (A20):

$$
0 = \tfrac{1}{2} c \left( J_m^n + J_m^{n+1} - J_{m-1}^n - J_{m-1}^{n+1} \right) \Delta ct + \tfrac{1}{2} A_m^{n+1/2} \left( Q_m^{n+1} + Q_{m-1}^{n+1} - Q_m^n - Q_{m-1}^n \right) \Delta x + \left( - \bar{J}_m^{n+1/2} (v_m^{n+1} - v_m^n) + \rho_m^{n+1/2} c^2 (A_m^{n+1} - A_m^n) \right) \Delta x
$$

$$
0 = \tfrac{1}{2} c \left( J_{m-1}^{n+1} + J_m^{n+1} - J_{m-1}^n - J_m^n \right) \Delta x + \tfrac{1}{2} A_m^{n+1/2} \left( Q_m^n + Q_m^{n+1} - Q_{m-1}^n - Q_{m-1}^{n+1} \right) \Delta ct + \left( v_m^{n+1/2} \left( J_m^{n+1/2} - J_{m-1}^{n+1/2} \right) + R_m^{n+1/2} J_m^{n+1} \Delta x / \rho_m^{n+1/2} \right) \Delta ct
$$
*(p.105)*

### The two correction pressures

These represent the deviation from simple acoustic waves. Wall-and-Bernoulli correction:

$$
P_{WB,m}^{n+1/2} \equiv \frac{\rho_m^n c^2 \left( A_m^{n+1} - A_m^n \right) - \bar{J}_m^n \left( v_m^n - v_m^{n-1} \right)}{A_m^{n+1/2}}
$$

Convective correction:

$$
P_{C,m}^{n+1/2} \equiv \frac{v_m^n \left( J_m^n - J_{m-1}^n \right)}{A_m^{n+1/2}}
$$
*(p.106)*

If $\Delta x = \Delta ct$, some terms can be dropped. This is called integration along characteristics; a vocal-tract integration that uses it is found in Sondhi & Resnick (1983). Adding equations (A20) to one another gives (A21):

$$
\frac{r_m^n c J_m^{n+1} - c J_{m-1}^n}{A_m^{n+1/2}} + Q_m^{n+1} - Q_{m-1}^n + P_{WB,m}^{n+1/2} + P_{C,m}^{n+1/2} = 0
$$
*(p.106)*

Subtraction of equations (A20) gives (A22):

$$
\frac{c J_m^n - r_m^n c J_{m-1}^{n+1}}{A_m^{n+1/2}} - Q_m^n + Q_{m-1}^{n+1} + P_{WB,m}^{n+1/2} - P_{C,m}^{n+1/2} = 0
$$
*(p.106)*

A boundary between two tube sections is a left and a right boundary at the same time, so (A22) can also be written as (A23):

$$
\frac{c J_{m+1}^n - r_{m+1}^n c J_m^{n+1}}{A_{m+1}^{n+1/2}} - Q_{m+1}^n + Q_m^{n+1} + P_{WB,m+1}^{n+1/2} - P_{C,m+1}^{n+1/2} = 0
$$
*(p.106)*

Solving $J_m^{n+1}$ from (A21) and (A23) gives (A24):

$$
\left( \frac{r_m^n}{A_m^{n+1/2}} + \frac{r_{m+1}^n}{A_{m+1}^{n+1/2}} \right) c J_m^{n+1} = \frac{c J_{m-1}^n}{A_m^{n+1/2}} + \frac{c J_{m+1}^n}{A_{m+1}^{n+1/2}} + Q_{m-1}^n - Q_{m+1}^n - P_{WB,m}^{n+1/2} - P_{C,m}^{n+1/2} + P_{WB,m+1}^{n+1/2} - P_{C,m+1}^{n+1/2}
$$
*(p.106)*

The new pressures $Q_m^{n+1}$ are computed from $J_m^{n+1}$ by (A21) or (A23), or directly by (A25):

$$
\left( \frac{A_m^{n+1/2}}{r_m^n} + \frac{A_{m+1}^{n+1}}{r_{m+1}^n} \right) Q_m^{n+1} = \frac{A_m^{n+1/2}}{r_m^n} \left( Q_{m-1}^n - P_{WB,m}^n - P_{C,m}^n + c J_{m-1}^n \right) + \frac{A_{m+1}^{n+1/2}}{r_{m+1}^n} \left( Q_{m+1}^n - P_{WB,m+1}^n + P_{C,m+1}^n - c J_{m+1}^n \right)
$$
*(p.107)*

Nothing flows into or out of the lungs other than via the windpipe (A26):

$$
J_0^{n+1} = 0
$$
Combined with (A23) this gives (A27):

$$
Q_0^{n+1} = Q_1^n - \frac{c J_1^n}{A_1^{n+1/2}} - P_{WB,1}^n + P_{C,1}^n
$$
*(p.107)*

At the lips, equation (A18) combined with the equation for the rightmost tube (A21) yields (A28):

$$
\left( \frac{r_M^n}{A_M^{n+1/2}} + \frac{r_{rad}}{A_M^{n+1}} \right) c J_M^{n+1} = \frac{c J_{M-1}^n}{A_M^{n+1/2}} + \frac{r_{rad} \, c J_M^n}{A_M^n} + Q_{M-1}^n - \frac{r_{rad} Q_M^n}{g_{rad}} - P_{WB,M}^n - P_{C,M}^n
$$
after which $Q_M^{n+1}$ is computed from (A18) or from (A21). If $v$ is small, $\partial A / \partial t = 0$, and $\Delta x = c \Delta t$, then (A19) and (A28) are the same formula.
*(p.107)*

## Relevance to Project

This is a complete, self-contained physical speech synthesizer with every constant published, which makes it directly implementable. For a formant/Klatt-lineage synthesis project it is useful in several distinct ways.

- **A ground-truth source model.** The glottal-flow and glottal-width waveforms here are not parameterized shapes (LF, KLGLOTT88, Rosenberg) but the output of a mass-spring-aerodynamic simulation. That makes the paper a reference for what source-tract interaction actually does to the flow waveform, against which a parametric source can be checked. The [u] versus [a] result (17 dB lower radiated power, lower F0 in [u] at identical laryngeal settings) is a concrete interaction effect that a non-interactive source-filter synthesizer cannot produce at all.
- **Aerodynamic voicing contrasts without laryngeal features.** The result that voicing stops one period after lip closure with no laryngeal gesture whatsoever, and that the glottis passively widens beyond its phonatory maximum during closure, is the physical basis for the voiced/voiceless distinction in stops. A rule-based frontend that switches voicing on and off by feature is imposing what falls out of aerodynamics here. The paper supplies the alternative articulatory recipes for each contrast: aspiration by glottal spreading to 4 mm, ejective by glottal constriction to -1 mm plus larynx raising, implosive by glottal narrowing to 0 mm plus 30% pharynx lengthening, lenis by reduced pharyngeal wall tension.
- **A frication and aspiration noise model.** Equation (21) with v_crit = 10 m/s and the area-ratio squared term, plus the low-pass noise generator of equation (23), is a complete recipe for turbulence noise located at any constriction in the tract rather than at a fixed source position. This is directly comparable to the fixed-position noise sources in Klatt-family synthesizers.
- **A collision model that avoids closure artifacts.** The zipper formulation with the leakage w_min is a well-motivated way to make a closing constriction differentiable, which is the exact problem any time-varying-area synthesizer has at stop closure. The stated design reason, that tiny areas cause spurious pressure spikes, applies to any area-function-driven filter.
- **Speaker scaling data.** Tables 1 and 2 give a coherent woman/man/child parameter set across the whole apparatus, including the anatomical disproportions Boersma calls out: male cords relatively thick and long, the child's cords thin and short, the child's pharynx short (four sections rather than six).
- **Numerical method.** The Lax-Wendroff variant with its two averaging modifications, the stability rule tying the time step to the shortest tube, and the explicit statement that staggered-leapfrog is unstable here, are directly reusable if a wave-propagation tract model is ever built.

The main caveats for reuse: no nasal tract, place features are deliberately not modelled well (Boersma points to Mermelstein 1973 for the articulator-to-area-function mapping), and the wall rigidity prevents breathy voicing at anatomically realistic Δw.

## Open Questions
- [ ] Boersma states μ = 1.86·10⁵ Ns/m² for air, which is off by ten orders of magnitude from the physical value of about 1.86·10⁻⁵ Ns/m². Confirm this is a typesetting sign error and not a different definition, since it directly scales the viscous resistance in equation (12).
- [ ] The paper does not state a sampling rate or the number of tubes M for any of the example utterances, only that Δt is the sound-travel time across the smallest tube. For the male speaker with a 1 mm upper glottis this implies a very high internal rate; the relationship between that internal rate and the output audio rate is not described.
- [ ] Equation (23) is stated to be redundant in Boersma's own implementation because the integration imposes a ~6 kHz cut-off automatically, so only the second term is added. Whether that automatic cut-off is exactly equivalent to the intended one-pole low-pass is not established.
- [ ] Boersma explicitly says he does not know whether making the cubic spring constant independent of the linear one is an improvement over Ishizaka & Flanagan, and the lax-consonant result suggests the perfect-string approximation may be wrong. What the correct coupling is remains open.
- [ ] Whether the model, as parameterized, actually produces the clicks and trills claimed in the conclusion is asserted but not demonstrated with figures.
- [ ] The relative-coupling column in Table 2 is given as a single number per boundary with only the lower-glottis-to-upper-glottis coupling nonzero. How that dimensionless relative coupling maps onto the k^(1) and k^(3) coupling constants of equation (8) is described only qualitatively (the isotropic-tension averaging rule on p.92).
- [ ] The paper gives no perceptual or acoustic evaluation against real speech, only qualitative descriptions of the synthesized output.

## Related Work Worth Reading
- Ishizaka, K. & Flanagan, J.L. (1972), "Synthesis of voiced sounds from a two-mass model of the vocal cords", Bell System Technical Journal 51: 1233-1268. The direct predecessor and the target of Boersma's eleven-point comparison.
- Flanagan, J.L. & Landgraf, L.L. (1968), "Self-oscillating source for vocal-tract synthesizers", IEEE Transactions on Audio and Electroacoustics AU-16: 57-64. Origin of the relative-tension parameter and the one-mass self-oscillating source.
- Sondhi, M.M. & Resnick, J.R. (1983), "The inverse problem for the vocal tract: numerical methods, acoustical experiments, and speech synthesis", JASA 73(3): 985-1002. Source of the lip radiation boundary condition and of the integration-along-characteristics approach.
- Mermelstein, P. (1973), "Articulatory model for the study of speech production", JASA 53: 1070-1082. Boersma names this as the better model of the articulator-position to area-function mapping, i.e. the piece his own model deliberately does not do well.
- Van den Berg, J. et al. (1957). Source of the critical velocity of 10 m/s and of the measured turbulence-loss value of 0.875 against which Boersma validates equation (21).
- Flanagan, J.L. & Ishizaka, K. (1977), "Acoustic characterization and computer simulation of the air volume displaced by the vibrating vocal cords". The source of the claim that the incompressible shrinking-tube effect is negligible for cord vibration.
- Press, W.H. et al. (1989), Numerical Recipes in Pascal, and Mitchell, A.R. (1969), Computational Methods in Partial Differential Equations. The numerical references for the Lax-Wendroff scheme.


