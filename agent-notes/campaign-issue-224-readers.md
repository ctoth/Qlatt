# Goal
Migrate five script YAML readers to the existing shared parser (#224).

# State
Based on master 9cededb9. Approved estimate: 15–25 changed script lines plus this note. No local CI.

# Decisions and why
Reuse parseYamlString with each actual input path in the word-rule audit, frontend manifest builder, DECtalk timing and ROM checks, and accessor rewrite script. Their documented ts-node invocation already supports the shared loader imports; the word-rule audit already imports it. No writer formatting, generated files, new parser flags or dependency removals. Empty/null inputs use shared parser rejection; shipped mapping documents remain the real inputs covered by existing parser parity. Existing resource-manifest tests exercise that script in hosted CI. Keep #224 open for remaining readers/writers and golden evidence.

# Surprises
Hosted quality job119309097305 requested three formatter-only call/type wrapping corrections. Applied its exact layouts; the unrelated existing numeric-constant warning is outside scope. No local CI.

Claude reviewed all six files at 9cededb9..4fcf641b in session 9b5cec7c-aa47-4607-ae33-2c5d3f49e30b and found no actionable defects. Implementer accepts the review and its optional stale-next-step note correction. The subsequent 0bedb0a6 source delta is formatting only. Empty input already failed under js-yaml 5; explicit-null inputs now use the shared rejection boundary documented above. No new guards or output regeneration.

# Next step
Await final-head hosted CI and supervisor review gate/merge. PR256 remains held and untouched.
