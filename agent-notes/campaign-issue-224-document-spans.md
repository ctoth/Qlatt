# Goal

Integrate the adopted #224 YAML parser and document-span side index through existing loaders. Smallest slice: about 150–210 production lines and 120–170 requested test lines, plus dependency metadata. Composition, compiler identities and evaluator work remain separate.

# State

Started from origin/master a7ea53087ddde30bfa905fd40cb33b1c36a90598. Current lock contains js-yaml 5.4.3 and transitive yaml 2.9.1. Existing async parsing distinguishes syntax errors, empty documents and missing resources; these contracts must remain.

# Decisions and why

Use one parseDocument call with LineCounter and explicit YAML 1.2 core options. Keep values plain and store serializable resource/role/path coordinates separately; WeakMap locates the metadata but does not define its identity. Preserve alias occurrence and definition locations. Keep js-yaml for requested document comparison and existing script consumers. No runtime double parsing or new CI workflow. Hosted CI owns validation; no local CI runs.

# Surprises

The main checkout's installed dependencies are older than the current lock. Do not use those installed versions as evidence of candidate parity. A browser absence test names the old parser's exception; update that assertion to the new parser while preserving the no-fallback behavior.

# Next step

Existing loaders now parse once through yaml, with explicit rulepack resource/role context and a serializable span accessor on uncomposed documents. Added coordinate, alias, malformed-input, independent-load and all public rules/experiments value-parity coverage in the existing loader test. Updated the parser-specific browser error-name assertion. No local tests or CI run. Publish for hosted CI and Claude review; composition propagation and all later #224 acceptance remain open.
