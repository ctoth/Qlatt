# Duration table corpus review

Chen (1970), Table V, p.138 reports English vowel means of 146 ms before
voiceless consonants and 238 ms before voiced consonants. This change uses their
ratio to calibrate the existing adjacent-stop duration rule. Applying an
aggregate measurement to that branch is an engineering adaptation, not a claim
that the paper tabulates this synthesizer's individual contexts.

The rule preserves the existing voiced-stop reference and inverts Klatt's
floor-aware multiplication so the ratio acts on total duration. Floors,
millisecond rounding, and later stress/boundary rules can limit the final ratio.
The focused test isolates the rule and checks explicit and default floors.

Compared against base `1af37573`, whose unchanged corpus golden passes. The
summary golden and four affected full-track hashes are regenerated; all other
compatibility hashes remain unchanged.

Active Segment indices are zero-based. All changed segment durations are listed; phoneme sequences are unchanged.

| Frontend | Phrase | Duration changes |
| --- | --- | --- |
| qlatt-english | The quick brown fox jumps over the lazy dog. | 1:AH 37 → 30 ms; 6:IH 102 → 89 ms; 15:AA 184 → 161 ms |
| qlatt-english | She sells seashells by the seashore. | unchanged |
| qlatt-english | Thin thieves thought that they thrilled. | 8:AO 164 → 143 ms; 13:AE 161 → 138 ms |
| qlatt-english | Ship shape, sheep shop, and cheap chips. | 1:IH 102 → 89 ms; 13:IY 154 → 134 ms; 18:AA 230 → 200 ms; 28:IY 154 → 134 ms; 32:IH 141 → 122 ms |
| qlatt-english | Sip zip, sip ship, sip sip. | 1:IH 102 → 89 ms; 6:IH 128 → 111 ms; 12:IH 102 → 89 ms; 17:IH 128 → 111 ms; 23:IH 141 → 122 ms; 28:IH 132 → 113 ms |
| qlatt-english | A zoo can be fun on a sunny day. | 2:UW 184 → 161 ms |
| qlatt-english | He had your dark suit in greasy wash water all year. | unchanged |
| qlatt-english | Say oh, ee, and oo again. | unchanged |
| qlatt-english | Bob bought a big blue balloon. | unchanged |
| qlatt-english | Pat tapped a pot and picked a paper cup. | 3:AE 152 → 129 ms; 8:AE 152 → 129 ms; 13:AH 34 → 26 ms; 25:IH 89 → 75 ms; 30:AH 34 → 26 ms; 44:AH 119 → 99 ms |
| qlatt-english | Gag, gang, and gunk go together. | unchanged |
| qlatt-english | Layer, lawyer, royal, rural. | unchanged |
| qlatt-english | Nina mumbled many minimal numbers. | unchanged |
| qlatt-english | Fresh frost forms on five fields. | unchanged |
| qlatt-english | Vera vapes very vivid violets. | 26:AH 34 → 27 ms |
| qlatt-english | Zesty zest is easy to spot. | 17:IY 48 → 38 ms; 26:AA 214 → 178 ms |
| qlatt-english | Shy sharks shimmer in shallow shoals. | unchanged |
| qlatt-english | They bathed the smooth leather. | unchanged |
| qlatt-english | S, f, sh, th, z, v, zh, dh. | unchanged |
| qlatt-english | Soft, safe, fuzzy, fussy, sassy, feisty, zesty, shifty. | unchanged |
| qlatt-english | The cat sat. | 1:AH 37 → 30 ms; 5:AE 152 → 129 ms; 10:AE 240 → 207 ms |
| qlatt-english | Did Bob buy a blue balloon? | unchanged |
| qlatt-english | Gag, gang; go! | unchanged |
| qlatt-english | sip sip. | 1:IH 141 → 122 ms; 6:IH 132 → 113 ms |
| qlatt-beauty | The cat sat. | 1:AH 37 → 30 ms; 5:AE 142 → 118 ms; 10:AE 206 → 171 ms |
| qlatt-beauty | Did Bob buy a blue balloon? | unchanged |
| qlatt-beauty | Gag, gang; go! | unchanged |
| qlatt-beauty | sip sip. | 1:IH 122 → 101 ms; 6:IH 122 → 101 ms |
| dectalk-english | The cat sat. | unchanged |
| dectalk-english | Did Bob buy a blue balloon? | unchanged |
| dectalk-english | Gag, gang; go! | unchanged |
| dectalk-english | sip sip. | unchanged |
