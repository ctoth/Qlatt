# DECtalk convergence assessment

## Current findings

- The committed DECtalk implementation includes a dedicated declarative frontend,
  synthesizer graph and semantics, ten speaker profiles, dictionary/LTS data,
  phonology/duration/formant/prosody rules, internal trace parsing/comparison, and
  an oracle corpus with paired DECtalk/Qlatt artifacts.
- `notes/dectalk-parity-backlog.md` is a historical execution ledger. Its opening
  gap inventory is stale relative to later status entries and current commits.
- The latest DECtalk-specific commits found are from 2026-07-12, including the
  KLGLOTT88 device-sample-rate decoupling fix. The oracle artifact directories
  found were last written on 2026-06-27.
- The worktree is on `master` tracking `origin/master` with many untracked files.
  DECtalk-specific untracked work includes KLGLOTT investigation notes, diagnostic
  scripts, and additional oracle output. These are not being treated as committed
  completion evidence.
- The newest 50-phrase scoreboard was generated 2026-06-27: 48 failures, 1 warning,
  average STOI 0.1433, average token similarity 0.9281, average trace duration delta
  -0.2893 s, average trace F0-min delta -8.95 Hz, and average trace F0-max delta
  -18.42 Hz. It predates the 2026-07-11 HRG replacement and 2026-07-12 KLGLOTT
  sample-rate fix, so it is historical evidence rather than a current baseline.
- The HRG convergence log records passing current architecture, static, full,
  golden, strict-citation, build, and real-browser gates, including a successful
  DECtalk browser render. This proves the production path is structurally live,
  but does not prove DECtalk acoustic parity.
- Several items still named as gaps in the historical backlog are now implemented
  in current code. For example DECtalk normalization now includes fractions and
  ordinals, and the current HRG rule data contains substantial transition, VOT,
  aspiration, speaker, and prosody machinery.
- Fresh current-master run: `test/oracle-output/dectalk-current-20260720` generated
  2026-07-21T02:18:52Z. It produced 49 reports: 0 failures, 43 warnings, 6 passes,
  average token similarity 0.9981, average trace duration delta -0.0169 s, average
  F0-min delta -0.772 Hz, average F0-max delta -8.243 Hz, and average STOI 0.2224.
- One corpus entry, `fric-safe-zone` ("Safe zones feel fuzzy."), failed to render.
  The Qlatt stderr is a CEL `EvaluationError: No such key: phoneme` while evaluating
  `current.phoneme in ['S', 'Z']` for rule `dectalk_assimilate_sibilant_sh` in
  `public/rules/frontends/dectalk-english/phases/postlexical.yaml`.
- The individual word `the.` has exact symbolic tokens and only -9.95 ms duration
  drift, but F0 mean is 102.23 Hz versus DECtalk 121.79 Hz (-19.56 Hz), with low
  waveform correlation 0.065. Pitch is therefore a concrete convergence surface
  even where phones and gross timing already match.
- Root cause of the missing `fric-safe-zone` report: `dectalk_geminate_delete`
  used `copy_from: n`, but `n` is a rule `define`, not a match capture. The splice
  resolver therefore copied no features and inserted a featureless active Segment.
- Current slice changes `copy_from: n` to `copy_from: current`. The two same-word
  geminate obstruents are constrained to the identical phoneme and share the same
  inventory target/word, so this preserves the target features while summing the
  durations and avoids adding or changing engine machinery.
- Added a red-to-green DECtalk end-to-end regression using "Safe zones feel fuzzy."
  that requires every active Segment to retain string `phoneme` and `type` fields.
- Real oracle rerun for `fric-safe-zone` now succeeds: token similarity 1.0,
  duration delta +0.10515 s, F0-min delta -2.633 Hz, F0-max delta -8.384 Hz,
  STOI 0.17760, warning only for residual acoustic mismatch.
- Verification: targeted regression passed; full `test/dectalk-e2e.test.ts` passed
  40/40; full `npm test` passed 117 files / 941 tests, including the 5,400-word
  dictionary audit with zero processing errors; `git diff --check` passed.

## Current state

- The repository appears past foundational bring-up. The likely remaining work is
  measurement-driven convergence and residual linguistic/acoustic fidelity, not
  construction of a basic DECtalk path.
- The internal trace oracle plan is committed and its expected trace artifacts and
  comparator have corresponding current files/commits, but its exact completion
  against every listed success criterion still needs direct code/artifact checking.
- Exact-convergence work is active. The current slice is the incomplete 50th corpus
  render. The defect is repaired and fully verified; the slice is ready for an exact
  two-file commit before any pitch or acoustic tuning begins.

## Blocker

- No external blocker.

## Next action

- Commit only `postlexical.yaml` and `test/dectalk-e2e.test.ts`. Then regenerate a
  complete 50-report baseline on the committed tree and select the first one-word
  pitch target from phase-aligned trace evidence.
