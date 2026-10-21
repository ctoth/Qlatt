# Issue 48: authorized one-off golden evidence

## Goal
Run the existing golden command once after legacy backend retirement. No production change, rebuild, new check, or golden regeneration.

## State
Candidate d5da3d8728bb896453e3cc87e52e2decff1a28cc in an isolated worktree. Initial `npm run test:golden` exited 1 for missing dependency, then stopped and reported. Parent classified this as an unmet setup prerequisite and explicitly authorized isolated locked dependency provisioning. After that correction, the intended command exited 0.

## Decisions and why
Q explicitly authorized this local golden run. Parent authorized a directory junction from this checkout's node_modules to preserved Qlatt-campaign-316/node_modules; no installation or changes to the preserved tree. Installed YAML 2.9.1, js-yaml 5.4.3 and node-web-audio-api 1.0.8 (locked fork ce3ed1d487a9c2ad4d3090119c208f386a3123f0) are present, including the native .node artifact. Node is v22.18.0. Use tracked public/worklets WASM files in this candidate.

## Evidence limits
package.json test:golden invokes scripts/run-golden.ts. That runner invokes tract and LF WASM comparators, then render-phrase without arguments. The render-phrase default persistWav=false bypasses waveform comparison, so that third invocation is rendering smoke, not phrase byte identity. The runner collects child failures and continues its own list before exiting nonzero; no follow-up execution will be attempted on failure.

## Surprises
I verified selected YAML/native prerequisites but missed the newer @bacon/core dependency absent from the shared installed tree. The phrase child failed before rendering with:

```text
Error: Cannot find package '@bacon/core' imported from C:\Users\Q\code\Qlatt-campaign-48-golden\src\experiments\prepare-experiment-config.ts
```

Both WASM comparators completed within their existing tolerances. At 22050 Hz and 256 samples, resonator maxDelta=0.00000187047980833039, rmsError=0.0000010582808756434203, maxRelError=0.000014346770331340953. Antiresonator maxDelta=0.002229056500027582, rmsError=0.00017063198707248313, maxRelError=0.000006840450690992893; its relative error satisfies the existing combined tolerance. LF maxDelta=0.000009876618568424589, rmsError=0.000005580095066490851 (threshold 0.00001). This is tolerance evidence, not byte identity, and the whole command failed.

Removing the prior merged worktree from its own working directory left an empty directory after Windows denied removing the current directory. Its worktree registration and branch were removed; cleanup will remove only the verified empty directory from outside it.

## Next step
Root receives the complete result for issue bookkeeping. No source or golden files changed; preserve this evidence until root instructs cleanup.

## Setup correction and completed run
Removed only this checkout's verified node_modules junction; preserved316 stayed unchanged. Ran `HUSKY=0 npm ci --no-audit --no-fund` in this checkout (PowerShell environment assignment), which installed 85 packages and exited 0, including pinned @bacon/core 394603ae81eed7e5a279a2a263055461a57ce21c with its normal prepare build. npm warned that lint-staged17.6.0 requires Node>=22.22.1 while the installed Node is22.18.0; no lint-staged gate was run. Husky installation was skipped to avoid shared-hook changes.

Copied only the existing native binary into this checkout's new dependency directory. Source and destination SHA256 both `06EDB9BCAC123EA4A1BC3A59EA77908412D23DD2D64B301609C6E93A5FF93E03`. The native package matches locked fork ce3ed1d487a9c2ad4d3090119c208f386a3123f0.

Executed `npm run test:golden` again after correcting setup; exit 0. Comparator numbers were identical to those recorded above; phrase rendering completed without additional output. Raw first attempt: tool chunk2059c9. Completed attempt: exec session27008, chunks116ebb and347dc3. No production, test, workflow, golden, or lockfile edit. The first failure is retained as setup evidence rather than hidden by the successful run.
