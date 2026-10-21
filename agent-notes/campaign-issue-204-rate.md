# Goal
Handle #204's default-rate portion using the existing frontend rate policy, preserving explicit overrides and reference normalization.

# State
Implemented on 955a2e80. Active tests passed: `npx vitest run test/rate-unclamped.test.ts test/dectalk-speaking-rate.test.ts` and `npx vitest run test/speak-server.test.ts -t "speak-server request mapping"`. No broad local CI runs. Hosted CI and independent review pending.

# Decisions and why
Smallest change: add cited `parameters.policy.rate.default` equal to 1 to English and DECtalk (Beauty inherits English), validate the selected default as finite and positive even with an explicit override, and use it for omitted rates in the parser and execution paths. Propagate omission through render/server/offline wrappers and warmup; the UI slider remains explicit. Estimate 35–55 production lines, 12 data lines, and 60–90 focused test lines. The citation labels this an engineering default preserving the existing unit rate, not a scientific constant. No bounds, new registry, reference-normalization changes (#160), or parameter-exclusion changes.

# Surprises
The default-selection provenance record advances later decision IDs. Initial full-frame comparisons failed on those IDs; comparisons now retain every frame field except provenance IDs and separately assert the default record's reason/citations. The corrected tests pass, including all three frontends and DECtalk command precedence. Default use emits `I_RATE_DEFAULT` through existing diagnostics. Missing, nonfinite, nonpositive or uncited defaults are rejected even when a caller supplies an override. Other agents own adjacent Rd policy work; their edits are preserved.

# Next step
PR #353 is open. Hosted quality job119052381876 reported one formatting error in the focused rate test; applied its exact reflow. Replacement job119052962724 found six TS18046 fixture accesses: parsed policy has type unknown. Added a narrow fixture-only rate-policy type; no production behavior change or local CI reruns. Await replacement hosted CI and independent Claude review, then respond to findings. #204 remains open for exclusions.
