# Chunk 2 Analyst — In-Progress Notes

2026-05-24: working on `prompts/chunk-2-claude-analyst.md` against commit `f6f7258f`.

## Confirmed Findings

### BLOCKER 1: DECtalk inventory missing all new flags
- Chunk 2 added `is_obstruent`, `is_back_rounded`, `is_stop_base`, `nasal_place_index` ONLY to `public/rules/frontends/qlatt-english/inventory.yaml`.
- `git show f6f7258f --stat` confirms 5 files touched, none under `dectalk-english/`.
- `git show f6f7258f:public/rules/frontends/dectalk-english/inventory.yaml | grep -E "is_obstruent|is_back_rounded|is_stop_base|nasal_place_index"` returns ZERO hits.
- BUT `selectDectalkObstruentProfile` is called from `public/rules/frontends/dectalk-english/phases/structural.yaml` lines 36, 137, 236, 311, 377 via the `dectalk_obstruent_profile(...)` CEL helper (registered at `src/declarative-frontend/engine.ts:1099`).
- The new code (`src/declarative-frontend/dectalk-helpers.ts:210` and `:220`) reads `reference.is_obstruent === true` / `reference.is_back_rounded === true`. With no such flags on any DECtalk inventory row, BOTH branches always evaluate to false. The classifier therefore returns `back_unrounded_vowel` for what used to be `obstruent` and `back_rounded_vowel`. This is a silent behavior change in the DECtalk frontend's structural release-burst profile selection.

### Verification of materialization
- `materializeInventoryTarget` at `src/declarative-frontend/engine.ts:162-194` spreads the resolver result, so any field on the inventory row (including the new boolean flags) DOES surface on the token. So if DECtalk inventory had the flags, they would propagate. The problem is the flags weren't added there.
- `src/tts-frontend.ts:323-371` likewise spreads `materialized` into the token. Confirms field passthrough.

### qlatt-english membership audit (from coder report table)
Old `OBSTRUENT_TYPES = {fricative, affricate, stop_closure, stop_release, stop_aspiration}`.
Coder table shows is_obstruent=true on: S Z SH ZH F V TH DH HH (fricatives) + CH JH (affricates) + P_CL T_CL K_CL B_CL D_CL G_CL CH_CL JH_CL (stop_closure) + P_REL T_REL K_REL B_REL D_REL G_REL (stop_release) + P_ASP T_ASP K_ASP (stop_aspiration) + GS. Need to cross-check inventory.yaml for any phoneme of these types missing the flag.

Old `BACK_ROUNDED_REF_PHONEMES`: AO0 AO1 OW0 OW1 OY0 OY1 UH0 UH1 UW0 UW1 OR0 OR1 UR0 UR1 W. Coder table shows is_back_rounded=true for: AO0 AO1 OW0 OW1 OY1 UH0 UH1 UW0 UW1 W. MISSING from qlatt inventory: OY0, OR0, OR1, UR0, UR1 (DECtalk-only). Per probe 1, do these reach the qlatt-english consumer? The consumer (selectDectalkObstruentProfile) is DECtalk-only — qlatt-english frontend has no `dectalk_obstruent_profile` calls. So those missing entries are NOT a qlatt-english problem; they are subsumed by the DECtalk BLOCKER above.

## Still To Do
- Probe 3: confirm STRUCTURAL_STOP_BASES = P T K B D G all have is_stop_base, no extras. Coder table confirms exact 6.
- Probe 4: CEL access shape — confirm new fields surface. Done indirectly via materialization analysis.
- Probe 5: snake/camel case consistency — need to verify `nasal_place_index` (inventory) → `nasalPlaceIndex` (params). Old formant.yaml wrote `params.nasalPlaceIndex` from a per-phoneme dispatch; new rewrite reads `target(current.phoneme).nasal_place_index` (snake) and assigns to `params.nasalPlaceIndex` (camel). Confirm the assignment field is correct.
- Probe 6: nasal-subsystem rewrite — verify default/undefined paths.
- Probe 7: test coverage gap for DECtalk path.

## Writing
Will write final report to `reports/chunk-2-analyst.md`. Verdict: ANALYST-BLOCKER on DECtalk inventory gap.
