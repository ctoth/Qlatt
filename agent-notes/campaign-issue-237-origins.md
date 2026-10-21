# Goal
Preserve original UTF-16 origins through the existing command parser for #237 host marker projection.

# State
PR #456 is open from master 5302e73d. Claude completed its full nine-file review (61e0cef4-c040-4284-a18a-409eeaf3ab5a); its process exited after the read-only review's note-hook loop. Initial hosted quality formatting corrected, and subsequent quality passes. Hosted shard3 found my incorrect word-only end expectation: tn_word_source matches non-whitespace and owns the final period, so the actual second source is4–7, not4–6. Corrected that assertion. No local CI.

Accepted Claude's source-backed suffix lookup finding: real number parts/pause segments use token_N:part or pause suffixes, while actual Token items use token_N. Node now uses the same base-token resolution as the existing frontend command scope path. Accepted the coverage observation by extending the existing render scenario with DECtalk Dr./number input, checking the raw bridge and actual suffixed frames. No new identity machinery. Unsupported hole/overlap examples remain nonfindings; no speculative guards added.

# Decisions and why
- Smallest approved scope: parallel half-open origin spans through existing byte/capture operations, clause assembly and command output; about 260–380 parser lines, 30–50 existing boundary lines and 140–200 existing fixture lines.
- Copies and restored captures retain exact origins; generated literals/dictionary output inherit the matched source span. Synthetic endings use insertion boundaries and command-generated speech uses its bracket source.
- Preserve parser bytes and existing Source sourceStart/sourceEnd coordinates in parsed text. Carry the raw-origin bridge separately to the detailed-result/Node boundary.
- No new parser, cache, protocol, index-marker API or scoped-command execution. Broader #237 acceptance remains open.

# Surprises
Existing Word occurrence projection excludes punctuation and unowned frames, so the supervisor approved separate plain per-frame sourceSpans metadata under includeTrack. It resolves actual Segment sourceTokenId and Token sourceNormalizationId; it does not require normalization items to belong to a Source relation. Unowned events remain absent rather than receiving guessed origins.

Origins live beside existing byte/capture arrays. The existing synchronous parser machine holds the current pass's working input origins and retained capture origins; output origins follow each actual output buffer, including lookahead's temporary output. There is no separate resolver/cache or parser algorithm.

# Next step
Hosted quality119308447707 requested one fixture expression wrap after the response; applied its exact formatting. No behavior changed in that correction.

Read replacement hosted validation. Supervisor owns independent verification and merge. Full index/scoped-command/live acceptance remains open.
