# Goal
Deliver the bounded #95 DOT export using the explain CLI's existing selected decisions.

# State
Implemented the DOT format, selected-node/edge output, omission count, and stage palette. Added existing CLI-file coverage for full/stage/range selections, why ancestry, and authored quote/backslash/newline escaping. Based on #404 final 79258f67; #404 is now merged as 1346b262.

# Decisions and why
Smallest change: about 40–55 production lines, 35–50 existing CLI test lines, and three documentation lines. Add a DOT renderer and format option; keep query selection unchanged. Include current-run IDs, selected parent edges, an omitted external-parent link count, and a presentation-only stage palette. No cross-run identity, layout engine, HTML, or citation resolver.
Graphviz's DOT language and escString documentation require escaped quotes and doubled literal backslashes; label newlines use backslash-n. References: https://graphviz.org/doc/info/lang.html and https://graphviz.org/docs/attr-types/escString/.

# Surprises
None. IDs are collector sequence IDs scoped to one run, not stable cross-run identifiers.

# Next step
Publish for hosted CI and independent Claude review, then respond to findings. No local CI or test commands run.
