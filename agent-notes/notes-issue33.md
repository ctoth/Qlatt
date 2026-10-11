Issue 33: implement with TDD in a clean worktree and publish a PR containing Closes #33; merge not requested.
Worktree: C:\Users\Q\code\Qlatt-issue33; branch: issue-33-rd-policy; fetched base: 51d572eaf34ef1401c26dc679877686f3ad710a0.
Issue is open; apply-affect.ts still defines RD_MIN, RD_MAX, RD_FALLBACK; HRG lowering also clamps Rd.
No implementation or tests changed yet. No blocker established.
Next: trace frontend policy/loading contracts and existing tests; write regression before production changes.

Checkpoint: vq-channels dependency is implemented; bandwidth floors already live in public/rules/policy/vq-channels.yaml with engineering-estimate citations.
applyAffectToTrack has no production caller found; tests exercise it. HRG lowering is the active production projection.
LowerContext accepts speakerParams; frontend does not directly load experiment semantics at the lowering call.
Considering the issue's allowed shared declared policy approach for effective Rd range, with loud missing-Rd diagnostic.
Still discovery only; no production or test changes. Next inspect complete affected contracts and implement TDD.

Checkpoint: added and directly inspected test/rd-policy.test.ts in worktree; production unchanged.
Regression mocks the existing vq-channels YAML loader with effective_rd min 0.5/max 1.5 and tests both clamps plus E_RD_MISSING.
Plan: add cited effective_rd policy to existing YAML, shared Rd projection helper, consume in apply-affect and HRG lowering.
Installed npm ci; manifest/lock diff exit 0. Vitest executable verified.
Next run red test redirected to verified C:\Users\Q\AppData\Local\Temp\tmpxwfay3.tmp, then implement.

Checkpoint: red regression ran: test_exit=1; got 2.7 instead of YAML 1.5, 0.3 instead of 0.5, and missing Rd did not throw.
Added effective_rd policy to vq-channels.yaml and new src/input/rd-policy.ts (directly inspected); helper validates policy, resolves frame/speaker Rd, emits diagnostics and projects offset.
apply-affect.ts now imports/calls projectRd; obsolete clampNumber is currently unused and needs removal. No green run yet.
HRG lowering remains unchanged; replace block at 2054-2076 and import helper, passing speakerParams/utterance diagnostics/itemId.
Next finish wiring, add HRG and diagnostic coverage, run focused tests/static checks, final gate, commit and PR with Closes #33.

Checkpoint: both apply-affect and HRG lowering now use projectRd; removed unused clampNumber. HRG passes context.speakerParams and utterance diagnostics.
Focused run: new rd-policy tests and vq-channels tests passed; one old timing fixture failed E_RD_MISSING because its params had only F0/AV.
Inspected complete anxious timing test; added explicit Rd: 0.7 to its fixture. Need rerun green.
Discovered test/hrg-lowering-affect.test.ts with reusable setup for HRG coverage; current exploration stopped at symbol inventory.
Outstanding: stronger policy/speaker/diagnostic and HRG coverage, formatter/typechecks, full WASM prerequisite gate, scoped commit and PR.

Checkpoint: new Rd tests cover policy validation, missing/nonfinite base diagnostics, clamp diagnostic bounds, speaker resolution, and YAML clamp changes.
Speaker-resolution diagnostic had its own red failure, then implemented RD_SPEAKER_RESOLVED in projectRd.
Ran changed-file biome check --write successfully (biome_exit=0); output currently in verified temp log tmpxwfay3.tmp and needs bounded inspection.
CI uses npm run typecheck covering src/test/scripts, Node 24, bash build.sh, npm test, npm run build. Local Node 22.18.0.
Next inspect formatter summary, focused tests including hrg-lowering-affect/input, typecheck; inspect diff and build prerequisites before full gate and PR.

Checkpoint: focused six test files passed; typecheck found one conditional fixture dictionary inference error.
Rule 0 completed: appended global C:\Users\Q\.codex\AGENTS.md guard at line 792, explicitly typed fixture Record<string, number>; typecheck_exit=0; repository_instruction_diff_exit=0.
Candidate tracked diff limited to policy YAML, apply-affect, lowering, timing fixture; new helper/test remain untracked pending staging.
Full gate prerequisite discovery: klsyn88 imports oversampled_glottal_source, triangular_source, impulsive_source, square_source, tilt_filter, pitch_sync_mod, fujisaki_resonator WASM under target/wasm32-unknown-unknown/release.
Next inspect/build via build.ps1, final diff/checks, commit, full suite at candidate and PR publication; Closes #33 required, merge not authorized.

Checkpoint: committed scoped six-file candidate 27b4b0bf (Read effective Rd bounds from declared voice-quality policy). Commit exit 0; no PR yet.
Changed-file Biome check clean, focused tests passed, full typecheck passed; staged whitespace gate passed.
WASM producer pwsh -NoProfile -File build.ps1 exited 0, no tracked generated-file churn. release artifact directory now verified True.
Next emit exact klsyn88 artifact inventory immediately before full npm test at candidate commit; inspect finished bounded log, then fetch base/publish PR.
PR needs Closes #33. No merge authority. Root notes and global durable fixture guard remain outside candidate.

Checkpoint: full npm test passed on implementation commit 27b4b0bf; full_test_exit=0. Fetched master had advanced to 8d8d1844; merged cleanly into candidate 0fc46f1d28a806c866f5d0848c545c749f2e7b8f.
Published PR https://github.com/ctoth/Qlatt/pull/128 from same-repository branch issue-33-rd-policy; PR is OPEN/MERGEABLE/isCrossRepository=false.
Remote body canonical equality verified body_match=True and closes_phrase=True (Closes #33).
CI quality is IN_PROGRESS on updated head; PR documents local checks preceded latest base integration and Node 22 vs CI Node 24.
Requested PR milestone complete; no merge requested. Next final clean-worktree check and concise delivery response with CI pending.
