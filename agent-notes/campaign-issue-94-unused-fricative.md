# Goal

Remove four unused fricative minimum-duration declarations as a bounded #94 lint cleanup. Smallest change: delete 16 YAML lines, with no runtime or inventory edits.

# State

Branch campaign/issue-94-unused-fricative starts at fb372f08. Source search across src, test, scripts and public finds the four fricative_min_*_ms names only at their frontend.yaml declarations. Duration.yaml:354 instead reads current/target fricative_min_ms.

# Decisions and why

Delete the unused declarations rather than suppress their lint warnings. Preserve actual inventory floors and all other policy parameters. No new test for dead-data deletion; hosted existing checks own validation. This is partial #94 delivery and does not close the issue.

# Surprises

None. The separate ignored weak-release target observation is preserved in the existing trace note and is outside this change.

# Next step

The sixteen-line deletion is complete. Commit and push a focused PR for hosted CI and independent Claude review; supervisor owns merge. No local tests or CI steps run.
