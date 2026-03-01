## 7. Summary: What to Implement

### Immediate (Phase 1)

1. Add `Rd` to `PHONEME_TARGETS` with per-phoneme deltas
2. Add `effort` parameter and stress-to-effort mapping
3. Add `rule_VoiceQuality()` function
4. Add effort-based F0/F1 shifts to semantics.yaml
5. Verify Rd flows through to LF source AudioParam

### Short-term (Phase 2)

1. Add phrase-level Rd contour
2. Add Rd-AV covariation
3. Add emotion presets (including anxious, fatigued)
4. Add spectral tilt modulation (A1/A2/A3)
5. Add bandwidth modulation (B1 increase from Rd)
6. Add emotion-based formant modulation (France 2000) - F1/F2/F3 offsets, BW scaling
7. **Add pauseScale temporal modulation (Laukka 2008)** - pause duration scaling, hesitation insertion

### Medium-term (Phase 3)

1. Integrate with Fujisaki F0 (if implemented)
2. Add SPG formant smoothing
3. Add LFLM filter path for efficiency
4. Add pulsatile noise for breathiness

### Long-term (Phase 4)

1. Add jitter for creaky voice
2. Add Holmes F1 phase correction
3. Add per-formant voicing offsets
4. Corpus-based parameter tuning

---

*Synthesis completed: 2026-01-27*
*Updated: 2026-01-27 - Added France (2000) formant modulation findings*
*Updated: 2026-01-27 - Added Laukka (2008) anxious preset and pauseScale parameter*
*Updated: 2026-01-27 - Added Vogel (2010) fatigued preset; F0 variance vs F0 mean distinction*
*Author: Claude Code synthesis of 9 implementation plans + 22 paper findings*
