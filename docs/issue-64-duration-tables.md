# Issue 64 duration tables

The issue requests one PR per table. This series selects four tables for the intrinsic, contextual, speech-rate, and VOT requirements:

| PR | Source | Applied model | Review |
| --- | --- | --- | --- |
| #192 | Chen 1970 Table V | English prevoiceless/voiced vowel ratio, respecting the existing Klatt duration floor | `chen-1970-duration-review.md` |
| #194 | Crystal & House 1982 Table VI | Segment-category tempo response, with vowel rate as the interpolation anchor | `crystal-1982-duration-review.md` |
| #195 | Peterson & Lehiste 1960 Table I | Fifteen strong vowel intrinsic durations from the all-CNC column | `peterson-1960-duration-review.md` |
| Final PR | Klatt 1975 Table I | Eighteen prestressed word-initial voiceless VOT targets, with Cho & Ladefoged 1999 context | `klatt-1975-duration-review.md` |

Peterson is the selected intrinsic source under the acceptance criterion's Peterson-or-Umeda choice. Umeda's connected-speech vowel/consonant tables, Port's closure-duration data, and Oller's positional factors describe additional or competing contexts; this series does not multiply those models into the same durations. Existing unrelated contextual rules remain in effect.

Crystal's fast/slow categories calibrate the response to an explicit speech-rate input. They do not measure an isolated-word-to-connected-speech conversion; the default rate remains neutral. The former suggested 0.79 figure describes pauses in that paper and is not applied as a global segment multiplier. Each source review distinguishes measurements from engineering adaptations.

The default corpus was regenerated for each PR, and each review lists its changed segments. The fast-rate corpus is additionally retained from the Crystal PR onward. Focused tests establish red/green behavior and source provenance; full tests, schema checks, typechecking, and builds validate the stack. PRs are ordered Chen → Crystal → Peterson → Klatt.
