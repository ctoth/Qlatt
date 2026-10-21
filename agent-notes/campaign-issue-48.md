# Goal
Retire #48's reachable standalone legacy synthesizer and its browser/script entry points; preserve external reference oracles and uncertain historical golden artifacts.

# State
PR #398 on isolated base 1166d308. Claude completed two passes over the initial 15-file range: no runtime defects, one stale-documentation finding. Implementer accepts the review and corrected the verified project AGENTS architecture/builtin descriptions, synthesizer guide table and both semantics comments. Numeric values are unchanged. No local CI runs.

# Decisions and why
Smallest deletion-first change: remove roughly 1,700–1,900 core lines plus three historical convenience scripts, with about 30–60 adapter/test/documentation lines. Delete the class, legacy offline HTML, tsconfig entry, sole standalone wiring test and unused builtin ndbScale export/assertion. Keep independent primitive tests and fixtures. Make browser rendering explicitly runtime-only, without remapping legacy requests. Retire export-track, render-qlatt-track and run-golden-master; document current render-phrase usage instead of recreating their legacy AGC/telemetry contract.

The backend was reachable through browser-runtime.ts and browser-session.ts, not dead code. The two standalone script callers supply options absent from the runtime page, so silently changing their target would misrepresent behavior. The historical orchestrator also calls an absent render-phrase.mjs. Active run-golden.ts separately uses WASM comparisons and render-phrase.ts.

# Surprises
External render-klatt-syn-track.mjs and klatt-syn-render.mjs import ~/src/klatt-syn/dist/Klatt.js. Their artifacts and amplitude convention are independent. Preserve both scripts and all goldens rather than infer ownership from filenames. Live graph-owned formant-bank ndbScale metadata is required by formant-bank validation and PFE generation. This slice does not satisfy #48's literal no-ndbScale-outside-semantics acceptance; the issue remains open for that ownership decision.

# Next step
Actual change removes about 2,260 lines including the historical scripts, with about 20 replacement adapter/test/documentation lines. Existing rejection tests now cover the retired engine with and without speaker and with performance options. Independent primitive tests/fixture and all golden artifacts are unchanged. Remaining tracked executable references to the deleted class/page/scripts were searched; none remain.

Read replacement hosted CI after the documentation response. Supervisor owns review verification, merge and #48 acceptance grooming. Preserve other agents' work; no local CI gate or self-merge. This is a retirement of a reachable backend, not a dead-code cleanup or full #48 closure. Track-only arbitrary engine metadata behavior is unchanged: that path does not render audio.
