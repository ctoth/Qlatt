# Guide: Fixing 16-bit vs Float Conversion Issues

## Background

Klatt 80 FORTRAN operates in 16-bit integer space (-32768 to 32767). Our `klatt-synth.js` uses normalized floating-point (-1.0 to 1.0). Direct application of Klatt 80 dB offsets and formulas can cause:

1. **Clipping** - amplitudes that were safe in 16-bit become > 1.0 in float
2. **Double application** - G0 or other offsets applied twice
3. **Wrong formulas** - using one Klatt 80 mechanism for a different purpose

## Key References

| File | Purpose |
|------|---------|
| `~/src/klatt80/COEWAV.FOR` | Signal flow, output scaling, PLSTEP |
| `~/src/klatt80/PARCOE.FOR` | Parameter processing, NDBSCA offsets, G0 application |
| `~/src/klatt80/GETAMP.FOR` | dB to linear conversion |
| `~/src/klatt-syn/src/Klatt.ts` | Modern TypeScript reference (sometimes deviates from Klatt 80) |

## The NDBSCA Offsets (PARCOE.FOR line 53)

```fortran
DATA NDBSCA/-58,-65,-73,-78,-79,-80,-58,-84,-72,-102,-72,-44/
C              A1  A2  A3  A4  A5  A6  AN  AB  AV   AH  AF AVS
```

These are 16-bit space offsets. In our code they're in `ndbScale`:
- AV: -72, AH: -72 (changed from -102), AF: -72
- AVS: -44
- A1: -58, A2: -65, A3: -73, A4: -78, A5: -79, A6: -80
- AN: -58, AB: -84

## The 170x Output Scaling (COEWAV.FOR line 251)

```fortran
ULIPS=(ULIPSV+ULIPSF+STEP)*(170.)
```

This 170x is **ONLY for 16-bit integer output** ("TO LEFT JUSTIFY IN 16-BIT WORD"). **It has NO relevance for normalized float output.**

## Common Fix Patterns

### Pattern 1: Remove Compensation That Fights Intended Behavior

**Example: Issue 12 - Differentiator compensation**

Klatt 80 uses first-differenced voicing for parallel formants F2-F6. The low-frequency attenuation is intentional - it prevents F2-F6 energy from polluting F1.

**Wrong**: Divide by `diffGain = sqrt(2 - 2*cos(w))` to "compensate"
**Problem**: At low frequencies, diffGain→0, causing 38x amplification
**Fix**: Remove compensation entirely. The attenuation is a feature, not a bug.

### Pattern 2: Remove Double Application of G0

**Example: Issue 4 - Master gain formula**

G0 is added to ALL amplitude parameters (AV, AH, AF, etc.) before dB-to-linear conversion.

**Wrong**: Also apply `_dbToLinear(goDb)` to master gain
**Problem**: G0's effect is doubled
**Fix**: Use simple `params.masterGain` without additional G0 scaling

### Pattern 3: Don't Mix Formulas From Different Mechanisms

**Example: Issue 4 - PLSTEP formula used for master gain**

The formula `G0 + ndbScale.AF + 44` is for PLSTEP burst transients only.

**Wrong**: Use `ndbScale.AF + 44 = -28` as master gain scaling
**Problem**: This formula has no relationship to output gain
**Fix**: Use the correct mechanism for the task at hand

### Pattern 4: Clamp or Remove Extreme Values

When Klatt 80 offsets produce extreme values in float space:

**Option A**: Clamp to reasonable range (e.g., `Math.max(diffGain, 0.25)`)
**Option B**: Remove the problematic calculation if it's compensating for intended behavior
**Option C**: Scale differently for normalized float (but document why)

## Investigation Checklist

When fixing a 16-bit conversion issue:

1. **Read the original Klatt 80 code** - What does it actually do?
2. **Understand the purpose** - Is this behavior intentional?
3. **Check klatt-syn** - How does the modern reference handle it?
4. **Identify the mismatch** - Is it clipping? Double application? Wrong formula?
5. **Choose the simplest fix** - Often removing code is the answer
6. **Document the rationale** - Explain why in comments

## Red Flags in Current Code

Watch for these patterns that may indicate 16-bit issues:

- `* 10` or other ad-hoc multipliers (compensating for something?)
- `Math.min(5.0, ...)` or similar clamps (symptom of larger problem?)
- Comments referencing Klatt 80 formulas in wrong contexts
- Division by values that approach zero
- `_dbToLinear` with calculated offsets > 20 or < -60

## Output Format

When fixing an issue, produce:
1. Scout report: `reports/16bit-issueN-{topic}.md` - analysis and recommendation
2. Coder report: `reports/16bit-issueN-coder.md` - confirmation of change
3. Commit with clear rationale

## Key Learnings

1. **The 170x doesn't apply to float** - It's for 16-bit output format only
2. **G0 is already in source amplitudes** - Don't apply it again
3. **Spectral shaping is often intentional** - Don't "compensate" for features
4. **klatt-syn isn't authoritative** - It sometimes deviates from Klatt 80
5. **When in doubt, match Klatt 80** - The original paper is the ground truth
