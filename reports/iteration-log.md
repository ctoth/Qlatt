# DECtalk convergence iteration log

This ledger tracks kept or reverted source slices for the DECtalk convergence work.
The failure count is the corpus convergence warning count, not command execution
failures. A phrase with a convergence warning is treated as not passing the current
gate.

| Iteration | Start | End | Result | Commit |
| --- | ---: | ---: | --- | --- |
| 001 | 46 / 50 not passing | 46 / 50 not passing | F2 meanAbs down to `148.67747563128384`; rejected broad locus ramp candidate first (`46` -> `47` warnings), then kept F2-only locus ramp | this commit |
| 002 | 46 / 50 not passing | 46 / 50 not passing | F2 meanAbs down to `146.8509545970659`; terminal stop-closure silence no longer inherits closure F2 locus | this commit |
| 003 | 46 / 50 not passing | 46 / 50 not passing | F2 meanAbs down to `146.40834089282495`; F2 uses DECtalk sonorant-consonant-to-vowel 25/75 forward smoothing | this commit |
| 004 | 46 / 50 not passing | 46 / 50 not passing | F2 meanAbs down to `146.1441958925807`; F2 uses DECtalk vowel-to-sonorant-consonant 75/25 backward smoothing | this commit |
| 005 | 46 / 50 not passing | 46 / 50 not passing | F2 meanAbs down to `134.7050002209104`; unstressed non-obstruents use DECtalk Rule 7 `durmin` floor adjustment | this commit |
| 006 | 46 / 50 not passing | 46 / 50 not passing | Rejected postvocalic `LL -> LX`: raw target worsened target phrase F2 to `283.51007311986257`; timing-preserved rewrite still worsened to `268.81221886885044` from `265.26930388909314` | report-only |
| 007 | 46 / 50 not passing | 46 / 50 not passing | Rejected source-faithful `LL` inventory target: removed token mismatch but shortened final `LL` from `219ms` to `41ms` and worsened target phrase F2 to `277.0227104825` from `265.26930388909335` | report-only |
| 008 | 46 / 50 not passing | 46 / 50 not passing | Rejected syllable-stress lookup in duration Rule 7: syntax-corrected one-phrase runs were byte-identical for `glide-young-yard`, leaving F2 meanAbs at `265.26930388909335` | report-only |
| 009 | 46 / 50 not passing | 46 / 50 not passing | Rejected explicit syllable-stress annotation: target phrase improved to `219.3462750582751`, but first-five weighted F2 regressed `96.22480940034815` -> `96.89979799460761` and weighted abs duration delta regressed `0.0027894088669951317` -> `0.028250738916256183` | report-only |
| 010 | 46 / 50 not passing | 46 / 50 not passing | Kept onset-`Y` stress propagation: full-corpus F2 meanAbs improved `134.70500022091034` -> `132.74605745805388`; target phrase `glide-young-yard` improved `265.26930388909335` -> `218.1787738927739`; pass/warn status unchanged | this commit |
| 011 | 46 / 50 not passing | 46 / 50 not passing | Rejected global `OW` F2 up-glide: target phrase `vowels-boat-bought` improved `250.9756398642534` -> `245.341024479638`, but 10-phrase F2 regressed `157.09181206763927` -> `161.6073251941309` | report-only |
| 012 | 46 / 50 not passing | 46 / 50 not passing | Kept initial-silence formant preconditioning: full-corpus F2 meanAbs improved `132.74605745805388` -> `129.2832193319339`; frame-0 F2 max-error phrases dropped `15` -> `1`; pass/warn status unchanged | this commit |
| 013 | 46 / 50 not passing | 46 / 50 not passing | Rejected global smoothing-over-control precedence: target phrase `vowels-boat-bought` improved `243.19679371040723` -> `232.09996953458307`, but 10-phrase F2 regressed `155.3891867693099` -> `156.07777602287345` | report-only |
| 014 | 46 / 50 not passing | 46 / 50 not passing | Kept narrow `OW -> T` late F2 locus window: full-corpus F2 meanAbs improved `129.2832193319339` -> `129.0926740635663`; target phrase `vowels-boat-bought` improved `243.19679371040723` -> `236.03974242835596`; first 5 and first 10 F2 gates unchanged | this commit |
| 015 | 46 / 50 not passing | 46 / 50 not passing | Kept segment-aware trace diagnostic: headline F2 unchanged at `129.0926740635663`; full-corpus F2 is now split into same-segment `120.65204164209926` over `9167` frames, different-segment `166.63562931632393` over `2402` frames, and unknown `43.74` over `150` frames | this commit |
| 016 | 46 / 50 not passing | 46 / 50 not passing | Kept max-error segment phase attribution: headline/same-segment F2 unchanged, and `vowels-boat-bought` same-segment AH max is now shown as oracle phase `0.25000000000000056` vs Qlatt phase `0.9592592592592597`, proving that hotspot is timing/phase divergence rather than a pure AH target mismatch | this commit |
| 017 | 46 / 50 not passing | 46 / 50 not passing | Kept phase-aligned target ranking utility; selected `g2p-measure` ER/ER/ER F3 as the next clean candidate (`625.715` same-segment meanAbs, oracle `1619`, Qlatt `2500`, phase delta `-0.0005`) | this commit |
