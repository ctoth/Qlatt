# Issue 78: preserve explicit HTTP resource URLs

## Goal
Pass explicit HTTP(S) resource URLs unchanged through the existing normalization boundary.

## State
Implemented from 325df1b1 in an isolated worktree. Parent approved this bounded slice; other agents' edits are preserved. Existing fixtures exercise HTTP and HTTPS, encoded paths/query strings, both sync/async acquisition and existing absence/transport errors without rewritten local requests.

## Decisions and why
Smallest change: 3–5 production lines plus roughly 35–50 lines in existing YAML/dictionary fixtures. Trim then return HTTP(S) URLs before slash, public-prefix and BASE_URL transformations. Preserve encoded path/query and existing success/absence/transport behavior; reuse existing browser test helpers. No new resolver, root option, URL validation or registry. File URLs, document-relative references and package identity remain separate #78 work. This implements the issue's explicit URL-interface requirement, not a claim that bundled data currently declares remote resources.

## Surprises
None.

## Next step
PR452 published. Await final hosted CI and parent verification/merge. Initial quality/native/audio and test shard3 pass; others pending. Parent owns ledger/gate/merge. No local CI.

## Review response
Accepted Claude's two full passes over all four files in 325df1b1...f43aa727: no findings. Execution67644, transcript0b376c34-d39b-45e3-8f5e-50b913e11a2b under campaign78-http. Default-mode gh calls were denied; implementer independently verified actual GitHub head/file list against the reviewed local range. No reviewer writes or execution. Corrected two spacing nits in this note; no code change. Parent owns canonical gate and final verification.
