# Lexical stress evaluation

Frozen issue #37 sample; CMU's bundled American pronunciations and stored variants. This is a small diagnostic sample, not a population accuracy estimate.

Reproduce in PowerShell: `$env:QLATT_STRESS_REPORT='1'; npx vitest run test/lexical-stress-evaluation.test.ts`. Unset the variable afterward.

Reference mode strips digits from supplied phones and accepts only variants with the same segment sequence. OOV mode disables all dictionary lookups; its stress scores compare syllable count and primary position/pattern, not segment accuracy. Exact OOV pronunciation is reported separately.

The baseline reproduces the count/hint rule at e3e8b4cf for these flat-phone paths. Neither mode measures dictionary-root morphology coverage. Held-out words were fixed before this report and were not used to tune the policy after seeing these results.

| Mode | Primary correct | Complete pattern correct |
|---|---:|---:|
| baselineReference | 12/23 | 9/23 |
| reference | 14/23 | 11/23 |
| baselineOov | 10/23 | 7/23 |
| oov | 9/23 | 6/23 |

Exact OOV pronunciations: 2/23.

All words and failures are retained. An asterisk means the complete pattern is not an accepted reference; primary-only successes remain in the totals above.

| Word | Family | Accepted | Baseline reference | New reference | Baseline OOV | New OOV |
|---|---|---|---|---|---|---|
| banana | weight | 010 | 100* | 100* | 100* | 100* |
| tomato | weight | 012 | 100* | 012 | 100* | 102* |
| potato | weight | 012 | 100* | 012 | 100* | 102* |
| casino | weight | 010 | 100* | 012* | 100* | 102* |
| piano | weight | 010 | 100* | 102* | 100* | 102* |
| numeric | affix | 010 | 100* | 100* | 100* | 100* |
| poetic | affix | 010 | 100* | 100* | 100* | 100* |
| historic | affix | 010 | 100* | 010 | 100* | 010 |
| scientist | affix | 100 | 100 | 210* | 100 | 210* |
| musician | affix | 010 | 100* | 100* | 100* | 100* |
| geography | affix | 0100 | 0100 | 2100* | 0100 | 2100* |
| biology | affix | 0100 | 0100 | 2100* | 0100 | 2010* |
| photography | affix | 0100 | 0100 | 0100 | 0100 | 2100* |
| childish | neutral | 10 | 10 | 10 | 10 | 10 |
| hopeful | neutral | 10 | 10 | 10 | 10 | 10 |
| fearless | neutral | 10 | 10 | 10 | 100* | 100* |
| movement | neutral | 10 | 10 | 10 | 100* | 210* |
| washable | neutral | 100 | 100 | 100 | 100 | 100 |
| locomotive | long | 2010 | 0100* | 2010 | 0100* | 2010 |
| encyclopedia | long | 020100 | 000100* | 202010* | 000100* | 200100* |
| aristocratic | long | 02010 | 00100* | 20100* | 00100* | 20100* |
| university | long | 20100 | 00100* | 20100 | 00100* | 20100 |
| cafeteria | long | 20100 | 00100* | 02010* | 00100* | 02010* |

| Family | Reference pattern failures | OOV pattern failures |
|---|---|---|
| weight | banana, casino, piano | banana, tomato, potato, casino, piano |
| affix | numeric, poetic, scientist, musician, geography, biology | numeric, poetic, scientist, musician, geography, biology, photography |
| neutral | none | fearless, movement |
| long | encyclopedia, aristocratic, cafeteria | encyclopedia, aristocratic, cafeteria |

Full phone output makes upstream segment errors visible:

| Word | Reference phones | Generated phones |
|---|---|---|
| banana | B AH0 N AE1 N AH0 | B AE1 N AE0 N AX0 |
| tomato | T AH0 M EY1 T OW2 | T AA1 M AE0 T UW2 |
| potato | P AH0 T EY1 T OW2 | P AA1 T AE0 T UW2 |
| casino | K AH0 S IY1 N OW0 | K EY1 S IH0 N OW2 |
| piano | P IY0 AE1 N OW0 | P IH1 AE0 N OW2 |
| numeric | N UW0 M EH1 R IH0 K | N UW1 M EH0 R IH0 K |
| poetic | P OW0 EH1 T IH0 K | P OW1 EH0 T IH0 K |
| historic | HH IH0 S T AO1 R IH0 K | HH IH0 S T AO1 R IH0 K |
| scientist | S AY1 AH0 N T IH0 S T | S AY2 EH1 N T IH0 S T |
| musician | M Y UW0 Z IH1 SH AH0 N | M Y UW1 Z IH0 SH AE0 N |
| geography | JH IY0 AA1 G R AH0 F IY0 | JH IY2 AA1 G R AE0 F IY0 |
| biology | B AY0 AA1 L AH0 JH IY0 | B IH2 AA0 L AA1 JH IY0 |
| photography | F AH0 T AA1 G R AH0 F IY0 | F AA2 T AA1 G R AE0 F IY0 |
| childish | CH AY1 L D IH0 SH | CH AY1 L D IH0 SH |
| hopeful | HH OW1 P F AH0 L | HH OW1 P F UH0 L |
| fearless | F IH1 R L AH0 S | F IY1 R AX0 L EH0 S |
| movement | M UW1 V M AH0 N T | M UW2 V IY1 M EH0 N T |
| washable | W AA1 SH AH0 B AH0 L | W AA1 SH AX0 B AX0 L |
| locomotive | L OW2 K AH0 M OW1 T IH0 V | L OW2 K AH0 M AA1 T IH0 V |
| encyclopedia | IH0 N S AY2 K L AH0 P IY1 D IY0 AH0 | EH2 N S IH0 K L OW0 P EH1 D IH0 AX0 |
| aristocratic | ER0 IH2 S T AH0 K R AE1 T IH0 K | EH2 R IH0 S T AA1 K R AE0 T IH0 K |
| university | Y UW2 N AH0 V ER1 S AH0 T IY0 | Y UW2 N IH0 V ER1 S IH0 T IY0 |
| cafeteria | K AE2 F AH0 T IH1 R IY0 AH0 | K AE0 F IY2 T IY0 R IY1 AX0 |
