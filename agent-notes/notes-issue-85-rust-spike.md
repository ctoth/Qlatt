Checkpoint 2026-09-08: #85 requests CEL inventory, pinned Rust parity spike, normative builtin catalog, adoption decision.
Implementation isolated at C:\Users\Q\code\Qlatt-issue-85 on spike/issue-85-rust-cel (base b48d2ce7); main dirty work preserved.
Added audit scanner and standalone Rust runner pinned cel 0.14.5, Cargo.lock; discovered optional-member syntax in live corpus.
Current build blocker: cel 0.14.5 custom Value argument uses changed extraction API; source inspection next.
Next: finish execution probes, tighten extraction coverage, write builtin definitions and decision, run focused checks.
Checkpoint 2026-09-08: release Rust spike runs; 67 YAML files, 1632 distinct expressions, 97 constructs, nine native parse failures.
Measured gaps: mixed arithmetic, double remainder, join, Unicode size (1 vs 4), custom builtins and optional-member syntax.
Rust mixed-add/mod/round registrations pass reference probes; scanner tests pass; normative builtin catalog written in isolated worktree.
Decision being recorded: adopt cel-rust with explicit dialect/host adapters, no production switch; debug corpus run overflowed Windows default stack, release succeeds.
Next: finalize coverage/decision docs, ensure snapshot check and Rust numeric tests, format/typecheck and review final artifacts.
Checkpoint 2026-09-08: audit and Rust spike complete in isolated worktree; decision adopts cel 0.14.5 with compatibility layer.
Corrected optional finding: enable_optional_syntax(true) supports valid optional access; nine corpus has(optional-member) expressions also error in reference.
Final focused verification: 5 scanner/catalog tests, 5 Rust tests, targeted TS typecheck, artifact --check all pass; Clippy previously passed.
Artifacts: 2956 occurrences / 1632 expressions / 97 constructs from 67 YAML files; normative builtin contract and host-contract link written.
Next: final Clippy/diff review and scoped local commit; no remote publication or issue closure requested.
Checkpoint: user authorized updating/filing Rust plan issues. Filed #238 semantics, #239 string/regex, #240 HRG bindings, #241 checked executor, #242 benchmarks.
Current ownership respects #226/#227 compiler-native split; native transcription remains later and #89 owns backend graph/audio integration.
Updated and remotely verified #85, #83, #89, #227; script still finishing #226 and child verification.
Caught and repaired CRLF double-translation on issue update using original saved bodies and explicit LF body files; no substantive content lost.
Artifacts/script/backups are uncommitted under notes/rust-cel-issues; #85 stays open because spike and validation commits remain local/unpublished.

Checkpoint: frontend/model validation, 2026-09-08
- Existing metadata check rejects qlatt-english/klsyn88 audio; track-only rendering bypassed it and falsely reported success.
- Isolated fix/frontend-model-validation worktree now validates track-only requests and includes experiment ID in loader/browser errors; two red regressions turned green.
- Checked every manifest model with qlatt-english: stevens91 lacks A7-A10; beauty lacks effort/aerodynamic controls; other inherited models pass vocabulary checks.
- 39 focused tests and core/scripts typechecks pass. No blocker; finish formatting/diff review and report local changes.

Checkpoint: wiring and paper reread, 2026-09-08
- User directs fixing missing consumers instead of removing emitted controls, and rereading papers to correct/improve paper notes.
- Added Stevens A7-A10 parallel branches and NFC cascade-count wiring; red regressions exposed both. Gain test still wrongly assumes PFE A=0 is exact silence; investigate rather than hide.
- Read every Shadle 2023 page image (0-12); corrected notes formula, taper count, style significance and distinction between measured spectra and engineering A7-A10 suggestions in isolated worktree.
- Reading Stevens 1991 images (0-5 done); async question pending about preserving historical klsyn88 versus extending model. Continue paper reread, wiring validation and scoped tests.

Checkpoint: validation green, 2026-09-08
- Full npm test completed: 221 files, 1891 tests passed (336.59 s); WASM build, core/scripts typechecks and scoped Biome checks passed.
- Stevens A7-A10 now have real parallel paths and each changes rendered audio; NFC drives cascade bypass. Track-only pairing validation and contextual browser errors covered.
- Finished all Shadle 2023 (13 pages), Stevens 1991 (14 pages), and Rabiner digital synthesizer 1968 (7 pages) images. Two notes updated; Rabiner table verified, clarify its topology/sample-rate scope next.
- Final cleanup: restore only build-generated public/worklets changes in isolated worktree; review final diff. klsyn88 preserve-versus-extend question remains unanswered.

Checkpoint 2026-09-08: Synthesizer composition design review requested with Claude and Bacon.
Bacon currently supports flat graphs and ordered primitive registry layers, not subgraphs or slots.
Qlatt has two one-parent experiment loaders with different constants merge behavior; replacement must own semantics as well as nodes.
Claude read-only review is running; prompt/report live under notes/synthesizer-composition/.
Next: reconcile Claude findings into a bounded composition spike; preserve the existing modified docs/host-contract.md.

Checkpoint 2026-09-08: Claude completed initial and follow-up read-only composition reviews; reports saved in notes/synthesizer-composition/.
Reconciled design requires owned components, explicit exports/imports, transitive semantic checks, recursive configuration resolution, and flat host artifacts.
Bacon baseline suite passed 25 tests; direct baseline graph check reproduced unknown macro-generated cascadeF1 (preserve edge, check expanded graph).
No implementation/publication performed; existing host-contract edit preserved. Historical baseline identity still needs a cited capability audit.
Next: one resolver and checked expanded graph, then a three-generation source replacement proof including shared parallel-branch controls.

Checkpoint 2026-09-08: Published Qlatt #251 resolver, #252 expanded validation, #253 composition spike, #254 historical capability audit.
Published Bacon #7 strict structural validation and #8 graph composition contract/prototype after Q explicitly welcomed Bacon improvements.
Linked the work into Qlatt #74/#248 and component/validation dependencies; final #252 edit is finishing.
Issue bodies are saved under notes/synthesizer-composition/; no implementation edits or commits in this publication pass.
Next: verify published issue state and report links; implementation begins with resolver/validation foundations.
