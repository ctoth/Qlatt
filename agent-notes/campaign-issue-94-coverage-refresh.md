# Goal

Regenerate the existing recorded coverage artifact after the lexicon merge. Smallest change: report output plus this note; no production changes, tests or new gates.

# State

Source commit b5000767fffe89b1b476f93d7806ca92bb6ac3a1 (origin/master after PR368). Nested isolated worktree resolves existing ancestor ts-node dependencies; its tracked public/worklets/f0-filters.wasm exists. Existing rule-coverage.ts stdout command completed with exit0 for all20 linguistic phrases and all3 bundled frontends, base F0 110. Corpus SHA-256: 0c07b56db0777f688246d8aa8fd82ead1485081eacaca4f6cc86ffc98f789b13. Full stdout applied to the report.

# Decisions and why

Keep recorded attempts, frame firing units and recognition outcomes distinct. Zero recorded firings means not observed in this corpus, not dead or unreachable. This refresh does not settle static lint warnings or close #94. Report generation is the requested deliverable, not a local CI gate.

# Surprises

Only Node experimental-loader and fs.Stats deprecation warnings on stderr; generation succeeded.

# Next step

Generation and report update complete. Publish for hosted CI and Claude review. Supervisor owns merge.
