$ErrorActionPreference = "Stop"

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

$targetDir = "target/wasm32-unknown-unknown/release"
$destDir = "public/worklets"
New-Item -ItemType Directory -Force $destDir | Out-Null

Copy-Item "$targetDir/resonator.wasm" "$destDir/resonator.wasm" -Force
Copy-Item "$targetDir/antiresonator.wasm" "$destDir/antiresonator.wasm" -Force
Copy-Item "$targetDir/lf_source.wasm" "$destDir/lf-source.wasm" -Force
Copy-Item "$targetDir/signal_switch.wasm" "$destDir/signal-switch.wasm" -Force
Copy-Item "$targetDir/edge_detector.wasm" "$destDir/edge-detector.wasm" -Force
Copy-Item "$targetDir/decay_envelope.wasm" "$destDir/decay-envelope.wasm" -Force
Copy-Item "$targetDir/impulsive_source.wasm" "$destDir/impulsive-source.wasm" -Force
Copy-Item "$targetDir/triangular_source.wasm" "$destDir/triangular-source.wasm" -Force
Copy-Item "$targetDir/square_source.wasm" "$destDir/square-source.wasm" -Force
Copy-Item "$targetDir/tilt_filter.wasm" "$destDir/tilt-filter.wasm" -Force
Copy-Item "$targetDir/pitch_sync_mod.wasm" "$destDir/pitch-sync-mod.wasm" -Force
Copy-Item "$targetDir/oversampled_glottal_source.wasm" "$destDir/oversampled-glottal-source.wasm" -Force

Write-Host "WASM artifacts copied to $destDir."
