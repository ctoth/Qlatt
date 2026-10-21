# Goal
Handle the transition-default portion of #204: omitted overrides use the selected frontend's cited lowering default.

# State
Implemented on 493acb97. Active test command `npx vitest run test/rate-unclamped.test.ts` passed. Claude review completed and supervisor verified the review gate. Review response corrects the browser harness calls and adds server omission coverage; replacement hosted checks pending. No broad local CI runs.

# Decisions and why
Smallest change: preserve omission through public TTS APIs, rendering request types, CLI/server wrappers and offline pages, then scale the selected default while retaining its citation metadata. About 25–40 production lines and 60–90 focused test lines. Explicit zero and nonfinite overrides retain existing behavior. Rate policy and feature exclusions remain outside this slice. Do not edit validation.ts (another agent owns it).

# Surprises
A parallel Rd policy change owns the adjacent lowering context and render-beauty affect call; this branch owns only transition defaults there. Existing oracle/fingerprint scripts retain their explicit measurement controls. The regression changes the selected default to 60 ms for English and inherited Beauty, verifies rate 2 produces 30 ms with the same citations, and exercises explicit 10/0 overrides and nonfinite rejection. Rendering adapter coverage checks omission and actual generated track equality. No default rate or exclusion policy changes.

# Next step
The edited server mapping tests passed with `npx vitest run test/speak-server.test.ts -t "speak-server request mapping"`. Push the review response and await replacement hosted checks and supervisor merge. #204 remains open for rate defaults and parameter exclusions.

# Review response
Accepted the missing-wrapper finding: I missed the actual Speak and warmup calls in `test/harness/runtime.js`, both of which still supplied 30 ms. Both now pass undefined so the selected frontend policy applies. Accepted the coverage request: the existing speak-server request mapping assertion now verifies that an omitted transition is absent from the RenderRequest. Claude reported no other defects; transition arithmetic and explicit override behavior are unchanged.
