# TRACK INV — Female Inventory Build (notes)

## DONE — PASS (formant gate). Report: design/beauty-synthesis/build/reports/track-inv.md
Corner vowels measured female: /iy/ she F2 2800 (male 1941), /ae/ cat F1 846/F3 2871 (male
565/2520), /aa/ calm 794/1196/2847, /uw/ moon F3 2829 (male 2309). All on P&B female target,
all clearly > male. F3 +300..1000 everywhere. Nonuniform confirmed (close-V F1 low, open-V F1
high). F0 caveat: realized F0 owned by frontend.yaml policy.f0.base_hz=110 (TRACK PROS); my
base_params.F0=190 is set but overridden by prosody contour — flagged for PROS. Script:
scripts/build-female-inventory.py.

## State (2026-06-29)
Building female inventory for `public/rules/frontends/qlatt-beauty/inventory.yaml`.
File ALREADY EXISTS — it's a MALE skeleton copied from qlatt-english (Hillenbrand male
formants, Rd 0.7, F0 0, B1 100). My job: make base_params + per-phoneme targets genuinely
FEMALE. Edit ONLY this file. No git add/commit. No wasm rebuild.

## Numbers gathered (from design docs)
### Female scaling (06-vocal-tract.md §3)
- NONUNIFORM. F1 fem/male ≈ 1.12–1.18 PLUS extra ~1.05 volume boost (F1 scaled MORE).
- F2/F3 fem/male ≈ 1.15–1.20 (≈ length ratio). Per-vowel front/back correction.
- Do NOT ship uniform ×1.17 (= "pitched-up male" failure).

### DECISION: use Peterson & Barney 1952 WOMEN averages directly (matches prompt anchors)
P&B female anchors from prompt: iy 310/2790, aa 850/1220, uw 370/950 — these are P&B women.
Full P&B 1952 women monophthongs (F1/F2/F3):
- IY /i/   310/2790/3310
- IH /ɪ/   430/2480/3070
- EH /ɛ/   610/2330/2990
- AE /æ/   860/2050/2850
- AA /ɑ/   850/1220/2810
- AO /ɔ/   590/920/2710
- UH /ʊ/   470/1160/2680
- UW /u/   370/950/2670
- AH /ʌ/   760/1400/2780
- ER /ɝ/   500/1640/1960
Diphthong nuclei interpolated (EY~480/2350, OW~510/1000, AY~850/1400, AW~820/1400, OY~590/920).

### Female bandwidths (06 §2, 02 §3)
- B1 by height: close ~55, mid ~75–90, open ~120–150 (female ~+40 Hz vs male, Hanson; glottal-coupled open). Hanson B1(/æ/)=165 F.
- B2 ~90–120, B3 ~160–200 (female wider). B4 170/B5 250/B6.

### Female source base_params (02 §3, Hanson_2002 Table VI)
- F0 ~190; Rd 1.4 / RdRef 1.4; OQ female 65%; TL female 10 dB (steeper); B1 floor ~165;
  modest AH floor (posterior chink); flutter 25; jitter 0.25; DI 0.
- HF A7-A10 air band +2-4 dB concentrated high (09-high-frequency-band.md): female sparkle
  lives in 16-kHz octave. NOTE backend param vocab is A1-A10 (no A11); F7-F10 only flow
  through PARALLEL branch on klatt80-baseline, so HF won't show on voiced vowel renders —
  final HF tuning at integration (prompt says so). Set as documented intent anyway.

### Per-phoneme static Rd deltas (voice-quality-synthesis Table 2.1, female base 1.4)
open V(AA,AE,AH,AO)=1.4; mid V(EH,ER)=1.45; close V(IY,IH,UW,UH)=1.55;
diph(EY,AY,OW,AW,OY)=1.45; voiced stop closure(B,D,G)=1.9; nasals(M,N,NG)=1.7;
voiced fric(V,DH,Z,ZH)=1.6; approx(L,R,W,Y)=1.5; HH=2.6; AX-like reduced=1.5.

## BLOCKER / TO VERIFY
Does a phoneme_target field `Rd:` actually propagate to the frame params? Need to check
`src/declarative-frontend/inventory.ts` (fillDefaultParams / which fields become params).
If arbitrary param keys pass through, I set Rd per phoneme directly. Else need another path.

## RESOLVED blocker
- inventory.ts fillDefaultParams (L142-143): a phoneme_target field propagates to frame
  params ONLY if key is in base_params. Rd/RdRef/OQ/TL/AH ARE in base_params → per-phoneme
  Rd overrides WORK. Confirmed.
- Worklets + cmu dict already built. ruamel.yaml installed (pip) for comment-preserving edit.
- Plan: scripted transform (scripts/ throwaway) using ruamel — set base_params female +
  P&B female vowel table + per-phoneme Rd + consonant female scaling. Then render+measure.
- base_params decisions: F0 190, Rd/RdRef 1.4, OQ 65, TL 10 (Hanson_2002 Table VI female),
  B1 165 floor, AH 35 modest chink floor, flutter 25, jitter 0.25, DI 0 (need add DI key),
  A7-A10 HF air (+ vs male; won't show on klatt80 voiced cascade — integration tuning).
  Protect voiceless stop closures/SIL with AH:0 to avoid gap hiss.

## Verify gate
render-phrase.ts (ts-node loader) --frontend-id qlatt-beauty --experiment-id klatt80-baseline
--host node --sample-rate 48000 --compare-golden 0, then `npm run measure`. Confirm F0~190
and F1/F2/F3 female (compare vs qlatt-english male render of same phrase).
Phrases: "she sees a calm blue moon", "the happy cat".
Deliverable report: design/beauty-synthesis/build/reports/track-inv.md
