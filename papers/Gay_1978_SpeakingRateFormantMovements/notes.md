# Gay 1978 — Effect of Speaking Rate on Vowel Formant Movements

## Implementation-Relevant Findings

### Key Result: Vowel Targets Are Rate-Invariant

Midpoint formant frequencies (F1, F2, F3) of vowels do **not** change as a function of speaking rate. The acoustic targets remain constant across slow and fast speech. This means a synthesizer should use the same formant targets regardless of speaking rate.

### Mechanism: Earlier Transition Onset, Not Faster Movement

For fast speech, the CV formant transition **begins earlier** (onset frequency is closer to target), but the **rate of formant change** (Hz/ms) remains essentially the same. The articulatory gesture toward the vowel starts earlier during the preceding consonant closure.

- F2 onset frequencies are higher (closer to target) for fast rate: shifts of 40-80 Hz for /i/ across speakers
- F2 midpoint frequencies differ by only 15-25 Hz (within measurement error)
- F2 transition rate (Hz/ms) remains essentially unchanged

### Duration Data (Table I) — Rate Ratios

Mean durations (ms) for /p_p/ CVC syllables, pooled over 4 speakers x 5 repetitions:

| Segment | Slow (ms) | Fast (ms) | Ratio (fast/slow) |
|---------|-----------|-----------|-------------------|
| Initial /p/ closure | 105 | 95 | ~0.90-0.95 |
| Vowel nucleus | 130 | 100 | ~0.74-0.82 |
| Final /p/ closure | 80 | 75 | ~0.81-0.94 |

- Vowel nucleus absorbs most of the duration decrease
- Consonant closures account for at least 1/3 of total syllable reduction
- Percentage change in vowel duration does NOT vary by inherent vowel length (long vowels like /ae/ and /open-o/ are reduced by same proportion as short vowels like /i/ or /u/)

### Per-Vowel Duration Data (Table I)

| Vowel | Slow vowel (ms) | Fast vowel (ms) | Ratio |
|-------|----------------|----------------|-------|
| /i/   | 120 | 90 | 0.75 |
| /I/   | 105 | 85 | 0.81 |
| /epsilon/ | 130 | 105 | 0.81 |
| /ae/  | 155 | 125 | 0.81 |
| /a/   | 145 | 115 | 0.79 |
| /open-o/ | 165 | 130 | 0.79 |
| /upsilon/ | 110 | 90 | 0.82 |
| /u/   | 120 | 90 | 0.75 |
| /wedge/ | 115 | 85 | 0.74 |

Mean vowel ratio: ~0.77 (vowels reduced to about 77% of slow rate duration).

### Transition Duration

- Slow rate: 40-50 ms
- Fast rate: 35-45 ms
- Reduction of ~5-10 ms, comparable to consonant closure reduction
- Transition times are stable across different vowels within each rate

### F2 Transition Data for /i/ (Table II)

| Speaker | Rate | Closure (ms) | Trans (ms) | Vowel (ms) | F2 onset (Hz) | F2 mid (Hz) | F2 rate (Hz/ms) |
|---------|------|-------------|-----------|-----------|---------------|-------------|-----------------|
| WE | slow | 95 | 45 | 115 | 1925 | 2150 | 4.5 |
| WE | fast | 80 | 40 | 95 | 1965 | 2125 | 4.3 |
| TG | slow | 95 | 50 | 95 | 1765 | 2105 | 7.7 |
| TG | fast | 90 | 50 | 75 | 1845 | 2115 | 6.9 |
| KH | slow | 105 | 55 | 140 | 2230 | 2700 | 8.8 |
| KH | fast | 110 | 45 | 105 | 2300 | 2685 | 8.9 |
| LR | slow | 110 | 50 | 130 | 1735 | 2100 | 7.7 |
| LR | fast | 105 | 40 | 95 | 1780 | 2115 | 8.4 |

### Voiced vs. Voiceless Consonant Context (Table III)

F2 onset frequencies are closer to midpoint for /b/ than /p/ (greater coarticulation with lax consonant). Rate effects exist for both /p/ and /b/ contexts. The /b/ onsets are already closer to target, so the rate-related shift is slightly smaller.

| Utterance | Rate | Closure | Trans | F2 onset | F2 mid | F2 rate |
|-----------|------|---------|-------|----------|--------|---------|
| pip | slow | 100 | 50 | 1810 | 2120 | 6.6 |
| pip | fast | 90 | 45 | 1885 | 2120 | 6.5 |
| bip | slow | 105 | 45 | 1960 | 2120 | 3.6 |
| bip | fast | 95 | 40 | 1985 | 2105 | 3.2 |
| pap | slow | 95 | 50 | 1340 | 1170 | 2.1 |
| pap | fast | 85 | 45 | 1325 | 1180 | 2.0 |
| bap | slow | 105 | ... | 1130 | 1150 | ... |
| bap | fast | 95 | ... | 1160 | 1170 | ... |
| pup | slow | 95 | 40 | 1250 | 1000 | 3.6 |
| pup | fast | 85 | 40 | 1200 | 990 | 3.9 |
| bup | slow | 100 | 45 | 1065 | 990 | 0.8 |
| bup | fast | 90 | 35 | 1030 | 990 | 1.2 |

Note: /bap/ had no visible CV transition — movement toward /a/ completed before consonant release.

### Speaking Rate vs. Lexical Stress — Two Different Mechanisms

This is the critical finding for synthesis: rate and stress are independently controlled.

**Rate change (stressed vowels):** Only duration is substantially reduced. F0, amplitude, and formant frequencies remain the same.

**Destressing:** Even at the same duration as a fast-stressed vowel, unstressed vowels show:
- Reduced overall amplitude (3-10 dB lower)
- Reduced F0 (20-80 Hz lower)
- Some vowel color reduction (F1/F2 shift toward neutral)

### Stress Contrast Data for /i/ (Table IV)

| Speaker | Rate | Stressed ||| Unstressed |||
|---------|------|----------|------|------|----------|------|------|
|         |      | Dur (ms) | Amp (dB) | F0 | Dur (ms) | Amp (dB) | F0 |
| WE | slow | 140 | 6 | 140 | 115 | 0 | 110 |
| WE | fast | 90 | 6 | 150 | 95 | 0 | 110 |
| TG | slow | 90 | 6 | 125 | 80 | 5 | 95 |
| TG | fast | 70 | 8 | 135 | 70 | 0 | 95 |
| KH | slow | 125 | 7 | 225 | 100 | 3 | 150 |
| KH | fast | 105 | 4 | 220 | 75 | 0 | 160 |
| LR | slow | 115 | 10 | 140 | 95 | 0 | 110 |
| LR | fast | 95 | 7 | 135 | 80 | 0 | 110 |

### Synthesis Implications

1. **Formant targets should NOT change with speaking rate** — use the same inventory targets at all rates
2. **Duration compression for rate:** Apply ~0.77 ratio to vowel nuclei, ~0.90-0.95 to consonant closures, ~0.85-0.90 to transitions
3. **Transition onset frequency:** For fast speech, shift F2 onset 40-80 Hz closer to target (for /p/ context; less for /b/)
4. **Transition velocity:** Do NOT change formant transition rate (Hz/ms) — keep it constant across rates
5. **Stress reduction is separate from rate:** Unstressed vowels need reduced amplitude, F0, and slight formant centralization — even if their duration matches a fast-stressed vowel
6. **Two control mechanisms:** Rate = horizontal time compression. Stress = modulation of overall articulatory effort (affects amplitude, F0, duration, and vowel color)
7. **Nonlinear time compression:** Rate change causes both duration decrease within segments AND increased coarticulation between segments (Joos 1948 model)
