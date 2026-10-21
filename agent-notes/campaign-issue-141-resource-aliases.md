# Goal

Make seven existing frontend resource roles canonical under `resources`, keeping
one-release authored path aliases with warnings (#141).

# State

Isolated branch from PR408 final 8ec65ce9. Implementation and fixture migration
complete; PR #413 published. Source and owned diff inspected. No local CI runs.
Production delta is 96 additions / 36 removals across three existing modules;
fixtures add 187 lines / remove 67. Bundled declarations and the current lexical
stress documentation use the canonical roles. Broader #141 acceptance remains open.

# Decisions and why

Smallest approved scope: 180–280 production lines, 150–250 existing fixture lines,
and 20–35 bundled declaration lines. Normalize authored aliases before inheritance
and programmatic compilation. Canonical roles win within the same document;
missing child roles inherit and explicit null replaces the inherited value.
Remove legacy normalized fields and migrate real consumers and mutating fixtures.
Use existing compiler diagnostics for W_FRONTEND_RESOURCE_ALIAS, preserving source
metadata. VQ/affect remain unchanged. Nested parser/speaker/accent roles, URL bases,
language ownership and full immutable closure remain separate work. No new cache,
resolver, protocol or validation framework. Other agents' work stays intact.

# Surprises

Beauty's legacy inventory override requires normalization before composition;
normalizing only the merged root would incorrectly prefer the inherited role.
Existing tests that replaced the entire resources map to remove one optional role
now preserve its other roles. Lowering fixtures read canonical inventory references.
Warnings reuse the existing RULEPACK_DIAGNOSTICS map through composition; no new
cache. Authored YAML spans are read from the original parsed document before alias
normalization. Programmatic voice preprocessing retains its existing input behavior.
Hosted quality job119166357822 found formatting differences in four edited fixture
files. Applied the exact emitted wraps/indentation; no production behavior changed.

# Next step

Await hosted CI and Claude review, then respond to concrete findings.
Supervisor owns merge; #141 stays open.
