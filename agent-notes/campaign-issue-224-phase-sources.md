# Goal

Locate phase diagnostics through include concatenation and root inheritance. Estimate: 75–105 production and 60–85 existing fixture lines. Reuse authored spans and compiledPath; no inner filtered indices, topology, or runtime changes.

# State

Started from origin/master 3e6548e7. Implemented phase capture, nested include offsets, unique name aliases, and name-value classification in about 40 production lines. Existing sync/async composition fixtures cover nested offsets, both order path forms, list fields after non-string filtering, duplicate name value coordinates, and retained bundled phase fields. No local CI; hosted validation pending.

# Decisions and why

Capture phase entries and direct fields only. Offset child phase lookup indices where mergeChildIntoRoot appends data, preserving prior nested-include offsets and original authored coordinates. Root extends retains its existing array replacement semantics. Name-based order diagnostics get an alias only for a unique normalized phase name. Name diagnostics use authored values; list fields retain authored keys.

# Surprises

Quality job119184420112 rejected the new fixture's invocation/body formatting. Applied its multiline layout; no production changes or local CI. The unrelated existing approximate-ln2 warning is outside this change.

Other agents own normalization file moves and resource acquisition. Preserve their work. Topology has no nonempty bundled producer found and remains outside this slice.

# Next step

Await hosted CI and Claude review, respond, then supervisor merges. Keep #224 open.
