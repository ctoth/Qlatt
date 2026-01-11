#!/usr/bin/env bash
set -euo pipefail

target_dir="target/wasm32-unknown-unknown/release"

cargo build --release --target wasm32-unknown-unknown -p resonator
cargo build --release --target wasm32-unknown-unknown -p antiresonator
cargo build --release --target wasm32-unknown-unknown -p lf-source

mkdir -p worklets
cp "${target_dir}/resonator.wasm" worklets/resonator.wasm
cp "${target_dir}/antiresonator.wasm" worklets/antiresonator.wasm
cp "${target_dir}/lf_source.wasm" worklets/lf-source.wasm

echo "WASM artifacts copied to worklets/."
