# Stevens 1991 Paper-Faithful Spec (Source of Truth)

## Primary Source
- `papers/Stevens_1991_HL_Parameters/1-s2.0-S0095447019303109-main.pdf`
- Citation: Stevens, K. N., & Bickley, C. A. (1991). *Constraints among parameters simplify control of Klatt formant synthesizer*. Journal of Phonetics, 19, 161-174.

## Ground-Truth Requirements from the Paper

### HL control parameter set (Table I)
The HL layer must expose these 10 parameters:
1. `f1`
2. `f2`
3. `f3`
4. `f4`
5. `f0`
6. `ag`
7. `ac`
8. `an`
9. `st`
10. `pm`

### Required ranges/interpretation (Table I text)
- `ag`: usually `0.0..0.4 cm^2` (modal about `0.03..0.05`)
- `ac`: `0.0..0.4 cm^2` for consonantal constrictions
- `an`: `0.0..1.0 cm^2`
- `st`: `0 dB` (max obstacle) to `-10 dB` (minimal obstacle)
- `pm`: usually `-0.5*Ps .. +0.2*Ps` (fraction of subglottal pressure)

### Mapping behavior the implementation must represent
- `ag`/`ac`/subglottal pressure jointly determine airflow and intraoral pressure.
- `AH` and `AF` are derived from turbulence source strengths (glottal + supraglottal), with `st` correction for constriction noise.
- `AV` is derived from transglottal pressure plus glottal abduction state.
- `B1` varies with glottal opening.
- Nasal coupling from `an` yields `FNP/FNZ` behavior (including small-effect region at low `an`).
- Large `ag` causes an `F1` upward shift relative to `f1`.

## Implementation Policy for This Repo
The paper is partly qualitative. Where exact equations are not given, the implementation may use explicit approximations, but must:
- document each approximation inline,
- keep all 10 HL parameters exposed,
- avoid claiming exact paper equations where unavailable,
- wire derived controls to real graph parameters (not metadata-only).

## Acceptance Checklist (Issue Closure)
- [ ] Citation text references Journal of Phonetics 19:161-174 (no stale JASA 88(3) text).
- [ ] Experiment exposes all 10 HL params (`f1 f2 f3 f4 f0 ag ac an st pm`).
- [ ] `pm` is an HL control; `ps` is not presented as a replacement HL parameter.
- [ ] `ag/ac/an/st/pm` ranges/defaults align to Table I ranges above.
- [ ] Aerodynamic mapping derives and wires `AV`, `AH`, `AF`, and `B1` from HL controls.
- [ ] Nasal/stridency pathways are implemented (`an` and `st` have signal effect, not dead params).
- [ ] `ac` defaults are consistent between stevens91 semantics and registry.
- [ ] Any remaining non-exact mappings are clearly labeled as approximations.
