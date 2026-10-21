# Goal

Remove the import-time Qlatt rulepack and implicit transcription configuration
for the next bounded #141 resource-ownership slice.

# State

Implemented from b5000767 after #368 merged. PR #371 awaits Claude review and
replacement hosted CI. No local CI run.

# Decisions and why

Smallest change: approximately 80–130 production additions and 75 removals,
plus 150–240 fixture/data lines. Delete QLATT_ENGLISH_RULEPACK and require the
existing compiledSpec option; diagnostic helpers take explicit transcription
configuration. Fixtures call the existing resolver directly, without a shim.

Move the exact shared dictionary/LTS/morphology names and citations into Qlatt's
transcription.sources, inherited by Beauty. Existing source validation checks
the selected declared resources instead of comparing against a global Qlatt
baseline. Preserve missing-source errors and the per-used-source check, including
DECtalk's independent metadata. No new validator, cache or lazy global load.

Alias migration, remaining resource closure and linguistic-resource placement
remain outside this slice; #141 stays open.

# Surprises

Hosted quality requested one collapsed filter expression after the local fixture
variable became shorter. Hosted shard 1 also exposed an existing browser fixture
that assumed importing rule-pack populated the inventory cache: it required a
known-path suffix even with no loaded inventory. inventory.ts:480–486 emits that
suffix only when the cache has entries. Updated the fixture to accept the
optional suffix while retaining the message and not-found cause checks; no
production change was needed for either failure.

The implementation is smaller than estimated: 28 production additions and 50
removals, with explicit resolver/config changes in existing fixtures. Missing
source metadata is exercised for English, Beauty and DECtalk; an injected
dictionary without declared metadata still reaches the per-used-source error.

Removing the asynchronous global preload moves English's rulepack/inventory
closure into its synchronous selected load. yaml-loader.ts records synchronous
reads but not asynchronous preload reads; the existing cold-load recorder starts
before importing TTS. Updated the existing English resource manifest from its
declared includes, inventory/phonology and accent policy. No generator writes,
new loader or extra validation step was introduced.

# Next step

Publish for hosted CI and Claude review, then respond to findings. #141 stays open.
