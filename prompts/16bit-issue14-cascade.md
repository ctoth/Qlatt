# Task: Investigate Cascade Resonator Gain Accumulation (Issue 14)

## Context

See `prompts/16bit-conversion-guide.md`.

In `src/klatt-synth.js` lines ~319-325, cascade resonators are all set to gain 1.0:
```javascript
for (let i = 0; i < this.nodes.cascade.length; i += 1) {
  const node = this.nodes.cascade[i];
  // ...
  this._setAudioParam(node.parameters.get("gain"), 1.0, atTime);
}
```

Six resonators in series could exceed 1.0 at resonance peaks with narrow bandwidths, causing clipping.

## Question

Does Klatt 80 have gain compensation for cascade resonators, or is the signal expected to stay within bounds naturally?

## Investigation

1. Read `~/src/klatt80/COEWAV.FOR` cascade resonator section
2. Check if any amplitude scaling is applied to cascade path
3. Read `~/src/klatt-syn/src/Klatt.ts` for comparison
4. Determine if gain accumulation is a real problem or theoretical

## Output

Write analysis to `reports/16bit-issue14-cascade.md`:
- How Klatt 80 handles cascade gain
- Whether our implementation needs adjustment
- Recommended action (fix or document as acceptable)

## DO NOT

- Make code changes
- Stage or commit
