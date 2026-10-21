# Goal

Make the dictionary verification harness use the selected frontend's declared lexicon (#141).

# State

Fresh isolated branch from fcbb001d. Full script, dictionary loader and path
helper read; implementation and owned diff inspected. Publishing for hosted CI
and Claude review. No local CI ran.

# Decisions and why

Approved smallest scope: about 10–20 additions/removals in the script. Resolve its
existing FRONTEND once; use lexicon.dictionary for loaded count and independently
read lexicon.path with readFileFromFsSync for raw JSON count/entry display. Explicit
missing-resource/read errors preserve failures. No changes to phoneme/frame metrics,
new loader, tests or local CI. Other agents' files remain untouched.

# Surprises

The script prints raw and parsed counts; it does not assert their equality. Keep
that reporting behavior and do not replace the raw read with the parsed cache.

# Next step

Publish for hosted CI and Claude review; supervisor owns merge. #141 stays open.
