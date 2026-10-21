# Goal

Acquire declared frontend resources asynchronously in the existing owner before
browser warmup runs the synchronous utterance (#141, partial delivery).

# State

Isolated from #426 final d8e8cd00; #426 merged as d9f7d4e4. Implementation complete;
all seven hosted checks passed on 925c1093. Claude reviewed the full seven-file
PR range; supervisor independently verified the report and review gate.
Review response complete, awaiting final-head CI. Initial production/caller diff: 251 additions /
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

Accepted review corrections: the probe had gained an unrequested configError
exit condition; removed it while retaining the report, network failure and timeout
behavior. Updated builder/test comments that still described manifest-driven
browser warmup. The cache's generic host-priming capability remains available.
Claude found no correctness defects in resource acquisition. Serial acquisition
differs from the former parallel priming; no latency measurement establishes a
regression, so this response adds no concurrency machinery.

# Next step

Push review response and await final hosted CI. Supervisor owns merge;
#141 remains open.
