# Goal
Implement #165's pre-encoding evidence slice without adopting the untracked audio-lint/measurement work.

# State
Approved by supervisor under the campaign authorization. Base a54237ac. PR #386 published; independent Claude review and replacement hosted CI pending. No local tests or CI steps run. Initial quality job 119107548295 reported two test assertion formatting reflows; applied exactly, with no behavior changes. The unrelated frication constant warning remains untouched.

# Decisions and why
Smallest change: roughly 40–60 production lines and 70–100 focused test lines in the WAV writer, rendering types, and render CLI. Count finite samples outside [-1,1] and finite absolute peak before clamping; exact endpoints are valid. Count nonfinite samples separately and reject before output writes. Preserve finite PCM mapping and the public toInt16 return type. Return encoding evidence from writeWav and add it to reports only when encoding occurs. Use existing Diagnostics for one structured summary with the WAV path; serialize the report after successful encoding.

# Surprises
The existing CLI writes JSON before WAV. Reordering is necessary to avoid publishing a success report before invalid encoding fails. Main's lint-audio.ts and measurement helpers are untracked and remain untouched.

Implementation adds about 60 production lines including types. The focused test file is about 110 lines: valid PCM/endpoints, signed overrange, distinct nonfinite counts/rejection, actual CLI report propagation through a mocked render backend, no output on invalid encoding, and no clearance claim without WAV encoding. `toInt16` still returns Int16Array for the speak-server caller; invalid values now explicitly throw. Clipped WAVs still encode with the existing mapping. The optional Diagnostics argument supplies one summary warning after successful file writing, or one error before invalid encoding throws.

# Next step
Read replacement hosted CI and respond to independent Claude review. Supervisor owns merge. Full #165 stays open for the lint baseline and evidence association contract.
