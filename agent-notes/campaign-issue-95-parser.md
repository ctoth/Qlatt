# Issue 95: explain CLI argument parsing

## Goal
Support equals-form options and preserve positional phrase words after bare boolean flags.

## State
Implemented from origin/master 2191ee15: 20 changed production lines, 48 added focused test lines, and two documentation lines. The parser splits the first equals and recognizes the six existing boolean flags. Public CLI tests cover phrase order, explicit true/false, embedded equals, spaced values, and explicit phrase precedence. Active test file passed: npx vitest run test/explain-phrase-cli.test.ts. No other local CI checks run.

## Decisions and why
Smallest change: roughly 20-35 production lines splitting the first equals and recognizing the six existing boolean flags, plus 40-60 focused test lines and a short documentation clarification. Keep valued options and explicit phrase precedence. No parser dependency, additional options, DAG rendering, or other issue 95 features. Other agents work in separate worktrees; only task-owned paths will be committed.

## Surprises
None.

## Next step
Push a PR for hosted CI and supervisor-owned Claude review, then respond to review. Keep issue 95 open for its remaining bullets.
