# Task: Fix Differentiator Compensation (Issue 12)

## Problem

In `src/klatt-synth.js` lines 567-576, the differentiator compensation divides by `diffGain`:

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

At low frequencies, `diffGain` approaches zero, causing extreme amplification:
- F2=200Hz at 48kHz: w=0.0262, diffGain=0.026, compensation=38x

This causes clipping for stops/nasals with low formant values.

## Reference

Check how Klatt 80 and klatt-syn handle the first-differenced input:

1. **Klatt 80 COEWAV.FOR**: The parallel branch uses `UFRIC=UFRIC*DIFF` (line 242) where DIFF is the first-differenced glottal source. The spectral shaping is inherent.

2. **klatt-syn Klatt.ts**: Look for how they handle the differentiator and if they clamp or limit compensation.

## Investigation Steps

1. Read `src/klatt-synth.js` lines 550-600 to understand current parallel formant gain logic
2. Read `~/src/klatt80/COEWAV.FOR` to see original Klatt 80 parallel branch
3. Read `~/src/klatt-syn/src/Klatt.ts` to see klatt-syn's approach
4. Determine the correct fix:
   - Option A: Clamp diffGain to minimum value (e.g., 0.1)
   - Option B: Clamp final amplitude
   - Option C: Different formula entirely
   - Option D: Remove compensation (let differentiator do its job)

## Output

Write analysis and recommendation to `reports/16bit-issue12-differentiator.md`.

Include:
- What Klatt 80 does
- What klatt-syn does
- Recommended fix with rationale
- Exact code changes needed

## DO NOT

- Make code changes yet (analysis only)
- Stage or commit
