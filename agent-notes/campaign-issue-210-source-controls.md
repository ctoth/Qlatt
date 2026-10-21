# Goal
Replace the LF-only track display counter with selected experiment source-control counters, completing the next bounded #210 slice.

# State
Approved under campaign authorization, isolated base ad91bc80. Implementation and existing focused regressions complete; publishing for hosted CI and Claude review. No local tests or CI run.

# Decisions and why
Smallest change: 35–50 production lines, 15–20 YAML lines and 55–80 existing-test lines. Existing analysis data selects parameter names and cites the engineering display convention. Baseline/Beauty select sourceMode and lfMode, klsyn88 selects ss, and VTM has no declaration. Reuse each selected parameter's existing semantics default, overridden by a finite slider value, and preserve held-value duration counting. Numeric labels describe authored track controls, never which branch was audible. Remove the old hardcoded 0/1/2 buckets and zero fallback; no observations are invented before a finite initial or track value exists.

# Surprises
klsyn88 drives source selection with ss and binds LF shape to a constant realization, not an lfMode track control. The old display therefore reported an invented lfMode0. DECtalk inherits source-control selection but supplies its own sourceMode default. Switch/parallel/timing summaries remain separate unfinished #210 scope.

Actual scope is about 30 production additions, 12 YAML lines and 60 focused test additions, with the old counter renamed in place and its sole caller migrated. No parallel alias or new evaluator. Regression assertions cover baseline LF display, renamed controls, finite slider precedence, held nonfinite values, no invented zero before a valid value, weighted durations, DECtalk's inherited selection with its overridden default, klsyn88's ss and VTM's unavailable subsection.

# Next step
Read hosted CI and respond to independent Claude review after publication. Supervisor owns merge; preserve other agents' work. Full #210 remains open for switch/branch interpretation.
