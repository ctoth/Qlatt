# Issue 48: authorized one-off golden evidence

## Goal
Run the existing golden command once after legacy backend retirement. No production change, rebuild, new check, or golden regeneration.

## State
Candidate d5da3d8728bb896453e3cc87e52e2decff1a28cc in an isolated worktree. Initial `npm run test:golden` exited 1 for missing dependency, then stopped and reported. Parent classified this as an unmet setup prerequisite and explicitly authorized isolated locked dependency provisioning. After that correction, the intended command exited 0.

## Decisions and why
Q explicitly authorized this local golden run. The first attempt used a parent-authorized junction to preserved Qlatt-campaign-316/node_modules, without installation. After the missing dependency error, the final setup used a separate locked installation in this checkout, described below. The preserved tree was unchanged. Installed YAML 2.9.1, js-yaml 5.4.3 and node-web-audio-api 1.0.8 (locked fork ce3ed1d487a9c2ad4d3090119c208f386a3123f0) are present, including the copied native .node artifact. Node is v22.18.0. Both attempts used tracked public/worklets WASM files in this candidate.

## Evidence limits
package.json test:golden invokes scripts/run-golden.ts. That runner invokes tract and LF WASM comparators, then render-phrase without arguments. The render-phrase default persistWav=false bypasses waveform comparison, so that third invocation is rendering smoke, not phrase byte identity. The runner collects child failures and continues its own list before exiting nonzero; no follow-up execution will be attempted on failure.

## Surprises
I verified selected YAML/native prerequisites but missed the newer @bacon/core dependency absent from the shared installed tree. The phrase child failed before rendering with:

```text
Error: Cannot find package '@bacon/core' imported from C:\Users\Q\code\Qlatt-campaign-48-golden\src\experiments\prepare-experiment-config.ts
```

Both WASM comparators completed within their existing tolerances. At 22050 Hz and 256 samples, resonator maxDelta=0.00000187047980833039, rmsError=0.0000010582808756434203, maxRelError=0.000014346770331340953. Antiresonator maxDelta=0.002229056500027582, rmsError=0.00017063198707248313, maxRelError=0.000006840450690992893; its relative error satisfies the existing combined tolerance. LF maxDelta=0.000009876618568424589 satisfies its maxDelta threshold 0.00001; rmsError=0.000005580095066490851 is reported but not gated. This is tolerance evidence, not byte identity, and the whole first command failed.

Removing the prior merged worktree from its own working directory left an empty directory after Windows denied removing the current directory. Its registration and branch were removed; the verified empty directory was subsequently removed from outside it.

## Next step
PR #463 is published and private Claude review is complete. Root owns final review, hosted CI, merge and issue bookkeeping. No further local golden execution.

## Setup correction and completed run
Removed only this checkout's verified node_modules junction; preserved 316 stayed unchanged. Ran `HUSKY=0 npm ci --no-audit --no-fund` in this checkout (PowerShell environment assignment), which installed 85 packages and exited 0, including pinned @bacon/core 394603ae81eed7e5a279a2a263055461a57ce21c with its normal prepare build. npm warned that lint-staged 17.6.0 requires Node>=22.22.1 while the installed Node is 22.18.0; no lint-staged gate was run. Husky installation was skipped to avoid shared-hook changes.

Copied only the existing native binary into this checkout's new dependency directory. Source and destination SHA256 both `06EDB9BCAC123EA4A1BC3A59EA77908412D23DD2D64B301609C6E93A5FF93E03`. Installed native package metadata matches locked fork ce3ed1d487a9c2ad4d3090119c208f386a3123f0. The matching hash establishes a faithful copy, not independent verification of the historical binary's build provenance.

Executed `npm run test:golden` again after correcting setup; exit 0. Comparator numbers were identical to those recorded above; phrase rendering completed without additional output. Raw first attempt: tool chunk 2059c9. Completed attempt: exec session 27008, chunks 116ebb and 347dc3. No production, test, workflow, golden, or lockfile edit. The first failure is retained as setup evidence rather than hidden by the successful run.

## Private review and implementer response
Claude Code Opus 5.5 reviewed the complete one-file PR range d5da3d87...3a31508f in two passes, verified against GitHub. Transcript: dee73507-a700-4a73-a550-fae9cbfd77f8.jsonl, execution session 30107. Accepted the wording findings: explicitly separated initial junction from final installation, attached the LF tolerance to maxDelta only, updated publication state and spacing. Also made the historical native-build limitation explicit. No numerical, source-change or waveform overclaim defect was reported. Source inspection checks consistency; it does not independently reproduce the recorded historical execution. No review-triggered golden run occurred.

## Captured completed-command output
The following is a transcription of the complete merged stdout/stderr emitted by `npm run test:golden` in tool chunk116ebb. The preceding setup hash/status output is described above. Completion chunk347dc3 contained only a blank line and reported process exit code 0. No command was rerun to produce this transcription.

```text
> qlatt@0.1.0 test:golden
> node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/run-golden.ts

(node:117852) ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`:
--import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm/transpile-only", pathToFileURL("./"));'
(Use `node --trace-warnings ...` to show where the warning was created)
(node:117852) [DEP0180] DeprecationWarning: fs.Stats constructor is deprecated.
(Use `node --trace-deprecation ...` to show where the warning was created)
(node:134792) ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`:
--import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm/transpile-only", pathToFileURL("./"));'
(Use `node --trace-warnings ...` to show where the warning was created)
(node:134792) [DEP0180] DeprecationWarning: fs.Stats constructor is deprecated.
(Use `node --trace-deprecation ...` to show where the warning was created)
{
  "sampleRate": 22050,
  "results": [
    {
      "name": "resonator",
      "length": 256,
      "maxDelta": 0.00000187047980833039,
      "rmsError": 0.0000010582808756434203,
      "maxAbsExpected": 0.130376368,
      "maxRelError": 0.000014346770331340953
    },
    {
      "name": "antiresonator",
      "length": 256,
      "maxDelta": 0.002229056500027582,
      "rmsError": 0.00017063198707248313,
      "maxAbsExpected": 325.863981881,
      "maxRelError": 0.000006840450690992893
    }
  ]
}
(node:39768) ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`:
--import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm/transpile-only", pathToFileURL("./"));'
(Use `node --trace-warnings ...` to show where the warning was created)
(node:39768) [DEP0180] DeprecationWarning: fs.Stats constructor is deprecated.
(Use `node --trace-deprecation ...` to show where the warning was created)
{
  "sampleRate": 22050,
  "length": 256,
  "maxDelta": 0.000009876618568424589,
  "rmsError": 0.000005580095066490851
}
(node:108100) ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`:
--import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm/transpile-only", pathToFileURL("./"));'
(Use `node --trace-warnings ...` to show where the warning was created)
(node:108100) [DEP0180] DeprecationWarning: fs.Stats constructor is deprecated.
(Use `node --trace-deprecation ...` to show where the warning was created)
```
