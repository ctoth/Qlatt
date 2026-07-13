# Chunk: acoustic measurement sidecar + voiced-periodicity lint

Session date: 2026-06-11. Branch: dectalk-parity. Charter: notes/agent-audition-territory.md.

## Done & verified

- `scripts/measure/` Python sidecar (option 1 from charter discussion):
  - `measure.py` — Praat via parselmouth 0.4.7 (Praat 6.1.38), pinned by uv
    (`pyproject.toml` + `uv.lock`, venv gitignored, `[tool.pyright]` points at .venv).
    Emits contract `qlatt-measure/1` JSON: unified time grid (default 10 ms) with
    f0/formants(4)/bandwidths/intensity per frame + summary (f0 stats, voiced formant
    medians, HNR, jitter/shimmer) + warnings + citations. NaN→null.
  - `measure.ts` — typed Node wrapper `measureWav(path, opts)` + CLI; spawns
    `uv run --project scripts/measure python .../measure.py`. In tsconfig.scripts.json;
    `npm run typecheck:scripts` passes. npm script: `npm run measure -- <wav> [--json]`.
- End-to-end proof (fresh render, "she sees a dog", node backend):
  - track intent f0Mean 156.28 Hz vs Praat-measured mean 156 Hz — agreement <0.3 Hz.
  - Field note: Praat default pitch ceiling 600 gives octave-error garbage on golden
    hello-world WAV (mean 282); ceiling 300 → clean mean 103.9 (base 110 + declination).
    Rule of thumb: ceiling ≈ 2.5× base F0 for synthetic voices.
  - Loose thread: track voicedTime 0.875 s vs Praat-detected voiced ≈0.59 s (tracker
    conservative at onsets/transitions). The lint threshold must tolerate this.

## Done & verified: voiced-periodicity lint (the KLGLOTT88 detector)

- `scripts/lint-audio.ts` + `npm run lint:audio -- --wav x.wav --json x.json`
  (payload needs `--include-track 1`; aggregate-only fallback without track).
- Reuses the canonical voicing predicate: exported `isVoicedFrame` from
  src/analysis/track-metrics.ts (AV>0 || AVS>0). WAV time = track time + leadTime
  (interpreter.scheduleTrack(track, leadTime) in node-runtime.ts:104).
- Per voiced interval ≥60ms (edges trimmed 15ms): Praat must detect f0 in ≥30% of
  interior frames. Plus aggregate: detected/intended voiced time ≥0.4. All
  thresholds engineering estimates, documented in header.
- Validation matrix (2026-06-11, "she sees a dog"):
  - node render: PASS (2 intervals, aggregate ratio 0.6514)
  - browser render (--host browser --allow-browser 1): PASS (ratio 0.6629)
  - silent WAV vs voiced payload (synthetic KLGLOTT88): FAIL exit 1, both
    intervals 0 frames detected, phoneme-localized. Detector proven both ways.
- test:golden exits 1 on this branch BEFORE these changes (verified by stashing:
  identical rmsError 0.32504812202227573 on pristine HEAD — the known
  phrase-hello-world drift). Not caused by this chunk; typecheck:scripts clean.

## Next candidates (per charter)

- Wire lint:audio into render flows / observation suite as a standing check.
- Inverse lint: no periodicity/energy where track says silence.
- Claim schema (test/claims/) — vowel formant ellipses, duration claims.

## Original lint design notes (superseded by Done section above)

Goal: where track says voiced, rendered WAV must show periodicity. Catches the
browser-silent class (2026-05-31 KLGLOTT88: node voiced, browser silent).

Anatomy learned so far:
- `RenderPayload` (src/rendering/types.ts): has leadTime, tailTime, trackSummary,
  optional `track: unknown`, baseF0, samples.
- Track frame shape: `{ time: number; phoneme?: string; params?: Record<string, number> }`
  (src/rendering/track-summary.ts). Voicing definition lives in
  `src/analysis/track-metrics.ts` (summarizeTrackMetrics) — NEXT: read it to reuse the
  exact same voiced-event predicate (probably AV > 0) rather than inventing one.
- Time alignment question still open: does WAV t=0 = track t=0 or shifted by leadTime
  (default 0.05 s)? Check how node backend schedules (scripts/rendering/backends/node-runtime.ts).

Plan:
- `scripts/lint-audio.ts`: input --wav + --json payload (needs --include-track 1).
  Per voiced track event ≥ min duration (~60 ms): fraction of measure frames in
  [start(+lead?), end(+lead?)] with f0 non-null must be ≥ threshold (~0.3, engineering
  estimate). Aggregate fallback via trackSummary if no track. Derive pitch floor/ceiling
  from payload.baseF0. Exit 1 on fail; --json for machine output. npm script lint:audio.
