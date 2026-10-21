# Goal

Acquire declared frontend resources asynchronously in the existing owner before
browser warmup runs the synchronous utterance (#141, partial delivery).

# State

Isolated from #426 final d8e8cd00; #426 merged as d9f7d4e4. Implementation complete;
hosted CI and Claude review pending. Production/caller diff: 251 additions /
63 removals; existing fixtures add 86 lines. No local CI.

# Decisions and why

Smallest scope: about 200–300 production additions / 50–90 removals and
120–180 existing fixture lines. Reuse inventory, dictionary and frontend asset
caches and their parsers/errors. Share no-I/O resource assembly with sync loading;
the async owner must never call sync acquisition on a cache miss. Prepare default,
registered and explicitly selected voices, retaining compile-only early returns.
Later arbitrary open-registry names remain lazy; no whole-request purity or
immutability claim. Replace warmup's static-manifest priming with actual owner
acquisition and update the existing request probe's removed report fields.
Preserve status, idle, config/error behavior and synchronous-fetch evidence.
No new cache, manifest, schema or framework. Other agents are active; preserve edits.

# Surprises

The request probe reads primed/absent/failed fields and must change with warmup.
Its output now retains synchronous-fetch evidence and config errors, and existing
network failure/report timeout handling remains. All three frontend fixture
closures use unique paths over fake fetch/XHR; assertions cover no blocking
requests, sync cache identity, nested missing-resource errors, DECtalk's absent
shared roles and selected open-registry voices without compile rule fields.

# Next step

Publish for hosted CI and Claude; respond to findings. Supervisor owns merge;
#141 remains open.
