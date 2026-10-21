# Issue 78: preserve explicit HTTP resource URLs

## Goal
Pass explicit HTTP(S) resource URLs unchanged through the existing normalization boundary.

## State
Implemented from325df1b1 in an isolated worktree. Parent approved this bounded slice; other agents' edits are preserved. Existing fixtures exercise HTTP and HTTPS, encoded paths/query strings, both sync/async acquisition and existing absence/transport errors without rewritten local requests.

## Decisions and why
Smallest change: 3–5 production lines plus roughly35–50 lines in existing YAML/dictionary fixtures. Trim then return HTTP(S) URLs before slash, public-prefix and BASE_URL transformations. Preserve encoded path/query and existing success/absence/transport behavior; reuse existing browser test helpers. No new resolver, root option, URL validation or registry. File URLs, document-relative references and package identity remain separate #78 work. This implements the issue's explicit URL-interface requirement, not a claim that bundled data currently declares remote resources.

## Surprises
None.

## Next step
Publish, private full-PR Claude review/response and hosted CI. Parent owns ledger/gate/merge. No local CI.
