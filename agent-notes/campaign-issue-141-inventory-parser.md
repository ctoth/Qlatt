# Goal

Separate inventory parsing from phonology acquisition and supply the parsed
inventory to the area-formant generator (#141, bounded partial delivery).

# State

Isolated from origin/master 17e27f2b. Implementation complete; hosted CI and
Claude review pending. No local CI.

# Decisions and why

Smallest scope: about 30–55 production lines and 40–65 existing fixture lines.
parseInventorySpec receives optional explicit phonology source, never a loader.
Existing synchronous/asynchronous owners acquire the declared dependency and
retain contextual read errors, cache behavior and provenance path metadata.
The CLI supplies the parsed inventory; generate keeps raw inventory text only
for its existing normalized hash. Preserve values, metrics and report output.
No unified-closure or immutability claim; no new resolver, cache or framework.
Other agents are active; preserve their changes.

# Surprises

Existing loader fixtures already cover both contextual missing-dependency errors,
async-to-sync cache identity and phonology path metadata. Parser fixtures now
supply source explicitly; flattened inventories still need no phonology source.
The CLI fixture clones the loaded inventory before augmenting generated targets,
so it does not modify the cached input supplied to later generator checks.

# Next step

Publish for hosted CI/Claude and respond to findings. Supervisor owns merge;
#141 remains open.
