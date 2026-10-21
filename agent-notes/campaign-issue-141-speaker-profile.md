# Goal

Deliver one #141 slice: parse-only speaker profiles with explicit consumer input.

# State

Base 11840871. Authorized ownership: speaker-profile.ts, existing inventory resource
loader, TTS/voice callers, area-generation caller, DECtalk declaration/profile,
affected existing tests and this note. Other worktrees and main edits are untouched.

# Decisions and why

Smallest plan: 80–130 production additions and 25–40 removals plus caller/test
updates and a byte-identical DECtalk profile copy. Export the existing parser;
delete the implicit loader/default/cache. Load declared profiles through existing
FrontendResources and FRONTEND_ASSET_CACHE. A missing role stays absent until
TTS requires it, then E_FRONTEND_CONFIG names the frontend and speaker_profile.
Production voice/profile calls already supply the selected profile. The offline
area CLI explicitly selects Qlatt's declared profile, preserving its old behavior
even for custom inventories; the pure generate function receives that profile.
No second resolver/cache, new flag, async shortcut, or whole-closure completion claim.

# Surprises

Source-contour's asynchronous caller is deliberately outside this slice.
DECtalk's existing cold-load resource manifest lists the old shared profile;
updated that owned declaration to the new path (the existing manifest test
checks the recorded resource set). The new profile's SHA-256 matches the old
file byte-for-byte: 9808508D3AADF74C3939FFFBD3D1F0C74277C50897F5BFC3A0D16D29874DA0AB.
Dependencies are absent, so no local test run or dependency installation.

# Next step

Implementation and caller tests updated; commit/push for PR CI and Claude
review. No local CI duplication. #141 remains open for other consumers, resources
aliases, async closure, ownership relocation and import-time loads.
