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

Publish for independent Claude review and hosted CI, then respond to review. No local CI run. Supervisor owns merge and issue bookkeeping.
