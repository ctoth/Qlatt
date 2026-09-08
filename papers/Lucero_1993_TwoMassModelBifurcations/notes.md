---
title: "Dynamics of the two-mass model of the vocal folds: Equilibria, bifurcations, and oscillation region"
authors: "Jorge C. Lucero"
year: 1993
venue: "Journal of the Acoustical Society of America 94(6), 3104-3111"
doi_url: "https://doi.org/10.1121/1.407217"
pages: "3104-3111"
affiliation: "QI 27 conj. 12 casa 13, Lago Sul, Brasilia DF, CEP 71675-120, Brazil"
pacs: "43.70.Aj, 43.70.Bk"
---

# Dynamics of the two-mass model of the vocal folds: Equilibria, bifurcations, and oscillation region

## One-Sentence Summary
A large-amplitude (non-linearized) analysis of the Ishizaka-Flanagan two-mass vocal fold model showing that besides the rest position there exist two further equilibrium positions, that the oscillation region in the (normalized subglottal pressure, coupling ratio) plane is bounded by two Hopf bifurcation curves plus a saddle-node and a transcritical bifurcation, and that instability of the rest position alone is *not* sufficient to generate oscillation. *(p.3104, p.3108)*

## Problem Addressed
Prior analytical treatments of the two-mass model (Ishizaka and Matsudaira 1972; Ishizaka 1981; Ishizaka et al. 1987; Titze 1988) linearize the equations of motion about the rest position and study only small-amplitude oscillation, concluding that phonation onset is a single Hopf bifurcation at a threshold subglottal pressure. That approach cannot see additional equilibria or the true boundaries of the oscillating region. Related work on a plank model (Lucero and Gotoh 1992; Lucero 1993) had already hinted at a second equilibrium and extra bifurcations. *(p.3104)*

## Key Contributions
- Determines all equilibrium positions of the two-mass model for a rectangular prephonatory glottis analytically, showing exactly three: R (rest), A, and B. *(p.3105-3106)*
- Proves no equilibria exist in the closed-glottis condition, so the open-glottis equilibria are the only ones in the model. *(p.3106)*
- Derives a bifurcation diagram in the (p_s, alpha) plane containing a Hopf curve EF (for R), a Hopf curve EG (for A), a transcritical curve OL (R and A coincide), and a saddle-node curve p_s1 (A and B annihilate). *(p.3107-3108, Fig. 5)*
- Shows the oscillation region is strictly smaller than the instability region of R: instability of R alone is not sufficient for oscillation. *(p.3108)*
- Gives closed-form expressions (Eqs. 21, 22) for the corner point E that delimits the oscillation region, yielding alpha = 0.18 and p_s = 0.86 for typical parameters. *(p.3108)*
- Treats convergent (beta = 1.1) and divergent (beta = 0.9) prephonatory glottis, showing convergent raises and divergent lowers the oscillation threshold pressure. *(p.3109-3110)*
- Disproves the negative-differential-resistance (NDR) oscillation theory of Conrad and McQueen (1988): the NDR region (weak coupling, alpha <~ 0.11) lies entirely outside the oscillation region (which requires alpha >= 0.18). *(p.3111)*

## Study Design
- **Type:** Analytical/mathematical dynamical-systems study of an existing lumped-parameter model, with confirmatory numerical integration.
- **Model:** Ishizaka and Flanagan (1972) two-mass model, notation adopted unchanged. *(p.3104)*
- **Control parameters:** normalized subglottal pressure p_s and coupling coefficient alpha. *(p.3105, p.3107)*
- **Validation:** numerical solution of the full equations of motion *including* the glottal viscous resistances that the analysis neglects, plotted as phase-plane trajectories in the y1-y2 plane (Figs. 6-9). Numerical equilibrium locations agree closely with analytical ones, justifying the neglect. *(p.3108-3109)*

## Simplifying Assumptions (all p.3104-3105)
1. **(i)** Inertia of the glottal air is small; glottal flow is quasisteady (Flanagan 1972). *(p.3104)*
2. **(ii)** Supraglottal pressure is zero (atmospheric); vocal tract load is neglected. Corresponds to an excised larynx, justified because vocal fold oscillation also occurs in excised larynges (Baer 1981). *(p.3104)*
3. **(iii)** Cubic nonlinearity of the elastic restoring forces of the tissues is small; the nonlinearity from collision between opposite folds is retained. *(p.3104)*
4. **(iv)** Pressure recovery at the glottal outlet is small (Titze 1988). *(p.3105)*
5. **(v)** Glottal viscous resistances are small. Unlike prior work this cannot be justified by small amplitude; instead it is justified a posteriori by numerical solution including the resistances. *(p.3105)*

## Methodology
1. Write the two-mass equations of motion with piecewise elastic restoring force and piecewise driving force (Eqs. 1a-3b). *(p.3105)*
2. Set derivatives to zero, substitute the driving force, and solve for equilibria in the open-glottis branch (Eqs. 5a-5b). *(p.3105)*
3. Change to normalized displacement y_i = 1 + x_i/x_i0, normalized subglottal pressure p_s, coupling coefficient alpha, prephonatory shape ratio beta (Eqs. 6-13). *(p.3105)*
4. For the rectangular glottis (beta = 1), reduce to the quadratic Eq. (15) in y_1e; classify its roots as p_s varies (Fig. 2). *(p.3106)*
5. Repeat the equilibrium solution in the closed-glottis branch and show the solutions violate their own validity domain, hence no closed-glottis equilibria exist. *(p.3106)*
6. Linearize about each equilibrium (x_i = x_ie + eps_i) and obtain the quartic characteristic equation (Eq. 20). *(p.3107)*
7. Locate bifurcations by root-crossing conditions; construct the (p_s, alpha) bifurcation diagram (Fig. 5). *(p.3107-3108)*
8. Confirm with numerical phase-plane integration at four sample points P1-P4 of Fig. 5. *(p.3108-3109)*
9. Repeat the equilibrium location numerically for beta = 1.1 and beta = 0.9. *(p.3109-3110)*

## Key Equations

### Equations of motion

$$
m_1 \frac{d^2 x_1}{dt^2} + r_1 \frac{d x_1}{dt} + s_1 + k_c (x_1 - x_2) = F_1
$$
Where: `m_1` = lower mass (g), `x_1` = displacement of lower mass from rest position (cm), `r_1` = viscous damping coefficient of mass 1 (dyn s/cm), `s_1` = elastic restoring force on mass 1 (dyn), `k_c` = coupling stiffness between masses (dyn/cm), `F_1` = driving force on mass 1 (dyn). *(p.3105, Eq. 1a)*

$$
m_2 \frac{d^2 x_2}{dt^2} + r_2 \frac{d x_2}{dt} + s_2 + k_c (x_2 - x_1) = F_2
$$
Where: symbols as above with index 2 (upper mass). *(p.3105, Eq. 1b)*

### Piecewise elastic restoring force

$$
s_i = \begin{cases} k_i x_i, & x_i > -x_{i0} \\ k_i x_i + h_i (x_i + x_{i0}), & x_i \le -x_{i0} \end{cases} \quad (i = 1,2)
$$
Where: `k_i` = stiffness in the open-glottis condition (dyn/cm), `h_i` = additional stiffness introduced by collision between the opposite vocal folds (dyn/cm), `x_i0` = half-width of the glottis at mass `m_i` at its rest (prephonatory) position (cm). *(p.3105, Eq. 2)*

### Driving forces

$$
F_1 = \begin{cases} l_g d_1 P_s f_p, & x_1 > -x_{10} \text{ and } x_2 > -x_{20} \\ l_g d_1 P_s, & \text{otherwise} \end{cases}
$$
Where: `l_g` = length of the masses (cm), `d_1` = thickness of mass 1 (cm), `P_s` = subglottal pressure (dyn/cm^2), `f_p` = pressure-distribution function of Eq. (4). *(p.3105, Eq. 3a)*

$$
F_2 = \begin{cases} l_g d_2 P_s, & x_1 > -x_{10} \text{ and } x_2 \le -x_{20} \\ 0, & \text{otherwise} \end{cases}
$$
Where: `d_2` = thickness of mass 2 (cm). *(p.3105, Eq. 3b)*

### Pressure function

$$
f_p = \frac{(x_1 + x_{10})^2 - (x_2 + x_{20})^2}{(x_1 + x_{10})^2 + \kappa (x_2 + x_{20})^2}
$$
Where: `kappa` = 0.37, a pressure loss factor for the area contraction at the glottal inlet (Ishizaka and Flanagan 1972), dimensionless. *(p.3105, Eq. 4)*

### Equilibrium conditions (open glottis)

$$
k_1 x_{1e} + k_c (x_{1e} - x_{2e}) = l_g d_1 P_s \frac{(x_{1e} + x_{10})^2 - (x_{2e} + x_{20})^2}{(x_{1e} + x_{10})^2 + \kappa (x_{2e} + x_{20})^2}
$$
Where: `x_ie` = equilibrium displacement of mass i. *(p.3105, Eq. 5a)*

$$
k_2 x_{2e} + k_c (x_{2e} - x_{1e}) = 0
$$
*(p.3105, Eq. 5b)*

### Coupling relation and coupling coefficient

$$
x_{2e} = \alpha x_{1e}
$$
*(p.3105, Eq. 6)*

$$
\alpha = \frac{k_c}{k_2 + k_c}
$$
Where: `alpha` = coupling coefficient (dimensionless, in [0,1]); alpha -> 0 is weak coupling, alpha -> 1 strong coupling. *(p.3105, Eq. 7)*

### Reduced equilibrium equation

$$
(y_{1e} - 1) = H \frac{\beta^2 y_{1e}^2 - y_{2e}^2}{\beta^2 y_{1e}^2 + \kappa y_{2e}^2}
$$
*(p.3105, Eq. 8)*

### Normalized variables

$$
y_i = 1 + \frac{x_i}{x_{i0}} \quad (i = 1,2)
$$
Where: `y_i` = normalized displacement coordinate; `y_i = 1` is the rest position, `y_i = 0` is glottal closure at mass i. *(p.3105, Eq. 9)*

$$
\beta = \frac{x_{10}}{x_{20}}
$$
Where: `beta` = prephonatory glottal shape ratio. beta = 1 rectangular, beta > 1 convergent, beta < 1 divergent. *(p.3105, Eq. 10)*

$$
H = \frac{p_s}{1 + \alpha k_2 / k_1}
$$
*(p.3105, Eq. 11)*

$$
p_s = \frac{l_g d_1 P_s}{k_1 x_{10}}
$$
Where: `p_s` = normalized subglottal pressure (dimensionless). *(p.3105, Eq. 12)*

### Relation between normalized equilibrium coordinates

$$
y_{2e} = \alpha \beta (y_{1e} - 1) + 1
$$
*(p.3105, Eq. 13)*

### Trivial equilibrium (position R)

$$
y_{1e} = y_{2e} = 1
$$
Corresponds to `x_1e = x_2e = 0`, the rest position, called equilibrium position R. *(p.3105-3106, Eq. 14)*

### Non-trivial equilibria (rectangular glottis, beta = 1)

$$
(1 + \kappa \alpha^2) y_{1e}^2 + (1 - \alpha)[2 \kappa \alpha - (1 + \alpha) H] y_{1e} - (1 - \alpha)^2 (H - \kappa) = 0
$$
Solved jointly with Eq. (13). The two roots give equilibrium positions A and B. *(p.3106, Eq. 15)*

### Transcritical condition (R and A coincide at y_1e = 1)

$$
H = \frac{1 + \kappa}{2 (1 - \alpha)}
$$
*(p.3106, Eq. 16)*

### Linearization

$$
x_i = x_{ie} + \varepsilon_i \quad (i = 1,2)
$$
Where: `eps_i` = small displacement from the equilibrium position. *(p.3107, Eq. 17)*

$$
m_1 \frac{d^2 \varepsilon_1}{dt^2} + r_1 \frac{d \varepsilon_1}{dt} + k_1 \varepsilon_1 + k_c (\varepsilon_1 - \varepsilon_2) = p_s k_1 (D_1 \varepsilon_1 + D_2 \varepsilon_2)
$$
*(p.3107, Eq. 18a)*

$$
m_2 \frac{d^2 \varepsilon_2}{dt^2} + r_2 \frac{d \varepsilon_2}{dt} + k_2 \varepsilon_2 + k_c (\varepsilon_2 - \varepsilon_1) = 0
$$
*(p.3107, Eq. 18b)*

### Linearized pressure sensitivities

$$
D_1 = x_{10} \frac{\partial f_p}{\partial x_1}(x_{1e}, x_{2e}) = \frac{2 (1 + \kappa) \beta^2 y_{1e} y_{2e}^2}{(\beta^2 y_{1e}^2 + \kappa y_{2e}^2)^2}
$$
*(p.3107, Eq. 19a)*

$$
D_2 = x_{10} \frac{\partial f_p}{\partial x_2}(x_{1e}, x_{2e}) = -\frac{2 (1 + \kappa) \beta^3 y_{1e}^2 y_{2e}}{(\beta^2 y_{1e}^2 + \kappa y_{2e}^2)^2}
$$
*(p.3107, Eq. 19b)*

### Characteristic equation (quartic)

$$
s^4 + \left(\frac{r_1}{m_1} + \frac{r_2}{m_2}\right) s^3 + \left(\frac{k_1 + k_c - p_s k_1 D_1}{m_1} + \frac{k_2 + k_c}{m_2} + \frac{r_1 r_2}{m_1 m_2}\right) s^2 + \left(\frac{r_1}{m_1}\frac{k_2 + k_c}{m_2} + \frac{r_2}{m_2}\frac{k_1 + k_c - p_s k_1 D_1}{m_1}\right) s + \frac{k_1 + k_c - p_s k_1 D_1}{m_1}\frac{k_2 + k_c}{m_2} - \frac{k_c}{m_1}\frac{k_c + p_s k_1 D_2}{m_2} = 0
$$
Where: `s` = complex eigenvalue. Stability of each equilibrium is decided by the roots of this quartic. *(p.3107, Eq. 20)*

### Corner point E of the oscillation region

$$
\alpha = \frac{1 + r_1 / r_2}{2 + k_1 / k_2}
$$
Obtained by setting the last two terms of Eq. (20) to zero (at E the two roots of each Hopf bifurcation are both zero). *(p.3108, Eq. 21)*

$$
p_s = \frac{1 + \kappa}{2}\left(\frac{(k_1/k_2)(2 + k_1/k_2) + 1 + r_1/r_2}{(k_1/k_2)(2 + k_1/k_2) - 1 - r_1/r_2}\right)
$$
Using typical values these give alpha = 0.18 and p_s = 0.86. *(p.3108, Eq. 22)*

### Sensitivity identity at the transcritical curve OL

At y_1e = y_2e = 1, Eqs. (19a)/(19b) give

$$
D_1 = -D_2 = \frac{2}{1 + \kappa}
$$
Substituting into Eq. (20) with Eq. (16) makes the constant term vanish, so one root of the characteristic equation is zero: R and A exchange stability there. *(p.3108)*

## Parameters

### Table I: Typical two-mass model parameter values (Ishizaka and Flanagan 1972) *(p.3107)*

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Length of the masses | l_g | cm | 1.4 | — | 3107 | Glottal length |
| Thickness of lower mass | d_1 | cm | 0.25 | — | 3107 | |
| Thickness of upper mass | d_2 | cm | 0.05 | — | 3107 | |
| Half glottal width at rest, lower | x_10 | cm | 0.02 | — | 3107 | Prephonatory position |
| Half glottal width at rest, upper | x_20 | cm | 0.02 | — | 3107 | Equal to x_10 => rectangular glottis, beta = 1 |
| Subglottal pressure | P_s | dyn/cm^2 | 7840 | — | 3107 | ~8 cm H2O |
| Lower mass | m_1 | g | 0.125 | — | 3107 | |
| Upper mass | m_2 | g | 0.025 | — | 3107 | m_1/m_2 = 5 |
| Lower stiffness | k_1 | kdyn/cm | 80 | — | 3107 | |
| Upper stiffness | k_2 | kdyn/cm | 8 | — | 3107 | k_1/k_2 = 10 |
| Coupling stiffness | k_c | kdyn/cm | 25 | — | 3107 | Gives alpha = 25/33 = 0.76 |
| Damping ratio, lower | zeta_1 = r_1 / [2 (m_1 k_1)^(1/2)] | — | 0.1 | — | 3107 | |
| Damping ratio, upper | zeta_2 = r_2 / [2 (m_2 k_2)^(1/2)] | — | 0.6 | — | 3107 | |
| Pressure loss factor | kappa | — | 0.37 | — | 3105, 3107 | Area contraction at glottal inlet |

### Derived normalized quantities and critical values

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Coupling coefficient at typical values | alpha | — | 0.76 | 0-1 | 3106 | alpha = k_c/(k_2 + k_c) |
| Normalized subglottal pressure at typical values | p_s | — | 1.91 | — | 3106 | p_s = l_g d_1 P_s / (k_1 x_10); above p_s2, so R and A exist |
| Prephonatory shape ratio, rectangular | beta | — | 1.0 | — | 3105 | x_10 = x_20 |
| Prephonatory shape ratio, convergent case | beta | — | 1.1 | — | 3109 | x_10 > x_20 |
| Prephonatory shape ratio, divergent case | beta | — | 0.9 | — | 3110 | x_10 < x_20 |
| p_s where A and B annihilate (saddle-node), rectangular | p_s (curve p_s1) | — | 0.40 | — | 3106-3107 | Fig. 4; A and B cancel |
| p_s where R and A coincide (transcritical), rectangular | p_s (curve OL) | — | 3.07 | — | 3107 | Fig. 4 |
| Oscillation threshold p_s, rectangular glottis | p_s | — | 0.41 | — | 3110 | Value at which position I (=R) becomes unstable |
| Oscillation threshold p_s, convergent glottis (beta = 1.1) | p_s | — | 0.43 | — | 3110 | Higher: convergent glottis restricts oscillation |
| Oscillation threshold p_s, divergent glottis (beta = 0.9) | p_s | — | 0.39 | — | 3110 | Lower: divergent glottis aids oscillation |
| Corner point E, coupling | alpha_E | — | 0.18 | — | 3108 | From Eq. (21); minimum alpha for the oscillation region |
| Corner point E, pressure | p_s,E | — | 0.86 | — | 3108 | From Eq. (22) |
| First saddle-node p_s, divergent glottis | p_s | — | 0.89 | — | 3110 | I and II cancel |
| Second saddle-node p_s, divergent glottis | p_s | — | 10.96 | — | 3110 | I and II reappear |
| NDR coupling ratio limit (Conrad & McQueen) | k_c/k_2 | — | 8 | — | 3111 | Corresponds to alpha = 0.11 |
| NDR coupling coefficient limit | alpha | — | 0.11 | — | 3111 | Below the alpha = 0.18 required for oscillation |

### Numerical phase-plane sample points (Figs. 6-9) *(p.3108-3109)*

| Point | alpha | p_s | Figure | Page | Analytical equilibrium A | Numerical result |
|-------|-------|-----|--------|------|--------------------------|------------------|
| P1 | 0.76 | 1.91 | Fig. 6 | 3108 | y_1e = 0.55, y_2e = 0.66 | limit cycle around R and A |
| P2 | 0.3 | 7.5 | Fig. 7 | 3108 | y_1e = 6.75, y_2e = 2.72 | near Hopf for A; R outside limit cycle, A near its center |
| P3 | 0.15 | 7.5 | Fig. 8 | 3108 | y_1e = 7.72, y_2e = 2.01 | spiral center at y_1e = 7.28, y_2e = 1.64 (R unstable, A stable) |
| P4 | 0.9 | 1 | Fig. 9 | 3109 | initial condition y_1e = 0.12, y_2e = 0.21 (position A) | spiral center at y_1e = 1.13, y_2e = 1.10 vs analytical R at 1,1 |

## Equilibrium Structure and Bifurcation Ledger

### Rectangular glottis (beta = 1) *(p.3106-3108)*
- **R** — the rest position `y_1e = y_2e = 1`. Always exists. Stable below Hopf curve EF; unstable above. *(p.3106, p.3107)*
- **A** — second equilibrium, the positive root of Eq. (15) with `y_1e > 0`. Exists for `p_s >= p_s1`. Stable to the left of Hopf curve EG; bifurcates into an unstable position plus a stable limit cycle at EG. *(p.3106, p.3108)*
- **B** — third equilibrium, exists only in the narrow band `p_s1 <= p_s < p_s2`; located close to the y_2 axis. Concluded to have no significant role in oscillation because of its tiny region of existence. *(p.3106, p.3111)*
- **Region counts:** below `p_s1` only R; between `p_s1` and `p_s2` all three (R, A, B); above `p_s2` two (R and A). *(p.3106)*
- **Closed glottis:** solving the linear closed-glottis equilibrium equations yields `x_1e > -x_10` and `x_2e > -x_20`, contradicting the closed condition, so there are **no** closed-glottis equilibria. *(p.3106)*

### Bifurcation curves in Fig. 5 (p_s vs alpha) *(p.3107-3108)*
| Curve | Type | Involves | Meaning | Page |
|-------|------|----------|---------|------|
| EF | Hopf | R | Two complex conjugate roots cross the imaginary axis; R loses stability and a stable limit cycle appears. Lower/right limit of the oscillation region. | 3107-3108 |
| EG | Hopf | A | A loses stability, generating the same stable limit cycle. Left limit of the oscillation region. | 3108 |
| OL | Transcritical | R and A | R and A coincide (Eq. 16) and exchange stability. On portion OE, R stable below / unstable above and A the opposite. On portion EL both are already unstable, so the bifurcation has no visible effect. | 3107-3108 |
| p_s1 | Saddle-node | A and B | A and B coincide and annihilate each other; minimum p_s for the existence of A and B. | 3106-3108 |
| p_s2 | (boundary) | B | Maximum p_s for the existence of B; at `H = kappa` the negative real solution crosses the imaginary axis. | 3106 |

### Convergent glottis (beta = 1.1, alpha = 0.76, k_1/k_2 = 10) *(p.3109-3110, Fig. 10)*
- Three equilibria, renamed I, II, III by ordering of `y_ie` (I largest, II smallest).
- III is equivalent to B; II and III cancel at `p_s = 0.40`. *(p.3109-3110)*
- No transcritical bifurcation between I and II: they never coincide. *(p.3109)*
- II is always unstable, so the oscillation region depends only on the stability of I. *(p.3109)*
- Threshold at which I becomes unstable: `p_s = 0.43`, slightly higher than the rectangular value 0.41. Convergent glottis restricts the oscillation region. *(p.3110)*
- At I the glottis is convergent and wider than at rest (`y_1e > y_2e` and `y_1e > 1`, `y_2e > 1`); at II it is divergent and narrower (`y_1e < y_2e`, `y_1e < 1`, `y_2e < 1`). *(p.3110)*

### Divergent glottis (beta = 0.9, alpha = 0.76, k_1/k_2 = 10) *(p.3110, Fig. 11)*
- Same three equilibria; II and III cancel at `p_s = 0.40`. *(p.3110)*
- The transcritical bifurcation of the rectangular case subdivides into **two saddle-node bifurcations**: I and II cancel at `p_s = 0.89` and reappear at `p_s = 10.96`. *(p.3110)*
- Curious result: for `0.89 < p_s < 10.96` there is **no equilibrium position at all**, yet the limit cycle is still present. *(p.3110)*
- Threshold at which I becomes unstable: `p_s = 0.39`, lower than rectangular and convergent. The divergent glottis helps oscillation by lowering the threshold pressure. *(p.3110)*

## Methods & Implementation Details
- Equations are those of Ishizaka and Flanagan (1972) with their notation preserved. *(p.3104)*
- Restoring force and driving force are piecewise; the collision stiffness `h_i` is retained even though other tissue nonlinearity is dropped. *(p.3104-3105)*
- Normalization `y_i = 1 + x_i/x_i0` makes the rest position `y = 1` and glottal closure at mass i occur at `y_i = 0`. *(p.3105)*
- The analytical route relies on `beta = 1` to collapse Eq. (8) plus Eq. (13) into the quadratic Eq. (15). Non-rectangular cases are solved numerically from Eqs. (8) and (13). *(p.3105, p.3109)*
- Stability determined from the roots of the quartic Eq. (20), which depends on the equilibrium point only through `D_1` and `D_2`. *(p.3107)*
- Numerical integration of the full equations of motion including glottal viscous resistances confirms the analytical equilibrium locations and shows the neglect introduces no significant alteration. *(p.3108)*
- Fig. 3 uses `k_1/k_2 = 10` and `beta = 1`. *(p.3106)*

## Figures of Interest
- **Fig. 1 (p.3105):** Diagram of the two-mass model: masses m_1, m_2, damping r_1, r_2, stiffnesses k_1, k_2, coupling k_c, thicknesses d_1, d_2, displacements x_1, x_2, trachea below and ventricle above.
- **Fig. 2 (p.3106):** Schematic root locus of Eq. (15) in the complex `y_1e` plane with p_s as parameter. At `p_s = p_s1` one root is zero; at `p_s = p_s2` both roots coincide.
- **Fig. 3 (p.3106):** `p_s1` and `p_s2` versus coupling ratio alpha for `k_1/k_2 = 10`, `beta = 1`. Both curves lie between roughly 0.3 and 0.45 over alpha in [0,1]; A exists for `p_s >= p_s1`, B for `p_s1 <= p_s < p_s2`.
- **Fig. 4 (p.3107):** Location of R, A, B in the `y_1`-`y_2` plane with p_s as parameter, `k_1/k_2 = 10`, `alpha = 0.76`, `beta = 1`. Marks `p_s = 0.40` (A, B cancel) and `p_s = 3.07` (R and A coincide). B is close to the y_2 axis and hard to resolve.
- **Fig. 5 (p.3108):** The central bifurcation diagram, p_s (0-10) vs alpha (0-1), with curves EF, EG, OL, p_s1, p_s2 and sample points P1-P4. Corner E is at approximately (alpha = 0.18, p_s = 0.86). The oscillation region is bounded by EF (lower/right) and EG (left) and is strictly smaller than the instability region OEF of R.
- **Fig. 6 (p.3109):** Phase plane, `p_s = 1.91`, `alpha = 0.76` (point P1, typical values). Large limit cycle enclosing both R and A.
- **Fig. 7 (p.3109):** Phase plane, `p_s = 7.5`, `alpha = 0.3` (P2). Near the Hopf bifurcation of A: R lies outside the limit cycle, A near its center.
- **Fig. 8 (p.3109):** Phase plane, `p_s = 7.5`, `alpha = 0.15` (P3). R unstable, A stable; trajectory spirals into A.
- **Fig. 9 (p.3109):** Phase plane, `p_s = 1`, `alpha = 0.9` (P4). R stable, A unstable; trajectory started at A spirals into R.
- **Fig. 10 (p.3110):** Equilibria I, II, III vs p_s for the convergent glottis (`beta = 1.1`). II and III cancel at `p_s = 0.40`; I and II never coincide.
- **Fig. 11 (p.3110):** Equilibria I, II, III vs p_s for the divergent glottis (`beta = 0.9`). II and III cancel at 0.40; I and II cancel at 0.89 and reappear at 10.96.

## Results Summary
- The two-mass model has exactly three equilibrium positions in the rectangular prephonatory case, all in the open-glottis branch; the closed-glottis branch has none. *(p.3106)*
- The oscillation region in the (p_s, alpha) plane is bounded by two Hopf curves and is **strictly contained** in the instability region of the rest position. Instability of R is necessary but not sufficient for oscillation. *(p.3108)*
- The minimum coupling coefficient compatible with oscillation is `alpha = 0.18` at `p_s = 0.86` (point E). *(p.3108)*
- Numerical solutions including viscous glottal resistance agree well with the analytical equilibria (e.g., 7.28 vs 7.72 and 1.64 vs 2.01 for A at P3; 1.13/1.10 vs 1/1 for R at P4). *(p.3108-3109)*
- Convergent glottis raises the threshold (0.43 vs 0.41); divergent glottis lowers it (0.39). *(p.3110)*
- In the divergent case there is a pressure window (0.89 to 10.96) with no equilibrium at all but a persisting limit cycle. *(p.3110)*
- Conrad and McQueen's NDR theory is disproved: NDR requires `alpha <~ 0.11`, which lies outside the oscillation region requiring `alpha >= 0.18`. This also questions the collapsible tube as a suitable vocal fold model. *(p.3111)*

## Limitations
- The two-mass model's parameters are hard to correlate with vocal fold anatomy (Titze 1988); the paper adopts it despite this, for a first analysis. *(p.3104)*
- The vocal tract load is neglected (supraglottal pressure zero); the analysis corresponds to an excised larynx. *(p.3104)*
- Glottal viscous resistances are neglected analytically; only numerical checks justify this. *(p.3105, p.3108)*
- The analytical equilibrium treatment is restricted to the rectangular prephonatory glottis (`beta = 1`); convergent and divergent cases are handled only numerically and only for specific parameter values. *(p.3105, p.3109)*
- The cubic nonlinearity of tissue elasticity is dropped. *(p.3104)*
- **The physiological meaning of the equilibria and bifurcations in terms of phonation is left unclear**, which the author attributes to the adoption of the two-mass model itself. *(p.3111)*
- Experimental research is still needed to confirm and complement the analytical results. *(p.3111)*

## Arguments Against Prior Work
- **Against small-amplitude linearized analyses** (Ishizaka and Matsudaira 1972; Ishizaka 1981; Ishizaka et al. 1987): they linearize about the rest position and so see only a single Hopf bifurcation, missing the additional equilibria and bifurcations. The oscillation region is genuinely smaller than the instability region of R, so their threshold conditions overstate where oscillation occurs. *(p.3104, p.3108)*
- **Against Conrad and McQueen (1988) NDR theory:** they posit oscillation arises when a negative differential resistance (found for weak coupling, `k_c/k_2 < ~8`, i.e. `alpha <~ 0.11`) overcomes the positive resistive part of the aerodynamic impedance. But the oscillation region requires `alpha >= 0.18`, so the NDR region is *outside* the oscillation region. Oscillation is therefore not caused by negative resistance. This also questions the validity of the collapsible tube (Conrad 1983) as a vocal fold model. Lucero notes Conrad and McQueen used `beta = 1.11` while Fig. 5 is for `beta = 1`, but argues the difference is too small to change the conclusion. *(p.3111)*
- **Differences with Titze (1988):** Titze's secondary equilibrium (the position assumed when air is flowing) corresponds to position I here. But Titze assumed small amplitudes about that secondary position, so he did not find equilibria II and III or their bifurcations. In the rectangular case Titze's secondary position sits at the rest position, whereas position I is at the rest position only for p_s below the transcritical value. Titze's equations show the secondary equilibrium disappearing at a certain subglottal pressure in a divergent prephonatory glottis, but do not show it reappearing at a higher pressure as Fig. 11 does. *(p.3110)*

## Design Rationale
- The two-mass model is retained despite its known anatomical shortcomings because it is simple enough to permit analysis *without* the small-amplitude restriction and *including* glottal closure. *(p.3104)*
- Supraglottal pressure is set to zero rather than modeling the tract, justified by the observation that vocal fold oscillation occurs in excised larynges (Baer 1981). *(p.3104)*
- Viscous glottal resistances are dropped analytically but the assumption is validated numerically rather than by an amplitude argument, which the large-amplitude setting forbids. *(p.3105)*
- `beta = 1` (rectangular glottis) is chosen first because it collapses the equilibrium system into a solvable quadratic; the non-rectangular cases are then treated as perturbations. *(p.3105)*
- `p_s` and `alpha` are chosen as control parameters because they are the natural normalized aerodynamic drive and the internal coupling strength, and together span the bifurcation structure. *(p.3107)*
- The existence of multiple equilibria is argued to have a physiological correlate, not to be a mathematical artifact: aerodynamic forces push the folds apart in a convergent glottis and suck them together in a divergent one (Titze 1988), so one expects an equilibrium in a convergent wide glottis and another in a divergent narrow glottis. *(p.3110)*

## Testable Properties
- The two-mass model with a rectangular prephonatory glottis has exactly three equilibrium positions in the open-glottis branch and none in the closed-glottis branch. *(p.3106)*
- With `k_1/k_2 = 10`, `beta = 1`, `alpha = 0.76`, equilibria A and B annihilate at `p_s = 0.40` and R and A coincide at `p_s = 3.07`. *(p.3107)*
- The oscillation region is a strict subset of the instability region of the rest position: there exist (p_s, alpha) with R unstable and no limit cycle. *(p.3108)*
- The minimum coupling coefficient for oscillation is `alpha = 0.18` at `p_s = 0.86` for the typical parameters, computable in closed form from Eqs. (21)-(22). *(p.3108)*
- Oscillation threshold ordering: divergent (0.39) < rectangular (0.41) < convergent (0.43) in normalized subglottal pressure, at `alpha = 0.76`, `k_1/k_2 = 10`, `|beta - 1| = 0.1`. *(p.3110)*
- For a divergent glottis with `beta = 0.9`, no equilibrium position exists for `0.89 < p_s < 10.96`, yet a limit cycle persists. *(p.3110)*
- At the transcritical curve, `D_1 = -D_2 = 2/(1 + kappa)` and the constant term of the quartic Eq. (20) vanishes, so one eigenvalue is exactly zero. *(p.3108)*
- Including glottal viscous resistances shifts the equilibrium locations only slightly (e.g., A at `p_s = 7.5, alpha = 0.15` moves from analytical (7.72, 2.01) to numerical (7.28, 1.64)). *(p.3108)*
- Negative differential resistance occurs only for `k_c/k_2 < ~8` (`alpha <~ 0.11`), which never overlaps the oscillation region. *(p.3111)*
- Setting `p_s` at typical values gives `alpha = 0.76`, `p_s = 1.91`, which lies above `p_s2`, so exactly two equilibria (R and A) exist in the typical condition. *(p.3106)*

## Relevance to Project
Qlatt is a formant/articulatory speech synthesis project whose glottal source model determines voice quality. This paper is directly relevant to any two-mass or self-oscillating glottal source implementation:

- It supplies the complete parameter set (Table I) and the full equations of motion in normalized form, sufficient to implement a two-mass source from scratch.
- It gives an explicit, testable oscillation-region map in `(p_s, alpha)`. A synthesizer that exposes subglottal pressure and coupling as user controls can use Eqs. (21)-(22) to compute the valid region and refuse or warn about parameter combinations that will not phonate.
- The key negative result — instability of the rest position is not sufficient for oscillation — means a naive linear-threshold test for phonation onset (the standard Ishizaka/Titze criterion) will wrongly predict phonation in part of the parameter space. Any onset predicate in the code should be validated against the two Hopf curves, not one.
- The prephonatory shape ratio `beta` gives a direct, cheap control over phonation threshold pressure: divergent lowers, convergent raises it. This is the physical basis for breathiness/pressedness controls tied to prephonatory glottal shape.
- The disproof of the negative-differential-resistance theory rules out an entire family of collapsible-tube glottal source designs.
- The paper connects to the collection's existing Lucero papers (1999 bifurcations of voice onset/offset, 2005 vocal fold bifurcations, 2009 male/female simulation) as their earliest methodological ancestor, and to Ishizaka and Flanagan 1972 as its base model.

## Open Questions
- [ ] What do the equilibria and bifurcations mean in terms of phonation? The author explicitly leaves this unanswered and blames the two-mass model. *(p.3111)*
- [ ] Does the structure survive in a body-cover model closer to vocal fold anatomy (a suggested extension of Titze's model)? *(p.3111)*
- [ ] Can Titze's small-amplitude analysis be extended to incorporate the rectangular and divergent-glottis findings of this work? *(p.3111)*
- [ ] Does the no-equilibrium-but-limit-cycle window in the divergent case (`0.89 < p_s < 10.96`) have any experimental correlate?
- [ ] How does the picture change when the vocal tract load is restored (supraglottal pressure nonzero)?
- [ ] Does equilibrium position B, with its tiny region of existence, ever matter dynamically? The author concludes probably not. *(p.3111)*

## Related Work Worth Reading
- Ishizaka, K., and Flanagan, J. L. (1972). "Synthesis of voiced sounds from a two-mass model of the vocal cords," Bell Syst. Tech. J. 51, 1233-1268. **The base model; Table I values come from here.**
- Titze, I. (1988). "The physics of small-amplitude oscillation of the vocal folds," JASA 83, 1536-1552. **The main comparison target; the secondary equilibrium concept.**
- Conrad, W. A., and McQueen, D. M. (1988). "Two-mass model of the vocal folds: Negative differential resistance oscillation," JASA 83, 2453-2458. **The theory this paper disproves.**
- Guckenheimer, J., and Holmes, P. (1983). *Nonlinear Oscillations, Dynamical Systems, and Bifurcations of Vector Fields.* **The bifurcation-theory reference used throughout.**
- Lucero, J. C. (1993). "The dynamics of the vocal fold oscillation," Ph.D. dissertation, Shizuoka University. **The author's fuller treatment.**
- Ishizaka, K., Kaneko, T., and Matsumura, M. (1987). "Natural frequencies of the vocal folds and voice pitch," Rep. Tech. Comm. Speech Acoust. Soc. Jpn. SP86-119, 31-37. **The linearized Hopf analysis criticized here.**
