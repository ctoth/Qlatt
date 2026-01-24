# 16-Bit vs Float Conversion Audit

**Generated:** 2026-01-23
**File Audited:** `src/klatt-synth.js`
**Reference:** Klatt 80 FORTRAN (`PARCOE.FOR`, `COEWAV.FOR`, `GETAMP.FOR`)

## Executive Summary

Klatt 80 operates in 16-bit integer space (range -32768 to 32767). Our `klatt-synth.js` uses normalized floating-point (-1.0 to 1.0). This difference causes scaling issues when applying Klatt 80's dB offsets directly.

**Key Finding:** The `ndbScale` values are 16-bit space offsets. When applied through `_dbToLinear()` which uses `2^(db/6)`, some combinations produce linear amplitudes that are appropriate for 16-bit but inappropriate for normalized float.

## Reference: Klatt 80 Architecture

### GETAMP Function (GETAMP.FOR)
Converts dB to linear amplitude in 16-bit space:
- Range: -72 dB to +96 dB
- At 0 dB: returns 1.0
- At +96 dB: returns 65536.0
- At -72 dB: returns 0 (cutoff)
- Uses lookup tables (DTABLE, STABLE) for efficient conversion

### NDBSCA Offsets (PARCOE.FOR line 53)
```fortran
DATA NDBSCA/-58,-65,-73,-78,-79,-80,-58,-84,-72,-102,-72,-44/
C              A1  A2  A3  A4  A5  A6  AN  AB  AV   AH  AF AVS
```

### Output Scaling (COEWAV.FOR line 251)
```fortran
ULIPS=(ULIPSV+ULIPSF+STEP)*(170.)
```
The `170` multiplier scales to 16-bit output space.

---

## Issue Catalog

### Issue 1: ndbScale.AV Voicing Amplitude
- **File:** src/klatt-synth.js
- **Line(s):** 442-451, 474
- **Current code:**
```javascript
const ndbScale = {
  AV: -72,
  // ...
};
const voiceGain = this._dbToLinear(voiceDb + ndbScale.AV);
```
- **ndbScale or offset used:** -72
- **What Klatt 80 does:** `NDBAV=NNG0+NNAV+NDBSCA(9)` where NDBSCA(9)=-72. Then `IMPULS=GETAMP(NDBAV)` and later `IMPULS=IMPULS*NNF0` to scale by fundamental frequency.
- **Potential problem:** In Klatt 80, the F0 scaling (`IMPULS*NNF0`) occurs after amplitude calculation. Our code does not include this F0 scaling. The -72 offset alone may be correct, but the F0 amplitude boost is missing.
- **Severity:** MEDIUM - May affect pitch-dependent loudness consistency.

---

### Issue 2: ndbScale.AH Aspiration Changed from -102
- **File:** src/klatt-synth.js
- **Line(s):** 452-454, 480
- **Current code:**
```javascript
// AH was -102 in Klatt 80, but we use -72 to match AV/AF scaling.
// Input AH values are now scaled to Klatt 80 levels (40 vs 55).
AH: -72,
```
- **ndbScale or offset used:** -72 (changed from Klatt 80's -102)
- **What Klatt 80 does:** Uses -102 for AH at NDBSCA(10).
- **Potential problem:** The comment says input values are scaled, but this creates a dependency on the caller providing adjusted values. The 30 dB difference (-72 vs -102) is compensated elsewhere, but this may lead to confusion if callers use Klatt 80 parameter values directly.
- **Severity:** LOW - Already addressed with note, but documenting for completeness.

---

### Issue 3: AVS (Quasi-Sinusoidal Voicing) with *10 Multiplier
- **File:** src/klatt-synth.js
- **Line(s):** 456, 478-479
- **Current code:**
```javascript
AVS: -44,
// ...
const voiceParGain =
  this._dbToLinear(voiceParDb + ndbScale.AVS) * 10 * parallelScale;
```
- **ndbScale or offset used:** -44 with `* 10` multiplier
- **What Klatt 80 does:** `SINAMP=10.*GETAMP(NDBAVS)` (PARCOE.FOR line 135)
- **Potential problem:** The `* 10` matches Klatt 80's source code. However, this was designed for 16-bit space. In normalized float, `* 10` could push the signal to clip if voiceParDb is high. The 10x multiplier in Klatt 80 compensates for the quasi-sinusoidal source being weaker than impulsive.
- **Severity:** MEDIUM - Could cause clipping with high AVS values. May need review of typical AVS ranges.

---

### Issue 4: Master Gain with +44 dB Offset
- **File:** src/klatt-synth.js
- **Line(s):** 487-492
- **Current code:**
```javascript
// Match Klatt80 PLSTEP scaling: GETAMP(G0 + NDBSCA(AF) + 44).
const outputScale = this._dbToLinear(ndbScale.AF + 44);
const masterGain = Math.min(
  5.0,
  this._dbToLinear(goDb) * baseBoost * outputScale
);
```
- **ndbScale or offset used:** ndbScale.AF (-72) + 44 = -28
- **What Klatt 80 does:** Uses 170x scaling at output (COEWAV.FOR line 251) plus the G0 parameter for overall gain.
- **Potential problem:** The +44 offset comes from the PLSTEP formula, but applying it to master gain may not be correct. In Klatt 80, PLSTEP uses `GETAMP(G0 + NDBSCA(AF) + 44)` for burst transient only, not for overall gain. The `Math.min(5.0, ...)` clamp suggests awareness of potential clipping, but this is an ad-hoc fix.
- **Severity:** HIGH - This formula conflates PLSTEP burst scaling with master output scaling. The 170x in Klatt 80 is the final output scale to 16-bit, not applied via GETAMP.

---

### Issue 5: PLSTEP Burst Amplitude with G0 - 50
- **File:** src/klatt-synth.js
- **Line(s):** 670-676
- **Current code:**
```javascript
// Calculate PLSTEP amplitude
// Klatt 80 uses 16-bit integer space; we use normalized float
// G0-28 gives ~9.0 linear (clips), G0-50 gives ~0.7 (safe)
const goDb = params.GO ?? 47;
const burstDb = goDb - 50;
const burstAmplitude = this._dbToLinear(burstDb);
```
- **ndbScale or offset used:** -50 (modified from Klatt 80's -28 equivalent)
- **What Klatt 80 does:** `PLSTEP=GETAMP(NNG0+NDBSCA(AF)+44)` where NDBSCA(AF)=-72, so it's G0-72+44 = G0-28.
- **Potential problem:** This was already fixed from G0-28 to G0-50 to prevent clipping. However, the math shows: G0=47, G0-28=-3 dB would give _dbToLinear(-3)=0.707 which is NOT 9.0. Something else is wrong. Let me recalculate:
  - `_dbToLinear(db) = 2^(db/6)`
  - For db=-3: 2^(-0.5) = 0.707 (correct)
  - For db=19 (G0-28 with G0=47): 2^(19/6) = 2^3.17 = 9.0 (CLIPS!)

  The issue was that G0 is typically 47, so G0-28=19 dB gives ~9x amplitude in float space. The fix to G0-50=-3 gives ~0.7x which is safe.
- **Severity:** LOW - Already fixed, but documents the pattern.

---

### Issue 6: A1-A6 Parallel Formant Scaling
- **File:** src/klatt-synth.js
- **Line(s):** 443-449, 556-563
- **Current code:**
```javascript
A1: -58,
A2: -65,
A3: -73,
A4: -78,
A5: -79,
A6: -80,
// ...
const parallelLinear = [
  this._dbToLinear((params.A1 ?? -70) + n12Cor + ndbScale.A1),
  this._dbToLinear((params.A2 ?? -70) + n12Cor + n12Cor + n23Cor + ndbScale.A2),
  // ... etc
];
```
- **ndbScale or offset used:** -58, -65, -73, -78, -79, -80
- **What Klatt 80 does:** Same offsets in NDBSCA. Additionally applies A2COR/A3COR corrections (lines 86-92, 140-148 in PARCOE.FOR).
- **Potential problem:** The code comments say "A2COR/A3COR corrections removed - we use A1-A6 dB values directly like klatt-syn." However, Klatt 80 uses these corrections to compensate for the first-differenced input signal. Without them, high-frequency formants may be too loud or too quiet depending on formant proximity.
- **Severity:** MEDIUM - The proximity corrections (N12COR etc.) are implemented, but the A2COR/A3COR linear multipliers are missing. This affects spectral balance.

---

### Issue 7: Missing A2COR/A3COR Linear Corrections
- **File:** src/klatt-synth.js
- **Line(s):** 462-463, 556-563
- **Current code:**
```javascript
// Note: Klatt 80 A2COR/A3COR corrections removed - we use A1-A6 dB values directly
// like klatt-syn, to avoid muting issues when F1 is low (e.g., stop releases).
```
- **ndbScale or offset used:** N/A - corrections removed
- **What Klatt 80 does:**
```fortran
DELF1=FLOAT(NNF1)/500.
A2COR=DELF1*DELF1
DELF2=FLOAT(NNF2)/1500.
A2SKRT=DELF2*DELF2
A3COR=A2COR*A2SKRT
A2COR=A2COR/DELF2
// Then: A2P=A2COR*GETAMP(NDB), A3P=A3COR*GETAMP(NDB), etc.
```
- **Potential problem:** These corrections scale formant amplitudes based on F1 and F2 values. When F1 is low (e.g., 200 Hz for stops), A2COR = (200/500)^2 / (F2/1500) can be very small, muting F2. The comment acknowledges this. But in normal vowels, A2COR/A3COR boost higher formants appropriately.
- **Severity:** MEDIUM - Intentionally removed, but affects spectral accuracy for some phonemes.

---

### Issue 8: AB (Bypass) Scaling
- **File:** src/klatt-synth.js
- **Line(s):** 450, 584-590
- **Current code:**
```javascript
AB: -84,
// ...
this._scheduleAudioParam(
  this.nodes.parallelBypassGain.gain,
  this._dbToLinear(params.AB + ndbScale.AB) * parallelScale,
  atTime,
  ramp
);
```
- **ndbScale or offset used:** -84
- **What Klatt 80 does:** `ABP=GETAMP(NNAB+NDBSCA(8))` where NDBSCA(8)=-84.
- **Potential problem:** The bypass path in Klatt 80 uses `ABPAR*UFRIC` directly (COEWAV.FOR line 247). Our code multiplies by parallelScale which may not match the original behavior if parallelScale is not 1.0.
- **Severity:** LOW - Behavior consistent with other parallel gains.

---

### Issue 9: AN (Nasal) Scaling
- **File:** src/klatt-synth.js
- **Line(s):** 449, 592-598
- **Current code:**
```javascript
AN: -58,
// ...
this._scheduleAudioParam(
  this.nodes.parallelNasalGain.gain,
  this._dbToLinear(params.AN + ndbScale.AN) * parallelScale,
  atTime,
  ramp
);
```
- **ndbScale or offset used:** -58
- **What Klatt 80 does:** `ANPP=GETAMP(NNAN+NDBSCA(7))` where NDBSCA(7)=-58.
- **Potential problem:** Same as Issue 8 - parallelScale multiplication may deviate from Klatt 80 behavior.
- **Severity:** LOW - Consistent pattern.

---

### Issue 10: Frication Gain with SW=1 Behavior
- **File:** src/klatt-synth.js
- **Line(s):** 481-483
- **Current code:**
```javascript
const fricDbAdjusted = params.SW === 1 ? Math.max(fricDb, aspDb) : fricDb;
const fricGain =
  this._dbToLinear(fricDbAdjusted + ndbScale.AF) * parallelScale;
```
- **ndbScale or offset used:** -72
- **What Klatt 80 does:** `IF ((NNAH.GT.NNAF).AND.(NNSW.EQ.1)) NNAF=NNAH` (PARCOE.FOR line 125)
- **Potential problem:** The logic matches Klatt 80, but the parallelScale multiplier is not present in original. This could cause frication to be too loud or quiet when parallelScale != 1.
- **Severity:** LOW - Pattern consistent with other parallel gains.

---

### Issue 11: _dbToLinear Cutoff at -72 dB
- **File:** src/klatt-synth.js
- **Line(s):** 348-352
- **Current code:**
```javascript
_dbToLinear(db) {
  if (!Number.isFinite(db) || db <= -72) return 0;
  const clamped = Math.min(96, db);
  return 2 ** (clamped / 6);
}
```
- **ndbScale or offset used:** -72 as cutoff, 96 as max
- **What Klatt 80 does:** `IF (NDB1.LE.-72) RETURN` with GETAMP=0. Uses 6 dB per power-of-2 via lookup tables.
- **Potential problem:** The formula `2^(db/6)` gives:
  - 0 dB -> 1.0
  - -6 dB -> 0.5
  - +6 dB -> 2.0
  - +96 dB -> 2^16 = 65536

  This matches Klatt 80's STABLE array. However, in normalized float space, values >1.0 will clip. The formula is correct but callers must ensure the final result stays in [-1, 1].
- **Severity:** HIGH - The function itself is correct, but it enables amplitudes >1.0 which clip in float space. All callers must be audited for proper scaling.

---

### Issue 12: Differentiator Compensation in Parallel Branch
- **File:** src/klatt-synth.js
- **Line(s):** 567-576
- **Current code:**
```javascript
if (i >= 1) {
  const freq = params[`F${i + 1}`] ?? this.params[`F${i + 1}`];
  if (Number.isFinite(freq) && freq > 0) {
    const w = (2 * Math.PI * freq) / this.ctx.sampleRate;
    const diffGain = Math.sqrt(2 - 2 * Math.cos(w));
    if (diffGain > 0) {
      linear /= diffGain;
    }
  }
}
```
- **ndbScale or offset used:** N/A - frequency-dependent compensation
- **What Klatt 80 does:** No explicit compensation - the differentiator naturally boosts high frequencies.
- **Potential problem:** This compensation divides by diffGain to counteract the differentiator's frequency response. At low frequencies, diffGain is small, so division amplifies the signal significantly. At F2=200 Hz with 48kHz sample rate:
  - w = 2*pi*200/48000 = 0.0262
  - diffGain = sqrt(2 - 2*cos(0.0262)) = sqrt(0.00069) = 0.026
  - Compensation = 1/0.026 = 38x amplification!

  This can cause extreme amplification for low formant frequencies.
- **Severity:** HIGH - Can cause significant amplification and clipping for low formant values.

---

### Issue 13: Klatt 80's 170x Output Scaling Not Implemented
- **File:** src/klatt-synth.js
- **Line(s):** N/A - missing
- **Current code:** No equivalent to `ULIPS=(ULIPSV+ULIPSF+STEP)*(170.)` from COEWAV.FOR line 251.
- **ndbScale or offset used:** N/A
- **What Klatt 80 does:** Scales final output by 170 to left-justify in 16-bit word.
- **Potential problem:** The 170x is specific to 16-bit output formatting. In float space, we don't need this. However, the lack of explicit output normalization means all internal gains must be carefully balanced to produce output in the -1 to +1 range.
- **Severity:** LOW - Not needed for float output, but means other gains must compensate.

---

### Issue 14: Cascaded Resonator Gains
- **File:** src/klatt-synth.js
- **Line(s):** 319-325, 156-165
- **Current code:**
```javascript
for (let i = 0; i < this.nodes.cascade.length; i += 1) {
  const node = this.nodes.cascade[i];
  const formant = formants[i];
  this._setAudioParam(node.parameters.get("frequency"), formant.f, atTime);
  this._setAudioParam(node.parameters.get("bandwidth"), formant.b, atTime);
  this._setAudioParam(node.parameters.get("gain"), 1.0, atTime);  // <-- Always 1.0
}
```
- **ndbScale or offset used:** N/A - hardcoded 1.0
- **What Klatt 80 does:** Cascade resonators don't have individual amplitude controls - they're connected in series.
- **Potential problem:** Setting gain to 1.0 is correct for cascade operation. However, the cascade branch doesn't have explicit gain compensation for the vocal tract transfer function. The cumulative gain of 6 resonators in series could exceed 1.0 at resonance peaks.
- **Severity:** MEDIUM - May cause clipping at resonance peaks if bandwidths are narrow.

---

### Issue 15: Default Parallel Formant dB Values
- **File:** src/klatt-synth.js
- **Line(s):** 56-62
- **Current code:**
```javascript
AN: -70,
A1: -70,
A2: -70,
A3: -70,
A4: -70,
A5: -70,
A6: -70,
AB: -70,
```
- **ndbScale or offset used:** Default -70 dB for all
- **What Klatt 80 does:** No explicit defaults - parameters must be set.
- **Potential problem:** With ndbScale offsets:
  - A1: -70 + (-58) = -128 dB -> cutoff (0)
  - A2: -70 + (-65) = -135 dB -> cutoff (0)

  All defaults effectively mute the parallel branch, which may be intentional but could mask problems.
- **Severity:** LOW - Intentional design for silence when not configured.

---

## Summary Statistics

| Severity | Count | Description |
|----------|-------|-------------|
| HIGH     | 3     | Issues 4, 11, 12 - Can cause clipping or incorrect amplitudes |
| MEDIUM   | 4     | Issues 1, 3, 6, 14 - Affect spectral balance or loudness |
| LOW      | 8     | Issues 2, 5, 7, 8, 9, 10, 13, 15 - Minor or already addressed |

## Recommended Fix Priority

1. **Issue 12 (HIGH):** Differentiator compensation can amplify 38x at low frequencies
2. **Issue 4 (HIGH):** Master gain uses PLSTEP formula incorrectly
3. **Issue 11 (HIGH):** _dbToLinear allows >1.0 output, callers must clamp
4. **Issue 3 (MEDIUM):** AVS *10 multiplier may clip
5. **Issue 14 (MEDIUM):** Cascade resonator gain accumulation
6. **Issue 1 (MEDIUM):** F0 amplitude scaling missing
7. **Issue 6 (MEDIUM):** A2COR/A3COR missing affects spectral balance

## Comparison with klatt-syn (TypeScript Reference)

The klatt-syn implementation by chdh takes a different approach:
- Uses `dbToLin(db) = Math.pow(10, db / 20)` instead of `2^(db/6)` - mathematically equivalent
- Does NOT implement A2COR/A3COR corrections (same as our code)
- Uses peak gain for parallel formants (we do similar with differentiator compensation)
- No 16-bit scaling considerations - pure float throughout

The klatt-syn approach is cleaner for float processing, but also means Klatt 80 parameter values may not directly transfer.
