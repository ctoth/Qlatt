# Goal
Deliver #95's self-contained HTML decision DAG using the explain CLI's existing selected decisions.

# State
Implemented the HTML renderer, shared unchanged stage palette, invocation docs, and existing CLI-file coverage for selected/empty graphs, edges, ancestry details, and authored HTML escaping. Isolated branch based on #409 final 708bac1c; #409 merged as 309c3200.
Accepted Claude's full five-file review through 131bc0a1: no defects. Browser rendering remains unverified; the review's possible same-column overlap was explicitly unverified and does not justify expanding this bounded layout.

# Decisions and why
Smallest scope: about 90–120 production lines, 40–60 existing CLI test lines, and docs. Use fixed stage columns and sequence rows, inline SVG parent connectors with direction, stage colors, escaped labels, and accessible textual details with reasons/citations in the same file. Keep current-run IDs, selected-only edges and omitted-parent count. No scripts, CDN, dependencies, layout engine, citation resolver, or cross-run identity. Reuse the DOT stage palette without changing its values or selection.

# Surprises
Hosted quality job 119161961051 found the helper name `escape` shadowed a global in production and its fixture, plus one test-formatting error. Renamed both helpers to `escapeHtml` and applied the emitted test reflow. HTML retains citation text; resolving citation links is a separate remaining #95 item.

# Next step
Await final-head hosted CI and supervisor merge. No local CI or browser validation run. The approved #91 stage/compact follow-on uses a separate worktree.
