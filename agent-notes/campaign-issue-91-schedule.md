# Goal
Record #91's compiled scheduling-mode choices through the existing provenance collector.

# State
Implemented optional collector threading, valid-entry mode records, and the existing VTM caller. Existing automation fixtures cover all mode precedence cases, first-frame anchors, fan-out, invalid omission, and prepare-at-zero/schedule-later separation with unchanged audio assertions. Isolated branch based on #414 final 490af154; #414 merged as f8437836.

# Decisions and why
Smallest scope: about 25–40 production lines plus one existing VTM caller and 35–55 existing automation-fixture lines. Optional collector flows through interpreter/compiler options; emit schedule_mode_selected only where a valid schedule entry is pushed. Cite the existing host-contract section 5 and software selection rule, not an invented scientific attribution. Pass the VTM renderer's already-owned collector; render-dectalk-packets already serializes it.
Records describe compiled schedule time only. prepareTrack and schedulePrepared can use different base times, so no playback timestamp or complete value-ancestry claim. No collector/schema/shift machinery; no-collector scheduling and invalid-value omission remain unchanged. #91 remains open for other causal tracing.

# Surprises
Hosted quality job 119172278073 reported TS2554: the public prepareTrack signature takes one argument, but I supplied its internal implementation's second base-time argument. Removed that argument; the public default is already zero. Test shard4 job 119172408584 found the VTM fixture assumed the collector contained only its three runtime records; it now also contains scheduling records. Filtered the existing exact runtime assertions by stage and added direct checks that interpreter choices reach this real caller. Existing sample-exact rendering cases passed; no runtime code correction was needed.
Accepted Claude's complete review through 3f7d739d. Its causal-label finding was correct: I called every first-frame step an anchor, including bindings already configured to step. The reason now uses anchor only for ramp bindings forced to step; all other cases name the existing override/default. The six-case fixture previously proved mode values but asserted the wrong generic first-frame reason; it now checks actual first/later causes. Updated the VTM collector comment to include interpreter records. Scheduling values and times are unchanged.
Volume is intentional in this bounded slice: one record per emitted binding/frame, so reports grow with the schedule. The hosted VTM fixture showed 14,127 total records rather than its previous three runtime records. No unmeasured larger-volume estimate or deduplication/cache/limit machinery is introduced.

# Next step
Await final-head hosted CI and supervisor merge after the review response. No local CI or test commands run. Approved binding-resolution follow-on uses a separate worktree.
