# Splice tree-placement fix: golden review

When a rule replaced phones, the engine attached every inserted Segment under the first replaced phone's syllable, as its last daughter. A re-emitted copy of the following phone therefore moved into the previous syllable (and the previous word, when it began one), the punctuation silence moved into the last word, and the pieces of an expanded onset were listed after the nucleus and coda. The engine now attaches a whole copy where the copied Item sits, attaches nothing for a copy of an Item outside the tree, and inserts every piece at its place in the syllable. The regression test is test/word-tree-integrity.test.ts.

Rules whose writes change, found with scripts/diff-rule-writes.ts over these corpora and the DECtalk oracle corpus in all three frontends: `cluster_position_annotation` (a foreign phone was counted in the cluster), `syllable_role_annotation`, `syllable_position_annotation`, `syllable_index_annotation` and `syllable_count_annotation` (expanded onsets were read as codas; a copied word-initial phone was read in the previous word), `cluster_shortening`, `pre_boundary_lengthening` and `vowel_shortening` (the final-syllable and phrase-final tests now see the right syllable), and `nasal_windows`. The source and effort contours (`vocal_effort`, `phrase_rd_contour`, `connected_speech_source_contour`) move only because the durations under them move.

The fix also changes `hertz_nucleus_timing` in qlatt-english, which read `coda.voiced` with `has(...) &&`. A stop closure carries `voiced: null`, so the rule threw on "bite.", "church.", "Clear light glowed." and "Boat boot bought but bite.". It now reads the flag with `isTrue`. In dectalk-english the whole-word entry for "yelled" named a phoneme `LL` that the inventory does not have, so "Young yaks yelled." threw; it now names `L`.

This review is of track metrics, not a listening test. Regenerate with `scripts/review-splice-tree-goldens.ts --write` against the pre-change goldens.

## Linguistic baseline corpus (qlatt-english, base F0 110 Hz)

14 of 20 phrases changed.

Largest absolute change per metric: totalTime 0.0640, voicedTime 0.0640, voicedRatio 0.0092, f0Mean 0.1313, f1MeanVoiced 0.6804, f2MeanVoiced 0.9808, unvoicedNonsilenceTime 0.0070.

| Phrase | Metric changes |
| --- | --- |
| The quick brown fox jumps over the lazy dog. | totalTime: 3.8850 → 3.8810; voicedTime: 2.8220 → 2.8180; voicedRatio: 0.7264 → 0.7261; f0Mean: 132.5555 → 132.5514 |
| She sells seashells by the seashore. | totalTime: 3.1010 → 3.0990; voicedTime: 2.0840 → 2.0820; voicedRatio: 0.6720 → 0.6718; f0Mean: 135.3666 → 135.4979; f1MeanVoiced: 417.9423 → 418.0173; f2MeanVoiced: 1620.5488 → 1620.4113 |
| Thin thieves thought that they thrilled. | unchanged control |
| Ship shape, sheep shop, and cheap chips. | unchanged control |
| Sip zip, sip ship, sip sip. | unchanged control |
| A zoo can be fun on a sunny day. | totalTime: 2.9580 → 2.9510; voicedTime: 2.2030 → 2.1980; unvoicedNonsilenceTime: 0.3550 → 0.3530; voicedRatio: 0.7448 → 0.7448; f0Mean: 126.6378 → 126.6691; f1MeanVoiced: 465.6182 → 465.6358; f2MeanVoiced: 1501.3733 → 1500.5968 |
| He had your dark suit in greasy wash water all year. | totalTime: 5.1180 → 5.1200; voicedTime: 4.1260 → 4.1240; unvoicedNonsilenceTime: 0.5920 → 0.5960; voicedRatio: 0.8062 → 0.8055; f0Mean: 135.1138 → 135.1120 |
| Say oh, ee, and oo again. | totalTime: 2.4160 → 2.4800; voicedTime: 1.5520 → 1.6160; voicedRatio: 0.6424 → 0.6516; f0Mean: 146.2300 → 146.1616; f1MeanVoiced: 432.7611 → 433.4415; f2MeanVoiced: 1554.0201 → 1553.0393 |
| Bob bought a big blue balloon. | totalTime: 2.4970 → 2.4930; voicedTime: 2.0670 → 2.0630; voicedRatio: 0.8278 → 0.8275; f0Mean: 127.1477 → 127.1595; f1MeanVoiced: 364.3095 → 364.3595; f2MeanVoiced: 1307.6136 → 1307.3698 |
| Pat tapped a pot and picked a paper cup. | totalTime: 3.0840 → 3.0810; unvoicedNonsilenceTime: 1.0920 → 1.0890; voicedRatio: 0.5162 → 0.5167; f0Mean: 145.7888 → 145.8121 |
| Gag, gang, and gunk go together. | totalTime: 3.2570 → 3.2550; voicedTime: 2.4730 → 2.4710; voicedRatio: 0.7593 → 0.7591; f0Mean: 131.0154 → 131.0192 |
| Layer, lawyer, royal, rural. | unchanged control |
| Nina mumbled many minimal numbers. | totalTime: 2.8500 → 2.8450; voicedTime: 2.4200 → 2.4150; voicedRatio: 0.8491 → 0.8489; f0Mean: 146.1979 → 146.1950; f1MeanVoiced: 383.6722 → 383.6803; f2MeanVoiced: 1415.9857 → 1415.7518 |
| Fresh frost forms on five fields. | totalTime: 3.5540 → 3.5520; voicedTime: 2.4410 → 2.4390; voicedRatio: 0.6868 → 0.6867; f0Mean: 134.7750 → 134.7778 |
| Vera vapes very vivid violets. | totalTime: 2.6060 → 2.6080; voicedTime: 1.8620 → 1.8640; voicedRatio: 0.7145 → 0.7147; f0Mean: 154.0478 → 154.0492 |
| Zesty zest is easy to spot. | totalTime: 2.8400 → 2.8740; voicedTime: 1.7810 → 1.8170; unvoicedNonsilenceTime: 0.6590 → 0.6570; voicedRatio: 0.6271 → 0.6322; f0Mean: 139.3706 → 139.4402 |
| Shy sharks shimmer in shallow shoals. | totalTime: 2.9490 → 2.9470; voicedTime: 1.8280 → 1.8260; voicedRatio: 0.6199 → 0.6196; f0Mean: 137.4022 → 137.4005 |
| They bathed the smooth leather. | unchanged control |
| S, f, sh, th, z, v, zh, dh. | unchanged control |
| Soft, safe, fuzzy, fussy, sassy, feisty, zesty, shifty. | totalTime: 5.7750 → 5.7680; unvoicedNonsilenceTime: 1.5620 → 1.5550; voicedRatio: 0.4784 → 0.4790; f0Mean: 137.9197 → 137.9419 |

## Crystal & House 1982 fast-tempo corpus (rate 111.6/93.4)

14 of 20 phrases changed.

Largest absolute change per metric: totalTime 0.0540, voicedTime 0.0540, voicedRatio 0.0093, f0Mean 0.7775, f1MeanVoiced 3.1318, f2MeanVoiced 3.6555, unvoicedNonsilenceTime 0.0060, events 1.0000, voicedEvents 1.0000, b1MeanVoiced 0.5321, avMeanVoiced 0.0261, f0Min 0.0346, f0Span 0.0346.

| Phrase | Metric changes |
| --- | --- |
| The quick brown fox jumps over the lazy dog. | totalTime: 3.3550 → 3.3520; voicedTime: 2.4080 → 2.4050; voicedRatio: 0.7177 → 0.7175; f0Mean: 132.1329 → 132.1313 |
| She sells seashells by the seashore. | totalTime: 2.6530 → 2.6510; voicedTime: 1.7690 → 1.7670; voicedRatio: 0.6668 → 0.6665; f0Mean: 134.8676 → 134.8256; f1MeanVoiced: 412.6007 → 412.6975; f2MeanVoiced: 1642.5910 → 1642.4136 |
| Thin thieves thought that they thrilled. | unchanged control |
| Ship shape, sheep shop, and cheap chips. | unchanged control |
| Sip zip, sip ship, sip sip. | unchanged control |
| A zoo can be fun on a sunny day. | totalTime: 2.5300 → 2.5230; voicedTime: 1.8610 → 1.8560; unvoicedNonsilenceTime: 0.3180 → 0.3160; voicedRatio: 0.7356 → 0.7356; f0Mean: 127.0776 → 127.0584; f1MeanVoiced: 459.4469 → 459.4698; f2MeanVoiced: 1512.6212 → 1511.6097 |
| He had your dark suit in greasy wash water all year. | totalTime: 4.3620 → 4.3630; voicedTime: 3.4930 → 3.4920; unvoicedNonsilenceTime: 0.5180 → 0.5200; voicedRatio: 0.8008 → 0.8004; f0Mean: 135.3382 → 135.3387 |
| Say oh, ee, and oo again. | events: 61.0000 → 62.0000; totalTime: 2.0560 → 2.1100; voicedEvents: 52.0000 → 53.0000; voicedTime: 1.3090 → 1.3630; voicedRatio: 0.6367 → 0.6460; f0Mean: 147.4958 → 146.7183; f1MeanVoiced: 427.2454 → 430.3772; f2MeanVoiced: 1555.9563 → 1552.3008; b1MeanVoiced: 108.2019 → 107.6698; avMeanVoiced: 58.3846 → 58.3585 |
| Bob bought a big blue balloon. | totalTime: 2.1220 → 2.1180; voicedTime: 1.7410 → 1.7370; voicedRatio: 0.8205 → 0.8201; f0Mean: 127.9266 → 127.9541; f1MeanVoiced: 366.6832 → 366.7892; f2MeanVoiced: 1307.7719 → 1307.3042 |
| Pat tapped a pot and picked a paper cup. | totalTime: 2.7200 → 2.7180; unvoicedNonsilenceTime: 1.0020 → 1.0000; voicedRatio: 0.5026 → 0.5029; f0Mean: 145.3077 → 145.3191 |
| Gag, gang, and gunk go together. | totalTime: 2.8120 → 2.8110; voicedTime: 2.1330 → 2.1320; voicedRatio: 0.7585 → 0.7584; f0Mean: 130.9157 → 130.9178 |
| Layer, lawyer, royal, rural. | unchanged control |
| Nina mumbled many minimal numbers. | totalTime: 2.4720 → 2.4670; voicedTime: 2.0910 → 2.0860; voicedRatio: 0.8459 → 0.8456; f0Mean: 146.0465 → 146.0430; f1MeanVoiced: 382.0204 → 382.0286; f2MeanVoiced: 1403.3887 → 1403.1491 |
| Fresh frost forms on five fields. | totalTime: 3.0520 → 3.0500; voicedTime: 2.0840 → 2.0820; voicedRatio: 0.6828 → 0.6826; f0Mean: 135.0471 → 135.0507 |
| Vera vapes very vivid violets. | totalTime: 2.2460 → 2.2480; voicedTime: 1.5880 → 1.5900; voicedRatio: 0.7070 → 0.7073; f0Min: 115.1231 → 115.0885; f0Mean: 153.7189 → 153.7207; f0Span: 62.8769 → 62.9115 |
| Zesty zest is easy to spot. | totalTime: 2.4300 → 2.4580; voicedTime: 1.4940 → 1.5240; unvoicedNonsilenceTime: 0.5850 → 0.5830; voicedRatio: 0.6148 → 0.6200; f0Mean: 139.9624 → 140.0468 |
| Shy sharks shimmer in shallow shoals. | totalTime: 2.5650 → 2.5630; voicedTime: 1.5870 → 1.5850; voicedRatio: 0.6187 → 0.6184; f0Mean: 137.1379 → 137.1353 |
| They bathed the smooth leather. | unchanged control |
| S, f, sh, th, z, v, zh, dh. | unchanged control |
| Soft, safe, fuzzy, fussy, sassy, feisty, zesty, shifty. | totalTime: 4.9300 → 4.9240; unvoicedNonsilenceTime: 1.3570 → 1.3510; voicedRatio: 0.4746 → 0.4752; f0Mean: 136.7846 → 136.8270 |
