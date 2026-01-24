# Task: Investigate AH Offset Change (Issue 2)

## Context

See `prompts/16bit-conversion-guide.md`.

In `src/klatt-synth.js` lines 452-454:
```javascript
// AH was -102 in Klatt 80, but we use -72 to match AV/AF scaling.
// Input AH values are now scaled to Klatt 80 levels (40 vs 55).
AH: -72,
```

Klatt 80 uses -102 for AH (NDBSCA(10)), but we changed it to -72.

## Questions

1. Why was AH -102 in Klatt 80 while AV and AF are -72?
2. Is changing AH to -72 correct, or does it break something?
3. What does "Input AH values are now scaled to Klatt 80 levels (40 vs 55)" mean?
4. Are there any downstream effects of this change?

## Investigation

1. Read `~/src/klatt80/PARCOE.FOR` to understand original AH handling
2. Understand why NDBSCA has different values for AH vs AV/AF
3. Read `~/src/klatt-syn/src/Klatt.ts` for comparison
4. Trace how AH values flow through the system

## Output

Write analysis to `reports/16bit-issue2-ah-offset.md`:
- Original Klatt 80 AH behavior and rationale
- Why the change was made
- Whether the change is correct
- Any issues or documentation needed

## DO NOT

- Make code changes
- Stage or commit
