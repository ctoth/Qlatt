# Goal
Complete #210's shared voiced/silent track classification slice using the selected experiment's existing analysis configuration. Switch/source-mode interpretation remains separate.

# State
Approved by supervisor under campaign authorization. Isolated base 403bccec; implementation and focused regressions complete, ready to publish. No local tests/CI run.

# Decisions and why
Smallest coherent change: about 150–200 production/caller lines, 15–25 YAML lines and 90–130 focused regression lines. Add cited metrics data to the three existing analysis owners, require it explicitly in both analyzers, and classify only finite positive declared voicing parameters. Preserve unrelated F0/formant aggregation algorithms. Thread actual selected semantics through runtime/harness/render paths; fixed-baseline corpus tools explicitly load their baseline policy, without a fallback registry.

VTM deliberately has no metrics policy: its AV/AVS compatibility columns are unread and raw packet tracks omit them; hlsyn derives NAV internally. Its render trackSummary is absent and one existing Diagnostics info record explains why. Display uses an unavailable message. No fabricated zero clearance, physical-voicing approximation, or Klatt gain thresholds for VTM.

# Surprises
Both current analyzers already use AV or AVS for ordinary values. Their remaining disagreement includes positive infinity: track-metrics counts it, track-analysis rejects it. Existing legacy offline HTML duplicates a summary and must use its fixed baseline owner explicitly.

The former metrics API counted positive infinity as voiced; the shared finite check intentionally no longer does. Ordinary finite baseline metrics and F0/formant aggregation remain unchanged. Legacy offline output now uses the shared summary shape. VTM reports omit the whole summary and emit I_TRACK_METRICS_UNAVAILABLE with experimentId. Existing Node/track-only A/B/A regressions assert this omission; the browser regression asserts the declared-policy summary survives the actual page boundary. Unit regressions exercise renamed voicing/silence, AV and AVS separately, nonfinite/missing values, duration weighting, declared/inherited owners and the unavailable diagnostic/display. No audio gains or source modes changed.

Actual size is about 130 production/caller additions plus 15 YAML lines and approximately 110 test additions across 29 existing files. Most files only add the explicit baseline argument. The rendering wrapper alone handles absent policy; required-policy analyzers retain numeric results. Untracked lint callers are intentionally untouched.

# Next step
Publish for hosted CI and independent Claude review, then respond to findings. Supervisor owns merge; full #210 stays open for switch/source-mode interpretation. Preserve other agents and untracked lint/measurement files.
