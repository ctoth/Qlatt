# Goal

Move the existing shared English normalization closure into its language owner
as a bounded part of #141.

# State

Isolated from #418 final head 6d9278c9; #418 merged as 3e6548e7.
Implementation complete: Git confirms eight 100-percent identical renames, with
41 additions / 41 removals in references and comments outside this note. Hosted
CI passed at 86797e4f. Claude completed the full review with no defects; accepted.
Supervisor independently verified the diff and source. No local CI.

# Decisions and why

Smallest change: eight byte-identical YAML moves to
public/rules/languages/english/normalization and about 45–70 reference/doc lines.
All three bundled frontends already include this closure; components.yaml keeps
its seven relative includes. Preserve every frontend normalization-policy file,
all rules, vocabulary, ordering and historical documentation snapshots. Update
three existing manifests and direct fixture readers. No runtime change, new
manifest, resolver, cache or schema. Physical provenance paths change; stable
identity and the rest of #141 remain separate work. Other agents are active;
preserve their edits, including #420's lexical.yaml suffix match.

# Surprises

The English and Beauty manifests need reordered entries to remain sorted after
the path move. Historical frontend-document-model snapshot retains its old path.

# Next step

Await final response-commit CI and supervisor merge; #141 remains open.
