# Schoentgen 2001 - Stochastic Models of Jitter

## Implementation Notes

### Core Concept

Jitter = small, random, involuntary perturbations of glottal cycle lengths. This paper develops five stochastic models of increasing complexity based on the ribbon model of vocal fold vibration, combining correlation-free stochastic disturbances with the microtremor (physiological low-frequency modulation).

### The Ribbon Model of Vocal Fold Vibration (Titze 1984, 1988)

The ribbon model treats the glottis as a single rigid body with:
- A static prephonatory and a dynamic normalized glottal half-width
- Two anatomical constants: T_m (period delay) and a_0 (prephonatory half-width)
- Phase delay Phi between upper and lower glottal margins:

```
Phi = 2*pi*f_0*T_m                                        (2)
```

where f_0 is instantaneous frequency, T_m is typically 1.0 ms for males and 0.35 ms for females (Titze 1989).

The glottal cycle length and thickness depend on frequency f_0 via:

```
t_0 = 1/f_0                                               (7)
delta_t = 2*T_m                                           (8)
```

### Key Relationships

Instantaneous frequency f_0, glottal cycle length t_0, and fundamental frequency f_s:

```
df/dt = 2*pi*f_0^2                                        (assumes angular freq)
dt_0 = -df/(2*pi*f_0^2)
t_0 = 1/f_s + delta_t = 1/f_s + 2*T_m                    (9)
```

### Five Stochastic Models

#### Model I: Random Walk (Simplest)

Correlation-free disturbance of instantaneous frequency of one rigid glottal wall.

```
f_n = f_0 + b*e_n                                         (10)
t_n = 1/f_s + 2*T_m*f_0/f_n                               (can be linearized)
```

Linearized form:
```
t_n = t_s + (2*T_m/f_s)*b*e_n                             (11)
```

where f_s is unperturbed frequency, b is a constant scaling white noise e_n.

Properties:
- Cycle length perturbations are **stationary and ergodic** in practice
- Correlation-free disturbance is replaced by artificial microtremor
- Decorrelated jitter perturbations are stationary

#### Model II: Filtered Noise (Microtremor)

Adds synthetic microtremor via a second-order linear autoregressive model:

```
v_n = a_1*v_{n-1} + a_2*v_{n-2} + e_n                    (16)
```

where v_n is the disturbance, generating a single spectral peak at the microtremor frequency. The filter coefficients (Steiglitz 1996):

```
B = cos(2*pi*f_micro/f_sample)
R = 1 - pi*W/f_sample                                     (where W = bandwidth)
a_1 = (1 - R^2)*sin(alpha), alpha = ... (complex)
```

Alternative: linear first-order model (Eq. 9) where spectral peak is at 0 Hz. Correlation-free coefficient b_0 controls the flat spectral floor relative to the microtremor peak.

#### Model III: Disturbed Coupled Oscillator

Models coupling between left and right glottal walls. Assumes stochastic disturbances of left and right are **not identical** but **temporally correlated**.

Key equations for phase disturbances:
```
theta_L,n = theta_0 + 2*pi*f_0*delta_K + K*sin(theta_0 + ...)*e_L
theta_R,n = theta_0 + 2*pi*f_0*delta_K - K*sin(theta_0 + ...)*e_R    (18)
```

The coupling constant K controls synchronization:
- When K < 1: coupling is stable, phases converge
- Coupling decreases when disturbances increase
- Coupling decreases with shorter cycles (higher F0)
- Asymmetric coupling biases the phase perturbations

#### Model IV: Disturbed Vocal Fold Model (Out-of-Phase)

Extends Model III by considering upper and lower margin movements that may be out of phase. Symbol D designates delay in number of time steps. Cycle length r is defined by the phase of the upper margin:

```
r = 2*pi*(int(phi_upper/(2*pi)) + 1) - phi_upper         (23)
```

Mean M and Variance V obtained by conventional random-walk rules.

#### Model V: Stochastic (Combined) Model

Combines Models I-IV: phase disturbances of upper/lower, left/right synthetic microtremor, and correlation-free noise.

Eight coupled equations (24) modeling:
- Left and right lower margin disturbances (with microtremor AR(2))
- Left and right upper margin disturbances (with coupling)
- Correlation-free noise for each

Must be solved numerically. Auxiliary functions determine existence of stable solutions when disturbances are small.

### Default Parameter Values (Table I)

| Parameter | Default | Range |
|-----------|---------|-------|
| Average cycle length t_s (s) | 0.01 | 0.005-0.018 |
| Coupling constant (right) K_r | 0.1 | 0-1 |
| Difference (right-left) abs(K_r - K_l) | 0 | 0-1 |
| Wave velocity c (cm/s) | 200 | 200-400 |
| Microtremor frequency f_micro (Hz) | 5 | 5-8 |
| Microtremor bandwidth W (Hz) | 4 | 0.25 | 0.65 |
| Peak value of driving noise b_0 | 0.23 | 0-0.65 |
| Peak value of white disturbances b_r, b_l | 0 | 0-1 |

### Simulation Parameters

- Time step delta_t: set at sampling frequency 5x10^3 (chosen to satisfy Nyquist for microtremor)
- Surface wave speed c: fixed at 200 cm/s (Titze 1989)
- Delay D: delay in radians between lower and upper margin movements, determined via `D = 2*pi*f_0*T_m`

### Key Findings for Synthesis Implementation

1. **Jitter is dominated by microtremor**: The primary source of cycle-to-cycle perturbation in normal voices is microtremor (correlation-free frequency ~5 Hz, bandwidth ~4 Hz), not correlation-free noise.

2. **Decorrelated jitter** (perturbations after removing microtremor trend) is stationary and approximately normally distributed. The standard deviation of decorrelated jitter is roughly two-thirds the standard deviation of raw jitter.

3. **AR model order**: Model V perturbation time series are best fit by AR models of order 5-8. The AR coefficients typically varied between 5 and 13.

4. **Statistical markers**:
   - Jitter percent (coefficient of variation) for normal voices: typically 0.34-0.63% (Table III)
   - Decorrelated jitter is less than 1% for normal voices
   - Lag one autocorrelation: typically 0.53-0.69
   - Perturbations of adjacent cycles are **positively correlated** (lag 1 autocorrelation > 0)

5. **Coupling effects**: Increasing coupling constants reduced decorrelated jitter and increasing differences between left/right coupling constants raised decorrelation.

6. **Modulation level**: The modulation level was a measure of the magnitude of cycle length perturbations owing to microtremor. Modulation level = (max deviation - min deviation) / (average cycle length * 100).

7. **Relationship between jitter and pathology**: Increased jitter tracks with laryngeal pathology. The model shows that laryngeal pathologies can increase jitter via external disturbances OR via changes in the coupling constant and internal asymmetry.

### Implementation Recipe for Klatt Synthesizer

To add realistic jitter to a Klatt synthesizer F0 contour:

1. **Generate microtremor** using a second-order AR filter driven by white noise:
   ```
   v[n] = a1*v[n-1] + a2*v[n-2] + b0*e[n]
   ```
   with f_micro = 5 Hz, bandwidth W = 4 Hz, and b0 = 0.23 (default).

2. **Add correlation-free perturbation** at much smaller amplitude (b_r, b_l near 0 for normal voice).

3. **Convert frequency perturbation to cycle length perturbation**:
   ```
   t_n = t_s + (2*T_m/f_s) * v_n
   ```

4. **For pathological/rough voices**: increase b0 (driving noise), increase b_r/b_l (correlation-free disturbances), and/or decrease coupling constant K to simulate asymmetric vocal fold vibration.

5. **Typical jitter magnitudes**:
   - Normal voice: coefficient of variation ~0.5%, lag-1 autocorrelation ~0.6
   - Moderately rough: coefficient of variation ~1-2%
   - Severely rough: coefficient of variation > 3%
