# Duration table corpus review

Chen (1970), Table V, p.138 reports English vowel means of 146 ms before voiceless consonants and 238 ms before voiced consonants. Their ratio calibrates the existing adjacent-stop rule. Applying aggregate measurements to that branch is an engineering adaptation, not a claim that the paper tabulates each synthesizer context.

The rule preserves the voiced-stop reference and inverts Klatt's floor-aware multiplication so the ratio acts on total duration. Floors, millisecond rounding, and later stress/boundary rules can limit the final ratio. Focused regressions isolate the rule and cover explicit, zero, and default floors.

This final comparison uses master `1ac9c8b8`, including #61's per-phone floors. Its declared floors take precedence over the class fallback in the ratio calculation. The corpus summary and four affected compatibility hashes are regenerated; the other eight hashes remain unchanged relative to that base.

Active Segment indices are zero-based. All changed segment durations are listed; phoneme sequences are unchanged.

| Frontend | Rate | Phrase | Duration changes |
| --- | --- | --- | --- |
| qlatt-english | 1 | The quick brown fox jumps over the lazy dog. | 1:AH 33 → 30 ms; 6:IH 103 → 96 ms; 15:AA 186 → 162 ms |
| qlatt-english | 1 | She sells seashells by the seashore. | unchanged |
| qlatt-english | 1 | Thin thieves thought that they thrilled. | 8:AO 164 → 143 ms; 13:AE 160 → 142 ms |
| qlatt-english | 1 | Ship shape, sheep shop, and cheap chips. | 1:IH 103 → 96 ms; 13:IY 155 → 139 ms; 18:AA 231 → 201 ms; 28:IY 155 → 139 ms; 32:IH 150 → 138 ms |
| qlatt-english | 1 | Sip zip, sip ship, sip sip. | 1:IH 103 → 96 ms; 6:IH 134 → 124 ms; 12:IH 103 → 96 ms; 17:IH 134 → 124 ms; 23:IH 150 → 138 ms; 28:IH 140 → 129 ms |
| qlatt-english | 1 | A zoo can be fun on a sunny day. | 2:UW 185 → 169 ms |
| qlatt-english | 1 | He had your dark suit in greasy wash water all year. | unchanged |
| qlatt-english | 1 | Say oh, ee, and oo again. | unchanged |
| qlatt-english | 1 | Bob bought a big blue balloon. | unchanged |
| qlatt-english | 1 | Pat tapped a pot and picked a paper cup. | 3:AE 150 → 132 ms; 8:AE 150 → 132 ms; 13:AH 28 → 24 ms; 25:IH 87 → 79 ms; 30:AH 28 → 24 ms; 44:AH 120 → 99 ms |
| qlatt-english | 1 | Gag, gang, and gunk go together. | unchanged |
| qlatt-english | 1 | Layer, lawyer, royal, rural. | unchanged |
| qlatt-english | 1 | Nina mumbled many minimal numbers. | unchanged |
| qlatt-english | 1 | Fresh frost forms on five fields. | unchanged |
| qlatt-english | 1 | Vera vapes very vivid violets. | 26:AH 29 → 26 ms |
| qlatt-english | 1 | Zesty zest is easy to spot. | 17:IY 39 → 35 ms; 26:AA 215 → 179 ms |
| qlatt-english | 1 | Shy sharks shimmer in shallow shoals. | unchanged |
| qlatt-english | 1 | They bathed the smooth leather. | unchanged |
| qlatt-english | 1 | S, f, sh, th, z, v, zh, dh. | unchanged |
| qlatt-english | 1 | Soft, safe, fuzzy, fussy, sassy, feisty, zesty, shifty. | unchanged |
| qlatt-english | 1 | The cat sat. | 1:AH 33 → 30 ms; 5:AE 150 → 132 ms; 10:AE 248 → 224 ms |
| qlatt-english | 1 | Did Bob buy a blue balloon? | unchanged |
| qlatt-english | 1 | Gag, gang; go! | unchanged |
| qlatt-english | 1 | sip sip. | 1:IH 150 → 138 ms; 6:IH 140 → 129 ms |
| qlatt-beauty | 1 | The cat sat. | 1:AH 37 → 30 ms; 5:AE 142 → 118 ms; 10:AE 206 → 171 ms |
| qlatt-beauty | 1 | Did Bob buy a blue balloon? | unchanged |
| qlatt-beauty | 1 | Gag, gang; go! | unchanged |
| qlatt-beauty | 1 | sip sip. | 1:IH 122 → 101 ms; 6:IH 122 → 101 ms |
| dectalk-english | 1 | The cat sat. | unchanged |
| dectalk-english | 1 | Did Bob buy a blue balloon? | unchanged |
| dectalk-english | 1 | Gag, gang; go! | unchanged |
| dectalk-english | 1 | sip sip. | unchanged |
