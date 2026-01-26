$ErrorActionPreference = "Stop"

cargo build --release --target wasm32-unknown-unknown -p resonator
cargo build --release --target wasm32-unknown-unknown -p antiresonator
cargo build --release --target wasm32-unknown-unknown -p lf-source
cargo build --release --target wasm32-unknown-unknown -p signal-switch
cargo build --release --target wasm32-unknown-unknown -p edge-detector
cargo build --release --target wasm32-unknown-unknown -p decay-envelope

$targetDir = "target/wasm32-unknown-unknown/release"
$destDir = "public/worklets"
New-Item -ItemType Directory -Force $destDir | Out-Null

Copy-Item "$targetDir/resonator.wasm" "$destDir/resonator.wasm" -Force
Copy-Item "$targetDir/antiresonator.wasm" "$destDir/antiresonator.wasm" -Force
Copy-Item "$targetDir/lf_source.wasm" "$destDir/lf-source.wasm" -Force
Copy-Item "$targetDir/signal_switch.wasm" "$destDir/signal-switch.wasm" -Force
Copy-Item "$targetDir/edge_detector.wasm" "$destDir/edge-detector.wasm" -Force
Copy-Item "$targetDir/decay_envelope.wasm" "$destDir/decay-envelope.wasm" -Force

Write-Host "WASM artifacts copied to $destDir."
