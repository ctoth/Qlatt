# Goal

Move speaker-definition acquisition into the existing frontend resource owner (#141).

# State

Fresh isolated branch at 7a894544. Actual owner, definition consumer, two TTS
change producers and existing command fixture read. Implementation complete:
35 production additions / 7 removals, 22 existing fixture additions / 5 removals.
Publishing for hosted CI and Claude review; no local CI ran.

# Decisions and why

Approved smallest scope: 25–45 production additions / 8–15 removals plus 15–25
existing fixture lines. Acquire optional speakers.definition_path with the existing
owner cache and pass its path/data to the pure definition-change consumer. Retain
its validator and arithmetic; only requested changes require supplied context.
No new cache, resolver, schema, guard or local CI. Other agents' work is preserved.

# Surprises

Voice YAML acquisition for compile-time rule fields and runtime selection remains
separate unfinished work. No claim that dectalk-voice is wholly parse-only yet.
The DECtalk manifest already includes speaker-definition.json. Existing command
fixtures retain AP/PR derived-value checks and now consume owner data; the added
case covers cache identity, ordinary voice selection without context and the
missing-context diagnostic when changes are requested.

# Next step

Await hosted CI and Claude, respond to actual findings; supervisor owns merge.
