# Goal

Remove the generic dictionary loader's implicit CMU path; make the profiling and
dictionary-miss scripts consume the selected Qlatt frontend's lexicon (#141).

# State

Isolated from origin/master at 3d631294. Implemented the approved bounded slice;
preparing publication for hosted CI and independent Claude review.

# Decisions and why

- Smallest change: about 20–35 added / 15 removed production and script lines,
  plus existing fixture adjustments. Keep the existing resource owner and cache.
- Require an explicit path in the async dictionary loader and list only cached
  paths in its existing unknown-path diagnostic.
- Both scripts explicitly select qlatt-english using the existing rulepack and
  frontend-resource loaders, then require its declared lexicon.
- Profile the resulting acquisition as frontend-resource loading; it includes
  more than dictionary loading, so no performance comparison is implied.
- Keep #141 open: other resource acquisition and language ownership remain.

# Surprises

The existing browser absence fixture resets modules before acquiring its two
loaders. Its cold-cache assertion now checks the exact missing-path message,
without a fabricated CMU suggestion. No local CI runs; PR CI owns validation.

# Next step

Owned diff inspected: loader, two scripts, existing absence fixture, and this
note. Commit, push, and open the PR for CI and Claude review. Respond to review
and report the exact head to the supervisor; do not merge this branch myself.
