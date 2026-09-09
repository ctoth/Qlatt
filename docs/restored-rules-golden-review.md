# Restored-rule golden review (#219)

`transition_override` was declared with its citations but listed in no phase, so per-class transition durations (30 ms stops, 40 ms fricatives, 50 ms default; Stevens & House 1956, Hertz 1991) never reached lowering, which fell back to the tabulated Holmes durations or the 30 ms default. Restoring it moves Holmes transition knots, so event counts and voiced F1/F2/B1 means change. Because f0Mean and avMeanVoiced are event-weighted, new knots inside voiced segments re-weight them (observed at most 1.02 Hz and 0.28 dB; bounded at 1.5 Hz and 0.5 dB) while no F0 or AV value changes: f0Min, f0Max, f0Span, ahMeanVoiced, and every timing metric (totalTime, voicedTime, silenceTime, unvoicedNonsilenceTime, voicedRatio) are unchanged within 1e-6 on every phrase. The review script fails if any of those move or if the re-weighting exceeds the stated bounds.

`stress_spectral_tilt` (Sluijter & van Heuven 1996) changes TL on stressed vowels. The corpus summary does not measure TL; test/restored-rules.test.ts asserts the reduction directly. `dectalk_question_glide_reset` is dectalk-english only and is asserted in the same test file.

Two other pins moved for the same reason and were refreshed in the same change: the track-hash snapshots in test/__snapshots__/tone-association-compatibility.test.ts.snap (qlatt-english phrases, and the dectalk-english question phrase where the restored reset now returns the question_glide layer to zero at the '?' boundary), and the klatt80-baseline render hashes in test/voice-quality-port.test.ts (qlatt-beauty hashes are unchanged because beauty keeps its own phase lists).

The pre-change goldens pass on base 6a2e4e1c. Regenerate with `scripts/review-restored-rule-goldens.ts --before <pre-change summary> --before-tempo <pre-change tempo summary> --write`. This is a track-metric review, not a listening test.

## Linguistic baseline corpus (qlatt-english, base F0 110 Hz)

17 of 20 phrases changed; every change is in events, voicedEvents, f1MeanVoiced, f2MeanVoiced, b1MeanVoiced, f0Mean, avMeanVoiced.

Largest absolute change per metric: events 9.000000, voicedEvents 9.000000, f0Mean 0.917774, f1MeanVoiced 8.110729, f2MeanVoiced 24.233471, b1MeanVoiced 3.974194, avMeanVoiced 0.273201.

| Phrase | Metric changes |
| --- | --- |
| The quick brown fox jumps over the lazy dog. | events: 142.000000 → 147.000000; voicedEvents: 111.000000 → 116.000000; f0Mean: 132.143696 → 132.555453; f1MeanVoiced: 397.107887 → 399.816101; f2MeanVoiced: 1427.973629 → 1418.916792; b1MeanVoiced: 93.594595 → 92.711207; avMeanVoiced: 55.972973 → 56.163793 |
| She sells seashells by the seashore. | f0Mean: 135.228615 → 135.366599; f1MeanVoiced: 413.168960 → 417.942293; f2MeanVoiced: 1619.786583 → 1626.882139; b1MeanVoiced: 78.866667 → 78.100000; avMeanVoiced: 57.816667 → 57.833333 |
| Thin thieves thought that they thrilled. | events: 87.000000 → 90.000000; voicedEvents: 62.000000 → 65.000000; f0Mean: 132.842713 → 132.897442; f1MeanVoiced: 371.112694 → 376.374159; f2MeanVoiced: 1701.870593 → 1712.815540; b1MeanVoiced: 77.169355 → 77.769231; avMeanVoiced: 56.080645 → 56.353846 |
| Ship shape, sheep shop, and cheap chips. | f0Mean: 139.503512 → 139.530397; f1MeanVoiced: 420.302835 → 421.374263; f2MeanVoiced: 1881.768266 → 1880.039100; b1MeanVoiced: 93.202381 → 92.702381 |
| Sip zip, sip ship, sip sip. | unchanged control |
| A zoo can be fun on a sunny day. | events: 94.000000 → 100.000000; voicedEvents: 79.000000 → 85.000000; f0Mean: 126.778591 → 126.637836; f1MeanVoiced: 457.098012 → 465.208741; f2MeanVoiced: 1498.624412 → 1490.886218; b1MeanVoiced: 103.253165 → 106.582353; avMeanVoiced: 58.708861 → 58.941176 |
| He had your dark suit in greasy wash water all year. | events: 126.000000 → 129.000000; voicedEvents: 102.000000 → 105.000000; f0Mean: 134.742613 → 135.113810; f1MeanVoiced: 396.030830 → 392.831057; f2MeanVoiced: 1528.214392 → 1503.980921; b1MeanVoiced: 87.803922 → 86.995238; avMeanVoiced: 58.607843 → 58.619048 |
| Say oh, ee, and oo again. | events: 59.000000 → 61.000000; voicedEvents: 50.000000 → 52.000000; f0Mean: 145.922558 → 146.229999; f1MeanVoiced: 425.491513 → 432.761070; f2MeanVoiced: 1536.378409 → 1547.193182; b1MeanVoiced: 109.130000 → 108.971154; avMeanVoiced: 58.200000 → 58.346154 |
| Bob bought a big blue balloon. | events: 61.000000 → 63.000000; voicedEvents: 57.000000 → 59.000000; f0Mean: 126.375637 → 127.147457; f1MeanVoiced: 362.122528 → 361.508205; f2MeanVoiced: 1312.613453 → 1310.460455; b1MeanVoiced: 150.438596 → 149.347458; avMeanVoiced: 54.894737 → 55.101695 |
| Pat tapped a pot and picked a paper cup. | events: 118.000000 → 117.000000; voicedEvents: 55.000000 → 54.000000; f0Mean: 146.706533 → 145.788760; f1MeanVoiced: 440.683280 → 443.158897; f2MeanVoiced: 1558.847220 → 1561.332816; b1MeanVoiced: 95.900000 → 95.990741; avMeanVoiced: 59.400000 → 59.425926 |
| Gag, gang, and gunk go together. | events: 85.000000 → 86.000000; voicedEvents: 76.000000 → 77.000000; f0Mean: 130.908385 → 131.015447; f1MeanVoiced: 403.850183 → 410.657324; f2MeanVoiced: 1510.395247 → 1514.638490; b1MeanVoiced: 144.500000 → 146.883117; avMeanVoiced: 54.447368 → 54.623377 |
| Layer, lawyer, royal, rural. | events: 85.000000 → 83.000000; voicedEvents: 78.000000 → 76.000000; f0Mean: 130.561367 → 131.173093; f1MeanVoiced: 406.997378 → 411.201191; f2MeanVoiced: 1466.326862 → 1461.343556; b1MeanVoiced: 62.166667 → 62.072368; avMeanVoiced: 59.743590 → 59.750000 |
| Nina mumbled many minimal numbers. | events: 119.000000 → 128.000000; voicedEvents: 115.000000 → 124.000000; f0Mean: 145.348973 → 146.197940; f1MeanVoiced: 384.107418 → 383.672202; f2MeanVoiced: 1419.732370 → 1415.985666; b1MeanVoiced: 104.300000 → 108.274194; avMeanVoiced: 58.208696 → 58.370968 |
| Fresh frost forms on five fields. | events: 92.000000 → 95.000000; voicedEvents: 64.000000 → 67.000000; f0Mean: 134.599824 → 134.775000; f1MeanVoiced: 440.401653 → 440.199399; f2MeanVoiced: 1374.261964 → 1379.758425; b1MeanVoiced: 81.781250 → 82.253731; avMeanVoiced: 59.078125 → 59.149254 |
| Vera vapes very vivid violets. | events: 105.000000 → 104.000000; voicedEvents: 86.000000 → 85.000000; f0Mean: 154.379122 → 154.047842; f1MeanVoiced: 393.883050 → 398.484015; f2MeanVoiced: 1502.267456 → 1494.465956; b1MeanVoiced: 70.151163 → 69.776471; avMeanVoiced: 56.604651 → 56.564706 |
| Zesty zest is easy to spot. | unchanged control |
| Shy sharks shimmer in shallow shoals. | f0Mean: 137.386693 → 137.402183; f1MeanVoiced: 437.930265 → 440.065376; f2MeanVoiced: 1441.063400 → 1446.467955; b1MeanVoiced: 72.520000 → 72.626667; avMeanVoiced: 60.040000 → 60.080000 |
| They bathed the smooth leather. | events: 72.000000 → 73.000000; voicedEvents: 65.000000 → 66.000000; f0Mean: 136.775428 → 137.421782; f1MeanVoiced: 370.531557 → 372.296231; f2MeanVoiced: 1609.385030 → 1608.824272; b1MeanVoiced: 82.884615 → 82.090909; avMeanVoiced: 55.646154 → 55.742424 |
| S, f, sh, th, z, v, zh, dh. | unchanged control |
| Soft, safe, fuzzy, fussy, sassy, feisty, zesty, shifty. | f0Mean: 137.975951 → 137.919743; f1MeanVoiced: 462.912029 → 463.550918; f2MeanVoiced: 1797.069369 → 1792.600007; b1MeanVoiced: 63.568182 → 62.825758 |

## Crystal & House 1982 fast-tempo corpus (rate 111.6/93.4)

17 of 20 phrases changed; every change is in events, voicedEvents, f1MeanVoiced, f2MeanVoiced, b1MeanVoiced, f0Mean, avMeanVoiced.

Largest absolute change per metric: events 5.000000, voicedEvents 5.000000, f0Mean 1.013062, f1MeanVoiced 8.920421, f2MeanVoiced 8.570339, b1MeanVoiced 4.015919, avMeanVoiced 0.128987.

| Phrase | Metric changes |
| --- | --- |
| The quick brown fox jumps over the lazy dog. | events: 148.000000 → 147.000000; voicedEvents: 117.000000 → 116.000000; f0Mean: 132.010681 → 132.132924; f1MeanVoiced: 395.302396 → 398.460465; f2MeanVoiced: 1425.241362 → 1430.302056; b1MeanVoiced: 93.880342 → 94.750000; avMeanVoiced: 56.068376 → 56.051724 |
| She sells seashells by the seashore. | events: 84.000000 → 83.000000; voicedEvents: 63.000000 → 62.000000; f0Mean: 134.363155 → 134.867572; f1MeanVoiced: 411.386196 → 412.600722; f2MeanVoiced: 1639.101276 → 1647.671615; b1MeanVoiced: 77.650794 → 76.870968; avMeanVoiced: 57.952381 → 57.870968 |
| Thin thieves thought that they thrilled. | f0Mean: 133.337069 → 133.587167; f1MeanVoiced: 376.223314 → 377.547933; f2MeanVoiced: 1700.391572 → 1700.029927; b1MeanVoiced: 76.530769 → 77.823077 |
| Ship shape, sheep shop, and cheap chips. | f0Mean: 138.476519 → 138.515543; f1MeanVoiced: 419.150412 → 420.725306; f2MeanVoiced: 1840.383174 → 1837.730545; b1MeanVoiced: 93.202381 → 92.702381 |
| Sip zip, sip ship, sip sip. | unchanged control |
| A zoo can be fun on a sunny day. | f0Mean: 126.813818 → 127.077551; f1MeanVoiced: 456.705595 → 459.046858; f2MeanVoiced: 1506.554054 → 1503.495890; b1MeanVoiced: 101.459770 → 105.281609 |
| He had your dark suit in greasy wash water all year. | events: 132.000000 → 128.000000; voicedEvents: 108.000000 → 104.000000; f0Mean: 135.169326 → 135.338221; f1MeanVoiced: 392.398995 → 390.957277; f2MeanVoiced: 1509.507042 → 1516.480277; b1MeanVoiced: 85.981481 → 87.168269; avMeanVoiced: 58.750000 → 58.634615 |
| Say oh, ee, and oo again. | f0Mean: 147.303754 → 147.495797; f1MeanVoiced: 423.471891 → 427.245410; f2MeanVoiced: 1551.346865 → 1550.187072; b1MeanVoiced: 106.855769 → 108.201923 |
| Bob bought a big blue balloon. | f0Mean: 127.767101 → 127.924826; f1MeanVoiced: 364.051505 → 364.279726; f2MeanVoiced: 1312.839050 → 1311.893507; b1MeanVoiced: 147.033898 → 149.347458 |
| Pat tapped a pot and picked a paper cup. | events: 117.000000 → 116.000000; voicedEvents: 53.000000 → 52.000000; f0Mean: 146.320757 → 145.307695; f1MeanVoiced: 435.423965 → 438.663619; f2MeanVoiced: 1560.536927 → 1562.518372; b1MeanVoiced: 101.405660 → 101.605769; avMeanVoiced: 59.264151 → 59.288462 |
| Gag, gang, and gunk go together. | events: 88.000000 → 87.000000; voicedEvents: 79.000000 → 78.000000; f0Mean: 130.673104 → 130.915688; f1MeanVoiced: 402.741540 → 405.723597; f2MeanVoiced: 1519.652150 → 1519.460621; b1MeanVoiced: 144.835443 → 148.846154; avMeanVoiced: 54.569620 → 54.525641 |
| Layer, lawyer, royal, rural. | events: 86.000000 → 81.000000; voicedEvents: 79.000000 → 74.000000; f0Mean: 132.024467 → 131.158223; f1MeanVoiced: 399.005535 → 407.925955; f2MeanVoiced: 1451.207765 → 1453.681936; b1MeanVoiced: 61.816456 → 61.729730; avMeanVoiced: 59.784810 → 59.824324 |
| Nina mumbled many minimal numbers. | events: 126.000000 → 125.000000; voicedEvents: 122.000000 → 121.000000; f0Mean: 145.729333 → 146.046468; f1MeanVoiced: 380.563773 → 382.020353; f2MeanVoiced: 1402.656182 → 1403.388720; b1MeanVoiced: 104.426230 → 108.442149; avMeanVoiced: 58.393443 → 58.396694 |
| Fresh frost forms on five fields. | events: 96.000000 → 95.000000; voicedEvents: 68.000000 → 67.000000; f0Mean: 134.902377 → 135.047099; f1MeanVoiced: 436.599309 → 437.841448; f2MeanVoiced: 1366.638370 → 1369.694276; b1MeanVoiced: 80.941176 → 82.253731; avMeanVoiced: 59.205882 → 59.149254 |
| Vera vapes very vivid violets. | events: 104.000000 → 102.000000; voicedEvents: 85.000000 → 83.000000; f0Mean: 153.733732 → 153.718939; f1MeanVoiced: 395.459334 → 397.231235; f2MeanVoiced: 1483.226996 → 1474.809897; b1MeanVoiced: 70.858824 → 70.373494; avMeanVoiced: 56.647059 → 56.518072 |
| Zesty zest is easy to spot. | unchanged control |
| Shy sharks shimmer in shallow shoals. | events: 101.000000 → 99.000000; voicedEvents: 75.000000 → 73.000000; f0Mean: 136.772728 → 137.137860; f1MeanVoiced: 433.396912 → 436.294723; f2MeanVoiced: 1458.525241 → 1463.285412; b1MeanVoiced: 72.120000 → 72.616438; avMeanVoiced: 60.186667 → 60.164384 |
| They bathed the smooth leather. | events: 73.000000 → 72.000000; voicedEvents: 66.000000 → 65.000000; f0Mean: 137.235958 → 137.606498; f1MeanVoiced: 369.653496 → 372.686887; f2MeanVoiced: 1587.077089 → 1592.125780; b1MeanVoiced: 84.507576 → 82.846154; avMeanVoiced: 55.727273 → 55.692308 |
| S, f, sh, th, z, v, zh, dh. | unchanged control |
| Soft, safe, fuzzy, fussy, sassy, feisty, zesty, shifty. | f0Mean: 136.868799 → 136.784639; f1MeanVoiced: 464.210114 → 466.640151; f2MeanVoiced: 1781.870874 → 1777.392958; b1MeanVoiced: 63.463235 → 62.742647 |
