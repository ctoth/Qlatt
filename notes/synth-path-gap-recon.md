# DECtalk synthesis-path parity recon (2026-05-29)

Q: "Grok the synthesis path; what else to match DECtalk 100%?" Scope = acoustic/synthesis
path (phonemes → frames → audio), full autonomy ("jfg").

Reference: `~/src/dectalk/463/dapi/src` (DECtalk 4.63 C). Port: Qlatt dectalk-english.

Backlog (notes/dectalk-parity-backlog.md) covers FRONTEND deeply (27 commits dt-1..dt-13,
allophones/duration/syllabification/dict/intonation/locus transitions all landed). The
LEAST-audited area is the actual synth ENGINE — early scout claimed "~95% done, only tilt"
but never diffed vtm.c. Q's "synthesis path" = verify that claim.

Fanning out 4 scouts (reference-vs-port diff, observations only):
1. VTM engine — vtm.c/decvoc/vfmd2pol/tilt vs klatt-synth + crates + graph.yaml
2. Frame generation/smoothing — ph_sort/ph_setar/ph_drwt0/ph_timng vs track-assembler.ts
3. F0 render engine — ph_inton1/Ph_drwt02 vs layered F0 renderer
4. Voice param sets — ph_vset/ph_vdefi vs speakers/*.yaml + inventory (true-Paul debt)

## SYNTHESIS (2026-05-29, all 4 scouts returned)

**HEADLINE: the early "synth ~95% complete, only tilt missing" claim is FALSE and inverted.**
Tilt is the ONE source feature actually ported. The frontend (text→phoneme→phonology) is
largely matched after 27 commits; the ACOUSTIC ENGINE — the thing that makes DECtalk *sound*
like DECtalk — is the largest unmatched region and was never deeply diffed until now.

### A. ENGINE / glottal source (biggest; "the DECtalk sound") — gap-1-vtm.md
- DECtalk glottal source = **KLGLOTT88** differentiated parabolic pulse (at²−bt³, vtm3.c:982)
  at **4× oversampling**, 2-pole decimated (vtm3.c:950,1366). Radiation baked into the
  differentiated source. Port = doublet-impulse-into-resonator at **48 kHz** (impulse-train-
  processor.ts:106) + downstream radiation/differentiator. **Different excitation entirely.**
- ABSENT from port: source **jitter** (vtm3.c:1071), **diplophonia/double-pulsing** (1079),
  in-source **aspiration+breathiness mixing** w/ first-diff preemphasis (901,1453), hard
  **glottal-phase noise gate** (937 — port uses smooth sinusoidal envelope instead).
- Sample rate 11025 / 71-samp frame; **pitch-synchronous** coeff update vs port linear interp.
- Cascade F1–F5 (VTM) vs F1–F6 (port). Resonator/zero diff-eq + nasal placement MATCH.

### B. FRAME GENERATION / smoothing — gap-2-frames.md
- DECtalk emits a frame every **6.4 ms** and smooths **EVERY param at EVERY boundary**
  (linear ramp over per-param durtran). Port smooths only sonorant–sonorant midpoints +
  ~25 obstruent loci; B1–B3 and non-locus obstruent boundaries get **no transition**.
- The per-frame **phdraw** pass has no port: F0-dependent source tilt recomputed per frame,
  tspesh/pspesh held-step overrides (VOT/voicebar/aspiration bandwidth widening), fnscale.
- Per-param durtran (port flat 30 ms); amplitude/bandwidth onset-offset rules absent.

### C. F0 / intonation — gap-3-f0.md
- **GLIDE DEVIATION (confirmed):** US 4.63 hat=STEP, question=IMPULSE pair; port ramps both
  as glides (commit 128cbfe3). Deliberate upgrade — keep/revert is Q's ear call.
- Stress impulses flat (82.5 Hz) vs phrase-position front-load {140,90,60,40,10}.
- **1 baseline profile** vs DECtalk's **5** clause-type profiles (question has rising tail).
- IIR smoothing: port single one-pole hardcoded Paul α; DECtalk = TWO cascaded one-poles,
  per-voice **QU-derived** (1500+15·QU). Segmental micro-contour, glottalization dip/GLOTTAL/
  creak, deterministic F0 jitter — all ABSENT.

### D. VOICE PARAMS — gap-4-voice.md
- **F5/B5 LIVE GAP:** 5 of 10 voices (Harry/Kit/Rita/Wendy/Dennis) have a real distinct active
  F5 the port ignores; AND Paul gets a spurious F5=4500 from inventory that source DISABLES
  (ZAPF sentinel = no F5). frontend.yaml:49-50 justification is factually false. HIGH impact.
- HS (head-size) F4/F5 scaling absent for 8 non-100-HS voices. GN nasal gain omitted (no AN dB
  destination). F7/F8, BR breathiness, QU smoothing, LX/FT/NF aerodynamic yaml-only/absent.
- base-F0 calibration debt **CLOSED** (default now Paul 122, commit e118f9b6).

### Single highest-impact item
The **glottal source model** (KLGLOTT88 + 4× oversampling + jitter/diplophonia/in-source
aspiration). Everything downstream is shaped by the excitation; the port's impulse-doublet is a
different generator. Note: a `crates/oversampled-glottal-source` crate already exists (unwired
into the dectalk graph) and `~/src/klatt-syn` has a KLGLOTT88 reference.

