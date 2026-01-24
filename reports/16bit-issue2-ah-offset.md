# 16-bit Issue 2: AH Offset Investigation

## Summary

Klatt 80 uses NDBSCA(10) = **-102** for AH (aspiration), while AV and AF use **-72**.
Our code changed AH to -72, with a comment about "scaling to Klatt 80 levels (40 vs 55)".

**Finding**: The -102 offset is intentional. Aspiration is inherently 30 dB quieter than voicing/frication in the original Klatt design. The change to -72 is incorrect unless input AH values are scaled down by 30 dB.

## Original Klatt 80 Behavior

### NDBSCA Array (PARCOE.FOR line 53)
```fortran
DATA NDBSCA/-58,-65,-73,-78,-79,-80,-58,-84,-72,-102,-72,-44/
C              A1  A2  A3  A4  A5  A6  AN  AB  AV   AH  AF AVS
```

| Parameter | Offset | Purpose |
|-----------|--------|---------|
| AV (voicing) | -72 | Primary voiced source amplitude |
| AF (frication) | -72 | Frication noise amplitude |
| AH (aspiration) | -102 | Aspiration noise amplitude |

### Why 30 dB Difference?

The computation in PARCOE.FOR:
```fortran
C     SET AMPLITUDE OF VOICING
      NDBAV=NNG0+NNAV+NDBSCA(9)    ! G0 + AV + (-72)
      IMPULS=GETAMP(NDBAV)
C     AMPLITUDE OF ASPIRATION
150   NDBAH=NNG0+NNAH+NDBSCA(10)   ! G0 + AH + (-102)
      AHH=GETAMP(NDBAH)
C     AMPLITUDE OF FRICATION
      NDBAF=NNG0+NNAF+NDBSCA(11)   ! G0 + AF + (-72)
      AFF=GETAMP(NDBAF)
```

For the same input value (e.g., 55 dB):
- AV=55: NDBAV = G0 + 55 - 72 = G0 - 17
- AH=55: NDBAH = G0 + 55 - 102 = G0 - 47
- AF=55: NDBAF = G0 + 55 - 72 = G0 - 17

**AH is 30 dB quieter than AV/AF for identical input values.**

### Physical Motivation

This 30 dB attenuation reflects acoustic reality:
1. **Aspiration** is turbulent noise at the glottis during the open phase
2. **Voicing** is the full glottal pulse with resonant amplification
3. **Frication** is turbulent noise at constrictions with tract amplification

Aspiration lacks the resonant amplification that voicing gets. The noise source is inherently weaker than the voiced pulse. The 30 dB offset compensates for this physical difference.

### Typical Input Values

Looking at the Klatt 80 parameter files (e.g., HA.DOC for /h/):
- Typical AH values: 0-2 during most phonemes
- For /h/: AH rises to maybe 40-55 at maximum

For voicing:
- AV typically 55-60 for voiced sounds

With the -102 offset, AH=55 produces NDBAH = G0 - 47.
With the -72 offset, AV=55 produces NDBAV = G0 - 17.

They're intentionally different scales.

## Our Change

### Current Code (klatt-synth.js lines 449-451)
```javascript
// AH was -102 in Klatt 80, but we use -72 to match AV/AF scaling.
// Input AH values are now scaled to Klatt 80 levels (40 vs 55).
AH: -72,
```

### What "40 vs 55" Means

The comment suggests input AH values were reduced:
- Original Klatt 80: AH values up to ~55
- Our code: AH values up to ~40

Reduction: 55 - 40 = 15 dB

But that's not 30 dB. There's a 15 dB discrepancy.

### The Math

If we change offset from -102 to -72, that's +30 dB louder.
If we reduce input from 55 to 40, that's -15 dB quieter.
Net effect: +15 dB louder than original Klatt 80.

**Our aspiration is 15 dB too loud** compared to original Klatt 80 behavior.

## Verification in Current Code

From `tts-frontend-rules.js`:
```javascript
HH: {  // /h/
    AH: 40,  // Aspiration
    ...
}
```

From `PHONEME_TEMPLATES.H`:
```javascript
H: {
    AH: 30,
    ...
}

PH: {
    AH: 35, // Aspiration
}

TH: {
    AH: 33,
}
```

These are relatively low values (30-40), but with -72 offset instead of -102, they're still 15 dB too loud.

## klatt-syn Reference

Looking at `~/src/klatt-syn/src/Klatt.ts`:
- klatt-syn uses dB values directly without these NDBSCA offsets
- It doesn't implement the Klatt 80 amplitude scaling system
- Not a useful reference for this specific issue

## Options

### Option A: Restore -102, Keep Input Values
```javascript
AH: -102,  // Original Klatt 80 offset
```
Then adjust input AH values up by 30 dB (AH: 40 becomes AH: 70).

**Problem**: Max AH would need to be 70-85 for reasonable levels.

### Option B: Keep -72, Reduce Input Values by 30 dB
```javascript
AH: -72,  // Matches AV/AF scaling
```
And use AH values 30 dB lower (AH: 40 becomes AH: 10).

**Problem**: Already done partially (15 dB), need 15 more dB reduction.

### Option C: Keep Current (Accept 15 dB Louder)
The current state has aspiration 15 dB louder than original Klatt 80.
If it sounds acceptable, leave it. Document the discrepancy.

### Option D: Adjust Offset to -87 (Split the Difference)
```javascript
AH: -87,  // 15 dB quieter than AV/AF, 15 dB louder than original
```
This would match current input levels (40) to original Klatt 80 output levels.

## Recommendation

**Option D (-87) is mathematically correct** for current input values.

The comment says AH values were scaled from 55 to 40 (15 dB reduction).
To compensate, offset should change from -102 to -87 (15 dB increase).
This preserves original Klatt 80 output amplitudes.

Current -72 offset is 15 dB too aggressive.

### Verification Math
- Original: AH=55, offset=-102 → NDBAH = G0 + 55 - 102 = G0 - 47
- Option D: AH=40, offset=-87 → NDBAH = G0 + 40 - 87 = G0 - 47

**Same output amplitude.**

## Conclusion

The change from -102 to -72 is **not correct** without a corresponding 30 dB reduction in input AH values. The current code has a 15 dB discrepancy making aspiration louder than intended.

### Recommended Fix
Either:
1. Change `AH: -72` to `AH: -87` (correct for current 40 dB input values)
2. Or reduce all input AH values by 15 dB (e.g., 40→25, 35→20, 30→15)

### Documentation Update
The comment should explain:
```javascript
// AH: Klatt 80 uses -102, but we use -87 because our input AH values are
// ~15 dB lower than Klatt 80 (max ~40 vs ~55). This maintains the same
// output amplitude relationship between aspiration and voicing.
AH: -87,
```

## Files Examined

- `~/src/klatt80/PARCOE.FOR` - NDBSCA array and amplitude calculations
- `~/src/klatt80/COEWAV.FOR` - Signal flow for aspiration (AASPIR, AHH)
- `~/src/klatt80/GETAMP.FOR` - dB to linear conversion
- `~/src/klatt-syn/src/Klatt.ts` - Modern reference (not applicable)
- `src/klatt-synth.js` - Current implementation
- `src/tts-frontend-rules.js` - Current AH input values
