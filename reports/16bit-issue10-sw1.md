# Issue 10: SW=1 Frication Gain Behavior

## Summary

**Finding: Our implementation MATCHES Klatt 80 behavior.**

The `Math.max(fricDb, aspDb)` logic correctly implements Klatt 80's SW=1 frication handling.

## Klatt 80 Reference (PARCOE.FOR lines 123-127)

```fortran
C     AMPLITUDE OF FRICATION
C     (IN AN ALL-PARALLEL CONFIGURATION, AF=MAX[AF,AH])
      IF ((NNAH.GT.NNAF).AND.(NNSW.EQ.1)) NNAF=NNAH
      NDBAF=NNG0+NNAF+NDBSCA(11)
      AFF=GETAMP(NDBAF)
```

**What SW controls:** NNSW is the switch parameter. When SW=1, the synthesizer uses an "all-parallel configuration" where voicing goes through the parallel formant filters instead of the cascade branch.

**The logic:** When in all-parallel mode (SW=1) AND aspiration is louder than frication (NNAH > NNAF), Klatt 80 substitutes the aspiration amplitude for the frication amplitude. This is expressed as:
- `IF ((NNAH.GT.NNAF).AND.(NNSW.EQ.1)) NNAF=NNAH`

This is mathematically equivalent to `AF = MAX(AF, AH)` when SW=1.

## Our Implementation (klatt-synth.js lines 484-486)

```javascript
const fricDbAdjusted = params.SW === 1 ? Math.max(fricDb, aspDb) : fricDb;
const fricGain =
  this._dbToLinear(fricDbAdjusted + ndbScale.AF) * parallelScale;
```

Where:
- `fricDb = params.AF` (equivalent to NNAF)
- `aspDb = params.AH` (equivalent to NNAH)

## Analysis

### Correctness: MATCH

| Klatt 80 | Ours | Match |
|----------|------|-------|
| Only applies when SW=1 | `params.SW === 1 ?` | Yes |
| Takes max of AF and AH | `Math.max(fricDb, aspDb)` | Yes |
| Adds G0 and scale factor | `fricDbAdjusted + ndbScale.AF` | Yes |

The logic is semantically identical. Klatt 80's `IF (NNAH > NNAF) NNAF = NNAH` is equivalent to our `Math.max(fricDb, aspDb)`.

### parallelScale Application

The `parallelScale` is applied to `fricGain`:
```javascript
const fricGain = this._dbToLinear(fricDbAdjusted + ndbScale.AF) * parallelScale;
```

**Question:** Is this appropriate?

**Answer:** Yes. The `parallelScale` is a user-controllable gain factor for the parallel branch (`parallelGainScale` parameter, default 1.0). In SW=1 mode, frication goes through the parallel branch, so it should receive the parallel scale factor. This is consistent with how other parallel branch signals are scaled (AVS, AN, AB all use `parallelScale`).

In Klatt 80, there's no equivalent user-adjustable parallel gain scale - amplitudes are fixed by the NDBSCA constants. Our `parallelScale` is an extension for flexibility, and applying it uniformly to all parallel signals is correct.

## Conclusion

**No changes needed.** The SW=1 frication gain logic correctly implements Klatt 80 PARCOE.FOR line 125. The `Math.max` operation is equivalent to the FORTRAN conditional assignment, and the `parallelScale` application is appropriate for consistency with other parallel branch signals.

## References

- PARCOE.FOR line 125: `IF ((NNAH.GT.NNAF).AND.(NNSW.EQ.1)) NNAF=NNAH`
- klatt-synth.js line 484: `const fricDbAdjusted = params.SW === 1 ? Math.max(fricDb, aspDb) : fricDb;`
