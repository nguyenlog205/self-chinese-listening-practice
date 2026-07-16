# Creates the backend venv on first run, then launches the API server.
# Prints "READY <port>" to stdout once listening -- Electron's main process
# watches for this line.
#
# When BackendDir is writable (dev, repo checkout), the venv and an editable
# install live alongside the source directly.
#
# When BackendDir is read-only (installed system-wide, e.g. under Program
# Files), pip can never install straight from it: setuptools' egg_info build
# step always writes a `<pkg>.egg-info\` directory INSIDE the source tree
# it's building from -- this happens for a regular (non-editable) install
# too, not just editable ones, so no pip flag avoids it. The only way to
# install from a read-only source is to first copy it into a writable
# location and install from that copy instead -- which is what the else
# branch below does, refreshing the copy on every launch so it stays in
# sync with whatever version is currently installed.
$ErrorActionPreference = "Stop"

$BackendDir = Split-Path -Parent $PSScriptRoot

function Test-DirWritable($path) {
    try {
        $testFile = Join-Path $path ([System.IO.Path]::GetRandomFileName())
        [System.IO.File]::WriteAllText($testFile, "")
        Remove-Item $testFile -Force
        return $true
    } catch {
        return $false
    }
}

if (Test-DirWritable $BackendDir) {
    $VenvDir = Join-Path $BackendDir ".venv"
    $SourceForInstall = $BackendDir
} else {
    $DataDir = Join-Path $env:LOCALAPPDATA "ListeningPractice"
    New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
    $VenvDir = Join-Path $DataDir "venv"
    $SourceForInstall = Join-Path $DataDir "backend-src"
    if (Test-Path $SourceForInstall) {
        Remove-Item -Recurse -Force $SourceForInstall
    }
    Copy-Item -Recurse -Force $BackendDir $SourceForInstall
}

$PythonExe = Join-Path $VenvDir "Scripts\python.exe"

# A marker file (not just VenvDir existing) tracks completion -- the venv
# directory is created up front by `python -m venv`, so if setup gets
# interrupted partway through the much longer `pip install`, a bare
# directory-existence check would wrongly treat that half-installed venv as
# done on the next launch.
$Marker = Join-Path $VenvDir ".install-complete"

if (-not (Test-Path $Marker)) {
    Write-Host "Setting up backend virtual environment (first run only)..."
    if (-not (Test-Path $VenvDir)) {
        python -m venv $VenvDir
    }
    & $PythonExe -m pip install --upgrade pip
    & $PythonExe -m pip install -e $SourceForInstall
    New-Item -ItemType File -Force -Path $Marker | Out-Null
}

& $PythonExe -m listening_backend.main
