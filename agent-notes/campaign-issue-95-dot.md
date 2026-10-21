# Goal
Deliver the bounded #95 DOT export using the explain CLI's existing selected decisions.

# State
Implemented the DOT format, selected-node/edge output, omission count, and stage palette. Added existing CLI-file coverage for full/stage/range selections, why ancestry, and authored quote/backslash/newline escaping. Based on #404 final 79258f67; #404 is now merged as 1346b262.
Accepted Claude's complete five-file review through 7bc71523: no actionable defects. JSON-only tooling and text-only verbose behavior remain as documented. No Graphviz executable was used, so validation establishes exported DOT text rather than rendered Graphviz output.

# Decisions and why
Smallest change: about 40–55 production lines, 35–50 existing CLI test lines, and three documentation lines. Add a DOT renderer and format option; keep query selection unchanged. Include current-run IDs, selected parent edges, an omitted external-parent link count, and a presentation-only stage palette. No cross-run identity, layout engine, HTML, or citation resolver.
Graphviz's DOT language and escString documentation require escaped quotes and doubled literal backslashes; label newlines use backslash-n. References: https://graphviz.org/doc/info/lang.html and https://graphviz.org/docs/attr-types/escString/.

# Surprises
Hosted quality job 119157046517 rejected formatter layout in the quote helper and parameterized test; applied its exact reflows and explicit two-space regex quantifiers suggested by lint. Six other hosted checks passed the initial head. IDs are collector sequence IDs scoped to one run, not stable cross-run identifiers.

# Next step
Await final-head hosted CI and supervisor merge. No local CI or test commands run. The independently scoped HTML follow-on will use a separate worktree.
