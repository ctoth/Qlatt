## 5. Perceptual Constraints

**Source:** vanDinther (2001, 2004) "Perceptual Relevance of Glottal Pulse Parameters"

### Key Findings

| Constraint | Value | Implication |
|------------|-------|-------------|
| JND threshold | 4.3 dB EPD | Changes smaller than this are inaudible |
| Most salient parameter | Ra (return phase) | Focus optimization effort here |
| Second most salient | Oq (open quotient) | |
| Least salient | αm (asymmetry) | Can reduce precision |

### Design Implications

1. **Don't over-parameterize**: LF is effectively 1-2 perceptual parameters
2. **Rd is sufficient**: Rd controls Ra (spectral tilt) which dominates perception
3. **Minimum Rd step**: ~0.15 Rd change ≈ 1 JND (empirically derived)
4. **Bandwidth for breathiness**: B1 increase from Rd is audible; implement bandwidth rules (Fant 1997)

### Rd-to-JND Mapping

```javascript
// Approximate JND in Rd units (derived from 4.3 dB EPD threshold)
const RD_JND = 0.15;

// Quantize Rd changes smaller than JND (optional optimization)
function quantizeRd(rd, baseRd) {
  const delta = rd - baseRd;
  const steps = Math.round(delta / RD_JND);
  return baseRd + steps * RD_JND;
}
```

### Clipping Prevention

- Rd < 0.3: LF model unstable, synthesis artifacts
- Rd > 2.7: Excessive breathiness, low intelligibility
- Always clamp after all factors applied

---

