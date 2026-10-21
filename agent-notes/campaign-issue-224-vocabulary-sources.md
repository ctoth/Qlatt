# Goal

Join executed vocabulary reads to authored map-value locations in explain text/JSON/why. Smallest change: 25–40 CLI lines, 35–50 existing fixture lines, and two documentation lines, using existing vocabularyLookup evidence and source spans.

# State

Started from origin/master f8437836. Implemented the exact resource/typed-path join and text/JSON output, with existing CLI coverage for the real dotted abbreviation key, exact value coordinates, why/replay preservation, and filtered output. Claude reviewed the full four-file PR and found no defects; accepted with no code changes. Initial seven hosted checks passed. No local CI; final response commit awaits hosted validation.

# Decisions and why

Match the evidence resource and exact typed path [maps, table, key]; a dotted literal key remains one segment. Only selected decision IDs receive vocabularySources. No runtime fields, flags, or claim to arbitrary literal origins. The real bundled producer is normalization/lexical.yaml's tn_abbreviation vocabulary read for Dr. Smith.

# Surprises

Other agents have added rule expressions and HTML output to explain. Preserve those changes; this slice owns text/JSON vocabulary locations only.

# Next step

Await final-head hosted CI and supervisor merge. Review response is complete. Keep #224 open.
