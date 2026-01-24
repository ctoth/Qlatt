# Task: Document 170x Scaling Decision (Issue 13)

## Context

See `prompts/16bit-conversion-guide.md`.

Klatt 80 COEWAV.FOR line 251:
```fortran
ULIPS=(ULIPSV+ULIPSF+STEP)*(170.)
```

The comment says "TO LEFT JUSTIFY IN 16-BIT WORD".

## Question

1. Is the 170x well documented as intentionally omitted?
2. Should there be a comment in the code explaining this decision?
3. Are there any implications we should document?

## Investigation

1. Verify we don't use 170x anywhere in `src/klatt-synth.js`
2. Check if there's existing documentation about this
3. Determine if a code comment would help future developers
4. Check how `~/src/klatt-syn/src/Klatt.ts` handles this

## Output

Write analysis to `reports/16bit-issue13-170x.md`:
- Confirmation that 170x is not used
- Whether documentation is sufficient
- Recommended action (add comment or document only)

## DO NOT

- Make code changes
- Stage or commit
