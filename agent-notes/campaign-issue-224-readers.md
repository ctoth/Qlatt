# Goal
Migrate five script YAML readers to the existing shared parser (#224).

# State
Based on master 9cededb9. Approved estimate: 15–25 changed script lines plus this note. No local CI.

# Decisions and why
Reuse parseYamlString with each actual input path in the word-rule audit, frontend manifest builder, DECtalk timing and ROM checks, and accessor rewrite script. Their documented ts-node invocation already supports the shared loader imports; the word-rule audit already imports it. No writer formatting, generated files, new parser flags or dependency removals. Empty/null inputs use shared parser rejection; shipped mapping documents remain the real inputs covered by existing parser parity. Existing resource-manifest tests exercise that script in hosted CI. Keep #224 open for remaining readers/writers and golden evidence.

# Surprises
None.

# Next step
Implement and publish for hosted CI and full Claude review. PR256 remains held and untouched.
