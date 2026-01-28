#!/usr/bin/env bash
set -euo pipefail

target_dir="target/wasm32-unknown-unknown/release"
dest_dir="public/worklets"

cargo build --release --target wasm32-unknown-unknown -p resonator
cargo build --release --target wasm32-unknown-unknown -p antiresonator
cargo build --release --target wasm32-unknown-unknown -p lf-source
cargo build --release --target wasm32-unknown-unknown -p signal-switch
cargo build --release --target wasm32-unknown-unknown -p edge-detector
cargo build --release --target wasm32-unknown-unknown -p decay-envelope
cargo build --release --target wasm32-unknown-unknown -p impulsive-source
cargo build --release --target wasm32-unknown-unknown -p triangular-source
cargo build --release --target wasm32-unknown-unknown -p square-source
cargo build --release --target wasm32-unknown-unknown -p tilt-filter
cargo build --release --target wasm32-unknown-unknown -p pitch-sync-mod
cargo build --release --target wasm32-unknown-unknown -p oversampled-glottal-source
cargo build --release --target wasm32-unknown-unknown -p fujisaki-resonator

mkdir -p "${dest_dir}"
cp "${target_dir}/resonator.wasm" "${dest_dir}/resonator.wasm"
cp "${target_dir}/antiresonator.wasm" "${dest_dir}/antiresonator.wasm"
cp "${target_dir}/lf_source.wasm" "${dest_dir}/lf-source.wasm"
cp "${target_dir}/signal_switch.wasm" "${dest_dir}/signal-switch.wasm"
cp "${target_dir}/edge_detector.wasm" "${dest_dir}/edge-detector.wasm"
cp "${target_dir}/decay_envelope.wasm" "${dest_dir}/decay-envelope.wasm"
cp "${target_dir}/impulsive_source.wasm" "${dest_dir}/impulsive-source.wasm"
cp "${target_dir}/triangular_source.wasm" "${dest_dir}/triangular-source.wasm"
cp "${target_dir}/square_source.wasm" "${dest_dir}/square-source.wasm"
cp "${target_dir}/tilt_filter.wasm" "${dest_dir}/tilt-filter.wasm"
cp "${target_dir}/pitch_sync_mod.wasm" "${dest_dir}/pitch-sync-mod.wasm"
cp "${target_dir}/oversampled_glottal_source.wasm" "${dest_dir}/oversampled-glottal-source.wasm"
cp "${target_dir}/fujisaki_resonator.wasm" "${dest_dir}/fujisaki-resonator.wasm"

echo "WASM artifacts copied to ${dest_dir}."
