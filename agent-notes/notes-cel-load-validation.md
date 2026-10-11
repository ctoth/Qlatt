Checkpoint: user authorized fixing validation hole with TDD; isolated worktree Qlatt-cel-validation, branch fix/cel-load-validation from ad9c73d5.
New 26-case regression suite: 15 red failures demonstrated malformed has/type errors and dormant fallback accepted; 11 valid controls pass.
Fix now runs env.check for dynamic and declared-variable callers and returns every check failure after specialized diagnostics.
Bundled load now loudly rejects all nine malformed burst fallback expansions, preventing test import as expected.
Next: correct the one invalid bundled template, rerun schema/single-parse/CEL regressions and resolve genuine compatibility failures.
