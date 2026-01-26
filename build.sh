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

mkdir -p "${dest_dir}"
cp "${target_dir}/resonator.wasm" "${dest_dir}/resonator.wasm"
cp "${target_dir}/antiresonator.wasm" "${dest_dir}/antiresonator.wasm"
cp "${target_dir}/lf_source.wasm" "${dest_dir}/lf-source.wasm"
cp "${target_dir}/signal_switch.wasm" "${dest_dir}/signal-switch.wasm"
cp "${target_dir}/edge_detector.wasm" "${dest_dir}/edge-detector.wasm"
cp "${target_dir}/decay_envelope.wasm" "${dest_dir}/decay-envelope.wasm"

echo "WASM artifacts copied to ${dest_dir}."
