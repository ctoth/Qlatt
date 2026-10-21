# Issue 78: package-relative Node resource default

## Goal
Resolve bundled logical resources from the source package instead of the process working directory.

## State
Implemented from PR447 final957e5eb9, pending its merge. Isolated branch; parent owns final merge. Other agents' work is preserved. Existing YAML fixture covers rooted/relative bundled names, absolute custom files and removal of CWD fallback; renderer fixture uses inherited Beauty frontend/experiment from a real temp CWD in a fresh process.

## Decisions and why
Smallest approved change: roughly 8–15 production/comment lines in existing path-utils, plus 50–80 fixture lines. Derive the source package root from import.meta.url inside the Node-only resolution path, retain native absolute-file priority and public/root probe order, and remove CWD fallback. Relative logical resource names use the package anchor; custom native files must use absolute paths. No namespace whitelist, new root option/global state, URL identity schema, or arbitrary request.repoRoot document-selection claim. The private package runs source; compiled distribution layout is not covered. A fresh subprocess fixture invokes the existing Node renderer from a real temporary CWD; hosted CI provides execution evidence.

## Surprises
YAML and dictionary loaders normalize paths before probing; preserving a hypothetical relative custom CWD behavior would require unrelated routing. Parent explicitly selected the issue's package-relative default instead.

## Next step
Publish after PR447 merges; private Claude review and response, hosted CI only. No local CI or runtime success claim before hosted execution.
