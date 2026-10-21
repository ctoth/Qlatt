# Goal
Retire the remaining approved direct-Node YAML readers for #224 using the existing shared parser.

# State
Implementation authorized after #459 merged. Base is d187a168. No local CI or generators run.

# Decisions and why
Smallest change: five explicit .ts suffixes in yaml-loader/sync-resource-cache's actual import closure, plus four direct-Node script readers and the existing ts-node DECtalk voice importer (about 22–30 changed production lines). Node requires explicit local extensions; tsconfig already permits .ts imports. The existing registry CLI subprocess fixture exercises this entry point in hosted CI.
Pass each actual input path to parseYamlString. Preserve the comparison script's missing-file branch and all output generation. Explicit null documents now receive the shared empty-document rejection; no compatibility shim. No package removal, regeneration, new tests, or source-map completion claim.

# Surprises
None. #256 remains held separately pending Q's diagnostic continuation answer.

# Next step
Implement the approved reader changes, publish, and obtain private Claude review and hosted CI.
