# Report: Verdict 06 -- Stop Consonants & VOT

## Summary

Read all 19 assigned paper notes and audited Qlatt's stop consonant implementation in `inventory.yaml` and `duration.yaml`. Full verdict written to `research/verdicts/06-stop-consonants-vot.md`.

## Key Findings

### Evidence Framework

- **Lisker & Abramson 1964's three VOT categories remain valid**, confirmed by Abramson & Whalen 2017 (50-year retrospective). The labial < alveolar < velar ordering is universal across all sources.
- **Blumstein & Stevens 1979 spectral templates are approximately correct** but bursts alone yield only 18% identification accuracy (Stevens & Blumstein 1978 perceptual study). Burst-transition continuity is critical.
- **Port 1979 closure durations are superseded** by Crystal & House 1988, which shows voiced and voiceless closures are approximately equal (~53 ms) in connected speech.
- **Hanson & Stevens 2003** confirms place-dependent frication extends into the aspiration phase -- already implemented in Qlatt's `aspiration_frication_carryover` rule.

### Qlatt Audit -- Issues Found

**Incorrect /k/ VOT ordering (high priority):**
- Qlatt: /p/ = 58 ms, /t/ = 71 ms, /k/ = 63 ms
- Expected (Zue 1976): /p/ = 58 ms, /t/ = 71 ms, /k/ = 73 ms
- /k/ VOT is shorter than /t/ -- violates the universal labial < alveolar < velar ordering confirmed by every paper reviewed
- Fix: increase K_ASP from 48 to ~58 ms

**D_CL too short (high priority):**
- Qlatt: D_CL = 35 ms
- Crystal & House 1988: ~50-55 ms for all stops in connected speech
- Fix: raise to ~45-50 ms

**Missing duration rules (medium priority):**
- No connected-speech VOT reduction (Klatt 1975: 0.7-0.9x word-initial, 0.4-0.7x word-medial)
- No cluster VOT increase (+27% in stop-sonorant clusters per Zue 1976)
- No vowel-height VOT conditioning (+15% before high vowels per Klatt 1975)

### What Qlatt Gets Right

- /p/ and /t/ total VOT values match Zue 1976 well (58 ms and 71 ms)
- Burst spectral shapes follow Blumstein & Stevens templates correctly (diffuse-falling for labials, diffuse-rising for alveolars, compact for velars)
- `s_cluster_aspiration_reduction` correctly implements the dramatic VOT reduction after /s/
- `aspiration_frication_carryover` correctly extends place-dependent frication into aspiration phase
- `stop_unreleasing` handles unreleased stops before other stops
- The structural phase decomposition (closure -> release -> aspiration) matches Stevens 1993's four-source model

## Files

- Verdict: `research/verdicts/06-stop-consonants-vot.md`
- Audited: `public/rules/frontends/qlatt-english/inventory.yaml`, `public/rules/frontends/qlatt-english/phases/duration.yaml`
