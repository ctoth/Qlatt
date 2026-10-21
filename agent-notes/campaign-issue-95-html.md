# Goal
Deliver #95's self-contained HTML decision DAG using the explain CLI's existing selected decisions.

# State
Implemented the HTML renderer, shared unchanged stage palette, invocation docs, and existing CLI-file coverage for selected/empty graphs, edges, ancestry details, and authored HTML escaping. Isolated branch based on #409 final 708bac1c; #409 merge remains pending.

# Decisions and why
Smallest scope: about 90–120 production lines, 40–60 existing CLI test lines, and docs. Use fixed stage columns and sequence rows, inline SVG parent connectors with direction, stage colors, escaped labels, and accessible textual details with reasons/citations in the same file. Keep current-run IDs, selected-only edges and omitted-parent count. No scripts, CDN, dependencies, layout engine, citation resolver, or cross-run identity. Reuse the DOT stage palette without changing its values or selection.

# Surprises
None. HTML will retain citation text; resolving citation links is a separate remaining #95 item.

# Next step
Publish with accurate #409 dependency, then hosted CI and independent Claude review. No local CI or browser validation run.
