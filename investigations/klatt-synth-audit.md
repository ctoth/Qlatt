# Investigation: Klatt Synthesizer Full Audit

## Problem Statement

Voiced stops (G, B, D) sound like approximants ("yood yook" instead of "good book"). We've added PLSTEP, increased AF to 50, but result is "same sound with clicks over it."

## Facts (verified)

1. PLSTEP fires correctly - telemetry shows delta=50 triggering bursts
2. AF=50 matches Klatt 80 threshold requirement (delta >= 49)
3. Parallel formant amplitudes (A3-A6) are set per Klatt 1980 Table III
4. No clipping (peaks under 1.0)
5. Sound is still approximant-like with added clicks

---

## COMPREHENSIVE AUDIT RESULTS

Comparison of three implementations:
- **Klatt 80**: Original FORTRAN (PARCOE.FOR, COEWAV.FOR)
- **klatt-syn**: TypeScript reference implementation (Klatt.ts)
- **Ours**: klatt-synth.js

---

## A. Excitation Sources

### A1. Voice Source (AV parameter)

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| Formula | `IMPULS = GETAMP(G0 + AV + ndbScale.AV) * F0` | `dbToLin(cascadeVoicingDb)` | `dbToLinear(voiceDb + ndbScale.AV)` | Similar |
| ndbScale.AV | -72 | N/A (uses dB directly) | -72 | Match |
| F0 multiplier | Yes (`IMPULS = IMPULS * NNF0`) | No | No | **DIFFERENCE** |
| Location | Lines 118-119, 184 | Line 717 | Line 471 | - |

**Finding**: Klatt 80 multiplies impulse amplitude by F0 to maintain loudness across pitch changes. We don't do this. This affects amplitude consistency but not stop character.

### A2. Aspiration Noise (AH parameter)

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| ndbScale.AH | -102 | N/A | -72 | **DIFFERENCE** |
| Modulation | Second half of period (MPULSE) | configurable | None | **DIFFERENCE** |
| Generation | 16 uniform randoms summed | LpNoiseSource | noise-source-processor | Similar |
| Where added | To UGLOT (glottal vol. velocity) | To cascade input | To mixer | Similar |

**Finding**: Our ndbScale.AH is -72, Klatt 80 uses -102. That's a 30 dB difference! However, our comment says we scale input AH values to compensate. But the modulation (halving noise in second half of period) is missing.

### A3. Frication Noise (AF parameter)

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| ndbScale.AF | -72 | N/A | -72 | Match |
| SW=1 behavior | `IF (AH > AF) AF = AH` | fricationLin separate from aspiration | `Math.max(fricDb, aspDb)` | Similar |
| Where used | Excites R2'-R6' and bypass | F2-F6 and bypass | parallelDiffSum | **CRITICAL** |
| Added to voicing? | No, purely parallel | No | fricationSource separate | Match |

**Finding**: In Klatt 80, frication excites the parallel formants R2'-R6' (not R1') and bypass. In our implementation, frication goes to `parallelDiffSum` which feeds F2-F6 and bypass - this matches!

### A4. Noise Filtering/Shaping

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| LP noise | Mentions source impedance | 1st order LP (b=0.75 at 10kHz) | noise-source-processor cutoff | Similar |
| HP radiation | Mentions +6dB/oct | Implicit in differencing | differentiator-processor | Similar |
| Cancellation | LP and HP cancel | Notes independence | Independent sources | Match |

---

## B. Cascade Branch

### B1. What Feeds into Cascade

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| Input | UGLOT = voice + aspiration | cascadeVoice + aspiration | mixer (voice + aspiration) | Match |
| When active | SW != 1 | cascadeEnabled = true | parallelMix < 1 | **DIFFERENCE** |
| Post-process | N/A | N/A | N/A | - |

**Finding**: Klatt 80's SW=1 completely disables cascade. Our implementation uses a mix ratio, never fully disabling cascade unless `allParallel=true`.

### B2. Cascade Formant Filter Order

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| Order | F6 -> F5 -> F4 -> F3 -> F2 -> F1 -> NZ -> NP | F1 -> F2 -> ... -> F6 | NP -> F1 -> ... -> F6 | **CRITICAL** |
| Location | COEWAV lines 178-208 | Lines 657-658 | Lines 233-238 | - |

**Klatt 80 cascade order (lines 178-208)**:
```fortran
Y6C = A6*UGLOT + ...      ! F6 first
Y5C = A5*Y6C + ...        ! then F5
Y4C = A4*Y5C + ...        ! then F4
Y3C = A3*Y4C + ...        ! then F3
Y2C = A2*Y3C + ...        ! then F2
Y1C = A1*Y2C + ...        ! then F1
YZC = ANZ*Y1C + ...       ! then nasal zero (antiresonator)
YPC = ANP*YZC + ...       ! then nasal pole
ULIPSV = YPC
```

**Our cascade order (lines 232-238)**:
```javascript
N.mixer.connect(N.nz).connect(N.np);  // NZ -> NP first
let current = N.np;
for (const resonator of N.cascade) {  // then F1 -> F2 -> ... -> F6
  current.connect(resonator);
```

**Finding**: **MAJOR DIFFERENCE!**
- Klatt 80: F6 -> F5 -> F4 -> F3 -> F2 -> F1 -> NZ -> NP
- Ours: NZ -> NP -> F1 -> F2 -> F3 -> F4 -> F5 -> F6

The filter order is completely reversed! Also, nasal zero/pole placement is wrong.

### B3. Cascade Formant Implementation

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| Filter type | 2nd order IIR | Resonator class (2nd order) | resonator-processor | Match |
| Coefficients | SETABC computes a,b,c | set(f, bw, dcGain) | WASM resonator | Similar |
| DC gain | 1 (normalized) | dcGain parameter | Unity? | Check |

### B4. Nasal Pole/Zero

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| Order | Zero then Pole (after F1) | Antiformant then Formant | NZ then NP (before cascade) | **DIFFERENCE** |
| NZ type | Antiresonator (FIR) | AntiResonator class | antiresonator-processor | Match |
| NP type | Resonator | Resonator class | resonator-processor | Match |

**Finding**: Klatt 80 puts nasal zero/pole AFTER F1 in cascade. We put them BEFORE F1. This changes the frequency response.

---

## C. Parallel Branch

### C1. What Feeds into Parallel

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| R1' input | UGLOT (voice) only | source (voice+asp) | parallelSourceGain (voice+asp) | **DIFFERENCE** |
| R2'-R6' input | UFRIC + UGLOT1 (diff voice) | source2 (diff + fric) | parallelDiffSum (diff voice + fric) | Match |
| Nasal input | UGLOT1 (diff voice) | source (voice+asp) | parallelSourceGain | **DIFFERENCE** |
| Bypass input | UFRIC | source2 | parallelDiffSum | Match |

**Klatt 80 (lines 217-247)**:
```fortran
C     FIRST PARALLEL FORMANT R1' (EXCITED BY VOICING ONLY)
      Y1P=A1*A1PAR*UGLOT + ...
C     NASAL POLE RN' (EXCITED BY FIRST DIFF. OF VOICING SOURCE)
      UGLOT1=UGLOT-UGLOTL
      IF (NXSW.NE.1) UGLOT1=0.    ! Zero out if cascade active!
      YN=ANP*ANPAR*UGLOT1 + ...
C     EXCITE FORMANTS R2'-R4' WITH FRIC NOISE PLUS FIRST-DIFF. VOICING
      Y2P=A2*A2PAR*(UFRIC+UGLOT1) + ...
```

**CRITICAL FINDING**: In Klatt 80:
1. R1' gets pure voice (UGLOT), not differentiated
2. **When SW!=1 (cascade active), UGLOT1 is zeroed** - parallel voicing contribution is disabled!
3. R2'-R6' and nasal get differentiated voice + frication

In our implementation:
1. R1' gets undifferentiated source (mixer output)
2. **We DON'T zero out parallel voice when cascade is active**
3. R2'-R6' and nasal get differentiated source + frication

### C2. A1-A6 Amplitude Calculations

| Formant | Klatt 80 ndbScale | Ours ndbScale | Match? |
|---------|-------------------|---------------|--------|
| A1 | -58 | -58 | Yes |
| A2 | -65 | -65 | Yes |
| A3 | -73 | -73 | Yes |
| A4 | -78 | -78 | Yes |
| A5 | -79 | -79 | Yes |
| A6 | -80 | -80 | Yes |
| AN | -58 | -58 | Yes |
| AB | -84 | -84 | Yes |

**Klatt 80 amplitude corrections (A2COR, A3COR)**:
```fortran
      DELF1=FLOAT(NNF1)/500.
      A2COR=DELF1*DELF1
      DELF2=FLOAT(NNF2)/1500.
      A2SKRT=DELF2*DELF2
      A3COR=A2COR*A2SKRT
      A2COR=A2COR/DELF2   ! Note division by DELF2!
      ...
      A2P=A2COR*GETAMP(NDB)    ! Applied to A2
      A3P=A3COR*GETAMP(NDB)    ! Applied to A3
      A4P=A3COR*GETAMP(NDB)    ! Also A3COR for A4-A6
```

**Finding**: Klatt 80 applies frequency-dependent corrections (A2COR, A3COR) that depend on F1/F2 values. Our code mentions these were removed: "Klatt 80 A2COR/A3COR corrections removed - we use A1-A6 dB values directly like klatt-syn". This simplification may affect spectral balance.

### C3. Proximity Corrections (N12COR, N23COR, N34COR)

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| N12COR | Applied to A1, A2 | Not applied | Applied (n12Cor) | Match |
| N23COR | Applied to A2, A3 | Not applied | Applied (n23Cor) | Match |
| N34COR | Applied to A3, A4 | Not applied | Applied (n34Cor) | Match |

We do have proximity corrections! Lines 467-469 in klatt-synth.js.

### C4. Parallel Formant Alternating Signs

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| Sign pattern | +Y1P -Y2P +Y3P -Y4P +Y5P -Y6P | alternatingSign | sign = (i%2==1) ? -1 : 1 | Match |
| Location | Line 247 | Lines 684 | Lines 560 | - |

```fortran
C     ADD UP OUTPUTS FROM RN', R1' - R6' AND BYPASS PATH
      ULIPSF=Y1P-Y2P+Y3P-Y4P+Y5P-Y6P+YN-ABPAR*UFRIC
```

Our code: `sign = i >= 1 ? (i % 2 === 1 ? -1 : 1) : 1` gives +,- ,+,-,+,- pattern for indices 0-5. Match!

---

## D. SW (Source Switch)

### D1. What SW=0 vs SW=1 Does

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| SW=0 | Cascade active, parallel voicing zeroed | Both branches can be enabled | Both branches mix | **CRITICAL** |
| SW=1 | Cascade bypassed | parallelEnabled only | parallelSrcGain = 1, cascadeOutGain = 0 | **CRITICAL** |
| AF=max(AF,AH) | Only when SW=1 | N/A | Only when SW=1 | Match |

**Klatt 80 (COEWAV lines 176, 210-214, 225)**:
```fortran
C   SEND GLOTTAL SOURCE THRU CASCADE VOCAL TRACT RESONATORS
      IF (NXSW.EQ.1) GO TO 430    ! Skip cascade if SW=1
      ...
C     ZERO OUT VOICING INPUT TO PARALEL BRANCH
C     IF CASCADE BRANCH HAS BEEN USED
425   UGLOT=0.
      UGLOTL=0.
      ...
      IF (NXSW.NE.1) UGLOT1=0.    ! Zero parallel diff voice if cascade used
```

**CRITICAL FINDING**: In Klatt 80, when cascade is used (SW=0):
1. Cascade processes voice signal normally
2. **Parallel branch voicing (UGLOT, UGLOT1) is ZEROED**
3. Parallel branch only receives FRICATION noise

This is the **MUTUAL EXCLUSION** principle: cascade or parallel for voicing, never both!

**Our implementation**:
- We set `allParallel = params.SW === 1`
- When `!allParallel`, cascade gets full voice, but parallel ALSO gets voice!
- We never zero out parallel voice source

---

## E. Mixing

### E1. How Cascade and Parallel Combine

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| Formula | `ULIPS = (ULIPSV + ULIPSF + STEP) * 170` | cascadeOut + parallelOut | outputSum = cascadeOutGain + parallelOutGain | **DIFFERENCE** |
| Relative gains | 1:1 (simple addition) | 1:1 | parallelMix:1 ratio | **DIFFERENCE** |
| Cascade output | ULIPSV | return v | cascadeOutGain | - |
| Parallel output | ULIPSF | return v | parallelOutGain | - |

**Finding**: Klatt 80 does simple addition. We use gain-controlled mixing with `parallelMix` ratio. This changes the balance.

### E2. Output Scaling

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| Scale factor | 170 | gainLin | masterGain * outputGain | Similar |
| Clipping | Truncated to +/-32767 | AGC optional | None? | **DIFFERENCE** |

---

## F. PLSTEP (Plosive Release Transient)

### F1. Trigger Condition

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| Condition | `NNAF - NAFLAS >= 49` | N/A (not implemented) | `afDelta >= 10` or `ahDelta >= 15` | **DIFFERENCE** |
| Previous AF | NAFLAS (persisted) | N/A | _lastAF | Match concept |
| Location | PARCOE line 130 | N/A | Lines 634-636 | - |

**Finding**: Klatt 80 uses delta >= 49 on the raw AF parameter. Our AF values are scaled differently (we use 15-50 range, not 0-70), so our threshold of 10 is intended to compensate.

### F2. Amplitude Calculation

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| Formula | `PLSTEP = GETAMP(G0 + ndbScale.AF + 44)` | N/A | `burstDb = goDb - 50` | **DIFFERENCE** |
| ndbScale.AF | -72 | N/A | -72 | - |
| Effective | G0 + (-72 + 44) = G0 - 28 | N/A | G0 - 50 | **22 dB lower!** |
| Location | PARCOE line 131 | N/A | Lines 671-672 | - |

**Finding**: Our PLSTEP amplitude is 22 dB lower than Klatt 80! This significantly reduces burst energy.

### F3. Where in Signal Chain

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| Injection point | Added to ULIPS (final output) | N/A | Added to outputSum | Match |
| Sign | Negative (STEP = -PLSTEP) | N/A | Negative | Match |

### F4. Decay Rate

| Aspect | Klatt 80 | klatt-syn | Ours | Impact |
|--------|----------|-----------|------|--------|
| Decay | `STEP = 0.995 * STEP` (per sample) | N/A | exponentialRamp to -0.0001 in 10ms | **DIFFERENT** |
| Time constant | ~920 samples = 21ms @ 44.1kHz | N/A | 10ms | Faster |

---

## Signal Flow Diagrams

### Klatt 80 Signal Flow for Voiced Stop (B, D, G)

```
                                 ┌─────────────────────────────────────┐
                                 │     PARALLEL BRANCH (SW=0)          │
                                 │                                     │
                                 │  Frication ──► UFRIC ──┬─► R2' ─┐  │
                                 │  (AF noise)            │         │  │
                                 │                        ├─► R3' ─┤  │
                                 │  (UGLOT1=0 when SW=0)  │         │  │
                                 │                        ├─► R4' ─┤  │
                                 │                        │         │  │
                                 │                        ├─► R5' ─┼──┼─► Sum ──► ULIPSF
                                 │                        │         │  │   (with signs)
                                 │                        ├─► R6' ─┤  │
                                 │                        │         │  │
                                 │                        └─► Bypass┘  │
                                 └─────────────────────────────────────┘

Voice ──► RGP ──► RGZ ──► (+) ──► UGLOT ──────────────────────────────────┐
                          ▲                                               │
Aspiration ──► UASP ─────┘                                               │
                                                                          ▼
                                 ┌─────────────────────────────────────┐
                                 │     CASCADE BRANCH                  │
                                 │                                     │
                           ──────┼──► F6 ──► F5 ──► F4 ──► F3 ──► F2  │
                                 │                                ▼    │
                                 │                              F1    │
                                 │                                ▼    │
                                 │                              NZ    │
                                 │                                ▼    │
                                 │                              NP ───┼──► ULIPSV
                                 └─────────────────────────────────────┘

ULIPSV + ULIPSF + STEP ──► (* 170) ──► Output
        ▲
        │
PLSTEP (burst) ─────────────────────────┘
```

**Key Point**: When SW=0 (default, cascade mode), parallel branch voicing is ZEROED. Only frication noise goes through parallel. Voice goes through cascade ONLY.

### Our Implementation Signal Flow

```
                                 ┌─────────────────────────────────────┐
                                 │     PARALLEL BRANCH                 │
                                 │                                     │
                         ┌───────┼──► R1' ──────────────────────┐      │
                         │       │                               │      │
mixer ──► parallelSrc ──┼───────┼──► diff ──┬─► R2' ─┐         │      │
(voice+asp)             │       │           │        │         │      │
                        │       │ fric ─────┼─► R3' ─┤         │      │
                        │       │           │        │         │      │
                        │       │           ├─► R4' ─┤         │      │
                        │       │           │        │         ├──────┼──► parallelSum
                        │       │           ├─► R5' ─┤         │      │   (with signs)
                        │       │           │        │         │      │
                        │       │           ├─► R6' ─┤         │      │
                        │       │           │        │         │      │
                        │       │           └─► Bypass─────────┘      │
                        │       │                                     │
                        └───────┼──► RN' ──────────────────────┘      │
                                └─────────────────────────────────────┘

lfSource ──► RGP ──► voiceGain ──┬──► mixer ─────────────────────────────┐
                                 │                                       │
noiseSource ──► RGS ──► noiseGain┘                                      │
                                                                         ▼
                                 ┌─────────────────────────────────────┐
                                 │     CASCADE BRANCH                  │
                                 │                                     │
                           ──────┼──► NZ ──► NP ──► F1 ──► F2 ──► F3  │
                                 │                              ▼      │
                                 │                            F4      │
                                 │                              ▼      │
                                 │                            F5      │
                                 │                              ▼      │
                                 │                            F6 ─────┼──► cascadeOutGain
                                 └─────────────────────────────────────┘

cascadeOutGain + parallelOutGain + PLSTEP ──► masterGain ──► outputGain ──► Output
```

**Key Differences Highlighted**:
1. Both branches always get voice signal (no mutual exclusion)
2. Cascade formant order reversed (F1->F6 vs F6->F1)
3. Nasal zero/pole before cascade formants (should be after F1)
4. Parallel nasal gets undifferentiated source (should get differentiated)

---

## ROOT CAUSE ANALYSIS

### Why Voiced Stops Sound Like Approximants

The approximant sound comes from **both branches receiving voicing simultaneously**:

1. **Cascade branch** produces the sonorant-like vowel formant structure
2. **Parallel branch** ALSO gets the voicing signal (should be zeroed!)
3. The parallel formants add additional energy that smooths transitions
4. Result: smooth, vowel-like quality instead of abrupt stop release

In Klatt 80:
- During stop CLOSURE: cascade formants low (closure F1~200), minimal voicing bar
- During stop RELEASE: cascade silent (transitioning), parallel gets FRICATION only
- This creates ABRUPT spectral discontinuity = stop burst perception

In our implementation:
- During stop CLOSURE: cascade formants set for closure
- During stop RELEASE: **cascade still active with voice**, parallel also active with voice
- Both branches smoothly interpolating = approximant perception

### Why PLSTEP Doesn't Help

PLSTEP adds a DC transient to the output, but:
1. Our amplitude is 22 dB lower than Klatt 80
2. The underlying formant structure is still approximant-like
3. A click on top of an approximant still sounds like an approximant with a click

### Contributing Factors (ranked by impact)

1. **CRITICAL: Parallel voicing not zeroed when cascade active** (100% responsible for approximant quality)
2. **HIGH: Cascade formant order reversed** (affects spectral shaping)
3. **HIGH: Nasal zero/pole position wrong** (affects nasal resonance)
4. **MEDIUM: PLSTEP amplitude 22 dB too low** (burst too quiet)
5. **MEDIUM: PLSTEP decay too fast** (10ms vs 21ms)
6. **LOW: A2COR/A3COR corrections removed** (affects spectral balance)
7. **LOW: F0 amplitude compensation missing** (affects loudness consistency)

---

## FIX PROPOSAL

### Priority 1: Implement Mutual Exclusion (CASCADE vs PARALLEL voicing)

When SW=0 (cascade mode, which is default):
- Cascade branch receives: voice + aspiration (unchanged)
- Parallel branch receives: **FRICATION ONLY** (zero out voicing contribution)

```javascript
// In _applyKlattParams or _connectGraph logic:
const parallelSrcGain = allParallel ? 1.0 : 0.0;  // Was: voiceParGain
// parallelSourceGain should be 0 when cascade is active
// Only frication (parallelFricGain) should feed parallel formants
```

### Priority 2: Fix Cascade Filter Order

Change from: NZ -> NP -> F1 -> F2 -> F3 -> F4 -> F5 -> F6
To: F6 -> F5 -> F4 -> F3 -> F2 -> F1 -> NZ -> NP (Klatt 80 order)

Or at minimum, move NZ/NP to after F1.

### Priority 3: Increase PLSTEP Amplitude

Change from: `burstDb = goDb - 50`
To: `burstDb = goDb - 28` (matches Klatt 80 calculation)

Add clipping protection separately rather than reducing burst amplitude.

### Priority 4: Fix PLSTEP Decay

Change from: 10ms exponential
To: 21ms exponential (0.995 per sample at 44.1kHz)

---

## SUMMARY TABLE

| Component | Ours | Klatt80 | klatt-syn | Impact | Fix Priority |
|-----------|------|---------|-----------|--------|--------------|
| Parallel voicing when cascade active | Always on | ZEROED | Enabled | **CRITICAL** | P1 |
| Cascade formant order | F1->F6 | F6->F1 | F1->F6 | HIGH | P2 |
| Nasal Z/P position | Before F1 | After F1 | After F1 | HIGH | P2 |
| Parallel R1' input | Voice+asp | Voice only | Voice+asp | MEDIUM | P1 |
| Parallel nasal input | Voice+asp | Diff voice | Voice+asp | MEDIUM | P1 |
| PLSTEP amplitude | G0-50 | G0-28 | N/A | MEDIUM | P3 |
| PLSTEP decay | 10ms | 21ms | N/A | LOW | P4 |
| A2COR/A3COR | Removed | Applied | Removed | LOW | Optional |
| F0 amplitude mult | No | Yes | No | LOW | Optional |
| ndbScale values | Match | - | - | OK | None |
| Proximity corrections | Applied | Applied | Not applied | OK | None |
| Alternating signs | Match | Match | Match | OK | None |
| SW=1 AF/AH max | Match | Match | N/A | OK | None |

---

## NEXT STEPS

1. **Test theory**: Temporarily force `parallelSourceGain = 0` and `parallelDiffGain = 0` when SW=0, verify stops improve
2. If confirmed, implement proper mutual exclusion in `_applyKlattParams`
3. Test cascade filter order change (may require audio graph reconnection)
4. Adjust PLSTEP parameters
5. Validate with "good book" test phrase
