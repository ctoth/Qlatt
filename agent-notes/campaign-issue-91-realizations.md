# Goal
Trace successful cited realization rules through the existing collector for #91.

# State
Implemented 12 added production lines plus an explicit existing rule type and 53 fixture lines. Isolated from PR #422 final 586f49c9 pending its merge. Existing evaluator fixtures cover success, no collector, uncited/string rules, and evaluation errors; the compiler fixture loads the actual Laine NFC declaration and checks its expression/result/citation record.

# Decisions and why
Smallest change: 14–22 production lines and 35–55 existing fixture lines. Forward the compiler's existing collector through EvaluationContext and record actual successful expression results only when the object rule supplies citations. Use the loaded Laine NFC declaration for integration evidence. Preserve string/uncited/error behavior and all scheduling.
No invented fallback citations, playback timestamps, dependency ancestry, or claims that general Node/browser init paths now collect provenance. This remains partial #91.

# Surprises
None.

# Next step
Implement, publish for hosted CI and independent Claude review. No local CI.
