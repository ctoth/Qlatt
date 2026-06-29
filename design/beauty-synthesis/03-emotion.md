# 03 — Emotion & Affect: The Expressive Control Surface

Research axis: how to make a clean-room Klatt-style synth sound happy, sad, depressed, tender,
angry, powerful, afraid, intimate — as a *controllable surface*, not one fixed voice.

Sources (paper-folder citations):
`Scherer_1986_VocalAffectExpressionReview` (notes absent — read directly from page images, Tables 5 & 6),
`Scherer_1984_VocalCuesSpeakerAffect`, `Scherer_2001_VocalEmotionCrossCultural`,
`Scherer_TaskLoadStressAcoustics`, `Murray_1993_SimulationEmotionSyntheticSpeech`,
`Burkhardt_2005_GermanEmotionalSpeechDatabase`, `Burkhardt_2009_VoiceQualityFormantSynthesis`,
`Gobl_2003_VoiceQualityEmotion`, `Rutledge_1995_SynthesizingStyledSpeechKlatt`,
`Anumanchipalli_KLATTSTAT`.

---

## 1. THE ACOUSTIC PROFILE OF EACH EMOTION

Two layers of evidence converge here:

- **Qualitative direction** — Murray 1993 Table I (`Murray_1993_SimulationEmotionSyntheticSpeech`) and
  Scherer 1986 Table 6 (`Scherer_1986_VocalAffectExpressionReview`), which gives the most complete
  per-emotion acoustic-parameter prediction grid in the literature (`>` increase, `<` decrease,
  doubled symbol = strong, `<>` = opposing forces / unresolved).
- **Quantitative multipliers** — Rutledge 1995 Tables 3 & 4 (`Rutledge_1995_SynthesizingStyledSpeechKlatt`)
  give actual KLSYN88 scaling factors relative to a *normal* baseline, and Gobl 2003 / Burkhardt 2009
  give voice-quality parameter values.

### 1a. Master profile table (synthesis-facing)

All values are **relative to a neutral baseline** unless an absolute number is cited. F0/intensity/rate
columns fuse Murray 1993 Table I + Scherer 1986 Table 6. "VQ" = target phonation type. Rutledge
multipliers (where available) are given as ×factor.

| Emotion | F0 mean | F0 range / variability | F0 contour | Tempo / duration | Intensity | Voice quality (phonation) | Spectral tilt (TL) |
|---|---|---|---|---|---|---|---|
| **Joy / elation** | much higher (Scherer86 `≥`, Murray "much higher"; Rutledge angry-adjacent) | much wider (`≥≥`) | smooth **upward** inflections, undulating | faster, "lively" (rate `≥`) | higher (`≥`) | modal→**tense/breathy "blaring"**; smiling raises F0+formants (Murray) | **lower TL** (brighter, more HF energy) |
| **Quiet happiness / contentment** | slightly higher to neutral (Scherer86 `<` vs elation) | narrow-to-moderate | gently falling, stable | relaxed, slightly slow (rate `<`, transition time `>`) | moderate (`<`) | **breathy/lax**, "wide voice" (Scherer86: Wide valence, Relaxed) | higher TL (softer) |
| **Sadness / dejection** | slightly **lower** (Murray 136 Hz median; Scherer86 `<>` = weak/ambiguous) | **narrowest** range & variability (`≤`), flattest | long **falling**, monotone | **slow** (129 wpm; vowels+pauses lengthen; rate `≤`, transition time `>`); pause ratio ~47% | **much lower** (`≤≤`) | **breathy + lax-creaky** (Gobl, Burkhardt09) | **high TL** (dark, dull; soft "≈+18%" cf. Rutledge soft) |
| **Depression** (clinical sub-case of sadness) | very flat, low | very narrow — near-monotone | minimal movement | slow, long pauses | low | **lax-creaky / breathy**, low AV | high TL |
| **Anger — hot / rage** | **very much higher** (Fairbanks 229 Hz; Rutledge angry **F0 ×1.90**) | **much wider** (`≥≥`), high rate of change (25.6 tones/s) | abrupt rises on stressed syl; "angular", rigid melodic line | slightly faster (190 wpm; Rutledge vowel-dur ×1.69, but cons-dur ×0.87) | **higher** (AV ×1.32; "extremely full" voice) | **tense / harsh** (Gobl, Burkhardt09 → anger) | **low TL** (Rutledge ×0.85; needs strong HF energy >4 kHz) |
| **Anger — cold / irritation** | ambiguous mean (`<>`), can be *lower* (threat subtype, larger pharynx → lower F1) | narrower range than hot anger (`<`) | controlled, falling | medium-tense rate | medium-high | tense, "medium-full" power | low–moderate TL |
| **Fear / terror** | **highest** (Fairbanks 254 Hz; Scherer86 `≥≥`) | **widest** (`≥≥`) but with melodic disintegration | many direction changes; **shift regularity ↓** (irregular) | **much faster** (202 wpm; rate `≥≥`, transition time `<`) | normal-to-high (`>`) | **irregular voicing**, → **whispery / falsetto** (Gobl, Burkhardt09); F0 flutter | very high HF energy (`≥≥`) |
| **Tenderness / intimacy** | higher than neutral, **does not fluctuate** (Murray "affection") | **narrow**, restrained | very slightly descending, smooth | restrained / slow; portamento on long stressed vowels | **reduced** loudness ("soft"; Rutledge soft AV ×0.97, TL ×1.18) | **breathy** (→ intimate/friendly/content, Gobl), slight nasality (Murray) | **high TL** (soft, warm) |
| **Power / dominance** | mid, controlled | moderate, deliberate | strong stressed-syllable rises, falling boundaries | slow-deliberate, long stressed vowels | **high** (`≥≥`, "extremely full") | **tense, full voice** — low F1 bandwidth, high formant precision, strong low-freq energy | low TL (full spectrum) |
| **Neutral** | baseline (e.g. 110–140 Hz male) | baseline | declination only | baseline rate | baseline | **modal** (Burkhardt09: modal = "not angry"/neutral) | baseline (TL ≈ 0–10 dB) |

### 1b. Rutledge 1995 absolute KLSYN88 anchors (the few hard numbers we have)

From `Rutledge_1995_SynthesizingStyledSpeechKlatt` Tables 1 & 3 (single male speaker, word "hot",
normal F0 = 140.4 Hz):

| Style | F0 (Hz) | F0 ×norm | AV ×norm | OQ ×norm | SQ ×norm | TL ×norm | Vowel-dur ×norm |
|---|---|---|---|---|---|---|---|
| normal | 140.4 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| angry | 266.7 | 1.90 | 1.32 | 1.01 | 0.71 | 0.85 | 1.69 |
| loud  | 250.0 | 1.78 | 1.25 | 1.16 | 1.58 | 0.75 | 1.58 |
| soft  | 135.6 | 0.97 | 0.97 | 1.01 | 0.82 | 1.18 | 0.92 |
| slow  | 142.9 | 1.02 | 1.01 | 1.01 | 0.99 | 1.00 | 1.83 |
| fast  | 150.9 | 1.07 | 0.98 | 1.03 | 0.94 | 0.95 | 0.72 |
| question | 205.1 | 1.46 | 1.06 | 0.93 | 1.03 | 1.00 | 1.13 |

**Read this as the calibration of the qualitative grid:** anger ≈ F0 nearly doubled, AV +32%, faster
closing (SQ↓), reduced tilt; soft/tender ≈ slightly lowered F0, slower closing (SQ 0.82 → breathier),
*more* tilt (+18%). These are the only published Klatt-domain multipliers and should seed our default
preset deltas.

### 1c. Recognition reality-check (don't over-invest in joy via F0 alone)

Cross-cultural recognition rates (`Scherer_2001_VocalEmotionCrossCultural`, 9 countries, 66% mean):
**anger 76%, sadness 71%, fear 66%, joy 42%** (joy→neutral confusion 34%). Berlin EmoDB acted German
(`Burkhardt_2005_GermanEmotionalSpeechDatabase`): anger 96.9%, fear 87.3%, boredom 86.2%, joy 83.7%,
sadness 80.7%. **Implication:** high-arousal negatives are easy; **joy is the hard one** — high F0 is
necessary but not sufficient, it collapses into "neutral/aroused." Joy needs the *extra* cues: smiling
formant raise (F1/F2 up), upward contour shape, and rhythmic liveliness, not just pitch.

---

## 2. THE CONTROL MODEL — categories vs. dimensions

**Recommendation: a dimensional engine with categorical presets as named coordinates.** Build the
control surface on continuous dimensions; ship discrete emotions as labeled points/regions in that space.

The literature is explicit that discrete emotions are *points in a continuous space*, not primitives:

- Murray 1993 (`Murray_1993_SimulationEmotionSyntheticSpeech`) reviews Schlosberg's 3 dimensions
  (Strength/attention-rejection, Valence/pleasant-unpleasant, Activity/sleep-tension) and concludes the
  categorical-vs-dimensional debate resolves as "discrete emotions exist as points within a continuous
  dimensional space."
- Scherer 1986 (`Scherer_1986_VocalAffectExpressionReview`) **derives** his per-emotion acoustic
  predictions from exactly three dimensions — **hedonic valence, activation, power** (Table 5) — by way
  of voice-type predictions (wide/narrow voice, lax↔tense, thin↔full voice). This is the strongest
  endorsement: the canonical emotion-acoustics paper builds emotions *out of* dimensions, so our
  generator should too. The three map cleanly to controls:
  - **Valence (hedonic)** → voice **width** (wide voice = positive, narrow voice = negative): F1
    bandwidth, formant spread, breathy-open vs. pressed.
  - **Activation / arousal** → voice **tension** (lax↔tense): F0 mean/range, intensity, rate, OQ/SQ,
    spectral tilt.
  - **Power / potency** → **thin↔full voice**: low-frequency energy, F1 height/precision, AV.
- Scherer 1984 (`Scherer_1984_VocalCuesSpeakerAffect`) shows the two-model truth that shapes the
  architecture: **voice quality and F0 level/range obey the covariance (scalar, gradient) model** — they
  can be turned as continuous knobs independent of text — **while intonation *contour type* obeys the
  configuration model** — a "fall" is not inherently aggressive; it signals affect only relative to the
  expected contour for that sentence type.

**Architectural consequence:** emotion = a `(valence, arousal, power)` vector plus a small set of
categorical *contour/voice-quality* selectors that must be resolved against linguistic structure.
Scalar dims drive most parameters continuously (enabling blends, intensities, and morphs between
emotions); the categorical layer picks contour shape and phonation type, which interact with the
sentence's information structure. This gives the "controllable surface, not one fixed voice" we want:
intensity = vector magnitude; blends = interpolation; presets = named anchors.

---

## 3. WHICH AXES CARRY THE MOST EMOTION (where to invest)

Ranked by emotional information carried, per Scherer 1984/1986/2001 and Murray 1993:

1. **F0 statistics — mean, range, variability** (the dominant carrier of *arousal*). Scherer 1984
   regressions: F0 s.d. alone = **24.3%** of "aroused" variance; mean F0 = 18–33% of agreeable/polite/
   insecure variance (`Scherer_1984_VocalCuesSpeakerAffect`, Table IV). Murray: "pitch envelope (level,
   range, shape, timing) is the most important parameter for differentiating *basic* emotions."
2. **Intensity / loudness** (arousal). Strong, attention-getting; Scherer 2001 notes loudness+F0 are why
   intense joy/fear/anger confuse (shared high arousal).
3. **Voice quality / phonation type** (the carrier of *finer distinctions, valence, and "milder" states*).
   Murray: "voice quality is the most important for differentiating *secondary* emotions." Operates as an
   independent parallel channel (Scherer 1984 covariance result; survives random-splicing that destroys
   F0 contour). This is the highest-leverage *underused* axis — see §4.
4. **Speech rate / tempo & pause structure** (arousal + the load/stress split). Scherer task-load study
   (`Scherer_TaskLoadStressAcoustics`): **cognitive load → rate↑ and steeper energy attack/decay
   gradients, F0 unchanged; psychological stress → F0↑ and spectral energy shifted upward (less <500 Hz,
   more 500–1600 Hz), rate unchanged.** So rate and F0 index *different* underlying states — keep them as
   independent controls.
5. **Spectral tilt & high-frequency energy** (arousal/effort; tense vs. lax). Scherer 1986 Table 6 shows
   HF energy strongly up for rage/fear/grief; Rutledge confirms TL↓ for angry/loud, TL↑ for soft.
6. **Intonation contour *type*** (rise/fall) — carries affect **only in interaction with text/question
   type** (Scherer 1984 configuration model). High value but context-bound, not a free scalar.
7. **Formant precision & F1/F2 shifts** (articulatory tension; valence via smiling). Lower-ranked as raw
   carriers but essential for joy's smiling-raise and for anger's open vowels (F1↑).

**The valence problem (critical investment warning):** Scherer 1986's whole apparatus shows acoustic
cues index **arousal robustly but valence poorly** — most parameters separate high/low activation, few
separate pleasant/unpleasant. Voice *width* and voice *quality* are our only real valence levers.
Therefore: spend on a high-quality, continuously-controllable **voice-quality/phonation engine** (§4),
because that is where valence and the "honest/intimate/depressed" affects live, and it is the dimension
every prosody-only system gets wrong.

---

## 4. THE VOICE-QUALITY ↔ EMOTION LINK (Gobl 2003 + Burkhardt 2009)

This is the part most synths skip and the part that delivers depressed / honest / intimate / tender —
states that prosody alone cannot carry. Both papers give Klatt-domain parameter recipes.

### 4a. Gobl 2003 — voice quality alone signals affect (KLSYN88 source settings)

`Gobl_2003_VoiceQualityEmotion` synthesized 7 voice qualities by source manipulation only (F0 ~constant)
and ran perceptual ratings. Findings that drive design:

- **Voice quality differentiates activation/arousal, not valence**, and maps to *clusters* of affect
  (no one-to-one). High-activation cluster = tense/harsh; low-activation = breathy/whispery/creaky/
  lax-creaky.
- **Strong emotions (except anger) are *poorly* signaled by voice quality alone; milder states are well
  signaled** — relaxed, stressed, bored, intimate, content. This is exactly the "honest/intimate/
  depressed" territory.

Affect mapping and the source deltas (Gobl Fig. 1, approximate):

| Quality | Signals (affect) | Δ from modal (source) |
|---|---|---|
| **Tense** | stressed, **angry**, confident, formal, hostile | OQ↓ (35–40%), SQ↑ (350–400%), TL↓, B1 narrow (50–70 Hz), F0 +5 |
| **Breathy** | **relaxed, content, intimate, friendly**, mildly sad | AV↓, OQ↑ (85–95%), SQ↓, TL↑ (20–30 dB), B1 wide (200–250), add AH 35–50 dB |
| **Whispery** | **timid, afraid** | like breathy but AV lower, AH higher (45–55 dB), DI 5% |
| **Creaky** | breathy-like but weaker | F0 −30 Hz, DI 5–25% |
| **Lax-creaky** | **bored, relaxed, intimate, content, sad** | breathy source + creaky OQ, F0 −30, AH −20 dB, DI 15–25% |
| **Harsh** | = tense (not perceptually separable) | tense + DI 10–20% |
| **Modal** | neutral baseline | OQ 50–55%, SQ ~270–300%, TL 10–15, B1 120–150 |

**Design takeaways:** intimate/tender = **breathy**; depressed/bored/quiet-sad = **lax-creaky** (note:
*lax*-creaky, not classic pressed creaky — Gobl found lax-creaky is the potent one for boredom);
afraid = **whispery**; angry = **tense**. Breathy↔tense is the master continuum (OQ, SQ, TL, B1, AH all
move together).

### 4b. Burkhardt 2009 — rule-based formulas, one `rate` knob per phonation type

`Burkhardt_2009_VoiceQualityFormantSynthesis` parameterizes each phonation type by a single
`rate` (0–100%) and gives additive/subtractive formulas around per-speaker defaults (`*_glob`):

```
additive:    param = glob + (max - glob) * rate/100
subtractive: param = glob - (glob - min) * rate/100
```

| Type | Formula deltas (rate r) | Perceived emotion (forced choice) |
|---|---|---|
| **Breathy** | OQ +(max-glob)·r, TL +(max-glob)·r, B1 +(max-glob)·r, AV −6·r/100, AH +(AMP−3)·r/100; + tracheal pole/zero FNP=FNZ=550, FTP=FTZ=2100, narrow BTP/BNP | **Sadness, Boredom** |
| **Tense** | AV +6·r/100, OQ −(glob-10)·r, TL −glob·r, B1..B5 narrowed | **Anger** (secondary sadness) |
| **Creaky (lax)** | DI = r, OQ +(max-glob)·r/200, AV −6·r/100, B1 widened | **Sadness, Boredom** |
| **Falsetto** | F0 +F0·r/100, OQ↑, TL↑, FL = r (flutter) | **Frightened** (secondary "whiny" sadness) |
| **Whispery** | AV −AV·r, AH +AV·r, OQ↑, TL↑, B1..B5 all widened | (fear/timidity; excluded from test) |
| **Modal** | — | **Neutral (explicitly *not* angry)** |

Experiment used rate = 70% for modal/falsetto/tense/breathy, 30% for creaky. **This is our BE recipe:**
implement these as continuous source-parameter modulations driven by one scalar per phonation type, then
let the FE arousal/valence vector pick the type and set `rate`.

**Net VQ design rule:** valence and the intimate/honest/depressed band are won or lost in the source.
Build a real glottal-source/phonation engine (OQ, SQ, TL, AH, DI, FL, B1, plus tracheal coupling for
breathy) — these are exactly the parameters both Gobl and Burkhardt require and that Rutledge's style
factors also move.

---

## 5. FE REQUIREMENTS (emotion control layer) and BE REQUIREMENTS

### 5a. Frontend — what the emotion layer computes and hands to the track

The FE owns a single **Affect State** and lowers it to per-frame parameter deltas:

1. **Affect input**: `(valence, arousal, power) ∈ [-1,1]³` plus optional **intensity** scalar (vector
   magnitude scaler) and a categorical **emotion label** that is just a named coordinate +
   contour/phonation selector. Support **interpolation/blend** between labels (dimensional engine).
   (Justified by §2; Scherer 1986 Table 5 is literally a valence×activation×power → voice-type map.)
2. **Prosody plan** (the covariance-model scalars — Scherer 1984):
   - `f0_mean_shift` (semitones) and `f0_range_scale` from arousal (primary) + power. Seed with Rutledge
     multipliers (angry ×1.90 → ~+12 st; soft ×0.97). Clamp to speaker range.
   - `f0_variability_scale` (within-phrase wiggle) from arousal.
   - `rate_scale` / `pause_scale` from arousal **and** a separate load/stress decomposition: per
     `Scherer_TaskLoadStressAcoustics`, expose rate and F0 as *independent* knobs (load→rate, stress→F0).
     Seed durations from Rutledge Table 4 (slow vowel ×1.83 … fast ×0.72) and Murray wpm figures.
   - `intensity_scale` (AV / overall gain) from arousal + power.
3. **Contour selection** (configuration-model categorical — Scherer 1984): choose boundary-tone /
   nuclear contour as a function of arousal/valence **resolved against sentence type** (question vs.
   statement, focus). The FE must NOT emit a raw "fall = aggressive" rule; it picks a contour *relative
   to* the expected unmarked contour for that utterance. Joy = upward/undulating; sadness = long falling;
   anger = abrupt stressed-syllable rises (Murray Table I).
4. **Phonation/voice-quality selection** (the valence + milder-state carrier — Gobl, Burkhardt09):
   emit a **phonation target** = `{type ∈ modal|breathy|tense|whispery|lax-creaky|falsetto, rate ∈ 0–100}`
   plus the source deltas it implies (OQ, SQ, TL, AH, DI, FL, B1, tracheal coupling). Map: positive-low-
   arousal/intimate→breathy; negative-low-arousal/depressed→lax-creaky; high-arousal-negative→tense;
   fear→whispery/falsetto.
5. **Spectral/articulatory deltas**: `spectral_tilt_shift` (TL) and `hf_energy` from arousal/effort
   (Scherer86 Table 6, Rutledge TL factors); F1/F2 "smiling raise" for joy; F1↑ + formant precision for
   anger/power; transition-time scaling (joy/fear faster transitions, sad/grief slower).
6. **Provenance**: every emotion delta must carry the citation (Murray 1993 / Scherer 1986 Table 6 /
   Gobl 2003 / Burkhardt 2009 / Rutledge 1995) and a tag (`affect_arousal`, `affect_valence`,
   `affect_power`, `phonation`, `affect_contour`). Per project Principle 1, an uncited emotion delta is a
   bug.

### 5b. Backend — what the synth must expose for emotion to land

The phonation engine is the BE requirement that distinguishes this from a prosody-only synth:

- **Source parameters as live controls**: F0, AV, **OQ, SQ, TL**, **AH** (aspiration, glottal-phase
  modulated per Gobl §3 for natural breathiness), **DI** (diplophonia/double-pulsing for creaky/harsh),
  **FL** (flutter/jitter for falsetto/fear irregular voicing). (Gobl, Burkhardt09, Anumanchipalli param
  table #20 Kopen, #22 tilt, #24 Skew, #21 Aturb, #19 asp.)
- **Tracheal pole/zero coupling** (FTP=FTZ≈2100 Hz, FNP=FNZ≈550 Hz, narrowable BTP/BNP) for convincing
  breathy voice (Burkhardt09; flagged in `Anumanchipalli_KLATTSTAT` as needing tracheal params).
- **Independent formant bandwidths B1–B5** so tension (narrow B1) vs. breathy (wide B1) is reachable.
- **Sufficient bandwidth (≥10–16 kHz)**: Rutledge found angry fails at 8 kHz because rage needs energy
  >4 kHz. Our BE must render the HF energy that arousal demands (Scherer86 HF-energy column).
- **Per-frame ramping of source params** so phonation can change continuously with the affect vector
  (intensity morphs, not switches).

---

## 6. OPEN QUESTIONS and which paper settles each

| # | Question | Settled by |
|---|---|---|
| 1 | What are the concrete per-emotion acoustic directions across all of F0/intensity/rate/F1/tilt? | **Scherer 1986 Table 6** (`Scherer_1986_VocalAffectExpressionReview`) — most complete grid; Murray 1993 Table I corroborates qualitatively. |
| 2 | What actual Klatt-domain multipliers seed the presets? | **Rutledge 1995 Tables 3–4** (`Rutledge_1995_SynthesizingStyledSpeechKlatt`) — only published KLSYN88 scaling factors. |
| 3 | Which exact source settings produce each phonation/voice quality? | **Gobl 2003 Fig. 1** + **Burkhardt 2009** formulas. |
| 4 | Dimensional or categorical control? | **Scherer 1986 Table 5** (valence×activation×power → voice type) + Murray 1993 §I.B → dimensional engine, categorical presets as coordinates. |
| 5 | Which axis carries valence (the hard one)? | **Scherer 1984** (covariance result: voice quality = parallel channel) + **Gobl 2003** (voice width/quality) — valence lives in the source, not F0. |
| 6 | Can voice quality alone carry affect without prosody? | **Gobl 2003** — yes for milder/intimate/depressed states; weak for strong emotions except anger. |
| 7 | Why does joy under-recognize, and what fixes it? | **Scherer 2001** (joy 42%, →neutral 34%) — needs smiling-formant + contour cues beyond F0. Still partly open: "what acoustic parameters differentiate joy from neutral" is listed as an open question *in* Scherer 2001 — not fully settled. |
| 8 | Are rate and F0 the same arousal knob? | **Scherer task-load** (`Scherer_TaskLoadStressAcoustics`) — NO: load→rate, stress→F0/spectral. Keep independent. |
| 9 | Absolute F0/intensity numbers per emotion (not just ratios)? | **Partly open.** Murray gives Fairbanks medians (sad 136, anger 229, fear 254 Hz). EmoDB (`Burkhardt_2005_GermanEmotionalSpeechDatabase`) has the F0/duration statistics per emotion on the emodb website but they are not in the notes — extraction TODO if we want speaker-specific targets. |
| 10 | How do the 40 Klatt params we must expose map cleanly? | **Anumanchipalli KLATTSTAT** parameter table (ranges + defaults) — our BE parameter contract. |

### Still genuinely open (no paper in this set settles)
- The **absolute** valence axis acoustics — every source here confirms valence is weakly encoded
  acoustically; none gives a clean valence formula. We accept that **voice width + phonation type** is
  the best available valence lever and treat it as an engineering bet, not a solved mapping.
- **Tenderness/intimacy** is not a Scherer category; we synthesize it from quiet-happiness (wide,
  relaxed, slightly-full voice; Scherer86) + breathy phonation (Gobl) + narrow non-fluctuating high F0 +
  portamento (Murray "affection"). This composite is uncited as a unit — label it an engineering estimate
  per project Principle 1 until validated.
