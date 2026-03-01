# Investigation: HH (/h/) Phoneme Audit

## Task

Audit the HH phoneme against Klatt 80 FORTRAN and acoustic phonetics literature.

## Current HH Values (from telemetry)

```
HH F0=0.0 AV=0 AVS=-70 AH=40 AF=0 SW=1 | A1=30 A2=35 A3=40 A4=45 A5=50 A6=50 AB=0
```

---

## FACTS

### Source: Klatt 80 FORTRAN (COEWAV.FOR)

**FACT 1**: Aspiration noise (UASP) is added to UGLOT (glottal source):
```fortran
C     GLOTTAL SOURCE VOLUME VELOCITY = VOICING+ASPIRATION
      AASPIR=AASPIR+DAHH
      UASP=AASPIR*NOISE
380   UGLOT=UGLOT+UASP
```
Location: COEWAV.FOR lines 160-163

**FACT 2**: UGLOT feeds the CASCADE branch (when SW=0):
```fortran
C   SEND GLOTTAL SOURCE THRU CASCADE VOCAL TRACT RESONATORS
      IF (NXSW.EQ.1) GO TO 430   ! Skip cascade if SW=1
      Y6C=UGLOT
```
Location: COEWAV.FOR lines 173-178

**FACT 3**: When cascade is used, UGLOT is zeroed before parallel branch:
```fortran
C     ZERO OUT VOICING INPUT TO PARALEL BRANCH
C     IF CASCADE BRANCH HAS BEEN USED
425   UGLOT=0.
      UGLOTL=0.
```
Location: COEWAV.FOR lines 210-213

**FACT 4**: Frication (UFRIC) goes to parallel F2-F6, NOT aspiration:
```fortran
C     EXCITE FORMANTS R2'-R4' WITH FRIC NOISE PLUS FIRST-DIFF. VOICING
      Y2P=A2*A2PAR*(UFRIC+UGLOT1) + B2*YL21P +C2*YL22P
```
Location: COEWAV.FOR line 230

### Source: Klatt 1980 Paper / Notes

**FACT 5**: Paper explicitly states routing:
> "Laryngeal sources (voicing, aspiration) -> Cascade branch"

Location: papers/Klatt_1980_CascadeParallelFormantSynthesizer/notes.md line 37

**FACT 6**: AH parameter description:
> "Amplitude of aspiration | AH | dB | 0 | 0-80 | Sent to cascade branch"

Location: notes.md line 113

**FACT 7**: B1 during aspiration:
> "Subglottal resonances not modeled (approximated by increasing B1 to ~300 Hz for aspiration)"

Location: notes.md line 277

### Source: Stevens 1998 Acoustic Phonetics

**FACT 8**: Maximum glottal area during /h/: ~0.25 cm^2
Location: notes.md line 1171

**FACT 9**: B1 during /h/: ~280 Hz (3-4x normal ~70 Hz)
Location: notes.md lines 1196-1197

**FACT 10**: Noise vs periodic source:
> "Above 3 kHz: noise can equal/exceed periodic source"
> "Below 2 kHz: periodic source dominant (at least 15 dB above noise)"

Location: notes.md lines 1193-1194

### Source: Our Implementation

**FACT 11**: HH is classified as type "fricative":
```javascript
HH: {
  ...
  type: "fricative",
  voiceless: true,
  glottal: true,
}
```
Location: tts-frontend-rules.js lines 614-617

**FACT 12**: HH is routed to SW=1 (parallel) because type === "fricative":
```javascript
const useParallel =
  ph.type === "fricative" ||
  ph.type === "affricate" ||
  ph.type === "stop_release" ||
  ph.type === "stop_aspiration";
ph.params.SW = useParallel ? 1 : 0;
```
Location: tts-frontend.js lines 595-600

**FACT 13**: Our noiseGain connects to BOTH branches:
```javascript
N.noiseGain.connect(N.mixer);          // cascade
N.noiseGain.connect(N.parallelMixer);  // parallel
```
Location: klatt-synth.js lines 353-354

---

## THEORIES

### THEORY 1: /h/ Should Use CASCADE Branch (SW=0)

**Hypothesis**: Klatt 80 routes aspiration through cascade, not parallel.

**Evidence**:
- COEWAV.FOR shows UASP added to UGLOT which feeds cascade (FACT 1-2)
- Paper explicitly states "aspiration -> cascade branch" (FACT 5-6)
- When cascade is used, UGLOT is zeroed before parallel (FACT 3)

**Test**: Compare signal flow in our implementation vs FORTRAN.

**Result**: CONFIRMED - Our SW=1 routing is WRONG for /h/

### THEORY 2: A1-A6 Settings Are Workaround for Wrong Routing

**Hypothesis**: The A1-A6 values exist only because SW=1 forces parallel branch usage.

**Evidence**:
- Klatt 80 parallel branch uses UFRIC (frication) not UASP (aspiration) for F2-F6
- With correct SW=0 routing, aspiration would naturally flow through cascade formants
- No A1-A6 settings needed when using cascade

**Test**: Check if Klatt 80 specifies parallel formant amplitudes for /h/.

**Result**: CONFIRMED - Klatt 80 does NOT use parallel branch for aspiration

### THEORY 3: B1=300 Hz is Approximately Correct

**Hypothesis**: Current B1=300 Hz matches literature recommendations.

**Evidence**:
- Stevens 1998: B1 ~280 Hz during /h/ (FACT 9)
- Klatt 1980: "B1 to ~300 Hz for aspiration" (FACT 7)
- Our setting: B1=300 Hz

**Test**: Compare values.

**Result**: CONFIRMED - B1=300 Hz is appropriate

### THEORY 4: /h/ Formants Should Match Following Vowel

**Hypothesis**: /h/ is a "voiceless vowel" and should have vowel-like formants.

**Evidence**:
- Stevens 1998 describes /h/ as aspiration filtered by vowel formants
- With cascade routing, aspiration naturally gets shaped by current formant settings
- Formant transitions toward following vowel would create correct coarticulation

**Test**: Check if Klatt 80 specifies fixed /h/ formants or uses context.

**Result**: LIKELY - Literature suggests context-dependent formants

---

## COMPARISON TABLE

| Parameter | Klatt 80 | Qlatt Current | Match? |
|-----------|----------|---------------|--------|
| Branch | Cascade (SW=0) | Parallel (SW=1) | **NO** |
| AH | Yes, to cascade | Yes, but routing wrong | Partial |
| AF | 0 | 0 | Yes |
| A1-A6 | Not used | 30-50 dB | N/A (workaround) |
| AB | N/A | 0 | Yes |
| B1 | ~300 Hz | 300 Hz | **YES** |
| F1-F3 | From context | Fixed 600/1400/2500 | **NO** |

---

## ASSESSMENT

| Aspect | Status |
|--------|--------|
| SW routing | **DISCREPANCY - CRITICAL** |
| A1-A6 values | NEEDS ADJUSTMENT (remove when routing fixed) |
| AH amplitude | MATCH (subject to routing fix) |
| B1 bandwidth | **MATCH** |
| Formant values | NEEDS ADJUSTMENT (should be context-dependent) |
| AB bypass | MATCH |

---

## PROPOSED FIXES (Citations Included)

### Fix 1: Change HH Routing to Cascade (SW=0)

**Rationale**: Klatt 80 explicitly routes aspiration through cascade branch.

**Citation**:
- Klatt 1980 Table: "AH...Sent to cascade branch"
- COEWAV.FOR lines 160-163, 173-178

**Implementation Option A**: Add explicit SW override in HH definition:
```javascript
HH: {
  ...
  SW: 0,  // Override: aspiration uses cascade per Klatt 80
}
```

**Implementation Option B**: Modify routing logic to exclude glottal fricatives:
```javascript
const useParallel =
  ph.type === "fricative" && !ph.glottal ||
  ph.type === "affricate" ||
  ...
```

### Fix 2: Remove A1-A6 from HH

**Rationale**: With cascade routing, these are unnecessary. Aspiration will be filtered by cascade formants.

**Citation**: COEWAV.FOR lines 177-209 show cascade filters UGLOT (containing aspiration)

### Fix 3: Add Formant Coarticulation for /h/

**Rationale**: /h/ formants should anticipate following vowel.

**Citation**: Stevens 1998 Section 8.8 - /h/ has vowel-like formant structure

**Implementation**: In track generation, interpolate HH formants toward next phoneme.

---

## CONCLUSION

The primary issue is **incorrect branch routing** (SW=1 instead of SW=0). This is a fundamental architectural deviation from Klatt 80. The A1-A6 settings are a workaround that partially compensates but produces acoustically different output than the original design.

Priority: **HIGH** - Affects fundamental acoustic character of /h/.
