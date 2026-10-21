# Goal

Add structured citations to four DECtalk policy nodes without changing values. Smallest change: about 14 added YAML lines plus this note; no runtime edits or new tests/gates.

# State

The actual DECtalk 4.63 sources were read: INCLUDE/l_all_ph.h:42 defines PFUSA=1, :55 describes packet composition, :61-119 defines SIL and all 58 US allophone codes; INCLUDE/cmd.h:60 defines PSFONT=8. PH/ph_task.c:711-712 supplies the minimum rate 50. PH/ph_draw.c:4072-4074 changes glottal-area speed at rates >=350.

# Decisions and why

Wrap phone_font, the complete unchanged phone_code map, ported_minimum and ported_maximum with value/citations. The value 349 is an engineering port-coverage boundary below the unported >=350 rule, not a literal from the C source. Rule-engine and validator policy projection unwrap value; the host's readPolicyNumber also supports wrappers. Articulation reads the phone map/font, while rate bounds are live host-only reads. This fixes missing citation metadata, not unused-expression warnings or all of #94. No local CI run.

# Surprises

Claude identified an inaccurate C source line range. Accepted: corrected the new citation and adjacent existing rate-bound comment to lines 4072-4074 after reading the condition and assignment. No policy values changed.

# Next step

Review correction complete; publish for final-head hosted CI. Supervisor owns merge.
