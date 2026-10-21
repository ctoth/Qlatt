# Issue 78: preserve native resource probe errors

## Goal
Distinguish absent resources from permission/other filesystem failures in the existing logical/native candidate loop.

## State
Implemented on isolated branch from 87a34adc. Candidate probes now propagate all failures except ENOENT/ENOTDIR. Existing fixture covers file URL, absolute native and logical paths through text/binary and synchronous/asynchronous YAML acquisition, plus both absence codes. No local CI.

## Decisions and why
Smallest approved change: replace existsSync and its blanket catch with statSync and the same ENOENT/ENOTDIR-only absence handling already used for explicit file URLs (about 6–10 production lines). Extend the existing YAML permission fixture for native absolute/logical paths and retain real missing-resource behavior (about 20–35 fixture lines). Candidate order, HTTP/file URL behavior and directory read failures remain unchanged. No new root/resolver/schema/framework.

## Source evidence
src/path-utils.ts candidate loop currently suppresses probe failures. src/yaml-loader.ts wraps resolved read/probe errors as E_YAML_READ with cause; rule-pack.ts include fallback catches only missing-resource errors. Permission failures must not select an inherited include as though the authored file were absent.

## Surprises
None yet. Other agents own separate worktrees; preserve their changes.

## Next step
Publish PR, obtain private Claude full-range review and respond; hosted CI owns validation. Root owns merge. This is partial #78, not package discovery/root-threading completion.
