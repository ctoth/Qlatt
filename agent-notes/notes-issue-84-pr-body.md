Add rlib output to the remaining DSP crates and native integration tests that link their public constructors and destructors. Run cargo test --workspace in a separate CI job with the WASM target removed.

Correct an existing pitch-sync test that also fails on the base manifest: assert the reference history scaling before processing another input sample. Production DSP code is unchanged.

Closes #84

Validation:
- New native integration tests fail with unresolved imports before the manifest changes.
- cargo test --workspace
- pwsh -NoProfile -File build.ps1
- npm run check
- npm run typecheck

Checked-in public/worklets/*.wasm bytes are unchanged. Rebuilding with both crate types produces different generated WASM bytes; those generated binaries are excluded from this PR.

- npm test
