## Problem

The current fallback chooses primary stress largely by syllable count. Moving that heuristic into YAML would make it configurable without making it a defensible English stress model.
This issue should deliver cited lexical stress assignment, including secondary stress, morphological conditioning, and an explicit contract through inventory lookup and HRG construction.

Current evidence (source snapshot `0b0105a477d0cc5c4ccc7411a599452d6b712911`):

- `src/g2p/stress.ts` selects a single stressed syllable and emits only `1`/`0`; its default ignores syllable weight and morphological cycles.
- `src/g2p/index.ts` returns successful morphology results before calling `assignStress` on the LTS fallback. `src/g2p/morphology.ts` concatenates root and affix phones; a fallback-only policy cannot own all derived-word stress.
- `src/g2p/syllabify.ts` uses default English phonotactics internally. A frontend-selected stress policy also needs frontend-selected syllabification and vowel classification.
- `src/declarative-frontend/inventory.ts` selects marker `1` only for stress `1`, otherwise marker `0`. This is a target-selection collapse, not proof that every numeric secondary-stress field is lost.
- `src/tts-frontend.ts` initializes Syllable stress to null and copies only primary stress. Segment, Syllable, serialized phones, and acoustic target selection need separate, consistent contracts.

## Research basis and model choice

Use **Hayes's 1982 English lexical analysis as the model for the new English policy**. Use Liberman and Prince for the metrical foundations and comparison, and Hunnicutt/MITalk as the operational TTS baseline.
This is a proposed implementation direction established by this grooming, not a claim that the existing code already implements those papers or that either theoretical model guarantees OOV accuracy.

- [Hayes (1982), *Extrametricality and English Stress*](https://brucehayes.org/papers/Hayes1982ExtrametricalityAndEnglishStress.pdf), pp.236-251: weight-sensitive foot construction, morphological cycles and retraction; pp.252-269: destressing; pp.270-274: peripherality and word-level prominence.
- [Liberman and Prince (1977), *On Stress and Linguistic Rhythm*](https://languagelog.ldc.upenn.edu/myl/LibermanPrince1977.pdf), pp.264-309: lexical stress and morphology; pp.298-304: cyclic inheritance; pp.309-330: the distinct phrase-level grid and rhythm problem.
- [Hunnicutt (1976), *Phonological Rules for a Text-to-Speech System*](https://aclanthology.org/J76-4008.pdf): operational cyclic stress, syllable-weight conditions and suffix classes. Existing collection notes for *From Text to Speech: The MITalk System* document the related TTS integration.

The model distinction matters: Liberman-Prince retain binary stress marks and erase metrical trees at each cycle (rule 88, p.301); Hayes preserves earlier feet except where specified rules redraw them.
Do not mix LP deforestation, Hayes foot preservation and an alternating-secondary heuristic into one allegedly paper-derived algorithm.
Likewise, phonological vowel length/weight is not synthesized duration, and metrical prominence is not an F0 or amplitude value.

Full reader notes, derivations, limitations and bibliographies are prepared locally under `papers/Hayes_1982_ExtrametricalityEnglishStress/` and `papers/Liberman_1977_StressLinguisticRhythm/`.

## Implementation contract

1. **One lexical-stress owner.** Resolve whole-word dictionary pronunciations first and preserve their lexical stress. For generated pronunciations, feed both morphology-derived and bare-LTS paths through the same stress stage before stress-sensitive inventory materialization.
   Preserve explicit user pronunciations and established clitic behavior. A dictionary root supplies inherited stress evidence; it must not make an outer stress-affecting derivation bypass the policy.
2. **Declare the required input.** Ordered syllables with nucleus/rhyme/coda information, phonological vowel class/weight, morphological domains and affix classes, lexical category when known, inherited stress, and lexical exceptions.
   Preserve derivational boundaries instead of reducing morphology to the final suffix hint. Reuse the existing morphology authority; do not maintain a second competing affix list.
   Where LTS or dictionary data cannot establish an underlying distinction or category, use a named, deterministic policy assumption with diagnostics and provenance. Do not present inferred inputs as facts supplied by Hayes.
3. **A frontend-resolved declarative policy.** Resolve `stress-policy.yaml` through frontend resources/inheritance, using the existing loading, validation, expression and provenance infrastructure where applicable.
   Declare rule identity, conditions, ordering, affected domain, citations and motivation tags. Express foot construction, extrametricality/peripherality, retraction, destressing, exceptions and final prominence; syllable-count rows alone are insufficient.
   Keep the execution machinery linguistic-policy-neutral. Any required metrical primitive must have a documented input/output contract and invariant; avoid introducing an unrelated general-purpose rewrite language.
4. **Preserve the chosen model's operations.** Cite Hayes's consonant/noun/adjective extrametricality, Long Vowel Stress, English Stress Rule and Strong Retraction, including their ordering (pp.238-244).
   Preserve cyclic feet where required, permit only the specified redraws, and implement the relevant destressing and late-extrametricality interactions. Extrametricality belongs to a constituent and expires when it ceases to be peripheral.
   Record any operational approximation or excluded lexical class explicitly with its fallback. Such a deviation needs its own justification; a general Hayes citation does not validate it.
5. **Typed output and explicit realization mapping.** Represent primary, secondary and unstressed lexical values independently of ARPAbet suffix strings; keep missing/unknown distinct from unstressed where the input contract permits it.
   Serialize these as `1`, `2`, `0` at the ARPAbet boundary and preserve them on Segment and Syllable items. Define a separate cited inventory-target mapping, including behavior when no `*2` target exists; never silently equate secondary with unstressed.
   Existing duration/prosody consumers must receive the intended lexical value. This issue does not infer acoustic strengths or vowel reduction from the numeric marker alone.
6. **Explain every outcome.** Trace input pronunciation/morphology evidence, selected policy, syllabification/weight assumptions, rule applications, inherited and reassigned stress, exceptions, fallbacks and output projection.
   Link decisions to stable word/syllable/segment identities and parent decisions. Include exact paper pages/rules and tags; label engineering assumptions as such. Missing or malformed resolved policy is a load diagnostic, never hidden English defaults.

## Acceptance criteria

- [ ] A validated English policy implements the stated model and orders its operations explicitly; the old hardcoded count-based fallback is no longer the English stress authority.
- [ ] Morphology-derived and LTS pronunciations share the stress stage; dictionary whole-word, explicit-pronunciation and clitic controls demonstrate the intended precedence.
- [ ] Policy tests exercise frontend resource inheritance, missing/malformed policy, incompatible phonotactics, invalid features/references and deterministic fallback for unavailable linguistic inputs.
- [ ] Source-backed fixtures cover weight-sensitive placement, noun/verb differences, stress-neutral versus stress-affecting affixes, cyclic secondary stress, extrametricality losing peripherality, and destressing interactions.
- [ ] Include Hayes's derivational contrasts: parental/homonymous and verbal/adjectival -ate (pp.244-246), fraternization/compurgation and compensation/condensation (pp.248-251), and cursory/creative (pp.258-259).
- [ ] Each fixture records the assumed phonological input, morphology/category, dialect or accepted variants, expected stress and supporting passage. Assert intermediate feet/domains where final labels alone would hide a wrong derivation.
- [ ] Secondary stress survives serialization, inventory selection, Segment/Syllable materialization and relevant consumers. Test a missing `*2` inventory target separately from preservation of the lexical value.
- [ ] Provenance explains an inherited secondary, a reassignment, an exception and an input fallback with correct ancestry and citations; strict citation checks cover the changed paths.
- [ ] Evaluate stress on supplied reference phones separately from end-to-end OOV G2P. Bypass whole-word dictionary lookup in the latter so dictionary hits cannot masquerade as stress-rule success.
- [ ] Report primary placement and complete stress-pattern results against the current baseline, including failures by rule family and accepted variants. Keep fixture/tuning examples distinct from evaluation words; do not invent an accuracy guarantee from theoretical examples.
- [ ] Review transcription golden changes individually against cited behavior. Preserve unaffected controls; replace the old blanket requirement that all goldens remain unchanged.

## Scope and sizing

Includes the policy, required morphology/syllabification data flow, stress representation, inventory/HRG handoff, diagnostics, provenance and focused regression/evaluation support in Qlatt.
Excludes phrase-level Iambic Reversal/metrical-grid implementation, general intonation or F0 redesign, new language support, and a replacement morphology or G2P system.
Sizing: **L**. This is an algorithm, data-contract and integration change, not an M-sized YAML extraction. Paper-derived behavior and documented input limitations must be visible in review.
