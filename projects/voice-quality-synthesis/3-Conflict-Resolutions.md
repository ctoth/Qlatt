## 3. Conflict Resolutions

### 3.1 Rd Systems

**Conflict:** Both voice-quality-fa and fant1997 plans add phoneme-specific Rd values.

**Resolution:** **Unified additive system**

- Base Rd from speaker config (0.7 male, 1.4 female)
- Phoneme delta added (from PHONEME_RD table)
- Other factors added (stress, effort, emotion, phrase)
- Single clamping step at end

The Fa override parameter (voice-quality-fa Option B) is **rejected** because:
1. Fa is derivable: `Fa = 1/(2*pi*Ra*T0)` where Ra comes from Rd
2. Adding Fa creates parameter ambiguity (which takes precedence?)
3. vanDinther shows Ra/Fa is the primary perceptual dimension anyway

If direct Fa control is ever needed, use:
```
Rd_from_Fa ≈ (1.0 + 100/(2*pi * Fa * T0)) / 4.8
```

### 3.2 Stress Effects

**Conflict:** Three plans modify stressed syllables:
- fujisaki: F0 accent commands
- vocal-effort: F0 shift + F1 shift + spectral tilt
- fant1997: Rd decrease (more adducted)

**Resolution:** **Layered, non-redundant effects**

```
STRESSED SYLLABLE PROCESSING ORDER:

1. Fujisaki accent command → F0 local peak (Aa magnitude)
   - Only affects F0 contour shape
   - Does NOT affect Rd or effort

2. Effort assignment → effort = +3.0 dB for stress=1
   - effort → F0 shift (+15.3 Hz at effort=3)
   - effort → F1 shift (+10.5 Hz at effort=3)
   - effort → spectral tilt (A1/A2/A3 differential)
   - effort → Rd shift (-0.15 at effort=3)

3. Stress Rd delta → ΔRd = -0.15 for stress=1
   - Direct Rd modulation (adds to effort effect)

TOTAL EFFECT ON STRESSED VOWEL:
- F0: Fujisaki accent peak + effort shift (+15 Hz)
- F1: effort shift (+10 Hz)
- Rd: stress delta (-0.15) + effort delta (-0.15) = -0.3
- Spectral tilt: Flatter (more energy in F2/F3)
```

The Fujisaki F0 accent is **additive** with effort-based F0 shift because:
- Fujisaki models phrase-level prosodic structure
- Effort models within-syllable acoustic realization
- Both are linguistically meaningful, not redundant

### 3.3 F0 Generation Order

**Conflict:** Fujisaki contour vs effort-based F0 shift - which comes first?

**Resolution:** **Fujisaki first, effort applied after**

```
F0_final = (F0_fujisaki) + (effort * 5.1 Hz/dB)
```

**Rationale:**
1. Fujisaki generates the phrase-level contour (declination, accents)
2. Effort shifts the entire contour up/down based on local loudness
3. This matches the physical model: laryngeal tension (Fujisaki) + subglottal pressure (effort)

**Implementation:**

```javascript
// In TTS frontend
const f0Fujisaki = rule_GenerateF0ContourFujisaki(phonemeList, baseF0);

// Effort applied per-frame in semantics
// realize.f0Effective: "F0 + effort * effortCoeffs.f0HzPerDb"
```

### 3.4 F1 Processing Chain

**Conflict:** Multiple systems modify F1:
- vocal-effort: F1 += effort * 3.5 Hz/dB
- spg-trajectory-smoothing: F1 smoothed over time
- holmes-1983: F1 phase correction in parallel branch

**Resolution:** **Sequential processing, no conflict**

```
F1 PROCESSING CHAIN:

1. Base F1 from phoneme targets
   ↓
2. Effort shift: F1_effective = F1 + effort * 3.5
   (Applied in semantics.yaml realize rules)
   ↓
3. SPG smoothing (if enabled): F1_smooth = SPG(F1_effective)
   (Applied as track preprocessing)
   ↓
4. Holmes phase correction (in audio graph only)
   (Parallel branch F1 signal shaping, does not change F1 value)
```

These are **independent, sequential stages**:
- Effort shifts the target
- SPG smooths the trajectory
- Holmes corrects the phase (signal processing, not parameter)

---

