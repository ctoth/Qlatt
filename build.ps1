$ErrorActionPreference = "Stop"

Push-Location $PSScriptRoot
try {
    node --experimental-strip-types scripts/build-wasm.ts
    $buildExitCode = $LASTEXITCODE
} finally {
    Pop-Location
}
exit $buildExitCode
