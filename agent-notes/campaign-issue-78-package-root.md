# Issue 78: package-relative Node resource default

## Goal
Resolve bundled logical resources from the source package instead of the process working directory.

## State
Implemented from PR447 final957e5eb9, now merged as44143882. Published PR449 against master. Isolated branch; parent owns final merge. Other agents' work is preserved. Existing YAML fixture covers rooted/relative bundled names, absolute custom files and removal of CWD fallback; renderer fixture uses the inherited Beauty frontend with the standalone Beauty experiment from a real temp CWD in a fresh process.

## Decisions and why
Smallest approved change: roughly 8–15 production/comment lines in existing path-utils, plus 50–80 fixture lines. Derive the source package root from import.meta.url inside the Node-only resolution path, retain native absolute-file priority and public/root probe order, and remove CWD fallback. Relative logical resource names use the package anchor; custom native files must use absolute paths. No namespace whitelist, new root option/global state, URL identity schema, or arbitrary request.repoRoot document-selection claim. The private package runs source; compiled distribution layout is not covered. A fresh subprocess fixture invokes the existing Node renderer from a real temporary CWD; hosted CI provides execution evidence.

## Surprises
YAML and dictionary loaders normalize paths before probing; preserving a hypothetical relative custom CWD behavior would require unrelated routing. Parent explicitly selected the issue's package-relative default instead.

## Next step
Await final hosted CI and parent verification/merge. Initial quality/native/audio and test shards1/3/4 passed; shard2 pending at review response. No local CI or runtime success claim before hosted fixture execution is verified.

## Review response
Claude reviewed all four files in957e5eb9...3081ee24 twice; no runtime defects. Execution50328, transcript96bcd7cc-457b-46d2-bec2-67867cb01c34 under campaign78-package-root. Default mode denied gh access; implementer independently verified actual PR head/file list matches reviewed local range. Report recovered from transcript after read-only hook refusal; no reviewer writes or execution. Accepted three wording corrections after source verification: F0 fallback comment now names package-relative probing; duration inspection script no longer claims CWD controls loader roots (chdir behavior retained); note distinguishes inherited frontend from non-inherited experiment. No new runtime changes, no compiled-distribution or Vite SSR execution claim. Parent owns ledger/gate and final delta verification.
