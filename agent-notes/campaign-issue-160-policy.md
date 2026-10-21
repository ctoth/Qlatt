# Goal
Finish #160's continuation-policy and normal undershoot tracing acceptance.

# State
Implemented on a5e5dc90. Active `npx vitest run test/rate-unclamped.test.ts` passed initially; subsequent strengthened continuation checks passed with `-t "requires referenced continuation"`. No broad local CI runs. Hosted CI and Claude review pending.

# Decisions and why
Smallest change: scale only declared continuation fields using required finite policy reads, preserve their value-wrapper metadata, remove 8/5 fallbacks, and record nonidentity scaling with field/exponent citations. Existing validation handles missing referenced fields; unused DECtalk omissions remain valid. Trace requested/effective rate, coefficient, raw product and nonnegative factor passed to rules once per run. The rule still owns its interpolation cap. About 30–40 production lines and 80–110 focused test lines. No bounds, consumer scanner or new framework. Preserve other agents' disjoint edits.

# Surprises
An initial actual-point assertion used ordinary punctuation, whose assign_phrase_edge_tones rule assigns H%; the fallback continuation rule deliberately requires no boundary tone, so those points did not change. The corrected fixture omits only that annotation rule in a cloned rulepack and verifies the actual comma continuation point increases by 8 Hz for base 8→24 at rate 4. Separate shipped-rule controls verify ordinary punctuation tracks stay unchanged for English and Beauty. Numeric override and metadata assertions cover both continuation fields, loader diagnostics reject each missing referenced path, runtime rejects declared nonfinite/nonnumeric values, and unused DECtalk fields stay absent. Undershoot tests assert actual passed factors 0/.3/2.1, one cited record, and no degradation warning; existing extreme-rate output assertions retain the rule's cap coverage. Production is 34 changed lines; tests are modestly above the initial estimate to retain both shipped and fallback-branch controls.

# Next step
PR #362 is open. Hosted quality119067909617 reported one formatting error (type literal and method-chain reflow in the focused test); applied the exact emitted formatting without behavior changes or local CI reruns. Await replacement checks and Claude review. Supervisor assesses complete #160 acceptance (including merged #360 reference normalization) before closure.
