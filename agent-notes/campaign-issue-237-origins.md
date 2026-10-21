# Goal
Preserve original UTF-16 origins through the existing command parser for #237 host marker projection.

# State
Implementation and existing fixtures ready from master 5302e73d in an isolated worktree; no local CI. Publishing for hosted validation and full Claude review.

# Decisions and why
- Smallest approved scope: parallel half-open origin spans through existing byte/capture operations, clause assembly and command output; about 260–380 parser lines, 30–50 existing boundary lines and 140–200 existing fixture lines.
- Copies and restored captures retain exact origins; generated literals/dictionary output inherit the matched source span. Synthetic endings use insertion boundaries and command-generated speech uses its bracket source.
- Preserve parser bytes and existing Source sourceStart/sourceEnd coordinates in parsed text. Carry the raw-origin bridge separately to the detailed-result/Node boundary.
- No new parser, cache, protocol, index-marker API or scoped-command execution. Broader #237 acceptance remains open.

# Surprises
Existing Word occurrence projection excludes punctuation and unowned frames, so the supervisor approved separate plain per-frame sourceSpans metadata under includeTrack. It resolves actual Segment sourceTokenId and Token sourceNormalizationId; it does not require normalization items to belong to a Source relation. Unowned events remain absent rather than receiving guessed origins.

Origins live beside existing byte/capture arrays. The existing synchronous parser machine holds the current pass's working input origins and retained capture origins; output origins follow each actual output buffer, including lookahead's temporary output. There is no separate resolver/cache or parser algorithm.

# Next step
Read hosted validation and full Claude review; respond to actual findings. Supervisor owns independent verification and merge. Full index/scoped-command/live acceptance remains open.
