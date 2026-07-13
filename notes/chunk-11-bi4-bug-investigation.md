# Chunk 11 — pre_boundary_lengthening BI4 bug investigation

Date: 2026-05-25

## Symptom
`npx vitest run test/duration-model.test.ts`:
- "bi=4: vowel before period is at least 40% longer than same vowel mid-phrase" FAILS.
- ratio mat-AE / cat-AE = 1.051 (expected > 1.25). mat=184ms cat=175ms.
- "nuclear accent vowel longer than prenuclear" FAILS similarly (1.014 vs 1.05). Same root cause likely.

Unit tests for `current.next_boundary` (including punctuation-symbol case with `word: '.'` SIL) PASS.

## Recent changes
- duration.yaml `pre_boundary_lengthening`:
  - constraint now `in_final_syllable` (was `!same_word_vowel_after_nonvowel`).
  - `in_final_syllable` defined as:
    `has(current.syllable) && current.syllable != null ? current.syllable.is_final : following_nucleus_after_coda == null`
  - `boundary_bi` now uses `current.next_boundary.breakIndex` or punctuation-symbol fallback.
- engine.ts: adds `next_boundary` getter, `is_final` getter on syllable views, `find_within_word`, punctuation-derived `breakIndex` shim on boundary tokens.

## Suspicion
The full pipeline (`textToKlattTrack`) likely produces phones with `parent` pointing to a syllable token, so `has(current.syllable)` is TRUE on the AE-in-mat view. That means `in_final_syllable` evaluates the `current.syllable.is_final` branch — NOT the `following_nucleus_after_coda` fallback.

`isFinalSyllable(syllable)` in engine.ts:750-763:
- For each active phone token with the same word, finds its syllable ancestor.
- If ancestor index > current syllable index, returns false.
- BUT: it does NOT skip the syllable that is `syllable` itself when computing — though `ancestor === syllable` guard exists so that's fine.

Possible issues:
1. `getSyllableWord(syllable)` calls `getActiveStreamTokens("phone")` — but in full pipeline structural expansion may produce phones whose `word` field has been stripped or set to something else (e.g. punctuation SIL has word='.').
2. The constraint short-circuit: if `has(current.syllable)` is true but `current.syllable.is_final` is false for the AE-in-mat (because of, e.g., the punctuation-period SIL phone with no word being treated as belonging to a later syllable), the constraint blocks the rule.
3. The structural expansion of the 'T' in 'mat' into T_CL, T_REL, T_ASP — these phones may sit in their own syllable parent that comes after AE's syllable, making AE's syllable NOT final.

Most likely (3): in the qlatt-english pipeline, syllabification may put coda obstruents into separate syllable spans (or the structural-expansion phase creates phones without re-parenting them to the AE syllable, leaving them under a later syllable).

## Update after more inspection

- qlatt-english pipeline (public/rules/frontends/qlatt-english/pipeline.yaml) has NO `syllable` stream — only `orthography`, `phone`, `f0`. No topology hierarchy. So `has(current.syllable)` should be false; constraint falls through to `following_nucleus_after_coda == null`.
- Walked through the predicate for AE in 'mat' (M, AE, T_CL, T_REL, T_ASP, SIL[.]). Should return null (SIL short-circuits, no other vowel within word). → `in_final_syllable` = true.
- `getNextBoundaryToken` from AE: T_CL/REL/ASP all word='mat', not boundary; SIL is boundary; returns the SIL.
- SIL has punctuationSymbol='.' (per structural.yaml copy_fields + punctuation_pause rule using it). `toCursorView` shim sets view.breakIndex = 4.
- So `boundary_bi` should be 4, `bi_level` = 'bi4', mat AE should get ×1.5.

But observed ratio mat/cat = 1.051; mat=184ms, cat=175ms. Mat got only ~5% extra. So either:
  (a) rule does fire but a later rule clamps mat AE down (e.g., max:500 cap is 500 not 184 — not it), or
  (b) rule does NOT fire because dispatch falls to `default: 1`.

Key hypothesis to test next: `current.next_boundary.punctuationSymbol` access on the cursor view. The view is built by `toCursorView(getNextBoundaryToken(token))`. `punctuationSymbol` IS copied onto `view` by `const view: TokenLike = { ...token }`. So `has(current.next_boundary.punctuationSymbol)` returns true. OK.

Wait — `current.next_boundary.breakIndex > 0` first branch. The view has breakIndex=4 (shim'd in). So boundary_bi = 4. Should work.

BUT: the `toCursorView` shim runs ONLY if `view.breakIndex` is not a positive finite number BEFORE the shim. Since we pass the ORIGINAL token to `getNextBoundaryToken` which returns the SIL token, then toCursorView spreads `{...token}`. The original SIL token has NO breakIndex (it's set by structural copy_fields which does NOT include breakIndex). So view.breakIndex starts undefined → shim sets to 4. ✓

So the chain looks correct. Maybe my reading of the cat AE duration is wrong, OR the test was already passing 1.05 before and the chunk-11 refactor made it slightly worse, OR the rule fires but multiplier is being applied to a base that's already capped/clamped.

Actually a stronger hypothesis: **cat AE is also getting boundary lengthening**. The rule may be incorrectly firing on the cat AE because its `current.next_boundary` finds the period SIL (skipping intermediate same-word phones and… wait, hits 'sat' which has different word, returns null). No — `getNextBoundaryToken` stops on `hasDifferentWord`. The T of cat is word='cat'… then 'sat' phones have word='sat' → different → return null. So cat AE next_boundary = null. boundary_bi = 0. raw_bi = 0. bi_level = 'bi0'. → default multiplier 1. cat AE not lengthened. ✓

NEED TO ACTUALLY RUN A DEBUG. Will write a minimal script that re-runs the rule engine on a synthesized 'cat sat ... mat .' token sequence and inspects the produced durations + decision tags.

## Current blocker
Pure reading suggests the rule should fire correctly; observed behavior says it doesn't. Need runtime evidence — write inspect script in scripts/, run, look at provenance/tags on mat AE.

## NEW EVIDENCE from scripts/debug-bi4.ts run on full pipeline

Ran `npx tsx scripts/debug-bi4.ts` printing controlScore tokens for "The cat sat on the mat.". Observed:

```
{ phoneme: 'AE', word: 'mat', breakIndex: undefined, punctuationSymbol: undefined, duration: { lexical_target_ms: 170, realized_target_ms: 240 } }
{ phoneme: 'T_CL', word: 'mat', breakIndex: undefined, ... realized: 43 }
{ phoneme: 'T_REL', word: 'mat', ... realized: 15 }
{ phoneme: 'T_ASP', word: 'mat', ... realized: 15 }
{ phoneme: 'SIL', word: '.', breakIndex: undefined, punctuationSymbol: undefined, duration: { lexical_target_ms: 100, realized_target_ms: 300 } }
```

Two critical facts:
1. **SIL after 'mat' has `word: '.'` AND `punctuationSymbol: undefined`** in the final controlScore. Whether punctuationSymbol survived to the duration phase is unclear — the structural rules' copy_fields include punctuationSymbol, but the source SIL token from buildPhoneSequence may not even have it set. Need to verify what punctuationSymbol is during duration phase. Either way, the engine's `punctuationBreakIndex(token)` falls back to `token?.word` = '.' → returns 4. So the boundary detection logic should still work.
2. **AE realized_target_ms = 240ms**, which is much more than the test's 184ms reading.

The test sees 184ms via segment extraction from the KlattFrame `track` (which has time-quantized frames). The control score says 240ms. 240ms / cat ratio would actually pass the test. So the bug may be in track assembly squashing the AE duration, OR in the test's segment-extraction reading the wrong frame.

But wait — `extractSegments` looks at phoneme transitions in the track. If the AE→T_CL transition timing in the track is misaligned, the segment 'AE' duration would be wrong. But that's an extraction issue, not a duration rule issue.

Actually the simpler explanation: when the script ran `controlScore.tokens`, those are AFTER all phases. realized_target_ms = 240 already includes the bi4 lengthening. So the rule IS firing correctly. The discrepancy must be downstream in track assembly OR in how the test extracts segment duration.

## NEXT STEP (not done — was interrupted by checkpoint)

Need to check: does the test failure number reflect a real duration bug, OR a segment-extraction artifact in the test harness? If realized_target_ms = 240, then the underlying duration phase is correct and the test is reading a wrong number from the assembled track.

Compare `segments[].duration` for AE in mat — likely the segment extraction is treating a frame boundary differently. Run the test with a `console.log(segments)` injection.

