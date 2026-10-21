# Goal

Declare and validate DECtalk segmental F0 profile roles for the remaining #207 scope.

# State

Authorized isolated branch campaign/issue-207-profile from origin/master 11840871. Planned 35–55 production/type lines, 3 YAML lines, and 65–100 focused test lines; actual change is 34 production/type lines, 3 YAML lines, and 57 test lines. Model declarations and command-length validation implemented. Tests cover absent/malformed/reordered declarations, voice overlays, invalid lengths, and equivalent three/four-value rendering. Tests were not run locally; hosted CI owns validation.

# Decisions and why

- Preserve the Rust ABI: voiceless, plosive, stressed at offsets 0–2 and optional glottal_gesture at offset 3 (`crates/f0-filters/src/lib.rs:287–330,399`).
- Declare four roles and required_profile_count 3 on the owning DECtalk segmental model. Validate the effective model at the existing renderer boundary before descriptors are lowered; no new loader validator or dynamic reorder.
- Actual producers in prosody.yaml use four values for phone/initial silence and three for written silence/dummy/final silence. Retain both lengths.
- Existing intonation fixtures read the bundled model; updating its YAML updates their declaration. Keep generic profile layers unchanged.
- Transition edge migration already exists: lowering consumes min_transition_edge_ms, with configured-edge coverage in test/hrg-lowering-fallback-policy.test.ts. No duplicate migration.

# Surprises

Claude found the previous local-test explanation checked the wrong WASM path. Accepted: src/f0-filters-loader.ts:100 reads public/worklets/f0-filters.wasm, not the target directory named in the note. Corrected the validation statement without running local CI or changing code/tests.

# Next step

Push the note correction and await final-head hosted CI and supervisor merge. The pause slice is already merged in #334.
