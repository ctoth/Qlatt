# Goal
Retire the remaining approved direct-Node YAML readers for #224 using the existing shared parser.

# State
PR #462 is published from base d187a168 after #459 merged and its owned tree/branches were cleaned. No local CI or generators run. Initial hosted quality job119323848153 found import ordering in the voice importer and wrapping in yaml-loader; applied those exact formatting corrections in 8e03c371, whose hosted quality/native/audio checks passed while four test shards were pending.
Claude Opus 5.5 completed two passes over the full initial eight-file range in conversation 0e1d33a5-1c8e-4aa7-91a8-139a09542f58, with no actionable defects. Accepted; no production review changes needed. Its null-handling observation overlooked parseYamlString -> parseYaml, which explicitly rejects parsed null/undefined (src/yaml-loader.ts:164–170,325–330); the existing note is correct. Its stale local-master merge-base claim does not describe the PR: gh baseRefOid and git merge-base origin/master HEAD both returned d187a168. The subsequent code delta is import ordering/wrapping only. No external DECtalk input parity, importer execution, or emitted byte equivalence was measured.

# Decisions and why
Smallest change: five explicit .ts suffixes in yaml-loader/sync-resource-cache's actual import closure, plus four direct-Node script readers and the existing ts-node DECtalk voice importer (about 22–30 changed production lines). Node requires explicit local extensions; tsconfig already permits .ts imports. The existing registry CLI subprocess fixture exercises this entry point in hosted CI.
Pass each actual input path to parseYamlString. Preserve the comparison script's missing-file branch and all output generation. Explicit null documents now receive the shared empty-document rejection; no compatibility shim. No package removal, regeneration, new tests, or source-map completion claim.

# Surprises
None. #256 remains held separately pending Q's diagnostic continuation answer.

# Next step
Inspect final hosted CI; supervisor owns independent review ledger and merge.
