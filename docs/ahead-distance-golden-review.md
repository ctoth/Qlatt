# `ahead(item, n)` distance fix: golden review

`ahead(item, n)` returned the item one step ahead for every integer literal `n`. A CEL integer literal reaches the navigation function as a bigint and the engine accepted only a number. `behind` was not affected. The regression test is `moves ahead and behind by a literal integer distance` in test/hrg-rule-engine-navigation.test.ts.

Rule sites in qlatt-english that asked for a distance of two or more and now get it: `vowel_shortening` in phases/duration.yaml (phrase-final test), the place locus rules in phases/formant.yaml (the vowel after a stop's release), and the spelled-letter run test in phases/orthography.yaml.

On both corpora only the voiced formant means move, which is the place locus rules finding the vowel after a release. No timing, voicing or amplitude metric moves; `f0Mean` moves below 0.002 Hz because it is an event-weighted mean.

Regenerate with `scripts/review-ahead-distance-goldens.ts --write` against the pre-change goldens.

## Linguistic baseline corpus (qlatt-english, base F0 110 Hz)

7 of 20 phrases changed.

Largest absolute change per metric: f1MeanVoiced 2.8013, f2MeanVoiced 10.4871, f0Mean 0.0002.

| Phrase | Metric changes |
| --- | --- |
| The quick brown fox jumps over the lazy dog. | f1MeanVoiced: 399.8161 → 400.1575; f2MeanVoiced: 1418.9168 → 1416.2840 |
| She sells seashells by the seashore. | f2MeanVoiced: 1626.8821 → 1620.5488 |
| Thin thieves thought that they thrilled. | unchanged control |
| Ship shape, sheep shop, and cheap chips. | unchanged control |
| Sip zip, sip ship, sip sip. | unchanged control |
| A zoo can be fun on a sunny day. | f1MeanVoiced: 465.2087 → 465.6182; f2MeanVoiced: 1490.8862 → 1501.3733 |
| He had your dark suit in greasy wash water all year. | f2MeanVoiced: 1503.9809 → 1501.1238 |
| Say oh, ee, and oo again. | f2MeanVoiced: 1547.1932 → 1554.0201 |
| Bob bought a big blue balloon. | f0Mean: 127.1475 → 127.1477; f1MeanVoiced: 361.5082 → 364.3095; f2MeanVoiced: 1310.4605 → 1307.6136 |
| Pat tapped a pot and picked a paper cup. | unchanged control |
| Gag, gang, and gunk go together. | unchanged control |
| Layer, lawyer, royal, rural. | unchanged control |
| Nina mumbled many minimal numbers. | unchanged control |
| Fresh frost forms on five fields. | unchanged control |
| Vera vapes very vivid violets. | unchanged control |
| Zesty zest is easy to spot. | unchanged control |
| Shy sharks shimmer in shallow shoals. | unchanged control |
| They bathed the smooth leather. | f2MeanVoiced: 1608.8243 → 1615.5288 |
| S, f, sh, th, z, v, zh, dh. | unchanged control |
| Soft, safe, fuzzy, fussy, sassy, feisty, zesty, shifty. | unchanged control |

## Crystal & House 1982 fast-tempo corpus (rate 111.6/93.4)

7 of 20 phrases changed.

Largest absolute change per metric: f1MeanVoiced 2.4035, f2MeanVoiced 9.1253, f0Mean 0.0018.

| Phrase | Metric changes |
| --- | --- |
| The quick brown fox jumps over the lazy dog. | f1MeanVoiced: 398.4605 → 398.8018; f2MeanVoiced: 1430.3021 → 1427.6693 |
| She sells seashells by the seashore. | f2MeanVoiced: 1647.6716 → 1642.5910 |
| Thin thieves thought that they thrilled. | unchanged control |
| Ship shape, sheep shop, and cheap chips. | unchanged control |
| Sip zip, sip ship, sip sip. | unchanged control |
| A zoo can be fun on a sunny day. | f1MeanVoiced: 459.0469 → 459.4469; f2MeanVoiced: 1503.4959 → 1512.6212 |
| He had your dark suit in greasy wash water all year. | f2MeanVoiced: 1516.4803 → 1513.5957 |
| Say oh, ee, and oo again. | f2MeanVoiced: 1550.1871 → 1555.9563 |
| Bob bought a big blue balloon. | f0Mean: 127.9248 → 127.9266; f1MeanVoiced: 364.2797 → 366.6832; f2MeanVoiced: 1311.8935 → 1307.7719 |
| Pat tapped a pot and picked a paper cup. | unchanged control |
| Gag, gang, and gunk go together. | unchanged control |
| Layer, lawyer, royal, rural. | unchanged control |
| Nina mumbled many minimal numbers. | unchanged control |
| Fresh frost forms on five fields. | unchanged control |
| Vera vapes very vivid violets. | unchanged control |
| Zesty zest is easy to spot. | unchanged control |
| Shy sharks shimmer in shallow shoals. | unchanged control |
| They bathed the smooth leather. | f2MeanVoiced: 1592.1258 → 1598.1258 |
| S, f, sh, th, z, v, zh, dh. | unchanged control |
| Soft, safe, fuzzy, fussy, sassy, feisty, zesty, shifty. | unchanged control |
