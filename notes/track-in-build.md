# TRACK IN build notes

## Task
Build the INPUT CONTRACT: clean score + Direction Track (typed aligned relative-to-neutral modifiers) + affect preset library compiling named emotions -> V/A/D + voice-quality vector.

Files to create:
- src/input/direction-track.ts (schema + types)
- src/input/affect.ts (compiler)
- src/input/parse.ts (parser/lowering -> DecisionRecords)
- src/input/inline.ts (optional inline serializer, minimal)
- test/input.test.ts
- design/beauty-synthesis/13-direction-track-format.md (spec)
- design/beauty-synthesis/build/reports/track-in.md (report)

ABSOLUTE RULES: new files only under src/input/. Do NOT modify HRG, engine, klsyn88, oversampled, frontend YAML. No git add/commit. No wasm rebuild. Every claim backed by quoted passing test.

## Findings so far
### 10-sota-control-surface.md
- Architecture (b) = separate direction layer aligned to clean text; (c) = plain text + global affect state = empty base case.
- Affect: categorical preset + continuous degree -> compiles to V/A/D + voice-quality vector. Store BOTH (EmotionML parallel-vocab pattern).
- Each direction = first-class DecisionRecord with citations[], tag, parents[].
- Cited tables: Murray_1993 Table I, Banse_1996, Rutledge_1995 Tables 3-4, Gobl_2003, Scherer.
- Tags: affect, emphasis, voice_quality, gesture.

### 12-fe-architecture-recommendation.md
- DecisionRecord schema: {stage, type, subject, reason, citations[], parents[]}
- direction (input) IS a DecisionRecord.
- Global state: voice/timbre identity + global affect (preset+degree). Local overrides: spans by token/word/phrase/phoneme range - emphasis, break, pitch/rate/VQ deltas, named gestures. Explicit span precedence.
- Affect relation in HRG: OQ/TL/AH/jitter directives. (don't wire HRG now, just compatible shapes)

## State: DONE READING. Building now.

### Key facts confirmed
- DecisionRecord = {id,seq,stage,type,subject,reason,citations[],parents?,timestampMs?}. Stages: transcribe|rules|prosody|semantics|interpreter|runtime|frontend. createProvenanceCollector().add(input) returns record. Use stage "frontend" for input directions.
- HRG FeatureWriteInput = {reason, citations?, parents?, stage?, type?}. My Direction records must carry citations+parents+reason to later become HRG Affect-relation feature-writes. Subject convention: use `token:` style so provenance range selectors work.
- NO collision: existing control-score.yaml = LOW-level synth-facing IR (segments/timed-controls/f0-points). voice-quality-presets = OLD textToKlattTrack path. My work = NEW author-facing input contract under src/input/. Separate.

### Preset data sources (port verbatim, cite)
- §2.4 Emotion: neutral/angry/loud/soft/sad/happy/anxious/fatigued (+doc03 tender composite). Fields: rdDelta,f0Scale,f0Variance,durationScale,intensityBoost,ahBoost,pauseScale,f1/2/3Delta,fbw1/2/3Scale,spectralTiltBoost,f4VarianceScale. cites Cummings_1995,France_2000,Banse_1996,Rutledge_1995,Murray_1993,Scherer_1986,Gobl_2003,Laukka_2008,Vogel_2010.
- §2.6 Epistemic: confident/doubtful/competent/hedging. cite Goupil_2021 (Jiang_2017).
- §2.7 Pragmatic: indirect_request/direct_request/polite_question/sarcastic/rude/dismissive/curt/insincere. cite Trott_2022,Caballero_2018,Fish_2017,Cheang_2008.
- §2.8 SpeechAct (Hellbernd_2016): naming/criticism/doubt/suggestion/warning/wish — gives explicit arousal(calm/moderate/excited)+valence(neg/neu/pos) labels.
- §2.10 Clinical (Kaczmarek-Majer_2024): manic/depressive SEX-SPECIFIC, INVERTED male/female. REQUIRE sex param; throw if absent. manic_male loud/+, manic_female quiet/-.

### Design decisions
- compileAffect(preset, degree, {sex?}) -> {dimensional:{valence,arousal,dominance}, vq:VoiceQualityDelta, label, citations}. degree scales: mult fields 1+(v-1)*deg, additive v*deg, dims v*deg. neutral/degree0 -> identity.
- Direction = resolved typed record (global_affect|voice_identity|emphasis|break|pitch|rate|voice_quality|gesture|local_affect) each -> DecisionRecord. spans chain parent=global affect decision.
- Anchor: tokenize score on whitespace=words=tokens; phrase=split on .,;:!?. resolve to token start/end. precedence: higher wins per-field on overlap.
- GESTURE_LIBRARY: sigh/creak/breath -> VQ deltas, cited.
- inline.ts minimal: ((preset@degree)) global + *word* emphasis -> lifts to DirectionTrack.

### Files building: direction-track.ts, affect.ts, parse.ts, inline.ts, test/input.test.ts, design/13-direction-track-format.md, build/reports/track-in.md
