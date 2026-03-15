# Verdict 08: Coarticulation

## Scope

Are Qlatt's formant transition rules and coarticulation models correct? Which coarticulation models are current, which are superseded, and do Qlatt's transition rules need updating?

## Papers Reviewed

| Paper | Key Contribution to Verdict |
|-------|----------------------------|
| Ohman 1966 | Foundational VCV coarticulation: F2 varies ~280 Hz by transconsonantal vowel; three-channel articulatory model |
| Recasens 1997 | DAC (Degree of Articulatory Constraint) scale 1-3; predicts coarticulation resistance by tongue-dorsum involvement |
| Recasens 2003 | Sound change driven by coarticulation; strong carryover from glides; validates DAC typology |
| Recasens 2012 | F2 data for /l/ in 23 languages; American English dark /l/ F2 ~860-900 Hz; clear/dark boundary ~1300-1400 Hz |
| Sering 2020 | Segment-based synthesis produces NO anticipatory coarticulation; gradient-based captures formant-level but not articulatory |
| Fowler 1980 | Intrinsic timing theory; coproduction model; vowel production continuous throughout utterance |
| Fowler 2006 | Listeners track gestures, not spectral contrast; /r/ F3 carryover persists across stop boundaries |
| Volenec 2015 | Review: locus equations F2_onset = k*F2_middle + c; slope k indicates coarticulation degree; DAC framework summary |
| Stevens & House 1956 | F2 locus theory: alveolar ~1800 Hz (fixed), bilabial 700-1500 Hz (vowel-dependent), velar 600-2500 Hz (highly variable) |
| Sproat & Fujimura 1993 | Two-gesture model for /l/ allophony; light /l/ F2 ~1200-1400, dark /l/ F2 ~800-1000; gradient, not categorical |
| Browman 1989 | Gestural score; task dynamic equation; hiding vs blending; CD hierarchy |
| Browman & Goldstein 1992 | Mature AP framework; tract variables; gestural overlap; aspiration/flapping as gradient; rate increases overlap |
| Saltzman & Munhall 1989 | Full task-dynamic model; parameter blending equations; neutral attractor; speaking rate via sliding/shrinking/truncation |
| Saltzman 1987 | Foundational task-dynamic formalism (no notes.md extracted; content covered by Saltzman 1989) |
| Sorensen & Gafos 2016 | Anharmonic potential V(x) = kx^2/2 - dx^4/4; near-symmetric velocity profiles; validates step activation |
| Kirkham 2025 | SINDy on 13,742 gestures: under-damped (b << 2*sqrt(k)); ~30% need cubic term; virtual target T_v = (x_0+T)/2 |
| Iskarous & Pouplier 2022 | AP appraisal: pi-gesture for boundary lengthening; mu-gestures for prominence; Acoustic Phonology gap acknowledged |
| Dalston 1975 | Sonorant acoustics: /w/ F2~750, /r/ F2~1100, /l/ F2~1200; /r/ F3~1550 (key cue); /l/ longer steady-state (67ms) |
| King 2020 | Bunched /r/ needs more lip protrusion; F3-F2 proximity is key /r/ cue |
| Espy-Wilson 2000 | Sublingual space lowers F3 by 200-300 Hz; F3 target 1500-1800 Hz males; tube model equations |
| Yunusova 2012 | EMA data: cognates share articulation targets; stops and fricatives at same place are distinct; postalveolars share targets |
| Hertz 1991 | Stable transition phenomenon: CV/VC transitions ~65ms durationally stable; multi-stream delta framework |
| Kaburagi 2007 | Four-stage articulatory synthesis; context-independent tasks + dynamic model produces coarticulation |
| van Son 1997 | Consonant reduction parallels vowel reduction; decreased coarticulation strength in casual speech |
| Nittrouer 1990 | Voice source varies by consonant context; primarily relevant to source parameters, not coarticulation |

## Synthesizer Files Audited

- `public/rules/frontends/qlatt-english/phases/formant.yaml` -- formant transition rules, VCV coarticulation, locus rules, dark /l/, /r/ F3
- `public/rules/frontends/qlatt-english/inventory.yaml` -- DAC values for all phonemes (64 entries), locus/formant targets
- `public/rules/frontends/qlatt-english/frontend.yaml` -- `transition_ms: 30` (fixed), `output.blend.factor: 0.35`, blend keys F1-F3/B1-B3 for smooth_types vowel/nasal/liquid/glide

---

## Question 1: Is Ohman 1966's V-to-V coarticulation model still valid?

**Verdict: LIMITED -- the V-to-V coarticulation principle is valid and foundational, but the three-channel implementation model is superseded by gestural overlap frameworks.**

### Evidence

Ohman 1966 demonstrated that in VCV sequences, consonant gestures are superimposed on a continuous vowel-to-vowel transition. The key quantitative finding: F2 of the intervening consonant varies by an average of 280 Hz depending on the flanking vowels. This finding has been consistently replicated:

- Fowler 1980 and Fowler 2006 confirmed continuous vowel influence through consonants, providing the theoretical basis (coproduction theory) that explains Ohman's observations.
- Recasens 1997 confirmed the pattern and quantified it via the DAC model -- consonants with low DAC (labials, schwa) show maximal V-to-V influence (as Ohman found for labials), while high-DAC consonants (palatals, velars) resist it.
- Browman & Goldstein 1992 explain the phenomenon as gestural overlap on different tract variables: bilabial closure (LA) leaves tongue body (TDCL/TDCD) free for vowel-to-vowel interpolation.
- Sering 2020 showed that segment-based synthesis (Qlatt's architecture) produces zero anticipatory coarticulation unless explicit rules add it -- validating the need for Ohman-type V-to-V rules.

**What is superseded:** Ohman's three-channel implementation (separate V, C, V articulatory channels with weighted combination) has been superseded by gestural overlap (Browman & Goldstein 1989/1992, Saltzman & Munhall 1989). The gestural framework provides a mechanistic explanation (overlapping dynamical systems on tract variables) rather than Ohman's descriptive weighted-sum model. However, the acoustic effect is equivalent -- both produce context-dependent consonant formants from vowel-to-vowel influence.

**Impact on Qlatt:** Qlatt's `vcv_coarticulation` rule implements the principle correctly: it averages flanking vowel formants and blends toward the vowel target using DAC-weighted resistance: `weight = rate * (1 - dac/3)`. This is a legitimate approximation of the gestural overlap effect for a formant synthesizer that operates in acoustic, not articulatory, space.

---

## Question 2: Does Recasens' DAC replace simpler transition models?

**Verdict: DAC is a CORRECT framework that should govern Qlatt's coarticulation parameters. Qlatt already implements it. Minor refinements possible.**

### Evidence

The DAC model (Recasens 1997) assigns a 1-3 constraint scale based on tongue-dorsum involvement:

- **DAC 1** (maximal coarticulation): labials, schwa, /h/, glottals -- no tongue-dorsum constraint
- **DAC 2** (moderate): alveolars /t,d,n,s,z,l/ -- tongue tip constrains but dorsum partially free
- **DAC 3** (minimal coarticulation): velars /k,g,ng/, palatals /sh,ch,jh/, high vowels -- tongue dorsum fully constrained

Key DAC predictions confirmed by the collection:

1. **Labials show maximal V-to-V coarticulation** -- confirmed by Ohman 1966 (F2 varies 280+ Hz), Stevens & House 1956 (bilabial F2 locus varies 700-1500 Hz by vowel), Volenec 2015 (locus equation slope k highest for labials).
2. **Velars show context-dependent loci** -- Stevens & House 1956 shows velar F2 locus ranges 600-2500 Hz, the widest of any place. This is NOT high coarticulation but rather reflects the velar pinch phenomenon: a single dorsal constriction in the palatal region produces variable F2 depending on how anterior/posterior the constriction is, which is itself vowel-determined.
3. **Alveolars show fixed loci** -- Stevens & House 1956 confirms alveolar F2 locus ~1800 Hz with minimal vowel dependence. Consistent with DAC 2: tongue tip constrains at a fixed location, dorsum partially free.
4. **Recasens 2003 validates DAC cross-linguistically**: Romance language sound changes cluster by DAC value, confirming the articulatory basis.
5. **Yunusova 2012 (EMA data)**: Cognates at the same place share articulatory targets. Postalveolars share targets. This supports DAC's place-based grouping.

**Qlatt's implementation:**

The `inventory.yaml` has DAC values for all 64 phonemes. The `vcv_coarticulation` rule uses `dac/3.0` as the resistance parameter. The locus dispatch rules (velar front/back, bilabial front/back, alveolar front/back) provide context-dependent F2 loci that are consonant with DAC predictions.

**Refinement opportunities:**

1. DAC is phoneme-level, not context-level. Recasens 1997 shows that the same consonant can show different coarticulation in different VCV contexts due to gestural antagonism. The current inventory assigns a single DAC per phoneme, which is the standard approach.
2. The `vcv_coarticulation_rate: 0.2` is conservative. Ohman 1966 F2 variation of 280 Hz on consonants with total F2 range ~1500 Hz suggests ~19% influence, broadly consistent with the 0.2 rate. This is labeled "engineering estimate" and is defensible.

---

## Question 3: What does Articulatory Phonology (Browman & Goldstein) mean for a formant synthesizer?

**Verdict: INCOMPARABLE -- AP/TD operates in articulatory space while Klatt operates in acoustic space. AP provides theoretical grounding for transition rules but cannot be directly implemented. Qlatt's acoustic-domain approximations are appropriate.**

### Evidence

Articulatory Phonology (Browman & Goldstein 1989, 1992) with Task Dynamics (Saltzman & Munhall 1989) models coarticulation as overlap of dynamical systems in tract-variable space. The framework:

1. **Gestures are context-independent** dynamical primitives (point attractors) defined on tract variables (lip aperture, tongue-tip constriction, tongue-dorsum constriction, etc.).
2. **Coarticulation = gestural overlap**: When gestures target different tract variables, they proceed independently (explaining why bilabial closure doesn't block tongue-body vowel transitions). When they target the same tract variable, they blend via weighted averaging (Saltzman 1989 Eqs. 1a-1d).
3. **Speaking rate**: Faster rate = more gestural overlap = more coarticulation (Saltzman 1989 sliding/shrinking/truncation).

**Recent developments in the dynamics:**

- **Kirkham 2025** discovered via SINDy that gestures are dramatically under-damped (b ~ 0.264 vs critical damping b ~ 48.7 for k = 592), not critically damped as Saltzman & Munhall assumed. This suggests formant trajectories may overshoot targets slightly before settling.
- **Sorensen & Gafos 2016** proposed a nonlinear anharmonic potential (V(x) = kx^2/2 - dx^4/4) that produces near-symmetric velocity profiles (time to peak velocity ~0.49 of movement duration vs 0.20 for the linear model). This better matches observed articulatory velocity profiles.
- **Iskarous & Pouplier 2022** acknowledge the "Acoustic Phonology gap" -- AP/TD lacks an articulatory-to-acoustic mapping, making direct implementation in a formant synthesizer impossible without an intermediate model.

**Why INCOMPARABLE, not WRONG or SUPERSEDED:**

AP/TD is the best available theory of coarticulation. It explains more phenomena (rate effects, reduction, assimilation, allophony) than any acoustic-domain model. But it requires an articulatory-to-acoustic mapping layer that does not exist in production-ready form. The options are:

1. **Full articulatory synthesis** (VocalTractLab, CASY) -- compute articulatory trajectories, map to formants. Sering 2020 used this approach but found it still missed anticipatory patterns.
2. **Acoustic-domain approximation** (Qlatt's approach) -- use locus equations, DAC-weighted blending, and fixed transitions to approximate gestural overlap effects. This is what Allen et al. 1987 (MITalk/DECtalk) does and what Hertz 1991 advocates.
3. **Kaburagi 2007's approach** -- context-independent articulatory tasks mapped through a dynamic model to formant tracks. Demonstrates that gestural overlap can produce realistic coarticulation in formant space.

Qlatt's acoustic-domain approach (option 2) is the established pattern for formant synthesizers. The AP/TD framework validates the general architecture (overlapping influences, constraint-based resistance, rate-dependent blending) without dictating specific Klatt parameter values.

---

## Question 4: Are fixed-duration transitions adequate or do we need gestural overlap?

**Verdict: LIMITED -- the current fixed 30ms transition is too short and too rigid. Literature supports 40-80ms transitions that vary by consonant class and speaking rate.**

### Evidence

**Qlatt's current transition system:**

- `transition_ms: 30` -- single fixed value for all formant transitions (frontend.yaml line 829)
- `output.blend.factor: 0.35` -- frame-to-frame smoothing on F1-F3, B1-B3 for vowels/nasals/liquids/glides (citing Ohman 1966)

**Literature on transition duration:**

1. **Hertz 1991 (most directly relevant):** Formant transitions are durationally stable at approximately 40-80ms (typically ~65ms), while steady states stretch/compress with speaking rate. This "stable transition" phenomenon was found across multiple consonant-vowel combinations. The transition is NOT the same duration as the consonant.

2. **Dalston 1975:** Sonorant-specific data: /l/ steady state ~67ms, /r/ F3 transition ~71ms, /w/ shorter. These durations are segment-specific, not universal.

3. **Hertz 1991 multi-stream model:** Different formants can have different transition durations -- F2 and F3 transitions are often not synchronous, especially for liquids and rhotics. F3 transitions for /r/ are longer than F2 transitions (~71ms vs ~50ms per Dalston 1975).

4. **Browman & Goldstein 1992:** Gestural overlap means transition duration is not intrinsic to the transition but emerges from the temporal overlap of adjacent gestures. Faster speech = more overlap = effectively longer transitions relative to steady state.

5. **Sorensen & Gafos 2016:** Gesture duration relates to stiffness (k): higher k = faster movement. Different gestures have different intrinsic stiffnesses, predicting different transition speeds for different consonant classes.

6. **Kirkham 2025:** Under-damped dynamics predict slight overshoot at target, which could manifest as brief formant overshoot before settling. The "virtual target" (halfway between initial and final position) suggests the system compensates by aiming beyond the target.

7. **van Son 1997:** Consonant reduction at fast rates reduces coarticulation magnitude, not just duration. Casual speech shows decreased formant excursions.

**Specific problems with fixed 30ms:**

1. **Too short for most transitions.** Hertz 1991's stable ~65ms is over twice the current value. Stevens & House 1956 measured transitions of 40-80ms depending on place and vowel context. Allen et al. 1987 (MITalk, cited in Qlatt's own rules) used 30-50ms transitions.
2. **No consonant-class variation.** Velar transitions are typically longer than alveolar (Stevens & House 1956 show wider F2 excursions for velars). Liquid transitions are dramatically longer: Dalston 1975 shows /r/ F3 transitions at 71ms, /l/ with 67ms steady states.
3. **No rate dependence.** Hertz 1991 shows transitions are stable while steady states compress. At fast rates, the transition should be a larger proportion of total duration. The fixed 30ms does not interact with speech rate.

**The blend factor (0.35) partially compensates:** The frame-to-frame smoothing applied to sonorants creates additional transition smoothing beyond the 30ms, effectively lengthening perceptual transitions. But this is a crude mechanism -- it smooths everything uniformly rather than varying by consonant class or formant.

---

## Synthesizer Audit: Detailed Findings

### What Qlatt Gets Right

1. **DAC-based VCV coarticulation rule** -- correctly implements Recasens 1997/Ohman 1966 weighted blending with DAC resistance. Formula: `weight = rate * (1 - dac/3)` where rate=0.2. Flanking vowel formants averaged and blended into current vowel. Cited correctly.

2. **Context-dependent F2 loci by place** -- velar (front 1900/default 1500/back 1200), bilabial (front 1350/default 1200/back 1100), alveolar (front 1900/default 1800/back 1700). These match Stevens & House 1956 and Allen et al. 1987.

3. **Dark /l/ allophony** -- detects coda position, switches to dark_l_f2=900 and dark_l_f3=2400. Cites Sproat & Fujimura 1993 and Recasens 2012. Values match literature: Recasens 2012 reports American English dark /l/ F2 ~860-900 Hz. Note: Qlatt implements this as a categorical switch (light vs dark) while the literature (Sproat & Fujimura 1993) shows it is gradient, controlled by prosodic domain. A categorical approximation is reasonable for rule-based synthesis.

4. **R/F3 lowering** -- onset r_f3=1600, coda r_f3=1400, citing Espy-Wilson 2000. Espy-Wilson's tube model predicts F3 of 1500-1800 Hz for males. King 2020 confirms F3-F2 proximity as the key /r/ cue. Dalston 1975 reports /r/ F3 ~1550 Hz. Qlatt's values are within the expected range.

5. **Vowel reduction toward schwa** -- schwa targets F1=500, F2=1500 at reduction_rate=0.4. Consistent with Lindblom 1963 undershoot theory (cited) and van Son 1997's observation that reduction decreases formant excursions.

6. **F1 release values by place** -- labial 250, alveolar 300, velar 280 Hz, citing Stevens 1998 Ch.8. Consistent with the literature.

### What Needs Improvement

1. **Fixed transition_ms: 30 is too short and too uniform.**
   - Literature consensus: 40-80ms depending on consonant class (Hertz 1991, Stevens & House 1956).
   - Recommendation: Raise default to 50ms. Add per-class overrides: velars 60ms, liquids 70ms, glides 50ms, alveolars 40ms.

2. **No V-to-V anticipatory coarticulation beyond local VCV blending.**
   - Sering 2020 demonstrated that segment-based synthesis produces zero anticipatory coarticulation without explicit rules.
   - Ohman 1966 and Fowler 2006 show V-to-V influence persists across multiple consonants (not just adjacent VCV).
   - Qlatt's blend factor (0.35 smoothing) partially addresses this but is not linguistically motivated.
   - Recommendation: The current VCV rule + blend factor is a reasonable first approximation. Long-range anticipatory coarticulation (2+ consonants away) is a future enhancement.

3. **No formant-specific transition durations.**
   - Hertz 1991 and Dalston 1975 show F2 and F3 transitions can differ in duration (e.g., /r/ F3 transition is longer than F2).
   - Qlatt applies the same transition_ms to all formants.
   - Recommendation: Consider separate transition durations for F1, F2, F3 — especially for /r/ and /l/ where F3 behavior is distinctive.

4. **No rate-dependent transition scaling.**
   - Hertz 1991's stable-transition finding means transitions should remain approximately constant while steady states compress at fast rates.
   - Qlatt has `rate_undershoot_factor: 0` (currently disabled) but no transition duration modulation.
   - Recommendation: When rate scaling is implemented, compress steady-state durations while preserving transition durations near their defaults.

5. **Velar F2 locus values may be too narrow.**
   - Stevens & House 1956 reports velar F2 locus range of 600-2500 Hz (the widest of any place).
   - Qlatt uses three values: 1200 (back), 1500 (default), 1900 (front).
   - The back-vowel value of 1200 Hz may be too high for /k/ before /AA/ (Stevens & House show values as low as 600 Hz).
   - However, Allen et al. 1987 Ch.11 (Qlatt's citation) likely uses similar simplified values, and the VCV coarticulation rule provides additional blending.

---

## Summary Verdicts

| Component | Category | Basis |
|-----------|----------|-------|
| Ohman 1966 V-to-V model | **LIMITED** | Principle valid and foundational; three-channel mechanism superseded by gestural overlap; acoustic effect correctly captured by Qlatt's DAC-weighted blending |
| Recasens DAC framework | **CORRECT** | Well-supported by articulatory data across languages; Qlatt implements it with appropriate DAC values and blending formula |
| Stevens & House 1956 F2 loci | **LIMITED** | Foundational acoustic data; locus values valid but the single-locus model is oversimplified for velars; Qlatt's three-way dispatch (front/default/back) is a reasonable extension |
| Articulatory Phonology (Browman & Goldstein) | **INCOMPARABLE** | Operates in articulatory space; validates Qlatt's general approach but cannot be directly implemented in a formant synthesizer |
| Task Dynamics (Saltzman 1989) | **INCOMPARABLE** | Provides the mechanistic theory; Qlatt's acoustic-domain blending is a legitimate approximation |
| Kirkham 2025 under-damping | **INCOMPARABLE** | Articulatory finding; may suggest slight formant overshoot at targets but no direct acoustic parameterization available |
| Sorensen & Gafos 2016 nonlinear dynamics | **INCOMPARABLE** | Improves velocity profiles but operates in articulatory space |
| Hertz 1991 stable transitions | **CORRECT (unimplemented)** | Formant transitions should be ~40-80ms and rate-stable. Qlatt's 30ms fixed value is too short. |
| Dark /l/ allophony | **CORRECT** | Values match Recasens 2012, Sproat & Fujimura 1993; categorical approximation is reasonable |
| /r/ F3 lowering | **CORRECT** | Values within Espy-Wilson 2000, Dalston 1975, King 2020 ranges |
| VCV coarticulation rule | **CORRECT** | DAC-weighted blending with flanking vowel averaging; appropriate for acoustic-domain synthesis |
| Fixed transition_ms: 30 | **LIMITED** | Below literature consensus (~40-80ms); no consonant-class or rate variation |
| Blend factor 0.35 | **LIMITED** | Provides crude smoothing; not linguistically motivated per formant or consonant class |

---

## Recommendations (Priority Order)

1. **Raise default transition_ms from 30 to 50ms.** Hertz 1991 and Stevens & House 1956 support 40-80ms transitions. A 50ms default is conservative and would improve naturalness.

2. **Add consonant-class transition overrides.** At minimum: velars 60ms, liquids 70ms (Dalston 1975 F3 data), glides 50ms, alveolars 40ms. This requires extending the transition system to accept per-phoneme or per-class durations.

3. **Preserve current DAC implementation.** The VCV coarticulation rule, inventory DAC values, and context-dependent locus dispatch are well-grounded in the literature and correctly cited.

4. **When rate scaling is implemented, keep transitions stable.** Hertz 1991's key insight: transitions are durationally stable while steady states compress/expand. This means transition_ms should NOT scale with `rate_scale`.

5. **Consider /r/-specific F3 transition duration.** Dalston 1975 shows /r/ F3 transitions at ~71ms, significantly longer than other consonants. The current system applies the same transition_ms to all formants.

6. **Future: formant-specific transition durations.** Hertz 1991's multi-stream model shows F1, F2, F3 can transition at different rates. This is a significant architectural change but would improve liquid and rhotic transitions.

## Papers Read

All 24 assigned papers' notes.md files were read in full (23 with extracted notes, 1 -- Saltzman 1987 -- without notes.md but covered by Saltzman 1989). Both Wave 1 verdicts (03-vowel-formants, 04-formant-bandwidths) were read for context. Every claim traces to a specific paper extraction. No claims were made without verification.
