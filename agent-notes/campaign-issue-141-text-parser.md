# Goal

Move text-parser table acquisition into existing FrontendResources for #141.
Keep #141 open for whole-closure and remaining consumer migrations.

# State

Implemented in an isolated worktree from master 723751ab; preparing PR.
Production delta is 24 additions and 20 removals across the three owned modules.

# Decisions and why

Smallest change: optional textParser config/table in FrontendResources, acquire
through existing requireAsset/cache, pass the table explicitly to runTextParser,
delete the consumer's private loader/cache. Estimate 30–45 production additions
and 18–25 removals, plus 30–50 focused test lines. Preserve config.tablePath
provenance, parser execution, and normalization's absent-parser fast path.
No validator, schema, async helper, or additional cache is needed.

# Surprises

Only the two TTS call sites invoke runTextParser in production. The existing
parser test now verifies shared-cache reuse, explicit-table execution without
YAML acquisition, declaring-path provenance, and absent optional parser data.
No local tests ran: this isolated worktree has no installed dependencies.

# Next step

Commit/push for hosted CI, Claude review, response, and supervisor merge.
Do not duplicate CI locally; only an actively written test may run locally.
