# Abstract

## Original Text (Verbatim)

Synthesized speech need not be expressionless. By identifying the effects of emotion on speech and choosing an appropriate representation, the generation of affect is possible and can become computational. I describe a program — the Affect Editor — which implements an acoustical model of speech and generates synthesizer instructions to produce the desired affect. The authenticity of the affect is limited by synthesizer capabilities and by incomplete descriptions of the acoustical and perceptual phenomena. However, the results of an experiment show that this approach produces synthesized speech with recognizable, and, at times, natural, affect.

---

## Our Interpretation

Synthesized speech of the era was expressionless, and the literature on the speech correlates of emotion was sparse and inconsistent except on the physiologically grounded effects on F0 and timing. Cahn builds a 17-parameter acoustical model of emotional speech grouped into pitch, timing, voice quality and articulation, quantifies each parameter on a −10..+10 scale with zero as neutral affect, publishes concrete per-emotion values for six emotions, and maps them onto DECtalk3 formant-synthesizer instructions. A 28-subject forced-choice experiment recognized the intended affect in 53.5 percent of 834 presentations against a 17 percent chance baseline, rising to 78.7 percent when the dominant substitution is allowed, with sadness recognized at 91 percent. For a formant or source-filter synthesis project this is the canonical, directly reusable specification for emotion control by rule, and its catalogue of DECtalk failures reads as a requirements list for a modern back end.
