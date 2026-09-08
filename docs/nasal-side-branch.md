# Nasal coupling and murmur targets

The baseline experiment accepts `nasalCouplingArea` in cm² (0–2.5), following
Maeda (1993). The frontend emits this area for nasal murmurs and for the existing
anticipatory/carryover windows. This replaces the dimensionless `nasalCoupling`
frame field; multiply old ratios by 2.5. The beauty experiment converts the
shared frontend's area back to a ratio for its separate, unchanged solver.

For nasalized vowels, the baseline graph adds two resonator/antiresonator pairs
ahead of the oral cascade. A true antiresonator, rather than a biquad notch,
permits cancellation as pole and zero approach one another. At zero area both
pairs bypass. With d = area / 2.5, bounded to [0, 1], the reduced model uses:

- Low pole: sqrt((c / (2π))² S / (V L) + Fwall²), from Feng & Castelli (1996).
  Here c = 35000 cm/s, S = 0.6 cm² **nostril** area, L = 3 cm, Fwall = 200 Hz,
  and V = 13 × 6 = 78 cm³ from Maeda's nasal tract geometry.
- High pole: 1000 Hz, the second pharyngonasal target in Feng & Castelli.
- Zeros: interpolate from each pole to Maeda Fig. 1's critical frequencies
  368 and 1803 Hz as d increases.

The hybrid geometry and linear zero interpolation are engineering
approximations. They are not Maeda's transmission-line solution or Feng's full
seven-category, vowel-dependent pole evolution. The model omits sinus cavities
and tract asymmetry. Bandwidth defaults retain Klatt (1980) Table I's 100 Hz.
The `diagnoseRange` parameter metadata reports out-of-range area inputs through
the interpreter's `Diagnostics` collector; CEL owns the actual bounding.

During a murmur, the vowel side branch bypasses: F1–F4 carry Recasens (1983)
Table II's N1–N4 directly, avoiding duplicate poles. B1 carries the measured N1
bandwidth. A rule selects all five targets after place assimilation, so an
assimilated /n/ gets the corresponding /m/ or /ŋ/ poles as well as its place zero.
Boundary transitions remain governed by the frontend's transition policy.

| Phone | N1 | N2 | N3 | N4 | B1 | Place zero |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| m | 200 | 1120 | 1360 | 2100 | 160 | 1000* |
| n | 250 | 850 | 1550 | 2025 | 180 | 1780 |
| ŋ | 350 | 1200 | 2030 | 2540 | 200 | 3700 |

All values are Hz. This consistently uses the single Catalan speaker series,
not the twelve-speaker means. Transfer to English is an engineering assumption.
*Recasens supplies no /m/ zero; the existing Fujimura (1962) estimate is retained.

The baseline nasal parameter block falls from 22 parameters to 10. The removed
raw FNP/FNZ/BNP/BNZ controls and vowel endpoint/bin controls no longer affect this
experiment. The independent klsyn88 and beauty raw-parameter models remain separate.

Run `npx vitest run test/nasal-side-branch.test.ts test/nasal-render.test.ts` after
building WASM. Set `NASAL_OUTPUT_DIR` to retain paired WAVs and JSON reports for
“man”, “nine”, and “sing”. The control closes only the vowel coupling port;
murmur targets, timing, source, and seed stay fixed. The report gives whole-word
Hann-windowed power in 200–500 and 800–1200 Hz bands and normalized absolute
spectral difference. This checks the rendered signal and port response, not
perceptual superiority. The graph regression separately verifies the second
pair's connections and bindings.
