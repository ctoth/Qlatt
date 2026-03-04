param(
  [string]$SourceRoot = "C:\Users\Q\src\dectalk\463",
  [string]$VsDevCmdPath = "",
  [switch]$Clean
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "[oracle-build] $Message"
}

function Resolve-VsDevCmdPath {
  param([string]$RequestedPath)

  if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
    $resolved = [System.IO.Path]::GetFullPath($RequestedPath)
    if (-not (Test-Path $resolved)) {
      throw "VsDevCmd.bat not found at '$resolved'"
    }
    return $resolved
  }

  $candidates = @(
    "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files (x86)\Microsoft Visual Studio\2019\Enterprise\Common7\Tools\VsDevCmd.bat"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  throw "Unable to locate VsDevCmd.bat. Pass -VsDevCmdPath explicitly."
}

function Invoke-InVsDevShell {
  param(
    [string]$VsDevCmd,
    [string]$WorkingDirectory,
    [string]$Command
  )

  $batCommand = ('call "{0}" -arch=x86 -host_arch=x64 && cd /d "{1}" && {2}' -f $VsDevCmd, $WorkingDirectory, $Command)
  & cmd.exe /c $batCommand
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $Command"
  }
}

$SourceRoot = [System.IO.Path]::GetFullPath($SourceRoot)
$VsDevCmd = Resolve-VsDevCmdPath -RequestedPath $VsDevCmdPath
$dtstaticDir = Join-Path $SourceRoot "dapi\src"
$sayDir = Join-Path $SourceRoot "samples\SAY"
$dtstaticLib = Join-Path $SourceRoot "dapi\build\dtstatic\us\release\dtstatic.lib"
$sayExe = Join-Path $SourceRoot "samples\SAY\build\us\static\say.exe"
$workDir = Join-Path $SourceRoot "dapi\src\dic"

if (-not (Test-Path $dtstaticDir)) {
  throw "DECtalk source tree not found at '$SourceRoot'"
}

Write-Step "Using Visual Studio environment at $VsDevCmd"

if ($Clean) {
  Write-Step "Cleaning dtstatic"
  Invoke-InVsDevShell -VsDevCmd $VsDevCmd -WorkingDirectory $dtstaticDir -Command 'nmake /f dtstatic.mak "CFG=dtstatic - Win32 Release" NO_EXTERNAL_DEPS=1 CLEAN'
  Write-Step "Cleaning SAY"
  Invoke-InVsDevShell -VsDevCmd $VsDevCmd -WorkingDirectory $sayDir -Command 'nmake /f say.mak "CFG=say - Win32 Release Static" NO_EXTERNAL_DEPS=1 CLEAN'
}

Write-Step "Building dtstatic.lib"
Invoke-InVsDevShell -VsDevCmd $VsDevCmd -WorkingDirectory $dtstaticDir -Command 'nmake /f dtstatic.mak "CFG=dtstatic - Win32 Release" NO_EXTERNAL_DEPS=1'

Write-Step "Building say.exe"
Invoke-InVsDevShell -VsDevCmd $VsDevCmd -WorkingDirectory $sayDir -Command 'nmake /f say.mak "CFG=say - Win32 Release Static" NO_EXTERNAL_DEPS=1'

if (-not (Test-Path $dtstaticLib)) {
  throw "Expected dtstatic.lib was not created at '$dtstaticLib'"
}

if (-not (Test-Path $sayExe)) {
  throw "Expected say.exe was not created at '$sayExe'"
}

$result = [ordered]@{
  sayExe = $sayExe
  dtstaticLib = $dtstaticLib
  workDir = $workDir
  recommendedEnv = [ordered]@{
    DECTALK_SAY_EXE = $sayExe
    DECTALK_WORKDIR = $workDir
  }
}

Write-Host ($result | ConvertTo-Json -Depth 4)
