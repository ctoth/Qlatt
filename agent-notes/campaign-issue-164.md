# Issue 164 first slice: edge transition windows

## Goal
Report positive requested linear-transition windows shortened or dropped by the minimum edge policy, preserving frames. Keep #164 open for remaining categories.

## State
Implemented all six addLinearTransition callers in isolated campaign/issue-164. Warnings include existing producer IDs and edge-policy citations. Active fallback-policy and locus-transition test files passed: 16 tests. No other local CI steps run.

## Decisions and why
Smallest change: 50-65 production lines in the helper/callers plus focused existing fallback-policy fixtures. Build a candidate before reporting to exclude empty fields; return actual append success. Leading locus currently mutates applied inside its builder and subsequently gates closure/glue transitions: remove that mutation and use helper return, so dropped windows still cannot enable those transitions. Record item/kind/edge/requested/applied windows, edge policy citations and existing feature producer IDs in structured diagnostics. No new framework or sampled-point reporting. Leave upstream sonorant/locus pre-caps, carry-over, controls, contours, and time projection for remaining #164 work.

## Surprises
Calling the old leading-locus builder earlier without changing its applied flag would alter acoustic output. Claude should explicitly check that path.

## Next step
PR #328 is open. Claude reviewed the full implementation; the supervisor verified the review gate and formatting delta. Implementer response: accepted the minor helper documentation finding, clarifying that a pure builder receives the requested window for dropped candidates, otherwise the applied window, and that the helper returns actual append success. No behavior or tests changed in this response. The initial quality job's single fields-array line wrap is also corrected. No local CI rerun. Await final-head PR CI and supervisor merge; keep #164 open for the remaining categories above. The 200ms-edge regression asserts unchanged F3 on all four neighboring items, with the existing 20ms policy control retained.
