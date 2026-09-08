# Duration table corpus review

## Klatt 1975 Table I

The final comparison uses Peterson commit `b67810f9`, including the per-phone floors from #61. Both reports were regenerated; their listed VOT deltas are unchanged after that integration.

The 18 voiceless rows replace place-only VOT targets for prestressed word-initial English onsets. VOT is the total release-plus-aspiration interval. The existing inventory proportions allocate that total between two segments; this allocation and the 5 ms segment floor are engineering choices, not additional measurements from the paper. Integer allocation preserves each measured total exactly.

The existing /s/-cluster duration override now preserves a table-selected interval. The broad /t/-glottalization rule also preserves oral stops before prestressed /r, w/, so the measured /tr, tw, str/ rows can apply. `test/klatt-vot-table.test.ts` covers all rows, inherited Beauty behavior, cross-word /s/, and unchanged medial/unstressed controls. The latter controls were also run on the parent commit before publication.

Other contexts retain the existing Lisker & Abramson policy. Voiced stops retain their current voicing model; this change does not implement positive voicing lag for them. Cho & Ladefoged (1999) supplies the cross-language/place context citation, while the numeric English targets come from Klatt (1975), Table I and its prestressed-cluster appendix instruction.

The default and fast corpus summaries were regenerated. The compatibility hashes change only for English and Beauty “The cat sat.”, with the /k/ release changing 13 → 21 ms and aspiration 30 → 49 ms. The ten other compatibility hashes, including all DECtalk controls, remain unchanged. The fast-rate report is in `klatt-1975-fast-duration-review.md`.

Active Segment indices are zero-based. All changed segment durations are listed; phoneme sequences are unchanged.

| Frontend | Rate | Phrase | Duration changes |
| --- | --- | --- | --- |
| qlatt-english | 1 | The quick brown fox jumps over the lazy dog. | 3:K_REL 13 → 28 ms; 4:K_ASP 30 → 66 ms |
| qlatt-english | 1 | She sells seashells by the seashore. | unchanged |
| qlatt-english | 1 | Thin thieves thought that they thrilled. | unchanged |
| qlatt-english | 1 | Ship shape, sheep shop, and cheap chips. | unchanged |
| qlatt-english | 1 | Sip zip, sip ship, sip sip. | unchanged |
| qlatt-english | 1 | A zoo can be fun on a sunny day. | 4:K_REL 13 → 21 ms; 5:K_ASP 30 → 49 ms |
| qlatt-english | 1 | He had your dark suit in greasy wash water all year. | unchanged |
| qlatt-english | 1 | Say oh, ee, and oo again. | unchanged |
| qlatt-english | 1 | Bob bought a big blue balloon. | unchanged |
| qlatt-english | 1 | Pat tapped a pot and picked a paper cup. | 2:P_ASP 26 → 42 ms; 6:T_REL 8 → 14 ms; 7:T_ASP 31 → 51 ms; 16:P_ASP 26 → 42 ms; 24:P_ASP 26 → 42 ms; 33:P_ASP 26 → 42 ms; 42:K_REL 13 → 21 ms; 43:K_ASP 30 → 49 ms |
| qlatt-english | 1 | Gag, gang, and gunk go together. | unchanged |
| qlatt-english | 1 | Layer, lawyer, royal, rural. | unchanged |
| qlatt-english | 1 | Nina mumbled many minimal numbers. | unchanged |
| qlatt-english | 1 | Fresh frost forms on five fields. | unchanged |
| qlatt-english | 1 | Vera vapes very vivid violets. | unchanged |
| qlatt-english | 1 | Zesty zest is easy to spot. | 19:T_REL 8 → 14 ms; 20:T_ASP 31 → 51 ms; 25:P_ASP 10 → 7 ms |
| qlatt-english | 1 | Shy sharks shimmer in shallow shoals. | unchanged |
| qlatt-english | 1 | They bathed the smooth leather. | unchanged |
| qlatt-english | 1 | S, f, sh, th, z, v, zh, dh. | unchanged |
| qlatt-english | 1 | Soft, safe, fuzzy, fussy, sassy, feisty, zesty, shifty. | unchanged |
| qlatt-english | 1 | The cat sat. | 3:K_REL 13 → 21 ms; 4:K_ASP 30 → 49 ms |
| qlatt-english | 1 | Did Bob buy a blue balloon? | unchanged |
| qlatt-english | 1 | Gag, gang; go! | unchanged |
| qlatt-english | 1 | sip sip. | unchanged |
| qlatt-beauty | 1 | The cat sat. | 3:K_REL 13 → 21 ms; 4:K_ASP 30 → 49 ms |
| qlatt-beauty | 1 | Did Bob buy a blue balloon? | unchanged |
| qlatt-beauty | 1 | Gag, gang; go! | unchanged |
| qlatt-beauty | 1 | sip sip. | unchanged |
| dectalk-english | 1 | The cat sat. | unchanged |
| dectalk-english | 1 | Did Bob buy a blue balloon? | unchanged |
| dectalk-english | 1 | Gag, gang; go! | unchanged |
| dectalk-english | 1 | sip sip. | unchanged |
