# Issue 205: required syllabification tables

## Goal
Use the existing syllabifyWord algorithm for every executable frontend, removing nucleus-counting fallback while preserving shared HRG identity and ancestry.

## State
Implemented from d3759609. Qlatt tables are on the inherited frontend root, encoding its existing 28 multiconsonant onsets and all inventory phones/normalization aliases except transparent SIL. ER is a nucleus; R is not. Structural suffixes use existing basePhonemeSymbol. Executable sync/async loads require valid tables; low-level compile remains optional. The fallback is removed. Three edited focused files passed: npx vitest run test/annotation-syllable-cluster.test.ts test/declarative-frontend-schema.test.ts test/declarative-frontend-rule-pack-includes.test.ts. No broad local CI run.

## Decisions and why
Smallest plan: about 100 data lines encoding the existing Qlatt onset/vowel policy and own inventory, 25-40 production lines requiring tables only at executable sync/async loaders, delete the roughly 30-line fallback, and 80-130 focused test lines. No new algorithm, loader, or linguistic policy. Empty affixes preserve Qlatt's existing maximum-onset policy rather than adopting DECtalk affix stripping. Use existing validation diagnostics and explicit requirement option; programmatic rule fixtures remain optional.

Intended annotation corrections: syllable boundaries use maximal legal onsets rather than assigning intervening consonants to the preceding nucleus; positions become first/medial/last/only, and later words no longer use the first word's nucleus indices. Downstream rules observing the corrected topology may change timing/prosody. Existing generic CEL role calculation derives onset/nucleus/coda from that topology; no new stored role feature.

## Surprises
Initial focused run failed on my one-vowel-daughter assumption and table placement in pipeline.yaml. Q authorized investigation/fixes. Verified in live cat/banana graph: stop release splices retain inactive original vowels and add active replacements to the same syllable (rule-engine suppresses at1775 and attaches at1867). Test now checks one active vowel and the retained original vowel's exact source-token association independently. Beauty shadows pipeline.yaml; only predicates/maps/tags/relations inherit from shadowed files (rule-pack273), while root extends merges whole documents (472/500). Moved the table to frontend.yaml without changing inheritance or weakening validation. All edited tests then passed.

## Next step
Publish for hosted CI and independent Claude review, then respond. Preserve other agents' normalization and resource work.
