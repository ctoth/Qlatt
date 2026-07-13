# f0-filters extraction — independent verification (dispatcher)

Datestamp: 2026-05-29. Branch: renderlayeredf0-crate.

## Coder (agent a6fa42deb793a5620) reported PARITY-CONFIRMED. I independently re-verified:

- **Parity (the load-bearing claim): BYTE-IDENTICAL.** Method: stashed tracked
  changes (track-assembler.ts reverts to master's inline renderLayeredF0; grep
  confirmed 0 kernel refs), ran scripts/f0-fingerprint.ts -> /tmp/f0-pre.txt
  (10211 lines). git stash pop (kernel version restored, 2 refs). Ran fingerprint
  -> /tmp/f0-post.txt (10211 lines). `diff` = ZERO differing lines. Master inline
  vs WASM kernel produce byte-identical F0 (IEEE-754 hex, dectalk frontend,
  12 phrases x 3 configs).
- **vitest: 1109/1109** (re-run on branch).
- **cargo test -p f0-filters: 9/9** (re-run).
- **wasm rebuild from source OK**, 33063 bytes, copied to public/worklets/.

## Files changed (this branch vs master)
Tracked: Cargo.toml, Cargo.lock, build.ps1, build.sh, src/track-assembler.ts (320-line
diff), src/worklets/wasm-utils.ts (+initWasmModuleSync). New: crates/f0-filters/
{Cargo.toml,src/lib.rs(724)}, src/f0-filters-loader.ts, public/worklets/f0-filters.wasm,
scripts/f0-fingerprint.ts.

## NOW: codex review running (bg task bkmxmh6j2), prompt prompts/f0-filters-codex-review.md,
writes notes/f0-filters-codex-review.md. Focus: FFI memory safety, Rust panics,
order/parity hazards beyond battery, error-handling parity, sync loader, build wiring.
After codex: address any HIGH/MED findings, then commit + merge down.

## CODEX REVIEW (bg bkmxmh6j2) -> CHANGES-REQUIRED. Findings VERIFIED real:
- HIGH: setF0FilterWasmBytes never called -> browser dectalk path throws "WASM not
  loaded" (index.html:47 dectalk option + runtime.js:44 sync call). Real regression
  (inline TS worked before). Fix: browser preload via fetch (klatt-synth.ts pattern).
- MED: (1) durationFrames now validated for ALL impulse cmds vs master only those the
  frame loop reached; (2) unknown impulse decay string: master no-op, new -> NaN -> Rust
  mode 0 (behavior change); (3) wasm buffers freed only on success path (leak on
  trap/throw in singleton); (4) render_f0 trusts FFI shape -> panic/trap on malformed.
- LOW: initWasmModuleSync ignores ArrayBufferView byteOffset/byteLength.
- VERIFIED via grep: setF0FilterWasmBytes truly uncalled; decay is enum-typed.
- Dispatched fixes back to coder a6fa42deb793a5620 (SendMessage, context intact) with
  hard re-verification gates: parity STILL byte-identical (MED/LOW are no-ops for valid
  input), vitest 1109, cargo green + new tests, browser preload wired. Awaiting result.

## CODEX FIXES VERIFIED (2026-05-29) — all 6 addressed, re-verified independently:
parity STILL byte-identical (stash method, 10211 lines), vitest 1117, cargo 17.
INCIDENT: coder's worktree node_modules-junction cleanup WIPED the shared node_modules
(empty dir, 00:39). Restored via `npm ci`. Other agents on this machine may have been
hit. Flag to Q; the worktree+junction approach on Windows is dangerous.

## MERGED TO MASTER (local, NOT pushed) 2026-05-29:
- #3 committed 555f4b80 on renderlayeredf0-crate.
- master FF'd to 14222acd (#1/#2), then merged renderlayeredf0-crate (#3) NO-CONFLICT
  (git auto-merged track-assembler.ts cleanly). master now has #1a+#1b+#2+#3.
- MUST VERIFY merged master: rebuild wasm + full vitest + parity fingerprint (a clean
  textual merge can still be semantically wrong — both #1b diagnostics import + #3
  getF0FilterExports import + combined lowering function need to compile+behave).
- NOTHING PUSHED. Reversible via git reset if Q wants branches kept separate.

## Branch ledger
- declarative-f0-cleanup @ 14222acd: #1a+#1b+#2, vitest 1097.
- renderlayeredf0-crate: #3 (uncommitted working tree), parity-verified, awaiting codex.
- #4 golden RED: ignored per Q.
