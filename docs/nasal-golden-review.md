# Nasal model corpus review

The pre-change golden passes on base f8d4d6da. Changed metrics are voiced F1/F2/B1 means in phrases containing nasals, plus the one reviewed event-count change below. Duration, F0, voicing, and amplitude metrics are unchanged within 1e-6; phrases without changed metrics remain controls. Changes follow the Recasens (1983) Table II murmur targets and their transitions, not a new stress policy.

In 'Gag, gang, and gunk go together.', changing NG's targets changes overlapping Holmes (1964) transition intersections in the following K_CL (holmes-transitions.ts). Its boundaries remain 1.469 and 1.518 seconds, including the 30 ms initial silence. Old internal knots at 1.493500/1.493824/1.496556 become 1.492931/1.497842, reducing 87 events to 86. This is an unvoiced closure: voiced-event counts and F0 statistics are unchanged. The review script permits only this exact count delta.

Run `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/review-nasal-goldens.ts --before <pre-change-summary.json>` to repeat the comparison; add `--write` to record a reviewed candidate. This is a track-metric review, not a listening test.

| Phrase | Metric changes |
| --- | --- |
| The quick brown fox jumps over the lazy dog. | f1MeanVoiced: 398.017123 → 397.116222; f2MeanVoiced: 1449.701018 → 1431.142459; b1MeanVoiced: 97.873874 → 91.612613 |
| She sells seashells by the seashore. | unchanged control |
| Thin thieves thought that they thrilled. | f2MeanVoiced: 1730.762350 → 1700.117188; b1MeanVoiced: 81.717742 → 77.169355 |
| Ship shape, sheep shop, and cheap chips. | f2MeanVoiced: 1956.553348 → 1874.256836; b1MeanVoiced: 102.244186 → 92.895349 |
| Sip zip, sip ship, sip sip. | unchanged control |
| A zoo can be fun on a sunny day. | f1MeanVoiced: 459.317094 → 455.142411; f2MeanVoiced: 1575.984463 → 1502.053662; b1MeanVoiced: 118.303797 → 103.253165 |
| He had your dark suit in greasy wash water all year. | f1MeanVoiced: 394.088816 → 396.516000; f2MeanVoiced: 1554.023078 → 1539.459971; b1MeanVoiced: 89.524272 → 87.242718 |
| Say oh, ee, and oo again. | f2MeanVoiced: 1647.883527 → 1537.683527; b1MeanVoiced: 122.810000 → 109.130000 |
| Bob bought a big blue balloon. | f2MeanVoiced: 1347.414244 → 1314.080911; b1MeanVoiced: 155.385965 → 150.438596 |
| Pat tapped a pot and picked a paper cup. | f2MeanVoiced: 1627.115164 → 1566.102233; b1MeanVoiced: 102.008621 → 95.077586 |
| Gag, gang, and gunk go together. | events: 87.000000 → 86.000000; f1MeanVoiced: 401.293842 → 406.488647; f2MeanVoiced: 1580.619621 → 1508.687803; b1MeanVoiced: 154.987013 → 143.662338 |
| Layer, lawyer, royal, rural. | unchanged control |
| Nina mumbled many minimal numbers. | f1MeanVoiced: 390.324646 → 381.698784; f2MeanVoiced: 1526.964343 → 1425.372964; b1MeanVoiced: 131.163793 → 104.163793 |
| Fresh frost forms on five fields. | f1MeanVoiced: 442.158823 → 440.205698; f2MeanVoiced: 1402.920626 → 1370.108126; b1MeanVoiced: 92.093750 → 81.781250 |
| Vera vapes very vivid violets. | unchanged control |
| Zesty zest is easy to spot. | unchanged control |
| Shy sharks shimmer in shallow shoals. | f1MeanVoiced: 433.563912 → 431.746191; f2MeanVoiced: 1480.257867 → 1452.563352; b1MeanVoiced: 80.088608 → 71.911392 |
| They bathed the smooth leather. | f1MeanVoiced: 371.957477 → 370.034400; f2MeanVoiced: 1623.886467 → 1615.040313; b1MeanVoiced: 88.592308 → 82.884615 |
| S, f, sh, th, z, v, zh, dh. | unchanged control |
| Soft, safe, fuzzy, fussy, sassy, feisty, zesty, shifty. | unchanged control |
