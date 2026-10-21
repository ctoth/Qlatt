# Goal
Map compiled apply/dispatch paths to authored template paths during the actual foreach and for_each_field expansions. Estimate: 120–170 production and 65–90 existing-test lines.

# State
Started from origin/master 5e83dda7. Implemented expansion-time typed path mappings and their composition through field expansion. Existing fixtures cover nested templates, shifted trailing entries, bundled macro ancestry, and root/include sync/async error coordinates. No local CI run; hosted validation pending.

# Decisions and why
Record mappings while output entries are appended, composing foreach followed by for_each_field. Preserve original document paths and coordinates; use a separate compiled lookup path. Keep macro ancestry tied to the same authored expression. No runtime literal join, evaluator or second compiler.

# Surprises
The former exclusion scanner omitted every indexed location in an apply array containing a template. It is removed; only actual emitted paths with one authored source are now indexed. Source coordinates and authored paths remain unchanged. Other agents are active; preserve their edits.

# Next step
Publish hosted CI and Claude review, respond to confirmed findings. Keep #224 open.
