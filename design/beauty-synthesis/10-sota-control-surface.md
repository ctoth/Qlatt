# SOTA of the Expressive Control Surface for Speech Synthesis

**Purpose.** Survey how *expressive intent* is specified and controlled across the field — the "input contract" / control surface — to inform the design of Qlatt's new, fully-explainable, rule-based (non-neural) Klatt-style frontend. We cannot use opaque control (reference audio, learned embeddings), but we can and should steal the best *control abstractions*.

**TL;DR verdict (see §5).** Adopt **(b): a separate, structured performance/direction layer aligned to clean text**, with **(c): plain text + a single global affect/voice state** as its empty-direction base case. **Inline markup (a) is the wrong primary contract** for an explainable synth: it conflates content with performance, doesn't compose, fights provenance, and is hostile to a blind author. Keep an inline form only as a serialization/escape hatch, never as the source of truth.

---

## 1. Markup / Document Standards for Controllable Speech

### The lineage
The markup family converged through a clear genealogy: **STML** (SGML; Bell Labs + CSTR Edinburgh, early 1990s) → **SABLE** (Sun + AT&T + Bell Labs + Edinburgh; the acronym is the partners' initials; v0.2 in March 1998) → these plus **JSML** fed the W3C **SSML** standard. SABLE itself was frozen once it became the "main starting point" for the W3C Voice Browser requirements. ([SABLE - Wikipedia](https://en.wikipedia.org/wiki/SABLE); [CSTR SABLE](https://www.cstr.ed.ac.uk/research/projects/sable/); [Taylor & Isard, "SSML: A Speech Synthesis Markup Language", CSTR](https://static.aminer.org/pdf/PDF/001/228/068/ssml_a_speech_synthesis_markup_language.pdf))

The canonical academic statement of the design goals is **Taylor & Isard's** SSML paper (CSTR): markup should let a document author guide synthesis *without* knowing the engine internals, and should be **declarative** about intent rather than imperative about acoustics. This is exactly the philosophy we want — but the XML realization is where it goes wrong (below).

### What SSML 1.0/1.1 lets you control
([W3C SSML 1.1](https://www.w3.org/TR/speech-synthesis11/))
- **Structure / pronunciation:** `<p>`, `<s>`, `<say-as>` (interpret-as numbers/dates), `<phoneme>` (force pronunciation), `<sub>` (substitution), `<lexicon>`, `<token>`/`<w>`.
- **Prosody:** `<prosody>` with `pitch`, `contour` (timed pitch targets), `range`, `rate`, `duration`, `volume`. This is the core expressive lever.
- **Emphasis & breaks:** `<emphasis level=…>`, `<break time=… strength=…>`.
- **Voice / audio:** `<voice>` (select named voice by gender/age/variant), `<audio>` (splice recorded clips), `<mark>` (callbacks), `<lang>`.
- **Affect:** essentially **none** in core SSML. There is no first-class emotion construct; affect can only be approximated by hand-driving `<prosody>`.

### Vendor extensions (where the real affect control lives)
Because core SSML has no affect, every vendor bolted on proprietary tags — and they don't agree:
- **Amazon Alexa/Polly:** `<amazon:emotion name="excited|disappointed" intensity="low|medium|high">`, `<amazon:domain name="news|conversational">`, `<amazon:effect>` (e.g. whispered). ([Alexa SSML reference](https://developer.amazon.com/en-US/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html))
- **Microsoft Azure:** `<mstts:express-as style="cheerful|empathetic|newscast|customerservice|…" styledegree="0.01–2" role=…>` — note the **continuous intensity knob** (`styledegree`) and **role** (speak as a different age/gender persona). ([Azure SSML voice](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice); [Azure express-as](https://www.chant.net/support/documentation/voicemarkupkit/reference/azure/expressas))
- **Google:** strong *standard* SSML compliance, weaker proprietary affect — leans on neural voice quality instead. ([Typecast comparison](https://typecast.ai/learn/best-api-ssml-support/))
- **Apple (AVSpeechSynthesizer):** supports a subset of SSML plus its own `AVSpeechUtterance` rate/pitch/volume properties.
- **Loquendo VTML / Nuance VoiceText (VTML):** proprietary tag set (`<vtml_pitch>`, `<vtml_speed>`, `<vtml_sayas>`, `<vtml_break>`, `<vtml_phoneme>`) **plus "expressive cues"** — named paralinguistic events (laugh, cough, yawn, sigh) and canned interjections ("You've got to be kidding!"). This is the most interesting commercial precedent: a *named library of performance gestures* invoked by reference. ([VTML User's Guide](https://static.carahsoft.com/concrete/files/1615/2520/8261/Voice-Text_Markup_Language.pdf); [Loquendo](https://ul.gpii.net/content/loquendo-tts))

### Affect / emotion document standards
- **EmotionML 1.0 (W3C Recommendation):** a *dedicated* emotion-annotation language, explicitly designed to be **orthogonal** — referenced by, not embedded in, host languages like SSML. It supports **four parallel description vocabularies**: **categories** (e.g. Ekman's 6, or larger sets), **dimensions** (valence/pleasure, arousal/activation, potency/dominance, sometimes unpredictability), **appraisals**, and **action tendencies** — each value with an intensity/confidence. ([EmotionML 1.0](https://www.w3.org/TR/emotionml/); [W3C Emotion requirements](https://www.w3.org/2005/Incubator/emotion/XGR-requirements/)) **This is the single most relevant standard to us**: it proves that affect can be a *separate, well-typed, swappable vocabulary* layered over text, with both categorical and dimensional axes coexisting.
- **VoiceXML prompts:** dialogue-level container; embeds SSML inside `<prompt>` but adds nothing expressive of its own — confirms the pattern that affect is always a *bolt-on*, never native.

### Known problems (the indictment of inline XML markup)
1. **Content / performance conflation.** Performance directives are interleaved *inside* the words. You cannot read, diff, spell-check, or re-translate the script without stepping over markup. ([1EdTech / W3C pronunciation gap analysis](https://w3c.github.io/pronunciation/gap-analysis_and_use-case/))
2. **Verbosity & fragility.** XML is heavy; a missing close tag "breaks everything"; overuse produces choppy/cartoonish output. The authoring burden is real. ([Vapi SSML guide](https://vapi.ai/blog/mastering-ssml); [SSML-issues](https://github.com/mhakkinen/SSML-issues/blob/master/overview.md))
3. **Poor composition.** Nested `<prosody>`/`<emphasis>`/`<voice>` do not combine with defined semantics — is inner rate *absolute* or *relative* to an outer rate? Vendors differ. There is no algebra of overlapping directives.
4. **Limited affect & vocalizations.** Core SSML can't express emotion or non-speech vocalizations (laugh, cry, sigh) at all; vendor tags fill the gap incompatibly, so authored affect is **non-portable**. ([SSML practical standard, Medium](https://medium.com/@brijeshrn/ssml-the-practical-standard-for-controlling-speech-synthesis-c52940314ffa))
5. **Partial, inconsistent implementation** even in MARY TTS, Google, etc. — "a variety of non-interoperable approaches." ([SSML-issues overview](https://github.com/mhakkinen/SSML-issues/blob/master/overview.md))
6. **Accessibility hostility.** The W3C itself notes no clean way for assistive tech to keep SSML cues *separate from* the rendered text — i.e. inline markup is bad for blind authors/consumers specifically. ([W3C pronunciation gap analysis](https://w3c.github.io/pronunciation/gap-analysis_and_use-case/)) **This matters directly for Q.**

---

## 2. Neural Control Abstractions — for ideas only

We will not implement these, but their *control surfaces* are the field's state of the art. The question to mine: **what expressive axes do they expose, and at what granularity?**

| Abstraction | Surface exposed to user | Granularity | Axis we can steal |
|---|---|---|---|
| **Global Style Tokens (GST)** — Wang et al. 2018 | A small bank (~10) of learned "soft labels"; user mixes token weights, OR supplies reference audio whose style is projected onto the tokens | Utterance-global | The idea of a **small basis of named style primitives that are linearly mixed** with weights. We can make the basis *hand-authored & cited* instead of learned. ([Style Tokens, arXiv 1803.09017](https://arxiv.org/abs/1803.09017); [Google blog](https://research.google/blog/expressive-speech-synthesis-with-tacotron/)) |
| **Reference-audio style transfer** | "Make it sound like *this* clip" | Utterance-global | **Forbidden for us** (opaque, un-citable). Useful only as a counter-example of what explainability rejects. |
| **Textual style PROMPTS** — PromptTTS, InstructTTS, PromptStyle | Free-text instruction: *"sigh tone, sad mood, some helpless feeling"*; PromptTTS structures it as gender/pitch/speed/volume/emotion attributes | Utterance / phrase | The **attribute decomposition** (PromptTTS's pitch/speed/volume/emotion fields) is essentially a typed direction record — directly portable to a declarative schema. ([PromptTTS/InstructTTS, arXiv 2406.06406](https://arxiv.org/html/2406.06406v1); [InstructTTS 2301.13662](https://arxiv.org/pdf/2301.13662)) |
| **Dimensional (V/A/D) conditioning** — Schröder lineage, modern VC | Sliders: valence × arousal × dominance, often with a "degree of emotion" continuous knob | Utterance, sometimes time-varying | The **continuous dimensional control surface** — maps cleanly to acoustic rules (see §4). ([Schröder, "Acoustic correlates of emotion dimensions"](https://www.isca-archive.org/eurospeech_2001/schroder01_eurospeech.html); [dimensional VC, ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0167639317303187)) |
| **Voice cloning** | "Be this speaker" | Speaker-global | Speaker identity is *separable* from performance — argues for a **distinct voice/timbre layer** beneath the affect layer. **Cloning itself forbidden** (opaque). |
| **Fine-grained per-phoneme / frame control** — FastSpeech 2(s), hierarchical prosody TTS, MAGIC-TTS | Explicit per-phoneme or per-frame pitch / duration / energy tracks; "prosodic sketches"/contour drawing | Phoneme → frame | The **multi-resolution control hierarchy** (utterance → phrase → word → phoneme → frame) and the notion of an explicit, overridable **prosody track**. ([FastSpeech 2 / hierarchical prosody, arXiv 2110.02952](https://arxiv.org/pdf/2110.02952); [phoneme-level prosodic reps, ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S016763932200139X); [DrawSpeech 2501.04256](https://arxiv.org/abs/2501.04256)) |

**Net lesson from the neural world:** the best control surfaces are (i) **typed and decomposed** (separate pitch/rate/energy/voice-quality/emotion fields), (ii) **multi-resolution** (a global state plus optional local overrides), and (iii) **continuous where affect lives** (degree/intensity knobs, dimensional sliders). None of these *require* a neural backend — they're just good control design. We implement them as cited rules.

---

## 3. The "Performance / Direction" Paradigm

The key prior art: systems that hold a **clean script** and a **separate performance specification**, the way a screenplay holds dialogue separate from stage directions.

- **Cahn's Affect Editor (MIT, 1989–90)** — the canonical example and the closest ancestor of what we should build. Input = **text + a structured set of acoustic/affect parameter values**; output = DECtalk command stream. It exposed **~17 prosodic and voice-quality parameters** grouped into pitch (accent shape, range, reference line, contour slope), timing (speech rate, fluent pauses, hesitation), voice quality (breathiness, brilliance, laryngealization, loudness), and articulation (precision). A separate "direction" of dials drives a clean text. All six target emotions were recognized above chance. ([Cahn, *Generating Expression in Synthesized Speech*, MIT thesis](https://dspace.mit.edu/server/api/core/bitstreams/e65e5f0d-b51f-45dd-8017-fc6e2fefff9c/content); summarized in Murray_1993, Affective Speech Synthesis review [arXiv 2210.03538](https://arxiv.org/pdf/2210.03538)) **This is architecture (b), built in 1990, on a Klatt-family synth.**
- **Murray & Arnott HAMLET** (`papers/Murray_1993_SimulationEmotionSyntheticSpeech`) — a **rule layer appended as the final stage of a DECtalk TTS pipeline**: define emotion → rules → synthesizer params. Explicitly recommends "definable characteristics of emotions → rules → final stage of TTS pipeline." This is the **rule-based direction layer** done on a formant synth, with a full emotion→parameter table (their Table I) we can lift directly.
- **Rutledge et al. 1995** (`papers/Rutledge_1995_SynthesizingStyledSpeechKlatt`) — speaking **style as multiplicative scaling factors** over a normal KLSYN88 baseline (F0, AV, OQ, SQ, TL, and vowel/word/consonant durations) across 11 styles. This is the cleanest demonstration that a *style* is just a **typed vector of relative modifiers** applied to a neutral render — i.e. a direction record is a delta, not an absolute. Their Tables 3–4 are drop-in rule data.
- **Klatt's own systems** (`papers/Klatt_1982_KlattalkTTS`, `papers/Klatt_1987_TTS_Review`) — Klattalk had **no semantic emphasis or emotion capability** (Klatt explicitly lists this as a limitation), but its pipeline already separates phonological annotation (stress `'`, boundary `/`) as a *symbolic track* sitting between text and synthesizer params. The 20-parameters-per-pitch-period synthesizer is the low-level target the direction layer must compile to.
- **ToBI / prosodic-annotation tradition** (`papers/Silverman_1992_ToBILabelingProsody`, `papers/Pierrehumbert_1980_EnglishIntonation`, `papers/Taylor_2000_TiltModelIntonation`) — autosegmental prosody is itself an **orthogonal annotation track** (tones + break indices) aligned to text, independent of the words. Modern neural pipelines reproduce this as **hierarchical prosodic-boundary annotation** (5 levels: char / lexicon-word / prosodic-word / prosodic-phrase / intonational-phrase). ([Multi-modal prosody annotation, arXiv 2309.05423](https://arxiv.org/pdf/2309.05423)) The lesson: prosodic structure has *always* been modeled as a separate aligned layer, never inline in the orthography.
- **EmotionML** (§1) is the *standardized* form of an orthogonal direction layer for affect specifically — it is **designed to be referenced from** a host markup, carrying time spans that align to the text.

**Synthesis of §3:** every serious expressive system — Cahn, HAMLET, Rutledge, ToBI, EmotionML — keeps **performance separate from script** and expresses performance as **typed, aligned, relative-to-neutral modifiers**. Inline-in-text markup (SSML) is the *outlier*, and it's the one everyone complains about.

---

## 4. Affect Specification: Categorical vs Dimensional

**Categorical** ("anger", "joy", "sadness", "fear", "disgust"):
- *Pros:* intuitive to authors; maps to well-studied acoustic profiles. Our library has ready-made tables: Murray_1993 Table I (5 emotions × 7 prosodic features), Banse_1996 (29 acoustic params × 14 emotions), Scherer_1986/2001 review models.
- *Cons:* discrete, coarse, can't express blends or intensity gradients; products that expose only categories tend to produce **"stereotypical or exaggerated" affect** — the well-documented failure mode of neural emotion tags. ([SSML emotion critique](https://medium.com/@brijeshrn/ssml-the-practical-standard-for-controlling-speech-synthesis-c52940314ffa))

**Dimensional** (valence/pleasure × arousal/activation × potency/dominance):
- *Pros:* continuous → naturally supports **intensity and non-extreme, everyday affect**; **acoustically tractable** — arousal maps robustly to F0 level/range, rate, intensity, and spectral tilt; potency/dominance to voice quality and loudness; valence is the hardest (carried subtly by voice quality and contour shape). Schröder pioneered driving **prosody rules directly from emotion dimensions** and argues dimensions are the right substrate for dialogue-system affect. ([Schröder Eurospeech 2001](https://www.isca-archive.org/eurospeech_2001/schroder01_eurospeech.html); [dimensional rep for non-extreme emotion, Springer](https://link.springer.com/chapter/10.1007/978-3-540-24842-2_21); [Going Retro: rule-based prosody for emotion dimensions, arXiv 2307.02132](https://arxiv.org/pdf/2307.02132))
- *Cons:* less intuitive label-wise ("set valence to −0.6" is unnatural for an author); valence axis is acoustically weak.

**What the field favors:** modern affective-synthesis research and the W3C standard both **refuse to choose** — **EmotionML carries categories, dimensions, appraisals, and action tendencies in parallel**, letting the same affect be named *and* placed in a continuous space. ([EmotionML 1.0](https://www.w3.org/TR/emotionml/)) Murray_1993 itself concludes discrete emotions are "points within a continuous dimensional space." Products favor **categorical labels with a continuous intensity knob** (Azure `styledegree` 0.01–2; Alexa `intensity` low/med/high) — i.e. a **named-preset + scalar-degree** hybrid.

**Recommendation for affect surface:** expose **categorical presets as named points** (cheap for authors, cited acoustic profiles from Murray/Banse/Scherer/Rutledge) **that compile down to a dimensional (V/A/D) + voice-quality vector** (the explainable, rule-drivable substrate, per Schröder/Gobl). Authors pick "wry, mild"; the engine records and traces it as a V/A/D + voice-quality delta with citations. Best of both: intuitive surface, continuous tractable core, every step provenance-logged.

---

## 5. THE KEY VERDICT — Best Input Contract for an Explainable Rule-Based Formant Synth

Three candidates, head-to-head:

| Criterion | (a) Inline markup in text | (b) Separate direction layer aligned to clean text | (c) Plain text + single global affect/voice state |
|---|---|---|---|
| Content/performance separation | **Fails** — interleaved | **Clean** — script is pristine | Clean (no local control at all) |
| Composition / overlapping scopes | Undefined nesting semantics | **Well-defined**: spans + precedence rules you author | N/A (only one global scope) |
| Explainability / provenance | Hard — directive provenance buried in text spans | **Excellent** — each direction record is a first-class object with citations, tags, parents | Excellent but coarse |
| Granularity | Whatever you nest, painfully | **Multi-resolution** (global → phrase → word → phoneme), per neural SOTA | Utterance-global only |
| Authoring for a blind user (Q) | **Hostile** (W3C-confirmed: AT can't separate cues from text) | Good — text and directions are separate, navigable, diffable | Best for trivial cases |
| Editability / diff / version control | Noisy diffs; markup churn | **Clean diffs**: edit script and direction independently | Clean but limited |
| Expressive ceiling | Medium (vendor-dependent) | **High** | Low |
| Round-trip / re-translation of script | Breaks markup | **Trivial** — script is plain | Trivial |
| Prior art that chose it | SSML/SABLE/VTML (and everyone regrets it) | **Cahn Affect Editor, HAMLET, ToBI, EmotionML, Rutledge** | DECtalk "voice" presets, simple TTS APIs |

**Is inline genuinely the wrong choice? Yes — for *this* synth.** Inline markup optimizes for a single use case (a human hand-typing one-off directives into prose). It pays for that with: conflated content/performance, undefined composition, provenance buried inside text offsets, non-portable affect, and — decisively for us — **W3C-documented hostility to assistive tech and blind authors** ([gap analysis](https://w3c.github.io/pronunciation/gap-analysis_and_use-case/)). An *explainable* synth needs every directive to be a **first-class, addressable object** carrying `citations[]`, `tag`, and `parents[]` (the DecisionRecord contract in `src/provenance.ts`). Text spans are a terrible home for that. Inline markup should survive only as an **optional serialization** (a convenience input that the parser immediately lifts into direction records) and as a debug/escape hatch — never the source of truth.

**Can (c) be the empty-direction base case of (b)? Yes — and it should be.** (c) is exactly (b) with an empty direction set and a default global state. This collapses the design to **one architecture with a graceful-degradation continuum**: plain text alone → renders neutrally (the (c) base case); add a global affect/voice state → colors the whole utterance (Rutledge-style style vector); add aligned spans → local overrides (HAMLET/ToBI/fine-grained control). There is no second system to build.

### RECOMMENDATION: a single layered "score + direction" architecture

Build **(b) with (c) as its degenerate base case**. Concretely:

1. **Clean text is the score.** The author writes plain words. No markup in the prose. This is the canonical, diffable, re-translatable, AT-friendly artifact.

2. **A separate, declarative Direction Track** (YAML/structured records, the same medium as our existing rule phases) carries performance, expressed as **typed, aligned, relative-to-neutral modifiers**:
   - **Global state (the (c) base case):** one record per utterance — voice/timbre identity (separable, per the voice-cloning lesson) + a global affect state. Affect is authored as a **named categorical preset with a continuous degree** (Azure/Alexa pattern) and compiled to a **V/A/D + voice-quality vector** (Schröder/Gobl substrate). Empty ⇒ neutral render ⇒ pure (c).
   - **Local overrides (the multi-resolution lesson):** optional spans anchored to text by token/word/phrase/phoneme range — emphasis, break, local pitch/rate/voice-quality deltas, named **performance gestures** (a cited library à la Loquendo "expressive cues": sigh, laugh, creak-onset). Spans carry explicit precedence so composition is *defined*, not vendor-folklore.

3. **Everything is a modifier over a neutral baseline.** Following Rutledge (multiplicative style factors) and HAMLET (rules as the final pipeline stage), a direction is a **delta applied by cited rules**, not an absolute acoustic command. This keeps the surface engine-independent and the math explainable.

4. **Each direction is a first-class DecisionRecord.** Every global state and every span lowers into provenance with `citations[]` (Murray_1993 Table I, Banse_1996, Rutledge_1995 Tables 3–4, Gobl_2003, Scherer_1986), a `tag` (`affect`, `emphasis`, `voice_quality`, `gesture`), and `parents[]`. "Why is F1 raised and rate up here?" → "global affect = anger@0.7 → arousal 0.8 → {F0×1.9, rate×1.15, tilt−}, cite Rutledge_1995/Murray_1993; local emphasis span on 'never' → pitch-accent, cite Pierrehumbert_1980." This is impossible to do cleanly with inline XML.

5. **Affect representation:** categorical-preset surface → dimensional+VQ core (§4). Store both on the record (the EmotionML parallel-vocabulary pattern) so the author's label *and* the engine's continuous substrate are both traceable.

6. **Inline is demoted to a serializer.** Offer an optional inline shorthand for quick hand-authoring, but the parser's *first act* is to lift it into the Direction Track. The Direction Track, not the annotated string, is the source of truth and the thing provenance points at.

**Why this wins:** it is the architecture that Cahn, Murray & Arnott, and the ToBI/EmotionML traditions independently converged on; it matches the neural SOTA's typed/multi-resolution/continuous control surface *without any neural component*; it makes (c) free as a base case; it produces clean diffs and re-translatable scripts; it is friendly to a blind author; and — the decisive factor for Qlatt — it makes **every expressive decision a cited, tagged, traceable object** instead of a buried text-span side effect. Inline markup cannot offer that, which is precisely why it's the wrong contract here.

---

## Sources

**Papers (library):**
- `papers/Klatt_1982_KlattalkTTS` — TTS pipeline; explicit "no emotion/emphasis capability" limitation; symbolic stress/boundary track between text and synth params
- `papers/Klatt_1987_TTS_Review`, `papers/Allen_1987_MITalk_TTS` — TTS review / MITalk pipeline context
- `papers/Murray_1993_SimulationEmotionSyntheticSpeech` — HAMLET; rule layer as final DECtalk stage; emotion→parameter Table I; categorical-within-dimensional-space view
- `papers/Rutledge_1995_SynthesizingStyledSpeechKlatt` — 11 speaking styles as multiplicative KLSYN88 scaling factors (Tables 3–4)
- `papers/Gobl_2003_VoiceQualityEmotion`, `papers/Banse_1996_VocalEmotionAcousticProfiles`, `papers/Scherer_1986_VocalAffectExpressionReview`, `papers/Scherer_2001_VocalEmotionCrossCultural` — acoustic profiles / dimensional models for affect rules
- `papers/Silverman_1992_ToBILabelingProsody`, `papers/Pierrehumbert_1980_EnglishIntonation`, `papers/Taylor_2000_TiltModelIntonation`, `papers/Mozziconacci_1998_SpeechEmotionProsody` — orthogonal prosodic-annotation tradition

**Web:**
- [W3C SSML 1.1](https://www.w3.org/TR/speech-synthesis11/)
- [Taylor & Isard, SSML (CSTR)](https://static.aminer.org/pdf/PDF/001/228/068/ssml_a_speech_synthesis_markup_language.pdf)
- [SABLE — Wikipedia](https://en.wikipedia.org/wiki/SABLE) · [CSTR SABLE](https://www.cstr.ed.ac.uk/research/projects/sable/)
- [W3C EmotionML 1.0](https://www.w3.org/TR/emotionml/) · [W3C Emotion requirements](https://www.w3.org/2005/Incubator/emotion/XGR-requirements/)
- [Alexa SSML reference](https://developer.amazon.com/en-US/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html) · [Azure SSML voice](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice) · [Azure express-as](https://www.chant.net/support/documentation/voicemarkupkit/reference/azure/expressas) · [Typecast vendor comparison](https://typecast.ai/learn/best-api-ssml-support/)
- [VTML User's Guide](https://static.carahsoft.com/concrete/files/1615/2520/8261/Voice-Text_Markup_Language.pdf) · [Loquendo TTS](https://ul.gpii.net/content/loquendo-tts)
- [SSML-issues overview](https://github.com/mhakkinen/SSML-issues/blob/master/overview.md) · [W3C pronunciation gap analysis (AT/SSML separation)](https://w3c.github.io/pronunciation/gap-analysis_and_use-case/) · [Vapi SSML guide](https://vapi.ai/blog/mastering-ssml) · [SSML practical standard (Medium)](https://medium.com/@brijeshrn/ssml-the-practical-standard-for-controlling-speech-synthesis-c52940314ffa)
- [Style Tokens (GST), arXiv 1803.09017](https://arxiv.org/abs/1803.09017) · [Google Tacotron expressive blog](https://research.google/blog/expressive-speech-synthesis-with-tacotron/)
- [PromptTTS/Controlling Emotion w/ NL prompts, arXiv 2406.06406](https://arxiv.org/html/2406.06406v1) · [InstructTTS, arXiv 2301.13662](https://arxiv.org/pdf/2301.13662) · [PromptStyle (Interspeech 2023)](https://www.isca-archive.org/interspeech_2023/liu23t_interspeech.pdf)
- [Schröder, acoustic correlates of emotion dimensions (Eurospeech 2001)](https://www.isca-archive.org/eurospeech_2001/schroder01_eurospeech.html) · [Schröder, Emotional Speech Synthesis: A Review](http://www.cs.columbia.edu/~julia/papers/schroeder01.pdf) · [Dimensional rep for non-extreme emotion (Springer)](https://link.springer.com/chapter/10.1007/978-3-540-24842-2_21) · [Going Retro: rule-based prosody for emotion dimensions, arXiv 2307.02132](https://arxiv.org/pdf/2307.02132)
- [FastSpeech 2 / hierarchical prosody control, arXiv 2110.02952](https://arxiv.org/pdf/2110.02952) · [Phoneme-level prosodic representations (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S016763932200139X) · [DrawSpeech, arXiv 2501.04256](https://arxiv.org/abs/2501.04256) · [Multi-modal prosody annotation, arXiv 2309.05423](https://arxiv.org/pdf/2309.05423)
- [Cahn, Generating Expression in Synthesized Speech (MIT)](https://dspace.mit.edu/server/api/core/bitstreams/e65e5f0d-b51f-45dd-8017-fc6e2fefff9c/content) · [Affective Speech Synthesis overview, arXiv 2210.03538](https://arxiv.org/pdf/2210.03538) · [Burkhardt & Campbell, Emotional Speech Synthesis](https://people.ict.usc.edu/~gratch/CSCI534/Readings/ACII-Handbook-SpeechSyn.pdf)
