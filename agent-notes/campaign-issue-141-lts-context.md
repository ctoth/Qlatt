# Goal

Pass the selected LTS document through pronunciation rather than acquiring it
inside the table and Elovitz consumers (#141).

# State

Fresh branch from ad91bc80. Implementation complete: 43 production additions /
59 removals and 79 existing fixture additions / 43 removals. Actual callers,
remaining path references and owned diff inspected; PR #392 published.

# Decisions and why

Approved estimate: 70–110 production additions/60–90 removals plus existing
fixtures. Use the existing owner cache to return {path, document}. Replace
pronunciation path transport with that context, including explicit transcription
overrides. Preserve the existing .json classification and generated JSON decoder.
Delete the redundant table cache/helper; retain one Elovitz compiled-regex cache
keyed by document identity so same-path explicit documents do not share patterns.
No validator, schema framework, loader wrapper or additional cache.

# Surprises

Number normalization still calls ltsDocumentAt through rule-engine/source
normalization. Its acquisition and the shared document cache remain explicitly
outside this slice; #141 stays open. Other agents' changes are preserved.
Existing resource fixtures cover same-path explicit document overrides, and
Elovitz fixtures cover distinct documents with different context-symbol patterns.
The table decoder, .json classification and pronunciation arithmetic are retained.
Hosted quality job119122611488 found one formatter error in the fixture import.
Applied its exact single-line import formatting; no behavioral change or local CI.

# Next step

Await hosted CI and Claude review, respond to actual findings. No local CI ran;
supervisor owns merge.
