# Goal

Map frame set and multi-point insert paths to authored locations, including exact expression-versus-field selection. Estimate: 15–25 production and 50–70 existing fixture lines.

# State

Started from PR415 final 271f9385; that prerequisite merged as 75e8a66a. Implemented 12 added production lines and 51 existing fixture lines covering frame unit/when/set value versus register keys and singular/plural point value/when versus relation keys. Quality job119172303669 requested two formatting corrections in the classifier and fixture; applied exactly. Claude reviewed the full PR through 237f060d and found no defects; accepted, with no further code changes. Alias and whole-entry location observations were explicitly not findings and remain outside this slice. No local CI; hosted validation owns the final head.

# Decisions and why

Use the current foreach observer for set/insert_points, whose subsequent normalization preserves indices. Keep apply's field-expansion stage unchanged. Frame unit/when and set values, plus singular/plural point value/when, use expression coordinates. Register/relation/tag fields retain key coordinates. No blanket rule-array mapping or runtime machinery.

# Surprises

Other agents own normalization changes. Preserve their edits during integration.

# Next step

Await final-head hosted CI and supervisor merge. The prerequisite #415 is merged and the review response is complete. Keep #224 open.
