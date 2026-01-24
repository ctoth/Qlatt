# 16-bit Issue 11: _dbToLinear Caller Audit

## Summary

Audited all 18 `_dbToLinear()` call sites in `klatt-synth.js` to identify clipping risks.

**The `_dbToLinear()` function:**
```javascript
_dbToLinear(db) {
  if (!Number.isFinite(db) || db <= -72) return 0;
  const clamped = Math.min(96, db);
  return 2 ** (clamped / 6);  // At +96 dB: 2^16 = 65536
}
```

| dB Input | Linear Output |
|----------|---------------|
| -72      | 0             |
| -60      | 0.001         |
| -30      | 0.031         |
| 0        | 1.0           |
| +6       | 2.0           |
| +30      | 32.0          |
| +60      | 1024          |
| +96      | 65536         |

**For normalized float audio (-1.0 to +1.0), values > 1.0 will clip.**

---

## Call Site Analysis

### Call site 1: Bypass gain (line 297)
- **Location**: `_applyAllParams()`
- **Formula**: `this._dbToLinear(p.AB) * parallelScale`
- **Input source**: `p.AB` from `this.params.AB`
- **Default value**: -70 (from `_defaultParams`)
- **Typical range**: 0-80 dB per task prompt, but actual usage appears to be -70 to ~60
- **Max possible dB**: If user sets AB=80, input is 80
- **Max output**: `2^(80/6) * parallelScale = 8192 * 1.0 = 8192`
- **Risk**: **HIGH** - Raw dB value without ndbScale offset
- **Fix needed**: Yes - should apply ndbScale.AB (-84) or clamp input

### Call site 2: Nasal gain (line 302)
- **Location**: `_applyAllParams()`
- **Formula**: `this._dbToLinear(nasalDb) * parallelScale` where `nasalDb = p.parallelNasalGain ?? p.AN`
- **Input source**: `this.params.AN` or `this.params.parallelNasalGain`
- **Default value**: -70
- **Typical range**: 0-80 dB per Klatt spec
- **Max possible dB**: 80
- **Max output**: `2^(80/6) * 1.0 = 8192`
- **Risk**: **HIGH** - Raw dB value without ndbScale offset
- **Fix needed**: Yes - should apply ndbScale.AN (-58) or clamp input

### Call site 3: Definition (line 348)
- **Location**: `_dbToLinear()` method definition
- **Risk**: N/A - this is the function definition itself

### Call site 4: Parallel formant gain (line 361)
- **Location**: `_setParallelFormantGain()`
- **Formula**: `const linear = this._dbToLinear(dbValue) * scale`
- **Input source**: `dbValue` parameter (A1-A6 values)
- **Default value**: -70
- **Typical range**: 0-80 dB for A1-A6
- **Max possible dB**: 80
- **Max output**: `2^(80/6) * 1.0 = 8192`
- **Risk**: **HIGH** - No ndbScale applied here, but see Call site 10-15 which DO apply ndbScale
- **Note**: This is called from two places - `_applyAllParams` (no ndbScale) and `_applyKlattParams` (with ndbScale)
- **Fix needed**: Depends on caller context - `_applyAllParams` path is risky

### Call site 5: Voice gain (line 469)
- **Location**: `_applyKlattParams()`
- **Formula**: `this._dbToLinear(voiceDb + ndbScale.AV)` where `voiceDb = params.AV ?? -70`, `ndbScale.AV = -72`
- **Input source**: Klatt frame `params.AV`
- **Default value**: -70
- **Typical range**: 0-70 dB (from task prompt)
- **Max possible dB**: 70 + (-72) = -2
- **Max output**: `2^(-2/6) = 0.79`
- **Risk**: **NONE** - ndbScale offset ensures safe output
- **Fix needed**: No

### Call site 6: Voice parallel gain (line 474)
- **Location**: `_applyKlattParams()`
- **Formula**: `this._dbToLinear(voiceParDb + ndbScale.AVS) * 10 * parallelScale` where `voiceParDb = params.AVS ?? -70`, `ndbScale.AVS = -44`
- **Input source**: Klatt frame `params.AVS`
- **Default value**: -70
- **Typical range**: 0-70 dB
- **Max possible dB**: 70 + (-44) = 26
- **Max linear**: `2^(26/6) = 20.2`
- **With *10 multiplier**: 202
- **With parallelScale (typ 1.0)**: 202
- **Risk**: **MEDIUM** - The *10 multiplier amplifies significantly
- **Fix needed**: Maybe - the *10 appears intentional (Issue 3 in audit), but could clip if AVS is high

### Call site 7: Aspiration gain (line 475)
- **Location**: `_applyKlattParams()`
- **Formula**: `this._dbToLinear(aspDb + ndbScale.AH)` where `aspDb = params.AH ?? -70`, `ndbScale.AH = -72`
- **Input source**: Klatt frame `params.AH`
- **Default value**: -70
- **Typical range**: 0-70 dB (actual usage: 0-40 per Klatt 80 levels)
- **Max possible dB**: 70 + (-72) = -2
- **Max output**: `2^(-2/6) = 0.79`
- **Risk**: **NONE** - ndbScale offset ensures safe output
- **Fix needed**: No

### Call site 8: Frication gain (line 478)
- **Location**: `_applyKlattParams()`
- **Formula**: `this._dbToLinear(fricDbAdjusted + ndbScale.AF) * parallelScale` where `fricDbAdjusted = params.AF ?? -70`, `ndbScale.AF = -72`
- **Input source**: Klatt frame `params.AF`
- **Default value**: -70
- **Typical range**: 0-80 dB (actual usage: 0-55 per Klatt 80 levels)
- **Max possible dB**: 80 + (-72) = 8
- **Max output**: `2^(8/6) * 1.0 = 2.52`
- **Risk**: **LOW** - Could exceed 1.0 if AF is high, but typical values are safe
- **Fix needed**: Consider clamping at AF > 72

### Call site 9-14: Parallel formant gains A1-A6 (lines 549-554)
- **Location**: `_applyKlattParams()`
- **Formulas**:
  - A1: `_dbToLinear((params.A1 ?? -70) + n12Cor + ndbScale.A1)` where `ndbScale.A1 = -58`
  - A2: `_dbToLinear((params.A2 ?? -70) + n12Cor + n12Cor + n23Cor + ndbScale.A2)` where `ndbScale.A2 = -65`
  - A3: `_dbToLinear((params.A3 ?? -70) + n23Cor + n23Cor + n34Cor + ndbScale.A3)` where `ndbScale.A3 = -73`
  - A4: `_dbToLinear((params.A4 ?? -70) + n34Cor + n34Cor + ndbScale.A4)` where `ndbScale.A4 = -78`
  - A5: `_dbToLinear((params.A5 ?? -70) + ndbScale.A5)` where `ndbScale.A5 = -79`
  - A6: `_dbToLinear((params.A6 ?? -70) + ndbScale.A6)` where `ndbScale.A6 = -80`
- **Input source**: Klatt frame `params.A1` through `params.A6`
- **Default value**: -70
- **Typical range**: 0-80 dB
- **nXYCor range**: 0-10 (proximity correction, adds up)

**Worst case analysis for each:**

| Param | Max A | ndbScale | Max nCor | Total dB | Linear | Risk |
|-------|-------|----------|----------|----------|--------|------|
| A1    | 80    | -58      | +10      | 32       | 40.3   | HIGH |
| A2    | 80    | -65      | +30      | 45       | 181    | HIGH |
| A3    | 80    | -73      | +30      | 37       | 72.3   | HIGH |
| A4    | 80    | -78      | +20      | 22       | 13.5   | MED  |
| A5    | 80    | -79      | 0        | 1        | 1.12   | LOW  |
| A6    | 80    | -80      | 0        | 0        | 1.0    | NONE |

- **Risk**: **HIGH** for A1, A2, A3 - proximity corrections can push values well above 1.0
- **Fix needed**: Yes - need to clamp maximum dB or apply post-linear scaling

### Call site 15: Bypass gain in Klatt params (line 572)
- **Location**: `_applyKlattParams()`
- **Formula**: `this._dbToLinear(params.AB + ndbScale.AB) * parallelScale` where `ndbScale.AB = -84`
- **Input source**: Klatt frame `params.AB`
- **Typical range**: 0-80 dB
- **Max possible dB**: 80 + (-84) = -4
- **Max output**: `2^(-4/6) * 1.0 = 0.63`
- **Risk**: **NONE** - ndbScale offset ensures safe output
- **Fix needed**: No

### Call site 16: Nasal gain in Klatt params (line 580)
- **Location**: `_applyKlattParams()`
- **Formula**: `this._dbToLinear(params.AN + ndbScale.AN) * parallelScale` where `ndbScale.AN = -58`
- **Input source**: Klatt frame `params.AN`
- **Typical range**: 0-80 dB
- **Max possible dB**: 80 + (-58) = 22
- **Max output**: `2^(22/6) * 1.0 = 13.5`
- **Risk**: **MEDIUM** - Could clip at high AN values
- **Fix needed**: Consider clamping or reducing max AN input

### Call site 17: Burst transient (line 661)
- **Location**: `_scheduleBurstTransient()`
- **Formula**: `this._dbToLinear(burstDb)` where `burstDb = goDb - 50`, `goDb = params.GO ?? 47`
- **Input source**: Calculated from G0
- **Typical G0**: 40-60 dB
- **Max possible dB**: 60 - 50 = 10
- **Max output**: `2^(10/6) = 3.17`
- **Risk**: **LOW** - Burst is intentionally attenuated
- **Note**: Previously was G0-28 which caused clipping, now fixed at G0-50
- **Fix needed**: No (already fixed)

### Call site 18: setParam AN/parallelNasalGain (line 860)
- **Location**: `setParam()` switch case
- **Formula**: `this._dbToLinear(value)`
- **Input source**: Direct user/API parameter
- **Typical range**: 0-80 dB
- **Max possible dB**: 80
- **Max output**: `2^(80/6) = 8192`
- **Risk**: **HIGH** - No ndbScale applied
- **Fix needed**: Yes - should apply ndbScale.AN (-58)

### Call site 19: setParam AB (line 875)
- **Location**: `setParam()` switch case
- **Formula**: `this._dbToLinear(value)`
- **Input source**: Direct user/API parameter
- **Typical range**: 0-80 dB
- **Max possible dB**: 80
- **Max output**: `2^(80/6) = 8192`
- **Risk**: **HIGH** - No ndbScale applied
- **Fix needed**: Yes - should apply ndbScale.AB (-84)

---

## Risk Summary

| Risk Level | Call Sites | Issue |
|------------|------------|-------|
| **HIGH**   | 1, 2, 4*, 9-12, 18, 19 | Raw dB without ndbScale, or proximity corrections can push above 1.0 |
| **MEDIUM** | 6, 13, 16 | *10 multiplier or moderate values exceeding 1.0 |
| **LOW**    | 8, 14, 17 | Theoretical clipping at extreme values |
| **NONE**   | 5, 7, 15 | ndbScale ensures output stays below 1.0 |

*Call site 4 depends on caller - risky from `_applyAllParams`, safe from `_applyKlattParams`

---

## Recommendations

### Priority 1: Fix setParam() cases (lines 860, 875)
The `setParam()` API accepts raw dB values but doesn't apply ndbScale offsets.
**Fix**: Apply appropriate ndbScale offsets before calling `_dbToLinear()`.

### Priority 2: Fix _applyAllParams() cases (lines 297, 302, and indirect via 361)
The initialization path uses raw dB values without ndbScale.
**Fix**: Either:
- Apply ndbScale offsets here too, OR
- Ensure initialization only uses safe default values (-70)

### Priority 3: Review proximity correction accumulation (lines 549-552)
The nXYCor values can add 10-30 dB on top of already high A1-A4 values.
**Fix**: Consider:
- Clamping total dB before `_dbToLinear()`
- Reducing max input A1-A4 values in TTS frontend
- Adding a final clamp on the linear output

### Priority 4: Review AVS *10 multiplier (line 474)
This is a known issue (Issue 3) that can produce values up to 200x.
**Fix**: Investigate original Klatt 80 intent and either:
- Remove the *10 if not needed
- Apply post-multiplication clamping

---

## Appendix: ndbScale Reference

From `_applyKlattParams()`:
```javascript
const ndbScale = {
  A1: -58,   // max 80 + (-58) = 22 -> 13.5 linear (before nCor)
  A2: -65,   // max 80 + (-65) = 15 -> 5.66 linear (before nCor)
  A3: -73,   // max 80 + (-73) = 7  -> 2.24 linear (before nCor)
  A4: -78,   // max 80 + (-78) = 2  -> 1.26 linear (before nCor)
  A5: -79,   // max 80 + (-79) = 1  -> 1.12 linear
  A6: -80,   // max 80 + (-80) = 0  -> 1.0 linear
  AN: -58,   // max 80 + (-58) = 22 -> 13.5 linear
  AB: -84,   // max 80 + (-84) = -4 -> 0.63 linear
  AV: -72,   // max 70 + (-72) = -2 -> 0.79 linear
  AH: -72,   // max 70 + (-72) = -2 -> 0.79 linear
  AF: -72,   // max 80 + (-72) = 8  -> 2.52 linear
  AVS: -44,  // max 70 + (-44) = 26 -> 20.2 linear (then *10 = 202!)
};
```
