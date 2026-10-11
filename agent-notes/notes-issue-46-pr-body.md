Generated parallel amplitude parameters now use each formant's declared `ampRange` and `ampDefault`. Validation rejects missing or invalid amplitude declarations before expansion, and direct PFE generation rejects missing or invalid scale/sign coefficients instead of silently substituting values. All five bundled banks retain their previous controls, explicitly labeled as engineering estimates.

Closes #202

Part of #46, which remains open for the other residual-policy items.

Validation: six new regressions failed before implementation; 65 focused tests pass after the fix. The full `npm test` gate passes all 1,820 tests across 210 files. WASM build, `npm run check`, `npm run typecheck`, and `npm run build` also pass. The repository check reports one existing warning in untouched `scripts/frication-spectrum.ts`.
