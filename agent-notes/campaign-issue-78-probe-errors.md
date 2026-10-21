# Issue 78: preserve native resource probe errors

## Goal
Distinguish absent resources from permission/other filesystem failures in the existing logical/native candidate loop.

## State
PR #465 published from 87a34adc. Candidate probes now propagate all failures except ENOENT/ENOTDIR. Existing fixture covers permission errors for file URL, absolute native and logical paths through text/binary and synchronous/asynchronous YAML acquisition; both absence codes cover text reads and asynchronous optional YAML. No local CI.

## Decisions and why
Smallest approved change: replace existsSync and its blanket catch with statSync and the same ENOENT/ENOTDIR-only absence handling already used for explicit file URLs (about 6–10 production lines). Extend the existing YAML permission fixture for native absolute/logical paths and retain real missing-resource behavior (about 20–35 fixture lines). Candidate order, HTTP/file URL behavior and directory read failures remain unchanged. No new root/resolver/schema/framework.

## Source evidence
src/path-utils.ts candidate loop currently suppresses probe failures. src/yaml-loader.ts wraps resolved read/probe errors as E_YAML_READ with cause; rule-pack.ts include fallback catches only missing-resource errors. Permission failures must not select an inherited include as though the authored file were absent.

## Surprises
Claude noted an unverified Windows possibility: normalized absolute paths begin `/C:/...`, and a non-absence stat error would stop before the original native path. A direct read-only Node22.18 fs.statSync probe of `/C:/Users/Q/code/Qlatt-campaign-78-probe-errors/public/rules/frontends/qlatt-english/frontend.yaml` returned `ENOENT`, path `C:\C:\Users\Q\code\Qlatt-campaign-78-probe-errors\public\rules\frontends\qlatt-english\frontend.yaml` (tool chunk5c4f76). This establishes the observed Windows error classification, not broader platform test coverage. Other agents own separate worktrees; preserve their changes.

## Next step
Private review and implementer response complete; hosted CI and root gate/merge pending. This is partial #78, not package discovery/root-threading completion.

## Review response
Claude Code Opus5.5 reviewed all three files twice over87a34adc...d08905b2 and verified the GitHub range. No findings. Accepted minor observations: corrected helper documentation to mention probe errors, removed the now-redundant existsSync HTTPS assertion while retaining the meaningful statSync no-probe assertion, and made fixture coverage precise above. Transcript149a0851-7f2e-44df-b0f9-27d2bb7f00ea.jsonl, session13712. No local tests, builds or other CI steps ran.
