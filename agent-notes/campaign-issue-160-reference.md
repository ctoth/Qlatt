# Goal
Handle #160's reference-rate contract only: distinguish valid omission from malformed references and trace actual normalization.

# State
Implemented on b2159350. Active test command `npx vitest run test/rate-unclamped.test.ts` passed. No broad local CI runs; hosted CI and independent Claude review pending.

# Decisions and why
Smallest change: validate requested rate before parser use; read an optional finite positive cited rate_reference once; reject malformed supplied values/citations and nonfinite or nonpositive normalization results; share normalized rate between parser initial numeric slot and execution. Record requested/reference/applied values with supplied citations only for nonidentity normalization. Preserve leading command override and its provenance. Convert DECtalk's raw neutral reference to a cited engineering declaration. Estimate 30–45 production lines plus four data lines and 70–100 focused test lines. No new bounds, continuation changes, or undershoot tracing. Other agents own disjoint TTS schema/parse/lowering-context work; preserve their edits.

# Surprises
A bare DECtalk rate command reuses the parser's initial numeric slot, so reference normalization happens before parsing. Tests confirm all three frontends produce the same complete frame values as a direct normalized-rate control (excluding sequential provenance IDs), with correct transition windows. Bare and explicit DECtalk rate commands preserve parser-slot and override behavior. Absent and identity references emit no normalization record; supplied malformed numeric/citation declarations and normalization overflow/underflow fail explicitly. No test failures occurred.

# Next step
PR #360 is open. Hosted quality119062435297 reported formatting in tts-frontend.ts and the focused rate test; applied its exact reflow, with no runtime change or local CI rerun. Await replacement hosted checks and Claude review, then respond to findings. #160 remains open for continuation policy and undershoot tracing.
