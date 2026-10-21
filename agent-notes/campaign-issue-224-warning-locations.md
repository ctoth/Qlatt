# Goal

Display actual authored parameter locations on existing policy warnings in lint and explain output. Smallest scope: about 25–40 production lines and 25–40 existing-test lines. No error-location, full source-map or strict-mode behavior claim.

# State

Started from origin/master d3897a32035e801fcbe255835d2ca60b4cc48abb, which includes authored parameter origins from #379. Existing warnings retain exact parameter paths, while rule-expression errors require later rule-span propagation.

# Decisions and why

Add optional documentSpan to stored diagnostics, selecting only an exact authored parameter path and its key location. Preserve diagnostic messages, codes and severity. Append resource:line:column only when present in lint/explain warning output. Generated or unmatched locations remain absent; no guessed parent locations or warning suppression.

# Surprises

The validator's dotted diagnostic paths cannot distinguish a literal dotted key from nested keys. Location enrichment requires one matching authored candidate and identical typed path segments; ambiguous or unmatched paths stay unlocated. Other agents are active; preserve their work.

# Next step

Implemented optional stored spans and lint/explain suffixes. Existing tests cover exact warning rendering, child and base parameter origins, generated voice exclusions and explain output. No local tests or CI run. Publish for hosted CI and Claude review. #224 remains open.
