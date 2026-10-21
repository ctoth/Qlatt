# Goal
Map compiled apply/dispatch paths to authored template paths during the actual foreach and for_each_field expansions. Estimate: 120–170 production and 65–90 existing-test lines.

# State
Started from origin/master 5e83dda7. Implemented expansion-time typed path mappings and their composition through field expansion. Existing fixtures cover nested templates, shifted trailing entries, bundled macro ancestry, and root/include sync/async error coordinates. PR400 initial six non-quality checks passed; quality job119140398323 reported four formatting hunks across three files. Applied those exact wrapping corrections. No local CI run; replacement hosted validation pending.

# Decisions and why
Record mappings while output entries are appended, composing foreach followed by for_each_field. Preserve original document paths and coordinates; use a separate compiled lookup path. Keep macro ancestry tied to the same authored expression. No runtime literal join, evaluator or second compiler.

Claude reviewed all six PR files at 2b038498 and reported no defects; accepted. The accessor wording observation is accurate: unchanged apply entries also receive compiledPath. Leave the brief comment unchanged because it describes the template use without claiming exclusivity. Defer the unmeasured observer-free path allocation observation; there is no demonstrated performance defect and no additional machinery is requested. The subsequent 8727223b code delta is formatting only.

# Surprises
The former exclusion scanner omitted every indexed location in an apply array containing a template. It is removed; only actual emitted paths with one authored source are now indexed. Source coordinates and authored paths remain unchanged. Other agents are active; preserve their edits.

# Next step
Await final hosted CI and supervisor merge. Keep #224 open; the next condition-array slice awaits source verification and approval.
