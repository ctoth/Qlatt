$ErrorActionPreference = "Stop"

cargo build --release --target wasm32-unknown-unknown -p resonator
cargo build --release --target wasm32-unknown-unknown -p antiresonator
cargo build --release --target wasm32-unknown-unknown -p lf-source

$targetDir = "target/wasm32-unknown-unknown/release"
New-Item -ItemType Directory -Force worklets | Out-Null

Copy-Item "$targetDir/resonator.wasm" "worklets/resonator.wasm" -Force
Copy-Item "$targetDir/antiresonator.wasm" "worklets/antiresonator.wasm" -Force
Copy-Item "$targetDir/lf_source.wasm" "worklets/lf-source.wasm" -Force

Write-Host "WASM artifacts copied to worklets/."
