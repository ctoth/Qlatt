# Goal
Preserve original UTF-16 origins through the existing command parser for #237 host marker projection.

# State
PR #456 is open from master 5302e73d. Full Claude review is active (61e0cef4-c040-4284-a18a-409eeaf3ab5a). Initial hosted quality job119303749838 found three formatting diagnostics; exact emitted wraps/indentation corrected. Runtime checks pending; no local CI.

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
