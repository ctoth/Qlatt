# Issue 41: dictionary mapping declaration and unknown-character diagnostics

## Goal
Move the existing DECtalk dictionary conversion tables and compatibility policy to the requested frontend-local YAML without changing pronunciation output; report unknown input through existing diagnostics.

## State
Implemented on isolated branch from master 3927be2b. Four owned files: converter, frontend-local mapping, focused converter fixture, and this note. Parent owns final review gate and merge; other agents' work remains separate. No local CI or dictionary rebuild gate.

## Decisions and why
Smallest slice: 230–280 YAML lines replacing roughly 235 TypeScript literals, 45–65 loader/dispatch lines, 40–60 focused converter fixture lines. Source table citations are dic.c:96–149, l_us_ph.h:59–116 and usa_phon.tab:117–174. Retained Qlatt spelling/contrast merges are engineering compatibility decisions, not claimed DECtalk phonological conclusions. Preserve RR/IX/YU, secondary stress, rule-block/boundary metadata and all existing secondary/capitalized-entry consumers. Keep existing public conversion functions and Diagnostics, with field/character/UTF-16 offset on unknown input.

## Surprises
Issue text predates preserved secondary stress and existing homograph/capitalized-entry artifacts. The C P/S/N field is homograph status, not POS (dic_comm.c:485–501). General candidate identity for issue65 and full dictionary byte-identity evidence remain outside this bounded slice; do not close issue41 or fabricate a new schema.

## Next step
PR444 published; initial quality and shard4 pass, remaining hosted checks pending. Converter additions include types, citation validation, diagnostic subscription and formatting. Original dictionary/table artifacts remain untouched. Fixture fields were checked against actual Dic_us.txt rows and shipped dictionary entries; this is not a full rebuild or byte-identity result. Await final hosted CI and root verification/merge. No local CI.

## Review response
Claude reviewed all four files in 3927be2b...e74364e2 twice, with no runtime defect and two low wording/citation findings. Transcript 0a3a96bb-8b46-4a09-9f8d-76de3fd40fa1 under campaign41-mapping; execution69028 completed. Accepted both: restored q's no-Q-inventory compatibility rationale and precise stress/control C citations. Independently read dic.c:444–456, phonlist.h:181–191, the inventory and the CMU minutiae entry; the reason explicitly avoids claiming identical vowel sequences or DECtalk glottal-stop behavior. No code or fixture change. Reviewer created a plan-mode scratch file outside the repository despite the read-only brief; no repository changes. Its ad-hoc character-count observation is not relied on as validation. Root owns ledger/gate; no local tests or rebuild.
