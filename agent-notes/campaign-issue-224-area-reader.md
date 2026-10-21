# Issue 224: area generator shared YAML reads

## Goal
Use the existing shared parser for the generator's area and optional speaker documents.

## State
PR #466 implements both reads through parseYamlString with actual source paths for schema diagnostics and span identity. Existing plain-Node, invalid-input and exact-byte YAML/report coverage is retained unchanged. The final change contains only the generator and this note. No local CI run.

## Decisions and why
Smallest approved slice is about 5–8 production lines: retain js-yaml dump and replace its two load calls with parseYamlString, labeled with actual area/speaker paths. Preserve existing coverage, exact-byte generated YAML/report assertions, raw source hashes, mathematical model and all generated artifacts. No local CI; hosted PR CI owns validation.

## Surprises
I initially asserted the async loader's E_YAML_PARSE wrapper for parseYamlString. Root identified the mismatch; source yaml-loader.ts164–170 directly calls parseYamlValue, whose document.errors[0] propagates. Corrected that expectation, then removed the added assertion entirely in response to review: duplicate rejection already belonged to the shared parser and did not distinguish this migration. No parser wrapper or replacement assertion was added. Full writer migration needs explicit folded/flow style preservation and remains outside this reader-only change. Other agents own separate worktrees; preserve their edits.

## Next step
Review response complete; await hosted CI and root gate/merge. Issue224 remains open for its remaining writer/span obligations.

## Private review and response
Claude Code Opus5.5 reviewed the full initial three-file range 2df87ed3...b1aeb80f twice and matched it to GitHub. Transcript accccf5a-58a3-4475-bba8-2987a36a6ccb.jsonl, execution session8788. Accepted the incorrect error-prefix and stale note findings, and removed the redundant assertion as directed by root. Production reads remain the reviewed smallest change; writer/output checks are untouched. Reviewer assumed the main installed YAML version without verifying it (main has2.9.0); implementation inspection of preserved316's2.9.1 confirms the same direct duplicate-error behavior. Neither reviewer nor implementer ran local CI, writers or paper-text extraction. Syntax errors continue the existing shared-parser contract; supplied labels provide span identity and empty-document schema context, not a new syntax-error wrapper.
