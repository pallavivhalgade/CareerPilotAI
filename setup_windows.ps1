$ErrorActionPreference = "Stop"
$backendPath = Join-Path $PSScriptRoot "backend"
$venvPath = Join-Path $backendPath ".venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"

Write-Host "=== CareerPilot AI setup ==="
if (!(Test-Path -LiteralPath $venvPython)) {
    & py -3.12 -m venv $venvPath
    if ($LASTEXITCODE -ne 0) { throw "Could not create the environment. Install Python 3.12 and try again." }
}

& $venvPython -m ensurepip --upgrade
if ($LASTEXITCODE -ne 0) { throw "Could not initialize pip in the virtual environment." }
& $venvPython -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw "pip upgrade failed." }
& $venvPython -m pip install -r (Join-Path $backendPath "requirements.txt")
if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed." }

if (!(Test-Path -LiteralPath (Join-Path $backendPath ".env"))) {
    Copy-Item -LiteralPath (Join-Path $backendPath ".env.example") -Destination (Join-Path $backendPath ".env")
}

Push-Location (Join-Path $PSScriptRoot "frontend")
try {
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed." }
} finally {
    Pop-Location
}
Write-Host "Setup complete. Ensure Ollama is installed and run: ollama pull llama3.2:3b"
