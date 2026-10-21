# Goal

Remove Qlatt's five duplicate, unused speaker-policy defaults and obsolete comment for partial #94 cleanup. Estimate: 29 YAML deletions and 10-15 existing test lines changed; no runtime edits.

# State

Fresh isolated branch from origin/master. Qlatt and Beauty have no layered F0 model, so tts-frontend's speakerParamsOf returns before reading policy.speaker. Their live defaults come from the declared speaker-profile resource and its default_profile, resolved with request/voice inputs.

# Decisions and why

Keep existing value, citation and integration assertions, but read the actual profile resource using loadFrontendResources. Remove only the redundant bundled Qlatt data; preserve the profile resource, runtime and DECtalk audit/data. No new tests or guards; hosted CI owns validation.

# Surprises

None.

# Next step

The scoped deletion and existing test correction are complete. No local tests or CI steps run; commit/publish for hosted CI and Claude review. Supervisor owns merge; #94 remains open.
