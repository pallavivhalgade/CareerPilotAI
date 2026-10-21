$ErrorActionPreference = "Stop"
$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"
$venvPython = Join-Path $backendPath ".venv\Scripts\python.exe"
$logPath = Join-Path $PSScriptRoot "logs"
if (!(Test-Path -LiteralPath $venvPython)) { throw "Run setup_windows.ps1 first." }
New-Item -ItemType Directory -Path $logPath -Force | Out-Null

Push-Location $backendPath
try {
    & $venvPython -m app.seed
    if ($LASTEXITCODE -ne 0) { throw "Knowledge initialization failed. The servers were not started." }
} finally {
    Pop-Location
}

$backend = Start-Process -FilePath $venvPython -ArgumentList "-m", "uvicorn", "app.main:app", "--reload" -WorkingDirectory $backendPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logPath "backend.out.log") -RedirectStandardError (Join-Path $logPath "backend.err.log") -PassThru
$frontend = Start-Process -FilePath powershell.exe -ArgumentList "-NoProfile", "-Command", '"& npm.cmd run dev -- --port 5173 --strictPort"' -WorkingDirectory $frontendPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logPath "frontend.out.log") -RedirectStandardError (Join-Path $logPath "frontend.err.log") -PassThru
Write-Host "Backend PID: $($backend.Id); frontend PID: $($frontend.Id)"
$readinessCheck = @'
import time
import urllib.request

opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
for name, url in [('Backend', 'http://127.0.0.1:8000/health'), ('Frontend', 'http://localhost:5173')]:
    for attempt in range(60):
        try:
            with opener.open(url, timeout=2) as response:
                if response.status == 200:
                    print(name + ' is ready.', flush=True)
                    break
        except OSError:
            pass
        time.sleep(1)
    else:
        raise SystemExit(name + ' did not start. Check the server logs.')
'@
& $venvPython -c $readinessCheck
if ($LASTEXITCODE -ne 0) { throw "Startup checks failed. Check $logPath" }
Write-Host "Frontend: http://localhost:5173 | API docs: http://localhost:8000/docs"
Write-Host "Server output is saved in $logPath"
