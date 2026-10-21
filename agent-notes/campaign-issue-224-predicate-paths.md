# Goal

Carry predicate-definition locations through the existing diagnostic side metadata. Estimate: 35–55 production and 40–60 existing fixture lines.

# State

Started from PR403 final fdf1873d while its hosted checks finish. Implemented predicate side metadata and classification, with numeric/macro error coordinates and child/base inheritance assertions in the existing fixture. Supervisor will merge the prerequisite before this review. No local CI; hosted validation pending.

# Decisions and why

Predicate condition normalization preserves indices. Preserve original predicate paths directly, reuse expression-leaf classification, and select whole named definitions when a child shadows a base include. Keep rule candidate selection explicitly under the rules root. No new registry or runtime literal join.

# Surprises

Other agents own separate path-signature and voice-resource changes. Preserve those during integration.

# Next step

Publish for hosted CI and Claude review, then respond to confirmed findings. Keep #224 open.
