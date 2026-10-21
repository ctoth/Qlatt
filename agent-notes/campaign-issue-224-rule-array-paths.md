# Goal

Map frame set and multi-point insert paths to authored locations, including exact expression-versus-field selection. Estimate: 15–25 production and 50–70 existing fixture lines.

# State

Started from PR415 final 271f9385 while supervisor sequences its merge. Implemented 12 added production lines and 51 existing fixture lines covering frame unit/when/set value versus register keys and singular/plural point value/when versus relation keys. No local CI; hosted validation pending.

# Decisions and why

Use the current foreach observer for set/insert_points, whose subsequent normalization preserves indices. Keep apply's field-expansion stage unchanged. Frame unit/when and set values, plus singular/plural point value/when, use expression coordinates. Register/relation/tag fields retain key coordinates. No blanket rule-array mapping or runtime machinery.

# Surprises

Other agents own normalization changes. Preserve their edits during integration.

# Next step

Publish stacked on #415 for hosted CI; supervisor reviews after prerequisite merge. Respond to Claude review. Keep #224 open.
