# Goal

Provide the reusable lexical paper-reference coverage report requested by #73.

# State

Implemented within approved scope, based on 2bb293d6. Ran the requested report: 407 tracked paper folders, 529 source files, 106 referenced candidates, six ambiguous-only folders, 295 with no detected reference. This run preceded tracking the new script itself.

# Decisions and why

Smallest change: approximately 90–120 lines in one standalone script. Inventory tracked `papers/*/notes.md` filenames without reading paper content. Scan tracked source/config text in the approved scopes, reporting exact folder identities separately from bounded first-author/year matches. Same-author/year collisions remain ambiguous unless the source line names an exact folder identity.

The existing cross-reference script uses folder-derived author/year matching but mutates paper notes; this report does neither paper reading nor mutation. Existing provenance helpers normalize citation strings but do not resolve library identities. No dependency, registry, package command, test, or CI gate is added. Running the requested report is permitted; ordinary I/O failures remain nonzero.

# Surprises

The Lisker 1964 author/year collision appears as ambiguous evidence, including `public/rules/frontends/dectalk-english/phases/structural.yaml:362`. An unambiguous candidate sample is `Allen_1977_ModularAudioResponse` at `public/rules/frontends/qlatt-english/phases/orthography.yaml:27`. Lexical matches cannot establish implementation or scientific fidelity, and missing matches cannot establish non-use.

# Next step

PR #369 review found that literal folder-author matching missed actual `van Santen 1994` and `O'Shaughnessy 1976` citations. Corrected author patterns to permit optional spaces/apostrophes between letters and normalized the grouping key the same way, preserving token boundaries and collision ambiguity. Exact folder matching is unchanged. Accepted the finding; no bibliography resolver or additional gate was added.

Hosted quality run 39556188815 reported `scripts/paper-coverage.ts format` and exited 1. Applied its three requested reflows; left the unrelated numeric-constant warning unchanged. The corrected report scans 530 tracked source files: 108 referenced candidates, six ambiguous-only, 293 no detected reference. Actual corrected evidence includes `frontend.yaml:438,443` for van Santen and DECtalk `policy/speaker-profile.yaml:5,10` for O'Shaughnessy. No local CI run. Push and await final hosted CI and review response verification. Supervisor owns merge and issue bookkeeping.
