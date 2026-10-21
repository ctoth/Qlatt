# Issue 78: frontend document-relative resources

## Goal
Resolve selected frontend resources and nested dependencies against the document that declares them, including explicit HTTP(S) and file URLs.

## State
Implemented on a fresh isolated branch from PR454 merge5094b271. No local CI; hosted validation pending publication.

## Decisions and why
- Smallest change: enhance the existing include-path helper for explicit URL parents, bind known frontend resource slots before inheritance, and bind inventory phonology plus morphology/stress phonotactics at acquisition. Estimate 80–120 production lines and 120–170 existing fixture lines.
- Keep existing logical/native path behavior and include child-first shadow/fallback. Do not rebase the include list before inheritance.
- Use the resolved inventory dependency in inventoryDocuments provenance. No new identity registry, cache, external extends, backend manifest or root API.
- Source: rule-pack.ts parseRulepackDocument, resolveExtendsSync/Async, resolveIncludesSync/Async, inventory loaders, resource acquisition and assembleFrontendResources; yaml-loader.ts resolveIncludePath.

## Surprises
Explicit URL parents use standard URL resolution; bundled logical paths retain their existing behavior. Root requested and verified the speaker-directory contract: getVoiceRegistry accepts a string without query/trailing-slash restrictions, but four acquisition paths concatenated filenames. The existing owner now uses standard child URL resolution for URL directories (directory query/fragment are not inherited), retaining logical/native concatenation. Root approved this bounded addition.

Existing resource-manifest fixtures relocate real Qlatt documents to HTTP and native file URLs, exercise sync/async acquisition and nested dependency provenance, preserve Beauty base-resource ownership and child-first include shadow/fallback, and cover DECtalk parser/speaker paths with a directory query/trailing slash. These are authored fixtures, not locally executed results.

## Next step
Publish, inspect hosted CI, and obtain private full-PR Claude review and implementer response. Root owns merge and the review ledger. Full issue78 remains open for backend root/manifest and identity-dependent work.
