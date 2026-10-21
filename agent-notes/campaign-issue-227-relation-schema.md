# Compiler-owned typed relation features (#227)

## Goal
Compile existing typed relation-feature declarations once and consume their checked
shapes in TTS, including the real nested control_windows field.

## State
Authorized slice based on PR436 final 55498cff, now merged as 5d3c43e7. Budget:95–140
TypeScript lines changed including deletions,90–120 YAML and70–100 fixture lines.
No local CI steps. Preserve other agents' TTS policy/acquisition and checked-marker work.
Implemented checked shape side metadata, TTS consumption and three owning pipeline
declarations. Existing fixtures cover nullable/nested shapes, bare declarations,
all three control-window schemas and sync/async authored error coordinates.
Integrated master normally and published PR439. Initial hosted quality job
119231460407 reported import order and one fixture array wrap; applied its exact
corrections. Claude reviewed the complete nine-file initial 2f861c7d range in two
passes (session ae49eacb-508e-46a1-9842-c2fe79ae804f): no actionable findings.
Accepted without code changes. Existing nested nullable support and finer nested
error coordinates were observations without shipped producers, outside this slice.
Replacement hosted quality/native/audio checks passed; test shards remain pending.
Hosted shard3 exposed two fixture assumptions: a fixed source line shifted by25,
and renameVocabulary cloned a compiled spec without its compiler side metadata.
Updated the real line and compiled the renamed fixture against its corresponding
renamed inventory through the existing loader. Production validation is unchanged.
Applied hosted job119236825300's exact chained-spy formatter layout.
Shard2 then exposed the same cloned-spec assumption in two valid DECtalk rate
fixtures. Both now compile their configured clone before resolver delivery;
their policies, real inventory and downstream output assertions stay unchanged.

## Decisions and why
- Retain authored declarations and bare enum/name lists; validation currently reads
  field presence, while only TTS interprets kind/values/nullable.
- Reuse compileFeatureSchema and compiler-owned side metadata; no runtime validator
  or artifact envelope. Existing nullable spelling retains its meaning.
- Move the exact control-window shape from TTS into each owning pipeline because
  extending frontends replace their Segment relation declarations.
- Existing source-span diagnostics identify the offending declared feature.
- Preserve the old control-window object field order when copying validated values.

## Surprises
The initially named relationAllowsFeatureValue does not exist; the actual current
reader is relationHasDeclaredTypeField and tests key presence only.

## Next step
Complete final hosted CI, then hand merge to supervisor. Issue227 remains open.
