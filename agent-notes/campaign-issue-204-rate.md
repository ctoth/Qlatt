# Goal
Handle #204's default-rate portion using the existing frontend rate policy, preserving explicit overrides and reference normalization.

# State
Implemented on 955a2e80. Active tests passed: `npx vitest run test/rate-unclamped.test.ts test/dectalk-speaking-rate.test.ts` and `npx vitest run test/speak-server.test.ts -t "speak-server request mapping"`. No broad local CI runs. Claude reviewed the full PR and supervisor verified the review gate; responding to two fixture findings.

# Decisions and why
Smallest change: add cited `parameters.policy.rate.default` equal to 1 to English and DECtalk (Beauty inherits English), validate the selected default as finite and positive even with an explicit override, and use it for omitted rates in the parser and execution paths. Propagate omission through render/server/offline wrappers and warmup; the UI slider remains explicit. Estimate 35–55 production lines, 12 data lines, and 60–90 focused test lines. The citation labels this an engineering default preserving the existing unit rate, not a scientific constant. No bounds, new registry, reference-normalization changes (#160), or parameter-exclusion changes.

# Surprises
The default-selection provenance record advances later decision IDs. Initial full-frame comparisons failed on those IDs; comparisons now retain every frame field except provenance IDs and separately assert the default record's reason/citations. The corrected tests pass, including all three frontends and DECtalk command precedence. Default use emits `I_RATE_DEFAULT` through existing diagnostics. Missing, nonfinite, nonpositive or uncited defaults are rejected even when a caller supplies an override. Other agents own adjacent Rd policy work; their edits are preserved.

# Next step
PR #353 is open. Hosted quality job119052381876 reported one formatting error in the focused rate test; applied its exact reflow. Replacement job119052962724 found six TS18046 fixture accesses: parsed policy has type unknown. Added a narrow fixture-only rate-policy type; no production behavior change or local CI reruns. The edited explain CLI file passed its other 19 tests; its changed ancestry test initially expected [] instead of the API's omitted parents field, then passed with `npx vitest run test/explain-phrase-cli.test.ts -t "supports why ancestry chain output"` after that fixture correction. Push the review response and await replacement hosted CI and final review delta. #204 remains open for exclusions.

# Review response
Accepted both Claude findings. The unknown-policy fixture typing was corrected in 820df061. The explain CLI ancestry test pinned d000003, which previously selected the parentless inventory decision but now selects source-contour selection after the new rate record shifted IDs. The test now finds inventory_selected semantically, asserts it has no parents (the API omits this optional field for roots), and requires the complete --why result to equal that decision. The adjacent rewrite-to-transcription ancestry assertion remains intact. No production change was needed for either finding.
