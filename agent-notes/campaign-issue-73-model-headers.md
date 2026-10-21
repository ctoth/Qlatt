# Goal

Document the remaining oversampled-glottal-source and aerodynamic-model module headers for #73.

# State

Supervisor approved the two-header documentation slice after reading the actual implementation and existing citations. No runtime changes, tests, or local CI runs.

# Decisions and why

Smallest change: approximately 10–12 module-documentation lines plus this note. Separate the oversampled source's klsyn88 base from the existing Klatt & Klatt 1990 extension attribution and local virtual-rate/decimation engineering. Describe the aerodynamic mapping as approximate while promoting its existing Stevens & Bickley 1991 and Stevens 1998 attribution.

Source evidence: oversampled lib.rs flutter at 494–517, diplophonia at 637–678, source bank at 735–772, decimation at 849–909; aerodynamic lib.rs existing citations at 11–14, approximation contract at 44–48, pressure/flow/source and filter controls at 139–218. These are statements about code and existing attribution, not independently verified paper fidelity. Scientific adjudication remains #254.

# Surprises

Both modules mix source-derived concepts with explicit local adaptations. Their headers must preserve that distinction. Other #73 library housekeeping remains open.

# Next step

Publish for independent Claude review and hosted CI, respond to review, and let the supervisor merge and update issue bookkeeping.
