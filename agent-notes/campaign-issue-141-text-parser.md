# Goal

Move text-parser table acquisition into existing FrontendResources for #141.
Keep #141 open for whole-closure and remaining consumer migrations.

# State

Implemented in an isolated worktree from master 723751ab; PR #344 open.

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

The direct spec.text_parser read I introduced in normalizeText does not belong
to the inferred CompiledRulepack type. Hosted quality job119033597165 reported
TS2339 at tts-frontend.ts754; Claude identified the same defect and no others.
The correction restores the existing parseTextParserConfig accessor for the
fast-path check. It preserves absence and malformed-config handling without a
new cast or schema. A present configuration is parsed again by the resource
owner, while table acquisition still happens only through its existing cache.
Q authorized this correction. All four runtime shards, native, and
node-web-audio-api passed on the original head; final-head CI is pending.

# Next step

Push this implementer response for hosted CI and supervisor merge.
Do not duplicate CI locally; only an actively written test may run locally.
