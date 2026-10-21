# Goal

Remove the unused final_lowering_factor declaration for partial #94 lint cleanup. Smallest change: six deleted YAML lines; no runtime behavior change.

# State

Isolated branch from origin/master. Current source search finds the name only in frontend.yaml and a historical research verdict. Prosody.yaml:129-137 computes accent heights from downstep and height policy; tts-frontend.ts reads continuation-rise policy without this factor.

# Decisions and why

Delete the unused declaration and its heading/citations rather than suppress its warning. Preserve all active F0 rules and parameters. No tests added or local CI run for dead-data deletion; hosted existing checks own validation. #94 remains open.

# Surprises

None.

# Next step

The six-line deletion is complete. Commit and publish a PR for hosted CI and independent Claude review. Supervisor owns merge.
