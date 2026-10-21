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
Publish, then hosted CI and private Claude review/response. Converter additions include types, citation validation, diagnostic subscription and formatting; YAML is 227 lines and focused fixture 69 lines. Original dictionary/table artifacts remain untouched. Fixture fields were checked against actual Dic_us.txt rows and shipped dictionary entries; this is not a full rebuild or byte-identity result. No local CI.
