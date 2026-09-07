# PyroGuard AI - PowerShell Multi-Service Orchestrator
$host.UI.RawUI.WindowTitle = "PyroGuard AI - Multi-Service Orchestrator"

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "            PYROGUARD AI - STARTING PLATFORM SERVICES          " -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = Resolve-Path "$PSScriptRoot\.."
$nodeDir = "$env:LOCALAPPDATA\Programs\node"
if (Test-Path "$nodeDir\node.exe") {
    $env:Path = "$nodeDir;$env:Path"
}

Write-Host "[1/3] Launching Python FastAPI ML Microservice on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootPath'; python -m uvicorn ml.main:app --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

Write-Host "[2/3] Launching Node.js Backend REST API Gateway on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootPath\backend'; `$env:Path = '$nodeDir;' + `$env:Path; node dist/server.js"

Start-Sleep -Seconds 2

Write-Host "[3/3] Launching Frontend React GIS Console on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootPath\frontend'; `$env:Path = '$nodeDir;' + `$env:Path; npm run dev -- --port 3000 --host"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Green
Write-Host "      ALL SERVICES LAUNCHED SUCCESSFULLY!                      " -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Green
Write-Host "  - Frontend GIS Console : http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend REST API     : http://localhost:5000" -ForegroundColor White
Write-Host "  - Swagger OpenAPI Docs : http://localhost:5000/api/docs" -ForegroundColor White
Write-Host "  - ML Inference Service : http://localhost:8000" -ForegroundColor White
Write-Host "===============================================================" -ForegroundColor Green

