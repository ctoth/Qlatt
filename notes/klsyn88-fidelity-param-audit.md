# KLSYN88 Parameter-Surface Audit vs Klatt & Klatt 1990 Spec

Read-only audit. Compares `public/experiments/klsyn88/semantics.yaml` (+ `graph.yaml`)
against:
- `papers/Klatt_1990_VoiceQualityVariations/notes.md` — Table XI (constants), Table XII
  (variable params), Eq. 1, §3. **Canonical KLSYN88 spec.**
- `papers/Klatt_1988_KLSYNFormantSynthesis/notes.md` — manual Table I (symbols/defaults/
  ranges/units).
- `notes/klsyn88-fidelity-reference-signalpath.md` — shipped parwv.c truth.
- `notes/klsyn88-fidelity-paper-features-spec.md` — the new-feature spec.

## Verification (read-only, run this tree)

- `npm run test:golden` → **EXIT=0 (green)**. All primitive goldens within tolerance.
- All-defaults klsyn88 "she sees a dog" render
  (`scripts/render-phrase.ts --phrase "she sees a dog" --experiment-id klsyn88
  --out-wav tmp/audit-noop.wav`) → md5 **`eacf192fb9d7fcaa6c8171ae6fce0d07`** ==
  north-star. **No-op invariant intact.** (render-phrase exits 1 only because of its
  built-in auto golden-compare against the qlatt-english golden for that phrase; the wav
  is written and byte-identical to the baseline — same behavior the feature coders relied
  on.)

---

## 1. Parameter-by-parameter comparison

Legend: ✓ = matches paper/manual; ⚠ = divergence; ✗ = bug. "Paper" column is Table XII/XI
(1990); manual = Klatt 1988 Table I where it disambiguates.

### 1.1 The FOUR NEW 1990 FEATURES (the subject of this work) — all faithful

| Param | Ours (default / range / unit) | Paper (min/def/max) | Cited? | Verdict |
|-------|------|------|------|------|
| FL (flutter) | 0 / [0,100] / % | 0/0/100 | yes (eq.1 in comment + crate) | ✓ |
| DI (diplophonia) | 0 / [0,100] / % | 0/0/100 | yes (§3 in comment + crate) | ✓ |
| SQ (speed quotient) | 200 / [100,500] / % | 100/200/500 | yes (Table XII) | ✓ default/range |
| ss (source select) | 2 / [1,4] | 1/2/3 | yes (Table XI) | ⚠ range incl. 4=square (shipped-C "else"), paper is 1–3 |
| FTP | 2150 / [300,3000] / Hz | 300/2150/3000 | yes (Table XII) | ✓ |
| BTP | 180 / [40,1000] / Hz | 40/180/1000 | yes | ✓ |
| FTZ | 2150 / [300,3000] / Hz | 300/2150/3000 | yes | ✓ |
| BTZ | 180 / [40,2000] / Hz | 40/180/2000 | yes | ✓ |

The four new features are present, correctly defaulted, correctly ranged, cited, and
default to an exact no-op (md5 confirmed). **This part of the surface IS the 1990 spec.**

### 1.2 Source / voice-quality params

| Param | Ours | Paper / manual | Verdict |
|-------|------|------|------|
| F0 | 0 / [0,500] / Hz | 0/1000/5000 in **0.1 Hz** units | ✓ units resolved: ours is plain **Hz** (range 0–500 Hz == paper's 0–5000 Hz×10); the crate consumes Hz directly (`t0 = 4*sr/f0_eff`). Internally consistent. |
| AV | 0 / [0,**70**] / dB | 0/60/80 | ⚠ range max 70 vs 80 (default 0 OK — track-driven) |
| AVS (=manual `ap`) | 0 / [0,**70**] / dB | 0/0/80 | ⚠ range max 70 vs 80 |
| AH | 0 / [0,**70**] / dB | 0/0/80 | ⚠ range max 70 vs 80 |
| AF | 0 / [0,80] / dB | 0/0/80 | ✓ |
| Aturb (`at`) | 0 / [0,80] / dB | 0/0/80 | ✓ |
| Kopen (`oq`) | 50 / [0,100] / % | 10/50/99 (Tbl XII); manual 10–80 | ⚠ min 0 vs 10; **units resolved: % (matches shipped parwv.c `nopen=T0*Kopen/100`)** — the manual's "exact sample count for ss=2" is a doc quirk the C code does not honor; ours = % is correct for shipped fidelity |
| OQ (override) | 0 / [0,99] | (sentinel: 0 ⇒ derive from Rd) | note: dual control — actual OQ default lives in Kopen=50; OQ is an override layer |
| TL | 0 / [0,**34**] / dB | 0/0/**41** (Table XII) | ⚠ **CONFLICT — see §3.1** |
| TLTdb | 0 / [0,34] / dB | manual `tl` 0–34 | ⚠ redundant 2nd tilt control (see §3.1) |
| Kskew (`sk`) | 0 / [0,**200**] | 0/0/**100** (25 µs units) | ⚠ range max 200 vs 100 |
| GO (`g0`) | **57** / [0,**60**] / dB | manual g0 0/**60**/80 | ⚠ **default 57 + −3 offset ⇒ effective Gain0=54 dB vs klsyn88 g0=60⇒57. Possible 3 dB level deficit — see §3.5** |

### 1.3 Formants & bandwidths

| Param | Ours (def / range) | Paper / manual (min/def/max) | Verdict |
|-------|------|------|------|
| F1 | 500 / [**200**,1300] | 180/500/1300 | ⚠ min 200 vs 180 ("F1≥180 always") |
| F2 | 1500 / [550,3000] | 550/1500/3000 | ✓ (the klsyn.h `850` is a vowel-demo default, NOT Table I; ours=1500 is correct) |
| F3 | 2500 / [1200,**4999**] | 1200/2500/4800 | ⚠ max 4999 vs 4800 |
| F4 | **3500** / [**1200**,4999] | 2400/**3250**/4990 | ⚠ default 3500 vs 3250; min 1200 vs 2400 |
| F5 | **4500** / [**1200**,4999] | 3000/**3700**/4990 | ⚠ default 4500 vs 3700; min 1200 vs 3000 |
| F6 | **5500** / [1200,**4999**] | 3000/4990/4990 | ✗ **BUG: default 5500 is OUTSIDE its own range [1200,4999]; also far above manual 4990** |
| B1 | 60 / [**40**,1000] | 30/60/1000 | ⚠ min 40 vs 30 |
| B2 | 90 / [40,1000] | 40/90/1000 | ✓ |
| B3 | 150 / [**40**,1000] | 60/150/1000 | ⚠ min 40 vs 60 |
| B4 | 200 / [**40**,1000] | 100/200/1000 | ⚠ min 40 vs 100 |
| B5 | 200 / [40,**1000**] | 100/200/1500 | ⚠ max 1000 vs 1500 |
| B6 | 500 / [40,**2000**] | 100/500/4000 | ⚠ max 2000 vs 4000 |
| dF1hz (`DF1`) | 0 / [0,**500**] | 0/0/100 | ⚠ max 500 vs 100 |
| dB1hz (`DB1`) | 0 / [0,500] | 0/0/400 | ⚠ max 500 vs 400 |

### 1.4 Nasal & parallel

| Param | Ours (def / range) | Paper / manual | Verdict |
|-------|------|------|------|
| FNZ | **270** / [**248,528**] | 180/280/800 | ⚠ default 270 vs 280; range narrowed 248–528 vs 180–800 |
| BNZ | 90 / [40,1000] | 40/90/1000 | ✓ |
| FNP | **270** / [**248,528**] | 180/280/500 | ⚠ default 270 vs 280; max 528 vs 500 |
| BNP | 90 / [40,1000] | 40/90/1000 | ✓ |
| A1–A6, AN, AB | 0 / [0,80] | 0/0/80 (A1V–A4V def 60 in all-parallel) | ✓ track-driven |
| B1p–B6p (`p1`–`p6`) | 80/200/350/500/600/800 | 80/200/350/500/600/800 | ✓ defaults; ⚠ B5p max 1000 vs 1500, B6p max 2000 vs 4000 |

### 1.5 Constants (Table XI) — declared vs absent

| Constant | Paper (min/def/max) | In semantics? | Note |
|----------|------|------|------|
| NF (cascade formant count) | 1/**5**/6 | NFCASC **6** / [1,8] | ⚠ **default 6 vs 5** (paper, manual, AND shipped-C all = 5) |
| RS (seed) | 1/**8**/8191 | seed 1 / [1,**2147483647**] | ⚠ default 1 (matches shipped-C, not paper 8); range wildly off both 1–99 and 0–99999 |
| GV/GH/GF (per-source gains) | 0/60/80 each | **absent** — folded into hardcoded scales (aspGain×0.05, fricGain×0.25, etc.) + GO | ⚠ scales are faithful to parwv.c §5.1 but the master GV/GH/GF knobs are not exposed |
| ATV (parallel tracheal amp) | 0/0/80 | **MISSING** | parallel-branch tracheal formant has no amplitude knob (cascade tracheal pair IS present) |
| SB (same noise burst) | 0/1/1 | **MISSING** | minor |
| CP (cascade/parallel) | 0/0/1 | **MISSING** | routing is unconditional parallel-mix (matches shipped-C, not the CP switch) |
| OS (output select) | 0/0/20 | **MISSING** | debug taps; N/A for synthesis |
| SR / DU / UI | — | not semantics params | rate/duration/frame are host/track level; SR fixed by host (golden ran at **22050**, vs klsyn88 10000/11025 — separate fidelity axis, see §3.6) |

---

## 2. Flutter ordering: pre- vs post-declination

**Post-declination (additive on the final F0 track).** `oversampled-glottal-source/
src/lib.rs:251-258,283`: `flutter_f0(f0_hz, flutter)` is applied to the per-period F0
value handed in from the contour (which already carries declination), then `t0` is derived
from `f0_eff`. `t` is the absolute output-sample clock (`sample_counter/sample_rate`,
line 96-97), i.e. absolute utterance time in seconds — exactly Eq. 1.

**Matches the paper?** The paper does NOT mandate an order (spec §6 #9 flagged this).
Post-declination is the spec's stated assumption and the physically natural reading
(declination is slow contour shape; flutter is a fast additive micro-perturbation). So:
**consistent with the paper, low-stakes either way.** Diplophonia (lines 369-391, 488-490)
implements BOTH the delay AND the amplitude attenuation (`dipl_amp = 1 − DI/100`) — the
FULL paper §3 algorithm, beyond the shipped-C delay-only `skew`. Good. Note: Kskew (`sk`)
still co-exists as a separate period-perturbation control — redundant with DI but not a bug.

---

## 3. The flagged conflicts — resolution

### 3.1 TL spectral-tilt max: 34 vs 24 vs 41
- **Ours uses 34** (both `TL` and `TLTdb` ranges are [0,34], and `effectiveTiltDb` clamps
  to 34).
- Shipped parwv.c clamps `TLTdb` to [0,34] and indexes `lineartilt[35]` (entries 0..34) —
  **34 is the correct ceiling for shipped-klsyn88 fidelity.** The "24" is the manual's
  *example* ("tl=24 → ~24 dB atten above 3 kHz"), not a max. The "41" is Table XII's
  nominal max but the actual C tilt table only reaches 34.
- **Resolution: ours (34) is correct for fidelity to the shipped synthesizer.** If the
  target is the *paper's* declared surface, extend to 41 — but then the underlying tilt
  table must also be extended past index 34, which it is not. Recommend: keep 34, add a
  comment citing the lineartilt[35] table as the reason it is not 41.
- **Secondary issue:** TL and TLTdb are two separate tilt controls feeding the same
  `effectiveTiltDb`. The 1990 spec has ONE tilt param (TL). Redundancy should be
  documented or collapsed.

### 3.2 OQ / Kopen units: % vs open-sample-count
- **Ours treats Kopen as percent** (`effectiveKopen`; nopen = t0·oq/100 in the crate).
- Shipped parwv.c §2.7 also computes `nopen = T0*(Kopen/100)` — i.e. **percent**, despite
  the manual claiming "exact sample count for ss=2." **Resolution: ours (%) matches the
  shipped C.** The manual statement is a documentation inaccuracy; no change needed.

### 3.3 F0 units: Hz vs Hz×10
- **Ours is plain Hz** (range [0,500] Hz; crate consumes Hz directly). Paper/manual express
  `f0` in Hz×10. **Resolution: no bug** — the Hz×10 packing is a klsyn file-format detail;
  internally ours and the crate agree on Hz. Default 0 (= no voicing) matches.

### 3.4 F2 default 850 vs 1500
- **Ours is 1500** = Table I / Table XII default. The `850` (klsyn.h / signalpath §8) is a
  **vowel-specific demo default** in the driver's `cdefval`, not the manual's neutral F2.
  **Resolution: ours (1500) is correct.**

### 3.5 SQ default 200 vs Fant Rd covariation
- **Ours uses 200** (Klatt UI default), range [100,500], and maps to LF only via
  `lfRd = (10000/SQ − 22.4)/11.8`. At SQ=200 ⇒ lfRd ≈ **2.34** (a breathy/lax Rd), which is
  far from modal. The spec §6 #8 explicitly flags that Klatt's SQ=200 default and Fant's
  Rd-defaulted Rk (which implies SQ≈290–390 % at modal Rd) are **mutually inconsistent**.
- **Resolution: ours honors the Klatt UI default (SQ=200) as authoritative**, and only uses
  Fant covariation when driving from Rd — which is the spec's recommended pick. But note the
  SQ=200⇒Rd=2.34 mapping makes the *default* SS=3 voice unexpectedly breathy. Inert unless
  SS=3 (non-default), so low stakes; worth a comment that "modal SS=3" needs SQ≈300, not 200.

### 3.6 (bonus) GO level deficit — possible cause of "klsyn88 sounds quiet"
- `GO` default **57**, range [0,**60**]; `gain0Db = (GO−3)`; so default ⇒ Gain0 = **54 dB**.
- Shipped klsyn88: `g0` default **60**, `Gain0 = g0 − 3 = 57`. So our default master gain is
  **3 dB below** the klsyn88 reference, and the GO range maxes at 60 (vs manual g0 0–80).
- This corroborates MEMORY `project_klsyn88_quiet_observation`. To reproduce klsyn88's
  default level, GO should default to **60** (⇒ Gain0=57), and the range should be [0,80].
  **Caveat:** the no-op md5 is locked to the *current* baseline, so changing GO would move
  the north-star — needs a deliberate re-baseline, not a silent fix. Flag for investigation.

### 3.7 (bonus) rs/seed range 1–99 vs 0–99999
- Manual Table I says 1–99; prose says 0–99999; Table XI (1990) says 1/8/8191. **Ours is
  [1, 2147483647], default 1** — matches none of them. Default 1 matches shipped-C
  `ranseed`. Low stakes (seed only affects noise realization), but the range is unjustified.

---

## 4. Uncited / labeled magic numbers (CLAUDE.md Principle 1)

- `lfMakeupGain = 9600.0` — **labeled** "Engineering estimate (RMS-matched, measured)". OK.
- `rdDerivedTiltDb … * 0.6` — **labeled** "engineering proxy". OK.
- `deltaB1 = 250.0 * pow(F1/500,2) * (Ra−RaRef) / 12.0` — the **250** and **/12** are
  uncited within the formula. The block comment cites "Fant 1997 (B1/B2 leakage)" generally
  but the specific constants lack a paper/table reference. ⚠ should carry an explicit
  citation or an `# engineering estimate` label.
- `eeCovaryDb = 40.0 * log10(RdRef/effectiveRd)` — cited (Fant 1997 "1 dB in 1/Rd ↔ 2 dB
  Ee"); the 40 = 2×20·log10 follows. OK.
- Per-formant parallel scales (×0.4, ×0.15, ×0.06, ×0.04, ×0.022, ×0.03, AN×0.6, AB×0.05,
  asp×0.05, fric×0.25) — all match parwv.c §5.1 exactly; faithful (cited via signalpath).
- `avDb = AV−7`, `gain0Db = GO−3` — match the C offsets. ✓

---

## 5. VERDICT

**The four new 1990 features (FL, DI, LF/SS=3 + SQ, tracheal FTP/FTZ/BTP/BTZ) DO faithfully
constitute the Klatt & Klatt 1990 additions**: present, correctly defaulted, correctly
ranged, cited, defaulting to an exact byte-for-byte no-op (md5 confirmed), with flutter
applied post-declination per Eq. 1 and diplophonia implementing the full delay+attenuation
algorithm.

**But the SURROUNDING klsyn88 parameter surface is NOT yet a faithful reproduction of
Table XI/XII.** Concrete gaps remain (one outright bug, several default/range divergences,
a likely 3 dB level deficit, and a few missing params).

### Ranked fixes for a follow-up coder

1. **[BUG] F6 default 5500 is outside its own declared range [1200,4999].** Either raise
   the max or (better, for fidelity) set F6 default to **4990** and range to [1200,4990].
   This is a data-integrity defect independent of any spec interpretation.
2. **[HIGH] NFCASC default 6 → should be 5.** Paper Table XI, the manual, and shipped
   parwv.c all default to 5 cascade formants. Default 6 changes the neutral cascade.
3. **[MEDIUM] Investigate the GO 3 dB deficit (§3.6).** GO default 57 ⇒ Gain0=54 vs
   klsyn88's 57; range [0,60] vs manual [0,80]. Likely the "klsyn88 sounds quiet" cause.
   Requires a deliberate north-star re-baseline if changed.
4. **[MEDIUM] Restore manual formant/nasal defaults:** F4 3500→3250, F5 4500→3700,
   FNZ 270→280, FNP 270→280; widen nasal ranges (FNZ 180–800, FNP 180–500) from the
   narrowed [248,528]. These are the neutral-vowel defaults the manual specifies.
5. **[MEDIUM] Decide & document the TL ceiling (§3.1):** keep 34 (shipped-C lineartilt
   fidelity) with a comment, or extend to 41 *and* extend the tilt table. Also collapse or
   document the TL/TLTdb redundancy (the 1990 spec has one tilt param).
6. **[LOW] Align soft ranges to the manual:** AV/AH/AVS max 70→80; F1 min 200→180;
   B1 min 40→30; B3 min 40→60; B4 min 40→100; B5 max 1000→1500; B6 max 2000→4000;
   dF1hz max 500→100; dB1hz max 500→400; Kskew max 200→100; F3 max 4999→4800;
   B5p max 1000→1500, B6p max 2000→4000.
7. **[LOW] Add missing synthesis-relevant params:** ATV (parallel tracheal amp, 0/0/80);
   optionally SB (same-noise-burst) and explicit GV/GH/GF master gains (currently folded
   into hardcoded per-source scales — faithful, but not exposed as the spec's knobs).
8. **[LOW] seed range/default:** narrow to the spec (default per use-case; range at most
   0–99999) and add a citation for whatever range is chosen.
9. **[LOW] Document the SQ=200⇒Rd≈2.34 tension (§3.5)** in the LF comment block — a "modal"
   SS=3 voice wants SQ≈300, not the inherited 200 default.
10. **[LOW] Cite the deltaB1 constants (250, /12)** or label them `# engineering estimate`.

### Non-issues (verified, do NOT "fix")
- OQ/Kopen as % (matches shipped C). F0 in Hz (internally consistent). F2 default 1500
  (correct; 850 is a demo value). Flutter post-declination (spec-consistent). All four new
  features' defaults/ranges/citations. Per-formant parallel scales (faithful to parwv.c).
