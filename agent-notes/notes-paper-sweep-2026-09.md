# Paper sweep 2026-09-08 (foreman notes)

Task: retrieve + read ~132 papers from the reviewer's gap list, light flow (retriever -> reader -> tag -> reconcile, no propstore).
Sonnet for retrieval/reconcile, Opus for reading.

Master list: scratchpad/master-list.md (R001-R132, L001-L005 local PDFs).
Retrieval reports: scratchpad/retrieval/batch-NN.md
Reading reports: scratchpad/reading/<dir>.md

## State
- 2026-09-08: 13 Sonnet retrieval agents dispatched (ret-01..ret-13), open-access only; sci-hub deferred to a serialized pass.
- Local loose PDFs in papers/ root: coker1976 (10pp), ishizaka1972 (36pp), LucJASA1993 (8pp), 1991-ifaproc15-Boersma (30pp), rosenberg_JASA_1971 (?). None have directories yet. Reader agents dispatched for these.
- Already in collection: Grabe & Low 2002.
- Kestrel duplicate: Ebden_2014_KestrelTextNormalization (no abstract/citations/metadata) vs Ebden_2015_KestrelTextNormalization (fuller). Same paper (NLE 21(3), online 2014). Resolve at the end: keep 2015, fold/remove 2014 after checking index.md and cross-refs.

## Concurrency rules
- Readers skip Step 7 (reconcile), Step 8 (index.md) and 8.5 (ledger); foreman runs those sequentially per wave.
- keymap build is a full rebuild; fine to run at the end.
- No git stash/restore/checkout/reset/clean anywhere.

## Blockers
- none yet
- Readers dispatched (Opus): read-coker1976, read-ishizaka1972, read-luc1993, read-boersma1991.
- rosenberg_JASA_1971.pdf at papers/ root duplicates Rosenberg_1971_EffectGlottalPulseShape; handle at cleanup.

## Retrieval results log
- batch-02 done: OK R018 R019. SCIHUB queue: R015 Arvaniti1998, R017 Whalen1995, R012 Prom-on 2009 (paywalled). R011 Xu 2005: my DOI was wrong (resolves to another paper); redo via title "Speech melody as articulatorily implemented communicative functions" in sci-hub pass. R020 Campbell&Beckman search hit rate-limits (arxiv 429, S2 refused); retry later. Books R013 R014 R016 NOT-FOUND as expected.
- batch-05 done: OK R042 Smith2005, R047 Hillenbrand2009. SCIHUB queue: R043 Diehl2004, R045 Grey1977, R046 McAdams1995, R048 Skuk2014, R049 Munson2007, R050 Myers2012. R051 Prame 1994: my DOI wrong; redo by title "Measurements of the vibrato rate of ten singers" (JASA 96(4) 1994). R044 Bregman book NOT-FOUND.
- NOTE: arxiv 429 / S2 connection refused seen by several workers: 13 parallel workers are rate-limiting the search services. Title-search NOT-FOUNDs from this wave are unreliable; re-run those in the serialized pass.
- batch-04 done: OK R040 ITU-R MUSHRA, R041 ITU-T P.800. SCIHUB queue: R031 Zwicker1961, R032 Moore1983, R033 Syrdal1986, R034 Traunmuller1981 (dirname has umlaut - rename to Traunmuller_ in pass), R036 Remez1981, R037 Pisoni1985, R038 Kubichek1993. Title-search retry: R035 Patterson1992, R039 Blizzard2005 (ISCA archive direct: https://www.isca-archive.org/interspeech_2005/black05_interspeech.pdf).
- batch-03 done: zero OA hits. SCIHUB queue: R021 Lindblom1963, R022 Lindblom1990 (Springer chapter), R023 Picheny1985, R024 Picheny1986 (dirnames collide - suffix I / II), R025 Moon1994, R026 Bradlow2003, R027 Fougeron1997, R028 deJong1995 (dirname should be DeJong_1995_...), R030 Gay1968. R029 Lehiste&Peterson 1961: my DOI wrong (resolved to Peterson&Lehiste 1960 already in collection); redo by title "Transitions, glides, and diphthongs" JASA 33(3).
- batch-09 done: OK R090 Birkholz2013. SCIHUB queue: R083 Smith1992, R084 Cook1993, R085 Valimaki2006, R087 Mullen2006, R088 Maeda1982, R089 Story2005, R092 Takemoto2010. R091 Arnela 2013: my DOI wrong; redo by title. R086 Bilbao book NOT-FOUND.
- batch-08 done: OK R082 Titze2008. SCIHUB queue: R076 Sondhi&Schroeter1987, R078 Hawks&Miller1995, R079 Chi2007, R080 Lulich2010, R081 Dang&Honda1997. R075 Sondhi 1974: my DOI wrong; redo by title "Model for wave propagation in a lossy vocal tract". R077 Fant 1972 KTH URL returned 500; retry later (alt: https://www.speech.kth.se/prod/publications/files/qpsr/1972/1972_13_2-3_028-052.pdf). R073 R074 NOT-FOUND expected.
- Wrong-DOI tally so far (mine): R011, R029, R051, R075, R091. Route all of these by exact title in the sci-hub pass; sci-hub also accepts titles poorly, so first resolve DOI via crossref: curl "https://api.crossref.org/works?query.bibliographic=<title>&rows=3".
- batch-07 done: zero OK. SCIHUB queue: R062 Alku1992 (S2 says 1991), R069 Traunmuller&Eriksson2000, R071 Delattre&Freeman1968 (fix dirname: Delattre_1968_DialectStudyAmericanR). Wrong DOI (mine): R064 Wong/Markel/Gray 1979, R070 Junqua 1993 -> resolve via crossref by title. Retry: R066 Vallabha&Tuller 2002 (DOI 404 at S2; try crossref), R063 Alku 2011 (OA at ias.ac.in but DNS failed in worker env; try from foreman shell: https://www.ias.ac.in/article/fulltext/sadh/036/05/0623-0650). Books NOT-FOUND: R065 R067 R068 R072.
- batch-01 done: OK R002 Morise WORLD. SCIHUB queue: R001 Kawahara1999, R003 Raitio2011, R004 Juvela2019 (arXiv id I gave was wrong; use DOI), R005 Moulines1990, R006 Hunt&Black1996, R007 Zen2009 (journal DOI), R009 Stylianou2001, R010 McAulay1986. Retry: R008 Festival 1998 (try https://www.cstr.ed.ac.uk/downloads/publications/1998/Taylor_1998_a.pdf or ISCA archive ssw3).
- Foreman direct pulls: OK Taylor_1998_FestivalArchitecture (R008, ISCA), Black_2005_BlizzardChallenge2005 (R039, ISCA). Both hand metadata.
- Springer OA link for Alku 2011 served an HTML challenge page, removed. ias.ac.in DNS fails here. Add R063 to the sci-hub/browser pass (browser may pass the Springer challenge).
- KTH speech.kth.se returns 500 (server down): R077 Fant 1972 deferred; retry at end.
- nime.org reachable via PowerShell Invoke-WebRequest (curl in Git Bash exit 43 on some hosts): R115 Cook 2001 direct at https://www.nime.org/proceedings/2001/nime2001_003.pdf if batch 12 misses it.
- batches 10,11,12,13 done. OK: R093 McIntyre1983 (worker fixed DOI->10.1121/1.390157), R101 Puckette1995 (ps->pdf), R102 Serra1990, R107 CREPE, R108 Auger1995, R121 Bisani2008, R125 LPCNet. Foreman: R117 Schroder2001 (ISCA), R115 Cook2001 (NIME).
- Crossref-corrected DOIs: R011 10.1016/j.specom.2005.02.014; R029 10.1121/1.1908638; R051 10.1121/1.410141; R064 10.1109/tassp.1979.1163260; R070 10.1121/1.405631; R075 10.1121/1.1914649; R091 10.1121/1.4818756; R127 10.1038/25725; R130 10.1121/1.1916020; R066 10.1016/s0167-6393(01)00049-8; R094 10.1121/1.406857; R099 10.2307/3679810; R035 10.1016/b978-0-08-041847-6.50054-x; R014 10.1017/cbo9780511627736.005. Substitutes: R112 -> Verfaille 2008 JASA 10.1121/1.2935475; R100 -> Tempelaars 1977 Interface 10.1080/09298217708570235; R096 -> Drioli&Avanzini 2002 MedEngPhys 10.1016/s1350-4533(02)00057-7.
- Not indexed anywhere (skip unless web search finds copy): R016 Liberman&Pierrehumbert 1984, R053 Ladefoged 1983, R104 Talkin RAPT, R122 Riley 1992, R116 Cahn 1990, R020 Campbell&Beckman 1997 (crossref only has JASA abstract).
- Batch 06 still running. Reader luc1993 done: Lucero_1993_TwoMassModelBifurcations.
- NEXT: sci-hub queue file scratchpad/scihub-queue.md; 2 sci-hub agents at a time; reading wave 1 on the ~20 OK PDFs.
- batch-06 done: SCIHUB: R054 Gordon2001, R055 Esling2005, R056 Garellek2022, R059 HemanAckah2002, R060 Hillenbrand1987. R061 Mehta DOI corrected -> 10.1109/aspaa.2005.1540204. R057 Kreiman2014 OA but PMC blocked from shell -> browser. R058 VoiceSauce pulled by foreman from IPA archive: Shue_2011_VoiceSauce. R052 R053 books NOT-FOUND.
- Sci-hub queue written: scratchpad/scihub-queue.md, groups S01-S10 (~92 items). scihub-S01 and scihub-S02 dispatched (2 parallel, separate tabs).
- Reading wave 1 dispatched (Opus): Morise2016, Birkholz2013, Titze2008, Ramus1999, Arvaniti2009, Smith2005, Hillenbrand2009, Bisani2008. Earlier: coker1976, ishizaka1972, boersma1991 still running; luc1993 done.
- Remaining OK PDFs not yet assigned to readers: ITU-R_2015_MUSHRA_BS1534, ITU-T_1996_MOS_P800, McIntyre_1983_OSCILLATIONSMUSICAL-INSTRUMENTS, Puckette_1995_FormantBasedAudioSynthesisNonlinear, Serra_1990_SpectralModelingSynthesis, Kim_2018_CREPEConvolutionalRepresentationPitch, Auger_1995_ImprovingReadabilityTime-frequencyTime-scale, Valin_2019_LPCNetImprovingNeuralSpeechSynthesis, Taylor_1998_FestivalArchitecture, Black_2005_BlizzardChallenge2005, Schroder_2001_EmotionalSpeechSynthesisReview, Cook_2001_PrinciplesDesigningComputerMusicControllers, Shue_2011_VoiceSauce, (Campbell_1997 pending identity check).
- Campbell_1997_StressProminenceSpectralTilt adopted (ISCA scan, identity verified by title page image).
- Reading wave 2 dispatched (Opus): MUSHRA, P800, McIntyre1983, Puckette1995, Serra1990, CREPE2018, Auger1995, LPCNet2019, Festival1998, Blizzard2005, Schroder2001, Cook2001, VoiceSauce2011, Campbell1997. Every retrieved PDF now has a reader. ~25 readers + 2 sci-hub agents in flight.
- After readers finish: run reconcile + tag + index.md + ledger per paper, sequential, via Sonnet agents (batches of ~8 dirs each, one agent at a time, since index.md is shared).
- Readers done: Coker_1976_ArticulatoryDynamicsControl, Ishizaka_1972_TwoMassModelVocalCords, Boersma_1991_MultiMassSpeechSynthesis, Lucero_1993_TwoMassModelBifurcations. All four loose PDFs adopted; only rosenberg_JASA_1971.pdf remains at papers/ root (duplicate of existing dir).
- post-01 (Sonnet) dispatched: reconcile + index.md + ledger for those four, sequential. Only ONE post-* agent at a time (index.md/ledger single-writer). Queue further finished dirs into post-02 etc. after post-01 reports.
- index.md convention: mixed; use skill link format, alphabetical by dirname.
- post-02 queue (awaiting post-01): Morise_2016_WORLDVocoder-BasedHigh-QualitySpeech, Black_2005_BlizzardChallenge2005, Cook_2001_PrinciplesDesigningComputerMusicControllers, Hillenbrand_2009_RoleF0FormantFrequencies, Kim_2018_CREPEConvolutionalRepresentationPitch, Taylor_1998_FestivalArchitecture, Shue_2011_VoiceSauce, Valin_2019_LPCNetImprovingNeuralSpeechSynthesis, Arvaniti_2009_RhythmTimingTimingRhythm, Schroder_2001_AcousticCorrelatesEmotionDimensions, Ramus_1999_CorrelatesLinguisticRhythmSpeech, Campbell_1997_StressProminenceSpectralTilt, Smith_2005_InteractionGlottal-pulseRateVocal-tract, Titze_2008_NonlinearSource-filterCouplingPhonation, Puckette_1995_FormantBasedAudioSynthesisNonlinear, Birkholz_2013_ModelingConsonant-VowelCoarticulationArticulatory, Serra_1990_SpectralModelingSynthesis, ITU-T_1996_MOS_P800, Bisani_2008_Joint-sequenceModelsGrapheme-to-phonemeConversion
- TODO at end: audit cite_key in every new metadata.json (some hand-written ones used the dirname); convention is lowercase lastnameYEARfirstword, e.g. kim2018crepe. Then build_keymap.py once.
- cite_key fixes pending (after readers finish): ITU-R_2015_MUSHRA_BS1534 -> itur2015mushra; ITU-T_1996_MOS_P800 -> itut1996mos; Puckette1995FormantBasedAudioSynthesis -> puckette1995formant. Pre-existing Hayes1982 / LibermanPrince1977 are legacy, leave alone.
- Schroder mixup: schroder01_eurospeech = "Acoustic Correlates of Emotion Dimensions" (kept, renamed Schroder_2001_AcousticCorrelatesEmotionDimensions, already read). Review is schroder01b_eurospeech -> Schroder_2001_EmotionalSpeechSynthesisReview, reader dispatched.
- ret-web (Sonnet) dispatched: web-search hunt for R016 Liberman&Pierrehumbert1984, R053 Ladefoged1983, R104 Talkin RAPT, R122 Riley1992, R116 Cahn1990, R077 Fant1972 (KTH retry / Wayback). Report: scratchpad/retrieval/web-hunt.md.
- BLOCKER: Chrome page-read tools return "Permission denied by user" for sci-hub tabs, both from subagents and from the foreman session (navigate works, get_page_text/find/screenshot denied). Sci-hub pass cannot proceed until the user grants the claude-in-chrome extension site access for sci-hub.se / sci-hub.st (or chooses another access route). scihub-S01/S02 told to stop; queue S01-S10 untouched in scratchpad/scihub-queue.md.
- scihub-S01 stopped cleanly (all BLOCKED, nothing downloaded). Awaiting S02 stop.
- Readers still running: bisani2008, mushra, mcintyre1983, auger1995, schroder2001b.
- Changed post plan: reconcile runs 3-wide (recon-A/B/C, Sonnet, notes.md only); index.md + ledger appended by foreman script scratchpad/index_ledger.py AFTER post-01 finishes (post-01 still owns index.md for its four). recon-A: Morise, Black2005, Taylor1998, Valin, Bisani, Kim, ITU-T. recon-B: Hillenbrand2009, Smith2005, Arvaniti2009, Ramus1999, Campbell1997, Schroder-acoustic. recon-C: Cook2001, Shue2011, Titze2008, Puckette1995, Birkholz2013, Serra1990.

## Checkpoint 2026-09-08 ~07:35
State:
- Retrieval (OA): done. 28 PDFs in collection from this sweep (see index/queue for names). Books (11) not retrievable.
- Sci-hub: BLOCKED on browser permission (Chrome page-read tools "Permission denied by user" for sci-hub tabs, reproduced from foreman session). S01 stopped clean; S02 told to stop, awaiting confirmation. Queue intact in scratchpad/scihub-queue.md (S01-S10, ~92 items). Do NOT curl-scrape as a workaround; user must grant extension site access or choose another route.
- Reading: 21 done. Still running: read-mushra, read-mcintyre1983, read-auger1995, read-schroder2001b.
- Reconcile: post-01 (Coker/Ishizaka/Boersma/Lucero, also owns index.md+ledger for those four) halfway. recon-A/B/C running on the 19 queued dirs, notes.md only.
- Index/ledger: scratchpad/index_ledger.py validated on scratch copy (alphabetical insert, idempotent). Run it on the 19 queued dirs + the 4 late readers AFTER post-01 reports. Command: python "<scratchpad>/index_ledger.py" papers <dirs...>
- cite_key normalized: itut1996p800, puckette1995formant, kim2018crepe, valin2019lpcnet (readers). Still to check after read-mushra finishes: ITU-R_2015_MUSHRA_BS1534 -> itur2015bs1534. Then build_keymap.py once at the end.
- Web hunt (ret-web) running for the six unindexed items.
Next steps in order: (1) post-01 report -> run index_ledger.py; (2) collect recon-A/B/C + 4 readers -> reconcile the 4 late ones (one more recon agent) -> index_ledger.py again; (3) cite_key audit + build_keymap.py; (4) rosenberg_JASA_1971.pdf root duplicate + Kestrel 2014/2015 duplicate cleanup; (5) if user grants sci-hub access, re-dispatch scihub-S01..S10 two at a time, then read/reconcile those in waves; (6) final report to user.
- Readers done: MUSHRA (cite itur2015mushra), Auger1995, Schroder2001 review. Only read-mcintyre1983 still running. recon-D dispatched for those three. Index/ledger for all 22 non-post-01 dirs still waits on post-01.
- Web hunt done: OK Liberman_1984_IntonationalInvariance (USC scan of the chapter), Cahn_1990_AffectEditor (MIT Media Lab), Fant_1972_VocalTractWallEffectsBandwidths (Wayback). NOT-FOUND: Ladefoged 1983, Talkin RAPT, Riley 1992. Substitute pulled by foreman: Riley_1990_TreeBasedModellingSpeechSynthesis (ISCA SSW 1990 precursor). Readers dispatched for all four (Opus).
- McIntyre 1983: retrieved PDF was wrong (bad S2 pdf_url); reader fetched correct article from author's page and read it. Quarantine file removed; dir renamed McIntyre_1983_OscillationsMusicalInstruments. Queue for reconcile with Liberman1984/Cahn1990/Fant1972/Riley1990 (recon-E).
- post-01 DONE (4 papers reconciled+indexed+ledgered). Foreman ran index_ledger.py for 23 dirs: index.md now 402 entries, ledger 41 lines. Remaining for index: Liberman1984, Cahn1990, Fant1972, Riley1990 (readers running).
- scihub-S02 confirmed denial is the Claude Code auto-mode classifier ("Blocked by classifier"), not a stuck dialog. Told S02 to stop and write BLOCKED report.
- Cleanup done: rosenberg_JASA_1971.pdf (same paper as Rosenberg_1971_EffectGlottalPulseShape, different scan) deleted; papers/ root has no loose PDFs. Kestrel merged: paper.pdf + pngs moved 2014 -> 2015, Ebden_2014 dir deleted (its claims.yaml was empty), index entry removed. Ebden_2015_KestrelTextNormalization is canonical; note the 2014 dir was git-tracked so this shows as a deletion.
- keymap.tsv rebuilt (46 entries; only dirs with metadata.json are keyed). cite_key audit: all directories created today have lowercase lastnameYEARword keys. 26 older dirs lack metadata.json entirely (pre-existing gap, surfaced because reconcile touched their notes.md); out of scope for this sweep, worth a separate metadata backfill pass.
- Remaining before final report: recon-A..E reports; readers Liberman1984/Cahn1990/Fant1972/Riley1990 -> recon-F -> index_ledger.py -> keymap rebuild; scihub-S02 stop confirmation; user decision on sci-hub browser permission (classifier block).
- scihub-S02 stopped clean (all BLOCKED, tab closed). Sci-hub pass fully parked; queue untouched.
- Reader done: Riley_1990_TreeBasedModellingSpeechSynthesis (hold for recon-F with Liberman/Cahn/Fant, then index).
- recon-E done (McIntyre: 4 leads, 6 conceptual links, 3 see-also files).
- Reader done: Cahn_1990_AffectEditor. recon-F dispatched (Riley1990, Cahn1990); both indexed+ledgered by foreman. Pending readers: Liberman1984, Fant1972 -> recon-G.
- recon-B done (6/6). Flag from worker: Sluijter_1996_SpectralBalanceStressCue dir is mislabeled - content is the 1997 Sluijter/van Heuven/Pacilly perception paper, not the 1996 production paper. Pre-existing; separate fix.
- recon-A done (7/7). Remaining recon: C, D, F, then G (Liberman/Fant).
- recon-D done (3/3). Remaining recon: C, F, then G (Liberman/Fant).
- Reader done: Fant_1972 (indexed+ledgered). recon-G dispatched for it. Last reader running: Liberman1984 -> recon-H.
- recon-C done (6/6). Remaining recon: F (Riley/Cahn), G (Fant1972), then H (Liberman1984 after its reader).
- Reader done: Liberman_1984 (indexed+ledgered). ALL READERS DONE (34 papers read this sweep). recon-H dispatched. Remaining: recon F, G, H reports -> final keymap rebuild -> final report to user. Sci-hub still parked on user decision.
- recon-G done (Fant1972: 11 cited-by, 13 leads, 4 see-also). Remaining: recon F (Riley/Cahn), H (Liberman).
- recon-F done (Riley1990, Cahn1990). Only recon-H (Liberman) outstanding.
- Verification: all 30 new dirs complete (notes/description/abstract/citations/metadata/paper.pdf/pngs) and indexed. keymap.tsv rebuilt (46). Line endings unchanged vs HEAD (repo index.md/ledger were already CRLF). Em-dash count is collection baseline (343/405 older notes have them) - not fixing.
- Memory saved: paper-sweep-operations.md. Only recon-H outstanding, then final report.

## FINAL 2026-09-08 ~08:00
All agents finished. 34 papers read+reconciled+indexed this sweep (30 retrieved + 4 loose PDFs). Sci-hub queue (~92) parked on user permission. Books (11) and 3 unindexed chapters (Ladefoged 1983, Talkin RAPT, Riley 1992) need manual PDFs. Nothing committed; user to review git status and commit text artifacts only (never paper.pdf/pngs).
- Git: an automatic "Papers sync" process committed 29 times during the sweep (author = Q). None of those commits added pdf/png (4 tracked binaries exist collection-wide, pre-existing). Kestrel 2014 broken tag symlinks removed from papers/tagged; the deletion will land in the next sync commit.
