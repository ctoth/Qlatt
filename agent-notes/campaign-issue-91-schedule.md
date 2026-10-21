# Goal
Record #91's compiled scheduling-mode choices through the existing provenance collector.

# State
Implemented optional collector threading, valid-entry mode records, and the existing VTM caller. Existing automation fixtures cover all mode precedence cases, first-frame anchors, fan-out, invalid omission, and prepare-at-zero/schedule-later separation with unchanged audio assertions. Isolated branch based on #414 final 490af154; #414 merged as f8437836.

# Decisions and why
Smallest scope: about 25–40 production lines plus one existing VTM caller and 35–55 existing automation-fixture lines. Optional collector flows through interpreter/compiler options; emit schedule_mode_selected only where a valid schedule entry is pushed. Cite the existing host-contract section 5 and software selection rule, not an invented scientific attribution. Pass the VTM renderer's already-owned collector; render-dectalk-packets already serializes it.
Records describe compiled schedule time only. prepareTrack and schedulePrepared can use different base times, so no playback timestamp or complete value-ancestry claim. No collector/schema/shift machinery; no-collector scheduling and invalid-value omission remain unchanged. #91 remains open for other causal tracing.

# Surprises
Hosted quality job 119172278073 reported TS2554: the public prepareTrack signature takes one argument, but I supplied its internal implementation's second base-time argument. Removed that argument; the public default is already zero. Test shard4 job 119172408584 found the VTM fixture assumed the collector contained only its three runtime records; it now also contains scheduling records. Filtered the existing exact runtime assertions by stage and added direct checks that interpreter choices reach this real caller. Existing sample-exact rendering cases passed; no runtime code correction was needed.

# Next step
Publish for hosted CI/Claude review with accurate dependency. No local CI or test commands run.
