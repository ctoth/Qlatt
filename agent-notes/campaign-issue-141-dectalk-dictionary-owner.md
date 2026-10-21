# Goal

Move DECtalk's dictionary under its declared frontend owner and remove hardcoded
dictionary locations from its builder and readers, as a bounded part of #141.

# State

Isolated at origin/master 0eeb2f6b. Implementation complete; hosted CI and Claude
review pending. No local CI. Adapter/reference diff is 57 additions / 28 removals
outside this note and the unchanged data move.

# Decisions and why

Smallest scope: one byte-identical move to
public/rules/frontends/dectalk-english/dectalk-dictionary.json and about 70–110
adapter/reference lines. Existing resource consumers reuse their loaded lexicon.
Builders and standalone oracle tools read the existing raw frontend declaration,
so building a missing output does not require that output or runtime compilation.
Preserve conversion algorithms, oracle metrics and historical recorded strings.
No new resolver, cache, schema or guard. Other agents are active; preserve edits.

# Surprises

Old and new dictionary Git blobs both equal
13db5317b3e91876248ff003fc95bbd1d1aa2d5e. The existing oracle fixture's historical
`from` string retains old paths; only current declarations and readers change.
The one-line dictionary was moved through apply_patch using a temporary leading
blank line, immediately removed; the resulting blob matches exactly.

# Next step

Publish for hosted CI and Claude review, then respond to findings. Supervisor
owns merge; #141 remains open.
