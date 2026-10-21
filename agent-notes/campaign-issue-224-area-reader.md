# Issue 224: area generator shared YAML reads

## Goal
Use the existing shared parser for the generator's area and optional speaker documents.

## State
Implemented on isolated branch from 2df87ed3: both reads use parseYamlString with their actual source paths for schema diagnostics and span identity. The existing invalid-input fixture asserts the shared parser's duplicate-key rejection. Writer and exact-byte output assertions are unchanged. No local CI run.

## Decisions and why
Smallest approved slice is about 5–8 production lines: retain js-yaml dump and replace its two load calls with parseYamlString, labeled with actual area/speaker paths. Existing invalid-input fixture can exercise parser rejection without adding a new test framework. Preserve exact-byte generated YAML/report assertions, raw source hashes, mathematical model and all generated artifacts. No local CI; hosted PR CI owns validation.

## Surprises
I initially asserted the async loader's E_YAML_PARSE wrapper for parseYamlString. Root identified the mismatch; source yaml-loader.ts164–170 directly calls parseYamlValue, whose document.errors[0] propagates. Corrected the fixture to the parser's actual "Map keys must be unique" message; no parser behavior was expanded. Full writer migration needs explicit folded/flow style preservation and remains outside this reader-only change. Other agents own separate worktrees; preserve their edits.

## Next step
Publish, obtain full private Claude review and respond. Root owns gate/merge. Issue224 remains open for its remaining writer/span obligations.
