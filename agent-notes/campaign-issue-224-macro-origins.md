# Goal
Preserve macro body ancestry beside existing call-site document locations. Smallest integrated slice: about 130–180 production and 60–85 existing-test lines, using the current macro dependency builder and expansion walk.

# State
Started from origin/master 8b224809. Implemented function-body source transport and optional expansion observation using existing dependency edges. Supported rule call-site entries carry frozen, serializable parent origins; validation prints body locations after the primary call-site. Existing composition fixtures cover included/root macros in both loaders, nested semantic errors, a real bundled cross-file caller, child overrides and nested serialized ancestry. No local CI run.

# Decisions and why
Carry authored function-body locations through existing composition. Observe actual macro expansion and reuse its dependency edges; keep serializable parent origins in side metadata and validation output, never on parsed rule values or runtime DecisionRecord. The call-site remains primary. Existing unsupported expansion indices remain absent. No evaluator/compiler duplication or claim of full literal tracing.

# Surprises
None. Other agents are active; preserve their changes.

# Next step
Publish hosted CI and Claude review. Keep #224 open; macro errors thrown before validation and unsupported template indices remain outside this slice.
