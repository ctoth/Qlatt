# Goal

Clarify the existing resonator's role for the module-documentation item in #73.

# State

Scoped implementation authorized by the supervisor after source verification. Base: 65cbca92.

# Decisions and why

Smallest change: add three module-documentation lines identifying audio formant history compensation and distinguishing it from F0 phrase/accent generation. Preserve the existing klsyn88 citation and all names and ABI. No runtime changes or tests are needed for this comment-only slice.

Evidence: `crates/fujisaki-resonator/src/lib.rs` scales filter history on descending frequency and processes samples through a two-pole recurrence. `public/experiments/klsyn88/graph.yaml` uses it for cascadeF3 and cascadeF2.

# Surprises

The module already has a klsyn88 reference; the missing detail is the explicit distinction from intonation generation. This slice satisfies only that checklist item, not all of #73.

# Next step

Publish the scoped PR for hosted CI and independent Claude review; respond to findings. Supervisor owns merge and issue bookkeeping.
