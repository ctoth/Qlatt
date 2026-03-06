# Plan: Place-Dependent Frication Carryover During Stop Aspiration (TDD First)

## 1. Objective

Implement Hanson & Stevens (2003)-motivated carryover frication during voiceless stop aspiration in the qlatt-english declarative frontend, using a test-first workflow and explicit, cited parameter defaults.

Scope is intentionally narrow:

1. `T_ASP` and `K_ASP` gain nonzero `AF` by default.
2. `P_ASP` stays at classical `AF=0`.
3. Existing release/aspiration timing logic remains unchanged.

## 2. Evidence and Current Gap

## 2.1 Paper evidence

`papers/Hanson_2003_AspiratedStopsModels/notes.md` states:

1. Alveolar `/t/` often shows frication dominance into the aspiration interval (F4/F5 region).
2. Velar `/k/` can show extended frication for some speakers (F2/F3 region).
3. Labial `/p/` follows the classical aspiration model most consistently.

The same notes explicitly mark this as directly relevant to Qlatt stop synthesis.

## 2.2 Current implementation behavior

In `public/rules/frontends/qlatt-english/inventory.yaml`:

1. `P_ASP`, `T_ASP`, and `K_ASP` are currently `AF: 0`.
2. Aspiration is currently represented as `AH`-only noise in the aspiration segment.

That means the frontend currently encodes the classical model only.

## 3. Value Hypothesis (Before Coding)

The paper gives directional evidence, not numeric AF targets, so initial values are explicitly engineering estimates constrained by existing inventory magnitudes.

Current reference magnitudes:

1. `T_REL.AF = 58`, `K_REL.AF = 55`, `P_REL.AF = 55`
2. `T_ASP.AH = 55`, `K_ASP.AH = 53`, `P_ASP.AH = 52`

Proposed initial defaults (recommended):

1. `aspiration_frication_t_af_db = 18`
2. `aspiration_frication_k_af_db = 10`
3. `aspiration_frication_p_af_db = 0`
4. `aspiration_frication_weak_scale = 0.5`

Rationale:

1. `/t/` strongest carryover frication (paper: strongest and most consistent effect).
2. `/k/` weaker and speaker-dependent effect.
3. `/p/` remains classical baseline.
4. Weak/final releases should be attenuated, not boosted.

Alternative presets for quick tuning pass if needed:

1. Conservative: `t=12`, `k=6`, `p=0`
2. Aggressive: `t=26`, `k=15`, `p=0`

## 4. TDD Plan

## 4.1 Red: add failing tests first

Primary file: `test/declarative-frontend-rulepack-context.test.ts`

Add tests that currently fail on main:

1. `applies aspiration frication carryover by place`
   1. input includes `P_ASP`, `T_ASP`, `K_ASP`
   2. expect `T_ASP.AF > K_ASP.AF > P_ASP.AF`
   3. expect `P_ASP.AF === 0`
2. `scales aspiration frication for weak aspiration tokens`
   1. `weak: true` on `T_ASP` and `K_ASP`
   2. expect `AF` reduced by configured weak scale
3. `does not alter AH in aspiration-frication rule`
   1. ensure only `AF` is changed by this new rule

Add one ordering-interaction test:

1. `s-cluster aspiration reduction and aspiration frication coexist`
   1. existing `AH` reduction remains correct
   2. new `AF` appears on `T_ASP` without breaking duration behavior

## 4.2 Green: minimal implementation to satisfy tests

1. Add new policy keys under `parameters.policy.duration` in `public/rules/frontends/qlatt-english/frontend.yaml`.
2. Add one new `duration` phase scalar rule in `public/rules/frontends/qlatt-english/phases/duration.yaml`:
   1. selects `current.type == 'stop_aspiration'`
   2. dispatches by place feature (`alveolar`, `velar`, `bilabial`)
   3. sets `params.AF` using the new policy values
   4. applies weak scaling when `current.weak == true`
3. Include `tag: aspiration_frication`.
4. Include citations:
   1. Hanson & Stevens 2003
   2. Explicit `Engineering estimate` notes for numeric defaults

## 4.3 Refactor and harden

1. Keep logic centralized in one rule (avoid duplicated place-specific rules).
2. Ensure values clamp to non-negative.
3. Keep existing stop release/unreleasing behavior unchanged.

## 5. Verification Steps

1. Targeted tests:
   1. `npx vitest test/declarative-frontend-rulepack-context.test.ts`
2. Citation guard:
   1. `npm run explain -- "top kite" --strict-citations`
3. Smoke corpus:
   1. `npx vitest test/tts-frontend-declarative-corpus.test.ts`

Optional tuning pass (if audible effect is too weak/strong):

1. Run short phrase A/Bs (`"top"`, `"take"`, `"key"`, `"speak"`, `"stop"`).
2. Compare conservative vs recommended vs aggressive presets.
3. Lock recommended values and document why.

## 6. Acceptance Criteria

1. New tests are added first and fail before implementation.
2. After implementation, all new tests pass.
3. `T_ASP` and `K_ASP` default to nonzero `AF`; `P_ASP` remains `0`.
4. Existing s-cluster and unreleased-stop tests still pass.
5. `--strict-citations` remains clean (no uncited decisions).

## 7. Risks and Mitigations

1. Risk: over-noisy aspiration degrades naturalness.
   1. Mitigation: start with conservative/balanced AF and keep weak scaling.
2. Risk: rule ordering conflict with existing duration rules.
   1. Mitigation: add explicit interaction test with s-cluster reduction.
3. Risk: paper does not provide numeric amplitudes.
   1. Mitigation: label defaults as engineering estimates and keep policy-tunable knobs.

## 8. Implementation Order

1. Write Red tests.
2. Add policy keys.
3. Add rule with citations/tags.
4. Run targeted tests.
5. Run strict-citation explain check.
6. Iterate values only if tests/listening show obvious issues.
