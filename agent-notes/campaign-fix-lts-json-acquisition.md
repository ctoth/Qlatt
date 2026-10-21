# Goal

Remove avoidable YAML AST parsing from declared generated JSON LTS resources.

# State

Isolated branch from f529f4b8. Implemented 10 production additions/2 removals
plus 29 existing fixture lines; null-document rejection preserved explicitly.
Owned diff and actual owner/caller contracts inspected; publishing for hosted CI.

# Decisions and why

Use JSON.parse and existing loadYamlSourceSync only for declared .json paths.
Keep YAML rule-list handling, the existing document cache and owner errors.
No new cache, generic loader change, timeout increase or timing test.
The separate diagnostic measured LTS AST parsing at 5061ms of a 5320ms resource
load; generated JSON values were deeply equal. Measurements used Node22.18.0,
yaml2.9.0 and TS5.9.3; hosted CI uses Node24 and the lock pins yaml2.9.1.
This identifies avoidable work, not the entirety of hosted timing variability.

# Surprises

The shared YAML loader rejects explicit null documents; preserve that rejection
on the JSON path rather than caching null as a successfully acquired resource.

# Next step

Await hosted CI/Claude and respond to actual findings.
No local CI; supervisor owns review, integration and merge.
