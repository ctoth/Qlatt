Port impulse-train, noise-source, differentiator, chalker-radiation, and glottal-mod to cited Rust crates. Add WASM bindings to all owning registries and update Node and standalone-synth loading. Preserve seeded noise and existing sample output; document the native ABI and approximation limits.

Closes #88

Validation:
- `pwsh -NoProfile -File build.ps1`
- `cargo test -p noise-source`
- `npm.cmd test`
- `npm.cmd run check`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `node scripts/compare-primitive-port-render.mjs 2ec12406` (Klatt80 Baseline and Qlatt Beauty renders match the pre-port worklets exactly)
- `node scripts/verify-primitive-port-browser.mjs` (Chrome output matches direct WASM calls for all five primitives)

`npm.cmd run test:golden` hits an existing `import.meta.env.BASE_URL` error before phrase rendering, reproduced on unchanged base `2ec12406`. The render comparison above uses its existing error tolerances.
