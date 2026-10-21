# Goal

Locate direct rule define expressions supplied by YAML map aliases, preserving anchor coordinates and caller-specific macro ancestry. Estimate: 45–65 production and 50–75 existing fixture lines. No recursive alias resolver, runtime schema, or map-origin API replacement.

# State

Started from PR423 final 0448c469; prerequisite merged as 614a07a1. Implemented 48 changed production lines and about 100 existing fixture lines: projected expression errors, caller macro ancestry, preserved alias occurrence, and actual DECtalk shadow ownership. Fixture formatting and the real shadow control account for the test estimate increase; no production scope expansion. No local CI; hosted validation pending.

# Decisions and why

Use the loader's actual aliasTarget and direct map children. Preserve the alias parent entry and anchor document paths; compiledPath identifies the consuming rule. Composition, shadow ownership, and macro lookup use that effective path. The real producer is DECtalk duration.yaml define &timing at line 227 and define *timing at line 380 onward.

# Surprises

Other agents own normalization resource moves and loader acquisition. Preserve their changes.

# Next step

Await hosted CI and Claude review, respond, then supervisor merges. Keep #224 open.
