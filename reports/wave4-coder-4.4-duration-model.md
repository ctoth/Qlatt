# Wave 4 Step 4.4: Break-Index Duration Model -- Report

## Summary

Implemented break-index-based pre-boundary lengthening, accent vowel lengthening, and duration cap rules. Discovered and fixed a critical bug in the rule engine's cursor view caching mechanism that was silently preventing ALL `op: set` rules referencing `current.duration` from working correctly.

## Changes Made

### 1. Pipeline Reorder: `annotateProsody()` Before Duration Phase

**File:** `src/tts-frontend.ts`

Moved `annotateProsody()` call and token id/stream/status assignment before the duration phase so that `breakIndex`, `isAccented`, and `isNuclearAccent` properties are available during duration rule evaluation.

### 2. Break-Index Pre-Boundary Lengthening

**File:** `public/rules/phases/duration.yaml`

Replaced the old punctuation-based `pre_boundary_lengthening` rule with a break-index-based version. The new rule:
- Scans ahead up to 6 tokens for the nearest SIL token within the same word
- Uses a sentinel-based chain (`sil_bi_1` through `sil_bi_6`) that stops scanning when a different-word token is encountered, preventing pre-boundary leakage to mid-phrase words
- Categorizes the raw break index into string levels (`'bi4'`, `'bi3'`, `'bi2'`, `'bi1'`, `'bi0'`) to avoid the `E_POLICY_LITERAL_CRITICAL` validation constraint
- Applies sonorant/obstruent differential: sonorants get 1.5x at bi=4, obstruents get 1.2x
- Citations: Wightman et al. 1992, Klatt 1976, Crystal & House 1988

### 3. Accent Vowel Lengthening

**File:** `public/rules/phases/duration.yaml`

Added `accent_vowel_lengthening` rule with dispatch:
- Nuclear accent: 1.25x
- Prenuclear stressed: 1.15x
- Other accented: 1.05x
- Citations: van Santen 1994, White 2014, Turk & Shattuck-Hufnagel 2007

### 4. Duration Cap

**File:** `public/rules/phases/duration.yaml`

Added `duration_cap` rule: `op: set` that clamps duration to `inherentDuration * 2.0` using a conditional CEL expression.
- Citation: Klatt 1976 (incompressibility principle implies bounded expansion)

### 5. Pipeline Ordering

**File:** `public/rules/pipeline.yaml`

Added `accent_vowel_lengthening` after `stress_duration`, and `duration_cap` between `speech_rate_scaling` and `fricative_minimum_duration`.

### 6. Frontend Parameters

**File:** `public/rules/frontend.yaml`

- Removed old parameters: `pre_boundary_terminal_multiplier`, `pre_boundary_terminal_obstruent_multiplier`, `pre_boundary_word_multiplier`
- Added 13 new parameters with citations:
  - Break-index thresholds: `pre_boundary_bi4_threshold` (4), `pre_boundary_bi3_threshold` (3), `pre_boundary_bi2_threshold` (2)
  - Break-index multipliers: `pre_boundary_bi4_multiplier` (1.5), `pre_boundary_bi4_obstruent_multiplier` (1.2), `pre_boundary_bi3_multiplier` (1.3), `pre_boundary_bi3_obstruent_multiplier` (1.1), `pre_boundary_bi2_multiplier` (1.15), `pre_boundary_bi1_multiplier` (1.05)
  - Accent multipliers: `accent_nuclear_multiplier` (1.25), `accent_stressed_multiplier` (1.15), `accent_unstressed_multiplier` (1.05)
  - Duration cap: `max_duration_ratio` (2.0)

## Critical Bug Fix: Cursor View Staleness

### Problem

During debugging, discovered that ALL duration rules were matching but producing no effect. The root cause was a stale cursor view bug in the rule engine.

**Mechanism:** The engine creates cursor views (shallow snapshots) of tokens for use in CEL expressions. These views are cached per-phase. When `applyEffectToToken` updates a token's scalar field (e.g., `duration`) with a preview value, the cached cursor view retains the original (stale) value.

**Impact:** Any rule using `op: set` with a CEL expression referencing `current.duration` (e.g., `duration_cap`, `fricative_minimum_duration`) would read the stale original value instead of the accumulated preview. For `duration_cap`, this meant the cap always returned the original duration (e.g., 180), effectively resetting all prior effects (stress, shortening, boundary lengthening).

### Fix

**File:** `src/declarative-frontend/engine.ts`

1. Added `syncCursorView(token, field, value)` method to the `NavigationBundle` type and implementation. This updates the cached cursor view's field when the token's field is modified.

2. Called `syncCursorView` after every `setField(preview)` in `applyEffectToToken` -- both in the scalar resolution path and the direct set/add/mul path.

3. Fixed a related cursor view staleness issue with `assocFn`: association lookups now resolve through `viewToOriginal` to read associations from the original token (which receives association modifications) rather than the stale cursor view snapshot.

### Before/After

Before fix (AE with inherent=180, stress=1):
- `stress_duration` mul 1.3 -> preview 211
- `vowel_shortening` mul 1.2 -> preview 238
- `duration_cap` SET -> reads stale `current.duration`=180, sets 180
- **Resolved: 180** (no effect from any rule)

After fix:
- `stress_duration` mul 1.3 -> preview 211, view synced
- `vowel_shortening` mul 1.2 -> preview 238, view synced
- `duration_cap` SET -> reads live `current.duration`=238, 238 < 360 cap, sets 238
- **Resolved: 238** (all effects correctly accumulated)

## Tests

**File:** `test/duration-model.test.ts` -- 9 tests, all passing:
- bi=4 pre-boundary lengthening (mat vs cat in "The cat sat on the mat.")
- bi=3 pre-comma boundary effect
- Obstruent vs sonorant differential at bi=4
- Accented stressed vowel > unaccented stressed vowel
- Nuclear accent > prenuclear accent (same stress)
- Duration cap: no segment exceeds 2.0x inherent
- Full pipeline duration cap verification
- Break-index availability during duration rules (unit test)
- Pipeline ordering verification (full pipeline)

**Updated tests:**
- `test/declarative-frontend-rulepack-context.test.ts` -- updated pre-boundary test to use breakIndex tokens
- `test/declarative-frontend-slice.test.ts` -- updated expected duration values (pre-boundary no longer applies without breakIndex)

**Updated golden data:**
- `test/golden/declarative-corpus-summary.json` -- regenerated
- `test/tts-frontend-snapshot.test.ts` -- 4 snapshots updated

## Deferred

- Phrase-initial strengthening (not implemented per task spec)
- Dynamic incompressibility floor per phoneme class (future work)

## Observed Duration Differentiation

| Sentence | AE in "cat" | AE in "sat" | AE in "mat" |
|---|---|---|---|
| "The cat." | 204ms | -- | -- |
| "The cat sat." | 160ms | 218ms | -- |
| "The cat sat on the mat." | 160ms | 160ms | 218ms |

Sentence-final vowels (bi=4 + nuclear accent) are 36% longer than mid-phrase vowels.
